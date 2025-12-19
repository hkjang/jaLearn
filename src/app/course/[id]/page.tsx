"use client";

import { useSession } from "next-auth/react";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { use } from "react";
import {
  ChevronLeft,
  Play,
  Clock,
  Users,
  Star,
  BookOpen,
  CheckCircle2,
  Circle,
  Lock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Progress } from "@/components/ui";
import { gradeLevelShortNames, subjectInfo, type GradeLevel } from "@/lib/utils";
import Header from "@/components/layout/Header";

// Mock course data - in real app this would come from database
const mockCourses: Record<string, {
  id: string;
  title: string;
  description: string;
  subject: string;
  gradeLevel: GradeLevel;
  instructorName: string;
  lessonsCount: number;
  duration: number;
  enrolledCount: number;
  rating: number;
  isEnrolled: boolean;
  progress: number;
  lessons: {
    id: string;
    title: string;
    duration: number;
    isCompleted: boolean;
    isLocked: boolean;
  }[];
}> = {
  "1": {
    id: "1",
    title: "수학 개념완성 - 분수와 소수",
    description: "분수와 소수의 개념부터 연산까지 완벽하게 마스터해요. 초등학교 4학년 교육과정에 맞춘 체계적인 강의로 수학의 기초를 탄탄하게 다져보세요.",
    subject: "math",
    gradeLevel: "ELEMENTARY_4",
    instructorName: "김선생",
    lessonsCount: 12,
    duration: 240,
    enrolledCount: 1234,
    rating: 4.8,
    isEnrolled: true,
    progress: 75,
    lessons: [
      { id: "1", title: "분수의 개념", duration: 15, isCompleted: true, isLocked: false },
      { id: "2", title: "분수의 크기 비교", duration: 12, isCompleted: true, isLocked: false },
      { id: "3", title: "분수의 덧셈과 뺄셈", duration: 18, isCompleted: false, isLocked: false },
      { id: "4", title: "분수의 곱셈", duration: 20, isCompleted: false, isLocked: false },
      { id: "5", title: "분수의 나눗셈", duration: 22, isCompleted: false, isLocked: false },
      { id: "6", title: "소수의 개념", duration: 14, isCompleted: false, isLocked: false },
      { id: "7", title: "단원 종합 평가", duration: 30, isCompleted: false, isLocked: true },
    ],
  },
  "2": {
    id: "2",
    title: "영어 문법 기초반",
    description: "영어 문법의 기초를 탄탄하게! 품사부터 문장구조까지 체계적으로 배워요.",
    subject: "english",
    gradeLevel: "MIDDLE_1",
    instructorName: "이영희 선생님",
    lessonsCount: 20,
    duration: 400,
    enrolledCount: 892,
    rating: 4.6,
    isEnrolled: true,
    progress: 45,
    lessons: [
      { id: "1", title: "품사의 이해", duration: 20, isCompleted: true, isLocked: false },
      { id: "2", title: "명사와 대명사", duration: 18, isCompleted: true, isLocked: false },
      { id: "3", title: "동사와 시제", duration: 25, isCompleted: false, isLocked: false },
      { id: "4", title: "형용사와 부사", duration: 22, isCompleted: false, isLocked: false },
    ],
  },
  "3": {
    id: "3",
    title: "과학 탐구 - 생명과학",
    description: "세포부터 생태계까지, 생명과학의 핵심 개념을 탐구해요",
    subject: "science",
    gradeLevel: "HIGH_1",
    instructorName: "박과학 선생님",
    lessonsCount: 15,
    duration: 360,
    enrolledCount: 567,
    rating: 4.9,
    isEnrolled: false,
    progress: 0,
    lessons: [
      { id: "1", title: "세포의 구조", duration: 25, isCompleted: false, isLocked: true },
      { id: "2", title: "세포 분열", duration: 30, isCompleted: false, isLocked: true },
    ],
  },
};

export default function CoursePage({ params }: { params: Promise<{ id: string }> }) {
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

  const course = mockCourses[id];

  if (!course) {
    notFound();
  }

  const subjectData = subjectInfo[course.subject as keyof typeof subjectInfo];
  const completedLessons = course.lessons.filter((l) => l.isCompleted).length;
  const courseProgress = Math.round((completedLessons / course.lessons.length) * 100);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container-main py-6">
        {/* Back Navigation */}
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          강좌 목록으로
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Header */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: subjectData?.color + "20",
                    color: subjectData?.color,
                  }}
                >
                  {subjectData?.name}
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-muted">
                  {gradeLevelShortNames[course.gradeLevel]}
                </span>
              </div>
              <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
              <p className="text-muted-foreground text-lg">{course.description}</p>

              {/* Course Stats */}
              <div className="flex flex-wrap items-center gap-6 mt-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  {course.lessonsCount}개 강의
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  총 {Math.floor(course.duration / 60)}시간 {course.duration % 60}분
                </span>
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {course.enrolledCount.toLocaleString()}명 수강
                </span>
                <span className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {course.rating}
                </span>
              </div>
            </div>

            {/* Lesson List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  강의 목록
                </CardTitle>
                {course.isEnrolled && (
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      {completedLessons}/{course.lessons.length} 완료
                    </span>
                    <Progress value={courseProgress} className="flex-1 h-2" />
                    <span className="font-medium">{courseProgress}%</span>
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {course.lessons.map((lesson, index) => (
                    <Link
                      key={lesson.id}
                      href={course.isEnrolled && !lesson.isLocked ? `/lesson/${lesson.id}` : "#"}
                      className={`flex items-center gap-4 p-4 transition-colors ${
                        course.isEnrolled && !lesson.isLocked
                          ? "hover:bg-muted cursor-pointer"
                          : "cursor-not-allowed opacity-60"
                      }`}
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{lesson.title}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {lesson.duration}분
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {lesson.isLocked ? (
                          <Lock className="w-5 h-5 text-muted-foreground" />
                        ) : lesson.isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Enrollment Card */}
            <Card>
              <CardContent className="p-6">
                <div
                  className="aspect-video rounded-lg mb-4 flex items-center justify-center"
                  style={{ backgroundColor: subjectData?.color + "20" }}
                >
                  <BookOpen className="w-16 h-16" style={{ color: subjectData?.color }} />
                </div>

                {course.isEnrolled ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">현재 진행률</p>
                      <p className="text-3xl font-bold text-primary">{course.progress}%</p>
                    </div>
                    <Link href={`/lesson/${course.lessons.find((l) => !l.isCompleted)?.id || "1"}`}>
                      <Button className="w-full" size="lg">
                        <Play className="w-5 h-5 mr-2" />
                        이어서 학습하기
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button className="w-full" size="lg">
                      수강 신청하기
                    </Button>
                    <p className="text-center text-sm text-muted-foreground">
                      프리미엄 회원은 모든 강좌를 무료로 수강할 수 있어요
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Instructor Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">강사 정보</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-medium text-primary">
                      {course.instructorName[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{course.instructorName}</p>
                    <p className="text-sm text-muted-foreground">전문 강사</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
