/**
 * Difficulty Estimator
 * AI 기반 문제 난이도 자동 추정
 */

interface DifficultyFactors {
  textComplexity: number;      // 텍스트 복잡도 (0-100)
  conceptLevel: number;        // 개념 수준 (0-100)
  mathComplexity: number;      // 수식 복잡도 (0-100)
  vocabularyLevel: number;     // 어휘 수준 (0-100)
  structureComplexity: number; // 문제 구조 복잡도 (0-100)
}

export interface DifficultyResult {
  score: number;           // 종합 난이도 점수 (0-100)
  level: 'EASY' | 'MEDIUM' | 'HARD' | 'VERY_HARD';
  confidence: number;      // 신뢰도 (0-1)
  factors: DifficultyFactors;
  suggestions: string[];   // 난이도 조정 제안
}

// 한국어 고급 어휘 (교육과정 기준)
const ADVANCED_VOCABULARY = [
  '분석', '종합', '평가', '추론', '비판', '성찰', '탐구', '고찰',
  '유추', '귀납', '연역', '함의', '맥락', '통찰', '개념화', '범주화',
  '인과관계', '상관관계', '변수', '가설', '검증', '논증', '반박',
];

// 수학 관련 키워드
const MATH_KEYWORDS = [
  '함수', '방정식', '부등식', '미분', '적분', '극한', '행렬', '벡터',
  '확률', '통계', '수열', '급수', '기하', '삼각함수', '로그', '지수',
  '그래프', '좌표', '도형', '증명', '정리', '공식',
];

// 복잡한 문장 구조 패턴
const COMPLEX_PATTERNS = [
  /만약.*라면/,
  /비록.*하더라도/,
  /.*뿐만\s*아니라/,
  /.*에\s*비해/,
  /.*와\s*달리/,
  /.*에\s*따르면/,
  /.*을\s*전제로/,
  /.*의\s*관점에서/,
];

/**
 * 문제 난이도 추정
 */
export function estimateDifficulty(
  content: string,
  options?: string[],
  metadata?: {
    subject?: string;
    gradeLevel?: string;
    type?: string;
  }
): DifficultyResult {
  const factors = calculateFactors(content, options || []);
  
  // 가중치 적용 점수 계산
  const weights = {
    textComplexity: 0.25,
    conceptLevel: 0.3,
    mathComplexity: 0.2,
    vocabularyLevel: 0.15,
    structureComplexity: 0.1,
  };
  
  let score = 
    factors.textComplexity * weights.textComplexity +
    factors.conceptLevel * weights.conceptLevel +
    factors.mathComplexity * weights.mathComplexity +
    factors.vocabularyLevel * weights.vocabularyLevel +
    factors.structureComplexity * weights.structureComplexity;
  
  // 학년 보정
  if (metadata?.gradeLevel) {
    score = adjustForGrade(score, metadata.gradeLevel);
  }
  
  // 난이도 레벨 결정
  const level = scoreToLevel(score);
  
  // 신뢰도 계산 (요소들의 분산 기반)
  const factorValues = Object.values(factors);
  const mean = factorValues.reduce((a, b) => a + b, 0) / factorValues.length;
  const variance = factorValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / factorValues.length;
  const confidence = Math.max(0.3, 1 - (variance / 1000)); // 분산이 클수록 신뢰도 낮음
  
  // 제안 생성
  const suggestions = generateSuggestions(factors, level);
  
  return {
    score: Math.round(score),
    level,
    confidence: Math.round(confidence * 100) / 100,
    factors,
    suggestions,
  };
}

/**
 * 요소별 복잡도 계산
 */
function calculateFactors(content: string, options: string[]): DifficultyFactors {
  const fullText = [content, ...options].join(' ');
  
  // 1. 텍스트 복잡도 (문장 길이, 단어 수)
  const sentences = fullText.split(/[.!?。]/g).filter(Boolean);
  const avgSentenceLength = sentences.length > 0 
    ? fullText.length / sentences.length 
    : fullText.length;
  const textComplexity = Math.min(100, avgSentenceLength * 1.5);
  
  // 2. 개념 수준 (고급 어휘 비율)
  const words = fullText.split(/\s+/);
  const advancedCount = words.filter(w => 
    ADVANCED_VOCABULARY.some(v => w.includes(v))
  ).length;
  const conceptLevel = Math.min(100, (advancedCount / Math.max(1, words.length)) * 500);
  
  // 3. 수학 복잡도
  const mathCount = MATH_KEYWORDS.filter(k => fullText.includes(k)).length;
  const hasEquations = /[=<>≤≥±∫∑∏√]/.test(fullText);
  const hasLatex = /\$.*\$|\\frac|\\sqrt/.test(fullText);
  let mathComplexity = mathCount * 10;
  if (hasEquations) mathComplexity += 20;
  if (hasLatex) mathComplexity += 30;
  mathComplexity = Math.min(100, mathComplexity);
  
  // 4. 어휘 수준 (평균 단어 길이, 한자어 비율)
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / Math.max(1, words.length);
  const vocabularyLevel = Math.min(100, avgWordLength * 15);
  
  // 5. 구조 복잡도 (복잡한 문장 패턴, 조건문)
  const complexMatchCount = COMPLEX_PATTERNS.filter(p => p.test(fullText)).length;
  const hasMultipleConditions = /①.*②.*③/.test(fullText) || options.length > 4;
  let structureComplexity = complexMatchCount * 15;
  if (hasMultipleConditions) structureComplexity += 20;
  if (options.length > 5) structureComplexity += 10;
  structureComplexity = Math.min(100, structureComplexity);
  
  return {
    textComplexity: Math.round(textComplexity),
    conceptLevel: Math.round(conceptLevel),
    mathComplexity: Math.round(mathComplexity),
    vocabularyLevel: Math.round(vocabularyLevel),
    structureComplexity: Math.round(structureComplexity),
  };
}

/**
 * 학년별 보정
 */
function adjustForGrade(score: number, gradeLevel: string): number {
  const gradeWeights: Record<string, number> = {
    'ELEMENTARY_1': 0.5,
    'ELEMENTARY_2': 0.55,
    'ELEMENTARY_3': 0.6,
    'ELEMENTARY_4': 0.65,
    'ELEMENTARY_5': 0.7,
    'ELEMENTARY_6': 0.75,
    'MIDDLE_1': 0.8,
    'MIDDLE_2': 0.85,
    'MIDDLE_3': 0.9,
    'HIGH_1': 0.95,
    'HIGH_2': 1.0,
    'HIGH_3': 1.05,
  };
  
  const weight = gradeWeights[gradeLevel] || 1.0;
  return score * weight;
}

/**
 * 점수를 레벨로 변환
 */
function scoreToLevel(score: number): 'EASY' | 'MEDIUM' | 'HARD' | 'VERY_HARD' {
  if (score < 30) return 'EASY';
  if (score < 55) return 'MEDIUM';
  if (score < 75) return 'HARD';
  return 'VERY_HARD';
}

/**
 * 난이도 조정 제안 생성
 */
function generateSuggestions(factors: DifficultyFactors, level: string): string[] {
  const suggestions: string[] = [];
  
  if (factors.textComplexity > 70) {
    suggestions.push('문장을 더 짧게 나누면 이해도가 높아집니다');
  }
  
  if (factors.vocabularyLevel > 75) {
    suggestions.push('일부 고급 어휘를 쉬운 표현으로 대체 가능합니다');
  }
  
  if (factors.structureComplexity > 60 && level === 'EASY') {
    suggestions.push('문제 구조가 난이도에 비해 복잡합니다');
  }
  
  if (factors.mathComplexity < 20 && factors.conceptLevel > 60) {
    suggestions.push('개념 중심 문제입니다. 계산 요소 추가 고려');
  }
  
  return suggestions;
}

/**
 * 배치 난이도 추정
 */
export function estimateBatchDifficulty(
  problems: Array<{ content: string; options?: string[] }>
): DifficultyResult[] {
  return problems.map(p => estimateDifficulty(p.content, p.options));
}

/**
 * 난이도 통계 계산
 */
export function calculateDifficultyStats(results: DifficultyResult[]): {
  avgScore: number;
  distribution: Record<string, number>;
  avgConfidence: number;
} {
  if (results.length === 0) {
    return { avgScore: 0, distribution: {}, avgConfidence: 0 };
  }
  
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
  
  const distribution: Record<string, number> = {
    EASY: 0,
    MEDIUM: 0,
    HARD: 0,
    VERY_HARD: 0,
  };
  
  results.forEach(r => {
    distribution[r.level]++;
  });
  
  return {
    avgScore: Math.round(avgScore),
    distribution,
    avgConfidence: Math.round(avgConfidence * 100) / 100,
  };
}
