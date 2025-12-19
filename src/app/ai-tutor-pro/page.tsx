"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  Brain, 
  Send,
  Mic,
  Paperclip,
  Clock,
  Zap,
  BookOpen,
  ChevronLeft,
  Settings,
  History,
  Lightbulb,
  Target,
  Timer,
  Pause,
  Play,
  X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Input, Button, Progress } from "@/components/ui";
import Header from "@/components/layout/Header";

interface Message {
  id: string;
  role: "user" | "tutor" | "system";
  content: string;
  contentType: "TEXT" | "LATEX" | "CODE";
  isIntervention?: boolean;
  timestamp: Date;
}

// Mock session data
const mockSession = {
  id: "session-1",
  topic: "수학 - 미적분",
  startTime: new Date(),
  durationMins: 0,
  status: "ACTIVE",
};

// Mock tutor memory
const mockMemory = {
  strengths: ["방정식 풀이", "확률"],
  weaknesses: ["미분", "적분"],
  learningStyle: "VISUAL",
  recentTopics: ["함수의 극한", "미분의 정의"],
};

export default function AITutorProPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login");
    },
  });

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "tutor",
      content: `안녕하세요, ${session?.user?.name || "학생"}님! 저는 당신의 전담 AI 튜터입니다. 💡\n\n지난 학습 기록을 보니 **미분** 부분이 조금 어려우셨던 것 같아요. 오늘은 이 부분을 함께 복습해볼까요?\n\n아니면 다른 주제로 공부하고 싶으시다면 말씀해주세요!`,
      contentType: "TEXT",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Session timer
  useEffect(() => {
    if (!isPaused) {
      const timer = setInterval(() => {
        setSessionTime((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isPaused]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      contentType: "TEXT",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);
    setShowQuickActions(false);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        {
          content: `좋은 질문이에요! 🎯\n\n**미분**은 함수의 순간 변화율을 구하는 것입니다.\n\n예를 들어, $f(x) = x^2$의 미분은:\n$$f'(x) = 2x$$\n\n이해가 되셨나요? 더 자세히 설명해드릴까요?`,
          isIntervention: false,
        },
        {
          content: `잠깐! 🚨 제가 보니 이 부분에서 자주 실수하시더라고요.\n\n**핵심 포인트**: 미분할 때 지수를 앞으로 내리고, 지수는 1을 빼주세요!\n\n다시 한번 풀어보시겠어요?`,
          isIntervention: true,
        },
      ];
      
      const response = responses[Math.floor(Math.random() * responses.length)];
      
      const tutorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "tutor",
        content: response.content,
        contentType: "LATEX",
        isIntervention: response.isIntervention,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, tutorMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickAction = (action: string) => {
    setInputValue(action);
    handleSend();
  };

  const quickActions = [
    { label: "개념 설명해줘", icon: Lightbulb },
    { label: "문제 풀어보자", icon: Target },
    { label: "힌트 줘", icon: Zap },
    { label: "복습하기", icon: History },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* Session Header */}
      <div className="border-b bg-gradient-to-r from-primary/5 to-purple-500/5">
        <div className="container-main py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/ai-tutor" className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold">AI Tutor Pro</h1>
                <p className="text-xs text-muted-foreground">{mockSession.topic}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Timer */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
              <Timer className="w-4 h-4 text-muted-foreground" />
              <span className="font-mono text-sm font-medium">{formatTime(sessionTime)}</span>
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="p-1 hover:bg-background rounded"
              >
                {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
              </button>
            </div>
            
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              설정
            </Button>
            
            <Button variant="destructive" size="sm">
              <X className="w-4 h-4 mr-2" />
              세션 종료
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : message.isIntervention
                      ? "bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-300"
                      : "bg-muted"
                  }`}
                >
                  {message.isIntervention && (
                    <div className="flex items-center gap-1 text-orange-600 text-xs font-medium mb-2">
                      <Zap className="w-3 h-3" />
                      실시간 개입
                    </div>
                  )}
                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                  <div className={`text-xs mt-1 ${
                    message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}>
                    {message.timestamp.toLocaleTimeString("ko-KR", { 
                      hour: "2-digit", 
                      minute: "2-digit" 
                    })}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {showQuickActions && (
            <div className="px-4 pb-2">
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleQuickAction(action.label)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-full text-sm transition-colors"
                  >
                    <action.icon className="w-4 h-4" />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-muted rounded-full">
                <Paperclip className="w-5 h-5 text-muted-foreground" />
              </button>
              <div className="flex-1 relative">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="질문을 입력하세요... (수식: $x^2$)"
                  className="pr-12"
                />
              </div>
              <button className="p-2 hover:bg-muted rounded-full">
                <Mic className="w-5 h-5 text-muted-foreground" />
              </button>
              <Button onClick={handleSend} disabled={!inputValue.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-72 border-l bg-muted/30 p-4 hidden lg:block">
          {/* Learning Memory */}
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="w-4 h-4" />
                학습 메모리
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">강점</p>
                <div className="flex flex-wrap gap-1">
                  {mockMemory.strengths.map((s) => (
                    <span key={s} className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">보완 필요</p>
                <div className="flex flex-wrap gap-1">
                  {mockMemory.weaknesses.map((w) => (
                    <span key={w} className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                      {w}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">학습 스타일</p>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                  {mockMemory.learningStyle === "VISUAL" ? "시각형" : "청각형"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Topics */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <History className="w-4 h-4" />
                최근 학습
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {mockMemory.recentTopics.map((topic, i) => (
                  <li key={i} className="text-sm flex items-center gap-2">
                    <BookOpen className="w-3 h-3 text-muted-foreground" />
                    {topic}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
