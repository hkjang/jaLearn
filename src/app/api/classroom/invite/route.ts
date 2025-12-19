/**
 * Classroom Invite API
 * 클래스 초대 코드 시스템
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// 초대 코드 생성
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// POST: 클래스룸 생성 및 초대 코드 발급
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { name, description, gradeLevel, subjectId, action } = await request.json();
    
    // 초대 코드로 클래스 참가
    if (action === 'join') {
      const { inviteCode } = await request.json();
      
      const classroom = await prisma.classRoom.findUnique({
        where: { inviteCode },
        include: { _count: { select: { members: true } } },
      });
      
      if (!classroom || !classroom.isActive) {
        return NextResponse.json(
          { error: '유효하지 않은 초대 코드입니다.' },
          { status: 404 }
        );
      }
      
      if (classroom._count.members >= classroom.maxStudents) {
        return NextResponse.json(
          { error: '클래스 정원이 가득 찼습니다.' },
          { status: 400 }
        );
      }
      
      // 이미 참가 확인
      const existing = await prisma.classMember.findUnique({
        where: {
          classId_userId: {
            classId: classroom.id,
            userId,
          },
        },
      });
      
      if (existing) {
        return NextResponse.json(
          { error: '이미 참가한 클래스입니다.' },
          { status: 400 }
        );
      }
      
      await prisma.classMember.create({
        data: {
          classId: classroom.id,
          userId,
          role: 'STUDENT',
        },
      });
      
      return NextResponse.json({
        success: true,
        message: `${classroom.name} 클래스에 참가했습니다!`,
        classId: classroom.id,
        className: classroom.name,
      });
    }
    
    // 교사 권한 확인 (클래스 생성)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    
    if (user?.role !== 'TEACHER' && user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: '교사 권한이 필요합니다.' },
        { status: 403 }
      );
    }
    
    // 고유한 초대 코드 생성
    let inviteCode: string;
    let attempts = 0;
    do {
      inviteCode = generateInviteCode();
      const exists = await prisma.classRoom.findUnique({
        where: { inviteCode },
      });
      if (!exists) break;
      attempts++;
    } while (attempts < 10);
    
    // 클래스 생성
    const classroom = await prisma.classRoom.create({
      data: {
        teacherId: userId,
        name,
        description,
        gradeLevel: gradeLevel || 'MIDDLE_1',
        subjectId,
        inviteCode,
      },
    });
    
    return NextResponse.json({
      success: true,
      classId: classroom.id,
      name: classroom.name,
      inviteCode,
      inviteLink: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/classroom/join?code=${inviteCode}`,
    });
  } catch (error) {
    console.error('Classroom invite error:', error);
    return NextResponse.json(
      { error: '클래스 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// GET: 초대 코드로 클래스 정보 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    
    if (!code) {
      return NextResponse.json({ error: '초대 코드가 필요합니다.' }, { status: 400 });
    }
    
    const classroom = await prisma.classRoom.findUnique({
      where: { inviteCode: code },
      include: {
        teacher: { select: { name: true } },
        _count: { select: { members: true } },
      },
    });
    
    if (!classroom || !classroom.isActive) {
      return NextResponse.json(
        { error: '유효하지 않은 초대 코드입니다.' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      id: classroom.id,
      name: classroom.name,
      description: classroom.description,
      teacherName: classroom.teacher.name,
      gradeLevel: classroom.gradeLevel,
      memberCount: classroom._count.members,
      maxStudents: classroom.maxStudents,
      isAvailable: classroom._count.members < classroom.maxStudents,
    });
  } catch (error) {
    console.error('Classroom info error:', error);
    return NextResponse.json(
      { error: '클래스 정보 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
