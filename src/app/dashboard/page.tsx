"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  BookOpen, 
  Trophy, 
  Clock, 
  TrendingUp,
  Play,
  ChevronRight,
  Calendar,
  Target,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Progress, Button } from "@/components/ui";
import { getGradeLevelGroup, gradeLevelShortNames, gradeThemes, type GradeLevel } from "@/lib/utils";
import Header from "@/components/layout/Header";

// Mock data for demonstration
const mockProgress = {
  totalCourses: 5,
  completedCourses: 2,
  totalLessons: 48,
  completedLessons: 23,
  studyTimeToday: 45, // minutes
  studyTimeWeek: 320, // minutes
  streak: 7, // days
};

const mockRecentCourses = [
  { id: "1", title: "수학 개념완성", subject: "수학", progress: 75, lastAccessed: "2시간 전" },
  { id: "2", title: "영어 문법 기초", subject: "영어", progress: 45, lastAccessed: "어제" },
  { id: "3", title: "과학 탐구", subject: "과학", progress: 30, lastAccessed: "3일 전" },
];

const mockTodayTasks = [
  { id: "1", title: "수학 3-2강 강의 듣기", type: "lesson", dueTime: "오늘 17:00" },
  { id: "2", title: "영어 단어 테스트", type: "quiz", dueTime: "오늘 18:00" },
  { id: "3", title: "과학 주간 평가", type: "assessment", dueTime: "오늘 20:00" },
];

export default function StudentDashboard() {
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

  const gradeLevel = session?.user?.gradeLevel as GradeLevel | undefined;
  const gradeLevelGroup = gradeLevel ? getGradeLevelGroup(gradeLevel) : "elementary";
  const theme = gradeThemes[gradeLevelGroup];

  return (
    <div className={`min-h-screen bg-background theme-${gradeLevelGroup}`}>
      <Header />
      
      <main className="container-main py-6 space-y-6">
        {/* Welcome Section */}
        <section className="animate-slide-up">
          <div className={`rounded-2xl p-6 md:p-8 text-white bg-gradient-to-br ${theme.gradient}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-white/80 mb-1">
                  {gradeLevel && gradeLevelShortNames[gradeLevel]} 
                  {" "}안녕하세요! 👋
                </p>
                <h1 className="text-2xl md:text-3xl font-bold">{session?.user?.name}님</h1>
                <p className="text-white/80 mt-1">오늘도 열심히 공부해볼까요?</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold">{mockProgress.streak}</p>
                  <p className="text-sm text-white/80">연속 학습일</p>
                </div>
                <div className="w-px h-12 bg-white/20" />
                <div className="text-center">
                  <p className="text-3xl font-bold">{mockProgress.studyTimeToday}분</p>
                  <p className="text-sm text-white/80">오늘 학습</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <Card className="card-hover">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockProgress.completedLessons}/{mockProgress.totalLessons}</p>
                <p className="text-xs text-muted-foreground">완료 강의</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-hover">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockProgress.completedCourses}</p>
                <p className="text-xs text-muted-foreground">완료 강좌</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-hover">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Math.floor(mockProgress.studyTimeWeek / 60)}시간</p>
                <p className="text-xs text-muted-foreground">주간 학습</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-hover">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">85%</p>
                <p className="text-xs text-muted-foreground">평균 정답률</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Courses */}
          <section className="lg:col-span-2 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  이어서 학습하기
                </CardTitle>
                <Link href="/courses" className="text-sm text-primary hover:underline">
                  전체보기
                </Link>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockRecentCourses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/course/${course.id}`}
                    className="block p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-medium group-hover:text-primary transition-colors">
                          {course.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">{course.subject}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={course.progress} className="flex-1" />
                      <span className="text-sm font-medium">{course.progress}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{course.lastAccessed}</p>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </section>

          {/* Today's Tasks */}
          <section className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  오늘 할 일
                </CardTitle>
                <span className="text-sm text-muted-foreground">{mockTodayTasks.length}개</span>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockTodayTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      task.type === "lesson" ? "bg-blue-500" :
                      task.type === "quiz" ? "bg-green-500" : "bg-orange-500"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.dueTime}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        </div>

        {/* AI Recommendations */}
        <section className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <Card className="overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="w-6 h-6" />
                <h2 className="text-lg font-semibold">AI 학습 추천</h2>
              </div>
              <p className="text-white/80 text-sm mb-4">
                지난 학습 패턴을 분석한 결과, 수학 분수 단원이 취약해요. 복습을 추천드려요!
              </p>
              <div className="flex gap-3">
                <Button variant="secondary" size="sm">
                  <Target className="w-4 h-4 mr-1" />
                  취약점 복습하기
                </Button>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  나중에
                </Button>
              </div>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
