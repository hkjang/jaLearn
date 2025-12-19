import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateComprehensiveSimilarity, findSimilarProblems } from "@/lib/similarity-detector";

// POST /api/problems/similarity - Find similar problems
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
    const { content, compareToId, threshold = 0.5, limit = 20 } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // If comparing to specific problem
    if (compareToId) {
      const compareProblem = await prisma.problem.findUnique({
        where: { id: compareToId },
        select: { content: true },
      });

      if (!compareProblem) {
        return NextResponse.json(
          { error: "Compare problem not found" },
          { status: 404 }
        );
      }

      const similarity = calculateComprehensiveSimilarity(content, compareProblem.content);
      return NextResponse.json({ similarity });
    }

    // Find similar problems from database
    const existingProblems = await prisma.problem.findMany({
      where: { status: { not: "ARCHIVED" } },
      select: { id: true, content: true },
      take: 500, // Limit for performance
    });

    const similarProblems = findSimilarProblems(content, existingProblems, threshold);

    // Get additional details for top matches
    const topMatches = await Promise.all(
      similarProblems.slice(0, limit).map(async (match) => {
        const problem = await prisma.problem.findUnique({
          where: { id: match.id },
          select: {
            id: true,
            title: true,
            content: true,
            type: true,
            difficulty: true,
            gradeLevel: true,
            status: true,
            subject: { select: { displayName: true } },
          },
        });
        return {
          problem,
          similarity: match.similarity,
        };
      })
    );

    return NextResponse.json({
      total: similarProblems.length,
      matches: topMatches,
    });
  } catch (error) {
    console.error("Error finding similar problems:", error);
    return NextResponse.json(
      { error: "Failed to find similar problems" },
      { status: 500 }
    );
  }
}
