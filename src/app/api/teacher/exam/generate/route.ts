/**
 * Teacher Exam Generation API
 * 시험 자동 생성 및 PDF 출력
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// POST: 시험 자동 생성
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // 교사 권한 확인
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
    
    const {
      classId,
      title,
      unitIds,
      problemCount = 10,
      difficultyMix = { LOW: 0.3, MEDIUM: 0.5, HIGH: 0.2 },
      typeMix = { MULTIPLE_CHOICE: 0.7, SHORT_ANSWER: 0.3 },
      duration,
    } = await request.json();
    
    if (!title || !unitIds || unitIds.length === 0) {
      return NextResponse.json(
        { error: '시험 제목과 단원을 선택해주세요.' },
        { status: 400 }
      );
    }
    
    // 각 난이도/유형별 문제 수 계산
    const lowCount = Math.floor(problemCount * difficultyMix.LOW);
    const mediumCount = Math.floor(problemCount * difficultyMix.MEDIUM);
    const highCount = problemCount - lowCount - mediumCount;
    
    // 문제 선택
    const selectedProblems: string[] = [];
    
    // 난이도별로 문제 선택
    for (const [difficulty, count] of [
      ['LOW', lowCount],
      ['MEDIUM', mediumCount],
      ['HIGH', highCount],
    ] as [string, number][]) {
      if (count <= 0) continue;
      
      const problems = await prisma.problem.findMany({
        where: {
          status: 'APPROVED',
          unitId: { in: unitIds },
          difficulty,
          id: { notIn: selectedProblems },
        },
        take: count,
        orderBy: { usageCount: 'asc' }, // 적게 출제된 문제 우선
      });
      
      selectedProblems.push(...problems.map((p) => p.id));
    }
    
    // 부족하면 추가 선택
    if (selectedProblems.length < problemCount) {
      const additional = await prisma.problem.findMany({
        where: {
          status: 'APPROVED',
          unitId: { in: unitIds },
          id: { notIn: selectedProblems },
        },
        take: problemCount - selectedProblems.length,
      });
      selectedProblems.push(...additional.map((p) => p.id));
    }
    
    // 시험 생성
    const exam = await prisma.classExam.create({
      data: {
        classId: classId || 'temp', // TODO: implement temp exam without class
        title,
        problemIds: JSON.stringify(selectedProblems),
        duration,
        isPublished: false,
      },
    });
    
    // 선택된 문제 상세 정보
    const problemDetails = await prisma.problem.findMany({
      where: { id: { in: selectedProblems } },
      include: { subject: true, unit: true },
    });
    
    // 순서 유지
    const orderedProblems = selectedProblems.map((id) =>
      problemDetails.find((p) => p.id === id)
    ).filter(Boolean);
    
    return NextResponse.json({
      examId: exam.id,
      title: exam.title,
      problemCount: selectedProblems.length,
      problems: orderedProblems.map((p: any, i) => ({
        number: i + 1,
        id: p.id,
        content: p.content.substring(0, 100),
        type: p.type,
        difficulty: p.difficulty,
        unit: p.unit?.name,
      })),
      duration,
    });
  } catch (error) {
    console.error('Exam generation error:', error);
    return NextResponse.json(
      { error: '시험 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// GET: 시험 목록 조회
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    
    // 교사의 클래스룸 확인
    const classrooms = await prisma.classRoom.findMany({
      where: { teacherId: userId },
      include: {
        exams: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    
    const allExams = classrooms.flatMap((c) =>
      c.exams.map((e) => ({
        ...e,
        className: c.name,
        classId: c.id,
        problemCount: JSON.parse(e.problemIds).length,
      }))
    );
    
    return NextResponse.json({ exams: allExams });
  } catch (error) {
    console.error('Exam list error:', error);
    return NextResponse.json(
      { error: '시험 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
