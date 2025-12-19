"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  BarChart3,
  Settings,
  ChevronRight,
  ChevronDown,
  Copy,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Layers,
  Save,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from "@/components/ui";
import Header from "@/components/layout/Header";

// 프롬프트 레벨 타입
type PromptLevel = "CORE" | "DOMAIN" | "GRADE" | "SUBJECT" | "UNIT" | "PROBLEM" | "USER_STATE";

interface PromptAsset {
  id: string;
  level: PromptLevel;
  name: string;
  description?: string;
  gradeLevel?: string;
  subjectId?: string;
  isActive: boolean;
  isDefault: boolean;
  priority: number;
  usageCount: number;
  avgScore?: number;
  parentId?: string;
  contentPreview?: string;
  _count?: {
    versions: number;
    problemPrompts: number;
  };
  children?: PromptAsset[];
  createdAt: string;
}

interface PerformanceData {
  summary: {
    totalUsage: number;
    avgSatisfaction: number;
    requestionRate: number;
    lowPerformerCount: number;
  };
  lowPerformers: Array<{
    versionId: string;
    assetName: string;
    currentScore: number;
    reason: string;
  }>;
}

const LEVEL_LABELS: Record<PromptLevel, string> = {
  CORE: "코어",
  DOMAIN: "도메인",
  GRADE: "학년",
  SUBJECT: "과목",
  UNIT: "단원",
  PROBLEM: "문제",
  USER_STATE: "사용자 상태",
};

const LEVEL_COLORS: Record<PromptLevel, string> = {
  CORE: "bg-purple-100 text-purple-700",
  DOMAIN: "bg-blue-100 text-blue-700",
  GRADE: "bg-green-100 text-green-700",
  SUBJECT: "bg-yellow-100 text-yellow-700",
  UNIT: "bg-orange-100 text-orange-700",
  PROBLEM: "bg-red-100 text-red-700",
  USER_STATE: "bg-pink-100 text-pink-700",
};

export default function AdminPromptsPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login");
    },
  });

  const [assets, setAssets] = useState<PromptAsset[]>([]);
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedAsset, setSelectedAsset] = useState<PromptAsset | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAsset, setNewAsset] = useState({
    level: "SUBJECT" as PromptLevel,
    name: "",
    description: "",
    content: "",
    gradeLevel: "",
    subjectId: "",
    parentId: "",
  });

  useEffect(() => {
    fetchAssets();
    fetchPerformance();
  }, []);

  const fetchAssets = async () => {
    try {
      const res = await fetch("/api/admin/prompts/assets");
      const data = await res.json();
      setAssets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformance = async () => {
    try {
      const res = await fetch("/api/admin/prompts/performance?days=7");
      const data = await res.json();
      setPerformance(data);
    } catch (error) {
      console.error("Performance fetch error:", error);
    }
  };

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/admin/prompts/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAsset),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setNewAsset({ level: "SUBJECT", name: "", description: "", content: "", gradeLevel: "", subjectId: "", parentId: "" });
        fetchAssets();
      }
    } catch (error) {
      console.error("Create error:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 프롬프트 자산을 삭제하시겠습니까?")) return;
    try {
      await fetch(`/api/admin/prompts/assets/${id}`, { method: "DELETE" });
      fetchAssets();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  // 계층별로 그룹화
  const groupedAssets = assets.reduce((acc, asset) => {
    if (!acc[asset.level]) acc[asset.level] = [];
    acc[asset.level].push(asset);
    return acc;
  }, {} as Record<PromptLevel, PromptAsset[]>);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container-main py-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Layers className="w-6 h-6" />
              프롬프트 자산 관리
            </h1>
            <p className="text-muted-foreground">계층적 프롬프트 자산 및 성능 관리</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/ai-tutor/ab-tests">
              <Button variant="outline">
                <BarChart3 className="w-4 h-4 mr-2" />
                A/B 테스트
              </Button>
            </Link>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              새 자산
            </Button>
          </div>
        </div>

        {/* Performance Dashboard */}
        {performance && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-primary">{performance.summary.totalUsage.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">7일 사용량</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-green-500">{performance.summary.avgSatisfaction.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">평균 만족도</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className={`text-3xl font-bold ${performance.summary.requestionRate > 0.2 ? "text-red-500" : "text-blue-500"}`}>
                  {(performance.summary.requestionRate * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">재질문률</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className={`text-3xl font-bold ${performance.summary.lowPerformerCount > 0 ? "text-orange-500" : "text-green-500"}`}>
                  {performance.summary.lowPerformerCount}
                </p>
                <p className="text-sm text-muted-foreground">저성능 알림</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Low Performer Alerts */}
        {performance?.lowPerformers && performance.lowPerformers.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-orange-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                저성능 프롬프트 알림
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {performance.lowPerformers.slice(0, 3).map((alert, i) => (
                  <div key={i} className="flex items-center justify-between bg-white p-3 rounded-lg">
                    <div>
                      <p className="font-medium">{alert.assetName}</p>
                      <p className="text-sm text-muted-foreground">{alert.reason}</p>
                    </div>
                    <span className="text-red-500 font-bold">{alert.currentScore.toFixed(0)}점</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Asset Tree by Level */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Asset List */}
          <div className="lg:col-span-2 space-y-4">
            {(["CORE", "DOMAIN", "GRADE", "SUBJECT", "UNIT"] as PromptLevel[]).map((level) => (
              <Card key={level}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded text-sm ${LEVEL_COLORS[level]}`}>
                      {LEVEL_LABELS[level]}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {groupedAssets[level]?.length || 0}개
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {groupedAssets[level]?.map((asset) => (
                    <div
                      key={asset.id}
                      className={`p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedAsset?.id === asset.id ? "border-primary bg-primary/5" : ""
                      }`}
                      onClick={() => setSelectedAsset(asset)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${asset.isActive ? "bg-green-500" : "bg-gray-300"}`} />
                          <span className="font-medium">{asset.name}</span>
                          {asset.isDefault && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">기본</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {asset.avgScore !== undefined && (
                            <span className={asset.avgScore >= 70 ? "text-green-600" : "text-orange-500"}>
                              {asset.avgScore.toFixed(0)}점
                            </span>
                          )}
                          <span>{asset.usageCount.toLocaleString()}회</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(asset.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      {asset.description && (
                        <p className="text-sm text-muted-foreground mt-1 truncate">{asset.description}</p>
                      )}
                    </div>
                  )) || (
                    <p className="text-sm text-muted-foreground text-center py-4">자산 없음</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Selected Asset Detail */}
          <div>
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>자산 상세</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedAsset ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">이름</p>
                      <p className="font-medium">{selectedAsset.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">레벨</p>
                      <span className={`px-2 py-1 rounded text-sm ${LEVEL_COLORS[selectedAsset.level]}`}>
                        {LEVEL_LABELS[selectedAsset.level]}
                      </span>
                    </div>
                    {selectedAsset.description && (
                      <div>
                        <p className="text-sm text-muted-foreground">설명</p>
                        <p>{selectedAsset.description}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">사용량</p>
                        <p className="font-medium">{selectedAsset.usageCount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">평균 점수</p>
                        <p className="font-medium">{selectedAsset.avgScore?.toFixed(1) || "-"}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">버전</p>
                        <p className="font-medium">{selectedAsset._count?.versions || 0}개</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">문제 프롬프트</p>
                        <p className="font-medium">{selectedAsset._count?.problemPrompts || 0}개</p>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Link href={`/admin/ai-tutor/prompts/${selectedAsset.id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          <Edit className="w-4 h-4 mr-2" />
                          편집
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    자산을 선택하세요
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
              <CardHeader>
                <CardTitle>새 프롬프트 자산</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">레벨</label>
                    <select
                      value={newAsset.level}
                      onChange={(e) => setNewAsset({ ...newAsset, level: e.target.value as PromptLevel })}
                      className="w-full p-2 border rounded-lg"
                    >
                      {Object.entries(LEVEL_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">이름</label>
                    <Input
                      value={newAsset.name}
                      onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                      placeholder="수학 튜터 프롬프트"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">설명</label>
                  <Input
                    value={newAsset.description}
                    onChange={(e) => setNewAsset({ ...newAsset, description: e.target.value })}
                    placeholder="프롬프트 설명"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">프롬프트 내용</label>
                  <textarea
                    value={newAsset.content}
                    onChange={(e) => setNewAsset({ ...newAsset, content: e.target.value })}
                    className="w-full h-32 p-2 border rounded-lg resize-none"
                    placeholder="당신은 학생의 전담 1대1 AI 튜터입니다..."
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>
                    취소
                  </Button>
                  <Button className="flex-1" onClick={handleCreate}>
                    <Save className="w-4 h-4 mr-2" />
                    생성
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
