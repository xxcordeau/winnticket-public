/**
 * 티켓형 쿠폰 그룹 DTO
 * 같은 유효기간의 티켓들을 그룹으로 관리
 * 실제 쿠폰번호는 백엔드에서 발급 시 생성
 * 
 * ⚠️ 주의: 이 파일은 로컬 스토리지용 DTO입니다.
 * 실제 API 연동 시에는 /lib/api/ticket-coupon.ts의 DTO를 사용하세요.
 */

export type TicketCouponGroupStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

/**
 * 티켓 쿠폰 그룹 (로컬 스토리지용)
 */
export interface TicketCouponGroup {
  id: string;
  productId: string;
  productName: string;
  optionId?: string; // ID ( )
  optionName?: string; // (: " ")
  optionValueId?: string; // ID ( )
  optionValueName?: string; // (: "VIP")
  validFrom: string;
  validUntil: string;
  totalQuantity: number;
  usedQuantity: number;
  status: TicketCouponGroupStatus;
  createdAt: string;
  createdBy: string;
  memo?: string;
}

/**
 * 티켓 쿠폰 그룹 생성 요청 (로컬 스토리지용)
 */
export interface CreateTicketCouponGroupDto {
  productId: string;
  couponNumber: string; // ( )
  validFrom: string;
  validUntil: string;
  optionId?: string; // ID ( )
  optionValueId?: string; // ID ( )
  memo?: string;
}

/**
 * 티켓 쿠폰 그룹 수정 요청 (로컬 스토리지용)
 */
export interface UpdateTicketCouponGroupDto {
  validFrom?: string;
  validUntil?: string;
  status?: TicketCouponGroupStatus;
  memo?: string;
}

/**
 * 티켓 쿠폰 그룹 상태 라벨
 */
export const TICKET_COUPON_GROUP_STATUS_LABELS: Record<TicketCouponGroupStatus, string> = {
  ACTIVE: '사용가능',
  EXPIRED: '기간만료',
  CANCELLED: '취소됨',
};