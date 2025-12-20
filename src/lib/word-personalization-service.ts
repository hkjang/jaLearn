/**
 * Word Personalization Service - 개인화 단어 학습 서비스
 * 
 * SM-2 알고리즘 기반 망각 곡선 적용 및 개인화 추천
 */

import { prisma } from './prisma';
import { addDays } from 'date-fns';

// ========================================
// Types
// ========================================

export interface QuizResult {
  wordId: string;
  isCorrect: boolean;
  timeSpent?: number; // 초
  userAnswer?: string;
  quizType: 'DEFINITION' | 'EXAMPLE' | 'RELATION' | 'LISTENING';
}

export interface SM2Result {
  easeFactor: number;
  interval: number;
  repetitionCount: number;
  masteryLevel: number;
  nextReviewDate: Date;
  isWeak: boolean;
}

// ========================================
// SM-2 Algorithm Implementation
// ========================================

/**
 * SM-2 알고리즘으로 다음 복습 시점 계산
 * 
 * @param quality 응답 품질 (0-5)
 *   0: 전혀 기억 못함
 *   1: 틀렸지만 힌트로 기억
 *   2: 틀렸지만 정답 보고 기억
 *   3: 맞췄지만 어려움
 *   4: 약간의 망설임
 *   5: 완벽하게 기억
 * @param prevEaseFactor 이전 이즈 팩터 (기본 2.5)
 * @param prevInterval 이전 간격 (일)
 * @param repetitionCount 반복 횟수
 */
export function calculateSM2(
  quality: number,
  prevEaseFactor: number = 2.5,
  prevInterval: number = 1,
  repetitionCount: number = 0
): SM2Result {
  // 품질이 3 미만이면 실패로 간주하고 리셋
  if (quality < 3) {
    return {
      easeFactor: Math.max(1.3, prevEaseFactor - 0.2),
      interval: 1,
      repetitionCount: 0,
      masteryLevel: Math.max(0, Math.floor(repetitionCount / 2) - 1),
      nextReviewDate: addDays(new Date(), 1),
      isWeak: true,
    };
  }

  // 새로운 이즈 팩터 계산
  const newEaseFactor = Math.max(
    1.3,
    prevEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  // 새로운 간격 계산
  let newInterval: number;
  if (repetitionCount === 0) {
    newInterval = 1;
  } else if (repetitionCount === 1) {
    newInterval = 6;
  } else {
    newInterval = Math.round(prevInterval * newEaseFactor);
  }

  // 숙달도 계산 (0-5)
  const masteryLevel = Math.min(5, Math.floor((repetitionCount + 1) / 2));

  return {
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitionCount: repetitionCount + 1,
    masteryLevel,
    nextReviewDate: addDays(new Date(), newInterval),
    isWeak: quality < 4,
  };
}

/**
 * 퀴즈 결과를 SM-2 품질 점수로 변환
 */
export function quizResultToQuality(
  isCorrect: boolean,
  timeSpent?: number,
  avgTimeSpent?: number
): number {
  if (!isCorrect) {
    return 1; // 틀림
  }

  // 시간 기반 품질 조정
  if (timeSpent && avgTimeSpent) {
    if (timeSpent < avgTimeSpent * 0.5) {
      return 5; // 매우 빠름 - 완벽
    } else if (timeSpent < avgTimeSpent) {
      return 4; // 빠름 - 약간 망설임
    } else if (timeSpent < avgTimeSpent * 1.5) {
      return 3; // 보통 - 어려움
    } else {
      return 3; // 느림 - 어려움
    }
  }

  return 4; // 기본값
}

// ========================================
// Progress Update Functions
// ========================================

/**
 * 학습 결과 반영 (SM-2 알고리즘 적용)
 */
export async function updateProgress(
  userId: string,
  result: QuizResult
) {
  const { wordId, isCorrect, timeSpent, userAnswer, quizType } = result;

  // 현재 진행도 조회
  const progress = await prisma.userWordProgress.findUnique({
    where: {
      userId_wordId: { userId, wordId },
    },
  });

  // 평균 풀이 시간 조회
  const avgTimeResult = await prisma.wordQuizResult.aggregate({
    where: { wordId },
    _avg: { timeSpent: true },
  });
  const avgTimeSpent = avgTimeResult._avg.timeSpent ?? undefined;

  // SM-2 품질 계산
  const quality = quizResultToQuality(isCorrect, timeSpent, avgTimeSpent);

  // SM-2 알고리즘 적용
  const sm2Result = calculateSM2(
    quality,
    progress?.easeFactor ?? 2.5,
    progress?.interval ?? 1,
    progress?.repetitionCount ?? 0
  );

  // 진행도 업데이트
  await prisma.userWordProgress.upsert({
    where: {
      userId_wordId: { userId, wordId },
    },
    create: {
      userId,
      wordId,
      masteryLevel: sm2Result.masteryLevel,
      repetitionCount: sm2Result.repetitionCount,
      correctCount: isCorrect ? 1 : 0,
      incorrectCount: isCorrect ? 0 : 1,
      easeFactor: sm2Result.easeFactor,
      interval: sm2Result.interval,
      nextReviewDate: sm2Result.nextReviewDate,
      isWeak: sm2Result.isWeak,
      lastStudiedAt: new Date(),
    },
    update: {
      masteryLevel: sm2Result.masteryLevel,
      repetitionCount: sm2Result.repetitionCount,
      correctCount: { increment: isCorrect ? 1 : 0 },
      incorrectCount: { increment: isCorrect ? 0 : 1 },
      easeFactor: sm2Result.easeFactor,
      interval: sm2Result.interval,
      nextReviewDate: sm2Result.nextReviewDate,
      isWeak: sm2Result.isWeak,
      lastStudiedAt: new Date(),
    },
  });

  // 퀴즈 결과 기록
  await prisma.wordQuizResult.create({
    data: {
      userId,
      wordId,
      quizType,
      isCorrect,
      timeSpent,
      userAnswer,
    },
  });

  return sm2Result;
}

// ========================================
// Word Retrieval Functions
// ========================================

/**
 * 취약 단어 조회
 */
export async function getWeakWords(
  userId: string,
  options: {
    subjectId?: string;
    limit?: number;
  } = {}
) {
  const { subjectId, limit = 20 } = options;

  return prisma.userWordProgress.findMany({
    where: {
      userId,
      isWeak: true,
      word: {
        isActive: true,
        ...(subjectId && {
          subjects: { some: { subjectId } },
        }),
      },
    },
    include: {
      word: {
        include: {
          subjects: { include: { subject: true } },
        },
      },
    },
    orderBy: [
      { incorrectCount: 'desc' },
      { masteryLevel: 'asc' },
    ],
    take: limit,
  });
}

/**
 * 복습 필요 단어 조회 (오늘 기준)
 */
export async function getReviewDueWords(
  userId: string,
  options: {
    subjectId?: string;
    limit?: number;
  } = {}
) {
  const { subjectId, limit = 20 } = options;
  const today = new Date();

  return prisma.userWordProgress.findMany({
    where: {
      userId,
      nextReviewDate: { lte: today },
      word: {
        isActive: true,
        ...(subjectId && {
          subjects: { some: { subjectId } },
        }),
      },
    },
    include: {
      word: {
        include: {
          subjects: { include: { subject: true } },
        },
      },
    },
    orderBy: { nextReviewDate: 'asc' },
    take: limit,
  });
}

/**
 * 다음 학습 단어 추천
 */
export async function recommendWords(
  userId: string,
  options: {
    subjectId?: string;
    gradeLevel?: string;
    limit?: number;
  } = {}
) {
  const { subjectId, gradeLevel, limit = 10 } = options;

  // 1. 복습 필요 단어 (우선순위 1)
  const reviewDue = await getReviewDueWords(userId, { subjectId, limit: Math.floor(limit / 2) });

  // 2. 취약 단어 (우선순위 2)
  const weak = await getWeakWords(userId, { subjectId, limit: Math.floor(limit / 4) });

  // 3. 새로운 단어 (아직 학습하지 않은 단어)
  const learned = await prisma.userWordProgress.findMany({
    where: { userId },
    select: { wordId: true },
  });
  const learnedIds = learned.map(p => p.wordId);

  const newWords = await prisma.word.findMany({
    where: {
      isActive: true,
      id: { notIn: learnedIds },
      ...(gradeLevel && { gradeLevel }),
      ...(subjectId && {
        subjects: { some: { subjectId } },
      }),
    },
    include: {
      subjects: { include: { subject: true } },
    },
    orderBy: { usageCount: 'desc' },
    take: limit - reviewDue.length - weak.length,
  });

  // 결과 병합 (중복 제거)
  const seenIds = new Set<string>();
  const result: Array<{
    word: Awaited<ReturnType<typeof prisma.word.findFirst>>;
    reason: 'REVIEW_DUE' | 'WEAK' | 'NEW';
    progress?: Awaited<ReturnType<typeof prisma.userWordProgress.findFirst>>;
  }> = [];

  for (const item of reviewDue) {
    if (!seenIds.has(item.wordId)) {
      seenIds.add(item.wordId);
      result.push({ word: item.word, reason: 'REVIEW_DUE', progress: item });
    }
  }

  for (const item of weak) {
    if (!seenIds.has(item.wordId)) {
      seenIds.add(item.wordId);
      result.push({ word: item.word, reason: 'WEAK', progress: item });
    }
  }

  for (const word of newWords) {
    if (!seenIds.has(word.id)) {
      seenIds.add(word.id);
      result.push({ word, reason: 'NEW' });
    }
  }

  return result.slice(0, limit);
}

// ========================================
// Mastery & Analytics Functions
// ========================================

/**
 * 숙달도 계산
 */
export async function calculateMastery(userId: string, subjectId?: string) {
  const progress = await prisma.userWordProgress.findMany({
    where: {
      userId,
      ...(subjectId && {
        word: { subjects: { some: { subjectId } } },
      }),
    },
    select: {
      masteryLevel: true,
      isWeak: true,
    },
  });

  if (progress.length === 0) {
    return {
      totalWords: 0,
      avgMastery: 0,
      masteredCount: 0,
      weakCount: 0,
      masteryPercentage: 0,
    };
  }

  const totalMastery = progress.reduce((sum, p) => sum + p.masteryLevel, 0);
  const masteredCount = progress.filter(p => p.masteryLevel >= 4).length;
  const weakCount = progress.filter(p => p.isWeak).length;

  return {
    totalWords: progress.length,
    avgMastery: totalMastery / progress.length,
    masteredCount,
    weakCount,
    masteryPercentage: (masteredCount / progress.length) * 100,
  };
}

/**
 * 과목 편중 분석 및 균형 추천
 */
export async function balanceSubjects(userId: string) {
  // 과목별 학습 현황
  const subjectProgress = await prisma.userWordProgress.groupBy({
    by: ['wordId'],
    where: { userId },
    _count: true,
  });

  // 각 단어의 과목 정보 조회
  const wordSubjects = await prisma.wordSubject.findMany({
    where: {
      wordId: { in: subjectProgress.map(p => p.wordId) },
    },
    include: { subject: true },
  });

  // 과목별 집계
  const subjectCounts: Record<string, { count: number; name: string }> = {};
  for (const ws of wordSubjects) {
    const sid = ws.subjectId;
    if (!subjectCounts[sid]) {
      subjectCounts[sid] = { count: 0, name: ws.subject.displayName };
    }
    subjectCounts[sid].count++;
  }

  // 전체 과목 목록
  const allSubjects = await prisma.subject.findMany({
    select: { id: true, displayName: true },
  });

  // 편중 분석
  const total = Object.values(subjectCounts).reduce((sum, s) => sum + s.count, 0);
  const expectedPerSubject = total / allSubjects.length;

  const recommendations: Array<{
    subjectId: string;
    subjectName: string;
    currentCount: number;
    expectedCount: number;
    needsMore: boolean;
  }> = [];

  for (const subject of allSubjects) {
    const current = subjectCounts[subject.id]?.count ?? 0;
    recommendations.push({
      subjectId: subject.id,
      subjectName: subject.displayName,
      currentCount: current,
      expectedCount: Math.round(expectedPerSubject),
      needsMore: current < expectedPerSubject * 0.7,
    });
  }

  return recommendations.sort((a, b) => {
    // 부족한 과목 우선
    if (a.needsMore && !b.needsMore) return -1;
    if (!a.needsMore && b.needsMore) return 1;
    return a.currentCount - b.currentCount;
  });
}

// ========================================
// Favorites Functions
// ========================================

/**
 * 즐겨찾기 추가/제거 토글
 */
export async function toggleFavorite(userId: string, wordId: string) {
  const progress = await prisma.userWordProgress.findUnique({
    where: {
      userId_wordId: { userId, wordId },
    },
  });

  if (progress) {
    return prisma.userWordProgress.update({
      where: { id: progress.id },
      data: { isFavorite: !progress.isFavorite },
    });
  }

  // 진행도가 없으면 생성하면서 즐겨찾기 추가
  return prisma.userWordProgress.create({
    data: {
      userId,
      wordId,
      isFavorite: true,
    },
  });
}

/**
 * 즐겨찾기 목록 조회
 */
export async function getFavorites(userId: string, limit = 50) {
  return prisma.userWordProgress.findMany({
    where: {
      userId,
      isFavorite: true,
    },
    include: {
      word: {
        include: {
          subjects: { include: { subject: true } },
        },
      },
    },
    orderBy: { lastStudiedAt: 'desc' },
    take: limit,
  });
}
