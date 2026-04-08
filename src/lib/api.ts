/**
 * API Client Utility
 * 서버 API 호출을 위한 유틸리티
 */

import { getApiBaseUrl as getBaseUrl } from './config';
import { toast } from 'sonner';

// API Base URL 
function getApiUrl(): string {
  // (localhost) (/api)
  if (typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return ''; // /api ( )
  }
  
  // API 
  const apiBaseUrl = getBaseUrl();
  return apiBaseUrl;
}

const API_BASE_URL = getApiUrl();

/**
 * 토큰 만료 시 로그아웃 처리 함수
 */
function handleTokenExpired(): void {
  
  // 
  const isAdminPage = typeof window !== 'undefined' && 
                      window.location.pathname.startsWith('/admin');
  
  // 
  if (!isAdminPage) {
    return;
  }
  
  // 
  toast.error('세션이 만료되었습니다. 로그인 페이지로 이동합니다.', {
    duration: 2000,
  });
  
  // 
  
  // 
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('auth-user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('erp_auth');
  }
  
  // 2 
  setTimeout(() => {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }, 2000);
}

/**
 * Spring Boot 스타일의 ApiResponse 타입
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
  timestamp?: string;
  errorCode?: string;
}

/**
 * API 에러 클래스
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public errorCode?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * HTTP 요청 옵션
 */
interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  data?: any;
}

/**
 * API 클라이언트 클래스
 */
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * 인증 토큰 가져오기 (로컬스토리지에서)
   */
  private getAuthToken(): string | null {
    try {
      // 1: access_token (auth.ts )
      const accessToken = localStorage.getItem('access_token');
      if (accessToken) {
        return accessToken;
      }
      
      // 2: erp_auth ( )
      const authData = localStorage.getItem('erp_auth');
      if (authData) {
        const auth = JSON.parse(authData);
        return auth.token || null;
      }
    } catch (error) {
    }
    return null;
  }

  /**
   * URL 파라미터 빌드
   */
  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    // endpoint URL 
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      const url = new URL(endpoint);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        });
      }
      return url.toString();
    }
    
    // localhost baseURL ( )
    if (!this.baseURL || this.baseURL === '') {
      // ( )
      const fullPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      
      if (params) {
        const url = new URL(fullPath, window.location.origin);
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        });
        return url.pathname + url.search;
      }
      
      return fullPath;
    }
    
    // : baseURL 
    const baseUrlObj = new URL(this.baseURL);
    const fullPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = new URL(fullPath, baseUrlObj.origin);
    
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    return url.toString();
  }

  /**
   * HTTP 요청 실행
   */
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { params, data, headers = {}, ...fetchOptions } = options;

    // URL 
    const url = this.buildUrl(endpoint, params);


    // 
    const requestHeaders: HeadersInit = {
      'Accept': 'application/json, */*', // Accept 
    };

    // API 
    const isShopApi = endpoint.includes('/product/shop') || 
                      endpoint.includes('/api/orders/shop') ||
                      endpoint.includes('/benepia/');

    // POST/PUT/PATCH Content-Type 
    if (data && ['POST', 'PUT', 'PATCH'].includes(fetchOptions.method || '')) {
      requestHeaders['Content-Type'] = 'application/json'; // API ()
    }

    // 
    Object.assign(requestHeaders, headers);

    // - API API 
    if (!isShopApi) {
      // API → 
      const token = this.getAuthToken();
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      } else {
      }
    } else {
    }


    // (10)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    // 
    const requestOptions: RequestInit = {
      ...fetchOptions,
      headers: requestHeaders,
      mode: 'cors', // CORS 
      credentials: 'include', // (CORS )
      signal: controller.signal,
    };

    // POST/PUT/PATCH body 
    if (data && ['POST', 'PUT', 'PATCH'].includes(fetchOptions.method || '')) {
      requestOptions.body = JSON.stringify(data);
    }

    try {
      
      
      // URL ( )
      try {
        const parsedUrl = url.startsWith('/')
          ? new URL(url, window.location.origin)
          : new URL(url);
      } catch (urlError) {
        throw new ApiError('잘못된 URL 형식입니다: ' + url, undefined, 'INVALID_URL');
      }
      
      const response = await fetch(url, requestOptions);
      clearTimeout(timeoutId);


      // 
      let responseData: ApiResponse<T>;
      
      const contentType = response.headers.get('content-type');
      
      
      if (contentType && contentType.includes('application/json')) {
        const jsonData = await response.json();
        
        // ApiResponse 
        if (Array.isArray(jsonData)) {
          responseData = {
            success: response.ok,
            data: jsonData as T,
            message: 'OK',
            timestamp: new Date().toISOString(),
          };
        } 
        // ApiResponse 
        else if (jsonData && typeof jsonData === 'object' && 'success' in jsonData) {
          responseData = jsonData;
        }
        // ApiResponse 
        else {
          responseData = {
            success: response.ok,
            data: jsonData as T,
            message: 'OK',
            timestamp: new Date().toISOString(),
          };
        }
      } else {
        // JSON 
        const text = await response.text();
        // HTML ( API )
        // console.log('Non-JSON response:', text);
        
        // HTML 
        if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
          // API_WITH_FALLBACK fallback 
          // 
          responseData = {
            success: false,
            data: null,
            message: 'HTML_RESPONSE', // fallback 
            timestamp: new Date().toISOString(),
          };
        } else {
          responseData = {
            success: response.ok,
            data: text as any,
            message: response.ok ? 'Success' : 'Error',
            timestamp: new Date().toISOString(),
          };
        }
      }

      // 
      if (!response.ok) {
        
        // 401/403 Unauthorized/Forbidden - 
        if (response.status === 401 || response.status === 403) {
          handleTokenExpired();
          // 
          throw new ApiError(
            '인증이 만료되었습니다. 로그인 페이지로 이동합니다.',
            response.status,
            'AUTH_EXPIRED',
            responseData
          );
        }
        
        throw new ApiError(
          responseData.message || `HTTP Error: ${response.status}`,
          response.status,
          responseData.errorCode,
          responseData
        );
      }

      return responseData;
    } catch (error) {
      clearTimeout(timeoutId);
      
      // (console.error )
      
      // throw ( )
      if (error instanceof ApiError) {
        throw error;
      }

      // throw
      throw new ApiError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        undefined,
        'NETWORK_ERROR',
        error
      );
    }
  }

  /**
   * GET 요청
   */
  async get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  /**
   * POST 요청
   */
  async post<T>(endpoint: string, data?: any, params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', data, params });
  }

  /**
   * PUT 요청
   */
  async put<T>(endpoint: string, data?: any, params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', data, params });
  }

  /**
   * PATCH 요청
   */
  async patch<T>(endpoint: string, data?: any, params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PATCH', data, params });
  }

  /**
   * DELETE 요청
   */
  async delete<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', params });
  }

  /**
   * 파일 업로드
   */
  async upload<T>(endpoint: string, file: File, fieldName: string = 'file', additionalData?: Record<string, any>): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append(fieldName, file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      });
    }

    const token = this.getAuthToken();
    const headers: HeadersInit = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // FormData Content-Type ( multipart/form-data boundary )
    
    const url = this.buildUrl(endpoint);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        // HTTPS 
      });


      const contentType = response.headers.get('content-type');
      let responseData: ApiResponse<T>;

      if (contentType && contentType.includes('application/json')) {
        const jsonData = await response.json();
        
        // ApiResponse 
        if (jsonData && typeof jsonData === 'object' && 'success' in jsonData) {
          responseData = jsonData;
        } else {
          // ApiResponse 
          responseData = {
            success: response.ok,
            data: jsonData as T,
            message: response.ok ? 'Upload successful' : 'Upload failed',
            timestamp: new Date().toISOString(),
          };
        }
      } else {
        const text = await response.text();
        responseData = {
          success: response.ok,
          data: text as any,
          message: response.ok ? 'Upload successful' : 'Upload failed',
          timestamp: new Date().toISOString(),
        };
      }

      if (!response.ok) {
        
        // 401/403 Unauthorized/Forbidden - 
        if (response.status === 401 || response.status === 403) {
          handleTokenExpired();
        }
        
        throw new ApiError(
          responseData.message || `HTTP Error: ${response.status}`,
          response.status,
          responseData.errorCode,
          responseData
        );
      }

      return responseData;
    } catch (error) {
      
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(
        error instanceof Error ? error.message : 'Upload failed',
        undefined,
        'UPLOAD_ERROR',
        error
      );
    }
  }
}

// API 
export const apiClient = new ApiClient(API_BASE_URL);

// 
export const api = {
  baseURL: API_BASE_URL,
  
  getToken: () => {
    try {
      // 1: access_token (auth.ts )
      const accessToken = localStorage.getItem('access_token');
      if (accessToken) {
        return accessToken;
      }
      
      // 2: erp_auth ( )
      const authData = localStorage.getItem('erp_auth');
      if (authData) {
        const auth = JSON.parse(authData);
        return auth.token || null;
      }
    } catch (error) {
    }
    return null;
  },
  
  get: <T,>(endpoint: string, params?: Record<string, string | number | boolean | undefined>) => 
    apiClient.get<T>(endpoint, params),
  
  post: <T,>(endpoint: string, data?: any, params?: Record<string, string | number | boolean | undefined>) => 
    apiClient.post<T>(endpoint, data, params),
  
  put: <T,>(endpoint: string, data?: any, params?: Record<string, string | number | boolean | undefined>) => 
    apiClient.put<T>(endpoint, data, params),
  
  patch: <T,>(endpoint: string, data?: any, params?: Record<string, string | number | boolean | undefined>) => 
    apiClient.patch<T>(endpoint, data, params),
  
  delete: <T,>(endpoint: string, params?: Record<string, string | number | boolean | undefined>) => 
    apiClient.delete<T>(endpoint, params),
  
  upload: <T,>(endpoint: string, file: File, fieldName?: string, additionalData?: Record<string, any>) => 
    apiClient.upload<T>(endpoint, file, fieldName, additionalData),
};

export default api;