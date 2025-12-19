"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, CreditCard, Search, Download, Calendar, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from "@/components/ui";
import Header from "@/components/layout/Header";

// Mock data
const mockPayments = [
  {
    id: "1",
    orderId: "PAY-2024001234",
    userName: "홍길동",
    email: "student@test.com",
    planName: "프리미엄 플러스",
    amount: 49900,
    method: "카드",
    status: "COMPLETED",
    paidAt: "2024-12-19 14:32:15",
  },
  {
    id: "2",
    orderId: "PAY-2024001233",
    userName: "김민수",
    email: "student2@jalearn.com",
    planName: "프리미엄 베이직",
    amount: 29900,
    method: "카카오페이",
    status: "COMPLETED",
    paidAt: "2024-12-19 10:15:30",
  },
  {
    id: "3",
    orderId: "PAY-2024001232",
    userName: "이지은",
    email: "student3@jalearn.com",
    planName: "프리미엄 베이직",
    amount: 29900,
    method: "카드",
    status: "REFUNDED",
    paidAt: "2024-12-18 09:45:00",
  },
];

export default function AdminPaymentsPage() {
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

  const totalAmount = mockPayments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.amount, 0);

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
            <CreditCard className="w-6 h-6" />
            결제 관리
          </h1>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            내보내기
          </Button>
        </div>

        {/* Summary */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">오늘 결제 금액</p>
                <p className="text-2xl font-bold">₩{totalAmount.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  {mockPayments.filter((p) => p.status === "COMPLETED").length}건 완료
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input placeholder="주문번호, 이름, 이메일로 검색..." className="pl-10" />
          </div>
          <select className="px-3 py-2 rounded-lg border bg-background">
            <option value="all">전체 상태</option>
            <option value="completed">결제완료</option>
            <option value="refunded">환불됨</option>
          </select>
        </div>

        {/* Payment List */}
        <Card>
          <CardHeader>
            <CardTitle>결제 내역</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {mockPayments.map((payment) => (
                <div key={payment.id} className="py-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{payment.userName}</span>
                      <span className="text-sm text-muted-foreground">{payment.email}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>{payment.orderId}</span>
                      <span>{payment.planName}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {payment.paidAt}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold">₩{payment.amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{payment.method}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        payment.status === "COMPLETED"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {payment.status === "COMPLETED" ? "완료" : "환불"}
                    </span>
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
