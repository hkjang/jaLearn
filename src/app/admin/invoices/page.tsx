"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, FileText, Search, Download, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from "@/components/ui";
import Header from "@/components/layout/Header";

// Mock data
const mockInvoices = [
  {
    id: "1",
    invoiceNumber: "INV-2024-001234",
    userName: "홍길동",
    type: "TAX_INVOICE",
    amount: 49900,
    taxAmount: 4536,
    issuedAt: "2024-12-19 14:35:00",
  },
  {
    id: "2",
    invoiceNumber: "INV-2024-001233",
    userName: "김민수",
    type: "CASH_RECEIPT",
    amount: 29900,
    taxAmount: 2718,
    issuedAt: "2024-12-19 10:20:00",
  },
  {
    id: "3",
    invoiceNumber: "INV-2024-001232",
    userName: "(주)테스트회사",
    type: "TAX_INVOICE",
    amount: 499000,
    taxAmount: 45364,
    issuedAt: "2024-12-18 16:45:00",
  },
];

export default function AdminInvoicesPage() {
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
            <FileText className="w-6 h-6" />
            세금계산서/현금영수증 관리
          </h1>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            내보내기
          </Button>
        </div>

        {/* Search */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input placeholder="발행번호, 이름으로 검색..." className="pl-10" />
          </div>
          <select className="px-3 py-2 rounded-lg border bg-background">
            <option value="all">전체 유형</option>
            <option value="tax">세금계산서</option>
            <option value="cash">현금영수증</option>
          </select>
        </div>

        {/* Invoice List */}
        <Card>
          <CardHeader>
            <CardTitle>발행 내역</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {mockInvoices.map((invoice) => (
                <div key={invoice.id} className="py-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{invoice.invoiceNumber}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          invoice.type === "TAX_INVOICE"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {invoice.type === "TAX_INVOICE" ? "세금계산서" : "현금영수증"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>{invoice.userName}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {invoice.issuedAt}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="font-semibold">₩{invoice.amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        부가세: ₩{invoice.taxAmount.toLocaleString()}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-1" />
                      PDF
                    </Button>
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
