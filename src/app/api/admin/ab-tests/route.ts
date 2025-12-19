import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET - List A/B tests
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    // Mock A/B tests data
    const tests = [
      {
        id: "ab-001",
        name: "소크라테스 vs 직접 설명",
        description: "소크라테스식 질문과 직접 설명 방식 비교",
        status: "RUNNING",
        startDate: new Date(Date.now() - 7 * 86400000).toISOString(),
        variants: [
          { id: "v1", name: "소크라테스", allocation: 0.5, metrics: { usageCount: 234, avgQualityScore: 0.85 } },
          { id: "v2", name: "직접 설명", allocation: 0.5, metrics: { usageCount: 221, avgQualityScore: 0.78 } },
        ],
      },
      {
        id: "ab-002",
        name: "이모지 사용 여부",
        description: "초등학생 대상 이모지 사용 효과 테스트",
        status: "COMPLETED",
        startDate: new Date(Date.now() - 30 * 86400000).toISOString(),
        endDate: new Date(Date.now() - 14 * 86400000).toISOString(),
        winnerVariantId: "v1",
        variants: [
          { id: "v1", name: "이모지 O", allocation: 0.5, metrics: { usageCount: 1500, avgQualityScore: 0.88 } },
          { id: "v2", name: "이모지 X", allocation: 0.5, metrics: { usageCount: 1480, avgQualityScore: 0.72 } },
        ],
      },
    ];

    return NextResponse.json({ tests });
  } catch (error) {
    console.error("Get A/B tests error:", error);
    return NextResponse.json({ error: "조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// POST - Create A/B test
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, variants, targetAudience } = body;

    if (!name || !variants || variants.length < 2) {
      return NextResponse.json({ error: "테스트명과 2개 이상의 변형이 필요합니다." }, { status: 400 });
    }

    const newTest = {
      id: `ab-${Date.now()}`,
      name,
      description,
      status: "DRAFT",
      variants: variants.map((v: { name: string; promptVersionId: string }, i: number) => ({
        id: `v${i + 1}`,
        name: v.name,
        promptVersionId: v.promptVersionId,
        allocation: 1 / variants.length,
        metrics: { usageCount: 0, avgQualityScore: 0 },
      })),
      targetAudience: targetAudience || {},
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, test: newTest });
  } catch (error) {
    console.error("Create A/B test error:", error);
    return NextResponse.json({ error: "생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// PUT - Update A/B test (start, stop, finish)
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const body = await request.json();
    const { testId, action } = body;

    if (!testId || !action) {
      return NextResponse.json({ error: "테스트 ID와 액션이 필요합니다." }, { status: 400 });
    }

    switch (action) {
      case "start":
        return NextResponse.json({ success: true, message: "테스트가 시작되었습니다.", status: "RUNNING" });
      case "stop":
        return NextResponse.json({ success: true, message: "테스트가 중단되었습니다.", status: "STOPPED" });
      case "finish":
        return NextResponse.json({ success: true, message: "테스트가 완료되었습니다.", status: "COMPLETED" });
      default:
        return NextResponse.json({ error: "유효하지 않은 액션입니다." }, { status: 400 });
    }
  } catch (error) {
    console.error("Update A/B test error:", error);
    return NextResponse.json({ error: "업데이트 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// DELETE - Delete A/B test
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const testId = searchParams.get("testId");

    if (!testId) {
      return NextResponse.json({ error: "테스트 ID가 필요합니다." }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `테스트 ${testId} 삭제됨` });
  } catch (error) {
    console.error("Delete A/B test error:", error);
    return NextResponse.json({ error: "삭제 중 오류가 발생했습니다." }, { status: 500 });
  }
}
