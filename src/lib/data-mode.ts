/**
 * 데이터 모드 설정
 *
 * - API_ONLY: 오직 실제 API만 사용 (운영 환경)
 * - API_WITH_FALLBACK: API 우선, 실패 시 더미 데이터 (개발 환경)
 * - DUMMY_ONLY: 오직 더미 데이터만 사용 (테스트 환경)
 */

export type DataMode =
  | "API_ONLY"
  | "API_WITH_FALLBACK"
  | "DUMMY_ONLY";

/**
 * ⭐ 현재 데이터 모드 설정
 *
 * 운영 환경에서는 'API_ONLY'로 설정하세요.
 * 개발 중에는 'API_WITH_FALLBACK'을 사용할 수 있습니다.
 */
export const CURRENT_DATA_MODE: DataMode = "API_ONLY";

/**
 * API 전용 모드 여부
 */
export const isApiOnlyMode = () =>
  CURRENT_DATA_MODE === "API_ONLY";

/**
 * API fallback 허용 여부
 */
export const isApiWithFallback = () =>
  CURRENT_DATA_MODE === "API_WITH_FALLBACK";

/**
 * 더미 전용 모드 여부
 */
export const isDummyOnlyMode = () =>
  CURRENT_DATA_MODE === "DUMMY_ONLY";

/**
 * 현재 데이터 모드 로그 출력
 */
export function logDataMode() {

  switch (CURRENT_DATA_MODE) {
    case "API_ONLY":
      break;
    case "API_WITH_FALLBACK":
      break;
    case "DUMMY_ONLY":
      break;
  }

}