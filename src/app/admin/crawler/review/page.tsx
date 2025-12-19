"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  AlertTriangle,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  User,
  FileText,
  Search,
} from "lucide-react";

interface ReviewItem {
  id: string;
  itemId: string;
  priority: number;
  status: string;
  assignedTo: string | null;
  reviewType: string;
  confidence: number | null;
  notes: string | null;
  createdAt: string;
  item: {
    id: string;
    url: string;
    fileName: string | null;
    fileType: string;
    status: string;
    ocrConfidence: number | null;
    problemCount: number | null;
    source: {
      name: string;
      grade: string;
    };
  };
}

interface ReviewData {
  items: ReviewItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    byStatus: Record<string, number>;
    byType: Record<string, number>;
  };
}

const reviewTypeLabels: Record<string, { label: string; color: string }> = {
  OCR_ERROR: { label: 'OCR 오류', color: 'bg-orange-100 text-orange-800' },
  PARSE_ERROR: { label: '파싱 오류', color: 'bg-red-100 text-red-800' },
  QUALITY_CHECK: { label: '품질 검수', color: 'bg-blue-100 text-blue-800' },
  DUPLICATE: { label: '중복 의심', color: 'bg-purple-100 text-purple-800' },
};

const statusLabels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: '대기중', color: 'bg-gray-100 text-gray-800', icon: <Clock className="h-3 w-3" /> },
  IN_REVIEW: { label: '검수중', color: 'bg-blue-100 text-blue-800', icon: <Eye className="h-3 w-3" /> },
  APPROVED: { label: '승인됨', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3" /> },
  REJECTED: { label: '반려됨', color: 'bg-red-100 text-red-800', icon: <XCircle className="h-3 w-3" /> },
};

const gradeColors: Record<string, string> = {
  A: 'bg-green-500 text-white',
  B: 'bg-blue-500 text-white',
  C: 'bg-yellow-500 text-black',
  D: 'bg-orange-500 text-white',
  E: 'bg-red-500 text-white',
};

export default function ReviewQueuePage() {
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState({
    status: 'PENDING',
    type: '',
  });
  const [page, setPage] = useState(1);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        status: filter.status,
      });
      if (filter.type) params.append('type', filter.type);

      const res = await fetch(`/api/crawler/review?${params}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch review queue:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, filter]);

  const handleAction = async (id: string, action: 'APPROVED' | 'REJECTED') => {
    setProcessing(id);
    try {
      const res = await fetch('/api/crawler/review', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: action }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Action failed:", error);
    } finally {
      setProcessing(null);
    }
  };

  const handleBulkAction = async (action: 'APPROVED' | 'REJECTED') => {
    if (selectedItems.size === 0) return;
    
    setProcessing('bulk');
    try {
      await Promise.all(
        Array.from(selectedItems).map(id =>
          fetch('/api/crawler/review', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: action }),
          })
        )
      );
      setSelectedItems(new Set());
      fetchData();
    } catch (error) {
      console.error("Bulk action failed:", error);
    } finally {
      setProcessing(null);
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedItems(newSet);
  };

  const toggleSelectAll = () => {
    if (!data) return;
    if (selectedItems.size === data.items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(data.items.map(item => item.id)));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/crawler/dashboard" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Eye className="h-6 w-6 text-indigo-600" />
              검수 대기함
            </h1>
            <p className="text-gray-600 dark:text-gray-400">수집된 항목 품질 검수 및 승인</p>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {/* Stats */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="대기중"
            value={data.stats.byStatus['PENDING'] || 0}
            color="gray"
            active={filter.status === 'PENDING'}
            onClick={() => setFilter({ ...filter, status: 'PENDING' })}
          />
          <StatCard
            label="검수중"
            value={data.stats.byStatus['IN_REVIEW'] || 0}
            color="blue"
            active={filter.status === 'IN_REVIEW'}
            onClick={() => setFilter({ ...filter, status: 'IN_REVIEW' })}
          />
          <StatCard
            label="승인됨"
            value={data.stats.byStatus['APPROVED'] || 0}
            color="green"
            active={filter.status === 'APPROVED'}
            onClick={() => setFilter({ ...filter, status: 'APPROVED' })}
          />
          <StatCard
            label="반려됨"
            value={data.stats.byStatus['REJECTED'] || 0}
            color="red"
            active={filter.status === 'REJECTED'}
            onClick={() => setFilter({ ...filter, status: 'REJECTED' })}
          />
        </div>
      )}

      {/* Filter & Bulk Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={filter.type}
            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-sm"
          >
            <option value="">모든 유형</option>
            <option value="OCR_ERROR">OCR 오류</option>
            <option value="PARSE_ERROR">파싱 오류</option>
            <option value="QUALITY_CHECK">품질 검수</option>
            <option value="DUPLICATE">중복 의심</option>
          </select>
        </div>
        
        {selectedItems.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{selectedItems.size}개 선택됨</span>
            <button
              onClick={() => handleBulkAction('APPROVED')}
              disabled={processing === 'bulk'}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
            >
              일괄 승인
            </button>
            <button
              onClick={() => handleBulkAction('REJECTED')}
              disabled={processing === 'bulk'}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
            >
              일괄 반려
            </button>
          </div>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : data && data.items.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 text-sm">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === data.items.length}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left">항목</th>
                <th className="px-4 py-3 text-left">유형</th>
                <th className="px-4 py-3 text-left">우선순위</th>
                <th className="px-4 py-3 text-left">신뢰도</th>
                <th className="px-4 py-3 text-left">상태</th>
                <th className="px-4 py-3 text-right">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-1.5 py-0.5 text-xs font-bold rounded ${gradeColors[item.item.source.grade]}`}>
                        {item.item.source.grade}
                      </span>
                      <div>
                        <p className="font-medium text-sm truncate max-w-[200px]">
                          {item.item.fileName || item.item.url}
                        </p>
                        <p className="text-xs text-gray-500">{item.item.source.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs rounded ${reviewTypeLabels[item.reviewType]?.color || 'bg-gray-100'}`}>
                      {reviewTypeLabels[item.reviewType]?.label || item.reviewType}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={item.priority} />
                  </td>
                  <td className="px-4 py-3">
                    {item.confidence !== null ? (
                      <ConfidenceGauge value={item.confidence} />
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded ${statusLabels[item.status]?.color}`}>
                      {statusLabels[item.status]?.icon}
                      {statusLabels[item.status]?.label || item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/crawler/items/${item.itemId}`}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                        title="상세보기"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      {item.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleAction(item.id, 'APPROVED')}
                            disabled={processing === item.id}
                            className="p-2 hover:bg-green-100 text-green-600 rounded-lg disabled:opacity-50"
                            title="승인"
                          >
                            {processing === item.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleAction(item.id, 'REJECTED')}
                            disabled={processing === item.id}
                            className="p-2 hover:bg-red-100 text-red-600 rounded-lg disabled:opacity-50"
                            title="반려"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-gray-500">
                총 {data.pagination.total}개 중 {(page - 1) * 20 + 1}-{Math.min(page * 20, data.pagination.total)}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border rounded-lg disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm">
                  {page} / {data.pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                  disabled={page === data.pagination.totalPages}
                  className="p-2 border rounded-lg disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border p-12 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">검수 대기 항목이 없습니다</h3>
          <p className="text-gray-500">모든 항목이 처리되었습니다</p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  active,
  onClick,
}: {
  label: string;
  value: number;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  const bgClasses: Record<string, string> = {
    gray: active ? 'bg-gray-200 border-gray-400' : 'bg-white hover:bg-gray-50',
    blue: active ? 'bg-blue-100 border-blue-400' : 'bg-white hover:bg-blue-50',
    green: active ? 'bg-green-100 border-green-400' : 'bg-white hover:bg-green-50',
    red: active ? 'bg-red-100 border-red-400' : 'bg-white hover:bg-red-50',
  };

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl border-2 text-left transition-colors ${bgClasses[color]} dark:bg-gray-800`}
    >
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </button>
  );
}

function PriorityBadge({ priority }: { priority: number }) {
  if (priority >= 8) return <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">긴급</span>;
  if (priority >= 5) return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">높음</span>;
  if (priority >= 2) return <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">보통</span>;
  return <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs rounded-full">낮음</span>;
}

function ConfidenceGauge({ value }: { value: number }) {
  const percentage = Math.round(value * 100);
  let color = 'bg-red-500';
  if (percentage >= 80) color = 'bg-green-500';
  else if (percentage >= 60) color = 'bg-yellow-500';
  else if (percentage >= 40) color = 'bg-orange-500';

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${percentage}%` }} />
      </div>
      <span className="text-xs text-gray-600">{percentage}%</span>
    </div>
  );
}
