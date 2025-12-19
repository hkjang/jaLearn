import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET - List all prompt versions
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    // Check admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
    }

    // For now, return mock data since we don't have the table yet
    // In production, this would query a PromptVersion table
    const versions = [
      {
        id: "v1.0.0",
        version: "1.0.0",
        name: "기본 소크라테스 튜터",
        description: "소크라테스식 질문 기반 기본 튜터 프롬프트",
        isActive: true,
        isDefault: true,
        createdAt: new Date().toISOString(),
        metrics: {
          usageCount: 1250,
          avgQualityScore: 0.85,
          avgSatisfaction: 4.2,
        },
      },
      {
        id: "v1.1.0",
        version: "1.1.0",
        name: "감정 인식 튜터",
        description: "학생 감정 상태 인식 강화 버전",
        isActive: false,
        isDefault: false,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        metrics: {
          usageCount: 450,
          avgQualityScore: 0.88,
          avgSatisfaction: 4.5,
        },
      },
      {
        id: "v1.2.0-beta",
        version: "1.2.0-beta",
        name: "멀티모달 튜터 (베타)",
        description: "이미지/수식 인식 추가",
        isActive: false,
        isDefault: false,
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        metrics: {
          usageCount: 120,
          avgQualityScore: 0.75,
          avgSatisfaction: 3.8,
        },
      },
    ];

    return NextResponse.json({ versions });
  } catch (error) {
    console.error("Get prompt versions error:", error);
    return NextResponse.json({ error: "조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// POST - Create new prompt version
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
    const { version, name, description, systemPrompt, subjectPrompts } = body;

    // Validation
    if (!version || !name || !systemPrompt) {
      return NextResponse.json({ error: "필수 항목을 입력해주세요." }, { status: 400 });
    }

    // In production, save to database
    const newVersion = {
      id: `v${version}`,
      version,
      name,
      description,
      systemPrompt,
      subjectPrompts: subjectPrompts || {},
      isActive: false,
      isDefault: false,
      createdAt: new Date().toISOString(),
      createdBy: session.user.id,
    };

    return NextResponse.json({ success: true, version: newVersion });
  } catch (error) {
    console.error("Create prompt version error:", error);
    return NextResponse.json({ error: "생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// PUT - Update prompt version (activate, deactivate)
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
    const { versionId, action, updates } = body;

    if (!versionId) {
      return NextResponse.json({ error: "버전 ID가 필요합니다." }, { status: 400 });
    }

    if (action === "activate") {
      // Activate this version (deactivate others)
      return NextResponse.json({ 
        success: true, 
        message: `버전 ${versionId} 활성화됨`,
      });
    }

    if (action === "deactivate") {
      return NextResponse.json({ 
        success: true, 
        message: `버전 ${versionId} 비활성화됨`,
      });
    }

    if (action === "rollback") {
      return NextResponse.json({ 
        success: true, 
        message: `버전 ${versionId}로 롤백됨`,
      });
    }

    if (action === "update" && updates) {
      return NextResponse.json({ 
        success: true, 
        message: "버전 업데이트됨",
        updates,
      });
    }

    return NextResponse.json({ error: "유효하지 않은 액션입니다." }, { status: 400 });
  } catch (error) {
    console.error("Update prompt version error:", error);
    return NextResponse.json({ error: "업데이트 중 오류가 발생했습니다." }, { status: 500 });
  }
}

// DELETE - Delete prompt version
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
    const versionId = searchParams.get("versionId");

    if (!versionId) {
      return NextResponse.json({ error: "버전 ID가 필요합니다." }, { status: 400 });
    }

    // In production, soft delete from database
    return NextResponse.json({ 
      success: true, 
      message: `버전 ${versionId} 삭제됨`,
    });
  } catch (error) {
    console.error("Delete prompt version error:", error);
    return NextResponse.json({ error: "삭제 중 오류가 발생했습니다." }, { status: 500 });
  }
}
