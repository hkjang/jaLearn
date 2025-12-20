/**
 * Word Service - 단어 CRUD 및 검색 서비스
 * 
 * 모든 과목의 단어 관리를 위한 핵심 서비스
 */

import { prisma } from './prisma';

// ========================================
// Types
// ========================================

export interface WordFilters {
  subjectId?: string;
  gradeLevel?: string;
  termType?: string;
  search?: string;
  isVerified?: boolean;
  isActive?: boolean;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: 'term' | 'createdAt' | 'usageCount' | 'correctRate';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateWordInput {
  term: string;
  pronunciation?: string;
  termType: 'VOCABULARY' | 'CONCEPT' | 'SYMBOL' | 'TERM' | 'THEORY' | 'MODEL';
  gradeLevel: string;
  definition: string;
  simpleDefinition?: string;
  imageUrl?: string;
  audioUrl?: string;
  subjectIds?: string[];
}

export interface UpdateWordInput extends Partial<CreateWordInput> {
  isVerified?: boolean;
  isActive?: boolean;
}

// ========================================
// Word CRUD Operations
// ========================================

/**
 * 단어 목록 조회 (필터링, 페이지네이션)
 */
export async function getWords(
  filters: WordFilters = {},
  pagination: PaginationOptions = {}
) {
  const {
    subjectId,
    gradeLevel,
    termType,
    search,
    isVerified,
    isActive = true,
  } = filters;

  const {
    page = 1,
    limit = 20,
    sortBy = 'term',
    sortOrder = 'asc',
  } = pagination;

  const where: Parameters<typeof prisma.word.findMany>[0]['where'] = {
    isActive,
    ...(gradeLevel && { gradeLevel }),
    ...(termType && { termType }),
    ...(isVerified !== undefined && { isVerified }),
    ...(search && {
      OR: [
        { term: { contains: search } },
        { definition: { contains: search } },
      ],
    }),
    ...(subjectId && {
      subjects: {
        some: { subjectId },
      },
    }),
  };

  const [words, total] = await Promise.all([
    prisma.word.findMany({
      where,
      include: {
        subjects: {
          include: { subject: true },
        },
        definitions: true,
        _count: {
          select: {
            examples: true,
            problemWords: true,
            userProgress: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.word.count({ where }),
  ]);

  return {
    words,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * 단어 상세 조회
 */
export async function getWordById(id: string) {
  const word = await prisma.word.findUnique({
    where: { id },
    include: {
      subjects: {
        include: { subject: true },
      },
      definitions: true,
      examples: {
        take: 10,
      },
      relatedWords: {
        include: { targetWord: true },
      },
      problemWords: {
        include: {
          problem: {
            select: {
              id: true,
              title: true,
              content: true,
              gradeLevel: true,
            },
          },
        },
        take: 5,
      },
      _count: {
        select: {
          userProgress: true,
          quizResults: true,
        },
      },
    },
  });

  if (!word) return null;

  // 조회 수 증가
  await prisma.word.update({
    where: { id },
    data: { usageCount: { increment: 1 } },
  });

  return word;
}

/**
 * 단어 생성
 */
export async function createWord(input: CreateWordInput) {
  const { subjectIds, ...wordData } = input;

  const word = await prisma.word.create({
    data: {
      ...wordData,
      subjects: subjectIds
        ? {
            create: subjectIds.map((subjectId) => ({ subjectId })),
          }
        : undefined,
    },
    include: {
      subjects: {
        include: { subject: true },
      },
    },
  });

  return word;
}

/**
 * 단어 수정
 */
export async function updateWord(id: string, input: UpdateWordInput) {
  const { subjectIds, ...wordData } = input;

  // 과목 연결 업데이트가 있는 경우
  if (subjectIds) {
    await prisma.wordSubject.deleteMany({
      where: { wordId: id },
    });

    await prisma.wordSubject.createMany({
      data: subjectIds.map((subjectId) => ({
        wordId: id,
        subjectId,
      })),
    });
  }

  const word = await prisma.word.update({
    where: { id },
    data: wordData,
    include: {
      subjects: {
        include: { subject: true },
      },
    },
  });

  return word;
}

/**
 * 단어 삭제 (소프트 삭제)
 */
export async function deleteWord(id: string) {
  return prisma.word.update({
    where: { id },
    data: { isActive: false },
  });
}

/**
 * 단어 하드 삭제 (관리자 전용)
 */
export async function hardDeleteWord(id: string) {
  return prisma.word.delete({
    where: { id },
  });
}

// ========================================
// Word Search & Discovery
// ========================================

/**
 * 단어 검색 (자동완성)
 */
export async function searchWords(query: string, limit = 10) {
  return prisma.word.findMany({
    where: {
      isActive: true,
      OR: [
        { term: { contains: query } },
        { pronunciation: { contains: query } },
      ],
    },
    select: {
      id: true,
      term: true,
      pronunciation: true,
      termType: true,
      gradeLevel: true,
      definition: true,
    },
    take: limit,
    orderBy: { usageCount: 'desc' },
  });
}

/**
 * 문제별 단어 조회
 */
export async function getWordsByProblem(problemId: string) {
  return prisma.problemWord.findMany({
    where: { problemId },
    include: {
      word: {
        include: {
          subjects: {
            include: { subject: true },
          },
        },
      },
    },
    orderBy: { isKeyWord: 'desc' },
  });
}

/**
 * 관련 단어 조회
 */
export async function getRelatedWords(wordId: string) {
  const relations = await prisma.wordRelation.findMany({
    where: { sourceWordId: wordId },
    include: {
      targetWord: {
        select: {
          id: true,
          term: true,
          definition: true,
          termType: true,
          gradeLevel: true,
        },
      },
    },
  });

  // 관계 유형별로 그룹화
  const grouped = relations.reduce((acc, rel) => {
    if (!acc[rel.relationType]) {
      acc[rel.relationType] = [];
    }
    acc[rel.relationType].push(rel.targetWord);
    return acc;
  }, {} as Record<string, typeof relations[0]['targetWord'][]>);

  return grouped;
}

// ========================================
// Word Examples
// ========================================

/**
 * 단어 예문 추가
 */
export async function addWordExample(
  wordId: string,
  sentence: string,
  source?: string,
  problemId?: string
) {
  return prisma.wordExample.create({
    data: {
      wordId,
      sentence,
      source,
      problemId,
    },
  });
}

/**
 * 단어 예문 목록 조회
 */
export async function getWordExamples(wordId: string, limit = 10) {
  return prisma.wordExample.findMany({
    where: { wordId },
    take: limit,
    orderBy: { id: 'desc' },
  });
}

// ========================================
// Word Relations
// ========================================

/**
 * 단어 관계 추가
 */
export async function addWordRelation(
  sourceWordId: string,
  targetWordId: string,
  relationType: 'SYNONYM' | 'ANTONYM' | 'HYPERNYM' | 'HYPONYM' | 'RELATED'
) {
  return prisma.wordRelation.create({
    data: {
      sourceWordId,
      targetWordId,
      relationType,
    },
  });
}

// ========================================
// Word Definitions
// ========================================

/**
 * 학년별 정의 추가/수정
 */
export async function upsertWordDefinition(
  wordId: string,
  gradeLevel: string,
  definition: string,
  metaphor?: string
) {
  return prisma.wordDefinition.upsert({
    where: {
      wordId_gradeLevel: { wordId, gradeLevel },
    },
    create: {
      wordId,
      gradeLevel,
      definition,
      metaphor,
    },
    update: {
      definition,
      metaphor,
    },
  });
}

/**
 * 학년에 맞는 정의 조회
 */
export async function getWordDefinitionForGrade(wordId: string, gradeLevel: string) {
  // 해당 학년 정의 먼저 찾기
  let definition = await prisma.wordDefinition.findUnique({
    where: {
      wordId_gradeLevel: { wordId, gradeLevel },
    },
  });

  // 없으면 기본 정의 반환
  if (!definition) {
    const word = await prisma.word.findUnique({
      where: { id: wordId },
      select: { definition: true, simpleDefinition: true },
    });
    return word;
  }

  return definition;
}

// ========================================
// Problem-Word Linking
// ========================================

/**
 * 문제에 단어 연결
 */
export async function linkWordToProblem(
  problemId: string,
  wordId: string,
  isKeyWord = false,
  position?: string
) {
  return prisma.problemWord.upsert({
    where: {
      problemId_wordId: { problemId, wordId },
    },
    create: {
      problemId,
      wordId,
      isKeyWord,
      position,
    },
    update: {
      isKeyWord,
      position,
    },
  });
}

/**
 * 문제의 핵심 단어 업데이트
 */
export async function setKeyWords(problemId: string, wordIds: string[]) {
  // 모든 단어를 비핵심으로
  await prisma.problemWord.updateMany({
    where: { problemId },
    data: { isKeyWord: false },
  });

  // 지정된 단어만 핵심으로
  await prisma.problemWord.updateMany({
    where: {
      problemId,
      wordId: { in: wordIds },
    },
    data: { isKeyWord: true },
  });
}

// ========================================
// Statistics
// ========================================

/**
 * 단어 통계 조회
 */
export async function getWordStats(wordId: string) {
  const [quizResults, progressStats] = await Promise.all([
    prisma.wordQuizResult.aggregate({
      where: { wordId },
      _count: true,
      _avg: { timeSpent: true },
    }),
    prisma.userWordProgress.aggregate({
      where: { wordId },
      _count: true,
      _avg: { masteryLevel: true },
    }),
  ]);

  const correctCount = await prisma.wordQuizResult.count({
    where: { wordId, isCorrect: true },
  });

  return {
    totalQuizzes: quizResults._count,
    avgTimeSpent: quizResults._avg.timeSpent,
    correctRate: quizResults._count > 0 
      ? (correctCount / quizResults._count) * 100 
      : null,
    totalLearners: progressStats._count,
    avgMastery: progressStats._avg.masteryLevel,
  };
}

/**
 * 과목별 단어 수 조회
 */
export async function getWordCountBySubject() {
  const counts = await prisma.wordSubject.groupBy({
    by: ['subjectId'],
    _count: true,
  });

  return counts;
}

/**
 * 학년별 단어 수 조회
 */
export async function getWordCountByGrade() {
  const counts = await prisma.word.groupBy({
    by: ['gradeLevel'],
    where: { isActive: true },
    _count: true,
  });

  return counts;
}
