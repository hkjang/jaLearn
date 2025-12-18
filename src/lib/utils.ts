import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// User roles
export type UserRole = "STUDENT" | "TEACHER" | "PARENT" | "ADMIN";

// Grade levels
export type GradeLevel = 
  | "ELEMENTARY_1" | "ELEMENTARY_2" | "ELEMENTARY_3" 
  | "ELEMENTARY_4" | "ELEMENTARY_5" | "ELEMENTARY_6"
  | "MIDDLE_1" | "MIDDLE_2" | "MIDDLE_3"
  | "HIGH_1" | "HIGH_2" | "HIGH_3";

// Grade level display names in Korean
export const gradeLevelNames: Record<GradeLevel, string> = {
  ELEMENTARY_1: "초등학교 1학년",
  ELEMENTARY_2: "초등학교 2학년",
  ELEMENTARY_3: "초등학교 3학년",
  ELEMENTARY_4: "초등학교 4학년",
  ELEMENTARY_5: "초등학교 5학년",
  ELEMENTARY_6: "초등학교 6학년",
  MIDDLE_1: "중학교 1학년",
  MIDDLE_2: "중학교 2학년",
  MIDDLE_3: "중학교 3학년",
  HIGH_1: "고등학교 1학년",
  HIGH_2: "고등학교 2학년",
  HIGH_3: "고등학교 3학년",
};

// Grade level short names
export const gradeLevelShortNames: Record<GradeLevel, string> = {
  ELEMENTARY_1: "초1",
  ELEMENTARY_2: "초2",
  ELEMENTARY_3: "초3",
  ELEMENTARY_4: "초4",
  ELEMENTARY_5: "초5",
  ELEMENTARY_6: "초6",
  MIDDLE_1: "중1",
  MIDDLE_2: "중2",
  MIDDLE_3: "중3",
  HIGH_1: "고1",
  HIGH_2: "고2",
  HIGH_3: "고3",
};

// All grade levels
export const gradeLevels: GradeLevel[] = [
  "ELEMENTARY_1", "ELEMENTARY_2", "ELEMENTARY_3", 
  "ELEMENTARY_4", "ELEMENTARY_5", "ELEMENTARY_6",
  "MIDDLE_1", "MIDDLE_2", "MIDDLE_3",
  "HIGH_1", "HIGH_2", "HIGH_3"
];

// All user roles
export const userRoles: UserRole[] = ["STUDENT", "TEACHER", "PARENT", "ADMIN"];

// Grade level group
export type GradeLevelGroup = "elementary" | "middle" | "high";

export function getGradeLevelGroup(gradeLevel: GradeLevel): GradeLevelGroup {
  if (gradeLevel.startsWith("ELEMENTARY")) return "elementary";
  if (gradeLevel.startsWith("MIDDLE")) return "middle";
  return "high";
}

// Theme colors by grade level group
export const gradeThemes = {
  elementary: {
    primary: "#FFB74D",
    secondary: "#FFE0B2",
    accent: "#FF9800",
    text: "#E65100",
    gradient: "from-orange-400 to-amber-500",
  },
  middle: {
    primary: "#81C784",
    secondary: "#C8E6C9",
    accent: "#4CAF50",
    text: "#1B5E20",
    gradient: "from-green-400 to-emerald-500",
  },
  high: {
    primary: "#7986CB",
    secondary: "#C5CAE9",
    accent: "#3F51B5",
    text: "#1A237E",
    gradient: "from-indigo-400 to-purple-500",
  },
};

// Format duration in seconds to readable string
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  } else if (minutes > 0) {
    return `${minutes}분 ${secs}초`;
  }
  return `${secs}초`;
}

// Format date to Korean style
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Format relative time
export function formatRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return formatDate(date);
  } else if (days > 0) {
    return `${days}일 전`;
  } else if (hours > 0) {
    return `${hours}시간 전`;
  } else if (minutes > 0) {
    return `${minutes}분 전`;
  }
  return "방금 전";
}

// Calculate progress percentage
export function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

// Subject display info
export const subjectInfo = {
  korean: { name: "국어", icon: "book-open", color: "#EF4444" },
  math: { name: "수학", icon: "calculator", color: "#3B82F6" },
  english: { name: "영어", icon: "languages", color: "#10B981" },
  science: { name: "과학", icon: "flask-conical", color: "#8B5CF6" },
  social: { name: "사회", icon: "globe", color: "#F59E0B" },
  history: { name: "역사", icon: "landmark", color: "#6B7280" },
} as const;

// Check if grade level is valid
export function isValidGradeLevel(level: string): level is GradeLevel {
  return gradeLevels.includes(level as GradeLevel);
}

// Check if role is valid
export function isValidUserRole(role: string): role is UserRole {
  return userRoles.includes(role as UserRole);
}
