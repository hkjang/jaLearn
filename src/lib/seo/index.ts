/**
 * SEO Library Index
 * SEO 관련 유틸리티 내보내기
 */

// SEO Configuration
export {
  siteConfig,
  gradeConfig,
  subjectConfig,
  difficultyConfig,
  problemTypeConfig,
  generateSlug,
  gradeLevelToSlug,
  slugToGradeLevel,
  parseGradeLevel,
  getFullUrl,
  getCanonicalUrl,
  generateProblemUrl,
  generateUnitUrl,
  generateSubjectUrl,
  generateGradeUrl,
  generatePageTitle,
  generateDescription,
} from './seo-config';

// Metadata Generators
export {
  generateProblemsMainMetadata,
  generateGradeMetadata,
  generateSubjectMetadata,
  generateUnitMetadata,
  generateProblemMetadata,
  generateExplanationMetadata,
} from './metadata';

// Schema.org Generators
export {
  generateOrganizationSchema,
  generateEducationalOrganizationSchema,
  generateBreadcrumbSchema,
  generateQuizSchema,
  generateQAPageSchema,
  generateArticleSchema,
  generateFAQSchema,
  generateCourseSchema,
  generateWebSiteSchema,
  generateProblemPageSchemas,
} from './schema-generators';

export type { BreadcrumbItem, FAQItem } from './schema-generators';
