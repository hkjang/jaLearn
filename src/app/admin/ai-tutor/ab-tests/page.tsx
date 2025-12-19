"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  FlaskConical,
  Plus,
  Play,
  Pause,
  CheckCircle,
  Trash2,
  BarChart3,
  FileText,
  Trophy
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Progress } from "@/components/ui";
import Header from "@/components/layout/Header";

interface ABTest {
  id: string;
  name: string;
  description: string;
  status: "DRAFT" | "RUNNING" | "COMPLETED" | "STOPPED";
  startDate?: string;
  endDate?: string;
  winnerVariantId?: string;
  variants: {
    id: string;
    name: string;
    allocation: number;
    metrics?: {
      usageCount: number;
      avgQualityScore: number;
    };
  }[];
}

export default function AdminABTestsPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login");
    },
  });

  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTest, setNewTest] = useState({
    name: "",
    description: "",
    variants: [{ name: "변형 A", promptVersionId: "" }, { name: "변형 B", promptVersionId: "" }],
  });

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const res = await fetch("/api/admin/ab-tests");
      const data = await res.json();
      setTests(data.tests || []);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (testId: string, action: "start" | "stop" | "finish") => {
    try {
      await fetch("/api/admin/ab-tests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId, action }),
      });
      fetchTests();
    } catch (error) {
      console.error("Action error:", error);
    }
  };

  const handleDelete = async (testId: string) => {
    if (!confirm("이 테스트를 삭제하시겠습니까?")) return;
    try {
      await fetch(`/api/admin/ab-tests?testId=${testId}`, { method: "DELETE" });
      fetchTests();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleCreate = async () => {
    try {
      await fetch("/api/admin/ab-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTest),
      });
      setShowCreateModal(false);
      setNewTest({
        name: "",
        description: "",
        variants: [{ name: "변형 A", promptVersionId: "" }, { name: "변형 B", promptVersionId: "" }],
      });
      fetchTests();
    } catch (error) {
      console.error("Create error:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: "bg-gray-100 text-gray-700",
      RUNNING: "bg-green-100 text-green-700",
      COMPLETED: "bg-blue-100 text-blue-700",
      STOPPED: "bg-red-100 text-red-700",
    };
    const labels: Record<string, string> = {
      DRAFT: "초안",
      RUNNING: "진행 중",
      COMPLETED: "완료",
      STOPPED: "중단",
    };
    return <span className={`text-xs px-2 py-0.5 rounded ${styles[status]}`}>{labels[status]}</span>;
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
              <FlaskConical className="w-6 h-6" />
              A/B 테스트
            </h1>
            <p className="text-muted-foreground">프롬프트 실험 및 비교 분석</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/ai-tutor/prompts">
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                프롬프트 관리
              </Button>
            </Link>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              새 테스트
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">{tests.length}</p>
              <p className="text-sm text-muted-foreground">전체 테스트</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-500">{tests.filter(t => t.status === "RUNNING").length}</p>
              <p className="text-sm text-muted-foreground">진행 중</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-blue-500">{tests.filter(t => t.status === "COMPLETED").length}</p>
              <p className="text-sm text-muted-foreground">완료</p>
            </CardContent>
          </Card>
        </div>

        {/* Tests List */}
        <div className="space-y-4">
          {tests.map((test) => (
            <Card key={test.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{test.name}</h3>
                      {getStatusBadge(test.status)}
                      {test.winnerVariantId && (
                        <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 flex items-center gap-1">
                          <Trophy className="w-3 h-3" />
                          승자: {test.variants.find(v => v.id === test.winnerVariantId)?.name}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{test.description}</p>
                    {test.startDate && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(test.startDate).toLocaleDateString("ko-KR")}
                        {test.endDate && ` ~ ${new Date(test.endDate).toLocaleDateString("ko-KR")}`}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1">
                    {test.status === "DRAFT" && (
                      <Button variant="ghost" size="icon" onClick={() => handleAction(test.id, "start")} title="시작">
                        <Play className="w-4 h-4 text-green-500" />
                      </Button>
                    )}
                    {test.status === "RUNNING" && (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => handleAction(test.id, "stop")} title="중단">
                          <Pause className="w-4 h-4 text-orange-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleAction(test.id, "finish")} title="완료">
                          <CheckCircle className="w-4 h-4 text-blue-500" />
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(test.id)} title="삭제" className="text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Variants Comparison */}
                <div className="grid grid-cols-2 gap-4">
                  {test.variants.map((variant) => {
                    const isWinner = test.winnerVariantId === variant.id;
                    return (
                      <div
                        key={variant.id}
                        className={`p-3 rounded-lg ${isWinner ? "bg-yellow-50 border-2 border-yellow-200" : "bg-muted/50"}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{variant.name}</span>
                          <span className="text-xs text-muted-foreground">{(variant.allocation * 100).toFixed(0)}%</span>
                        </div>
                        {variant.metrics && (
                          <div className="space-y-2">
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>품질 점수</span>
                                <span>{(variant.metrics.avgQualityScore * 100).toFixed(0)}%</span>
                              </div>
                              <Progress value={variant.metrics.avgQualityScore * 100} />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              사용: {variant.metrics.usageCount.toLocaleString()}회
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                <CardTitle>새 A/B 테스트</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">테스트 이름</label>
                  <Input
                    value={newTest.name}
                    onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                    placeholder="소크라테스 vs 직접 설명"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">설명</label>
                  <Input
                    value={newTest.description}
                    onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                    placeholder="어떤 방식이 더 효과적인지 비교"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">변형</label>
                  {newTest.variants.map((variant, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        value={variant.name}
                        onChange={(e) => {
                          const variants = [...newTest.variants];
                          variants[i].name = e.target.value;
                          setNewTest({ ...newTest, variants });
                        }}
                        placeholder={`변형 ${String.fromCharCode(65 + i)}`}
                      />
                    </div>
                  ))}
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
