/**
 * Word Extraction API - 문제/해설에서 단어 추출
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  extractWordsFromProblem,
  extractWordsFromExplanation,
  extractWordsFromUserQuestion,
} from '@/lib/word-extraction-service';

// ========================================
// POST /api/words/extract - 단어 추출
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

    const body = await request.json();

    if (!body.text || !body.sourceType) {
      return NextResponse.json(
        { error: 'Missing required fields: text, sourceType' },
        { status: 400 }
      );
    }

    let result;

    switch (body.sourceType) {
      case 'PROBLEM':
        result = await extractWordsFromProblem(
          body.sourceId || 'temp',
          body.text,
          body.subjectName
        );
        break;

      case 'EXPLANATION':
        result = await extractWordsFromExplanation(
          body.sourceId || 'temp',
          body.text
        );
        break;

      case 'USER_QUESTION':
        result = await extractWordsFromUserQuestion(
          body.text,
          body.sessionId
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid sourceType. Must be PROBLEM, EXPLANATION, or USER_QUESTION' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to extract words:', error);
    return NextResponse.json(
      { error: 'Failed to extract words' },
      { status: 500 }
    );
  }
}
