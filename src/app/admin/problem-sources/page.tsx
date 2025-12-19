"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Archive,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Globe,
  Building,
  BookOpen,
  FileText,
} from "lucide-react";

interface ProblemSource {
  id: string;
  name: string;
  type: string;
  organization: string | null;
  website: string | null;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  _count: { problems: number };
}

const typeIcons: Record<string, React.ReactNode> = {
  PUBLIC: <Globe className="h-4 w-4" />,
  SCHOOL: <Building className="h-4 w-4" />,
  TEXTBOOK: <BookOpen className="h-4 w-4" />,
  MOCK_EXAM: <FileText className="h-4 w-4" />,
};

const typeLabels: Record<string, string> = {
  PUBLIC: "공공 자료",
  SCHOOL: "학교 시험",
  TEXTBOOK: "교재/문제집",
  MOCK_EXAM: "모의고사",
};

export default function ProblemSourcesPage() {
  const [sources, setSources] = useState<ProblemSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "PUBLIC",
    organization: "",
    website: "",
    isVerified: false,
  });

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const res = await fetch("/api/problem-sources");
      if (res.ok) {
        setSources(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch sources:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/problem-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowForm(false);
        setFormData({ name: "", type: "PUBLIC", organization: "", website: "", isVerified: false });
        fetchSources();
      }
    } catch (error) {
      console.error("Failed to save source:", error);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: "", type: "PUBLIC", organization: "", website: "", isVerified: false });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/problems"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Archive className="h-6 w-6 text-indigo-600" />
              출처 관리
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              문제 출처 및 저작권 정보 관리
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
        >
          <Plus className="h-4 w-4" />
          새 출처 등록
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 mb-6">
          <h2 className="font-semibold mb-4">{editingId ? "출처 수정" : "새 출처 등록"}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">출처 이름 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="예: 2024 수능"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">유형 *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                >
                  <option value="PUBLIC">공공 자료</option>
                  <option value="SCHOOL">학교 시험</option>
                  <option value="TEXTBOOK">교재/문제집</option>
                  <option value="MOCK_EXAM">모의고사</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">발행 기관</label>
                <input
                  type="text"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  placeholder="예: 한국교육과정평가원"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">웹사이트</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isVerified}
                  onChange={(e) => setFormData({ ...formData, isVerified: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">검증된 출처</span>
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
              >
                저장
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sources List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        {loading ? (
          <div className="p-8 text-center text-gray-500">로딩 중...</div>
        ) : sources.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Archive className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            등록된 출처가 없습니다
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {sources.map((source) => (
              <div key={source.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                    {typeIcons[source.type] || <FileText className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{source.name}</span>
                      {source.isVerified && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {!source.isActive && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">비활성</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {typeLabels[source.type]}
                      {source.organization && ` • ${source.organization}`}
                      {` • 문제 ${source._count.problems}개`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {source.website && (
                    <a
                      href={source.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                      title="웹사이트 열기"
                    >
                      <Globe className="h-4 w-4 text-gray-500" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-gray-700 dark:text-gray-300">
        <p>
          <strong>출처 관리 안내:</strong> 문제의 저작권과 출처를 명확히 관리하세요.
          공공 자료는 교육부, 시도교육청 등에서 공개한 자료이며, 자유롭게 활용 가능합니다.
        </p>
      </div>
    </div>
  );
}
