/**
 * Problem Classifier Utility
 * Auto-classification for subject, unit, difficulty, and duplicate detection
 */

// Subject keyword mappings (Korean educational subjects)
const SUBJECT_KEYWORDS: Record<string, string[]> = {
  math: [
    '수학', '수식', '방정식', '함수', '미분', '적분', '확률', '통계', '기하', '대수',
    '인수분해', '이차방정식', '일차함수', '삼각함수', '로그', '지수', '행렬', '벡터',
    '구하시오', '계산하시오', '풀이', '증명', 'x', 'y', '√', '∫', 'π',
  ],
  korean: [
    '국어', '문학', '시', '소설', '수필', '희곡', '문법', '어휘', '독해', '작문',
    '문장', '단어', '주제', '표현', '비유', '은유', '직유', '의미', '해석',
    '글쓴이', '화자', '서술자', '등장인물',
  ],
  english: [
    'english', '영어', 'vocabulary', 'grammar', 'reading', 'listening',
    'the', 'is', 'are', 'was', 'were', 'have', 'has', 'had',
    'following', 'passage', 'sentence', 'word', 'phrase',
  ],
  science: [
    '과학', '물리', '화학', '생물', '지구과학', '실험', '관찰', '가설',
    '원자', '분자', '세포', '유전', 'DNA', 'RNA', '에너지', '힘', '운동',
    '전기', '자기', '파동', '열', '광합성', '호흡', '진화',
  ],
  social: [
    '사회', '역사', '지리', '경제', '정치', '문화', '민주주의', '헌법',
    '조선', '고려', '삼국', '일제', '광복', '6.25', '산업화', '민주화',
    '위도', '경도', '기후', '지형', '인구',
  ],
};

// Difficulty indicators
const DIFFICULTY_INDICATORS = {
  LOW: [
    '다음 중', '고르시오', '찾으시오', '무엇인가', '맞는 것은',
    '기본', '개념', '정의',
  ],
  MEDIUM: [
    '옳은 것만을', '이유를', '비교하시오', '차이점', '설명하시오',
    '분석', '적용', '관계',
  ],
  HIGH: [
    '논술하시오', '평가하시오', '비판하시오', '종합하시오', '추론하시오',
    '창의적', '실생활', '심화', '융합', '탐구',
  ],
};

export interface ClassificationResult {
  suggestedSubject: string | null;
  subjectConfidence: number;
  suggestedDifficulty: string;
  difficultyConfidence: number;
  keywords: string[];
  duplicates: { id: string; similarity: number; content: string }[];
}

/**
 * Classify problem subject based on content keywords
 */
export function classifySubject(content: string): { subject: string | null; confidence: number; keywords: string[] } {
  const normalizedContent = content.toLowerCase();
  const scores: Record<string, number> = {};
  const foundKeywords: string[] = [];

  for (const [subject, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (normalizedContent.includes(keyword.toLowerCase())) {
        score += 1;
        foundKeywords.push(keyword);
      }
    }
    scores[subject] = score;
  }

  // Find highest score
  let maxSubject: string | null = null;
  let maxScore = 0;
  for (const [subject, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxSubject = subject;
    }
  }

  // Calculate confidence (0-1)
  const totalKeywords = Object.values(SUBJECT_KEYWORDS).flat().length;
  const confidence = maxScore > 0 ? Math.min(maxScore / 5, 1) : 0;

  return {
    subject: maxSubject,
    confidence,
    keywords: [...new Set(foundKeywords)],
  };
}

/**
 * Estimate problem difficulty based on content
 */
export function estimateDifficulty(content: string): { difficulty: string; confidence: number } {
  const normalizedContent = content.toLowerCase();
  const scores: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0 };

  // Check for difficulty indicators
  for (const [level, indicators] of Object.entries(DIFFICULTY_INDICATORS)) {
    for (const indicator of indicators) {
      if (normalizedContent.includes(indicator.toLowerCase())) {
        scores[level] += 1;
      }
    }
  }

  // Additional heuristics
  const wordCount = content.split(/\s+/).length;
  const hasFormula = /[∫∑∏√πθ]|[a-z]\s*=/.test(content);
  const hasMultipleParts = /\(1\)|가\)|①|ㄱ\./.test(content);

  // Longer problems tend to be harder
  if (wordCount > 200) scores.HIGH += 1;
  else if (wordCount > 100) scores.MEDIUM += 1;
  else scores.LOW += 1;

  // Formulas suggest higher difficulty
  if (hasFormula) scores.MEDIUM += 1;

  // Multiple parts suggest medium-high difficulty
  if (hasMultipleParts) scores.MEDIUM += 1;

  // Find highest score
  let maxDifficulty = 'MEDIUM';
  let maxScore = scores.MEDIUM;
  for (const [level, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxDifficulty = level;
    }
  }

  const confidence = maxScore > 0 ? Math.min(maxScore / 3, 1) : 0.5;

  return { difficulty: maxDifficulty, confidence };
}

/**
 * Calculate text similarity using Jaccard coefficient
 */
export function calculateSimilarity(text1: string, text2: string): number {
  const normalize = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^\wㄱ-ㅎㅏ-ㅣ가-힣]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1);

  const words1 = new Set(normalize(text1));
  const words2 = new Set(normalize(text2));

  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = new Set([...words1].filter((w) => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Find potential duplicate problems
 */
export async function findDuplicates(
  content: string,
  existingProblems: { id: string; content: string }[],
  threshold = 0.7
): Promise<{ id: string; similarity: number; content: string }[]> {
  const duplicates: { id: string; similarity: number; content: string }[] = [];

  for (const problem of existingProblems) {
    const similarity = calculateSimilarity(content, problem.content);
    if (similarity >= threshold) {
      duplicates.push({
        id: problem.id,
        similarity: Math.round(similarity * 100) / 100,
        content: problem.content.substring(0, 100),
      });
    }
  }

  return duplicates.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Full classification pipeline
 */
export async function classifyProblem(
  content: string,
  existingProblems: { id: string; content: string }[] = []
): Promise<ClassificationResult> {
  const subjectResult = classifySubject(content);
  const difficultyResult = estimateDifficulty(content);
  const duplicates = await findDuplicates(content, existingProblems);

  return {
    suggestedSubject: subjectResult.subject,
    subjectConfidence: subjectResult.confidence,
    suggestedDifficulty: difficultyResult.difficulty,
    difficultyConfidence: difficultyResult.confidence,
    keywords: subjectResult.keywords,
    duplicates,
  };
}
