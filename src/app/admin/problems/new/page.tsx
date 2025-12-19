"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Save, FileQuestion } from "lucide-react";

interface Subject {
  id: string;
  displayName: string;
}

interface ProblemUnit {
  id: string;
  name: string;
  code: string | null;
}

interface ProblemSource {
  id: string;
  name: string;
  type: string;
}

export default function NewProblemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [units, setUnits] = useState<ProblemUnit[]>([]);
  const [sources, setSources] = useState<ProblemSource[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "MULTIPLE_CHOICE",
    options: ["", "", "", ""],
    answer: "",
    explanation: "",
    gradeLevel: "MIDDLE_1",
    subjectId: "",
    unitId: "",
    difficulty: "MEDIUM",
    sourceId: "",
    sourceType: "CUSTOM",
    sourceDetail: "",
    year: "",
    copyright: "",
    isPublicDomain: false,
    usageScope: "LEARNING",
  });

  useEffect(() => {
    fetchSubjects();
    fetchSources();
  }, []);

  useEffect(() => {
    if (formData.subjectId && formData.gradeLevel) {
      fetchUnits(formData.subjectId, formData.gradeLevel);
    }
  }, [formData.subjectId, formData.gradeLevel]);

  const fetchSubjects = async () => {
    try {
      const res = await fetch("/api/admin/subjects");
      if (res.ok) {
        setSubjects(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch subjects:", error);
    }
  };

  const fetchUnits = async (subjectId: string, gradeLevel: string) => {
    try {
      const res = await fetch(`/api/problem-units?subjectId=${subjectId}&gradeLevel=${gradeLevel}`);
      if (res.ok) {
        setUnits(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch units:", error);
    }
  };

  const fetchSources = async () => {
    try {
      const res = await fetch("/api/problem-sources");
      if (res.ok) {
        setSources(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch sources:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        options: formData.type === "MULTIPLE_CHOICE" ? formData.options.filter(o => o.trim()) : undefined,
        year: formData.year ? parseInt(formData.year) : undefined,
      };

      const res = await fetch("/api/problems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (res.ok) {
        router.push("/admin/problems");
      } else {
        const error = await res.json();
        alert(error.error || "문제 등록에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to create problem:", error);
      alert("문제 등록에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const addOption = () => {
    setFormData({ ...formData, options: [...formData.options, ""] });
  };

  const removeOption = (index: number) => {
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData({ ...formData, options: newOptions });
  };

  const gradeLevels = [
    { value: "ELEMENTARY_1", label: "초등 1학년" },
    { value: "ELEMENTARY_2", label: "초등 2학년" },
    { value: "ELEMENTARY_3", label: "초등 3학년" },
    { value: "ELEMENTARY_4", label: "초등 4학년" },
    { value: "ELEMENTARY_5", label: "초등 5학년" },
    { value: "ELEMENTARY_6", label: "초등 6학년" },
    { value: "MIDDLE_1", label: "중등 1학년" },
    { value: "MIDDLE_2", label: "중등 2학년" },
    { value: "MIDDLE_3", label: "중등 3학년" },
    { value: "HIGH_1", label: "고등 1학년" },
    { value: "HIGH_2", label: "고등 2학년" },
    { value: "HIGH_3", label: "고등 3학년" },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/problems"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FileQuestion className="h-6 w-6 text-indigo-600" />
            새 문제 등록
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            문제은행에 새로운 문제를 등록합니다
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4">기본 정보</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">문제 유형 *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="MULTIPLE_CHOICE">객관식</option>
                <option value="SHORT_ANSWER">주관식 (단답형)</option>
                <option value="ESSAY">서술형</option>
                <option value="TRUE_FALSE">O/X</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">제목 (선택)</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="문제 제목 (선택)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">문제 본문 *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="문제 내용을 입력하세요. 마크다운과 LaTeX 수식($...$)을 지원합니다."
              rows={6}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 font-mono text-sm"
            />
          </div>

          {/* 객관식 선택지 */}
          {formData.type === "MULTIPLE_CHOICE" && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">선택지</label>
              <div className="space-y-2">
                {formData.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="w-8 text-center font-medium text-gray-500">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`선택지 ${index + 1}`}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    />
                    {formData.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addOption}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg"
                >
                  <Plus className="h-4 w-4" />
                  선택지 추가
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">정답 *</label>
              <input
                type="text"
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                placeholder={formData.type === "MULTIPLE_CHOICE" ? "예: A" : "정답 입력"}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">난이도</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="LOW">하</option>
                <option value="MEDIUM">중</option>
                <option value="HIGH">상</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">해설 (선택)</label>
            <textarea
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              placeholder="문제 해설을 입력하세요"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
          </div>
        </div>

        {/* 분류 정보 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4">분류 정보</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">학년 *</label>
              <select
                value={formData.gradeLevel}
                onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                {gradeLevels.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">과목 *</label>
              <select
                value={formData.subjectId}
                onChange={(e) => setFormData({ ...formData, subjectId: e.target.value, unitId: "" })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="">과목 선택</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.displayName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">단원</label>
              <select
                value={formData.unitId}
                onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                disabled={!formData.subjectId}
              >
                <option value="">단원 선택 (선택)</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 출처 정보 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4">출처 및 저작권</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">출처 유형</label>
              <select
                value={formData.sourceType}
                onChange={(e) => setFormData({ ...formData, sourceType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="PUBLIC">공공 자료</option>
                <option value="SCHOOL">학교 시험</option>
                <option value="TEXTBOOK">교재/문제집</option>
                <option value="MOCK_EXAM">모의고사</option>
                <option value="CUSTOM">자체 제작</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">등록된 출처</label>
              <select
                value={formData.sourceId}
                onChange={(e) => setFormData({ ...formData, sourceId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="">출처 선택 (선택)</option>
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">상세 출처</label>
              <input
                type="text"
                value={formData.sourceDetail}
                onChange={(e) => setFormData({ ...formData, sourceDetail: e.target.value })}
                placeholder="예: 2024학년도 3월 모의고사 수학 10번"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">출제 연도</label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                placeholder="예: 2024"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isPublicDomain}
                onChange={(e) => setFormData({ ...formData, isPublicDomain: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">공공 저작물 (자유 이용 가능)</span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Link
            href="/admin/problems"
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {loading ? "저장 중..." : "문제 등록"}
          </button>
        </div>
      </form>
    </div>
  );
}
