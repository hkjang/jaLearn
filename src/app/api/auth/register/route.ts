import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import prisma from "@/lib/prisma";
import { isValidGradeLevel, isValidUserRole } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role, gradeLevel, parentConsent } = body;

    // Validation
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "필수 정보를 모두 입력해주세요." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "비밀번호는 8자 이상이어야 합니다." },
        { status: 400 }
      );
    }

    // Check if role is valid
    if (!isValidUserRole(role)) {
      return NextResponse.json(
        { error: "유효하지 않은 역할입니다." },
        { status: 400 }
      );
    }

    // Check if grade level is valid for students
    if (role === "STUDENT" && gradeLevel && !isValidGradeLevel(gradeLevel)) {
      return NextResponse.json(
        { error: "유효하지 않은 학년입니다." },
        { status: 400 }
      );
    }

    // Check for existing user
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "이미 가입된 이메일입니다." },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        gradeLevel: role === "STUDENT" ? gradeLevel : null,
        profile: {
          create: {
            parentConsent: parentConsent || false,
            consentDate: parentConsent ? new Date() : null,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        gradeLevel: true,
      },
    });

    return NextResponse.json({
      message: "회원가입이 완료되었습니다.",
      user,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "회원가입 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
