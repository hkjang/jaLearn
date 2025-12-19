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
        { error: "?„ìˆ˜ ?•ë³´ë¥?ëª¨ë‘ ?…ë ¥?´ì£¼?¸ìš”." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "ë¹„ë?ë²ˆí˜¸??8???´ìƒ?´ì–´???©ë‹ˆ??" },
        { status: 400 }
      );
    }

    // Check if role is valid
    if (!isValidUserRole(role)) {
      return NextResponse.json(
        { error: "? íš¨?˜ì? ?Šì? ??• ?…ë‹ˆ??" },
        { status: 400 }
      );
    }

    // Check if grade level is valid for students
    if (role === "STUDENT" && gradeLevel && !isValidGradeLevel(gradeLevel)) {
      return NextResponse.json(
        { error: "? íš¨?˜ì? ?Šì? ?™ë…„?…ë‹ˆ??" },
        { status: 400 }
      );
    }

    // Check for existing user
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "?´ë? ê°€?…ëœ ?´ë©”?¼ì…?ˆë‹¤." },
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
      message: "?Œì›ê°€?…ì´ ?„ë£Œ?˜ì—ˆ?µë‹ˆ??",
      user,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "?Œì›ê°€??ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤." },
      { status: 500 }
    );
  }
}
