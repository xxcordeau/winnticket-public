// 상품관리 관련 DTO 정의

import { ApiResponse, PagedResponse } from "./types";

/**
 * ============================================
 * 기본 타입 정의
 * ============================================
 */

/**
 * 판매 상태
 */
export enum SalesStatus {
  READY = "READY", // 준비중
  ON_SALE = "ON_SALE", // 판매중
  SOLD_OUT = "SOLD_OUT", // 품절
  ENDED = "ENDED", // 판매종료
}

/**
 * 상품 타입
 * - NORMAL: 일반 상품 (티켓, 굿즈 등)
 * - STAY: 숙박형 상품 (호텔, 패키지 등)
 */
export type ProductType = 'NORMAL' | 'STAY';

/**
 * 상품 기간 타입 (UI 표시용)
 * - DATED: 🗓 일자형 (특정 날짜에 사용, 예: 공연 티켓)
 * - PERIOD: ⏳ 유효기간형 (기간 내 사용, 예: 쿠폰, 이용권)
 * - RANGE: 🏨 기간형 (체크인/체크아웃, 예: 숙박, 렌탈)
 */
export type ProductPeriodType = 'DATED' | 'PERIOD' | 'RANGE';

/**
 * 채널 할인 상태
 */
export enum ChannelDiscountStatus {
  ACTIVE = "활성",
  INACTIVE = "비활성",
  EXPIRED = "만료",
  SCHEDULED = "예정",
}

/**
 * ============================================
 * 상품 옵션 관련
 * ============================================
 */

/**
 * 상품 옵션 값
 */
export interface ProductOptionValue {
  id: string;
  optionId?: string;
  value: string; // 값 (예: S, M, L 또는 빨강, 파랑)
  code: string; // 값 코드
  additionalPrice: number; // 추가 가격
  displayOrder?: number;
  visible?: boolean;
  stock?: number; // 재고 수량 (OVERRIDE 타입 옵션에서 사용)
  partnerSubCode?: string; // 파트너별도코드
}

/**
 * 상품 옵션
 */
export interface ProductOption {
  id: string;
  name: string; // 옵션명 (예: 사이즈, 색상, 용량, 좌석 등급)
  code: string; // 옵션코드
  priceType?: "ADDITIONAL" | "OVERRIDE"; // ⭐ 가격 타입 (옵션 레벨)
  values: ProductOptionValue[]; // 옵션값들
  required: boolean; // 필수여부
  displayOrder?: number;
  visible?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 상품 옵션 생성 DTO
 */
export interface CreateProductOptionDto {
  name: string;
  code: string;
  values: Omit<ProductOptionValue, "id" | "optionId">[];
  required: boolean;
  displayOrder: number;
  visible: boolean;
}

/**
 * 상품 옵션 수정 DTO
 */
export interface UpdateProductOptionDto {
  id: string;
  name?: string;
  code?: string;
  values?: ProductOptionValue[];
  required?: boolean;
  displayOrder?: number;
  visible?: boolean;
}

/**
 * ============================================
 * 날짜별 가격 관련 (STAY 타입 전용)
 * ============================================
 */

/**
 * 날짜별 가격 정
 * - 숙박형(STAY) 상품에서 사용
 * - 옵션값별로 날짜 범위와 가격을 설정
 * - 체크인/체크아웃 날짜에 따라 가격이 달라짐
 */
export interface DatePrice {
  id?: string;
  productId?: string;
  date?: string; // YYYY-MM-DD 형식 (개별 날짜, API 응답용)
  priceDate?: string; // YYYY-MM-DD 형식 (개별 날짜, API 응답용 - 백엔드 필드명)
  startDate?: string; // YYYY-MM-DD 형식 (체크인 가능 시작일)
  endDate?: string; // YYYY-MM-DD 형식 (체크인 가능 종료일)
  optionId?: string; // 옵션 ID (예: "좌석 등급", "객실 타입")
  optionName?: string; // 옵션명 (예: "좌석 등급")
  optionValueId: string; // 옵션값 ID (예: "VIP석", "디럭스 룸")
  optionValueName?: string; // 옵션값명 (예: "VIP석")
  price: number; // 1박 기본 가격
  discountPrice?: number; // 1박 할인 가격
  groupNo?: number; // 기간 그룹 번호 (서버에서 관리)
  createdAt?: string;
}

/**
 * 상품 기간 정보 (STAY 타입 전용)
 * - API 응답에서 반환되는 periods 배열 형식
 */
export interface ProductPeriod {
  groupNo: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  price: number;
  discountPrice?: number;
}

export interface ProductPeriodGroup {
  periodId: string;
  optionId: string;
  optionName: string;
  optionValueId: string;
  optionValueName: string;
  periods: ProductPeriod[];
}

/**
 * 날짜별 가격 생성 DTO
 */
export interface CreateDatePriceDto {
  productId: string;
  startDate: string;
  endDate: string;
  optionId: string;
  optionValueId: string;
  price: number;
  discountPrice?: number;
}

/**
 * 날짜별 가격 수정 DTO
 */
export interface UpdateDatePriceDto {
  startDate?: string;
  endDate?: string;
  price?: number;
  discountPrice?: number;
}

/**
 * ============================================
 * 채널별 할인 관련
 * ============================================
 */

/**
 * 채널별 할인 정보
 * - 멀티 채널 시스템에서 채널별로 다른 할인율 적용
 */
export interface ProductChannelDiscount {
  id: string;
  productId: string;
  channelId: string;
  channelName?: string; // 조인된 데이터
  discountRate: number; // 할인율 (%)
  salePrice: number; // 판매가 (자동 계산)
  startDate: string;
  endDate: string;
  status: ChannelDiscountStatus;
  visible: boolean; // 노출 여부
  createdAt: string;
  updatedAt: string;
}

/**
 * 채널별 할인 생성 DTO
 */
export interface CreateProductChannelDiscountDto {
  productId: string;
  channelId: string;
  discountRate: number;
  startDate: string;
  endDate: string;
  visible: boolean;
}

/**
 * 채널별 할인 수정 DTO
 */
export interface UpdateProductChannelDiscountDto {
  discountRate?: number;
  startDate?: string;
  endDate?: string;
  status?: ChannelDiscountStatus;
  visible?: boolean;
}

/**
 * ============================================
 * SMS 템플릿 관련
 * ============================================
 */

/**
 * SMS 자동 발송 템플릿
 * - 주문 상태별로 자동 발송되는 SMS 내용 관리
 */
export interface SmsTemplates {
  orderReceived?: string; // 주문접수시
  paymentConfirmed?: string; // 입금확인시
  ticketIssued?: string; // 발권완료시
  orderCancelled?: string; // 취소완료시
}

/**
 * ============================================
 * 상품 정보
 * ============================================
 */

/**
 * 상품 정보 (관리자 및 사용자 공통)
 */
export interface Product {
  id: string;
  code: string; // 상품코드 (자동 생성 또는 수동 입력)
  name: string;
  categoryId: string; // 메뉴 카테고리 ID
  categoryName?: string; // 카테고리명 (조인된 데이터)
  partnerId?: string; // 파트너 ID (티켓 공급사)
  partnerName?: string; // 파트너명 (조인된 데이터)
  
  // 상품 타입
  productType?: ProductType; // 상품 타입 (NORMAL: 기본형, STAY: 숙박형)
  prePurchased?: boolean; // 선사입형 여부
  
  // 가격 정보
  price: number; // 기본 가격
  discountPrice?: number; // 기본 할인 가격
  
  // 판매 정보
  salesStatus: SalesStatus; // 판매 상태
  salesStartDate?: string; // 판매 시작일 (YYYY-MM-DD)
  salesEndDate?: string; // 판매 종료일 (YYYY-MM-DD)
  stock: number; // 재고
  
  // 옵션 및 가격 설정
  options: ProductOption[]; // 이 상품의 옵션들 (각 상품별로 독립적)
  datePrices?: DatePrice[]; // 날짜별 가격 설정 (STAY 타입 전용)
  periods?: ProductPeriodGroup[]; // 기간별 가격 그룹 (STAY 타입 전용, API 응답용)
  channelDiscounts?: ProductChannelDiscount[]; // 채널별 할인 정보
  
  // 설명 및 이미지
  description: string;
  imageUrl?: string; // 대표 이미지 (하위 호환성)
  imageUrls?: string[]; // 상품 이미지 배열 (최대 4장)
  detailContent?: string; // 상세 설명 내용 (HTML 형식) - DOMPurify로 sanitize 필요
  
  // 추가 정보
  shippingInfo?: string; // 배송 정보 (예: "무료 배송 (50,000원 이상 구매 시)")
  warrantyInfo?: string; // 보증 정 (예: "100% 정품 보장")
  returnInfo?: string; // 반품/교환 정보 (예: "7일 이내 무료 반품")
  
  // SMS 자동 발송
  smsTemplates?: SmsTemplates; // SMS 자동 발송 템플릿
  
  // 배지
  isNew?: boolean; // 신상품 여부
  isBest?: boolean; // 베스트 상품 여부
  isSale?: boolean; // 특가 상품 여부
  
  // 노출 설
  visible: boolean; // 쇼핑몰 노출 여부
  displayOrder: number; // 진열 순서
  
  // 지역 및 티켓 분류
  regionCd?: number; // 지역코드
  ticketType?: number; // 티켓분류코드
  
  // 채널 관리
  excluded?: boolean; // 채널에서 제외 여부 (채널 상품 관리용)
  
  createdAt: string;
  updatedAt: string;
}

/**
 * 상품 생성 DTO
 */
export interface CreateProductDto {
  code?: string; // 백엔드에서 자동 생성하므로 옵션
  name: string;
  categoryId: string;
  categoryName?: string;
  partnerId?: string;
  productType?: ProductType; // 상품 타입 (기본값: NORMAL)
  price: number;
  discountPrice?: number;
  salesStatus: SalesStatus;
  salesStartDate?: string;
  salesEndDate?: string;
  stock: number;
  options?: ProductOption[];
  description: string;
  imageUrl?: string; // 대표 이미지 (하위 호환성)
  imageUrls?: string[]; // 상품 이미지 배열 (최대 4장)
  detailContent?: string; // 상세 설명 내용 (HTML)
  isNew?: boolean; // 신상품 여부
  isBest?: boolean; // 베스트 상품 여부
  isSale?: boolean; // 특가 상품 여부
  visible: boolean;
  displayOrder: number;
  regionCd?: number; // 지역코드
  ticketType?: number; // 티켓분류코드
  prePurchased?: boolean; // 선사입형 여부
}

/**
 * 상품 수정 DTO
 */
export interface UpdateProductDto {
  id: string;
  code?: string;
  name?: string;
  categoryId?: string;
  categoryName?: string;
  partnerId?: string;
  price?: number;
  discountPrice?: number;
  salesStatus?: SalesStatus;
  salesStartDate?: string;
  salesEndDate?: string;
  stock?: number;
  options?: ProductOption[];
  description?: string;
  imageUrl?: string; // 대표 이미지 (하위 호환성)
  imageUrls?: string[]; // 상품 이미지 배열 (최대 4장)
  detailContent?: string; // 상세 설명 내용 (HTML)
  isNew?: boolean; // 신상품 여부
  isBest?: boolean; // 베스트 상품 여부
  isSale?: boolean; // 특가 상품 여부
  visible?: boolean;
  displayOrder?: number;
}

/**
 * ============================================
 * API 응답 타입들
 * ============================================
 */

export type ProductOptionListResponse = ApiResponse<PagedResponse<ProductOption>>;
export type ProductOptionResponse = ApiResponse<ProductOption>;
export type ProductListResponse = ApiResponse<PagedResponse<Product>>;
export type ProductResponse = ApiResponse<Product>;
export type ProductChannelDiscountListResponse = ApiResponse<ProductChannelDiscount[]>;
export type ProductChannelDiscountResponse = ApiResponse<ProductChannelDiscount>;
export type DatePriceListResponse = ApiResponse<DatePrice[]>;
export type DatePriceResponse = ApiResponse<DatePrice>;

/**
 * ============================================
 * 사용 예시 및 설명
 * ============================================
 * 
 * ## 1. 일반 티켓 상품 (NORMAL 타입)
 * ```typescript
 * {
 *   productType: 'NORMAL',
 *   name: '2025 봄 콘서트',
 *   price: 150000,
 *   options: [
 *     {
 *       name: '좌석 등급',
 *       values: [
 *         { value: 'VIP석', additionalPrice: 50000 },
 *         { value: 'R석', additionalPrice: 0 },
 *         { value: 'S석', additionalPrice: -30000 }
 *       ]
 *     },
 *     {
 *       name: '공연 날짜',
 *       values: [
 *         { value: '2025-12-05 (목) 19:00', additionalPrice: 0 },
 *         { value: '2025-12-06 (금) 19:00', additionalPrice: 0 }
 *       ]
 *     }
 *   ]
 * }
 * ```
 * 
 * ## 2. 숙박형 상품 (STAY 타입)
 * ```typescript
 * {
 *   productType: 'STAY',
 *   name: '제주 오션뷰 호텔 + 공연 티켓 패키지',
 *   price: 299000, // 기본 가격 (참고용)
 *   options: [
 *     {
 *       name: '객실 타입',
 *       values: [
 *         { value: '디럭스 룸', additionalPrice: 0 },
 *         { value: '스위트 룸', additionalPrice: 100000 }
 *       ]
 *     }
 *   ],
 *   datePrices: [
 *     {
 *       startDate: '2025-01-01',
 *       endDate: '2025-01-31',
 *       optionId: 'opt-room-type',
 *       optionValueId: 'val-deluxe',
 *       price: 280000, // 1박 가격
 *       discountPrice: 250000
 *     },
 *     {
 *       startDate: '2025-01-01',
 *       endDate: '2025-01-31',
 *       optionId: 'opt-room-type',
 *       optionValueId: 'val-suite',
 *       price: 380000, // 1박 가격
 *       discountPrice: 350000
 *     }
 *   ]
 * }
 * ```
 * 
 * ## 3. 쇼핑몰에서 숙박형 상품 주문 플로우
 * 1. 사용자가 객실 타입 옵션 선택 (예: 디럭스 룸)
 * 2. 선택한 옵션의 datePrices를 기반으로 달력에 날짜별 가격 표시
 * 3. 체크인/체크아웃 날짜 범위 선택 (예: 1/15 ~ 1/17, 2박)
 * 4. 마지막 날(체크아웃일)을 제외한 날짜의 가격을 합산
 *    - 1/15: 280,000원
 *    - 1/16: 280,000원
 *    - 총합: 560,000원
 * 5. 주문서에 다음 정보 포함:
 *    - 상품명: 제주 오션뷰 호텔 + 공연 티켓 패키지
 *    - 옵션: 객실 타입: 디럭스 룸
 *    - 기간: 2025-01-15 ~ 2025-01-17 (2박)
 *    - 가격: 560,000원
 * 
 * ## 4. 채널별 할인 적용
 * - 멀티 채널 시스템에서 채널별로 다른 ���인율 적용 가능
 * - URL 파라미터: ?channel=CULTURE
 * - 문화복지채널에서 20% 추가 할인 적용 예시:
 *   - 원가: 280,000원
 *   - 할인가: 224,000원 (20% 할인)
 */