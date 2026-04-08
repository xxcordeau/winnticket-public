/**
 * 티켓 쿠폰 상태
 */
export type CouponStatus = "ACTIVE" | "SOLD" | "USED";

/**
 * 개별 쿠폰 정보
 */
export interface TicketCoupon {
  id: string;
  groupId?: string;
  couponNumber: string;
  status: CouponStatus;
  validFrom: string; // YYYY-MM-DD
  validUntil: string; // YYYY-MM-DD
  usedAt?: string; // ISO 8601
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 쿠폰 그룹 정보
 */
export interface TicketCouponGroup {
  id: string;
  productId: string;
  productOptionId?: string;
  productOptionValueId?: string;
  activeCount: number;
  usedCount: number;
  soldCount?: number;
  totalCount: number;
  validFrom: string;
  validUntil: string;
  coupons: TicketCoupon[];
  createdAt?: string;
}

/**
 * 쿠폰 그룹 생성 요청
 */
export interface CreateCouponGroupRequest {
  productId: string;
  productOptionId?: string;
  productOptionValueId?: string;
  startNumber: string; // : "S20260001"
  endNumber: string; // : "S20261000"
  validFrom: string; // YYYY-MM-DD
  validUntil: string; // YYYY-MM-DD
}

/**
 * 쿠폰 그룹 유효기간 일괄 변경 요청
 */
export interface UpdateGroupDateRequest {
  groupId: string;
  validFrom: string; // YYYY-MM-DD
  validUntil: string; // YYYY-MM-DD
}

/**
 * 쿠폰 정보 수정 요청
 */
export interface UpdateCouponRequest {
  couponNumber?: string;
  status?: CouponStatus;
  usedAt?: string; // ISO 8601
  validFrom?: string; // YYYY-MM-DD
  validUntil?: string; // YYYY-MM-DD
}
