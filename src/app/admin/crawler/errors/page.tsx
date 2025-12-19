"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  RotateCcw,
  Filter,
} from "lucide-react";

interface ErrorItem {
  id: string;
  jobId: string;
  level: string;
  action: string;
  message: string;
  details: string | null;
  url: string | null;
  createdAt: string;
  job: {
    id: string;
    status: string;
    source: { name: string };
  };
}

interface ErrorStats {
  total: number;
  byAction: Record<string, number>;
  bySource: Record<string, number>;
}

const actionLabels: Record<string, { label: string; color: string }> = {
  FETCH: { label: '페이지 접근', color: 'bg-blue-100 text-blue-800' },
  DOWNLOAD: { label: '다운로드', color: 'bg-purple-100 text-purple-800' },
  OCR: { label: 'OCR 처리', color: 'bg-orange-100 text-orange-800' },
  PARSE: { label: '파싱', color: 'bg-yellow-100 text-yellow-800' },
  IMPORT: { label: '저장', color: 'bg-red-100 text-red-800' },
};

export default function CrawlerErrorsPage() {
  const [errors, setErrors] = useState<ErrorItem[]>([]);
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    action: '',
    source: '',
  });

  const fetchErrors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        level: 'ERROR',
        limit: '100',
      });
      if (filter.action) params.append('action', filter.action);

      const res = await fetch(`/api/crawler/logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setErrors(data.logs || []);
        
        // 통계 계산
        const stats: ErrorStats = {
          total: data.logs.length,
          byAction: {},
          bySource: {},
        };
        
        data.logs.forEach((err: ErrorItem) => {
          stats.byAction[err.action] = (stats.byAction[err.action] || 0) + 1;
          const sourceName = err.job?.source?.name || 'Unknown';
          stats.bySource[sourceName] = (stats.bySource[sourceName] || 0) + 1;
        });
        
        setStats(stats);
      }
    } catch (error) {
      console.error("Failed to fetch errors:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchErrors();
  }, [filter]);

  const handleRetry = async (jobId: string) => {
    setProcessing(jobId);
    try {
      // 재시도 API 호출 (기존 jobs API 사용)
      const res = await fetch('/api/crawler/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, action: 'retry' }),
      });
      
      if (res.ok) {
        alert('재시도 작업이 시작되었습니다');
        fetchErrors();
      }
    } catch (error) {
      console.error("Retry failed:", error);
    } finally {
      setProcessing(null);
    }
  };

  const handleDismiss = async (logId: string) => {
    // 오류를 무시 처리 (로그에서 제거하지 않고 표시만 변경)
    setErrors(errors.filter(e => e.id !== logId));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/crawler/dashboard" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              오류 관리
            </h1>
            <p className="text-gray-600 dark:text-gray-400">수집 오류 확인 및 재처리</p>
          </div>
        </div>
        <button
          onClick={fetchErrors}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border p-4">
            <p className="text-sm text-gray-500">전체 오류</p>
            <p className="text-2xl font-bold text-red-600">{stats.total}</p>
          </div>
          {Object.entries(stats.byAction).slice(0, 3).map(([action, count]) => (
            <div key={action} className="bg-white dark:bg-gray-800 rounded-xl border p-4">
              <p className="text-sm text-gray-500">{actionLabels[action]?.label || action}</p>
              <p className="text-2xl font-bold">{count}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-4 mb-4 p-4 bg-white dark:bg-gray-800 rounded-xl border">
        <Filter className="h-4 w-4 text-gray-500" />
        <select
          value={filter.action}
          onChange={(e) => setFilter({ ...filter, action: e.target.value })}
          className="px-3 py-1.5 border rounded-lg text-sm bg-white dark:bg-gray-700"
        >
          <option value="">모든 유형</option>
          <option value="FETCH">페이지 접근 오류</option>
          <option value="DOWNLOAD">다운로드 오류</option>
          <option value="OCR">OCR 오류</option>
          <option value="PARSE">파싱 오류</option>
          <option value="IMPORT">저장 오류</option>
        </select>
        {filter.action && (
          <button
            onClick={() => setFilter({ action: '', source: '' })}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            필터 초기화
          </button>
        )}
      </div>

      {/* Error List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : errors.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border shadow-sm overflow-hidden">
          <div className="divide-y">
            {errors.map((error) => (
              <div key={error.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-xs rounded ${actionLabels[error.action]?.color || 'bg-gray-100'}`}>
                        {actionLabels[error.action]?.label || error.action}
                      </span>
                      <span className="text-sm text-gray-500">
                        {error.job?.source?.name || 'Unknown'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(error.createdAt).toLocaleString('ko-KR')}
                      </span>
                    </div>
                    <p className="text-red-600 dark:text-red-400 font-medium mb-1">
                      {error.message}
                    </p>
                    {error.url && (
                      <p className="text-xs text-gray-500 truncate max-w-[500px]">
                        {error.url}
                      </p>
                    )}
                    {error.details && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                          상세 정보 보기
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-x-auto">
                          {error.details}
                        </pre>
                      </details>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <button
                      onClick={() => handleRetry(error.jobId)}
                      disabled={processing === error.jobId}
                      className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg disabled:opacity-50"
                      title="재시도"
                    >
                      {processing === error.jobId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDismiss(error.id)}
                      className="p-2 hover:bg-gray-100 text-gray-500 rounded-lg"
                      title="무시"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border p-12 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">오류가 없습니다</h3>
          <p className="text-gray-500">모든 수집 작업이 정상적으로 완료되었습니다</p>
        </div>
      )}

      {/* AI Suggestion */}
      {errors.length > 0 && stats && (
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 p-4">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
            🤖 AI 보정 제안
          </h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            {Object.entries(stats.byAction).map(([action, count]) => {
              if (action === 'FETCH' && count > 5) {
                return <li key={action}>• 페이지 접근 오류가 많습니다. 크롤링 딜레이를 늘려보세요.</li>;
              }
              if (action === 'OCR' && count > 3) {
                return <li key={action}>• OCR 오류가 반복됩니다. 이미지 품질 확인이 필요합니다.</li>;
              }
              if (action === 'PARSE' && count > 3) {
                return <li key={action}>• 파싱 오류가 많습니다. 문서 형식 검토가 필요합니다.</li>;
              }
              return null;
            })}
            {stats.total > 20 && (
              <li>• 오류가 많이 누적되었습니다. 소스 설정을 재검토하세요.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
