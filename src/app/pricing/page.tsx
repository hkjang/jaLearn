"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Check, X, Sparkles, Crown, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import Header from "@/components/layout/Header";

interface PlanFeature {
  name: string;
  free: boolean | string;
  basic: boolean | string;
  plus: boolean | string;
}

const plans = [
  {
    id: "FREE",
    name: "Free",
    price: 0,
    yearlyPrice: 0,
    description: "학습을 시작하는 학생을 위한 무료 플랜",
    icon: Zap,
    color: "bg-gray-100 text-gray-700",
    features: [
      "기본 강의 수강",
      "일일 문제 10개",
      "AI 튜터 10회/일",
      "기본 진도 추적",
    ],
  },
  {
    id: "PREMIUM_BASIC",
    name: "Premium Basic",
    price: 9900,
    yearlyPrice: 99000,
    description: "본격적인 학습을 위한 기본 프리미엄",
    icon: Sparkles,
    color: "bg-blue-100 text-blue-700",
    popular: true,
    features: [
      "모든 강의 무제한",
      "문제 무제한",
      "AI 튜터 50회/일",
      "상세 진도 분석",
      "오답 노트",
    ],
  },
  {
    id: "PREMIUM_PLUS",
    name: "Premium Plus",
    price: 19900,
    yearlyPrice: 199000,
    description: "최상의 학습 경험을 위한 프리미엄 플러스",
    icon: Crown,
    color: "bg-purple-100 text-purple-700",
    features: [
      "모든 Basic 기능",
      "AI 튜터 무제한",
      "AI 학습 분석 리포트",
      "AI 취약점 진단",
      "1:1 학습 코칭",
      "광고 없음",
    ],
  },
];

const featureComparison: PlanFeature[] = [
  { name: "강의 수강", free: "기본 강의만", basic: "전체 무제한", plus: "전체 무제한" },
  { name: "문제 풀이", free: "10개/일", basic: "무제한", plus: "무제한" },
  { name: "AI 튜터", free: "10회/일", basic: "50회/일", plus: "무제한" },
  { name: "진도 추적", free: true, basic: true, plus: true },
  { name: "오답 노트", free: false, basic: true, plus: true },
  { name: "AI 학습 분석", free: false, basic: false, plus: true },
  { name: "AI 취약점 진단", free: false, basic: false, plus: true },
  { name: "1:1 학습 코칭", free: false, basic: false, plus: true },
  { name: "광고 제거", free: false, basic: false, plus: true },
];

export default function PricingPage() {
  const { data: session } = useSession();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const getPrice = (plan: typeof plans[0]) => {
    if (billingCycle === "yearly") {
      const monthly = Math.round(plan.yearlyPrice / 12);
      return { display: monthly, original: plan.price, yearly: plan.yearlyPrice };
    }
    return { display: plan.price, original: null, yearly: null };
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("ko-KR").format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Header />
      
      <main className="container-main py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            나에게 딱 맞는 요금제를 선택하세요
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            JaLearn의 모든 기능을 자유롭게 이용하고, 
            AI 기반 맞춤 학습으로 성적을 향상시키세요.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <span className={billingCycle === "monthly" ? "font-semibold" : "text-muted-foreground"}>
            월간 결제
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              billingCycle === "yearly" ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                billingCycle === "yearly" ? "translate-x-8" : "translate-x-1"
              }`}
            />
          </button>
          <span className={billingCycle === "yearly" ? "font-semibold" : "text-muted-foreground"}>
            연간 결제
            <span className="ml-2 text-xs text-green-600 font-medium">-17% 할인</span>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan) => {
            const price = getPrice(plan);
            const Icon = plan.icon;
            
            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all hover:shadow-xl ${
                  plan.popular ? "border-2 border-primary ring-2 ring-primary/20" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-bl-lg">
                    인기
                  </div>
                )}
                
                <CardHeader className="text-center pb-2">
                  <div className={`w-12 h-12 rounded-xl ${plan.color} flex items-center justify-center mx-auto mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </CardHeader>
                
                <CardContent className="text-center">
                  <div className="mb-6">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold">
                        ₩{formatPrice(price.display)}
                      </span>
                      <span className="text-muted-foreground">/월</span>
                    </div>
                    {price.original && (
                      <p className="text-sm text-muted-foreground line-through">
                        ₩{formatPrice(price.original)}/월
                      </p>
                    )}
                    {price.yearly && (
                      <p className="text-sm text-green-600">
                        연 ₩{formatPrice(price.yearly)}
                      </p>
                    )}
                  </div>
                  
                  <ul className="space-y-3 mb-6 text-left">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Link href={session ? `/checkout?plan=${plan.id}&cycle=${billingCycle}` : "/register"}>
                    <Button
                      className="w-full"
                      variant={plan.popular ? "default" : "outline"}
                      size="lg"
                    >
                      {plan.price === 0 ? "무료로 시작" : "선택하기"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">상세 기능 비교</h2>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium">기능</th>
                    <th className="text-center p-4 font-medium">Free</th>
                    <th className="text-center p-4 font-medium">Premium Basic</th>
                    <th className="text-center p-4 font-medium">Premium Plus</th>
                  </tr>
                </thead>
                <tbody>
                  {featureComparison.map((feature, index) => (
                    <tr key={index} className="border-b last:border-0">
                      <td className="p-4 font-medium">{feature.name}</td>
                      {["free", "basic", "plus"].map((plan) => {
                        const value = feature[plan as keyof Omit<PlanFeature, "name">];
                        return (
                          <td key={plan} className="text-center p-4">
                            {typeof value === "boolean" ? (
                              value ? (
                                <Check className="w-5 h-5 text-green-500 mx-auto" />
                              ) : (
                                <X className="w-5 h-5 text-gray-300 mx-auto" />
                              )
                            ) : (
                              <span className="text-sm">{value}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">자주 묻는 질문</h2>
          <div className="space-y-4">
            {[
              { q: "언제든지 해지할 수 있나요?", a: "네, 언제든지 구독을 해지할 수 있습니다. 해지 시 현재 결제 기간이 끝날 때까지 서비스를 이용할 수 있습니다." },
              { q: "환불 정책은 어떻게 되나요?", a: "교육법에 따라 학습 진도에 비례하여 환불해드립니다. 자세한 내용은 고객센터로 문의해주세요." },
              { q: "요금제 변경이 가능한가요?", a: "네, 언제든지 상위 또는 하위 요금제로 변경할 수 있습니다. 변경 시 차액은 일할 계산됩니다." },
            ].map((faq, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
