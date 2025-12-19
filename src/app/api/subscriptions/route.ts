import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET - Get current subscription
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "濡쒓렇?몄씠 ?꾩슂?⑸땲??" },
        { status: 401 }
      );
    }

    const subscription = await prisma.subscription.findFirst({
      where: { 
        userId: session.user.id,
        status: { in: ["ACTIVE", "PAUSED"] },
      },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });

    if (!subscription) {
      // Return free plan info
      return NextResponse.json({
        plan: {
          name: "FREE",
          displayName: "Free",
          price: 0,
          features: ["湲곕낯 媛뺤쓽", "臾몄젣 10媛???, "AI 10????],
        },
        status: "ACTIVE",
        isFreePlan: true,
      });
    }

    return NextResponse.json({
      ...subscription,
      plan: {
        ...subscription.plan,
        features: JSON.parse(subscription.plan.features),
      },
      isFreePlan: subscription.plan.name === "FREE",
    });
  } catch (error) {
    console.error("Get subscription error:", error);
    return NextResponse.json(
      { error: "援щ룆 ?뺣낫 議고쉶 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." },
      { status: 500 }
    );
  }
}

// PUT - Update subscription (pause, resume, change plan)
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
    const { action, autoRenew } = body;

    const subscription = await prisma.subscription.findFirst({
      where: { 
        userId: session.user.id,
        status: { in: ["ACTIVE", "PAUSED"] },
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "?쒖꽦 援щ룆???놁뒿?덈떎." },
        { status: 404 }
      );
    }

    let updateData: Record<string, unknown> = {};

    switch (action) {
      case "pause":
        updateData = { status: "PAUSED", pausedAt: new Date() };
        break;
      case "resume":
        updateData = { status: "ACTIVE", pausedAt: null };
        break;
      case "toggle_autorenew":
        updateData = { autoRenew: !subscription.autoRenew };
        break;
      case "set_autorenew":
        updateData = { autoRenew };
        break;
    }

    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: updateData,
      include: { plan: true },
    });

    return NextResponse.json({
      success: true,
      subscription: updated,
    });
  } catch (error) {
    console.error("Update subscription error:", error);
    return NextResponse.json(
      { error: "援щ룆 ?낅뜲?댄듃 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." },
      { status: 500 }
    );
  }
}

// DELETE - Cancel subscription
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "濡쒓렇?몄씠 ?꾩슂?⑸땲??" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { reason } = body;

    const subscription = await prisma.subscription.findFirst({
      where: { 
        userId: session.user.id,
        status: { in: ["ACTIVE", "PAUSED"] },
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "?쒖꽦 援щ룆???놁뒿?덈떎." },
        { status: 404 }
      );
    }

    // Don't immediately cancel - let them use until end date
    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        autoRenew: false,
        cancelledAt: new Date(),
        cancelReason: reason,
      },
    });

    return NextResponse.json({
      success: true,
      message: "援щ룆???댁? ?덉젙?쇰줈 ?ㅼ젙?섏뿀?듬땲?? ?꾩옱 湲곌컙 醫낅즺 ???먮룞 ?댁??⑸땲??",
      subscription: updated,
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json(
      { error: "援щ룆 ?댁? 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." },
      { status: 500 }
    );
  }
}

