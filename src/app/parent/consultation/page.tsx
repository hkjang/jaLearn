"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, MessageCircle, Calendar, Video, Clock, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import Header from "@/components/layout/Header";

// Mock data
const mockConsultations = [
  {
    id: "1",
    expertName: "김상담 선생님",
    type: "MONTHLY",
    scheduledAt: "2024-12-20 14:00",
    status: "SCHEDULED",
    topic: "월간 학습 상담",
  },
  {
    id: "2",
    expertName: "이전문 선생님",
    type: "COMPLETED",
    scheduledAt: "2024-12-13 15:00",
    status: "COMPLETED",
    topic: "진로 상담",
    notes: "수학 관련 전공 추천, 고3 준비 계획 수립",
  },
];

export default function ParentConsultationPage() {
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
            <MessageCircle className="w-6 h-6" />
            전문가 상담
          </h1>
          <Button>
            <Calendar className="w-4 h-4 mr-2" />
            상담 예약
          </Button>
        </div>

        {/* Upcoming */}
        <div>
          <h2 className="text-lg font-semibold mb-4">예정된 상담</h2>
          <div className="grid gap-4">
            {mockConsultations.filter(c => c.status === "SCHEDULED").map((consultation) => (
              <Card key={consultation.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{consultation.topic}</h3>
                        <p className="text-sm text-muted-foreground">{consultation.expertName}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {consultation.scheduledAt}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            30분
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button>
                      <Video className="w-4 h-4 mr-2" />
                      입장하기
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Past */}
        <div>
          <h2 className="text-lg font-semibold mb-4">지난 상담</h2>
          <div className="grid gap-4">
            {mockConsultations.filter(c => c.status === "COMPLETED").map((consultation) => (
              <Card key={consultation.id} className="opacity-75">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{consultation.topic}</h3>
                        <p className="text-sm text-muted-foreground">{consultation.expertName}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {consultation.scheduledAt}
                          </span>
                        </div>
                        {consultation.notes && (
                          <p className="mt-2 text-sm bg-muted p-2 rounded">
                            📝 {consultation.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      완료
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
