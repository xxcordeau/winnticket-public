/**
 * Inquiry API Service
 * 문의(QNA) 관련 API 호출 함수
 */

import { api } from '../api';
import type { ApiResponse } from '../api';

/**
 * 문의 인터페이스
 */
export interface Inquiry {
  id: string;
  category: string;
  title: string;
  content: string;
  author: string;
  email: string;
  phone?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  reply?: string;
  createdAt: string;
  updatedAt: string;
  repliedAt?: string;
}

/**
 * 문의 생성 요청 DTO
 */
export interface InquiryCreateRequest {
  category: string;
  title: string;
  content: string;
  author: string;
  email: string;
  phone?: string;
}

/**
 * QNA 카운트 응답
 */
export interface QnaCountResponse {
  pending: number;
  inProgress: number;
  completed: number;
  total: number;
}

/**
 * 문의 목록 조회
 */
export async function getInquiries(): Promise<ApiResponse<Inquiry[]>> {
  try {
    const response = await api.get<Inquiry[]>('/api/community/qna');
    return response;
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
 * 문의 상세 조회
 */
export async function getInquiryById(id: string): Promise<ApiResponse<Inquiry>> {
  try {
    const response = await api.get<Inquiry>(`/api/community/qna/${id}`);
    return response;
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
 * 문의 등록
 */
export async function createInquiry(inquiry: InquiryCreateRequest): Promise<ApiResponse<Inquiry>> {
  try {
    const response = await api.post<Inquiry>('/api/community/qna', inquiry);
    return response;
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '문의 등록에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 문의 수정 (답변 등록 포함)
 */
export async function updateInquiry(id: string, inquiry: Partial<Inquiry>): Promise<ApiResponse<Inquiry>> {
  try {
    const response = await api.patch<Inquiry>(`/api/community/qna/${id}`, inquiry);
    return response;
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '문의 수정에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 문의 답변 (간편 함수)
 */
export async function replyInquiry(id: string, reply: string): Promise<ApiResponse<Inquiry>> {
  return updateInquiry(id, { reply, status: 'COMPLETED' });
}

/**
 * 문의 상태 변경 (간편 함수)
 */
export async function updateInquiryStatus(
  id: string,
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
): Promise<ApiResponse<Inquiry>> {
  return updateInquiry(id, { status });
}

/**
 * 문의 삭제
 */
export async function deleteInquiry(id: string): Promise<ApiResponse<void>> {
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

/**
 * QNA 상태별 카운트 조회
 */
export async function getQnaCount(): Promise<ApiResponse<QnaCountResponse>> {
  try {
    const response = await api.get<QnaCountResponse>('/api/community/qna/count');
    return response;
  } catch (error) {
    return {
      success: true,
      data: {
        pending: 0,
        inProgress: 0,
        completed: 0,
        total: 0,
      },
      message: 'OK',
      timestamp: new Date().toISOString(),
    };
  }
}