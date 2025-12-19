import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// POST - Start a new tutor session
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
    const { planType, topic, subject, gradeLevel } = body;

    // Validate plan type
    const validPlanTypes = ["PRO", "ELITE", "TIME"];
    if (!validPlanTypes.includes(planType)) {
      return NextResponse.json(
        { error: "유효하지 않은 플랜입니다." },
        { status: 400 }
      );
    }

    // Check if user has active subscription for this plan type
    // (simplified - in production, check against AITutorPlan subscription)

    // Create new session
    const tutorSession = await prisma.aITutorSession.create({
      data: {
        userId: session.user.id,
        planType,
        topic,
        subject,
        gradeLevel,
        status: "ACTIVE",
      },
    });

    // Get or create tutor memory
    let tutorMemory = await prisma.tutorMemory.findUnique({
      where: { userId: session.user.id },
    });

    if (!tutorMemory) {
      tutorMemory = await prisma.tutorMemory.create({
        data: {
          userId: session.user.id,
          shortTerm: JSON.stringify({ recentContext: [] }),
          longTerm: JSON.stringify({ patterns: [], achievements: [] }),
        },
      });
    }

    return NextResponse.json({
      success: true,
      session: tutorSession,
      memory: {
        ...tutorMemory,
        shortTerm: JSON.parse(tutorMemory.shortTerm),
        longTerm: JSON.parse(tutorMemory.longTerm),
        preferences: tutorMemory.preferences ? JSON.parse(tutorMemory.preferences) : null,
      },
    });
  } catch (error) {
    console.error("Start session error:", error);
    return NextResponse.json(
      { error: "세션 시작 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// GET - Get active session and history
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (sessionId) {
      // Get specific session with messages
      const tutorSession = await prisma.aITutorSession.findUnique({
        where: { id: sessionId },
        include: {
          messages: { orderBy: { createdAt: "asc" } },
        },
      });

      if (!tutorSession || tutorSession.userId !== session.user.id) {
        return NextResponse.json(
          { error: "세션을 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      return NextResponse.json(tutorSession);
    }

    // Get recent sessions
    const sessions = await prisma.aITutorSession.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Get active session if any
    const activeSession = sessions.find((s) => s.status === "ACTIVE");

    return NextResponse.json({
      activeSession,
      recentSessions: sessions,
    });
  } catch (error) {
    console.error("Get sessions error:", error);
    return NextResponse.json(
      { error: "조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PUT - Update session (end, pause, add message)
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sessionId, action, message, rating, feedback } = body;

    const tutorSession = await prisma.aITutorSession.findUnique({
      where: { id: sessionId },
    });

    if (!tutorSession || tutorSession.userId !== session.user.id) {
      return NextResponse.json(
        { error: "세션을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (action === "end") {
      // Calculate duration and cost
      const startTime = new Date(tutorSession.startTime);
      const endTime = new Date();
      const durationMins = Math.ceil((endTime.getTime() - startTime.getTime()) / 60000);
      
      // Calculate cost for TIME plan
      let cost = 0;
      if (tutorSession.planType === "TIME") {
        cost = durationMins * 500; // ₩500/min
      }

      const updated = await prisma.aITutorSession.update({
        where: { id: sessionId },
        data: {
          status: "COMPLETED",
          endTime,
          durationMins,
          cost,
          rating,
          feedback,
        },
      });

      return NextResponse.json({ success: true, session: updated });
    }

    if (action === "pause") {
      const updated = await prisma.aITutorSession.update({
        where: { id: sessionId },
        data: { status: "PAUSED" },
      });

      return NextResponse.json({ success: true, session: updated });
    }

    if (action === "resume") {
      const updated = await prisma.aITutorSession.update({
        where: { id: sessionId },
        data: { status: "ACTIVE" },
      });

      return NextResponse.json({ success: true, session: updated });
    }

    if (action === "message" && message) {
      // Add message to session
      const newMessage = await prisma.tutorMessage.create({
        data: {
          sessionId,
          role: message.role,
          content: message.content,
          contentType: message.contentType || "TEXT",
          tokensUsed: message.tokensUsed || 0,
          isIntervention: message.isIntervention || false,
        },
      });

      // Update session message count
      await prisma.aITutorSession.update({
        where: { id: sessionId },
        data: {
          messagesCount: { increment: 1 },
          tokensUsed: { increment: message.tokensUsed || 0 },
        },
      });

      return NextResponse.json({ success: true, message: newMessage });
    }

    return NextResponse.json(
      { error: "유효하지 않은 액션입니다." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Update session error:", error);
    return NextResponse.json(
      { error: "업데이트 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
