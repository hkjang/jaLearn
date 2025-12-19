"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  GraduationCap, 
  ChevronLeft,
  Upload,
  FileText,
  Check,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Input, Button } from "@/components/ui";
import Header from "@/components/layout/Header";

const subjectOptions = [
  { value: "korean", label: "국어" },
  { value: "math", label: "수학" },
  { value: "english", label: "영어" },
  { value: "science", label: "과학" },
  { value: "social", label: "사회" },
  { value: "history", label: "역사" },
];

const qualificationTypes = [
  { value: "teacher_license", label: "교원 자격증" },
  { value: "degree", label: "관련 학위" },
  { value: "certificate", label: "전문 자격증" },
  { value: "experience", label: "교육 경력" },
];

export default function InstructorApplyPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login");
    },
  });

  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
    specialties: [] as string[],
    qualifications: [] as { type: string; description: string; file?: File }[],
    experience: "",
    portfolio: "",
    agreeToTerms: false,
  });

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Already a teacher
  if (session?.user?.role === "TEACHER") {
    redirect("/instructor/dashboard");
  }

  const handleSpecialtyToggle = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(value)
        ? prev.specialties.filter((s) => s !== value)
        : [...prev.specialties, value],
    }));
  };

  const handleAddQualification = () => {
    setFormData((prev) => ({
      ...prev,
      qualifications: [...prev.qualifications, { type: "", description: "" }],
    }));
  };

  const handleQualificationChange = (index: number, field: string, value: string) => {
    setFormData((prev) => {
      const updated = [...prev.qualifications];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, qualifications: updated };
    });
  };

  const handleSubmit = async () => {
    if (!formData.displayName || formData.specialties.length === 0) {
      setError("필수 항목을 모두 입력해주세요.");
      return;
    }

    if (!formData.agreeToTerms) {
      setError("이용약관에 동의해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/instructor/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "신청 중 오류가 발생했습니다.");
      }

      router.push("/instructor/apply/success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "신청 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container-main py-8">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          홈으로
        </Link>

        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">강사 지원하기</h1>
            <p className="text-muted-foreground">
              JaLearn에서 학생들을 가르치고 수익을 창출하세요
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}>
                  {step > s ? <Check className="w-4 h-4" /> : s}
                </div>
                {s < 3 && <div className={`w-12 h-1 ${step > s ? "bg-primary" : "bg-muted"}`} />}
              </div>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm mb-6">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>기본 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">강사명 *</label>
                  <Input
                    placeholder="학생들에게 보여질 이름"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">자기소개</label>
                  <textarea
                    className="w-full p-3 border rounded-lg resize-none h-24"
                    placeholder="본인의 교육 철학과 강점을 소개해주세요"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">전문 과목 *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {subjectOptions.map((subject) => (
                      <button
                        key={subject.value}
                        type="button"
                        onClick={() => handleSpecialtyToggle(subject.value)}
                        className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                          formData.specialties.includes(subject.value)
                            ? "border-primary bg-primary/5"
                            : "border-transparent bg-muted hover:bg-muted/80"
                        }`}
                      >
                        {subject.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Button className="w-full" onClick={() => setStep(2)}>
                  다음
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Qualifications */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>자격 및 경력</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">교육 경력</label>
                  <textarea
                    className="w-full p-3 border rounded-lg resize-none h-24"
                    placeholder="교육 관련 경력을 간략히 작성해주세요"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">자격 증명</label>
                    <Button variant="outline" size="sm" onClick={handleAddQualification}>
                      추가
                    </Button>
                  </div>
                  
                  {formData.qualifications.length === 0 ? (
                    <div className="text-center py-6 bg-muted/50 rounded-lg">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        자격증, 학위 등을 추가해주세요
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formData.qualifications.map((qual, index) => (
                        <div key={index} className="p-3 bg-muted/50 rounded-lg space-y-2">
                          <select
                            className="w-full p-2 border rounded"
                            value={qual.type}
                            onChange={(e) => handleQualificationChange(index, "type", e.target.value)}
                          >
                            <option value="">자격 유형 선택</option>
                            {qualificationTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                          <Input
                            placeholder="상세 설명 (예: OO대학교 수학교육과 졸업)"
                            value={qual.description}
                            onChange={(e) => handleQualificationChange(index, "description", e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">포트폴리오 URL (선택)</label>
                  <Input
                    placeholder="https://..."
                    value={formData.portfolio}
                    onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                  />
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                    이전
                  </Button>
                  <Button className="flex-1" onClick={() => setStep(3)}>
                    다음
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Terms & Submit */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>약관 동의 및 제출</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                  <h3 className="font-semibold">강사 활동 안내</h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• 콘텐츠 판매 수익의 70%를 지급받습니다.</li>
                    <li>• 월 정산으로 수익금이 지급됩니다.</li>
                    <li>• 모든 콘텐츠는 심사 후 게시됩니다.</li>
                    <li>• 교육 관련 법규를 준수해야 합니다.</li>
                  </ul>
                </div>

                <label className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.agreeToTerms}
                    onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                    className="mt-0.5 rounded"
                  />
                  <div className="text-sm">
                    <span className="font-medium">강사 이용약관 동의 (필수)</span>
                    <p className="text-muted-foreground mt-1">
                      강사 서비스 이용약관, 수익 배분 정책, 콘텐츠 가이드라인에 동의합니다.
                    </p>
                  </div>
                </label>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                    이전
                  </Button>
                  <Button 
                    className="flex-1" 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        제출 중...
                      </>
                    ) : (
                      "신청서 제출"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
