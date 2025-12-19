"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, BookOpen, Plus, Search, MoreVertical, Users, Play } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from "@/components/ui";
import Header from "@/components/layout/Header";

// Mock data
const mockContent = [
  {
    id: "1",
    title: "수학 II - 미적분 완전정복",
    type: "COURSE",
    status: "PUBLISHED",
    creator: "박수학 선생님",
    students: 2341,
    lessons: 15,
  },
  {
    id: "2",
    title: "수능 국어 비문학 독해법",
    type: "COURSE",
    status: "PUBLISHED",
    creator: "김선생",
    students: 1523,
    lessons: 12,
  },
  {
    id: "3",
    title: "영문법 기초완성",
    type: "COURSE",
    status: "DRAFT",
    creator: "이영희 선생님",
    students: 0,
    lessons: 8,
  },
];

export default function AdminContentPage() {
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

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container-main py-6 space-y-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          관리자 대시보드로 돌아가기
        </Link>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            콘텐츠 관리
          </h1>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            콘텐츠 추가
          </Button>
        </div>

        {/* Search */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input placeholder="콘텐츠 검색..." className="pl-10" />
          </div>
          <select className="px-3 py-2 rounded-lg border bg-background">
            <option value="all">전체 상태</option>
            <option value="published">게시됨</option>
            <option value="draft">임시저장</option>
          </select>
        </div>

        {/* Content List */}
        <Card>
          <CardHeader>
            <CardTitle>전체 콘텐츠</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {mockContent.map((content) => (
                <div key={content.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{content.title}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{content.creator}</span>
                        <span className="flex items-center gap-1">
                          <Play className="w-3 h-3" />
                          {content.lessons}개 강의
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {content.students}명 수강
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        content.status === "PUBLISHED"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {content.status === "PUBLISHED" ? "게시됨" : "임시저장"}
                    </span>
                    <Button variant="outline" size="sm">
                      편집
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
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
