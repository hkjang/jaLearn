"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { 
  CreditCard, 
  Building2, 
  Smartphone,
  ChevronLeft,
  Shield,
  Check,
  Loader2,
  Tag
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Input, Button } from "@/components/ui";
import Header from "@/components/layout/Header";

const plans: Record<string, { name: string; price: number; yearlyPrice: number; features: string[] }> = {
  FREE: { name: "Free", price: 0, yearlyPrice: 0, features: ["기본 강의", "문제 10개/일"] },
  PREMIUM_BASIC: { name: "Premium Basic", price: 9900, yearlyPrice: 99000, features: ["전체 강의", "문제 무제한", "AI 50회/일"] },
  PREMIUM_PLUS: { name: "Premium Plus", price: 19900, yearlyPrice: 199000, features: ["모든 기능", "AI 무제한", "분석 리포트"] },
};

const paymentMethods = [
  { id: "CARD", name: "신용/체크카드", icon: CreditCard },
  { id: "BANK_TRANSFER", name: "계좌이체", icon: Building2 },
  { id: "KAKAO_PAY", name: "카카오페이", icon: Smartphone, color: "#FEE500" },
  { id: "TOSS_PAY", name: "토스페이", icon: Smartphone, color: "#0064FF" },
  { id: "NAVER_PAY", name: "네이버페이", icon: Smartphone, color: "#03C75A" },
];

function CheckoutContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const planId = searchParams.get("plan") || "PREMIUM_BASIC";
  const cycle = searchParams.get("cycle") || "monthly";
  
  const [paymentMethod, setPaymentMethod] = useState("CARD");
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToParent, setAgreedToParent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const plan = plans[planId] || plans.PREMIUM_BASIC;
  const isYearly = cycle === "yearly";
  const originalPrice = isYearly ? plan.yearlyPrice : plan.price;
  const discountedPrice = Math.max(0, originalPrice - discount);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/checkout");
    }
  }, [status, router]);

  const handleApplyCoupon = () => {
    if (!couponCode) return;
    
    // Demo: 특정 코드에 할인 적용
    if (couponCode.toUpperCase() === "WELCOME10") {
      setDiscount(Math.round(originalPrice * 0.1));
      setCouponApplied(true);
      setError("");
    } else {
      setError("유효하지 않은 쿠폰 코드입니다.");
      setCouponApplied(false);
      setDiscount(0);
    }
  };

  const handleSubmit = async () => {
    if (!agreedToTerms) {
      setError("이용약관에 동의해주세요.");
      return;
    }
    
    setIsProcessing(true);
    setError("");

    try {
      // Demo: 결제 처리 시뮬레이션
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          billingCycle: cycle,
          paymentMethod,
          couponCode: couponApplied ? couponCode : null,
          amount: discountedPrice,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "결제 처리 중 오류가 발생했습니다.");
      }

      // 결제 성공 → 완료 페이지로 이동
      router.push(`/checkout/success?orderId=${data.orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "결제 처리 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("ko-KR").format(amount);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container-main py-8">
        <Link 
          href="/pricing" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          요금제 선택으로 돌아가기
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Selected Plan */}
            <Card>
              <CardHeader>
                <CardTitle>선택한 요금제</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <h3 className="font-semibold">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {isYearly ? "연간 결제" : "월간 결제"}
                    </p>
                  </div>
                  <p className="text-xl font-bold">₩{formatPrice(originalPrice)}</p>
                </div>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>결제 수단</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                      paymentMethod === method.id
                        ? "border-primary bg-primary/5"
                        : "border-transparent bg-muted hover:bg-muted/80"
                    }`}
                  >
                    <method.icon 
                      className="w-5 h-5" 
                      style={{ color: method.color || "currentColor" }}
                    />
                    <span className="font-medium">{method.name}</span>
                    {paymentMethod === method.id && (
                      <Check className="w-4 h-4 text-primary ml-auto" />
                    )}
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Coupon */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  쿠폰 코드
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="쿠폰 코드 입력"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    disabled={couponApplied}
                  />
                  <Button 
                    variant="outline" 
                    onClick={handleApplyCoupon}
                    disabled={couponApplied || !couponCode}
                  >
                    {couponApplied ? "적용됨" : "적용"}
                  </Button>
                </div>
                {couponApplied && (
                  <p className="text-sm text-green-600 mt-2">
                    쿠폰 할인: -₩{formatPrice(discount)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  테스트 쿠폰: WELCOME10 (10% 할인)
                </p>
              </CardContent>
            </Card>

            {/* Terms */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 rounded"
                  />
                  <div className="text-sm">
                    <span className="font-medium">이용약관 및 결제 동의 (필수)</span>
                    <p className="text-muted-foreground">
                      서비스 이용약관, 개인정보 처리방침, 결제 조건에 동의합니다.
                    </p>
                  </div>
                </label>
                
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToParent}
                    onChange={(e) => setAgreedToParent(e.target.checked)}
                    className="mt-1 rounded"
                  />
                  <div className="text-sm">
                    <span className="font-medium text-orange-600">보호자 동의 (만 14세 미만)</span>
                    <p className="text-muted-foreground">
                      법정대리인의 동의를 받았음을 확인합니다.
                    </p>
                  </div>
                </label>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>결제 금액</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">상품 금액</span>
                    <span>₩{formatPrice(originalPrice)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>쿠폰 할인</span>
                      <span>-₩{formatPrice(discount)}</span>
                    </div>
                  )}
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>총 결제 금액</span>
                    <span className="text-primary">₩{formatPrice(discountedPrice)}</span>
                  </div>
                  {isYearly && (
                    <p className="text-xs text-muted-foreground mt-1">
                      월 ₩{formatPrice(Math.round(discountedPrice / 12))} (17% 할인)
                    </p>
                  )}
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={isProcessing || !agreedToTerms}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      처리 중...
                    </>
                  ) : (
                    `₩${formatPrice(discountedPrice)} 결제하기`
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  안전한 결제 (SSL 암호화)
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
