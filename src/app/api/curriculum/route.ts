import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/curriculum - List curriculum standards
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const version = searchParams.get("version") || "2022";
    const subjectId = searchParams.get("subjectId");
    const gradeLevel = searchParams.get("gradeLevel");

    const where: Record<string, unknown> = {
      version,
      isActive: true,
    };
    if (subjectId) where.subjectId = subjectId;
    if (gradeLevel) where.gradeLevel = gradeLevel;

    const standards = await prisma.curriculumStandard.findMany({
      where,
      include: {
        subject: {
          select: { id: true, displayName: true },
        },
        _count: {
          select: { mappings: true },
        },
      },
      orderBy: [
        { gradeLevel: "asc" },
        { order: "asc" },
      ],
    });

    return NextResponse.json(standards);
  } catch (error) {
    console.error("Error fetching curriculum:", error);
    return NextResponse.json(
      { error: "Failed to fetch curriculum" },
      { status: 500 }
    );
  }
}

// POST /api/curriculum - Create curriculum standard
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as { role?: string };
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      version,
      subjectId,
      gradeLevel,
      code,
      domain,
      title,
      description,
      keywords,
      order,
    } = body;

    if (!version || !subjectId || !gradeLevel || !code || !title) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const standard = await prisma.curriculumStandard.create({
      data: {
        version,
        subjectId,
        gradeLevel,
        code,
        domain,
        title,
        description,
        keywords: keywords ? JSON.stringify(keywords) : null,
        order: order || 0,
      },
      include: {
        subject: true,
      },
    });

    return NextResponse.json(standard, { status: 201 });
  } catch (error) {
    console.error("Error creating curriculum standard:", error);
    return NextResponse.json(
      { error: "Failed to create curriculum standard" },
      { status: 500 }
    );
  }
}

// PUT /api/curriculum - Batch import curriculum standards
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as { role?: string };
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { standards } = body;

    if (!standards || !Array.isArray(standards)) {
      return NextResponse.json(
        { error: "Standards array required" },
        { status: 400 }
      );
    }

    // Batch upsert
    const results = await Promise.allSettled(
      standards.map(async (std: {
        version: string;
        subjectId: string;
        gradeLevel: string;
        code: string;
        domain?: string;
        title: string;
        description?: string;
        keywords?: string[];
        order?: number;
      }) => {
        return prisma.curriculumStandard.upsert({
          where: { version_code: { version: std.version, code: std.code } },
          update: {
            title: std.title,
            domain: std.domain,
            description: std.description,
            keywords: std.keywords ? JSON.stringify(std.keywords) : null,
            order: std.order || 0,
          },
          create: {
            version: std.version,
            subjectId: std.subjectId,
            gradeLevel: std.gradeLevel,
            code: std.code,
            domain: std.domain,
            title: std.title,
            description: std.description,
            keywords: std.keywords ? JSON.stringify(std.keywords) : null,
            order: std.order || 0,
          },
        });
      })
    );

    const created = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({ created, failed });
  } catch (error) {
    console.error("Error importing curriculum:", error);
    return NextResponse.json(
      { error: "Failed to import curriculum" },
      { status: 500 }
    );
  }
}
