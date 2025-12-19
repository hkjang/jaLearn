"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  Activity,
  AlertCircle,
  CheckCircle,
  Info,
  Bug,
  Filter,
  Pause,
  Play,
  Download,
  Trash2,
} from "lucide-react";

interface LogEntry {
  id: string;
  jobId: string;
  level: string;
  action: string;
  message: string;
  details: string | null;
  url: string | null;
  createdAt: string;
  job?: {
    source: { name: string };
  };
}

const levelConfig: Record<string, { color: string; bgColor: string; icon: React.ReactNode }> = {
  DEBUG: { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: <Bug className="h-3 w-3" /> },
  INFO: { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: <Info className="h-3 w-3" /> },
  WARN: { color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: <AlertCircle className="h-3 w-3" /> },
  ERROR: { color: 'text-red-600', bgColor: 'bg-red-100', icon: <AlertCircle className="h-3 w-3" /> },
};

const actionLabels: Record<string, string> = {
  FETCH: '페이지 접근',
  DOWNLOAD: '파일 다운로드',
  OCR: 'OCR 처리',
  PARSE: '문제 파싱',
  IMPORT: '데이터 저장',
};

export default function CrawlerLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState({
    level: '',
    action: '',
    jobId: '',
  });
  const [page, setPage] = useState(1);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '100',
      });
      if (filter.level) params.append('level', filter.level);
      if (filter.action) params.append('action', filter.action);
      if (filter.jobId) params.append('jobId', filter.jobId);

      const res = await fetch(`/api/crawler/logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, filter]);

  useEffect(() => {
    if (autoScroll && logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // 자동 새로고침 (5초마다)
  useEffect(() => {
    if (autoScroll) {
      const interval = setInterval(fetchLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [autoScroll, filter]);

  const clearFilters = () => {
    setFilter({ level: '', action: '', jobId: '' });
  };

  const exportLogs = () => {
    const content = logs.map(log => 
      `[${new Date(log.createdAt).toISOString()}] [${log.level}] [${log.action}] ${log.message}`
    ).join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crawler-logs-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/crawler/dashboard" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Activity className="h-6 w-6 text-indigo-600" />
              실시간 수집 로그
            </h1>
            <p className="text-gray-600 dark:text-gray-400">크롤링 작업 상세 로그</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg ${
              autoScroll ? 'bg-green-50 border-green-200 text-green-700' : ''
            }`}
          >
            {autoScroll ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {autoScroll ? '자동갱신 중' : '자동갱신'}
          </button>
          <button
            onClick={exportLogs}
            className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            내보내기
          </button>
          <button
            onClick={fetchLogs}
            className="p-2 border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-4 p-4 bg-white dark:bg-gray-800 rounded-xl border">
        <Filter className="h-4 w-4 text-gray-500" />
        <select
          value={filter.level}
          onChange={(e) => setFilter({ ...filter, level: e.target.value })}
          className="px-3 py-1.5 border rounded-lg text-sm bg-white dark:bg-gray-700"
        >
          <option value="">모든 레벨</option>
          <option value="DEBUG">DEBUG</option>
          <option value="INFO">INFO</option>
          <option value="WARN">WARN</option>
          <option value="ERROR">ERROR</option>
        </select>
        <select
          value={filter.action}
          onChange={(e) => setFilter({ ...filter, action: e.target.value })}
          className="px-3 py-1.5 border rounded-lg text-sm bg-white dark:bg-gray-700"
        >
          <option value="">모든 작업</option>
          <option value="FETCH">페이지 접근</option>
          <option value="DOWNLOAD">파일 다운로드</option>
          <option value="OCR">OCR 처리</option>
          <option value="PARSE">문제 파싱</option>
          <option value="IMPORT">데이터 저장</option>
        </select>
        {(filter.level || filter.action || filter.jobId) && (
          <button
            onClick={clearFilters}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
          >
            필터 초기화
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-gray-500">{logs.length}개 로그</span>
          {autoScroll && (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              실시간
            </span>
          )}
        </div>
      </div>

      {/* Logs */}
      <div 
        ref={logsContainerRef}
        className="bg-gray-900 rounded-xl border overflow-hidden h-[calc(100%-220px)]"
      >
        <div className="overflow-y-auto h-full p-4 font-mono text-sm">
          {loading && logs.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : logs.length > 0 ? (
            <div className="space-y-1">
              {logs.map((log) => (
                <LogLine key={log.id} log={log} />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Activity className="h-8 w-8 mx-auto mb-2" />
                <p>로그가 없습니다</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LogLine({ log }: { log: LogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const config = levelConfig[log.level] || levelConfig.INFO;
  const time = new Date(log.createdAt).toLocaleTimeString('ko-KR', { hour12: false });

  return (
    <div 
      className={`group hover:bg-gray-800/50 rounded px-2 py-1 cursor-pointer ${
        log.level === 'ERROR' ? 'bg-red-900/20' : ''
      }`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-2">
        <span className="text-gray-500 shrink-0">{time}</span>
        <span className={`${config.bgColor} ${config.color} px-1.5 py-0.5 rounded text-xs font-bold shrink-0`}>
          {log.level}
        </span>
        <span className="text-purple-400 shrink-0">[{actionLabels[log.action] || log.action}]</span>
        <span className={`text-gray-300 ${log.level === 'ERROR' ? 'text-red-400' : ''}`}>
          {log.message}
        </span>
        {log.url && (
          <span className="text-blue-400 text-xs truncate max-w-[300px]">
            {log.url}
          </span>
        )}
      </div>
      {expanded && log.details && (
        <div className="mt-2 ml-20 p-2 bg-gray-800 rounded text-xs text-gray-400 whitespace-pre-wrap">
          {log.details}
        </div>
      )}
    </div>
  );
}
