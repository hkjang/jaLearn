import { prisma } from "@/lib/prisma";

// AI 사용량 관련 유틸리티 함수들

export interface AIUsageStatus {
  usedToday: number;
  limit: number;
  remaining: number;
  isUnlimited: boolean;
  canUse: boolean;
  planName: string;
}

// 오늘 시작 시간 가져오기
export function getTodayStart(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

// 사용자의 AI 사용량 상태 확인
export async function checkAIUsageStatus(userId: string): Promise<AIUsageStatus> {
  const todayStart = getTodayStart();

  // 오늘 사용량 조회
  const usageToday = await prisma.aIUsage.aggregate({
    where: {
      userId,
      date: { gte: todayStart },
    },
    _sum: { creditsUsed: true },
  });

  // 구독 정보 조회
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
    },
    include: { plan: true },
  });

  const aiLimit = subscription?.plan?.aiQuestionsPerDay || 10;
  const usedToday = usageToday._sum.creditsUsed || 0;
  const isUnlimited = aiLimit >= 999999;
  const remaining = isUnlimited ? 999999 : Math.max(0, aiLimit - usedToday);

  return {
    usedToday,
    limit: aiLimit,
    remaining,
    isUnlimited,
    canUse: isUnlimited || usedToday < aiLimit,
    planName: subscription?.plan?.displayName || "Free",
  };
}

// AI 사용량 기록
export async function recordAIUsage(
  userId: string,
  type: "QUESTION" | "PROBLEM_GEN" | "ANALYSIS" | "TUTOR",
  tokensUsed = 0,
  creditsUsed = 1
) {
  return prisma.aIUsage.create({
    data: {
      userId,
      type,
      tokensUsed,
      creditsUsed,
    },
  });
}

// 프리미엄 기능 접근 권한 확인
export async function checkPremiumAccess(userId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
    },
    include: { plan: true },
  });

  if (!subscription?.plan) {
    return {
      hasAnalytics: false,
      hasAITutor: false,
      isFreePlan: true,
      planName: "Free",
    };
  }

  return {
    hasAnalytics: subscription.plan.hasAnalytics,
    hasAITutor: subscription.plan.hasAITutor,
    isFreePlan: subscription.plan.name === "FREE",
    planName: subscription.plan.displayName,
  };
}
