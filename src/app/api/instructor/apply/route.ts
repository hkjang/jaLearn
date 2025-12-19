import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// POST - Submit instructor application
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // Check if already applied
    const existing = await prisma.instructorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (existing) {
      return NextResponse.json(
        { error: "이미 강사 신청을 하셨습니다." },
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
        { error: "필수 항목을 모두 입력해주세요." },
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
      message: "강사 신청이 완료되었습니다. 심사 후 결과를 알려드리겠습니다.",
    });
  } catch (error) {
    console.error("Instructor apply error:", error);
    return NextResponse.json(
      { error: "강사 신청 중 오류가 발생했습니다." },
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
        { error: "로그인이 필요합니다." },
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
      { error: "조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
