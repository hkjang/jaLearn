/**
 * DB 기반 프롬프트 조합 엔진
 * 
 * 다층 프롬프트 계층 구조를 DB에서 로드하여 조합
 * CORE → DOMAIN → GRADE → SUBJECT → UNIT → PROBLEM → USER_STATE
 */

import { prisma } from './prisma';
import { decryptPrompt, maskPromptForLog } from './prompt-encryption';

// ============================================
// 타입 정의
// ============================================

export type PromptLevel = 
  | 'CORE'
  | 'DOMAIN'
  | 'GRADE'
  | 'SUBJECT'
  | 'UNIT'
  | 'PROBLEM'
  | 'USER_STATE';

export interface UserState {
  emotionalState?: 'CONFIDENT' | 'NEUTRAL' | 'FRUSTRATED' | 'ANXIOUS';
  understandingLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
  consecutiveErrors?: number;
  consecutiveCorrect?: number;
  learningStyle?: 'VISUAL' | 'AUDITORY' | 'READING' | 'KINESTHETIC';
  pace?: 'SLOW' | 'MEDIUM' | 'FAST';
  sessionDuration?: number; // minutes
}

export interface ComposeParams {
  problemId?: string;
  gradeLevel: string;
  subjectId: string;
  unitId?: string;
  userId: string;
  userState?: UserState;
}

export interface ComposedPrompt {
  systemPrompt: string;
  problemContext?: string;
  userStateModifiers?: string;
  versionId?: string;
  debugInfo?: {
    layers: string[];
    totalLength: number;
  };
}

// ============================================
// 프롬프트 계층 순서
// ============================================

const LEVEL_ORDER: PromptLevel[] = [
  'CORE',
  'DOMAIN', 
  'GRADE',
  'SUBJECT',
  'UNIT',
  'PROBLEM',
  'USER_STATE',
];

// ============================================
// DB 프롬프트 조합 엔진
// ============================================

export class DBPromptComposer {
  /**
   * 다층 프롬프트 조합
   */
  async compose(params: ComposeParams): Promise<ComposedPrompt> {
    const { problemId, gradeLevel, subjectId, unitId, userId, userState } = params;
    
    // 1. 계층별 프롬프트 로드
    const hierarchy = await this.loadPromptHierarchy({
      gradeLevel,
      subjectId,
      unitId,
    });
    
    // 2. 문제 전용 프롬프트 로드 (있는 경우)
    let problemContext: string | undefined;
    if (problemId) {
      problemContext = await this.loadProblemPrompt(problemId);
    }
    
    // 3. A/B 테스트 적용 여부 확인
    const abTestVersion = await this.checkABTest(userId, gradeLevel, subjectId);
    
    // 4. 프롬프트 조합
    let systemPrompt = this.combinePrompts(hierarchy);
    
    // 5. 사용자 상태 반영
    let userStateModifiers: string | undefined;
    if (userState) {
      userStateModifiers = this.generateUserStatePrompt(userState, gradeLevel);
      systemPrompt = `${systemPrompt}\n\n${userStateModifiers}`;
    }
    
    // 6. 사용 로그 기록 (마스킹된 형태)
    await this.logUsage({
      sessionId: `session_${userId}_${Date.now()}`,
      versionId: abTestVersion || hierarchy[0]?.id || 'default',
      gradeLevel,
      subjectId,
      problemId,
    });
    
    return {
      systemPrompt,
      problemContext,
      userStateModifiers,
      versionId: abTestVersion || undefined,
      debugInfo: {
        layers: hierarchy.map(h => h.level),
        totalLength: systemPrompt.length,
      },
    };
  }
  
  /**
   * 계층별 프롬프트 로드
   */
  private async loadPromptHierarchy(params: {
    gradeLevel: string;
    subjectId: string;
    unitId?: string;
  }): Promise<Array<{ id: string; level: string; content: string }>> {
    const { gradeLevel, subjectId, unitId } = params;
    
    const prompts = await prisma.promptAsset.findMany({
      where: {
        isActive: true,
        OR: [
          { level: 'CORE' },
          { level: 'DOMAIN' },
          { level: 'GRADE', gradeLevel },
          { level: 'SUBJECT', subjectId },
          ...(unitId ? [{ level: 'UNIT', unitId }] : []),
        ],
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
      select: {
        id: true,
        level: true,
        content: true,
        contentHash: true,
      },
    });
    
    // 레벨 순서대로 정렬
    const sorted = prompts.sort((a, b) => {
      return LEVEL_ORDER.indexOf(a.level as PromptLevel) - 
             LEVEL_ORDER.indexOf(b.level as PromptLevel);
    });
    
    // 복호화하여 반환
    return sorted.map(p => ({
      id: p.id,
      level: p.level,
      content: decryptPrompt(p.content),
    }));
  }
  
  /**
   * 문제 전용 프롬프트 로드
   */
  private async loadProblemPrompt(problemId: string): Promise<string | undefined> {
    const problemPrompt = await prisma.problemPrompt.findUnique({
      where: { problemId },
      include: {
        problem: {
          select: {
            content: true,
            type: true,
            options: true,
            difficulty: true,
            explanation: true,
          },
        },
        asset: {
          select: {
            content: true,
          },
        },
      },
    });
    
    if (!problemPrompt) return undefined;
    
    // 문제 컨텍스트 구성
    const parts: string[] = [];
    
    // 기본 프롬프트
    if (problemPrompt.asset?.content) {
      parts.push(decryptPrompt(problemPrompt.asset.content));
    }
    
    // 출제 의도
    if (problemPrompt.outcomeIntent) {
      parts.push(`[출제 의도]\n${decryptPrompt(problemPrompt.outcomeIntent)}`);
    }
    
    // 오답 유도 포인트
    if (problemPrompt.trapPoints) {
      parts.push(`[학생이 자주 실수하는 포인트]\n${decryptPrompt(problemPrompt.trapPoints)}`);
    }
    
    // 힌트 시퀀스
    if (problemPrompt.hintSequence) {
      try {
        const hints = JSON.parse(decryptPrompt(problemPrompt.hintSequence));
        parts.push(`[단계별 힌트 제공 가이드]\n${hints.map((h: string, i: number) => `${i + 1}. ${h}`).join('\n')}`);
      } catch { /* ignore parse errors */ }
    }
    
    return parts.join('\n\n');
  }
  
  /**
   * A/B 테스트 확인 및 variant 할당
   */
  private async checkABTest(
    userId: string,
    gradeLevel: string,
    subjectId: string
  ): Promise<string | null> {
    // 실행 중인 A/B 테스트 조회
    const activeTests = await prisma.promptABTest.findMany({
      where: {
        status: 'RUNNING',
        OR: [
          { targetGrades: { contains: gradeLevel } },
          { targetGrades: null },
        ],
      },
      include: {
        variants: true,
        assignments: {
          where: { userId },
        },
      },
    });
    
    if (activeTests.length === 0) return null;
    
    // 첫 번째 적용 가능한 테스트 선택
    const test = activeTests[0];
    
    // 이미 할당된 경우
    const existingAssignment = test.assignments[0];
    if (existingAssignment) {
      return existingAssignment.variantId;
    }
    
    // 새로 할당
    const variant = this.selectVariant(test.variants);
    if (!variant) return null;
    
    await prisma.aBTestAssignment.create({
      data: {
        testId: test.id,
        variantId: variant.id,
        userId,
      },
    });
    
    // 노출 수 증가
    await prisma.aBTestVariant.update({
      where: { id: variant.id },
      data: { impressions: { increment: 1 } },
    });
    
    return variant.versionId;
  }
  
  /**
   * 트래픽 할당에 따른 variant 선택
   */
  private selectVariant(variants: Array<{ id: string; allocation: number; versionId: string }>) {
    const total = variants.reduce((sum, v) => sum + v.allocation, 0);
    const rand = Math.random() * total;
    
    let cumulative = 0;
    for (const variant of variants) {
      cumulative += variant.allocation;
      if (rand < cumulative) {
        return variant;
      }
    }
    
    return variants[0];
  }
  
  /**
   * 계층 프롬프트 결합
   */
  private combinePrompts(hierarchy: Array<{ level: string; content: string }>): string {
    return hierarchy
      .filter(h => h.content)
      .map(h => h.content)
      .join('\n\n---\n\n');
  }
  
  /**
   * 사용자 상태 기반 프롬프트 생성
   */
  private generateUserStatePrompt(userState: UserState, gradeLevel: string): string {
    const parts: string[] = ['## 현재 학생 상태 기반 대응 지침'];
    
    // 감정 상태
    if (userState.emotionalState) {
      const emotionalGuidance: Record<string, string> = {
        CONFIDENT: '학생의 자신감을 유지하면서 도전적인 질문을 던지세요.',
        NEUTRAL: '명확하고 체계적인 설명을 제공하세요.',
        FRUSTRATED: '격려하고 더 쉬운 단계부터 다시 접근하세요. 공감하는 말투를 사용하세요.',
        ANXIOUS: '안심시키고 천천히 진행하세요. 실수해도 괜찮다고 알려주세요.',
      };
      parts.push(`- 감정 상태: ${emotionalGuidance[userState.emotionalState]}`);
    }
    
    // 연속 오답
    if (userState.consecutiveErrors && userState.consecutiveErrors >= 2) {
      parts.push(`- 연속 ${userState.consecutiveErrors}회 오답: 더 쉬운 힌트를 제공하고 개념을 다시 설명하세요.`);
    }
    
    // 연속 정답
    if (userState.consecutiveCorrect && userState.consecutiveCorrect >= 3) {
      parts.push(`- 연속 ${userState.consecutiveCorrect}회 정답: 난이도를 높이거나 심화 개념을 소개하세요.`);
    }
    
    // 이해도
    if (userState.understandingLevel) {
      const understandingGuidance: Record<string, string> = {
        HIGH: '빠르게 진행하고 응용 문제를 제시하세요.',
        MEDIUM: '핵심 개념을 재확인하면서 진행하세요.',
        LOW: '기초부터 차근차근 설명하고 많은 예시를 들어주세요.',
      };
      parts.push(`- 이해도: ${understandingGuidance[userState.understandingLevel]}`);
    }
    
    // 학습 스타일
    if (userState.learningStyle) {
      const styleGuidance: Record<string, string> = {
        VISUAL: '도표, 그림, 시각적 표현을 활용하세요.',
        AUDITORY: '설명을 자세히 풀어서 이야기하듯 전달하세요.',
        READING: '텍스트 기반 설명과 정리를 제공하세요.',
        KINESTHETIC: '직접 해볼 수 있는 예제와 실습을 제안하세요.',
      };
      parts.push(`- 학습 스타일: ${styleGuidance[userState.learningStyle]}`);
    }
    
    // 세션 시간
    if (userState.sessionDuration && userState.sessionDuration > 30) {
      parts.push(`- 긴 세션(${userState.sessionDuration}분): 휴식을 권유하거나 요약 정리를 제안하세요.`);
    }
    
    // 학년별 언어 스타일
    const gradeCategory = this.getGradeCategory(gradeLevel);
    parts.push(`\n## 언어 스타일\n${this.getLanguageStyle(gradeCategory)}`);
    
    return parts.join('\n');
  }
  
  /**
   * 학년 카테고리 추출
   */
  private getGradeCategory(gradeLevel: string): 'ELEMENTARY' | 'MIDDLE' | 'HIGH' {
    if (gradeLevel.startsWith('ELEMENTARY')) return 'ELEMENTARY';
    if (gradeLevel.startsWith('MIDDLE')) return 'MIDDLE';
    return 'HIGH';
  }
  
  /**
   * 학년별 언어 스타일
   */
  private getLanguageStyle(category: 'ELEMENTARY' | 'MIDDLE' | 'HIGH'): string {
    const styles = {
      ELEMENTARY: `- 친근하고 격려하는 말투를 사용하세요
- 쉬운 단어와 일상적인 표현을 사용하세요
- 짧고 간단한 문장으로 설명하세요
- 이모지를 적절히 활용하세요 😊
- 칭찬을 자주 해주세요`,
      
      MIDDLE: `- 존댓말을 사용하되 친근하게 대해주세요
- 개념 용어는 설명과 함께 사용하세요
- 논리적 연결을 보여주세요
- 스스로 생각할 시간을 주세요`,
      
      HIGH: `- 논리적이고 체계적인 접근을 유지하세요
- 전문 용어를 정확하게 사용하세요
- 개념의 본질과 응용을 연결하세요
- 수능/입시 관점에서 중요도를 언급하세요
- 비판적 사고를 장려하세요`,
    };
    
    return styles[category];
  }
  
  /**
   * 사용 로그 기록 (마스킹)
   */
  private async logUsage(data: {
    sessionId: string;
    versionId: string;
    gradeLevel?: string;
    subjectId?: string;
    problemId?: string;
  }): Promise<void> {
    try {
      await prisma.promptUsageLog.create({
        data: {
          sessionId: data.sessionId,
          versionId: data.versionId,
          gradeLevel: data.gradeLevel,
          subjectId: data.subjectId,
          problemId: data.problemId,
        },
      });
    } catch (error) {
      // 로그 실패는 무시 (핵심 기능 방해하지 않음)
      console.error('Failed to log prompt usage:', error);
    }
  }
}

// 싱글턴 인스턴스
export const dbPromptComposer = new DBPromptComposer();

// 편의 함수
export async function composePrompt(params: ComposeParams): Promise<ComposedPrompt> {
  return dbPromptComposer.compose(params);
}
