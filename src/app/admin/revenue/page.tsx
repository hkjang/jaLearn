"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  DollarSign, 
  TrendingUp, 
  Users,
  CreditCard,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  Download,
  Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import Header from "@/components/layout/Header";

// Mock revenue data
const mockStats = {
  monthlyRevenue: 12450000,
  monthlyGrowth: 15.3,
  totalSubscribers: 1234,
  subscriberGrowth: 8.2,
  avgTicketSize: 12500,
  churnRate: 2.3,
};

const mockRecentPayments = [
  { id: "1", user: "김민수", email: "kim@test.com", plan: "Premium Plus", amount: 19900, date: "2024-01-15 14:32", status: "completed" },
  { id: "2", user: "이영희", email: "lee@test.com", plan: "Premium Basic", amount: 9900, date: "2024-01-15 13:21", status: "completed" },
  { id: "3", user: "박철수", email: "park@test.com", plan: "Premium Basic", amount: 9900, date: "2024-01-15 12:45", status: "completed" },
  { id: "4", user: "최지은", email: "choi@test.com", plan: "Premium Plus", amount: 199000, date: "2024-01-15 11:30", status: "completed" },
  { id: "5", user: "정민호", email: "jung@test.com", plan: "Premium Basic", amount: 9900, date: "2024-01-15 10:15", status: "refunded" },
];

const mockPlanBreakdown = [
  { plan: "Free", count: 8500, percentage: 65 },
  { plan: "Premium Basic", count: 3200, percentage: 24.5 },
  { plan: "Premium Plus", count: 1300, percentage: 10.5 },
];

export default function AdminRevenuePage() {
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

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("ko-KR").format(amount);
  };

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
              <DollarSign className="w-6 h-6" />
              매출 관리
            </h1>
            <p className="text-muted-foreground">
              수익 현황과 결제 내역을 관리하세요
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              필터
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              내보내기
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                <span className={`flex items-center text-xs font-medium ${mockStats.monthlyGrowth >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {mockStats.monthlyGrowth >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  {Math.abs(mockStats.monthlyGrowth)}%
                </span>
              </div>
              <p className="text-2xl font-bold">₩{formatPrice(mockStats.monthlyRevenue)}</p>
              <p className="text-sm text-muted-foreground">이번 달 매출</p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-blue-500" />
                <span className="flex items-center text-xs font-medium text-green-600">
                  <ArrowUp className="w-3 h-3" />
                  {mockStats.subscriberGrowth}%
                </span>
              </div>
              <p className="text-2xl font-bold">{mockStats.totalSubscribers.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">유료 구독자</p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <CreditCard className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-2xl font-bold">₩{formatPrice(mockStats.avgTicketSize)}</p>
              <p className="text-sm text-muted-foreground">평균 결제액</p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-2xl font-bold">{mockStats.churnRate}%</p>
              <p className="text-sm text-muted-foreground">이탈률</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Plan Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>요금제 분포</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockPlanBreakdown.map((item) => (
                <div key={item.plan}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{item.plan}</span>
                    <span className="text-muted-foreground">
                      {item.count.toLocaleString()}명 ({item.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        item.plan === "Free" ? "bg-gray-400" :
                        item.plan === "Premium Basic" ? "bg-blue-500" : "bg-purple-500"
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>최근 결제</CardTitle>
              <Link href="/admin/payments" className="text-sm text-primary hover:underline">
                전체보기
              </Link>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                      <th className="pb-2">사용자</th>
                      <th className="pb-2">요금제</th>
                      <th className="pb-2">금액</th>
                      <th className="pb-2">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockRecentPayments.slice(0, 5).map((payment) => (
                      <tr key={payment.id} className="border-b last:border-0">
                        <td className="py-3">
                          <p className="font-medium">{payment.user}</p>
                          <p className="text-xs text-muted-foreground">{payment.date}</p>
                        </td>
                        <td className="py-3 text-sm">{payment.plan}</td>
                        <td className="py-3 font-medium">₩{formatPrice(payment.amount)}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            payment.status === "completed" 
                              ? "bg-green-100 text-green-700" 
                              : "bg-red-100 text-red-700"
                          }`}>
                            {payment.status === "completed" ? "완료" : "환불"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/admin/coupons">
            <Card className="card-hover p-4 text-center">
              <p className="font-medium">쿠폰 관리</p>
              <p className="text-xs text-muted-foreground">할인 쿠폰 발급</p>
            </Card>
          </Link>
          <Link href="/admin/settlements">
            <Card className="card-hover p-4 text-center">
              <p className="font-medium">강사 정산</p>
              <p className="text-xs text-muted-foreground">수익 배분 관리</p>
            </Card>
          </Link>
          <Link href="/admin/refunds">
            <Card className="card-hover p-4 text-center">
              <p className="font-medium">환불 처리</p>
              <p className="text-xs text-muted-foreground">환불 요청 관리</p>
            </Card>
          </Link>
          <Link href="/admin/invoices">
            <Card className="card-hover p-4 text-center">
              <p className="font-medium">세금계산서</p>
              <p className="text-xs text-muted-foreground">영수증 발급</p>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
