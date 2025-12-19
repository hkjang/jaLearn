'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { JsonLd } from './JsonLd';
import { generateBreadcrumbSchema, type BreadcrumbItem } from '@/lib/seo';

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

/**
 * Breadcrumb Navigation Component
 * Schema.org 구조화 데이터를 포함한 브레드크럼 네비게이션
 */
export function Breadcrumb({ items, className = '', showHome = true }: BreadcrumbProps) {
  // 홈 추가 (선택적)
  const allItems: BreadcrumbItem[] = showHome
    ? [{ name: '홈', url: '/' }, ...items]
    : items;
  
  // 스키마 생성
  const schema = generateBreadcrumbSchema(allItems);
  
  return (
    <>
      {/* JSON-LD 구조화 데이터 */}
      <JsonLd data={schema} />
      
      {/* 시각적 Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className={`flex items-center text-sm text-gray-500 ${className}`}
      >
        <ol className="flex items-center flex-wrap gap-1">
          {allItems.map((item, index) => {
            const isLast = index === allItems.length - 1;
            const isHome = index === 0 && showHome;
            
            return (
              <li key={item.url} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 mx-1 text-gray-400 flex-shrink-0" />
                )}
                
                {isLast ? (
                  <span 
                    className="text-gray-900 font-medium truncate max-w-[200px]"
                    aria-current="page"
                  >
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={item.url}
                    className="hover:text-blue-600 transition-colors flex items-center gap-1"
                  >
                    {isHome && <Home className="h-4 w-4" />}
                    <span className="truncate max-w-[150px]">{isHome ? '' : item.name}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}

/**
 * 문제 페이지용 Breadcrumb 생성 헬퍼
 */
export function generateProblemBreadcrumbs(params: {
  gradeSlug: string;
  gradeName: string;
  subjectSlug: string;
  subjectName: string;
  unitSlug?: string;
  unitName?: string;
  problemTitle?: string;
}): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [
    { name: '문제 은행', url: '/problems' },
    { name: params.gradeName, url: `/problems/${params.gradeSlug}` },
    { name: params.subjectName, url: `/problems/${params.gradeSlug}/${params.subjectSlug}` },
  ];
  
  if (params.unitSlug && params.unitName) {
    items.push({
      name: params.unitName,
      url: `/problems/${params.gradeSlug}/${params.subjectSlug}/${params.unitSlug}`,
    });
  }
  
  if (params.problemTitle) {
    items.push({
      name: params.problemTitle,
      url: '', // 현재 페이지는 URL 없음
    });
  }
  
  return items;
}
