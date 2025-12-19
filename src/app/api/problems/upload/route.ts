import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseProblemsFromText, validateProblems } from "@/lib/document-parser";

// POST /api/problems/upload - Parse and preview problems from text
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
    const { 
      text, 
      gradeLevel, 
      subjectId, 
      sourceType, 
      sourceId,
      autoSave = false 
    } = body;

    if (!text) {
      return NextResponse.json(
        { error: "Text content is required" },
        { status: 400 }
      );
    }

    // Parse problems from text
    const parseResult = parseProblemsFromText(text);
    
    // Validate parsed problems
    const { valid, invalid } = validateProblems(parseResult.problems);

    // If autoSave is true and we have valid problems, save them
    let savedProblems: { id: string }[] = [];
    if (autoSave && valid.length > 0 && gradeLevel && subjectId) {
      savedProblems = await Promise.all(
        valid.map(async (parsed) => {
          const problem = await prisma.problem.create({
            data: {
              content: parsed.content,
              type: parsed.type,
              options: parsed.options ? JSON.stringify(parsed.options) : null,
              answer: parsed.answer || "",
              explanation: parsed.explanation,
              gradeLevel,
              subjectId,
              sourceType,
              sourceId,
              status: "DRAFT",
              reviewStage: "NONE",
              createdById: user.id,
            },
          });

          // Create initial version
          await prisma.problemVersion.create({
            data: {
              problemId: problem.id,
              version: 1,
              content: parsed.content,
              options: parsed.options ? JSON.stringify(parsed.options) : null,
              answer: parsed.answer || "",
              explanation: parsed.explanation,
              changeNote: "Imported from document",
              changedById: user.id,
            },
          });

          // Create audit log
          await prisma.problemAuditLog.create({
            data: {
              problemId: problem.id,
              userId: user.id,
              action: "CREATE",
              details: JSON.stringify({ source: "upload", type: parsed.type }),
            },
          });

          return problem;
        })
      );
    }

    return NextResponse.json({
      success: parseResult.success,
      parsed: {
        total: parseResult.problems.length,
        valid: valid.length,
        invalid: invalid.length,
      },
      preview: valid.slice(0, 10).map((p, index) => ({
        index,
        content: p.content.substring(0, 200) + (p.content.length > 200 ? "..." : ""),
        type: p.type,
        optionsCount: p.options?.length || 0,
        hasAnswer: !!p.answer,
        hasExplanation: !!p.explanation,
      })),
      invalid: invalid.slice(0, 5).map((i) => ({
        content: i.problem.content.substring(0, 100),
        reason: i.reason,
      })),
      saved: savedProblems.length,
      savedIds: savedProblems.map((p) => p.id),
      errors: parseResult.errors,
    });
  } catch (error) {
    console.error("Error parsing problems:", error);
    return NextResponse.json(
      { error: "Failed to parse problems" },
      { status: 500 }
    );
  }
}
