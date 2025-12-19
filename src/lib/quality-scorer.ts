/**
 * Quality Scorer Utility
 * Calculates comprehensive quality scores for problems
 */

// Grade to trust score mapping
const GRADE_TRUST_SCORES: Record<string, number> = {
  A: 100, // 공공 공개 자료 - 최고 신뢰
  B: 80,  // 학교/교사 제공 - 계약 기반
  C: 60,  // 학원/강사 - 수익 쉐어
  D: 40,  // 사용자 제출 - 검수 강화
  E: 20,  // 참고용 데이터 - AI 학습 제한
};

// Weight factors for overall score
const SCORE_WEIGHTS = {
  accuracy: 0.3,     // 정답 정확성
  clarity: 0.2,      // 문장 명확성
  difficultyFit: 0.15, // 난이도 적합성
  trust: 0.2,        // 출처 신뢰도
  usage: 0.15,       // 활용도
};

export interface QualityScores {
  accuracyScore: number;   // 정답 정확성 0-100
  clarityScore: number;    // 문장 명확성 0-100
  difficultyFit: number;   // 난이도 적합성 0-100
  trustScore: number;      // 출처 신뢰도 0-100
  usageScore: number;      // 활용도 0-100
  overallScore: number;    // 종합 점수 0-100
}

export interface ProblemForScoring {
  content: string;
  answer: string;
  options?: string | null;
  explanation?: string | null;
  type: string;
  difficulty: string;
  gradeLevel: string;
  usageCount: number;
  correctRate?: number | null;
  source?: {
    grade?: string;
    trustScore?: number;
  } | null;
}

/**
 * Calculate trust score based on source grade
 */
export function calculateTrustScore(sourceGrade?: string | null, sourceTrustScore?: number | null): number {
  if (sourceTrustScore !== null && sourceTrustScore !== undefined) {
    return sourceTrustScore;
  }
  if (sourceGrade && GRADE_TRUST_SCORES[sourceGrade]) {
    return GRADE_TRUST_SCORES[sourceGrade];
  }
  return 40; // Default: D등급 수준
}

/**
 * Calculate accuracy score based on answer completeness and validation
 */
export function calculateAccuracyScore(problem: ProblemForScoring): number {
  let score = 60; // Base score
  
  // Has answer
  if (problem.answer && problem.answer.trim().length > 0) {
    score += 15;
  }
  
  // Has explanation
  if (problem.explanation && problem.explanation.trim().length > 10) {
    score += 15;
  }
  
  // For multiple choice, has options
  if (problem.type === 'MULTIPLE_CHOICE') {
    if (problem.options) {
      try {
        const opts = JSON.parse(problem.options);
        if (Array.isArray(opts) && opts.length >= 2) {
          score += 10;
        }
      } catch {
        // Invalid JSON
      }
    }
  }
  
  // Correct rate validation (if available)
  if (problem.correctRate !== null && problem.correctRate !== undefined) {
    // Good correct rate (20-80%) suggests well-balanced problem
    if (problem.correctRate >= 0.2 && problem.correctRate <= 0.8) {
      score += 10;
    }
  }
  
  return Math.min(100, score);
}

/**
 * Calculate clarity score based on content quality
 */
export function calculateClarityScore(problem: ProblemForScoring): number {
  let score = 50; // Base score
  const content = problem.content;
  
  // Minimum length requirement
  if (content.length >= 20) {
    score += 10;
  }
  
  // Not too long (avoid overly complex problems)
  if (content.length >= 50 && content.length <= 500) {
    score += 15;
  } else if (content.length > 500) {
    score += 5; // Still OK but complex
  }
  
  // Has proper sentence ending
  if (/[.?!。？！]\s*$/.test(content.trim())) {
    score += 10;
  }
  
  // Has question mark (clear question structure)
  if (/\?|？/.test(content)) {
    score += 10;
  }
  
  // Doesn't have excessive special characters
  const specialCharRatio = (content.match(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣.,?!:;'"()]/g) || []).length / content.length;
  if (specialCharRatio < 0.1) {
    score += 5;
  }
  
  return Math.min(100, score);
}

/**
 * Calculate difficulty fit score based on problem characteristics
 */
export function calculateDifficultyFitScore(problem: ProblemForScoring): number {
  let score = 70; // Base score
  
  const content = problem.content;
  const wordCount = content.split(/\s+/).length;
  const hasFormula = /[$∫∑∏√πθ]/.test(content);
  
  // Check if difficulty matches content complexity
  switch (problem.difficulty) {
    case 'LOW':
      // Simple problems should be short without formulas
      if (wordCount <= 50 && !hasFormula) {
        score += 20;
      } else if (wordCount > 100 || hasFormula) {
        score -= 10; // Mismatch
      }
      break;
      
    case 'MEDIUM':
      // Medium problems have moderate length
      if (wordCount >= 30 && wordCount <= 150) {
        score += 20;
      }
      break;
      
    case 'HIGH':
      // Hard problems tend to be longer or have formulas
      if (wordCount >= 50 || hasFormula) {
        score += 20;
      }
      break;
  }
  
  // Validate against correct rate if available
  if (problem.correctRate !== null && problem.correctRate !== undefined) {
    const rate = problem.correctRate;
    const expectedRanges: Record<string, [number, number]> = {
      LOW: [0.6, 1.0],     // Easy: 60-100%
      MEDIUM: [0.3, 0.7],  // Medium: 30-70%
      HIGH: [0.0, 0.4],    // Hard: 0-40%
    };
    
    const [min, max] = expectedRanges[problem.difficulty] || [0.3, 0.7];
    if (rate >= min && rate <= max) {
      score += 10; // Matches expected difficulty
    } else {
      score -= 10; // Doesn't match
    }
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate usage score based on how often the problem is used
 */
export function calculateUsageScore(usageCount: number): number {
  // Logarithmic scale to reward usage but with diminishing returns
  if (usageCount === 0) return 30;
  if (usageCount <= 10) return 50;
  if (usageCount <= 50) return 70;
  if (usageCount <= 100) return 85;
  return 100;
}

/**
 * Calculate overall quality score
 */
export function calculateOverallScore(scores: Omit<QualityScores, 'overallScore'>): number {
  const overall = 
    scores.accuracyScore * SCORE_WEIGHTS.accuracy +
    scores.clarityScore * SCORE_WEIGHTS.clarity +
    scores.difficultyFit * SCORE_WEIGHTS.difficultyFit +
    scores.trustScore * SCORE_WEIGHTS.trust +
    scores.usageScore * SCORE_WEIGHTS.usage;
  
  return Math.round(overall * 10) / 10;
}

/**
 * Calculate all quality scores for a problem
 */
export function calculateQualityScores(problem: ProblemForScoring): QualityScores {
  const accuracyScore = calculateAccuracyScore(problem);
  const clarityScore = calculateClarityScore(problem);
  const difficultyFit = calculateDifficultyFitScore(problem);
  const trustScore = calculateTrustScore(problem.source?.grade, problem.source?.trustScore);
  const usageScore = calculateUsageScore(problem.usageCount);
  
  const overallScore = calculateOverallScore({
    accuracyScore,
    clarityScore,
    difficultyFit,
    trustScore,
    usageScore,
  });
  
  return {
    accuracyScore,
    clarityScore,
    difficultyFit,
    trustScore,
    usageScore,
    overallScore,
  };
}

/**
 * Get grade color for display
 */
export function getGradeColor(grade: string): string {
  const colors: Record<string, string> = {
    A: '#22c55e', // green
    B: '#3b82f6', // blue
    C: '#f59e0b', // yellow
    D: '#f97316', // orange
    E: '#ef4444', // red
  };
  return colors[grade] || colors.D;
}

/**
 * Get grade description
 */
export function getGradeDescription(grade: string): string {
  const descriptions: Record<string, string> = {
    A: '공공 공개 자료 - 저작권 안정',
    B: '학교/교사 제공 - 계약 기반',
    C: '학원/강사 - 수익 쉐어',
    D: '사용자 제출 - 검수 강화',
    E: '참고용 데이터 - AI 학습 제한',
  };
  return descriptions[grade] || descriptions.D;
}
