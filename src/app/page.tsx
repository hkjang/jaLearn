import Link from "next/link";
import { Button } from "@/components/ui";
import {
  BookOpen,
  GraduationCap,
  Brain,
  Trophy,
  Users,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b">
        <div className="container-main flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-premium flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">JaLearn</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/courses" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              강좌 둘러보기
            </Link>
            <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              서비스 소개
            </Link>
          </nav>
          
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">로그인</Button>
            </Link>
            <Link href="/register">
              <Button>시작하기</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex items-center py-16 md:py-24">
        <div className="container-main">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                AI 기반 맞춤형 학습
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                나만을 위한
                <br />
                <span className="text-gradient">똑똑한 학습 친구</span>
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-md">
                초등학교부터 고등학교까지, 수준별 맞춤 강의와 AI 튜터가 함께하는 새로운 학습 경험을 시작하세요.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button size="xl" className="w-full sm:w-auto group">
                    무료로 시작하기
                    <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/courses">
                  <Button size="xl" variant="outline" className="w-full sm:w-auto">
                    강좌 둘러보기
                  </Button>
                </Link>
              </div>
              
              {/* Stats */}
              <div className="flex flex-wrap gap-8 pt-4">
                <div>
                  <p className="text-2xl font-bold">1,000+</p>
                  <p className="text-sm text-muted-foreground">강의 영상</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">50,000+</p>
                  <p className="text-sm text-muted-foreground">연습 문제</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">10,000+</p>
                  <p className="text-sm text-muted-foreground">학습 중인 학생</p>
                </div>
              </div>
            </div>
            
            {/* Hero Illustration */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-3xl blur-3xl" />
              <div className="relative grid grid-cols-2 gap-4">
                {/* Grade Cards */}
                <div className="space-y-4">
                  <div className="p-6 rounded-2xl gradient-elementary text-white card-hover">
                    <BookOpen className="w-8 h-8 mb-3" />
                    <h3 className="font-semibold text-lg">초등 과정</h3>
                    <p className="text-sm opacity-90">재미있는 게임형 학습</p>
                  </div>
                  <div className="p-6 rounded-2xl gradient-high text-white card-hover">
                    <Trophy className="w-8 h-8 mb-3" />
                    <h3 className="font-semibold text-lg">고등 과정</h3>
                    <p className="text-sm opacity-90">입시 대비 심화 강의</p>
                  </div>
                </div>
                <div className="space-y-4 mt-8">
                  <div className="p-6 rounded-2xl gradient-middle text-white card-hover">
                    <Brain className="w-8 h-8 mb-3" />
                    <h3 className="font-semibold text-lg">중등 과정</h3>
                    <p className="text-sm opacity-90">개념 완성 집중 학습</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-white border shadow-lg card-hover">
                    <Users className="w-8 h-8 mb-3 text-primary" />
                    <h3 className="font-semibold text-lg text-foreground">AI 튜터</h3>
                    <p className="text-sm text-muted-foreground">24시간 질문 응답</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container-main">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              왜 <span className="text-primary">JaLearn</span>일까요?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              체계적인 커리큘럼과 AI 기술이 만나 최고의 학습 경험을 제공합니다
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: GraduationCap,
                title: "학년별 맞춤 콘텐츠",
                description: "초등 1학년부터 고등 3학년까지, 교육과정에 맞춘 체계적인 강의와 문제를 제공합니다.",
                gradient: "from-orange-500 to-amber-500",
              },
              {
                icon: Brain,
                title: "AI 학습 분석",
                description: "학습 패턴을 분석하여 취약점을 파악하고, 맞춤형 문제를 추천해드립니다.",
                gradient: "from-green-500 to-emerald-500",
              },
              {
                icon: Trophy,
                title: "성취도 관리",
                description: "진도율, 학습 시간, 정답률을 한눈에 확인하고 학습 목표를 달성하세요.",
                gradient: "from-indigo-500 to-purple-500",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl bg-background border shadow-sm card-hover"
              >
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container-main">
          <div className="relative overflow-hidden rounded-3xl gradient-premium p-8 md:p-16 text-center text-white">
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                지금 바로 시작하세요
              </h2>
              <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
                회원가입 후 바로 무료 강의를 시청하고, AI 튜터와 함께 학습을 시작하세요.
              </p>
              <Link href="/register">
                <Button size="xl" variant="secondary" className="shadow-lg">
                  무료로 시작하기
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container-main">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-premium flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold">JaLearn</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 JaLearn. 모든 학생의 성공적인 학습을 응원합니다.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
