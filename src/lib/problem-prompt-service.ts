/**
 * 문제별 전용 프롬프트 서비스
 * 
 * 문제 단위로 특화된 프롬프트 자산 관리
 * 출제 의도, 오답 유도 포인트, 채점 기준 등
 */

import { prisma } from './prisma';
import { 
  encryptPrompt, 
  decryptPrompt, 
  preparePromptForStorage 
} from './prompt-encryption';

// ============================================
// 타입 정의
// ============================================

export interface CreateProblemPromptInput {
  problemId: string;
  assetId: string;
  outcomeIntent?: string;  // 출제 의도
  trapPoints?: string;     // 오답 유도 포인트
  scoringRules?: string;   // 채점 기준
  optionInfo?: string;     // 보기별 설명
  hintSequence?: string[]; // 힌트 시퀀스
}

export interface UpdateProblemPromptInput {
  outcomeIntent?: string;
  trapPoints?: string;
  scoringRules?: string;
  optionInfo?: string;
  hintSequence?: string[];
  isActive?: boolean;
}

export interface ProblemPromptData {
  id: string;
  problemId: string;
  assetId: string;
  outcomeIntent?: string;
  trapPoints?: string;
  scoringRules?: string;
  optionInfo?: string;
  hintSequence?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// 문제 프롬프트 서비스
// ============================================

export class ProblemPromptService {
  /**
   * 문제 프롬프트 조회 (복호화)
   */
  async getProblemPrompt(problemId: string): Promise<ProblemPromptData | null> {
    const prompt = await prisma.problemPrompt.findUnique({
      where: { problemId },
    });
    
    if (!prompt) return null;
    
    return this.decryptPromptData(prompt);
  }
  
  /**
   * 문제 프롬프트 생성 (암호화)
   */
  async createProblemPrompt(data: CreateProblemPromptInput): Promise<ProblemPromptData> {
    const encrypted = this.encryptInputData(data);
    
    const created = await prisma.problemPrompt.create({
      data: {
        problemId: data.problemId,
        assetId: data.assetId,
        outcomeIntent: encrypted.outcomeIntent,
        trapPoints: encrypted.trapPoints,
        scoringRules: encrypted.scoringRules,
        optionInfo: encrypted.optionInfo,
        hintSequence: encrypted.hintSequence,
      },
    });
    
    return this.decryptPromptData(created);
  }
  
  /**
   * 문제 프롬프트 수정 (암호화)
   */
  async updateProblemPrompt(
    id: string, 
    data: UpdateProblemPromptInput
  ): Promise<ProblemPromptData> {
    const encrypted: Record<string, string | boolean | undefined> = {};
    
    if (data.outcomeIntent !== undefined) {
      encrypted.outcomeIntent = encryptPrompt(data.outcomeIntent);
    }
    if (data.trapPoints !== undefined) {
      encrypted.trapPoints = encryptPrompt(data.trapPoints);
    }
    if (data.scoringRules !== undefined) {
      encrypted.scoringRules = encryptPrompt(data.scoringRules);
    }
    if (data.optionInfo !== undefined) {
      encrypted.optionInfo = encryptPrompt(data.optionInfo);
    }
    if (data.hintSequence !== undefined) {
      encrypted.hintSequence = encryptPrompt(JSON.stringify(data.hintSequence));
    }
    if (data.isActive !== undefined) {
      encrypted.isActive = data.isActive;
    }
    
    const updated = await prisma.problemPrompt.update({
      where: { id },
      data: encrypted,
    });
    
    return this.decryptPromptData(updated);
  }
  
  /**
   * 문제 프롬프트 삭제
   */
  async deleteProblemPrompt(id: string): Promise<void> {
    await prisma.problemPrompt.delete({
      where: { id },
    });
  }
  
  /**
   * 문제에 대한 프롬프트가 있는지 확인
   */
  async hasProblemPrompt(problemId: string): Promise<boolean> {
    const count = await prisma.problemPrompt.count({
      where: { problemId, isActive: true },
    });
    return count > 0;
  }
  
  /**
   * 여러 문제의 프롬프트 일괄 조회
   */
  async getProblemPrompts(problemIds: string[]): Promise<Map<string, ProblemPromptData>> {
    const prompts = await prisma.problemPrompt.findMany({
      where: { 
        problemId: { in: problemIds },
        isActive: true,
      },
    });
    
    const result = new Map<string, ProblemPromptData>();
    for (const prompt of prompts) {
      result.set(prompt.problemId, this.decryptPromptData(prompt));
    }
    
    return result;
  }
  
  /**
   * 프롬프트 없는 문제 목록 조회
   */
  async getProblemsWithoutPrompt(limit = 100): Promise<string[]> {
    const problems = await prisma.problem.findMany({
      where: {
        problemPrompt: null,
        status: 'APPROVED',
      },
      select: { id: true },
      take: limit,
    });
    
    return problems.map(p => p.id);
  }
  
  /**
   * AI 기반 프롬프트 초안 생성
   */
  async generatePromptDraft(problemId: string): Promise<Partial<CreateProblemPromptInput>> {
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      include: {
        subject: true,
        unit: true,
      },
    });
    
    if (!problem) {
      throw new Error('Problem not found');
    }
    
    // 기본 템플릿 생성 (실제로는 AI 호출)
    const outcomeIntent = this.generateOutcomeIntent(problem);
    const trapPoints = this.generateTrapPoints(problem);
    const hintSequence = this.generateHints(problem);
    
    return {
      problemId,
      outcomeIntent,
      trapPoints,
      hintSequence,
    };
  }
  
  // ============================================
  // Private 헬퍼 메서드
  // ============================================
  
  private encryptInputData(data: CreateProblemPromptInput): Record<string, string | undefined> {
    return {
      outcomeIntent: data.outcomeIntent ? encryptPrompt(data.outcomeIntent) : undefined,
      trapPoints: data.trapPoints ? encryptPrompt(data.trapPoints) : undefined,
      scoringRules: data.scoringRules ? encryptPrompt(data.scoringRules) : undefined,
      optionInfo: data.optionInfo ? encryptPrompt(data.optionInfo) : undefined,
      hintSequence: data.hintSequence ? encryptPrompt(JSON.stringify(data.hintSequence)) : undefined,
    };
  }
  
  private decryptPromptData(prompt: {
    id: string;
    problemId: string;
    assetId: string;
    outcomeIntent: string | null;
    trapPoints: string | null;
    scoringRules: string | null;
    optionInfo: string | null;
    hintSequence: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): ProblemPromptData {
    let hintSequence: string[] | undefined;
    if (prompt.hintSequence) {
      try {
        hintSequence = JSON.parse(decryptPrompt(prompt.hintSequence));
      } catch { /* ignore */ }
    }
    
    return {
      id: prompt.id,
      problemId: prompt.problemId,
      assetId: prompt.assetId,
      outcomeIntent: prompt.outcomeIntent ? decryptPrompt(prompt.outcomeIntent) : undefined,
      trapPoints: prompt.trapPoints ? decryptPrompt(prompt.trapPoints) : undefined,
      scoringRules: prompt.scoringRules ? decryptPrompt(prompt.scoringRules) : undefined,
      optionInfo: prompt.optionInfo ? decryptPrompt(prompt.optionInfo) : undefined,
      hintSequence,
      isActive: prompt.isActive,
      createdAt: prompt.createdAt,
      updatedAt: prompt.updatedAt,
    };
  }
  
  private generateOutcomeIntent(problem: { type: string; content: string }): string {
    // 간단한 템플릿 기반 생성 (실제로는 AI 호출)
    const typeDescriptions: Record<string, string> = {
      MULTIPLE_CHOICE: '주어진 보기 중 정답을 선택하는 능력',
      SHORT_ANSWER: '핵심 개념을 정확히 표현하는 능력',
      ESSAY: '논리적으로 사고를 전개하는 능력',
      TRUE_FALSE: '개념의 정확한 이해',
    };
    
    return `이 문제는 학생의 ${typeDescriptions[problem.type] || '개념 이해력'}을 평가합니다.`;
  }
  
  private generateTrapPoints(problem: { type: string; options?: string | null }): string {
    const traps: string[] = [
      '문제를 끝까지 읽지 않고 성급하게 답을 선택할 수 있습니다.',
      '비슷해 보이는 보기에서 혼동할 수 있습니다.',
    ];
    
    if (problem.type === 'MULTIPLE_CHOICE' && problem.options) {
      traps.push('각 보기의 미묘한 차이를 놓칠 수 있습니다.');
    }
    
    return traps.join('\n');
  }
  
  private generateHints(problem: { type: string }): string[] {
    return [
      '문제에서 묻는 것이 정확히 무엇인지 다시 한번 읽어보세요.',
      '핵심 개념이나 공식을 떠올려 보세요.',
      '주어진 조건들을 하나씩 정리해 보세요.',
      '답을 구하기 전에 검산해 보세요.',
    ];
  }
}

// 싱글턴 인스턴스
export const problemPromptService = new ProblemPromptService();
