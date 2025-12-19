"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3,
  FileQuestion,
  CheckCircle,
  Clock,
  XCircle,
  Archive,
  AlertTriangle,
  TrendingUp,
  Shield,
  Book,
  Calendar,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

interface DashboardStats {
  overview: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    archived: number;
  };
  sourceGrades: Record<string, number>;
  quality: {
    average: number;
    min: number;
    max: number;
    scored: number;
  };
  copyrightAlerts: {
    expiring: { id: string; sourceName: string; endDate: string; daysLeft: number }[];
    expired: { id: string; sourceName: string; endDate: string }[];
  };
  reviewStages: Record<string, number>;
  recentProblems: { id: string; title: string; subject: string; status: string; createdAt: string }[];
  subjectDistribution: { subject: string; count: number }[];
}

const gradeColors: Record<string, string> = {
  A: "bg-green-500",
  B: "bg-blue-500",
  C: "bg-yellow-500",
  D: "bg-orange-500",
  E: "bg-red-500",
};

const gradeLabels: Record<string, string> = {
  A: "공공 자료",
  B: "학교/교사",
  C: "학원",
  D: "사용자 제출",
  E: "참고용",
};

export default function ProblemDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/admin/problems/dashboard");
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-500">데이터를 불러올 수 없습니다.</div>
      </div>
    );
  }

  const totalGrades = Object.values(stats.sourceGrades).reduce((a, b) => a + b, 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-indigo-600" />
            문제 은행 대시보드
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            문제 수집 현황 및 품질 관리
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 rounded-lg"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          새로고침
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <FileQuestion className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">전체</p>
              <p className="text-2xl font-bold">{stats.overview.total.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">승인됨</p>
              <p className="text-2xl font-bold text-green-600">{stats.overview.approved.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">대기중</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.overview.pending.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">거부됨</p>
              <p className="text-2xl font-bold text-red-600">{stats.overview.rejected.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <Archive className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">보관됨</p>
              <p className="text-2xl font-bold text-gray-600">{stats.overview.archived.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Copyright Alerts */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            저작권 경고
          </h3>
          {stats.copyrightAlerts.expired.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                만료된 계약 {stats.copyrightAlerts.expired.length}건
              </p>
              {stats.copyrightAlerts.expired.slice(0, 3).map((c) => (
                <p key={c.id} className="text-xs text-red-600 dark:text-red-300 mt-1">
                  • {c.sourceName}
                </p>
              ))}
            </div>
          )}
          {stats.copyrightAlerts.expiring.length > 0 ? (
            <div className="space-y-2">
              {stats.copyrightAlerts.expiring.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{c.sourceName}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    c.daysLeft <= 7 ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {c.daysLeft}일 후 만료
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">만료 예정 계약 없음</p>
          )}
          <Link
            href="/admin/problem-sources"
            className="mt-4 flex items-center gap-1 text-sm text-indigo-600 hover:underline"
          >
            출처 관리 <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Quality Score */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            품질 점수
          </h3>
          <div className="text-center mb-4">
            <p className="text-4xl font-bold text-indigo-600">
              {stats.quality.average.toFixed(1)}
            </p>
            <p className="text-sm text-gray-500">평균 품질 점수</p>
          </div>
          <div className="grid grid-cols-3 text-center text-sm">
            <div>
              <p className="font-medium">{stats.quality.min.toFixed(0)}</p>
              <p className="text-gray-500">최저</p>
            </div>
            <div>
              <p className="font-medium">{stats.quality.scored}</p>
              <p className="text-gray-500">평가된 문제</p>
            </div>
            <div>
              <p className="font-medium">{stats.quality.max.toFixed(0)}</p>
              <p className="text-gray-500">최고</p>
            </div>
          </div>
        </div>

        {/* Source Grades */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-500" />
            출처 등급 분포
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.sourceGrades).map(([grade, count]) => (
              <div key={grade} className="flex items-center gap-3">
                <span className={`w-8 h-8 flex items-center justify-center text-white text-sm font-bold rounded ${gradeColors[grade]}`}>
                  {grade}
                </span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{gradeLabels[grade]}</span>
                    <span>{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${gradeColors[grade]}`}
                      style={{ width: `${totalGrades > 0 ? (count / totalGrades) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Book className="h-5 w-5 text-purple-500" />
            과목별 분포
          </h3>
          <div className="space-y-3">
            {stats.subjectDistribution.slice(0, 5).map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <span>{s.subject}</span>
                <span className="font-medium">{s.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Problems */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-teal-500" />
            최근 등록된 문제
          </h3>
          <div className="space-y-3">
            {stats.recentProblems.map((p) => (
              <Link
                key={p.id}
                href={`/admin/problems/${p.id}`}
                className="flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg -mx-2"
              >
                <div className="truncate flex-1">
                  <p className="text-sm font-medium truncate">{p.title}</p>
                  <p className="text-xs text-gray-500">{p.subject}</p>
                </div>
                <span className={`px-2 py-0.5 text-xs rounded ${
                  p.status === "APPROVED" ? "bg-green-100 text-green-800" :
                  p.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                  "bg-gray-100 text-gray-800"
                }`}>
                  {p.status}
                </span>
              </Link>
            ))}
          </div>
          <Link
            href="/admin/problems"
            className="mt-4 flex items-center gap-1 text-sm text-indigo-600 hover:underline"
          >
            전체 문제 <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          href="/admin/problems/new"
          className="flex items-center gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-xl"
        >
          <FileQuestion className="h-5 w-5 text-indigo-600" />
          <span className="font-medium">문제 등록</span>
        </Link>
        <Link
          href="/admin/problems/upload"
          className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-xl"
        >
          <Archive className="h-5 w-5 text-green-600" />
          <span className="font-medium">대량 업로드</span>
        </Link>
        <Link
          href="/admin/problems/review"
          className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded-xl"
        >
          <Clock className="h-5 w-5 text-yellow-600" />
          <span className="font-medium">검수 대기열</span>
        </Link>
        <Link
          href="/admin/problem-sources"
          className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-xl"
        >
          <Shield className="h-5 w-5 text-purple-600" />
          <span className="font-medium">출처 관리</span>
        </Link>
      </div>
    </div>
  );
}
