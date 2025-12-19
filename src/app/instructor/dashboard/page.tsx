"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  DollarSign, 
  Users,
  BookOpen,
  Star,
  TrendingUp,
  Plus,
  Eye,
  Edit,
  BarChart3,
  Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Progress } from "@/components/ui";
import Header from "@/components/layout/Header";

// Mock instructor data
const mockInstructorStats = {
  totalEarnings: 2450000,
  monthlyEarnings: 890000,
  totalStudents: 234,
  totalCourses: 5,
  avgRating: 4.8,
  totalViews: 12500,
};

const mockCourses = [
  { id: "1", title: "수학 기초 완성", students: 89, rating: 4.9, earnings: 890000, status: "published" },
  { id: "2", title: "중등 수학 심화", students: 67, rating: 4.7, earnings: 670000, status: "published" },
  { id: "3", title: "고등 수학 I", students: 45, rating: 4.8, earnings: 540000, status: "published" },
  { id: "4", title: "확률과 통계", students: 33, rating: 4.6, earnings: 350000, status: "draft" },
];

const mockRecentReviews = [
  { id: "1", student: "김**", course: "수학 기초 완성", rating: 5, content: "설명이 정말 이해하기 쉬워요!", date: "2024-01-15" },
  { id: "2", student: "이**", course: "중등 수학 심화", rating: 5, content: "선생님 덕분에 성적이 올랐어요", date: "2024-01-14" },
  { id: "3", student: "박**", course: "고등 수학 I", rating: 4, content: "좋은 강의입니다", date: "2024-01-13" },
];

export default function InstructorDashboard() {
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

  // Note: In real app, check if user has approved instructor profile
  // For demo, allow TEACHER role
  if (session?.user?.role !== "TEACHER" && session?.user?.role !== "ADMIN") {
    redirect("/instructor/apply");
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("ko-KR").format(amount);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container-main py-6 space-y-6">
        {/* Welcome */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">강사 대시보드</h1>
            <p className="text-muted-foreground">
              안녕하세요, {session?.user?.name || "선생님"}! 오늘도 학생들과 함께하세요.
            </p>
          </div>
          <Link href="/instructor/courses/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              새 강좌 만들기
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                <span className="text-xs text-green-600 font-medium">+15%</span>
              </div>
              <p className="text-2xl font-bold">₩{formatPrice(mockInstructorStats.monthlyEarnings)}</p>
              <p className="text-sm text-muted-foreground">이번 달 수익</p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-blue-500" />
                <span className="text-xs text-green-600 font-medium">+23</span>
              </div>
              <p className="text-2xl font-bold">{mockInstructorStats.totalStudents}</p>
              <p className="text-sm text-muted-foreground">총 수강생</p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
              <p className="text-2xl font-bold">{mockInstructorStats.avgRating}</p>
              <p className="text-sm text-muted-foreground">평균 평점</p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Eye className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-2xl font-bold">{mockInstructorStats.totalViews.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">총 조회수</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* My Courses */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                내 강좌
              </CardTitle>
              <Link href="/instructor/courses" className="text-sm text-primary hover:underline">
                전체보기
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockCourses.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{course.title}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          course.status === "published" 
                            ? "bg-green-100 text-green-700" 
                            : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {course.status === "published" ? "공개" : "임시저장"}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> {course.students}명
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500" /> {course.rating}
                        </span>
                        <span>₩{formatPrice(course.earnings)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon">
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Reviews */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                최근 리뷰
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockRecentReviews.map((review) => (
                <div key={review.id} className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{review.student}</span>
                    <div className="flex items-center gap-1">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{review.content}</p>
                  <p className="text-xs text-muted-foreground">{review.course} · {review.date}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/instructor/courses">
            <Card className="card-hover p-4 text-center">
              <BookOpen className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">강좌 관리</p>
            </Card>
          </Link>
          <Link href="/instructor/analytics">
            <Card className="card-hover p-4 text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">통계 분석</p>
            </Card>
          </Link>
          <Link href="/instructor/settlements">
            <Card className="card-hover p-4 text-center">
              <DollarSign className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">정산 내역</p>
            </Card>
          </Link>
          <Link href="/instructor/schedule">
            <Card className="card-hover p-4 text-center">
              <Calendar className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">일정 관리</p>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
