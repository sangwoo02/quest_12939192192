// API Configuration
// TODO: 백엔드 URL을 실제 서버 주소로 변경하세요
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Helper function to set auth token
export const setAuthToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

// Helper function to remove auth token
export const removeAuthToken = (): void => {
  localStorage.removeItem('auth_token');
};

// Base fetch wrapper with auth
const fetchWithAuth = async (
  path: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  return response;
};

// ============================================
// Authentication API
// ============================================

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
  user: {
    id: string;
    username: string;
    nickname: string;
  };
}

export interface UpdateProfileRequest {
  nickname: string;
}

export const authApi = {
  /**
   * 회원가입
   * POST /auth/signup
   */
  signup: async (data: SignupRequest): Promise<Response> => {
    return fetchWithAuth('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * 로그인
   * POST /auth/login
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '로그인에 실패했습니다.');
    }

    const result = await response.json();
    
    // Store token
    if (result.access_token) {
      setAuthToken(result.access_token);
    }

    return result;
  },

  /**
   * 프로필 업데이트
   * PATCH /auth/update-profile?nickname={nickname}
   */
  updateProfile: async (nickname: string): Promise<Response> => {
    return fetchWithAuth(`/auth/update-profile?nickname=${encodeURIComponent(nickname)}`, {
      method: 'PATCH',
    });
  },
};

// ============================================
// InBody API
// ============================================

export interface SaveInbodyRequest {
  name: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  body_fat: number;
  muscle_mass: number;
  goal: string;
}

export interface InbodyResponse {
  bmi: number;
  bmr: number;
  status_message: string | null;
}

export interface CheckDataResponse {
  exists: boolean;
  data: InbodyResponse | null;
  message: string;
}

export const inbodyApi = {
  /**
   * InBody 데이터 저장
   * POST /missions/save-inbody
   */
  saveInbody: async (data: SaveInbodyRequest): Promise<InbodyResponse> => {
    const response = await fetchWithAuth('/missions/save-inbody', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'InBody 데이터 저장에 실패했습니다.');
    }

    return response.json();
  },

  /**
   * InBody 데이터 업데이트
   * PUT /missions/update-inbody
   */
  updateInbody: async (data: SaveInbodyRequest): Promise<InbodyResponse> => {
    const response = await fetchWithAuth('/missions/update-inbody', {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'InBody 데이터 업데이트에 실패했습니다.');
    }

    return response.json();
  },

  /**
   * 사용자 데이터 확인
   * GET /missions/check-data
   */
  checkUserData: async (): Promise<CheckDataResponse> => {
    const response = await fetchWithAuth('/missions/check-data', {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '데이터 확인에 실패했습니다.');
    }

    return response.json();
  },
};

// ============================================
// Missions API
// ============================================

export interface Mission {
  id: number;
  title: string;
  description: string;
  type: 'exercise' | 'nutrition' | 'lifestyle';
  difficulty: 'easy' | 'medium' | 'hard';
  xp_reward: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  created_at: string;
  expires_at: string;
}

export interface GenerateMissionsResponse {
  missions: Mission[];
  message: string;
}

export const missionsApi = {
  /**
   * 미션 생성 및 저장
   * POST /missions/generate-and-save
   */
  generateAndSave: async (): Promise<GenerateMissionsResponse> => {
    const response = await fetchWithAuth('/missions/generate-and-save', {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '미션 생성에 실패했습니다.');
    }

    return response.json();
  },

  /**
   * 미션 완료
   * PATCH /missions/complete/{mission_id}
   */
  completeMission: async (missionId: number): Promise<Response> => {
    const response = await fetchWithAuth(`/missions/complete/${missionId}`, {
      method: 'PATCH',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '미션 완료 처리에 실패했습니다.');
    }

    return response;
  },

  /**
   * 미션 새로고침
   * PATCH /missions/refresh/{mission_id}
   */
  refreshMission: async (missionId: number): Promise<Mission> => {
    const response = await fetchWithAuth(`/missions/refresh/${missionId}`, {
      method: 'PATCH',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '미션 새로고침에 실패했습니다.');
    }

    return response.json();
  },
};

// ============================================
// Wearable API
// ============================================

export interface SyncWearableRequest {
  steps: number;
  calories: number | null;
  heart_rate: number | null;
  sleep_minutes: number | null;
  device_type: string;
}

export const wearableApi = {
  /**
   * 웨어러블 데이터 동기화
   * POST /missions/sync-wearable
   */
  syncWearableData: async (data: SyncWearableRequest): Promise<Response> => {
    const response = await fetchWithAuth('/missions/sync-wearable', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '웨어러블 데이터 동기화에 실패했습니다.');
    }

    return response;
  },
};

// ============================================
// System API
// ============================================

export const systemApi = {
  /**
   * 서버 상태 확인
   * GET /
   */
  healthCheck: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/`);
      return response.ok;
    } catch {
      return false;
    }
  },
};

// Export all APIs
export const api = {
  auth: authApi,
  inbody: inbodyApi,
  missions: missionsApi,
  wearable: wearableApi,
  system: systemApi,
};

export default api;
