/**
 * Problems Main Page
 * 문제 은행 메인 페이지
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { generateProblemsMainMetadata, gradeLevelToSlug, parseGradeLevel, gradeConfig, subjectConfig } from '@/lib/seo';
import { Breadcrumb } from '@/components/seo';
import { BookOpen, GraduationCap, School } from 'lucide-react';

export const metadata: Metadata = generateProblemsMainMetadata();

// 학년별 그룹 정의
const gradeGroups = [
  {
    key: 'elementary',
    name: '초등학교',
    icon: BookOpen,
    levels: ['ELEMENTARY_1', 'ELEMENTARY_2', 'ELEMENTARY_3', 'ELEMENTARY_4', 'ELEMENTARY_5', 'ELEMENTARY_6'],
    color: 'from-green-500 to-emerald-600',
  },
  {
    key: 'middle',
    name: '중학교',
    icon: School,
    levels: ['MIDDLE_1', 'MIDDLE_2', 'MIDDLE_3'],
    color: 'from-blue-500 to-indigo-600',
  },
  {
    key: 'high',
    name: '고등학교',
    icon: GraduationCap,
    levels: ['HIGH_1', 'HIGH_2', 'HIGH_3'],
    color: 'from-purple-500 to-violet-600',
  },
];

export default async function ProblemsPage() {
  // 과목 목록 가져오기
  const subjects = await prisma.subject.findMany({
    orderBy: { name: 'asc' },
  });
  
  // 문제 통계 가져오기
  const problemStats = await prisma.problem.groupBy({
    by: ['gradeLevel'],
    where: { status: 'APPROVED' },
    _count: true,
  });
  
  const statsByGrade: Record<string, number> = {};
  problemStats.forEach((stat) => {
    statsByGrade[stat.gradeLevel] = stat._count;
  });
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-12">
          <Breadcrumb
            items={[{ name: '문제 은행', url: '/problems' }]}
            className="text-blue-100 mb-6"
          />
          <h1 className="text-4xl font-bold mb-4">문제 은행</h1>
          <p className="text-xl text-blue-100 max-w-2xl">
            초등학교부터 고등학교까지 전 학년, 전 과목의 문제를 풀어보세요.
            AI 튜터가 풀이 과정을 도와드립니다.
          </p>
        </div>
      </div>
      
      {/* 학년별 카드 */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8">
          {gradeGroups.map((group) => {
            const Icon = group.icon;
            const totalProblems = group.levels.reduce(
              (sum, level) => sum + (statsByGrade[level] || 0),
              0
            );
            
            return (
              <section key={group.key} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {/* 그룹 헤더 */}
                <div className={`bg-gradient-to-r ${group.color} text-white p-6`}>
                  <div className="flex items-center gap-4">
                    <Icon className="h-10 w-10" />
                    <div>
                      <h2 className="text-2xl font-bold">{group.name}</h2>
                      <p className="text-white/80">
                        {totalProblems.toLocaleString()}개의 문제
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* 학년 목록 */}
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {group.levels.map((level) => {
                      const { grade } = parseGradeLevel(level);
                      const problemCount = statsByGrade[level] || 0;
                      
                      return (
                        <Link
                          key={level}
                          href={`/problems/${gradeLevelToSlug(level)}`}
                          className="group p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all hover:shadow-md text-center"
                        >
                          <div className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {grade}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {problemCount.toLocaleString()}문제
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
        
        {/* 과목별 바로가기 */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">과목별 바로가기</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {subjects.map((subject) => {
              const config = subjectConfig[subject.name.toLowerCase()] || { name: subject.displayName };
              
              return (
                <Link
                  key={subject.id}
                  href={`/problems/middle-1/${subject.name.toLowerCase()}`}
                  className="flex items-center gap-3 p-4 bg-white rounded-xl shadow hover:shadow-md transition-all"
                  style={{ borderLeft: `4px solid ${subject.color}` }}
                >
                  <span className="text-2xl">{subject.iconName === 'book' ? '📚' : '📖'}</span>
                  <span className="font-medium text-gray-900">{subject.displayName}</span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
