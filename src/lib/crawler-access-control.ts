/**
 * Crawler Access Control
 * 역할 기반 접근 제어 유틸리티
 */

export type CrawlerRole = 
  | 'ADMIN'           // 전체 설정 접근
  | 'DATA_MANAGER'    // 소스 설정, OCR
  | 'QUALITY_MANAGER' // 검수, 수정
  | 'OPERATOR';       // 수집 현황, 승인만

export interface CrawlerPermission {
  viewDashboard: boolean;
  viewLogs: boolean;
  viewReview: boolean;
  viewErrors: boolean;
  viewBatch: boolean;
  
  manageSource: boolean;
  manageBatch: boolean;
  runCrawl: boolean;
  
  approveItems: boolean;
  rejectItems: boolean;
  editItems: boolean;
  deleteItems: boolean;
  
  configureOcr: boolean;
  configureSettings: boolean;
}

// 역할별 권한 정의
const rolePermissions: Record<CrawlerRole, CrawlerPermission> = {
  ADMIN: {
    viewDashboard: true,
    viewLogs: true,
    viewReview: true,
    viewErrors: true,
    viewBatch: true,
    manageSource: true,
    manageBatch: true,
    runCrawl: true,
    approveItems: true,
    rejectItems: true,
    editItems: true,
    deleteItems: true,
    configureOcr: true,
    configureSettings: true,
  },
  DATA_MANAGER: {
    viewDashboard: true,
    viewLogs: true,
    viewReview: true,
    viewErrors: true,
    viewBatch: true,
    manageSource: true,
    manageBatch: true,
    runCrawl: true,
    approveItems: false,
    rejectItems: false,
    editItems: true,
    deleteItems: false,
    configureOcr: true,
    configureSettings: false,
  },
  QUALITY_MANAGER: {
    viewDashboard: true,
    viewLogs: false,
    viewReview: true,
    viewErrors: true,
    viewBatch: false,
    manageSource: false,
    manageBatch: false,
    runCrawl: false,
    approveItems: true,
    rejectItems: true,
    editItems: true,
    deleteItems: false,
    configureOcr: false,
    configureSettings: false,
  },
  OPERATOR: {
    viewDashboard: true,
    viewLogs: true,
    viewReview: true,
    viewErrors: false,
    viewBatch: false,
    manageSource: false,
    manageBatch: false,
    runCrawl: false,
    approveItems: true,
    rejectItems: false,
    editItems: false,
    deleteItems: false,
    configureOcr: false,
    configureSettings: false,
  },
};

/**
 * 사용자 역할에서 크롤러 역할 매핑
 */
export function mapUserRoleToCrawlerRole(userRole: string): CrawlerRole {
  switch (userRole) {
    case 'ADMIN':
      return 'ADMIN';
    case 'TEACHER':
      return 'DATA_MANAGER';
    case 'PARENT':
      return 'OPERATOR';
    default:
      return 'OPERATOR';
  }
}

/**
 * 역할에 대한 권한 가져오기
 */
export function getPermissions(role: CrawlerRole): CrawlerPermission {
  return rolePermissions[role] || rolePermissions.OPERATOR;
}

/**
 * 특정 권한 확인
 */
export function hasPermission(
  role: CrawlerRole,
  permission: keyof CrawlerPermission
): boolean {
  return rolePermissions[role]?.[permission] ?? false;
}

/**
 * 접근 가능한 메뉴 목록 반환
 */
export function getAccessibleMenus(role: CrawlerRole): string[] {
  const permissions = getPermissions(role);
  const menus: string[] = [];
  
  if (permissions.viewDashboard) menus.push('/admin/crawler/dashboard');
  if (permissions.manageSource) menus.push('/admin/crawler');
  if (permissions.viewReview) menus.push('/admin/crawler/review');
  if (permissions.viewLogs) menus.push('/admin/crawler/logs');
  if (permissions.viewErrors) menus.push('/admin/crawler/errors');
  if (permissions.viewBatch) menus.push('/admin/crawler/batch');
  
  return menus;
}

/**
 * 네비게이션 아이템 생성
 */
export interface CrawlerNavItem {
  href: string;
  label: string;
  description?: string;
  icon?: string;
}

export function getCrawlerNavItems(role: CrawlerRole): CrawlerNavItem[] {
  const permissions = getPermissions(role);
  const items: CrawlerNavItem[] = [];
  
  if (permissions.viewDashboard) {
    items.push({
      href: '/admin/crawler/dashboard',
      label: '대시보드',
      description: '수집 현황 및 통계',
      icon: 'BarChart3',
    });
  }
  
  if (permissions.manageSource) {
    items.push({
      href: '/admin/crawler',
      label: '소스 관리',
      description: '수집 소스 등록 및 설정',
      icon: 'Globe',
    });
  }
  
  if (permissions.viewReview) {
    items.push({
      href: '/admin/crawler/review',
      label: '검수 대기함',
      description: '수집 항목 검수 및 승인',
      icon: 'Eye',
    });
  }
  
  if (permissions.viewLogs) {
    items.push({
      href: '/admin/crawler/logs',
      label: '수집 로그',
      description: '실시간 수집 로그',
      icon: 'Activity',
    });
  }
  
  if (permissions.viewErrors) {
    items.push({
      href: '/admin/crawler/errors',
      label: '오류 관리',
      description: '오류 확인 및 재처리',
      icon: 'AlertTriangle',
    });
  }
  
  if (permissions.viewBatch) {
    items.push({
      href: '/admin/crawler/batch',
      label: '배치 작업',
      description: '대량 수집 스케줄',
      icon: 'Calendar',
    });
  }
  
  return items;
}
