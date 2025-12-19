/**
 * Schema.org Structured Data Generators
 * 구조화 데이터 생성기 (JSON-LD)
 */

import { siteConfig, parseGradeLevel, difficultyConfig, problemTypeConfig } from './seo-config';

// 기본 Organization 스키마
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.organization.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}${siteConfig.organization.logo}`,
    sameAs: [],
  };
}

// EducationalOrganization 스키마
export function generateEducationalOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: siteConfig.organization.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}${siteConfig.organization.logo}`,
    description: siteConfig.defaultDescription,
    areaServed: {
      '@type': 'Country',
      name: 'Korea',
    },
  };
}

/**
 * Breadcrumb 스키마 생성
 */
export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${siteConfig.url}${item.url}`,
    })),
  };
}

/**
 * Quiz 스키마 생성 (객관식 문제)
 */
export function generateQuizSchema(problem: {
  id: string;
  title?: string | null;
  content: string;
  type: string;
  options?: string | null;
  answer: string;
  explanation?: string | null;
  gradeLevel: string;
  difficulty: string;
  subject: { displayName: string };
  unit?: { name: string } | null;
}) {
  const { school, grade } = parseGradeLevel(problem.gradeLevel);
  const subject = problem.subject.displayName;
  const difficulty = difficultyConfig[problem.difficulty] || problem.difficulty;
  
  // 객관식 선택지 파싱
  let parsedOptions: string[] = [];
  if (problem.options) {
    try {
      parsedOptions = JSON.parse(problem.options);
    } catch (e) {
      parsedOptions = [];
    }
  }
  
  const quizName = problem.title || `${problem.unit?.name || subject} 문제`;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: quizName,
    about: {
      '@type': 'Thing',
      name: subject,
    },
    educationalLevel: `${school} ${grade}`,
    educationalAlignment: {
      '@type': 'AlignmentObject',
      alignmentType: 'educationalSubject',
      targetName: subject,
    },
    hasPart: problem.type === 'MULTIPLE_CHOICE' && parsedOptions.length > 0
      ? [{
          '@type': 'Question',
          text: cleanContent(problem.content),
          acceptedAnswer: {
            '@type': 'Answer',
            text: problem.answer,
          },
          suggestedAnswer: parsedOptions.map((option) => ({
            '@type': 'Answer',
            text: option,
          })),
        }]
      : [{
          '@type': 'Question',
          text: cleanContent(problem.content),
          acceptedAnswer: {
            '@type': 'Answer',
            text: problem.answer,
          },
        }],
    description: `${school} ${grade} ${subject} ${problem.unit?.name || ''} - 난이도: ${difficulty}`,
  };
}

/**
 * QAPage 스키마 생성 (문제 풀이 페이지)
 */
export function generateQAPageSchema(problem: {
  id: string;
  content: string;
  answer: string;
  explanation?: string | null;
  gradeLevel: string;
  subject: { displayName: string };
  unit?: { name: string } | null;
}) {
  const { school, grade } = parseGradeLevel(problem.gradeLevel);
  const subject = problem.subject.displayName;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    mainEntity: {
      '@type': 'Question',
      name: cleanContent(problem.content).substring(0, 200),
      text: cleanContent(problem.content),
      answerCount: 1,
      acceptedAnswer: {
        '@type': 'Answer',
        text: problem.answer,
        ...(problem.explanation && {
          description: cleanContent(problem.explanation),
        }),
      },
    },
    about: {
      '@type': 'Thing',
      name: `${school} ${grade} ${subject}`,
    },
  };
}

/**
 * Article 스키마 생성 (개념 설명, 해설)
 */
export function generateArticleSchema(params: {
  title: string;
  description: string;
  url: string;
  datePublished?: Date;
  dateModified?: Date;
  author?: string;
  image?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: params.title,
    description: params.description,
    url: params.url.startsWith('http') ? params.url : `${siteConfig.url}${params.url}`,
    datePublished: params.datePublished?.toISOString() || new Date().toISOString(),
    dateModified: params.dateModified?.toISOString() || new Date().toISOString(),
    author: {
      '@type': 'Organization',
      name: params.author || siteConfig.organization.name,
      url: siteConfig.url,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.organization.name,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}${siteConfig.organization.logo}`,
      },
    },
    ...(params.image && {
      image: params.image.startsWith('http') ? params.image : `${siteConfig.url}${params.image}`,
    }),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': params.url.startsWith('http') ? params.url : `${siteConfig.url}${params.url}`,
    },
  };
}

/**
 * FAQ 스키마 생성
 */
export interface FAQItem {
  question: string;
  answer: string;
}

export function generateFAQSchema(items: FAQItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

/**
 * Course 스키마 생성 (강좌)
 */
export function generateCourseSchema(course: {
  id: string;
  title: string;
  description?: string | null;
  gradeLevel: string;
  subject: { displayName: string };
  lessonCount?: number;
}) {
  const { school, grade } = parseGradeLevel(course.gradeLevel);
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description || `${school} ${grade} ${course.subject.displayName} 강좌`,
    provider: {
      '@type': 'Organization',
      name: siteConfig.organization.name,
      url: siteConfig.url,
    },
    educationalLevel: `${school} ${grade}`,
    inLanguage: siteConfig.language,
    ...(course.lessonCount && {
      numberOfLessons: course.lessonCount,
    }),
  };
}

/**
 * WebSite 스키마 생성 (검색 기능 포함)
 */
export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * 문제 상세 페이지용 복합 스키마 생성
 */
export function generateProblemPageSchemas(
  problem: {
    id: string;
    title?: string | null;
    content: string;
    type: string;
    options?: string | null;
    answer: string;
    explanation?: string | null;
    gradeLevel: string;
    difficulty: string;
    subject: { name: string; displayName: string };
    unit?: { name: string; code?: string | null } | null;
    source?: { name: string; organization?: string | null } | null;
    createdAt?: Date;
    updatedAt?: Date;
  },
  breadcrumbs: BreadcrumbItem[]
) {
  const { school, grade } = parseGradeLevel(problem.gradeLevel);
  const subject = problem.subject.displayName;
  const gradeSlug = problem.gradeLevel.toLowerCase().replace('_', '-');
  const subjectSlug = problem.subject.name.toLowerCase();
  const unitSlug = problem.unit?.code || 'general';
  const url = `/problems/${gradeSlug}/${subjectSlug}/${unitSlug}/${problem.id}`;
  
  return [
    // Quiz 스키마
    generateQuizSchema(problem),
    // QAPage 스키마
    generateQAPageSchema(problem),
    // Breadcrumb 스키마
    generateBreadcrumbSchema(breadcrumbs),
    // Article 스키마 (해설이 있는 경우)
    ...(problem.explanation ? [
      generateArticleSchema({
        title: `${problem.title || `${problem.unit?.name || subject} 문제`} 해설`,
        description: `${school} ${grade} ${subject} 문제 풀이 해설`,
        url,
        datePublished: problem.createdAt,
        dateModified: problem.updatedAt,
      }),
    ] : []),
  ];
}

/**
 * HTML 태그 제거 및 내용 정리
 */
function cleanContent(content: string): string {
  return content
    .replace(/<[^>]*>/g, '') // HTML 태그 제거
    .replace(/\$\$[\s\S]*?\$\$/g, '[수식]') // LaTeX 블록 수식
    .replace(/\$[^\$]*\$/g, '[수식]') // LaTeX 인라인 수식
    .replace(/\s+/g, ' ') // 연속 공백 정리
    .trim();
}
