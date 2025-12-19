"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useState } from "react";
import { User, Mail, Phone, School, Camera, Save, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from "@/components/ui";
import Header from "@/components/layout/Header";

export default function ProfilePage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login");
    },
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "010-1234-5678",
    school: "서울고등학교",
    bio: "열심히 공부하는 학생입니다!",
  });

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Initialize form data from session
  if (session?.user && !formData.name) {
    setFormData((prev) => ({
      ...prev,
      name: session.user.name || "",
      email: session.user.email || "",
    }));
  }

  const handleSave = async () => {
    // In real app, this would call an API to update the profile
    setIsEditing(false);
    // Show success toast
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container-main py-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          대시보드로 돌아가기
        </Link>

        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <User className="w-6 h-6" />
              내 프로필
            </h1>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>프로필 수정</Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  취소
                </Button>
                <Button onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  저장
                </Button>
              </div>
            )}
          </div>

          {/* Profile Picture */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-3xl font-bold text-primary">
                      {session?.user?.name?.[0] || "U"}
                    </span>
                  </div>
                  {isEditing && (
                    <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg">
                      <Camera className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{session?.user?.name}</h2>
                  <p className="text-muted-foreground">{session?.user?.email}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {session?.user?.role === "STUDENT"
                      ? "학생"
                      : session?.user?.role === "TEACHER"
                      ? "선생님"
                      : session?.user?.role === "PARENT"
                      ? "학부모"
                      : "관리자"}
                    {session?.user?.gradeLevel && ` · ${session?.user?.gradeLevel}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Info */}
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">이름</label>
                  {isEditing ? (
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  ) : (
                    <p className="text-muted-foreground">{formData.name || "-"}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    이메일
                  </label>
                  <p className="text-muted-foreground">{formData.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">이메일은 변경할 수 없습니다</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    전화번호
                  </label>
                  {isEditing ? (
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="010-0000-0000"
                    />
                  ) : (
                    <p className="text-muted-foreground">{formData.phone || "-"}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5 flex items-center gap-2">
                    <School className="w-4 h-4" />
                    학교
                  </label>
                  {isEditing ? (
                    <Input
                      value={formData.school}
                      onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                      placeholder="학교 이름을 입력하세요"
                    />
                  ) : (
                    <p className="text-muted-foreground">{formData.school || "-"}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">자기소개</label>
                  {isEditing ? (
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="w-full min-h-[100px] px-3 py-2 rounded-lg border bg-background resize-none"
                      placeholder="자기소개를 입력하세요"
                    />
                  ) : (
                    <p className="text-muted-foreground">{formData.bio || "-"}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle>계정 관리</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                비밀번호 변경
              </Button>
              <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50">
                회원 탈퇴
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
