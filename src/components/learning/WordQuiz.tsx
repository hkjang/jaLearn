'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Clock, Volume2, ChevronRight, RotateCcw } from 'lucide-react';

// ========================================
// Types
// ========================================

interface QuizOption {
  text: string;
  isCorrect: boolean;
}

interface QuizData {
  type: 'DEFINITION' | 'EXAMPLE' | 'RELATION' | 'LISTENING';
  question: string;
  options: QuizOption[];
  wordId: string;
  term: string;
  audioText?: string;
}

interface WordQuizProps {
  quiz: QuizData;
  onAnswer: (wordId: string, isCorrect: boolean, timeSpent: number, userAnswer: string) => void;
  onNext?: () => void;
  autoAdvance?: boolean;
  autoAdvanceDelay?: number;
}

// ========================================
// TTS Hook
// ========================================

function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback((text: string, lang: string = 'ko-KR') => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.85;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  return { speak, isSpeaking };
}

// ========================================
// WordQuiz Component
// ========================================

export default function WordQuiz({
  quiz,
  onAnswer,
  onNext,
  autoAdvance = false,
  autoAdvanceDelay = 2000,
}: WordQuizProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [startTime] = useState(Date.now());
  const { speak, isSpeaking } = useTTS();

  // 듣기 퀴즈면 자동 재생
  useEffect(() => {
    if (quiz.type === 'LISTENING' && quiz.audioText) {
      speak(quiz.audioText);
    }
  }, [quiz, speak]);

  // 자동 다음으로 이동
  useEffect(() => {
    if (isAnswered && autoAdvance && onNext) {
      const timer = setTimeout(onNext, autoAdvanceDelay);
      return () => clearTimeout(timer);
    }
  }, [isAnswered, autoAdvance, autoAdvanceDelay, onNext]);

  const handleSelect = (index: number) => {
    if (isAnswered) return;

    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    const selected = quiz.options[index];
    
    setSelectedIndex(index);
    setIsAnswered(true);
    onAnswer(quiz.wordId, selected.isCorrect, timeSpent, selected.text);
  };

  const handlePlayAudio = () => {
    if (quiz.audioText) {
      speak(quiz.audioText);
    }
  };

  const getOptionStyle = (index: number) => {
    if (!isAnswered) {
      return 'bg-white border-gray-200 hover:border-indigo-400 hover:bg-indigo-50';
    }

    const option = quiz.options[index];
    if (option.isCorrect) {
      return 'bg-green-50 border-green-500 text-green-800';
    }
    if (index === selectedIndex && !option.isCorrect) {
      return 'bg-red-50 border-red-500 text-red-800';
    }
    return 'bg-gray-50 border-gray-200 text-gray-400';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      {/* Quiz Type Badge */}
      <div className="flex items-center justify-between mb-4">
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
          {quiz.type === 'DEFINITION' && '뜻 맞추기'}
          {quiz.type === 'EXAMPLE' && '예문 완성'}
          {quiz.type === 'RELATION' && '관계 찾기'}
          {quiz.type === 'LISTENING' && '듣기'}
        </span>
        {quiz.type === 'LISTENING' && (
          <button
            onClick={handlePlayAudio}
            disabled={isSpeaking}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
              ${isSpeaking ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
            `}
          >
            <Volume2 size={16} />
            다시 듣기
          </button>
        )}
      </div>

      {/* Question */}
      <div className="mb-6">
        <p className="text-lg font-medium text-gray-900 whitespace-pre-line">
          {quiz.question}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {quiz.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(index)}
            disabled={isAnswered}
            className={`
              w-full flex items-center justify-between p-4 rounded-lg border-2
              transition-all text-left
              ${getOptionStyle(index)}
              ${!isAnswered ? 'cursor-pointer' : 'cursor-default'}
            `}
          >
            <span className="flex items-center gap-3">
              <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 font-medium text-sm">
                {index + 1}
              </span>
              <span>{option.text}</span>
            </span>
            {isAnswered && option.isCorrect && (
              <CheckCircle className="text-green-500" size={20} />
            )}
            {isAnswered && index === selectedIndex && !option.isCorrect && (
              <XCircle className="text-red-500" size={20} />
            )}
          </button>
        ))}
      </div>

      {/* Result & Next */}
      {isAnswered && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {quiz.options[selectedIndex!]?.isCorrect ? (
              <span className="flex items-center gap-2 text-green-600 font-medium">
                <CheckCircle size={20} />
                정답입니다!
              </span>
            ) : (
              <span className="flex items-center gap-2 text-red-600 font-medium">
                <XCircle size={20} />
                오답입니다
              </span>
            )}
          </div>
          {onNext && (
            <button
              onClick={onNext}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              다음 문제
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ========================================
// Quiz Session Component
// ========================================

interface QuizSessionProps {
  quizzes: QuizData[];
  onComplete: (results: Array<{ wordId: string; isCorrect: boolean; timeSpent: number }>) => void;
  onExit?: () => void;
}

export function QuizSession({ quizzes, onComplete, onExit }: QuizSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<Array<{ wordId: string; isCorrect: boolean; timeSpent: number }>>([]);
  const [isComplete, setIsComplete] = useState(false);

  const handleAnswer = (wordId: string, isCorrect: boolean, timeSpent: number) => {
    setResults(prev => [...prev, { wordId, isCorrect, timeSpent }]);
  };

  const handleNext = () => {
    if (currentIndex < quizzes.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
      onComplete(results);
    }
  };

  const correctCount = results.filter(r => r.isCorrect).length;
  const avgTime = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.timeSpent, 0) / results.length)
    : 0;

  if (isComplete) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-100 flex items-center justify-center">
            <CheckCircle className="text-indigo-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">퀴즈 완료!</h2>
          <p className="text-gray-600">수고하셨습니다</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{quizzes.length}</div>
            <div className="text-sm text-gray-500">문제 수</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{correctCount}</div>
            <div className="text-sm text-gray-500">정답</div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{avgTime}초</div>
            <div className="text-sm text-gray-500">평균 시간</div>
          </div>
        </div>

        <div className="mb-6">
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
              style={{ width: `${(correctCount / quizzes.length) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-gray-600">
            정답률: {Math.round((correctCount / quizzes.length) * 100)}%
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => {
              setCurrentIndex(0);
              setResults([]);
              setIsComplete(false);
            }}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <RotateCcw size={16} />
            다시 풀기
          </button>
          {onExit && (
            <button
              onClick={onExit}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              완료
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Progress */}
      <div className="mb-4 flex items-center justify-between text-sm text-gray-600">
        <span>
          문제 {currentIndex + 1} / {quizzes.length}
        </span>
        <div className="flex items-center gap-1">
          <Clock size={14} />
          <span>평균 {avgTime}초</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-gray-200 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-indigo-600 transition-all"
          style={{ width: `${((currentIndex + 1) / quizzes.length) * 100}%` }}
        />
      </div>

      {/* Quiz */}
      <WordQuiz
        quiz={quizzes[currentIndex]}
        onAnswer={handleAnswer}
        onNext={handleNext}
      />
    </div>
  );
}
