import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/problems/dashboard - Get problem bank dashboard stats
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as { role?: string };
    if (user.role !== "ADMIN" && user.role !== "TEACHER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Basic counts
    const [
      totalProblems,
      approvedProblems,
      pendingProblems,
      rejectedProblems,
      archivedProblems,
    ] = await Promise.all([
      prisma.problem.count(),
      prisma.problem.count({ where: { status: "APPROVED" } }),
      prisma.problem.count({ where: { status: "PENDING" } }),
      prisma.problem.count({ where: { status: "REJECTED" } }),
      prisma.problem.count({ where: { status: "ARCHIVED" } }),
    ]);

    // By source grade
    const sourceGradeStats = await prisma.problemSource.groupBy({
      by: ["grade"],
      _count: { id: true },
    });

    const gradeDistribution: Record<string, number> = {
      A: 0, B: 0, C: 0, D: 0, E: 0,
    };
    sourceGradeStats.forEach((s) => {
      gradeDistribution[s.grade] = s._count.id;
    });

    // Quality score distribution
    const qualityStats = await prisma.problem.aggregate({
      where: { qualityScore: { not: null } },
      _avg: { qualityScore: true },
      _min: { qualityScore: true },
      _max: { qualityScore: true },
      _count: { qualityScore: true },
    });

    // Copyright alerts - expiring contracts
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const expiringContracts = await prisma.sourceContract.findMany({
      where: {
        isActive: true,
        endDate: {
          not: null,
          lte: thirtyDaysLater,
        },
      },
      include: {
        source: { select: { id: true, name: true, grade: true } },
      },
      orderBy: { endDate: "asc" },
      take: 10,
    });

    const expiredContracts = await prisma.sourceContract.findMany({
      where: {
        isActive: true,
        endDate: {
          not: null,
          lt: now,
        },
      },
      include: {
        source: { select: { id: true, name: true } },
      },
    });

    // Review stage distribution
    const reviewStageStats = await prisma.problem.groupBy({
      by: ["reviewStage"],
      _count: { id: true },
      where: { status: "PENDING" },
    });

    const reviewStages: Record<string, number> = {
      NONE: 0, AUTO: 0, AI: 0, MANUAL: 0,
    };
    reviewStageStats.forEach((s) => {
      reviewStages[s.reviewStage] = s._count.id;
    });

    // Recent activity
    const recentProblems = await prisma.problem.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        content: true,
        status: true,
        createdAt: true,
        subject: { select: { displayName: true } },
      },
    });

    // Subject distribution
    const subjectStats = await prisma.problem.groupBy({
      by: ["subjectId"],
      _count: { id: true },
      where: { status: { not: "ARCHIVED" } },
    });

    const subjects = await prisma.subject.findMany({
      select: { id: true, displayName: true },
    });

    const subjectDistribution = subjectStats.map((s) => ({
      subject: subjects.find((sub) => sub.id === s.subjectId)?.displayName || "Unknown",
      count: s._count.id,
    }));

    return NextResponse.json({
      overview: {
        total: totalProblems,
        approved: approvedProblems,
        pending: pendingProblems,
        rejected: rejectedProblems,
        archived: archivedProblems,
      },
      sourceGrades: gradeDistribution,
      quality: {
        average: qualityStats._avg.qualityScore || 0,
        min: qualityStats._min.qualityScore || 0,
        max: qualityStats._max.qualityScore || 0,
        scored: qualityStats._count.qualityScore,
      },
      copyrightAlerts: {
        expiring: expiringContracts.map((c) => ({
          id: c.id,
          sourceName: c.source.name,
          endDate: c.endDate,
          daysLeft: c.endDate ? Math.ceil((c.endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)) : null,
        })),
        expired: expiredContracts.map((c) => ({
          id: c.id,
          sourceName: c.source.name,
          endDate: c.endDate,
        })),
      },
      reviewStages,
      recentProblems: recentProblems.map((p) => ({
        id: p.id,
        title: p.title || p.content.substring(0, 50) + "...",
        subject: p.subject?.displayName,
        status: p.status,
        createdAt: p.createdAt,
      })),
      subjectDistribution,
    });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard" },
      { status: 500 }
    );
  }
}
