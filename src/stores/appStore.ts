/**
 * 🗄️ 앱 전역 상태 관리 스토어
 *
 * Zustand를 사용한 전역 상태 관리입니다.
 * localStorage에 persist되어 새로고침 시에도 상태가 유지됩니다.
 *
 * 📝 수정 가이드:
 * - 새 상태 추가: AppStore 인터페이스와 초기값에 추가
 * - 새 액션 추가: AppStore 인터페이스와 구현부에 추가
 * - 저장 제외 항목: partialize 함수에서 필터링
 * - 저장소 키 변경: persist의 name 옵션 수정
 *
 * 📦 상태 구조:
 * - Auth: 로그인 상태, 유저 정보, 토큰
 * - Onboarding: 온보딩 완료, 신체 데이터 입력 상태
 * - Data: InBody 데이터, 수동 입력 데이터, 목표 체중, 미션
 * - Permissions: GPS, 알림 권한
 * - Wearable: 웨어러블 기기 연결 정보
 *
 * 🔧 헬퍼 함수:
 * - validateLogin: 로그인 검증 (mock)
 * - checkEmailExists: 이메일 중복 체크
 *
 * ⚠️ 주의사항:
 * - rememberMe가 false면 로그인 정보 저장 안 됨
 * - 백엔드 연결 시 mock 함수들 실제 API로 교체 필요
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { InBodyData, ManualInputData, WearableDevice, User, Mission } from '@/types';

const AUTO_LOGIN_KEY = 'auto_login_checked';

type RegisteredUser = {
  username: string;
  password: string;
  nickname: string;
  birthDate: string;
};

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
  missions: [] as Mission[],
};

const INITIAL_DEVICE_STATE = {
  permissions: {
    gps: false,
    notifications: false,
  },
  wearableDevice: null as WearableDevice | null,
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
  hasInBodySynced: boolean; // true if data came from InBody sync, false if manual input
  hasMissionsGenerated: boolean;

  // Registered users (mock - 백엔드 연결 전 테스트용)
  registeredUsers: RegisteredUser[];

  // Data
  inBodyData: InBodyData | null;
  manualData: ManualInputData | null;
  targetWeight: number | null;
  missions: Mission[];

  // Permissions
  permissions: {
    gps: boolean;
    notifications: boolean;
  };

  // Wearable
  wearableDevice: WearableDevice | null;

  // Actions
  registerUser: (username: string, password: string, nickname: string, birthDate: string) => void;
  login: (user: User, rememberMe: boolean, token?: string) => void;
  logout: () => void;
  deleteAccount: () => void; // 회원탈퇴 - registeredUsers에서도 삭제
  setAuthToken: (token: string | null) => void;
  setOnboardingComplete: (complete: boolean) => void;
  setInBodyData: (data: InBodyData | null) => void;
  setManualData: (data: ManualInputData | null) => void;
  setPermissions: (permissions: { gps?: boolean; notifications?: boolean }) => void;
  setWearableDevice: (device: WearableDevice | null) => void;
  setMissionsGenerated: (generated: boolean) => void;
  setMissions: (missions: Mission[]) => void;
  setTargetWeight: (weight: number | null) => void;
  resetUserData: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial State
      ...INITIAL_AUTH_STATE,
      ...INITIAL_USER_DATA_STATE,
      ...INITIAL_DEVICE_STATE,
      registeredUsers: [],

      // Actions
      registerUser: (username, password, nickname, birthDate) =>
        set((state) => ({
          registeredUsers: [
            ...state.registeredUsers,
            { username, password, nickname, birthDate },
          ],
        })),

      login: (user, rememberMe, token) =>
        set({
          ...INITIAL_USER_DATA_STATE,
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
          ...INITIAL_DEVICE_STATE,
        });
      },

      // 회원탈퇴 - registeredUsers에서도 해당 유저 삭제
      deleteAccount: () => {
        const currentUser = get().user;

        localStorage.removeItem('access_token');
        localStorage.removeItem('token_type');
        localStorage.removeItem('auth_token');
        localStorage.removeItem(AUTO_LOGIN_KEY);

        set((state) => ({
          ...INITIAL_AUTH_STATE,
          ...INITIAL_USER_DATA_STATE,
          ...INITIAL_DEVICE_STATE,
          registeredUsers: currentUser
            ? state.registeredUsers.filter((u) => u.username !== currentUser.username)
            : state.registeredUsers,
        }));
      },

      setAuthToken: (token) =>
        set({
          authToken: token,
        }),

      setOnboardingComplete: (complete) =>
        set({
          hasCompletedOnboarding: complete,
        }),

      setInBodyData: (data) =>
        set({
          inBodyData: data,
          manualData: null,
          hasInBodyData: !!data,
          hasInBodySynced: !!data,
        }),

      setManualData: (data) =>
        set({
          manualData: data,
          inBodyData: null,
          hasInBodyData: !!data,
          hasInBodySynced: false,
        }),

      setPermissions: (permissions) =>
        set((state) => ({
          permissions: {
            ...state.permissions,
            ...permissions,
          },
        })),

      setWearableDevice: (device) =>
        set({
          wearableDevice: device,
        }),

      setMissionsGenerated: (generated) =>
        set({
          hasMissionsGenerated: generated,
        }),

      setMissions: (missions) =>
        set({
          missions,
        }),

      setTargetWeight: (weight) =>
        set({
          targetWeight: weight,
        }),

      resetUserData: () =>
        set({
          ...INITIAL_USER_DATA_STATE,
        }),
    }),
    {
      name: 'health-quest-storage',
      partialize: (state) =>
        state.rememberMe
          ? state
          : {
              ...state,
              ...INITIAL_AUTH_STATE,
            },
    }
  )
);

// Helper function to validate login (mock - 백엔드 연결 전 테스트용)
// TODO: 백엔드 연결 후 api.auth.login() 사용으로 교체
export const validateLogin = (
  username: string,
  password: string
): { valid: boolean; nickname?: string; birthDate?: string } => {
  const state = useAppStore.getState();
  const user = state.registeredUsers.find(
    (u) => u.username === username && u.password === password
  );

  if (user) {
    return {
      valid: true,
      nickname: user.nickname,
      birthDate: user.birthDate,
    };
  }

  return { valid: false };
};

// Helper function to check if email already exists (이메일 중복 체크)
export const checkEmailExists = (email: string): boolean => {
  const state = useAppStore.getState();
  return state.registeredUsers.some((u) => u.username === email);
};