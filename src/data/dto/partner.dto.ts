/**
 * 파트너 관리 DTO
 * Partner Management Data Transfer Objects
 */

/**
 * 파트너 상태
 */
export enum PartnerStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  PENDING = "PENDING",
  SUSPENDED = "SUSPENDED",
}

/**
 * 파트너 타입
 */
export enum PartnerType {
  FIELD_MANAGER = "FIELD_MANAGER", // 
  PARTNER = "PARTNER", // 
}

/**
 * 할인 정책 타입
 */
export enum DiscountType {
  PERCENTAGE = "퍼센트",
  FIXED = "고정금액",
  BUNDLE = "묶음할인",
}

/**
 * 파트너 기본 정보
 */
export interface Partner {
  id: string;
  code: string; // 
  name: string; // 
  type: PartnerType; // 
  ticketCodeType?: string; // (NUMBER, BARCODE, QR)
  status: PartnerStatus; // 
  
  // 
  managerName?: string; // 
  managerEmail?: string;
  managerPhone?: string;
  
  // 
  contractStartDate: string;
  contractEndDate: string;
  commissionRate: number; // (%)
  
  // 
  couponCode: boolean; // true: , false: 
  
  // 
  productCount: number; // () 
  lastOrderDate?: string; // 
  totalSales: number; // 
  totalOrders: number; // 
  
  // 
  businessNumber?: string; // 
  address?: string;
  description?: string;
  logoUrl?: string;

  createdAt: string;
  updatedAt: string;
}

/**
 * 파트너 할인 정책
 */
export interface PartnerDiscountPolicy {
  id: string;
  partnerId: string;
  name: string; // 
  type: DiscountType;
  discountValue: number; // (% )
  minPurchaseAmount?: number; // 
  maxDiscountAmount?: number; // 
  startDate: string;
  endDate: string;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 파트너 적용 상품
 */
export interface PartnerProduct {
  id: string;
  partnerId: string;
  productId: string;
  productName: string;
  categoryName: string;
  price: number;
  stock: number;
  salesCount: number; // 
  revenue: number; // 
  salesStatus: string; // (, , , )
  registeredAt: string;
}

/**
 * 파트너 판매 현황 통계
 */
export interface PartnerSalesStats {
  partnerId: string;
  period: string; // (YYYY-MM)
  
  // 
  totalRevenue: number;
  totalOrders: number;
  totalTickets: number;
  averageOrderValue: number;
  
  // 
  topProducts: {
    productId: string;
    productName: string;
    sales: number;
    revenue: number;
  }[];
  
  // 
  dailySales: {
    date: string;
    revenue: number;
    orders: number;
  }[];
  
  // 
  categoryBreakdown: {
    categoryName: string;
    revenue: number;
    percentage: number;
  }[];
}

/**
 * 파트너 생성 DTO
 */
export interface CreatePartnerDto {
  code: string;
  name: string;
  type: PartnerType;
  status: PartnerStatus;
  managerName?: string;
  managerEmail?: string;
  managerPhone?: string;
  contractStartDate: string;
  contractEndDate: string;
  commissionRate: number;
  couponCode?: boolean; // true
  productCount?: number;
  lastOrderDate?: string;
  totalSales?: number;
  totalOrders?: number;
  businessNumber?: string;
  address?: string;
  description?: string;
  logoUrl?: string;
}

/**
 * 파트너 수정 DTO
 */
export interface UpdatePartnerDto {
  name?: string;
  type?: PartnerType;
  status?: PartnerStatus;
  managerName?: string;
  managerEmail?: string;
  managerPhone?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  commissionRate?: number;
  couponCode?: boolean;
  businessNumber?: string;
  address?: string;
  description?: string;
  logoUrl?: string;
}

/**
 * API Response Types
 */
import { ApiResponse, PagedResponse } from './utils';

export type PartnerResponse = ApiResponse<Partner>;
export type PartnerListResponse = ApiResponse<PagedResponse<Partner>>;
export type PartnerDiscountPolicyResponse = ApiResponse<PartnerDiscountPolicy>;
export type PartnerDiscountPolicyListResponse = ApiResponse<PartnerDiscountPolicy[]>;
export type PartnerProductListResponse = ApiResponse<PagedResponse<PartnerProduct>>;
export type PartnerSalesStatsResponse = ApiResponse<PartnerSalesStats>;