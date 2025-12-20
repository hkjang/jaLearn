'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  BookOpen, Heart, Target, RotateCcw, TrendingUp, ChevronRight 
} from 'lucide-react';
import WordCard, { WordCardGrid } from '@/components/learning/WordCard';
import WordProgress from '@/components/learning/WordProgress';

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
}

interface ProgressData {
  word: Word;
  masteryLevel: number;
  isFavorite: boolean;
  isWeak: boolean;
  nextReviewDate: string;
}

// ========================================
// My Words Page
// ========================================

export default function MyWordsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'weak' | 'review'>('all');
  const [words, setWords] = useState<ProgressData[]>([]);
  const [stats, setStats] = useState({
    totalWords: 0,
    masteredCount: 0,
    weakCount: 0,
    avgMastery: 0,
    streak: 0,
    reviewDueCount: 0,
  });
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data based on active tab
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      let endpoint = '/api/words/my?type=all';
      
      if (activeTab === 'favorites') {
        endpoint = '/api/words/my?type=favorites';
      } else if (activeTab === 'weak') {
        endpoint = '/api/words/weak';
      } else if (activeTab === 'review') {
        endpoint = '/api/words/review';
      }

      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        
        // Normalize data structure
        const normalizedWords = (data.words || []).map((item: ProgressData | { word: Word }) => {
          if ('word' in item) return item;
          return { word: item, masteryLevel: 0, isFavorite: false, isWeak: false };
        });
        
        setWords(normalizedWords);
        
        if (data.stats) {
          setStats((prev) => ({
            ...prev,
            ...data.stats,
          }));
        }

        // Update favorites set
        const favIds = new Set<string>(
          normalizedWords
            .filter((w: ProgressData) => w.isFavorite)
            .map((w: ProgressData) => w.word.id)
        );
        setFavorites(favIds);
      }
    } catch (error) {
      console.error('Failed to fetch words:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFavoriteToggle = async (wordId: string) => {
    try {
      await fetch('/api/words/my', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordId }),
      });

      setFavorites((prev) => {
        const next = new Set(prev);
        if (next.has(wordId)) {
          next.delete(wordId);
        } else {
          next.add(wordId);
        }
        return next;
      });
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleWordClick = (wordId: string) => {
    window.location.href = `/words/${wordId}`;
  };

  const tabs = [
    { id: 'all' as const, label: '전체', icon: BookOpen },
    { id: 'favorites' as const, label: '즐겨찾기', icon: Heart },
    { id: 'weak' as const, label: '취약 단어', icon: Target },
    { id: 'review' as const, label: '복습 필요', icon: RotateCcw },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8" />
            <h1 className="text-2xl font-bold">내 단어장</h1>
          </div>
          <p className="text-white/80">
            학습한 단어를 관리하고 복습하세요
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="bg-white rounded-xl border border-gray-200 mb-6">
              <div className="flex border-b border-gray-200">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium
                      transition-colors
                      ${activeTab === tab.id 
                        ? 'text-indigo-600 border-b-2 border-indigo-600' 
                        : 'text-gray-500 hover:text-gray-700'}
                    `}
                  >
                    <tab.icon size={18} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Words List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
              </div>
            ) : words.length > 0 ? (
              <div className="space-y-4">
                {words.map((item) => (
                  <div key={item.word.id} className="relative">
                    <WordCard
                      word={item.word}
                      isFavorite={favorites.has(item.word.id)}
                      masteryLevel={item.masteryLevel}
                      onFavoriteToggle={handleFavoriteToggle}
                      onWordClick={handleWordClick}
                    />
                    {item.isWeak && (
                      <span className="absolute top-2 right-2 px-2 py-1 text-xs font-medium bg-red-100 text-red-600 rounded-full">
                        취약
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  {activeTab === 'favorites' && <Heart className="text-gray-400" size={32} />}
                  {activeTab === 'weak' && <Target className="text-gray-400" size={32} />}
                  {activeTab === 'review' && <RotateCcw className="text-gray-400" size={32} />}
                  {activeTab === 'all' && <BookOpen className="text-gray-400" size={32} />}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {activeTab === 'favorites' && '즐겨찾기한 단어가 없습니다'}
                  {activeTab === 'weak' && '취약 단어가 없습니다'}
                  {activeTab === 'review' && '복습할 단어가 없습니다'}
                  {activeTab === 'all' && '학습한 단어가 없습니다'}
                </h3>
                <p className="text-gray-600">
                  {activeTab === 'all' ? (
                    <a href="/words" className="text-indigo-600 hover:underline">
                      단어 탐색하러 가기 →
                    </a>
                  ) : (
                    '계속 학습하면 여기에 표시됩니다'
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar - Progress */}
          <div className="lg:col-span-1">
            <WordProgress
              data={{
                totalWords: stats.totalWords,
                masteredCount: stats.masteredCount,
                weakCount: stats.weakCount,
                avgMastery: stats.avgMastery,
                streak: stats.streak,
                reviewDueCount: stats.reviewDueCount,
              }}
              onViewWeak={() => setActiveTab('weak')}
              onViewReview={() => setActiveTab('review')}
            />

            {/* Quick Actions */}
            <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-medium text-gray-900 mb-3">빠른 학습</h3>
              <div className="space-y-2">
                <a
                  href="/words"
                  className="flex items-center justify-between p-3 bg-gray-50 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <span className="flex items-center gap-2 text-gray-700">
                    <TrendingUp size={18} className="text-indigo-600" />
                    새 단어 학습
                  </span>
                  <ChevronRight size={18} className="text-gray-400" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
