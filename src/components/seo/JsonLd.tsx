/**
 * JSON-LD Structured Data Component
 * 구조화 데이터 주입 컴포넌트
 */

interface JsonLdProps {
  data: object | object[];
}

/**
 * JSON-LD 스크립트 컴포넌트
 * Schema.org 구조화 데이터를 페이지에 주입합니다.
 */
export function JsonLd({ data }: JsonLdProps) {
  // 배열인 경우 여러 개의 스크립트 태그 생성
  if (Array.isArray(data)) {
    return (
      <>
        {data.map((item, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
          />
        ))}
      </>
    );
  }
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * 웹사이트 기본 스키마 컴포넌트
 */
export function WebSiteJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'JaLearn',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://jalearn.co.kr',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://jalearn.co.kr'}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
  
  return <JsonLd data={schema} />;
}

/**
 * 조직 스키마 컴포넌트
 */
export function OrganizationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'JaLearn',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://jalearn.co.kr',
    logo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://jalearn.co.kr'}/logo.png`,
    description: '초중고 학생을 위한 맞춤형 AI 학습 플랫폼',
    areaServed: {
      '@type': 'Country',
      name: 'Korea',
    },
  };
  
  return <JsonLd data={schema} />;
}
