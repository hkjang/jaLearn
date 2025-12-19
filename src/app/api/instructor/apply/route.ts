import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// POST - Submit instructor application
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "濡쒓렇?몄씠 ?꾩슂?⑸땲??" },
        { status: 401 }
      );
    }

    // Check if already applied
    const existing = await prisma.instructorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (existing) {
      return NextResponse.json(
        { error: "?대? 媛뺤궗 ?좎껌???섏뀲?듬땲??" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      displayName,
      bio,
      specialties,
      qualifications,
      experience,
      portfolio,
    } = body;

    if (!displayName || !specialties || specialties.length === 0) {
      return NextResponse.json(
        { error: "?꾩닔 ??ぉ??紐⑤몢 ?낅젰?댁＜?몄슂." },
        { status: 400 }
      );
    }

    // Create instructor profile
    const instructorProfile = await prisma.instructorProfile.create({
      data: {
        userId: session.user.id,
        displayName,
        bio,
        specialties: JSON.stringify(specialties),
        qualifications: JSON.stringify(qualifications || []),
        socialLinks: portfolio ? JSON.stringify({ portfolio }) : null,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      instructorProfile,
      message: "媛뺤궗 ?좎껌???꾨즺?섏뿀?듬땲?? ?ъ궗 ??寃곌낵瑜??뚮젮?쒕━寃좎뒿?덈떎.",
    });
  } catch (error) {
    console.error("Instructor apply error:", error);
    return NextResponse.json(
      { error: "媛뺤궗 ?좎껌 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." },
      { status: 500 }
    );
  }
}

// GET - Get instructor application status
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "濡쒓렇?몄씠 ?꾩슂?⑸땲??" },
        { status: 401 }
      );
    }

    const instructorProfile = await prisma.instructorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!instructorProfile) {
      return NextResponse.json({
        hasApplied: false,
      });
    }

    return NextResponse.json({
      hasApplied: true,
      status: instructorProfile.status,
      profile: {
        ...instructorProfile,
        specialties: JSON.parse(instructorProfile.specialties || "[]"),
        qualifications: JSON.parse(instructorProfile.qualifications || "[]"),
      },
    });
  } catch (error) {
    console.error("Get instructor status error:", error);
    return NextResponse.json(
      { error: "議고쉶 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎." },
      { status: 500 }
    );
  }
}

