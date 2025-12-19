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
  Copy
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from "@/components/ui";
import Header from "@/components/layout/Header";

interface PromptVersion {
  id: string;
  version: string;
  name: string;
  description: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  metrics?: {
    usageCount: number;
    avgQualityScore: number;
    avgSatisfaction: number;
  };
}

export default function AdminPromptsPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login");
    },
  });

  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newVersion, setNewVersion] = useState({
    version: "",
    name: "",
    description: "",
    systemPrompt: "",
  });

  useEffect(() => {
    fetchVersions();
  }, []);

  const fetchVersions = async () => {
    try {
      const res = await fetch("/api/admin/prompts");
      const data = await res.json();
      setVersions(data.versions || []);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (versionId: string) => {
    try {
      await fetch("/api/admin/prompts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId, action: "activate" }),
      });
      fetchVersions();
    } catch (error) {
      console.error("Activate error:", error);
    }
  };

  const handleRollback = async (versionId: string) => {
    if (!confirm("이 버전으로 롤백하시겠습니까?")) return;
    try {
      await fetch("/api/admin/prompts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId, action: "rollback" }),
      });
      fetchVersions();
    } catch (error) {
      console.error("Rollback error:", error);
    }
  };

  const handleDelete = async (versionId: string) => {
    if (!confirm("이 버전을 삭제하시겠습니까?")) return;
    try {
      await fetch(`/api/admin/prompts?versionId=${versionId}`, { method: "DELETE" });
      fetchVersions();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleCreate = async () => {
    try {
      await fetch("/api/admin/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newVersion),
      });
      setShowCreateModal(false);
      setNewVersion({ version: "", name: "", description: "", systemPrompt: "" });
      fetchVersions();
    } catch (error) {
      console.error("Create error:", error);
    }
  };

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
              <FileText className="w-6 h-6" />
              프롬프트 관리
            </h1>
            <p className="text-muted-foreground">AI 튜터 프롬프트 버전 관리</p>
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
              새 버전
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">{versions.length}</p>
              <p className="text-sm text-muted-foreground">전체 버전</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-500">{versions.filter(v => v.isActive).length}</p>
              <p className="text-sm text-muted-foreground">활성 버전</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-blue-500">
                {versions.reduce((sum, v) => sum + (v.metrics?.usageCount || 0), 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">총 사용량</p>
            </CardContent>
          </Card>
        </div>

        {/* Versions List */}
        <div className="space-y-4">
          {versions.map((version) => (
            <Card key={version.id} className={version.isActive ? "border-primary" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${version.isActive ? "bg-green-500" : "bg-gray-300"}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{version.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded bg-muted">{version.version}</span>
                        {version.isDefault && (
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">기본</span>
                        )}
                        {version.isActive && (
                          <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">활성</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{version.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Metrics */}
                    {version.metrics && (
                      <div className="flex gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-medium">{version.metrics.usageCount.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">사용</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{(version.metrics.avgQualityScore * 100).toFixed(0)}%</p>
                          <p className="text-xs text-muted-foreground">품질</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{version.metrics.avgSatisfaction.toFixed(1)}</p>
                          <p className="text-xs text-muted-foreground">만족도</p>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-1">
                      {!version.isActive && (
                        <Button variant="ghost" size="icon" onClick={() => handleActivate(version.id)} title="활성화">
                          <Play className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleRollback(version.id)} title="롤백">
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="복제">
                        <Copy className="w-4 h-4" />
                      </Button>
                      {!version.isDefault && (
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(version.id)} title="삭제" className="text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
              <CardHeader>
                <CardTitle>새 프롬프트 버전</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">버전</label>
                    <Input
                      value={newVersion.version}
                      onChange={(e) => setNewVersion({ ...newVersion, version: e.target.value })}
                      placeholder="1.3.0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">이름</label>
                    <Input
                      value={newVersion.name}
                      onChange={(e) => setNewVersion({ ...newVersion, name: e.target.value })}
                      placeholder="감정 인식 튜터"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">설명</label>
                  <Input
                    value={newVersion.description}
                    onChange={(e) => setNewVersion({ ...newVersion, description: e.target.value })}
                    placeholder="변경 사항 요약"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">시스템 프롬프트</label>
                  <textarea
                    value={newVersion.systemPrompt}
                    onChange={(e) => setNewVersion({ ...newVersion, systemPrompt: e.target.value })}
                    className="w-full h-32 p-2 border rounded-lg resize-none"
                    placeholder="당신은 학생의 전담 1대1 AI 튜터입니다..."
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>
                    취소
                  </Button>
                  <Button className="flex-1" onClick={handleCreate}>
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
