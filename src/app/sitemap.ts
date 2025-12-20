/**
 * Dynamic Sitemap Generation
 * 동적 사이트맵 생성
 */

import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { siteConfig, gradeLevelToSlug } from '@/lib/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;
  
  // 정적 페이지
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/problems`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/courses`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/ai-tutor`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];
  
  // 학년별 페이지 URL 생성
  const gradeLevels = [
    'ELEMENTARY_1', 'ELEMENTARY_2', 'ELEMENTARY_3', 'ELEMENTARY_4', 'ELEMENTARY_5', 'ELEMENTARY_6',
    'MIDDLE_1', 'MIDDLE_2', 'MIDDLE_3',
    'HIGH_1', 'HIGH_2', 'HIGH_3',
  ];
  
  const gradePages: MetadataRoute.Sitemap = gradeLevels.map(grade => ({
    url: `${baseUrl}/problems/${gradeLevelToSlug(grade)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));
  
  // 과목 데이터 가져오기
  const subjects = await prisma.subject.findMany();
  
  // 학년 + 과목 조합 페이지
  const subjectPages: MetadataRoute.Sitemap = [];
  for (const grade of gradeLevels) {
    for (const subject of subjects) {
      subjectPages.push({
        url: `${baseUrl}/problems/${gradeLevelToSlug(grade)}/${subject.name.toLowerCase()}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      });
    }
  }
  
  // 단원 페이지
  const units = await prisma.problemUnit.findMany({
    select: {
      code: true,
      name: true,
      gradeLevel: true,
      subject: {
        select: { name: true },
      },
    },
  });
  
  const unitPages: MetadataRoute.Sitemap = units.map(unit => ({
    url: `${baseUrl}/problems/${gradeLevelToSlug(unit.gradeLevel)}/${unit.subject.name.toLowerCase()}/${unit.code || encodeURIComponent(unit.name)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));
  
  // 승인된 문제 페이지
  const problems = await prisma.problem.findMany({
    where: {
      status: 'APPROVED',
    },
    select: {
      id: true,
      gradeLevel: true,
      updatedAt: true,
      subject: {
        select: { name: true },
      },
      unit: {
        select: { code: true, name: true },
      },
    },
    take: 10000, // 제한 설정
  });
  
  const problemPages: MetadataRoute.Sitemap = problems.map(problem => {
    const unitSlug = problem.unit?.code || (problem.unit?.name ? encodeURIComponent(problem.unit.name) : 'general');
    return {
      url: `${baseUrl}/problems/${gradeLevelToSlug(problem.gradeLevel)}/${problem.subject.name.toLowerCase()}/${unitSlug}/${problem.id}`,
      lastModified: problem.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    };
  });
  
  // 단어 목록 페이지
  const wordListPage: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/words`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
  ];
  
  // 단어 상세 페이지
  const words = await prisma.word.findMany({
    where: {
      isActive: true,
      isVerified: true,
    },
    select: {
      id: true,
      term: true,
      updatedAt: true,
    },
    take: 10000, // 제한 설정
  });
  
  const wordPages: MetadataRoute.Sitemap = words.map(word => ({
    url: `${baseUrl}/words/${word.id}`,
    lastModified: word.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));
  
  return [
    ...staticPages,
    ...gradePages,
    ...subjectPages,
    ...unitPages,
    ...problemPages,
    ...wordListPage,
    ...wordPages,
  ];
}
