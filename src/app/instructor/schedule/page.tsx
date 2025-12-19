"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Calendar, Plus, Video, Clock, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import Header from "@/components/layout/Header";

// Mock data
const mockSchedule = [
  {
    id: "1",
    type: "LIVE_CLASS",
    title: "주간 라이브 Q&A",
    date: "2024-12-20",
    time: "19:00",
    duration: 60,
    students: 45,
  },
  {
    id: "2",
    type: "CONSULTATION",
    title: "1:1 학습 상담",
    date: "2024-12-21",
    time: "14:00",
    duration: 30,
    students: 1,
  },
  {
    id: "3",
    type: "LIVE_CLASS",
    title: "수능 국어 특강",
    date: "2024-12-22",
    time: "10:00",
    duration: 120,
    students: 120,
  },
];

export default function InstructorSchedulePage() {
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

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            일정 관리
          </h1>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            일정 추가
          </Button>
        </div>

        {/* Upcoming Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>다가오는 일정</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {mockSchedule.map((event) => (
                <div key={event.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        event.type === "LIVE_CLASS"
                          ? "bg-red-100"
                          : "bg-blue-100"
                      }`}
                    >
                      {event.type === "LIVE_CLASS" ? (
                        <Video
                          className={`w-6 h-6 ${
                            event.type === "LIVE_CLASS" ? "text-red-600" : "text-blue-600"
                          }`}
                        />
                      ) : (
                        <User className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {event.date} {event.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {event.duration}분
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {event.students}명 참여
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        event.type === "LIVE_CLASS"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {event.type === "LIVE_CLASS" ? "라이브" : "상담"}
                    </span>
                    <Button variant="outline" size="sm">
                      관리
                    </Button>
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
