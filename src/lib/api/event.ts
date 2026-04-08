/**
 * Event API Service  
 * 이벤트 관련 API 호출 함수
 */

import { api } from '../api';
import type { ApiResponse } from '../api';
import type { EventPost } from '../../data/dto/community.dto';

/**
 * 이벤트 목록 조회
 */
export async function getEvents(params?: {
  title?: string;
  begDate?: string; // YYYY-MM-DD 
  endDate?: string; // YYYY-MM-DD 
}): Promise<ApiResponse<EventPost[]>> {
  try {
    // Query parameter 
    const queryParams = new URLSearchParams();
    if (params?.title) queryParams.append('title', params.title);
    if (params?.begDate) queryParams.append('begDate', params.begDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const url = queryParams.toString() 
      ? `/api/community/event?${queryParams.toString()}`
      : '/api/community/event';
    
    const response = await api.get<any[]>(url);
    
    // DTO 
    if (response.success && response.data) {
      const transformedData: EventPost[] = response.data.map((item: any) => ({
        ...item,
        type: 'EVENT' as const,
        isActive: item.active ?? item.isActive ?? true,
        authorId: item.authorId || item.authorName || '',
        authorName: item.authorName || item.authorId || '',
        views: item.views || 0,
        eventEndDate: item.eventEndDate || item.event_end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }));
      
      return {
        ...response,
        data: transformedData,
      };
    }
    
    return response as ApiResponse<EventPost[]>;
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
 * 이벤트 상세 조회
 */
export async function getEventById(id: string): Promise<ApiResponse<EventPost>> {
  try {
    const response = await api.get<any>(`/api/community/event/${id}`);
    
    // DTO 
    if (response.success && response.data) {
      const transformedData: EventPost = {
        ...response.data,
        type: 'EVENT' as const,
        isActive: response.data.active ?? response.data.isActive ?? true,
        authorId: response.data.authorId || response.data.authorName || '',
        authorName: response.data.authorName || response.data.authorId || '',
        views: response.data.views || 0,
        eventEndDate: response.data.eventEndDate || response.data.event_end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
      
      return {
        ...response,
        data: transformedData,
      };
    }
    
    return response as ApiResponse<EventPost>;
  } catch (error) {
    return {
      success: false,
      data: null,
      message: '이벤트를 찾을 수 없습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 이벤트 등록
 */
export async function createEvent(event: Partial<EventPost>): Promise<ApiResponse<EventPost>> {
  try {
    // 
    const requestBody = {
      title: event.title || '',
      content: event.content || '',
      authorName: event.authorName || event.authorId || 'Admin',
      active: event.isActive ?? true,
      eventEndDate: event.eventEndDate,
    };
    
    const response = await api.post<EventPost>('/api/community/event', requestBody);
    return response;
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '이벤트 등록에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 이벤트 수정
 */
export async function updateEvent(event: Partial<EventPost> & { id: string }): Promise<ApiResponse<EventPost>> {
  try {
    // : { title, content, eventEndDate } 
    const requestBody: Record<string, any> = {
      title: event.title || '',
      content: event.content || '',
      eventEndDate: event.eventEndDate || new Date().toISOString().split('T')[0],
    };
    
    const response = await api.patch<EventPost>(`/api/community/event/${event.id}`, requestBody);
    return response;
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '이벤트 수정에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 이벤트 삭제
 */
export async function deleteEvent(id: string): Promise<ApiResponse<void>> {
  try {
    const response = await api.delete<void>(`/api/community/event/${id}`);
    return response;
  } catch (error) {
    return {
      success: false,
      data: undefined,
      message: error instanceof Error ? error.message : '이벤트 삭제에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 이벤트 조회수 증가
 */
export async function incrementEventViewCount(id: string): Promise<ApiResponse<void>> {
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
 * 이벤트 활성화/비활성화
 */
export async function updateEventActive(id: string, isActive: boolean): Promise<ApiResponse<void>> {
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