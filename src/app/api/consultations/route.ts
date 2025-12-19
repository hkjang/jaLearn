import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET - Get user's consultations
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "濡쒓렇?몄씠 ?꾩슂?⑸땲??" },
        { status: 401 }
      );
    }

    const consultations = await prisma.expertConsultation.findMany({
      where: { userId: session.user.id },
      include: {
        expert: { select: { name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const upcoming = consultations.filter((c) => c.status === "SCHEDULED");
    const past = consultations.filter((c) => c.status === "COMPLETED");

    return NextResponse.json({ upcoming, past });
  } catch (error) {
    console.error("Get consultations error:", error);
    return NextResponse.json(
      { error: "議고쉶 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." },
      { status: 500 }
    );
  }
}

// POST - Book a consultation
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "濡쒓렇?몄씠 ?꾩슂?⑸땲??" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { expertId, type, scheduledAt, topic } = body;

    // Validate type
    const validTypes = ["MONTHLY", "EMERGENCY", "AI_REVIEW"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "?좏슚?섏? ?딆? ?곷떞 ?좏삎?낅땲??" },
        { status: 400 }
      );
    }

    // For MONTHLY, check if user has Elite subscription
    if (type === "MONTHLY") {
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId: session.user.id,
          status: "ACTIVE",
        },
        include: { plan: true },
      });

      // Check for Elite plan or AI Tutor Elite
      const hasElite = subscription?.plan?.name?.includes("ELITE");
      if (!hasElite) {
        return NextResponse.json(
          { error: "?붽컙 ?곷떞? Elite ?뚮옖?먯꽌留??댁슜 媛?ν빀?덈떎." },
          { status: 403 }
        );
      }

      // Check if already used monthly consultation
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const monthlyCount = await prisma.expertConsultation.count({
        where: {
          userId: session.user.id,
          type: "MONTHLY",
          createdAt: { gte: thisMonth },
        },
      });

      if (monthlyCount >= 1) {
        return NextResponse.json(
          { error: "?대쾲 ???붽컙 ?곷떞???대? ?ъ슜?섏뀲?듬땲??" },
          { status: 400 }
        );
      }
    }

    // Create consultation
    const consultation = await prisma.expertConsultation.create({
      data: {
        userId: session.user.id,
        expertId,
        type,
        scheduledAt: new Date(scheduledAt),
        notes: topic,
        status: "SCHEDULED",
      },
    });

    return NextResponse.json({
      success: true,
      consultation,
    });
  } catch (error) {
    console.error("Book consultation error:", error);
    return NextResponse.json(
      { error: "?덉빟 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." },
      { status: 500 }
    );
  }
}

// PUT - Update consultation (complete, cancel, rate)
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "濡쒓렇?몄씠 ?꾩슂?⑸땲??" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { consultationId, action, rating, notes, aiSummary, duration } = body;

    const consultation = await prisma.expertConsultation.findUnique({
      where: { id: consultationId },
    });

    if (!consultation || consultation.userId !== session.user.id) {
      return NextResponse.json(
        { error: "?곷떞??李얠쓣 ???놁뒿?덈떎." },
        { status: 404 }
      );
    }

    let updateData: Record<string, unknown> = {};

    switch (action) {
      case "cancel":
        updateData = { status: "CANCELLED" };
        break;
      case "complete":
        updateData = {
          status: "COMPLETED",
          completedAt: new Date(),
          duration,
          notes,
          aiSummary,
        };
        break;
      case "rate":
        updateData = { rating };
        break;
    }

    const updated = await prisma.expertConsultation.update({
      where: { id: consultationId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      consultation: updated,
    });
  } catch (error) {
    console.error("Update consultation error:", error);
    return NextResponse.json(
      { error: "?낅뜲?댄듃 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." },
      { status: 500 }
    );
  }
}

