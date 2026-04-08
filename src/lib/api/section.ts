/**
 * Section API Service
 * 섹션 관련 API 호출 함수 (하이브리드 방식)
 * API 엔드포인트: /api/admin/product/section
 */

import { api } from '../api';
import type { ApiResponse } from '../api';
import type { Section, CreateSectionDto, UpdateSectionDto } from '../../data/dto/section.dto';
import * as dummyApi from '../../data/sections';

const API_BASE_URL = '/api/admin/product/section';

/**
 * 1. 섹션 목록 조회 (전체 리스트)
 * GET /api/admin/product/section/list
 */
export async function getSections(): Promise<ApiResponse<Section[]>> {
  try {
    const response = await api.get<Section[]>(`${API_BASE_URL}/list`);
    return response;
  } catch (error) {
    // : API 
    return dummyApi.getSections();
  }
}

/**
 * 2. 활성화된 섹션만 조회
 * GET /api/admin/product/section/list/active
 */
export async function getActiveSections(): Promise<ApiResponse<Section[]>> {
  try {
    const response = await api.get<Section[]>(`${API_BASE_URL}/list/active`);
    return response;
  } catch (error) {
    // : API 
    return dummyApi.getActiveSections();
  }
}

/**
 * 3. 섹션 상세 조회
 * GET /api/admin/product/section/{id}
 */
export async function getSectionById(id: string): Promise<ApiResponse<Section>> {
  try {
    const response = await api.get<Section>(`${API_BASE_URL}/${id}`);
    return response;
  } catch (error) {
    // : API 
    const dummyResponse = dummyApi.getSectionById(id);
    if (!dummyResponse.success || !dummyResponse.data) {
      return {
        success: false,
        data: null,
        message: '섹션을 찾을 수 없습니다',
        timestamp: new Date().toISOString(),
      };
    }
    return {
      ...dummyResponse,
      data: dummyResponse.data,
    };
  }
}

/**
 * 4. 섹션 생성
 * POST /api/admin/product/section
 */
export async function createSection(
  section: CreateSectionDto
): Promise<ApiResponse<Section>> {
  try {
    const response = await api.post<Section>(API_BASE_URL, section);
    return response;
  } catch (error) {
    // : API 
    return dummyApi.createSection(section);
  }
}

/**
 * 5. 섹션 수정
 * PATCH /api/admin/product/section/{id}
 */
export async function updateSection(
  id: string,
  section: UpdateSectionDto
): Promise<ApiResponse<Section>> {
  try {
    const response = await api.patch<Section>(`${API_BASE_URL}/${id}`, section);
    return response;
  } catch (error) {
    // : API 
    return dummyApi.updateSection(id, section);
  }
}

/**
 * 6. 섹션 삭제
 * DELETE /api/admin/product/section/{id}
 */
export async function deleteSection(id: string): Promise<ApiResponse<void>> {
  try {
    const response = await api.delete<void>(`${API_BASE_URL}/${id}`);
    return response;
  } catch (error) {
    // : API 
    return dummyApi.deleteSection(id);
  }
}

// Re-export types
export type { Section, CreateSectionDto, UpdateSectionDto };