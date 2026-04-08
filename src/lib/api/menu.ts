/**
 * Menu API Service
 * 쇼핑몰 메뉴 관련 API 호출 함수
 */

import { api } from '../api';
import type { ApiResponse } from '../api';

/**
 * 메뉴 아이템 인터페이스 (서버 API 응답 형식)
 */
export interface MenuItem {
  id: string;
  name: string;
  code: string;
  level: number;
  parentId: string | null;
  displayOrder: number;
  visible: boolean;
  iconUrl?: string;
  routePath?: string;
}

/**
 * 상위 메뉴 생성 요청 DTO
 */
export interface MenuCreateRequest {
  name: string;
  code: string;
  level: number;
  displayOrder: number;
  visible: boolean;
}

/**
 * 하위 메뉴 생성 요청 DTO
 */
export interface SubMenuCreateRequest {
  name: string;
  code: string;
  level: number;
  displayOrder: number;
  visible: boolean;
  routePath?: string;
}

/**
 * 메뉴 수정 요청 DTO
 */
export interface MenuUpdateRequest {
  name?: string;
  code?: string;
  level?: number;
  displayOrder?: number;
  visible?: boolean;
  iconUrl?: string;
  routePath?: string;
}

/**
 * 메뉴 조회 쿼리 파라미터
 */
export interface MenuListQuery {
  name?: string;
  code?: string;
}

/**
 * 1️⃣ 메뉴 전체 조회 (Admin)
 * GET /api/admin/menu/menuCategory
 */
export async function getMenuList(query?: MenuListQuery): Promise<ApiResponse<MenuItem[]>> {
  try {
    const params = new URLSearchParams();
    if (query?.name) params.append('name', query.name);
    if (query?.code) params.append('code', query.code);
    
    const queryString = params.toString();
    const url = queryString 
      ? `/api/admin/menu/menuCategory?${queryString}`
      : '/api/admin/menu/menuCategory';
    
    const response = await api.get<MenuItem[]>(url);
    return response;
  } catch (error) {
    let errorMessage = 'Failed to fetch menu list';
    let errorCode = 'FETCH_ERROR';
    
    if (error instanceof Error) {
      if (error.message.includes('aborted') || error.message.includes('timeout')) {
        errorMessage = '서버 응답 시간 초과 (10초). 서버 상태를 확인해주세요.';
        errorCode = 'TIMEOUT_ERROR';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = '서버에 연결할 수 없습니다. 네트워크 연결 또는 서버 상태를 확인해주세요.';
        errorCode = 'CONNECTION_ERROR';
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      success: false,
      data: null,
      message: errorMessage,
      timestamp: new Date().toISOString(),
      errorCode: errorCode,
    };
  }
}

/**
 * 2️⃣ SHOP 전시 메뉴 조회 (Front)
 * GET /api/shop/menus
 */
export async function getShopMenus(): Promise<ApiResponse<MenuItem[]>> {
  try {
    const response = await api.get<MenuItem[]>('/api/shop/menus');
    return response;
  } catch (error) {
    // API 
    return {
      success: true,
      data: [],
      message: 'Failed to fetch shop menus from server',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 3️⃣ 상위 메뉴 생성
 * POST /api/admin/menu/menuCategory
 */
export async function createMenu(data: MenuCreateRequest): Promise<ApiResponse<MenuItem>> {
  try {
    return await api.post<MenuItem>('/api/admin/menu/menuCategory', data);
  } catch (error) {
    throw error;
  }
}

/**
 * 4️⃣ 하위 메뉴 생성
 * POST /api/admin/menu/menuCategory/sub/{parentId}
 */
export async function createSubMenu(parentId: string, data: SubMenuCreateRequest): Promise<ApiResponse<MenuItem>> {
  try {
    return await api.post<MenuItem>(`/api/admin/menu/menuCategory/sub/${parentId}`, data);
  } catch (error) {
    throw error;
  }
}

/**
 * 5️⃣ 메뉴 정보 수정
 * PATCH /api/admin/menu/menuCategory/{id}
 */
export async function updateMenu(id: string, data: MenuUpdateRequest): Promise<ApiResponse<MenuItem>> {
  try {
    return await api.patch<MenuItem>(`/api/admin/menu/menuCategory/${id}`, data);
  } catch (error) {
    throw error;
  }
}

/**
 * 6️⃣ 메뉴 삭제
 * DELETE /api/admin/menu/menuCategory/{id}
 */
export async function deleteMenu(id: string): Promise<ApiResponse<void>> {
  try {
    return await api.delete<void>(`/api/admin/menu/menuCategory/${id}`);
  } catch (error) {
    throw error;
  }
}

/**
 * 7️⃣ 메뉴 활성화/비활성화 토글
 * PATCH /api/admin/menu/menuCategory/visible/{id}/{visible}
 */
export async function updateMenuVisibility(id: string, visible: boolean): Promise<ApiResponse<MenuItem>> {
  try {
    return await api.patch<MenuItem>(`/api/admin/menu/menuCategory/visible/${id}/${visible}`);
  } catch (error) {
    throw error;
  }
}

/**
 * 8️⃣ 메뉴 순서 직접 변경
 * PATCH /api/admin/menu/menuCategory/displayOrder/{id}/{displayOrder}
 */
export async function updateMenuDisplayOrder(id: string, displayOrder: number): Promise<ApiResponse<MenuItem>> {
  try {
    return await api.patch<MenuItem>(`/api/admin/menu/menuCategory/displayOrder/${id}/${displayOrder}`);
  } catch (error) {
    throw error;
  }
}

/**
 * 9️⃣ 메뉴 순서 위로 이동
 * PATCH /api/admin/menu/menuCategory/displayOrder/up/{id}
 */
export async function moveMenuUp(id: string): Promise<ApiResponse<MenuItem>> {
  try {
    return await api.patch<MenuItem>(`/api/admin/menu/menuCategory/displayOrder/up/${id}`);
  } catch (error) {
    throw error;
  }
}

/**
 * 🔟 메뉴 순서 아래로 이동
 * PATCH /api/admin/menu/menuCategory/displayOrder/down/{id}
 */
export async function moveMenuDown(id: string): Promise<ApiResponse<MenuItem>> {
  try {
    return await api.patch<MenuItem>(`/api/admin/menu/menuCategory/displayOrder/down/${id}`);
  } catch (error) {
    throw error;
  }
}