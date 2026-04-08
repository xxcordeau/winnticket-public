/**
 * 환경 설정
 * TypeScript 방식의 환경 변수 관리
 * 
 * 우선순위:
 * 1. .env 파일 (VITE_API_BASE_URL, VITE_APP_URL)
 * 2. 이 파일의 값들
 * 3. /lib/config.ts의 폴백값
 */
export const ENV_CONFIG = {
  /**
   * API 서버 URL (백엔드)
   * - 운영: https://api.winnticket.co.kr (HTTPS )
   * - 개발: https://api.winnticket.store (HTTPS )
   * 
   * ⚠️ 주의: 반드시 프로토콜(http:// https://) .
   */
  API_BASE_URL: 'https://api.winnticket.store',

  /**
   * 프론트엔드 애플리케이션 URL
   * - 운영: https://www.winnticket.store
   * - 개발: http://localhost:3000
   */
  APP_URL: '', // 
} as const;