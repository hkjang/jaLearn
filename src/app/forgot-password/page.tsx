"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui";
import { GraduationCap, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitted(true);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-purple-500/5 p-4">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 rounded-xl gradient-premium flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold">JaLearn</span>
          </Link>
        </div>

        <Card className="shadow-xl border-0">
          {isSubmitted ? (
            <>
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl">이메일 전송 완료</CardTitle>
                <CardDescription>
                  비밀번호 재설정 링크를 이메일로 발송했습니다
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-center text-muted-foreground">
                  <span className="font-medium text-foreground">{email}</span>
                  <br />
                  으로 비밀번호 재설정 안내 메일을 보냈습니다.
                  <br />
                  메일함을 확인해주세요.
                </p>
                <p className="text-center text-sm text-muted-foreground">
                  이메일이 도착하지 않았다면 스팸 메일함을 확인하거나,
                  <br />
                  잠시 후 다시 시도해주세요.
                </p>
              </CardContent>

              <CardFooter className="flex-col gap-4">
                <Link href="/login" className="w-full">
                  <Button className="w-full">
                    로그인 페이지로 돌아가기
                  </Button>
                </Link>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="text-sm text-primary hover:underline"
                >
                  다른 이메일로 다시 시도
                </button>
              </CardFooter>
            </>
          ) : (
            <>
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl">비밀번호 찾기</CardTitle>
                <CardDescription>
                  가입한 이메일 주소를 입력하시면
                  <br />
                  비밀번호 재설정 링크를 보내드립니다
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="이메일"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-11"
                      required
                      autoComplete="email"
                    />
                  </div>
                </CardContent>

                <CardFooter className="flex-col gap-4">
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    isLoading={isLoading}
                  >
                    재설정 링크 보내기
                  </Button>

                  <Link
                    href="/login"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    로그인 페이지로 돌아가기
                  </Link>
                </CardFooter>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
