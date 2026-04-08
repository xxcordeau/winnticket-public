/**
 * Common Types and Enums for Ticket Sales System
 * 티켓 판매 시스템 공통 타입 정의
 */

// ========================================
// Employee Types (직원 관련)
// ========================================
export type EmploymentType = 'REGULAR' | 'CONTRACT' | 'FREELANCE';
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'LEAVE';

// ========================================
// Permission Types (권한)
// ========================================
export type PermissionEffect = 'ALLOW' | 'DENY';

// ========================================
// Order Types (주문 관련)
// ========================================

/**
 * 주문 상태
 */
export type TicketOrderStatus =
  | '입금전'           // 주문 생성 후 입금 대기
  | '주문처리완료'    // 결제 완료 후 주문 처리 완료
  | '취소신청'        // 취소 신청
  | '취소완료';       // 취소 완료

/**
 * 결제 상태
 */
export type PaymentStatus =
  | '입금대기'        // 입금 대기 중
  | '입금완료'        // 입금 완료
  | '결제완료'        // 결제 완료
  | '결제실패'        // 결제 실패
  | '취소완료'        // 취소 완료
  | 'PG에 결제 요청함' // PG에 결제 요청함
  | '환불신청'        // 환불 신청
  | '환불완료'        // 환불 완료
  | '무통장 입금기한 만료'; // 무통장 입금기한 만료

/**
 * 결제 방법
 */
export type PaymentMethod =
  | '신용카드'
  | '계좌이체'
  | '무통장입금'
  | '간편결제'
  | '휴대폰결제'
  | '기타';

/**
 * 주문 채널
 */
export type OrderChannel =
  | '온라인'
  | '전화'
  | '현장'
  | '대량구매'
  | '제휴사'
  | '기타';

// ========================================
// API Response Types (API 응답)
// ========================================

/**
 * 표준 API 응답 형식
 * Spring Boot의 ApiResponse<T> 형태
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp: string;
  error?: {
    code?: string;
    details?: string;
  };
}

/**
 * 페이징된 API 응답
 */
export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// ========================================
// Utility Types
// ========================================
export type Timestamp = string; // ISO 8601 format
export type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
export interface JSONObject {
  [key: string]: JSONValue;
}
export type JSONArray = JSONValue[];