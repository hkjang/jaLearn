'use client';

import { useState, useEffect, useMemo } from 'react';
import { BookOpen, Volume2, X } from 'lucide-react';

// ========================================
// Types
// ========================================

interface HighlightWord {
  term: string;
  wordId: string;
  definition: string;
  simpleDefinition?: string;
  position?: [number, number];
}

interface WordHighlightProps {
  text: string;
  words: HighlightWord[];
  onWordClick?: (wordId: string) => void;
  highlightColor?: string;
}

// ========================================
// Word Tooltip Component
// ========================================

interface WordTooltipProps {
  word: HighlightWord;
  onClose: () => void;
  onViewDetail: () => void;
  position: { x: number; y: number };
}

function WordTooltip({ word, onClose, onViewDetail, position }: WordTooltipProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeak = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word.term);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.9;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.word-tooltip')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      className="word-tooltip fixed z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-72 animate-in fade-in zoom-in-95 duration-150"
      style={{
        left: `${Math.min(position.x, window.innerWidth - 300)}px`,
        top: `${position.y + 10}px`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-lg text-gray-900">{word.term}</h4>
        <div className="flex items-center gap-1">
          <button
            onClick={handleSpeak}
            className={`p-1.5 rounded-full hover:bg-gray-100 ${isSpeaking ? 'text-indigo-600' : 'text-gray-400'}`}
          >
            <Volume2 size={16} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Definition */}
      <p className="text-sm text-gray-700 mb-3">
        {word.simpleDefinition || word.definition}
      </p>

      {/* Action */}
      <button
        onClick={onViewDetail}
        className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
      >
        <BookOpen size={14} />
        자세히 보기
      </button>
    </div>
  );
}

// ========================================
// Word Highlight Component
// ========================================

export default function WordHighlight({
  text,
  words,
  onWordClick,
  highlightColor = 'bg-yellow-100 hover:bg-yellow-200 border-b-2 border-yellow-400',
}: WordHighlightProps) {
  const [activeWord, setActiveWord] = useState<HighlightWord | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // 텍스트에서 단어 위치 찾기 및 하이라이트 생성
  const highlightedContent = useMemo(() => {
    if (!words.length) return <span>{text}</span>;

    // 모든 단어의 위치 찾기
    const matches: Array<{ start: number; end: number; word: HighlightWord }> = [];

    for (const word of words) {
      const regex = new RegExp(escapeRegExp(word.term), 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          word: { ...word, term: match[0] }, // 실제 매칭된 텍스트 사용
        });
      }
    }

    // 위치순 정렬
    matches.sort((a, b) => a.start - b.start);

    // 겹치는 매치 제거
    const filteredMatches: typeof matches = [];
    for (const match of matches) {
      const lastMatch = filteredMatches[filteredMatches.length - 1];
      if (!lastMatch || match.start >= lastMatch.end) {
        filteredMatches.push(match);
      }
    }

    // JSX 생성
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    for (const match of filteredMatches) {
      // 단어 전 텍스트
      if (match.start > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {text.slice(lastIndex, match.start)}
          </span>
        );
      }

      // 하이라이트된 단어
      parts.push(
        <span
          key={`word-${match.start}`}
          className={`
            cursor-pointer rounded px-0.5 transition-colors
            ${highlightColor}
          `}
          onClick={(e) => {
            e.stopPropagation();
            setActiveWord(match.word);
            setTooltipPosition({
              x: e.clientX,
              y: e.clientY,
            });
          }}
        >
          {match.word.term}
        </span>
      );

      lastIndex = match.end;
    }

    // 마지막 텍스트
    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {text.slice(lastIndex)}
        </span>
      );
    }

    return <>{parts}</>;
  }, [text, words, highlightColor]);

  const handleCloseTooltip = () => {
    setActiveWord(null);
  };

  const handleViewDetail = () => {
    if (activeWord && onWordClick) {
      onWordClick(activeWord.wordId);
      setActiveWord(null);
    }
  };

  return (
    <div className="relative">
      <div className="leading-relaxed text-gray-800">
        {highlightedContent}
      </div>

      {/* Tooltip */}
      {activeWord && (
        <WordTooltip
          word={activeWord}
          position={tooltipPosition}
          onClose={handleCloseTooltip}
          onViewDetail={handleViewDetail}
        />
      )}
    </div>
  );
}

// ========================================
// Helper Functions
// ========================================

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ========================================
// Problem Content with Highlights
// ========================================

interface ProblemContentProps {
  content: string;
  words?: HighlightWord[];
  onWordClick?: (wordId: string) => void;
}

export function ProblemContent({
  content,
  words = [],
  onWordClick,
}: ProblemContentProps) {
  return (
    <div className="prose prose-sm max-w-none">
      <WordHighlight
        text={content}
        words={words}
        onWordClick={onWordClick}
      />
    </div>
  );
}
