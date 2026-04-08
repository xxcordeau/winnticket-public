/**
 * UUID 생성 유틸리티
 * 
 * 시스템 전체에서 사용하는 고유 ID 생성을 담당합니다.
 * crypto.randomUUID()를 사용하여 RFC 4122 표준 UUID v4를 생성합니다.
 */

/**
 * RFC 4122 표준 UUID v4 생성
 * @returns UUID 문자열 (예: "550e8400-e29b-41d4-a716-446655440000")
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * 접두사가 있는 UUID 생성
 * @param prefix - UUID 앞에 붙일 접두사 (예: "prod", "user", "order")
 * @returns 접두사가 포함된 UUID 문자열 (예: "prod-550e8400-e29b-41d4-a716-446655440000")
 */
export function generateUUIDWithPrefix(prefix: string): string {
  return `${prefix}-${generateUUID()}`;
}

/**
 * 짧은 UUID 생성 (하이픈 제거)
 * @returns 하이픈이 제거된 UUID 문자열 (예: "550e8400e29b41d4a716446655440000")
 */
export function generateShortUUID(): string {
  return generateUUID().replace(/-/g, '');
}

/**
 * 짧은 UUID with 접두사
 * @param prefix - UUID 앞에 붙일 접두사
 * @returns 접두사가 포함된 짧은 UUID 문자열 (예: "prod_550e8400e29b41d4a716446655440000")
 */
export function generateShortUUIDWithPrefix(prefix: string): string {
  return `${prefix}_${generateShortUUID()}`;
}

/**
 * 숫자형 ID를 위한 UUID 기반 생성
 * UUID의 첫 16자를 16진수로 변환하여 숫자로 반환
 * @returns 숫자형 ID
 */
export function generateNumericId(): number {
  const uuid = generateShortUUID();
  // UUID 13 
  const hexString = uuid.substring(0, 13);
  return parseInt(hexString, 16);
}
