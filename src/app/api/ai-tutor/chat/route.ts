import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { AITutorEngine } from "@/lib/ai-tutor-engine";
import { StudentContext, LearningMemory } from "@/lib/ai-tutor-prompts";

// Create engine instance
const tutorEngine = new AITutorEngine({
  provider: "simulation",
  enableMemory: true,
  enableIntervention: true,
});

// POST - Send message to tutor
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, sessionId, message, subject, topic } = body;

    // Start new session
    if (action === "start") {
      // Get user info
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, gradeLevel: true },
      });

      // Get or create tutor memory
      let memory = await prisma.tutorMemory.findUnique({
        where: { userId: session.user.id },
      });

      if (!memory) {
        memory = await prisma.tutorMemory.create({
          data: {
            userId: session.user.id,
            shortTerm: "{}",
            longTerm: "{}",
          },
        });
      }

      // Build student context
      const studentContext: StudentContext = {
        id: session.user.id,
        name: user?.name || "학생",
        gradeLevel: user?.gradeLevel || "HIGH_1",
        subject: subject || "MATH",
        currentTopic: topic || "일반 학습",
      };

      // Parse learning memory
      let learningMemory: LearningMemory | undefined;
      try {
        const longTerm = JSON.parse(memory.longTerm);
        learningMemory = {
          conceptMastery: longTerm.conceptMastery || {},
          errorPatterns: longTerm.errorPatterns || [],
          questionTypes: longTerm.questionTypes || [],
          averageSolveTime: longTerm.averageSolveTime || 5,
          strengths: memory.strengths ? JSON.parse(memory.strengths) : [],
          weaknesses: memory.weaknesses ? JSON.parse(memory.weaknesses) : [],
          recentTopics: memory.lastTopics ? JSON.parse(memory.lastTopics) : [],
          emotionalState: longTerm.emotionalState,
        };
      } catch {
        // Use default if parsing fails
      }

      // Start session
      const response = await tutorEngine.startSession(
        studentContext,
        learningMemory,
        topic
      );

      // Create DB session
      const dbSession = await prisma.aITutorSession.create({
        data: {
          userId: session.user.id,
          planType: "PRO",
          topic,
          subject,
          gradeLevel: user?.gradeLevel,
          status: "ACTIVE",
        },
      });

      return NextResponse.json({
        success: true,
        sessionId: dbSession.id,
        response,
      });
    }

    // Process message
    if (action === "message" && sessionId && message) {
      // Record user message
      await prisma.tutorMessage.create({
        data: {
          sessionId,
          role: "USER",
          content: message,
        },
      });

      // Get tutor response
      const response = await tutorEngine.processMessage(message);

      // Save tutor response
      await prisma.tutorMessage.create({
        data: {
          sessionId,
          role: "TUTOR",
          content: response.content,
          contentType: response.type,
          metadata: JSON.stringify({
            socraticStep: response.socraticStep,
            suggestedFollowUps: response.suggestedFollowUps,
          }),
        },
      });

      // Update session stats
      await prisma.aITutorSession.update({
        where: { id: sessionId },
        data: {
          messagesCount: { increment: 2 },
        },
      });

      return NextResponse.json({
        success: true,
        response,
      });
    }

    // Get hint
    if (action === "hint" && sessionId) {
      const response = await tutorEngine.provideHint();

      await prisma.tutorMessage.create({
        data: {
          sessionId,
          role: "TUTOR",
          content: response.content,
          contentType: "HINT",
        },
      });

      return NextResponse.json({
        success: true,
        response,
      });
    }

    // End session
    if (action === "end" && sessionId) {
      const response = await tutorEngine.summarizeSession();

      // Update tutor memory
      const dbSession = await prisma.aITutorSession.findUnique({
        where: { id: sessionId },
      });

      if (dbSession) {
        const duration = Math.round(
          (Date.now() - dbSession.startTime.getTime()) / 60000
        );

        await prisma.aITutorSession.update({
          where: { id: sessionId },
          data: {
            status: "COMPLETED",
            endTime: new Date(),
            durationMins: duration,
          },
        });

        // Update memory with recent topic
        await prisma.tutorMemory.upsert({
          where: { userId: session.user.id },
          update: {
            lastTopics: JSON.stringify([
              dbSession.topic,
              ...(await getRecentTopics(session.user.id)),
            ].slice(0, 5)),
          },
          create: {
            userId: session.user.id,
            shortTerm: "{}",
            longTerm: "{}",
            lastTopics: JSON.stringify([dbSession.topic]),
          },
        });
      }

      return NextResponse.json({
        success: true,
        response,
      });
    }

    return NextResponse.json(
      { error: "유효하지 않은 액션입니다." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Tutor chat error:", error);
    return NextResponse.json(
      { error: "처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// Helper function
async function getRecentTopics(userId: string): Promise<string[]> {
  const memory = await prisma.tutorMemory.findUnique({
    where: { userId },
    select: { lastTopics: true },
  });

  if (memory?.lastTopics) {
    try {
      return JSON.parse(memory.lastTopics);
    } catch {
      return [];
    }
  }
  return [];
}
