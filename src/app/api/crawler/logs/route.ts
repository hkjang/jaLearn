import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: 로그 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "100");
    const level = searchParams.get("level");
    const action = searchParams.get("action");
    const jobId = searchParams.get("jobId");

    const where: Record<string, unknown> = {};
    if (level) where.level = level;
    if (action) where.action = action;
    if (jobId) where.jobId = jobId;

    const [logs, total] = await Promise.all([
      prisma.crawlLog.findMany({
        where,
        include: {
          job: {
            include: {
              source: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.crawlLog.count({ where }),
    ]);

    // 최신순으로 가져왔으므로 역순으로 반환 (화면에서는 오래된 것이 위에)
    return NextResponse.json({
      logs: logs.reverse(),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Logs GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}

// POST: 로그 생성 (내부용)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, level, action, message, details, url } = body;

    if (!jobId || !level || !action || !message) {
      return NextResponse.json(
        { error: "jobId, level, action, message are required" },
        { status: 400 }
      );
    }

    const log = await prisma.crawlLog.create({
      data: {
        jobId,
        level,
        action,
        message,
        details: details ? JSON.stringify(details) : null,
        url,
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error("Logs POST error:", error);
    return NextResponse.json(
      { error: "Failed to create log" },
      { status: 500 }
    );
  }
}

// DELETE: 오래된 로그 정리
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daysOld = parseInt(searchParams.get("daysOld") || "30");

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.crawlLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error("Logs DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete logs" },
      { status: 500 }
    );
  }
}
