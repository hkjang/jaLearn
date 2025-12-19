import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET - Get current subscription
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
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
          features: ["기본 강의", "문제 10개/일", "AI 10회/일"],
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
      { error: "구독 정보 조회 중 오류가 발생했습니다." },
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
        { error: "로그인이 필요합니다." },
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
        { error: "활성 구독이 없습니다." },
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
      { error: "구독 업데이트 중 오류가 발생했습니다." },
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
        { error: "로그인이 필요합니다." },
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
        { error: "활성 구독이 없습니다." },
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
      message: "구독이 해지 예정으로 설정되었습니다. 현재 기간 종료 시 자동 해지됩니다.",
      subscription: updated,
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json(
      { error: "구독 해지 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
