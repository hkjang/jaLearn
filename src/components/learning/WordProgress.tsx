'use client';

import { useMemo } from 'react';
import { TrendingUp, Target, BookOpen, Flame, Award, ChevronRight } from 'lucide-react';

// ========================================
// Types
// ========================================

interface ProgressData {
  totalWords: number;
  masteredCount: number;
  weakCount: number;
  avgMastery: number;
  streak: number;
  reviewDueCount: number;
  subjectStats?: Array<{
    subjectId: string;
    subjectName: string;
    count: number;
    mastered: number;
    color?: string;
  }>;
}

interface WordProgressProps {
  data: ProgressData;
  onViewWeak?: () => void;
  onViewReview?: () => void;
  onViewSubject?: (subjectId: string) => void;
  compact?: boolean;
}

// ========================================
// Progress Ring Component
// ========================================

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  children?: React.ReactNode;
}

function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  color = '#6366f1',
  backgroundColor = '#e5e7eb',
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// ========================================
// Word Progress Component
// ========================================

export default function WordProgress({
  data,
  onViewWeak,
  onViewReview,
  onViewSubject,
  compact = false,
}: WordProgressProps) {
  const masteryPercentage = useMemo(() => {
    if (data.totalWords === 0) return 0;
    return Math.round((data.masteredCount / data.totalWords) * 100);
  }, [data.masteredCount, data.totalWords]);

  if (compact) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ProgressRing progress={masteryPercentage} size={48} strokeWidth={4}>
              <span className="text-xs font-bold text-gray-900">{masteryPercentage}%</span>
            </ProgressRing>
            <div>
              <div className="font-medium text-gray-900">단어 학습</div>
              <div className="text-sm text-gray-500">
                {data.masteredCount}/{data.totalWords} 숙달
              </div>
            </div>
          </div>
          <ChevronRight className="text-gray-400" size={20} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <h3 className="text-lg font-bold mb-1">단어 학습 현황</h3>
        <p className="text-white/80 text-sm">오늘도 새로운 단어를 익혀보세요!</p>
      </div>

      {/* Main Stats */}
      <div className="p-6">
        <div className="flex items-center gap-6 mb-6">
          {/* Progress Ring */}
          <ProgressRing progress={masteryPercentage}>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{masteryPercentage}%</div>
              <div className="text-xs text-gray-500">숙달률</div>
            </div>
          </ProgressRing>

          {/* Stats Grid */}
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <BookOpen size={14} />
                전체 단어
              </div>
              <div className="text-xl font-bold text-gray-900">{data.totalWords}</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 text-green-600 text-sm mb-1">
                <Award size={14} />
                숙달 완료
              </div>
              <div className="text-xl font-bold text-green-600">{data.masteredCount}</div>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2 text-orange-600 text-sm mb-1">
                <Flame size={14} />
                연속 학습
              </div>
              <div className="text-xl font-bold text-orange-600">{data.streak}일</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-600 text-sm mb-1">
                <TrendingUp size={14} />
                평균 숙달
              </div>
              <div className="text-xl font-bold text-blue-600">{data.avgMastery.toFixed(1)}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {data.weakCount > 0 && onViewWeak && (
            <button
              onClick={onViewWeak}
              className="flex items-center justify-between p-3 bg-red-50 rounded-lg text-red-700 hover:bg-red-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Target size={16} />
                <span className="font-medium">취약 단어</span>
              </div>
              <span className="font-bold">{data.weakCount}개</span>
            </button>
          )}
          {data.reviewDueCount > 0 && onViewReview && (
            <button
              onClick={onViewReview}
              className="flex items-center justify-between p-3 bg-amber-50 rounded-lg text-amber-700 hover:bg-amber-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <BookOpen size={16} />
                <span className="font-medium">복습 필요</span>
              </div>
              <span className="font-bold">{data.reviewDueCount}개</span>
            </button>
          )}
        </div>

        {/* Subject Stats */}
        {data.subjectStats && data.subjectStats.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">과목별 학습</h4>
            <div className="space-y-3">
              {data.subjectStats.map((subject) => {
                const percentage = subject.count > 0 
                  ? Math.round((subject.mastered / subject.count) * 100) 
                  : 0;
                return (
                  <button
                    key={subject.subjectId}
                    onClick={() => onViewSubject?.(subject.subjectId)}
                    className="w-full group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600">
                        {subject.subjectName}
                      </span>
                      <span className="text-sm text-gray-500">
                        {subject.mastered}/{subject.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: subject.color || '#6366f1',
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ========================================
// Mini Progress Badge
// ========================================

interface MiniProgressBadgeProps {
  masteryLevel: number; // 0-5
  showLabel?: boolean;
}

export function MiniProgressBadge({ masteryLevel, showLabel = true }: MiniProgressBadgeProps) {
  const colors = {
    0: 'bg-gray-200',
    1: 'bg-red-400',
    2: 'bg-orange-400',
    3: 'bg-yellow-400',
    4: 'bg-green-400',
    5: 'bg-emerald-500',
  };

  const labels = {
    0: '미학습',
    1: '시작',
    2: '학습중',
    3: '익숙함',
    4: '숙달',
    5: '완벽',
  };

  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${i < masteryLevel ? colors[masteryLevel as keyof typeof colors] : 'bg-gray-200'}`}
        />
      ))}
      {showLabel && (
        <span className="text-xs text-gray-500 ml-1">
          {labels[masteryLevel as keyof typeof labels]}
        </span>
      )}
    </div>
  );
}
