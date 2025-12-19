"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, Settings, Bell, Clock, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import Header from "@/components/layout/Header";

export default function ParentSettingsPage() {
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login");
    },
  });

  const [notifications, setNotifications] = useState({
    dailyReport: true,
    weeklyReport: true,
    goalAlerts: true,
    lowActivityAlert: true,
  });

  const [studyLimit, setStudyLimit] = useState({
    enabled: false,
    maxHoursPerDay: 4,
    breakReminder: true,
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

        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6" />
          학부모 설정
        </h1>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              알림 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: "dailyReport" as const, label: "일일 학습 보고서", desc: "매일 자녀의 학습 현황을 받습니다" },
              { key: "weeklyReport" as const, label: "주간 분석 보고서", desc: "주간 분석 리포트를 받습니다" },
              { key: "goalAlerts" as const, label: "목표 알림", desc: "목표 달성/미달성 시 알림을 받습니다" },
              { key: "lowActivityAlert" as const, label: "저조한 활동 알림", desc: "3일 이상 학습 기록이 없으면 알림" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                <button
                  onClick={() =>
                    setNotifications({
                      ...notifications,
                      [item.key]: !notifications[item.key],
                    })
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    notifications[item.key] ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      notifications[item.key] ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Study Limits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              학습 시간 제한
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">일일 학습 시간 제한</p>
                <p className="text-sm text-muted-foreground">하루 최대 학습 시간을 설정합니다</p>
              </div>
              <button
                onClick={() => setStudyLimit({ ...studyLimit, enabled: !studyLimit.enabled })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  studyLimit.enabled ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    studyLimit.enabled ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {studyLimit.enabled && (
              <div className="pl-4 border-l-2 border-primary space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    하루 최대 {studyLimit.maxHoursPerDay}시간
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    value={studyLimit.maxHoursPerDay}
                    onChange={(e) =>
                      setStudyLimit({ ...studyLimit, maxHoursPerDay: parseInt(e.target.value) })
                    }
                    className="w-full"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">휴식 알림</p>
                    <p className="text-sm text-muted-foreground">1시간마다 휴식 알림</p>
                  </div>
                  <button
                    onClick={() =>
                      setStudyLimit({ ...studyLimit, breakReminder: !studyLimit.breakReminder })
                    }
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      studyLimit.breakReminder ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        studyLimit.breakReminder ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              개인정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              자녀 계정 연결 관리
            </Button>
            <Button variant="outline" className="w-full justify-start">
              알림 수신 이메일 변경
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
