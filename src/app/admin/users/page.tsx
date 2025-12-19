"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { 
  Users, 
  Search,
  Filter,
  MoreVertical,
  UserCheck,
  UserX,
  Mail,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Input, Button } from "@/components/ui";
import { gradeLevelShortNames, type GradeLevel, type UserRole } from "@/lib/utils";
import Header from "@/components/layout/Header";

// Mock users data
const mockUsers = [
  { id: "1", name: "김민수", email: "student1@example.com", role: "STUDENT" as UserRole, gradeLevel: "ELEMENTARY_4" as GradeLevel, status: "active", joinedAt: "2024-01-01" },
  { id: "2", name: "이영희", email: "student2@example.com", role: "STUDENT" as UserRole, gradeLevel: "MIDDLE_2" as GradeLevel, status: "active", joinedAt: "2024-01-02" },
  { id: "3", name: "박선생", email: "teacher1@example.com", role: "TEACHER" as UserRole, gradeLevel: null, status: "active", joinedAt: "2023-12-15" },
  { id: "4", name: "김부모", email: "parent1@example.com", role: "PARENT" as UserRole, gradeLevel: null, status: "active", joinedAt: "2024-01-03" },
  { id: "5", name: "최민지", email: "student3@example.com", role: "STUDENT" as UserRole, gradeLevel: "HIGH_1" as GradeLevel, status: "inactive", joinedAt: "2023-11-20" },
];

const roleLabels: Record<UserRole, string> = {
  STUDENT: "학생",
  TEACHER: "교사",
  PARENT: "학부모",
  ADMIN: "관리자",
};

const roleColors: Record<UserRole, string> = {
  STUDENT: "bg-blue-100 text-blue-700",
  TEACHER: "bg-green-100 text-green-700",
  PARENT: "bg-purple-100 text-purple-700",
  ADMIN: "bg-red-100 text-red-700",
};

export default function AdminUsersPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login");
    },
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");

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

  const filteredUsers = mockUsers.filter((user) => {
    if (searchQuery && !user.name.toLowerCase().includes(searchQuery.toLowerCase()) && !user.email.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedRole !== "all" && user.role !== selectedRole) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container-main py-6 space-y-6">
        {/* Breadcrumb */}
        <Link 
          href="/admin" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          관리자 대시보드
        </Link>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6" />
              사용자 관리
            </h1>
            <p className="text-muted-foreground">
              전체 {mockUsers.length}명의 사용자
            </p>
          </div>
          <Button>
            사용자 추가
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="이름 또는 이메일 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {["all", "STUDENT", "TEACHER", "PARENT", "ADMIN"].map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedRole === role
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                {role === "all" ? "전체" : roleLabels[role as UserRole]}
              </button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">사용자</th>
                    <th className="text-left p-4 font-medium">역할</th>
                    <th className="text-left p-4 font-medium hidden md:table-cell">학년</th>
                    <th className="text-left p-4 font-medium hidden sm:table-cell">상태</th>
                    <th className="text-left p-4 font-medium hidden lg:table-cell">가입일</th>
                    <th className="text-right p-4 font-medium">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="font-medium text-primary">
                              {user.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                          {roleLabels[user.role]}
                        </span>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        {user.gradeLevel ? gradeLevelShortNames[user.gradeLevel] : "-"}
                      </td>
                      <td className="p-4 hidden sm:table-cell">
                        <span className={`flex items-center gap-1 text-sm ${
                          user.status === "active" ? "text-green-600" : "text-gray-500"
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${
                            user.status === "active" ? "bg-green-500" : "bg-gray-400"
                          }`} />
                          {user.status === "active" ? "활성" : "비활성"}
                        </span>
                      </td>
                      <td className="p-4 hidden lg:table-cell text-sm text-muted-foreground">
                        {user.joinedAt}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon">
                            <Mail className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            {user.status === "active" ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </Button>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            1-{filteredUsers.length} / {filteredUsers.length}명
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" disabled>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" disabled>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
