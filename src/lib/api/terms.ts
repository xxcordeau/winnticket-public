/**
 * Terms API Service
 * 약관 관련 API 호출 함수
 */

import { api } from '../api';
import type { ApiResponse } from '../api';

/**
 * 약관 Response DTO
 */
export interface TermsResponse {
  id: number;
  title: string; // 
  content: string; // (HTML)
  required: boolean; // 
  displayOrder: number; // 
  visible: boolean; // 
  
  // 
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

/**
 * 약관 Request DTO (등록/수정)
 */
export interface TermsRequest {
  title: string;
  content: string;
  required?: boolean;
  displayOrder?: number;
  visible?: boolean;
}

// ( API )
let MOCK_TERMS: TermsResponse[] = [
  {
    id: 1,
    title: '이용약관',
    content: '<h2>제1조 (목적)</h2><p>이 약관은 회사가 제공하는 서비스의 이용과 관련하여 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>',
    required: true,
    displayOrder: 1,
    visible: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
    createdBy: 'admin',
    updatedBy: 'admin',
  },
  {
    id: 2,
    title: '개인정보 수집 및 이용 동의',
    content: '<h2>개인정보 수집 항목</h2><p>필수항목: 이름, 이메일, 전화번호</p><p>선택항목: 주소, 생년월일</p>',
    required: true,
    displayOrder: 2,
    visible: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
    createdBy: 'admin',
    updatedBy: 'admin',
  },
  {
    id: 3,
    title: '마케팅 정보 수신 동의',
    content: '<h2>마케팅 정보 수신</h2><p>이벤트, 프로모션 정보를 받아보실 수 있습니다.</p>',
    required: false,
    displayOrder: 3,
    visible: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
    createdBy: 'admin',
    updatedBy: 'admin',
  },
  {
    id: 4,
    title: '개인정보 제3자 제공 동의',
    content: '<h2>제공받는 자</h2><p>결제대행사, 배송업체</p>',
    required: true,
    displayOrder: 4,
    visible: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
    createdBy: 'admin',
    updatedBy: 'admin',
  },
];

/**
 * 전체 약관 목록 조회 (관리자용)
 * GET /api/admin/terms
 */
export async function getAllTerms(): Promise<ApiResponse<TermsResponse[]>> {
  try {
    const response = await api.get<TermsResponse[]>('/api/admin/terms');
    return response;
  } catch (error) {
    // API 
    return {
      success: true,
      data: [...MOCK_TERMS].sort((a, b) => a.displayOrder - b.displayOrder),
      message: '약관 목록을 조회했습니다.',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 노출 약관만 조회 (공개용)
 * GET /api/admin/terms/visible
 */
export async function getVisibleTerms(): Promise<ApiResponse<TermsResponse[]>> {
  try {
    const response = await api.get<TermsResponse[]>('/api/admin/terms/visible');
    return response;
  } catch (error) {
    // API visible=true 
    const visibleTerms = MOCK_TERMS
      .filter(term => term.visible)
      .sort((a, b) => a.displayOrder - b.displayOrder);
    
    return {
      success: true,
      data: visibleTerms,
      message: '노출 약관 목록을 조회했습니다.',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 필수 약관만 조회 (공개용)
 * GET /api/admin/terms/required
 */
export async function getRequiredTerms(): Promise<ApiResponse<TermsResponse[]>> {
  try {
    const response = await api.get<TermsResponse[]>('/api/admin/terms/required');
    return response;
  } catch (error) {
    // API required=true && visible=true 
    const requiredTerms = MOCK_TERMS
      .filter(term => term.required && term.visible)
      .sort((a, b) => a.displayOrder - b.displayOrder);
    
    return {
      success: true,
      data: requiredTerms,
      message: '필수 약관 목록을 조회했습니다.',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 단일 약관 조회
 * GET /api/admin/terms/:id
 */
export async function getTerms(id: number): Promise<ApiResponse<TermsResponse>> {
  try {
    const response = await api.get<TermsResponse>(`/api/admin/terms/${id}`);
    return response;
  } catch (error) {
    // API 
    const terms = MOCK_TERMS.find(t => t.id === id);
    if (!terms) {
      return {
        success: false,
        data: null,
        message: '약관 정보를 찾을 수 없습니다.',
        timestamp: new Date().toISOString(),
      };
    }
    return {
      success: true,
      data: terms,
      message: '약관 정보를 조회했습니다.',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 약관 등록
 * POST /api/admin/terms
 */
export async function createTerms(data: TermsRequest): Promise<ApiResponse<TermsResponse>> {
  try {
    const response = await api.post<TermsResponse>('/api/admin/terms', data);
    return response;
  } catch (error) {
    // API 
    const newId = Math.max(...MOCK_TERMS.map(t => t.id), 0) + 1;
    const newTerms: TermsResponse = {
      id: newId,
      title: data.title,
      content: data.content,
      required: data.required !== undefined ? data.required : true,
      displayOrder: data.displayOrder !== undefined ? data.displayOrder : MOCK_TERMS.length + 1,
      visible: data.visible !== undefined ? data.visible : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin',
      updatedBy: 'admin',
    };
    MOCK_TERMS.push(newTerms);
    
    return {
      success: true,
      data: newTerms,
      message: '약관이 등록되었습니다.',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 약관 수정
 * PUT /api/admin/terms/:id
 */
export async function updateTerms(id: number, data: TermsRequest): Promise<ApiResponse<TermsResponse>> {
  try {
    const response = await api.put<TermsResponse>(`/api/admin/terms/${id}`, data);
    return response;
  } catch (error) {
    // API 
    const index = MOCK_TERMS.findIndex(t => t.id === id);
    if (index === -1) {
      return {
        success: false,
        data: null,
        message: '약관 정보를 찾을 수 없습니다.',
        timestamp: new Date().toISOString(),
      };
    }
    
    MOCK_TERMS[index] = {
      ...MOCK_TERMS[index],
      title: data.title,
      content: data.content,
      required: data.required !== undefined ? data.required : MOCK_TERMS[index].required,
      displayOrder: data.displayOrder !== undefined ? data.displayOrder : MOCK_TERMS[index].displayOrder,
      visible: data.visible !== undefined ? data.visible : MOCK_TERMS[index].visible,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin',
    };
    
    return {
      success: true,
      data: MOCK_TERMS[index],
      message: '약관 정보가 수정되었습니다.',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 약관 삭제
 * DELETE /api/admin/terms/:id
 */
export async function deleteTerms(id: number): Promise<ApiResponse<void>> {
  try {
    const response = await api.delete<void>(`/api/admin/terms/${id}`);
    return response;
  } catch (error) {
    // API 
    const index = MOCK_TERMS.findIndex(t => t.id === id);
    if (index === -1) {
      return {
        success: false,
        data: null,
        message: '약관 정보를 찾을 수 없습니다.',
        timestamp: new Date().toISOString(),
      };
    }
    
    MOCK_TERMS.splice(index, 1);
    
    return {
      success: true,
      data: null,
      message: '약관이 삭제되었습니다.',
      timestamp: new Date().toISOString(),
    };
  }
}
