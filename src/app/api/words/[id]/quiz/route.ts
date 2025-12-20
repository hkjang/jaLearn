/**
 * Word Quiz API - 단어 퀴즈 생성 및 결과 제출
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateWordQuiz } from '@/lib/word-ai-service';
import { updateProgress } from '@/lib/word-personalization-service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ========================================
// GET /api/words/[id]/quiz - 퀴즈 생성
// ========================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    
    const quizType = (searchParams.get('type') as 'DEFINITION' | 'EXAMPLE' | 'RELATION' | 'LISTENING') || 'DEFINITION';

    const quiz = await generateWordQuiz(id, quizType);

    if (!quiz) {
      return NextResponse.json(
        { error: 'Failed to generate quiz' },
        { status: 404 }
      );
    }

    return NextResponse.json(quiz);
  } catch (error) {
    console.error('Failed to generate quiz:', error);
    return NextResponse.json(
      { error: 'Failed to generate quiz' },
      { status: 500 }
    );
  }
}

// ========================================
// POST /api/words/[id]/quiz - 퀴즈 결과 제출
// ========================================

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const userId = (session.user as { id?: string }).id;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found' },
        { status: 400 }
      );
    }

    // 필수 필드 검증
    if (typeof body.isCorrect !== 'boolean' || !body.quizType) {
      return NextResponse.json(
        { error: 'Missing required fields: isCorrect, quizType' },
        { status: 400 }
      );
    }

    // 학습 진행도 업데이트 (SM-2 알고리즘 적용)
    const result = await updateProgress(userId, {
      wordId: id,
      isCorrect: body.isCorrect,
      timeSpent: body.timeSpent,
      userAnswer: body.userAnswer,
      quizType: body.quizType,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Failed to submit quiz result:', error);
    return NextResponse.json(
      { error: 'Failed to submit quiz result' },
      { status: 500 }
    );
  }
}
