/**
 * A/B 테스트 CRUD API
 * 
 * GET: 테스트 목록 조회
 * POST: 새 테스트 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { promptABTestService } from '@/lib/prompt-ab-test-service';

// ============================================
// GET: A/B 테스트 목록 조회
// ============================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    
    const tests = await prisma.promptABTest.findMany({
      where,
      include: {
        variants: {
          select: {
            id: true,
            name: true,
            allocation: true,
            impressions: true,
            conversions: true,
            avgScore: true,
          },
        },
        _count: {
          select: { assignments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json(tests);
  } catch (error) {
    console.error('Failed to fetch AB tests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AB tests' },
      { status: 500 }
    );
  }
}

// ============================================
// POST: 새 A/B 테스트 생성
// ============================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { name, description, targetGrades, targetSubjects, sampleSize, percentage, variants } = body;
    
    // 필수 필드 검증
    if (!name || !variants || variants.length < 2) {
      return NextResponse.json(
        { error: 'name and at least 2 variants are required' },
        { status: 400 }
      );
    }
    
    const result = await promptABTestService.createTest({
      name,
      description,
      targetGrades,
      targetSubjects,
      sampleSize,
      percentage,
      variants,
    });
    
    return NextResponse.json({
      ...result,
      message: 'AB test created successfully',
    });
  } catch (error) {
    console.error('Failed to create AB test:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create AB test' },
      { status: 500 }
    );
  }
}
