import Link from "next/link";
import { Button } from "@/components/ui";
import { GraduationCap, BookOpen, Users, Target, Medal, ChevronRight, Heart } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
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
            <Link
              href="/courses"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              강좌 둘러보기
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-foreground transition-colors"
            >
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

      {/* Hero */}
      <section className="py-20 text-center">
        <div className="container-main">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            모든 학생을 위한<br />
            <span className="text-gradient">맞춤형 AI 학습 플랫폼</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            JaLearn은 초등학교부터 고등학교까지 모든 학생들이 자신의 속도에 맞춰 
            효과적으로 학습할 수 있도록 AI 기술을 활용한 맞춤형 교육 서비스를 제공합니다.
          </p>
          <Link href="/register">
            <Button size="xl" className="group">
              무료로 시작하기
              <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 bg-muted/50">
        <div className="container-main">
          <div className="max-w-3xl mx-auto text-center">
            <Heart className="w-12 h-12 mx-auto text-primary mb-6" />
            <h2 className="text-3xl font-bold mb-6">우리의 미션</h2>
            <p className="text-lg text-muted-foreground">
              모든 학생에게 평등한 교육 기회를 제공하고, 
              각자의 잠재력을 최대한 발휘할 수 있도록 돕는 것입니다.
              기술을 통해 교육의 장벽을 낮추고, 
              학습의 즐거움을 더 많은 학생들에게 전달하고자 합니다.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container-main">
          <h2 className="text-3xl font-bold text-center mb-12">JaLearn의 특별한 점</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: BookOpen,
                title: "체계적인 커리큘럼",
                description: "교육과정에 맞춘 학년별, 과목별 체계적인 강의 제공",
              },
              {
                icon: Users,
                title: "AI 개인 튜터",
                description: "24시간 질문에 답하고 맞춤형 학습 경로를 추천",
              },
              {
                icon: Target,
                title: "학습 분석",
                description: "취약점 분석과 강점 파악으로 효율적인 학습 계획 수립",
              },
              {
                icon: Medal,
                title: "성취 시스템",
                description: "학습 동기를 부여하는 배지와 리워드 시스템",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl bg-background border shadow-sm text-center"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-muted/50">
        <div className="container-main">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "10,000+", label: "학습 중인 학생" },
              { value: "1,000+", label: "강의 영상" },
              { value: "50,000+", label: "연습 문제" },
              { value: "4.8", label: "평균 만족도" },
            ].map((stat, index) => (
              <div key={index}>
                <p className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</p>
                <p className="text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container-main">
          <div className="relative overflow-hidden rounded-3xl gradient-premium p-8 md:p-16 text-center text-white">
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                지금 바로 시작하세요
              </h2>
              <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
                회원가입 후 무료 강의를 체험하고, AI 튜터와 함께 학습을 시작하세요.
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
