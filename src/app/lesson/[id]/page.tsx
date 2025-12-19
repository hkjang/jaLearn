"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { 
  ChevronLeft, 
  Play, 
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  FileText,
  CheckCircle2,
  Circle,
  BookOpen,
  Clock,
  MessageCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Progress } from "@/components/ui";
import Header from "@/components/layout/Header";
import QuizComponent from "@/components/learning/QuizComponent";

// Mock course data
const mockCourse = {
  id: "1",
  title: "수학 개념완성 - 분수와 소수",
  subject: "수학",
  lessons: [
    { id: "1", title: "분수의 개념", duration: 15, isCompleted: true },
    { id: "2", title: "분수의 크기 비교", duration: 12, isCompleted: true },
    { id: "3", title: "분수의 덧셈과 뺄셈", duration: 18, isCompleted: false, isCurrent: true },
    { id: "4", title: "분수의 곱셈", duration: 20, isCompleted: false },
    { id: "5", title: "분수의 나눗셈", duration: 22, isCompleted: false },
    { id: "6", title: "소수의 개념", duration: 14, isCompleted: false },
    { id: "7", title: "단원 종합 평가", duration: 30, isCompleted: false, isQuiz: true },
  ],
};

const mockCurrentLesson = {
  id: "3",
  title: "분수의 덧셈과 뺄셈",
  description: "같은 분모와 다른 분모의 분수 덧셈과 뺄셈을 배워요",
  videoUrl: "https://example.com/video.mp4",
  pdfUrl: "/lesson3.pdf",
  duration: 18,
  questions: [
    {
      id: "q1",
      type: "MULTIPLE_CHOICE",
      content: "다음 중 1/4 + 2/4의 결과는 무엇인가요?",
      options: ["1/4", "2/4", "3/4", "4/4"],
      correctAnswer: "3/4",
    },
    {
      id: "q2",
      type: "MULTIPLE_CHOICE",
      content: "3/5 - 1/5 = ?",
      options: ["1/5", "2/5", "3/5", "4/5"],
      correctAnswer: "2/5",
    },
    {
      id: "q3",
      type: "SHORT_ANSWER",
      content: "분모가 같은 분수의 덧셈에서, 어떤 부분만 더하면 되나요?",
      correctAnswer: "분자",
    },
  ],
};

type Tab = "video" | "pdf" | "quiz";

export default function LessonPage() {
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login");
    },
  });

  const [activeTab, setActiveTab] = useState<Tab>("video");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(35); // percentage
  const [showQuizResult, setShowQuizResult] = useState(false);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const completedLessons = mockCourse.lessons.filter(l => l.isCompleted).length;
  const courseProgress = Math.round((completedLessons / mockCourse.lessons.length) * 100);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container-main py-6">
        {/* Back Navigation */}
        <Link 
          href="/courses" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          강좌 목록으로
        </Link>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-4">
            {/* Video Player / PDF Viewer / Quiz */}
            <Card className="overflow-hidden">
              {/* Tab Navigation */}
              <div className="flex border-b">
                <button
                  onClick={() => setActiveTab("video")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                    activeTab === "video" 
                      ? "text-primary border-b-2 border-primary bg-primary/5" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Play className="w-4 h-4" />
                  강의 영상
                </button>
                <button
                  onClick={() => setActiveTab("pdf")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                    activeTab === "pdf" 
                      ? "text-primary border-b-2 border-primary bg-primary/5" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  학습 자료
                </button>
                <button
                  onClick={() => setActiveTab("quiz")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                    activeTab === "quiz" 
                      ? "text-primary border-b-2 border-primary bg-primary/5" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  연습 문제
                </button>
              </div>

              {/* Video Tab */}
              {activeTab === "video" && (
                <div>
                  {/* Video Player Placeholder */}
                  <div className="aspect-video bg-gray-900 flex items-center justify-center relative">
                    <div className="text-center text-white">
                      <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">{mockCurrentLesson.title}</p>
                      <p className="text-sm text-gray-400">영상 플레이어 (데모)</p>
                    </div>

                    {/* Video Controls */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      {/* Progress Bar */}
                      <div className="mb-3">
                        <Progress value={progress} className="h-1" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white" />}
                          </button>
                          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                            <SkipBack className="w-5 h-5 text-white" />
                          </button>
                          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                            <SkipForward className="w-5 h-5 text-white" />
                          </button>
                          <button
                            onClick={() => setIsMuted(!isMuted)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
                          </button>
                          <span className="text-white text-sm ml-2">6:18 / 18:00</span>
                        </div>
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                          <Maximize className="w-5 h-5 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Lesson Info */}
                  <CardContent className="p-4">
                    <h2 className="text-xl font-semibold mb-2">{mockCurrentLesson.title}</h2>
                    <p className="text-muted-foreground">{mockCurrentLesson.description}</p>
                    
                    <div className="flex items-center gap-4 mt-4">
                      <Button variant="outline" size="sm">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        AI 튜터에게 질문하기
                      </Button>
                      <Button variant="outline" size="sm">
                        <FileText className="w-4 h-4 mr-2" />
                        필기 노트
                      </Button>
                    </div>
                  </CardContent>
                </div>
              )}

              {/* PDF Tab */}
              {activeTab === "pdf" && (
                <div className="p-6">
                  <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-lg font-medium">학습 자료 PDF</p>
                      <p className="text-sm text-muted-foreground mb-4">PDF 뷰어 (데모)</p>
                      <Button>
                        다운로드
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Quiz Tab */}
              {activeTab === "quiz" && (
                <div className="p-6">
                  <QuizComponent 
                    questions={mockCurrentLesson.questions}
                    onComplete={(results) => {
                      console.log("Quiz results:", results);
                      setShowQuizResult(true);
                    }}
                  />
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar - Lesson List */}
          <aside className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{mockCourse.title}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{completedLessons}/{mockCourse.lessons.length} 완료</span>
                  <Progress value={courseProgress} className="flex-1 h-2" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {mockCourse.lessons.map((lesson, index) => (
                    <button
                      key={lesson.id}
                      className={`w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-muted ${
                        lesson.isCurrent ? "bg-primary/5 border-l-2 border-primary" : ""
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {lesson.isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : lesson.isCurrent ? (
                          <Play className="w-5 h-5 text-primary" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          lesson.isCompleted ? "text-muted-foreground" : ""
                        }`}>
                          {index + 1}. {lesson.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {lesson.duration}분
                          {lesson.isQuiz && (
                            <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                              평가
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
