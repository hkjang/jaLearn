/**
 * Word Detail API - 개별 단어 CRUD 라우트
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getWordById,
  updateWord,
  deleteWord,
} from '@/lib/word-service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ========================================
// GET /api/words/[id] - 단어 상세 조회
// ========================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    const word = await getWordById(id);

    if (!word) {
      return NextResponse.json(
        { error: 'Word not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(word);
  } catch (error) {
    console.error('Failed to get word:', error);
    return NextResponse.json(
      { error: 'Failed to get word' },
      { status: 500 }
    );
  }
}

// ========================================
// PUT /api/words/[id] - 단어 수정
// ========================================

export async function PUT(
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

    const userRole = (session.user as { role?: string }).role;
    if (!['ADMIN', 'TEACHER'].includes(userRole || '')) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const word = await updateWord(id, {
      term: body.term,
      pronunciation: body.pronunciation,
      termType: body.termType,
      gradeLevel: body.gradeLevel,
      definition: body.definition,
      simpleDefinition: body.simpleDefinition,
      imageUrl: body.imageUrl,
      audioUrl: body.audioUrl,
      subjectIds: body.subjectIds,
      isVerified: body.isVerified,
      isActive: body.isActive,
    });

    return NextResponse.json(word);
  } catch (error) {
    console.error('Failed to update word:', error);
    return NextResponse.json(
      { error: 'Failed to update word' },
      { status: 500 }
    );
  }
}

// ========================================
// DELETE /api/words/[id] - 단어 삭제
// ========================================

export async function DELETE(
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

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { id } = await params;
    
    await deleteWord(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete word:', error);
    return NextResponse.json(
      { error: 'Failed to delete word' },
      { status: 500 }
    );
  }
}
