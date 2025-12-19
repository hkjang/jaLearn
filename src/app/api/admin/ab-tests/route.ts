import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET - List A/B tests
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "ê´€ë¦¬ì ê¶Œí•œ???„ìš”?©ë‹ˆ??" }, { status: 403 });
    }

    // Mock A/B tests data
    const tests = [
      {
        id: "ab-001",
        name: "?Œí¬?¼í…Œ??vs ì§ì ‘ ?¤ëª…",
        description: "?Œí¬?¼í…Œ?¤ì‹ ì§ˆë¬¸ê³?ì§ì ‘ ?¤ëª… ë°©ì‹ ë¹„êµ",
        status: "RUNNING",
        startDate: new Date(Date.now() - 7 * 86400000).toISOString(),
        variants: [
          { id: "v1", name: "?Œí¬?¼í…Œ??, allocation: 0.5, metrics: { usageCount: 234, avgQualityScore: 0.85 } },
          { id: "v2", name: "ì§ì ‘ ?¤ëª…", allocation: 0.5, metrics: { usageCount: 221, avgQualityScore: 0.78 } },
        ],
      },
      {
        id: "ab-002",
        name: "?´ëª¨ì§€ ?¬ìš© ?¬ë?",
        description: "ì´ˆë“±?™ìƒ ?€???´ëª¨ì§€ ?¬ìš© ?¨ê³¼ ?ŒìŠ¤??,
        status: "COMPLETED",
        startDate: new Date(Date.now() - 30 * 86400000).toISOString(),
        endDate: new Date(Date.now() - 14 * 86400000).toISOString(),
        winnerVariantId: "v1",
        variants: [
          { id: "v1", name: "?´ëª¨ì§€ O", allocation: 0.5, metrics: { usageCount: 1500, avgQualityScore: 0.88 } },
          { id: "v2", name: "?´ëª¨ì§€ X", allocation: 0.5, metrics: { usageCount: 1480, avgQualityScore: 0.72 } },
        ],
      },
    ];

    return NextResponse.json({ tests });
  } catch (error) {
    console.error("Get A/B tests error:", error);
    return NextResponse.json({ error: "ì¡°íšŒ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤." }, { status: 500 });
  }
}

// POST - Create A/B test
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "ê´€ë¦¬ì ê¶Œí•œ???„ìš”?©ë‹ˆ??" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, variants, targetAudience } = body;

    if (!name || !variants || variants.length < 2) {
      return NextResponse.json({ error: "?ŒìŠ¤?¸ëª…ê³?2ê°??´ìƒ??ë³€?•ì´ ?„ìš”?©ë‹ˆ??" }, { status: 400 });
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
    return NextResponse.json({ error: "?ì„± ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤." }, { status: 500 });
  }
}

// PUT - Update A/B test (start, stop, finish)
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "ê´€ë¦¬ì ê¶Œí•œ???„ìš”?©ë‹ˆ??" }, { status: 403 });
    }

    const body = await request.json();
    const { testId, action } = body;

    if (!testId || !action) {
      return NextResponse.json({ error: "?ŒìŠ¤??ID?€ ?¡ì…˜???„ìš”?©ë‹ˆ??" }, { status: 400 });
    }

    switch (action) {
      case "start":
        return NextResponse.json({ success: true, message: "?ŒìŠ¤?¸ê? ?œì‘?˜ì—ˆ?µë‹ˆ??", status: "RUNNING" });
      case "stop":
        return NextResponse.json({ success: true, message: "?ŒìŠ¤?¸ê? ì¤‘ë‹¨?˜ì—ˆ?µë‹ˆ??", status: "STOPPED" });
      case "finish":
        return NextResponse.json({ success: true, message: "?ŒìŠ¤?¸ê? ?„ë£Œ?˜ì—ˆ?µë‹ˆ??", status: "COMPLETED" });
      default:
        return NextResponse.json({ error: "? íš¨?˜ì? ?Šì? ?¡ì…˜?…ë‹ˆ??" }, { status: 400 });
    }
  } catch (error) {
    console.error("Update A/B test error:", error);
    return NextResponse.json({ error: "?…ë°?´íŠ¸ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤." }, { status: 500 });
  }
}

// DELETE - Delete A/B test
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "ê´€ë¦¬ì ê¶Œí•œ???„ìš”?©ë‹ˆ??" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const testId = searchParams.get("testId");

    if (!testId) {
      return NextResponse.json({ error: "?ŒìŠ¤??IDê°€ ?„ìš”?©ë‹ˆ??" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `?ŒìŠ¤??${testId} ?? œ?? });
  } catch (error) {
    console.error("Delete A/B test error:", error);
    return NextResponse.json({ error: "?? œ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤." }, { status: 500 });
  }
}
