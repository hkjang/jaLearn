'use client';

/**
 * Daily Challenge Page (오늘의 문제)
 * 매일 맞춤형 5문제 제공
 */

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  Flame, Trophy, Target, CheckCircle, XCircle, 
  ChevronRight, Sparkles, Shield, Star 
} from 'lucide-react';

interface Problem {
  id: string;
  title: string | null;
  content: string;
  type: string;
  difficulty: string;
  subject: { displayName: string };
  unit: { name: string } | null;
}

interface DailyChallengeData {
  id: string;
  date: string;
  problems: Problem[];
  completedIds: string[];
  totalScore: number;
  isCompleted: boolean;
  progress: {
    completed: number;
    total: number;
  };
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  freezeCount: number;
  isActiveToday: boolean;
  isStreakAtRisk: boolean;
}

interface LevelData {
  level: number;
  experience: number;
  nextLevelExp: number;
  experiencePercent: number;
  rank: string;
  rankInfo: { name: string; color: string };
}

export default function DailyChallengePage() {
  const { data: session, status } = useSession();
  const [challenge, setChallenge] = useState<DailyChallengeData | null>(null);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [level, setLevel] = useState<LevelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      loadData();
    }
  }, [session]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [challengeRes, streakRes, levelRes] = await Promise.all([
        fetch('/api/daily-challenge'),
        fetch('/api/streak'),
        fetch('/api/level'),
      ]);

      if (challengeRes.ok) {
        setChallenge(await challengeRes.json());
      }
      if (streakRes.ok) {
        setStreak(await streakRes.json());
      }
      if (levelRes.ok) {
        setLevel(await levelRes.json());
      }
    } catch (err) {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const useStreakFreeze = async () => {
    try {
      const res = await fetch('/api/streak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'use_freeze' }),
      });
      
      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error('Streak freeze error:', err);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <Sparkles className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            오늘의 문제에 도전하세요!
          </h1>
          <p className="text-gray-600 mb-6">
            로그인하면 나만을 위한 맞춤 문제 5개가 제공됩니다.
            매일 풀면 스트릭이 쌓여요!
          </p>
          <Link
            href="/login"
            className="inline-block w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all"
          >
            로그인하고 시작하기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Target className="h-8 w-8" />
            오늘의 문제
          </h1>
          <p className="text-orange-100 mt-2">
            매일 5문제로 실력을 키워보세요!
          </p>
        </div>
      </div>

      {/* 스탯 카드들 */}
      <div className="container mx-auto px-4 -mt-6">
        <div className="grid grid-cols-3 gap-4">
          {/* 스트릭 */}
          <div className="bg-white rounded-xl shadow-lg p-4 text-center">
            <Flame className="h-8 w-8 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {streak?.currentStreak || 0}
            </div>
            <div className="text-sm text-gray-500">연속 학습일</div>
            {streak?.isStreakAtRisk && streak.freezeCount > 0 && (
              <button
                onClick={useStreakFreeze}
                className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mx-auto"
              >
                <Shield className="h-3 w-3" />
                보호권 사용 ({streak.freezeCount}개)
              </button>
            )}
          </div>

          {/* 레벨 */}
          <div className="bg-white rounded-xl shadow-lg p-4 text-center">
            <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              Lv.{level?.level || 1}
            </div>
            <div className="text-sm text-gray-500">
              {level?.rankInfo?.name || '브론즈'}
            </div>
            {level && (
              <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-full transition-all"
                  style={{ width: `${level.experiencePercent}%` }}
                />
              </div>
            )}
          </div>

          {/* 오늘 점수 */}
          <div className="bg-white rounded-xl shadow-lg p-4 text-center">
            <Star className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {challenge?.totalScore || 0}
            </div>
            <div className="text-sm text-gray-500">오늘 점수</div>
          </div>
        </div>
      </div>

      {/* 진행 상황 */}
      <div className="container mx-auto px-4 mt-8">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">오늘의 진행</h2>
            <span className="text-sm text-gray-500">
              {challenge?.progress.completed || 0} / {challenge?.progress.total || 5}
            </span>
          </div>
          <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-400 to-emerald-500 h-full transition-all"
              style={{
                width: `${challenge ? (challenge.progress.completed / challenge.progress.total) * 100 : 0}%`,
              }}
            />
          </div>
          {challenge?.isCompleted && (
            <div className="mt-4 flex items-center gap-2 text-green-600 font-medium">
              <CheckCircle className="h-5 w-5" />
              오늘의 문제를 모두 완료했어요! 🎉
            </div>
          )}
        </div>
      </div>

      {/* 문제 목록 */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          {challenge?.problems.map((problem, index) => {
            const isCompleted = challenge.completedIds.includes(problem.id);
            const diffColor =
              problem.difficulty === 'LOW'
                ? 'bg-green-100 text-green-700'
                : problem.difficulty === 'MEDIUM'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700';

            return (
              <Link
                key={problem.id}
                href={`/problems/middle-1/${problem.subject.displayName.toLowerCase()}/${problem.unit?.name || 'general'}/${problem.id}`}
                className={`block bg-white rounded-xl shadow p-6 transition-all hover:shadow-lg ${
                  isCompleted ? 'opacity-70' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="h-5 w-5" /> : index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${diffColor}`}>
                        {problem.difficulty === 'LOW'
                          ? '쉬움'
                          : problem.difficulty === 'MEDIUM'
                          ? '보통'
                          : '어려움'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {problem.subject.displayName}
                      </span>
                    </div>
                    <p className="text-gray-900 font-medium line-clamp-2">
                      {problem.title || problem.content.substring(0, 100)}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>

        {(!challenge || challenge.problems.length === 0) && !loading && (
          <div className="text-center py-12">
            <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              오늘의 문제를 준비 중입니다...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
