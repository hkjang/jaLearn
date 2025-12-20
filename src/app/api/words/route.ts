/**
 * Words API - 단어 CRUD 라우트
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getWords,
  createWord,
} from '@/lib/word-service';

// ========================================
// GET /api/words - 단어 목록 조회
// ========================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters = {
      subjectId: searchParams.get('subjectId') || undefined,
      gradeLevel: searchParams.get('gradeLevel') || undefined,
      termType: searchParams.get('termType') || undefined,
      search: searchParams.get('search') || undefined,
      isVerified: searchParams.get('isVerified') === 'true' ? true : 
                  searchParams.get('isVerified') === 'false' ? false : undefined,
    };

    const pagination = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '20'), 100),
      sortBy: (searchParams.get('sortBy') as 'term' | 'createdAt' | 'usageCount' | 'correctRate') || 'term',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc',
    };

    const result = await getWords(filters, pagination);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to get words:', error);
    return NextResponse.json(
      { error: 'Failed to get words' },
      { status: 500 }
    );
  }
}

// ========================================
// POST /api/words - 단어 생성 (관리자용)
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

    // 관리자/교사만 단어 생성 가능
    const userRole = (session.user as { role?: string }).role;
    if (!['ADMIN', 'TEACHER'].includes(userRole || '')) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // 필수 필드 검증
    if (!body.term || !body.termType || !body.gradeLevel || !body.definition) {
      return NextResponse.json(
        { error: 'Missing required fields: term, termType, gradeLevel, definition' },
        { status: 400 }
      );
    }

    const word = await createWord({
      term: body.term,
      pronunciation: body.pronunciation,
      termType: body.termType,
      gradeLevel: body.gradeLevel,
      definition: body.definition,
      simpleDefinition: body.simpleDefinition,
      imageUrl: body.imageUrl,
      audioUrl: body.audioUrl,
      subjectIds: body.subjectIds,
    });

    return NextResponse.json(word, { status: 201 });
  } catch (error) {
    console.error('Failed to create word:', error);
    return NextResponse.json(
      { error: 'Failed to create word' },
      { status: 500 }
    );
  }
}
