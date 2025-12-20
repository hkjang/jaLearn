/**
 * Word Context API - AI 튜터 단어 컨텍스트 제공
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  buildWordContext,
  analyzeAndRecommend,
  detectWordQuestion,
} from '@/lib/word-tutor-integration';
import { prisma } from '@/lib/prisma';

// ========================================
// GET /api/ai-tutor/word-context - 학생 단어 컨텍스트 조회
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
    const includeRecommendation = searchParams.get('recommend') === 'true';
    const subject = searchParams.get('subject') || undefined;

    // 기본 단어 컨텍스트
    const wordContext = await buildWordContext(userId);

    // 추천 분석 포함
    let recommendation = null;
    if (includeRecommendation) {
      recommendation = await analyzeAndRecommend(userId, { subject });
    }

    return NextResponse.json({
      wordContext,
      recommendation,
    });
  } catch (error) {
    console.error('Failed to get word context:', error);
    return NextResponse.json(
      { error: 'Failed to get word context' },
      { status: 500 }
    );
  }
}

// ========================================
// POST /api/ai-tutor/word-context - 메시지 단어 분석
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

    if (!body.message) {
      return NextResponse.json(
        { error: 'Missing required field: message' },
        { status: 400 }
      );
    }

    // 메시지에서 단어 질문 감지
    const detection = await detectWordQuestion(body.message, userId);

    // 감지된 단어에 대한 상세 정보 조회
    let wordDetails = null;
    if (detection.isWordQuestion && detection.detectedWords.length > 0) {
      const existingWord = detection.detectedWords.find(w => w.exists);
      
      if (existingWord?.wordId) {
        const word = await prisma.word.findUnique({
          where: { id: existingWord.wordId },
          include: {
            subjects: { include: { subject: true } },
            definitions: true,
            relatedWords: {
              include: { targetWord: true },
              take: 5,
            },
            examples: { take: 3 },
          },
        });

        if (word) {
          wordDetails = {
            id: word.id,
            term: word.term,
            definition: word.definition,
            simpleDefinition: word.simpleDefinition,
            subjects: word.subjects.map(ws => ws.subject.displayName),
            relatedWords: word.relatedWords.map(r => ({
              term: r.targetWord.term,
              type: r.relationType,
            })),
            examples: word.examples.map(e => e.sentence),
            gradeDefinitions: word.definitions,
          };
        }
      }
    }

    return NextResponse.json({
      isWordQuestion: detection.isWordQuestion,
      detectedWords: detection.detectedWords,
      wordDetails,
      suggestWordQuiz: detection.isWordQuestion && wordDetails !== null,
    });
  } catch (error) {
    console.error('Failed to analyze message:', error);
    return NextResponse.json(
      { error: 'Failed to analyze message' },
      { status: 500 }
    );
  }
}
