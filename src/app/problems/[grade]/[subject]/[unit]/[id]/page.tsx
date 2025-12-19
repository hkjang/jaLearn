/**
 * Problem Detail Page
 * 문제 상세 페이지 (SEO 최적화)
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import {
  generateProblemMetadata,
  slugToGradeLevel,
  parseGradeLevel,
  difficultyConfig,
  problemTypeConfig,
  generateProblemPageSchemas,
} from '@/lib/seo';
import { Breadcrumb, generateProblemBreadcrumbs, JsonLd, ProblemLayout, Section } from '@/components/seo';
import { CheckCircle, XCircle, Clock, BookOpen, ArrowRight } from 'lucide-react';

interface PageProps {
  params: Promise<{ grade: string; subject: string; unit: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  
  const problem = await prisma.problem.findUnique({
    where: { id },
    include: {
      subject: true,
      unit: true,
      source: true,
    },
  });
  
  if (!problem) return {};
  
  return generateProblemMetadata(problem);
}

export default async function ProblemDetailPage({ params }: PageProps) {
  const { grade, subject: subjectSlug, unit: unitSlug, id } = await params;
  const gradeLevel = slugToGradeLevel(grade);
  const { school, grade: gradeNum } = parseGradeLevel(gradeLevel);
  
  // 문제 조회
  const problem = await prisma.problem.findUnique({
    where: { id },
    include: {
      subject: true,
      unit: true,
      source: true,
      tags: {
        include: { tag: true },
      },
    },
  });
  
  if (!problem || problem.status !== 'APPROVED') {
    notFound();
  }
  
  // 관련 문제 조회 (같은 단원)
  const relatedProblems = await prisma.problem.findMany({
    where: {
      unitId: problem.unitId,
      status: 'APPROVED',
      id: { not: problem.id },
    },
    take: 5,
    include: {
      unit: true,
    },
  });
  
  // Breadcrumb 데이터
  const breadcrumbs = generateProblemBreadcrumbs({
    gradeSlug: grade,
    gradeName: `${school} ${gradeNum}`,
    subjectSlug,
    subjectName: problem.subject.displayName,
    unitSlug,
    unitName: problem.unit?.name,
    problemTitle: problem.title || '문제',
  });
  
  // 구조화 데이터 생성
  const schemas = generateProblemPageSchemas(problem, breadcrumbs);
  
  // 선택지 파싱
  let options: string[] = [];
  if (problem.options) {
    try {
      options = JSON.parse(problem.options);
    } catch (e) {
      options = [];
    }
  }
  
  const diffLabel = difficultyConfig[problem.difficulty] || problem.difficulty;
  const typeLabel = problemTypeConfig[problem.type] || problem.type;
  
  return (
    <>
      {/* JSON-LD 구조화 데이터 */}
      <JsonLd data={schemas} />
      
      <ProblemLayout
        breadcrumb={<Breadcrumb items={breadcrumbs} />}
        
        problem={
          <div>
            {/* 문제 메타 정보 */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`px-3 py-1 text-sm rounded-full ${
                problem.difficulty === 'LOW' ? 'bg-green-100 text-green-700' :
                problem.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                난이도: {diffLabel}
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                {typeLabel}
              </span>
              {problem.source && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                  출처: {problem.source.name}
                </span>
              )}
            </div>
            
            {/* H1: 문제 핵심 질문 */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              {problem.title || `${problem.unit?.name || problem.subject.displayName} 문제`}
            </h1>
            
            {/* 문제 본문 */}
            <div className="prose prose-lg max-w-none">
              <div
                className="bg-gray-50 p-6 rounded-xl"
                dangerouslySetInnerHTML={{ __html: problem.contentHtml || problem.content }}
              />
            </div>
          </div>
        }
        
        options={
          options.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">선택지</h2>
              <div className="space-y-3">
                {options.map((option, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-medium flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="pt-1">{option}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        }
        
        answer={
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="text-green-500" />
              정답
            </h2>
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <p className="text-lg font-bold text-green-800">{problem.answer}</p>
            </div>
          </div>
        }
        
        explanation={
          problem.explanation && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="text-blue-500" />
                해설
              </h2>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: problem.explanation }} />
              </div>
            </div>
          )
        }
        
        relatedProblems={
          relatedProblems.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">관련 문제</h2>
              <div className="grid gap-4">
                {relatedProblems.map((related) => (
                  <Link
                    key={related.id}
                    href={`/problems/${grade}/${subjectSlug}/${unitSlug}/${related.id}`}
                    className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <span className="font-medium text-gray-900 line-clamp-1">
                      {related.title || related.content.substring(0, 50)}
                    </span>
                    <ArrowRight className="text-gray-400 flex-shrink-0" />
                  </Link>
                ))}
              </div>
              <Link
                href={`/problems/${grade}/${subjectSlug}/${unitSlug}`}
                className="inline-block mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                이 단원의 모든 문제 보기 →
              </Link>
            </div>
          )
        }
        
        sidebar={
          <div className="space-y-6">
            {/* 문제 정보 */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="font-bold text-gray-900 mb-4">문제 정보</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">학년</dt>
                  <dd className="font-medium">{school} {gradeNum}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">과목</dt>
                  <dd className="font-medium">{problem.subject.displayName}</dd>
                </div>
                {problem.unit && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">단원</dt>
                    <dd className="font-medium">{problem.unit.name}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-gray-500">유형</dt>
                  <dd className="font-medium">{typeLabel}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">난이도</dt>
                  <dd className="font-medium">{diffLabel}</dd>
                </div>
                {problem.source && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">출처</dt>
                    <dd className="font-medium">{problem.source.name}</dd>
                  </div>
                )}
              </dl>
            </div>
            
            {/* 태그 */}
            {problem.tags.length > 0 && (
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="font-bold text-gray-900 mb-4">태그</h3>
                <div className="flex flex-wrap gap-2">
                  {problem.tags.map(({ tag }) => (
                    <span
                      key={tag.id}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* AI 튜터 CTA */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow p-6 text-white">
              <h3 className="font-bold mb-2">AI 튜터와 함께 학습하기</h3>
              <p className="text-sm text-blue-100 mb-4">
                이해가 안 되는 부분이 있나요? AI 튜터가 친절하게 설명해드려요.
              </p>
              <Link
                href="/ai-tutor"
                className="inline-block w-full text-center py-2 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
              >
                AI 튜터 시작하기
              </Link>
            </div>
          </div>
        }
      />
    </>
  );
}
