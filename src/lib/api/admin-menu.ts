/**
 * Admin Menu API Service
 * 관리자 메뉴 관련 API 호출 함수
 */

import { api } from '../api';
import type { ApiResponse } from '../api';

/**
 * 관리자 메뉴 항목
 */
export interface AdminMenuItem {
  id: string;
  title: string;
  titleEn?: string;
  icon?: string;
  page: string;
  displayOrder: number;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 관리자 메뉴 생성 요청
 */
export interface AdminMenuInsertRequest {
  id?: string;
  title: string;
  titleEn?: string;
  icon?: string;
  page: string;
  displayOrder: number;
  visible: boolean;
}

/**
 * 관리자 메뉴 수정 요청
 */
export interface AdminMenuUpdateRequest {
  title?: string;
  titleEn?: string;
  icon?: string;
  page?: string;
  displayOrder?: number;
  visible?: boolean;
}

/**
 * 전체 관리자 메뉴 목록 조회
 * GET /api/admin/menu
 */
export async function getAdminMenuList(): Promise<ApiResponse<AdminMenuItem[]>> {
  try {
    const response = await api.get<AdminMenuItem[]>('/api/admin/menu');

    if (response.success) {
      console.log(`✅ [Admin Menu API] Successfully loaded ${response.data?.length || 0} menus`);
      return response;
    }

    throw new Error(response.message || 'API response unsuccessful');
  } catch (error) {
    console.error('❌ [Admin Menu API] Failed to load menus:', error);
    return {
      success: false,
      data: [],
      message: error instanceof Error ? error.message : 'API server not available',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 관리자 메뉴 생성
 * POST /api/admin/menu
 */
export async function insertAdminMenu(data: AdminMenuInsertRequest): Promise<ApiResponse<AdminMenuItem>> {
  try {
    console.log('🔄 Creating admin menu:', data);
    return await api.post<AdminMenuItem>('/api/admin/menu', data);
  } catch (error) {
    console.error('❌ Failed to insert admin menu:', error);
    throw error;
  }
}

/**
 * 관리자 메뉴 수정
 * PATCH /api/admin/menu/{id}
 */
export async function updateAdminMenu(id: string, data: Partial<AdminMenuUpdateRequest>): Promise<ApiResponse<AdminMenuItem>> {
  try {
    console.log('🔄 Updating admin menu:', { id, data });
    return await api.patch<AdminMenuItem>(`/api/admin/menu/${id}`, data);
  } catch (error) {
    console.error('❌ Failed to update admin menu:', error);
    throw error;
  }
}

/**
 * 관리자 메뉴 삭제
 * DELETE /api/admin/menu/{id}
 */
export async function deleteAdminMenu(id: string): Promise<ApiResponse<void>> {
  try {
    console.log('🔄 Deleting admin menu:', id);
    return await api.delete<void>(`/api/admin/menu/${id}`);
  } catch (error) {
    console.error('❌ Failed to delete admin menu:', error);
    throw error;
  }
}

/**
 * 관리자 메뉴 활성화/비활성화
 * PATCH /api/admin/menu/{id}/visible
 */
export async function updateAdminMenuVisibility(id: string, visible: boolean): Promise<ApiResponse<string>> {
  try {
    console.log('🔄 Updating admin menu visibility:', { id, visible });
    return await api.patch<string>(`/api/admin/menu/${id}/visible`, { visible });
  } catch (error) {
    console.error('❌ Failed to update admin menu visibility:', error);
    throw error;
  }
}

/**
 * 관리자 메뉴 순서 변경
 * PATCH /api/admin/menu/{id}/order
 */
export async function updateAdminMenuOrder(id: string, order: number): Promise<ApiResponse<string>> {
  try {
    console.log('🔄 Updating admin menu order:', { id, order });
    return await api.patch<string>(`/api/admin/menu/${id}/order`, { displayOrder: order });
  } catch (error) {
    console.error('❌ Failed to update admin menu order:', error);
    throw error;
  }
}

// Re-export for build cache invalidation
export type { AdminMenuItem, AdminMenuInsertRequest, AdminMenuUpdateRequest };
