/**
 * Challenge API
 * 친구 대결 챌린지 시스템
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// POST: 챌린지 생성
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }
    
    const challengerId = session.user.id;
    const { challengedId, problemCount = 5, unitId, action, challengeId } = await request.json();
    
    // 챌린지 수락/거절
    if (action === 'respond') {
      const challenge = await prisma.challenge.findUnique({
        where: { id: challengeId },
      });
      
      if (!challenge || challenge.challengedId !== challengerId) {
        return NextResponse.json({ error: '챌린지를 찾을 수 없습니다.' }, { status: 404 });
      }
      
      if (action === 'accept') {
        await prisma.challenge.update({
          where: { id: challengeId },
          data: { status: 'ACTIVE' },
        });
        return NextResponse.json({ success: true, status: 'ACTIVE' });
      } else {
        await prisma.challenge.update({
          where: { id: challengeId },
          data: { status: 'DECLINED' },
        });
        return NextResponse.json({ success: true, status: 'DECLINED' });
      }
    }
    
    if (!challengedId) {
      return NextResponse.json({ error: '상대방 ID가 필요합니다.' }, { status: 400 });
    }
    
    if (challengerId === challengedId) {
      return NextResponse.json({ error: '자기 자신과 대결할 수 없습니다.' }, { status: 400 });
    }
    
    // 문제 선택
    const whereClause: any = {
      status: 'APPROVED',
    };
    
    if (unitId) {
      whereClause.unitId = unitId;
    }
    
    const problems = await prisma.problem.findMany({
      where: whereClause,
      take: problemCount,
      orderBy: { usageCount: 'asc' },
    });
    
    if (problems.length < problemCount) {
      return NextResponse.json(
        { error: '문제가 부족합니다. 다른 단원을 선택하세요.' },
        { status: 400 }
      );
    }
    
    // 만료 시간 (24시간)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    const challenge = await prisma.challenge.create({
      data: {
        challengerId,
        challengedId,
        problemIds: JSON.stringify(problems.map((p) => p.id)),
        status: 'PENDING',
        expiresAt,
      },
    });
    
    // 상대방에게 알림 전송
    await prisma.notification.create({
      data: {
        userId: challengedId,
        type: 'CHALLENGE',
        title: '새로운 대결 요청!',
        message: `${session.user.name || '친구'}님이 대결을 신청했어요!`,
        link: `/challenge/${challenge.id}`,
      },
    });
    
    return NextResponse.json({
      success: true,
      challengeId: challenge.id,
      expiresAt,
      problemCount: problems.length,
    });
  } catch (error) {
    console.error('Challenge create error:', error);
    return NextResponse.json(
      { error: '챌린지 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// GET: 내 챌린지 목록
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    const whereClause: any = {
      OR: [
        { challengerId: userId },
        { challengedId: userId },
      ],
    };
    
    if (status) {
      whereClause.status = status;
    }
    
    const challenges = await prisma.challenge.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        challenger: { select: { id: true, name: true, image: true } },
        challenged: { select: { id: true, name: true, image: true } },
      },
    });
    
    return NextResponse.json({
      challenges: challenges.map((c) => ({
        id: c.id,
        status: c.status,
        challenger: c.challenger,
        challenged: c.challenged,
        challengerScore: c.challengerScore,
        challengedScore: c.challengedScore,
        winnerId: c.winnerId,
        problemCount: JSON.parse(c.problemIds).length,
        expiresAt: c.expiresAt,
        createdAt: c.createdAt,
        isMyChallenge: c.challengerId === userId,
      })),
    });
  } catch (error) {
    console.error('Challenge list error:', error);
    return NextResponse.json(
      { error: '챌린지 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PUT: 챌린지 결과 제출
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { challengeId, score } = await request.json();
    
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });
    
    if (!challenge) {
      return NextResponse.json({ error: '챌린지를 찾을 수 없습니다.' }, { status: 404 });
    }
    
    if (challenge.status !== 'ACTIVE') {
      return NextResponse.json({ error: '진행 중인 챌린지가 아닙니다.' }, { status: 400 });
    }
    
    // 점수 업데이트
    const isChallenger = challenge.challengerId === userId;
    const updateData: any = {};
    
    if (isChallenger) {
      updateData.challengerScore = score;
    } else {
      updateData.challengedScore = score;
    }
    
    await prisma.challenge.update({
      where: { id: challengeId },
      data: updateData,
    });
    
    // 양쪽 모두 완료했는지 확인
    const updated = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });
    
    if (updated && updated.challengerScore > 0 && updated.challengedScore > 0) {
      // 승자 결정
      let winnerId = null;
      if (updated.challengerScore > updated.challengedScore) {
        winnerId = updated.challengerId;
      } else if (updated.challengedScore > updated.challengerScore) {
        winnerId = updated.challengedId;
      }
      
      await prisma.challenge.update({
        where: { id: challengeId },
        data: {
          status: 'COMPLETED',
          winnerId,
        },
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Challenge result error:', error);
    return NextResponse.json(
      { error: '결과 제출 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
