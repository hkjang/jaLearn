"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Eye,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
} from "lucide-react";

interface Problem {
  id: string;
  title: string | null;
  content: string;
  type: string;
  gradeLevel: string;
  difficulty: string;
  reviewStage: string;
  createdAt: string;
  subject: { displayName: string };
  createdBy: { name: string } | null;
  reviews: { status: string; comments: string }[];
}

const stageLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  NONE: { label: "자동 검사 대기", icon: <Clock className="h-4 w-4" />, color: "text-gray-500" },
  AUTO: { label: "AI 검증 대기", icon: <AlertTriangle className="h-4 w-4" />, color: "text-yellow-500" },
  AI: { label: "교사 검수 대기", icon: <MessageSquare className="h-4 w-4" />, color: "text-blue-500" },
  MANUAL: { label: "최종 승인 대기", icon: <CheckCircle className="h-4 w-4" />, color: "text-indigo-500" },
};

export default function ReviewQueuePage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState("NONE");
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewScore, setReviewScore] = useState(80);

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/problems/review?stage=${selectedStage}`);
      if (res.ok) {
        setProblems(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch review queue:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, [selectedStage]);

  const handleReview = async (problemId: string, status: "APPROVED" | "REJECTED" | "NEEDS_REVISION") => {
    try {
      const res = await fetch("/api/problems/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId,
          stage: selectedStage,
          status,
          comments: reviewComment,
          score: reviewScore,
        }),
      });

      if (res.ok) {
        setSelectedProblem(null);
        setReviewComment("");
        fetchProblems();
      }
    } catch (error) {
      console.error("Failed to submit review:", error);
    }
  };

  const stages = ["NONE", "AUTO", "AI", "MANUAL"];

  return (
    <div className="container mx-auto px-4 py-8">
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
            <Clock className="h-6 w-6 text-yellow-600" />
            검수 대기열
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            등록된 문제의 품질 검수를 수행합니다
          </p>
        </div>
      </div>

      {/* Stage Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {stages.map((stage) => (
          <button
            key={stage}
            onClick={() => setSelectedStage(stage)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition ${
              selectedStage === stage
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            <span className={selectedStage === stage ? "text-white" : stageLabels[stage].color}>
              {stageLabels[stage].icon}
            </span>
            {stageLabels[stage].label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Problem List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="font-semibold">대기 중인 문제 ({problems.length})</h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center text-gray-500">로딩 중...</div>
          ) : problems.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              검수 대기 중인 문제가 없습니다
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
              {problems.map((problem) => (
                <button
                  key={problem.id}
                  onClick={() => setSelectedProblem(problem)}
                  className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${
                    selectedProblem?.id === problem.id ? "bg-indigo-50 dark:bg-indigo-900/20" : ""
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm text-gray-500">{problem.subject.displayName}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(problem.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white line-clamp-2">
                    {problem.title || problem.content.substring(0, 100)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                      {problem.type}
                    </span>
                    <span className="text-xs text-gray-500">
                      by {problem.createdBy?.name || "Unknown"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Review Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          {selectedProblem ? (
            <>
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h2 className="font-semibold">문제 검토</h2>
                <Link
                  href={`/admin/problems/${selectedProblem.id}`}
                  className="flex items-center gap-1 text-sm text-indigo-600 hover:underline"
                >
                  <Eye className="h-4 w-4" />
                  상세 보기
                </Link>
              </div>
              
              <div className="p-4 max-h-[300px] overflow-y-auto">
                <div className="mb-4">
                  <span className="text-sm text-gray-500 block mb-1">과목: {selectedProblem.subject.displayName}</span>
                  <span className="text-sm text-gray-500 block mb-2">유형: {selectedProblem.type} | 난이도: {selectedProblem.difficulty}</span>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-4">
                  <p className="whitespace-pre-wrap">{selectedProblem.content}</p>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">품질 점수</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={reviewScore}
                    onChange={(e) => setReviewScore(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>0</span>
                    <span className="font-medium">{reviewScore}점</span>
                    <span>100</span>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">검토 의견</label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="검토 의견을 입력하세요 (선택)"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleReview(selectedProblem.id, "APPROVED")}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    승인
                  </button>
                  <button
                    onClick={() => handleReview(selectedProblem.id, "NEEDS_REVISION")}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    수정 요청
                  </button>
                  <button
                    onClick={() => handleReview(selectedProblem.id, "REJECTED")}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                  >
                    <ThumbsDown className="h-4 w-4" />
                    반려
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Eye className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              왼쪽 목록에서 검토할 문제를 선택하세요
            </div>
          )}
        </div>
      </div>

      {/* Review Process Info */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">검수 프로세스 안내</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300">1</div>
            <div>
              <p className="font-medium">자동 검사</p>
              <p className="text-gray-600 dark:text-gray-400">형식 및 필수 항목 검사</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-full bg-yellow-200 dark:bg-yellow-900 flex items-center justify-center text-yellow-700 dark:text-yellow-300">2</div>
            <div>
              <p className="font-medium">AI 검증</p>
              <p className="text-gray-600 dark:text-gray-400">내용 정합성 및 품질 평가</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-200 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300">3</div>
            <div>
              <p className="font-medium">교사 검수</p>
              <p className="text-gray-600 dark:text-gray-400">전문가 내용 검토</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-full bg-green-200 dark:bg-green-900 flex items-center justify-center text-green-700 dark:text-green-300">4</div>
            <div>
              <p className="font-medium">최종 승인</p>
              <p className="text-gray-600 dark:text-gray-400">문제은행 등록</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
