import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/crawler/items - List crawled items
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as { role?: string };
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const sourceId = searchParams.get("sourceId");
    const jobId = searchParams.get("jobId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {};
    if (sourceId) where.sourceId = sourceId;
    if (jobId) where.jobId = jobId;
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.crawledItem.findMany({
        where,
        include: {
          source: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.crawledItem.count({ where }),
    ]);

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching items:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}

// POST /api/crawler/items - Import item as problems
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as { id: string; role?: string };
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { itemId, subjectId } = body;

    if (!itemId || !subjectId) {
      return NextResponse.json(
        { error: "itemId and subjectId required" },
        { status: 400 }
      );
    }

    const item = await prisma.crawledItem.findUnique({
      where: { id: itemId },
      include: { source: true },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (!item.parsedData) {
      return NextResponse.json(
        { error: "Item not parsed yet" },
        { status: 400 }
      );
    }

    const parsedData = JSON.parse(item.parsedData);
    const problems = parsedData.problems || [];
    const createdProblemIds: string[] = [];

    for (const p of problems) {
      const problem = await prisma.problem.create({
        data: {
          content: p.content,
          type: p.type,
          options: p.options?.length > 0 ? JSON.stringify(p.options) : null,
          answer: p.answer || '',
          explanation: p.explanation || null,
          gradeLevel: item.grade || 'HIGH_3',
          subjectId,
          difficulty: 'MEDIUM',
          sourceType: item.source?.type || 'OTHER',
          sourceDetail: `${item.source?.name || ''} - ${item.examName || ''} ${item.year || ''}`,
          year: item.year,
          status: 'PENDING',
          reviewStage: 'NONE',
          createdById: user.id,
        },
      });
      createdProblemIds.push(problem.id);
    }

    await prisma.crawledItem.update({
      where: { id: itemId },
      data: {
        status: 'IMPORTED',
        importedProblemIds: JSON.stringify(createdProblemIds),
      },
    });

    return NextResponse.json({
      imported: createdProblemIds.length,
      problemIds: createdProblemIds,
    });
  } catch (error) {
    console.error("Error importing items:", error);
    return NextResponse.json(
      { error: "Failed to import items" },
      { status: 500 }
    );
  }
}
