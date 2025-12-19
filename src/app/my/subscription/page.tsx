"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  CreditCard, 
  Calendar, 
  AlertCircle,
  ChevronRight,
  Pause,
  Play,
  X,
  Crown,
  Check
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Progress } from "@/components/ui";
import Header from "@/components/layout/Header";

interface Subscription {
  id: string;
  status: string;
  billingCycle: string;
  startDate: string;
  endDate: string | null;
  nextBillingDate: string | null;
  autoRenew: boolean;
  plan: {
    name: string;
    displayName: string;
    price: number;
    features: string[];
  };
  isFreePlan: boolean;
}

export default function SubscriptionPage() {
  const { status: authStatus } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login");
    },
  });

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await fetch("/api/subscriptions");
      const data = await response.json();
      setSubscription(data);
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (action: string) => {
    setActionLoading(true);
    try {
      const response = await fetch("/api/subscriptions", {
        method: action === "cancel" ? "DELETE" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      
      if (response.ok) {
        await fetchSubscription();
      }
    } catch (error) {
      console.error("Action failed:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("ko-KR").format(amount);
  };

  const getDaysRemaining = () => {
    if (!subscription?.endDate) return null;
    const end = new Date(subscription.endDate);
    const now = new Date();
    const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  if (authStatus === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const daysRemaining = getDaysRemaining();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container-main py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold">구독 관리</h1>

          {/* Current Plan */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="w-6 h-6 text-primary" />
                <div>
                  <CardTitle>{subscription?.plan?.displayName || "Free"}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {subscription?.isFreePlan ? "무료 요금제" : `${subscription?.billingCycle === "YEARLY" ? "연간" : "월간"} 구독`}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                subscription?.status === "ACTIVE" 
                  ? "bg-green-100 text-green-700" 
                  : subscription?.status === "PAUSED"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-gray-100 text-gray-700"
              }`}>
                {subscription?.status === "ACTIVE" ? "활성" : 
                 subscription?.status === "PAUSED" ? "일시중지" : "비활성"}
              </span>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Features */}
              <div>
                <p className="text-sm font-medium mb-2">포함된 기능</p>
                <ul className="grid grid-cols-2 gap-2">
                  {(subscription?.plan?.features || ["기본 강의", "문제 10개/일"]).map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Billing Info */}
              {!subscription?.isFreePlan && (
                <>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">시작일</p>
                      <p className="font-medium">{formatDate(subscription?.startDate || null)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">만료일</p>
                      <p className="font-medium">{formatDate(subscription?.endDate || null)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">다음 결제일</p>
                      <p className="font-medium">
                        {subscription?.autoRenew 
                          ? formatDate(subscription?.nextBillingDate || null)
                          : "자동결제 해제됨"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">결제 금액</p>
                      <p className="font-medium">
                        ₩{formatPrice(subscription?.plan?.price || 0)}/{subscription?.billingCycle === "YEARLY" ? "년" : "월"}
                      </p>
                    </div>
                  </div>

                  {/* Days Remaining Progress */}
                  {daysRemaining !== null && (
                    <div className="pt-4 border-t">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">남은 기간</span>
                        <span className="font-medium">{daysRemaining}일</span>
                      </div>
                      <Progress value={(daysRemaining / 30) * 100} />
                    </div>
                  )}
                </>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                {subscription?.isFreePlan ? (
                  <Link href="/pricing" className="flex-1">
                    <Button className="w-full">
                      프리미엄 업그레이드
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    {subscription?.status === "ACTIVE" && (
                      <Button
                        variant="outline"
                        onClick={() => handleAction("pause")}
                        disabled={actionLoading}
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        일시중지
                      </Button>
                    )}
                    {subscription?.status === "PAUSED" && (
                      <Button
                        onClick={() => handleAction("resume")}
                        disabled={actionLoading}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        재개
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => handleAction("toggle_autorenew")}
                      disabled={actionLoading}
                    >
                      {subscription?.autoRenew ? "자동결제 해제" : "자동결제 설정"}
                    </Button>
                    <Link href="/pricing">
                      <Button variant="outline">
                        요금제 변경
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          {!subscription?.isFreePlan && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  결제 수단
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded flex items-center justify-center text-white text-xs font-bold">
                      VISA
                    </div>
                    <div>
                      <p className="font-medium">**** **** **** 4242</p>
                      <p className="text-sm text-muted-foreground">만료 12/25</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">변경</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Billing History */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                결제 내역
              </CardTitle>
              <Link href="/my/payments" className="text-sm text-primary hover:underline">
                전체보기
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Premium Basic</p>
                      <p className="text-sm text-muted-foreground">2024-01-{15 - i}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₩9,900</p>
                      <p className="text-xs text-green-600">결제완료</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cancel Subscription */}
          {!subscription?.isFreePlan && (
            <Card className="border-destructive/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-destructive">구독 해지</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      구독을 해지하면 현재 기간이 종료된 후 유료 기능을 이용할 수 없습니다.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => handleAction("cancel")}
                      disabled={actionLoading}
                    >
                      <X className="w-4 h-4 mr-2" />
                      구독 해지
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
