'use client';

import { useState, useCallback } from 'react';
import { 
  Volume2, Heart, ChevronRight, BookOpen, Share2, 
  ArrowLeft, ExternalLink, Brain, Play, Lightbulb
} from 'lucide-react';
import { MiniProgressBadge } from '@/components/learning/WordProgress';

// ========================================
// Types
// ========================================

interface Word {
  id: string;
  term: string;
  pronunciation?: string | null;
  termType: string;
  gradeLevel: string;
  definition: string;
  simpleDefinition?: string | null;
  imageUrl?: string | null;
  subjects?: Array<{ subject: { id: string; displayName: string; color?: string } }>;
  definitions?: Array<{ gradeLevel: string; definition: string; metaphor?: string | null }>;
  examples?: Array<{ id: string; sentence: string; source?: string | null }>;
  relatedWords?: Array<{ 
    relationType: string; 
    targetWord: { id: string; term: string; definition: string } 
  }>;
  problemWords?: Array<{
    isKeyWord: boolean;
    problem: { id: string; title?: string | null; content: string; gradeLevel: string };
  }>;
}

interface WordDetailClientProps {
  word: Word;
}

// ========================================
// TTS Hook
// ========================================

function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.85;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  return { speak, isSpeaking };
}

// ========================================
// Relation Type Labels
// ========================================

const RELATION_LABELS: Record<string, string> = {
  SYNONYM: '유사어',
  ANTONYM: '반대어',
  HYPERNYM: '상위어',
  HYPONYM: '하위어',
  RELATED: '관련어',
};

// ========================================
// Client Component
// ========================================

export default function WordDetailClient({ word }: WordDetailClientProps) {
  const { speak, isSpeaking } = useTTS();
  const [isFavorite, setIsFavorite] = useState(false);

  const handleSpeak = () => {
    speak(word.term);
  };

  const handleFavorite = async () => {
    try {
      await fetch('/api/words/my', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordId: word.id }),
      });
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `${word.term}이란?`,
        text: word.definition,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert('링크가 복사되었습니다!');
    }
  };

  const handleStartQuiz = () => {
    window.location.href = `/words/${word.id}/quiz`;
  };

  // Group related words by type
  const groupedRelations = word.relatedWords?.reduce((acc, rel) => {
    if (!acc[rel.relationType]) acc[rel.relationType] = [];
    acc[rel.relationType].push(rel.targetWord);
    return acc;
  }, {} as Record<string, typeof word.relatedWords[0]['targetWord'][]>);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <a 
            href="/words" 
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4"
          >
            <ArrowLeft size={18} />
            단어 목록
          </a>
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{word.term}</h1>
                {word.pronunciation && (
                  <span className="text-xl text-white/70">[{word.pronunciation}]</span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {word.subjects?.map((ws) => (
                  <span 
                    key={ws.subject.id}
                    className="px-2 py-1 text-sm rounded-full bg-white/20"
                  >
                    {ws.subject.displayName}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleSpeak}
                className={`p-3 rounded-full bg-white/20 hover:bg-white/30 ${isSpeaking ? 'ring-2 ring-white' : ''}`}
              >
                <Volume2 size={20} />
              </button>
              <button
                onClick={handleFavorite}
                className="p-3 rounded-full bg-white/20 hover:bg-white/30"
              >
                <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={handleShare}
                className="p-3 rounded-full bg-white/20 hover:bg-white/30"
              >
                <Share2 size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid gap-6">
          {/* Definition Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen size={20} className="text-indigo-600" />
              정의
            </h2>
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              {word.definition}
            </p>
            {word.simpleDefinition && (
              <div className="p-4 bg-indigo-50 rounded-lg">
                <div className="flex items-center gap-2 text-indigo-600 font-medium mb-2">
                  <Lightbulb size={16} />
                  쉬운 설명
                </div>
                <p className="text-gray-700">{word.simpleDefinition}</p>
              </div>
            )}
          </div>

          {/* Image */}
          {word.imageUrl && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <img
                src={word.imageUrl}
                alt={word.term}
                className="w-full h-64 object-cover"
              />
            </div>
          )}

          {/* Examples */}
          {word.examples && word.examples.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen size={20} className="text-indigo-600" />
                예문
              </h2>
              <div className="space-y-3">
                {word.examples.map((example) => (
                  <div key={example.id} className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700">{example.sentence}</p>
                    {example.source && (
                      <p className="text-sm text-gray-500 mt-2">출처: {example.source}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Words */}
          {groupedRelations && Object.keys(groupedRelations).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Brain size={20} className="text-indigo-600" />
                관련 단어
              </h2>
              <div className="space-y-4">
                {Object.entries(groupedRelations).map(([type, words]) => (
                  <div key={type}>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      {RELATION_LABELS[type] || type}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {words.map((w) => (
                        <a
                          key={w.id}
                          href={`/words/${w.id}`}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-indigo-100 rounded-full text-sm text-gray-700 hover:text-indigo-700 transition-colors"
                        >
                          {w.term}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Problems */}
          {word.problemWords && word.problemWords.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ExternalLink size={20} className="text-indigo-600" />
                연결된 문제
              </h2>
              <div className="space-y-3">
                {word.problemWords.map((pw) => (
                  <a
                    key={pw.problem.id}
                    href={`/problems/${pw.problem.id}`}
                    className="block p-4 bg-gray-50 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {pw.problem.title || pw.problem.content.slice(0, 50) + '...'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {pw.problem.gradeLevel} · {pw.isKeyWord ? '핵심 단어' : '포함 단어'}
                        </p>
                      </div>
                      <ChevronRight className="text-gray-400" size={20} />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Quiz CTA */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold mb-1">이 단어를 확실히 기억하세요!</h3>
                <p className="text-white/80">퀴즈를 통해 학습 효과를 높여보세요</p>
              </div>
              <button
                onClick={handleStartQuiz}
                className="flex items-center gap-2 px-5 py-3 bg-white text-indigo-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Play size={18} />
                퀴즈 시작
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
