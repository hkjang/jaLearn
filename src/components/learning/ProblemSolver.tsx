'use client';

/**
 * Problem Solver Component (문제 풀이 인터랙션)
 * - 로그인 없이 문제 풀이 가능
 * - 풀이 결과 저장 시 로그인 요구
 * - 해설은 로그인 없이 50%만 공개
 */

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { CheckCircle, XCircle, Lightbulb, Lock, Sparkles, Trophy, Flame } from 'lucide-react';

interface ProblemSolverProps {
  problemId: string;
  type: string;
  options: string[];
  answer: string;
  explanation?: string;
  difficulty: string;
  onCorrect?: () => void;
  onWrong?: () => void;
}

// 로컬 스토리지 키
const PENDING_SUBMISSION_KEY = 'jalearn_pending_submission';

export function ProblemSolver({
  problemId,
  type,
  options,
  answer,
  explanation,
  difficulty,
  onCorrect,
  onWrong,
}: ProblemSolverProps) {
  const { data: session, status } = useSession();
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showFullExplanation, setShowFullExplanation] = useState(false);
  const [aiPraise, setAiPraise] = useState<string>('');
  const [streak, setStreak] = useState(0);

  // 페이지 로드 시 대기 중인 제출이 있는지 확인
  useEffect(() => {
    if (session) {
      const pending = localStorage.getItem(PENDING_SUBMISSION_KEY);
      if (pending) {
        const data = JSON.parse(pending);
        if (data.problemId === problemId) {
          // 저장된 풀이 결과 서버에 제출
          saveToPendingSubmission(data);
          localStorage.removeItem(PENDING_SUBMISSION_KEY);
        }
      }
    }
  }, [session, problemId]);

  const saveToPendingSubmission = async (data: {
    problemId: string;
    answer: string;
    isCorrect: boolean;
  }) => {
    try {
      await fetch('/api/problems/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Failed to save submission:', error);
    }
  };

  const handleSubmit = () => {
    if (!selectedAnswer) return;

    const correct = selectedAnswer === answer;
    setIsCorrect(correct);
    setSubmitted(true);

    if (correct) {
      onCorrect?.();
      generateAiPraise(true);
      setStreak((prev) => prev + 1);
    } else {
      onWrong?.();
      generateAiPraise(false);
    }

    // 로그인된 경우 즉시 저장, 아니면 대기
    if (session) {
      saveToPendingSubmission({
        problemId,
        answer: selectedAnswer,
        isCorrect: correct,
      });
    } else {
      // 로컬 스토리지에 저장
      localStorage.setItem(
        PENDING_SUBMISSION_KEY,
        JSON.stringify({
          problemId,
          answer: selectedAnswer,
          isCorrect: correct,
          timestamp: Date.now(),
        })
      );
    }
  };

  const generateAiPraise = (correct: boolean) => {
    const praises = correct
      ? [
          '🎉 정답이에요! 정말 잘했어요!',
          '👏 대단해요! 이 문제를 맞추다니!',
          '⭐ 훌륭해요! 계속 이 기세로!',
          '🏆 멋져요! 실력이 느는 게 보여요!',
          '💪 완벽해요! 다음 문제도 도전해봐요!',
        ]
      : [
          '💡 아쉽지만 괜찮아요! 다시 한번 생각해봐요.',
          '🌱 틀려도 괜찮아요, 이게 바로 배움이에요!',
          '📚 해설을 보고 개념을 다져봐요!',
          '🔥 포기하지 마세요! 다음엔 꼭 맞출 거예요!',
          '💪 실패는 성공의 어머니! 다시 도전해요!',
        ];

    setAiPraise(praises[Math.floor(Math.random() * praises.length)]);
  };

  const handleSaveResult = () => {
    if (!session) {
      setShowLoginModal(true);
    }
  };

  const truncateExplanation = (text: string) => {
    if (!text) return '';
    const half = Math.floor(text.length / 2);
    return text.substring(0, half);
  };

  const handleLogin = async () => {
    await signIn(undefined, {
      callbackUrl: window.location.href,
    });
  };

  return (
    <div className="space-y-6">
      {/* 연속 정답 스트릭 */}
      {streak > 0 && (
        <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full w-fit">
          <Flame className="h-5 w-5 animate-pulse" />
          <span className="font-bold">{streak}문제 연속 정답!</span>
        </div>
      )}

      {/* 선택지 */}
      {type === 'MULTIPLE_CHOICE' && options.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-gray-900">답을 선택하세요</h3>
          {options.map((option, index) => {
            const optionLabel = `${index + 1}`;
            const isSelected = selectedAnswer === optionLabel;
            const showResult = submitted;
            const isAnswer = optionLabel === answer;

            return (
              <button
                key={index}
                onClick={() => !submitted && setSelectedAnswer(optionLabel)}
                disabled={submitted}
                className={`w-full flex items-start gap-3 p-4 rounded-lg transition-all text-left ${
                  showResult
                    ? isAnswer
                      ? 'bg-green-100 border-2 border-green-500'
                      : isSelected && !isCorrect
                      ? 'bg-red-100 border-2 border-red-500'
                      : 'bg-gray-50'
                    : isSelected
                    ? 'bg-blue-100 border-2 border-blue-500'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-medium flex-shrink-0 ${
                    showResult
                      ? isAnswer
                        ? 'bg-green-500 text-white'
                        : isSelected && !isCorrect
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                      : isSelected
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {showResult && isAnswer ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : showResult && isSelected && !isCorrect ? (
                    <XCircle className="h-5 w-5" />
                  ) : (
                    optionLabel
                  )}
                </span>
                <span className="pt-1">{option}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 단답형 입력 */}
      {type === 'SHORT_ANSWER' && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-gray-900">답을 입력하세요</h3>
          <input
            type="text"
            value={selectedAnswer}
            onChange={(e) => setSelectedAnswer(e.target.value)}
            disabled={submitted}
            placeholder="답을 입력하세요..."
            className={`w-full px-4 py-3 rounded-lg border-2 ${
              submitted
                ? isCorrect
                  ? 'border-green-500 bg-green-50'
                  : 'border-red-500 bg-red-50'
                : 'border-gray-200 focus:border-blue-500'
            } outline-none transition-colors`}
          />
          {submitted && !isCorrect && (
            <p className="text-green-600 font-medium">정답: {answer}</p>
          )}
        </div>
      )}

      {/* 제출 버튼 */}
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={!selectedAnswer}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
        >
          정답 확인하기
        </button>
      )}

      {/* AI 칭찬/격려 메시지 */}
      {submitted && aiPraise && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl ${
            isCorrect
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'
              : 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200'
          }`}
        >
          <Sparkles
            className={`h-6 w-6 ${isCorrect ? 'text-green-500' : 'text-amber-500'}`}
          />
          <p className="font-medium text-gray-800">{aiPraise}</p>
        </div>
      )}

      {/* 해설 영역 */}
      {submitted && explanation && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">해설</h3>
          </div>

          {session || showFullExplanation ? (
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: explanation }}
            />
          ) : (
            <>
              {/* 해설 미리보기 (50%) */}
              <div className="relative">
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: truncateExplanation(explanation) + '...',
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-blue-50 to-transparent" />
              </div>

              {/* 로그인 유도 */}
              <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-blue-600" />
                  <span className="text-gray-700">
                    전체 해설을 보려면 로그인하세요
                  </span>
                </div>
                <button
                  onClick={handleLogin}
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  로그인
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* 결과 저장 유도 (비로그인 시) */}
      {submitted && !session && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <Trophy className="h-8 w-8 text-purple-600 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-gray-900 mb-2">
                풀이 결과를 저장하고 싶으신가요?
              </h4>
              <p className="text-gray-600 text-sm mb-4">
                로그인하면 오늘의 학습 기록, 스트릭, 레벨이 저장되고 AI 튜터의 맞춤 추천을
                받을 수 있어요!
              </p>
              <button
                onClick={handleLogin}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                로그인하고 저장하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 다음 문제 버튼 */}
      {submitted && (
        <div className="flex gap-4">
          <button
            onClick={() => {
              setSubmitted(false);
              setSelectedAnswer('');
              setAiPraise('');
            }}
            className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            다시 풀기
          </button>
          <a
            href="#related-problems"
            className="flex-1 py-3 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 transition-colors text-center"
          >
            다음 문제
          </a>
        </div>
      )}

      {/* 로그인 모달 */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              학습 기록을 저장하세요! 📚
            </h3>
            <p className="text-gray-600 mb-6">
              로그인하면 풀이 기록이 저장되고, AI가 맞춤 문제를 추천해드려요.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleLogin}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all"
              >
                로그인 / 회원가입
              </button>
              <button
                onClick={() => setShowLoginModal(false)}
                className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                나중에 할게요
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
