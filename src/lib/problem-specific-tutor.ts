/**
 * Problem-Specific AI Tutor
 * 문제 맥락 이해와 오답 추론을 위한 특화 튜터
 */

import { TutorPromptBuilder, StudentContext, LearningMemory } from './ai-tutor-prompts';

// 문제 정보 인터페이스
interface ProblemContext {
  id: string;
  content: string;
  type: string;
  options?: string[];
  answer: string;
  explanation?: string;
  difficulty: string;
  gradeLevel: string;
  subject: string;
  unit?: string;
  concepts?: string[];
}

// 학생 답안 정보
interface StudentAnswer {
  answer: string;
  isCorrect: boolean;
  timeSpent?: number;
  attemptNumber: number;
}

// 학년별 언어 스타일
const GRADE_LANGUAGE_STYLES = {
  ELEMENTARY: {
    tone: '친근하고 격려하는',
    vocabulary: '쉬운 단어, 일상적인 표현',
    sentence: '짧고 간단한 문장',
    examples: '일상생활, 동물, 친구 관련',
    emoji: true,
    maxExplanationLength: 200,
  },
  MIDDLE: {
    tone: '친절하고 논리적인',
    vocabulary: '기본 학술 용어 도입',
    sentence: '적절한 길이의 논리적 문장',
    examples: '학교생활, 과학, 사회 현상',
    emoji: false,
    maxExplanationLength: 400,
  },
  HIGH: {
    tone: '전문적이고 체계적인',
    vocabulary: '전문 용어, 수능 출제 키워드',
    sentence: '논리적 연결, 복합문',
    examples: '입시, 실제 문제 적용',
    emoji: false,
    maxExplanationLength: 600,
  },
};

// 오답 패턴 타입
type ErrorPatternType = 
  | 'CONCEPT_MISUNDERSTANDING'    // 개념 오해
  | 'CALCULATION_ERROR'           // 계산 실수
  | 'READING_COMPREHENSION'       // 지문 이해 부족
  | 'OPTION_CONFUSION'            // 선택지 혼동
  | 'TIME_PRESSURE'               // 시간 압박
  | 'CARELESS_MISTAKE';           // 부주의

export class ProblemSpecificTutor {
  private promptBuilder: TutorPromptBuilder;

  constructor() {
    this.promptBuilder = new TutorPromptBuilder();
  }

  /**
   * 문제 맥락 기반 시스템 프롬프트 생성
   */
  buildProblemContextPrompt(
    problem: ProblemContext,
    student: StudentContext
  ): string {
    const gradeCategory = this.getGradeCategory(student.gradeLevel);
    const style = GRADE_LANGUAGE_STYLES[gradeCategory];

    return `
## 현재 문제 정보
- 과목: ${problem.subject}
- 단원: ${problem.unit || '일반'}
- 난이도: ${this.formatDifficulty(problem.difficulty)}
- 유형: ${this.formatProblemType(problem.type)}

## 문제 내용
${problem.content}

${problem.options ? `## 선택지\n${problem.options.map((o, i) => `${i + 1}. ${o}`).join('\n')}` : ''}

## 정답
${problem.answer}

${problem.explanation ? `## 공식 해설\n${problem.explanation}` : ''}

${problem.concepts ? `## 관련 개념\n${problem.concepts.join(', ')}` : ''}

## 언어 스타일 (${gradeCategory})
- 말투: ${style.tone}
- 어휘: ${style.vocabulary}
- 문장: ${style.sentence}
- 예시: ${style.examples}
- 이모지 사용: ${style.emoji ? '예' : '아니오'}
- 최대 설명 길이: ${style.maxExplanationLength}자
`.trim();
  }

  /**
   * 오답 분석 및 추론 프롬프트 생성
   */
  buildErrorAnalysisPrompt(
    problem: ProblemContext,
    studentAnswer: StudentAnswer,
    student: StudentContext
  ): string {
    const gradeCategory = this.getGradeCategory(student.gradeLevel);
    const style = GRADE_LANGUAGE_STYLES[gradeCategory];

    // 오답 패턴 추론
    const errorPattern = this.inferErrorPattern(problem, studentAnswer);

    return `
## 학생 답안 분석
- 학생 답: ${studentAnswer.answer}
- 정답: ${problem.answer}
- 시도 횟수: ${studentAnswer.attemptNumber}
${studentAnswer.timeSpent ? `- 풀이 시간: ${studentAnswer.timeSpent}초` : ''}

## 추정 오답 원인
${this.formatErrorPattern(errorPattern)}

## 튜터링 지침
학생이 ${style.tone} 말투로 다음을 이해할 수 있도록 도와주세요:

1. **공감**: 먼저 학생의 답변에서 맞는 부분이 있다면 인정해주세요.
2. **질문**: 왜 그렇게 생각했는지 물어보세요.
3. **유도**: 정답으로 가는 사고 과정을 힌트로 유도하세요.
4. **개념 연결**: 관련된 핵심 개념을 자연스럽게 연결하세요.
5. **격려**: 다시 도전할 수 있도록 격려하세요.

## 오답 유형별 접근
${this.getErrorApproach(errorPattern, gradeCategory)}
`.trim();
  }

  /**
   * AI 칭찬 메시지 생성 (정답 시)
   */
  generatePraiseMessage(
    problem: ProblemContext,
    student: StudentContext,
    attemptNumber: number
  ): string {
    const gradeCategory = this.getGradeCategory(student.gradeLevel);
    const praises = this.getPraisesByGrade(gradeCategory)

    // 시도 횟수에 따른 칭찬 선택
    let praise: string;
    if (attemptNumber === 1) {
      praise = praises.firstTry[Math.floor(Math.random() * praises.firstTry.length)];
    } else {
      praise = praises.retry[Math.floor(Math.random() * praises.retry.length)];
    }

    return praise;
  }

  /**
   * 격려 메시지 생성 (오답 시)
   */
  generateEncouragementMessage(
    problem: ProblemContext,
    student: StudentContext,
    attemptNumber: number
  ): string {
    const gradeCategory = this.getGradeCategory(student.gradeLevel);
    const encouragements = this.getEncouragementsByGrade(gradeCategory);

    if (attemptNumber === 1) {
      return encouragements.firstFail[Math.floor(Math.random() * encouragements.firstFail.length)];
    } else if (attemptNumber === 2) {
      return encouragements.secondFail[Math.floor(Math.random() * encouragements.secondFail.length)];
    } else {
      return encouragements.manyFails[Math.floor(Math.random() * encouragements.manyFails.length)];
    }
  }

  /**
   * 다음 문제 추천 프롬프트
   */
  buildNextProblemRecommendationPrompt(
    currentProblem: ProblemContext,
    wasCorrect: boolean,
    memory: LearningMemory
  ): string {
    return `
## 방금 푼 문제
- 과목: ${currentProblem.subject}
- 단원: ${currentProblem.unit}
- 난이도: ${currentProblem.difficulty}
- 결과: ${wasCorrect ? '정답' : '오답'}

## 학습 기억
- 강점: ${memory.strengths.join(', ') || '아직 파악 중'}
- 약점: ${memory.weaknesses.join(', ') || '아직 파악 중'}
- 최근 주제: ${memory.recentTopics.join(', ')}

## 추천 기준
${wasCorrect 
  ? `- 같은 단원에서 난이도 한 단계 높은 문제
- 또는 관련 개념의 응용 문제`
  : `- 같은 개념의 더 쉬운 문제
- 기초 개념 확인 문제`
}
`.trim();
  }

  // ==================
  // Private Methods
  // ==================

  private getGradeCategory(gradeLevel: string): 'ELEMENTARY' | 'MIDDLE' | 'HIGH' {
    if (gradeLevel.startsWith('ELEMENTARY')) return 'ELEMENTARY';
    if (gradeLevel.startsWith('MIDDLE')) return 'MIDDLE';
    return 'HIGH';
  }

  private formatDifficulty(difficulty: string): string {
    const map: Record<string, string> = {
      LOW: '쉬움 ⭐',
      MEDIUM: '보통 ⭐⭐',
      HIGH: '어려움 ⭐⭐⭐',
    };
    return map[difficulty] || difficulty;
  }

  private formatProblemType(type: string): string {
    const map: Record<string, string> = {
      MULTIPLE_CHOICE: '객관식',
      SHORT_ANSWER: '단답형',
      ESSAY: '서술형',
      TRUE_FALSE: '참/거짓',
    };
    return map[type] || type;
  }

  private inferErrorPattern(
    problem: ProblemContext,
    studentAnswer: StudentAnswer
  ): ErrorPatternType {
    // 시간이 매우 짧았다면 -> 부주의
    if (studentAnswer.timeSpent && studentAnswer.timeSpent < 10) {
      return 'CARELESS_MISTAKE';
    }

    // 수학 문제이고 답이 비슷하다면 -> 계산 실수
    if (problem.subject.toLowerCase().includes('math')) {
      return 'CALCULATION_ERROR';
    }

    // 선택지가 있고, 인접한 선택지를 골랐다면 -> 선택지 혼동
    if (problem.options && problem.type === 'MULTIPLE_CHOICE') {
      const studentIdx = problem.options.findIndex((_, i) => `${i + 1}` === studentAnswer.answer);
      const correctIdx = problem.options.findIndex((_, i) => `${i + 1}` === problem.answer);
      if (Math.abs(studentIdx - correctIdx) === 1) {
        return 'OPTION_CONFUSION';
      }
    }

    // 기본값: 개념 오해
    return 'CONCEPT_MISUNDERSTANDING';
  }

  private formatErrorPattern(pattern: ErrorPatternType): string {
    const descriptions: Record<ErrorPatternType, string> = {
      CONCEPT_MISUNDERSTANDING: '📚 개념 이해가 부족할 수 있어요',
      CALCULATION_ERROR: '🔢 계산 과정에서 실수가 있을 수 있어요',
      READING_COMPREHENSION: '📖 문제를 꼼꼼히 읽지 않았을 수 있어요',
      OPTION_CONFUSION: '🔄 비슷한 선택지를 혼동했을 수 있어요',
      TIME_PRESSURE: '⏱️ 시간 압박으로 서두른 것 같아요',
      CARELESS_MISTAKE: '✏️ 단순 실수일 가능성이 높아요',
    };
    return descriptions[pattern];
  }

  private getErrorApproach(pattern: ErrorPatternType, grade: string): string {
    const approaches: Record<ErrorPatternType, string> = {
      CONCEPT_MISUNDERSTANDING: `
- 먼저 핵심 개념을 다시 설명해주세요
- 쉬운 예시로 개념을 연결하세요
- 개념과 문제의 관계를 보여주세요`,
      CALCULATION_ERROR: `
- 계산 과정을 단계별로 확인하세요
- 어느 단계에서 틀렸는지 찾아보게 하세요
- 검산 방법을 알려주세요`,
      READING_COMPREHENSION: `
- 문제를 다시 천천히 읽어보게 하세요
- 핵심 키워드를 찾아보게 하세요
- 조건과 구하는 것을 정리하게 하세요`,
      OPTION_CONFUSION: `
- 헷갈린 두 선택지의 차이점을 설명하세요
- 각 선택지가 왜 맞거나 틀린지 분석하세요
- 키워드로 구분하는 방법을 알려주세요`,
      TIME_PRESSURE: `
- 긴장하지 않아도 된다고 격려하세요
- 시간 관리 팁을 알려주세요
- 다음엔 더 잘할 수 있다고 응원하세요`,
      CARELESS_MISTAKE: `
- 가볍게 넘어가도 돼요
- 실수는 누구나 한다고 안심시켜주세요
- 다음엔 한 번 더 확인하라고 팁을 주세요`,
    };
    return approaches[pattern];
  }

  private getPraisesByGrade(grade: string) {
    if (grade === 'ELEMENTARY') {
      return {
        firstTry: [
          '🎉 와!! 한 번에 맞췄어! 정말 대단해!',
          '⭐ 최고야! 완벽하게 풀었어!',
          '🏆 천재인가봐? 정답이야!',
          '👏 짝짝짝! 너무 잘했어!',
        ],
        retry: [
          '✨ 드디어 맞췄어! 포기 안 해서 대단해!',
          '🌟 끝까지 도전한 네가 멋져!',
          '💪 노력하면 되는 거야! 잘했어!',
        ],
      };
    } else if (grade === 'MIDDLE') {
      return {
        firstTry: [
          '정답이에요! 개념을 잘 이해하고 있네요.',
          '훌륭해요! 완벽하게 풀었어요.',
          '맞았어요! 실력이 느는 게 보여요.',
        ],
        retry: [
          '정답! 다시 도전한 게 중요해요.',
          '맞았어요! 틀려도 다시 생각해본 게 좋아요.',
        ],
      };
    } else {
      return {
        firstTry: [
          '정답입니다. 해당 개념을 정확히 이해하고 있습니다.',
          '맞았습니다. 논리적 사고력이 뛰어나네요.',
        ],
        retry: [
          '정답입니다. 오답을 분석하고 다시 접근한 것이 좋았습니다.',
        ],
      };
    }
  }

  private getEncouragementsByGrade(grade: string) {
    if (grade === 'ELEMENTARY') {
      return {
        firstFail: [
          '💡 괜찮아! 다시 한번 생각해볼까?',
          '🌱 아쉽지만 괜찮아! 힌트를 줄게!',
        ],
        secondFail: [
          '📚 조금 어려웠나봐! 같이 풀어볼까?',
          '🤝 내가 도와줄게! 포기하지 마!',
        ],
        manyFails: [
          '🌈 어려운 문제야! 해설을 보고 배우자!',
          '💪 다음엔 꼭 맞출 수 있을 거야!',
        ],
      };
    } else if (grade === 'MIDDLE') {
      return {
        firstFail: ['아쉽네요! 다시 한번 생각해볼까요?'],
        secondFail: ['어려운 문제예요. 힌트를 드릴게요.'],
        manyFails: ['해설을 보고 개념을 다시 정리해봐요.'],
      };
    } else {
      return {
        firstFail: ['오답입니다. 다시 접근해보세요.'],
        secondFail: ['힌트를 참고해서 다시 풀어보세요.'],
        manyFails: ['해설을 확인하고 개념을 복습하세요.'],
      };
    }
  }
}

export const problemTutor = new ProblemSpecificTutor();
