/**
 * 📋 타입 정의 파일
 * 
 * 앱 전체에서 사용되는 TypeScript 타입과 인터페이스를 정의합니다.
 * API 명세와 일치하도록 작성되었습니다.
 * 
 * 📝 수정 가이드:
 * - 새 타입 추가: 이 파일에 인터페이스 추가 후 export
 * - API 변경 시: 해당 인터페이스의 필드명과 타입 수정
 * - 중첩 타입: 별도 인터페이스로 분리하여 재사용
 * 
 * 📦 타입 카테고리:
 * - User: 사용자 및 인증 관련
 * - InBodyData: Samsung Health 연동 신체 데이터
 * - ManualInputData: 직접 입력 신체 데이터
 * - AverageData: 평균 비교 데이터
 * - Mission: AI 미션/챌린지
 * - Character: 게임 캐릭터
 * - Medal, Achievement: 게임 보상
 * - WearableDevice, WearableSyncData: 웨어러블 기기
 * - AppState: 앱 상태 (deprecated - useAppStore 사용)
 */

// User and Authentication Types
export interface User {
  id: string;
  username: string;  // API 명세에 맞게 email -> username
  nickname: string;  // API 명세에 맞게 name -> nickname
  birthDate?: string; // 생년월일 (YYYY-MM-DD)
  profileImage?: string;
  createdAt: Date;
}

// InBody Data Types (API 명세와 일치)
export interface InBodyData {
  id: string;
  userId: string;
  syncedAt: Date;
  // API 요청 필드
  name: string;
  age: number;
  gender: 'male' | 'female';
  height: number; // cm
  weight: number; // kg
  body_fat: number; // 체지방률 (%)
  muscle_mass: number; // 근육량 (kg)
  goal: string; // 목표
  // API 응답 필드 (계산된 값)
  bmi: number;
  bmr: number; // 기초대사량 (kcal)
  status_message?: string | null;
}

// Average Data for comparison
export interface AverageData {
  ageGroup: string;
  gender: 'male' | 'female';
  height: { min: number; max: number; avg: number };
  weight: { min: number; max: number; avg: number };
  bmi: { min: number; max: number; avg: number };
  body_fat: { min: number; max: number; avg: number };
  muscle_mass: { min: number; max: number; avg: number };
}

// Manual Input Data (API 명세와 일치)
export interface ManualInputData {
  name: string;
  age: number;
  gender: 'male' | 'female';
  height: number;
  weight: number;
  body_fat: number;
  muscle_mass: number;
  goal: string;
}

// Mission/Challenge Types (API 명세와 일치)
export interface Mission {
  id: number; // API에서 number 사용
  title: string;
  description: string;
  type: 'exercise' | 'nutrition' | 'lifestyle';
  difficulty: 'easy' | 'medium' | 'hard';
  xp_reward: number; // API 명세에 맞게 xpReward -> xp_reward
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  created_at: string; // API 명세에 맞게 ISO 문자열
  expires_at: string;
}

// Character/Game Types
export interface Character {
  id: string;
  userId: string;
  name: string;
  level: number;
  currentXp: number;
  requiredXp: number;
  avatarUrl: string;
  medals: Medal[];
  achievements: Achievement[];
}

export interface Medal {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  earnedAt: Date;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  progress: number;
  maxProgress: number;
  completed: boolean;
}

// App State Types
export interface AppState {
  isLoggedIn: boolean;
  hasCompletedOnboarding: boolean;
  hasInBodyData: boolean;
  hasMissionsGenerated: boolean;
  permissions: {
    gps: boolean;
    notifications: boolean;
  };
}

// Wearable Device Types (API 명세와 일치)
export interface WearableDevice {
  device_type: 'apple_health' | 'samsung_health' | 'google_fit';
  connected: boolean;
  lastSyncAt?: Date;
}

// Wearable Sync Data (API 명세와 일치)
export interface WearableSyncData {
  steps: number;
  calories: number | null;
  heart_rate: number | null;
  sleep_minutes: number | null;
  device_type: string;
}
