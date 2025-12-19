"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  FileText,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

interface CrawledItemDetail {
  id: string;
  url: string;
  fileName: string | null;
  fileType: string;
  filePath: string | null;
  fileSize: number | null;
  rawText: string | null;
  parsedData: string | null;
  year: number | null;
  month: number | null;
  examName: string | null;
  subject: string | null;
  grade: string | null;
  status: string;
  ocrConfidence: number | null;
  problemCount: number | null;
  createdAt: string;
  source: {
    name: string;
    type: string;
    grade: string;
  };
}

interface ParsedProblem {
  number: number;
  content: string;
  options?: string[];
  answer?: string;
  explanation?: string;
}

export default function CrawledItemDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [item, setItem] = useState<CrawledItemDetail | null>(null);
  const [problems, setProblems] = useState<ParsedProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'original' | 'parsed' | 'edit'>('original');
  const [editingProblem, setEditingProblem] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/crawler/items?id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setItem(data);
        if (data.parsedData) {
          try {
            setProblems(JSON.parse(data.parsedData));
          } catch {
            setProblems([]);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch item:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!item) return;
    try {
      // 검수 대기함에 추가 후 승인
      await fetch('/api/crawler/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          reviewType: 'QUALITY_CHECK',
          priority: 5,
        }),
      });
      
      // 승인 처리는 별도로 필요 (API 호출)
      alert('검수 대기함에 추가되었습니다');
    } catch (error) {
      console.error("Approve error:", error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-500">항목을 찾을 수 없습니다</div>
      </div>
    );
  }

  const gradeColors: Record<string, string> = {
    A: 'bg-green-500 text-white',
    B: 'bg-blue-500 text-white',
    C: 'bg-yellow-500 text-black',
    D: 'bg-orange-500 text-white',
    E: 'bg-red-500 text-white',
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/crawler/review" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-3">
              <FileText className="h-5 w-5 text-indigo-600" />
              문제 미리보기
            </h1>
            <p className="text-sm text-gray-500">{item.fileName || item.url}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="새로고침"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="원본 링크"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Meta Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className={`px-2 py-1 text-sm font-bold rounded ${gradeColors[item.source.grade]}`}>
            {item.source.grade}등급
          </span>
          <span className="text-sm text-gray-600">소스: {item.source.name}</span>
          <span className="text-sm text-gray-600">유형: {item.fileType.toUpperCase()}</span>
          {item.fileSize && (
            <span className="text-sm text-gray-600">크기: {(item.fileSize / 1024).toFixed(1)}KB</span>
          )}
          {item.ocrConfidence !== null && (
            <span className="flex items-center gap-2 text-sm">
              OCR 신뢰도:
              <span className={`font-medium ${item.ocrConfidence >= 0.8 ? 'text-green-600' : item.ocrConfidence >= 0.6 ? 'text-yellow-600' : 'text-red-600'}`}>
                {Math.round(item.ocrConfidence * 100)}%
              </span>
            </span>
          )}
          {item.problemCount !== null && (
            <span className="text-sm text-gray-600">추출된 문제: {item.problemCount}개</span>
          )}
          <StatusBadge status={item.status} />
        </div>
        {(item.year || item.examName || item.subject) && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
            {item.year && <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">{item.year}년</span>}
            {item.month && <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">{item.month}월</span>}
            {item.examName && <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded">{item.examName}</span>}
            {item.subject && <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">{item.subject}</span>}
            {item.grade && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded">{item.grade}</span>}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('original')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === 'original' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Eye className="h-4 w-4 inline mr-2" />
          원본 보기
        </button>
        <button
          onClick={() => setActiveTab('parsed')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === 'parsed' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="h-4 w-4 inline mr-2" />
          파싱 결과
        </button>
        <button
          onClick={() => setActiveTab('edit')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === 'edit' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Edit className="h-4 w-4 inline mr-2" />
          수정
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border">
        {activeTab === 'original' && (
          <div className="p-6">
            <h3 className="font-semibold mb-4">원문 텍스트 (OCR 추출)</h3>
            {item.rawText ? (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-[500px] overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm font-mono">{item.rawText}</pre>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                추출된 텍스트가 없습니다
              </div>
            )}
          </div>
        )}

        {activeTab === 'parsed' && (
          <div className="divide-y">
            {problems.length > 0 ? (
              problems.map((problem, idx) => (
                <div key={idx} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm font-bold rounded-full">
                      {problem.number || idx + 1}번
                    </span>
                    <button
                      onClick={() => setEditingProblem(idx)}
                      className="p-1.5 hover:bg-gray-100 rounded"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* 문제 내용 */}
                  <div className="mb-4">
                    <h4 className="text-xs text-gray-500 mb-1">문제</h4>
                    <p className="text-gray-800 dark:text-gray-200">{problem.content}</p>
                  </div>
                  
                  {/* 선택지 */}
                  {problem.options && problem.options.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs text-gray-500 mb-2">선택지</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {problem.options.map((opt, optIdx) => (
                          <div 
                            key={optIdx} 
                            className={`px-3 py-2 rounded-lg text-sm ${
                              problem.answer === String(optIdx + 1) 
                                ? 'bg-green-100 text-green-800 border-2 border-green-400' 
                                : 'bg-gray-50 dark:bg-gray-700'
                            }`}
                          >
                            <span className="font-bold mr-2">①②③④⑤"[optIdx]</span>
                            {opt}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* 정답 */}
                  {problem.answer && (
                    <div className="mb-4">
                      <h4 className="text-xs text-gray-500 mb-1">정답</h4>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-bold">
                        {problem.answer}
                      </span>
                    </div>
                  )}
                  
                  {/* 해설 */}
                  {problem.explanation && (
                    <div>
                      <h4 className="text-xs text-gray-500 mb-1">해설</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{problem.explanation}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-gray-500">
                <FileText className="h-8 w-8 mx-auto mb-2" />
                파싱된 문제가 없습니다
              </div>
            )}
          </div>
        )}

        {activeTab === 'edit' && (
          <div className="p-6">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <AlertTriangle className="h-4 w-4 inline mr-2" />
                인라인 편집 모드입니다. 수정 후 저장 버튼을 클릭하세요.
              </p>
            </div>
            {/* 편집 폼은 추후 구현 */}
            <p className="text-gray-500 text-center py-12">편집 기능 준비 중...</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          취소
        </button>
        <button
          onClick={handleApprove}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          검수 승인
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string }> = {
    PENDING: { color: 'bg-gray-100 text-gray-800', label: '대기' },
    DOWNLOADED: { color: 'bg-blue-100 text-blue-800', label: '다운로드됨' },
    OCR_PROCESSING: { color: 'bg-yellow-100 text-yellow-800', label: 'OCR중' },
    OCR_DONE: { color: 'bg-purple-100 text-purple-800', label: 'OCR완료' },
    PARSED: { color: 'bg-indigo-100 text-indigo-800', label: '파싱됨' },
    IMPORTED: { color: 'bg-green-100 text-green-800', label: '가져옴' },
    FAILED: { color: 'bg-red-100 text-red-800', label: '실패' },
  };

  const { color, label } = config[status] || { color: 'bg-gray-100', label: status };

  return (
    <span className={`px-2 py-0.5 text-xs rounded ${color}`}>
      {label}
    </span>
  );
}
