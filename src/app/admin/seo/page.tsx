/**
 * SEO Admin Dashboard
 * SEO 관리 대시보드
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  Search,
  FileText,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from 'lucide-react';

interface SEOMetrics {
  overview: {
    totalProblems: number;
    approvedProblems: number;
    indexRate: number;
    sitemapEntries: number;
    totalImpressions: number;
    totalClicks: number;
    avgCTR: number;
  };
  problemsByGrade: { gradeLevel: string; count: number }[];
  problemsBySubject: { subjectId: string; subjectName: string; count: number }[];
  recentlyAdded: {
    id: string;
    title: string | null;
    subject: string;
    unit: string | null;
    createdAt: string;
  }[];
  topKeywords: {
    keyword: string;
    path: string;
    position: number | null;
    impressions: number;
    clicks: number;
  }[];
  period: string;
}

export default function SEODashboardPage() {
  const [metrics, setMetrics] = useState<SEOMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');
  
  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/seo/metrics?period=${period}`);
      const data = await res.json();
      if (data.success) {
        setMetrics(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch SEO metrics:', error);
    }
    setLoading(false);
  };
  
  useEffect(() => {
    fetchMetrics();
  }, [period]);
  
  const gradeLabels: Record<string, string> = {
    ELEMENTARY_1: '초1', ELEMENTARY_2: '초2', ELEMENTARY_3: '초3',
    ELEMENTARY_4: '초4', ELEMENTARY_5: '초5', ELEMENTARY_6: '초6',
    MIDDLE_1: '중1', MIDDLE_2: '중2', MIDDLE_3: '중3',
    HIGH_1: '고1', HIGH_2: '고2', HIGH_3: '고3',
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">SEO 대시보드</h1>
            <p className="text-gray-500 mt-1">검색 엔진 최적화 현황을 확인하세요</p>
          </div>
          
          <div className="flex items-center gap-4">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 border rounded-lg bg-white"
            >
              <option value="7d">최근 7일</option>
              <option value="30d">최근 30일</option>
              <option value="90d">최근 90일</option>
            </select>
            
            <button
              onClick={fetchMetrics}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              새로고침
            </button>
          </div>
        </div>
        
        {loading && !metrics ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : metrics && (
          <>
            {/* KPI 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* 색인률 */}
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Globe className="w-6 h-6 text-green-600" />
                  </div>
                  <span className={`flex items-center text-sm ${
                    metrics.overview.indexRate >= 95 ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {metrics.overview.indexRate >= 95 ? (
                      <><ArrowUpRight className="w-4 h-4" /> 목표 달성</>
                    ) : (
                      <><ArrowDownRight className="w-4 h-4" /> 목표 미달</>
                    )}
                  </span>
                </div>
                <p className="text-3xl font-bold mt-4">{metrics.overview.indexRate}%</p>
                <p className="text-gray-500 text-sm">색인률 (목표: 95%)</p>
                <p className="text-xs text-gray-400 mt-1">
                  {metrics.overview.approvedProblems.toLocaleString()} / {metrics.overview.totalProblems.toLocaleString()} 문제
                </p>
              </div>
              
              {/* CTR */}
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className={`flex items-center text-sm ${
                    metrics.overview.avgCTR >= 5 ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {metrics.overview.avgCTR >= 5 ? (
                      <><ArrowUpRight className="w-4 h-4" /> 목표 달성</>
                    ) : (
                      <><ArrowDownRight className="w-4 h-4" /> 목표 미달</>
                    )}
                  </span>
                </div>
                <p className="text-3xl font-bold mt-4">{metrics.overview.avgCTR}%</p>
                <p className="text-gray-500 text-sm">평균 CTR (목표: 5%)</p>
              </div>
              
              {/* 노출수 */}
              <div className="bg-white rounded-xl shadow p-6">
                <div className="p-3 bg-purple-100 rounded-lg w-fit">
                  <Search className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-3xl font-bold mt-4">
                  {metrics.overview.totalImpressions.toLocaleString()}
                </p>
                <p className="text-gray-500 text-sm">총 노출수</p>
              </div>
              
              {/* 클릭수 */}
              <div className="bg-white rounded-xl shadow p-6">
                <div className="p-3 bg-orange-100 rounded-lg w-fit">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                </div>
                <p className="text-3xl font-bold mt-4">
                  {metrics.overview.totalClicks.toLocaleString()}
                </p>
                <p className="text-gray-500 text-sm">총 클릭수</p>
              </div>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-8">
              {/* 학년별 문제 분포 */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">학년별 문제 분포</h2>
                <div className="space-y-3">
                  {metrics.problemsByGrade
                    .sort((a, b) => {
                      const order = Object.keys(gradeLabels);
                      return order.indexOf(a.gradeLevel) - order.indexOf(b.gradeLevel);
                    })
                    .map((item) => {
                      const maxCount = Math.max(...metrics.problemsByGrade.map(g => g.count));
                      const percentage = (item.count / maxCount) * 100;
                      
                      return (
                        <div key={item.gradeLevel} className="flex items-center gap-4">
                          <span className="w-12 text-sm text-gray-600">
                            {gradeLabels[item.gradeLevel] || item.gradeLevel}
                          </span>
                          <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="w-16 text-right text-sm font-medium">
                            {item.count.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
              
              {/* 과목별 문제 분포 */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">과목별 문제 분포</h2>
                <div className="space-y-3">
                  {metrics.problemsBySubject
                    .sort((a, b) => b.count - a.count)
                    .map((item) => {
                      const maxCount = Math.max(...metrics.problemsBySubject.map(s => s.count));
                      const percentage = (item.count / maxCount) * 100;
                      
                      return (
                        <div key={item.subjectId} className="flex items-center gap-4">
                          <span className="w-16 text-sm text-gray-600 truncate">
                            {item.subjectName}
                          </span>
                          <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="w-16 text-right text-sm font-medium">
                            {item.count.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
              
              {/* 최근 추가된 문제 */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  최근 추가된 문제
                </h2>
                <div className="space-y-3">
                  {metrics.recentlyAdded.map((problem) => (
                    <Link
                      key={problem.id}
                      href={`/admin/problems/${problem.id}`}
                      className="block p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <p className="font-medium text-gray-900 truncate">
                        {problem.title || '제목 없음'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {problem.subject} • {problem.unit || '일반'}
                      </p>
                    </Link>
                  ))}
                  
                  {metrics.recentlyAdded.length === 0 && (
                    <p className="text-center text-gray-500 py-4">
                      최근 추가된 문제가 없습니다.
                    </p>
                  )}
                </div>
              </div>
              
              {/* 인기 키워드 */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  인기 검색 키워드
                </h2>
                <div className="space-y-3">
                  {metrics.topKeywords.length > 0 ? (
                    metrics.topKeywords.map((kw, index) => (
                      <div key={`${kw.keyword}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{kw.keyword}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">
                            {kw.path}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-blue-600">{kw.clicks} 클릭</p>
                          {kw.position && (
                            <p className="text-xs text-gray-500">순위: {kw.position.toFixed(1)}</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-4">
                      키워드 데이터가 없습니다.
                      <br />
                      <span className="text-xs">Google Search Console 연동이 필요합니다.</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* SEO 점검 항목 */}
            <div className="mt-8 bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">SEO 점검 현황</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    Sitemap
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    {metrics.overview.sitemapEntries.toLocaleString()}개 URL 등록
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    robots.txt
                  </div>
                  <p className="text-sm text-green-600 mt-1">정상 설정됨</p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    구조화 데이터
                  </div>
                  <p className="text-sm text-green-600 mt-1">Quiz, QAPage 스키마 적용</p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    메타 태그
                  </div>
                  <p className="text-sm text-green-600 mt-1">동적 생성 활성화</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
