/**
 * Coupon DTOs
 * 쿠폰 관련 데이터 전송 객체
 */

import type { Timestamp } from './types';

/**
 * 할인 타입
 */
export enum DiscountType {
  PERCENTAGE = '정률',
  FIXED = '정액',
}

/**
 * 쿠폰
 */
export interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  productIds: string[];
  minPurchaseAmount: number;
  maxDiscountAmount?: number;
  usageLimit: number;
  usedCount: number;
  validFrom: Timestamp;
  validUntil: Timestamp;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * 쿠폰 생성 DTO
 */
export interface CreateCouponDto {
  code: string;
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  productIds: string[];
  minPurchaseAmount: number;
  maxDiscountAmount?: number;
  usageLimit: number;
  validFrom: Timestamp;
  validUntil: Timestamp;
  isActive: boolean;
}

/**
 * 쿠폰 수정 DTO
 */
export interface UpdateCouponDto {
  code?: string;
  name?: string;
  description?: string;
  discountType?: DiscountType;
  discountValue?: number;
  productIds?: string[];
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  validFrom?: Timestamp;
  validUntil?: Timestamp;
  isActive?: boolean;
}

/**
 * 쿠폰 목록 응답
 */
export interface CouponListResponse {
  success: true;
  message: string;
  data: {
    content: Coupon[];
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
  code: number;
}

/**
 * 쿠폰 단건 응답
 */
export interface CouponResponse {
  success: true;
  message: string;
  data: Coupon;
  timestamp: string;
  code: number;
}
