"use client";

import Link from "next/link";
import { CheckCircle2, Clock, Home } from "lucide-react";
import { Card, CardContent, Button } from "@/components/ui";
import Header from "@/components/layout/Header";

export default function ApplySuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-background dark:from-green-950/20">
      <Header />
      
      <main className="container-main py-16">
        <Card className="max-w-lg mx-auto text-center">
          <CardContent className="pt-12 pb-8">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            
            <h1 className="text-2xl font-bold mb-2">신청이 완료되었습니다!</h1>
            <p className="text-muted-foreground mb-6">
              강사 신청서가 성공적으로 제출되었습니다.
            </p>

            <div className="bg-muted rounded-lg p-4 mb-6 text-left">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">심사 진행 안내</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• 심사 기간: 영업일 기준 3-5일</li>
                <li>• 추가 서류 요청 시 이메일로 연락드립니다</li>
                <li>• 승인 완료 시 강사 대시보드가 활성화됩니다</li>
              </ul>
            </div>

            <Link href="/dashboard" className="block">
              <Button className="w-full" size="lg">
                <Home className="w-4 h-4 mr-2" />
                대시보드로 이동
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
