"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  Target, 
  Calendar,
  TrendingUp,
  BookOpen,
  Plus,
  ChevronRight,
  Trophy,
  AlertCircle,
  Clock,
  BarChart3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Progress } from "@/components/ui";
import Header from "@/components/layout/Header";

// Mock exam goals
const mockExamGoals = [
  {
    id: "1",
    examType: "SUNEUNG",
    examName: "2025학년도 대학수학능력시험",
    targetDate: "2024-11-14",
    targetScore: 95,
    currentScore: 82,
    subjects: ["국어", "수학", "영어"],
    daysLeft: 300,
  },
  {
    id: "2",
    examType: "MOCK",
    examName: "3월 모의평가",
    targetDate: "2024-03-28",
    targetScore: 90,
    currentScore: 78,
    subjects: ["국어", "수학", "영어", "탐구"],
    daysLeft: 68,
  },
];

// Mock predictions
const mockPredictions = [
  { subject: "국어", current: 78, predicted: 85, trend: "up" },
  { subject: "수학", current: 75, predicted: 82, trend: "up" },
  { subject: "영어", current: 90, predicted: 93, trend: "up" },
  { subject: "탐구", current: 70, predicted: 75, trend: "stable" },
];

// Mock calendar events
const mockCalendarEvents = [
  { id: "1", name: "3월 모의평가", date: "2024-03-28", type: "MOCK", daysLeft: 68 },
  { id: "2", name: "중간고사", date: "2024-04-20", type: "SCHOOL", daysLeft: 91 },
  { id: "3", name: "6월 모의평가", date: "2024-06-05", type: "MOCK", daysLeft: 137 },
];

export default function ExamPrepPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login");
    },
  });

  const [showAddModal, setShowAddModal] = useState(false);

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
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Target className="w-6 h-6" />
              시험 대비
            </h1>
            <p className="text-muted-foreground">
              목표 시험을 설정하고 AI와 함께 전략적으로 준비하세요
            </p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            목표 추가
          </Button>
        </div>

        {/* Active Goals */}
        <div className="grid lg:grid-cols-2 gap-4">
          {mockExamGoals.map((goal) => (
            <Card key={goal.id} className="card-hover">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    {goal.examName}
                  </CardTitle>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    goal.daysLeft <= 30 ? "bg-red-100 text-red-700" :
                    goal.daysLeft <= 90 ? "bg-orange-100 text-orange-700" :
                    "bg-green-100 text-green-700"
                  }`}>
                    D-{goal.daysLeft}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">현재 예상 점수</span>
                      <span className="font-medium">{goal.currentScore}점 → {goal.targetScore}점</span>
                    </div>
                    <Progress value={(goal.currentScore / goal.targetScore) * 100} />
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {goal.subjects.map((subject) => (
                    <span key={subject} className="px-2 py-1 bg-muted rounded text-xs">
                      {subject}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <BarChart3 className="w-4 h-4 mr-1" />
                    전략 보기
                  </Button>
                  <Link href={`/exam-prep/${goal.id}`} className="flex-1">
                    <Button size="sm" className="w-full">
                      학습 시작
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Score Predictions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                AI 성적 예측
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockPredictions.map((pred) => (
                  <div key={pred.subject} className="flex items-center gap-4">
                    <div className="w-16 text-sm font-medium">{pred.subject}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${pred.current}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12">{pred.current}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className={`text-sm font-medium w-12 ${
                          pred.trend === "up" ? "text-green-600" : ""
                        }`}>
                          {pred.predicted}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                * AI가 현재 학습 패턴을 기반으로 예측한 점수입니다
              </p>
            </CardContent>
          </Card>

          {/* Exam Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                시험 캘린더
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockCalendarEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        event.type === "SUNEUNG" ? "bg-red-500" :
                        event.type === "MOCK" ? "bg-blue-500" :
                        "bg-green-500"
                      }`} />
                      <div>
                        <p className="font-medium text-sm">{event.name}</p>
                        <p className="text-xs text-muted-foreground">{event.date}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-medium ${
                      event.daysLeft <= 30 ? "text-red-600" : "text-muted-foreground"
                    }`}>
                      D-{event.daysLeft}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              AI 추천 전략
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { title: "수학 집중 학습 필요", desc: "미적분 단원 정답률이 60%입니다. 다음 모의고사 전 보완이 필요합니다.", priority: "high" },
                { title: "영어 어휘 복습", desc: "최근 틀린 단어 50개를 복습하면 5점 이상 향상이 예상됩니다.", priority: "medium" },
                { title: "국어 비문학 연습", desc: "독해 속도를 높이기 위해 하루 1지문씩 시간 제한 연습을 권장합니다.", priority: "medium" },
              ].map((rec, i) => (
                <div key={i} className={`p-4 rounded-lg border-2 ${
                  rec.priority === "high" ? "border-red-200 bg-red-50/50" : "border-muted"
                }`}>
                  <h3 className="font-semibold mb-2">{rec.title}</h3>
                  <p className="text-sm text-muted-foreground">{rec.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
