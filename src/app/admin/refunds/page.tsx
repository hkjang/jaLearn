"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, RotateCcw, Search, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from "@/components/ui";
import Header from "@/components/layout/Header";

// Mock data
const mockRefunds = [
  {
    id: "1",
    orderId: "PAY-2024001232",
    userName: "이지은",
    email: "student3@jalearn.com",
    amount: 29900,
    reason: "서비스 불만족",
    status: "COMPLETED",
    requestedAt: "2024-12-18 09:45:00",
    processedAt: "2024-12-18 10:30:00",
  },
  {
    id: "2",
    orderId: "PAY-2024001200",
    userName: "최준호",
    email: "test@test.com",
    amount: 49900,
    reason: "결제 오류",
    status: "PENDING",
    requestedAt: "2024-12-19 14:20:00",
    processedAt: null,
  },
];

export default function AdminRefundsPage() {
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

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container-main py-6 space-y-6">
        <Link
          href="/admin/revenue"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          매출 관리로 돌아가기
        </Link>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <RotateCcw className="w-6 h-6" />
            환불 관리
          </h1>
        </div>

        {/* Pending Alert */}
        {mockRefunds.some((r) => r.status === "PENDING") && (
          <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <span className="text-yellow-800">
              처리 대기 중인 환불 요청이{" "}
              {mockRefunds.filter((r) => r.status === "PENDING").length}건 있습니다.
            </span>
          </div>
        )}

        {/* Search */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input placeholder="주문번호, 이름으로 검색..." className="pl-10" />
          </div>
          <select className="px-3 py-2 rounded-lg border bg-background">
            <option value="all">전체 상태</option>
            <option value="pending">대기 중</option>
            <option value="completed">완료</option>
          </select>
        </div>

        {/* Refund List */}
        <Card>
          <CardHeader>
            <CardTitle>환불 요청 목록</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {mockRefunds.map((refund) => (
                <div key={refund.id} className="py-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{refund.userName}</span>
                      <span className="text-sm text-muted-foreground">{refund.email}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>{refund.orderId}</span>
                      <span>사유: {refund.reason}</span>
                      <span>요청: {refund.requestedAt}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-semibold">₩{refund.amount.toLocaleString()}</p>
                    <span
                      className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${
                        refund.status === "COMPLETED"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {refund.status === "COMPLETED" ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          완료
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          대기
                        </>
                      )}
                    </span>
                    {refund.status === "PENDING" && (
                      <div className="flex gap-2">
                        <Button size="sm">승인</Button>
                        <Button size="sm" variant="outline">
                          거절
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
