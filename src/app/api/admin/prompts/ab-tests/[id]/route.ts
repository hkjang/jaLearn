/**
 * A/B 테스트 상세 API
 * 
 * GET: 테스트 상세 및 결과
 * PUT: 테스트 수정 및 상태 변경
 * DELETE: 테스트 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { promptABTestService } from '@/lib/prompt-ab-test-service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ============================================
// GET: A/B 테스트 상세
// ============================================

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await params;
    
    // 결과 분석 포함
    const results = await promptABTestService.analyzeResults(id);
    const significance = await promptABTestService.checkStatisticalSignificance(id);
    
    return NextResponse.json({
      ...results,
      significance,
    });
  } catch (error) {
    console.error('Failed to fetch AB test:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AB test' },
      { status: 500 }
    );
  }
}

// ============================================
// PUT: A/B 테스트 수정 및 상태 변경
// ============================================

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await params;
    const body = await request.json();
    const { action, winnerId, name, description, percentage } = body;
    
    // 상태 변경 액션
    if (action) {
      switch (action) {
        case 'start':
          await promptABTestService.startTest(id);
          return NextResponse.json({ message: 'Test started successfully' });
          
        case 'stop':
          await promptABTestService.stopTest(id);
          return NextResponse.json({ message: 'Test stopped successfully' });
          
        case 'declareWinner':
          await promptABTestService.declareWinner(id, winnerId);
          return NextResponse.json({ message: 'Winner declared successfully' });
          
        default:
          return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }
    }
    
    // 일반 수정
    const updated = await prisma.promptABTest.update({
      where: { id },
      data: {
        name,
        description,
        percentage,
      },
    });
    
    return NextResponse.json({
      ...updated,
      message: 'Test updated successfully',
    });
  } catch (error) {
    console.error('Failed to update AB test:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update AB test' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE: A/B 테스트 삭제
// ============================================

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await params;
    
    // 실행 중인 테스트는 삭제 불가
    const test = await prisma.promptABTest.findUnique({
      where: { id },
    });
    
    if (test?.status === 'RUNNING') {
      return NextResponse.json(
        { error: 'Cannot delete running test. Stop it first.' },
        { status: 400 }
      );
    }
    
    await prisma.promptABTest.delete({
      where: { id },
    });
    
    return NextResponse.json({ message: 'Test deleted successfully' });
  } catch (error) {
    console.error('Failed to delete AB test:', error);
    return NextResponse.json(
      { error: 'Failed to delete AB test' },
      { status: 500 }
    );
  }
}
