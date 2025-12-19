"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Play,
  Square,
  Plus,
  Loader2,
  Globe,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Trash2,
  ExternalLink,
} from "lucide-react";

interface CollectionSource {
  id: string;
  name: string;
  type: string;
  baseUrl: string;
  description: string | null;
  grade: string;
  isActive: boolean;
  lastCrawledAt: string | null;
  _count: { jobs: number; items: number };
}

interface CrawlJob {
  id: string;
  sourceId: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  pagesVisited: number;
  filesFound: number;
  filesSaved: number;
  problemsExtracted: number;
  errorCount: number;
  source: { id: string; name: string; type: string };
}

const typeLabels: Record<string, string> = {
  KICE: "평가원",
  EDU_OFFICE: "교육청",
  COMMUNITY: "커뮤니티",
  API: "API",
  OTHER: "기타",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-800",
  RUNNING: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  CANCELLED: "bg-yellow-100 text-yellow-800",
};

const gradeColors: Record<string, string> = {
  A: "bg-green-500",
  B: "bg-blue-500",
  C: "bg-yellow-500",
  D: "bg-orange-500",
  E: "bg-red-500",
};

export default function CrawlerDashboardPage() {
  const [sources, setSources] = useState<CollectionSource[]>([]);
  const [jobs, setJobs] = useState<CrawlJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "KICE",
    baseUrl: "",
    description: "",
    grade: "D",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sourcesRes, jobsRes] = await Promise.all([
        fetch("/api/crawler/sources"),
        fetch("/api/crawler/jobs"),
      ]);
      
      if (sourcesRes.ok) setSources(await sourcesRes.json());
      if (jobsRes.ok) setJobs(await jobsRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/crawler/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowAddForm(false);
        setFormData({ name: "", type: "KICE", baseUrl: "", description: "", grade: "D" });
        fetchData();
      }
    } catch (error) {
      console.error("Error adding source:", error);
    }
  };

  const handleStartJob = async (sourceId: string) => {
    try {
      const res = await fetch("/api/crawler/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error starting job:", error);
    }
  };

  const handleDeleteSource = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await fetch(`/api/crawler/sources?id=${id}`, { method: "DELETE" });
      fetchData();
    } catch (error) {
      console.error("Error deleting source:", error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">로딩 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Download className="h-6 w-6 text-indigo-600" />
              문제 자동 수집
            </h1>
            <p className="text-gray-600 dark:text-gray-400">KICE, 교육청 등 공개 자료 크롤링</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            수집 소스 추가
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500">수집 소스</p>
              <p className="text-2xl font-bold">{sources.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-sm text-gray-500">실행 중</p>
              <p className="text-2xl font-bold">{jobs.filter(j => j.status === "RUNNING").length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm text-gray-500">수집된 파일</p>
              <p className="text-2xl font-bold">
                {sources.reduce((sum, s) => sum + s._count.items, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-sm text-gray-500">완료된 작업</p>
              <p className="text-2xl font-bold">{jobs.filter(j => j.status === "COMPLETED").length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Source Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border mb-6">
          <h3 className="font-semibold mb-4">새 수집 소스 등록</h3>
          <form onSubmit={handleAddSource} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">이름 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700"
                placeholder="예: KICE 수능기출"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">유형 *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="KICE">평가원 (KICE)</option>
                <option value="EDU_OFFICE">교육청</option>
                <option value="COMMUNITY">커뮤니티</option>
                <option value="API">API</option>
                <option value="OTHER">기타</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">URL *</label>
              <input
                type="url"
                value={formData.baseUrl}
                onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700"
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">신뢰 등급</label>
              <select
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="A">A - 공공 자료</option>
                <option value="B">B - 학교/교사</option>
                <option value="C">C - 학원</option>
                <option value="D">D - 사용자 제출</option>
                <option value="E">E - 참고용</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">설명</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border rounded-lg"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                저장
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sources */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border">
          <div className="p-4 border-b">
            <h3 className="font-semibold">수집 소스</h3>
          </div>
          <div className="divide-y">
            {sources.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                등록된 소스가 없습니다
              </div>
            ) : (
              sources.map((source) => (
                <div key={source.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className={`w-8 h-8 flex items-center justify-center text-white text-xs font-bold rounded ${gradeColors[source.grade]}`}>
                        {source.grade}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{source.name}</span>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                            {typeLabels[source.type]}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate max-w-[200px]">
                          {source.baseUrl}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {source._count.items}개 파일 수집됨
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartJob(source.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="크롤링 시작"
                      >
                        <Play className="h-4 w-4 text-green-600" />
                      </button>
                      <a
                        href={source.baseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => handleDeleteSource(source.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border">
          <div className="p-4 border-b">
            <h3 className="font-semibold">최근 작업</h3>
          </div>
          <div className="divide-y">
            {jobs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                실행된 작업이 없습니다
              </div>
            ) : (
              jobs.slice(0, 10).map((job) => (
                <div key={job.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{job.source.name}</span>
                        <span className={`px-2 py-0.5 text-xs rounded ${statusColors[job.status]}`}>
                          {job.status}
                        </span>
                      </div>
                      <div className="flex gap-4 text-sm text-gray-500 mt-1">
                        <span>페이지: {job.pagesVisited}</span>
                        <span>파일: {job.filesSaved}</span>
                        <span>문제: {job.problemsExtracted}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {job.status === "RUNNING" && (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      )}
                      {job.status === "COMPLETED" && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {job.status === "FAILED" && (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      {job.errorCount > 0 && (
                        <span className="text-xs text-red-500">{job.errorCount}개 오류</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {jobs.length > 0 && (
            <div className="p-4 border-t">
              <Link href="/admin/crawler/items" className="text-sm text-indigo-600 hover:underline">
                수집된 항목 보기 →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Info */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
        <h4 className="font-medium text-blue-800 dark:text-blue-200 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          수집 안내
        </h4>
        <ul className="mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• 공식 공개 자료만 수집하며 robots.txt를 준수합니다</li>
          <li>• PDF 파일은 텍스트 추출 후 문제로 파싱됩니다</li>
          <li>• 이미지 기반 PDF는 OCR 처리가 필요합니다 (tesseract.js)</li>
          <li>• 수집된 문제는 검수 후 문제 은행에 등록됩니다</li>
        </ul>
      </div>
    </div>
  );
}
