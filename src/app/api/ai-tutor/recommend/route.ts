/**
 * AI Tutor Recommendation API
 * 개념 기반 다음 문제 자동 추천
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// GET: 추천 문제 조회
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const problemId = searchParams.get('problemId');
    const wasCorrect = searchParams.get('correct') === 'true';
    
    // 현재 문제 정보
    let currentProblem = null;
    if (problemId) {
      currentProblem = await prisma.problem.findUnique({
        where: { id: problemId },
        include: { unit: true, subject: true },
      });
    }
    
    // 사용자 학년
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { gradeLevel: true },
    });
    
    // 오답 패턴 분석
    const recentWrongSubmissions = await prisma.problemSubmission.findMany({
      where: {
        userId,
        isCorrect: false,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        problem: {
          include: { unit: true },
        },
      },
    });
    
    // 취약 단원 식별
    const weakUnitCounts = new Map<string, number>();
    recentWrongSubmissions.forEach((sub) => {
      if (sub.problem.unitId) {
        const count = weakUnitCounts.get(sub.problem.unitId) || 0;
        weakUnitCounts.set(sub.problem.unitId, count + 1);
      }
    });
    
    const weakUnitIds = [...weakUnitCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id);
    
    // 추천 전략 결정
    let recommendedProblems;
    
    if (!wasCorrect && currentProblem) {
      // 오답인 경우: 같은 단원의 더 쉬운 문제
      recommendedProblems = await prisma.problem.findMany({
        where: {
          status: 'APPROVED',
          unitId: currentProblem.unitId,
          difficulty: currentProblem.difficulty === 'HIGH' ? 'MEDIUM' 
                    : currentProblem.difficulty === 'MEDIUM' ? 'LOW' 
                    : 'LOW',
          id: { not: problemId || undefined },
        },
        take: 3,
        include: { unit: true, subject: true },
      });
    } else if (wasCorrect && currentProblem) {
      // 정답인 경우: 같은 단원의 더 어려운 문제 또는 다른 단원
      recommendedProblems = await prisma.problem.findMany({
        where: {
          status: 'APPROVED',
          gradeLevel: user?.gradeLevel || undefined,
          OR: [
            // 같은 단원 더 어려운 문제
            {
              unitId: currentProblem.unitId,
              difficulty: currentProblem.difficulty === 'LOW' ? 'MEDIUM'
                        : currentProblem.difficulty === 'MEDIUM' ? 'HIGH'
                        : 'HIGH',
            },
            // 취약 단원 문제
            {
              unitId: { in: weakUnitIds },
            },
          ],
          id: { not: problemId || undefined },
        },
        take: 5,
        orderBy: { usageCount: 'asc' },
        include: { unit: true, subject: true },
      });
    } else {
      // 기본 추천: 취약 단원 또는 랜덤
      recommendedProblems = await prisma.problem.findMany({
        where: {
          status: 'APPROVED',
          gradeLevel: user?.gradeLevel || undefined,
          unitId: weakUnitIds.length > 0 ? { in: weakUnitIds } : undefined,
        },
        take: 5,
        orderBy: { usageCount: 'asc' },
        include: { unit: true, subject: true },
      });
    }
    
    // 추천 이유 생성
    const recommendations = recommendedProblems.map((p) => ({
      id: p.id,
      title: p.title || p.content.substring(0, 50),
      subject: p.subject.displayName,
      unit: p.unit?.name,
      difficulty: p.difficulty,
      reason: getRecommendationReason(p, currentProblem, wasCorrect, weakUnitIds),
    }));
    
    return NextResponse.json({
      recommendations,
      context: {
        wasCorrect,
        weakUnits: weakUnitIds.length,
        gradeLevel: user?.gradeLevel,
      },
    });
  } catch (error) {
    console.error('Recommendation error:', error);
    return NextResponse.json(
      { error: '추천을 생성하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 추천 클릭 기록 (AI 학습용)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }
    
    const { recommendedProblemId, wasClicked, source } = await request.json();
    
    // TODO: 추천 클릭 기록 저장 (차후 AI 모델 개선용)
    // await prisma.recommendationLog.create({ ... })
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Recommendation log error:', error);
    return NextResponse.json({ error: '기록 저장 실패' }, { status: 500 });
  }
}

function getRecommendationReason(
  problem: any,
  currentProblem: any,
  wasCorrect: boolean,
  weakUnitIds: string[]
): string {
  if (!currentProblem) {
    if (weakUnitIds.includes(problem.unitId)) {
      return '📚 복습이 필요한 단원이에요';
    }
    return '🎯 맞춤 추천 문제예요';
  }
  
  if (!wasCorrect) {
    if (problem.unitId === currentProblem.unitId) {
      return '💡 같은 개념의 더 쉬운 문제예요';
    }
    return '📖 기초를 다질 수 있는 문제예요';
  }
  
  if (problem.unitId === currentProblem.unitId) {
    return '🚀 도전! 한 단계 높은 문제예요';
  }
  
  if (weakUnitIds.includes(problem.unitId)) {
    return '⚡ 취약 단원 보강 문제예요';
  }
  
  return '✨ 추천 문제예요';
}
