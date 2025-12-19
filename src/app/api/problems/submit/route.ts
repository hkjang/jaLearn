/**
 * Problem Submit API
 * 문제 풀이 결과 저장
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { problemId, answer, isCorrect, timeSpent } = await request.json();
    
    if (!problemId || !answer) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
    }
    
    // 문제 존재 확인
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
    });
    
    if (!problem) {
      return NextResponse.json({ error: '문제를 찾을 수 없습니다.' }, { status: 404 });
    }
    
    // 풀이 기록 저장
    const submission = await prisma.problemSubmission.create({
      data: {
        problemId,
        userId,
        answer: String(answer),
        isCorrect: Boolean(isCorrect),
        timeSpent: timeSpent ? Number(timeSpent) : null,
      },
    });
    
    // 문제 통계 업데이트
    const allSubmissions = await prisma.problemSubmission.findMany({
      where: { problemId },
      select: { isCorrect: true, timeSpent: true },
    });
    
    const totalSubmissions = allSubmissions.length;
    const correctSubmissions = allSubmissions.filter((s) => s.isCorrect).length;
    const avgTime = allSubmissions
      .filter((s) => s.timeSpent)
      .reduce((sum, s) => sum + (s.timeSpent || 0), 0) / (allSubmissions.filter((s) => s.timeSpent).length || 1);
    
    await prisma.problem.update({
      where: { id: problemId },
      data: {
        usageCount: totalSubmissions,
        correctRate: totalSubmissions > 0 ? (correctSubmissions / totalSubmissions) * 100 : null,
        avgSolveTime: avgTime || null,
      },
    });
    
    // 레벨 경험치 업데이트
    await updateExperience(userId, isCorrect);
    
    return NextResponse.json({
      success: true,
      submissionId: submission.id,
    });
  } catch (error) {
    console.error('Problem submit error:', error);
    return NextResponse.json(
      { error: '결과 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

async function updateExperience(userId: string, isCorrect: boolean) {
  try {
    let level = await prisma.userLevel.findUnique({
      where: { userId },
    });
    
    if (!level) {
      level = await prisma.userLevel.create({
        data: { userId },
      });
    }
    
    const expGain = isCorrect ? 15 : 5;
    let newExp = level.experience + expGain;
    let newLevel = level.level;
    let newNextLevelExp = level.nextLevelExp;
    let newRank = level.rank;
    
    // 레벨업 체크
    while (newExp >= newNextLevelExp) {
      newExp -= newNextLevelExp;
      newLevel += 1;
      newNextLevelExp = Math.floor(newNextLevelExp * 1.2);
      
      if (newLevel >= 50) newRank = 'DIAMOND';
      else if (newLevel >= 30) newRank = 'PLATINUM';
      else if (newLevel >= 20) newRank = 'GOLD';
      else if (newLevel >= 10) newRank = 'SILVER';
    }
    
    await prisma.userLevel.update({
      where: { userId },
      data: {
        level: newLevel,
        experience: newExp,
        nextLevelExp: newNextLevelExp,
        rank: newRank,
        totalProblems: level.totalProblems + 1,
        totalCorrect: isCorrect ? level.totalCorrect + 1 : level.totalCorrect,
      },
    });
  } catch (error) {
    console.error('Experience update error:', error);
  }
}
