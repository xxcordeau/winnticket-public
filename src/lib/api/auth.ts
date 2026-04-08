import type { ApiResponse } from '../../types/api';
import { getApiBaseUrl } from '../config';
import { isApiOnlyMode } from '../data-mode'; // 

// API Base URL 
export const API_BASE_URL = getApiBaseUrl();

/**
 * 로그인 요청 DTO
 */
export interface LoginRequest {
  accountId: string;
  password: string;
}

/**
 * 로그인 응답 사용자 정보
 */
export interface LoginUser {
  id: string;
  name: string;
  accountId: string;
  roleId: string;
  avatarUrl?: string;
  userType: string;
  partnerId?: string;
}

/**
 * 로그인 응답 데이터
 */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: LoginUser;
}

/**
 * Refresh Token 요청 DTO
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Refresh Token 응답 데이터
 */
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * 로그아웃 요청 DTO
 */
export interface LogoutRequest {
  refreshToken: string;
}

// 
const DUMMY_USERS = [
  {
    id: 'user001',
    name: '관리자',
    accountId: 'admin',
    password: 'demo',
    roleId: 'ROLE001',
    avatarUrl: '',
    userType: 'admin',
    partnerId: undefined,
  },
  {
    id: 'user002',
    name: '샤롯데씨어터',
    accountId: 'field',
    password: 'demo',
    roleId: 'ROLE002',
    avatarUrl: '',
    userType: 'field-manager',
    partnerId: 'partner001',
  },
  {
    id: 'user003',
    name: '하이브 엔터테인먼트',
    accountId: 'manager',
    password: 'demo',
    roleId: 'ROLE002',
    avatarUrl: '',
    userType: 'field-manager',
    partnerId: 'partner002',
  },
];

/**
 * 더미 토큰 생성
 */
const generateDummyToken = (userId: string, type: 'access' | 'refresh'): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${type}_${userId}_${timestamp}_${random}`;
};

/**
 * POST /api/auth/login – 로그인
 * 사용자가 계정/비밀번호로 로그인하면 Access Token + Refresh Token + 사용자 정보 반환
 */
export const login = async (request: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
  try {
    // API 
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    // ( )
    const data = await response.json();

    if (response.ok) {
      // (200-299)
      const responseData = data.date || data.data;
      
      // 
      if (data.success && responseData) {
        localStorage.setItem('access_token', responseData.accessToken);
        
        // refreshToken null 
        if (responseData.refreshToken) {
          localStorage.setItem('refresh_token', responseData.refreshToken);
        }
        
        localStorage.setItem('user', JSON.stringify(responseData.user));
        
        // 
        return {
          success: data.success,
          message: data.message,
          data: {
            accessToken: responseData.accessToken,
            refreshToken: responseData.refreshToken || '',
            user: responseData.user,
          },
        };
      }
      
      return data;
    }

    // (400, 401, 500 )
    // 
    return {
      success: false,
      message: data.message || `서버 오류 (${response.status})`,
      data: null,
    };
  } catch (error) {
    // API_ONLY 
    if (isApiOnlyMode()) {
      return {
        success: false,
        message: 'API 서버에 연결할 수 없습니다. 네트워크 연결을 확인하세요.',
        data: null,
      };
    }

    // 
    return useDummyLogin(request);
  }
};

/**
 * 더미 로그인 처리
 */
const useDummyLogin = (request: LoginRequest): ApiResponse<LoginResponse> => {
  const user = DUMMY_USERS.find(
    (u) => u.accountId === request.accountId && u.password === request.password
  );

  if (!user) {
    return {
      success: false,
      message: '계정 ID 또는 비밀번호가 올바르지 않습니다.',
      data: null,
    };
  }

  const accessToken = generateDummyToken(user.id, 'access');
  const refreshToken = generateDummyToken(user.id, 'refresh');

  // 
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
  localStorage.setItem('user', JSON.stringify({
    id: user.id,
    name: user.name,
    accountId: user.accountId,
    roleId: user.roleId,
    avatarUrl: user.avatarUrl,
    userType: user.userType,
    partnerId: user.partnerId,
  }));

  return {
    success: true,
    message: '로그인 성공',
    data: {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        accountId: user.accountId,
        roleId: user.roleId,
        avatarUrl: user.avatarUrl,
        userType: user.userType,
        partnerId: user.partnerId,
      },
    },
  };
};

/**
 * POST /api/auth/refresh – Refresh Token 재발급
 * Access Token 만료 시 Refresh Token으로 새 토큰을 재발급
 * ROLE002 (현장관리자)만 사용 가능
 */
export const refreshToken = async (request: RefreshTokenRequest): Promise<ApiResponse<RefreshTokenResponse>> => {
  try {
    // API 
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (response.ok) {
      const data = await response.json();
      
      // 
      if (data.success && data.data) {
        localStorage.setItem('access_token', data.data.accessToken);
        localStorage.setItem('refresh_token', data.data.refreshToken);
      }
      
      return data;
    }

    // API 
    return useDummyRefresh(request);
  } catch (error) {
    // API 
    return useDummyRefresh(request);
  }
};

/**
 * 더미 토큰 재발급
 */
const useDummyRefresh = (request: RefreshTokenRequest): ApiResponse<RefreshTokenResponse> => {
  const storedRefreshToken = localStorage.getItem('refresh_token');
  const storedUser = localStorage.getItem('user');

  if (storedRefreshToken !== request.refreshToken) {
    return {
      success: false,
      message: '유효하지 않은 Refresh Token입니다.',
      data: null,
    };
  }

  if (!storedUser) {
    return {
      success: false,
      message: '사용자 정보를 찾을 수 없습니다.',
      data: null,
    };
  }

  const user = JSON.parse(storedUser);

  // ROLE002 () 
  if (user.roleId !== 'ROLE002') {
    return {
      success: false,
      message: '현장관리자만 토큰 재발급이 가능합니다.',
      data: null,
    };
  }

  const newAccessToken = generateDummyToken(user.id, 'access');
  const newRefreshToken = generateDummyToken(user.id, 'refresh');

  // 
  localStorage.setItem('access_token', newAccessToken);
  localStorage.setItem('refresh_token', newRefreshToken);

  return {
    success: true,
    message: '토큰이 재발급되었습니다.',
    data: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    },
  };
};

/**
 * POST /api/auth/logout – 로그아웃
 * 전달받은 Refresh Token(또는 Access Token 포함)을 블랙리스트 처리
 */
export const logout = async (request: LogoutRequest): Promise<ApiResponse<{}>> => {
  try {
    // API 
    const accessToken = localStorage.getItem('access_token');
    
    
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(request),
    });

    // API 
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');

    if (response.ok) {
      const data = await response.json();
      return data;
    }

    // API 
    return {
      success: true,
      message: '로그아웃되었습니다.',
      data: {},
    };
  } catch (error) {
    // API 
    
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');

    return {
      success: true,
      message: '로그아웃되었습니다.',
      data: {},
    };
  }
};

/**
 * GET /api/auth/test-secure – 보호된 API 테스트
 * JWT Access Token 인증 필요
 */
export const testSecure = async (): Promise<ApiResponse<string>> => {
  try {
    const accessToken = localStorage.getItem('access_token');

    if (!accessToken) {
      return {
        success: false,
        message: '인증 토큰이 없습니다.',
        data: null,
      };
    }

    // API 
    const response = await fetch(`${API_BASE_URL}/auth/test-secure`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }

    // API 
    return useDummyTestSecure(accessToken);
  } catch (error) {
    // API 
    const accessToken = localStorage.getItem('access_token');
    return useDummyTestSecure(accessToken || '');
  }
};

/**
 * 더미 보안 테스트
 */
const useDummyTestSecure = (accessToken: string): ApiResponse<string> => {
  if (!accessToken) {
    return {
      success: false,
      message: '인증 토큰이 없습니다.',
      data: null,
    };
  }

  // 
  if (!accessToken.startsWith('access_')) {
    return {
      success: false,
      message: '유효하지 않은 토큰입니다.',
      data: null,
    };
  }

  const storedUser = localStorage.getItem('user');
  if (!storedUser) {
    return {
      success: false,
      message: '사용자 정보를 찾을 수 없습니다.',
      data: null,
    };
  }

  const user = JSON.parse(storedUser);

  return {
    success: true,
    message: '인증 성공',
    data: `안녕하세요, ${user.name}님! 보호된 리소스에 접근했습니다.`,
  };
};

/**
 * 현재 로그인한 사용자 정보 가져오기
 */
export const getCurrentUser = (): LoginUser | null => {
  const storedUser = localStorage.getItem('user');
  if (!storedUser) {
    return null;
  }
  
  try {
    return JSON.parse(storedUser);
  } catch (error) {
    return null;
  }
};

/**
 * 액세스 토큰 가져오기
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem('access_token');
};

/**
 * 리프레시 토큰 가져오기
 */
export const getRefreshToken = (): string | null => {
  return localStorage.getItem('refresh_token');
};

/**
 * 로그인 여부 확인
 */
export const isAuthenticated = (): boolean => {
  const accessToken = getAccessToken();
  const user = getCurrentUser();
  return !!accessToken && !!user;
};