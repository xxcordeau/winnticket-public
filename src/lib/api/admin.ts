/**
 * 관리자 API
 */

import { getApiBaseUrl } from '../config';
import { api } from '../api';
import type { ApiResponse } from './auth';

/**
 * 대시보드 통계 데이터
 */
export interface DashboardData {
  // 상품 통계
  productCount: number;              // 전체 상품 수
  onSaleProductCount: number;        // 판매중 상품 수
  readyProductCount: number;         // 준비중 상품 수
  
  // 파트너 통계
  partnerCount: number;              // 전체 파트너 수
  activePartnerCount: number;        // 활성 파트너 수
  inactivePartnerCount: number;      // 비활성 파트너 수
  
  // 주문 통계
  totalOrderCount: number;           // 전체 주문 수
  orderCount: number;                // 주문 완료 수
  cancelOrderCount: number;          // 취소 주문 수
  
  // 이번달 주문 통계
  thisMonthTotalOrderCount: number;  // 이번달 전체 주문 수
  thisMonthOrderCount: number;       // 이번달 주문 완료 수
  thisMonthCancelOrderCount: number; // 이번달 주문 취소 수
  
  // 파트너별 매출 현황
  partnerSales: PartnerSales[];
  
  // 카테고리별 상품
  categoryProducts: CategoryProduct[];
  
  // 상위 판매 상품
  topProducts: TopProduct[];
  
  // 일별 매출 (차트용)
  dailySales: DailySales[];
}

/**
 * 파트너별 매출 현황
 */
export interface PartnerSales {
  partnerName: string;    // 파트너명
  productCount: number;   // 상품 수
  orderCount: number;     // 주문 수
  salesAmount: number;    // 매출
  netProfit: number;      // 순이익
}

/**
 * 카테고리별 상품
 */
export interface CategoryProduct {
  categoryName: string;   // 카테고리명
  productCount: number;   // 상품 수
}

/**
 * 상위 판매 상품
 */
export interface TopProduct {
  productId: string;      // 상품 ID
  productName: string;    // 상품명
  orderCount: number;     // 판매 수
}

/**
 * 일별 매출
 */
export interface DailySales {
  date: string;           // 날짜 (YYYY-MM-DD)
  orderCount: number;     // 주문 수
  salesAmount: number;    // 매출액
  netProfit: number;      // 순이익
}

/**
 * 대시보드 조회 기간
 */
export type DashboardPeriod = 'week' | 'month' | 'year';

/**
 * 대시보드 통계 조회
 * GET /api/admin/dashboard
 * 
 * @param period - 조회 기간 (week, month, year)
 * @returns 대시보드 통계 데이터
 */
export async function getAdminDashboard(
  period: DashboardPeriod = 'week'
): Promise<ApiResponse<DashboardData>> {
  try {
    console.log('📊 [관리자 대시보드] API 호출:', `/api/admin/dashboard?period=${period}`);

    // ⭐ api.get() 사용하여 Authorization 헤더 자동 추가
    const result = await api.get<DashboardData>('/api/admin/dashboard', { period });
    
    if (result.success) {
      console.log('✅ [관리자 대시보드] 조회 성공:', {
        productCount: result.data?.productCount,
        partnerCount: result.data?.partnerCount,
        totalOrderCount: result.data?.totalOrderCount,
      });
    } else {
      console.warn('⚠️ [관리자 대시보드] 조회 실패:', result.message);
    }

    return result;
  } catch (error) {
    console.error('❌ [관리자 대시보드] API 에러:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'API 호출 실패',
      data: null,
    };
  }
}