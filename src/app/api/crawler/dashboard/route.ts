import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: 수집 대시보드 통계 데이터
export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 오늘 수집된 항목 수
    const todayItems = await prisma.crawledItem.count({
      where: {
        createdAt: { gte: today },
      },
    });
    
    // 오늘 추출된 문제 수
    const todayProblems = await prisma.crawledItem.aggregate({
      where: {
        createdAt: { gte: today },
        problemCount: { not: null },
      },
      _sum: {
        problemCount: true,
      },
    });
    
    // 전체 성공/실패 비율
    const itemsByStatus = await prisma.crawledItem.groupBy({
      by: ['status'],
      _count: { id: true },
    });
    
    const successCount = itemsByStatus.find(s => s.status === 'IMPORTED')?._count.id || 0;
    const failedCount = itemsByStatus.find(s => s.status === 'FAILED')?._count.id || 0;
    const totalCount = itemsByStatus.reduce((sum, s) => sum + s._count.id, 0);
    const successRate = totalCount > 0 ? (successCount / totalCount * 100) : 0;
    
    // OCR 평균 정확도
    const ocrStats = await prisma.crawledItem.aggregate({
      where: {
        ocrConfidence: { not: null },
      },
      _avg: {
        ocrConfidence: true,
      },
    });
    const avgOcrAccuracy = (ocrStats._avg.ocrConfidence || 0) * 100;
    
    // 검수 대기 항목 수
    const pendingReview = await prisma.reviewQueue.count({
      where: {
        status: 'PENDING',
      },
    });
    
    // 최근 실패 원인 TOP 5
    const recentErrors = await prisma.crawlLog.findMany({
      where: {
        level: 'ERROR',
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    
    const errorCounts: Record<string, number> = {};
    recentErrors.forEach(log => {
      const action = log.action || 'UNKNOWN';
      errorCounts[action] = (errorCounts[action] || 0) + 1;
    });
    
    const topErrors = Object.entries(errorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));
    
    // 소스별 상태
    const sources = await prisma.collectionSource.findMany({
      include: {
        _count: {
          select: {
            items: true,
            jobs: true,
          },
        },
      },
    });
    
    const sourceStats = sources.map(source => {
      const latestError = recentErrors.filter(e => 
        e.details?.includes(source.id)
      ).length;
      
      let status: 'normal' | 'warning' | 'blocked' = 'normal';
      if (!source.isActive) status = 'blocked';
      else if (latestError > 5) status = 'warning';
      
      return {
        id: source.id,
        name: source.name,
        type: source.type,
        grade: source.grade,
        isActive: source.isActive,
        itemCount: source._count.items,
        jobCount: source._count.jobs,
        status,
      };
    });
    
    // 실행 중인 작업
    const runningJobs = await prisma.crawlJob.findMany({
      where: { status: 'RUNNING' },
      include: {
        source: { select: { name: true } },
      },
      orderBy: { startedAt: 'desc' },
    });
    
    // 최근 완료된 작업
    const recentJobs = await prisma.crawlJob.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        source: { select: { name: true } },
      },
    });

    return NextResponse.json({
      kpi: {
        todayItems,
        todayProblems: todayProblems._sum.problemCount || 0,
        successRate: Math.round(successRate * 10) / 10,
        avgOcrAccuracy: Math.round(avgOcrAccuracy * 10) / 10,
        pendingReview,
        runningJobs: runningJobs.length,
      },
      topErrors,
      sourceStats,
      runningJobs,
      recentJobs,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
