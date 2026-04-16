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

  // ✅ 실명/프로필명
  name?: string | null;

  // ✅ 구버전 호환용
  nickname?: string | null;

  birth_date?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  nickname: string | null;
  birth_date: string | null;
  exp: number;
}

//0409수정
export interface OwnedCharacter {
  id: string;
  level: number;
  exp: number;
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

export interface WeeklyRankingItem {
  rank: number;
  nickname: string;
  steps: number;
}

export interface SeasonRankingItem {
  rank: number;
  nickname: string;
  score: number;
  tier: string;
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

export interface AchievementRecord {
  achievement_code: string;
  title: string;
  description: string | null;
  is_equipped: boolean;
  acquired_at: string | null;
}


export interface GameProfile {
  user_id: number;
  nickname: string | null;
  game_nickname: string | null;
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
  //0409수정
  owned_characters: OwnedCharacter[];
  //
  owned_background_ids: string[];
  equipped_achievement: EquippedAchievement | null;
  completed_achievement_codes: string[];
  equipped_achievement_codes: string[];
  achievements: AchievementRecord[];
  total_missions_completed: number;
  total_coins_earned: number;
  total_purchases: number;
  next_level_required_exp: number;
  can_level_up: boolean;
  character_stage: string;
  max_level: number;
}

export interface UpdateGameNicknameRequest {
  // 한글/영문 2~5자
  game_nickname: string;
  consume_coins?: boolean;
}

export interface UpdateGameNicknameResponse {
  ok: boolean;
  message: string;
  charged_coins: number;
  remaining_coins: number;
  profile: GameProfile;
  new_achievements?: AchievementRecord[];
}

export interface GetAchievementsResponse {
  ok: boolean;
  achievements: AchievementRecord[];
  completed_achievement_codes: string[];
  equipped_achievement_codes: string[];
}

export interface EquipAchievementsRequest {
  achievement_codes: string[];
}

export interface EquipAchievementsResponse {
  ok: boolean;
  message: string;
  equipped_achievement_codes: string[];
  profile: GameProfile;
}

export interface GameProfileResponse {
  ok: boolean;
  game_initialized: boolean;
  profile: GameProfile | null;
}

export interface LevelUpResponse {
  ok: boolean;
  message: string;
  before_level: number;
  after_level: number;
  before_exp: number;
  remaining_exp: number;
  used_exp: number;
  profile: GameProfile;
  new_achievements?: AchievementRecord[];
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

export interface PurchaseCharacterResponse {
  ok: boolean;
  message: string;
  purchased_character_id: string;
  selected_character_id: string | null;
  remaining_coins: number;
  profile: GameProfile;
  new_achievements?: AchievementRecord[];
}

export interface PurchaseBackgroundResponse {
  ok: boolean;
  message: string;
  purchased_background_id: string;
  selected_background_id: string | null;
  remaining_coins: number;
  profile: GameProfile;
  new_achievements?: AchievementRecord[];
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


export interface WeekWalkRankingItem {
  rank: number;
  nickname: string;
  steps?: number;
  score?: number;
  tier?: string;
  change?: number;
}

export interface WeekWalkOverviewResponse {
  ok: boolean;
  weekly_season: {
    season_id: number;
    start_at: string;
    end_at: string;
  };
  score_season: {
    season_id: number;
    start_at: string;
    end_at: string;
  };
  weekly_ranking: WeeklyRankingItem[];
  score_ranking: SeasonRankingItem[];
  my_weekly: {
    joined: boolean;
    rank: number | null;
    steps: number;
  };
  my_score: {
    rank: number | null;
    score: number;
    tier: string;
  };
  my_game_nickname: string | null;
  total_game_profile_users: number;
  new_achievement_codes?: string[];
}

export interface WeekWalkJoinResponse {
  ok: boolean;
  message: string;
  joined: boolean;
  weekly_season_id?: number;
  score_season_id?: number;
  new_achievement_codes?: string[];
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
  reason?: 'MISSION_COIN_REQUIRED';
}

export interface StartSlotRequest {
  slot_code: MissionSlotCode;
}

export interface RetrySlotRequest {
  slot_code: MissionSlotCode;
  use_mission_coin_if_needed?: boolean;
}

export interface RetrySlotResponse {
  ok: boolean;
  message: string;
  slot_code: MissionSlotCode;
  cost_type?: 'free_regen' | 'mission_coin';
  daily_free_regen_remaining?: number;
  mission_coins?: number;
  mission?: CurrentMission;
  reason?: 'MISSION_COIN_REQUIRED' | 'RETRY_GENERATION_FAILED';
}


export interface StartSlotResponse {
  ok: boolean;
  message: string;
  slot_code: MissionSlotCode;
  mission: CurrentMission;
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
  completed_mission?: CurrentMission;
  next_mission?: CurrentMission | null;
  evaluation?: MissionEvaluationResult;
  game_profile?: GameProfile;
  new_achievements?: AchievementRecord[];
  profile?: {
    level: number;
    current_exp: number;
    total_exp: number;
    coins: number;
    mission_coins: number;
  };
}

// ============================================
// 공통 API 에러
// ============================================

export interface ApiErrorResponse {
  detail?: string;
  message?: string;
}


