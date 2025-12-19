import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: 배치 작업 목록
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [batches, total] = await Promise.all([
      prisma.collectionBatch.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.collectionBatch.count({ where }),
    ]);

    // 소스 정보 추가
    const batchesWithSources = await Promise.all(
      batches.map(async (batch) => {
        const sourceIds = JSON.parse(batch.sourceIds || '[]');
        const sources = await prisma.collectionSource.findMany({
          where: { id: { in: sourceIds } },
          select: { id: true, name: true, type: true },
        });
        return { ...batch, sources };
      })
    );

    return NextResponse.json({
      batches: batchesWithSources,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Batch GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch batches" },
      { status: 500 }
    );
  }
}

// POST: 배치 작업 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      sourceIds,
      schedule,
      isNightMode,
      priority,
      filters,
    } = body;

    if (!name || !sourceIds || sourceIds.length === 0) {
      return NextResponse.json(
        { error: "name and sourceIds are required" },
        { status: 400 }
      );
    }

    // 다음 실행 시간 계산 (야간 모드면 22:00)
    let nextRunAt: Date | null = null;
    if (schedule || isNightMode) {
      nextRunAt = new Date();
      if (isNightMode) {
        nextRunAt.setHours(22, 0, 0, 0);
        if (nextRunAt < new Date()) {
          nextRunAt.setDate(nextRunAt.getDate() + 1);
        }
      }
    }

    const batch = await prisma.collectionBatch.create({
      data: {
        name,
        description,
        sourceIds: JSON.stringify(sourceIds),
        schedule,
        isNightMode: isNightMode || false,
        priority: priority || 0,
        filters: filters ? JSON.stringify(filters) : null,
        nextRunAt,
      },
    });

    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    console.error("Batch POST error:", error);
    return NextResponse.json(
      { error: "Failed to create batch" },
      { status: 500 }
    );
  }
}

// PUT: 배치 작업 수정
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, priority, action } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};

    // 상태 변경
    if (status) {
      updateData.status = status;
      if (status === 'RUNNING') {
        updateData.lastRunAt = new Date();
      }
    }

    // 우선순위 변경
    if (priority !== undefined) {
      updateData.priority = priority;
    }

    // 액션 처리
    if (action === 'pause') {
      updateData.status = 'PAUSED';
    } else if (action === 'resume') {
      updateData.status = 'QUEUED';
    } else if (action === 'run') {
      updateData.status = 'QUEUED';
      updateData.priority = 100; // 즉시 실행을 위한 높은 우선순위
    }

    const batch = await prisma.collectionBatch.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(batch);
  } catch (error) {
    console.error("Batch PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update batch" },
      { status: 500 }
    );
  }
}

// DELETE: 배치 작업 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    await prisma.collectionBatch.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Batch DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete batch" },
      { status: 500 }
    );
  }
}
