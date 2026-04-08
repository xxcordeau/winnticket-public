/**
 * DTO Utility Functions
 * DTO 관련 유틸리티 함수
 */

import type { Timestamp } from './types';
import { generateUUIDWithPrefix } from '../../lib/utils/uuid';

/**
 * API Response Types
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

/**
 * 현재 시간을 ISO 8601 형식의 Timestamp로 반환
 */
export function getCurrentTimestamp(): Timestamp {
  return new Date().toISOString();
}

/**
 * Date 객체를 Timestamp로 변환
 */
export function dateToTimestamp(date: Date): Timestamp {
  return date.toISOString();
}

/**
 * Timestamp를 Date 객체로 변환
 */
export function timestampToDate(timestamp: Timestamp): Date {
  return new Date(timestamp);
}

/**
 * YYYY-MM-DD 형식의 날짜 문자열을 생성
 */
export function formatDateOnly(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

/**
 * 전화번호 정규화 (숫자만 추출)
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

/**
 * 이메일 정규화 (소문자 변환 및 공백 제거)
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * ID 생성 헬퍼 (프론트엔드 임시용)
 * 실제 백엔드에서는 서버가 ID를 생성합니다
 */
export function generateTempId(prefix: string = 'TEMP'): string {
  return generateUUIDWithPrefix(prefix);
}

/**
 * CBM 계산 (가로 x 세로 x 높이 / 1,000,000)
 * 단위: cm → CBM (세제곱미터)
 */
export function calculateCBM(
  width: number,
  depth: number,
  height: number
): number {
  return (width * depth * height) / 1_000_000;
}

/**
 * 금액 포맷팅 (한국 원화)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount);
}

/**
 * 금액 포맷팅 (억 단위)
 */
export function formatCurrencyInEok(amount: number): string {
  const eok = amount / 100_000_000;
  return `${eok.toFixed(1)}억`;
}

/**
 * 전화번호 포맷팅 (010-1234-5678)
 */
export function formatPhoneNumber(phone: string): string {
  const normalized = normalizePhone(phone);
  
  if (normalized.length === 11) {
    return `${normalized.slice(0, 3)}-${normalized.slice(3, 7)}-${normalized.slice(7)}`;
  } else if (normalized.length === 10) {
    return `${normalized.slice(0, 3)}-${normalized.slice(3, 6)}-${normalized.slice(6)}`;
  }
  
  return phone;
}

/**
 * 주소 전체 문자열 생성
 */
export function formatFullAddress(
  address1: string,
  address2?: string | null,
  postalCode?: string
): string {
  const parts = [];
  
  if (postalCode) {
    parts.push(`(${postalCode})`);
  }
  
  parts.push(address1);
  
  if (address2) {
    parts.push(address2);
  }
  
  return parts.join(' ');
}

/**
 * 중복 제거 키 생성 (SHA-256 해시 대신 간단한 문자열 조합)
 * 실제 프로덕션에서는 crypto.subtle.digest를 사용하세요
 */
export function generateDedupeKey(phone: string, email?: string): string {
  const normalized = normalizePhone(phone);
  const emailNorm = email ? normalizeEmail(email) : '';
  return `${normalized}|${emailNorm}`;
}

/**
 * 작업 코드 생성 (예: JOB-2025-001)
 */
export function generateJobCode(year: number, sequence: number): string {
  return `JOB-${year}-${String(sequence).padStart(3, '0')}`;
}

/**
 * 견적 버전 문자열 생성 (v1, v2, ...)
 */
export function formatQuoteVersion(version: number): string {
  return `v${version}`;
}

/**
 * 상태 한글 변환 (향후 i18n 대체 예정)
 */
export const JobOrderStatusLabels: Record<string, string> = {
  INTAKE: '접수',
  CONTACTED: '연락완료',
  CONTACT_FAILED: '연락실패',
  CONSULT_SCHEDULED: '상담예약',
  ESTIMATE_DONE: '견적완료',
  QUOTE_ISSUED: '견적발행',
  CONTRACTED: '계약체결',
  DISPATCHED: '배차완료',
  COMPLETED: '작업완료',
  CANCELLED: '취소',
};

/**
 * 파라미터 병합 (기본값 + 사용자 입력)
 */
export function mergeParams(
  baseParams: Record<string, any> | null,
  overrideParams: Record<string, any> | null
): Record<string, any> | null {
  if (!baseParams && !overrideParams) return null;
  if (!baseParams) return overrideParams;
  if (!overrideParams) return baseParams;
  
  return { ...baseParams, ...overrideParams };
}

/**
 * 안전한 JSON 파싱
 */
export function safeJsonParse<T = any>(
  json: string | null | undefined,
  defaultValue: T
): T {
  if (!json) return defaultValue;
  
  try {
    return JSON.parse(json);
  } catch {
    return defaultValue;
  }
}

/**
 * 빈 문자열을 null로 변환
 */
export function emptyToNull(value: string | null | undefined): string | null {
  if (!value || value.trim() === '') return null;
  return value.trim();
}

/**
 * 숫자 범위 검증
 */
export function validateRange(
  value: number,
  min: number,
  max: number
): boolean {
  return value >= min && value <= max;
}

/**
 * 이메일 형식 검증 (간단한 버전)
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 한국 전화번호 형식 검증
 */
export function isValidKoreanPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  // 010, 011, 016, 017, 018, 019 11 
  // 9-10
  return /^(01[0-9]|02|0[3-9][0-9])[0-9]{7,8}$/.test(normalized);
}