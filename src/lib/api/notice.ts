/**
 * Notice API Service  
 * 공지사항 관련 API 호출 함수
 */

import { api } from '../api';
import type { ApiResponse } from '../api';
import type { NoticePost } from '../../data/dto/community.dto';

/**
 * 공지사항 목록 조회
 */
export async function getNotices(params?: {
  title?: string;
  begDate?: string; // YYYY-MM-DD 
  endDate?: string; // YYYY-MM-DD 
}): Promise<ApiResponse<NoticePost[]>> {
  try {
    // Query parameter 
    const queryParams = new URLSearchParams();
    if (params?.title) queryParams.append('title', params.title);
    if (params?.begDate) queryParams.append('begDate', params.begDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const url = queryParams.toString() 
      ? `/api/community/notice?${queryParams.toString()}`
      : '/api/community/notice';
    
    const response = await api.get<any[]>(url);
    
    // DTO 
    if (response.success && response.data) {
      const transformedData: NoticePost[] = response.data.map((item: any) => ({
        ...item,
        type: 'NOTICE' as const,
        isActive: item.active ?? item.isActive ?? true,
        authorId: item.authorId || item.authorName || '',
        authorName: item.authorName || item.authorId || '',
        views: item.views || 0,
      }));
      
      return {
        ...response,
        data: transformedData,
      };
    }
    
    return response as ApiResponse<NoticePost[]>;
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
 * 공지사항 상세 조회
 */
export async function getNoticeById(id: string): Promise<ApiResponse<NoticePost>> {
  try {
    const response = await api.get<any>(`/api/community/notice/${id}`);
    
    // DTO 
    if (response.success && response.data) {
      const transformedData: NoticePost = {
        ...response.data,
        type: 'NOTICE' as const,
        isActive: response.data.active ?? response.data.isActive ?? true,
        authorId: response.data.authorId || response.data.authorName || '',
        authorName: response.data.authorName || response.data.authorId || '',
        views: response.data.views || 0,
      };
      
      return {
        ...response,
        data: transformedData,
      };
    }
    
    return response as ApiResponse<NoticePost>;
  } catch (error) {
    return {
      success: false,
      data: null,
      message: '공지사항을 찾을 수 없습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 공지사항 등록
 */
export async function createNotice(notice: Partial<NoticePost>): Promise<ApiResponse<NoticePost>> {
  try {
    // 
    const requestBody = {
      title: notice.title || '',
      content: notice.content || '',
      authorName: notice.authorName || notice.authorId || 'Admin',
      active: notice.isActive ?? true,
    };
    
    const response = await api.post<NoticePost>('/api/community/notice', requestBody);
    return response;
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '공지사항 등록에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 공지사항 수정
 */
export async function updateNotice(notice: Partial<NoticePost> & { id: string }): Promise<ApiResponse<NoticePost>> {
  try {
    // : { title, content } 
    const requestBody: Record<string, any> = {
      title: notice.title || '',
      content: notice.content || '',
    };
    
    const response = await api.patch<NoticePost>(`/api/community/notice/${notice.id}`, requestBody);
    return response;
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '공지사항 수정에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 공지사항 삭제
 */
export async function deleteNotice(id: string): Promise<ApiResponse<void>> {
  try {
    const response = await api.delete<void>(`/api/community/notice/${id}`);
    return response;
  } catch (error) {
    return {
      success: false,
      data: undefined,
      message: error instanceof Error ? error.message : '공지사항 삭제에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 공지사항 조회수 증가
 */
export async function incrementNoticeViewCount(id: string): Promise<ApiResponse<void>> {
  try {
    const response = await api.patch<void>(`/api/community/common/viewCount/${id}`, {});
    return response;
  } catch (error) {
    return {
      success: false,
      data: undefined,
      message: error instanceof Error ? error.message : '조회수 증가에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 공지사항 활성화/비활성화
 */
export async function updateNoticeActive(id: string, isActive: boolean): Promise<ApiResponse<void>> {
  try {
    const response = await api.patch<void>(`/api/community/common/isActive/${id}?isActive=${isActive}`, {});
    return response;
  } catch (error) {
    return {
      success: false,
      data: undefined,
      message: error instanceof Error ? error.message : '활성화 상태 변경에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}