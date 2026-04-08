/**
 * FAQ 카테고리 API Service
 * FAQ 카테고리 관련 API 호출 및 로컬 관리
 */

import { api } from '../api';
import type { ApiResponse } from '../api';

export interface FaqCategoryItem {
  id: string;
  name: string;
}

// 기본 카테고리
const DEFAULT_CATEGORIES: FaqCategoryItem[] = [
  { id: "ORDER", name: "주문/결제" },
  { id: "DELIVERY", name: "배송" },
  { id: "CANCEL", name: "취소/환불" },
  { id: "TICKET", name: "티켓" },
  { id: "MEMBERSHIP", name: "회원" },
  { id: "ETC", name: "기타" },
];

const STORAGE_KEY = "faq_categories";

/**
 * 로컬 스토리지에서 카테고리 로드
 */
function loadFromStorage(): FaqCategoryItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to load categories from storage:", error);
  }
  return DEFAULT_CATEGORIES;
}

/**
 * 로컬 스토리지에 카테고리 저장
 */
function saveToStorage(categories: FaqCategoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  } catch (error) {
    console.error("Failed to save categories to storage:", error);
  }
}

/**
 * FAQ 카테고리 목록 조회
 */
export async function getFaqCategories(): Promise<ApiResponse<FaqCategoryItem[]>> {
  try {
    // 서버 API 호출 시도
    const response = await api.get<FaqCategoryItem[]>('/api/community/faq/categories');
    
    if (response.success && response.data) {
      // 서버 데이터가 있으면 로컬에도 저장
      saveToStorage(response.data);
      return response;
    }
  } catch (error) {
    // 서버 호출 실패 시 로컬 스토리지 사용
    console.log("Using local FAQ categories");
  }
  
  // 로컬 스토리지에서 로드
  const categories = loadFromStorage();
  return {
    success: true,
    data: categories,
    message: 'OK',
    timestamp: new Date().toISOString(),
  };
}

/**
 * FAQ 카테고리 추가
 */
export async function createFaqCategory(category: Omit<FaqCategoryItem, 'id'>): Promise<ApiResponse<FaqCategoryItem>> {
  try {
    // 서버 API 호출 시도
    const response = await api.post<FaqCategoryItem>('/api/community/faq/categories', category);
    
    if (response.success && response.data) {
      // 로컬에도 업데이트
      const categories = loadFromStorage();
      categories.push(response.data);
      saveToStorage(categories);
      return response;
    }
  } catch (error) {
    console.log("Using local FAQ category creation");
  }
  
  // 로컬에서 처리
  const newCategory: FaqCategoryItem = {
    id: `cat-${Date.now()}`,
    ...category,
  };
  
  const categories = loadFromStorage();
  categories.push(newCategory);
  saveToStorage(categories);
  
  return {
    success: true,
    data: newCategory,
    message: '카테고리가 추가되었습니다',
    timestamp: new Date().toISOString(),
  };
}

/**
 * FAQ 카테고리 수정
 */
export async function updateFaqCategory(id: string, updates: Partial<Omit<FaqCategoryItem, 'id'>>): Promise<ApiResponse<FaqCategoryItem>> {
  try {
    // 서버 API 호출 시도
    const response = await api.patch<FaqCategoryItem>(`/api/community/faq/categories/${id}`, updates);
    
    if (response.success && response.data) {
      // 로컬에도 업데이트
      const categories = loadFromStorage();
      const index = categories.findIndex(c => c.id === id);
      if (index !== -1) {
        categories[index] = response.data;
        saveToStorage(categories);
      }
      return response;
    }
  } catch (error) {
    console.log("Using local FAQ category update");
  }
  
  // 로컬에서 처리
  const categories = loadFromStorage();
  const index = categories.findIndex(c => c.id === id);
  
  if (index === -1) {
    return {
      success: false,
      data: undefined,
      message: '카테고리를 찾을 수 없습니다',
      timestamp: new Date().toISOString(),
    };
  }
  
  const updatedCategory: FaqCategoryItem = {
    ...categories[index],
    ...updates,
  };
  
  categories[index] = updatedCategory;
  saveToStorage(categories);
  
  return {
    success: true,
    data: updatedCategory,
    message: '카테고리가 수정되었습니다',
    timestamp: new Date().toISOString(),
  };
}

/**
 * FAQ 카테고리 삭제
 */
export async function deleteFaqCategory(id: string): Promise<ApiResponse<void>> {
  // 기본 카테고리는 삭제 불가
  const defaultIds = DEFAULT_CATEGORIES.map(c => c.id);
  if (defaultIds.includes(id)) {
    return {
      success: false,
      data: undefined,
      message: '기본 카테고리는 삭제할 수 없습니다',
      timestamp: new Date().toISOString(),
    };
  }
  
  try {
    // 서버 API 호출 시도
    const response = await api.delete<void>(`/api/community/faq/categories/${id}`);
    
    if (response.success) {
      // 로컬에서도 삭제
      const categories = loadFromStorage();
      const filtered = categories.filter(c => c.id !== id);
      saveToStorage(filtered);
      return response;
    }
  } catch (error) {
    console.log("Using local FAQ category deletion");
  }
  
  // 로컬에서 처리
  const categories = loadFromStorage();
  const filtered = categories.filter(c => c.id !== id);
  saveToStorage(filtered);
  
  return {
    success: true,
    data: undefined,
    message: '카테고리가 삭제되었습니다',
    timestamp: new Date().toISOString(),
  };
}