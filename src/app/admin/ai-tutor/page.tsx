"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Brain,
  FileText,
  FlaskConical,
  Shield,
  BarChart3,
  Settings,
  Users,
  TrendingUp,
  AlertTriangle,
  Clock,
  Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Progress } from "@/components/ui";
import Header from "@/components/layout/Header";

export default function AdminAITutorPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login");
    },
  });

  const [stats, setStats] = useState({
    totalSessions: 12450,
    activeUsers: 345,
    avgQuality: 0.85,
    tokensUsed: 2450000,
    costToday: 125.50,
    safetyBlocks: 23,
  });

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const quickLinks = [
    { href: "/admin/ai-tutor/prompts", icon: FileText, label: "프롬프트 관리", desc: "버전 관리, 활성화" },
    { href: "/admin/ai-tutor/ab-tests", icon: FlaskConical, label: "A/B 테스트", desc: "실험 운영" },
    { href: "/admin/ai-tutor/safety", icon: Shield, label: "안전 로그", desc: "차단 기록" },
    { href: "/admin/ai-tutor/analytics", icon: BarChart3, label: "분석", desc: "사용 통계" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container-main py-6 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6" />
            AI 튜터 관리
          </h1>
          <p className="text-muted-foreground">프롬프트, 실험, 안전, 통계 관리</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-5 h-5 mx-auto mb-1 text-blue-500" />
              <p className="text-2xl font-bold">{stats.activeUsers}</p>
              <p className="text-xs text-muted-foreground">활성 사용자</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="w-5 h-5 mx-auto mb-1 text-green-500" />
              <p className="text-2xl font-bold">{(stats.totalSessions / 1000).toFixed(1)}K</p>
              <p className="text-xs text-muted-foreground">총 세션</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-5 h-5 mx-auto mb-1 text-purple-500" />
              <p className="text-2xl font-bold">{(stats.avgQuality * 100).toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">품질 점수</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Zap className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
              <p className="text-2xl font-bold">{(stats.tokensUsed / 1000000).toFixed(1)}M</p>
              <p className="text-xs text-muted-foreground">토큰 사용</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <BarChart3 className="w-5 h-5 mx-auto mb-1 text-cyan-500" />
              <p className="text-2xl font-bold">${stats.costToday.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">오늘 비용</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Shield className="w-5 h-5 mx-auto mb-1 text-red-500" />
              <p className="text-2xl font-bold">{stats.safetyBlocks}</p>
              <p className="text-xs text-muted-foreground">안전 차단</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="card-hover h-full">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <link.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{link.label}</h3>
                    <p className="text-sm text-muted-foreground">{link.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">최근 활동</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { action: "프롬프트 v1.2.0 활성화", user: "admin", time: "5분 전" },
                { action: "A/B 테스트 '이모지 효과' 완료", user: "admin", time: "1시간 전" },
                { action: "탈옥 시도 차단", user: "user-123", time: "2시간 전" },
                { action: "프롬프트 v1.2.1 생성", user: "admin", time: "3시간 전" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{item.action}</p>
                    <p className="text-xs text-muted-foreground">{item.user}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{item.time}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quality Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">품질 지표</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "소크라테스 준수", value: 88 },
                { label: "난이도 매칭", value: 82 },
                { label: "감정 지원", value: 90 },
                { label: "답 비노출", value: 95 },
              ].map((metric) => (
                <div key={metric.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{metric.label}</span>
                    <span className="font-medium">{metric.value}%</span>
                  </div>
                  <Progress value={metric.value} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
              <div>
                <h3 className="font-medium">주의 필요</h3>
                <p className="text-sm text-muted-foreground">
                  오늘 토큰 사용량이 일일 예산의 80%에 도달했습니다. 비용 최적화를 검토하세요.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
