import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET - List all prompt versions
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "濡쒓렇?몄씠 ?꾩슂?⑸땲??" }, { status: 401 });
    }

    // Check admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "愿由ъ옄 沅뚰븳???꾩슂?⑸땲??" }, { status: 403 });
    }

    // For now, return mock data since we don't have the table yet
    // In production, this would query a PromptVersion table
    const versions = [
      {
        id: "v1.0.0",
        version: "1.0.0",
        name: "湲곕낯 ?뚰겕?쇳뀒???쒗꽣",
        description: "?뚰겕?쇳뀒?ㅼ떇 吏덈Ц 湲곕컲 湲곕낯 ?쒗꽣 ?꾨＼?꾪듃",
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
        name: "媛먯젙 ?몄떇 ?쒗꽣",
        description: "?숈깮 媛먯젙 ?곹깭 ?몄떇 媛뺥솕 踰꾩쟾",
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
        name: "硫?곕え???쒗꽣 (踰좏?)",
        description: "?대?吏/?섏떇 ?몄떇 異붽?",
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
    return NextResponse.json({ error: "議고쉶 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." }, { status: 500 });
  }
}

// POST - Create new prompt version
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "濡쒓렇?몄씠 ?꾩슂?⑸땲??" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "愿由ъ옄 沅뚰븳???꾩슂?⑸땲??" }, { status: 403 });
    }

    const body = await request.json();
    const { version, name, description, systemPrompt, subjectPrompts } = body;

    // Validation
    if (!version || !name || !systemPrompt) {
      return NextResponse.json({ error: "?꾩닔 ??ぉ???낅젰?댁＜?몄슂." }, { status: 400 });
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
    return NextResponse.json({ error: "?앹꽦 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." }, { status: 500 });
  }
}

// PUT - Update prompt version (activate, deactivate)
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "濡쒓렇?몄씠 ?꾩슂?⑸땲??" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "愿由ъ옄 沅뚰븳???꾩슂?⑸땲??" }, { status: 403 });
    }

    const body = await request.json();
    const { versionId, action, updates } = body;

    if (!versionId) {
      return NextResponse.json({ error: "踰꾩쟾 ID媛 ?꾩슂?⑸땲??" }, { status: 400 });
    }

    if (action === "activate") {
      // Activate this version (deactivate others)
      return NextResponse.json({ 
        success: true, 
        message: `踰꾩쟾 ${versionId} ?쒖꽦?붾맖`,
      });
    }

    if (action === "deactivate") {
      return NextResponse.json({ 
        success: true, 
        message: `踰꾩쟾 ${versionId} 鍮꾪솢?깊솕??,
      });
    }

    if (action === "rollback") {
      return NextResponse.json({ 
        success: true, 
        message: `踰꾩쟾 ${versionId}濡?濡ㅻ갚??,
      });
    }

    if (action === "update" && updates) {
      return NextResponse.json({ 
        success: true, 
        message: "踰꾩쟾 ?낅뜲?댄듃??,
        updates,
      });
    }

    return NextResponse.json({ error: "?좏슚?섏? ?딆? ?≪뀡?낅땲??" }, { status: 400 });
  } catch (error) {
    console.error("Update prompt version error:", error);
    return NextResponse.json({ error: "?낅뜲?댄듃 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." }, { status: 500 });
  }
}

// DELETE - Delete prompt version
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "濡쒓렇?몄씠 ?꾩슂?⑸땲??" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "愿由ъ옄 沅뚰븳???꾩슂?⑸땲??" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const versionId = searchParams.get("versionId");

    if (!versionId) {
      return NextResponse.json({ error: "踰꾩쟾 ID媛 ?꾩슂?⑸땲??" }, { status: 400 });
    }

    // In production, soft delete from database
    return NextResponse.json({ 
      success: true, 
      message: `踰꾩쟾 ${versionId} ??젣??,
    });
  } catch (error) {
    console.error("Delete prompt version error:", error);
    return NextResponse.json({ error: "??젣 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." }, { status: 500 });
  }
}


