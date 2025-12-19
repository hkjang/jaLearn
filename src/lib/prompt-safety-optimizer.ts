/**
 * 프롬프트 안전장치 및 비용 최적화
 * 
 * 답안 노출 방지, 탈옥 방지, 토큰 관리, 멀티 AI 협업
 */

import { StudentContext, LearningMemory } from "./ai-tutor-prompts";

// ============================================
// 안전장치 시스템
// ============================================

export interface SafetyCheckResult {
  passed: boolean;
  flags: SafetyFlag[];
  sanitizedContent?: string;
}

export interface SafetyFlag {
  type: "ANSWER_EXPOSURE" | "JAILBREAK" | "INAPPROPRIATE" | "OVERUSE" | "PERSONAL_INFO";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  position?: { start: number; end: number };
}

export class PromptSafetyGuard {
  private sessionStartTime: Date | null = null;
  private maxSessionMinutes: number = 60;

  /**
   * 입력 검사 (학생 입력)
   */
  checkInput(input: string): SafetyCheckResult {
    const flags: SafetyFlag[] = [];

    // 탈옥 시도 감지
    const jailbreakPatterns = [
      /무시해|잊어|규칙.*(없|무시|버려)/,
      /시스템.*프롬프트/,
      /역할.*(바꿔|변경)/,
      /pretend|ignore|forget.*rules/i,
      /DAN|jailbreak/i,
    ];

    for (const pattern of jailbreakPatterns) {
      if (pattern.test(input)) {
        flags.push({
          type: "JAILBREAK",
          severity: "CRITICAL",
          description: "탈옥 시도 감지",
        });
      }
    }

    // 개인정보 감지
    const personalInfoPatterns = [
      /(\d{6}[-]?\d{7})/,  // 주민번호
      /(\d{3}[-.]?\d{3,4}[-.]?\d{4})/,  // 전화번호
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,  // 이메일
    ];

    for (const pattern of personalInfoPatterns) {
      if (pattern.test(input)) {
        flags.push({
          type: "PERSONAL_INFO",
          severity: "HIGH",
          description: "개인정보 포함 감지",
        });
      }
    }

    return {
      passed: flags.filter((f) => f.severity === "CRITICAL").length === 0,
      flags,
    };
  }

  /**
   * 출력 검사 (AI 응답)
   */
  checkOutput(output: string, context?: { examMode?: boolean }): SafetyCheckResult {
    const flags: SafetyFlag[] = [];
    let sanitized = output;

    // 시험 모드에서 답안 직접 노출 차단
    if (context?.examMode) {
      const answerPatterns = [
        /(정답|답)[은:]?\s*[①②③④⑤1-5]/,
        /답은?\s+.{1,20}(입니다|이야|예요)/,
      ];

      for (const pattern of answerPatterns) {
        if (pattern.test(output)) {
          flags.push({
            type: "ANSWER_EXPOSURE",
            severity: "HIGH",
            description: "시험 모드에서 답안 직접 노출",
          });
          // 답안 부분 제거
          sanitized = sanitized.replace(pattern, "[힌트가 숨겨졌습니다. 스스로 생각해보세요!]");
        }
      }
    }

    // 부적절한 표현 필터
    const inappropriatePatterns = [
      /바보|멍청|쓸모없|짜증/,
      /못해|포기해|그만둬/,
    ];

    for (const pattern of inappropriatePatterns) {
      if (pattern.test(output)) {
        flags.push({
          type: "INAPPROPRIATE",
          severity: "MEDIUM",
          description: "부적절한 표현 감지",
        });
        sanitized = sanitized.replace(pattern, "");
      }
    }

    return {
      passed: flags.filter((f) => f.severity === "CRITICAL" || f.severity === "HIGH").length === 0,
      flags,
      sanitizedContent: sanitized,
    };
  }

  /**
   * 과몰입 체크
   */
  checkOveruse(sessionStartTime: Date): SafetyCheckResult {
    const duration = (Date.now() - sessionStartTime.getTime()) / 60000;  // 분

    if (duration > this.maxSessionMinutes) {
      return {
        passed: false,
        flags: [{
          type: "OVERUSE",
          severity: "MEDIUM",
          description: `${Math.round(duration)}분 이상 학습 중. 휴식이 필요합니다.`,
        }],
      };
    }

    if (duration > this.maxSessionMinutes * 0.8) {
      return {
        passed: true,
        flags: [{
          type: "OVERUSE",
          severity: "LOW",
          description: `${Math.round(duration)}분 학습 중. 곧 휴식을 권장합니다.`,
        }],
      };
    }

    return { passed: true, flags: [] };
  }
}

// ============================================
// 토큰 및 비용 최적화
// ============================================

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;  // USD
}

export interface CompressionResult {
  original: string;
  compressed: string;
  savedTokens: number;
  compressionRatio: number;
}

export class TokenOptimizer {
  private tokenPrices = {
    "gpt-4": { input: 0.03, output: 0.06 },  // per 1K tokens
    "gpt-3.5-turbo": { input: 0.0015, output: 0.002 },
    "claude-3": { input: 0.015, output: 0.075 },
  };

  // 학년별 최대 토큰 제한
  private gradeTokenLimits: Record<string, number> = {
    ELEMENTARY: 300,
    MIDDLE: 400,
    HIGH: 500,
  };

  /**
   * 토큰 수 추정 (한국어 + 영어)
   */
  estimateTokens(text: string): number {
    // 한국어는 대략 문자당 1.5토큰, 영어는 단어당 1.3토큰
    const koreanChars = (text.match(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g) || []).length;
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    const numbers = (text.match(/\d+/g) || []).length;
    const symbols = text.length - koreanChars - englishWords - numbers;

    return Math.ceil(koreanChars * 1.5 + englishWords * 1.3 + numbers * 0.5 + symbols * 0.3);
  }

  /**
   * 비용 계산
   */
  calculateCost(
    promptTokens: number,
    completionTokens: number,
    model: keyof typeof this.tokenPrices = "gpt-4"
  ): number {
    const prices = this.tokenPrices[model];
    return (promptTokens / 1000) * prices.input + (completionTokens / 1000) * prices.output;
  }

  /**
   * 장기 메모리 압축
   */
  compressMemory(memory: LearningMemory): CompressionResult {
    const original = JSON.stringify(memory);

    // 오래된 오답 패턴 제거
    const recentPatterns = memory.errorPatterns
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);  // 상위 5개만 유지

    // 최근 토픽만 유지
    const recentTopics = memory.recentTopics.slice(0, 5);

    // 압축된 메모리
    const compressedMemory: Partial<LearningMemory> = {
      strengths: memory.strengths.slice(0, 3),
      weaknesses: memory.weaknesses.slice(0, 3),
      errorPatterns: recentPatterns,
      recentTopics,
      emotionalState: memory.emotionalState,
    };

    const compressed = JSON.stringify(compressedMemory);

    return {
      original,
      compressed,
      savedTokens: this.estimateTokens(original) - this.estimateTokens(compressed),
      compressionRatio: compressed.length / original.length,
    };
  }

  /**
   * 프롬프트 최적화
   */
  optimizePrompt(prompt: string, gradeLevel: string): string {
    const category = gradeLevel.startsWith("ELEMENTARY") ? "ELEMENTARY" :
                     gradeLevel.startsWith("MIDDLE") ? "MIDDLE" : "HIGH";
    
    const maxTokens = this.gradeTokenLimits[category];
    const currentTokens = this.estimateTokens(prompt);

    if (currentTokens <= maxTokens) {
      return prompt;
    }

    // 토큰 초과 시 축약
    // 1. 예시 제거
    let optimized = prompt.replace(/예[를시]?\s*(들어|들면)[\s\S]*?(?=\n\n|\n##|$)/g, "");

    // 2. 중복 지침 제거
    optimized = optimized.replace(/(\n- [^\n]+)(\1)+/g, "$1");

    // 3. 긴 설명 축약
    optimized = optimized.replace(/설명[\s\S]{50,}?(?=\n)/g, (match) => 
      match.substring(0, 50) + "..."
    );

    return optimized;
  }

  /**
   * 학년별 토큰 제한 조회
   */
  getMaxTokens(gradeLevel: string): number {
    const category = gradeLevel.startsWith("ELEMENTARY") ? "ELEMENTARY" :
                     gradeLevel.startsWith("MIDDLE") ? "MIDDLE" : "HIGH";
    return this.gradeTokenLimits[category];
  }
}

// ============================================
// 멀티 AI 튜터 코디네이터
// ============================================

export interface TutorRole {
  id: string;
  name: string;
  role: "MAIN" | "ANALYSIS" | "SUMMARY" | "VERIFY";
  systemPrompt: string;
  model?: string;
  priority: number;
}

export interface MultiTutorResponse {
  mainResponse: string;
  analysis?: string;
  summary?: string;
  verification?: { passed: boolean; issues: string[] };
}

export class MultiTutorCoordinator {
  private tutorRoles: TutorRole[] = [
    {
      id: "main",
      name: "주 튜터",
      role: "MAIN",
      systemPrompt: "당신은 학생과 대화하는 주 AI 튜터입니다. 소크라테스식 질문으로 학습을 유도하세요.",
      priority: 1,
    },
    {
      id: "analysis",
      name: "분석 튜터",
      role: "ANALYSIS",
      systemPrompt: "당신은 학생의 응답을 분석하는 AI입니다. 오답 패턴과 이해도를 분석하세요.",
      priority: 2,
    },
    {
      id: "summary",
      name: "요약 튜터",
      role: "SUMMARY",
      systemPrompt: "당신은 학습 세션을 요약하는 AI입니다. 핵심 학습 포인트를 정리하세요.",
      priority: 3,
    },
    {
      id: "verify",
      name: "검증 튜터",
      role: "VERIFY",
      systemPrompt: "당신은 AI 응답을 검증하는 AI입니다. 오류나 부적절한 내용을 찾으세요.",
      priority: 4,
    },
  ];

  /**
   * 멀티 튜터 응답 조율
   */
  async coordinate(
    studentMessage: string,
    context: StudentContext,
    mainResponse: string
  ): Promise<MultiTutorResponse> {
    // 시뮬레이션 모드 - 실제로는 각 튜터별 API 호출

    // 분석 튜터: 학생 응답 패턴 분석
    const analysis = this.simulateAnalysis(studentMessage);

    // 검증 튜터: 주 튜터 응답 검증
    const verification = this.simulateVerification(mainResponse);

    return {
      mainResponse: verification.passed ? mainResponse : this.improveResponse(mainResponse, verification.issues),
      analysis,
      verification,
    };
  }

  /**
   * 세션 종료 시 요약 생성
   */
  async generateSessionSummary(
    messages: { role: string; content: string }[],
    context: StudentContext
  ): Promise<string> {
    // 시뮬레이션
    const messageCount = messages.length;
    const userMessages = messages.filter((m) => m.role === "user").length;

    return `## 학습 세션 요약

**학생**: ${context.name}
**주제**: ${context.currentTopic}
**대화 수**: ${messageCount}회 (학생 ${userMessages}회)

### 학습 성과
- 주요 개념 학습 완료
- 소크라테스식 질문을 통한 사고력 향상

### 다음 학습 추천
- ${context.currentTopic} 심화 문제 풀이
- 관련 개념 복습`;
  }

  // Private 시뮬레이션 메서드
  private simulateAnalysis(message: string): string {
    if (message.length < 10) {
      return "응답이 짧음. 더 자세한 설명 유도 필요.";
    }
    if (/모르겠|어려워/.test(message)) {
      return "학생이 어려움을 겪고 있음. 난이도 하향 권장.";
    }
    return "정상적인 학습 진행 중.";
  }

  private simulateVerification(response: string): { passed: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!response.includes("?")) {
      issues.push("질문이 포함되지 않음");
    }

    if (/정답은|답은/.test(response)) {
      issues.push("직접적인 답 제시");
    }

    if (response.length > 500) {
      issues.push("응답이 너무 김");
    }

    return {
      passed: issues.length === 0,
      issues,
    };
  }

  private improveResponse(response: string, issues: string[]): string {
    let improved = response;

    // 질문 없으면 추가
    if (issues.includes("질문이 포함되지 않음") && !improved.includes("?")) {
      improved += "\n\n이 부분에 대해 어떻게 생각해요?";
    }

    // 너무 길면 축약
    if (issues.includes("응답이 너무 김")) {
      improved = improved.substring(0, 400) + "...";
    }

    return improved;
  }
}

// Export instances
export const safetyGuard = new PromptSafetyGuard();
export const tokenOptimizer = new TokenOptimizer();
export const multiTutorCoordinator = new MultiTutorCoordinator();
