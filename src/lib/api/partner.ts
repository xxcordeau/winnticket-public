/**
 * 파트너 관리 API
 * Base URL: /api
 */

import { api } from './index';

// ============================================
// 
// ============================================

/**
 * 파트너 타입
 */
export type PartnerType = 'VENUE' | 'PROMOTER' | 'AGENCY' | 'ARTIST' | 'CORPORATE';

/**
 * 파트너 상태
 */
export type PartnerStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';

/**
 * 파트너 목록 아이템
 */
export interface PartnerListItem {
  id: string; // ID (UUID) - 
  code: string;
  name: string;
  type: PartnerType;
  managerName: string;
  status: PartnerStatus;
  contractStartDate: string;
  contractEndDate: string;
  commissionRate: number;
  visible: boolean;
}

/**
 * 파트너 상세 정보 (API 응답)
 */
export interface PartnerDetailResponse {
  code: string;
  name: string;
  type: PartnerType;
  commissionRate: number;
  businessNumber: string;
  address: string;
  managerName: string;
  managerEmail: string;
  managerPhone: string;
  contractStartDate: string;
  contractEndDate: string;
}

/**
 * 파트너 상세 정보
 */
export interface PartnerDetail {
  code: string;
  name: string;
  type: PartnerType;
  status: PartnerStatus;
  businessNumber: string;
  address: string;
  managerName: string;
  managerEmail: string;
  managerPhone: string;
  contractStartDate: string;
  contractEndDate: string;
  commissionRate: number;
  logoUrl: string;
  couponCode: boolean;
  description: string;
  visible?: boolean;
}

/**
 * 파트너 등록/수정 요청
 */
export interface PartnerRequest {
  code: string;
  name: string;
  type: PartnerType;
  ticketCodeType?: string; // "NUMBER" | "BARCODE" | "QR" 
  status: PartnerStatus;
  businessNumber: string;
  address: string;
  managerName: string;
  managerEmail: string;
  managerPhone: string;
  contractStartDate: string; // "YYYY-MM-DD"
  contractEndDate: string;   // "YYYY-MM-DD"
  commissionRate: number;
  logoUrl?: string;
  couponCode: boolean;
  description: string;
}

/**
 * 현장관리자 목록 아이템
 */
export interface FieldManagerListItem {
  id?: string;
  userName: string;
  name: string;
  email: string;
  phone: string;
  active: boolean;
  createdAt: string;
}

/**
 * 현장관리자 상세 정보
 */
export interface FieldManagerDetail {
  id?: string;
  userName: string;
  password?: string;
  name: string;
  email: string;
  phone: string;
  partnerName: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  roleIds: number[];
}

/**
 * 현장관리자 등록 요청
 */
export interface FieldManagerCreateRequest {
  userName: string;
  password: string;
  name: string;
  email: string;
  phone: string;
  active: boolean;
}

/**
 * 현장관리자 수정 요청
 */
export interface FieldManagerUpdateRequest {
  userName: string;
  password?: string;
  name: string;
  email: string;
  phone: string;
  active: boolean;
}

/**
 * 비밀번호 초기화 요청
 */
export interface ResetPasswordRequest {
  newPassword: string;
}

/**
 * 비밀번호 변경 요청
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * 판매 현황 - TOP 상품
 */
export interface TopProduct {
  productCode: string;
  productName: string;
  revenue: number;
  tickets: number;
}

/**
 * 판매 현황 - 요약 정보
 */
export interface SalesSummary {
  totalRevenue: number;
  totalOrders: number;
  totalTickets: number;
  averageOrderValue: number;
}

/**
 * 판매 현황 - 일별 매출
 */
export interface DailySales {
  date: string;
  revenue: number;
}

/**
 * 카테고리별 매출 - 카테고리별 매출
 */
export interface CategorySales {
  category: string;
  revenue: number;
}

/**
 * 파트너 적용 상품 아이템
 */
export interface PartnerProductItem {
  productId: string;
  optionValueId?: string;
  productName: string;
  optionValue?: string;
  categoryName: string;
  price: number;
  stock: number;
  salesCount: number;
  totalSalesAmount: number;
  salesStatus: string;
}

/**
 * API 응답 타입
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
}

// ============================================
// 
// ============================================

const DUMMY_PARTNERS: PartnerListItem[] = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    code: 'VENUE001',
    name: '올림픽공원 체조경기장',
    type: 'VENUE',
    managerName: '김영희',
    status: 'ACTIVE',
    contractStartDate: '2024-01-01T00:00:00Z',
    contractEndDate: '2024-12-31T23:59:59Z',
    commissionRate: 15,
    visible: true,
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174001',
    code: 'PROMOTER001',
    name: '예스24 라이브홀',
    type: 'PROMOTER',
    managerName: '이철수',
    status: 'ACTIVE',
    contractStartDate: '2024-01-01T00:00:00Z',
    contractEndDate: '2024-12-31T23:59:59Z',
    commissionRate: 12,
    visible: true,
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174002',
    code: 'AGENCY001',
    name: 'SM엔터테인먼트',
    type: 'AGENCY',
    managerName: '박민수',
    status: 'ACTIVE',
    contractStartDate: '2024-01-01T00:00:00Z',
    contractEndDate: '2024-12-31T23:59:59Z',
    commissionRate: 10,
    visible: true,
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174003',
    code: 'VENUE002',
    name: '세종문화회관',
    type: 'VENUE',
    managerName: '정수진',
    status: 'ACTIVE',
    contractStartDate: '2024-02-01T00:00:00Z',
    contractEndDate: '2025-01-31T23:59:59Z',
    commissionRate: 18,
    visible: true,
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174004',
    code: 'ARTIST001',
    name: 'BTS 공식 에시',
    type: 'ARTIST',
    managerName: '최지훈',
    status: 'ACTIVE',
    contractStartDate: '2024-01-01T00:00:00Z',
    contractEndDate: '2025-12-31T23:59:59Z',
    commissionRate: 8,
    visible: true,
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174005',
    code: 'CORPORATE001',
    name: '현대카드 DIVE',
    type: 'CORPORATE',
    managerName: '강민호',
    status: 'PENDING',
    contractStartDate: '2024-03-01T00:00:00Z',
    contractEndDate: '2024-12-31T23:59:59Z',
    commissionRate: 20,
    visible: true,
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174006',
    code: 'VENUE003',
    name: '롯데콘서트홀',
    type: 'VENUE',
    managerName: '윤서연',
    status: 'INACTIVE',
    contractStartDate: '2023-01-01T00:00:00Z',
    contractEndDate: '2023-12-31T23:59:59Z',
    commissionRate: 16,
    visible: false,
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174007',
    code: 'PROMOTER002',
    name: '인터파크 티켓',
    type: 'PROMOTER',
    managerName: '송민재',
    status: 'ACTIVE',
    contractStartDate: '2024-01-15T00:00:00Z',
    contractEndDate: '2024-12-31T23:59:59Z',
    commissionRate: 13,
    visible: true,
  },
];

// ============================================
// API
// ============================================

/**
 * 2-2. 파트너 목록 조회
 * GET /api/admin/partners
 */
export async function getPartners(params?: {
  code?: string;
  name?: string;
  visible?: boolean;
}): Promise<ApiResponse<PartnerListItem[]>> {
  try {
    const queryParams: string[] = [];
    if (params?.code) queryParams.push(`code=${encodeURIComponent(params.code)}`);
    if (params?.name) queryParams.push(`name=${encodeURIComponent(params.name)}`);
    if (params?.visible !== undefined) queryParams.push(`visible=${params.visible}`);
    
    const url = queryParams.length > 0 
      ? `/api/admin/partners?${queryParams.join('&')}`
      : '/api/admin/partners';
    
    const response = await api.get<PartnerListItem[]>(url);
    return response;
  } catch (error) {
    // 
    let filteredData = [...DUMMY_PARTNERS];
    
    // 
    if (params?.code) {
      const code = params.code.toLowerCase();
      filteredData = filteredData.filter(p => p.code.toLowerCase().includes(code));
    }
    if (params?.name) {
      const name = params.name.toLowerCase();
      filteredData = filteredData.filter(p => p.name.toLowerCase().includes(name));
    }
    if (params?.visible !== undefined) {
      filteredData = filteredData.filter(p => p.visible === params.visible);
    }
    
    return {
      success: true,
      data: filteredData,
      message: '더미 데이터를 사용합니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 2-3. 파트너 등록
 * POST /api/admin/partners
 */
export async function createPartner(partner: PartnerRequest): Promise<ApiResponse<PartnerDetail>> {
  try {
    const response = await api.post<PartnerDetail>(`/api/admin/partners`, partner);
    return response;
  } catch (error) {
    return {
      success: false,
      data: null as any,
      message: error instanceof Error ? error.message : '파트너 등록에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 2-4. 파트너 상세 조회
 * GET /api/admin/partners/{id}
 */
export async function getPartnerDetail(id: string): Promise<ApiResponse<PartnerDetail>> {
  try {
    const response = await api.get<PartnerDetail>(`/api/admin/partners/${id}`);
    return response;
  } catch (error) {
    // API ( )
    return {
      success: false,
      data: null as any,
      message: error instanceof Error ? error.message : '파트너 상세 조회에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 2-5. 파트너 삭제
 * DELETE /api/admin/partners/{id}
 */
export async function deletePartner(id: string): Promise<ApiResponse<void>> {
  try {
    const response = await api.delete<void>(`/api/admin/partners/${id}`);
    return response;
  } catch (error) {
    return {
      success: false,
      data: undefined,
      message: error instanceof Error ? error.message : '파트너 삭제에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 2-6. 파트너 수정
 * PATCH /api/admin/partners/{id}
 */
export async function updatePartner(id: string, partner: PartnerRequest): Promise<ApiResponse<PartnerDetail>> {
  try {
    const response = await api.patch<PartnerDetail>(`/api/admin/partners/${id}`, partner);
    return response;
  } catch (error) {
    return {
      success: false,
      data: null as any,
      message: 'local_fallback',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 2-7. 파트너 활성/비활성 토글
 * PATCH /api/admin/partners/status/{id}
 */
export async function togglePartnerStatus(id: string, status: PartnerStatus): Promise<ApiResponse<void>> {
  try {
    // API (api )
    const response = await api.patch<void>(`/api/admin/partners/status/${id}`, status);
    return response;
  } catch (error) {
    
    // API ( )
    return {
      success: true,
      data: undefined,
      message: '파트너 상태가 변경되었습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 2-1. 파트너 복구
 * PUT /api/admin/partners/restore/{id}
 */
export async function restorePartner(id: string): Promise<ApiResponse<void>> {
  try {
    const response = await api.put<void>(`/api/admin/partners/restore/${id}`, {});
    return response;
  } catch (error) {
    return {
      success: false,
      data: undefined,
      message: error instanceof Error ? error.message : '파트너 복구에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

// ============================================
// API
// ============================================

/**
 * 1-3. 현장관리자 목록 조회
 * GET /api/admin/partners/{partnerId}/fieldManager
 */
export async function getFieldManagers(partnerId: string): Promise<ApiResponse<FieldManagerListItem[]>> {
  try {
    const response = await api.get<FieldManagerListItem[]>(
      `/api/admin/partners/${partnerId}/fieldManager`
    );
    return response;
  } catch (error) {
    // API ( )
    return {
      success: false,
      data: [],
      message: error instanceof Error ? error.message : '현장관리자 목록 조회에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 1-4. 현장관리자 추가
 * POST /api/admin/partners/{partnerId}/fieldManager
 */
export async function createFieldManager(
  partnerId: string,
  manager: FieldManagerCreateRequest
): Promise<ApiResponse<FieldManagerDetail>> {
  try {
    const response = await api.post<FieldManagerDetail>(
      `/api/admin/partners/${partnerId}/fieldManager`,
      manager
    );
    return response;
  } catch (error) {
    return {
      success: false,
      data: null as any,
      message: error instanceof Error ? error.message : '현장관리자 추가에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 1-5. 현장관리자 상세 조회
 * GET /api/admin/partners/{partnerId}/fieldManager/{id}
 */
export async function getFieldManagerDetail(
  partnerId: string,
  id: string
): Promise<ApiResponse<FieldManagerDetail>> {
  try {
    const response = await api.get<FieldManagerDetail>(
      `/api/admin/partners/${partnerId}/fieldManager/${id}`
    );
    return response;
  } catch (error) {
    return {
      success: false,
      data: null as any,
      message: error instanceof Error ? error.message : '현장관리자 상세 조회에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 1-6. 현장관리자 삭제
 * DELETE /api/admin/partners/{partnerId}/fieldManager/{id}
 */
export async function deleteFieldManager(partnerId: string, id: string): Promise<ApiResponse<void>> {
  try {
    const response = await api.delete<void>(
      `/api/admin/partners/${partnerId}/fieldManager/${id}`
    );
    return response;
  } catch (error) {
    return {
      success: false,
      data: undefined,
      message: error instanceof Error ? error.message : '현장관리자 삭제에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 1-7. 현장관리자 수정
 * PATCH /api/admin/partners/{partnerId}/fieldManager/{id}
 */
export async function updateFieldManager(
  partnerId: string,
  id: string,
  manager: FieldManagerUpdateRequest
): Promise<ApiResponse<FieldManagerDetail>> {
  try {
    const response = await api.patch<FieldManagerDetail>(
      `/api/admin/partners/${partnerId}/fieldManager/${id}`,
      manager
    );
    return response;
  } catch (error) {
    return {
      success: false,
      data: null as any,
      message: error instanceof Error ? error.message : '현장관리자 수정에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 1-1. 비밀번호 초기화
 * PUT /api/admin/partners/{partnerId}/fieldManager/{id}/resetPassword
 */
export async function resetFieldManagerPassword(
  partnerId: string,
  id: string,
  request: ResetPasswordRequest
): Promise<ApiResponse<void>> {
  try {
    const response = await api.put<void>(
      `/api/admin/partners/${partnerId}/fieldManager/${id}/resetPassword`,
      request
    );
    return response;
  } catch (error) {
    return {
      success: false,
      data: undefined,
      message: error instanceof Error ? error.message : '비밀번호 초기화에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 1-2. 비밀번호 수정
 * PUT /api/admin/partners/{partnerId}/fieldManager/{id}/password
 */
export async function changeFieldManagerPassword(
  partnerId: string,
  id: string,
  request: ChangePasswordRequest
): Promise<ApiResponse<void>> {
  try {
    const response = await api.put<void>(
      `/api/admin/partners/${partnerId}/fieldManager/${id}/password`,
      request
    );
    return response;
  } catch (error) {
    return {
      success: false,
      data: undefined,
      message: error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

// ============================================
// API
// ============================================

/**
 * 3-1. TOP 판매 상품 조회
 * GET /api/admin/partners/{partnerId}/stats/topProducts
 */
export async function getTopProducts(
  partnerId: string,
  startDate: string,
  endDate: string
): Promise<ApiResponse<TopProduct[]>> {
  try {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await api.get<TopProduct[]>(`/api/admin/partners/${partnerId}/stats/topProducts?${params}`);
    return response;
  } catch (error) {
    // API ( )
    return {
      success: false,
      data: [],
      message: 'Fallback to dummy data',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 3-2. 판매 요약 정보
 * GET /api/admin/partners/{partnerId}/stats/summary
 */
export async function getSalesSummary(
  partnerId: string,
  startDate: string,
  endDate: string
): Promise<ApiResponse<SalesSummary>> {
  try {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await api.get<SalesSummary>(`/api/admin/partners/${partnerId}/stats/summary?${params}`);
    return response;
  } catch (error) {
    // API ( )
    return {
      success: false,
      data: {
        totalRevenue: 0,
        totalOrders: 0,
        totalTickets: 0,
        averageOrderValue: 0,
      },
      message: 'Fallback to dummy data',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 3-3. 일별 매출 조회
 * GET /api/admin/partners/{partnerId}/stats/daily
 */
export async function getDailySales(
  partnerId: string,
  startDate: string,
  endDate: string
): Promise<ApiResponse<DailySales[]>> {
  try {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await api.get<DailySales[]>(`/api/admin/partners/${partnerId}/stats/daily?${params}`);
    return response;
  } catch (error) {
    // API ( )
    return {
      success: false,
      data: [],
      message: 'Fallback to dummy data',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 3-4. 카테고리별 매출 조회
 * GET /api/admin/partners/{partnerId}/stats/category
 */
export async function getCategorySales(
  partnerId: string,
  startDate: string,
  endDate: string
): Promise<ApiResponse<CategorySales[]>> {
  try {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await api.get<CategorySales[]>(`/api/admin/partners/${partnerId}/stats/category?${params}`);
    return response;
  } catch (error) {
    // API ( )
    return {
      success: false,
      data: [],
      message: 'Fallback to dummy data',
      timestamp: new Date().toISOString(),
    };
  }
}

// ============================================
// API
// ============================================

/**
 * 4-1. 파트너 적용 상품 + 옵션 조회
 * GET /api/admin/partners/{partnerId}/products
 */
export async function getPartnerProducts(partnerId: string): Promise<ApiResponse<PartnerProductItem[]>> {
  try {
    const response = await api.get<PartnerProductItem[]>(`/api/admin/partners/${partnerId}/products`);
    return response;
  } catch (error) {
    // API ( )
    return {
      success: false,
      data: [],
      message: 'Fallback to dummy data',
      timestamp: new Date().toISOString(),
    };
  }
}

// ============================================
// (legacy - )
// ============================================

export async function getPartnerSalesStats(
  partnerId: string,
  yearMonth: string
): Promise<ApiResponse<any>> {
  return {
    success: false,
    data: null,
    message: 'Legacy function - use individual stats endpoints',
    timestamp: new Date().toISOString(),
  };
}