/**
 * FAQ API Service
 * FAQ 관련 API 호출 함수
 */

import { api } from '../api';
import type { ApiResponse } from '../api';
import type { FaqPost } from '../../data/dto/community.dto';

/**
 * FAQ 목록 조회
 */
export async function getFAQs(params?: {
  title?: string;
  begDate?: string; // YYYY-MM-DD 형식
  endDate?: string; // YYYY-MM-DD 형식
}): Promise<ApiResponse<FaqPost[]>> {
  try {
    // Query parameter 구성
    const queryParams = new URLSearchParams();
    if (params?.title) queryParams.append('title', params.title);
    if (params?.begDate) queryParams.append('begDate', params.begDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const url = queryParams.toString() 
      ? `/api/community/faq?${queryParams.toString()}`
      : '/api/community/faq';
    
    const response = await api.get<any[]>(url);
    
    // 서버 응답을 프론트엔드 DTO에 맞게 변환
    if (response.success && response.data) {
      const transformedData: FaqPost[] = response.data.map((item: any) => ({
        ...item,
        type: 'FAQ' as const,
        isActive: item.active ?? item.isActive ?? true,
        authorId: item.authorId || item.authorName || '',
        authorName: item.authorName || item.authorId || '',
        views: item.views || 0,
        category: item.category || 'ORDER',
        // 서버의 title/content를 question/answer로 매핑
        question: item.question || item.title || '',
        answer: item.answer || item.content || '',
        title: item.title || item.question || '',
        content: item.content || item.answer || '',
      }));
      
      return {
        ...response,
        data: transformedData,
      };
    }
    
    return response as ApiResponse<FaqPost[]>;
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
 * FAQ 상세 조회
 */
export async function getFAQById(id: string): Promise<ApiResponse<FaqPost>> {
  try {
    const response = await api.get<any>(`/api/community/faq/${id}`);
    
    // 서버 응답을 프론트엔드 DTO에 맞게 변환
    if (response.success && response.data) {
      const transformedData: FaqPost = {
        ...response.data,
        type: 'FAQ' as const,
        isActive: response.data.active ?? response.data.isActive ?? true,
        authorId: response.data.authorId || response.data.authorName || '',
        authorName: response.data.authorName || response.data.authorId || '',
        views: response.data.views || 0,
        category: response.data.category || 'ORDER',
        // 서버의 title/content를 question/answer로 매핑
        question: response.data.question || response.data.title || '',
        answer: response.data.answer || response.data.content || '',
        title: response.data.title || response.data.question || '',
        content: response.data.content || response.data.answer || '',
      };
      
      return {
        ...response,
        data: transformedData,
      };
    }
    
    return response as ApiResponse<FaqPost>;
  } catch (error) {
    return {
      success: false,
      data: null,
      message: 'FAQ를 찾을 수 없습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * FAQ 등록
 */
export async function createFAQ(faq: Partial<FaqPost>): Promise<ApiResponse<FaqPost>> {
  try {
    // 서버 요구 형식: { title, content, authorName, category, active }
    const requestBody = {
      title: faq.title || '',
      content: faq.content || '',
      authorName: faq.authorName || faq.authorId || 'Admin',
      category: faq.category || 'ORDER',
      active: faq.isActive ?? true,
    };
    
    const response = await api.post<FaqPost>('/api/community/faq', requestBody);
    return response;
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : 'FAQ 등록에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * FAQ 수정
 */
export async function updateFAQ(faq: Partial<FaqPost> & { id: string }): Promise<ApiResponse<FaqPost>> {
  try {
    // API 요구 형식: { title, content, category }
    const requestBody: {
      title?: string;
      content?: string;
      category?: string;
    } = {};
    
    if (faq.title !== undefined) requestBody.title = faq.title;
    if (faq.content !== undefined) requestBody.content = faq.content;
    if (faq.category !== undefined) requestBody.category = faq.category;
    
    const response = await api.patch<FaqPost>(`/api/community/faq/${faq.id}`, requestBody);
    return response;
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : 'FAQ 수정에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * FAQ 삭제
 */
export async function deleteFAQ(id: string): Promise<ApiResponse<void>> {
  try {
    const response = await api.delete<void>(`/api/community/faq/${id}`);
    return response;
  } catch (error) {
    return {
      success: false,
      data: undefined,
      message: error instanceof Error ? error.message : 'FAQ 삭제에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * FAQ 조회수 증가
 */
export async function incrementFaqViewCount(id: string): Promise<ApiResponse<void>> {
  try {
    const response = await api.patch<void>(`/api/community/common/viewCount/${id}`, {});
    return response;
  } catch (error) {
    console.error('Failed to increment FAQ view count:', error);
    return {
      success: false,
      data: undefined,
      message: error instanceof Error ? error.message : '조회수 증가에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * FAQ 활성화/비활성화
 */
export async function updateFAQActive(id: string, isActive: boolean): Promise<ApiResponse<void>> {
  try {
    const response = await api.patch<void>(`/api/community/common/isActive/${id}?isActive=${isActive}`, {});
    return response;
  } catch (error) {
    console.error('Failed to update FAQ active status:', error);
    return {
      success: false,
      data: undefined,
      message: error instanceof Error ? error.message : '활성화 상태 변경에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}