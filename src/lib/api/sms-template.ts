import { api } from '../api';
import { ApiResponse } from '../../data/dto/api-response.dto';

/**
 * SMS 템플릿 DTO
 */
export interface SmsTemplate {
  templateCode: 'ORDER_RECEIVED' | 'PAYMENT_CONFIRMED' | 'TICKET_ISSUED' | 'ORDER_CANCELLED';
  title: string;
  content: string;
}

/**
 * SMS 템플릿 수정 요청
 */
export interface UpdateSmsTemplatesRequest {
  templates: SmsTemplate[];
}

/**
 * 1. 상품별 SMS 템플릿 목록 조회
 * GET /api/admin/product/{id}/sms-templates
 */
export async function getProductSmsTemplates(productId: string): Promise<ApiResponse<SmsTemplate[]>> {
  try {
    const response = await api.get<SmsTemplate[]>(`/api/admin/product/${productId}/sms-templates`);
    return response;
  } catch (error) {
    // API 
    return {
      success: false,
      data: [],
      message: error instanceof Error ? error.message : '상품별 SMS 템플릿 조회에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 2. 상품별 SMS 템플릿 수정
 * POST /api/admin/product/{id}/sms-templates
 */
export async function updateProductSmsTemplates(
  productId: string,
  request: UpdateSmsTemplatesRequest
): Promise<ApiResponse<string>> {
  try {
    const response = await api.post<string>(`/api/admin/product/${productId}/sms-templates`, request);
    return response;
  } catch (error) {
    // API 
    return {
      success: false,
      data: '',
      message: error instanceof Error ? error.message : '상품별 SMS 템플릿 수정에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 3. 기본 SMS 템플릿 조회
 * GET /api/admin/product/sms-templates/default
 */
export async function getDefaultSmsTemplate(
  code: 'ORDER_RECEIVED' | 'PAYMENT_CONFIRMED' | 'TICKET_ISSUED' | 'ORDER_CANCELLED'
): Promise<ApiResponse<SmsTemplate>> {
  try {
    const response = await api.get<SmsTemplate>('/api/admin/product/sms-templates/default', { code });
    return response;
  } catch (error) {
    return {
      success: false,
      data: null as any,
      message: error instanceof Error ? error.message : '기본 SMS 템플릿 조회에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 템플릿 코드 이름 매핑
 */
export const SMS_TEMPLATE_NAMES: Record<SmsTemplate['templateCode'], string> = {
  ORDER_RECEIVED: '주문 접수',
  PAYMENT_CONFIRMED: '입금 확인',
  TICKET_ISSUED: '발권 완료',
  ORDER_CANCELLED: '취소 완료',
};

/**
 * 모든 템플릿 코드
 */
export const SMS_TEMPLATE_CODES: SmsTemplate['templateCode'][] = [
  'ORDER_RECEIVED',
  'PAYMENT_CONFIRMED',
  'TICKET_ISSUED',
  'ORDER_CANCELLED',
];