/**
 * Supervisor DTO
 * 현장관리자 데이터 전송 객체
 */

// ========================================
// Brand Types ( )
// ========================================
type UUID = string & { __brand: "UUID" };
type EmailString = string & { __brand: "Email" };
type E164Phone = string & { __brand: "E164Phone" };
type ISODateTime = string & { __brand: "ISODateTime" };

// ========================================
// Supervisor ()
// ========================================

/**
 * 현장관리자 응답 DTO
 * - 읽기 전용
 * - password는 포함하지 않음 (보안)
 */
export interface Supervisor {
  id: UUID;
  username: string;        // ( )
  password: string;        // DEPRECATED: , 
  name: string;
  email: EmailString;
  phone: E164Phone;
  logoUrl?: string;        // 
  partnerId: UUID;
  partnerName?: string;
  active: boolean;

  // / ()
  lastLoginAt?: ISODateTime;
  passwordUpdatedAt?: ISODateTime;
  loginFailCount?: number;
  lockedUntil?: ISODateTime;
  mfaEnabled?: boolean;

  roleIds?: number[];      // ID 
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

/**
 * 현장관리자 생성 요청 DTO
 * - password는 write-only
 */
export interface CreateSupervisorDto {
  username: string;
  password: string;        // write-only ( )
  name: string;
  email: EmailString;
  phone: E164Phone;
  logoUrl?: string;
  partnerId: UUID;
  active?: boolean;
  roleIds?: number[];      // 
}

/**
 * 현장관리자 수정 요청 DTO
 * - id는 URL path로 받는 것을 권장 (Body에 포함하지 않기)
 * - password는 별도 API로 변경
 */
export interface UpdateSupervisorDto {
  id: string;              // DEPRECATED: URL path 
  username?: never;        // 
  password?: string;       // DEPRECATED: ChangePasswordDto 
  name?: string;
  email?: EmailString;
  phone?: E164Phone;
  logoUrl?: string;
  partnerId?: UUID;        // 
  active?: boolean;
  roleIds?: number[];
}

/**
 * 비밀번호 변경 전용 DTO
 * - 사용자가 자신의 비밀번호를 변경할 때 사용
 */
export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;     // : // 
}

/**
 * 비밀번호 리셋 DTO (관리자용)
 * - 관리자가 사용자의 비밀번호를 강제로 리셋할 때 사용
 */
export interface ResetPasswordDto {
  newPassword: string;
  // : token: string;
}
