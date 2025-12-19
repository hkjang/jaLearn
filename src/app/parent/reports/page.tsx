"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, FileText, TrendingDown, TrendingUp, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import Header from "@/components/layout/Header";

// Mock data
const mockReports = [
  {
    id: "1",
    childName: "홍길동",
    period: "2024년 12월 2주차",
    type: "WEEKLY",
    studyTime: 720,
    completedLessons: 5,
    quizAverage: 87,
    strengths: ["미적분 기초", "문제 이해력"],
    improvements: ["적분 응용 문제", "시간 관리"],
    aiComment: "홍길동 학생은 이번 주 미적분 단원에서 눈에 띄는 성장을 보였습니다.",
  },
  {
    id: "2",
    childName: "홍길동",
    period: "2024년 12월 1주차",
    type: "WEEKLY",
    studyTime: 680,
    completedLessons: 4,
    quizAverage: 82,
    strengths: ["함수의 극한"],
    improvements: ["미분 개념 이해"],
    aiComment: "함수의 극한 단원을 완료했습니다. 다음 주 미분 학습을 권장합니다.",
  },
];

export default function ParentReportsPage() {
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
            <FileText className="w-6 h-6" />
            학습 보고서
          </h1>
        </div>

        <div className="space-y-4">
          {mockReports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{report.period}</CardTitle>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    주간 보고서
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{Math.floor(report.studyTime / 60)}h</p>
                    <p className="text-sm text-muted-foreground">총 학습 시간</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{report.completedLessons}</p>
                    <p className="text-sm text-muted-foreground">완료한 강의</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{report.quizAverage}%</p>
                    <p className="text-sm text-muted-foreground">퀴즈 평균</p>
                  </div>
                </div>

                {/* Strengths & Improvements */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium flex items-center gap-2 text-green-700 mb-2">
                      <TrendingUp className="w-4 h-4" />
                      잘하는 부분
                    </h4>
                    <ul className="list-disc list-inside text-sm text-green-600 space-y-1">
                      {report.strengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <h4 className="font-medium flex items-center gap-2 text-orange-700 mb-2">
                      <TrendingDown className="w-4 h-4" />
                      보완할 부분
                    </h4>
                    <ul className="list-disc list-inside text-sm text-orange-600 space-y-1">
                      {report.improvements.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* AI Comment */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-700 mb-2">AI 분석 코멘트</h4>
                  <p className="text-sm text-blue-600">{report.aiComment}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
