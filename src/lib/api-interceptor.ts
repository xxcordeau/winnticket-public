/**
 * API 인터셉터 - 토큰 만료 및 인증 오류 처리
 */

import { authStore } from '../data/auth';
import { toast } from 'sonner';

// 
let onUnauthorized: (() => void) | null = null;

// 
let hasShownTokenExpiredToast = false;

/**
 * 인증 실패 시 호출될 콜백 등록
 */
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

/**
 * 원본 fetch를 감싸는 인터셉터
 */
const originalFetch = window.fetch;

window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  // fetch 
  const response = await originalFetch(input, init);

  // 401 (Unauthorized) 403 (Forbidden) 
  if (response.status === 401 || response.status === 403) {
    
    // ( )
    if (!hasShownTokenExpiredToast) {
      hasShownTokenExpiredToast = true;
      toast.error('토큰이 만료되었습니다', {
        description: '다시 로그인해 주세요.',
        duration: 3000,
      });
      
      // 3 ( )
      setTimeout(() => {
        hasShownTokenExpiredToast = false;
      }, 3000);
    }
    
    // 
    authStore.logout();
    
    // (: /login )
    if (onUnauthorized) {
      onUnauthorized();
    }
  }

  return response;
};
