"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { 
  BookOpen, 
  Search, 
  Filter,
  Play,
  Clock,
  Users,
  Star,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, Input, Button, Progress } from "@/components/ui";
import { getGradeLevelGroup, gradeLevelNames, gradeLevelShortNames, type GradeLevel, subjectInfo } from "@/lib/utils";
import Header from "@/components/layout/Header";

// Mock courses data
const mockCourses = [
  {
    id: "1",
    title: "수학 개념완성 - 분수와 소수",
    subject: "math",
    gradeLevel: "ELEMENTARY_4" as GradeLevel,
    description: "분수와 소수의 개념부터 연산까지 완벽하게 마스터해요",
    lessonCount: 12,
    duration: 240, // minutes
    enrolledCount: 1234,
    rating: 4.8,
    thumbnail: null,
    progress: 75,
    isEnrolled: true,
  },
  {
    id: "2",
    title: "영어 문법 기초반",
    subject: "english",
    gradeLevel: "MIDDLE_1" as GradeLevel,
    description: "영어 문법의 기초를 탄탄하게! 품사부터 문장구조까지",
    lessonCount: 20,
    duration: 400,
    enrolledCount: 892,
    rating: 4.6,
    thumbnail: null,
    progress: 45,
    isEnrolled: true,
  },
  {
    id: "3",
    title: "과학 탐구 - 생명과학",
    subject: "science",
    gradeLevel: "HIGH_1" as GradeLevel,
    description: "세포부터 생태계까지, 생명과학의 핵심 개념을 탐구해요",
    lessonCount: 15,
    duration: 360,
    enrolledCount: 567,
    rating: 4.9,
    thumbnail: null,
    progress: 0,
    isEnrolled: false,
  },
  {
    id: "4",
    title: "국어 독해력 향상",
    subject: "korean",
    gradeLevel: "ELEMENTARY_5" as GradeLevel,
    description: "다양한 글을 읽고 이해하는 능력을 키워요",
    lessonCount: 18,
    duration: 270,
    enrolledCount: 2103,
    rating: 4.7,
    thumbnail: null,
    progress: 30,
    isEnrolled: true,
  },
  {
    id: "5",
    title: "사회 역사 탐험",
    subject: "social",
    gradeLevel: "MIDDLE_2" as GradeLevel,
    description: "한국사와 세계사의 흐름을 재미있게 배워요",
    lessonCount: 24,
    duration: 480,
    enrolledCount: 756,
    rating: 4.5,
    thumbnail: null,
    progress: 0,
    isEnrolled: false,
  },
];

const subjects = [
  { key: "all", label: "전체" },
  { key: "korean", label: "국어" },
  { key: "math", label: "수학" },
  { key: "english", label: "영어" },
  { key: "science", label: "과학" },
  { key: "social", label: "사회" },
];

const gradeFilters = [
  { key: "all", label: "전체 학년" },
  { key: "elementary", label: "초등" },
  { key: "middle", label: "중등" },
  { key: "high", label: "고등" },
];

export default function CoursesPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login");
    },
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [showEnrolledOnly, setShowEnrolledOnly] = useState(false);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const filteredCourses = mockCourses.filter((course) => {
    // Search filter
    if (searchQuery && !course.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Subject filter
    if (selectedSubject !== "all" && course.subject !== selectedSubject) {
      return false;
    }
    // Grade filter
    if (selectedGrade !== "all") {
      const courseGroup = getGradeLevelGroup(course.gradeLevel);
      if (courseGroup !== selectedGrade) {
        return false;
      }
    }
    // Enrolled filter
    if (showEnrolledOnly && !course.isEnrolled) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container-main py-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="w-6 h-6" />
              강좌
            </h1>
            <p className="text-muted-foreground">
              다양한 강좌를 둘러보고 학습을 시작하세요
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="강좌 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">필터</span>
            </Button>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-4">
            {/* Subject Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {subjects.map((subject) => (
                <button
                  key={subject.key}
                  onClick={() => setSelectedSubject(subject.key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedSubject === subject.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {subject.label}
                </button>
              ))}
            </div>

            {/* Grade Filter */}
            <div className="flex gap-2">
              {gradeFilters.map((grade) => (
                <button
                  key={grade.key}
                  onClick={() => setSelectedGrade(grade.key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedGrade === grade.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {grade.label}
                </button>
              ))}
            </div>

            {/* Enrolled Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showEnrolledOnly}
                onChange={(e) => setShowEnrolledOnly(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">수강 중인 강좌만</span>
            </label>
          </div>
        </div>

        {/* Course Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const subjectData = subjectInfo[course.subject as keyof typeof subjectInfo];
            const gradeLevelGroup = getGradeLevelGroup(course.gradeLevel);

            return (
              <Link key={course.id} href={`/course/${course.id}`}>
                <Card className="h-full overflow-hidden card-hover group">
                  {/* Thumbnail */}
                  <div 
                    className={`h-32 flex items-center justify-center`}
                    style={{ backgroundColor: subjectData?.color + "20" }}
                  >
                    <BookOpen 
                      className="w-12 h-12"
                      style={{ color: subjectData?.color }}
                    />
                  </div>

                  <CardContent className="p-4 space-y-3">
                    {/* Badge */}
                    <div className="flex items-center gap-2">
                      <span 
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: subjectData?.color + "20",
                          color: subjectData?.color
                        }}
                      >
                        {subjectData?.name}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        gradeLevelGroup === "elementary" ? "bg-orange-100 text-orange-700" :
                        gradeLevelGroup === "middle" ? "bg-green-100 text-green-700" :
                        "bg-indigo-100 text-indigo-700"
                      }`}>
                        {gradeLevelShortNames[course.gradeLevel]}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-1">
                        {course.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {course.description}
                      </p>
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Play className="w-3 h-3" />
                        {course.lessonCount}강
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {Math.floor(course.duration / 60)}시간
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {course.enrolledCount.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {course.rating}
                      </span>
                    </div>

                    {/* Progress or CTA */}
                    {course.isEnrolled ? (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">진행률</span>
                          <span className="font-medium">{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} />
                      </div>
                    ) : (
                      <Button className="w-full" size="sm">
                        수강 시작하기
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">강좌를 찾을 수 없어요</h3>
            <p className="text-muted-foreground">
              검색 조건을 변경해보세요
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
