/**
 * Dynamic Metadata Generation
 * 페이지 타입별 메타데이터 자동 생성
 */

import type { Metadata } from 'next';
import {
  siteConfig,
  subjectConfig,
  parseGradeLevel,
  generatePageTitle,
  generateDescription,
  getCanonicalUrl,
  difficultyConfig,
  problemTypeConfig,
} from './seo-config';

// 공통 기본 메타데이터
const baseMetadata: Partial<Metadata> = {
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: siteConfig.locale,
    siteName: siteConfig.name,
  },
  twitter: {
    card: 'summary_large_image',
    creator: siteConfig.twitterHandle,
  },
};

/**
 * 문제 은행 메인 페이지 메타데이터
 */
export function generateProblemsMainMetadata(): Metadata {
  return {
    ...baseMetadata,
    title: '문제 은행 - 초중고 전과목 문제풀이',
    description: '초등학교, 중학교, 고등학교 전 학년 전과목 문제를 풀어보세요. AI 튜터가 풀이 과정을 도와드립니다.',
    keywords: ['문제은행', '초등 문제', '중학 문제', '고등 문제', 'AI 학습', '온라인 학습'],
    openGraph: {
      ...baseMetadata.openGraph,
      title: '문제 은행 - 초중고 전과목 문제풀이 | JaLearn',
      description: '초등학교, 중학교, 고등학교 전 학년 전과목 문제를 풀어보세요.',
      url: getCanonicalUrl('/problems'),
    },
    alternates: {
      canonical: getCanonicalUrl('/problems'),
    },
  };
}

/**
 * 학년 페이지 메타데이터
 */
export function generateGradeMetadata(gradeLevel: string): Metadata {
  const { school, grade } = parseGradeLevel(gradeLevel);
  const title = generatePageTitle({ school, grade });
  const description = generateDescription({ school, grade });
  const path = `/problems/${gradeLevel.toLowerCase().replace('_', '-')}`;
  
  return {
    ...baseMetadata,
    title,
    description,
    keywords: [school, grade, '문제풀이', '학습', 'AI 튜터'],
    openGraph: {
      ...baseMetadata.openGraph,
      title,
      description,
      url: getCanonicalUrl(path),
    },
    alternates: {
      canonical: getCanonicalUrl(path),
    },
  };
}

/**
 * 과목 페이지 메타데이터
 */
export function generateSubjectMetadata(gradeLevel: string, subjectSlug: string): Metadata {
  const { school, grade } = parseGradeLevel(gradeLevel);
  const subject = subjectConfig[subjectSlug]?.name || subjectSlug;
  const subjectKeywords = subjectConfig[subjectSlug]?.keywords || [];
  
  const title = generatePageTitle({ school, grade, subject });
  const description = generateDescription({ school, grade, subject });
  const path = `/problems/${gradeLevel.toLowerCase().replace('_', '-')}/${subjectSlug}`;
  
  return {
    ...baseMetadata,
    title,
    description,
    keywords: [school, grade, subject, ...subjectKeywords, '문제풀이', 'AI 학습'],
    openGraph: {
      ...baseMetadata.openGraph,
      title,
      description,
      url: getCanonicalUrl(path),
    },
    alternates: {
      canonical: getCanonicalUrl(path),
    },
  };
}

/**
 * 단원 페이지 메타데이터
 */
export function generateUnitMetadata(
  gradeLevel: string, 
  subjectSlug: string, 
  unitName: string,
  unitSlug: string,
  problemCount?: number
): Metadata {
  const { school, grade } = parseGradeLevel(gradeLevel);
  const subject = subjectConfig[subjectSlug]?.name || subjectSlug;
  
  const title = generatePageTitle({ school, grade, subject, unit: unitName });
  const description = generateDescription({ school, grade, subject, unit: unitName, problemCount });
  const path = `/problems/${gradeLevel.toLowerCase().replace('_', '-')}/${subjectSlug}/${unitSlug}`;
  
  return {
    ...baseMetadata,
    title,
    description,
    keywords: [school, grade, subject, unitName, '개념', '유형', '문제풀이'],
    openGraph: {
      ...baseMetadata.openGraph,
      title,
      description,
      url: getCanonicalUrl(path),
    },
    alternates: {
      canonical: getCanonicalUrl(path),
    },
  };
}

/**
 * 문제 상세 페이지 메타데이터
 */
export function generateProblemMetadata(problem: {
  id: string;
  title?: string | null;
  content: string;
  type: string;
  gradeLevel: string;
  difficulty: string;
  subject: { name: string; displayName: string };
  unit?: { name: string; code?: string | null } | null;
  source?: { name: string; organization?: string | null } | null;
}): Metadata {
  const { school, grade } = parseGradeLevel(problem.gradeLevel);
  const subject = problem.subject.displayName || problem.subject.name;
  const unit = problem.unit?.name;
  const difficulty = difficultyConfig[problem.difficulty] || problem.difficulty;
  const problemType = problemTypeConfig[problem.type] || problem.type;
  
  // 제목 생성: 질문형 키워드 중심
  const titleBase = problem.title || `${unit || subject} 문제`;
  const title = `${titleBase} - ${school} ${grade} ${subject}`;
  
  // 설명 생성: 학습 목적 + 난이도
  let description = `${school} ${grade} ${subject}`;
  if (unit) description += ` ${unit}`;
  description += ` ${problemType} 문제입니다.`;
  description += ` 난이도: ${difficulty}.`;
  if (problem.source) {
    description += ` 출처: ${problem.source.name}.`;
  }
  description += ' AI 튜터와 함께 문제를 풀어보세요.';
  
  // URL 생성
  const gradeSlug = problem.gradeLevel.toLowerCase().replace('_', '-');
  const subjectSlug = problem.subject.name.toLowerCase();
  const unitSlug = problem.unit?.code || generateSlug(problem.unit?.name || 'general');
  const path = `/problems/${gradeSlug}/${subjectSlug}/${unitSlug}/${problem.id}`;
  
  // 키워드 생성
  const keywords = [
    school,
    grade,
    subject,
    problemType,
    difficulty,
    ...(unit ? [unit] : []),
    '문제풀이',
    'AI 학습',
    ...(problem.source ? [problem.source.name] : []),
  ];
  
  return {
    ...baseMetadata,
    title,
    description,
    keywords,
    openGraph: {
      ...baseMetadata.openGraph,
      type: 'article',
      title,
      description,
      url: getCanonicalUrl(path),
    },
    alternates: {
      canonical: getCanonicalUrl(path),
    },
  };
}

/**
 * 해설 페이지 메타데이터
 */
export function generateExplanationMetadata(problem: {
  id: string;
  title?: string | null;
  gradeLevel: string;
  subject: { name: string; displayName: string };
  unit?: { name: string } | null;
}): Metadata {
  const { school, grade } = parseGradeLevel(problem.gradeLevel);
  const subject = problem.subject.displayName || problem.subject.name;
  const unit = problem.unit?.name;
  
  const titleBase = problem.title || `${unit || subject} 문제`;
  const title = `${titleBase} 풀이 해설 - ${school} ${grade}`;
  const description = `${school} ${grade} ${subject} ${unit || ''} 문제의 상세 풀이 해설입니다. 단계별로 이해하기 쉽게 설명합니다.`;
  
  const gradeSlug = problem.gradeLevel.toLowerCase().replace('_', '-');
  const subjectSlug = problem.subject.name.toLowerCase();
  const path = `/problems/${gradeSlug}/${subjectSlug}/${problem.id}/explanation`;
  
  return {
    ...baseMetadata,
    title,
    description,
    keywords: [school, grade, subject, '풀이', '해설', '문제풀이'],
    openGraph: {
      ...baseMetadata.openGraph,
      title,
      description,
      url: getCanonicalUrl(path),
    },
    alternates: {
      canonical: getCanonicalUrl(path),
    },
  };
}

// Helper function
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s가-힣-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
