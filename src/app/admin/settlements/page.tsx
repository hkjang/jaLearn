"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Wallet, Search, Download, Calendar, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from "@/components/ui";
import Header from "@/components/layout/Header";

// Mock data
const mockSettlements = [
  {
    id: "1",
    instructorName: "김선생",
    periodStart: "2024-11-01",
    periodEnd: "2024-11-30",
    grossAmount: 4500000,
    netAmount: 3150000,
    status: "COMPLETED",
    paidAt: "2024-12-05",
  },
  {
    id: "2",
    instructorName: "박수학 선생님",
    periodStart: "2024-11-01",
    periodEnd: "2024-11-30",
    grossAmount: 7890000,
    netAmount: 5523000,
    status: "COMPLETED",
    paidAt: "2024-12-05",
  },
  {
    id: "3",
    instructorName: "이영희 선생님",
    periodStart: "2024-12-01",
    periodEnd: "2024-12-31",
    grossAmount: 2340000,
    netAmount: 1638000,
    status: "PENDING",
    paidAt: null,
  },
];

export default function AdminSettlementsPage() {
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
            <Wallet className="w-6 h-6" />
            정산 관리
          </h1>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              내보내기
            </Button>
            <Button>일괄 정산 처리</Button>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input placeholder="강사명으로 검색..." className="pl-10" />
          </div>
          <select className="px-3 py-2 rounded-lg border bg-background">
            <option value="all">전체 상태</option>
            <option value="pending">대기 중</option>
            <option value="completed">완료</option>
          </select>
        </div>

        {/* Settlement List */}
        <Card>
          <CardHeader>
            <CardTitle>정산 내역</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {mockSettlements.map((settlement) => (
                <div key={settlement.id} className="py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{settlement.instructorName}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {settlement.periodStart} ~ {settlement.periodEnd}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">총 매출</p>
                      <p className="font-medium">₩{settlement.grossAmount.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">정산 금액</p>
                      <p className="font-semibold text-primary">
                        ₩{settlement.netAmount.toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${
                        settlement.status === "COMPLETED"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {settlement.status === "COMPLETED" ? (
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
                    {settlement.status === "PENDING" && (
                      <Button size="sm">정산 처리</Button>
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
