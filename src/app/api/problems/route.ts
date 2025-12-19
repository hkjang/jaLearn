import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/problems - List problems with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const subjectId = searchParams.get("subjectId");
    const gradeLevel = searchParams.get("gradeLevel");
    const type = searchParams.get("type");
    const difficulty = searchParams.get("difficulty");
    const status = searchParams.get("status");
    const sourceType = searchParams.get("sourceType");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};
    
    if (search) {
      where.OR = [
        { content: { contains: search } },
        { title: { contains: search } },
      ];
    }
    if (subjectId) where.subjectId = subjectId;
    if (gradeLevel) where.gradeLevel = gradeLevel;
    if (type) where.type = type;
    if (difficulty) where.difficulty = difficulty;
    if (status) where.status = status;
    if (sourceType) where.sourceType = sourceType;

    // Non-admin users can only see approved problems
    const user = session.user as { role?: string };
    if (user.role !== "ADMIN" && user.role !== "TEACHER") {
      where.status = "APPROVED";
    }

    const [problems, total] = await Promise.all([
      prisma.problem.findMany({
        where,
        include: {
          subject: true,
          unit: true,
          source: true,
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          tags: {
            include: { tag: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.problem.count({ where }),
    ]);

    return NextResponse.json({
      problems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching problems:", error);
    return NextResponse.json(
      { error: "Failed to fetch problems" },
      { status: 500 }
    );
  }
}

// POST /api/problems - Create new problem
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only teachers and admins can create problems
    const user = session.user as { id: string; role?: string };
    if (user.role !== "ADMIN" && user.role !== "TEACHER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      content,
      type,
      options,
      answer,
      explanation,
      gradeLevel,
      subjectId,
      unitId,
      difficulty,
      sourceId,
      sourceType,
      sourceDetail,
      year,
      copyright,
      isPublicDomain,
      usageScope,
      tagIds,
    } = body;

    // Validation
    if (!content || !type || !answer || !gradeLevel || !subjectId) {
      return NextResponse.json(
        { error: "Missing required fields: content, type, answer, gradeLevel, subjectId" },
        { status: 400 }
      );
    }

    // Create problem
    const problem = await prisma.problem.create({
      data: {
        title,
        content,
        type,
        options: options ? JSON.stringify(options) : null,
        answer,
        explanation,
        gradeLevel,
        subjectId,
        unitId,
        difficulty: difficulty || "MEDIUM",
        sourceId,
        sourceType,
        sourceDetail,
        year: year ? parseInt(year) : null,
        copyright,
        isPublicDomain: isPublicDomain || false,
        usageScope: usageScope || "LEARNING",
        status: "DRAFT",
        reviewStage: "NONE",
        createdById: user.id,
      },
      include: {
        subject: true,
        unit: true,
        source: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Add tags if provided
    if (tagIds && tagIds.length > 0) {
      await prisma.problemTagMapping.createMany({
        data: tagIds.map((tagId: string) => ({
          problemId: problem.id,
          tagId,
        })),
      });
    }

    // Create initial version
    await prisma.problemVersion.create({
      data: {
        problemId: problem.id,
        version: 1,
        content,
        options: options ? JSON.stringify(options) : null,
        answer,
        explanation,
        changeNote: "Initial creation",
        changedById: user.id,
      },
    });

    // Create audit log
    await prisma.problemAuditLog.create({
      data: {
        problemId: problem.id,
        userId: user.id,
        action: "CREATE",
        details: JSON.stringify({ title, type, gradeLevel, subjectId }),
      },
    });

    return NextResponse.json(problem, { status: 201 });
  } catch (error) {
    console.error("Error creating problem:", error);
    return NextResponse.json(
      { error: "Failed to create problem" },
      { status: 500 }
    );
  }
}
