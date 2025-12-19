/**
 * Semantic Layout Components
 * 시맨틱 HTML 레이아웃 컴포넌트
 */

import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

/**
 * Article 컴포넌트
 * 독립적인 콘텐츠 블록을 나타냄
 */
export function Article({ children, className = '' }: LayoutProps) {
  return (
    <article className={`article-content ${className}`}>
      {children}
    </article>
  );
}

/**
 * Section 컴포넌트
 * 주제별 콘텐츠 섹션
 */
export function Section({ children, className = '' }: LayoutProps) {
  return (
    <section className={`content-section ${className}`}>
      {children}
    </section>
  );
}

/**
 * Main 컴포넌트
 * 페이지의 주요 콘텐츠 영역
 */
export function Main({ children, className = '' }: LayoutProps) {
  return (
    <main className={`main-content ${className}`} role="main">
      {children}
    </main>
  );
}

/**
 * Aside 컴포넌트
 * 보조 콘텐츠 영역 (사이드바 등)
 */
export function Aside({ children, className = '' }: LayoutProps) {
  return (
    <aside className={`aside-content ${className}`}>
      {children}
    </aside>
  );
}

/**
 * Nav 컴포넌트
 * 네비게이션 영역
 */
interface NavProps extends LayoutProps {
  ariaLabel?: string;
}

export function Nav({ children, className = '', ariaLabel }: NavProps) {
  return (
    <nav className={`nav-content ${className}`} aria-label={ariaLabel}>
      {children}
    </nav>
  );
}

/**
 * Header 컴포넌트
 * 페이지 또는 섹션 헤더
 */
export function Header({ children, className = '' }: LayoutProps) {
  return (
    <header className={`header-content ${className}`}>
      {children}
    </header>
  );
}

/**
 * Footer 컴포넌트
 * 페이지 또는 섹션 푸터
 */
export function Footer({ children, className = '' }: LayoutProps) {
  return (
    <footer className={`footer-content ${className}`}>
      {children}
    </footer>
  );
}

/**
 * Figure 컴포넌트
 * 이미지, 다이어그램 등의 독립적인 콘텐츠
 */
interface FigureProps extends LayoutProps {
  caption?: string;
}

export function Figure({ children, className = '', caption }: FigureProps) {
  return (
    <figure className={`figure-content ${className}`}>
      {children}
      {caption && <figcaption className="text-sm text-gray-500 mt-2">{caption}</figcaption>}
    </figure>
  );
}

/**
 * 문제 상세 페이지 레이아웃
 */
interface ProblemLayoutProps {
  breadcrumb: ReactNode;
  problem: ReactNode;
  options?: ReactNode;
  answer?: ReactNode;
  explanation?: ReactNode;
  relatedProblems?: ReactNode;
  sidebar?: ReactNode;
}

export function ProblemLayout({
  breadcrumb,
  problem,
  options,
  answer,
  explanation,
  relatedProblems,
  sidebar,
}: ProblemLayoutProps) {
  return (
    <Main className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <Nav ariaLabel="Breadcrumb navigation" className="mb-6">
        {breadcrumb}
      </Nav>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* 메인 콘텐츠 */}
        <Article className="flex-1">
          {/* 문제 본문 (H1) */}
          <Section className="mb-8">
            {problem}
          </Section>
          
          {/* 선택지 (H2) */}
          {options && (
            <Section className="mb-6">
              {options}
            </Section>
          )}
          
          {/* 정답 (H2) */}
          {answer && (
            <Section className="mb-6">
              {answer}
            </Section>
          )}
          
          {/* 해설 (H2) */}
          {explanation && (
            <Section className="mb-8">
              {explanation}
            </Section>
          )}
          
          {/* 관련 문제 (H2) */}
          {relatedProblems && (
            <Section className="mt-12 pt-8 border-t">
              {relatedProblems}
            </Section>
          )}
        </Article>
        
        {/* 사이드바 */}
        {sidebar && (
          <Aside className="w-full lg:w-80 flex-shrink-0">
            {sidebar}
          </Aside>
        )}
      </div>
    </Main>
  );
}
