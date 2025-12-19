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
  Trophy,
  Clock,
  Users,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Progress } from "@/components/ui";
import Header from "@/components/layout/Header";

interface TestVariant {
  id: string;
  name: string;
  allocation: number;
  impressions: number;
  conversions: number;
  avgScore?: number;
}

interface ABTest {
  id: string;
  name: string;
  description?: string;
  status: "DRAFT" | "RUNNING" | "COMPLETED" | "STOPPED";
  startDate?: string;
  endDate?: string;
  winnerId?: string;
  winnerReason?: string;
  percentage: number;
  variants: TestVariant[];
  _count?: {
    assignments: number;
  };
  createdAt: string;
}

interface TestResults {
  testId: string;
  name: string;
  status: string;
  duration: number;
  variants: Array<{
    id: string;
    name: string;
    impressions: number;
    avgScore: number;
    conversionRate: number;
    isWinner: boolean;
  }>;
  recommendation: string;
  significance?: {
    isSignificant: boolean;
    confidence: number;
    message: string;
  };
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
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);
  const [testResults, setTestResults] = useState<TestResults | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTest, setNewTest] = useState({
    name: "",
    description: "",
    percentage: 100,
    variants: [
      { name: "Control", versionId: "", allocation: 50 },
      { name: "Variant A", versionId: "", allocation: 50 },
    ],
  });

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const res = await fetch("/api/admin/prompts/ab-tests");
      const data = await res.json();
      setTests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTestResults = async (testId: string) => {
    try {
      const res = await fetch(`/api/admin/prompts/ab-tests/${testId}`);
      const data = await res.json();
      setTestResults(data);
    } catch (error) {
      console.error("Fetch results error:", error);
    }
  };

  const handleAction = async (testId: string, action: "start" | "stop" | "declareWinner") => {
    try {
      await fetch(`/api/admin/prompts/ab-tests/${testId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      fetchTests();
      if (selectedTest?.id === testId) {
        fetchTestResults(testId);
      }
    } catch (error) {
      console.error("Action error:", error);
    }
  };

  const handleDelete = async (testId: string) => {
    if (!confirm("이 테스트를 삭제하시겠습니까?")) return;
    try {
      await fetch(`/api/admin/prompts/ab-tests/${testId}`, { method: "DELETE" });
      fetchTests();
      if (selectedTest?.id === testId) {
        setSelectedTest(null);
        setTestResults(null);
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/admin/prompts/ab-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTest),
      });
      if (res.ok) {
        setShowCreateModal(false);
        setNewTest({
          name: "",
          description: "",
          percentage: 100,
          variants: [
            { name: "Control", versionId: "", allocation: 50 },
            { name: "Variant A", versionId: "", allocation: 50 },
          ],
        });
        fetchTests();
      }
    } catch (error) {
      console.error("Create error:", error);
    }
  };

  const selectTest = (test: ABTest) => {
    setSelectedTest(test);
    fetchTestResults(test.id);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      DRAFT: "bg-gray-100 text-gray-700",
      RUNNING: "bg-green-100 text-green-700",
      COMPLETED: "bg-blue-100 text-blue-700",
      STOPPED: "bg-red-100 text-red-700",
    };
    const labels = {
      DRAFT: "준비중",
      RUNNING: "진행중",
      COMPLETED: "완료",
      STOPPED: "중지",
    };
    return (
      <span className={`px-2 py-1 rounded text-xs ${styles[status as keyof typeof styles] || styles.DRAFT}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
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
              A/B 테스트 관리
            </h1>
            <p className="text-muted-foreground">프롬프트 실험 및 성과 비교</p>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">{tests.length}</p>
              <p className="text-sm text-muted-foreground">전체 테스트</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-500">
                {tests.filter(t => t.status === "RUNNING").length}
              </p>
              <p className="text-sm text-muted-foreground">진행중</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-blue-500">
                {tests.filter(t => t.status === "COMPLETED").length}
              </p>
              <p className="text-sm text-muted-foreground">완료</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-purple-500">
                {tests.reduce((sum, t) => sum + (t._count?.assignments || 0), 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">총 참여자</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Test List */}
          <div className="lg:col-span-2 space-y-4">
            {tests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FlaskConical className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">A/B 테스트가 없습니다</p>
                  <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    첫 테스트 만들기
                  </Button>
                </CardContent>
              </Card>
            ) : (
              tests.map((test) => (
                <Card 
                  key={test.id} 
                  className={`cursor-pointer hover:border-primary transition-colors ${
                    selectedTest?.id === test.id ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => selectTest(test)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{test.name}</h3>
                          {getStatusBadge(test.status)}
                        </div>
                        {test.description && (
                          <p className="text-sm text-muted-foreground mt-1">{test.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        {/* Variant Stats */}
                        <div className="flex gap-2">
                          {test.variants.map((v, i) => (
                            <div key={v.id} className="text-center min-w-[60px]">
                              <p className="text-xs text-muted-foreground">{v.name}</p>
                              <p className="font-medium text-sm">{v.impressions}</p>
                            </div>
                          ))}
                        </div>
                        
                        {/* Actions */}
                        <div className="flex gap-1">
                          {test.status === "DRAFT" && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={(e) => { e.stopPropagation(); handleAction(test.id, "start"); }}
                              title="시작"
                            >
                              <Play className="w-4 h-4 text-green-600" />
                            </Button>
                          )}
                          {test.status === "RUNNING" && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); handleAction(test.id, "stop"); }}
                                title="중지"
                              >
                                <Pause className="w-4 h-4 text-orange-600" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); handleAction(test.id, "declareWinner"); }}
                                title="승자 선언"
                              >
                                <Trophy className="w-4 h-4 text-yellow-600" />
                              </Button>
                            </>
                          )}
                          {test.status !== "RUNNING" && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={(e) => { e.stopPropagation(); handleDelete(test.id); }}
                              title="삭제"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Test Results Panel */}
          <div>
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>테스트 결과</CardTitle>
              </CardHeader>
              <CardContent>
                {testResults ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">진행 기간</span>
                      <span className="font-medium">{testResults.duration}일</span>
                    </div>
                    
                    {/* Statistical Significance */}
                    {testResults.significance && (
                      <div className={`p-3 rounded-lg ${
                        testResults.significance.isSignificant 
                          ? "bg-green-50 border border-green-200" 
                          : "bg-yellow-50 border border-yellow-200"
                      }`}>
                        <div className="flex items-center gap-2">
                          {testResults.significance.isSignificant ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-yellow-600" />
                          )}
                          <span className="text-sm font-medium">
                            {testResults.significance.message}
                          </span>
                        </div>
                        <Progress 
                          value={testResults.significance.confidence} 
                          className="mt-2 h-2"
                        />
                      </div>
                    )}
                    
                    {/* Variant Comparison */}
                    <div className="space-y-3">
                      {testResults.variants.map((v) => (
                        <div 
                          key={v.id} 
                          className={`p-3 rounded-lg border ${
                            v.isWinner ? "border-yellow-300 bg-yellow-50" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium flex items-center gap-2">
                              {v.name}
                              {v.isWinner && <Trophy className="w-4 h-4 text-yellow-600" />}
                            </span>
                            <span className="text-sm">{v.impressions} 노출</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">평균 점수</p>
                              <p className="font-medium">{v.avgScore.toFixed(1)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">전환율</p>
                              <p className="font-medium">{(v.conversionRate * 100).toFixed(1)}%</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Recommendation */}
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">추천</p>
                      <p className="text-sm text-muted-foreground">{testResults.recommendation}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    테스트를 선택하세요
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
                <CardTitle>새 A/B 테스트</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">테스트 이름</label>
                  <Input
                    value={newTest.name}
                    onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                    placeholder="새 말투 테스트"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">설명</label>
                  <Input
                    value={newTest.description}
                    onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                    placeholder="친근한 말투 vs 격식체"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">트래픽 비율 (%)</label>
                  <Input
                    type="number"
                    value={newTest.percentage}
                    onChange={(e) => setNewTest({ ...newTest, percentage: parseInt(e.target.value) || 100 })}
                    min={1}
                    max={100}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">변형 (할당 % 합계 100)</label>
                  {newTest.variants.map((v, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        value={v.name}
                        onChange={(e) => {
                          const variants = [...newTest.variants];
                          variants[i].name = e.target.value;
                          setNewTest({ ...newTest, variants });
                        }}
                        placeholder="변형 이름"
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={v.allocation}
                        onChange={(e) => {
                          const variants = [...newTest.variants];
                          variants[i].allocation = parseInt(e.target.value) || 0;
                          setNewTest({ ...newTest, variants });
                        }}
                        className="w-20"
                        min={0}
                        max={100}
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
