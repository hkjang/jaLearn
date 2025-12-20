'use client';

import { useState, useCallback } from 'react';
import { Volume2, Heart, ChevronRight, BookOpen, Star } from 'lucide-react';

// ========================================
// Types
// ========================================

interface WordData {
  id: string;
  term: string;
  pronunciation?: string | null;
  termType: string;
  gradeLevel: string;
  definition: string;
  simpleDefinition?: string | null;
  imageUrl?: string | null;
  subjects?: Array<{
    subject: {
      id: string;
      displayName: string;
      color?: string;
    };
  }>;
  _count?: {
    examples?: number;
    problemWords?: number;
  };
}

interface WordCardProps {
  word: WordData;
  showActions?: boolean;
  isFavorite?: boolean;
  onFavoriteToggle?: (wordId: string) => void;
  onWordClick?: (wordId: string) => void;
  compact?: boolean;
  masteryLevel?: number; // 0-5
}

// ========================================
// TTS Hook
// ========================================

function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback((text: string, lang: string = 'ko-KR') => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('TTS not supported');
      return;
    }

    // 이전 발화 중단
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    utterance.pitch = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  return { speak, isSpeaking };
}

// ========================================
// Mastery Level Colors
// ========================================

const MASTERY_COLORS = {
  0: 'bg-gray-200 text-gray-600',
  1: 'bg-red-100 text-red-600',
  2: 'bg-orange-100 text-orange-600',
  3: 'bg-yellow-100 text-yellow-600',
  4: 'bg-green-100 text-green-600',
  5: 'bg-emerald-100 text-emerald-600',
};

const MASTERY_LABELS = {
  0: '미학습',
  1: '시작',
  2: '학습중',
  3: '익숙함',
  4: '숙달',
  5: '완벽',
};

// ========================================
// Term Type Labels
// ========================================

const TERM_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  VOCABULARY: { label: '어휘', color: 'bg-blue-100 text-blue-700' },
  CONCEPT: { label: '개념', color: 'bg-purple-100 text-purple-700' },
  SYMBOL: { label: '기호', color: 'bg-indigo-100 text-indigo-700' },
  TERM: { label: '용어', color: 'bg-teal-100 text-teal-700' },
  THEORY: { label: '이론', color: 'bg-pink-100 text-pink-700' },
  MODEL: { label: '모델', color: 'bg-amber-100 text-amber-700' },
};

// ========================================
// WordCard Component
// ========================================

export default function WordCard({
  word,
  showActions = true,
  isFavorite = false,
  onFavoriteToggle,
  onWordClick,
  compact = false,
  masteryLevel,
}: WordCardProps) {
  const { speak, isSpeaking } = useTTS();
  const [localFavorite, setLocalFavorite] = useState(isFavorite);

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    speak(word.term);
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalFavorite(!localFavorite);
    onFavoriteToggle?.(word.id);
  };

  const handleClick = () => {
    onWordClick?.(word.id);
  };

  const termType = TERM_TYPE_LABELS[word.termType] || { label: word.termType, color: 'bg-gray-100 text-gray-700' };

  if (compact) {
    return (
      <div
        onClick={handleClick}
        className={`
          flex items-center justify-between p-3 rounded-lg border border-gray-200
          hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer
          bg-white
        `}
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{word.term}</span>
          {word.pronunciation && (
            <span className="text-sm text-gray-400">[{word.pronunciation}]</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSpeak}
            className={`p-1.5 rounded-full hover:bg-gray-100 ${isSpeaking ? 'text-indigo-600' : 'text-gray-400'}`}
            aria-label="단어 듣기"
          >
            <Volume2 size={16} />
          </button>
          <ChevronRight size={16} className="text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={`
        relative p-4 rounded-xl border border-gray-200 bg-white
        hover:border-indigo-300 hover:shadow-md transition-all
        ${onWordClick ? 'cursor-pointer' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* Term Type Badge */}
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${termType.color}`}>
            {termType.label}
          </span>
          {/* Mastery Level */}
          {masteryLevel !== undefined && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${MASTERY_COLORS[masteryLevel as keyof typeof MASTERY_COLORS]}`}>
              {MASTERY_LABELS[masteryLevel as keyof typeof MASTERY_LABELS]}
            </span>
          )}
        </div>

        {showActions && (
          <div className="flex items-center gap-1">
            <button
              onClick={handleSpeak}
              className={`p-1.5 rounded-full hover:bg-gray-100 transition-colors ${isSpeaking ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400'}`}
              aria-label="단어 듣기"
            >
              <Volume2 size={18} />
            </button>
            {onFavoriteToggle && (
              <button
                onClick={handleFavorite}
                className={`p-1.5 rounded-full hover:bg-gray-100 transition-colors ${localFavorite ? 'text-red-500' : 'text-gray-400'}`}
                aria-label="즐겨찾기"
              >
                <Heart size={18} fill={localFavorite ? 'currentColor' : 'none'} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Term */}
      <div className="mb-2">
        <h3 className="text-xl font-bold text-gray-900">{word.term}</h3>
        {word.pronunciation && (
          <span className="text-sm text-gray-500">[{word.pronunciation}]</span>
        )}
      </div>

      {/* Definition */}
      <p className="text-gray-700 text-sm mb-3 line-clamp-2">
        {word.simpleDefinition || word.definition}
      </p>

      {/* Image (if available) */}
      {word.imageUrl && (
        <div className="mb-3">
          <img
            src={word.imageUrl}
            alt={word.term}
            className="w-full h-32 object-cover rounded-lg"
          />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        {/* Subjects */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {word.subjects?.slice(0, 3).map((ws) => (
            <span
              key={ws.subject.id}
              className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600"
              style={ws.subject.color ? { backgroundColor: `${ws.subject.color}20`, color: ws.subject.color } : undefined}
            >
              {ws.subject.displayName}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-gray-400">
          {word._count?.examples !== undefined && word._count.examples > 0 && (
            <span className="flex items-center gap-1">
              <BookOpen size={12} />
              {word._count.examples}개 예문
            </span>
          )}
          {word._count?.problemWords !== undefined && word._count.problemWords > 0 && (
            <span className="flex items-center gap-1">
              <Star size={12} />
              {word._count.problemWords}문제
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ========================================
// Word Card Grid Component
// ========================================

interface WordCardGridProps {
  words: WordData[];
  favorites?: Set<string>;
  progress?: Map<string, { masteryLevel: number }>;
  onFavoriteToggle?: (wordId: string) => void;
  onWordClick?: (wordId: string) => void;
  compact?: boolean;
}

export function WordCardGrid({
  words,
  favorites = new Set(),
  progress = new Map(),
  onFavoriteToggle,
  onWordClick,
  compact = false,
}: WordCardGridProps) {
  return (
    <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
      {words.map((word) => (
        <WordCard
          key={word.id}
          word={word}
          isFavorite={favorites.has(word.id)}
          masteryLevel={progress.get(word.id)?.masteryLevel}
          onFavoriteToggle={onFavoriteToggle}
          onWordClick={onWordClick}
          compact={compact}
        />
      ))}
    </div>
  );
}
