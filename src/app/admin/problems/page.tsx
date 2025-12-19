"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FileQuestion,
  Plus,
  Upload,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  Archive,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  BarChart3,
} from "lucide-react";

interface Problem {
  id: string;
  title: string | null;
  content: string;
  type: string;
  gradeLevel: string;
  difficulty: string;
  status: string;
  reviewStage: string;
  usageCount: number;
  correctRate: number | null;
  createdAt: string;
  subject: { name: string; displayName: string };
  createdBy: { name: string } | null;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  ARCHIVED: "bg-slate-100 text-slate-800",
};

const difficultyColors: Record<string, string> = {
  LOW: "bg-green-100 text-green-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-red-100 text-red-800",
};

const typeLabels: Record<string, string> = {
  MULTIPLE_CHOICE: "객관식",
  SHORT_ANSWER: "주관식",
  ESSAY: "서술형",
  TRUE_FALSE: "O/X",
};

export default function ProblemsAdminPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [subjects, setSubjects] = useState<{id: string; displayName: string}[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });

  const fetchProblems = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (difficultyFilter) params.set("difficulty", difficultyFilter);
      if (subjectFilter) params.set("subjectId", subjectFilter);

      const res = await fetch(`/api/problems?${params}`);
      const data = await res.json();
      setProblems(data.problems || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Failed to fetch problems:", error);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, difficultyFilter, subjectFilter]);

  const fetchStats = async () => {
    try {
      const [total, approved, pending, rejected] = await Promise.all([
        fetch("/api/problems?limit=1").then(r => r.json()),
        fetch("/api/problems?limit=1&status=APPROVED").then(r => r.json()),
        fetch("/api/problems?limit=1&status=PENDING").then(r => r.json()),
        fetch("/api/problems?limit=1&status=REJECTED").then(r => r.json()),
      ]);
      setStats({
        total: total.pagination?.total || 0,
        approved: approved.pagination?.total || 0,
        pending: pending.pagination?.total || 0,
        rejected: rejected.pagination?.total || 0,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const fetchSubjects = async () => {
    try {
      // This assumes a subjects API exists
      const res = await fetch("/api/admin/subjects");
      if (res.ok) {
        setSubjects(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch subjects:", error);
    }
  };

  useEffect(() => {
    fetchProblems();
    fetchStats();
    fetchSubjects();
  }, [fetchProblems]);

  const handleDelete = async (id: string) => {
    if (!confirm("정말 이 문제를 삭제(보관)하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/problems/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchProblems(pagination?.page);
        fetchStats();
      }
    } catch (error) {
      console.error("Failed to delete problem:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FileQuestion className="h-8 w-8 text-indigo-600" />
            문제 관리
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            AI 튜터 및 문제은행용 문제 수집·관리
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/problems/upload"
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition"
          >
            <Upload className="h-4 w-4" />
            대량 업로드
          </Link>
          <Link
            href="/admin/problems/new"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
          >
            <Plus className="h-4 w-4" />
            새 문제 등록
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">전체 문제</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-indigo-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">승인됨</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">검수 대기</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">반려됨</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6 border border-gray-100 dark:border-gray-700">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="문제 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">모든 상태</option>
              <option value="DRAFT">초안</option>
              <option value="PENDING">검수 대기</option>
              <option value="APPROVED">승인됨</option>
              <option value="REJECTED">반려됨</option>
              <option value="ARCHIVED">보관됨</option>
            </select>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">모든 난이도</option>
              <option value="LOW">하</option>
              <option value="MEDIUM">중</option>
              <option value="HIGH">상</option>
            </select>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">모든 과목</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.displayName}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => fetchProblems(1)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
          >
            검색
          </button>
        </div>
      </div>

      {/* Problems Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">로딩 중...</div>
        ) : problems.length === 0 ? (
          <div className="p-8 text-center text-gray-500">등록된 문제가 없습니다.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">문제</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">과목</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">유형</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">난이도</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">상태</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">사용횟수</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-300">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {problems.map((problem) => (
                <tr key={problem.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-4">
                    <div className="max-w-md">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {problem.title || problem.content.substring(0, 50) + "..."}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{problem.content.substring(0, 80)}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {problem.subject?.displayName}
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {typeLabels[problem.type] || problem.type}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${difficultyColors[problem.difficulty]}`}>
                      {problem.difficulty === "LOW" ? "하" : problem.difficulty === "MEDIUM" ? "중" : "상"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[problem.status]}`}>
                      {problem.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {problem.usageCount}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/problems/${problem.id}`}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                        title="상세 보기"
                      >
                        <Eye className="h-4 w-4 text-gray-500" />
                      </Link>
                      <Link
                        href={`/admin/problems/${problem.id}/edit`}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                        title="수정"
                      >
                        <Edit className="h-4 w-4 text-gray-500" />
                      </Link>
                      <button
                        onClick={() => handleDelete(problem.id)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                        title="삭제"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              총 {pagination.total}개 중 {(pagination.page - 1) * pagination.limit + 1}-
              {Math.min(pagination.page * pagination.limit, pagination.total)}개 표시
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchProblems(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 py-2 text-sm">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchProblems(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/problems/review"
          className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl hover:shadow-md transition"
        >
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-yellow-600" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">검수 대기열</p>
              <p className="text-sm text-gray-500">{stats.pending}개 문제 검수 대기 중</p>
            </div>
          </div>
        </Link>
        <Link
          href="/admin/problem-sources"
          className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl hover:shadow-md transition"
        >
          <div className="flex items-center gap-3">
            <Archive className="h-6 w-6 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">출처 관리</p>
              <p className="text-sm text-gray-500">문제 출처 및 저작권 관리</p>
            </div>
          </div>
        </Link>
        <Link
          href="/admin/problem-units"
          className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl hover:shadow-md transition"
        >
          <div className="flex items-center gap-3">
            <FileQuestion className="h-6 w-6 text-indigo-600" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">단원 관리</p>
              <p className="text-sm text-gray-500">교육과정 단원 체계 관리</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
