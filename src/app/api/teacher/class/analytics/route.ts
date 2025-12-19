/**
 * Teacher Class Analytics API
 * 반 전체 취약 분석
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// GET: 반 전체 취약 분석
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    
    if (!classId) {
      return NextResponse.json({ error: '클래스 ID가 필요합니다.' }, { status: 400 });
    }
    
    // 클래스룸 소유권 확인
    const classroom = await prisma.classRoom.findFirst({
      where: {
        id: classId,
        teacherId: userId,
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });
    
    if (!classroom) {
      return NextResponse.json({ error: '클래스를 찾을 수 없습니다.' }, { status: 404 });
    }
    
    const studentIds = classroom.members.map((m) => m.user.id);
    
    if (studentIds.length === 0) {
      return NextResponse.json({
        classId,
        className: classroom.name,
        studentCount: 0,
        unitAnalysis: [],
        studentRanking: [],
        overallStats: { avgCorrectRate: 0, totalProblems: 0 },
      });
    }
    
    // 최근 30일 풀이 기록
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const submissions = await prisma.problemSubmission.findMany({
      where: {
        userId: { in: studentIds },
        createdAt: { gte: thirtyDaysAgo },
      },
      include: {
        problem: {
          include: { subject: true, unit: true },
        },
        user: { select: { id: true, name: true } },
      },
    });
    
    // 단원별 분석
    const unitStats = new Map<string, {
      name: string;
      subject: string;
      correct: number;
      total: number;
      studentCount: Set<string>;
    }>();
    
    // 학생별 통계
    const studentStats = new Map<string, {
      name: string;
      correct: number;
      total: number;
    }>();
    
    submissions.forEach((sub) => {
      // 단원별
      const unitId = sub.problem.unitId || 'unknown';
      const unitCurrent = unitStats.get(unitId) || {
        name: sub.problem.unit?.name || '기타',
        subject: sub.problem.subject.displayName,
        correct: 0,
        total: 0,
        studentCount: new Set<string>(),
      };
      
      unitCurrent.total += 1;
      if (sub.isCorrect) unitCurrent.correct += 1;
      unitCurrent.studentCount.add(sub.userId);
      unitStats.set(unitId, unitCurrent);
      
      // 학생별
      const studentCurrent = studentStats.get(sub.userId) || {
        name: sub.user.name,
        correct: 0,
        total: 0,
      };
      
      studentCurrent.total += 1;
      if (sub.isCorrect) studentCurrent.correct += 1;
      studentStats.set(sub.userId, studentCurrent);
    });
    
    // 취약 단원 정렬 (정답률 낮은 순)
    const unitAnalysis = [...unitStats.entries()]
      .filter(([_, stats]) => stats.total >= 5)
      .map(([unitId, stats]) => ({
        unitId,
        name: stats.name,
        subject: stats.subject,
        correctRate: Math.round((stats.correct / stats.total) * 100),
        totalProblems: stats.total,
        studentCount: stats.studentCount.size,
        isWeak: (stats.correct / stats.total) < 0.6,
      }))
      .sort((a, b) => a.correctRate - b.correctRate);
    
    // 학생 랭킹
    const studentRanking = [...studentStats.entries()]
      .map(([userId, stats]) => ({
        userId,
        name: stats.name,
        totalProblems: stats.total,
        correctRate: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
      }))
      .sort((a, b) => b.correctRate - a.correctRate);
    
    // 전체 통계
    const totalProblems = submissions.length;
    const totalCorrect = submissions.filter((s) => s.isCorrect).length;
    
    return NextResponse.json({
      classId,
      className: classroom.name,
      studentCount: studentIds.length,
      unitAnalysis: unitAnalysis.slice(0, 10),
      studentRanking: studentRanking.slice(0, 20),
      overallStats: {
        avgCorrectRate: totalProblems > 0 ? Math.round((totalCorrect / totalProblems) * 100) : 0,
        totalProblems,
        activeStudents: new Set(submissions.map((s) => s.userId)).size,
      },
      recommendations: generateClassRecommendations(unitAnalysis),
    });
  } catch (error) {
    console.error('Class analytics error:', error);
    return NextResponse.json(
      { error: '분석 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

function generateClassRecommendations(
  unitAnalysis: { name: string; subject: string; correctRate: number; isWeak: boolean }[]
) {
  const weakUnits = unitAnalysis.filter((u) => u.isWeak);
  const recommendations: string[] = [];
  
  if (weakUnits.length > 0) {
    recommendations.push(
      `📚 "${weakUnits[0].name}" 단원 보충 수업을 권장합니다 (정답률 ${weakUnits[0].correctRate}%)`
    );
  }
  
  if (weakUnits.length > 2) {
    recommendations.push(
      `⚠️ 취약 단원이 ${weakUnits.length}개입니다. 기초 개념 복습이 필요합니다.`
    );
  }
  
  const strongUnit = unitAnalysis.find((u) => u.correctRate >= 80);
  if (strongUnit) {
    recommendations.push(
      `⭐ "${strongUnit.name}" 단원은 잘 이해하고 있습니다 (${strongUnit.correctRate}%)`
    );
  }
  
  return recommendations;
}
