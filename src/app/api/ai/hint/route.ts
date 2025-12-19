/**
 * AI Hints API
 * 단계별 AI 힌트 제공 (저가 티어)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// 힌트 레벨별 내용
const HINT_LEVELS = {
  1: { name: '첫 번째 힌트', cost: 1, description: '문제 접근 방향 안내' },
  2: { name: '두 번째 힌트', cost: 2, description: '핵심 개념 힌트' },
  3: { name: '세 번째 힌트', cost: 3, description: '풀이 단계 힌트' },
  4: { name: '정답 확인', cost: 5, description: '정답과 간단한 설명' },
};

// POST: AI 힌트 요청
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { problemId, hintLevel = 1 } = await request.json();
    
    if (!problemId) {
      return NextResponse.json({ error: '문제 ID가 필요합니다.' }, { status: 400 });
    }
    
    const level = Math.min(4, Math.max(1, hintLevel));
    const hintConfig = HINT_LEVELS[level as keyof typeof HINT_LEVELS];
    
    // 사용자 크레딧 확인
    let userCredits = await prisma.userCredits.findUnique({
      where: { userId },
    });
    
    if (!userCredits) {
      // 신규 사용자: 무료 크레딧 5개 지급
      userCredits = await prisma.userCredits.create({
        data: {
          userId,
          freeCredits: 5,
          paidCredits: 0,
        },
      });
    }
    
    const totalCredits = userCredits.freeCredits + userCredits.paidCredits;
    
    if (totalCredits < hintConfig.cost) {
      return NextResponse.json(
        { 
          error: '크레딧이 부족합니다.', 
          currentCredits: totalCredits,
          requiredCredits: hintConfig.cost,
          needPurchase: true,
        },
        { status: 402 }
      );
    }
    
    // 문제 조회
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      include: { subject: true, unit: true },
    });
    
    if (!problem) {
      return NextResponse.json({ error: '문제를 찾을 수 없습니다.' }, { status: 404 });
    }
    
    // 힌트 생성 (레벨별)
    const hint = generateHint(problem, level);
    
    // 크레딧 차감 (무료 먼저, 그 다음 유료)
    const freeToUse = Math.min(userCredits.freeCredits, hintConfig.cost);
    const paidToUse = hintConfig.cost - freeToUse;
    
    await prisma.userCredits.update({
      where: { userId },
      data: {
        freeCredits: userCredits.freeCredits - freeToUse,
        paidCredits: userCredits.paidCredits - paidToUse,
      },
    });
    
    // AI 사용 기록
    await prisma.aIUsage.create({
      data: {
        userId,
        type: 'HINT',
        tokensUsed: 50 * level,
        creditsUsed: hintConfig.cost,
      },
    });
    
    return NextResponse.json({
      hint,
      level,
      levelName: hintConfig.name,
      creditsUsed: hintConfig.cost,
      remainingCredits: totalCredits - hintConfig.cost,
      nextLevel: level < 4 ? {
        level: level + 1,
        cost: HINT_LEVELS[(level + 1) as keyof typeof HINT_LEVELS].cost,
        name: HINT_LEVELS[(level + 1) as keyof typeof HINT_LEVELS].name,
      } : null,
    });
  } catch (error) {
    console.error('AI hint error:', error);
    return NextResponse.json(
      { error: '힌트 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// GET: 사용자 크레딧 조회
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    let userCredits = await prisma.userCredits.findUnique({
      where: { userId },
    });
    
    if (!userCredits) {
      userCredits = await prisma.userCredits.create({
        data: {
          userId,
          freeCredits: 5,
          paidCredits: 0,
        },
      });
    }
    
    return NextResponse.json({
      freeCredits: userCredits.freeCredits,
      paidCredits: userCredits.paidCredits,
      totalCredits: userCredits.freeCredits + userCredits.paidCredits,
      hintLevels: HINT_LEVELS,
    });
  } catch (error) {
    console.error('Credits GET error:', error);
    return NextResponse.json(
      { error: '크레딧 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

function generateHint(problem: any, level: number): string {
  // 실제 구현시 AI API 호출
  // 지금은 시뮬레이션 응답
  
  const subject = problem.subject?.displayName || '과목';
  const unit = problem.unit?.name || '단원';
  
  switch (level) {
    case 1:
      return `💡 이 문제는 "${unit}" 단원에서 다루는 개념을 활용해요. 문제에서 주어진 조건을 먼저 정리해볼까요?`;
    case 2:
      return `📚 핵심 개념: 이 문제는 ${subject}의 기본 원리를 적용해야 해요. 공식이나 개념을 떠올려보세요!`;
    case 3:
      return `📝 풀이 방향:\n1. 먼저 주어진 조건을 정리하세요\n2. 관련 공식을 적용하세요\n3. 계산 결과를 확인하세요`;
    case 4:
      return `✅ 정답: ${problem.answer}\n\n💡 간단 설명: ${problem.explanation?.substring(0, 200) || '해설을 참고하세요.'}`;
    default:
      return '힌트를 생성할 수 없습니다.';
  }
}
