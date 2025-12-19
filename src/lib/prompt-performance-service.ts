/**
 * 프롬프트 성능 추적 서비스
 * 
 * 사용자 반응 수집, KPI 계산, 저성능 탐지, AI 개선안 생성
 */

import { prisma } from './prisma';

// ============================================
// 타입 정의
// ============================================

export interface UsageData {
  sessionId: string;
  versionId: string;
  gradeLevel?: string;
  subjectId?: string;
  problemId?: string;
  qualityScore?: number;
  userFeedback?: number;
  reasked?: boolean;
  responseTime?: number;
}

export interface PromptKPI {
  versionId: string;
  period: string;
  usageCount: number;
  satisfactionAvg: number;
  understandingRate: number;
  requestionRate: number;
  problemSolveRate: number;
  avgSessionDuration: number;
  qualityScore: number;
}

export interface LowPerformerAlert {
  versionId: string;
  assetName: string;
  currentScore: number;
  threshold: number;
  reason: string;
  suggestedAction: string;
}

export interface PerformanceComparison {
  versionA: string;
  versionB: string;
  winner: string;
  metrics: {
    metric: string;
    versionAValue: number;
    versionBValue: number;
    improvement: number;
  }[];
}

// ============================================
// 프롬프트 성능 서비스
// ============================================

export class PromptPerformanceService {
  // KPI 임계값
  private readonly QUALITY_THRESHOLD = 60;
  private readonly REQUESTION_THRESHOLD = 0.3; // 30% 이상이면 문제
  private readonly SATISFACTION_THRESHOLD = 3.5;
  
  /**
   * 사용자 반응 수집
   */
  async recordUsage(data: UsageData): Promise<void> {
    await prisma.promptUsageLog.create({
      data: {
        sessionId: data.sessionId,
        versionId: data.versionId,
        gradeLevel: data.gradeLevel,
        subjectId: data.subjectId,
        problemId: data.problemId,
        qualityScore: data.qualityScore,
        userFeedback: data.userFeedback,
        reasked: data.reasked ?? false,
        responseTime: data.responseTime,
      },
    });
    
    // 일별 성능 집계 업데이트
    await this.updateDailyPerformance(data.versionId);
  }
  
  /**
   * 성능 점수화 (KPI 계산)
   */
  async calculateKPI(versionId: string, days = 7): Promise<PromptKPI> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const logs = await prisma.promptUsageLog.findMany({
      where: {
        versionId,
        createdAt: { gte: startDate },
      },
    });
    
    if (logs.length === 0) {
      return this.getEmptyKPI(versionId, days);
    }
    
    // 메트릭 계산
    const usageCount = logs.length;
    
    const feedbacks = logs.filter(l => l.userFeedback !== null);
    const satisfactionAvg = feedbacks.length > 0
      ? feedbacks.reduce((sum, l) => sum + (l.userFeedback || 0), 0) / feedbacks.length
      : 0;
    
    const qualityScores = logs.filter(l => l.qualityScore !== null);
    const avgQuality = qualityScores.length > 0
      ? qualityScores.reduce((sum, l) => sum + (l.qualityScore || 0), 0) / qualityScores.length
      : 0;
    
    const reaskedCount = logs.filter(l => l.reasked).length;
    const requestionRate = usageCount > 0 ? reaskedCount / usageCount : 0;
    
    // 문제 해결률 (재질문 안한 비율로 근사)
    const problemSolveRate = 1 - requestionRate;
    
    // 이해도 (품질 점수 + 만족도 기반)
    const understandingRate = ((avgQuality / 100) + (satisfactionAvg / 5)) / 2;
    
    // 평균 응답 시간
    const responseTimes = logs.filter(l => l.responseTime !== null);
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, l) => sum + (l.responseTime || 0), 0) / responseTimes.length
      : 0;
    
    // 종합 품질 점수 계산
    const qualityScore = this.calculateQualityScore({
      satisfactionAvg,
      understandingRate,
      requestionRate,
      problemSolveRate,
    });
    
    return {
      versionId,
      period: `${days}days`,
      usageCount,
      satisfactionAvg,
      understandingRate,
      requestionRate,
      problemSolveRate,
      avgSessionDuration: avgResponseTime / 1000 / 60, // ms to minutes
      qualityScore,
    };
  }
  
  /**
   * 저성능 프롬프트 탐지
   */
  async detectLowPerformers(threshold = this.QUALITY_THRESHOLD): Promise<LowPerformerAlert[]> {
    // 최근 활성 버전들 조회
    const recentPerformances = await prisma.promptPerformance.findMany({
      where: {
        date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      include: {
        version: {
          include: {
            asset: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });
    
    const alerts: LowPerformerAlert[] = [];
    const checked = new Set<string>();
    
    for (const perf of recentPerformances) {
      if (checked.has(perf.versionId)) continue;
      checked.add(perf.versionId);
      
      const kpi = await this.calculateKPI(perf.versionId);
      
      // 품질 점수 체크
      if (kpi.qualityScore < threshold) {
        alerts.push({
          versionId: perf.versionId,
          assetName: perf.version?.asset?.name || 'Unknown',
          currentScore: kpi.qualityScore,
          threshold,
          reason: `품질 점수 ${kpi.qualityScore.toFixed(1)}점으로 기준(${threshold}점) 미달`,
          suggestedAction: 'AI 개선안 생성 또는 이전 버전 롤백 검토',
        });
        continue;
      }
      
      // 재질문률 체크
      if (kpi.requestionRate > this.REQUESTION_THRESHOLD) {
        alerts.push({
          versionId: perf.versionId,
          assetName: perf.version?.asset?.name || 'Unknown',
          currentScore: kpi.qualityScore,
          threshold,
          reason: `재질문률 ${(kpi.requestionRate * 100).toFixed(1)}%로 높음`,
          suggestedAction: '설명 방식 개선 필요',
        });
        continue;
      }
      
      // 만족도 체크
      if (kpi.satisfactionAvg < this.SATISFACTION_THRESHOLD && kpi.usageCount >= 10) {
        alerts.push({
          versionId: perf.versionId,
          assetName: perf.version?.asset?.name || 'Unknown',
          currentScore: kpi.qualityScore,
          threshold,
          reason: `만족도 ${kpi.satisfactionAvg.toFixed(1)}점으로 낮음`,
          suggestedAction: '말투나 설명 스타일 조정 검토',
        });
      }
    }
    
    return alerts;
  }
  
  /**
   * AI 보조 개선안 생성
   */
  async generateImprovementSuggestion(versionId: string): Promise<string> {
    const kpi = await this.calculateKPI(versionId);
    const version = await prisma.promptVersion.findUnique({
      where: { id: versionId },
      include: { asset: true },
    });
    
    if (!version) {
      throw new Error('Version not found');
    }
    
    const suggestions: string[] = [];
    
    // KPI 기반 개선 제안
    if (kpi.requestionRate > 0.2) {
      suggestions.push('- 학생이 자주 재질문하고 있습니다. 첫 번째 설명을 더 명확하고 구체적으로 작성하세요.');
      suggestions.push('- 단계별 설명을 추가하여 이해도를 높이세요.');
    }
    
    if (kpi.satisfactionAvg < 4) {
      suggestions.push('- 학생 만족도가 낮습니다. 더 친근하고 격려하는 말투를 사용해 보세요.');
      suggestions.push('- 예시를 더 많이 추가하세요.');
    }
    
    if (kpi.understandingRate < 0.6) {
      suggestions.push('- 이해도가 낮습니다. 더 쉬운 언어로 개념을 설명하세요.');
      suggestions.push('- 시각적 표현(수식, 도표)을 활용하세요.');
    }
    
    if (kpi.problemSolveRate < 0.7) {
      suggestions.push('- 문제 해결률이 낮습니다. 힌트를 더 구체적으로 제공하세요.');
      suggestions.push('- 오답 유형별 피드백을 추가하세요.');
    }
    
    if (suggestions.length === 0) {
      suggestions.push('- 현재 성능이 양호합니다. 마이너 개선을 위해 새로운 예시나 표현을 추가해 보세요.');
    }
    
    return `## "${version.asset?.name}" 프롬프트 개선 제안\n\n### 현재 성능\n- 품질 점수: ${kpi.qualityScore.toFixed(1)}점\n- 재질문률: ${(kpi.requestionRate * 100).toFixed(1)}%\n- 만족도: ${kpi.satisfactionAvg.toFixed(1)}점\n- 이해도: ${(kpi.understandingRate * 100).toFixed(1)}%\n\n### 개선 제안\n${suggestions.join('\n')}`;
  }
  
  /**
   * A/B 테스트 결과 비교
   */
  async compareVersions(versionAId: string, versionBId: string): Promise<PerformanceComparison> {
    const [kpiA, kpiB] = await Promise.all([
      this.calculateKPI(versionAId),
      this.calculateKPI(versionBId),
    ]);
    
    const metrics = [
      { metric: '품질 점수', versionAValue: kpiA.qualityScore, versionBValue: kpiB.qualityScore },
      { metric: '만족도', versionAValue: kpiA.satisfactionAvg, versionBValue: kpiB.satisfactionAvg },
      { metric: '이해도', versionAValue: kpiA.understandingRate, versionBValue: kpiB.understandingRate },
      { metric: '재질문률', versionAValue: kpiA.requestionRate, versionBValue: kpiB.requestionRate },
      { metric: '문제해결률', versionAValue: kpiA.problemSolveRate, versionBValue: kpiB.problemSolveRate },
    ].map(m => ({
      ...m,
      improvement: m.metric === '재질문률'
        ? ((m.versionAValue - m.versionBValue) / (m.versionAValue || 1)) * -100 // 재질문률은 낮을수록 좋음
        : ((m.versionBValue - m.versionAValue) / (m.versionAValue || 1)) * 100,
    }));
    
    // 승자 결정 (더 높은 품질 점수)
    const winner = kpiB.qualityScore > kpiA.qualityScore ? versionBId : versionAId;
    
    return {
      versionA: versionAId,
      versionB: versionBId,
      winner,
      metrics,
    };
  }
  
  /**
   * 일별 성능 집계 저장
   */
  async saveDailyPerformance(versionId: string, kpi: PromptKPI): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    await prisma.promptPerformance.upsert({
      where: {
        versionId_date: {
          versionId,
          date: today,
        },
      },
      create: {
        versionId,
        date: today,
        usageCount: kpi.usageCount,
        satisfactionAvg: kpi.satisfactionAvg,
        understandingRate: kpi.understandingRate,
        requestionRate: kpi.requestionRate,
        problemSolveRate: kpi.problemSolveRate,
        avgSessionDuration: kpi.avgSessionDuration,
        qualityScore: kpi.qualityScore,
      },
      update: {
        usageCount: kpi.usageCount,
        satisfactionAvg: kpi.satisfactionAvg,
        understandingRate: kpi.understandingRate,
        requestionRate: kpi.requestionRate,
        problemSolveRate: kpi.problemSolveRate,
        avgSessionDuration: kpi.avgSessionDuration,
        qualityScore: kpi.qualityScore,
      },
    });
  }
  
  // ============================================
  // Private 헬퍼 메서드
  // ============================================
  
  private getEmptyKPI(versionId: string, days: number): PromptKPI {
    return {
      versionId,
      period: `${days}days`,
      usageCount: 0,
      satisfactionAvg: 0,
      understandingRate: 0,
      requestionRate: 0,
      problemSolveRate: 0,
      avgSessionDuration: 0,
      qualityScore: 0,
    };
  }
  
  private calculateQualityScore(metrics: {
    satisfactionAvg: number;
    understandingRate: number;
    requestionRate: number;
    problemSolveRate: number;
  }): number {
    // 가중치 적용 종합 점수 (0-100)
    const weights = {
      satisfaction: 0.25,
      understanding: 0.30,
      requestion: 0.20,
      problemSolve: 0.25,
    };
    
    const score = 
      (metrics.satisfactionAvg / 5 * 100) * weights.satisfaction +
      (metrics.understandingRate * 100) * weights.understanding +
      ((1 - metrics.requestionRate) * 100) * weights.requestion +
      (metrics.problemSolveRate * 100) * weights.problemSolve;
    
    return Math.min(100, Math.max(0, score));
  }
  
  private async updateDailyPerformance(versionId: string): Promise<void> {
    try {
      const kpi = await this.calculateKPI(versionId, 1);
      if (kpi.usageCount > 0) {
        await this.saveDailyPerformance(versionId, kpi);
      }
    } catch (error) {
      console.error('Failed to update daily performance:', error);
    }
  }
}

// 싱글턴 인스턴스
export const promptPerformanceService = new PromptPerformanceService();
