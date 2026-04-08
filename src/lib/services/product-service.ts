/**
 * Product Service
 * 상품 관련 API 호출 서비스
 */

import { api } from '../api';
import { API_ENDPOINTS } from '../api-config';
import type {
  Product,
  ProductListResponse,
  ProductResponse,
  CreateProductDto,
  UpdateProductDto,
} from '../../data/dto/product.dto';

/**
 * 상품 목록 조회
 */
export async function getProducts(
  page: number = 0,
  size: number = 20,
  search?: string,
  categoryId?: string,
  partnerId?: string,
  salesStatus?: string
): Promise<ProductListResponse> {
  try {
    const params: Record<string, string | number | boolean | undefined> = {
      page,
      size,
      search,
      categoryId,
      partnerId,
      salesStatus,
    };

    const response = await api.get<ProductListResponse['data']>(
      API_ENDPOINTS.PRODUCTS.LIST,
      params
    );

    return {
      success: response.success,
      data: response.data,
      message: response.message,
      timestamp: response.timestamp,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      message: error.message || '상품 목록을 불러오는데 실패했습니다.',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 상품 상세 조회
 */
export async function getProduct(id: string): Promise<ProductResponse> {
  try {
    const response = await api.get<Product>(
      API_ENDPOINTS.PRODUCTS.DETAIL(id)
    );

    return {
      success: response.success,
      data: response.data,
      message: response.message,
      timestamp: response.timestamp,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      message: error.message || '상품 정보를 불러오는데 실패했습니다.',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 상품 생성
 */
export async function createProduct(dto: CreateProductDto): Promise<ProductResponse> {
  try {
    const response = await api.post<Product>(
      API_ENDPOINTS.PRODUCTS.CREATE,
      dto
    );

    return {
      success: response.success,
      data: response.data,
      message: response.message,
      timestamp: response.timestamp,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      message: error.message || '상품 생성에 실패했습니다.',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 상품 수정
 */
export async function updateProduct(id: string, dto: UpdateProductDto): Promise<ProductResponse> {
  try {
    const response = await api.put<Product>(
      API_ENDPOINTS.PRODUCTS.UPDATE(id),
      dto
    );

    return {
      success: response.success,
      data: response.data,
      message: response.message,
      timestamp: response.timestamp,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      message: error.message || '상품 수정에 실패했습니다.',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 상품 삭제
 */
export async function deleteProduct(id: string): Promise<ProductResponse> {
  try {
    const response = await api.delete<Product>(
      API_ENDPOINTS.PRODUCTS.DELETE(id)
    );

    return {
      success: response.success,
      data: response.data,
      message: response.message,
      timestamp: response.timestamp,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null,
      message: error.message || '상품 삭제에 실패했습니다.',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 상품 이미지 업로드
 */
export async function uploadProductImage(file: File, productId?: string): Promise<{ success: boolean; url?: string; message: string }> {
  try {
    const additionalData = productId ? { productId } : undefined;
    const response = await api.upload<{ url: string }>(
      API_ENDPOINTS.PRODUCTS.UPLOAD_IMAGE,
      file,
      'image',
      additionalData
    );

    return {
      success: response.success,
      url: response.data?.url,
      message: response.message,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || '이미지 업로드에 실패했습니다.',
    };
  }
}
