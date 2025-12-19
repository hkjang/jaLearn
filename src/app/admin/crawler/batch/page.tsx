"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  Clock,
  Moon,
  Calendar,
  GripVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface BatchItem {
  id: string;
  name: string;
  description: string | null;
  schedule: string | null;
  isNightMode: boolean;
  status: string;
  priority: number;
  sourceIds: string;
  lastRunAt: string | null;
  nextRunAt: string | null;
  sources: Array<{ id: string; name: string; type: string }>;
}

const statusConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  IDLE: { color: 'bg-gray-100 text-gray-800', label: '대기', icon: <Clock className="h-3 w-3" /> },
  QUEUED: { color: 'bg-blue-100 text-blue-800', label: '큐대기', icon: <Clock className="h-3 w-3" /> },
  RUNNING: { color: 'bg-green-100 text-green-800', label: '실행중', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  PAUSED: { color: 'bg-yellow-100 text-yellow-800', label: '일시중지', icon: <Pause className="h-3 w-3" /> },
  COMPLETED: { color: 'bg-indigo-100 text-indigo-800', label: '완료', icon: <CheckCircle className="h-3 w-3" /> },
};

export default function BatchManagementPage() {
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sources, setSources] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sourceIds: [] as string[],
    isNightMode: false,
    priority: 0,
  });

  const fetchBatches = async () => {
    try {
      const res = await fetch('/api/crawler/batch');
      if (res.ok) {
        const data = await res.json();
        setBatches(data.batches);
      }
    } catch (error) {
      console.error("Failed to fetch batches:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSources = async () => {
    try {
      const res = await fetch('/api/crawler/sources');
      if (res.ok) {
        setSources(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch sources:", error);
    }
  };

  useEffect(() => {
    fetchBatches();
    fetchSources();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.sourceIds.length === 0) {
      alert('소스를 선택하세요');
      return;
    }

    try {
      const res = await fetch('/api/crawler/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowForm(false);
        setFormData({ name: '', description: '', sourceIds: [], isNightMode: false, priority: 0 });
        fetchBatches();
      }
    } catch (error) {
      console.error("Create failed:", error);
    }
  };

  const handleAction = async (id: string, action: 'run' | 'pause' | 'resume') => {
    setProcessing(id);
    try {
      await fetch('/api/crawler/batch', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      fetchBatches();
    } catch (error) {
      console.error("Action failed:", error);
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await fetch(`/api/crawler/batch?id=${id}`, { method: 'DELETE' });
      fetchBatches();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handlePriorityChange = async (id: string, priority: number) => {
    try {
      await fetch('/api/crawler/batch', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, priority }),
      });
      fetchBatches();
    } catch (error) {
      console.error("Priority change failed:", error);
    }
  };

  const toggleSourceSelection = (sourceId: string) => {
    setFormData(prev => ({
      ...prev,
      sourceIds: prev.sourceIds.includes(sourceId)
        ? prev.sourceIds.filter(id => id !== sourceId)
        : [...prev.sourceIds, sourceId],
    }));
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
              <Calendar className="h-6 w-6 text-indigo-600" />
              배치 작업 관리
            </h1>
            <p className="text-gray-600 dark:text-gray-400">대량 수집 작업 스케줄 관리</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchBatches}
            disabled={loading}
            className="p-2 border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            새 배치 작업
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border p-6 mb-6">
          <h3 className="font-semibold mb-4">새 배치 작업 생성</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">작업 이름 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700"
                  placeholder="예: 주간 평가원 수집"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">우선순위</label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  className="w-full"
                />
                <span className="text-sm text-gray-500">{formData.priority}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">설명</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">수집 소스 선택 *</label>
              <div className="flex flex-wrap gap-2">
                {sources.map((source) => (
                  <button
                    key={source.id}
                    type="button"
                    onClick={() => toggleSourceSelection(source.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      formData.sourceIds.includes(source.id)
                        ? 'bg-indigo-100 border-indigo-400 text-indigo-800'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    {source.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isNightMode}
                  onChange={(e) => setFormData({ ...formData, isNightMode: e.target.checked })}
                  className="rounded"
                />
                <Moon className="h-4 w-4 text-indigo-500" />
                <span className="text-sm">야간 수집 모드 (22:00 이후 실행)</span>
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border rounded-lg"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                생성
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Batch List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : batches.length > 0 ? (
        <div className="space-y-4">
          {batches.map((batch, index) => (
            <div
              key={batch.id}
              className="bg-white dark:bg-gray-800 rounded-xl border p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-2 text-gray-400 cursor-move">
                    <GripVertical className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{batch.name}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded ${statusConfig[batch.status]?.color}`}>
                        {statusConfig[batch.status]?.icon}
                        {statusConfig[batch.status]?.label}
                      </span>
                      {batch.isNightMode && (
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs rounded flex items-center gap-1">
                          <Moon className="h-3 w-3" />
                          야간
                        </span>
                      )}
                    </div>
                    {batch.description && (
                      <p className="text-sm text-gray-500 mb-2">{batch.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {batch.sources.map((source) => (
                        <span key={source.id} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                          {source.name}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>우선순위: {batch.priority}</span>
                      {batch.lastRunAt && (
                        <span>마지막 실행: {new Date(batch.lastRunAt).toLocaleString('ko-KR')}</span>
                      )}
                      {batch.nextRunAt && (
                        <span>다음 실행: {new Date(batch.nextRunAt).toLocaleString('ko-KR')}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {batch.status === 'PAUSED' ? (
                    <button
                      onClick={() => handleAction(batch.id, 'resume')}
                      disabled={processing === batch.id}
                      className="p-2 hover:bg-green-100 text-green-600 rounded-lg"
                      title="재개"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                  ) : batch.status === 'IDLE' || batch.status === 'COMPLETED' ? (
                    <button
                      onClick={() => handleAction(batch.id, 'run')}
                      disabled={processing === batch.id}
                      className="p-2 hover:bg-green-100 text-green-600 rounded-lg"
                      title="즉시 실행"
                    >
                      {processing === batch.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </button>
                  ) : batch.status === 'RUNNING' || batch.status === 'QUEUED' ? (
                    <button
                      onClick={() => handleAction(batch.id, 'pause')}
                      disabled={processing === batch.id}
                      className="p-2 hover:bg-yellow-100 text-yellow-600 rounded-lg"
                      title="일시중지"
                    >
                      <Pause className="h-4 w-4" />
                    </button>
                  ) : null}
                  <button
                    onClick={() => handleDelete(batch.id)}
                    className="p-2 hover:bg-red-100 text-red-500 rounded-lg"
                    title="삭제"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">배치 작업이 없습니다</h3>
          <p className="text-gray-500 mb-4">대량 수집을 위한 배치 작업을 생성하세요</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            새 배치 작업 만들기
          </button>
        </div>
      )}
    </div>
  );
}
