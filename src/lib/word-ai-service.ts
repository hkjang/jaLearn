/**
 * Word AI Service - AI 단어 설명 서비스
 * 
 * AI를 활용한 단어 설명, 비유 생성, 취약점 분석
 */

import { prisma } from './prisma';

// ========================================
// Types
// ========================================

export interface AIExplanation {
  simpleExplanation: string;
  metaphor?: string;
  gradeLevel: string;
  examples?: string[];
}

export interface WordAnalysis {
  weakPoints: string[];
  suggestedFocus: string[];
  relatedConcepts: string[];
}

// ========================================
// Grade-Level Explanations
// ========================================

/**
 * 학년별 맞춤 설명 생성 (프롬프트 템플릿)
 */
export function generateExplanationPrompt(
  term: string,
  definition: string,
  gradeLevel: string,
  subject?: string
): string {
  const gradeLevelMap: Record<string, string> = {
    'ELEMENTARY_1': '초등학교 1학년',
    'ELEMENTARY_2': '초등학교 2학년',
    'ELEMENTARY_3': '초등학교 3학년',
    'ELEMENTARY_4': '초등학교 4학년',
    'ELEMENTARY_5': '초등학교 5학년',
    'ELEMENTARY_6': '초등학교 6학년',
    'MIDDLE_1': '중학교 1학년',
    'MIDDLE_2': '중학교 2학년',
    'MIDDLE_3': '중학교 3학년',
    'HIGH_1': '고등학교 1학년',
    'HIGH_2': '고등학교 2학년',
    'HIGH_3': '고등학교 3학년',
  };

  const gradeText = gradeLevelMap[gradeLevel] || '중학생';

  return `
당신은 ${gradeText} 학생을 위한 교육 전문가입니다.

다음 단어를 ${gradeText} 수준에 맞게 쉽게 설명해주세요.

**단어**: ${term}
**정식 정의**: ${definition}
${subject ? `**과목**: ${subject}` : ''}

## 요구사항:
1. **쉬운 설명**: ${gradeText}이 이해할 수 있는 단어로 설명
2. **비유**: 일상생활의 예시를 들어 비유로 설명
3. **예문**: 이 단어를 사용한 간단한 예문 2개

## 응답 형식 (JSON):
{
  "simpleExplanation": "쉬운 설명",
  "metaphor": "비유 설명",
  "examples": ["예문1", "예문2"]
}
`.trim();
}

/**
 * 학년별 쉬운 설명 생성 (실제 AI 호출 대신 템플릿 기반)
 */
export async function generateSimpleExplanation(
  wordId: string,
  targetGradeLevel: string
): Promise<AIExplanation | null> {
  const word = await prisma.word.findUnique({
    where: { id: wordId },
    include: {
      subjects: { include: { subject: true } },
      definitions: { where: { gradeLevel: targetGradeLevel } },
    },
  });

  if (!word) return null;

  // 이미 해당 학년 정의가 있으면 반환
  if (word.definitions.length > 0) {
    return {
      simpleExplanation: word.definitions[0].definition,
      metaphor: word.definitions[0].metaphor ?? undefined,
      gradeLevel: targetGradeLevel,
    };
  }

  // 기본 설명이 있으면 변환 (실제로는 AI API 호출)
  // 여기서는 템플릿 기반 간단 변환
  const simpleExplanation = simplifyDefinition(word.definition, targetGradeLevel);

  return {
    simpleExplanation,
    gradeLevel: targetGradeLevel,
  };
}

/**
 * 정의 간단히 변환 (룰 기반)
 */
function simplifyDefinition(definition: string, gradeLevel: string): string {
  let simplified = definition;

  // 어려운 한자어 → 쉬운 말로 변환
  const simplifications: Record<string, string> = {
    '개념': '생각',
    '원리': '이유',
    '현상': '일어나는 일',
    '과정': '순서',
    '결과': '결과',
    '특성': '특징',
    '요소': '부분',
    '구조': '모양',
    '기능': '역할',
    '역할': '하는 일',
  };

  // 초등학생용 추가 간소화
  if (gradeLevel.startsWith('ELEMENTARY')) {
    for (const [hard, easy] of Object.entries(simplifications)) {
      simplified = simplified.replace(new RegExp(hard, 'g'), easy);
    }
  }

  return simplified;
}

// ========================================
// Metaphor Generation
// ========================================

/**
 * 비유 설명 생성 프롬프트
 */
export function generateMetaphorPrompt(
  term: string,
  definition: string,
  gradeLevel: string
): string {
  const isElementary = gradeLevel.startsWith('ELEMENTARY');
  
  return `
다음 ${isElementary ? '어린이' : '학생'}가 이해하기 쉽게 비유로 설명해주세요.

**단어**: ${term}
**정의**: ${definition}

## 비유 예시:
- "광합성은 식물이 햇빛으로 밥을 만드는 것과 같아요"
- "관성은 달리다가 갑자기 멈추면 넘어지는 것과 같아요"

## 요구사항:
1. 일상생활에서 쉽게 볼 수 있는 예시 사용
2. ${isElementary ? '초등학생' : '청소년'}이 공감할 수 있는 상황
3. 핵심 개념이 정확하게 전달되어야 함

비유 설명만 한 문장으로 답변해주세요.
`.trim();
}

// ========================================
// Weak Point Analysis
// ========================================

/**
 * 단어 이해 부족 지점 분석
 */
export async function analyzeWeakPoint(
  userId: string,
  wordId: string
): Promise<WordAnalysis> {
  // 사용자의 퀴즈 결과 분석
  const quizResults = await prisma.wordQuizResult.findMany({
    where: { userId, wordId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  // 단어 정보 조회
  const word = await prisma.word.findUnique({
    where: { id: wordId },
    include: {
      relatedWords: { include: { targetWord: true } },
    },
  });

  if (!word) {
    return { weakPoints: [], suggestedFocus: [], relatedConcepts: [] };
  }

  // 퀴즈 유형별 정답률 분석
  const typeStats: Record<string, { correct: number; total: number }> = {};
  for (const result of quizResults) {
    if (!typeStats[result.quizType]) {
      typeStats[result.quizType] = { correct: 0, total: 0 };
    }
    typeStats[result.quizType].total++;
    if (result.isCorrect) {
      typeStats[result.quizType].correct++;
    }
  }

  // 취약점 분석
  const weakPoints: string[] = [];
  const suggestedFocus: string[] = [];

  for (const [type, stats] of Object.entries(typeStats)) {
    const rate = stats.correct / stats.total;
    if (rate < 0.5) {
      switch (type) {
        case 'DEFINITION':
          weakPoints.push('단어의 정의를 정확히 기억하지 못합니다.');
          suggestedFocus.push('정의를 여러 번 반복해서 읽어보세요.');
          break;
        case 'EXAMPLE':
          weakPoints.push('예문에서 단어의 쓰임을 파악하기 어려워합니다.');
          suggestedFocus.push('다양한 예문을 통해 문맥을 익혀보세요.');
          break;
        case 'RELATION':
          weakPoints.push('관련 단어와의 연결이 약합니다.');
          suggestedFocus.push('유사어와 반대어를 함께 공부하세요.');
          break;
        case 'LISTENING':
          weakPoints.push('듣기를 통한 인식이 어렵습니다.');
          suggestedFocus.push('단어를 소리 내어 읽는 연습을 해보세요.');
          break;
      }
    }
  }

  // 관련 개념
  const relatedConcepts = word.relatedWords.map(r => r.targetWord.term);

  return {
    weakPoints,
    suggestedFocus,
    relatedConcepts,
  };
}

// ========================================
// Problem Recommendations
// ========================================

/**
 * 단어 포함 문제 추천
 */
export async function recommendProblemsForWord(
  wordId: string,
  options: {
    limit?: number;
    difficulty?: string;
  } = {}
) {
  const { limit = 5, difficulty } = options;

  return prisma.problemWord.findMany({
    where: {
      wordId,
      problem: {
        status: 'APPROVED',
        ...(difficulty && { difficulty }),
      },
    },
    include: {
      problem: {
        select: {
          id: true,
          title: true,
          content: true,
          type: true,
          difficulty: true,
          gradeLevel: true,
        },
      },
    },
    orderBy: { isKeyWord: 'desc' },
    take: limit,
  });
}

/**
 * 취약 단어 기반 문제 추천
 */
export async function recommendProblemsForWeakWords(
  userId: string,
  options: {
    limit?: number;
    subjectId?: string;
  } = {}
) {
  const { limit = 10, subjectId } = options;

  // 취약 단어 조회
  const weakProgress = await prisma.userWordProgress.findMany({
    where: {
      userId,
      isWeak: true,
      ...(subjectId && {
        word: { subjects: { some: { subjectId } } },
      }),
    },
    select: { wordId: true },
    take: 20,
  });

  const weakWordIds = weakProgress.map(p => p.wordId);

  // 취약 단어가 포함된 문제 추천
  return prisma.problemWord.findMany({
    where: {
      wordId: { in: weakWordIds },
      problem: {
        status: 'APPROVED',
      },
    },
    include: {
      problem: {
        select: {
          id: true,
          title: true,
          content: true,
          type: true,
          difficulty: true,
          gradeLevel: true,
        },
      },
      word: {
        select: {
          id: true,
          term: true,
        },
      },
    },
    take: limit,
  });
}

// ========================================
// Quiz Generation
// ========================================

/**
 * 단어 기반 퀴즈 생성
 */
export async function generateWordQuiz(
  wordId: string,
  quizType: 'DEFINITION' | 'EXAMPLE' | 'RELATION' | 'LISTENING'
) {
  const word = await prisma.word.findUnique({
    where: { id: wordId },
    include: {
      examples: { take: 3 },
      relatedWords: {
        include: { targetWord: true },
        take: 3,
      },
    },
  });

  if (!word) return null;

  // 유사한 학년의 다른 단어들 (오답 보기용)
  const distractors = await prisma.word.findMany({
    where: {
      gradeLevel: word.gradeLevel,
      id: { not: wordId },
      isActive: true,
    },
    take: 3,
    orderBy: { usageCount: 'desc' },
  });

  switch (quizType) {
    case 'DEFINITION':
      return {
        type: 'DEFINITION',
        question: `"${word.term}"의 뜻으로 올바른 것은?`,
        options: shuffleArray([
          { text: word.definition, isCorrect: true },
          ...distractors.map(d => ({ text: d.definition, isCorrect: false })),
        ]),
        wordId,
        term: word.term,
      };

    case 'EXAMPLE':
      const example = word.examples[0];
      if (!example) {
        return generateWordQuiz(wordId, 'DEFINITION');
      }
      return {
        type: 'EXAMPLE',
        question: `다음 문장의 빈칸에 들어갈 알맞은 단어는?\n"${example.sentence.replace(word.term, '______')}"`,
        options: shuffleArray([
          { text: word.term, isCorrect: true },
          ...distractors.map(d => ({ text: d.term, isCorrect: false })),
        ]),
        wordId,
        term: word.term,
      };

    case 'RELATION':
      const synonym = word.relatedWords.find(r => r.relationType === 'SYNONYM');
      if (!synonym) {
        return generateWordQuiz(wordId, 'DEFINITION');
      }
      return {
        type: 'RELATION',
        question: `"${word.term}"과 비슷한 뜻을 가진 단어는?`,
        options: shuffleArray([
          { text: synonym.targetWord.term, isCorrect: true },
          ...distractors.map(d => ({ text: d.term, isCorrect: false })),
        ]),
        wordId,
        term: word.term,
      };

    case 'LISTENING':
      return {
        type: 'LISTENING',
        question: '들려주는 단어의 뜻을 선택하세요.',
        audioText: word.term, // TTS로 읽어줄 텍스트
        options: shuffleArray([
          { text: word.definition, isCorrect: true },
          ...distractors.map(d => ({ text: d.definition, isCorrect: false })),
        ]),
        wordId,
        term: word.term,
      };
  }
}

// ========================================
// Helper Functions
// ========================================

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
