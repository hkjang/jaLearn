"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { 
  GraduationCap, 
  Menu, 
  X, 
  Home,
  BookOpen,
  Trophy,
  MessageCircle,
  Bell,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Brain,
  Target,
  Users,
  Gift,
  CreditCard,
  Shield,
  FileQuestion,
  BarChart
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui";
import { getGradeLevelGroup, gradeLevelShortNames, type GradeLevel } from "@/lib/utils";

const navigationItems = [
  { href: "/dashboard", label: "대시보드", icon: Home },
  { href: "/courses", label: "강좌", icon: BookOpen },
  { href: "/ai-tutor-pro", label: "AI 튜터", icon: Brain },
  { href: "/exam-prep", label: "시험대비", icon: Target },
];

const adminItems = [
  { href: "/admin", label: "관리자홈", icon: Shield },
  { href: "/admin/problems/dashboard", label: "문제 대시보드", icon: BarChart },
  { href: "/admin/problems", label: "문제관리", icon: FileQuestion },
  { href: "/admin/curriculum", label: "교육과정", icon: GraduationCap },
  { href: "/admin/ai-tutor", label: "AI 튜터관리", icon: Brain },
  { href: "/admin/revenue", label: "매출관리", icon: CreditCard },
];

export default function Header() {
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const gradeLevel = session?.user?.gradeLevel as GradeLevel | undefined;
  const gradeLevelGroup = gradeLevel ? getGradeLevelGroup(gradeLevel) : undefined;

  const gradientClass = gradeLevelGroup === "elementary" 
    ? "gradient-elementary" 
    : gradeLevelGroup === "middle" 
    ? "gradient-middle" 
    : gradeLevelGroup === "high" 
    ? "gradient-high" 
    : "gradient-premium";

  return (
    <header className="sticky top-0 z-50 glass border-b safe-area-top">
      <div className="container-main flex items-center justify-between h-16">
        {/* Logo */}
        <Link href={session ? "/dashboard" : "/"} className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded-xl ${gradientClass} flex items-center justify-center`}>
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold hidden sm:block">JaLearn</span>
        </Link>

        {/* Desktop Navigation */}
        {session && (
          <nav className="hidden md:flex items-center gap-1">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {status === "loading" ? (
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          ) : session ? (
            <>
              {/* Notifications */}
              <button className="relative p-2 rounded-lg hover:bg-accent transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium">{session.user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {gradeLevel && gradeLevelShortNames[gradeLevel]}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground hidden md:block" />
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsUserMenuOpen(false)} 
                    />
                    <div className="absolute right-0 top-full mt-2 w-56 py-2 bg-popover border rounded-xl shadow-lg z-50 animate-slide-up">
                      <div className="px-4 py-2 border-b">
                        <p className="font-medium">{session.user.name}</p>
                        <p className="text-sm text-muted-foreground">{session.user.email}</p>
                      </div>
                      <div className="py-1">
                        <Link
                          href="/profile"
                          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <User className="w-4 h-4" />
                          프로필
                        </Link>
                        <Link
                          href="/my/subscription"
                          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <CreditCard className="w-4 h-4" />
                          구독 관리
                        </Link>
                        <Link
                          href="/referral"
                          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Gift className="w-4 h-4" />
                          친구 추천
                        </Link>
                        <Link
                          href="/settings"
                          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <Settings className="w-4 h-4" />
                          설정
                        </Link>
                      </div>
                      {/* Admin Menu */}
                      {session.user.role === "ADMIN" && (
                        <div className="border-t py-1">
                          <p className="px-4 py-1 text-xs font-medium text-muted-foreground">관리자</p>
                          {adminItems.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent transition-colors"
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                              <item.icon className="w-4 h-4" />
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      )}
                      {/* Parent Menu */}
                      {session.user.role === "PARENT" && (
                        <div className="border-t py-1">
                          <Link
                            href="/parent/dashboard"
                            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <Users className="w-4 h-4" />
                            학부모 대시보드
                          </Link>
                        </div>
                      )}
                      <div className="border-t py-1">
                        <button
                          onClick={() => signOut({ callbackUrl: "/" })}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-accent transition-colors w-full"
                        >
                          <LogOut className="w-4 h-4" />
                          로그아웃
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">로그인</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">시작하기</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      {session && isMobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container-main py-4 space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium hover:bg-accent transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
