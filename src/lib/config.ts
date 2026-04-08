/**
 * API Base URL 가져오기
 * 
 * 환경 구분:
 * - 운영: https://winnticket.co.kr/api (HTTPS , )
 * - 개발: https://winnticket.store/api (HTTPS , )
 */
export function getApiBaseUrl(): string {
  // 1: .env 
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // 2: - hostname 
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const origin = window.location.origin;
    
    // (winnticket.co.kr) - HTTPS 
    if (hostname === 'www.winnticket.co.kr' || hostname === 'winnticket.co.kr') {
      return `${origin}/api`;
    }
    
    // (winnticket.store localhost) - HTTPS 
    return `${origin}/api`;
  }
  
  // 3: 
  if (typeof import.meta !== 'undefined') {
    if (import.meta.env?.MODE === 'production') {
      return 'https://winnticket.co.kr/api';
    } else {
      return 'https://winnticket.store/api';
    }
  }
  
  // 4: ()
  return 'https://winnticket.store/api';
}

/**
 * 프론트엔드 애플리케이션 URL 가져오기
 */
export function getAppUrl(): string {
  // 1: .env 
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_URL) {
    return import.meta.env.VITE_APP_URL;
  }
  
  // 2: origin 
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // 3: 
  if (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'production') {
    return 'https://www.winnticket.co.kr';
  }
  
  // 4: 
  return 'http://localhost:3000';
}

/**
 * 채널 URL 생성
 */
export function getChannelUrl(channelCode: string): string {
  const baseUrl = getAppUrl();
  return `${baseUrl}/?channel=${channelCode}`;
}

// 
export const config = {
  apiBaseUrl: getApiBaseUrl(),
  appUrl: getAppUrl(),
  getChannelUrl,
} as const;