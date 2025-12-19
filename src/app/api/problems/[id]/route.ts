import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/problems/[id] - Get single problem
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const problem = await prisma.problem.findUnique({
      where: { id },
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
        reviews: {
          include: {
            reviewer: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        versions: {
          orderBy: { version: "desc" },
          take: 5,
        },
        variants: true,
      },
    });

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    // Non-admin users can only see approved problems
    const user = session.user as { id: string; role?: string };
    if (
      problem.status !== "APPROVED" &&
      user.role !== "ADMIN" &&
      user.role !== "TEACHER" &&
      problem.createdById !== user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Log view access
    await prisma.problemAuditLog.create({
      data: {
        problemId: id,
        userId: user.id,
        action: "VIEW",
      },
    });

    // Increment usage count
    await prisma.problem.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });

    return NextResponse.json(problem);
  } catch (error) {
    console.error("Error fetching problem:", error);
    return NextResponse.json(
      { error: "Failed to fetch problem" },
      { status: 500 }
    );
  }
}

// PUT /api/problems/[id] - Update problem
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as { id: string; role?: string };
    if (user.role !== "ADMIN" && user.role !== "TEACHER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const existingProblem = await prisma.problem.findUnique({
      where: { id },
    });

    if (!existingProblem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

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
      status,
      tagIds,
      changeNote,
    } = body;

    // Update problem
    const problem = await prisma.problem.update({
      where: { id },
      data: {
        title,
        content,
        type,
        options: options ? JSON.stringify(options) : undefined,
        answer,
        explanation,
        gradeLevel,
        subjectId,
        unitId,
        difficulty,
        sourceId,
        sourceType,
        sourceDetail,
        year: year ? parseInt(year) : undefined,
        copyright,
        isPublicDomain,
        usageScope,
        status,
      },
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
    });

    // Update tags if provided
    if (tagIds) {
      await prisma.problemTagMapping.deleteMany({
        where: { problemId: id },
      });
      if (tagIds.length > 0) {
        await prisma.problemTagMapping.createMany({
          data: tagIds.map((tagId: string) => ({
            problemId: id,
            tagId,
          })),
        });
      }
    }

    // Create new version if content changed
    if (content !== existingProblem.content || answer !== existingProblem.answer) {
      const lastVersion = await prisma.problemVersion.findFirst({
        where: { problemId: id },
        orderBy: { version: "desc" },
      });

      await prisma.problemVersion.create({
        data: {
          problemId: id,
          version: (lastVersion?.version || 0) + 1,
          content: content || existingProblem.content,
          options: options ? JSON.stringify(options) : existingProblem.options,
          answer: answer || existingProblem.answer,
          explanation: explanation || existingProblem.explanation,
          changeNote: changeNote || "Updated",
          changedById: user.id,
        },
      });
    }

    // Create audit log
    await prisma.problemAuditLog.create({
      data: {
        problemId: id,
        userId: user.id,
        action: "UPDATE",
        details: JSON.stringify({ changedFields: Object.keys(body) }),
      },
    });

    return NextResponse.json(problem);
  } catch (error) {
    console.error("Error updating problem:", error);
    return NextResponse.json(
      { error: "Failed to update problem" },
      { status: 500 }
    );
  }
}

// DELETE /api/problems/[id] - Soft delete (archive) problem
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as { id: string; role?: string };
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const existingProblem = await prisma.problem.findUnique({
      where: { id },
    });

    if (!existingProblem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    // Soft delete by setting status to ARCHIVED
    await prisma.problem.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });

    // Create audit log
    await prisma.problemAuditLog.create({
      data: {
        problemId: id,
        userId: user.id,
        action: "DELETE",
        details: JSON.stringify({ previousStatus: existingProblem.status }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting problem:", error);
    return NextResponse.json(
      { error: "Failed to delete problem" },
      { status: 500 }
    );
  }
}
