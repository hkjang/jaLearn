"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Book,
  GraduationCap,
  CheckCircle,
  Edit2,
  Search,
} from "lucide-react";

interface CurriculumStandard {
  id: string;
  version: string;
  code: string;
  domain: string | null;
  title: string;
  description: string | null;
  gradeLevel: string;
  isActive: boolean;
  subject: { id: string; displayName: string };
  _count: { mappings: number };
}

interface Subject {
  id: string;
  displayName: string;
}

const gradeLevelOptions = [
  { value: "ELEMENTARY_1", label: "초1" },
  { value: "ELEMENTARY_2", label: "초2" },
  { value: "ELEMENTARY_3", label: "초3" },
  { value: "ELEMENTARY_4", label: "초4" },
  { value: "ELEMENTARY_5", label: "초5" },
  { value: "ELEMENTARY_6", label: "초6" },
  { value: "MIDDLE_1", label: "중1" },
  { value: "MIDDLE_2", label: "중2" },
  { value: "MIDDLE_3", label: "중3" },
  { value: "HIGH_1", label: "고1" },
  { value: "HIGH_2", label: "고2" },
  { value: "HIGH_3", label: "고3" },
];

export default function CurriculumManagementPage() {
  const [standards, setStandards] = useState<CurriculumStandard[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState("2022");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    version: "2022",
    subjectId: "",
    gradeLevel: "",
    code: "",
    domain: "",
    title: "",
    description: "",
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    fetchStandards();
  }, [version, subjectFilter, gradeFilter]);

  const fetchSubjects = async () => {
    try {
      const res = await fetch("/api/subjects");
      if (res.ok) {
        setSubjects(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch subjects:", error);
    }
  };

  const fetchStandards = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ version });
      if (subjectFilter) params.append("subjectId", subjectFilter);
      if (gradeFilter) params.append("gradeLevel", gradeFilter);
      
      const res = await fetch(`/api/curriculum?${params}`);
      if (res.ok) {
        setStandards(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch standards:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/curriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowForm(false);
        setFormData({
          version: "2022",
          subjectId: "",
          gradeLevel: "",
          code: "",
          domain: "",
          title: "",
          description: "",
        });
        fetchStandards();
      }
    } catch (error) {
      console.error("Failed to create standard:", error);
    }
  };

  const filteredStandards = standards.filter(
    (s) =>
      searchQuery === "" ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/problems/dashboard"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <GraduationCap className="h-6 w-6 text-indigo-600" />
              교육과정 관리
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              성취기준 및 교육과정 매핑
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
        >
          <Plus className="h-4 w-4" />
          성취기준 등록
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">교육과정</label>
            <select
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="2022">2022 개정</option>
              <option value="2015">2015 개정</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">과목</label>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="">전체</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.displayName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">학년</label>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="">전체</option>
              {gradeLevelOptions.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">검색</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="코드 또는 제목 검색..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 mb-6">
          <h3 className="font-semibold mb-4">새 성취기준 등록</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">교육과정 *</label>
              <select
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="2022">2022 개정</option>
                <option value="2015">2015 개정</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">과목 *</label>
              <select
                value={formData.subjectId}
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="">선택</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.displayName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">학년 *</label>
              <select
                value={formData.gradeLevel}
                onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="">선택</option>
                {gradeLevelOptions.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">성취기준 코드 *</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="예: [9영01-01]"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">영역</label>
              <input
                type="text"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                placeholder="예: 듣기-말하기"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">성취기준 제목 *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">상세 설명</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
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

      {/* Standards List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
        {loading ? (
          <div className="p-8 text-center text-gray-500">로딩 중...</div>
        ) : filteredStandards.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Book className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            등록된 성취기준이 없습니다
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredStandards.map((std) => (
              <div key={std.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs rounded font-mono">
                        {std.code}
                      </span>
                      {std.domain && (
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 text-xs rounded">
                          {std.domain}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {std.subject.displayName} • {gradeLevelOptions.find(g => g.value === std.gradeLevel)?.label}
                      </span>
                    </div>
                    <p className="font-medium">{std.title}</p>
                    {std.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{std.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <span className="text-sm text-gray-500">
                      {std._count.mappings}개 문제
                    </span>
                    {std.isActive && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
