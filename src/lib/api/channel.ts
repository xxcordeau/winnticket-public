/**
 * Channel API Service
 * 채널 관련 API 호출 함수 (실제 서버 API 연동)
 * API 베이스 URL: 
 *  - 개발: https://api.winnticket.store/api/admin/channels
 *  - 운영: https://api.winnticket.co.kr/api/admin/channels
 */

import { api } from '../api';
import type { ApiResponse } from '../api';
import { uploadFile } from './file';

/**
 * 채널 목록 조회 응답 DTO
 */
export interface ChannelListItem {
  id: string; // UUID (API )
  code: string;
  name: string;
  logoUrl: string;
  companyName: string;
  visible: boolean;
  domain: string;
  useCard: boolean; // 
  usePoint?: boolean; // 
}

/**
 * 채널 등록/수정 요청 DTO
 */
export interface ChannelRequest {
  code: string;
  name: string;
  companyName: string;
  commissionRate: number;
  logoUrl: string;
  faviconUrl: string;
  email: string;
  phone: string;
  domain: string;
  description: string;
  visible: boolean;
  useCard: boolean; // 
  usePoint?: boolean; // 
}

/**
 * 채널 기본 정보 응답 DTO
 */
export interface ChannelDetailResponse {
  id?: string; // UUID (API )
  code: string;
  name: string;
  companyName: string;
  commissionRate: number;
  visible: boolean;
  description?: string;
  logoUrl?: string;
  faviconUrl?: string;
  email?: string;
  phone?: string;
  domain?: string;
  useCard: boolean; // 
  usePoint?: boolean; // 
  createdAt: string;
  updatedAt: string;
}

/**
 * 공개 채널 정보 응답 DTO (주문용)
 * GET /api/channels/{code}
 */
export interface PublicChannelResponse {
  code: string;
  name: string;
  companyName: string;
  commissionRate: number;
  visible: boolean;
  description?: string;
  logoUrl?: string;
  faviconUrl?: string;
  email?: string;
  phone?: string;
  domain?: string;
  useCard: boolean; // 
  usePoint?: boolean; // 
  createdAt: string;
  updatedAt: string;
  id?: string; // UUID ( , code )
}

/**
 * 이미지 업로드 응답 DTO
 */
export interface ImageUploadResponse {
  url: string;
}

/**
 * 1. 채널 목록 조회
 * GET /api/admin/channels
 */
export async function getChannels(
  code?: string,
  name?: string,
  companyName?: string
): Promise<ApiResponse<ChannelListItem[]>> {
  try {
    const params = new URLSearchParams();
    if (code) params.append('code', code);
    if (name) params.append('name', name);
    if (companyName) params.append('companyName', companyName);

    const url = params.toString() 
      ? `/api/admin/channels?${params.toString()}`
      : '/api/admin/channels';

    
    const response = await api.get<ChannelListItem[]>(url);
    
    
    return response;
  } catch (error) {
    
    // ( )
    return {
      success: false,
      data: null,
      message: '로컬 데이터를 사용합니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 2. 채널 코드로 채널 조회 (쇼핑몰용)
 * GET /api/channels/{channelCode}
 * ⭐ 공개 API - 인증 불필요
 */
export async function getChannelByCode(code: string): Promise<ApiResponse<ChannelListItem | null>> {
  try {
    // API 
    const response = await api.get<PublicChannelResponse>(`/api/channels/${code}`);
    
    if (response.success && response.data) {
      // PublicChannelResponse ChannelListItem 
      const channelData: ChannelListItem = {
        id: response.data.id || response.data.code,
        code: response.data.code,
        name: response.data.name,
        logoUrl: response.data.logoUrl || '',
        companyName: response.data.companyName,
        visible: response.data.visible,
        domain: response.data.domain || '',
        useCard: response.data.useCard,
        usePoint: response.data.usePoint,
      };
      
      return {
        success: true,
        data: channelData,
        message: 'Success',
        timestamp: new Date().toISOString(),
      };
    }
    
    return {
      success: false,
      data: null,
      message: '채널을 찾을 수 없습니다',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '채널 조회에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 2-1. (주문용) 채널 기본 정보 조회
 * GET /api/channels/{code}
 * ⭐ 인증 불필요, 공개 API
 */
export async function getPublicChannelByCode(code: string): Promise<ApiResponse<PublicChannelResponse | null>> {
  try {
    const response = await api.get<PublicChannelResponse>(`/api/channels/${code}`);
    
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data,
        message: 'Success',
        timestamp: new Date().toISOString(),
      };
    }
    
    return {
      success: false,
      data: null,
      message: '채널을 찾을 수 없습니다',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '채널 조회에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 2-2. (주문용) 공개 채널 목록 조회
 * GET /api/admin/channels
 * ⭐ 관리자 API 사용
 */
export async function getPublicChannels(): Promise<ApiResponse<PublicChannelResponse[]>> {
  try {
    
    const response = await api.get<PublicChannelResponse[]>('/api/admin/channels');
    
    
    if (response.success && response.data) {
      return {
        success: true,
        data: Array.isArray(response.data) ? response.data : [],
        message: 'Success',
        timestamp: new Date().toISOString(),
      };
    }
    
    return {
      success: false,
      data: [],
      message: '채널 목록을 가져올 수 없습니다',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    
    // throw 
    return {
      success: false,
      data: [],
      message: '로컬 데이터를 사용합니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 3. 채널 상세 조회
 * GET /api/admin/channels/{id}
 */
export async function getChannelDetail(channelId: string): Promise<ApiResponse<ChannelDetailResponse>> {
  try {
    const response = await api.get<ChannelDetailResponse>(`/api/admin/channels/${channelId}`);
    return response;
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '채널 상세 조회에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 4. 채널 생성
 * POST /api/admin/channels
 */
export async function createChannel(channel: ChannelRequest): Promise<ApiResponse<void>> {
  try {
    const response = await api.post<void>('/api/admin/channels', channel);
    return response;
  } catch (error: any) {
    
    // ApiError 
    let errorMessage = '채널 생성에 실패했습니다';
    
    if (error?.response?.message) {
      // ApiError response 
      errorMessage = error.response.message;
    } else if (error?.message) {
      // Error 
      errorMessage = error.message;
    }
    
    
    return {
      success: false,
      data: null,
      message: errorMessage,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 5. 채널 수정
 * PATCH /api/admin/channels/{id}/info
 */
export async function updateChannel(
  channelId: string,
  channel: ChannelRequest
): Promise<ApiResponse<void>> {
  try {
    const response = await api.patch<void>(`/api/admin/channels/${channelId}/info`, channel);
    return response;
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '채널 수정에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 6. 채널 삭제
 * DELETE /api/admin/channels/{id}
 */
export async function deleteChannel(channelId: string): Promise<ApiResponse<void>> {
  try {
    const response = await api.delete<void>(`/api/admin/channels/${channelId}`);
    return response;
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '채널 삭제에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 7. 채널별 상품 제외
 * POST /api/admin/channels/{channelId}/exclude/{productId}
 */
export async function excludeProduct(
  channelId: string,
  productId: string
): Promise<ApiResponse<void>> {
  try {
    const response = await api.post<void>(
      `/api/admin/channels/${channelId}/exclude/${productId}`,
      {}
    );
    return response;
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '상품 제외에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 8. 채널별 상품 복구
 * POST /api/admin/channels/{channelId}/include/{productId}
 */
export async function includeProduct(
  channelId: string,
  productId: string
): Promise<ApiResponse<void>> {
  try {
    const response = await api.post<void>(
      `/api/admin/channels/${channelId}/include/${productId}`,
      {}
    );
    return response;
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '상품 복구에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 9. 채널 활성/비활성 상태 변경
 * PATCH /api/admin/channels/visible/{id}/{visible}
 */
export async function updateChannelVisibility(
  channelId: string,
  visible: boolean
): Promise<ApiResponse<void>> {
  try {
    const response = await api.patch<void>(
      `/api/admin/channels/visible/${channelId}/${visible}`,
      {}
    );
    return response;
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '채널 상태 변경에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 10. 이미지 업로드 (파일 업로드 API 활용)
 */
export async function uploadImage(file: File): Promise<ApiResponse<ImageUploadResponse>> {
  try {
    const response = await uploadFile(file);
    
    
    // response.data FileUploadResponse { fileUrl, fileName, fileSize, contentType }
    if (response.success && response.data && response.data.fileUrl) {
      return {
        success: true,
        data: { url: response.data.fileUrl }, // fileUrl 
        message: '이미지 업로드 성공',
        timestamp: new Date().toISOString(),
      };
    }
    
    
    return {
      success: false,
      data: null,
      message: response.message || '이미지 업로드에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '이미지 업로드에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

// Re-export types
export type { ChannelListItem, ChannelRequest, ChannelDetailResponse, ImageUploadResponse };