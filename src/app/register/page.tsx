"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui";
import { GraduationCap, Mail, Lock, User, AlertCircle, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { gradeLevelNames, gradeLevelShortNames, type GradeLevel, type UserRole } from "@/lib/utils";

type Step = "role" | "info" | "grade" | "consent";

const roles = [
  { value: "STUDENT", label: "학생", description: "강좌를 수강하고 문제를 풀어요", icon: "🎒" },
  { value: "TEACHER", label: "교사", description: "강좌를 등록하고 학생을 관리해요", icon: "👨‍🏫" },
  { value: "PARENT", label: "학부모", description: "자녀의 학습 현황을 확인해요", icon: "👨‍👩‍👧" },
];

const gradeLevelGroups = [
  { label: "초등학교", levels: ["ELEMENTARY_1", "ELEMENTARY_2", "ELEMENTARY_3", "ELEMENTARY_4", "ELEMENTARY_5", "ELEMENTARY_6"] as GradeLevel[] },
  { label: "중학교", levels: ["MIDDLE_1", "MIDDLE_2", "MIDDLE_3"] as GradeLevel[] },
  { label: "고등학교", levels: ["HIGH_1", "HIGH_2", "HIGH_3"] as GradeLevel[] },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("role");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Form data
  const [role, setRole] = useState<UserRole | "">("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gradeLevel, setGradeLevel] = useState<GradeLevel | "">("");
  const [parentConsent, setParentConsent] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const isMinor = role === "STUDENT" && gradeLevel && (
    gradeLevel.startsWith("ELEMENTARY") || gradeLevel.startsWith("MIDDLE")
  );

  const handleNext = () => {
    setError("");
    
    if (step === "role" && !role) {
      setError("역할을 선택해주세요.");
      return;
    }
    
    if (step === "info") {
      if (!name || !email || !password || !confirmPassword) {
        setError("모든 필드를 입력해주세요.");
        return;
      }
      if (password !== confirmPassword) {
        setError("비밀번호가 일치하지 않습니다.");
        return;
      }
      if (password.length < 8) {
        setError("비밀번호는 8자 이상이어야 합니다.");
        return;
      }
    }
    
    if (step === "grade" && role === "STUDENT" && !gradeLevel) {
      setError("학년을 선택해주세요.");
      return;
    }

    const steps: Step[] = ["role", "info"];
    if (role === "STUDENT") steps.push("grade");
    if (isMinor || role === "TEACHER" || role === "PARENT") steps.push("consent");
    
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    const steps: Step[] = ["role", "info"];
    if (role === "STUDENT") steps.push("grade");
    if (isMinor || role === "TEACHER" || role === "PARENT") steps.push("consent");
    
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const handleSubmit = async () => {
    if (!termsAccepted) {
      setError("이용약관에 동의해주세요.");
      return;
    }
    
    if (isMinor && !parentConsent) {
      setError("보호자 동의가 필요합니다.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          gradeLevel: role === "STUDENT" ? gradeLevel : null,
          parentConsent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "회원가입에 실패했습니다.");
      }

      router.push("/login?registered=true");
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원가입 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-purple-500/5 p-4 py-12">
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
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">회원가입</CardTitle>
            <CardDescription>
              {step === "role" && "어떤 역할로 가입하시나요?"}
              {step === "info" && "기본 정보를 입력해주세요"}
              {step === "grade" && "학년을 선택해주세요"}
              {step === "consent" && "약관에 동의해주세요"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Step 1: Role Selection */}
            {step === "role" && (
              <div className="space-y-3">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value as UserRole)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      role === r.value
                        ? "border-primary bg-primary/5"
                        : "border-transparent bg-muted/50 hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{r.icon}</span>
                      <div>
                        <p className="font-semibold">{r.label}</p>
                        <p className="text-sm text-muted-foreground">{r.description}</p>
                      </div>
                      {role === r.value && (
                        <Check className="w-5 h-5 text-primary ml-auto" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: Basic Info */}
            {step === "info" && (
              <div className="space-y-4">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="이름"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-11"
                    required
                  />
                </div>
                
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="이메일"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11"
                    required
                  />
                </div>
                
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="비밀번호 (8자 이상)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11"
                    required
                  />
                </div>
                
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="비밀번호 확인"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-11"
                    required
                  />
                </div>
              </div>
            )}

            {/* Step 3: Grade Selection */}
            {step === "grade" && (
              <div className="space-y-4">
                {gradeLevelGroups.map((group) => (
                  <div key={group.label}>
                    <p className="text-sm font-medium text-muted-foreground mb-2">{group.label}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {group.levels.map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setGradeLevel(level)}
                          className={`p-3 rounded-lg text-sm font-medium transition-all ${
                            gradeLevel === level
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-muted/80"
                          }`}
                        >
                          {gradeLevelShortNames[level]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                
                {gradeLevel && (
                  <p className="text-sm text-center text-muted-foreground">
                    선택: {gradeLevelNames[gradeLevel]}
                  </p>
                )}
              </div>
            )}

            {/* Step 4: Consent */}
            {step === "consent" && (
              <div className="space-y-4">
                <label className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 rounded"
                  />
                  <div className="text-sm">
                    <span className="font-medium">이용약관 및 개인정보처리방침 동의</span>
                    <p className="text-muted-foreground mt-1">
                      서비스 이용을 위해 약관에 동의해주세요.
                    </p>
                  </div>
                </label>

                {isMinor && (
                  <label className="flex items-start gap-3 p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={parentConsent}
                      onChange={(e) => setParentConsent(e.target.checked)}
                      className="mt-0.5 rounded"
                    />
                    <div className="text-sm">
                      <span className="font-medium text-orange-700 dark:text-orange-400">보호자 동의 (만 14세 미만 필수)</span>
                      <p className="text-orange-600/80 dark:text-orange-400/80 mt-1">
                        보호자의 동의를 받았음을 확인합니다. 동의 없이 진행할 경우 법적 책임이 발생할 수 있습니다.
                      </p>
                    </div>
                  </label>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex-col gap-4">
            <div className="flex gap-3 w-full">
              {step !== "role" && (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={handleBack}
                  className="flex-1"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  이전
                </Button>
              )}
              <Button
                type="button"
                size="lg"
                onClick={handleNext}
                className="flex-1"
                isLoading={isLoading}
              >
                {step === "consent" ? "가입하기" : "다음"}
                {step !== "consent" && <ChevronRight className="w-4 h-4 ml-1" />}
              </Button>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              이미 계정이 있으신가요?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                로그인
              </Link>
            </p>
          </CardFooter>
        </Card>

        {/* Step indicator */}
        <div className="flex justify-center gap-2 mt-6">
          {["role", "info", role === "STUDENT" ? "grade" : null, "consent"].filter(Boolean).map((s, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                s === step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
