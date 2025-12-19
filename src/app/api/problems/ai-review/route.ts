import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reviewProblem } from "@/lib/ai-reviewer";

// POST /api/problems/ai-review - Perform AI review on a problem
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as { id: string; role?: string };
    if (user.role !== "ADMIN" && user.role !== "TEACHER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { problemId, autoApply = false } = body;

    if (!problemId) {
      return NextResponse.json(
        { error: "Problem ID required" },
        { status: 400 }
      );
    }

    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
    });

    if (!problem) {
      return NextResponse.json(
        { error: "Problem not found" },
        { status: 404 }
      );
    }

    // Perform AI review
    const reviewResult = reviewProblem({
      content: problem.content,
      type: problem.type,
      options: problem.options,
      answer: problem.answer,
      explanation: problem.explanation,
      difficulty: problem.difficulty,
    });

    // Create review record
    const review = await prisma.problemReview.create({
      data: {
        problemId,
        reviewerId: user.id,
        stage: "AI",
        status: reviewResult.recommendedAction === "APPROVE" ? "APPROVED" : 
                reviewResult.recommendedAction === "REJECT" ? "REJECTED" : "NEEDS_REVISION",
        comments: `AI 검수 결과: ${reviewResult.detectedIssues.join(', ') || '문제 없음'}`,
        score: reviewResult.overallConfidence * 100,
        issues: JSON.stringify({
          issues: reviewResult.detectedIssues,
          warnings: reviewResult.reviewWarnings,
          qualityChecks: reviewResult.qualityChecks,
        }),
      },
    });

    // Auto-apply if requested and conditions met
    if (autoApply && reviewResult.recommendedAction === "APPROVE") {
      await prisma.problem.update({
        where: { id: problemId },
        data: {
          reviewStage: "MANUAL", // Move to manual review
          // Update explanation if generated
          ...(reviewResult.generatedExplanation && !problem.explanation ? {
            explanation: reviewResult.generatedExplanation,
          } : {}),
        },
      });
    } else if (autoApply && reviewResult.recommendedAction === "REJECT") {
      await prisma.problem.update({
        where: { id: problemId },
        data: {
          status: "REJECTED",
        },
      });
    }

    return NextResponse.json({
      review: reviewResult,
      reviewRecord: review,
    });
  } catch (error) {
    console.error("Error performing AI review:", error);
    return NextResponse.json(
      { error: "Failed to perform AI review" },
      { status: 500 }
    );
  }
}

// GET /api/problems/ai-review - Batch AI review for pending problems
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as { id: string; role?: string };
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    // Get problems pending AI review
    const pendingProblems = await prisma.problem.findMany({
      where: {
        status: "PENDING",
        reviewStage: "AUTO", // After auto validation, before AI
      },
      take: limit,
      orderBy: { createdAt: "asc" },
    });

    const results = [];

    for (const problem of pendingProblems) {
      const reviewResult = reviewProblem({
        content: problem.content,
        type: problem.type,
        options: problem.options,
        answer: problem.answer,
        explanation: problem.explanation,
        difficulty: problem.difficulty,
      });

      // Create review record
      await prisma.problemReview.create({
        data: {
          problemId: problem.id,
          reviewerId: user.id,
          stage: "AI",
          status: reviewResult.recommendedAction === "APPROVE" ? "APPROVED" : 
                  reviewResult.recommendedAction === "REJECT" ? "REJECTED" : "NEEDS_REVISION",
          comments: `[배치 AI 검수] ${reviewResult.detectedIssues.join(', ') || '문제 없음'}`,
          score: reviewResult.overallConfidence * 100,
          issues: JSON.stringify({
            issues: reviewResult.detectedIssues,
            warnings: reviewResult.reviewWarnings,
          }),
        },
      });

      // Update problem stage
      const nextStage = reviewResult.recommendedAction === "REJECT" ? "NONE" : "AI";
      await prisma.problem.update({
        where: { id: problem.id },
        data: {
          reviewStage: nextStage,
          status: reviewResult.recommendedAction === "REJECT" ? "REJECTED" : "PENDING",
        },
      });

      results.push({
        problemId: problem.id,
        recommendedAction: reviewResult.recommendedAction,
        issues: reviewResult.detectedIssues.length,
      });
    }

    return NextResponse.json({
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("Error batch AI review:", error);
    return NextResponse.json(
      { error: "Failed to batch AI review" },
      { status: 500 }
    );
  }
}
