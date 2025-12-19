/**
 * Ranking API
 * 학교/지역 랭킹 시스템
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// GET: 랭킹 조회
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    
    const period = searchParams.get('period') || 'WEEKLY';
    const scope = searchParams.get('scope') || 'GLOBAL';
    const scopeValue = searchParams.get('scopeValue');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    
    // 기간 키 계산
    const periodKey = getPeriodKey(period);
    
    // 랭킹 조회 (Prisma 재생성 필요)
    const rankings = await (prisma as any).ranking.findMany({
      where: {
        period,
        periodKey,
        scope,
        scopeValue: scopeValue || null,
      },
      orderBy: { rank: 'asc' },
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, gradeLevel: true, image: true },
        },
      },
    });
    
    // 현재 사용자 랭킹
    let myRanking = null;
    if (session?.user?.id) {
      myRanking = await (prisma as any).ranking.findFirst({
        where: {
          userId: session.user.id,
          period,
          periodKey,
          scope,
        },
        include: {
          user: {
            select: { id: true, name: true, gradeLevel: true },
          },
        },
      });
    }
    
    return NextResponse.json({
      period,
      periodKey,
      scope,
      scopeValue,
      rankings: rankings.map((r: any, index: number) => ({
        rank: r.rank || index + 1,
        userId: r.user.id,
        name: r.user.name,
        gradeLevel: r.user.gradeLevel,
        image: r.user.image,
        score: r.score,
      })),
      myRanking: myRanking
        ? {
            rank: myRanking.rank,
            score: myRanking.score,
          }
        : null,
    });
  } catch (error) {
    console.error('Ranking GET error:', error);
    return NextResponse.json(
      { error: '랭킹 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 랭킹 업데이트 (내부 호출용)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { scoreToAdd = 0 } = await request.json();
    
    // 사용자 정보
    const user: any = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });
    
    const periods = ['DAILY', 'WEEKLY', 'MONTHLY'];
    const scopes: { scope: string; value?: string }[] = [
      { scope: 'GLOBAL' },
    ];
    
    // 학교 정보가 있으면 학교 랭킹도 업데이트
    if ((user as any)?.profile?.school) {
      scopes.push({ scope: 'SCHOOL', value: (user as any).profile.school });
    }
    
    // 각 기간/범위별 랭킹 업데이트
    for (const period of periods) {
      const periodKey = getPeriodKey(period);
      
      for (const { scope, value } of scopes) {
        await (prisma as any).ranking.upsert({
          where: {
            userId_period_periodKey_scope_scopeValue: {
              userId,
              period,
              periodKey,
              scope,
              scopeValue: value || null,
            },
          },
          update: {
            score: { increment: scoreToAdd },
          },
          create: {
            userId,
            period,
            periodKey,
            scope,
            scopeValue: value,
            score: scoreToAdd,
          },
        });
      }
    }
    
    // 랭킹 순위 재계산 (글로벌 주간)
    await recalculateRanks('WEEKLY', getPeriodKey('WEEKLY'), 'GLOBAL');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ranking update error:', error);
    return NextResponse.json(
      { error: '랭킹 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

function getPeriodKey(period: string): string {
  const now = new Date();
  
  switch (period) {
    case 'DAILY':
      return now.toISOString().split('T')[0];
    case 'WEEKLY':
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      return `${weekStart.getFullYear()}-W${Math.ceil((now.getDate() + 1) / 7).toString().padStart(2, '0')}`;
    case 'MONTHLY':
      return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    default:
      return 'ALL_TIME';
  }
}

async function recalculateRanks(period: string, periodKey: string, scope: string, scopeValue?: string) {
  // 점수 순으로 정렬하여 순위 부여
  const rankings = await (prisma as any).ranking.findMany({
    where: {
      period,
      periodKey,
      scope,
      scopeValue: scopeValue || null,
    },
    orderBy: { score: 'desc' },
  });
  
  // 순위 업데이트
  for (let i = 0; i < rankings.length; i++) {
    await (prisma as any).ranking.update({
      where: { id: rankings[i].id },
      data: { rank: i + 1 },
    });
  }
}
