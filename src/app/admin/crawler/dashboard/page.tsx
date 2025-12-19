"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  RefreshCw,
  Loader2,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Eye,
  AlertTriangle,
  Activity,
  BarChart3,
  Globe,
} from "lucide-react";

interface DashboardData {
  kpi: {
    todayItems: number;
    todayProblems: number;
    successRate: number;
    avgOcrAccuracy: number;
    pendingReview: number;
    runningJobs: number;
  };
  topErrors: Array<{ type: string; count: number }>;
  sourceStats: Array<{
    id: string;
    name: string;
    type: string;
    grade: string;
    isActive: boolean;
    itemCount: number;
    jobCount: number;
    status: 'normal' | 'warning' | 'blocked';
  }>;
  runningJobs: Array<{
    id: string;
    status: string;
    pagesVisited: number;
    filesSaved: number;
    source: { name: string };
  }>;
  recentJobs: Array<{
    id: string;
    status: string;
    completedAt: string | null;
    pagesVisited: number;
    filesSaved: number;
    problemsExtracted: number;
    source: { name: string };
  }>;
}

const errorTypeLabels: Record<string, string> = {
  FETCH: '페이지 접근 오류',
  DOWNLOAD: '파일 다운로드 오류',
  OCR: 'OCR 처리 오류',
  PARSE: '파싱 오류',
  IMPORT: '저장 오류',
  UNKNOWN: '기타 오류',
};

const statusColors: Record<string, string> = {
  normal: 'bg-green-500',
  warning: 'bg-yellow-500',
  blocked: 'bg-red-500',
};

const gradeColors: Record<string, string> = {
  A: 'bg-green-500 text-white',
  B: 'bg-blue-500 text-white',
  C: 'bg-yellow-500 text-black',
  D: 'bg-orange-500 text-white',
  E: 'bg-red-500 text-white',
};

export default function CrawlerDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/crawler/dashboard");
      if (res.ok) {
        setData(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // 30초마다 자동 새로고침
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-500">데이터를 불러올 수 없습니다</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/crawler" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-indigo-600" />
              수집 대시보드
            </h1>
            <p className="text-gray-600 dark:text-gray-400">실시간 수집 현황 및 통계</p>
          </div>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <KpiCard
          title="오늘 수집 항목"
          value={data.kpi.todayItems}
          icon={<Download className="h-5 w-5 text-blue-500" />}
          color="blue"
        />
        <KpiCard
          title="추출된 문제"
          value={data.kpi.todayProblems}
          icon={<FileText className="h-5 w-5 text-green-500" />}
          color="green"
        />
        <KpiCard
          title="성공률"
          value={`${data.kpi.successRate}%`}
          icon={<TrendingUp className="h-5 w-5 text-indigo-500" />}
          color="indigo"
        />
        <KpiCard
          title="OCR 정확도"
          value={`${data.kpi.avgOcrAccuracy}%`}
          icon={<Eye className="h-5 w-5 text-purple-500" />}
          color="purple"
        />
        <KpiCard
          title="검수 대기"
          value={data.kpi.pendingReview}
          icon={<Clock className="h-5 w-5 text-yellow-500" />}
          color="yellow"
          href="/admin/crawler/review"
        />
        <KpiCard
          title="실행 중"
          value={data.kpi.runningJobs}
          icon={<Activity className="h-5 w-5 text-red-500" />}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* 소스별 상태 */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border shadow-sm">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4" />
              수집 소스 상태
            </h3>
            <Link href="/admin/crawler" className="text-sm text-indigo-600 hover:underline">
              관리 →
            </Link>
          </div>
          <div className="divide-y max-h-[300px] overflow-y-auto">
            {data.sourceStats.map((source) => (
              <div key={source.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${statusColors[source.status]}`} />
                  <span className={`px-2 py-0.5 text-xs font-bold rounded ${gradeColors[source.grade]}`}>
                    {source.grade}
                  </span>
                  <div>
                    <p className="font-medium">{source.name}</p>
                    <p className="text-xs text-gray-500">{source.type}</p>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p className="text-gray-600">{source.itemCount}개 수집</p>
                  <p className="text-xs text-gray-400">{source.jobCount}회 실행</p>
                </div>
              </div>
            ))}
            {data.sourceStats.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                등록된 소스가 없습니다
              </div>
            )}
          </div>
        </div>

        {/* 최근 오류 TOP 5 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border shadow-sm">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              최근 오류 현황
            </h3>
            <Link href="/admin/crawler/errors" className="text-sm text-indigo-600 hover:underline">
              전체 →
            </Link>
          </div>
          <div className="p-4">
            {data.topErrors.length > 0 ? (
              <div className="space-y-3">
                {data.topErrors.map((error, idx) => (
                  <div key={error.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">{idx + 1}</span>
                      <span className="text-sm">{errorTypeLabels[error.type] || error.type}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">
                      {error.count}건
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">최근 오류 없음</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 실행 중인 작업 */}
      {data.runningJobs.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border p-4 mb-8">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            실행 중인 작업
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.runningJobs.map((job) => (
              <div key={job.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <p className="font-medium">{job.source.name}</p>
                <div className="flex gap-4 mt-2 text-sm text-gray-500">
                  <span>페이지: {job.pagesVisited}</span>
                  <span>파일: {job.filesSaved}</span>
                </div>
                <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 animate-pulse" style={{ width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 최근 작업 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border shadow-sm">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">최근 작업 이력</h3>
          <Link href="/admin/crawler/logs" className="text-sm text-indigo-600 hover:underline">
            전체 로그 →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 text-sm">
              <tr>
                <th className="text-left px-4 py-3">소스</th>
                <th className="text-left px-4 py-3">상태</th>
                <th className="text-right px-4 py-3">페이지</th>
                <th className="text-right px-4 py-3">파일</th>
                <th className="text-right px-4 py-3">문제</th>
                <th className="text-left px-4 py-3">완료</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.recentJobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 font-medium">{job.source.name}</td>
                  <td className="px-4 py-3">
                    <JobStatusBadge status={job.status} />
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{job.pagesVisited}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{job.filesSaved}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{job.problemsExtracted}</td>
                  <td className="px-4 py-3 text-gray-500 text-sm">
                    {job.completedAt ? new Date(job.completedAt).toLocaleString('ko-KR') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// KPI Card Component
function KpiCard({
  title,
  value,
  icon,
  color,
  href,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  href?: string;
}) {
  const Content = (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-4 border shadow-sm hover:shadow-md transition-shadow ${href ? 'cursor-pointer' : ''}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-${color}-100 dark:bg-${color}-900/30`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-500">{title}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{Content}</Link>;
  }
  return Content;
}

// Job Status Badge
function JobStatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; icon: React.ReactNode }> = {
    PENDING: { color: 'bg-gray-100 text-gray-800', icon: <Clock className="h-3 w-3" /> },
    RUNNING: { color: 'bg-blue-100 text-blue-800', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
    COMPLETED: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3" /> },
    FAILED: { color: 'bg-red-100 text-red-800', icon: <XCircle className="h-3 w-3" /> },
  };

  const { color, icon } = config[status] || config.PENDING;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${color}`}>
      {icon}
      {status}
    </span>
  );
}
