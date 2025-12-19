/**
 * User Level API
 * 레벨 시스템 API
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// 랭크 정보
const rankInfo = {
  BRONZE: { name: '브론즈', color: '#CD7F32', minLevel: 1 },
  SILVER: { name: '실버', color: '#C0C0C0', minLevel: 10 },
  GOLD: { name: '골드', color: '#FFD700', minLevel: 20 },
  PLATINUM: { name: '플래티넘', color: '#E5E4E2', minLevel: 30 },
  DIAMOND: { name: '다이아몬드', color: '#B9F2FF', minLevel: 50 },
};

// GET: 레벨 정보 조회
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    let level = await prisma.userLevel.findUnique({
      where: { userId },
    });
    
    if (!level) {
      // 새 레벨 생성
      level = await prisma.userLevel.create({
        data: {
          userId,
          level: 1,
          experience: 0,
          nextLevelExp: 100,
          totalProblems: 0,
          totalCorrect: 0,
          rank: 'BRONZE',
        },
      });
    }
    
    // 정답률 계산
    const correctRate = level.totalProblems > 0
      ? Math.round((level.totalCorrect / level.totalProblems) * 100)
      : 0;
    
    // 다음 랭크 정보
    let nextRank = null;
    const rankKeys = Object.keys(rankInfo) as (keyof typeof rankInfo)[];
    const currentRankIndex = rankKeys.indexOf(level.rank as keyof typeof rankInfo);
    if (currentRankIndex < rankKeys.length - 1) {
      const nextRankKey = rankKeys[currentRankIndex + 1];
      nextRank = {
        ...rankInfo[nextRankKey],
        levelsToGo: rankInfo[nextRankKey].minLevel - level.level,
      };
    }
    
    // 뱃지 파싱
    let badges: string[] = [];
    if (level.badges) {
      try {
        badges = JSON.parse(level.badges);
      } catch (e) {
        badges = [];
      }
    }
    
    return NextResponse.json({
      level: level.level,
      experience: level.experience,
      nextLevelExp: level.nextLevelExp,
      experiencePercent: Math.round((level.experience / level.nextLevelExp) * 100),
      rank: level.rank,
      rankInfo: rankInfo[level.rank as keyof typeof rankInfo],
      nextRank,
      totalProblems: level.totalProblems,
      totalCorrect: level.totalCorrect,
      correctRate,
      badges,
    });
  } catch (error) {
    console.error('Level GET error:', error);
    return NextResponse.json(
      { error: '레벨 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 뱃지 추가
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { badgeId } = await request.json();
    
    if (!badgeId) {
      return NextResponse.json({ error: '뱃지 ID가 필요합니다.' }, { status: 400 });
    }
    
    const level = await prisma.userLevel.findUnique({
      where: { userId },
    });
    
    if (!level) {
      return NextResponse.json({ error: '레벨 정보가 없습니다.' }, { status: 404 });
    }
    
    // 기존 뱃지 파싱
    let badges: string[] = [];
    if (level.badges) {
      try {
        badges = JSON.parse(level.badges);
      } catch (e) {
        badges = [];
      }
    }
    
    // 중복 확인
    if (badges.includes(badgeId)) {
      return NextResponse.json({ message: '이미 획득한 뱃지입니다.' });
    }
    
    // 뱃지 추가
    badges.push(badgeId);
    
    await prisma.userLevel.update({
      where: { userId },
      data: {
        badges: JSON.stringify(badges),
      },
    });
    
    return NextResponse.json({
      success: true,
      message: '새 뱃지를 획득했습니다!',
      badgeId,
    });
  } catch (error) {
    console.error('Level POST error:', error);
    return NextResponse.json(
      { error: '뱃지 추가 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
