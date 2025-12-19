"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, BookOpen, Plus, MoreVertical, Users, Star } from "lucide-react";
import { Card, CardContent, Button } from "@/components/ui";
import Header from "@/components/layout/Header";

// Mock data
const mockCourses = [
  {
    id: "1",
    title: "수능 국어 비문학 독해법",
    status: "PUBLISHED",
    students: 1523,
    rating: 4.9,
    lessons: 12,
  },
  {
    id: "2",
    title: "국어 문학 완전정복",
    status: "DRAFT",
    students: 0,
    rating: 0,
    lessons: 5,
  },
];

export default function InstructorCoursesPage() {
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
            <BookOpen className="w-6 h-6" />
            내 강좌 관리
          </h1>
          <Link href="/instructor/courses/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              새 강좌 만들기
            </Button>
          </Link>
        </div>

        <div className="grid gap-4">
          {mockCourses.map((course) => (
            <Card key={course.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{course.title}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {course.lessons}개 강의
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {course.students}명 수강
                        </span>
                        {course.rating > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            {course.rating}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        course.status === "PUBLISHED"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {course.status === "PUBLISHED" ? "게시됨" : "임시저장"}
                    </span>
                    <Button variant="outline" size="sm">
                      편집
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
