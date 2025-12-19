"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Wallet, Download, Calendar, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import Header from "@/components/layout/Header";

// Mock data
const mockSettlements = [
  {
    id: "1",
    periodStart: "2024-11-01",
    periodEnd: "2024-11-30",
    grossAmount: 4500000,
    commissionAmount: 1350000,
    netAmount: 3150000,
    status: "COMPLETED",
    paidAt: "2024-12-05",
  },
  {
    id: "2",
    periodStart: "2024-12-01",
    periodEnd: "2024-12-31",
    grossAmount: 5200000,
    commissionAmount: 1560000,
    netAmount: 3640000,
    status: "PENDING",
    paidAt: null,
  },
];

export default function InstructorSettlementsPage() {
  const { status } = useSession({
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

  const totalEarnings = mockSettlements.reduce((sum, s) => sum + s.netAmount, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container-main py-6 space-y-6">
        <Link
          href="/instructor/dashboard"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          강사 대시보드로 돌아가기
        </Link>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="w-6 h-6" />
            정산 관리
          </h1>
        </div>

        {/* Summary */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">
                ₩{totalEarnings.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">총 누적 수익</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-orange-600">
                ₩{mockSettlements.find(s => s.status === "PENDING")?.netAmount.toLocaleString() || 0}
              </p>
              <p className="text-sm text-muted-foreground">정산 대기 중</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">30%</p>
              <p className="text-sm text-muted-foreground">플랫폼 수수료</p>
            </CardContent>
          </Card>
        </div>

        {/* Settlement History */}
        <Card>
          <CardHeader>
            <CardTitle>정산 내역</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {mockSettlements.map((settlement) => (
                <div key={settlement.id} className="py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {settlement.periodStart} ~ {settlement.periodEnd}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            settlement.status === "COMPLETED"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {settlement.status === "COMPLETED" ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              지급완료
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              대기 중
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground grid grid-cols-3 gap-4">
                        <div>
                          <p>총 매출</p>
                          <p className="font-medium text-foreground">
                            ₩{settlement.grossAmount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p>수수료 (30%)</p>
                          <p className="font-medium text-red-600">
                            -₩{settlement.commissionAmount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p>정산 금액</p>
                          <p className="font-medium text-primary">
                            ₩{settlement.netAmount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    {settlement.status === "COMPLETED" && (
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        명세서
                      </Button>
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
