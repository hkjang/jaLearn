/**
 * AI 튜터 엔진
 * 
 * LLM과 통합하여 실제 튜터링을 수행하는 핵심 엔진
 */

import {
  StudentContext,
  LearningMemory,
  SessionContext,
  TutorResponse,
  TutorPromptBuilder,
  ResponseQualityController,
  SOCRATIC_PATTERNS,
} from "./ai-tutor-prompts";

// ============================================
// AI 튜터 엔진 설정
// ============================================

export interface TutorEngineConfig {
  provider: "openai" | "anthropic" | "simulation";
  model?: string;
  maxTokens?: number;
  temperature?: number;
  enableMemory?: boolean;
  enableIntervention?: boolean;
  debugMode?: boolean;
}

const DEFAULT_CONFIG: TutorEngineConfig = {
  provider: "simulation",  // 시뮬레이션 모드 기본값
  model: "gpt-4",
  maxTokens: 500,
  temperature: 0.7,
  enableMemory: true,
  enableIntervention: true,
  debugMode: false,
};

// ============================================
// AI 튜터 엔진 클래스
// ============================================

export class AITutorEngine {
  private config: TutorEngineConfig;
  private promptBuilder: TutorPromptBuilder;
  private studentContext: StudentContext | null = null;
  private learningMemory: LearningMemory | null = null;
  private sessionContext: SessionContext | null = null;
  private conversationHistory: { role: string; content: string }[] = [];
  private currentSocraticStep: number = 1;

  constructor(config: Partial<TutorEngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.promptBuilder = new TutorPromptBuilder();
  }

  /**
   * 세션 시작
   */
  async startSession(
    student: StudentContext,
    memory?: LearningMemory,
    objective?: string
  ): Promise<TutorResponse> {
    this.studentContext = student;
    this.learningMemory = memory || null;

    // 세션 컨텍스트 초기화
    this.sessionContext = {
      sessionId: `session-${Date.now()}`,
      objective: objective || `${student.currentTopic} 학습`,
      timeLimit: 45,
      maxHintLevel: 5,
      currentHintLevel: 0,
      questionsAsked: 0,
      correctAnswers: 0,
      startTime: new Date(),
    };

    // 대화 기록 초기화
    this.conversationHistory = [];
    this.currentSocraticStep = 1;

    // 시스템 프롬프트 생성
    const systemPrompt = this.promptBuilder.buildSystemPrompt(student, memory);
    
    // 첫 인사 생성
    const greeting = await this.generateGreeting(student, memory);

    return {
      content: greeting,
      type: "ENCOURAGEMENT",
      shouldWaitForResponse: true,
      suggestedFollowUps: this.getSuggestedTopics(student),
    };
  }

  /**
   * 학생 메시지 처리
   */
  async processMessage(userMessage: string): Promise<TutorResponse> {
    if (!this.studentContext || !this.sessionContext) {
      throw new Error("세션이 시작되지 않았습니다.");
    }

    // 대화 기록에 추가
    this.conversationHistory.push({
      role: "user",
      content: userMessage,
    });

    // 개입 필요 여부 확인
    const intervention = this.checkIntervention(userMessage);

    // 응답 생성
    let response: TutorResponse;

    if (this.config.provider === "simulation") {
      response = await this.generateSimulatedResponse(userMessage, intervention);
    } else {
      response = await this.generateLLMResponse(userMessage, intervention);
    }

    // 품질 제어
    response.content = ResponseQualityController.enforceMaxLength(response.content);
    response.content = ResponseQualityController.filterInappropriate(response.content);

    // 대화 기록에 추가
    this.conversationHistory.push({
      role: "assistant",
      content: response.content,
    });

    // 세션 통계 업데이트
    this.sessionContext.questionsAsked++;

    return response;
  }

  /**
   * 힌트 제공
   */
  async provideHint(): Promise<TutorResponse> {
    if (!this.sessionContext) {
      throw new Error("세션이 시작되지 않았습니다.");
    }

    if (this.sessionContext.currentHintLevel >= this.sessionContext.maxHintLevel) {
      return {
        content: "더 이상 힌트를 줄 수 없어요. 지금까지 배운 걸로 한번 더 시도해볼까요?",
        type: "HINT",
        shouldWaitForResponse: true,
      };
    }

    this.sessionContext.currentHintLevel++;

    const hints = [
      "문제를 다시 천천히 읽어볼까요? 어떤 정보가 주어졌나요?",
      "이 문제에서 사용해야 할 핵심 개념이 뭘까요?",
      "비슷한 문제를 전에 풀었던 것 같은데... 그때 어떻게 접근했었죠?",
      "첫 번째 단계만 같이 해볼까요? $x$의 값을 어떻게 구할 수 있을까요?",
      "거의 다 왔어요! 이 부분만 다시 확인해보세요.",
    ];

    return {
      content: hints[this.sessionContext.currentHintLevel - 1] || hints[hints.length - 1],
      type: "HINT",
      shouldWaitForResponse: true,
    };
  }

  /**
   * 세션 요약
   */
  async summarizeSession(): Promise<TutorResponse> {
    if (!this.sessionContext || !this.studentContext) {
      throw new Error("세션이 시작되지 않았습니다.");
    }

    const duration = Math.round(
      (Date.now() - this.sessionContext.startTime.getTime()) / 60000
    );

    const summary = `## 오늘 학습 요약 📝

**학습 시간**: ${duration}분
**다룬 주제**: ${this.studentContext.currentTopic}
**질문 수**: ${this.sessionContext.questionsAsked}개

### 잘한 점 ✨
- 끝까지 집중해서 학습했어요!
- 질문을 통해 스스로 생각하는 습관을 기르고 있어요

### 다음에 복습할 내용 📚
- ${this.studentContext.currentTopic} 관련 추가 연습 문제
- 오늘 어려웠던 부분 다시 한번 정리하기

다음 시간에 또 만나요! 화이팅! 💪`;

    return {
      content: summary,
      type: "SUMMARY",
      shouldWaitForResponse: false,
    };
  }

  // ============================================
  // Private 메서드
  // ============================================

  /**
   * 첫 인사 생성
   */
  private async generateGreeting(
    student: StudentContext,
    memory?: LearningMemory
  ): Promise<string> {
    const greetings = {
      ELEMENTARY: `안녕하세요, ${student.name}! 😊 오늘도 함께 공부할 준비 됐나요?\n\n오늘은 **${student.currentTopic}**을 배워볼 거예요. 궁금한 게 있으면 언제든 물어보세요!`,
      MIDDLE: `안녕, ${student.name}! 오늘 함께 공부하게 되어 반가워요.\n\n오늘의 주제는 **${student.currentTopic}**이에요. ${memory?.weaknesses?.length ? `지난번에 ${memory.weaknesses[0]} 부분이 조금 어려웠죠? 오늘 함께 정리해볼까요?` : "어떤 부분부터 시작할까요?"}`,
      HIGH: `안녕하세요, ${student.name}님. 오늘 **${student.currentTopic}** 학습을 시작하겠습니다.\n\n${student.targetScore ? `목표 ${student.targetScore}점 달성을 위해 체계적으로 진행해볼게요.` : "어떤 부분이 가장 도움이 필요할까요?"} 궁금한 점이 있으면 바로 질문해주세요.`,
    };

    const category = student.gradeLevel.startsWith("ELEMENTARY")
      ? "ELEMENTARY"
      : student.gradeLevel.startsWith("MIDDLE")
      ? "MIDDLE"
      : "HIGH";

    return greetings[category];
  }

  /**
   * 개입 필요 여부 확인
   */
  private checkIntervention(
    message: string
  ): { needed: boolean; reason?: "STUCK" | "ERROR" | "OFFTOPIC" | "SPEED" } {
    // "모르겠어요", "어려워요" 등 막힘 감지
    if (/모르겠|어려워|힘들어|포기/.test(message)) {
      return { needed: true, reason: "STUCK" };
    }

    // 주제 벗어남 감지 (간단한 버전)
    if (/게임|유튜브|친구|놀/.test(message) && message.length < 20) {
      return { needed: true, reason: "OFFTOPIC" };
    }

    return { needed: false };
  }

  /**
   * 시뮬레이션 응답 생성
   */
  private async generateSimulatedResponse(
    userMessage: string,
    intervention: { needed: boolean; reason?: string }
  ): Promise<TutorResponse> {
    // 간단한 시뮬레이션 로직
    const isQuestion = userMessage.includes("?");
    const isConfused = /모르겠|어려워|왜/.test(userMessage);
    const isCorrectAnswer = /맞아|정답|그래서/.test(userMessage);

    let response: TutorResponse;

    if (intervention.needed) {
      // 개입 응답
      const interventionResponses = {
        STUCK: "괜찮아요! 어려울 수 있어요. 같이 천천히 해볼까요? 🙂\n\n먼저, 이 문제에서 가장 중요한 조건이 뭐라고 생각해요?",
        ERROR: "음, 한번 다시 생각해볼까요? 여기서 뭔가 놓친 게 있는 것 같아요.\n\n처음에 어떤 값을 구해야 할까요?",
        OFFTOPIC: "그건 나중에 얘기하고, 지금은 공부에 집중해볼까요? 😊\n\n자, 아까 문제로 돌아가서...",
        SPEED: "잠깐, 이 부분을 정말 이해한 건지 확인해볼게요.\n\n왜 이렇게 되는지 설명해줄 수 있어요?",
      };

      response = {
        content: interventionResponses[intervention.reason as keyof typeof interventionResponses] || interventionResponses.STUCK,
        type: "QUESTION",
        isIntervention: true,
        socraticStep: 1,
        shouldWaitForResponse: true,
      } as TutorResponse & { isIntervention?: boolean };
    } else if (isConfused) {
      // 혼란 상태 - 이전 단계로
      this.currentSocraticStep = Math.max(1, this.currentSocraticStep - 1);
      const question = this.promptBuilder.generateSocraticQuestion(
        this.currentSocraticStep as 1 | 2 | 3 | 4 | 5
      );

      response = {
        content: `걱정 마세요, 함께 정리해볼게요! 😊\n\n${question}`,
        type: "QUESTION",
        socraticStep: this.currentSocraticStep,
        shouldWaitForResponse: true,
      };
    } else if (isCorrectAnswer) {
      // 정답에 가까움 - 다음 단계로
      this.currentSocraticStep = Math.min(5, this.currentSocraticStep + 1);

      if (this.currentSocraticStep === 5) {
        response = {
          content: "훌륭해요! 🎉 스스로 답을 찾아냈네요!\n\n이제 배운 내용을 정리해볼까요. 이 문제에서 가장 중요한 포인트가 뭐였을까요?",
          type: "ENCOURAGEMENT",
          socraticStep: 5,
          shouldWaitForResponse: true,
        };
      } else {
        const question = this.promptBuilder.generateSocraticQuestion(
          this.currentSocraticStep as 1 | 2 | 3 | 4 | 5
        );
        response = {
          content: `좋아요! 잘 따라오고 있어요! 👍\n\n${question}`,
          type: "QUESTION",
          socraticStep: this.currentSocraticStep,
          shouldWaitForResponse: true,
        };
      }
    } else {
      // 일반 응답
      const question = this.promptBuilder.generateSocraticQuestion(
        this.currentSocraticStep as 1 | 2 | 3 | 4 | 5
      );
      response = {
        content: `네, 좋은 생각이에요!\n\n${question}`,
        type: "QUESTION",
        socraticStep: this.currentSocraticStep,
        shouldWaitForResponse: true,
      };
    }

    return response;
  }

  /**
   * LLM 응답 생성 (실제 API 연동)
   */
  private async generateLLMResponse(
    userMessage: string,
    intervention: { needed: boolean; reason?: string }
  ): Promise<TutorResponse> {
    // TODO: 실제 LLM API 연동
    // OpenAI, Anthropic 등의 API를 호출

    // 현재는 시뮬레이션으로 폴백
    return this.generateSimulatedResponse(userMessage, intervention);
  }

  /**
   * 추천 주제 생성
   */
  private getSuggestedTopics(student: StudentContext): string[] {
    const topicSuggestions: Record<string, string[]> = {
      MATH: ["문제 풀어보기", "개념 복습하기", "오답 확인하기"],
      KOREAN: ["지문 분석하기", "어휘 공부하기", "문제 풀기"],
      ENGLISH: ["문법 정리하기", "독해 연습하기", "어휘 암기"],
      SCIENCE: ["실험 원리 이해하기", "개념 정리하기", "문제 풀기"],
    };

    return topicSuggestions[student.subject.toUpperCase()] || ["시작하기"];
  }

  /**
   * 학습 메모리 업데이트
   */
  async updateMemory(): Promise<void> {
    if (!this.learningMemory || !this.sessionContext) return;

    // 세션 결과를 바탕으로 메모리 업데이트
    // 실제 구현에서는 DB에 저장
    if (this.sessionContext.correctAnswers > this.sessionContext.questionsAsked * 0.7) {
      this.learningMemory.emotionalState = "CONFIDENT";
    } else if (this.sessionContext.correctAnswers < this.sessionContext.questionsAsked * 0.3) {
      this.learningMemory.emotionalState = "FRUSTRATED";
    }
  }
}

// Export singleton instance
export const tutorEngine = new AITutorEngine();
