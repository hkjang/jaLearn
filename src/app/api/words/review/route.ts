/**
 * Review Words API - 복습 필요 단어 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getReviewDueWords } from '@/lib/word-personalization-service';

// ========================================
// GET /api/words/review - 복습 필요 단어 목록
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
    const subjectId = searchParams.get('subjectId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20');

    const reviewDueWords = await getReviewDueWords(userId, { subjectId, limit });

    return NextResponse.json({
      words: reviewDueWords,
      count: reviewDueWords.length,
    });
  } catch (error) {
    console.error('Failed to get review due words:', error);
    return NextResponse.json(
      { error: 'Failed to get review due words' },
      { status: 500 }
    );
  }
}
