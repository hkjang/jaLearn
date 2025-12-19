/**
 * AI Reviewer Utility
 * AI-assisted problem review with answer verification and explanation generation
 */

export interface AIReviewResult {
  answerVerification: {
    isCorrect: boolean;
    aiAnswer: string;
    confidence: number;
    reasoning: string;
  };
  generatedExplanation: string | null;
  detectedIssues: string[];
  reviewWarnings: string[];
  qualityChecks: {
    hasAnswer: boolean;
    hasOptions: boolean;
    hasExplanation: boolean;
    contentLength: boolean;
    noTypos: boolean;
  };
  recommendedAction: 'APPROVE' | 'REVISE' | 'REJECT';
  overallConfidence: number;
}

interface ProblemForReview {
  content: string;
  type: string;
  options?: string | null;
  answer: string;
  explanation?: string | null;
  difficulty?: string;
}

/**
 * Perform quality checks on problem
 */
function performQualityChecks(problem: ProblemForReview): AIReviewResult['qualityChecks'] {
  const hasOptions = problem.type === 'MULTIPLE_CHOICE' 
    ? (problem.options && JSON.parse(problem.options).length >= 2) 
    : true;
  
  return {
    hasAnswer: problem.answer.trim().length > 0,
    hasOptions: !!hasOptions,
    hasExplanation: !!(problem.explanation && problem.explanation.trim().length > 10),
    contentLength: problem.content.length >= 20 && problem.content.length <= 2000,
    noTypos: !hasCommonTypos(problem.content),
  };
}

/**
 * Check for common typos and formatting issues
 */
function hasCommonTypos(text: string): boolean {
  const typoPatterns = [
    /,\s*\./,           // ,. 연속
    /\?\s*\?/,          // ?? 연속
    /[가-힣]\s{2,}[가-힣]/, // 중간에 공백 2개 이상
    /[^\s]\([^\s]/,     // 괄호 앞뒤 공백 없음 (수식 제외)
  ];
  
  return typoPatterns.some(pattern => pattern.test(text));
}

/**
 * Detect potential issues in the problem
 */
function detectIssues(problem: ProblemForReview): string[] {
  const issues: string[] = [];
  
  // Check content
  if (problem.content.length < 20) {
    issues.push('문제 내용이 너무 짧습니다.');
  }
  
  if (!problem.content.includes('?') && !problem.content.includes('？') && 
      !problem.content.includes('시오') && !problem.content.includes('것은')) {
    issues.push('문제 형식이 명확하지 않습니다 (질문 표현 없음).');
  }
  
  // Check answer
  if (problem.answer.trim().length === 0) {
    issues.push('정답이 비어있습니다.');
  }
  
  // Check multiple choice options
  if (problem.type === 'MULTIPLE_CHOICE') {
    if (!problem.options) {
      issues.push('객관식 문제에 선택지가 없습니다.');
    } else {
      try {
        const opts = JSON.parse(problem.options);
        if (opts.length < 2) {
          issues.push('선택지가 2개 미만입니다.');
        }
        if (opts.length > 6) {
          issues.push('선택지가 너무 많습니다 (6개 초과).');
        }
        // Check for duplicate options
        const uniqueOpts = new Set(opts.map((o: string) => o.trim().toLowerCase()));
        if (uniqueOpts.size !== opts.length) {
          issues.push('중복된 선택지가 있습니다.');
        }
      } catch {
        issues.push('선택지 형식이 잘못되었습니다.');
      }
    }
    
    // Check if answer is valid option
    const validAnswers = ['①', '②', '③', '④', '⑤', 'A', 'B', 'C', 'D', 'E', '1', '2', '3', '4', '5'];
    if (!validAnswers.some(v => problem.answer.includes(v))) {
      issues.push('정답이 유효한 선택지 형식이 아닙니다.');
    }
  }
  
  return issues;
}

/**
 * Generate review warnings
 */
function generateWarnings(problem: ProblemForReview): string[] {
  const warnings: string[] = [];
  
  // Missing explanation
  if (!problem.explanation || problem.explanation.trim().length < 10) {
    warnings.push('해설이 없거나 너무 짧습니다. 학습 효과를 위해 해설 추가를 권장합니다.');
  }
  
  // Very short content
  if (problem.content.length < 50) {
    warnings.push('문제가 매우 짧습니다. 문맥이 충분한지 확인해주세요.');
  }
  
  // Very long content
  if (problem.content.length > 1000) {
    warnings.push('문제가 매우 깁니다. 핵심 내용 위주로 정리를 권장합니다.');
  }
  
  // Check for potential copyright indicators
  const copyrightIndicators = ['©', '저작권', 'copyright', '출처:', '인용'];
  if (copyrightIndicators.some(ind => problem.content.toLowerCase().includes(ind.toLowerCase()))) {
    warnings.push('저작권 관련 표기가 감지되었습니다. 사용 권한을 확인해주세요.');
  }
  
  return warnings;
}

/**
 * Simulate AI answer verification (placeholder for actual AI integration)
 */
function verifyAnswer(problem: ProblemForReview): AIReviewResult['answerVerification'] {
  // This is a placeholder - in production, this would call an actual AI API
  // For now, we do basic format validation
  
  let isCorrect = true;
  let confidence = 0.5;
  let reasoning = '형식 검증만 수행됨. AI 검증을 위해 Gemini API 연동 필요.';
  
  // Basic validation
  if (problem.type === 'MULTIPLE_CHOICE') {
    const answerNum = problem.answer.match(/[①②③④⑤1-5A-E]/);
    if (answerNum) {
      try {
        const opts = JSON.parse(problem.options || '[]');
        if (opts.length > 0) {
          confidence = 0.7;
          reasoning = '선택지와 정답 형식이 일치합니다.';
        }
      } catch {
        confidence = 0.3;
        reasoning = '선택지 파싱 오류.';
      }
    } else {
      isCorrect = false;
      confidence = 0.8;
      reasoning = '정답 형식이 객관식 형식이 아닙니다.';
    }
  } else if (problem.type === 'TRUE_FALSE') {
    if (['O', 'X', 'o', 'x', 'TRUE', 'FALSE', 'true', 'false', '참', '거짓'].includes(problem.answer.trim())) {
      confidence = 0.8;
      reasoning = 'O/X 형식 정답 확인됨.';
    }
  }
  
  return {
    isCorrect,
    aiAnswer: problem.answer, // Placeholder
    confidence,
    reasoning,
  };
}

/**
 * Generate explanation (placeholder for AI generation)
 */
function generateExplanation(problem: ProblemForReview): string | null {
  if (problem.explanation && problem.explanation.length > 50) {
    return null; // Already has good explanation
  }
  
  // Placeholder - in production, this would use AI
  return `[자동 생성 예시]
이 문제의 정답은 ${problem.answer}입니다.
${problem.type === 'MULTIPLE_CHOICE' ? '각 선택지를 분석하면:' : ''}
(AI API 연동 후 상세 해설 자동 생성 가능)`;
}

/**
 * Determine recommended action based on review results
 */
function determineAction(
  issues: string[],
  qualityChecks: AIReviewResult['qualityChecks'],
  answerVerification: AIReviewResult['answerVerification']
): 'APPROVE' | 'REVISE' | 'REJECT' {
  // Critical issues = REJECT
  if (issues.length >= 3 || !qualityChecks.hasAnswer) {
    return 'REJECT';
  }
  
  // Some issues = REVISE
  if (issues.length > 0 || !answerVerification.isCorrect) {
    return 'REVISE';
  }
  
  // Missing optional items = REVISE
  if (!qualityChecks.hasExplanation || !qualityChecks.noTypos) {
    return 'REVISE';
  }
  
  // All good = APPROVE
  if (answerVerification.confidence >= 0.6) {
    return 'APPROVE';
  }
  
  return 'REVISE';
}

/**
 * Perform complete AI review of a problem
 */
export function reviewProblem(problem: ProblemForReview): AIReviewResult {
  const qualityChecks = performQualityChecks(problem);
  const detectedIssues = detectIssues(problem);
  const reviewWarnings = generateWarnings(problem);
  const answerVerification = verifyAnswer(problem);
  const generatedExplanation = generateExplanation(problem);
  
  const recommendedAction = determineAction(detectedIssues, qualityChecks, answerVerification);
  
  // Calculate overall confidence
  const checksPassRate = Object.values(qualityChecks).filter(Boolean).length / 5;
  const issuesPenalty = Math.min(detectedIssues.length * 0.1, 0.3);
  const overallConfidence = Math.max(0, 
    (answerVerification.confidence * 0.5 + checksPassRate * 0.5) - issuesPenalty
  );
  
  return {
    answerVerification,
    generatedExplanation,
    detectedIssues,
    reviewWarnings,
    qualityChecks,
    recommendedAction,
    overallConfidence: Math.round(overallConfidence * 100) / 100,
  };
}
