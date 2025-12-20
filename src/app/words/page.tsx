'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, ChevronDown, BookOpen, Grid, List } from 'lucide-react';
import WordCard, { WordCardGrid } from '@/components/learning/WordCard';

// ========================================
// Types
// ========================================

interface Subject {
  id: string;
  displayName: string;
  color?: string;
}

interface Word {
  id: string;
  term: string;
  pronunciation?: string | null;
  termType: string;
  gradeLevel: string;
  definition: string;
  simpleDefinition?: string | null;
  imageUrl?: string | null;
  subjects?: Array<{ subject: Subject }>;
  _count?: { examples?: number; problemWords?: number };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ========================================
// Grade Level Options
// ========================================

const GRADE_LEVELS = [
  { value: '', label: '전체 학년' },
  { value: 'ELEMENTARY_1', label: '초1' },
  { value: 'ELEMENTARY_2', label: '초2' },
  { value: 'ELEMENTARY_3', label: '초3' },
  { value: 'ELEMENTARY_4', label: '초4' },
  { value: 'ELEMENTARY_5', label: '초5' },
  { value: 'ELEMENTARY_6', label: '초6' },
  { value: 'MIDDLE_1', label: '중1' },
  { value: 'MIDDLE_2', label: '중2' },
  { value: 'MIDDLE_3', label: '중3' },
  { value: 'HIGH_1', label: '고1' },
  { value: 'HIGH_2', label: '고2' },
  { value: 'HIGH_3', label: '고3' },
];

const TERM_TYPES = [
  { value: '', label: '전체 유형' },
  { value: 'VOCABULARY', label: '어휘' },
  { value: 'CONCEPT', label: '개념' },
  { value: 'SYMBOL', label: '기호' },
  { value: 'TERM', label: '용어' },
  { value: 'THEORY', label: '이론' },
  { value: 'MODEL', label: '모델' },
];

// ========================================
// Words Page
// ========================================

export default function WordsPage() {
  const [words, setWords] = useState<Word[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filters
  const [search, setSearch] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [termType, setTermType] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Favorites (local state)
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Fetch subjects
  useEffect(() => {
    async function fetchSubjects() {
      try {
        const res = await fetch('/api/subjects');
        if (res.ok) {
          const data = await res.json();
          setSubjects(data.subjects || data);
        }
      } catch (error) {
        console.error('Failed to fetch subjects:', error);
      }
    }
    fetchSubjects();
  }, []);

  // Fetch words
  const fetchWords = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(subjectId && { subjectId }),
        ...(gradeLevel && { gradeLevel }),
        ...(termType && { termType }),
      });

      const res = await fetch(`/api/words?${params}`);
      if (res.ok) {
        const data = await res.json();
        setWords(data.words);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch words:', error);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search, subjectId, gradeLevel, termType]);

  useEffect(() => {
    const debounce = setTimeout(fetchWords, 300);
    return () => clearTimeout(debounce);
  }, [fetchWords]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8" />
            <h1 className="text-2xl font-bold">단어 학습</h1>
          </div>
          <p className="text-white/80">
            모든 과목의 핵심 단어를 체계적으로 학습하세요
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search & Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          {/* Search Bar */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="단어 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
                showFilters ? 'bg-indigo-50 border-indigo-300 text-indigo-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Filter size={18} />
              필터
              <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400'}`}
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400'}`}
              >
                <List size={18} />
              </button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              {/* Subject Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">과목</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">전체 과목</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.displayName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Grade Level Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">학년</label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {GRADE_LEVELS.map((gl) => (
                    <option key={gl.value} value={gl.value}>
                      {gl.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Term Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">유형</label>
                <select
                  value={termType}
                  onChange={(e) => setTermType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {TERM_TYPES.map((tt) => (
                    <option key={tt.value} value={tt.value}>
                      {tt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            총 <span className="font-semibold text-gray-900">{pagination.total}</span>개의 단어
          </p>
        </div>

        {/* Words Grid/List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : words.length > 0 ? (
          <WordCardGrid
            words={words}
            favorites={favorites}
            onFavoriteToggle={handleFavoriteToggle}
            onWordClick={handleWordClick}
            compact={viewMode === 'list'}
          />
        ) : (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">단어가 없습니다</h3>
            <p className="text-gray-600">검색 조건을 변경해보세요</p>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              이전
            </button>
            <span className="px-4 py-2 text-gray-600">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
