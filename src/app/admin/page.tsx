"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  Users, 
  BookOpen, 
  BarChart3,
  Settings,
  TrendingUp,
  Clock,
  UserCheck,
  FileText,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Progress, Button } from "@/components/ui";
import Header from "@/components/layout/Header";

// Mock admin stats
const mockStats = {
  totalUsers: 12543,
  activeUsers: 8932,
  totalCourses: 124,
  pendingApprovals: 8,
  weeklyActiveRate: 71,
  avgStudyTime: 42, // minutes per day
};

const mockRecentActivity = [
  { id: "1", type: "user", message: "새로운 학생 가입: 김민수", time: "5분 전" },
  { id: "2", type: "course", message: "새 강좌 등록 대기: 영어 문법 심화", time: "12분 전" },
  { id: "3", type: "report", message: "주간 학습 리포트 생성 완료", time: "1시간 전" },
  { id: "4", type: "alert", message: "서버 용량 80% 도달", time: "2시간 전" },
];

const mockPendingCourses = [
  { id: "1", title: "수학 심화 - 미적분", teacher: "박선생님", submitted: "2024-01-15" },
  { id: "2", title: "영어 문법 심화", teacher: "이선생님", submitted: "2024-01-14" },
  { id: "3", title: "과학 탐구 - 화학", teacher: "김선생님", submitted: "2024-01-13" },
];

export default function AdminDashboard() {
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

  // Check if user is admin
  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container-main py-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">관리자 대시보드</h1>
            <p className="text-muted-foreground">
              시스템 현황과 콘텐츠를 관리하세요
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/users">
              <Button variant="outline">
                <Users className="w-4 h-4 mr-2" />
                사용자 관리
              </Button>
            </Link>
            <Link href="/admin/content">
              <Button>
                <BookOpen className="w-4 h-4 mr-2" />
                콘텐츠 관리
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-blue-500" />
                <span className="text-xs text-green-600 font-medium">+12%</span>
              </div>
              <p className="text-2xl font-bold">{mockStats.totalUsers.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">전체 사용자</p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <UserCheck className="w-5 h-5 text-green-500" />
                <span className="text-xs text-green-600 font-medium">{mockStats.weeklyActiveRate}%</span>
              </div>
              <p className="text-2xl font-bold">{mockStats.activeUsers.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">활성 사용자</p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <BookOpen className="w-5 h-5 text-purple-500" />
                <span className="text-xs text-orange-600 font-medium">+{mockStats.pendingApprovals} 대기</span>
              </div>
              <p className="text-2xl font-bold">{mockStats.totalCourses}</p>
              <p className="text-sm text-muted-foreground">등록 강좌</p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <span className="text-xs text-green-600 font-medium">+8%</span>
              </div>
              <p className="text-2xl font-bold">{mockStats.avgStudyTime}분</p>
              <p className="text-sm text-muted-foreground">일평균 학습</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pending Approvals */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                승인 대기 강좌
              </CardTitle>
              <Link href="/admin/content" className="text-sm text-primary hover:underline">
                전체보기
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockPendingCourses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{course.title}</p>
                    <p className="text-sm text-muted-foreground">{course.teacher}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">거절</Button>
                    <Button size="sm">승인</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                최근 활동
              </CardTitle>
              <Link href="/admin/activity" className="text-sm text-primary hover:underline">
                전체보기
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockRecentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === "user" ? "bg-blue-500" :
                    activity.type === "course" ? "bg-green-500" :
                    activity.type === "report" ? "bg-purple-500" :
                    "bg-orange-500"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/admin/users">
            <Card className="card-hover p-4 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">사용자 관리</p>
            </Card>
          </Link>
          <Link href="/admin/content">
            <Card className="card-hover p-4 text-center">
              <BookOpen className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">콘텐츠 관리</p>
            </Card>
          </Link>
          <Link href="/admin/analytics">
            <Card className="card-hover p-4 text-center">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">통계 분석</p>
            </Card>
          </Link>
          <Link href="/admin/settings">
            <Card className="card-hover p-4 text-center">
              <Settings className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">설정</p>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
