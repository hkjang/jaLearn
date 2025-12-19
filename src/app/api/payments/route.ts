import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Generate unique order ID
function generateOrderId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `ORD-${timestamp}-${random}`.toUpperCase();
}

// POST - Create payment
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
    const { planId, billingCycle, paymentMethod, couponCode, amount } = body;

    // Validate plan
    const validPlans = ["FREE", "PREMIUM_BASIC", "PREMIUM_PLUS"];
    if (!validPlans.includes(planId)) {
      return NextResponse.json(
        { error: "유효하지 않은 요금제입니다." },
        { status: 400 }
      );
    }

    // Free plan - just create subscription
    if (planId === "FREE") {
      // Check if plan exists, if not create it
      let plan = await prisma.plan.findUnique({ where: { name: "FREE" } });
      if (!plan) {
        plan = await prisma.plan.create({
          data: {
            name: "FREE",
            displayName: "Free",
            price: 0,
            yearlyPrice: 0,
            features: JSON.stringify(["기본 강의", "문제 10개/일", "AI 10회/일"]),
            aiQuestionsPerDay: 10,
            problemsPerDay: 10,
          },
        });
      }

      // Create or update subscription
      const existingSub = await prisma.subscription.findFirst({
        where: { userId: session.user.id, status: "ACTIVE" },
      });

      if (existingSub) {
        await prisma.subscription.update({
          where: { id: existingSub.id },
          data: { status: "CANCELLED", cancelledAt: new Date() },
        });
      }

      const subscription = await prisma.subscription.create({
        data: {
          userId: session.user.id,
          planId: plan.id,
          status: "ACTIVE",
          billingCycle: "MONTHLY",
          autoRenew: false,
        },
      });

      return NextResponse.json({
        success: true,
        orderId: "FREE-" + subscription.id,
        subscription,
      });
    }

    // Paid plans - process payment
    const orderId = generateOrderId();
    
    // Validate coupon if provided
    let discount = 0;
    let coupon = null;
    if (couponCode) {
      coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase() },
      });
      
      if (coupon && coupon.isActive && new Date() <= coupon.validUntil) {
        if (coupon.discountType === "PERCENT") {
          discount = Math.round(amount * (coupon.discountValue / 100));
          if (coupon.maxDiscountAmount) {
            discount = Math.min(discount, coupon.maxDiscountAmount);
          }
        } else {
          discount = coupon.discountValue;
        }
      }
    }

    const finalAmount = Math.max(0, amount - discount);

    // Ensure plan exists
    let plan = await prisma.plan.findUnique({ where: { name: planId } });
    if (!plan) {
      const planData: Record<string, { displayName: string; price: number; yearlyPrice: number; features: string[]; aiQuestionsPerDay: number; problemsPerDay: number; hasAnalytics: boolean; hasAITutor: boolean }> = {
        PREMIUM_BASIC: {
          displayName: "Premium Basic",
          price: 9900,
          yearlyPrice: 99000,
          features: ["모든 강의", "문제 무제한", "AI 50회/일", "오답 노트"],
          aiQuestionsPerDay: 50,
          problemsPerDay: 999999,
          hasAnalytics: false,
          hasAITutor: true,
        },
        PREMIUM_PLUS: {
          displayName: "Premium Plus",
          price: 19900,
          yearlyPrice: 199000,
          features: ["모든 기능", "AI 무제한", "분석 리포트", "1:1 코칭"],
          aiQuestionsPerDay: 999999,
          problemsPerDay: 999999,
          hasAnalytics: true,
          hasAITutor: true,
        },
      };
      
      const data = planData[planId];
      plan = await prisma.plan.create({
        data: {
          name: planId,
          displayName: data.displayName,
          price: data.price,
          yearlyPrice: data.yearlyPrice,
          features: JSON.stringify(data.features),
          aiQuestionsPerDay: data.aiQuestionsPerDay,
          problemsPerDay: data.problemsPerDay,
          hasAnalytics: data.hasAnalytics,
          hasAITutor: data.hasAITutor,
        },
      });
    }

    // Cancel existing active subscription
    await prisma.subscription.updateMany({
      where: { userId: session.user.id, status: "ACTIVE" },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    if (billingCycle === "yearly") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId: session.user.id,
        planId: plan.id,
        status: "ACTIVE",
        billingCycle: billingCycle === "yearly" ? "YEARLY" : "MONTHLY",
        startDate,
        endDate,
        nextBillingDate: endDate,
        autoRenew: true,
      },
    });

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        subscriptionId: subscription.id,
        orderId,
        amount: finalAmount,
        originalAmount: amount,
        discountAmount: discount > 0 ? discount : null,
        couponId: coupon?.id,
        method: paymentMethod,
        status: "COMPLETED", // Demo: auto-complete
        paidAt: new Date(),
      },
    });

    // Update coupon usage
    if (coupon) {
      await prisma.coupon.update({
        where: { id: coupon.id },
        data: { usedCount: { increment: 1 } },
      });
      
      await prisma.userCoupon.upsert({
        where: {
          userId_couponId: {
            userId: session.user.id,
            couponId: coupon.id,
          },
        },
        update: { usedAt: new Date() },
        create: {
          userId: session.user.id,
          couponId: coupon.id,
          usedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      orderId,
      payment,
      subscription,
    });
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json(
      { error: "결제 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// GET - Get user's payment history
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const payments = await prisma.payment.findMany({
      where: { userId: session.user.id },
      include: {
        subscription: { include: { plan: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Get payments error:", error);
    return NextResponse.json(
      { error: "결제 내역 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
