/**
 * SEO Configuration and Utilities
 * 사이트 SEO 전역 설정 및 URL 생성 유틸리티
 */

// 사이트 기본 정보
export const siteConfig = {
  name: 'JaLearn',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://jalearn.co.kr',
  locale: 'ko_KR',
  language: 'ko',
  defaultTitle: 'JaLearn - 맞춤형 학습 플랫폼',
  defaultDescription: '초중고 학생을 위한 맞춤형 AI 학습 플랫폼. 수준별 강의, 문제 풀이, 학습 분석까지.',
  defaultOgImage: '/og-image.png',
  twitterHandle: '@jalearn',
  organization: {
    name: 'JaLearn',
    logo: '/logo.png',
  },
};

// 학년 정보 매핑
export const gradeConfig = {
  elementary: {
    slug: 'elementary',
    name: '초등학교',
    levels: ['1', '2', '3', '4', '5', '6'],
  },
  middle: {
    slug: 'middle',
    name: '중학교',
    levels: ['1', '2', '3'],
  },
  high: {
    slug: 'high',
    name: '고등학교',
    levels: ['1', '2', '3'],
  },
};

// 과목 정보
export const subjectConfig: Record<string, { name: string; keywords: string[] }> = {
  math: { name: '수학', keywords: ['수학', '문제풀이', '공식', '계산'] },
  korean: { name: '국어', keywords: ['국어', '문법', '독해', '작문'] },
  english: { name: '영어', keywords: ['영어', '문법', '독해', '어휘'] },
  science: { name: '과학', keywords: ['과학', '실험', '개념'] },
  social: { name: '사회', keywords: ['사회', '역사', '지리'] },
};

// 난이도 정보
export const difficultyConfig: Record<string, string> = {
  LOW: '쉬움',
  MEDIUM: '보통',
  HIGH: '어려움',
};

// 문제 유형 정보
export const problemTypeConfig: Record<string, string> = {
  MULTIPLE_CHOICE: '객관식',
  SHORT_ANSWER: '단답형',
  ESSAY: '서술형',
  TRUE_FALSE: '참/거짓',
};

/**
 * 텍스트를 URL 슬러그로 변환
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s가-힣-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * 학년 코드를 슬러그로 변환
 * @example "MIDDLE_2" -> "middle-2"
 */
export function gradeLevelToSlug(gradeLevel: string): string {
  return gradeLevel.toLowerCase().replace('_', '-');
}

/**
 * 슬러그를 학년 코드로 변환
 * @example "middle-2" -> "MIDDLE_2"
 */
export function slugToGradeLevel(slug: string): string {
  return slug.toUpperCase().replace('-', '_');
}

/**
 * 학년 코드에서 학교급과 학년 추출
 * @example "MIDDLE_2" -> { school: "중학교", grade: "2학년" }
 */
export function parseGradeLevel(gradeLevel: string): { school: string; grade: string; gradeNum: number } {
  const parts = gradeLevel.split('_');
  const schoolSlug = parts[0].toLowerCase() as keyof typeof gradeConfig;
  const gradeNum = parseInt(parts[1] || '1');
  
  const schoolConfig = gradeConfig[schoolSlug] || gradeConfig.middle;
  
  return {
    school: schoolConfig.name,
    grade: `${gradeNum}학년`,
    gradeNum,
  };
}

/**
 * 전체 URL 생성
 */
export function getFullUrl(path: string): string {
  const baseUrl = siteConfig.url.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Canonical URL 생성
 */
export function getCanonicalUrl(path: string): string {
  return getFullUrl(path);
}

/**
 * 문제 상세 페이지 URL 생성
 */
export function generateProblemUrl(params: {
  gradeLevel: string;
  subject: string;
  unitSlug?: string;
  problemId: string;
}): string {
  const { gradeLevel, subject, unitSlug, problemId } = params;
  const gradeSlug = gradeLevelToSlug(gradeLevel);
  const subjectSlug = subject.toLowerCase();
  
  if (unitSlug) {
    return `/problems/${gradeSlug}/${subjectSlug}/${unitSlug}/${problemId}`;
  }
  return `/problems/${gradeSlug}/${subjectSlug}/${problemId}`;
}

/**
 * 단원 페이지 URL 생성
 */
export function generateUnitUrl(params: {
  gradeLevel: string;
  subject: string;
  unitSlug: string;
}): string {
  const { gradeLevel, subject, unitSlug } = params;
  const gradeSlug = gradeLevelToSlug(gradeLevel);
  const subjectSlug = subject.toLowerCase();
  
  return `/problems/${gradeSlug}/${subjectSlug}/${unitSlug}`;
}

/**
 * 과목 페이지 URL 생성
 */
export function generateSubjectUrl(params: {
  gradeLevel: string;
  subject: string;
}): string {
  const { gradeLevel, subject } = params;
  const gradeSlug = gradeLevelToSlug(gradeLevel);
  const subjectSlug = subject.toLowerCase();
  
  return `/problems/${gradeSlug}/${subjectSlug}`;
}

/**
 * 학년 페이지 URL 생성
 */
export function generateGradeUrl(gradeLevel: string): string {
  const gradeSlug = gradeLevelToSlug(gradeLevel);
  return `/problems/${gradeSlug}`;
}

/**
 * 제목 생성: 학년 + 과목 + 단원 + 유형
 */
export function generatePageTitle(params: {
  school?: string;
  grade?: string;
  subject?: string;
  unit?: string;
  problemType?: string;
  customTitle?: string;
}): string {
  const { school, grade, subject, unit, problemType, customTitle } = params;
  
  if (customTitle) {
    return `${customTitle} | ${siteConfig.name}`;
  }
  
  const parts: string[] = [];
  
  if (school) parts.push(school);
  if (grade) parts.push(grade);
  if (subject) parts.push(subject);
  if (unit) parts.push(unit);
  if (problemType) parts.push(problemType);
  
  if (parts.length > 0) {
    return `${parts.join(' ')} 문제 | ${siteConfig.name}`;
  }
  
  return siteConfig.defaultTitle;
}

/**
 * SEO 친화적 description 생성
 */
export function generateDescription(params: {
  school?: string;
  grade?: string;
  subject?: string;
  unit?: string;
  difficulty?: string;
  problemCount?: number;
  customDesc?: string;
}): string {
  const { school, grade, subject, unit, difficulty, problemCount, customDesc } = params;
  
  if (customDesc) {
    return customDesc;
  }
  
  const parts: string[] = [];
  
  if (school && grade) {
    parts.push(`${school} ${grade}`);
  }
  
  if (subject) {
    parts.push(subject);
  }
  
  if (unit) {
    parts.push(unit);
  }
  
  let base = parts.length > 0 
    ? `${parts.join(' ')} 문제를 풀어보세요.` 
    : '초중고 학생을 위한 맞춤형 문제를 풀어보세요.';
  
  if (difficulty) {
    const difficultyLabel = difficultyConfig[difficulty] || difficulty;
    base += ` 난이도: ${difficultyLabel}.`;
  }
  
  if (problemCount) {
    base += ` ${problemCount}개의 문제가 준비되어 있습니다.`;
  }
  
  base += ' AI 튜터와 함께 효과적으로 학습하세요.';
  
  return base;
}
