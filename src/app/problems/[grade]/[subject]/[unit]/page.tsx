/**
 * Unit Page
 * 단원별 문제 목록 페이지
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { generateUnitMetadata, slugToGradeLevel, parseGradeLevel, difficultyConfig, problemTypeConfig } from '@/lib/seo';
import { Breadcrumb } from '@/components/seo';

interface PageProps {
  params: Promise<{ grade: string; subject: string; unit: string }>;
  searchParams: Promise<{ page?: string; difficulty?: string; type?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { grade, subject: subjectSlug, unit: unitSlug } = await params;
  const gradeLevel = slugToGradeLevel(grade);
  
  // 단원 정보 조회
  const subject = await prisma.subject.findFirst({
    where: { name: subjectSlug.toLowerCase() },
  });
  
  if (!subject) return {};
  
  const unit = await prisma.problemUnit.findFirst({
    where: {
      gradeLevel,
      subjectId: subject.id,
      OR: [
        { code: unitSlug },
        { name: decodeURIComponent(unitSlug) },
      ],
    },
    include: {
      _count: { select: { problems: true } },
    },
  });
  
  if (!unit) return {};
  
  return generateUnitMetadata(gradeLevel, subjectSlug, unit.name, unitSlug, unit._count.problems);
}

export default async function UnitPage({ params, searchParams }: PageProps) {
  const { grade, subject: subjectSlug, unit: unitSlug } = await params;
  const { page = '1', difficulty, type } = await searchParams;
  
  const gradeLevel = slugToGradeLevel(grade);
  const { school, grade: gradeNum } = parseGradeLevel(gradeLevel);
  const currentPage = parseInt(page);
  const pageSize = 20;
  
  // 과목 정보
  const subject = await prisma.subject.findFirst({
    where: { name: subjectSlug.toLowerCase() },
  });
  
  if (!subject) notFound();
  
  // 단원 정보
  const unit = await prisma.problemUnit.findFirst({
    where: {
      gradeLevel,
      subjectId: subject.id,
      OR: [
        { code: unitSlug },
        { name: decodeURIComponent(unitSlug) },
      ],
    },
  });
  
  if (!unit) notFound();
  
  // 필터 조건
  const where = {
    gradeLevel,
    subjectId: subject.id,
    unitId: unit.id,
    status: 'APPROVED' as const,
    ...(difficulty && { difficulty }),
    ...(type && { type }),
  };
  
  // 문제 목록 조회
  const [problems, totalCount] = await Promise.all([
    prisma.problem.findMany({
      where,
      take: pageSize,
      skip: (currentPage - 1) * pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        source: true,
      },
    }),
    prisma.problem.count({ where }),
  ]);
  
  const totalPages = Math.ceil(totalCount / pageSize);
  
  const breadcrumbs = [
    { name: '문제 은행', url: '/problems' },
    { name: `${school} ${gradeNum}`, url: `/problems/${grade}` },
    { name: subject.displayName, url: `/problems/${grade}/${subjectSlug}` },
    { name: unit.name, url: `/problems/${grade}/${subjectSlug}/${unitSlug}` },
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
          <h1 className="text-4xl font-bold mb-4">{unit.name}</h1>
          <p className="text-xl text-white/80">
            {school} {gradeNum} {subject.displayName} - {totalCount.toLocaleString()}개의 문제
          </p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        {/* 필터 */}
        <div className="bg-white rounded-xl shadow p-4 mb-8">
          <div className="flex flex-wrap gap-4">
            <select
              className="px-4 py-2 border rounded-lg"
              defaultValue={difficulty || ''}
              onChange={(e) => {
                const url = new URL(window.location.href);
                if (e.target.value) {
                  url.searchParams.set('difficulty', e.target.value);
                } else {
                  url.searchParams.delete('difficulty');
                }
                window.location.href = url.toString();
              }}
            >
              <option value="">난이도 전체</option>
              {Object.entries(difficultyConfig).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            
            <select
              className="px-4 py-2 border rounded-lg"
              defaultValue={type || ''}
              onChange={(e) => {
                const url = new URL(window.location.href);
                if (e.target.value) {
                  url.searchParams.set('type', e.target.value);
                } else {
                  url.searchParams.delete('type');
                }
                window.location.href = url.toString();
              }}
            >
              <option value="">유형 전체</option>
              {Object.entries(problemTypeConfig).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* 문제 목록 */}
        <div className="space-y-4">
          {problems.map((problem, index) => {
            const diffLabel = difficultyConfig[problem.difficulty] || problem.difficulty;
            const typeLabel = problemTypeConfig[problem.type] || problem.type;
            
            return (
              <Link
                key={problem.id}
                href={`/problems/${grade}/${subjectSlug}/${unitSlug}/${problem.id}`}
                className="block bg-white rounded-xl shadow hover:shadow-md transition-all p-6"
              >
                <div className="flex items-start gap-4">
                  <span className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    {(currentPage - 1) * pageSize + index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 line-clamp-2">
                      {problem.title || problem.content.substring(0, 100)}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        {typeLabel}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        problem.difficulty === 'LOW' ? 'bg-green-100 text-green-700' :
                        problem.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {diffLabel}
                      </span>
                      {problem.source && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded">
                          {problem.source.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-gray-400 flex-shrink-0">→</span>
                </div>
              </Link>
            );
          })}
          
          {problems.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-white rounded-xl">
              조건에 맞는 문제가 없습니다.
            </div>
          )}
        </div>
        
        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {currentPage > 1 && (
              <Link
                href={`?page=${currentPage - 1}${difficulty ? `&difficulty=${difficulty}` : ''}${type ? `&type=${type}` : ''}`}
                className="px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-all"
              >
                이전
              </Link>
            )}
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, currentPage - 2) + i;
              if (pageNum > totalPages) return null;
              
              return (
                <Link
                  key={pageNum}
                  href={`?page=${pageNum}${difficulty ? `&difficulty=${difficulty}` : ''}${type ? `&type=${type}` : ''}`}
                  className={`px-4 py-2 rounded-lg shadow transition-all ${
                    pageNum === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'bg-white hover:shadow-md'
                  }`}
                >
                  {pageNum}
                </Link>
              );
            })}
            
            {currentPage < totalPages && (
              <Link
                href={`?page=${currentPage + 1}${difficulty ? `&difficulty=${difficulty}` : ''}${type ? `&type=${type}` : ''}`}
                className="px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-all"
              >
                다음
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
