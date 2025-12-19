/**
 * 고급 프롬프트 조합 엔진
 * 
 * 시스템/컨텍스트/메모리를 동적으로 결합하고
 * 실시간 상태 분석 기반 프롬프트 최적화
 */

import {
  StudentContext,
  LearningMemory,
  SessionContext,
  SYSTEM_PROMPTS,
  SOCRATIC_PATTERNS,
} from "./ai-tutor-prompts";

// ============================================
// 타입 정의
// ============================================

export interface CompositionRule {
  id: string;
  name: string;
  priority: number;  // 낮을수록 먼저 적용
  condition: (ctx: CompositionContext) => boolean;
  transform: (prompt: string, ctx: CompositionContext) => string;
}

export interface CompositionContext {
  student: StudentContext;
  memory?: LearningMemory;
  session?: SessionContext;
  realtimeState: RealtimeState;
}

export interface RealtimeState {
  responseTime: number;  // 마지막 응답까지 걸린 시간 (초)
  consecutiveErrors: number;
  consecutiveCorrect: number;
  emotionalIndicators: EmotionalIndicator[];
  engagementLevel: "HIGH" | "MEDIUM" | "LOW";
  currentDifficulty: number;  // 1-10
  sessionDuration: number;  // 분
  tokensUsed: number;
}

export interface EmotionalIndicator {
  type: "FRUSTRATION" | "CONFUSION" | "BOREDOM" | "EXCITEMENT" | "ANXIETY";
  confidence: number;  // 0-1
  detectedAt: Date;
}

export interface QualityScore {
  overall: number;  // 0-1
  questionQuality: number;
  difficultyMatch: number;
  emotionalSupport: number;
  socraticCompliance: number;
  lengthAppropriate: number;
}

// ============================================
// 기본 조합 규칙
// ============================================

const DEFAULT_RULES: CompositionRule[] = [
  // 1. 초등학생 쉬운 언어
  {
    id: "elementary-language",
    name: "초등학생 언어 스타일",
    priority: 10,
    condition: (ctx) => ctx.student.gradeLevel.startsWith("ELEMENTARY"),
    transform: (prompt) => prompt + `\n\n[지침] 초등학생에게 말하듯 쉽고 친근한 말투를 사용하세요. 이모지를 적절히 활용하세요.`,
  },

  // 2. 연속 오답 시 난이도 하향
  {
    id: "lower-difficulty",
    name: "난이도 하향 조정",
    priority: 20,
    condition: (ctx) => ctx.realtimeState.consecutiveErrors >= 2,
    transform: (prompt) => prompt + `\n\n[긴급] 학생이 연속으로 어려워하고 있습니다. 더 쉬운 질문으로 접근하세요. 기초 개념부터 다시 확인하세요.`,
  },

  // 3. 좌절 감지 시 격려
  {
    id: "emotional-support",
    name: "감정적 지원",
    priority: 15,
    condition: (ctx) => 
      ctx.realtimeState.emotionalIndicators.some(
        (e) => e.type === "FRUSTRATION" && e.confidence > 0.7
      ),
    transform: (prompt) => prompt + `\n\n[감정 대응] 학생이 좌절감을 느끼고 있습니다. 따뜻하게 격려하고, 작은 성공을 칭찬하세요. 압박하지 마세요.`,
  },

  // 4. 응답 지연 시 힌트 제공
  {
    id: "response-delay",
    name: "응답 지연 대응",
    priority: 25,
    condition: (ctx) => ctx.realtimeState.responseTime > 60,
    transform: (prompt) => prompt + `\n\n[지연 감지] 학생이 오래 고민하고 있습니다. 부드럽게 힌트를 제공하거나, 다른 접근법을 제안하세요.`,
  },

  // 5. 고등학생 입시 연결
  {
    id: "high-exam-focus",
    name: "입시 연계",
    priority: 30,
    condition: (ctx) => ctx.student.gradeLevel.startsWith("HIGH"),
    transform: (prompt) => prompt + `\n\n[입시] 고등학생입니다. 적절한 경우 수능/내신과의 연관성을 언급하세요.`,
  },

  // 6. 집중도 저하 시 요약
  {
    id: "low-engagement",
    name: "집중도 저하 대응",
    priority: 35,
    condition: (ctx) => ctx.realtimeState.engagementLevel === "LOW",
    transform: (prompt) => prompt + `\n\n[집중] 학생의 집중도가 낮아 보입니다. 핵심만 간단히 전달하고, 흥미로운 예시를 사용하세요.`,
  },

  // 7. 세션 장시간 진행
  {
    id: "long-session",
    name: "장시간 세션",
    priority: 40,
    condition: (ctx) => ctx.realtimeState.sessionDuration > 40,
    transform: (prompt) => prompt + `\n\n[휴식] 40분 이상 학습했습니다. 피로도를 고려하여 간단한 복습이나 휴식을 제안할 수 있습니다.`,
  },
];

// ============================================
// 프롬프트 조합 엔진
// ============================================

export class PromptCompositionEngine {
  private rules: CompositionRule[] = [];
  private promptCache: Map<string, { prompt: string; timestamp: number }> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000;  // 5분

  constructor(customRules?: CompositionRule[]) {
    this.rules = [...DEFAULT_RULES, ...(customRules || [])];
    this.rules.sort((a, b) => a.priority - b.priority);
  }

  /**
   * 프롬프트 조합 실행
   */
  compose(context: CompositionContext): string {
    // 캐시 확인
    const cacheKey = this.getCacheKey(context);
    const cached = this.promptCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.prompt;
    }

    // 기본 시스템 프롬프트
    let prompt = SYSTEM_PROMPTS.BASE_ROLE;

    // 학년별 언어 스타일
    const gradeCategory = this.getGradeCategory(context.student.gradeLevel);
    prompt += "\n\n" + SYSTEM_PROMPTS.LANGUAGE_STYLE[gradeCategory];

    // 과목별 지침
    const subjectKey = context.student.subject.toUpperCase() as keyof typeof SYSTEM_PROMPTS.SUBJECT_SPECIFICS;
    if (SYSTEM_PROMPTS.SUBJECT_SPECIFICS[subjectKey]) {
      prompt += "\n\n" + SYSTEM_PROMPTS.SUBJECT_SPECIFICS[subjectKey];
    }

    // 학생 컨텍스트 추가
    prompt += this.buildStudentSection(context.student);

    // 학습 메모리 추가
    if (context.memory) {
      prompt += this.buildMemorySection(context.memory);
    }

    // 세션 컨텍스트 추가
    if (context.session) {
      prompt += this.buildSessionSection(context.session);
    }

    // 규칙 기반 변환 적용
    for (const rule of this.rules) {
      if (rule.condition(context)) {
        prompt = rule.transform(prompt, context);
      }
    }

    // 캐시 저장
    this.promptCache.set(cacheKey, { prompt, timestamp: Date.now() });

    return prompt;
  }

  /**
   * 규칙 추가
   */
  addRule(rule: CompositionRule): void {
    this.rules.push(rule);
    this.rules.sort((a, b) => a.priority - b.priority);
  }

  /**
   * 규칙 제거
   */
  removeRule(ruleId: string): void {
    this.rules = this.rules.filter((r) => r.id !== ruleId);
  }

  // Private 메서드
  private getGradeCategory(gradeLevel: string): "ELEMENTARY" | "MIDDLE" | "HIGH" {
    if (gradeLevel.startsWith("ELEMENTARY")) return "ELEMENTARY";
    if (gradeLevel.startsWith("MIDDLE")) return "MIDDLE";
    return "HIGH";
  }

  private getCacheKey(context: CompositionContext): string {
    return `${context.student.id}-${context.student.subject}-${context.realtimeState.currentDifficulty}`;
  }

  private buildStudentSection(student: StudentContext): string {
    return `

## 학생 정보
- 이름: ${student.name}
- 학년: ${student.gradeLevel}
- 과목: ${student.subject}
- 현재 주제: ${student.currentTopic}
${student.diagnosticScore ? `- 진단 점수: ${student.diagnosticScore}점` : ""}
${student.targetScore ? `- 목표 점수: ${student.targetScore}점` : ""}`;
  }

  private buildMemorySection(memory: LearningMemory): string {
    let section = "\n\n## 학습 이력";
    
    if (memory.strengths.length > 0) {
      section += `\n- 강점: ${memory.strengths.slice(0, 3).join(", ")}`;
    }
    if (memory.weaknesses.length > 0) {
      section += `\n- 취약점: ${memory.weaknesses.slice(0, 3).join(", ")}`;
    }
    if (memory.errorPatterns.length > 0) {
      section += `\n- 주의 실수: ${memory.errorPatterns.slice(0, 2).map(e => e.type).join(", ")}`;
    }
    if (memory.emotionalState) {
      section += `\n- 현재 상태: ${this.formatEmotionalState(memory.emotionalState)}`;
    }

    return section;
  }

  private buildSessionSection(session: SessionContext): string {
    return `

## 현재 세션
- 목표: ${session.objective}
- 힌트 단계: ${session.currentHintLevel}/${session.maxHintLevel}
${session.currentProblem ? `\n### 현재 문제\n${session.currentProblem}` : ""}`;
  }

  private formatEmotionalState(state: string): string {
    const mapping: Record<string, string> = {
      CONFIDENT: "자신감 있음",
      NEUTRAL: "평온함",
      FRUSTRATED: "힘들어함 (격려 필요)",
      ANXIOUS: "불안함 (차분하게)",
    };
    return mapping[state] || state;
  }
}

// ============================================
// 품질 평가 엔진
// ============================================

export class QualityEvaluator {
  /**
   * 응답 품질 평가
   */
  evaluate(
    response: string,
    context: CompositionContext,
    studentReply?: string
  ): QualityScore {
    const scores: QualityScore = {
      overall: 0,
      questionQuality: this.evaluateQuestionQuality(response),
      difficultyMatch: this.evaluateDifficultyMatch(response, context),
      emotionalSupport: this.evaluateEmotionalSupport(response, context),
      socraticCompliance: this.evaluateSocraticCompliance(response),
      lengthAppropriate: this.evaluateLength(response, context),
    };

    // 가중 평균 계산
    scores.overall = (
      scores.questionQuality * 0.25 +
      scores.difficultyMatch * 0.2 +
      scores.emotionalSupport * 0.2 +
      scores.socraticCompliance * 0.25 +
      scores.lengthAppropriate * 0.1
    );

    return scores;
  }

  /**
   * 재생성 필요 여부
   */
  shouldRegenerate(score: QualityScore): boolean {
    return score.overall < 0.4 || score.socraticCompliance < 0.3;
  }

  /**
   * 질문 품질 평가 (답 직접 제시 감지)
   */
  private evaluateQuestionQuality(response: string): number {
    let score = 1.0;

    // 질문이 포함되어 있는가?
    if (!response.includes("?")) {
      score -= 0.3;
    }

    // 직접적인 정답 제시 패턴
    const directAnswerPatterns = [
      /답은\s+.+입니다/,
      /정답은\s+.+야/,
      /정답:\s*.+/,
      /그래서\s+.+(이야|입니다)/,
      /결과는\s+.+/,
    ];

    for (const pattern of directAnswerPatterns) {
      if (pattern.test(response)) {
        score -= 0.4;
        break;
      }
    }

    return Math.max(0, score);
  }

  /**
   * 난이도 매칭 평가
   */
  private evaluateDifficultyMatch(response: string, context: CompositionContext): number {
    const grade = context.student.gradeLevel;
    const words = response.split(/\s+/);
    
    // 초등학생에게 어려운 용어 사용 감지
    if (grade.startsWith("ELEMENTARY")) {
      const difficultTerms = ["따라서", "고로", "귀결", "도출"];
      const hasDifficult = difficultTerms.some((term) => response.includes(term));
      return hasDifficult ? 0.5 : 1.0;
    }

    return 0.8;  // 기본 점수
  }

  /**
   * 감정적 지원 평가
   */
  private evaluateEmotionalSupport(response: string, context: CompositionContext): number {
    const needsSupport = context.realtimeState.emotionalIndicators.some(
      (e) => e.type === "FRUSTRATION" && e.confidence > 0.5
    );

    if (!needsSupport) return 1.0;

    // 격려 표현 감지
    const encouragingPatterns = [
      /괜찮아/,
      /잘하고/,
      /좋아요/,
      /할 수 있어/,
      /화이팅/,
      /👍|😊|🌟|💪/,
    ];

    const hasEncouragement = encouragingPatterns.some((p) => p.test(response));
    return hasEncouragement ? 1.0 : 0.4;
  }

  /**
   * 소크라테스식 준수 평가
   */
  private evaluateSocraticCompliance(response: string): number {
    let score = 0.5;

    // 질문이 있으면 +0.3
    if (response.includes("?")) {
      score += 0.3;
    }

    // 사고 유도 표현
    const thoughtProvokingPatterns = [
      /생각해/,
      /어떻게/,
      /왜\s/,
      /무엇이/,
      /어떤/,
    ];

    for (const pattern of thoughtProvokingPatterns) {
      if (pattern.test(response)) {
        score += 0.1;
      }
    }

    return Math.min(1.0, score);
  }

  /**
   * 길이 적절성 평가
   */
  private evaluateLength(response: string, context: CompositionContext): number {
    const words = response.split(/\s+/).length;
    const grade = context.student.gradeLevel;

    // 학년별 적정 길이
    let optimalMin = 20;
    let optimalMax = 80;

    if (grade.startsWith("ELEMENTARY")) {
      optimalMin = 15;
      optimalMax = 50;
    } else if (grade.startsWith("HIGH")) {
      optimalMin = 30;
      optimalMax = 100;
    }

    if (words < optimalMin) return 0.6;
    if (words > optimalMax) return 0.7;
    return 1.0;
  }
}

// ============================================
// 실시간 상태 분석기
// ============================================

export class RealtimeStateAnalyzer {
  private recentResponses: { content: string; timestamp: number; isCorrect: boolean }[] = [];
  private emotionalHistory: EmotionalIndicator[] = [];

  /**
   * 학생 응답 분석
   */
  analyzeResponse(response: string): Partial<RealtimeState> {
    const indicators: EmotionalIndicator[] = [];

    // 좌절 감지
    if (/모르겠|어려워|포기|힘들어|싫어/.test(response)) {
      indicators.push({
        type: "FRUSTRATION",
        confidence: 0.8,
        detectedAt: new Date(),
      });
    }

    // 혼란 감지
    if (/뭐야|이해가 안|무슨 말|왜 그래|(?:\?){2,}/.test(response)) {
      indicators.push({
        type: "CONFUSION",
        confidence: 0.7,
        detectedAt: new Date(),
      });
    }

    // 지루함 감지
    if (/재미없|끝나|언제|지루|졸려/.test(response)) {
      indicators.push({
        type: "BOREDOM",
        confidence: 0.6,
        detectedAt: new Date(),
      });
    }

    // 긍정적 반응 감지
    if (/알겠|이해|아하|오|맞아|신기/.test(response)) {
      indicators.push({
        type: "EXCITEMENT",
        confidence: 0.6,
        detectedAt: new Date(),
      });
    }

    this.emotionalHistory.push(...indicators);

    // 최근 5분 내 감정만 유지
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    this.emotionalHistory = this.emotionalHistory.filter(
      (e) => e.detectedAt.getTime() > fiveMinAgo
    );

    return {
      emotionalIndicators: this.emotionalHistory,
    };
  }

  /**
   * 집중도 평가
   */
  evaluateEngagement(
    responseTime: number,
    responseLength: number
  ): "HIGH" | "MEDIUM" | "LOW" {
    // 응답이 너무 빠르고 짧으면 집중도 낮음
    if (responseTime < 2 && responseLength < 5) {
      return "LOW";
    }

    // 응답이 너무 느리면 집중도 중간
    if (responseTime > 120) {
      return "MEDIUM";
    }

    // 적절한 응답
    if (responseLength > 10 && responseTime > 5 && responseTime < 60) {
      return "HIGH";
    }

    return "MEDIUM";
  }

  /**
   * 정답률 기반 난이도 추천
   */
  recommendDifficulty(currentDifficulty: number, recentCorrectRate: number): number {
    if (recentCorrectRate < 0.3) {
      return Math.max(1, currentDifficulty - 2);
    } else if (recentCorrectRate < 0.5) {
      return Math.max(1, currentDifficulty - 1);
    } else if (recentCorrectRate > 0.8) {
      return Math.min(10, currentDifficulty + 1);
    }
    return currentDifficulty;
  }
}

// Export instances
export const compositionEngine = new PromptCompositionEngine();
export const qualityEvaluator = new QualityEvaluator();
export const stateAnalyzer = new RealtimeStateAnalyzer();
