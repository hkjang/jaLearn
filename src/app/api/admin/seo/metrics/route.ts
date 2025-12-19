/**
 * SEO Metrics Dashboard API
 * SEO 메트릭스 대시보드 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper function to safely execute queries
async function safeQuery<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await query();
  } catch (error) {
    console.warn("Query failed (table may not exist):", error);
    return fallback;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d'; // 7d, 30d, 90d
    
    // 기간 계산
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // 문제 통계 - 이 모델들은 존재해야 함
    const totalProblems = await safeQuery(() => prisma.problem.count(), 0);
    const approvedProblems = await safeQuery(() => prisma.problem.count({ where: { status: 'APPROVED' } }), 0);
    
    const problemsByGrade = await safeQuery(
      () => prisma.problem.groupBy({
        by: ['gradeLevel'],
        where: { status: 'APPROVED' },
        _count: true,
      }),
      []
    );
    
    const problemsBySubject = await safeQuery(
      () => prisma.problem.groupBy({
        by: ['subjectId'],
        where: { status: 'APPROVED' },
        _count: true,
      }),
      []
    );
    
    const recentlyAdded = await safeQuery(
      () => prisma.problem.findMany({
        where: {
          status: 'APPROVED',
          createdAt: { gte: startDate },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          subject: { select: { displayName: true } },
          unit: { select: { name: true } },
        },
      }),
      []
    );
    
    // 새 SEO 모델들 - 아직 마이그레이션 안됐을 수 있음
    const sitemapEntries = await safeQuery(
      () => prisma.sitemapEntry.count({ where: { isActive: true } }),
      0
    );
    
    // 과목 정보 조회
    const subjects = await safeQuery(() => prisma.subject.findMany(), []);
    const subjectMap: Record<string, string> = {};
    subjects.forEach(s => {
      subjectMap[s.id] = s.displayName;
    });
    
    // 색인률 계산
    const indexRate = totalProblems > 0 
      ? Math.round((approvedProblems / totalProblems) * 100 * 10) / 10 
      : 0;
    
    // SEO 메트릭스 조회 (있는 경우)
    const seoMetrics = await safeQuery(
      () => prisma.sEOMetrics.findMany({
        where: { date: { gte: startDate } },
        orderBy: { date: 'desc' },
        take: 100,
      }),
      []
    );
    
    // 집계
    const totalImpressions = seoMetrics.reduce((sum: number, m: { impressions: number }) => sum + m.impressions, 0);
    const totalClicks = seoMetrics.reduce((sum: number, m: { clicks: number }) => sum + m.clicks, 0);
    const avgCTR = totalImpressions > 0 
      ? Math.round((totalClicks / totalImpressions) * 100 * 10) / 10 
      : 0;
    
    // 키워드 랭킹 조회
    const topKeywords = await safeQuery(
      () => prisma.keywordRanking.findMany({
        where: { date: { gte: startDate } },
        orderBy: { clicks: 'desc' },
        take: 20,
      }),
      []
    );
    
    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalProblems,
          approvedProblems,
          indexRate,
          sitemapEntries,
          totalImpressions,
          totalClicks,
          avgCTR,
        },
        problemsByGrade: problemsByGrade.map((g: { gradeLevel: string; _count: number }) => ({
          gradeLevel: g.gradeLevel,
          count: g._count,
        })),
        problemsBySubject: problemsBySubject.map((s: { subjectId: string; _count: number }) => ({
          subjectId: s.subjectId,
          subjectName: subjectMap[s.subjectId] || s.subjectId,
          count: s._count,
        })),
        recentlyAdded: recentlyAdded.map((p: { id: string; title: string | null; subject: { displayName: string }; unit: { name: string } | null; createdAt: Date }) => ({
          id: p.id,
          title: p.title,
          subject: p.subject.displayName,
          unit: p.unit?.name,
          createdAt: p.createdAt,
        })),
        topKeywords: topKeywords.map((k: { keyword: string; path: string; position: number | null; impressions: number; clicks: number }) => ({
          keyword: k.keyword,
          path: k.path,
          position: k.position,
          impressions: k.impressions,
          clicks: k.clicks,
        })),
        period,
      },
    });
  } catch (error) {
    console.error('SEO Metrics API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch SEO metrics' },
      { status: 500 }
    );
  }
}

// POST: 메트릭스 데이터 수동 업데이트 (Google Search Console 연동용)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metrics } = body;
    
    if (!Array.isArray(metrics)) {
      return NextResponse.json(
        { success: false, error: 'metrics must be an array' },
        { status: 400 }
      );
    }
    
    // 메트릭스 일괄 등록
    for (const m of metrics) {
      await prisma.sEOMetrics.create({
        data: {
          path: m.path,
          date: m.date ? new Date(m.date) : new Date(),
          impressions: m.impressions || 0,
          clicks: m.clicks || 0,
          ctr: m.ctr,
          avgPosition: m.avgPosition,
          bounceRate: m.bounceRate,
          avgTimeOnPage: m.avgTimeOnPage,
        },
      });
    }
    
    return NextResponse.json({
      success: true,
      message: `${metrics.length} metrics recorded`,
    });
  } catch (error) {
    console.error('SEO Metrics POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record metrics' },
      { status: 500 }
    );
  }
}
