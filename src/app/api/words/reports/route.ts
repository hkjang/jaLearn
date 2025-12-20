/**
 * Word Reports API - 단어 학습 리포트
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';

// ========================================
// GET /api/words/reports - 단어 학습 리포트 조회
// ========================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'WEEKLY'; // DAILY, WEEKLY, MONTHLY
    const targetUserId = searchParams.get('userId') || userId; // 학부모가 자녀 조회 시

    // 기간 계산
    const now = new Date();
    let startDate: Date;
    let endDate = endOfDay(now);

    switch (period) {
      case 'DAILY':
        startDate = startOfDay(now);
        break;
      case 'MONTHLY':
        startDate = subDays(now, 30);
        break;
      case 'WEEKLY':
      default:
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
    }

    // 전체 학습 통계
    const totalProgress = await prisma.userWordProgress.aggregate({
      where: { userId: targetUserId },
      _count: true,
      _avg: { masteryLevel: true },
    });

    // 기간 내 학습 통계
    const periodProgress = await prisma.userWordProgress.findMany({
      where: {
        userId: targetUserId,
        lastStudiedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        word: {
          include: {
            subjects: { include: { subject: true } },
          },
        },
      },
    });

    // 숙달 단어 수
    const masteredCount = await prisma.userWordProgress.count({
      where: {
        userId: targetUserId,
        masteryLevel: { gte: 4 },
      },
    });

    // 취약 단어 수
    const weakCount = await prisma.userWordProgress.count({
      where: {
        userId: targetUserId,
        isWeak: true,
      },
    });

    // 기간 내 퀴즈 결과
    const quizResults = await prisma.wordQuizResult.findMany({
      where: {
        userId: targetUserId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const correctQuizzes = quizResults.filter(q => q.isCorrect).length;
    const accuracy = quizResults.length > 0 
      ? Math.round((correctQuizzes / quizResults.length) * 100) 
      : 0;

    // 과목별 통계
    const subjectStats: Record<string, { count: number; mastered: number; weak: number }> = {};
    for (const progress of periodProgress) {
      for (const ws of progress.word.subjects) {
        const sid = ws.subject.id;
        if (!subjectStats[sid]) {
          subjectStats[sid] = { count: 0, mastered: 0, weak: 0 };
        }
        subjectStats[sid].count++;
        if (progress.masteryLevel >= 4) subjectStats[sid].mastered++;
        if (progress.isWeak) subjectStats[sid].weak++;
      }
    }

    // 일별 학습량 (최근 7일)
    const dailyStats: Array<{ date: string; count: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(now, i);
      const count = await prisma.userWordProgress.count({
        where: {
          userId: targetUserId,
          lastStudiedAt: {
            gte: startOfDay(date),
            lte: endOfDay(date),
          },
        },
      });
      dailyStats.push({
        date: format(date, 'MM/dd'),
        count,
      });
    }

    // 취약 단어 목록
    const weakWords = await prisma.userWordProgress.findMany({
      where: {
        userId: targetUserId,
        isWeak: true,
      },
      include: {
        word: true,
      },
      orderBy: { incorrectCount: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      period,
      periodRange: {
        start: format(startDate, 'yyyy-MM-dd'),
        end: format(endDate, 'yyyy-MM-dd'),
      },
      summary: {
        totalWords: totalProgress._count,
        avgMastery: totalProgress._avg.masteryLevel || 0,
        masteredCount,
        weakCount,
        periodWordsLearned: periodProgress.length,
        quizzesTaken: quizResults.length,
        accuracy,
      },
      subjectStats: Object.entries(subjectStats).map(([subjectId, stats]) => ({
        subjectId,
        ...stats,
      })),
      dailyStats,
      weakWords: weakWords.map(w => ({
        id: w.word.id,
        term: w.word.term,
        definition: w.word.definition,
        masteryLevel: w.masteryLevel,
        incorrectCount: w.incorrectCount,
      })),
    });
  } catch (error) {
    console.error('Failed to get word report:', error);
    return NextResponse.json(
      { error: 'Failed to get word report' },
      { status: 500 }
    );
  }
}

// ========================================
// POST /api/words/reports - 리포트 생성/저장
// ========================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const reporterId = (session.user as { id?: string }).id;
    if (!reporterId) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (!body.userId || !body.period) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, period' },
        { status: 400 }
      );
    }

    const periodKey = format(new Date(), 'yyyy-MM-dd');

    // 기존 리포트가 있으면 업데이트
    const report = await prisma.wordReport.upsert({
      where: {
        userId_reporterId_period_periodKey: {
          userId: body.userId,
          reporterId,
          period: body.period,
          periodKey,
        },
      },
      create: {
        userId: body.userId,
        reporterId,
        period: body.period,
        periodKey,
        totalWords: body.totalWords || 0,
        masteredWords: body.masteredWords || 0,
        weakWords: body.weakWords || 0,
        newWordsLearned: body.newWordsLearned || 0,
        quizzesTaken: body.quizzesTaken || 0,
        avgAccuracy: body.avgAccuracy,
        subjectStats: body.subjectStats ? JSON.stringify(body.subjectStats) : null,
        recommendedWords: body.recommendedWords ? JSON.stringify(body.recommendedWords) : null,
        aiComment: body.aiComment,
      },
      update: {
        totalWords: body.totalWords || 0,
        masteredWords: body.masteredWords || 0,
        weakWords: body.weakWords || 0,
        newWordsLearned: body.newWordsLearned || 0,
        quizzesTaken: body.quizzesTaken || 0,
        avgAccuracy: body.avgAccuracy,
        subjectStats: body.subjectStats ? JSON.stringify(body.subjectStats) : null,
        aiComment: body.aiComment,
      },
    });

    return NextResponse.json({
      success: true,
      reportId: report.id,
    });
  } catch (error) {
    console.error('Failed to create word report:', error);
    return NextResponse.json(
      { error: 'Failed to create word report' },
      { status: 500 }
    );
  }
}
