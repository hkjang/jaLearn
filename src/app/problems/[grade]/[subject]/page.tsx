/**
 * Subject Page
 * 과목별 문제 페이지
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { generateSubjectMetadata, slugToGradeLevel, parseGradeLevel, subjectConfig } from '@/lib/seo';
import { Breadcrumb } from '@/components/seo';

interface PageProps {
  params: Promise<{ grade: string; subject: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { grade, subject: subjectSlug } = await params;
  const gradeLevel = slugToGradeLevel(grade);
  return generateSubjectMetadata(gradeLevel, subjectSlug);
}

export default async function SubjectPage({ params }: PageProps) {
  const { grade, subject: subjectSlug } = await params;
  const gradeLevel = slugToGradeLevel(grade);
  const { school, grade: gradeNum } = parseGradeLevel(gradeLevel);
  
  // 과목 정보 가져오기
  const subject = await prisma.subject.findFirst({
    where: {
      name: subjectSlug.toLowerCase(),
    },
  });
  
  if (!subject) {
    notFound();
  }
  
  // 단원 목록 가져오기
  const units = await prisma.problemUnit.findMany({
    where: {
      gradeLevel,
      subjectId: subject.id,
    },
    include: {
      _count: {
        select: { problems: true },
      },
    },
    orderBy: { order: 'asc' },
  });
  
  // 최근 문제
  const recentProblems = await prisma.problem.findMany({
    where: {
      gradeLevel,
      subjectId: subject.id,
      status: 'APPROVED',
    },
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      unit: true,
    },
  });
  
  const breadcrumbs = [
    { name: '문제 은행', url: '/problems' },
    { name: `${school} ${gradeNum}`, url: `/problems/${grade}` },
    { name: subject.displayName, url: `/problems/${grade}/${subjectSlug}` },
  ];
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div
        className="text-white"
        style={{ background: `linear-gradient(135deg, ${subject.color}, ${subject.color}dd)` }}
      >
        <div className="container mx-auto px-4 py-12">
          <Breadcrumb items={breadcrumbs} className="text-white/70 mb-6" />
          <h1 className="text-4xl font-bold mb-4">
            {school} {gradeNum} {subject.displayName}
          </h1>
          <p className="text-xl text-white/80">
            {subject.displayName} 전체 단원의 문제를 학습하세요.
          </p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* 단원 목록 */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">단원별 문제</h2>
            <div className="grid gap-4">
              {units.map((unit, index) => (
                <Link
                  key={unit.id}
                  href={`/problems/${grade}/${subjectSlug}/${unit.code || encodeURIComponent(unit.name)}`}
                  className="block p-6 bg-white rounded-xl shadow hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-medium">
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="font-bold text-gray-900">{unit.name}</h3>
                        <p className="text-sm text-gray-500">
                          {unit._count.problems}개의 문제
                        </p>
                      </div>
                    </div>
                    <span className="text-gray-400">→</span>
                  </div>
                </Link>
              ))}
              
              {units.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  아직 등록된 단원이 없습니다.
                </div>
              )}
            </div>
          </div>
          
          {/* 사이드바 */}
          <aside>
            <div className="bg-white rounded-xl shadow p-6 sticky top-4">
              <h3 className="font-bold text-gray-900 mb-4">최근 추가된 문제</h3>
              <div className="space-y-3">
                {recentProblems.map((problem) => (
                  <Link
                    key={problem.id}
                    href={`/problems/${grade}/${subjectSlug}/${problem.unit?.code || 'general'}/${problem.id}`}
                    className="block p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="text-sm text-gray-900 line-clamp-2">
                      {problem.title || problem.content.substring(0, 50)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {problem.unit?.name || '일반'}
                    </div>
                  </Link>
                ))}
                
                {recentProblems.length === 0 && (
                  <div className="text-sm text-gray-500 text-center py-4">
                    아직 등록된 문제가 없습니다.
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
