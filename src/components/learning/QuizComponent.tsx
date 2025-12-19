"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, ChevronRight, RotateCcw, Trophy } from "lucide-react";
import { Button, Card, CardContent, Progress } from "@/components/ui";

interface Question {
  id: string;
  type: "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "TRUE_FALSE";
  content: string;
  options?: string[];
  correctAnswer: string;
}

interface QuizResult {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
}

interface QuizComponentProps {
  questions: Question[];
  onComplete?: (results: QuizResult[]) => void;
}

export default function QuizComponent({ questions, onComplete }: QuizComponentProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [results, setResults] = useState<QuizResult[]>([]);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleAnswer = (answer: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Calculate results
      const quizResults = questions.map((q) => ({
        questionId: q.id,
        userAnswer: answers[q.id] || "",
        isCorrect: answers[q.id]?.toLowerCase() === q.correctAnswer.toLowerCase(),
      }));
      setResults(quizResults);
      setShowResult(true);
      onComplete?.(quizResults);
    }
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setAnswers({});
    setShowResult(false);
    setResults([]);
  };

  const correctCount = results.filter((r) => r.isCorrect).length;
  const score = Math.round((correctCount / questions.length) * 100);

  if (showResult) {
    return (
      <div className="space-y-6 animate-slide-up">
        {/* Score Card */}
        <Card className="text-center p-6 bg-gradient-to-br from-primary/5 to-purple-500/5">
          <div className="mb-4">
            <Trophy className={`w-16 h-16 mx-auto ${score >= 80 ? "text-yellow-500" : score >= 60 ? "text-gray-400" : "text-orange-400"}`} />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {score >= 80 ? "훌륭해요! 🎉" : score >= 60 ? "잘했어요! 👍" : "조금 더 연습해봐요! 💪"}
          </h2>
          <p className="text-4xl font-bold text-primary mb-2">{score}점</p>
          <p className="text-muted-foreground">
            {questions.length}문제 중 {correctCount}문제 정답
          </p>
        </Card>

        {/* Question Review */}
        <div className="space-y-4">
          <h3 className="font-semibold">문제 리뷰</h3>
          {questions.map((question, index) => {
            const result = results.find((r) => r.questionId === question.id);
            return (
              <Card key={question.id} className={`${result?.isCorrect ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20" : "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20"}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${result?.isCorrect ? "bg-green-500" : "bg-red-500"}`}>
                      {result?.isCorrect 
                        ? <CheckCircle2 className="w-4 h-4 text-white" />
                        : <XCircle className="w-4 h-4 text-white" />
                      }
                    </div>
                    <div className="flex-1">
                      <p className="font-medium mb-2">
                        {index + 1}. {question.content}
                      </p>
                      <div className="text-sm space-y-1">
                        <p>
                          <span className="text-muted-foreground">내 답변:</span>{" "}
                          <span className={result?.isCorrect ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                            {result?.userAnswer || "(미응답)"}
                          </span>
                        </p>
                        {!result?.isCorrect && (
                          <p>
                            <span className="text-muted-foreground">정답:</span>{" "}
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              {question.correctAnswer}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={handleRetry} variant="outline" className="flex-1">
            <RotateCcw className="w-4 h-4 mr-2" />
            다시 풀기
          </Button>
          <Button className="flex-1">
            다음 강의로
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">문제 {currentIndex + 1} / {questions.length}</span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} />
      </div>

      {/* Question Card */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-6">{currentQuestion.content}</h3>

          {/* Multiple Choice */}
          {currentQuestion.type === "MULTIPLE_CHOICE" && currentQuestion.options && (
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    answers[currentQuestion.id] === option
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-medium ${
                      answers[currentQuestion.id] === option
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground"
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="font-medium">{option}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Short Answer */}
          {currentQuestion.type === "SHORT_ANSWER" && (
            <div>
              <input
                type="text"
                value={answers[currentQuestion.id] || ""}
                onChange={(e) => handleAnswer(e.target.value)}
                placeholder="답을 입력하세요"
                className="w-full p-4 rounded-xl border-2 border-muted focus:border-primary outline-none transition-colors"
              />
            </div>
          )}

          {/* True/False */}
          {currentQuestion.type === "TRUE_FALSE" && (
            <div className="grid grid-cols-2 gap-4">
              {["O", "X"].map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  className={`p-6 rounded-xl border-2 text-center transition-all ${
                    answers[currentQuestion.id] === option
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50"
                  }`}
                >
                  <span className="text-3xl font-bold">{option}</span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="flex-1"
        >
          이전
        </Button>
        <Button
          onClick={handleNext}
          disabled={!answers[currentQuestion.id]}
          className="flex-1"
        >
          {currentIndex === questions.length - 1 ? "제출하기" : "다음"}
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
