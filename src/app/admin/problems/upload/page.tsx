"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Save,
  RefreshCw,
  Eye,
} from "lucide-react";

interface Subject {
  id: string;
  displayName: string;
}

interface ProblemSource {
  id: string;
  name: string;
}

interface ParsedPreview {
  index: number;
  content: string;
  type: string;
  optionsCount: number;
  hasAnswer: boolean;
  hasExplanation: boolean;
}

interface ParseResult {
  success: boolean;
  parsed: { total: number; valid: number; invalid: number };
  preview: ParsedPreview[];
  invalid: { content: string; reason: string }[];
  saved: number;
  savedIds: string[];
  errors: string[];
}

export default function UploadProblemsPage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sources, setSources] = useState<ProblemSource[]>([]);
  const [formData, setFormData] = useState({
    gradeLevel: "MIDDLE_1",
    subjectId: "",
    sourceType: "CUSTOM",
    sourceId: "",
  });
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);

  useEffect(() => {
    fetchSubjects();
    fetchSources();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await fetch("/api/admin/subjects");
      if (res.ok) setSubjects(await res.json());
    } catch (error) {
      console.error("Failed to fetch subjects:", error);
    }
  };

  const fetchSources = async () => {
    try {
      const res = await fetch("/api/problem-sources");
      if (res.ok) setSources(await res.json());
    } catch (error) {
      console.error("Failed to fetch sources:", error);
    }
  };

  const handleParse = async () => {
    if (!text.trim()) return;
    setParsing(true);
    setResult(null);

    try {
      const res = await fetch("/api/problems/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, ...formData, autoSave: false }),
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error("Parse failed:", error);
    } finally {
      setParsing(false);
    }
  };

  const handleSave = async () => {
    if (!text.trim() || !formData.subjectId) {
      alert("과목을 선택해주세요.");
      return;
    }
    setSaving(true);

    try {
      const res = await fetch("/api/problems/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, ...formData, autoSave: true }),
      });
      const data = await res.json();
      if (data.saved > 0) {
        alert(`${data.saved}개 문제가 저장되었습니다.`);
        router.push("/admin/problems");
      }
    } catch (error) {
      console.error("Save failed:", error);
      alert("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
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

  const typeLabels: Record<string, string> = {
    MULTIPLE_CHOICE: "객관식",
    SHORT_ANSWER: "주관식",
    ESSAY: "서술형",
    TRUE_FALSE: "O/X",
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
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
            <Upload className="h-6 w-6 text-indigo-600" />
            대량 업로드
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            텍스트를 붙여넣어 문제를 일괄 등록합니다
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          {/* Classification Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
            <h2 className="font-semibold mb-3">분류 설정</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">학년 *</label>
                <select
                  value={formData.gradeLevel}
                  onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
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
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                >
                  <option value="">과목 선택</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.displayName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">출처 유형</label>
                <select
                  value={formData.sourceType}
                  onChange={(e) => setFormData({ ...formData, sourceType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                >
                  <option value="">선택 안함</option>
                  {sources.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Text Input */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              문제 텍스트 붙여넣기
            </h2>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`문제를 복사하여 붙여넣으세요.

예시 형식:
1. 다음 중 올바른 것은?
① 선택지 1
② 선택지 2
③ 선택지 3
④ 선택지 4
⑤ 선택지 5
정답: ②
해설: 정답은 ②입니다.

2. 다음 문장에서 빈칸에 알맞은 것은?
...`}
              rows={15}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 font-mono text-sm resize-none"
            />
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleParse}
                disabled={parsing || !text.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50"
              >
                {parsing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                {parsing ? "분석 중..." : "미리보기"}
              </button>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="space-y-4">
          {result ? (
            <>
              {/* Summary */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
                <h2 className="font-semibold mb-3">분석 결과</h2>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{result.parsed.total}</p>
                    <p className="text-sm text-gray-500">감지됨</p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{result.parsed.valid}</p>
                    <p className="text-sm text-gray-500">유효함</p>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{result.parsed.invalid}</p>
                    <p className="text-sm text-gray-500">오류</p>
                  </div>
                </div>
                {result.parsed.valid > 0 && (
                  <button
                    onClick={handleSave}
                    disabled={saving || !formData.subjectId}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
                  >
                    {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? "저장 중..." : `${result.parsed.valid}개 문제 저장`}
                  </button>
                )}
              </div>

              {/* Preview List */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 max-h-[500px] overflow-y-auto">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
                  <h2 className="font-semibold">미리보기 (최대 10개)</h2>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {result.preview.map((p, idx) => (
                    <div key={idx} className="p-4">
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 text-sm flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 dark:text-white mb-2">{p.content}</p>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                              {typeLabels[p.type] || p.type}
                            </span>
                            {p.optionsCount > 0 && (
                              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                선택지 {p.optionsCount}개
                              </span>
                            )}
                            {p.hasAnswer && (
                              <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" /> 정답
                              </span>
                            )}
                            {p.hasExplanation && (
                              <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded">
                                해설
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Errors */}
              {result.invalid.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
                  <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    파싱 오류
                  </h3>
                  <ul className="text-sm space-y-1">
                    {result.invalid.map((i, idx) => (
                      <li key={idx} className="text-red-700 dark:text-red-300">
                        • {i.reason}: {i.content}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 border border-gray-100 dark:border-gray-700 text-center text-gray-500">
              <Upload className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>텍스트를 입력하고 "미리보기" 버튼을 클릭하세요</p>
              <p className="text-sm mt-2">문제 번호(1. 2. 등)로 구분된 텍스트를 인식합니다</p>
            </div>
          )}
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">지원 형식</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700 dark:text-gray-300">
          <div>
            <p className="font-medium mb-1">문제 번호</p>
            <p className="text-gray-600 dark:text-gray-400">1. 2. 3. 또는 [1] [2] [3]</p>
          </div>
          <div>
            <p className="font-medium mb-1">선택지</p>
            <p className="text-gray-600 dark:text-gray-400">① ② ③ ④ ⑤ 또는 A. B. C. D.</p>
          </div>
          <div>
            <p className="font-medium mb-1">정답/해설</p>
            <p className="text-gray-600 dark:text-gray-400">정답: ② 또는 해설: ...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
