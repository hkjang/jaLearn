import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: 검수 대기 목록
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "PENDING";
    const reviewType = searchParams.get("type");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sortBy = searchParams.get("sortBy") || "priority";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const where: Record<string, unknown> = {
      status,
    };

    if (reviewType) {
      where.reviewType = reviewType;
    }

    const [items, total] = await Promise.all([
      prisma.reviewQueue.findMany({
        where,
        include: {
          item: {
            include: {
              source: {
                select: { name: true, grade: true },
              },
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.reviewQueue.count({ where }),
    ]);

    // 통계
    const stats = await prisma.reviewQueue.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const typeStats = await prisma.reviewQueue.groupBy({
      by: ['reviewType'],
      where: { status: 'PENDING' },
      _count: { id: true },
    });

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        byStatus: stats.reduce((acc, s) => ({ ...acc, [s.status]: s._count.id }), {}),
        byType: typeStats.reduce((acc, s) => ({ ...acc, [s.reviewType]: s._count.id }), {}),
      },
    });
  } catch (error) {
    console.error("Review queue GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch review queue" },
      { status: 500 }
    );
  }
}

// POST: 검수 항목 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, reviewType, priority, notes, confidence } = body;

    if (!itemId || !reviewType) {
      return NextResponse.json(
        { error: "itemId and reviewType are required" },
        { status: 400 }
      );
    }

    // 이미 검수 대기 중인지 확인
    const existing = await prisma.reviewQueue.findFirst({
      where: {
        itemId,
        status: { in: ['PENDING', 'IN_REVIEW'] },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Item is already in review queue" },
        { status: 409 }
      );
    }

    const reviewItem = await prisma.reviewQueue.create({
      data: {
        itemId,
        reviewType,
        priority: priority || 0,
        notes,
        confidence,
      },
      include: {
        item: true,
      },
    });

    return NextResponse.json(reviewItem, { status: 201 });
  } catch (error) {
    console.error("Review queue POST error:", error);
    return NextResponse.json(
      { error: "Failed to create review item" },
      { status: 500 }
    );
  }
}

// PUT: 검수 결과 저장 / 담당자 할당
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, assignedTo, notes } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await prisma.reviewQueue.update({
      where: { id },
      data: updateData,
      include: {
        item: true,
      },
    });

    // 승인 시 CrawledItem 상태도 업데이트
    if (status === 'APPROVED') {
      await prisma.crawledItem.update({
        where: { id: updated.itemId },
        data: { status: 'IMPORTED' },
      });
    } else if (status === 'REJECTED') {
      await prisma.crawledItem.update({
        where: { id: updated.itemId },
        data: { status: 'FAILED' },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Review queue PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update review item" },
      { status: 500 }
    );
  }
}

// DELETE: 검수 항목 삭제
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

    await prisma.reviewQueue.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Review queue DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete review item" },
      { status: 500 }
    );
  }
}
