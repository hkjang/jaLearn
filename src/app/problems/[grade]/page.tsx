/**
 * Grade Level Page
 * 학년별 문제 페이지
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { generateGradeMetadata, slugToGradeLevel, parseGradeLevel, subjectConfig } from '@/lib/seo';
import { Breadcrumb, generateProblemBreadcrumbs } from '@/components/seo';

interface PageProps {
  params: Promise<{ grade: string }>;
}

// 유효한 학년 슬러그
const validGrades = [
  'elementary-1', 'elementary-2', 'elementary-3', 'elementary-4', 'elementary-5', 'elementary-6',
  'middle-1', 'middle-2', 'middle-3',
  'high-1', 'high-2', 'high-3',
];

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { grade } = await params;
  
  if (!validGrades.includes(grade)) {
    return {};
  }
  
  const gradeLevel = slugToGradeLevel(grade);
  return generateGradeMetadata(gradeLevel);
}

export async function generateStaticParams() {
  return validGrades.map((grade) => ({ grade }));
}

export default async function GradePage({ params }: PageProps) {
  const { grade } = await params;
  
  if (!validGrades.includes(grade)) {
    notFound();
  }
  
  const gradeLevel = slugToGradeLevel(grade);
  const { school, grade: gradeNum, gradeNum: num } = parseGradeLevel(gradeLevel);
  
  // 해당 학년의 과목 및 문제 수 가져오기
  const subjects = await prisma.subject.findMany({
    orderBy: { name: 'asc' },
  });
  
  const problemsBySubject = await prisma.problem.groupBy({
    by: ['subjectId'],
    where: {
      gradeLevel,
      status: 'APPROVED',
    },
    _count: true,
  });
  
  const countBySubject: Record<string, number> = {};
  problemsBySubject.forEach((stat) => {
    countBySubject[stat.subjectId] = stat._count;
  });
  
  // 해당 학년의 단원 목록
  const units = await prisma.problemUnit.findMany({
    where: { gradeLevel },
    include: {
      subject: true,
      _count: {
        select: { problems: true },
      },
    },
    orderBy: [{ subjectId: 'asc' }, { order: 'asc' }],
  });
  
  // 단원을 과목별로 그룹화
  const unitsBySubject: Record<string, typeof units> = {};
  units.forEach((unit) => {
    const subjectId = unit.subjectId;
    if (!unitsBySubject[subjectId]) {
      unitsBySubject[subjectId] = [];
    }
    unitsBySubject[subjectId].push(unit);
  });
  
  const breadcrumbs = [
    { name: '문제 은행', url: '/problems' },
    { name: `${school} ${gradeNum}`, url: `/problems/${grade}` },
  ];
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <Breadcrumb items={breadcrumbs} className="text-blue-100 mb-6" />
          <h1 className="text-4xl font-bold mb-4">{school} {gradeNum} 문제</h1>
          <p className="text-xl text-blue-100">
            {school} {gradeNum} 전과목 문제를 학습하세요.
          </p>
        </div>
      </div>
      
      {/* 과목 목록 */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8">
          {subjects.map((subject) => {
            const config = subjectConfig[subject.name.toLowerCase()];
            const problemCount = countBySubject[subject.id] || 0;
            const subjectUnits = unitsBySubject[subject.id] || [];
            
            return (
              <section key={subject.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {/* 과목 헤더 */}
                <Link
                  href={`/problems/${grade}/${subject.name.toLowerCase()}`}
                  className="block p-6 hover:bg-gray-50 transition-colors"
                  style={{ borderLeft: `4px solid ${subject.color}` }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {subject.displayName}
                      </h2>
                      <p className="text-gray-500 mt-1">
                        {problemCount.toLocaleString()}개의 문제
                      </p>
                    </div>
                    <span className="text-gray-400">→</span>
                  </div>
                </Link>
                
                {/* 단원 목록 */}
                {subjectUnits.length > 0 && (
                  <div className="px-6 pb-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {subjectUnits.slice(0, 8).map((unit) => (
                        <Link
                          key={unit.id}
                          href={`/problems/${grade}/${subject.name.toLowerCase()}/${unit.code || encodeURIComponent(unit.name)}`}
                          className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                        >
                          <div className="font-medium text-gray-900 truncate">
                            {unit.name}
                          </div>
                          <div className="text-gray-500 text-xs mt-1">
                            {unit._count.problems}문제
                          </div>
                        </Link>
                      ))}
                    </div>
                    {subjectUnits.length > 8 && (
                      <Link
                        href={`/problems/${grade}/${subject.name.toLowerCase()}`}
                        className="inline-block mt-4 text-blue-600 hover:text-blue-700 text-sm"
                      >
                        +{subjectUnits.length - 8}개 단원 더보기 →
                      </Link>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
