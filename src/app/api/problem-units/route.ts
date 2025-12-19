import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/problem-units - List units by subject/grade
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");
    const gradeLevel = searchParams.get("gradeLevel");

    const where: Record<string, unknown> = {};
    if (subjectId) where.subjectId = subjectId;
    if (gradeLevel) where.gradeLevel = gradeLevel;

    const units = await prisma.problemUnit.findMany({
      where,
      include: {
        subject: true,
        parent: true,
        _count: {
          select: { problems: true, children: true },
        },
      },
      orderBy: [{ chapter: "asc" }, { section: "asc" }, { order: "asc" }],
    });

    return NextResponse.json(units);
  } catch (error) {
    console.error("Error fetching units:", error);
    return NextResponse.json(
      { error: "Failed to fetch units" },
      { status: 500 }
    );
  }
}

// POST /api/problem-units - Create new unit
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
    const { name, code, subjectId, gradeLevel, chapter, section, parentId, order } = body;

    if (!name || !subjectId || !gradeLevel) {
      return NextResponse.json(
        { error: "Missing required fields: name, subjectId, gradeLevel" },
        { status: 400 }
      );
    }

    const unit = await prisma.problemUnit.create({
      data: {
        name,
        code,
        subjectId,
        gradeLevel,
        chapter: chapter ? parseInt(chapter) : null,
        section: section ? parseInt(section) : null,
        parentId,
        order: order || 0,
      },
      include: {
        subject: true,
        parent: true,
      },
    });

    return NextResponse.json(unit, { status: 201 });
  } catch (error) {
    console.error("Error creating unit:", error);
    return NextResponse.json(
      { error: "Failed to create unit" },
      { status: 500 }
    );
  }
}
