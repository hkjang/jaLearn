import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/problems/review - Get problems pending review
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

    const { searchParams } = new URL(request.url);
    const stage = searchParams.get("stage") || "NONE";

    const problems = await prisma.problem.findMany({
      where: {
        status: "PENDING",
        reviewStage: stage,
      },
      include: {
        subject: true,
        createdBy: {
          select: { id: true, name: true },
        },
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(problems);
  } catch (error) {
    console.error("Error fetching review queue:", error);
    return NextResponse.json(
      { error: "Failed to fetch review queue" },
      { status: 500 }
    );
  }
}

// POST /api/problems/review - Submit review
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
    const { problemId, stage, status, comments, score, issues } = body;

    if (!problemId || !stage || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create review record
    const review = await prisma.problemReview.create({
      data: {
        problemId,
        reviewerId: user.id,
        stage,
        status,
        comments,
        score,
        issues: issues ? JSON.stringify(issues) : null,
      },
    });

    // Determine next stage
    let nextStage = stage;
    let problemStatus = "PENDING";

    if (status === "APPROVED") {
      if (stage === "AUTO") nextStage = "AI";
      else if (stage === "AI") nextStage = "MANUAL";
      else if (stage === "MANUAL") {
        nextStage = "APPROVED";
        problemStatus = "APPROVED";
      }
    } else if (status === "REJECTED") {
      problemStatus = "REJECTED";
    }

    // Update problem
    await prisma.problem.update({
      where: { id: problemId },
      data: {
        reviewStage: nextStage,
        status: problemStatus,
        qualityScore: score,
      },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error("Error submitting review:", error);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}
