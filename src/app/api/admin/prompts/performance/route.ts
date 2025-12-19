/**
 * 프롬프트 성능 메트릭스 API
 * 
 * GET: 성능 대시보드 데이터
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { promptPerformanceService } from '@/lib/prompt-performance-service';

// ============================================
// GET: 성능 메트릭스 대시보드
// ============================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const versionId = searchParams.get('versionId');
    const days = parseInt(searchParams.get('days') || '7');
    
    // 특정 버전 KPI
    if (versionId) {
      const kpi = await promptPerformanceService.calculateKPI(versionId, days);
      return NextResponse.json(kpi);
    }
    
    // 전체 대시보드 데이터
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // 저성능 프롬프트 알림
    const lowPerformers = await promptPerformanceService.detectLowPerformers();
    
    // 최근 성능 데이터
    const recentPerformance = await prisma.promptPerformance.findMany({
      where: {
        date: { gte: startDate },
      },
      include: {
        version: {
          include: {
            asset: { select: { name: true, level: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
      take: 50,
    });
    
    // 전체 통계
    const totalUsage = await prisma.promptUsageLog.count({
      where: { createdAt: { gte: startDate } },
    });
    
    const feedbackLogs = await prisma.promptUsageLog.findMany({
      where: {
        createdAt: { gte: startDate },
        userFeedback: { not: null },
      },
      select: { userFeedback: true },
    });
    
    const avgSatisfaction = feedbackLogs.length > 0
      ? feedbackLogs.reduce((sum, l) => sum + (l.userFeedback || 0), 0) / feedbackLogs.length
      : 0;
    
    const reaskedCount = await prisma.promptUsageLog.count({
      where: {
        createdAt: { gte: startDate },
        reasked: true,
      },
    });
    
    const requestionRate = totalUsage > 0 ? reaskedCount / totalUsage : 0;
    
    return NextResponse.json({
      period: `${days}days`,
      summary: {
        totalUsage,
        avgSatisfaction,
        requestionRate,
        lowPerformerCount: lowPerformers.length,
      },
      lowPerformers,
      recentPerformance: recentPerformance.map(p => ({
        ...p,
        assetName: p.version?.asset?.name,
        assetLevel: p.version?.asset?.level,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    );
  }
}
