"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, FileText, Home } from "lucide-react";
import { Card, CardContent, Button } from "@/components/ui";
import Header from "@/components/layout/Header";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">결제 확인 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-background dark:from-green-950/20">
      <Header />
      
      <main className="container-main py-16">
        <Card className="max-w-lg mx-auto text-center">
          <CardContent className="pt-12 pb-8">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            
            <h1 className="text-2xl font-bold mb-2">결제가 완료되었습니다!</h1>
            <p className="text-muted-foreground mb-6">
              프리미엄 구독이 활성화되었습니다.
            </p>

            {orderId && (
              <div className="bg-muted rounded-lg p-4 mb-6">
                <p className="text-sm text-muted-foreground">주문번호</p>
                <p className="font-mono font-medium">{orderId}</p>
              </div>
            )}

            <div className="space-y-3">
              <Link href="/dashboard" className="block">
                <Button className="w-full" size="lg">
                  <Home className="w-4 h-4 mr-2" />
                  대시보드로 이동
                </Button>
              </Link>
              <Link href="/my/subscription" className="block">
                <Button variant="outline" className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  구독 관리
                </Button>
              </Link>
            </div>

            <p className="text-xs text-muted-foreground mt-6">
              영수증이 이메일로 발송되었습니다.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
