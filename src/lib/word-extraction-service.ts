/**
 * Word Extraction Service - 단어 자동 추출 서비스
 * 
 * 문제, 해설, 교과서 등에서 핵심 단어를 자동으로 추출합니다.
 */

import { prisma } from './prisma';

// ========================================
// Types
// ========================================

export interface ExtractedWord {
  term: string;
  position: [number, number]; // [start, end]
  confidence: number;
  termType?: string;
  isNew: boolean; // DB에 없는 새 단어
  existingWordId?: string;
}

export interface ExtractionResult {
  sourceType: 'PROBLEM' | 'TEXTBOOK' | 'EXPLANATION' | 'USER_QUESTION';
  sourceId?: string;
  extractedWords: ExtractedWord[];
  keyWords: string[]; // 핵심 단어 term 목록
}

// ========================================
// 과목별 핵심 단어 패턴
// ========================================

const SUBJECT_PATTERNS: Record<string, RegExp[]> = {
  korean: [
    // 국어 문법/개념어
    /비유|서술|은유|직유|의인화|상징|반어|역설|대조|병렬|열거|점층|반복|설의|도치/g,
    /주제|소재|갈등|복선|결말|시점|화자|서술자|인물|배경|플롯/g,
    /명사|동사|형용사|부사|조사|어미|접사|어근|합성어|파생어/g,
  ],
  english: [
    // 영어 핵심 표현
    /\b(suggest|recommend|require|insist|demand)\b/gi,
    /\b(be likely to|be supposed to|be about to|be going to)\b/gi,
    /\b(however|therefore|moreover|furthermore|nevertheless)\b/gi,
  ],
  math: [
    // 수학 개념어
    /함수|방정식|부등식|절댓값|제곱근|인수분해|완전제곱/g,
    /삼각형|사각형|원|직선|평면|입체|도형/g,
    /미분|적분|극한|수열|급수|벡터|행렬/g,
  ],
  science: [
    // 과학 용어
    /광합성|호흡|DNA|RNA|세포|유전자|염색체/g,
    /관성|가속도|중력|에너지|운동량|탄성/g,
    /원소|화합물|혼합물|산화|환원|중화/g,
  ],
  social: [
    // 사회 개념어
    /민주주의|권력분립|기본권|의무|헌법|법치주의/g,
    /인구피라미드|도시화|산업화|세계화|지역격차/g,
    /수요|공급|가격|시장|경쟁|독점/g,
  ],
};

// 공통 학습 용어
const COMMON_ACADEMIC_TERMS = [
  '개념', '원리', '법칙', '이론', '모델', '공식', '정의',
  '증명', '풀이', '해석', '분석', '추론', '귀납', '연역',
  '가설', '실험', '관찰', '결론', '적용', '응용',
];

// ========================================
// Word Extraction Functions
// ========================================

/**
 * 문제 텍스트에서 핵심 단어 추출
 */
export async function extractWordsFromProblem(
  problemId: string,
  content: string,
  subjectName?: string
): Promise<ExtractionResult> {
  const extractedWords: ExtractedWord[] = [];
  
  // 1. 과목별 패턴 매칭
  const patterns = subjectName ? SUBJECT_PATTERNS[subjectName.toLowerCase()] || [] : [];
  for (const pattern of patterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      if (match.index !== undefined) {
        extractedWords.push({
          term: match[0],
          position: [match.index, match.index + match[0].length],
          confidence: 0.8,
          isNew: true,
        });
      }
    }
  }
  
  // 2. 공통 학습 용어 검색
  for (const term of COMMON_ACADEMIC_TERMS) {
    const regex = new RegExp(term, 'g');
    const matches = content.matchAll(regex);
    for (const match of matches) {
      if (match.index !== undefined) {
        extractedWords.push({
          term: match[0],
          position: [match.index, match.index + match[0].length],
          confidence: 0.6,
          isNew: true,
        });
      }
    }
  }
  
  // 3. 기존 DB 단어와 매칭
  const matchedWords = await matchExistingWords(extractedWords.map(w => w.term));
  
  // 매칭 결과 반영
  for (const word of extractedWords) {
    const existing = matchedWords.find(m => 
      m.term.toLowerCase() === word.term.toLowerCase()
    );
    if (existing) {
      word.isNew = false;
      word.existingWordId = existing.id;
      word.confidence += 0.1; // 기존 DB에 있으면 신뢰도 증가
    }
  }
  
  // 중복 제거
  const uniqueWords = deduplicateWords(extractedWords);
  
  // 핵심 단어 선별 (confidence 기준)
  const keyWords = uniqueWords
    .filter(w => w.confidence >= 0.7)
    .map(w => w.term);
  
  // 추출 로그 저장
  await prisma.wordExtractionLog.create({
    data: {
      sourceType: 'PROBLEM',
      sourceId: problemId,
      extractedWords: JSON.stringify(uniqueWords),
      status: 'PENDING',
    },
  });
  
  return {
    sourceType: 'PROBLEM',
    sourceId: problemId,
    extractedWords: uniqueWords,
    keyWords,
  };
}

/**
 * 해설에서 개념어 추출
 */
export async function extractWordsFromExplanation(
  problemId: string,
  explanation: string
): Promise<ExtractionResult> {
  const extractedWords: ExtractedWord[] = [];
  
  // 해설에서 주로 나타나는 패턴
  const explanationPatterns = [
    /(?:이것은|이는)\s+[가-힣]+(?:을|를)\s+묻는/g,
    /[가-힣]+(?:의\s+)?개념/g,
    /[가-힣]+(?:의\s+)?정의/g,
    /[가-힣]+(?:란|이란)/g,
  ];
  
  for (const pattern of explanationPatterns) {
    const matches = explanation.matchAll(pattern);
    for (const match of matches) {
      if (match.index !== undefined) {
        // 핵심 단어만 추출
        const term = extractCoreTermFromPhrase(match[0]);
        if (term) {
          extractedWords.push({
            term,
            position: [match.index, match.index + match[0].length],
            confidence: 0.75,
            isNew: true,
          });
        }
      }
    }
  }
  
  // 기존 DB 매칭
  const matchedWords = await matchExistingWords(extractedWords.map(w => w.term));
  for (const word of extractedWords) {
    const existing = matchedWords.find(m => m.term === word.term);
    if (existing) {
      word.isNew = false;
      word.existingWordId = existing.id;
    }
  }
  
  const uniqueWords = deduplicateWords(extractedWords);
  
  return {
    sourceType: 'EXPLANATION',
    sourceId: problemId,
    extractedWords: uniqueWords,
    keyWords: uniqueWords.filter(w => !w.isNew).map(w => w.term),
  };
}

/**
 * 사용자 질문에서 신규 단어 후보 추출
 */
export async function extractWordsFromUserQuestion(
  question: string,
  sessionId?: string
): Promise<ExtractionResult> {
  const extractedWords: ExtractedWord[] = [];
  
  // "~가 뭐야", "~란 뭐야", "~의 의미" 패턴
  const questionPatterns = [
    /([가-힣a-zA-Z]+)(?:가|이|란|이란)\s*(?:뭐|무엇|무슨)/g,
    /([가-힣a-zA-Z]+)(?:의|에\s*대한)\s*(?:의미|뜻|정의)/g,
    /([가-힣a-zA-Z]+)(?:가|을|를)\s*(?:설명|알려)/g,
  ];
  
  for (const pattern of questionPatterns) {
    const matches = question.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match.index !== undefined) {
        extractedWords.push({
          term: match[1],
          position: [match.index, match.index + match[0].length],
          confidence: 0.9, // 사용자가 직접 질문한 단어는 높은 신뢰도
          isNew: true,
        });
      }
    }
  }
  
  // 기존 DB 매칭
  const matchedWords = await matchExistingWords(extractedWords.map(w => w.term));
  for (const word of extractedWords) {
    const existing = matchedWords.find(m => m.term === word.term);
    if (existing) {
      word.isNew = false;
      word.existingWordId = existing.id;
    }
  }
  
  // 새로운 단어 후보 로깅
  const newWords = extractedWords.filter(w => w.isNew);
  if (newWords.length > 0) {
    await prisma.wordExtractionLog.create({
      data: {
        sourceType: 'USER_QUESTION',
        sourceId: sessionId,
        extractedWords: JSON.stringify(newWords),
        status: 'PENDING',
      },
    });
  }
  
  return {
    sourceType: 'USER_QUESTION',
    sourceId: sessionId,
    extractedWords,
    keyWords: extractedWords.map(w => w.term),
  };
}

// ========================================
// Helper Functions
// ========================================

/**
 * 기존 단어 DB 매칭
 */
export async function matchExistingWords(terms: string[]) {
  const uniqueTerms = [...new Set(terms.map(t => t.toLowerCase()))];
  
  return prisma.word.findMany({
    where: {
      isActive: true,
      term: {
        in: uniqueTerms,
      },
    },
    select: {
      id: true,
      term: true,
      termType: true,
      gradeLevel: true,
    },
  });
}

/**
 * 문구에서 핵심 단어 추출
 */
function extractCoreTermFromPhrase(phrase: string): string | null {
  // "~의 개념", "~이란" 등에서 핵심 단어 추출
  const patterns = [
    /([가-힣a-zA-Z]+)(?:의\s+)?(?:개념|정의)/,
    /([가-힣a-zA-Z]+)(?:란|이란)/,
  ];
  
  for (const pattern of patterns) {
    const match = phrase.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * 중복 단어 제거 (같은 위치의 단어는 confidence 높은 것 유지)
 */
function deduplicateWords(words: ExtractedWord[]): ExtractedWord[] {
  const seen = new Map<string, ExtractedWord>();
  
  for (const word of words) {
    const key = word.term.toLowerCase();
    const existing = seen.get(key);
    
    if (!existing || word.confidence > existing.confidence) {
      seen.set(key, word);
    }
  }
  
  return Array.from(seen.values());
}

// ========================================
// Batch Processing
// ========================================

/**
 * 문제 일괄 단어 추출 및 연결
 */
export async function batchExtractAndLink(problemIds: string[]) {
  const results: Array<{ problemId: string; wordCount: number }> = [];
  
  for (const problemId of problemIds) {
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      include: { subject: true },
    });
    
    if (!problem) continue;
    
    // 추출
    const extraction = await extractWordsFromProblem(
      problemId,
      problem.content,
      problem.subject?.name
    );
    
    // 기존 단어 연결
    for (const word of extraction.extractedWords) {
      if (word.existingWordId) {
        await prisma.problemWord.upsert({
          where: {
            problemId_wordId: { problemId, wordId: word.existingWordId },
          },
          create: {
            problemId,
            wordId: word.existingWordId,
            isKeyWord: extraction.keyWords.includes(word.term),
            position: JSON.stringify(word.position),
          },
          update: {
            isKeyWord: extraction.keyWords.includes(word.term),
          },
        });
      }
    }
    
    results.push({
      problemId,
      wordCount: extraction.extractedWords.length,
    });
  }
  
  return results;
}

/**
 * 신규 단어 후보 승인
 */
export async function approveNewWord(
  logId: string,
  wordData: {
    term: string;
    termType: string;
    gradeLevel: string;
    definition: string;
    subjectIds?: string[];
  }
) {
  // 단어 생성
  const word = await prisma.word.create({
    data: {
      term: wordData.term,
      termType: wordData.termType,
      gradeLevel: wordData.gradeLevel,
      definition: wordData.definition,
      isVerified: true,
      subjects: wordData.subjectIds
        ? { create: wordData.subjectIds.map(id => ({ subjectId: id })) }
        : undefined,
    },
  });
  
  // 로그 상태 업데이트
  await prisma.wordExtractionLog.update({
    where: { id: logId },
    data: { status: 'APPROVED' },
  });
  
  return word;
}

/**
 * 신규 단어 후보 거절
 */
export async function rejectNewWord(logId: string) {
  return prisma.wordExtractionLog.update({
    where: { id: logId },
    data: { status: 'REJECTED' },
  });
}
