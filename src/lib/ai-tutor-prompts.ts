/**
 * AI 튜터 프롬프트 시스템
 * 
 * 소크라테스식 질문 중심의 개인화 학습 튜터링
 */

// ============================================
// 타입 정의
// ============================================

export interface StudentContext {
  id: string;
  name: string;
  gradeLevel: string;  // ELEMENTARY_1-6, MIDDLE_1-3, HIGH_1-3
  subject: string;
  currentTopic: string;
  diagnosticScore?: number;
  targetScore?: number;
  learningStyle?: "VISUAL" | "AUDITORY" | "READING" | "KINESTHETIC";
  pacePreference?: "SLOW" | "MEDIUM" | "FAST";
}

export interface LearningMemory {
  // 개념 이해 상태
  conceptMastery: Record<string, "UNDERSTOOD" | "PARTIAL" | "STRUGGLING">;
  // 오답 패턴
  errorPatterns: {
    type: string;
    frequency: number;
    lastOccurred: Date;
    examples: string[];
  }[];
  // 질문 습관
  questionTypes: string[];
  // 학습 속도 (분/문제)
  averageSolveTime: number;
  // 감정 상태 신호
  emotionalState?: "CONFIDENT" | "NEUTRAL" | "FRUSTRATED" | "ANXIOUS";
  // 최근 학습 토픽
  recentTopics: string[];
  // 강점/약점
  strengths: string[];
  weaknesses: string[];
}

export interface SessionContext {
  sessionId: string;
  objective: string;
  timeLimit?: number;  // minutes
  maxHintLevel: number;  // 1-5
  currentHintLevel: number;
  questionsAsked: number;
  correctAnswers: number;
  startTime: Date;
  currentProblem?: string;
}

export interface TutorResponse {
  content: string;
  type: "QUESTION" | "HINT" | "EXPLANATION" | "ENCOURAGEMENT" | "SUMMARY";
  socraticStep?: number;  // 1-5
  shouldWaitForResponse: boolean;
  suggestedFollowUps?: string[];
  metadata?: {
    conceptsTouched: string[];
    difficultyLevel: number;
    estimatedUnderstanding: number;
  };
}

// ============================================
// 시스템 프롬프트 템플릿
// ============================================

export const SYSTEM_PROMPTS = {
  // 기본 튜터 역할 정의
  BASE_ROLE: `당신은 학생의 전담 1대1 AI 튜터입니다.

## 핵심 원칙
1. **답을 직접 제시하지 마세요** - 학생이 스스로 답을 찾도록 유도하세요
2. **소크라테스식 질문**을 사용하세요 - 사고를 자극하는 질문을 던지세요
3. **학생의 이해 수준**에 맞춰 설명하세요
4. **긍정적이고 인내심** 있게 대하세요
5. **비판하지 마세요** - 실수도 학습의 일부입니다

## 금지 사항
- 정답을 바로 알려주는 것
- 학생을 비난하거나 무시하는 것
- 너무 긴 설명 (한 번에 3문장 이하)
- 학년에 맞지 않는 어려운 용어`,

  // 학년별 언어 스타일
  LANGUAGE_STYLE: {
    ELEMENTARY: `## 언어 스타일
- 쉽고 친근한 말투를 사용하세요
- 이모지를 적절히 활용하세요 😊
- 칭찬을 자주 해주세요
- 복잡한 개념은 일상 예시로 설명하세요`,

    MIDDLE: `## 언어 스타일
- 친근하지만 체계적인 설명을 제공하세요
- 개념과 원리를 연결해서 설명하세요
- 왜 그런지 이유를 물어보세요
- 학생이 생각할 시간을 주세요`,

    HIGH: `## 언어 스타일
- 논리적이고 체계적인 접근을 유지하세요
- 개념의 본질과 응용을 연결하세요
- 비판적 사고를 장려하세요
- 수능/입시 관점에서 중요도를 언급하세요`,
  },

  // 과목별 특화 지침
  SUBJECT_SPECIFICS: {
    MATH: `## 수학 튜터링 지침
- 개념 → 공식 → 적용 순서로 진행하세요
- 풀이 과정을 단계별로 유도하세요
- 계산 실수와 개념 오류를 구분하세요
- 수식은 LaTeX로 표현하세요: $x^2 + 2x + 1$`,

    KOREAN: `## 국어 튜터링 지침
- 글의 구조와 논리 흐름을 파악하게 하세요
- 핵심 어휘의 의미를 문맥에서 추론하게 하세요
- 작가의 의도와 주제를 스스로 발견하게 하세요`,

    ENGLISH: `## 영어 튜터링 지침
- 문장 구조 분석을 먼저 유도하세요
- 어휘는 어근/접사로 추론하게 하세요
- 문맥을 통한 의미 파악을 강조하세요`,

    SCIENCE: `## 과학 튜터링 지침
- 현상 → 원리 → 법칙 순서로 이해시키세요
- 실생활 예시와 연결하세요
- 가설-검증 사고방식을 장려하세요`,
  },
};

// ============================================
// 소크라테스식 질문 패턴
// ============================================

export const SOCRATIC_PATTERNS = {
  // 1단계: 문제 재정의
  STEP_1_REDEFINE: [
    "이 문제에서 정확히 무엇을 구하라고 하는 거야?",
    "주어진 조건들을 한번 정리해볼까?",
    "이 문제를 네 말로 다시 설명해줄 수 있어?",
  ],

  // 2단계: 핵심 개념 회상
  STEP_2_RECALL: [
    "이런 유형의 문제를 풀 때 어떤 개념이 필요할까?",
    "비슷한 문제를 전에 풀어본 적 있어?",
    "여기서 사용해야 할 공식이나 원리가 뭘까?",
  ],

  // 3단계: 적용 가능성
  STEP_3_APPLY: [
    "그 개념을 이 문제에 어떻게 적용할 수 있을까?",
    "첫 번째 단계로 뭘 해야 할 것 같아?",
    "이 조건을 활용하면 뭘 알 수 있을까?",
  ],

  // 4단계: 오류 지점 유도
  STEP_4_ERROR: [
    "여기서 뭔가 이상한 점이 느껴지지 않아?",
    "이 결과가 맞는지 어떻게 확인할 수 있을까?",
    "다른 접근 방법은 없을까?",
  ],

  // 5단계: 스스로 정리
  STEP_5_SYNTHESIZE: [
    "지금까지 알아낸 것들을 정리해볼까?",
    "이 문제에서 배운 핵심 포인트가 뭘까?",
    "비슷한 문제가 나오면 어떤 순서로 풀 거야?",
  ],
};

// ============================================
// 프롬프트 빌더
// ============================================

export class TutorPromptBuilder {
  private systemPrompt: string = "";
  private studentContext: StudentContext | null = null;
  private learningMemory: LearningMemory | null = null;
  private sessionContext: SessionContext | null = null;

  /**
   * 시스템 프롬프트 구성
   */
  buildSystemPrompt(
    student: StudentContext,
    memory?: LearningMemory
  ): string {
    this.studentContext = student;
    this.learningMemory = memory || null;

    // 기본 역할
    let prompt = SYSTEM_PROMPTS.BASE_ROLE + "\n\n";

    // 학년별 언어 스타일
    const gradeCategory = this.getGradeCategory(student.gradeLevel);
    prompt += SYSTEM_PROMPTS.LANGUAGE_STYLE[gradeCategory] + "\n\n";

    // 과목별 지침
    const subjectKey = student.subject.toUpperCase() as keyof typeof SYSTEM_PROMPTS.SUBJECT_SPECIFICS;
    if (SYSTEM_PROMPTS.SUBJECT_SPECIFICS[subjectKey]) {
      prompt += SYSTEM_PROMPTS.SUBJECT_SPECIFICS[subjectKey] + "\n\n";
    }

    // 학생 컨텍스트
    prompt += this.buildStudentContextPrompt(student);

    // 학습 메모리
    if (memory) {
      prompt += this.buildMemoryPrompt(memory);
    }

    this.systemPrompt = prompt;
    return prompt;
  }

  /**
   * 학생 컨텍스트 프롬프트
   */
  private buildStudentContextPrompt(student: StudentContext): string {
    return `
## 학생 정보
- 이름: ${student.name}
- 학년: ${this.formatGradeLevel(student.gradeLevel)}
- 과목: ${student.subject}
- 현재 주제: ${student.currentTopic}
${student.diagnosticScore ? `- 진단 점수: ${student.diagnosticScore}점` : ""}
${student.targetScore ? `- 목표 점수: ${student.targetScore}점` : ""}
${student.learningStyle ? `- 학습 스타일: ${this.formatLearningStyle(student.learningStyle)}` : ""}
${student.pacePreference ? `- 학습 속도: ${this.formatPace(student.pacePreference)}` : ""}
`;
  }

  /**
   * 학습 메모리 프롬프트
   */
  private buildMemoryPrompt(memory: LearningMemory): string {
    let prompt = "\n## 학습 이력\n";

    // 강점/약점
    if (memory.strengths.length > 0) {
      prompt += `- 강점: ${memory.strengths.join(", ")}\n`;
    }
    if (memory.weaknesses.length > 0) {
      prompt += `- 보완 필요: ${memory.weaknesses.join(", ")}\n`;
    }

    // 오답 패턴
    if (memory.errorPatterns.length > 0) {
      prompt += `- 주의할 실수 유형: ${memory.errorPatterns
        .slice(0, 3)
        .map((e) => e.type)
        .join(", ")}\n`;
    }

    // 감정 상태
    if (memory.emotionalState) {
      prompt += `- 현재 학습 상태: ${this.formatEmotionalState(memory.emotionalState)}\n`;
    }

    return prompt;
  }

  /**
   * 세션 컨텍스트 프롬프트
   */
  buildSessionPrompt(session: SessionContext): string {
    return `
## 현재 세션
- 학습 목표: ${session.objective}
${session.timeLimit ? `- 제한 시간: ${session.timeLimit}분` : ""}
- 최대 힌트 단계: ${session.maxHintLevel}
- 현재 힌트 단계: ${session.currentHintLevel}
${session.currentProblem ? `\n## 현재 문제\n${session.currentProblem}` : ""}
`;
  }

  /**
   * 소크라테스식 질문 생성
   */
  generateSocraticQuestion(
    step: 1 | 2 | 3 | 4 | 5,
    context?: { previousAnswer?: string; topic?: string }
  ): string {
    const stepKey = `STEP_${step}_${
      step === 1 ? "REDEFINE" :
      step === 2 ? "RECALL" :
      step === 3 ? "APPLY" :
      step === 4 ? "ERROR" : "SYNTHESIZE"
    }` as keyof typeof SOCRATIC_PATTERNS;

    const questions = SOCRATIC_PATTERNS[stepKey];
    return questions[Math.floor(Math.random() * questions.length)];
  }

  /**
   * 실시간 개입 프롬프트
   */
  buildInterventionPrompt(reason: "STUCK" | "ERROR" | "OFFTOPIC" | "SPEED"): string {
    const interventions = {
      STUCK: "학생이 막혀있는 것 같습니다. 부드럽게 힌트를 제공하세요.",
      ERROR: "학생이 실수를 했습니다. 직접 지적하지 말고 질문으로 유도하세요.",
      OFFTOPIC: "대화가 주제에서 벗어났습니다. 자연스럽게 학습으로 돌아오게 유도하세요.",
      SPEED: "학생의 속도가 너무 빠릅니다. 이해를 확인하는 질문을 하세요.",
    };

    return `\n[실시간 개입] ${interventions[reason]}`;
  }

  // 유틸리티 메서드
  private getGradeCategory(gradeLevel: string): "ELEMENTARY" | "MIDDLE" | "HIGH" {
    if (gradeLevel.startsWith("ELEMENTARY")) return "ELEMENTARY";
    if (gradeLevel.startsWith("MIDDLE")) return "MIDDLE";
    return "HIGH";
  }

  private formatGradeLevel(level: string): string {
    const mapping: Record<string, string> = {
      ELEMENTARY_1: "초등학교 1학년",
      ELEMENTARY_2: "초등학교 2학년",
      ELEMENTARY_3: "초등학교 3학년",
      ELEMENTARY_4: "초등학교 4학년",
      ELEMENTARY_5: "초등학교 5학년",
      ELEMENTARY_6: "초등학교 6학년",
      MIDDLE_1: "중학교 1학년",
      MIDDLE_2: "중학교 2학년",
      MIDDLE_3: "중학교 3학년",
      HIGH_1: "고등학교 1학년",
      HIGH_2: "고등학교 2학년",
      HIGH_3: "고등학교 3학년",
    };
    return mapping[level] || level;
  }

  private formatLearningStyle(style: string): string {
    const mapping: Record<string, string> = {
      VISUAL: "시각형 (그림/도표 선호)",
      AUDITORY: "청각형 (설명 선호)",
      READING: "읽기형 (텍스트 선호)",
      KINESTHETIC: "체험형 (실습 선호)",
    };
    return mapping[style] || style;
  }

  private formatPace(pace: string): string {
    const mapping: Record<string, string> = {
      SLOW: "천천히 (충분한 설명)",
      MEDIUM: "보통",
      FAST: "빠르게 (핵심 위주)",
    };
    return mapping[pace] || pace;
  }

  private formatEmotionalState(state: string): string {
    const mapping: Record<string, string> = {
      CONFIDENT: "자신감 있음 ✨",
      NEUTRAL: "평온함",
      FRUSTRATED: "약간 힘들어함 (격려 필요)",
      ANXIOUS: "불안해함 (차분하게 진행)",
    };
    return mapping[state] || state;
  }
}

// ============================================
// 응답 품질 제어
// ============================================

export class ResponseQualityController {
  /**
   * 응답 길이 제한
   */
  static enforceMaxLength(response: string, maxTokens: number = 150): string {
    const words = response.split(/\s+/);
    if (words.length > maxTokens) {
      return words.slice(0, maxTokens).join(" ") + "...";
    }
    return response;
  }

  /**
   * 정답 직접 제시 감지
   */
  static detectDirectAnswer(response: string, answer?: string): boolean {
    // 정답이 있는 경우 직접 포함 여부 확인
    if (answer && response.includes(answer)) {
      return true;
    }

    // "답은", "정답은" 등의 패턴 감지
    const directPatterns = [
      /답은\s+.+입니다/,
      /정답은\s+.+야/,
      /정답:\s*.+/,
      /그래서\s+.+이야/,
    ];

    return directPatterns.some((pattern) => pattern.test(response));
  }

  /**
   * 질문 형태 유지 확인
   */
  static hasQuestion(response: string): boolean {
    return response.includes("?") || 
           response.includes("까?") || 
           response.includes("니?") ||
           response.includes("어?");
  }

  /**
   * 난이도 조절 체크
   */
  static shouldLowerDifficulty(
    consecutiveErrors: number,
    understandingLevel: number
  ): boolean {
    return consecutiveErrors >= 2 || understandingLevel < 0.3;
  }

  /**
   * 부적절한 응답 필터
   */
  static filterInappropriate(response: string): string {
    // 기본적인 필터링 (실제로는 더 정교해야 함)
    const inappropriatePatterns = [
      /바보|멍청/g,
      /틀렸잖아/g,
      /왜\s+몰라/g,
    ];

    let filtered = response;
    inappropriatePatterns.forEach((pattern) => {
      filtered = filtered.replace(pattern, "");
    });

    return filtered;
  }
}

// ============================================
// 프롬프트 버전 관리
// ============================================

export interface PromptVersion {
  id: string;
  version: string;
  name: string;
  systemPrompt: string;
  createdAt: Date;
  isActive: boolean;
  metrics?: {
    avgSatisfaction: number;
    avgUnderstandingGain: number;
    usageCount: number;
  };
}

export const CURRENT_PROMPT_VERSION = "1.0.0";

// Export default builder instance
export const tutorPromptBuilder = new TutorPromptBuilder();
