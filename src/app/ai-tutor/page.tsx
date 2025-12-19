"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { 
  MessageCircle, 
  Send, 
  Sparkles,
  User,
  Bot,
  BookOpen,
  Lightbulb,
  HelpCircle,
  Calculator,
  Mic,
  Paperclip
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Input, Button } from "@/components/ui";
import Header from "@/components/layout/Header";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const quickActions = [
  { icon: BookOpen, label: "개념 설명", prompt: "다음 개념에 대해 쉽게 설명해줘: " },
  { icon: Calculator, label: "문제 풀이", prompt: "이 문제를 풀어줘: " },
  { icon: Lightbulb, label: "힌트 요청", prompt: "이 문제에 대한 힌트를 줘: " },
  { icon: HelpCircle, label: "질문하기", prompt: "" },
];

const sampleResponses = [
  "안녕하세요! 궁금한 점이 있으면 언제든 물어보세요. 개념 설명, 문제 풀이, 학습 팁 등 다양한 질문에 답변해드릴게요!",
  "좋은 질문이에요! 분수는 전체를 똑같이 나눈 것 중 일부를 나타내는 방법이에요. 예를 들어 피자 한 판을 4등분하면, 한 조각은 1/4이 되는 거죠!",
  "수학 문제를 풀 때는 먼저 문제가 무엇을 묻고 있는지 정확히 파악하는 게 중요해요. 그 다음 알고 있는 공식이나 개념을 적용해보세요!",
];

export default function AITutorPage() {
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login");
    },
  });

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "안녕하세요! 저는 JaLearn AI 튜터예요. 🎓\n\n궁금한 개념이나 풀어야 할 문제가 있다면 언제든 물어보세요! 수학, 영어, 과학 등 모든 과목에 대해 도움을 드릴 수 있어요.",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: sampleResponses[Math.floor(Math.random() * sampleResponses.length)],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleQuickAction = (prompt: string) => {
    if (prompt) {
      setInputValue(prompt);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container-main py-6 flex flex-col max-h-[calc(100vh-4rem)]">
        <div className="flex-1 grid lg:grid-cols-4 gap-6 min-h-0">
          {/* Sidebar - Quick Actions */}
          <aside className="hidden lg:block space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  빠른 질문
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action.prompt)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg text-left hover:bg-muted transition-colors"
                  >
                    <action.icon className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm font-medium">{action.label}</span>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">오늘의 팁 💡</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  질문할 때 구체적인 내용을 포함하면 더 정확한 답변을 받을 수 있어요!
                </p>
              </CardContent>
            </Card>
          </aside>

          {/* Chat Area */}
          <div className="lg:col-span-3 flex flex-col min-h-0">
            <Card className="flex-1 flex flex-col min-h-0">
              {/* Chat Header */}
              <CardHeader className="border-b flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">AI 튜터</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {isTyping ? "입력 중..." : "온라인"}
                    </p>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === "user"
                        ? "bg-primary"
                        : "bg-gradient-to-br from-indigo-500 to-purple-600"
                    }`}>
                      {message.role === "user" 
                        ? <User className="w-4 h-4 text-primary-foreground" />
                        : <Bot className="w-4 h-4 text-white" />
                      }
                    </div>
                    <div className={`max-w-[80%] p-3 rounded-2xl ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-md"
                        : "bg-muted rounded-tl-md"
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}>
                        {message.timestamp.toLocaleTimeString("ko-KR", { 
                          hour: "2-digit", 
                          minute: "2-digit" 
                        })}
                      </p>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-muted p-3 rounded-2xl rounded-tl-md">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Input Area */}
              <div className="border-t p-4 flex-shrink-0">
                {/* Mobile Quick Actions */}
                <div className="flex gap-2 mb-3 overflow-x-auto pb-2 lg:hidden">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action.prompt)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-sm whitespace-nowrap"
                    >
                      <action.icon className="w-4 h-4" />
                      {action.label}
                    </button>
                  ))}
                </div>

                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="flex gap-2"
                >
                  <div className="flex-1 flex gap-2 items-center bg-muted rounded-xl px-3">
                    <button type="button" className="p-1 hover:bg-background rounded-lg transition-colors">
                      <Paperclip className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="질문을 입력하세요..."
                      className="flex-1 py-3 bg-transparent outline-none text-sm"
                    />
                    <button type="button" className="p-1 hover:bg-background rounded-lg transition-colors">
                      <Mic className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </div>
                  <Button 
                    type="submit" 
                    size="icon"
                    disabled={!inputValue.trim() || isTyping}
                    className="rounded-xl h-12 w-12"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </form>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
