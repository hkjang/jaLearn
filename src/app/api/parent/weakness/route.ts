/**
 * Parent Weakness Analysis API
 * 자녀 취약 영역 분석 및 비교 리포트
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// GET: 자녀 취약 영역 분석
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');
    
    // 부모-자녀 관계 확인
    const parentChild = await prisma.parentChild.findFirst({
      where: {
        parentId: userId,
        childId: childId || undefined,
      },
      include: {
        child: {
          select: { id: true, name: true, gradeLevel: true },
        },
      },
    });
    
    if (!parentChild) {
      return NextResponse.json(
        { error: '자녀 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    const targetChildId = parentChild.child.id;
    
    // 최근 30일 풀이 기록
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentSubmissions = await prisma.problemSubmission.findMany({
      where: {
        userId: targetChildId,
        createdAt: { gte: thirtyDaysAgo },
      },
      include: {
        problem: {
          include: { subject: true, unit: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // 단원별 정답률 분석
    const unitStats = new Map<string, { correct: number; total: number; name: string; subject: string }>();
    
    recentSubmissions.forEach((sub) => {
      const unitId = sub.problem.unitId || 'unknown';
      const current = unitStats.get(unitId) || {
        correct: 0,
        total: 0,
        name: sub.problem.unit?.name || '기타',
        subject: sub.problem.subject.displayName,
      };
      
      current.total += 1;
      if (sub.isCorrect) current.correct += 1;
      
      unitStats.set(unitId, current);
    });
    
    // 취약 단원 (정답률 60% 미만, 최소 3문제 이상)
    const weakAreas: { unitId: string; name: string; subject: string; correctRate: number; totalProblems: number }[] = [];
    const strongAreas: { unitId: string; name: string; subject: string; correctRate: number; totalProblems: number }[] = [];
    
    unitStats.forEach((stats, unitId) => {
      if (stats.total >= 3) {
        const rate = Math.round((stats.correct / stats.total) * 100);
        const area = {
          unitId,
          name: stats.name,
          subject: stats.subject,
          correctRate: rate,
          totalProblems: stats.total,
        };
        
        if (rate < 60) {
          weakAreas.push(area);
        } else if (rate >= 80) {
          strongAreas.push(area);
        }
      }
    });
    
    // 정답률 기준 정렬
    weakAreas.sort((a, b) => a.correctRate - b.correctRate);
    strongAreas.sort((a, b) => b.correctRate - a.correctRate);
    
    // 전체 요약 통계
    const totalProblems = recentSubmissions.length;
    const correctProblems = recentSubmissions.filter((s) => s.isCorrect).length;
    const overallRate = totalProblems > 0 ? Math.round((correctProblems / totalProblems) * 100) : 0;
    
    // 일일 학습량
    const dailyStats = new Map<string, { problems: number; correct: number }>();
    recentSubmissions.forEach((sub) => {
      const dateKey = sub.createdAt.toISOString().split('T')[0];
      const current = dailyStats.get(dateKey) || { problems: 0, correct: 0 };
      current.problems += 1;
      if (sub.isCorrect) current.correct += 1;
      dailyStats.set(dateKey, current);
    });
    
    const activeDays = dailyStats.size;
    const avgProblemsPerDay = activeDays > 0 ? Math.round(totalProblems / activeDays) : 0;
    
    // 평균 대비 (전체 학생 평균 - 같은 학년)
    const gradeAvg = await getGradeAverage(parentChild.child.gradeLevel || 'MIDDLE_1');
    
    return NextResponse.json({
      child: {
        id: parentChild.child.id,
        name: parentChild.child.name,
        gradeLevel: parentChild.child.gradeLevel,
      },
      summary: {
        totalProblems,
        correctProblems,
        overallRate,
        activeDays,
        avgProblemsPerDay,
        comparison: {
          gradeAvgRate: gradeAvg.correctRate,
          difference: overallRate - gradeAvg.correctRate,
          percentile: calculatePercentile(overallRate, gradeAvg),
        },
      },
      weakAreas: weakAreas.slice(0, 5),
      strongAreas: strongAreas.slice(0, 5),
      recommendations: generateRecommendations(weakAreas, totalProblems, activeDays),
    });
  } catch (error) {
    console.error('Parent weakness API error:', error);
    return NextResponse.json(
      { error: '분석 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

async function getGradeAverage(gradeLevel: string) {
  // 실제 구현시 DB에서 조회
  // 지금은 시뮬레이션 값
  return {
    correctRate: 68,
    avgProblemsPerDay: 8,
    activeRatio: 0.7,
  };
}

function calculatePercentile(rate: number, gradeAvg: { correctRate: number }) {
  // 정답률 기반 백분위 추정 (간단한 공식)
  const diff = rate - gradeAvg.correctRate;
  const percentile = Math.min(99, Math.max(1, 50 + diff * 2));
  return Math.round(percentile);
}

function generateRecommendations(
  weakAreas: { name: string; subject: string; correctRate: number }[],
  totalProblems: number,
  activeDays: number
) {
  const recommendations: string[] = [];
  
  if (weakAreas.length > 0) {
    recommendations.push(
      `📚 ${weakAreas[0].subject}의 "${weakAreas[0].name}" 단원 복습이 필요해요`
    );
  }
  
  if (activeDays < 10) {
    recommendations.push('📅 매일 조금씩 꾸준히 학습하면 효과적이에요');
  }
  
  if (totalProblems < 30) {
    recommendations.push('🎯 하루 5문제씩 도전해보는 건 어떨까요?');
  }
  
  if (weakAreas.length === 0) {
    recommendations.push('⭐ 전반적으로 잘하고 있어요! 응용 문제에 도전해보세요');
  }
  
  return recommendations;
}
