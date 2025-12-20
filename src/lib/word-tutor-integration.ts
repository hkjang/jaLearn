/**
 * Word-Centric AI Tutor Integration
 * 
 * 단어 중심 학습을 AI 튜터에 통합하는 서비스
 * 학생의 취약 어휘를 분석하고 설명을 어휘 기반으로 제공합니다.
 */

import { prisma } from './prisma';
import { StudentContext, LearningMemory } from './ai-tutor-prompts';
import { getWeakWords, getReviewDueWords } from './word-personalization-service';
import { extractWordsFromUserQuestion, matchExistingWords } from './word-extraction-service';

// ========================================
// Types
// ========================================

export interface WordContext {
  userId: string;
  weakWords: Array<{
    term: string;
    definition: string;
    masteryLevel: number;
  }>;
  reviewDueWords: Array<{
    term: string;
    definition: string;
    nextReviewDate: Date;
  }>;
  recentlyAskedWords: string[];
}

export interface WordEnrichedResponse {
  content: string;
  highlightedWords: Array<{
    term: string;
    wordId: string;
    definition: string;
  }>;
  suggestedWordReview?: string[];
  wordQuizSuggestion?: {
    wordId: string;
    term: string;
    quizType: 'DEFINITION' | 'EXAMPLE';
  };
}

// ========================================
// Word Context Builder
// ========================================

/**
 * 학생의 단어 컨텍스트 구성
 */
export async function buildWordContext(userId: string): Promise<WordContext> {
  // 취약 단어 조회
  const weakProgress = await getWeakWords(userId, { limit: 10 });
  const weakWords = weakProgress.map(p => ({
    term: p.word.term,
    definition: p.word.definition,
    masteryLevel: p.masteryLevel,
  }));

  // 복습 필요 단어 조회
  const reviewProgress = await getReviewDueWords(userId, { limit: 10 });
  const reviewDueWords = reviewProgress.map(p => ({
    term: p.word.term,
    definition: p.word.definition,
    nextReviewDate: p.nextReviewDate,
  }));

  return {
    userId,
    weakWords,
    reviewDueWords,
    recentlyAskedWords: [],
  };
}

// ========================================
// Word-Centric Prompt Extensions
// ========================================

/**
 * 단어 중심 시스템 프롬프트 확장
 */
export function buildWordCentricPromptExtension(wordContext: WordContext): string {
  let prompt = `\n\n## 단어 중심 학습 지침\n`;

  // 취약 단어 언급
  if (wordContext.weakWords.length > 0) {
    prompt += `\n### 학생의 취약 어휘\n`;
    prompt += `다음 단어들은 학생이 어려워하는 어휘입니다. 가능한 경우 이 단어들을 자연스럽게 설명해주세요:\n`;
    wordContext.weakWords.slice(0, 5).forEach(w => {
      prompt += `- **${w.term}**: ${w.definition.slice(0, 50)}...\n`;
    });
  }

  // 복습 필요 단어 언급
  if (wordContext.reviewDueWords.length > 0) {
    prompt += `\n### 복습 필요 어휘\n`;
    prompt += `다음 단어들은 복습이 필요합니다. 대화 중 자연스럽게 상기시켜주세요:\n`;
    wordContext.reviewDueWords.slice(0, 3).forEach(w => {
      prompt += `- ${w.term}\n`;
    });
  }

  prompt += `\n### 단어 설명 원칙\n`;
  prompt += `1. 어려운 용어가 나오면 학생의 학년 수준에 맞게 쉽게 설명하세요\n`;
  prompt += `2. 핵심 개념어는 예시와 함께 설명하세요\n`;
  prompt += `3. 관련 단어(유사어, 반대어)를 함께 언급하면 기억에 도움이 됩니다\n`;
  prompt += `4. 단어를 질문할 때는 "이 단어가 무슨 뜻인 것 같아?" 형태로 먼저 물어보세요\n`;

  return prompt;
}

/**
 * 학년별 단어 설명 스타일 지침
 */
export function getGradeLevelWordStyle(gradeLevel: string): string {
  if (gradeLevel.startsWith('ELEMENTARY')) {
    return `\n## 단어 설명 스타일 (초등)
- 일상 예시로 설명: "광합성은 식물이 햇빛으로 밥을 만드는 거야"
- 이모지 활용: 🌱➕☀️➡️🍽️
- 비유 사용: "그건 마치 ~와 같아"
- 한 문장씩 짧게 설명`;
  }

  if (gradeLevel.startsWith('MIDDLE')) {
    return `\n## 단어 설명 스타일 (중등)
- 정의 + 예시 조합: "광합성이란 식물이 빛에너지로 포도당을 합성하는 과정이야"
- 개념 간 연결: "이건 우리가 배운 에너지 보존과도 관련 있어"
- 핵심 키워드 강조
- 왜 중요한지 맥락 설명`;
  }

  return `\n## 단어 설명 스타일 (고등)
- 정확한 학술 정의 제공
- 시험 출제 포인트 언급: "이 개념은 수능에서 자주 나와"
- 유사 개념과 구별점 강조
- 실제 적용 사례 제시`;
}

// ========================================
// Word Detection & Highlighting
// ========================================

/**
 * 사용자 메시지에서 단어 질문 감지
 */
export async function detectWordQuestion(
  message: string,
  userId: string
): Promise<{
  isWordQuestion: boolean;
  detectedWords: Array<{ term: string; wordId?: string; exists: boolean }>;
}> {
  // 단어 질문 패턴
  const patterns = [
    /([가-힣a-zA-Z]+)(?:이|가)\s*(?:뭐|무엇)/,
    /([가-힣a-zA-Z]+)(?:의|에\s*대한)\s*(?:뜻|의미|정의)/,
    /([가-힣a-zA-Z]+)(?:란|이란)\s*(?:뭐|무엇)/,
    /([가-힣a-zA-Z]+)(?:을|를)\s*(?:설명|알려)/,
  ];

  const detectedTerms: string[] = [];
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      detectedTerms.push(match[1]);
    }
  }

  if (detectedTerms.length === 0) {
    // 단어 추출 서비스로 폴백
    const extraction = await extractWordsFromUserQuestion(message, `user-${userId}`);
    detectedTerms.push(...extraction.extractedWords.map(w => w.term));
  }

  // DB 매칭
  const existingWords = await matchExistingWords(detectedTerms);
  
  const detectedWords = detectedTerms.map(term => {
    const existing = existingWords.find(w => 
      w.term.toLowerCase() === term.toLowerCase()
    );
    return {
      term,
      wordId: existing?.id,
      exists: !!existing,
    };
  });

  return {
    isWordQuestion: detectedTerms.length > 0,
    detectedWords,
  };
}

/**
 * 응답에서 핵심 단어 하이라이트
 */
export async function enrichResponseWithWords(
  content: string,
  gradeLevel: string
): Promise<WordEnrichedResponse> {
  // 응답 텍스트에서 등록된 단어 찾기
  const allWords = await prisma.word.findMany({
    where: {
      isActive: true,
      gradeLevel,
    },
    select: {
      id: true,
      term: true,
      definition: true,
    },
    take: 100,
  });

  const highlightedWords: WordEnrichedResponse['highlightedWords'] = [];

  for (const word of allWords) {
    if (content.includes(word.term)) {
      highlightedWords.push({
        term: word.term,
        wordId: word.id,
        definition: word.definition,
      });
    }
  }

  return {
    content,
    highlightedWords,
  };
}

// ========================================
// Word-Based Answer Generation
// ========================================

/**
 * 단어 중심 답변 생성 프롬프트
 */
export function buildWordExplanationPrompt(
  term: string,
  definition: string,
  gradeLevel: string,
  context?: {
    relatedWords?: string[];
    problemContext?: string;
  }
): string {
  const gradeStyle = getGradeLevelWordStyle(gradeLevel);
  
  let prompt = `학생이 "${term}"이라는 단어에 대해 질문했습니다.\n\n`;
  prompt += `## 단어 정보\n`;
  prompt += `- 단어: ${term}\n`;
  prompt += `- 정의: ${definition}\n`;
  
  if (context?.relatedWords?.length) {
    prompt += `- 관련어: ${context.relatedWords.join(', ')}\n`;
  }
  
  if (context?.problemContext) {
    prompt += `\n## 문제 맥락\n${context.problemContext}\n`;
  }
  
  prompt += gradeStyle;
  prompt += `\n\n## 요청\n`;
  prompt += `이 단어를 학생의 수준에 맞게 설명해주세요. `;
  prompt += `단, 바로 정의를 말하지 말고 먼저 학생이 아는 것을 물어보세요.\n`;
  prompt += `예: "혹시 ${term}이라는 말 들어본 적 있어?" 또는 "이 단어가 어떤 뜻일 것 같아?"\n`;

  return prompt;
}

/**
 * 취약 단어 분석 기반 학습 추천
 */
export async function analyzeAndRecommend(
  userId: string,
  sessionContext?: { subject?: string; topic?: string }
): Promise<{
  focusWords: Array<{ term: string; reason: string }>;
  suggestedQuiz: boolean;
  recommendation: string;
}> {
  const wordContext = await buildWordContext(userId);
  
  const focusWords: Array<{ term: string; reason: string }> = [];
  
  // 취약 단어 중 현재 과목 관련
  for (const weak of wordContext.weakWords.slice(0, 3)) {
    focusWords.push({
      term: weak.term,
      reason: `숙달도 ${weak.masteryLevel}/5로 추가 학습 필요`,
    });
  }
  
  // 복습 필요 단어
  for (const review of wordContext.reviewDueWords.slice(0, 2)) {
    focusWords.push({
      term: review.term,
      reason: '복습 시점 도래',
    });
  }
  
  const suggestedQuiz = focusWords.length >= 3;
  
  let recommendation = '';
  if (focusWords.length === 0) {
    recommendation = '현재 취약한 어휘가 없습니다. 새로운 단어 학습을 시작해보세요!';
  } else if (suggestedQuiz) {
    recommendation = `${focusWords.length}개의 단어가 복습이 필요합니다. 간단한 퀴즈를 풀어볼까요?`;
  } else {
    recommendation = `"${focusWords[0].term}" 단어를 중심으로 학습하면 좋겠어요.`;
  }
  
  return {
    focusWords,
    suggestedQuiz,
    recommendation,
  };
}

// ========================================
// Session Integration
// ========================================

/**
 * 세션 시작 시 단어 컨텍스트 주입
 */
export async function injectWordContextToSession(
  userId: string,
  basePrompt: string,
  studentContext: StudentContext
): Promise<string> {
  const wordContext = await buildWordContext(userId);
  
  let enhancedPrompt = basePrompt;
  
  // 단어 중심 확장 추가
  enhancedPrompt += buildWordCentricPromptExtension(wordContext);
  
  // 학년별 스타일 추가
  enhancedPrompt += getGradeLevelWordStyle(studentContext.gradeLevel);
  
  return enhancedPrompt;
}

/**
 * 메시지 처리 시 단어 감지 및 처리
 */
export async function processMessageWithWords(
  userId: string,
  message: string,
  gradeLevel: string
): Promise<{
  wordContext?: {
    isWordQuestion: boolean;
    matchedWord?: { term: string; definition: string; wordId: string };
    explanationPrompt?: string;
  };
  suggestQuiz: boolean;
}> {
  const detection = await detectWordQuestion(message, userId);
  
  if (!detection.isWordQuestion) {
    return { suggestQuiz: false };
  }
  
  // 첫 번째 감지된 단어 처리
  const firstWord = detection.detectedWords[0];
  
  if (firstWord?.exists && firstWord.wordId) {
    const word = await prisma.word.findUnique({
      where: { id: firstWord.wordId },
      include: {
        relatedWords: {
          include: { targetWord: true },
          take: 3,
        },
      },
    });
    
    if (word) {
      const relatedTerms = word.relatedWords.map(r => r.targetWord.term);
      const explanationPrompt = buildWordExplanationPrompt(
        word.term,
        word.definition,
        gradeLevel,
        { relatedWords: relatedTerms }
      );
      
      return {
        wordContext: {
          isWordQuestion: true,
          matchedWord: {
            term: word.term,
            definition: word.definition,
            wordId: word.id,
          },
          explanationPrompt,
        },
        suggestQuiz: true,
      };
    }
  }
  
  // 새로운 단어 (DB에 없음)
  return {
    wordContext: {
      isWordQuestion: true,
      matchedWord: undefined,
    },
    suggestQuiz: false,
  };
}

// ========================================
// Export Word Tutor Integration
// ========================================

export const wordTutorIntegration = {
  buildWordContext,
  buildWordCentricPromptExtension,
  getGradeLevelWordStyle,
  detectWordQuestion,
  enrichResponseWithWords,
  buildWordExplanationPrompt,
  analyzeAndRecommend,
  injectWordContextToSession,
  processMessageWithWords,
};
