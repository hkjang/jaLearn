import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import WordDetailClient from './WordDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

// ========================================
// Dynamic Metadata for SEO
// ========================================

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  
  const word = await prisma.word.findUnique({
    where: { id },
    select: {
      term: true,
      definition: true,
      gradeLevel: true,
      subjects: {
        include: { subject: true },
      },
    },
  });

  if (!word) {
    return {
      title: '단어를 찾을 수 없습니다',
    };
  }

  const subjectNames = word.subjects.map((ws) => ws.subject.displayName).join(', ');
  const title = `${word.term}이란? 뜻과 예문 | JaLearn`;
  const description = `${word.term}의 정의: ${word.definition.slice(0, 100)}... ${subjectNames} 학습에 필요한 핵심 단어입니다.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

// ========================================
// Page Component
// ========================================

export default async function WordDetailPage({ params }: PageProps) {
  const { id } = await params;

  // Fetch word data on server
  const word = await prisma.word.findUnique({
    where: { id },
    include: {
      subjects: {
        include: { subject: true },
      },
      definitions: true,
      examples: {
        take: 5,
      },
      relatedWords: {
        include: { targetWord: true },
        take: 10,
      },
      problemWords: {
        include: {
          problem: {
            select: {
              id: true,
              title: true,
              content: true,
              gradeLevel: true,
              difficulty: true,
            },
          },
        },
        take: 5,
      },
    },
  });

  if (!word) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">단어를 찾을 수 없습니다</h1>
          <p className="text-gray-600 mb-4">요청하신 단어가 존재하지 않거나 삭제되었습니다.</p>
          <a href="/words" className="text-indigo-600 hover:underline">
            단어 목록으로 돌아가기
          </a>
        </div>
      </div>
    );
  }

  // JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: word.term,
    description: word.definition,
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      name: 'JaLearn 학습 단어',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <WordDetailClient word={word} />
    </>
  );
}
