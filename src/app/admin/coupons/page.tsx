"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { 
  Tag, 
  Plus,
  ChevronLeft,
  Calendar,
  Percent,
  Hash,
  ToggleLeft,
  ToggleRight,
  Copy,
  Check
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Input, Button } from "@/components/ui";
import Header from "@/components/layout/Header";

// Mock coupons data
const mockCoupons = [
  { 
    id: "1", 
    code: "WELCOME10", 
    name: "신규 가입 환영", 
    discountType: "PERCENT", 
    discountValue: 10, 
    maxUses: 1000, 
    usedCount: 234, 
    validUntil: "2024-12-31", 
    isActive: true 
  },
  { 
    id: "2", 
    code: "NEWYEAR2024", 
    name: "새해 특가", 
    discountType: "FIXED_AMOUNT", 
    discountValue: 5000, 
    maxUses: 500, 
    usedCount: 123, 
    validUntil: "2024-01-31", 
    isActive: true 
  },
  { 
    id: "3", 
    code: "PREMIUM20", 
    name: "프리미엄 할인", 
    discountType: "PERCENT", 
    discountValue: 20, 
    maxUses: 100, 
    usedCount: 45, 
    validUntil: "2024-06-30", 
    isActive: true 
  },
  { 
    id: "4", 
    code: "SUMMER50", 
    name: "여름 특가 (종료)", 
    discountType: "PERCENT", 
    discountValue: 50, 
    maxUses: 200, 
    usedCount: 200, 
    validUntil: "2023-08-31", 
    isActive: false 
  },
];

export default function AdminCouponsPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login");
    },
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    name: "",
    discountType: "PERCENT",
    discountValue: 10,
    maxUses: 100,
    validUntil: "",
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

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("ko-KR").format(amount);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container-main py-6 space-y-6">
        {/* Breadcrumb */}
        <Link 
          href="/admin/revenue" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          매출 관리
        </Link>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Tag className="w-6 h-6" />
              쿠폰 관리
            </h1>
            <p className="text-muted-foreground">
              할인 쿠폰을 발급하고 관리하세요
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            새 쿠폰 발급
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{mockCoupons.length}</p>
              <p className="text-sm text-muted-foreground">전체 쿠폰</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{mockCoupons.filter(c => c.isActive).length}</p>
              <p className="text-sm text-muted-foreground">활성 쿠폰</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{mockCoupons.reduce((acc, c) => acc + c.usedCount, 0)}</p>
              <p className="text-sm text-muted-foreground">총 사용 횟수</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">₩{formatPrice(mockCoupons.reduce((acc, c) => acc + (c.discountType === "FIXED_AMOUNT" ? c.discountValue * c.usedCount : c.usedCount * 5000), 0))}</p>
              <p className="text-sm text-muted-foreground">총 할인 금액</p>
            </CardContent>
          </Card>
        </div>

        {/* Coupons List */}
        <Card>
          <CardHeader>
            <CardTitle>쿠폰 목록</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3">코드</th>
                    <th className="pb-3">이름</th>
                    <th className="pb-3">할인</th>
                    <th className="pb-3">사용량</th>
                    <th className="pb-3">유효기간</th>
                    <th className="pb-3">상태</th>
                    <th className="pb-3">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {mockCoupons.map((coupon) => (
                    <tr key={coupon.id} className="border-b last:border-0">
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                            {coupon.code}
                          </code>
                          <button
                            onClick={() => handleCopyCode(coupon.code)}
                            className="p-1 hover:bg-muted rounded"
                          >
                            {copiedCode === coupon.code 
                              ? <Check className="w-4 h-4 text-green-500" />
                              : <Copy className="w-4 h-4 text-muted-foreground" />
                            }
                          </button>
                        </div>
                      </td>
                      <td className="py-4 font-medium">{coupon.name}</td>
                      <td className="py-4">
                        <span className="flex items-center gap-1">
                          {coupon.discountType === "PERCENT" ? (
                            <>
                              <Percent className="w-4 h-4" />
                              {coupon.discountValue}%
                            </>
                          ) : (
                            <>₩{formatPrice(coupon.discountValue)}</>
                          )}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className="text-sm">
                          {coupon.usedCount}/{coupon.maxUses || "∞"}
                        </span>
                        <div className="w-24 h-1.5 bg-muted rounded-full mt-1">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${coupon.maxUses ? (coupon.usedCount / coupon.maxUses) * 100 : 0}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="flex items-center gap-1 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {coupon.validUntil}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          coupon.isActive 
                            ? "bg-green-100 text-green-700" 
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          {coupon.isActive ? "활성" : "비활성"}
                        </span>
                      </td>
                      <td className="py-4">
                        <Button variant="ghost" size="sm">
                          {coupon.isActive 
                            ? <ToggleRight className="w-4 h-4" />
                            : <ToggleLeft className="w-4 h-4" />
                          }
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>새 쿠폰 발급</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">쿠폰 코드</label>
                  <Input
                    placeholder="WELCOME10 (빈칸시 자동생성)"
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">쿠폰 이름</label>
                  <Input
                    placeholder="신규 가입 환영 쿠폰"
                    value={newCoupon.name}
                    onChange={(e) => setNewCoupon({...newCoupon, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">할인 유형</label>
                    <select
                      className="w-full p-2 border rounded-lg"
                      value={newCoupon.discountType}
                      onChange={(e) => setNewCoupon({...newCoupon, discountType: e.target.value})}
                    >
                      <option value="PERCENT">퍼센트</option>
                      <option value="FIXED_AMOUNT">정액</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">할인 값</label>
                    <Input
                      type="number"
                      placeholder="10"
                      value={newCoupon.discountValue}
                      onChange={(e) => setNewCoupon({...newCoupon, discountValue: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">최대 사용 횟수</label>
                    <Input
                      type="number"
                      placeholder="100"
                      value={newCoupon.maxUses}
                      onChange={(e) => setNewCoupon({...newCoupon, maxUses: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">유효기간</label>
                    <Input
                      type="date"
                      value={newCoupon.validUntil}
                      onChange={(e) => setNewCoupon({...newCoupon, validUntil: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>
                    취소
                  </Button>
                  <Button className="flex-1">
                    발급하기
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
