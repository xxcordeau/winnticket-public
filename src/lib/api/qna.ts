/**
 * QNA API Service
 * 1:1 문의 관련 API 호출 함수
 */

import { api } from '../api';
import type { ApiResponse } from '../api';
import type { QnaPost } from '../../data/dto/community.dto';

/**
 * QNA 통계 조회
 */
export interface QnaCountResponse {
  allCnt: number;
  pendingCnt: number;
  answeredCnt: number;
  blockedCnt: number;
}

export async function getQnaCount(): Promise<ApiResponse<QnaCountResponse>> {
  try {
    const response = await api.get<QnaCountResponse>('/api/community/qna/count');
    return response;
  } catch (error) {
    return {
      success: true,
      data: {
        allCnt: 0,
        pendingCnt: 0,
        answeredCnt: 0,
        blockedCnt: 0,
      },
      message: 'OK',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * QNA 목록 조회
 */
export interface QnaQueryParams {
  title?: string;
  keyword?: string;
  begDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  status?: 'ALL' | 'PENDING' | 'ANSWERED' | 'BLOCKED';
}

export async function getQnas(params?: QnaQueryParams): Promise<ApiResponse<QnaPost[]>> {
  try {
    // 쿼리 파라미터 생성
    const queryParams = new URLSearchParams();

    if (params?.title) {
      queryParams.append('title', params.title);
    }
    if (params?.keyword) {
      queryParams.append('keyword', params.keyword);
    }
    if (params?.begDate) {
      queryParams.append('begDate', params.begDate);
    }
    if (params?.endDate) {
      queryParams.append('endDate', params.endDate);
    }
    if (params?.status) {
      queryParams.append('status', params.status);
    }
    
    const queryString = queryParams.toString();
    const url = queryString 
      ? `/api/community/qna?${queryString}` 
      : '/api/community/qna';
    
    const response = await api.get<any[]>(url);
    
    // 서버 응답을 프론트엔드 DTO에 맞게 변환
    if (response.success && response.data) {
      const transformedData: QnaPost[] = response.data.map((item: any) => ({
        ...item,
        type: 'QNA' as const,
        status: item.status || 'PENDING', // 명시적으로 status 매핑
        isBlocked: item.blocked ?? item.isBlocked ?? false,
        blockedReason: item.blockedReason || '',
        blockedAt: item.blockedAt || '',
        authorId: item.authorId || item.authorName || '',
        authorName: item.authorName || item.authorId || '',
        views: item.views || 0,
        inquiryNumber: item.inquiryNumber || `INQ-${item.id?.slice(0, 8) || ''}`,
      }));
      
      return {
        ...response,
        data: transformedData,
      };
    }
    
    return response as ApiResponse<QnaPost[]>;
  } catch (error) {
    return {
      success: true,
      data: [],
      message: 'OK',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * QNA 상세 조회
 */
export async function getQnaById(id: string): Promise<ApiResponse<QnaPost>> {
  try {
    const response = await api.get<any>(`/api/community/qna/${id}`);
    
    // 서버 응답을 프론트엔드 DTO에 맞게 변환
    if (response.success && response.data) {
      const transformedData: QnaPost = {
        ...response.data,
        type: 'QNA' as const,
        status: response.data.status || 'PENDING', // 명시적으로 status 매핑
        isBlocked: response.data.blocked ?? response.data.isBlocked ?? false,
        authorId: response.data.authorId || response.data.authorName || '',
        authorName: response.data.authorName || response.data.authorId || '',
        views: response.data.views || 0,
        inquiryNumber: response.data.inquiryNumber || `INQ-${response.data.id?.slice(0, 8) || ''}`,
      };
      
      return {
        ...response,
        data: transformedData,
      };
    }
    
    return response as ApiResponse<QnaPost>;
  } catch (error) {
    return {
      success: false,
      data: null,
      message: '문의를 찾을 수 없습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * QNA 답변 등록/수정
 */
export async function answerQna(
  id: string,
  answer: string,
  answeredBy: string
): Promise<ApiResponse<QnaPost>> {
  try {
    const requestBody = {
      answer,
      answeredBy,
    };
    
    const response = await api.patch<QnaPost>(`/api/community/qna/${id}/answer`, requestBody);
    return response;
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '답변 등록에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * QNA 차단
 */
export async function blockQna(
  id: string,
  blockedReason: string,
  blockedBy: string
): Promise<ApiResponse<QnaPost>> {
  try {
    const requestBody = {
      blockedReason,
      blockedBy,
    };
    
    const response = await api.patch<QnaPost>(`/api/community/qna/${id}/block`, requestBody);
    return response;
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '차단에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * QNA 차단 해제
 */
export async function unblockQna(id: string): Promise<ApiResponse<QnaPost>> {
  try {
    const response = await api.patch<QnaPost>(`/api/community/qna/${id}/unblock`, {});
    return response;
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '차단 해제에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * QNA 조회수 증가
 */
export async function incrementQnaViewCount(id: string): Promise<ApiResponse<void>> {
  try {
    const response = await api.patch<void>(`/api/community/common/viewCount/${id}`, {});
    return response;
  } catch (error) {
    console.error('Failed to increment QnA view count:', error);
    return {
      success: false,
      data: undefined,
      message: error instanceof Error ? error.message : '조회수 증가에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * QNA 삭제
 */
export async function deleteQna(id: string): Promise<ApiResponse<void>> {
  try {
    const response = await api.delete<void>(`/api/community/qna/${id}`);
    return response;
  } catch (error) {
    return {
      success: false,
      data: undefined,
      message: error instanceof Error ? error.message : '문의 삭제에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}