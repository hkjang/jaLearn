"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, BarChart3, TrendingUp, Users, Eye, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import Header from "@/components/layout/Header";

// Mock data
const mockAnalytics = {
  totalViews: 45678,
  totalStudents: 2341,
  avgWatchTime: 32,
  completionRate: 78,
  courseStats: [
    { title: "수능 국어 비문학 독해법", views: 23456, students: 1523, completion: 82 },
    { title: "국어 문학 완전정복", views: 12345, students: 567, completion: 75 },
    { title: "수능 국어 화법과 작문", views: 9877, students: 251, completion: 68 },
  ],
};

export default function InstructorAnalyticsPage() {
  const { status } = useSession({
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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container-main py-6 space-y-6">
        <Link
          href="/instructor/dashboard"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          강사 대시보드로 돌아가기
        </Link>

        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          강좌 분석
        </h1>

        {/* Overview Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{mockAnalytics.totalViews.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">총 조회수</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{mockAnalytics.totalStudents.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">총 수강생</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{mockAnalytics.avgWatchTime}분</p>
                  <p className="text-sm text-muted-foreground">평균 시청 시간</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{mockAnalytics.completionRate}%</p>
                  <p className="text-sm text-muted-foreground">평균 완료율</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Course Stats */}
        <Card>
          <CardHeader>
            <CardTitle>강좌별 통계</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {mockAnalytics.courseStats.map((course, idx) => (
                <div key={idx} className="py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{course.title}</p>
                  </div>
                  <div className="flex items-center gap-8 text-sm">
                    <div className="text-center">
                      <p className="font-semibold">{course.views.toLocaleString()}</p>
                      <p className="text-muted-foreground">조회수</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">{course.students}</p>
                      <p className="text-muted-foreground">수강생</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">{course.completion}%</p>
                      <p className="text-muted-foreground">완료율</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
