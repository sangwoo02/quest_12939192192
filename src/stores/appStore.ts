/**
 * 🗄️ 앱 전역 상태 관리 스토어
 *
 * Zustand를 사용한 전역 상태 관리입니다.
 * localStorage에 persist되어 새로고침 시에도 상태가 유지됩니다.
 *
 * 📦 상태 구조:
 * - Auth: 로그인 상태, 유저 정보, 토큰
 * - Onboarding: 온보딩 완료, 신체 데이터 입력 상태
 * - Data: InBody 데이터, 수동 입력 데이터, 목표 체중, 미션
 * - Game: 캐릭터, 코인, 경험치, 레벨, 배지
 * - Server Game Cache: gameProfile, health 연결 여부, 게임 로딩 상태
 * - Permissions: GPS, 알림 권한
 * - Wearable: 웨어러블 기기 연결 정보
 * - History: 활동 기록, 몸무게 기록
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, CurrentMission, GameProfile } from '@/types';
import { gameApi, healthcareApi, missionsApi } from '@/services/api';

export const AUTO_LOGIN_KEY = 'auto_login_checked';

interface InBodyData {
  id: string;
  userId: string;
  syncedAt: Date;
  name: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  body_fat: number;
  muscle_mass: number;
  goal: string;
  bmi?: number;
  bmr?: number;
}

interface ManualInputData {
  name: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  body_fat: number;
  muscle_mass: number;
  goal: string;
}

interface WearableDevice {
  name: string;
  type: string;
}

interface ActivityRecord {
  date: string; // YYYY-MM-DD
  steps: number;
  calories: number;
}

interface WeightRecord {
  weight: number;
  recordedAt: string; // ISO string
}

const INITIAL_AUTH_STATE = {
  isLoggedIn: false,
  user: null as User | null,
  rememberMe: false,
  authToken: null as string | null,
};

const INITIAL_USER_DATA_STATE = {
  hasCompletedOnboarding: false,
  hasInBodyData: false,
  hasInBodySynced: false,
  hasMissionsGenerated: false,
  inBodyData: null as InBodyData | null,
  manualData: null as ManualInputData | null,
  targetWeight: null as number | null,
  missions: [] as CurrentMission[],
};

const INITIAL_GAME_STATE = {
  hasCreatedCharacter: false,
  selectedCharacter: null as string | null,
  selectedBackground: null as string | null,
  ownedCharacterIds: [] as string[],
  ownedBackgroundIds: [] as string[],
  coins: 0,
  exp: 0,
  level: 1,
  requiredExp: 100,
  equippedBadge: null as string | null,
  missionCoins: 0,
  dailyMissionRegenCount: 0,
  dailyMissionRegenDate: null as string | null,
};

const INITIAL_SERVER_GAME_STATE = {
  gameProfile: null as GameProfile | null,
  isHealthLinked: false,
  isGameLoading: false,
  hasFetchedGameState: false,
};

const INITIAL_DEVICE_STATE = {
  permissions: {
    gps: false,
    notifications: false,
  },
  wearableDevice: null as WearableDevice | null,
};

const INITIAL_HISTORY_STATE = {
  activityHistory: [] as ActivityRecord[],
  weightHistory: [] as WeightRecord[],
};

interface AppStore {
  // Auth State
  isLoggedIn: boolean;
  user: User | null;
  rememberMe: boolean;
  authToken: string | null;

  // Onboarding State
  hasCompletedOnboarding: boolean;
  hasInBodyData: boolean;
  hasInBodySynced: boolean;
  hasMissionsGenerated: boolean;

  // Data
  inBodyData: InBodyData | null;
  manualData: ManualInputData | null;
  targetWeight: number | null;
  missions: CurrentMission[];

  // Game State
  hasCreatedCharacter: boolean;
  selectedCharacter: string | null;
  selectedBackground: string | null;
  ownedCharacterIds: string[];
  ownedBackgroundIds: string[];
  coins: number;
  exp: number;
  level: number;
  requiredExp: number;
  equippedBadge: string | null;
  missionCoins: number;
  dailyMissionRegenCount: number;
  dailyMissionRegenDate: string | null;

  // 서버 기반 게임 상태
  gameProfile: GameProfile | null;
  isHealthLinked: boolean;
  isGameLoading: boolean;
  hasFetchedGameState: boolean;

  // Permissions
  permissions: {
    gps: boolean;
    notifications: boolean;
  };

  // Wearable
  wearableDevice: WearableDevice | null;

  // History
  activityHistory: ActivityRecord[];
  weightHistory: WeightRecord[];

  // Simple setters
  setActivityHistory: (records: ActivityRecord[]) => void;
  setWeightHistory: (records: WeightRecord[]) => void;
  setAuthToken: (token: string | null) => void;
  setOnboardingComplete: (complete: boolean) => void;
  setInBodyData: (data: InBodyData | null) => void;
  setManualData: (data: ManualInputData | null) => void;
  setPermissions: (permissions: { gps?: boolean; notifications?: boolean }) => void;
  setWearableDevice: (device: WearableDevice | null) => void;
  setMissionsGenerated: (generated: boolean) => void;
  setMissions: (missions: CurrentMission[]) => void;
  setTargetWeight: (weight: number | null) => void;
  setCharacter: (characterId: string, backgroundId: string) => void;
  setSelectedBackground: (backgroundId: string) => void;
  setSelectedCharacter: (characterId: string) => void;
  setOwnedCharacterIds: (ids: string[]) => void;
  setOwnedBackgroundIds: (ids: string[]) => void;
  addCoins: (amount: number) => void;
  addExp: (amount: number) => void;
  setEquippedBadge: (badgeId: string | null) => void;
  addActivityRecord: (steps: number, calories: number) => void;
  addWeightRecord: (weight: number) => void;
  addMissionCoins: (amount: number) => void;
  useMissionCoin: () => boolean;
  incrementDailyRegen: () => void;
  getDailyRegenRemaining: () => number;
  setHealthLinked: (linked: boolean) => void;
  syncGameProfile: (profile: GameProfile | null) => void;

  // 서버 상태 액션
  setGameProfile: (profile: GameProfile | null) => void;
  setIsGameLoading: (loading: boolean) => void;
  loadGameBootstrap: () => Promise<{
    profile: GameProfile | null;
    missions: CurrentMission[];
    isHealthLinked: boolean;
  }>;
  refreshGameState: () => Promise<{
    profile: GameProfile | null;
    missions: CurrentMission[];
    isHealthLinked: boolean;
  }>;
  clearGameState: () => void;

  // Auth / reset
  login: (user: User, rememberMe: boolean, token?: string) => void;
  logout: () => void;
  deleteAccount: () => void;
  resetUserData: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial State
      ...INITIAL_AUTH_STATE,
      ...INITIAL_USER_DATA_STATE,
      ...INITIAL_GAME_STATE,
      ...INITIAL_SERVER_GAME_STATE,
      ...INITIAL_DEVICE_STATE,
      ...INITIAL_HISTORY_STATE,

      // =========================
      // Auth
      // =========================
      login: (user, rememberMe, token) =>
        set({
          ...INITIAL_USER_DATA_STATE,
          ...INITIAL_GAME_STATE,
          ...INITIAL_SERVER_GAME_STATE,
          ...INITIAL_HISTORY_STATE,

          isLoggedIn: true,
          user,
          rememberMe,
          authToken: token || null,
        }),

      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('token_type');
        localStorage.removeItem('auth_token');
        localStorage.removeItem(AUTO_LOGIN_KEY);

        set({
          ...INITIAL_AUTH_STATE,
          ...INITIAL_USER_DATA_STATE,
          ...INITIAL_GAME_STATE,
          ...INITIAL_SERVER_GAME_STATE,
          ...INITIAL_DEVICE_STATE,
          ...INITIAL_HISTORY_STATE,
          ownedCharacterIds: [],
          ownedBackgroundIds: [],
        });
      },

      deleteAccount: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('token_type');
        localStorage.removeItem('auth_token');
        localStorage.removeItem(AUTO_LOGIN_KEY);

        set({
          ...INITIAL_AUTH_STATE,
          ...INITIAL_USER_DATA_STATE,
          ...INITIAL_GAME_STATE,
          ...INITIAL_SERVER_GAME_STATE,
          ...INITIAL_DEVICE_STATE,
          ...INITIAL_HISTORY_STATE,
          ownedCharacterIds: [],
          ownedBackgroundIds: [],
        });
      },

      setAuthToken: (token) => set({ authToken: token }),

      // =========================
      // Onboarding / Data
      // =========================
      setOnboardingComplete: (complete) =>
        set({
          hasCompletedOnboarding: complete,
        }),

      setInBodyData: (data) => {
        const state = get();
        const newState: Partial<AppStore> & { weightHistory?: WeightRecord[] } = {
          inBodyData: data,
          manualData: null,
          hasInBodyData: !!data,
          hasInBodySynced: !!data,
        };

        if (data) {
          const last = state.weightHistory[state.weightHistory.length - 1];
          if (!last || last.weight !== data.weight) {
            newState.weightHistory = [
              ...state.weightHistory,
              { weight: data.weight, recordedAt: new Date().toISOString() },
            ];
          }
        }

        set(newState as Partial<AppStore>);
      },

      setManualData: (data) => {
        const state = get();
        const newState: Partial<AppStore> & { weightHistory?: WeightRecord[] } = {
          manualData: data,
          inBodyData: null,
          hasInBodyData: !!data,
          hasInBodySynced: false,
        };

        if (data) {
          const last = state.weightHistory[state.weightHistory.length - 1];
          if (!last || last.weight !== data.weight) {
            newState.weightHistory = [
              ...state.weightHistory,
              { weight: data.weight, recordedAt: new Date().toISOString() },
            ];
          }
        }

        set(newState as Partial<AppStore>);
      },

      setActivityHistory: (records) => set({ activityHistory: records }),
      setWeightHistory: (records) => set({ weightHistory: records }),

      setPermissions: (permissions) =>
        set((state) => ({
          permissions: { ...state.permissions, ...permissions },
        })),

      setWearableDevice: (device) => set({ wearableDevice: device }),

      setMissionsGenerated: (generated) => set({ hasMissionsGenerated: generated }),

      setMissions: (missions) => set({ missions }),

      setTargetWeight: (weight) => set({ targetWeight: weight }),

      setHealthLinked: (linked) =>
        set({
          isHealthLinked: linked,
          hasInBodyData: linked,
          hasInBodySynced: linked,
        }),

      // =========================
      // Game profile sync
      // =========================
      syncGameProfile: (profile) => {
        if (!profile) {
          set({
            gameProfile: null,
            hasCreatedCharacter: false,
            selectedCharacter: null,
            selectedBackground: null,
            ownedCharacterIds: [],
            ownedBackgroundIds: [],
            coins: 0,
            exp: 0,
            level: 1,
            missionCoins: 0,
            equippedBadge: null,
            hasMissionsGenerated: false,
          });
          return;
        }

        const currentExp =
          typeof profile.current_exp === 'number' ? profile.current_exp : 0;

        const level =
          typeof profile.level === 'number' && profile.level > 0
            ? profile.level
            : 1;

        set({
          gameProfile: profile,
          hasCreatedCharacter: profile.has_created_character,
          selectedCharacter: profile.selected_character_id,
          selectedBackground: profile.selected_background_id,
          ownedCharacterIds: profile.owned_character_ids || [],
          ownedBackgroundIds: profile.owned_background_ids || [],
          coins: profile.coins,
          exp: currentExp,
          level,
          missionCoins: profile.mission_coins,
          equippedBadge: profile.equipped_badge_id,
          dailyMissionRegenCount: Math.max(
            0,
            3 - profile.daily_free_regen_remaining
          ),
          dailyMissionRegenDate: profile.daily_regen_date,
        });
      },

      setGameProfile: (profile) => set({ gameProfile: profile }),

      setIsGameLoading: (loading) => set({ isGameLoading: loading }),

      // =========================
      // 서버 상태 로드
      // =========================
      loadGameBootstrap: async () => {
        set({ isGameLoading: true });

        try {
          const [healthResult, profileResult, missionsResult] = await Promise.all([
            healthcareApi.getLatestFast().catch(() => null),
            gameApi.getProfile().catch(() => null),
            missionsApi.getCurrent().catch(() => []),
          ]);

          const linked = !!healthResult?.inbody;
          const profile = profileResult?.profile ?? null;
          const missions = Array.isArray(missionsResult) ? missionsResult : [];

          set({
            isHealthLinked: linked,
            hasFetchedGameState: true,
            gameProfile: profile,
            missions,
            hasMissionsGenerated: missions.length > 0,
            hasInBodyData: linked,
            hasInBodySynced: linked,
          });

          get().syncGameProfile(profile);

          return {
            profile,
            missions,
            isHealthLinked: linked,
          };
        } finally {
          set({ isGameLoading: false });
        }
      },

      refreshGameState: async () => {
        try {
          const [healthResult, profileResult, missionsResult] = await Promise.all([
            healthcareApi.getLatestFast().catch(() => null),
            gameApi.getProfile().catch(() => null),
            missionsApi.getCurrent().catch(() => []),
          ]);

          const linked = !!healthResult?.inbody;
          const profile = profileResult?.profile ?? null;
          const missions = Array.isArray(missionsResult) ? missionsResult : [];

          set({
            isHealthLinked: linked,
            hasFetchedGameState: true,
            gameProfile: profile,
            missions,
            hasMissionsGenerated: missions.length > 0,
            hasInBodyData: linked,
            hasInBodySynced: linked,
          });

          get().syncGameProfile(profile);

          return {
            profile,
            missions,
            isHealthLinked: linked,
          };
        } catch (error) {
          console.error('refreshGameState 실패:', error);
          throw error;
        }
      },

      clearGameState: () =>
        set({
          ...INITIAL_GAME_STATE,
          ...INITIAL_SERVER_GAME_STATE,
          missions: [],
          hasMissionsGenerated: false,
          hasCreatedCharacter: false,
          selectedCharacter: null,
          selectedBackground: null,
          ownedCharacterIds: [],
          ownedBackgroundIds: [],
          coins: 0,
          exp: 0,
          level: 1,
          missionCoins: 0,
          equippedBadge: null,
          dailyMissionRegenCount: 0,
          dailyMissionRegenDate: null,
        }),

      // =========================
      // Game local setters
      // =========================
      setCharacter: (characterId, backgroundId) =>
        set({
          selectedCharacter: characterId,
          selectedBackground: backgroundId,
          hasCreatedCharacter: true,
        }),

      setSelectedBackground: (backgroundId) =>
        set({ selectedBackground: backgroundId }),

      setSelectedCharacter: (characterId) =>
        set({ selectedCharacter: characterId }),

      setOwnedCharacterIds: (ids) => set({ ownedCharacterIds: ids }),
      setOwnedBackgroundIds: (ids) => set({ ownedBackgroundIds: ids }),

      addCoins: (amount) =>
        set((state) => ({
          coins: state.coins + amount,
        })),

      addExp: (amount) =>
        set((state) => {
          const newExp = state.exp + amount;

          if (newExp >= state.requiredExp) {
            return {
              exp: newExp - state.requiredExp,
              level: state.level + 1,
              requiredExp: Math.floor(state.requiredExp * 1.5),
            };
          }

          return { exp: newExp };
        }),

      setEquippedBadge: (badgeId) => set({ equippedBadge: badgeId }),

      addMissionCoins: (amount) =>
        set((state) => ({
          missionCoins: state.missionCoins + amount,
        })),

      useMissionCoin: () => {
        const state = get();
        if (state.missionCoins <= 0) return false;

        set({ missionCoins: state.missionCoins - 1 });
        return true;
      },

      incrementDailyRegen: () =>
        set((state) => {
          const today = new Date().toISOString().split('T')[0];

          if (state.dailyMissionRegenDate !== today) {
            return {
              dailyMissionRegenCount: 1,
              dailyMissionRegenDate: today,
            };
          }

          return {
            dailyMissionRegenCount: state.dailyMissionRegenCount + 1,
          };
        }),

      getDailyRegenRemaining: () => {
        const state = get();
        const today = new Date().toISOString().split('T')[0];

        if (state.dailyMissionRegenDate !== today) return 3;

        return Math.max(0, 3 - state.dailyMissionRegenCount);
      },

      addActivityRecord: (steps, calories) =>
        set((state) => {
          const today = new Date().toISOString().split('T')[0];
          const filtered = state.activityHistory.filter((a) => a.date !== today);

          return {
            activityHistory: [...filtered, { date: today, steps, calories }],
          };
        }),

      addWeightRecord: (weight) =>
        set((state) => {
          const last = state.weightHistory[state.weightHistory.length - 1];
          if (last && last.weight === weight) return {};
          return {
            weightHistory: [
              ...state.weightHistory,
              { weight, recordedAt: new Date().toISOString() },
            ],
          };
        }),

      // =========================
      // Reset
      // =========================
      resetUserData: () =>
        set({
          ...INITIAL_USER_DATA_STATE,
          ...INITIAL_GAME_STATE,
          ...INITIAL_SERVER_GAME_STATE,
          ...INITIAL_HISTORY_STATE,
          ownedCharacterIds: [],
          ownedBackgroundIds: [],
        }),
    }),
    {
      name: 'health-quest-storage',
      partialize: (state) =>
        state.rememberMe ? state : { ...state, ...INITIAL_AUTH_STATE },
    }
  )
);