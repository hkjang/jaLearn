/**
 * My Words API - 개인 단어장 관리
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getFavorites,
  toggleFavorite,
  recommendWords,
  calculateMastery,
} from '@/lib/word-personalization-service';

// ========================================
// GET /api/words/my - 내 단어장 조회
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
    const type = searchParams.get('type') || 'favorites'; // favorites, all, recommended
    const subjectId = searchParams.get('subjectId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20');

    let result;

    switch (type) {
      case 'favorites':
        result = await getFavorites(userId, limit);
        break;

      case 'recommended':
        const gradeLevel = searchParams.get('gradeLevel') || undefined;
        result = await recommendWords(userId, { subjectId, gradeLevel, limit });
        break;

      case 'all':
      default:
        result = await prisma.userWordProgress.findMany({
          where: {
            userId,
            ...(subjectId && {
              word: { subjects: { some: { subjectId } } },
            }),
          },
          include: {
            word: {
              include: {
                subjects: { include: { subject: true } },
              },
            },
          },
          orderBy: { lastStudiedAt: 'desc' },
          take: limit,
        });
    }

    // 전체 통계도 함께 반환
    const mastery = await calculateMastery(userId, subjectId);

    return NextResponse.json({
      words: result,
      stats: mastery,
    });
  } catch (error) {
    console.error('Failed to get my words:', error);
    return NextResponse.json(
      { error: 'Failed to get my words' },
      { status: 500 }
    );
  }
}

// ========================================
// POST /api/words/my - 즐겨찾기 토글
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

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (!body.wordId) {
      return NextResponse.json(
        { error: 'Missing required field: wordId' },
        { status: 400 }
      );
    }

    const progress = await toggleFavorite(userId, body.wordId);

    return NextResponse.json({
      success: true,
      isFavorite: progress.isFavorite,
    });
  } catch (error) {
    console.error('Failed to toggle favorite:', error);
    return NextResponse.json(
      { error: 'Failed to toggle favorite' },
      { status: 500 }
    );
  }
}
