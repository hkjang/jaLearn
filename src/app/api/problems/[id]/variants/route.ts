import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/problems/[id]/variants - Get variants for a problem
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

    const variants = await prisma.problemVariant.findMany({
      where: { originalId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(variants);
  } catch (error) {
    console.error("Error fetching variants:", error);
    return NextResponse.json(
      { error: "Failed to fetch variants" },
      { status: 500 }
    );
  }
}

// POST /api/problems/[id]/variants - Generate a variant
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as { role?: string };
    if (user.role !== "ADMIN" && user.role !== "TEACHER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { type, options: variantOptions } = body;

    // Get original problem
    const original = await prisma.problem.findUnique({
      where: { id },
    });

    if (!original) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    let variantContent = original.content;
    let variantOptionsJson = original.options;
    let variantAnswer = original.answer;
    let variantDifficulty = original.difficulty;

    // Generate variant based on type
    switch (type) {
      case "NUMERIC":
        // Replace numbers with variations
        if (variantOptions?.numericRange) {
          const [min, max] = variantOptions.numericRange;
          variantContent = variantContent.replace(/\d+/g, () => {
            const variation = Math.floor(Math.random() * (max - min + 1)) + min;
            return String(variation);
          });
        }
        break;

      case "OPTION_ORDER":
        // Shuffle options
        if (original.options) {
          const parsedOptions = JSON.parse(original.options) as string[];
          const answerIndex = parsedOptions.findIndex(
            (opt) => opt === original.answer || 
                     parsedOptions.indexOf(opt).toString() === original.answer
          );
          
          // Fisher-Yates shuffle
          for (let i = parsedOptions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [parsedOptions[i], parsedOptions[j]] = [parsedOptions[j], parsedOptions[i]];
          }
          
          variantOptionsJson = JSON.stringify(parsedOptions);
          
          // Update answer to new position if it was a letter/number
          if (answerIndex >= 0) {
            const newIndex = parsedOptions.findIndex(
              (opt) => opt === original.answer
            );
            if (newIndex >= 0) {
              // Convert to circled number or letter
              const answerMap = ['①', '②', '③', '④', '⑤'];
              variantAnswer = answerMap[newIndex] || String(newIndex + 1);
            }
          }
        }
        break;

      case "DIFFICULTY":
        // Adjust difficulty
        if (variantOptions?.difficultyAdjust === "EASIER") {
          // Add hints
          variantContent = variantContent + "\n\n[힌트] 문제를 단계별로 접근해보세요.";
          variantDifficulty = original.difficulty === "HIGH" ? "MEDIUM" : "LOW";
        } else if (variantOptions?.difficultyAdjust === "HARDER") {
          // Remove hints, add constraints
          variantContent = variantContent.replace(/\[힌트\].*$/gm, "");
          variantContent = variantContent + "\n\n(추가 조건: 풀이 과정을 자세히 서술하시오.)";
          variantDifficulty = original.difficulty === "LOW" ? "MEDIUM" : "HIGH";
        }
        break;
    }

    // Create variant
    const variant = await prisma.problemVariant.create({
      data: {
        originalId: id,
        type,
        content: variantContent,
        options: variantOptionsJson,
        answer: variantAnswer,
        difficulty: variantDifficulty,
        generatedBy: "MANUAL",
      },
    });

    return NextResponse.json(variant, { status: 201 });
  } catch (error) {
    console.error("Error creating variant:", error);
    return NextResponse.json(
      { error: "Failed to create variant" },
      { status: 500 }
    );
  }
}
