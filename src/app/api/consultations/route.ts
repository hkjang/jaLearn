import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET - Get user's consultations
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
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
      { error: "조회 중 오류가 발생했습니다." },
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
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { expertId, type, scheduledAt, topic } = body;

    // Validate type
    const validTypes = ["MONTHLY", "EMERGENCY", "AI_REVIEW"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "유효하지 않은 상담 유형입니다." },
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
          { error: "월간 상담은 Elite 플랜에서만 이용 가능합니다." },
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
          { error: "이번 달 월간 상담을 이미 사용하셨습니다." },
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
      { error: "예약 중 오류가 발생했습니다." },
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
        { error: "로그인이 필요합니다." },
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
        { error: "상담을 찾을 수 없습니다." },
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
      { error: "업데이트 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
