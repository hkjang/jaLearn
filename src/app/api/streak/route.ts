/**
 * Streak API
 * 스트릭(연속 학습) 시스템 API
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// GET: 스트릭 조회
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    let streak = await prisma.userStreak.findUnique({
      where: { userId },
    });
    
    if (!streak) {
      // 새 스트릭 생성
      streak = await prisma.userStreak.create({
        data: {
          userId,
          currentStreak: 0,
          longestStreak: 0,
          lastActiveDate: new Date(),
          totalDays: 0,
          freezeCount: 3, // 초기 보호권 3개
        },
      });
    }
    
    // 오늘 활동 여부 확인
    const today = new Date().toISOString().split('T')[0];
    const lastActive = new Date(streak.lastActiveDate).toISOString().split('T')[0];
    const isActiveToday = today === lastActive;
    
    // 스트릭 끊김 여부 확인 (어제 활동하지 않음)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().split('T')[0];
    const isStreakAtRisk = !isActiveToday && lastActive !== yesterdayKey && streak.currentStreak > 0;
    
    return NextResponse.json({
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastActiveDate: streak.lastActiveDate,
      totalDays: streak.totalDays,
      freezeCount: streak.freezeCount,
      isActiveToday,
      isStreakAtRisk,
    });
  } catch (error) {
    console.error('Streak GET error:', error);
    return NextResponse.json(
      { error: '스트릭 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 스트릭 보호권 사용
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { action } = await request.json();
    
    if (action !== 'use_freeze') {
      return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
    }
    
    const streak = await prisma.userStreak.findUnique({
      where: { userId },
    });
    
    if (!streak) {
      return NextResponse.json({ error: '스트릭 정보가 없습니다.' }, { status: 404 });
    }
    
    if (streak.freezeCount <= 0) {
      return NextResponse.json(
        { error: '사용 가능한 스트릭 보호권이 없습니다.' },
        { status: 400 }
      );
    }
    
    // 보호권 사용: 어제를 활동한 것처럼 처리
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    await prisma.userStreak.update({
      where: { userId },
      data: {
        lastActiveDate: yesterday,
        freezeCount: streak.freezeCount - 1,
      },
    });
    
    return NextResponse.json({
      success: true,
      message: '스트릭 보호권이 사용되었습니다!',
      remainingFreezes: streak.freezeCount - 1,
    });
  } catch (error) {
    console.error('Streak POST error:', error);
    return NextResponse.json(
      { error: '스트릭 보호권 사용 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
