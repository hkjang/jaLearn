"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  UserCheck, 
  Calendar,
  Clock,
  Video,
  Phone,
  MessageSquare,
  Star,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Brain
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import Header from "@/components/layout/Header";

// Mock experts
const mockExperts = [
  {
    id: "1",
    name: "김영희 선생님",
    title: "수학 전문 컨설턴트",
    specialty: ["수학", "수능 전략"],
    rating: 4.9,
    reviews: 234,
    experience: "15년",
    image: null,
    available: true,
  },
  {
    id: "2",
    name: "이철수 선생님",
    title: "입시 전문 상담사",
    specialty: ["입시 전략", "대학 컨설팅"],
    rating: 4.8,
    reviews: 189,
    experience: "20년",
    image: null,
    available: true,
  },
  {
    id: "3",
    name: "박민정 선생님",
    title: "국어/영어 전문가",
    specialty: ["국어", "영어", "논술"],
    rating: 4.7,
    reviews: 156,
    experience: "12년",
    image: null,
    available: false,
  },
];

// Mock upcoming consultations
const mockUpcoming = [
  {
    id: "1",
    expertName: "김영희 선생님",
    type: "MONTHLY",
    date: "2024-01-20",
    time: "14:00",
    topic: "미적분 학습 전략 상담",
    status: "SCHEDULED",
  },
];

// Mock past consultations
const mockPast = [
  {
    id: "2",
    expertName: "이철수 선생님",
    type: "AI_REVIEW",
    date: "2024-01-05",
    duration: 30,
    topic: "AI 튜터 학습 결과 검토",
    aiSummary: "수학 미적분 영역에서 기초 개념 이해가 부족합니다. 다음 2주간 기초 문제 풀이에 집중하고, AI 튜터와 함께 개념 복습을 권장합니다.",
    rating: 5,
  },
];

// Available time slots
const mockTimeSlots = [
  { date: "2024-01-22", slots: ["10:00", "14:00", "16:00"] },
  { date: "2024-01-23", slots: ["11:00", "15:00"] },
  { date: "2024-01-24", slots: ["10:00", "13:00", "17:00"] },
];

export default function ConsultationPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login");
    },
  });

  const [showBooking, setShowBooking] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<typeof mockExperts[0] | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const handleBookExpert = (expert: typeof mockExperts[0]) => {
    setSelectedExpert(expert);
    setShowBooking(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container-main py-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <UserCheck className="w-6 h-6" />
              전문가 상담
            </h1>
            <p className="text-muted-foreground">
              AI 튜터와 함께 인간 전문가의 컨설팅을 받으세요
            </p>
          </div>
        </div>

        {/* Consultation Types */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">월간 컨설팅</h3>
                  <p className="text-xs text-muted-foreground">Elite 플랜 포함</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                매월 1회 전문가와 1:1 상담으로 학습 방향 점검
              </p>
              <Button variant="outline" size="sm" className="w-full">
                예약하기
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">AI 학습 검토</h3>
                  <p className="text-xs text-muted-foreground">₩30,000/회</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                AI 튜터 학습 결과를 전문가가 검토하고 피드백
              </p>
              <Button variant="outline" size="sm" className="w-full">
                신청하기
              </Button>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold">긴급 개입</h3>
                  <p className="text-xs text-muted-foreground">₩50,000/회</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                성적 급락 시 즉각적인 전문가 개입 및 처방
              </p>
              <Button variant="outline" size="sm" className="w-full border-orange-300 text-orange-700 hover:bg-orange-50">
                긴급 상담
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Consultations */}
        {mockUpcoming.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                예정된 상담
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mockUpcoming.map((consultation) => (
                <div key={consultation.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold">
                      {consultation.expertName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{consultation.expertName}</p>
                      <p className="text-sm text-muted-foreground">{consultation.topic}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Clock className="w-3 h-3" />
                        {consultation.date} {consultation.time}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Video className="w-4 h-4 mr-1" />
                      입장
                    </Button>
                    <Button variant="ghost" size="sm">
                      변경
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Expert List */}
        <Card>
          <CardHeader>
            <CardTitle>전문가 목록</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockExperts.map((expert) => (
                <div
                  key={expert.id}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    expert.available 
                      ? "border-transparent hover:border-primary/20 cursor-pointer" 
                      : "opacity-60"
                  }`}
                  onClick={() => expert.available && handleBookExpert(expert)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/80 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                      {expert.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold">{expert.name}</p>
                      <p className="text-xs text-muted-foreground">{expert.title}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {expert.specialty.map((s) => (
                      <span key={s} className="px-2 py-0.5 bg-muted text-xs rounded">
                        {s}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{expert.rating}</span>
                      <span className="text-muted-foreground">({expert.reviews})</span>
                    </div>
                    <span className="text-muted-foreground">{expert.experience} 경력</span>
                  </div>
                  
                  {!expert.available && (
                    <p className="text-xs text-orange-600 mt-2">현재 예약 마감</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Past Consultations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              지난 상담
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mockPast.map((consultation) => (
              <div key={consultation.id} className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium">{consultation.expertName}</p>
                    <p className="text-sm text-muted-foreground">{consultation.topic}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{consultation.date}</p>
                    <div className="flex items-center gap-1">
                      {[...Array(consultation.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </div>
                
                {consultation.aiSummary && (
                  <div className="p-3 bg-background rounded-lg border">
                    <p className="text-xs font-medium text-muted-foreground mb-1">AI 요약</p>
                    <p className="text-sm">{consultation.aiSummary}</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Booking Modal */}
        {showBooking && selectedExpert && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>상담 예약</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold">
                    {selectedExpert.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{selectedExpert.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedExpert.title}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">날짜 선택</p>
                  <div className="grid grid-cols-3 gap-2">
                    {mockTimeSlots.map((slot) => (
                      <button
                        key={slot.date}
                        onClick={() => setSelectedDate(slot.date)}
                        className={`p-2 rounded-lg text-sm ${
                          selectedDate === slot.date
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80"
                        }`}
                      >
                        {slot.date.split("-").slice(1).join("/")}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedDate && (
                  <div>
                    <p className="text-sm font-medium mb-2">시간 선택</p>
                    <div className="flex flex-wrap gap-2">
                      {mockTimeSlots.find((s) => s.date === selectedDate)?.slots.map((time) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`px-3 py-1.5 rounded-lg text-sm ${
                            selectedTime === time
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-muted/80"
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowBooking(false);
                      setSelectedExpert(null);
                      setSelectedDate("");
                      setSelectedTime("");
                    }}
                  >
                    취소
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={!selectedDate || !selectedTime}
                  >
                    예약 확정
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
