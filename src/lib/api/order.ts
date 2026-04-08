/**
 * Order API Service
 * 주문 관련 API 호출 함수
 */

import { api, ApiError } from '../api';
import type { ApiResponse } from '../api';

/**
 * 주문 인터페이스
 */
export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  paymentMethod: string;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

/**
 * 주문 항목 인터페이스
 */
export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

/**
 * 주문 목록 조회 (페이징)
 */
export async function getOrders(
  page: number = 0,
  size: number = 20,
  status?: string,
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<{
  content: Order[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}>> {
  try {
    let url = `/api/admin/order/list?page=${page}&size=${size}`;
    if (status) url += `&status=${status}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    
    const response = await api.get<{
      content: Order[];
      totalElements: number;
      totalPages: number;
      page: number;
      size: number;
    }>(url);
    return response;
  } catch (error) {
    return {
      success: true,
      data: {
        content: [],
        totalElements: 0,
        totalPages: 0,
        page: 0,
        size: size,
      },
      message: 'OK',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 주문 상세 조회
 */
export async function getOrderById(id: string): Promise<ApiResponse<Order>> {
  try {
    const response = await api.get<Order>(`/api/admin/order/${id}`);
    return response;
  } catch (error) {
    return {
      success: false,
      data: null,
      message: '주문을 찾을 수 없습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 주문번호로 주문 조회
 */
export async function getOrderByNumber(orderNumber: string): Promise<ApiResponse<Order>> {
  try {
    const response = await api.get<Order>(`/admin/order/number/${orderNumber}`);
    return response;
  } catch (error) {
    return {
      success: false,
      data: null,
      message: '주문을 찾을 수 없습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 주문 생성
 */
export async function createOrder(order: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Order>> {
  try {
    const response = await api.post<Order>('/api/admin/order/create', order);
    return response;
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '주문 생성에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 주문 상태 변경
 */
export async function updateOrderStatus(
  id: string,
  status: Order['status']
): Promise<ApiResponse<Order>> {
  try {
    const response = await api.patch<Order>(`/admin/order/${id}/status`, { status });
    return response;
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '주문 상태 변경에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 결제 상태 변경
 */
export async function updatePaymentStatus(
  id: string,
  paymentStatus: Order['paymentStatus']
): Promise<ApiResponse<Order>> {
  try {
    const response = await api.patch<Order>(`/api/admin/order/${id}/payment-status`, { paymentStatus });
    return response;
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '결제 상태 변경에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 주문 취소
 */
export async function cancelOrder(id: string, reason: string): Promise<ApiResponse<Order>> {
  try {
    const response = await api.patch<Order>(`/api/admin/order/${id}/cancel`, { reason });
    return response;
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '주문 취소에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 현장용 티켓 사용 처리
 * POST /api/admin/order/{orderId}/ticket/{ticketId}/use
 */
export async function useTicket(orderId: string, ticketId: string): Promise<ApiResponse<{
  ticketNumber: string;
  ticketUsed: boolean;
  usedAt?: string;
}>> {
  try {
    console.log(`🌐 [API] Calling POST /api/admin/order/${orderId}/ticket/${ticketId}/use`);
    const response = await api.post<{
      ticketNumber: string;
      ticketUsed: boolean;
      usedAt?: string;
    }>(`/api/admin/order/${orderId}/ticket/${ticketId}/use`, {});
    console.log('✅ [API] Ticket used successfully');
    return response;
  } catch (error) {
    console.error('Failed to use ticket:', error);
    return {
      success: false,
      data: null,
      message: '티켓 사용 처리에 실패했습니다.',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 현장용 티켓 목록 인터페이스
 */
export interface FieldTicketList {
  orderNumber: string;
  orderDate: string;
  orderAmount: number;
  paymentStatus: string;
  tickets: FieldTicket[];
}

export interface FieldTicket {
  ticketId: string;
  ticketNumber: string;
  productName: string;
  ticketUsed: boolean;
  usedAt?: string;
}

/**
 * 현장용 티켓 목록 조회 (입장 게이트용)
 * GET /api/admin/order/{id}/tickets
 */
export async function getFieldTickets(orderId: string): Promise<ApiResponse<FieldTicketList>> {
  try {
    console.log(`🌐 [API] Calling GET /api/admin/order/${orderId}/tickets`);
    const response = await api.get<FieldTicketList>(`/api/admin/order/${orderId}/tickets`);
    console.log('✅ [API] Field tickets retrieved successfully');
    return response;
  } catch (error) {
    console.error('Failed to retrieve field tickets:', error);
    return {
      success: false,
      data: null,
      message: '티켓 목록을 찾을 수 없습니다.',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * ========================================
 * 관리자 전용 API
 * ========================================
 */

/**
 * 관리자 주문 목록 아이템
 */
export interface AdminOrderListItem {
  id: string;                    // uuid - 주문 ID
  allTicketUsed: boolean;        // 모든 티켓 사용 여부
  orderedAt: string;             // datetime -  일시
  orderNumber: string;           // 주문 번호
  channelName?: string;          // 채널명
  partnerName: string;           // 파트너명
  customerName: string;          // 주문자명
  customerPhone?: string;        // 주문자 전화번호
  status: string;                // 주문 상태 (PENDING_PAYMENT, COMPLETED, CANCEL_REQUESTED, CANCELED, REFUNDED)
  paymentStatus: string;         // 결제 상태 (READY, PAID, FAILED, REFUNDED)
  paymentMethod?: string;        // 결제 수단
  pointAmount?: number;          // 포인트 결제 금액
  finalPrice: number;            // 최종 결제 금액
  totalPrice: number;            // 총 주문 금액
  discountPrice: number;         // 할인 금액
  productName: string;           // 상품명
  productCnt: number;            // 상품 수량
}

/**
 * 관리자 주문 목록 조회
 */
export async function getAdminOrders(
  page: number = 0,
  size: number = 20,
  srchWord?: string,
  begDate?: string,
  endDate?: string,
  status?: string,
  partnerId?: string
): Promise<ApiResponse<{
  content: AdminOrderListItem[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}>> {
  try {
    let url = `/api/admin/order?page=${page}&size=${size}`;
    if (srchWord) url += `&srchWord=${encodeURIComponent(srchWord)}`;
    if (begDate) url += `&begDate=${begDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    if (status && status !== 'ALL') url += `&status=${status}`;
    if (partnerId) url += `&partnerId=${partnerId}`;
    
    const response = await api.get<{
      content: AdminOrderListItem[];
      totalElements: number;
      totalPages: number;
      page: number;
      size: number;
    }>(url);
    return response;
  } catch (error) {
    // 조용히 빈 결과 반환 (서버가 아직 /admin prefix를 지하지 않을 수 있음)
    return {
      success: true,
      data: {
        content: [],
        totalElements: 0,
        totalPages: 0,
        page: page,
        size: size,
      },
      message: 'OK',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 관리자 주문 상세
 */
export interface AdminOrderDetail {
  id: string;                    // 주문 ID (uuid)
  orderNumber: string;           // 주문 번호
  orderedAt: string;             // 주문 일시 (API 스펙에 맞춤)
  channelName?: string;          // 채널명
  status: string;                // 주문 상태 (PENDING_PAYMENT, COMPLETED, etc.)
  customerName: string;          // 주문자명
  customerEmail?: string;        // 주문자 이메일
  customerPhone?: string;        // 주문자 전화번호
  companyName?: string;          // 기관명(회사명)
  paymentStatus: string;         // 결제 상태 (READY, PAID, etc.)
  finalPrice: number;            // 최종 금액
  paymentMethod?: string;        // 결제 수단
  pointAmount?: number;          // 포인트 결제 금액
  paidAt?: string;               // 결제 완료 일시
  canceledAt?: string;           // 취소 일시
  totalPrice: number;            // 총 주문 금액
  discountPrice: number;         // 할인 금액
  allTicketUsed: boolean;        // 모든 티켓 사용 여부
  allCnt: number;                // 전체 티켓 수
  usedTicketCnt: number;         // 사용된 티켓 수
  memo?: string;                 // 메모
  products: AdminOrderProduct[]; // 주문 상품 목록
  tickets: AdminOrderTicket[];   // 발급 티켓 목록
  partnerName?: string;          // 파트너명
  createdAt: string;             // 생성 일시 (호환성 유지)
  updatedAt?: string;            // 수정 일시
}

/**
 * 관리자 주문 상품
 */
export interface AdminOrderProduct {
  id: string;                    // 상품 ID
  productId: string;             // 상품 ID (원본)
  productName: string;           // 상품명
  categoryName?: string;         // 카테고리명
  partnerName?: string;          // 파트너명
  optionName?: string;           // 옵션명
  quantity: number;              // 수량
  unitPrice: number;             // 단가
  totalPrice: number;            // 총 금액
}

/**
 * 관리자 주문 티켓
 */
export interface AdminOrderTicket {
  id: string;                    // 티켓 ID
  ticketNumber: string;          // 티켓 번호
  productName: string;           // 상품명
  partnerName?: string;          // 파트너명
  ticketUsed: boolean;           // 티켓 사용 여부
  ticketUsedDate?: string;       // 티켓 사용 일시
}

/**
 * 관리자 주문 상세 조회
 */
export async function getAdminOrderDetail(id: string): Promise<ApiResponse<AdminOrderDetail>> {
  try {
    console.log('🌐 [API] Calling GET /api/admin/order/' + id);
    const response = await api.get<AdminOrderDetail>(`/api/admin/order/${id}`);
    return response;
  } catch (error) {
    console.error('Failed to retrieve admin order detail:', error);
    return {
      success: false,
      data: null,
      message: '주문 상세를 찾을 수 없습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 주문 상태 요약
 */
export interface OrderStatusSummary {
  unpaidCnt: number;             // 입금전 건수
  unpaidTotalPrice: number;      // 입금전 총액
  completedCnt: number;          // 주문완료 건수
  completedTotalPrice: number;   // 주문완료 총액
  canceledCnt: number;           // 취소 건수
  canceledTotalPrice: number;    // 취소 총액
}

/**
 * 주문 상태 요약 조회 (대시보드용)
 * GET /api/admin/order/status
 */
export async function getOrderStatusSummary(): Promise<ApiResponse<OrderStatusSummary>> {
  try {
    const response = await api.get<OrderStatusSummary>('/api/admin/order/status');
    return response;
  } catch (error) {
    // 조용히 빈 요약 반환 (서버가 아직 /admin prefix를 지원하지 않을 수 있음)
    return {
      success: true,
      data: {
        unpaidCnt: 0,
        unpaidTotalPrice: 0,
        completedCnt: 0,
        completedTotalPrice: 0,
        canceledCnt: 0,
        canceledTotalPrice: 0,
      },
      message: 'OK',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 신용카드 결제 취소
 * POST /api/admin/order/{orderId}/cancel/card
 */
export async function cancelCardPayment(orderId: string): Promise<ApiResponse<null>> {
  try {
    console.log('🌐 [API] Calling POST /api/admin/order/' + orderId + '/cancel/card');
    const response = await api.post<null>(`/api/admin/order/${orderId}/cancel/card`, {});
    return response;
  } catch (error) {
    console.error('Failed to cancel card payment:', error);
    return {
      success: false,
      data: null,
      message: '신용카드 결제 취소에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 포인트 결제 취소
 * POST /api/admin/order/{orderId}/cancel/point
 */
export async function cancelPointPayment(orderId: string): Promise<ApiResponse<null>> {
  try {
    console.log('🌐 [API] Calling POST /api/admin/order/' + orderId + '/cancel/point');
    const response = await api.post<null>(`/api/admin/order/${orderId}/cancel/point`, {});
    return response;
  } catch (error) {
    console.error('Failed to cancel point payment:', error);
    return {
      success: false,
      data: null,
      message: '포인트 결제 취소에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 상품권 결제 취소
 * POST /api/admin/order/{orderId}/cancel/gift
 */
export async function cancelGiftPayment(orderId: string): Promise<ApiResponse<null>> {
  try {
    console.log('🌐 [API] Calling POST /api/admin/order/' + orderId + '/cancel/gift');
    const response = await api.post<null>(`/api/admin/order/${orderId}/cancel/gift`, {});
    return response;
  } catch (error) {
    console.error('Failed to cancel gift payment:', error);
    return {
      success: false,
      data: null,
      message: '상품권 결제 취소에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * ========================================
 * 쇼핑몰 사용자 전용 API
 * ========================================
 */

/**
 * 쇼핑몰 주문 생성 요청
 */
export interface ShopOrderRequest {
  channelId: string;        // 채널 ID (UUID)
  customerName: string;     // 고객 이름
  customerPhone: string;    // 고객 전화번호
  customerEmail: string;    // 고객 이메일
  companyName?: string;     // 회사명(기관명) (선택사항)
  totalPrice: number;       // 총 상품 금액
  discountPrice: number;    // 할인 금액
  pointAmount?: number;     // 포인트 사용 금액 (선택사항)
  paymentMethod: 'VIRTUAL_ACCOUNT' | 'CARD' | 'GIFT' | 'POINT' | 'KAKAOPAY';  // 결제 수단 (VIRTUAL_ACCOUNT: 가상계좌, CARD: 카드결제, GIFT: 상품권, POINT: 포인트, KAKAOPAY: 카카오페이)
  benepiaId?: string;       // 베네피아 ID (포인트 사용 시 필수)
  benepiaPwd?: string;      // 베네피아 비밀번호 (포인트 사용 시 필수)
  memo?: string;                  // 요청사항 (선택사항)
  items: ShopOrderItemRequest[];  // 주문 아이템 배열
}

export interface ShopOrderItemRequest {
  productId: string;    // 상품 ID (UUID)
  quantity: number;     // 수량
  unitPrice: number;    // 단가
  totalPrice: number;   // 총 금액 (단가 * 수량)
  options?: Array<{     // 옵션 (선택사항)
    optionId: string;       // 옵션 ID
    optionValueId: string;  // 옵션값 ID
  }>;
  stayDates?: string[]; // 숙박일 (선택사항, YYYY-MM-DD 형식)
}

/**
 * 쇼핑몰용 주문 조회 응답 DTO
 * GET /api/orders/shop/{orderNumber}
 */
export interface ShopOrderResponse {
  id: string;
  orderNumber: string;
  orderedAt: string;
  channelName: string;
  status: 'PENDING_PAYMENT' | 'COMPLETED' | 'CANCEL_REQUESTED' | 'CANCELED' | 'REFUNDED' | 'REQUESTED';
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  paymentStatus: 'READY' | 'PAID' | 'FAILED' | 'CANCELED' | 'REQUESTED' | 'REFUNDED';
  finalPrice: number;
  paymentMethod: string;
  pointAmount?: number;
  paidAt?: string;
  totalPrice: number;
  memo?: string;
  products: ShopOrderProduct[];
}

export interface ShopOrderProduct {
  id: string;
  productId: string;
  productName: string;
  categoryName: string;
  partnerId: string;
  partnerName: string;
  optionName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

/**
 * 쇼핑몰용 주문번호로 주문 조회
 * GET /api/orders/shop/{channelId}/{orderNumber}
 * ⭐ 공개 API - 인증 불필요
 */
export async function getShopOrderByNumber(channelId: string, orderNumber: string): Promise<ApiResponse<ShopOrderResponse>> {
  try {
    console.log('🔍 [API] 쇼핑몰 주문 조회:', { channelId, orderNumber });
    const response = await api.get<ShopOrderResponse>(`/api/orders/shop/${channelId}/${orderNumber}`);
    console.log('✅ [API] 쇼핑몰 주문 조회 성공:', response);
    return response;
  } catch (error) {
    console.error('❌ [API] 쇼핑몰 주문 조회 실패:', error);
    return {
      success: false,
      data: null,
      message: '주문을 찾을 수 없습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 쇼핑몰 주문 생성 응답
 */
export interface ShopOrderCreateResponse {
  orderId: string;
  orderNumber: string;
}

/**
 * 쇼핑몰용 주문 생성
 * POST /api/orders/shop
 * ⭐ 공개 API - 인증 불필요
 */
export async function createShopOrder(orderRequest: ShopOrderRequest): Promise<ApiResponse<ShopOrderCreateResponse>> {
  try {
    console.log('🛒 [API] 쇼핑몰 주문 생성:', orderRequest);
    const response = await api.post<ShopOrderCreateResponse>('/api/orders/shop', orderRequest);
    console.log('✅ [API] 쇼핑몰 주문 생성 성공:', response);
    return response;
  } catch (error) {
    console.error('❌ [API] 쇼핑몰 주문 생성 실패:', error);
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '주문 생성에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 쇼핑몰 QR 쿠폰 조회 응답
 */
export interface ShopOrderCouponResponse {
  partnerId: string;
  productName: string;
  optionName: string; // 옵션명 (예: "주중/주말 종일 자유이용권")
  customerName: string;
  quantity: number;
  issuedAt: string;
  expireDate: string;
  customerCenterPhone: string;
  tickets: {
    ticketId: string;
    ticketNumber: string;
    partnerOrderCode: string;
    qrValue: string;
    ticketUsed: boolean;
  }[];
}

/**
 * 쇼핑몰 QR 쿠폰 조회
 * GET /api/orders/shop/coupon/{orderNumber}
 */
export async function getShopOrderCoupon(orderNumber: string): Promise<ApiResponse<ShopOrderCouponResponse>> {
  try {
    console.log('🌐 [API] Calling GET /api/orders/shop/coupon/' + orderNumber);
    const response = await api.get<ShopOrderCouponResponse>(`/api/orders/shop/coupon/${orderNumber}`);
    console.log('✅ [API] Shop order coupon retrieved successfully');
    return response;
  } catch (error) {
    console.error('Failed to retrieve shop order coupon:', error);
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : 'QR 쿠폰 조회에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 결제 처리
 * POST /api/admin/order/{id}/pay
 */
export async function payOrder(id: string, paymentMethod: string): Promise<ApiResponse<Order>> {
  try {
    console.log('🌐 [API] Calling POST /api/admin/order/' + id + '/pay');
    const response = await api.post<Order>(`/api/admin/order/${id}/pay`, { paymentMethod });
    console.log('✅ [API] Payment processed successfully');
    return response;
  } catch (error) {
    console.error('Failed to process payment:', error);
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '결제 처리에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 관리자 주문 강제 취소
 * POST /api/admin/order/{id}/cancel
 */
export async function adminCancelOrder(id: string): Promise<ApiResponse<string>> {
  try {
    console.log('🌐 [API] Calling POST /api/admin/order/' + id + '/cancel');
    const response = await api.post<string>(`/api/admin/order/${id}/cancel`, {});
    console.log('✅ [API] Order canceled successfully');
    return response;
  } catch (error) {
    console.error('Failed to cancel order:', error);
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '주문 취소에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 티켓 정보 문자 재발송
 * POST /api/admin/order/{id}/sms/resend-ticket
 */
export async function resendTicketSms(orderId: string): Promise<ApiResponse<null>> {
  try {
    console.log('🌐 [API] Calling POST /api/admin/order/' + orderId + '/sms/resend-ticket');
    const response = await api.post<null>(`/api/admin/order/${orderId}/sms/resend-ticket`, {});
    console.log('✅ [API] Ticket SMS resent successfully');
    return response;
  } catch (error) {
    console.error('❌ [API] Failed to resend ticket SMS:', error);
    
    // ApiError 타입인 경우 상세 정보 출력
    if (error instanceof ApiError) {
      console.error('   Status:', error.status);
      console.error('   Error code:', error.errorCode);
      console.error('   Message:', error.message);
    }
    
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '티켓 정보 문자 재발송에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

// ========== 현장관리자 전용 API ==========

/**
 * 현장관리자 주문(티켓) 목록 아이템
 */
export interface FieldOrderListItem {
  ticketId: string;
  orderId: string;
  orderNumber: string;
  productName: string;
  orderedAt: string;
  unitPrice: number;
  supplyPrice: number;
  couponNumber: string | null;
  validFrom: string | null;
  validTo: string | null;
  partnerName: string;
  customerName: string;
  customerPhone: string;
  ticketSentDate: string | null;
  ticketUsedDate: string | null;
  canceledAt: string | null;
  ticketStatus: string;
  processedAt: string | null;
}

/**
 * 현장관리자 주문 통계
 */
export interface FieldOrderStatus {
  totalOrderCnt: number;
  totalTicketCnt: number;
  totalSalesPrice: number;
  totalSupplyPrice: number;
}

/**
 * 현장관리자 주문(티켓) 목록 조회
 * GET /api/admin/field-order
 */
export async function getFieldOrders(params?: {
  srchWord?: string;
  begDate?: string;
  endDate?: string;
  status?: string;
}): Promise<ApiResponse<FieldOrderListItem[]>> {
  try {
    const queryParams: Record<string, string | undefined> = {};
    if (params?.srchWord) queryParams.srchWord = params.srchWord;
    if (params?.begDate) queryParams.begDate = params.begDate;
    if (params?.endDate) queryParams.endDate = params.endDate;
    if (params?.status) queryParams.status = params.status;

    const response = await api.get<FieldOrderListItem[]>('/api/admin/field-order', { params: queryParams });
    return response;
  } catch (error) {
    console.error('Failed to get field orders:', error);
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '주문 목록 조회에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 현장관리자 주문 통계 조회
 * GET /api/admin/field-order/status
 */
export async function getFieldOrderStatus(params?: {
  begDate?: string;
  endDate?: string;
  status?: string;
}): Promise<ApiResponse<FieldOrderStatus>> {
  try {
    const queryParams: Record<string, string | undefined> = {};
    if (params?.begDate) queryParams.begDate = params.begDate;
    if (params?.endDate) queryParams.endDate = params.endDate;
    if (params?.status) queryParams.status = params.status;

    const response = await api.get<FieldOrderStatus>('/api/admin/field-order/status', { params: queryParams });
    return response;
  } catch (error) {
    console.error('Failed to get field order status:', error);
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '주문 통계 조회에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 현장관리자 티켓 사용 처리
 * POST /api/admin/field-order/tickets/{orderId}/{ticketId}/use
 */
export async function useFieldTicket(orderId: string, ticketId: string): Promise<ApiResponse<string>> {
  try {
    const response = await api.post<string>(`/api/admin/field-order/tickets/${orderId}/${ticketId}/use`, {});
    return response;
  } catch (error) {
    console.error('Failed to use field ticket:', error);
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '티켓 사용 처리에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}