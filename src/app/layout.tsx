import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: {
    default: "JaLearn - 맞춤형 학습 플랫폼",
    template: "%s | JaLearn",
  },
  description: "초중고 학생을 위한 맞춤형 AI 학습 플랫폼. 수준별 강의, 문제 풀이, 학습 분석까지.",
  keywords: ["학습", "교육", "초등학교", "중학교", "고등학교", "AI 학습", "온라인 강의"],
  authors: [{ name: "JaLearn" }],
  creator: "JaLearn",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "JaLearn",
    title: "JaLearn - 맞춤형 학습 플랫폼",
    description: "초중고 학생을 위한 맞춤형 AI 학습 플랫폼",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body className="min-h-screen bg-background antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
