/**
 * Problem Rating API
 * 문제 평가 시스템
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// POST: 문제 평가 저장
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { problemId, rating, difficulty, helpful, comment } = await request.json();
    
    if (!problemId || !rating) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
    }
    
    // 이미 평가했는지 확인
    const existing = await (prisma as any).problemRating.findUnique({
      where: {
        problemId_userId: { problemId, userId },
      },
    });
    
    if (existing) {
      // 업데이트
      await (prisma as any).problemRating.update({
        where: { id: existing.id },
        data: {
          rating,
          difficulty,
          helpful,
          comment,
        },
      });
    } else {
      // 새로 생성
      await (prisma as any).problemRating.create({
        data: {
          problemId,
          userId,
          rating,
          difficulty,
          helpful,
          comment,
        },
      });
    }
    
    // 문제 평균 평점 업데이트
    const avgRating = await (prisma as any).problemRating.aggregate({
      where: { problemId },
      _avg: { rating: true, difficulty: true },
      _count: true,
    });
    
    return NextResponse.json({
      success: true,
      avgRating: avgRating._avg.rating,
      avgDifficulty: avgRating._avg.difficulty,
      totalRatings: avgRating._count,
    });
  } catch (error) {
    console.error('Problem rating error:', error);
    return NextResponse.json(
      { error: '평가 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// GET: 문제 평가 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const problemId = searchParams.get('problemId');
    
    if (!problemId) {
      return NextResponse.json({ error: '문제 ID가 필요합니다.' }, { status: 400 });
    }
    
    // 평균 및 분포
    const ratings: any[] = await (prisma as any).problemRating.findMany({
      where: { problemId },
      include: {
        user: { select: { name: true } },
      },
    });
    
    const avgRating2 = ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / (ratings.length || 1);
    const avgDifficulty = ratings.reduce((sum: number, r: any) => sum + (r.difficulty || 0), 0) / (ratings.filter((r: any) => r.difficulty).length || 1);
    
    // 별점 분포
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach((r: any) => {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
    });
    
    return NextResponse.json({
      avgRating: Math.round(avgRating2 * 10) / 10,
      avgDifficulty: Math.round(avgDifficulty * 10) / 10,
      totalRatings: ratings.length,
      distribution,
      recentComments: ratings
        .filter((r: any) => r.comment)
        .slice(0, 5)
        .map((r: any) => ({
          rating: r.rating,
          comment: r.comment,
          userName: r.user.name,
          createdAt: r.createdAt,
        })),
    });
  } catch (error) {
    console.error('Rating GET error:', error);
    return NextResponse.json(
      { error: '평가 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
