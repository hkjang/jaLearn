/**
 * 프롬프트 A/B 테스트 서비스
 * 
 * 테스트 생성/관리, 사용자 할당, 결과 분석, 승자 결정
 */

import { prisma } from './prisma';
import { promptPerformanceService } from './prompt-performance-service';

// ============================================
// 타입 정의
// ============================================

export interface CreateABTestInput {
  name: string;
  description?: string;
  targetGrades?: string[];
  targetSubjects?: string[];
  sampleSize?: number;
  percentage?: number;
  variants: {
    name: string;
    versionId: string;
    allocation: number;
  }[];
}

export interface TestResults {
  testId: string;
  name: string;
  status: string;
  duration: number; // days
  variants: {
    id: string;
    name: string;
    impressions: number;
    avgScore: number;
    conversionRate: number;
    isWinner: boolean;
  }[];
  recommendation: string;
}

// ============================================
// A/B 테스트 서비스
// ============================================

export class PromptABTestService {
  /**
   * A/B 테스트 생성
   */
  async createTest(data: CreateABTestInput): Promise<{ id: string }> {
    // 할당 비율 검증
    const totalAllocation = data.variants.reduce((sum, v) => sum + v.allocation, 0);
    if (Math.abs(totalAllocation - 100) > 0.01) {
      throw new Error('Variant allocations must sum to 100%');
    }
    
    const test = await prisma.promptABTest.create({
      data: {
        name: data.name,
        description: data.description,
        targetGrades: data.targetGrades ? JSON.stringify(data.targetGrades) : null,
        targetSubjects: data.targetSubjects ? JSON.stringify(data.targetSubjects) : null,
        sampleSize: data.sampleSize,
        percentage: data.percentage ?? 100,
        status: 'DRAFT',
        variants: {
          create: data.variants.map(v => ({
            name: v.name,
            versionId: v.versionId,
            allocation: v.allocation,
          })),
        },
      },
    });
    
    return { id: test.id };
  }
  
  /**
   * 테스트 시작
   */
  async startTest(testId: string): Promise<void> {
    const test = await prisma.promptABTest.findUnique({
      where: { id: testId },
      include: { variants: true },
    });
    
    if (!test) {
      throw new Error('Test not found');
    }
    
    if (test.status !== 'DRAFT') {
      throw new Error('Can only start tests in DRAFT status');
    }
    
    if (test.variants.length < 2) {
      throw new Error('Test must have at least 2 variants');
    }
    
    await prisma.promptABTest.update({
      where: { id: testId },
      data: {
        status: 'RUNNING',
        startDate: new Date(),
      },
    });
  }
  
  /**
   * 테스트 중지
   */
  async stopTest(testId: string): Promise<void> {
    await prisma.promptABTest.update({
      where: { id: testId },
      data: {
        status: 'STOPPED',
        endDate: new Date(),
      },
    });
  }
  
  /**
   * 사용자 variant 할당
   */
  async assignUserToVariant(testId: string, userId: string): Promise<{ variantId: string; versionId: string } | null> {
    const test = await prisma.promptABTest.findUnique({
      where: { id: testId },
      include: { 
        variants: true,
        assignments: { where: { userId } },
      },
    });
    
    if (!test || test.status !== 'RUNNING') {
      return null;
    }
    
    // 이미 할당된 경우
    if (test.assignments.length > 0) {
      const existing = test.assignments[0];
      const variant = test.variants.find(v => v.id === existing.variantId);
      return variant ? { variantId: variant.id, versionId: variant.versionId } : null;
    }
    
    // 새로 할당
    const variant = this.selectVariant(test.variants);
    if (!variant) return null;
    
    await prisma.$transaction([
      prisma.aBTestAssignment.create({
        data: {
          testId,
          variantId: variant.id,
          userId,
        },
      }),
      prisma.aBTestVariant.update({
        where: { id: variant.id },
        data: { impressions: { increment: 1 } },
      }),
    ]);
    
    return { variantId: variant.id, versionId: variant.versionId };
  }
  
  /**
   * 결과 기록
   */
  async recordResult(
    testId: string,
    userId: string,
    score: number,
    converted: boolean
  ): Promise<void> {
    const assignment = await prisma.aBTestAssignment.findUnique({
      where: {
        testId_userId: { testId, userId },
      },
    });
    
    if (!assignment) return;
    
    // Update assignment
    await prisma.aBTestAssignment.update({
      where: { id: assignment.id },
      data: { score, converted },
    });
    
    // Update variant conversions if converted
    if (converted) {
      await prisma.aBTestVariant.update({
        where: { id: assignment.variantId },
        data: { conversions: { increment: 1 } },
      });
    }
  }
  
  /**
   * 결과 분석
   */
  async analyzeResults(testId: string): Promise<TestResults> {
    const test = await prisma.promptABTest.findUnique({
      where: { id: testId },
      include: {
        variants: {
          include: {
            assignments: true,
          },
        },
      },
    });
    
    if (!test) {
      throw new Error('Test not found');
    }
    
    // 기간 계산
    const startDate = test.startDate || test.createdAt;
    const endDate = test.endDate || new Date();
    const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Variant별 성과 계산
    const variantResults = test.variants.map(variant => {
      const assignments = variant.assignments;
      const scores = assignments.filter(a => a.score !== null);
      const avgScore = scores.length > 0
        ? scores.reduce((sum, a) => sum + (a.score || 0), 0) / scores.length
        : 0;
      const conversionRate = variant.impressions > 0
        ? variant.conversions / variant.impressions
        : 0;
      
      return {
        id: variant.id,
        name: variant.name,
        impressions: variant.impressions,
        avgScore,
        conversionRate,
        isWinner: false,
      };
    });
    
    // 승자 결정 (avgScore 기준)
    const sorted = [...variantResults].sort((a, b) => b.avgScore - a.avgScore);
    if (sorted.length > 0 && sorted[0].impressions >= 10) {
      sorted[0].isWinner = true;
    }
    
    // 추천 생성
    const recommendation = this.generateRecommendation(variantResults, duration);
    
    return {
      testId: test.id,
      name: test.name,
      status: test.status,
      duration,
      variants: variantResults,
      recommendation,
    };
  }
  
  /**
   * 승자 선언 및 테스트 종료
   */
  async declareWinner(testId: string, winnerId?: string): Promise<void> {
    const results = await this.analyzeResults(testId);
    
    // winnerId가 지정되지 않으면 자동 선택
    const winner = winnerId 
      ? results.variants.find(v => v.id === winnerId)
      : results.variants.find(v => v.isWinner);
    
    if (!winner) {
      throw new Error('No winner could be determined');
    }
    
    await prisma.promptABTest.update({
      where: { id: testId },
      data: {
        status: 'COMPLETED',
        endDate: new Date(),
        winnerId: winner.id,
        winnerReason: `평균 점수 ${winner.avgScore.toFixed(2)}, 전환율 ${(winner.conversionRate * 100).toFixed(1)}%`,
      },
    });
    
    // 진화 히스토리 기록
    const variant = await prisma.aBTestVariant.findUnique({
      where: { id: winner.id },
      include: { version: { include: { asset: true } } },
    });
    
    if (variant?.version?.asset) {
      await prisma.promptEvolution.create({
        data: {
          assetId: variant.version.asset.id,
          triggerType: 'AB_TEST_WINNER',
          triggerReason: `A/B 테스트 "${results.name}" 승자`,
          afterVersionId: variant.versionId,
          scoreAfter: winner.avgScore,
          status: 'APPROVED',
          approvedAt: new Date(),
        },
      });
    }
  }
  
  /**
   * 통계적 유의성 검정 (간단한 버전)
   */
  async checkStatisticalSignificance(testId: string): Promise<{
    isSignificant: boolean;
    confidence: number;
    message: string;
  }> {
    const results = await this.analyzeResults(testId);
    
    if (results.variants.length < 2) {
      return { isSignificant: false, confidence: 0, message: '최소 2개 variant 필요' };
    }
    
    const totalImpressions = results.variants.reduce((sum, v) => sum + v.impressions, 0);
    
    // 최소 샘플 크기 체크
    if (totalImpressions < 100) {
      return { 
        isSignificant: false, 
        confidence: totalImpressions / 100 * 50,
        message: '더 많은 데이터 필요 (최소 100회)',
      };
    }
    
    // 점수 차이 계산
    const scores = results.variants.map(v => v.avgScore).sort((a, b) => b - a);
    const diff = scores[0] - scores[1];
    
    // 간단한 유의성 판단 (실제로는 t-test 등 사용)
    const confidence = Math.min(95, 50 + diff * 10 + Math.log10(totalImpressions) * 5);
    const isSignificant = confidence >= 95;
    
    return {
      isSignificant,
      confidence,
      message: isSignificant 
        ? `통계적으로 유의함 (신뢰도 ${confidence.toFixed(1)}%)`
        : `아직 유의하지 않음 (현재 신뢰도 ${confidence.toFixed(1)}%)`,
    };
  }
  
  // ============================================
  // Private 헬퍼 메서드
  // ============================================
  
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
  
  private generateRecommendation(
    variants: Array<{ name: string; avgScore: number; impressions: number; isWinner: boolean }>,
    duration: number
  ): string {
    const totalImpressions = variants.reduce((sum, v) => sum + v.impressions, 0);
    
    if (totalImpressions < 50) {
      return '데이터가 충분하지 않습니다. 최소 50회 이상의 노출이 필요합니다.';
    }
    
    if (duration < 3) {
      return '테스트 기간이 너무 짧습니다. 최소 3일 이상 진행을 권장합니다.';
    }
    
    const winner = variants.find(v => v.isWinner);
    if (!winner) {
      return '현재 명확한 승자가 없습니다. 테스트를 계속 진행하세요.';
    }
    
    const secondBest = variants
      .filter(v => !v.isWinner)
      .sort((a, b) => b.avgScore - a.avgScore)[0];
    
    if (secondBest && winner.avgScore - secondBest.avgScore < 5) {
      return `"${winner.name}"이 근소한 우위입니다. 더 많은 데이터를 수집하는 것을 권장합니다.`;
    }
    
    return `"${winner.name}"이 명확한 승자입니다. 테스트를 종료하고 승자를 배포하세요.`;
  }
}

// 싱글턴 인스턴스
export const promptABTestService = new PromptABTestService();
