"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Target, Plus, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Progress } from "@/components/ui";
import Header from "@/components/layout/Header";

// Mock data
const mockGoals = [
  {
    id: "1",
    childName: "홍길동",
    title: "수학 II 완강하기",
    targetDate: "2024-12-31",
    progress: 75,
    status: "IN_PROGRESS",
    milestones: [
      { title: "미분 단원 완료", completed: true },
      { title: "적분 단원 완료", completed: false },
      { title: "종합 평가 90점 이상", completed: false },
    ],
  },
  {
    id: "2",
    childName: "홍길동",
    title: "주 10시간 학습",
    targetDate: "2024-12-22",
    progress: 60,
    status: "IN_PROGRESS",
    milestones: [
      { title: "월요일 2시간", completed: true },
      { title: "화요일 2시간", completed: true },
      { title: "수요일 2시간", completed: true },
      { title: "목요일 2시간", completed: false },
      { title: "금요일 2시간", completed: false },
    ],
  },
];

export default function ParentGoalsPage() {
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
          href="/parent/dashboard"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          학부모 대시보드로 돌아가기
        </Link>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6" />
            학습 목표 관리
          </h1>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            목표 추가
          </Button>
        </div>

        <div className="grid gap-4">
          {mockGoals.map((goal) => (
            <Card key={goal.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{goal.title}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {goal.targetDate}까지
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <Progress value={goal.progress} className="flex-1" />
                  <span className="text-sm font-medium">{goal.progress}%</span>
                </div>
              </CardHeader>
              <CardContent>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  마일스톤
                </h4>
                <div className="space-y-2">
                  {goal.milestones.map((milestone, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 p-2 rounded-lg ${
                        milestone.completed ? "bg-green-50" : "bg-muted"
                      }`}
                    >
                      <CheckCircle2
                        className={`w-5 h-5 ${
                          milestone.completed ? "text-green-500" : "text-muted-foreground"
                        }`}
                      />
                      <span
                        className={
                          milestone.completed ? "text-green-700" : "text-muted-foreground"
                        }
                      >
                        {milestone.title}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
