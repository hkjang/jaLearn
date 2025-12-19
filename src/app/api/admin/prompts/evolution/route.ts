/**
 * 프롬프트 진화 히스토리 API
 * 
 * GET: 진화 히스토리 조회
 * POST: 진화 요청 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { promptPerformanceService } from '@/lib/prompt-performance-service';

// ============================================
// GET: 진화 히스토리 조회
// ============================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('assetId');
    const status = searchParams.get('status');
    
    const where: Record<string, unknown> = {};
    if (assetId) where.assetId = assetId;
    if (status) where.status = status;
    
    const evolutions = await prisma.promptEvolution.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    
    return NextResponse.json(evolutions);
  } catch (error) {
    console.error('Failed to fetch evolution history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch evolution history' },
      { status: 500 }
    );
  }
}

// ============================================
// POST: 진화 요청 생성 (AI 개선안)
// ============================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { versionId, triggerType = 'AI_SUGGESTED' } = body;
    
    if (!versionId) {
      return NextResponse.json({ error: 'versionId is required' }, { status: 400 });
    }
    
    // 버전 정보 조회
    const version = await prisma.promptVersion.findUnique({
      where: { id: versionId },
      include: { asset: true },
    });
    
    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }
    
    // AI 개선안 생성
    const suggestion = await promptPerformanceService.generateImprovementSuggestion(versionId);
    
    // KPI 조회
    const kpi = await promptPerformanceService.calculateKPI(versionId);
    
    // 진화 히스토리 생성
    const evolution = await prisma.promptEvolution.create({
      data: {
        assetId: version.assetId,
        triggerType,
        triggerReason: suggestion,
        beforeVersionId: versionId,
        scoreBefore: kpi.qualityScore,
        status: 'PENDING',
      },
    });
    
    return NextResponse.json({
      ...evolution,
      suggestion,
      message: 'Evolution request created successfully',
    });
  } catch (error) {
    console.error('Failed to create evolution request:', error);
    return NextResponse.json(
      { error: 'Failed to create evolution request' },
      { status: 500 }
    );
  }
}
