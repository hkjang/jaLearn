import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateQualityScores } from "@/lib/quality-scorer";

// POST /api/problems/quality - Calculate and update quality scores
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as { role?: string };
    if (user.role !== "ADMIN" && user.role !== "TEACHER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { problemId, batchAll = false } = body;

    if (batchAll) {
      // Batch calculate for all approved problems
      const problems = await prisma.problem.findMany({
        where: { status: "APPROVED" },
        include: {
          source: {
            select: { grade: true, trustScore: true },
          },
        },
      });

      let updated = 0;
      for (const problem of problems) {
        const scores = calculateQualityScores({
          content: problem.content,
          answer: problem.answer,
          options: problem.options,
          explanation: problem.explanation,
          type: problem.type,
          difficulty: problem.difficulty,
          gradeLevel: problem.gradeLevel,
          usageCount: problem.usageCount,
          correctRate: problem.correctRate,
          source: problem.source,
        });

        await prisma.problem.update({
          where: { id: problem.id },
          data: {
            qualityScore: scores.overallScore,
            accuracyScore: scores.accuracyScore,
            clarityScore: scores.clarityScore,
            difficultyFit: scores.difficultyFit,
            trustScore: scores.trustScore,
          },
        });
        updated++;
      }

      return NextResponse.json({ success: true, updated });
    }

    // Single problem
    if (!problemId) {
      return NextResponse.json(
        { error: "Problem ID required" },
        { status: 400 }
      );
    }

    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      include: {
        source: {
          select: { grade: true, trustScore: true },
        },
      },
    });

    if (!problem) {
      return NextResponse.json(
        { error: "Problem not found" },
        { status: 404 }
      );
    }

    const scores = calculateQualityScores({
      content: problem.content,
      answer: problem.answer,
      options: problem.options,
      explanation: problem.explanation,
      type: problem.type,
      difficulty: problem.difficulty,
      gradeLevel: problem.gradeLevel,
      usageCount: problem.usageCount,
      correctRate: problem.correctRate,
      source: problem.source,
    });

    const updated = await prisma.problem.update({
      where: { id: problemId },
      data: {
        qualityScore: scores.overallScore,
        accuracyScore: scores.accuracyScore,
        clarityScore: scores.clarityScore,
        difficultyFit: scores.difficultyFit,
        trustScore: scores.trustScore,
      },
    });

    return NextResponse.json({
      scores,
      problem: updated,
    });
  } catch (error) {
    console.error("Error calculating quality:", error);
    return NextResponse.json(
      { error: "Failed to calculate quality" },
      { status: 500 }
    );
  }
}

// GET /api/problems/quality - Get quality distribution stats
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

    // Get score distributions
    const problems = await prisma.problem.findMany({
      where: {
        status: "APPROVED",
        qualityScore: { not: null },
      },
      select: {
        qualityScore: true,
        accuracyScore: true,
        clarityScore: true,
        difficultyFit: true,
        trustScore: true,
      },
    });

    // Calculate distribution buckets
    const buckets = {
      excellent: 0, // 90-100
      good: 0,      // 70-89
      average: 0,   // 50-69
      poor: 0,      // 30-49
      veryPoor: 0,  // 0-29
    };

    for (const p of problems) {
      const score = p.qualityScore || 0;
      if (score >= 90) buckets.excellent++;
      else if (score >= 70) buckets.good++;
      else if (score >= 50) buckets.average++;
      else if (score >= 30) buckets.poor++;
      else buckets.veryPoor++;
    }

    // Calculate averages
    const avgScores = {
      overall: 0,
      accuracy: 0,
      clarity: 0,
      difficultyFit: 0,
      trust: 0,
    };

    if (problems.length > 0) {
      avgScores.overall = problems.reduce((sum, p) => sum + (p.qualityScore || 0), 0) / problems.length;
      avgScores.accuracy = problems.reduce((sum, p) => sum + (p.accuracyScore || 0), 0) / problems.length;
      avgScores.clarity = problems.reduce((sum, p) => sum + (p.clarityScore || 0), 0) / problems.length;
      avgScores.difficultyFit = problems.reduce((sum, p) => sum + (p.difficultyFit || 0), 0) / problems.length;
      avgScores.trust = problems.reduce((sum, p) => sum + (p.trustScore || 0), 0) / problems.length;
    }

    return NextResponse.json({
      total: problems.length,
      distribution: buckets,
      averages: avgScores,
    });
  } catch (error) {
    console.error("Error getting quality stats:", error);
    return NextResponse.json(
      { error: "Failed to get quality stats" },
      { status: 500 }
    );
  }
}
