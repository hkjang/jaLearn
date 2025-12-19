import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { crawlPage } from "@/lib/crawler/crawler-engine";
import { fetchRobotsTxt } from "@/lib/crawler/robots-parser";

// POST: 테스트 크롤링 (샘플 1건)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceId, url } = body;

    if (!sourceId && !url) {
      return NextResponse.json(
        { error: "sourceId or url is required" },
        { status: 400 }
      );
    }

    let targetUrl = url;
    let source = null;

    // 소스 ID가 있으면 해당 소스의 URL 사용
    if (sourceId) {
      source = await prisma.collectionSource.findUnique({
        where: { id: sourceId },
      });
      if (!source) {
        return NextResponse.json(
          { error: "Source not found" },
          { status: 404 }
        );
      }
      targetUrl = source.baseUrl;
    }

    const startTime = Date.now();

    // 1. robots.txt 확인
    const robotsResult = await fetchRobotsTxt(targetUrl);
    
    // robots.txt 결과에서 disallow 경로 추출
    const disallowedPaths: string[] = [];
    if (robotsResult) {
      robotsResult.rules.forEach(rule => {
        disallowedPaths.push(...rule.disallowPaths);
      });
    }
    
    const robotsInfo = {
      exists: robotsResult !== null && robotsResult.rules.length > 0,
      isAllowed: robotsResult 
        ? robotsResult.isAllowed(new URL(targetUrl).pathname) 
        : true,
      crawlDelay: robotsResult?.getCrawlDelay() || null,
      disallowedPaths: [...new Set(disallowedPaths)].slice(0, 10),
    };

    // 2. 테스트 크롤링 실행
    const crawlResult = await crawlPage(targetUrl);

    const elapsedMs = Date.now() - startTime;

    // 3. 결과 생성
    const result = {
      success: crawlResult.success,
      url: targetUrl,
      elapsedMs,
      robots: robotsInfo,
      page: crawlResult.success ? {
        title: crawlResult.title,
        linksFound: crawlResult.links.length,
        fileLinksFound: crawlResult.fileLinks.length,
        fileLinks: crawlResult.fileLinks.slice(0, 20), // 최대 20개
        sampleLinks: crawlResult.links.slice(0, 10), // 샘플 링크
      } : null,
      error: crawlResult.error || null,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Test crawl error:", error);
    return NextResponse.json(
      { error: "Test crawl failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
