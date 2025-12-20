'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, TrendingUp, Target, Calendar, BookOpen, 
  AlertTriangle, Award, ChevronDown, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

// ========================================
// Types
// ========================================

interface ReportData {
  period: string;
  periodRange: { start: string; end: string };
  summary: {
    totalWords: number;
    avgMastery: number;
    masteredCount: number;
    weakCount: number;
    periodWordsLearned: number;
    quizzesTaken: number;
    accuracy: number;
  };
  subjectStats: Array<{
    subjectId: string;
    count: number;
    mastered: number;
    weak: number;
  }>;
  dailyStats: Array<{ date: string; count: number }>;
  weakWords: Array<{
    id: string;
    term: string;
    definition: string;
    masteryLevel: number;
    incorrectCount: number;
  }>;
}

interface WordReportDashboardProps {
  userId?: string; // 학부모가 자녀 조회 시
}

// ========================================
// Main Component
// ========================================

export default function WordReportDashboard({ userId }: WordReportDashboardProps) {
  const [report, setReport] = useState<ReportData | null>(null);
  const [period, setPeriod] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchReport() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ period });
        if (userId) params.append('userId', userId);
        
        const res = await fetch(`/api/words/reports?${params}`);
        if (res.ok) {
          const data = await res.json();
          setReport(data);
        }
      } catch (error) {
        console.error('Failed to fetch report:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReport();
  }, [period, userId]);

  // 일별 통계 최대값
  const maxDaily = useMemo(() => {
    if (!report?.dailyStats) return 1;
    return Math.max(...report.dailyStats.map(d => d.count), 1);
  }, [report?.dailyStats]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">리포트를 불러올 수 없습니다</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">단어 학습 리포트</h2>
          <p className="text-sm text-gray-500">
            {report.periodRange.start} ~ {report.periodRange.end}
          </p>
        </div>
        <div className="relative">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as typeof period)}
            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="DAILY">오늘</option>
            <option value="WEEKLY">이번 주</option>
            <option value="MONTHLY">이번 달</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="전체 단어"
          value={report.summary.totalWords}
          icon={<BookOpen className="text-indigo-600" />}
          trend={report.summary.periodWordsLearned > 0 ? 'up' : undefined}
          trendValue={`+${report.summary.periodWordsLearned}`}
        />
        <SummaryCard
          title="숙달 완료"
          value={report.summary.masteredCount}
          icon={<Award className="text-green-600" />}
          subtitle={`${Math.round((report.summary.masteredCount / Math.max(report.summary.totalWords, 1)) * 100)}%`}
        />
        <SummaryCard
          title="취약 단어"
          value={report.summary.weakCount}
          icon={<AlertTriangle className="text-orange-600" />}
          variant="warning"
        />
        <SummaryCard
          title="퀴즈 정답률"
          value={`${report.summary.accuracy}%`}
          icon={<Target className="text-blue-600" />}
          subtitle={`${report.summary.quizzesTaken}회 응시`}
        />
      </div>

      {/* Daily Activity Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar size={20} className="text-indigo-600" />
          일별 학습량
        </h3>
        <div className="flex items-end justify-between gap-2 h-32">
          {report.dailyStats.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div 
                className="w-full bg-indigo-100 rounded-t transition-all hover:bg-indigo-200"
                style={{ 
                  height: `${(day.count / maxDaily) * 100}%`,
                  minHeight: day.count > 0 ? '4px' : '0',
                }}
              >
                {day.count > 0 && (
                  <div className="w-full bg-indigo-500 rounded-t" style={{ height: '100%' }} />
                )}
              </div>
              <span className="text-xs text-gray-500">{day.date}</span>
              <span className="text-xs font-medium text-gray-700">{day.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mastery Distribution */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-indigo-600" />
          숙달도 현황
        </h3>
        <div className="space-y-3">
          <MasteryBar 
            label="숙달 완료" 
            count={report.summary.masteredCount} 
            total={report.summary.totalWords}
            color="bg-green-500" 
          />
          <MasteryBar 
            label="학습 중" 
            count={report.summary.totalWords - report.summary.masteredCount - report.summary.weakCount} 
            total={report.summary.totalWords}
            color="bg-blue-500" 
          />
          <MasteryBar 
            label="취약" 
            count={report.summary.weakCount} 
            total={report.summary.totalWords}
            color="bg-orange-500" 
          />
        </div>
      </div>

      {/* Weak Words */}
      {report.weakWords.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-orange-600" />
            복습이 필요한 단어
          </h3>
          <div className="space-y-3">
            {report.weakWords.slice(0, 5).map((word) => (
              <a
                key={word.id}
                href={`/words/${word.id}`}
                className="block p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-gray-900">{word.term}</span>
                    <p className="text-sm text-gray-600 line-clamp-1">{word.definition}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-orange-600 font-medium">
                      숙달도 {word.masteryLevel}/5
                    </div>
                    <div className="text-xs text-gray-500">
                      오답 {word.incorrectCount}회
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
          {report.weakWords.length > 5 && (
            <a 
              href="/my/words?tab=weak"
              className="block mt-4 text-center text-sm text-indigo-600 hover:underline"
            >
              전체 {report.weakWords.length}개 보기 →
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ========================================
// Sub Components
// ========================================

interface SummaryCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  subtitle?: string;
  trend?: 'up' | 'down';
  trendValue?: string;
  variant?: 'default' | 'warning';
}

function SummaryCard({ title, value, icon, subtitle, trend, trendValue, variant = 'default' }: SummaryCardProps) {
  return (
    <div className={`
      p-4 rounded-xl border
      ${variant === 'warning' ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'}
    `}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{title}</span>
        {icon}
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {trend && trendValue && (
          <span className={`flex items-center text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trendValue}
          </span>
        )}
        {subtitle && !trend && (
          <span className="text-sm text-gray-500">{subtitle}</span>
        )}
      </div>
    </div>
  );
}

interface MasteryBarProps {
  label: string;
  count: number;
  total: number;
  color: string;
}

function MasteryBar({ label, count, total, color }: MasteryBarProps) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">{count}개 ({percentage}%)</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
