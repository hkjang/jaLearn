import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { classifyProblem } from "@/lib/problem-classifier";

// POST /api/problems/classify - Auto-classify a problem
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
    const { content, checkDuplicates = true } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Get existing problems for duplicate check
    let existingProblems: { id: string; content: string }[] = [];
    if (checkDuplicates) {
      existingProblems = await prisma.problem.findMany({
        where: { status: { not: "ARCHIVED" } },
        select: { id: true, content: true },
        take: 500, // Limit for performance
      });
    }

    // Run classification
    const result = await classifyProblem(content, existingProblems);

    // Map subject code to subject ID if found
    let suggestedSubjectId: string | null = null;
    if (result.suggestedSubject) {
      const subjectMapping: Record<string, string> = {
        math: '?òÌïô',
        korean: 'Íµ?ñ¥',
        english: '?ÅÏñ¥',
        science: 'Í≥ºÌïô',
        social: '?¨Ìöå',
      };
      
      const subjectName = subjectMapping[result.suggestedSubject];
      if (subjectName) {
        const subject = await prisma.subject.findFirst({
          where: { 
            OR: [
              { name: { contains: subjectName } },
              { displayName: { contains: subjectName } },
            ]
          },
        });
        if (subject) {
          suggestedSubjectId = subject.id;
        }
      }
    }

    return NextResponse.json({
      classification: {
        ...result,
        suggestedSubjectId,
      },
    });
  } catch (error) {
    console.error("Error classifying problem:", error);
    return NextResponse.json(
      { error: "Failed to classify problem" },
      { status: 500 }
    );
  }
}
