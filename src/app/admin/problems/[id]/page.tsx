"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  History,
  Copy,
  Shuffle,
  Target,
  FileQuestion,
  User,
  Calendar,
} from "lucide-react";

interface Problem {
  id: string;
  title: string | null;
  content: string;
  type: string;
  options: string | null;
  answer: string;
  explanation: string | null;
  gradeLevel: string;
  difficulty: string;
  status: string;
  reviewStage: string;
  sourceType: string | null;
  sourceDetail: string | null;
  year: number | null;
  usageCount: number;
  correctRate: number | null;
  qualityScore: number | null;
  createdAt: string;
  updatedAt: string;
  subject: { id: string; displayName: string };
  unit: { id: string; name: string } | null;
  source: { id: string; name: string } | null;
  createdBy: { id: string; name: string } | null;
  tags: { tag: { id: string; name: string; color: string } }[];
  versions: { id: string; version: number; createdAt: string; changeNote: string | null }[];
  variants: { id: string; type: string; createdAt: string }[];
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  ARCHIVED: "bg-slate-100 text-slate-800",
};

const typeLabels: Record<string, string> = {
  MULTIPLE_CHOICE: "객관식",
  SHORT_ANSWER: "주관식",
  ESSAY: "서술형",
  TRUE_FALSE: "O/X",
};

const difficultyLabels: Record<string, { label: string; color: string }> = {
  LOW: { label: "하", color: "bg-green-100 text-green-800" },
  MEDIUM: { label: "중", color: "bg-yellow-100 text-yellow-800" },
  HIGH: { label: "상", color: "bg-red-100 text-red-800" },
};

export default function ProblemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchProblem();
  }, [id]);

  const fetchProblem = async () => {
    try {
      const res = await fetch(`/api/problems/${id}`);
      if (res.ok) {
        setProblem(await res.json());
      } else {
        router.push("/admin/problems");
      }
    } catch (error) {
      console.error("Failed to fetch problem:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("정말 이 문제를 삭제(보관)하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/problems/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/admin/problems");
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const handleGenerateVariant = async (type: string) => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/problems/${id}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          options: type === "DIFFICULTY" ? { difficultyAdjust: "EASIER" } : {},
        }),
      });
      if (res.ok) {
        fetchProblem();
        alert("변형 문제가 생성되었습니다.");
      }
    } catch (error) {
      console.error("Failed to generate variant:", error);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!problem) {
    return null;
  }

  const parsedOptions = problem.options ? JSON.parse(problem.options) : [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/problems"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileQuestion className="h-5 w-5 text-indigo-600" />
              문제 상세
            </h1>
            <p className="text-sm text-gray-500">ID: {problem.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/problems/${id}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
          >
            <Edit className="h-4 w-4" />
            수정
          </Link>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            <Trash2 className="h-4 w-4" />
            삭제
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Problem Content */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[problem.status]}`}>
                {problem.status}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${difficultyLabels[problem.difficulty]?.color}`}>
                난이도: {difficultyLabels[problem.difficulty]?.label}
              </span>
              <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded-full">
                {typeLabels[problem.type]}
              </span>
            </div>

            {problem.title && (
              <h2 className="text-lg font-semibold mb-3">{problem.title}</h2>
            )}

            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-4">
              <p className="whitespace-pre-wrap">{problem.content}</p>
            </div>

            {/* Options */}
            {parsedOptions.length > 0 && (
              <div className="mb-4 space-y-2">
                <p className="text-sm font-medium text-gray-500">선택지</p>
                {parsedOptions.map((opt: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="w-6 h-6 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-full text-sm">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{opt}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Answer */}
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg mb-4">
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                정답: {problem.answer}
              </span>
            </div>

            {/* Explanation */}
            {problem.explanation && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">해설</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{problem.explanation}</p>
              </div>
            )}
          </div>

          {/* Variant Generation */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold mb-4">변형 문제 생성</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleGenerateVariant("NUMERIC")}
                disabled={generating}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg disabled:opacity-50"
              >
                <Copy className="h-4 w-4" />
                수치 변경
              </button>
              <button
                onClick={() => handleGenerateVariant("OPTION_ORDER")}
                disabled={generating || parsedOptions.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg disabled:opacity-50"
              >
                <Shuffle className="h-4 w-4" />
                선택지 순서
              </button>
              <button
                onClick={() => handleGenerateVariant("DIFFICULTY")}
                disabled={generating}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg disabled:opacity-50"
              >
                <Target className="h-4 w-4" />
                난이도 조정
              </button>
            </div>

            {problem.variants.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-500 mb-2">생성된 변형 ({problem.variants.length})</p>
                <div className="space-y-1">
                  {problem.variants.map((v) => (
                    <div key={v.id} className="text-sm text-gray-600 dark:text-gray-300">
                      • {v.type} - {new Date(v.createdAt).toLocaleDateString("ko-KR")}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Classification */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold mb-3">분류 정보</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">과목</dt>
                <dd className="font-medium">{problem.subject?.displayName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">학년</dt>
                <dd className="font-medium">{problem.gradeLevel}</dd>
              </div>
              {problem.unit && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">단원</dt>
                  <dd className="font-medium">{problem.unit.name}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Source Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold mb-3">출처 정보</h3>
            <dl className="space-y-2 text-sm">
              {problem.source && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">출처</dt>
                  <dd className="font-medium">{problem.source.name}</dd>
                </div>
              )}
              {problem.sourceType && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">유형</dt>
                  <dd className="font-medium">{problem.sourceType}</dd>
                </div>
              )}
              {problem.sourceDetail && (
                <div>
                  <dt className="text-gray-500 mb-1">상세</dt>
                  <dd className="font-medium">{problem.sourceDetail}</dd>
                </div>
              )}
              {problem.year && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">연도</dt>
                  <dd className="font-medium">{problem.year}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold mb-3">통계</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">사용 횟수</dt>
                <dd className="font-medium">{problem.usageCount}</dd>
              </div>
              {problem.correctRate !== null && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">정답률</dt>
                  <dd className="font-medium">{(problem.correctRate * 100).toFixed(1)}%</dd>
                </div>
              )}
              {problem.qualityScore !== null && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">품질 점수</dt>
                  <dd className="font-medium">{problem.qualityScore}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Meta */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold mb-3">메타 정보</h3>
            <dl className="space-y-2 text-sm">
              {problem.createdBy && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">등록자:</span>
                  <span className="font-medium">{problem.createdBy.name}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">등록일:</span>
                <span className="font-medium">
                  {new Date(problem.createdAt).toLocaleDateString("ko-KR")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">버전:</span>
                <span className="font-medium">{problem.versions.length}</span>
              </div>
            </dl>
          </div>

          {/* Tags */}
          {problem.tags.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold mb-3">태그</h3>
              <div className="flex flex-wrap gap-2">
                {problem.tags.map((t) => (
                  <span
                    key={t.tag.id}
                    className="px-2 py-1 text-xs rounded-full"
                    style={{ backgroundColor: t.tag.color + "20", color: t.tag.color }}
                  >
                    {t.tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
