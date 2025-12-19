import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// Get today's start date
function getTodayStart(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

// GET - Get user's AI usage for today
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "濡쒓렇?몄씠 ?꾩슂?⑸땲??" },
        { status: 401 }
      );
    }

    const todayStart = getTodayStart();

    // Get today's usage
    const usageToday = await prisma.aIUsage.aggregate({
      where: {
        userId: session.user.id,
        date: { gte: todayStart },
      },
      _sum: { creditsUsed: true },
      _count: true,
    });

    // Get user's subscription to determine limits
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: "ACTIVE",
      },
      include: { plan: true },
    });

    // Default free tier limits
    let aiLimit = 10;
    let problemLimit = 10;
    let hasAnalytics = false;
    let hasAITutor = false;

    if (subscription?.plan) {
      aiLimit = subscription.plan.aiQuestionsPerDay;
      problemLimit = subscription.plan.problemsPerDay;
      hasAnalytics = subscription.plan.hasAnalytics;
      hasAITutor = subscription.plan.hasAITutor;
    }

    const usedToday = usageToday._sum.creditsUsed || 0;
    const remaining = Math.max(0, aiLimit - usedToday);

    return NextResponse.json({
      usedToday,
      limit: aiLimit,
      remaining,
      isUnlimited: aiLimit >= 999999,
      problemLimit,
      hasAnalytics,
      hasAITutor,
      planName: subscription?.plan?.displayName || "Free",
    });
  } catch (error) {
    console.error("Get AI usage error:", error);
    return NextResponse.json(
      { error: "?ъ슜??議고쉶 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." },
      { status: 500 }
    );
  }
}

// POST - Record AI usage
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
    const { type, tokensUsed = 0, creditsUsed = 1 } = body;

    // Validate type
    const validTypes = ["QUESTION", "PROBLEM_GEN", "ANALYSIS", "TUTOR"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "?좏슚?섏? ?딆? ?ъ슜 ?좏삎?낅땲??" },
        { status: 400 }
      );
    }

    const todayStart = getTodayStart();

    // Get today's usage
    const usageToday = await prisma.aIUsage.aggregate({
      where: {
        userId: session.user.id,
        date: { gte: todayStart },
      },
      _sum: { creditsUsed: true },
    });

    // Get user's subscription limits
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: "ACTIVE",
      },
      include: { plan: true },
    });

    const aiLimit = subscription?.plan?.aiQuestionsPerDay || 10;
    const usedToday = usageToday._sum.creditsUsed || 0;

    // Check if over limit (unless unlimited)
    if (aiLimit < 999999 && usedToday >= aiLimit) {
      return NextResponse.json({
        success: false,
        error: "?ㅻ뒛??AI ?ъ슜?됱쓣 珥덇낵?덉뒿?덈떎.",
        limitReached: true,
        usedToday,
        limit: aiLimit,
      }, { status: 429 });
    }

    // Record usage
    const usage = await prisma.aIUsage.create({
      data: {
        userId: session.user.id,
        type,
        tokensUsed,
        creditsUsed,
      },
    });

    return NextResponse.json({
      success: true,
      usage,
      usedToday: usedToday + creditsUsed,
      limit: aiLimit,
      remaining: Math.max(0, aiLimit - usedToday - creditsUsed),
    });
  } catch (error) {
    console.error("Record AI usage error:", error);
    return NextResponse.json(
      { error: "?ъ슜??湲곕줉 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." },
      { status: 500 }
    );
  }
}

