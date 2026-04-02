// src/types/index.ts

/**
 * 앱 전체 타입 정의
 *
 * 지금 단계는 "프론트 목업을 유지하면서 최신 백엔드 타입도 같이 쓰는 단계"다.
 * 그래서 예전 프론트에서 쓰던 타입도 남겨두고,
 * 새 백엔드 연결용 타입도 함께 export 한다.
 */

// ============================================
// User / Auth
// ============================================

export interface User {
  // 기존 프론트 호환을 위해 string | number 허용
  id: string | number;
  username: string;
  nickname: string;

  // 기존 InBodyPage 호환용
  birthDate?: string; // YYYY-MM-DD
  profileImage?: string;
  createdAt?: Date | string;
}

export interface SignupRequest {
  username: string;
  password: string;
  nickname: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// ============================================
// 기존 프론트 호환용 InBody / ManualInput 타입
// ============================================

export type Gender = 'male' | 'female';

export interface InBodyData {
  id: string | number;
  userId: string | number;
  syncedAt?: Date | string;

  name: string;
  age: number;
  gender: Gender;
  height: number; // cm
  weight: number; // kg
  body_fat: number; // 체지방률 (%)
  muscle_mass: number; // 근육량 (kg)
  goal: string;

  bmi: number;
  bmr: number;
  status_message?: string | null;
}

export interface ManualInputData {
  name: string;
  age: number;
  gender: Gender;
  height: number;
  weight: number;
  body_fat: number;
  muscle_mass: number;
  goal: string;
}

export interface AverageData {
  ageGroup: string;
  gender: Gender;
  height: { min: number; max: number; avg: number };
  weight: { min: number; max: number; avg: number };
  bmi: { min: number; max: number; avg: number };
  body_fat: { min: number; max: number; avg: number };
  muscle_mass: { min: number; max: number; avg: number };
}

// ============================================
// 기존 프론트 호환용 Mission 타입
// appStore / 목업 화면에서 아직 사용 중
// ============================================

export interface Mission {
  id: number;
  title: string;
  description: string;

  // 기존 목업 구조 호환
  type: 'exercise' | 'nutrition' | 'lifestyle';
  difficulty: 'easy' | 'medium' | 'hard';
  xp_reward: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  created_at: string;
  expires_at: string;
}

// ============================================
// 기존 프론트 호환용 게임 타입
// ============================================

export interface Medal {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  earnedAt: Date | string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  progress: number;
  maxProgress: number;
  completed: boolean;
}

export interface Character {
  id: string;
  userId: string | number;
  name: string;
  level: number;
  currentXp: number;
  requiredXp: number;
  avatarUrl: string;
  medals: Medal[];
  achievements: Achievement[];
}

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

// ============================================
// 기존 프론트 호환용 웨어러블 타입
// ============================================

export interface WearableDevice {
  device_type: 'apple_health' | 'samsung_health' | 'google_fit';
  connected: boolean;
  lastSyncAt?: Date | string;
}

export interface WearableSyncData {
  steps: number;
  calories: number | null;
  heart_rate: number | null;
  sleep_minutes: number | null;
  device_type: string;
}

// ============================================
// 최신 백엔드용 Healthcare 타입
// ============================================

export interface InbodyRecord {
  id: number;
  user_id: number;
  name: string;
  age: number;
  gender: Gender | string;
  height: number;
  weight: number;
  target_weight: number | null;
  body_fat: number;
  muscle_mass: number;
  goal: string;
  bmi: number;
  bmr: number;
  source: string | null;
  updated_at: string | null;
}

export interface ActivityRecord {
  id: number;
  user_id: number;
  steps: number;
  calories: number;
  source: string | null;
  recorded_at: string | null;
}

export interface LatestHealthcareResponse {
  inbody: InbodyRecord | null;
  activity: ActivityRecord | null;
}

export interface SyncHealthcareRequest {
  name: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  body_fat: number;
  muscle_mass: number;
  goal: string;
  target_weight?: number | null;
  steps?: number;
  calories?: number;
  heart_rate?: number | null;
  sleep_minutes?: number | null;
  source?: string;
}

export interface SyncHistoryRequest {
  items: Array<{
    date: string;
    weight?: number | null;
    steps?: number;
    calories?: number;
    source?: string;
  }>;
}

export interface CheckUserDataResponse<T = unknown> {
  exists: boolean;
  data: T | null;
  message: string;
}

export interface UnlinkHealthcareResponse {
  ok: boolean;
  message: string;
  deleted: {
    missions: number;
    activities: number;
    inbody: number;
    weight_history: number;
  };
}

// ============================================
// 최신 백엔드용 Game Profile 타입
// ============================================

export interface EquippedAchievement {
  achievement_code: string;
  title: string;
  description: string | null;
}

export interface GameProfile {
  user_id: number;
  level: number;
  current_exp: number;
  total_exp: number;
  coins: number;
  mission_coins: number;
  has_created_character: boolean;
  selected_character_id: string | null;
  selected_background_id: string | null;
  equipped_badge_id: string | null;
  daily_free_regen_remaining: number;
  daily_regen_date: string | null;
  active_missions_count: number;
  owned_character_ids: string[];
  owned_background_ids: string[];
  equipped_achievement: EquippedAchievement | null;
}

export interface GameProfileResponse {
  ok: boolean;
  game_initialized: boolean;
  profile: GameProfile | null;
}

export interface InitializeCharacterRequest {
  character_id: string;
  background_id: string;
}

export interface InitializeCharacterResponse {
  ok: boolean;
  message: string;
  profile: GameProfile;
}

export interface UseMissionCoinResponse {
  ok: boolean;
  message: string;
  mission_coins: number;
  profile: GameProfile;
}

export interface ResetDailyRegenResponse {
  ok: boolean;
  reset_applied: boolean;
  daily_free_regen_remaining: number;
  daily_regen_date: string | null;
  profile: GameProfile;
}

export interface PurchaseCharacterRequest {
  character_id: string;
}

export interface PurchaseBackgroundRequest {
  background_id: string;
}

export interface EquipCharacterRequest {
  character_id: string;
}

export interface EquipBackgroundRequest {
  background_id: string;
}


// ============================================
// 최신 백엔드용 Mission 타입
// ============================================

export type MissionSlotCode = 'A' | 'B' | 'C';

export type MissionType =
  | 'A1_STEP_TARGET'
  | 'A2_ACTIVE_KCAL_TARGET'
  | 'B1_TIMER_STRETCH'
  | 'B2_SLEEP_PREP'
  | 'B3_ROUTINE_CHECK'
  | 'C1_HEALTH_CHECKIN';

export type MissionStatus =
  | 'active'
  | 'in_progress'
  | 'completed'
  | 'refreshed';

export interface MissionBase {
  id: number;
  slot_code: MissionSlotCode | string;
  mission_type: MissionType | string;
  title: string;
  description: string;
  status: MissionStatus | string;
  params: Record<string, any>;
  progress: Record<string, any>;
  reward_exp: number;
  reward_coins: number;

  // 백엔드 부가 필드
  reason?: string | null;
  category?: string | null;
  difficulty?: string | null;
  is_completed?: boolean;
  is_refreshed?: boolean;
  generation_source?: string | null;
  validation_status?: string | null;
  validation_reason?: string | null;
}

export type CurrentMission = MissionBase;

export interface GenerateInitialMissionsRequest {
  force_regenerate?: boolean;
}

export interface GenerateInitialMissionsResponse {
  ok: boolean;
  message: string;
  game_profile: GameProfile;
  missions: CurrentMission[];
}

export interface RefreshSlotRequest {
  slot_code: MissionSlotCode;
  use_mission_coin_if_needed?: boolean;
}

export interface RefreshSlotResponse {
  ok: boolean;
  message: string;
  slot_code: MissionSlotCode;
  cost_type?: 'free_regen' | 'mission_coin';
  daily_free_regen_remaining: number;
  mission_coins: number;
  previous_mission_id?: number;
  mission?: CurrentMission;
  error_code?: 'MISSION_COIN_REQUIRED';
}

export interface CompleteSlotRequest {
  slot_code: MissionSlotCode;
  client_payload?: Record<string, any>;
}

export interface MissionEvaluationResult {
  success: boolean;
  progress: Record<string, any>;
  reason?: string;
}

export interface CompleteSlotResponse {
  ok: boolean;
  completed: boolean;
  message: string;
  slot_code: MissionSlotCode;
  mission?: CurrentMission;
  regenerated_mission?: CurrentMission | null;
  evaluation?: MissionEvaluationResult;
  game_profile?: GameProfile;
}

// ============================================
// 공통 API 에러
// ============================================

export interface ApiErrorResponse {
  detail?: string;
  message?: string;
}


