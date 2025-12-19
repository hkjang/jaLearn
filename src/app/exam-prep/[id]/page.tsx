"use client";

import { useSession } from "next-auth/react";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { use } from "react";
import { ChevronLeft, Target, Calendar, TrendingUp, BookOpen, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Progress } from "@/components/ui";
import Header from "@/components/layout/Header";

// Mock data
const mockExamGoals: Record<string, {
  id: string;
  examType: string;
  examName: string;
  targetDate: string;
  targetScore: number;
  currentScore: number;
  subjects: string[];
  daysLeft: number;
  recommendations: string[];
}> = {
  "1": {
    id: "1",
    examType: "SUNEUNG",
    examName: "2025학년도 대학수학능력시험",
    targetDate: "2025-11-13",
    targetScore: 95,
    currentScore: 82,
    subjects: ["국어", "수학", "영어", "탐구"],
    daysLeft: 329,
    recommendations: [
      "미적분 심화 문제 풀이 증가",
      "실전 모의고사 주 1회 실시",
      "오답 노트 정리 습관화",
    ],
  },
};

export default function ExamPrepDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
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

  const goal = mockExamGoals[id];

  if (!goal) {
    notFound();
  }

  const scoreProgress = Math.round((goal.currentScore / goal.targetScore) * 100);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container-main py-6 space-y-6">
        <Link
          href="/exam-prep"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          시험 대비 목록으로 돌아가기
        </Link>

        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6" />
            {goal.examName}
          </h1>
          <div className="flex items-center gap-4 mt-2 text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              D-{goal.daysLeft}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {goal.targetDate}
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Score Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                점수 목표
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-4xl font-bold text-primary">{goal.currentScore}</p>
                <p className="text-muted-foreground">현재 예상 점수</p>
              </div>
              <Progress value={scoreProgress} className="h-3" />
              <div className="flex justify-between text-sm">
                <span>시작</span>
                <span className="font-medium">목표: {goal.targetScore}점</span>
              </div>
            </CardContent>
          </Card>

          {/* Subjects */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                학습 과목
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {goal.subjects.map((subject, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-2 bg-primary/10 text-primary rounded-lg font-medium"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>AI 학습 추천</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {goal.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
