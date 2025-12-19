"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  Users, 
  BookOpen,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Bell,
  MessageSquare,
  BarChart3,
  Calendar,
  CheckCircle,
  Target
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Progress } from "@/components/ui";
import Header from "@/components/layout/Header";

// Mock children data
const mockChildren = [
  {
    id: "1",
    name: "김민수",
    gradeLevel: "HIGH_1",
    lastActive: "10분 전",
    weeklyStudyTime: 840, // minutes
    weeklyGoal: 1200,
    recentScore: 85,
    scoreChange: 5,
    status: "active",
  },
];

// Mock reports
const mockReports = {
  todayStudyTime: 45,
  weeklyStudyTime: 840,
  completedLessons: 12,
  quizAverage: 85,
  aiInteractions: 23,
  strengths: ["영어 독해", "수학 방정식"],
  improvements: ["국어 문학", "과학 화학"],
  aiComment: "이번 주 학습량이 목표 대비 70%입니다. 수학 미적분 단원에서 어려움을 겪고 있으니, AI 튜터와 함께 보충 학습을 권장합니다. 영어는 꾸준히 잘하고 있어요! 👍",
};

// Mock alerts
const mockAlerts = [
  { id: "1", type: "WARNING", title: "학습량 감소", message: "이번 주 학습량이 지난주 대비 30% 감소했습니다.", time: "2시간 전", isRead: false },
  { id: "2", type: "INFO", title: "시험 일정", message: "중간고사가 2주 후입니다. 복습 계획을 확인하세요.", time: "1일 전", isRead: true },
  { id: "3", type: "ACHIEVEMENT", title: "목표 달성!", message: "영어 단어 암기 목표를 달성했습니다! 🎉", time: "2일 전", isRead: true },
];

export default function ParentDashboard() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login");
    },
  });

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Check if user is parent
  if (session?.user?.role !== "PARENT" && session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}시간 ${mins}분`;
  };

  const child = mockChildren[0];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container-main py-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6" />
              학부모 대시보드
            </h1>
            <p className="text-muted-foreground">
              {child.name}님의 학습 현황을 확인하세요
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Bell className="w-4 h-4 mr-2" />
              알림 설정
            </Button>
            <Button>
              <MessageSquare className="w-4 h-4 mr-2" />
              1:1 상담 예약
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <span className="text-xs text-muted-foreground">오늘</span>
              </div>
              <p className="text-2xl font-bold">{mockReports.todayStudyTime}분</p>
              <p className="text-sm text-muted-foreground">학습 시간</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <BookOpen className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-2xl font-bold">{mockReports.completedLessons}개</p>
              <p className="text-sm text-muted-foreground">완료 강의</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-5 h-5 text-purple-500" />
                <span className={`flex items-center text-xs ${child.scoreChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {child.scoreChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(child.scoreChange)}점
                </span>
              </div>
              <p className="text-2xl font-bold">{mockReports.quizAverage}점</p>
              <p className="text-sm text-muted-foreground">평균 점수</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <MessageSquare className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-2xl font-bold">{mockReports.aiInteractions}회</p>
              <p className="text-sm text-muted-foreground">AI 튜터 질문</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Weekly Progress */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                주간 학습 현황
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>주간 학습 시간</span>
                  <span className="font-medium">{formatTime(child.weeklyStudyTime)} / {formatTime(child.weeklyGoal)}</span>
                </div>
                <Progress value={(child.weeklyStudyTime / child.weeklyGoal) * 100} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    잘하는 영역
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {mockReports.strengths.map((s) => (
                      <span key={s} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    보완 필요
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {mockReports.improvements.map((s) => (
                      <span key={s} className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                알림
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg ${
                    !alert.isRead ? "bg-primary/5 border-l-2 border-primary" : "bg-muted/50"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {alert.type === "WARNING" && <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5" />}
                    {alert.type === "INFO" && <Calendar className="w-4 h-4 text-blue-500 mt-0.5" />}
                    {alert.type === "ACHIEVEMENT" && <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{alert.title}</p>
                      <p className="text-xs text-muted-foreground">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* AI Comment */}
        <Card className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              AI 튜터 코멘트
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{mockReports.aiComment}</p>
            <Button variant="outline" size="sm" className="mt-4">
              상세 리포트 보기
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/parent/reports">
            <Card className="card-hover p-4 text-center">
              <BarChart3 className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">상세 리포트</p>
            </Card>
          </Link>
          <Link href="/parent/goals">
            <Card className="card-hover p-4 text-center">
              <Target className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">목표 설정</p>
            </Card>
          </Link>
          <Link href="/parent/consultation">
            <Card className="card-hover p-4 text-center">
              <MessageSquare className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">전문가 상담</p>
            </Card>
          </Link>
          <Link href="/parent/settings">
            <Card className="card-hover p-4 text-center">
              <Bell className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">알림 설정</p>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
