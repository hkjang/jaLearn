/**
 * 프롬프트 버전 관리 및 A/B 테스트
 * 
 * 프롬프트 이력 관리, 실험 운영, 자동 롤백
 */

// ============================================
// 타입 정의
// ============================================

export interface PromptVersion {
  id: string;
  version: string;
  name: string;
  description: string;
  systemPrompt: string;
  subjectPrompts: Record<string, string>;
  createdAt: Date;
  createdBy: string;
  isActive: boolean;
  isDefault: boolean;
  metrics?: PromptMetrics;
}

export interface PromptMetrics {
  usageCount: number;
  avgSatisfaction: number;  // 1-5
  avgUnderstandingGain: number;  // 0-1
  avgSessionDuration: number;  // 분
  avgQualityScore: number;  // 0-1
  errorRate: number;  // 0-1
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  status: "DRAFT" | "RUNNING" | "COMPLETED" | "STOPPED";
  variants: ABTestVariant[];
  targetAudience: TargetAudience;
  startDate?: Date;
  endDate?: Date;
  winnerVariantId?: string;
  createdAt: Date;
}

export interface ABTestVariant {
  id: string;
  name: string;
  promptVersionId: string;
  allocation: number;  // 0-1 (배분 비율)
  metrics?: PromptMetrics;
}

export interface TargetAudience {
  gradelevels?: string[];
  subjects?: string[];
  sampleSize?: number;
  percentageOfUsers?: number;
}

export interface PromptLog {
  id: string;
  promptVersionId: string;
  userId: string;
  sessionId: string;
  promptUsed: string;
  response: string;
  qualityScore: number;
  studentResponse?: string;
  timestamp: Date;
}

// ============================================
// 프롬프트 버전 관리자
// ============================================

export class PromptVersionManager {
  private versions: Map<string, PromptVersion> = new Map();
  private activeVersion: PromptVersion | null = null;
  private logs: PromptLog[] = [];
  private maxLogSize: number = 10000;

  constructor() {
    // 기본 버전 초기화
    this.initializeDefaultVersion();
  }

  /**
   * 기본 버전 초기화
   */
  private initializeDefaultVersion(): void {
    const defaultVersion: PromptVersion = {
      id: "v1.0.0",
      version: "1.0.0",
      name: "기본 소크라테스 튜터",
      description: "소크라테스식 질문 기반 기본 튜터 프롬프트",
      systemPrompt: `당신은 학생의 전담 1대1 AI 튜터입니다.

## 핵심 원칙
1. 답을 직접 제시하지 마세요
2. 소크라테스식 질문을 사용하세요
3. 학생의 이해 수준에 맞춰 설명하세요
4. 긍정적이고 인내심 있게 대하세요`,
      subjectPrompts: {
        MATH: "수학 튜터로서 단계별 수식 추론을 유도하세요.",
        KOREAN: "국어 튜터로서 지문 근거 추적을 유도하세요.",
        ENGLISH: "영어 튜터로서 문장 구조 분석을 유도하세요.",
        SCIENCE: "과학 튜터로서 개념의 원인-결과를 탐구하세요.",
      },
      createdAt: new Date(),
      createdBy: "system",
      isActive: true,
      isDefault: true,
      metrics: {
        usageCount: 0,
        avgSatisfaction: 0,
        avgUnderstandingGain: 0,
        avgSessionDuration: 0,
        avgQualityScore: 0,
        errorRate: 0,
      },
    };

    this.versions.set(defaultVersion.id, defaultVersion);
    this.activeVersion = defaultVersion;
  }

  /**
   * 새 버전 생성
   */
  createVersion(version: Omit<PromptVersion, "id" | "createdAt" | "metrics">): PromptVersion {
    const newVersion: PromptVersion = {
      ...version,
      id: `v${version.version}`,
      createdAt: new Date(),
      metrics: {
        usageCount: 0,
        avgSatisfaction: 0,
        avgUnderstandingGain: 0,
        avgSessionDuration: 0,
        avgQualityScore: 0,
        errorRate: 0,
      },
    };

    this.versions.set(newVersion.id, newVersion);
    return newVersion;
  }

  /**
   * 버전 활성화
   */
  activateVersion(versionId: string): boolean {
    const version = this.versions.get(versionId);
    if (!version) return false;

    // 이전 버전 비활성화
    if (this.activeVersion) {
      this.activeVersion.isActive = false;
    }

    version.isActive = true;
    this.activeVersion = version;
    return true;
  }

  /**
   * 롤백
   */
  rollbackToVersion(versionId: string): boolean {
    return this.activateVersion(versionId);
  }

  /**
   * 현재 활성 버전 조회
   */
  getActiveVersion(): PromptVersion | null {
    return this.activeVersion;
  }

  /**
   * 모든 버전 조회
   */
  getAllVersions(): PromptVersion[] {
    return Array.from(this.versions.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  /**
   * 로그 기록
   */
  logPromptUsage(log: Omit<PromptLog, "id" | "timestamp">): void {
    const newLog: PromptLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date(),
    };

    this.logs.push(newLog);

    // 로그 크기 제한
    if (this.logs.length > this.maxLogSize) {
      this.logs = this.logs.slice(-this.maxLogSize / 2);
    }

    // 메트릭 업데이트
    this.updateVersionMetrics(log.promptVersionId, log.qualityScore);
  }

  /**
   * 버전 메트릭 업데이트
   */
  private updateVersionMetrics(versionId: string, qualityScore: number): void {
    const version = this.versions.get(versionId);
    if (!version || !version.metrics) return;

    const metrics = version.metrics;
    const newCount = metrics.usageCount + 1;

    // 이동 평균 갱신
    metrics.avgQualityScore = (metrics.avgQualityScore * metrics.usageCount + qualityScore) / newCount;
    metrics.usageCount = newCount;
  }

  /**
   * 품질 저하 시 자동 롤백 체크
   */
  checkAutoRollback(): { shouldRollback: boolean; reason?: string } {
    if (!this.activeVersion?.metrics) {
      return { shouldRollback: false };
    }

    const metrics = this.activeVersion.metrics;

    // 품질 점수가 일정 수준 이하면 롤백 권장
    if (metrics.avgQualityScore < 0.4 && metrics.usageCount > 100) {
      return {
        shouldRollback: true,
        reason: `품질 점수 ${(metrics.avgQualityScore * 100).toFixed(1)}%로 저하됨`,
      };
    }

    // 에러율이 높으면 롤백 권장
    if (metrics.errorRate > 0.1 && metrics.usageCount > 50) {
      return {
        shouldRollback: true,
        reason: `에러율 ${(metrics.errorRate * 100).toFixed(1)}%로 상승`,
      };
    }

    return { shouldRollback: false };
  }
}

// ============================================
// A/B 테스트 관리자
// ============================================

export class ABTestManager {
  private tests: Map<string, ABTest> = new Map();
  private assignments: Map<string, string> = new Map();  // userId -> variantId

  /**
   * 테스트 생성
   */
  createTest(test: Omit<ABTest, "id" | "createdAt" | "status">): ABTest {
    const newTest: ABTest = {
      ...test,
      id: `ab-${Date.now()}`,
      status: "DRAFT",
      createdAt: new Date(),
    };

    this.tests.set(newTest.id, newTest);
    return newTest;
  }

  /**
   * 테스트 시작
   */
  startTest(testId: string): boolean {
    const test = this.tests.get(testId);
    if (!test || test.status !== "DRAFT") return false;

    test.status = "RUNNING";
    test.startDate = new Date();
    return true;
  }

  /**
   * 사용자 변형 할당
   */
  assignVariant(testId: string, userId: string): ABTestVariant | null {
    const test = this.tests.get(testId);
    if (!test || test.status !== "RUNNING") return null;

    // 이미 할당된 경우
    const existingKey = `${testId}-${userId}`;
    const existingVariantId = this.assignments.get(existingKey);
    if (existingVariantId) {
      return test.variants.find((v) => v.id === existingVariantId) || null;
    }

    // 새 할당 (가중치 기반)
    const random = Math.random();
    let cumulative = 0;

    for (const variant of test.variants) {
      cumulative += variant.allocation;
      if (random <= cumulative) {
        this.assignments.set(existingKey, variant.id);
        return variant;
      }
    }

    // 기본값 (첫 번째 변형)
    const defaultVariant = test.variants[0];
    this.assignments.set(existingKey, defaultVariant.id);
    return defaultVariant;
  }

  /**
   * 테스트 결과 기록
   */
  recordResult(testId: string, variantId: string, metrics: Partial<PromptMetrics>): void {
    const test = this.tests.get(testId);
    if (!test) return;

    const variant = test.variants.find((v) => v.id === variantId);
    if (!variant) return;

    if (!variant.metrics) {
      variant.metrics = {
        usageCount: 0,
        avgSatisfaction: 0,
        avgUnderstandingGain: 0,
        avgSessionDuration: 0,
        avgQualityScore: 0,
        errorRate: 0,
      };
    }

    // 메트릭 업데이트
    const m = variant.metrics;
    const newCount = m.usageCount + 1;

    if (metrics.avgQualityScore !== undefined) {
      m.avgQualityScore = (m.avgQualityScore * m.usageCount + metrics.avgQualityScore) / newCount;
    }
    if (metrics.avgSatisfaction !== undefined) {
      m.avgSatisfaction = (m.avgSatisfaction * m.usageCount + metrics.avgSatisfaction) / newCount;
    }

    m.usageCount = newCount;
  }

  /**
   * 테스트 종료 및 승자 결정
   */
  finishTest(testId: string): ABTestVariant | null {
    const test = this.tests.get(testId);
    if (!test || test.status !== "RUNNING") return null;

    test.status = "COMPLETED";
    test.endDate = new Date();

    // 승자 결정 (품질 점수 기준)
    let winner: ABTestVariant | null = null;
    let bestScore = -1;

    for (const variant of test.variants) {
      const score = variant.metrics?.avgQualityScore || 0;
      if (score > bestScore) {
        bestScore = score;
        winner = variant;
      }
    }

    if (winner) {
      test.winnerVariantId = winner.id;
    }

    return winner;
  }

  /**
   * 테스트 통계 조회
   */
  getTestStatistics(testId: string): { variants: Array<{ name: string; metrics: PromptMetrics | undefined }> } | null {
    const test = this.tests.get(testId);
    if (!test) return null;

    return {
      variants: test.variants.map((v) => ({
        name: v.name,
        metrics: v.metrics,
      })),
    };
  }
}

// Export instances
export const promptVersionManager = new PromptVersionManager();
export const abTestManager = new ABTestManager();
