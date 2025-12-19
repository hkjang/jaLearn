/**
 * Daily Challenge API
 * 오늘의 문제 자동 생성 및 관리
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// 오늘 날짜 키 생성 (YYYY-MM-DD)
function getTodayKey() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

// GET: 오늘의 문제 조회 (자동 생성)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const todayKey = getTodayKey();
    const today = new Date(todayKey);
    
    // 기존 오늘의 문제 조회
    let dailyChallenge = await prisma.dailyChallenge.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });
    
    // 없으면 새로 생성
    if (!dailyChallenge) {
      // 사용자 학년 정보 가져오기
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { gradeLevel: true },
      });
      
      // 사용자 오답 패턴 분석
      const recentSubmissions = await prisma.problemSubmission.findMany({
        where: {
          userId,
          isCorrect: false,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          problem: {
            include: { unit: true },
          },
        },
      });
      
      // 취약 단원 분석
      const weakUnitIds = new Map<string, number>();
      recentSubmissions.forEach((sub) => {
        if (sub.problem.unitId) {
          const count = weakUnitIds.get(sub.problem.unitId) || 0;
          weakUnitIds.set(sub.problem.unitId, count + 1);
        }
      });
      
      // 취약 단원에서 우선 문제 선택
      const sortedWeakUnits = [...weakUnitIds.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([unitId]) => unitId);
      
      // 문제 선택 (5문제: 취약 3 + 랜덤 2)
      const problems: string[] = [];
      
      // 취약 단원에서 문제 선택
      if (sortedWeakUnits.length > 0) {
        const weakProblems = await prisma.problem.findMany({
          where: {
            unitId: { in: sortedWeakUnits },
            status: 'APPROVED',
            gradeLevel: user?.gradeLevel || undefined,
          },
          take: 3,
          orderBy: { usageCount: 'asc' }, // 적게 풀린 문제 우선
        });
        problems.push(...weakProblems.map((p) => p.id));
      }
      
      // 부족한 경우 랜덤 문제 추가
      const remainingCount = 5 - problems.length;
      if (remainingCount > 0) {
        const randomProblems = await prisma.problem.findMany({
          where: {
            status: 'APPROVED',
            gradeLevel: user?.gradeLevel || undefined,
            id: { notIn: problems },
          },
          take: remainingCount,
          orderBy: { usageCount: 'asc' },
        });
        problems.push(...randomProblems.map((p) => p.id));
      }
      
      // 오늘의 문제 생성
      dailyChallenge = await prisma.dailyChallenge.create({
        data: {
          userId,
          date: today,
          problemIds: JSON.stringify(problems),
          aiGenerated: true,
        },
      });
    }
    
    // 문제 상세 정보 조회
    const problemIds: string[] = JSON.parse(dailyChallenge.problemIds);
    const completedIds: string[] = dailyChallenge.completedIds
      ? JSON.parse(dailyChallenge.completedIds)
      : [];
    
    const problems = await prisma.problem.findMany({
      where: { id: { in: problemIds } },
      include: {
        subject: true,
        unit: true,
      },
    });
    
    // 순서 유지
    const orderedProblems = problemIds.map((id) =>
      problems.find((p) => p.id === id)
    ).filter(Boolean);
    
    return NextResponse.json({
      id: dailyChallenge.id,
      date: todayKey,
      problems: orderedProblems,
      completedIds,
      totalScore: dailyChallenge.totalScore,
      isCompleted: dailyChallenge.isCompleted,
      progress: {
        completed: completedIds.length,
        total: problemIds.length,
      },
    });
  } catch (error) {
    console.error('Daily challenge error:', error);
    return NextResponse.json(
      { error: '오늘의 문제를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 문제 풀이 결과 제출
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { problemId, isCorrect } = await request.json();
    
    if (!problemId) {
      return NextResponse.json({ error: '문제 ID가 필요합니다.' }, { status: 400 });
    }
    
    const todayKey = getTodayKey();
    const today = new Date(todayKey);
    
    // 오늘의 문제 조회
    const dailyChallenge = await prisma.dailyChallenge.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });
    
    if (!dailyChallenge) {
      return NextResponse.json(
        { error: '오늘의 문제가 없습니다.' },
        { status: 404 }
      );
    }
    
    const problemIds: string[] = JSON.parse(dailyChallenge.problemIds);
    const completedIds: string[] = dailyChallenge.completedIds
      ? JSON.parse(dailyChallenge.completedIds)
      : [];
    
    // 이미 완료한 문제인지 확인
    if (completedIds.includes(problemId)) {
      return NextResponse.json({ message: '이미 완료한 문제입니다.' });
    }
    
    // 완료 목록에 추가
    completedIds.push(problemId);
    const score = isCorrect ? 20 : 5; // 정답 20점, 오답 5점 (참여 점수)
    const newTotalScore = dailyChallenge.totalScore + score;
    const isAllCompleted = completedIds.length >= problemIds.length;
    
    // 업데이트
    await prisma.dailyChallenge.update({
      where: { id: dailyChallenge.id },
      data: {
        completedIds: JSON.stringify(completedIds),
        totalScore: newTotalScore,
        isCompleted: isAllCompleted,
      },
    });
    
    // 스트릭 업데이트
    if (isAllCompleted) {
      await updateStreak(userId);
    }
    
    // 레벨 업데이트
    await updateLevel(userId, isCorrect);
    
    return NextResponse.json({
      success: true,
      score,
      totalScore: newTotalScore,
      isCompleted: isAllCompleted,
      progress: {
        completed: completedIds.length,
        total: problemIds.length,
      },
    });
  } catch (error) {
    console.error('Submit daily challenge error:', error);
    return NextResponse.json(
      { error: '결과 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 스트릭 업데이트 함수
async function updateStreak(userId: string) {
  const todayKey = getTodayKey();
  const today = new Date(todayKey);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  let streak = await prisma.userStreak.findUnique({
    where: { userId },
  });
  
  if (!streak) {
    // 새 스트릭 생성
    await prisma.userStreak.create({
      data: {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActiveDate: today,
        totalDays: 1,
      },
    });
  } else {
    const lastActive = new Date(streak.lastActiveDate);
    const lastActiveKey = lastActive.toISOString().split('T')[0];
    
    if (lastActiveKey === todayKey) {
      // 오늘 이미 활동함
      return;
    }
    
    const yesterdayKey = yesterday.toISOString().split('T')[0];
    let newStreak = streak.currentStreak;
    
    if (lastActiveKey === yesterdayKey) {
      // 연속 유지
      newStreak += 1;
    } else {
      // 연속 끊김
      newStreak = 1;
    }
    
    await prisma.userStreak.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, streak.longestStreak),
        lastActiveDate: today,
        totalDays: streak.totalDays + 1,
      },
    });
  }
}

// 레벨 업데이트 함수
async function updateLevel(userId: string, isCorrect: boolean) {
  let level = await prisma.userLevel.findUnique({
    where: { userId },
  });
  
  if (!level) {
    level = await prisma.userLevel.create({
      data: {
        userId,
        level: 1,
        experience: 0,
        nextLevelExp: 100,
        totalProblems: 0,
        totalCorrect: 0,
      },
    });
  }
  
  // 경험치 계산
  const expGain = isCorrect ? 15 : 5;
  let newExp = level.experience + expGain;
  let newLevel = level.level;
  let newNextLevelExp = level.nextLevelExp;
  let newRank = level.rank;
  
  // 레벨업 체크
  while (newExp >= newNextLevelExp) {
    newExp -= newNextLevelExp;
    newLevel += 1;
    newNextLevelExp = Math.floor(newNextLevelExp * 1.2); // 20% 증가
    
    // 랭크 업그레이드
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
}
