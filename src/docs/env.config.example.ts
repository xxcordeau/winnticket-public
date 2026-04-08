/**
 * 환경 변수 설정 템플릿 파일
 * 
 * 사용 방법:
 * 1. 이 파일을 복사해서 env.config.ts로 만드세요
 *    cp env.config.example.ts env.config.ts
 * 
 * 2. env.config.ts 파일을 열고 아래 값들을 수정하세요
 * 
 * 3. 저장 후 개발 서버 재시작 (npm run dev)
 * 
 * 주의: env.config.ts는 .gitignore에 포함되어 Git에 커밋되지 않습니다
 */

// env.config.ts ! 
export const ENV_CONFIG = {
  /**
   * API 서버 URL (백엔드)
   * 
   * 사용 가능한 값:
   *   - https://api.winnticket.store ( - )
   *   - https://api.winnticket.co.kr ( - )
   */
  API_BASE_URL: 'https://api.winnticket.store',
  
  /**
   * 프론트엔드 URL
   * 
   * 프로덕션:
   *   - https://www.winnticket.store
   *   - https://winnticket.store
   * 
   * 개발:
   *   - http://localhost:3000
   *   - http://localhost:5173
   */
  APP_URL: 'https://www.winnticket.store',
};

export default ENV_CONFIG;