/**
 * 팝업 관리 API
 * api 래퍼 사용 (Vite 프록시 경유, JWT 자동 첨부)
 */

import type { ApiResponse } from './auth';
import type {
  PopupResponse,
  PopupDetailResponse,
  PopupCreateRequest,
  PopupUpdateRequest,
  PopupPageResponse,
  PopupFilter,
} from '../../data/dto/popup.dto';
import { api } from '../api';

/**
 * 팝업 목록 조회 (관리자용)
 * GET /api/admin/popups
 */
export async function getPopups(
  filter: PopupFilter = {}
): Promise<ApiResponse<PopupPageResponse>> {
  try {
    const params: Record<string, string | number | boolean | undefined> = {};
    if (filter.keyword) params.keyword = filter.keyword;
    if (filter.visible !== undefined) params.visible = filter.visible;
    if (filter.page !== undefined) params.page = filter.page;
    if (filter.size !== undefined) params.size = filter.size;

    const response = await api.get<PopupPageResponse>('/api/admin/popups', params);
    return response;
  } catch (error) {
    console.error('[팝업 API] 목록 조회 실패:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '팝업 목록 조회에 실패했습니다',
      data: null,
    };
  }
}

/**
 * 팝업 상세 조회 (관리자용)
 * GET /api/admin/popups/{id}
 */
export async function getPopupDetail(
  id: string
): Promise<ApiResponse<PopupDetailResponse>> {
  try {
    const response = await api.get<PopupDetailResponse>(`/api/admin/popups/${id}`);
    return response;
  } catch (error) {
    console.error('[팝업 API] 상세 조회 실패:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '팝업 상세 조회에 실패했습니다',
      data: null,
    };
  }
}

/**
 * 팝업 생성 (관리자용)
 * POST /api/admin/popups
 */
export async function createPopup(
  request: PopupCreateRequest
): Promise<ApiResponse<PopupResponse>> {
  try {
    const response = await api.post<PopupResponse>('/api/admin/popups', request);
    return response;
  } catch (error) {
    console.error('[팝업 API] 생성 실패:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '팝업 생성에 실패했습니다',
      data: null,
    };
  }
}

/**
 * 팝업 수정 (관리자용)
 * PUT /api/admin/popups/{id}
 */
export async function updatePopup(
  id: string,
  request: PopupUpdateRequest
): Promise<ApiResponse<PopupResponse>> {
  try {
    const response = await api.put<PopupResponse>(`/api/admin/popups/${id}`, request);
    return response;
  } catch (error) {
    console.error('[팝업 API] 수정 실패:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '팝업 수정에 실패했습니다',
      data: null,
    };
  }
}

/**
 * 팝업 삭제 (관리자용)
 * DELETE /api/admin/popups/{id}
 */
export async function deletePopup(
  id: string
): Promise<ApiResponse<void>> {
  try {
    const response = await api.delete<void>(`/api/admin/popups/${id}`);
    return response;
  } catch (error) {
    console.error('[팝업 API] 삭제 실패:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '팝업 삭제에 실패했습니다',
      data: null,
    };
  }
}

/**
 * 팝업 노출 상태 토글 (관리자용)
 * PATCH /api/admin/popups/{id}/visible?visible={visible}
 */
export async function togglePopupVisible(
  id: string,
  visible: boolean
): Promise<ApiResponse<PopupResponse>> {
  try {
    const response = await api.patch<PopupResponse>(
      `/api/admin/popups/${id}/visible?visible=${visible}`,
      {}
    );
    return response;
  } catch (error) {
    console.error('[팝업 API] 노출 상태 변경 실패:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '팝업 노출 상태 변경에 실패했습니다',
      data: null,
    };
  }
}

/**
 * 팝업 이미지 업로드
 * POST /api/admin/common/files/upload (공통 파일 업로드 엔드포인트)
 */
export async function uploadPopupImage(
  file: File
): Promise<ApiResponse<string[]>> {
  try {
    const response = await api.upload<string[]>('/api/admin/common/files/upload', file, 'files');
    return response;
  } catch (error) {
    console.error('[팝업 API] 이미지 업로드 실패:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '이미지 업로드에 실패했습니다',
      data: null,
    };
  }
}

/**
 * 쇼핑몰용 팝업 조회
 * GET /api/shop/popups?channelCode={channelCode}&pagePath={pagePath}
 */
export async function getShopPopups(
  channelCode?: string,
  pagePath?: string
): Promise<ApiResponse<PopupResponse[]>> {
  try {
    const params: Record<string, string | undefined> = {};
    if (channelCode) params.channelCode = channelCode;
    if (pagePath) params.pagePath = pagePath;

    const response = await api.get<PopupResponse[]>('/api/shop/popups', params);
    return response;
  } catch (error) {
    console.error('[팝업 API] 쇼핑몰 팝업 조회 실패:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : '쇼핑몰 팝업 조회에 실패했습니다',
      data: null,
    };
  }
}

/**
 * "오늘 하루 보지 않기" 체크 여부 확인
 */
export function isPopupTodayClosed(popupId: string): boolean {
  const key = `popup_today_close_${popupId}`;
  const closedDate = localStorage.getItem(key);

  if (!closedDate) return false;

  const today = new Date().toDateString();
  return closedDate === today;
}

/**
 * "오늘 하루 보지 않기" 설정
 */
export function setPopupTodayClose(popupId: string): void {
  const key = `popup_today_close_${popupId}`;
  const today = new Date().toDateString();
  localStorage.setItem(key, today);
}
