'use client';

import { useState, useEffect } from 'react';
import { BookOpen, User, ChevronRight } from 'lucide-react';
import WordReportDashboard from '@/components/learning/WordReportDashboard';

// ========================================
// Types
// ========================================

interface Child {
  id: string;
  name: string;
  gradeLevel: string;
}

// ========================================
// Parent Word Reports Page
// ========================================

export default function ParentWordReportsPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch children list
  useEffect(() => {
    async function fetchChildren() {
      setIsLoading(true);
      try {
        // API to get parent's children
        const res = await fetch('/api/parent/children');
        if (res.ok) {
          const data = await res.json();
          setChildren(data.children || []);
          if (data.children?.length > 0) {
            setSelectedChildId(data.children[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch children:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchChildren();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8" />
            <h1 className="text-2xl font-bold">단어 학습 리포트</h1>
          </div>
          <p className="text-white/80">
            자녀의 단어 학습 현황을 확인하세요
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {children.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              연결된 자녀가 없습니다
            </h3>
            <p className="text-gray-600 mb-4">
              자녀 계정을 연결하면 학습 현황을 확인할 수 있습니다
            </p>
            <a
              href="/parent/settings"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              자녀 연결하기
              <ChevronRight size={16} />
            </a>
          </div>
        ) : (
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Child Selector (sidebar on large screens) */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="font-medium text-gray-900 mb-3">자녀 선택</h3>
                <div className="space-y-2">
                  {children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => setSelectedChildId(child.id)}
                      className={`
                        w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors
                        ${selectedChildId === child.id 
                          ? 'bg-indigo-50 border-indigo-200 border' 
                          : 'hover:bg-gray-50'}
                      `}
                    >
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center text-white font-medium
                        ${selectedChildId === child.id ? 'bg-indigo-600' : 'bg-gray-400'}
                      `}>
                        {child.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{child.name}</div>
                        <div className="text-sm text-gray-500">{child.gradeLevel}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Links */}
              <div className="mt-4 bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="font-medium text-gray-900 mb-3">바로가기</h3>
                <div className="space-y-2">
                  <a
                    href="/parent/dashboard"
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700"
                  >
                    전체 대시보드
                    <ChevronRight size={16} className="text-gray-400" />
                  </a>
                  <a
                    href="/parent/settings"
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700"
                  >
                    설정
                    <ChevronRight size={16} className="text-gray-400" />
                  </a>
                </div>
              </div>
            </div>

            {/* Report Dashboard */}
            <div className="lg:col-span-3">
              {selectedChildId ? (
                <WordReportDashboard userId={selectedChildId} />
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <p className="text-gray-600">자녀를 선택해주세요</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
