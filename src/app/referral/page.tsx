"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { 
  Gift, 
  Copy,
  Check,
  Users,
  DollarSign,
  Share2,
  Mail,
  MessageCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Input, Button } from "@/components/ui";
import Header from "@/components/layout/Header";

// Mock referral data
const mockReferralData = {
  referralCode: "JALEARN-ABC123",
  totalReferrals: 5,
  pendingRewards: 2,
  totalRewards: 15000,
  referrals: [
    { id: "1", name: "김**", date: "2024-01-15", status: "completed", reward: 5000 },
    { id: "2", name: "이**", date: "2024-01-10", status: "completed", reward: 5000 },
    { id: "3", name: "박**", date: "2024-01-08", status: "completed", reward: 5000 },
    { id: "4", name: "최**", date: "2024-01-05", status: "pending", reward: 5000 },
    { id: "5", name: "정**", date: "2024-01-03", status: "pending", reward: 5000 },
  ],
};

const benefits = [
  { title: "추천인 혜택", description: "친구가 유료 구독 시 ₩5,000 크레딧 적립", icon: Gift },
  { title: "피추천인 혜택", description: "첫 결제 시 10% 할인 쿠폰 자동 발급", icon: DollarSign },
  { title: "무제한 추천", description: "추천 횟수 제한 없이 계속 적립 가능", icon: Users },
];

export default function ReferralPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login");
    },
  });

  const [copied, setCopied] = useState(false);
  const [referralCode] = useState(mockReferralData.referralCode);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    const link = `https://jalearn.com/join?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("ko-KR").format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <Header />
      
      <main className="container-main py-8 space-y-6">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">친구 추천하고 보상받기</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            친구에게 JaLearn을 추천하고, 둘 다 혜택을 받으세요!
          </p>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-4">
          {benefits.map((benefit, index) => (
            <Card key={index} className="text-center">
              <CardContent className="pt-6">
                <benefit.icon className="w-10 h-10 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-1">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Referral Code */}
        <Card className="bg-gradient-to-r from-primary/10 to-purple-600/10 border-primary/20">
          <CardContent className="py-8">
            <div className="text-center mb-6">
              <p className="text-sm text-muted-foreground mb-2">내 추천 코드</p>
              <div className="flex items-center justify-center gap-3">
                <code className="text-2xl font-bold font-mono tracking-wider">
                  {referralCode}
                </code>
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={handleCopyLink}>
                <Share2 className="w-4 h-4 mr-2" />
                링크 복사
              </Button>
              <Button variant="outline" onClick={() => window.open(`https://www.kakaotalk.com/share?text=JaLearn에서 함께 공부해요! 추천 코드: ${referralCode}`)}>
                <MessageCircle className="w-4 h-4 mr-2" />
                카카오톡
              </Button>
              <Button variant="outline" onClick={() => window.open(`mailto:?subject=JaLearn 추천&body=JaLearn에서 함께 공부해요! 추천 코드: ${referralCode}`)}>
                <Mail className="w-4 h-4 mr-2" />
                이메일
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="py-6 text-center">
              <p className="text-3xl font-bold text-primary">{mockReferralData.totalReferrals}</p>
              <p className="text-sm text-muted-foreground">총 추천 수</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-6 text-center">
              <p className="text-3xl font-bold text-orange-500">{mockReferralData.pendingRewards}</p>
              <p className="text-sm text-muted-foreground">대기 중</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-6 text-center">
              <p className="text-3xl font-bold text-green-500">₩{formatPrice(mockReferralData.totalRewards)}</p>
              <p className="text-sm text-muted-foreground">총 획득 보상</p>
            </CardContent>
          </Card>
        </div>

        {/* Referral History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              추천 내역
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mockReferralData.referrals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                아직 추천 내역이 없습니다. 친구를 초대해보세요!
              </div>
            ) : (
              <div className="space-y-3">
                {mockReferralData.referrals.map((referral) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{referral.name}</p>
                      <p className="text-sm text-muted-foreground">{referral.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₩{formatPrice(referral.reward)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        referral.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {referral.status === "completed" ? "완료" : "대기 중"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle>이용 방법</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { step: 1, title: "코드 공유", desc: "친구에게 추천 코드를 공유하세요" },
                { step: 2, title: "친구 가입", desc: "친구가 추천 코드로 가입합니다" },
                { step: 3, title: "보상 획득", desc: "친구가 구독하면 보상을 받아요" },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="font-bold text-primary">{item.step}</span>
                  </div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
