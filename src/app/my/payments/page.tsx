"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, CreditCard, Download, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import Header from "@/components/layout/Header";

// Mock data
const mockPayments = [
  {
    id: "1",
    orderId: "PAY-2024001234",
    planName: "프리미엄 플러스",
    amount: 49900,
    method: "카드",
    status: "COMPLETED",
    paidAt: "2024-12-01 14:32:15",
  },
  {
    id: "2",
    orderId: "PAY-2024001100",
    planName: "프리미엄 베이직",
    amount: 29900,
    method: "카카오페이",
    status: "COMPLETED",
    paidAt: "2024-11-01 10:15:30",
  },
  {
    id: "3",
    orderId: "PAY-2024000980",
    planName: "프리미엄 베이직",
    amount: 29900,
    method: "카드",
    status: "REFUNDED",
    paidAt: "2024-10-01 09:45:00",
  },
];

export default function MyPaymentsPage() {
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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container-main py-6 space-y-6">
        <Link
          href="/my/subscription"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          구독 관리로 돌아가기
        </Link>

        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CreditCard className="w-6 h-6" />
          결제 내역
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>전체 결제 내역</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {mockPayments.map((payment) => (
                <div key={payment.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{payment.planName}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{payment.orderId}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {payment.paidAt}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {payment.status === "REFUNDED" ? (
                        <span className="text-muted-foreground line-through">
                          ₩{payment.amount.toLocaleString()}
                        </span>
                      ) : (
                        `₩${payment.amount.toLocaleString()}`
                      )}
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          payment.status === "COMPLETED"
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {payment.status === "COMPLETED" ? "결제완료" : "환불됨"}
                      </span>
                      <button className="text-primary hover:underline text-sm flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        영수증
                      </button>
                    </div>
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
