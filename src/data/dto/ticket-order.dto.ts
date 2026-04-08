/**
 * 티켓 주문 DTO
 * Ticket Order Data Transfer Objects
 */

import type {
  Timestamp,
  TicketOrderStatus,
  PaymentStatus,
  PaymentMethod,
  OrderChannel,
} from './types';

// ========================================
// 
// ========================================

/**
 * 주문자 정보
 */
export interface OrdererInfo {
  name: string;             // 
  phone: string;            // 
  email: string;            // 
  company?: string;         // 
  department?: string;      // 
}

/**
 * 티켓 주문
 */
export interface TicketOrder {
  id: string;
  orderNumber: string;
  channelOrderNumber?: string;
  orderDate: Timestamp;
  
  // 
  ordererInfo: OrdererInfo;
  
  // 
  items: TicketOrderItem[];
  
  // 
  itemsTotal: number;
  totalAmount: number;
  
  // 
  paymentStatus: PaymentStatus;
  paymentAmount: number;
  paymentMethod?: PaymentMethod;
  paymentDate?: Timestamp;
  
  // 
  orderStatus: TicketOrderStatus;
  channel: OrderChannel;
  requestMessage?: string;
  
  // ( )
  partnerId?: string;
  partnerName?: string;
  
  // 
  channelName?: string;
  
  // 
  tickets?: Ticket[];
  ticketUsed?: boolean; // true ( )
  
  // 
  createdAt: Timestamp;
  updatedAt: Timestamp;
  visible: boolean;
}

/**
 * 주문 상품 아이템
 */
export interface TicketOrderItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  categoryName: string;
  optionName?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  isUsed: boolean;
  partnerId?: string; // ID ( )
  partnerName?: string; // ( )
}

/**
 * 개별 티켓 정보
 */
export interface Ticket {
  ticketNumber: string; // (: TKT-20241202-001-01)
  productName: string;
  productId: string;
  partnerId?: string; // ID
  partnerName?: string; // 
  used: boolean; // 
  usedAt?: Timestamp; // 
  usedBy?: string; // 
}

// ========================================
// / DTO
// ========================================

/**
 * 주문 생성 DTO
 */
export interface CreateTicketOrderDto {
  // 
  ordererInfo: OrdererInfo;
  
  // 
  items: Omit<TicketOrderItem, 'id' | 'isUsed'>[];
  
  // 
  paymentMethod?: PaymentMethod;
  
  // 
  channel: OrderChannel;
  requestMessage?: string;
  
  // 
  channelOrderNumber?: string;
  
  // ( )
  partnerId?: string;
  partnerName?: string;
}

/**
 * 주문 수정 DTO
 */
export interface UpdateTicketOrderDto {
  id: string;
  
  // 
  ordererInfo?: OrdererInfo;
  
  // 
  items?: TicketOrderItem[];
  
  // 
  paymentStatus?: PaymentStatus;
  paymentAmount?: number;
  paymentMethod?: PaymentMethod;
  paymentDate?: Timestamp;
  
  // 
  orderStatus?: TicketOrderStatus;
  channel?: OrderChannel;
  requestMessage?: string;
  
  // 
  channelOrderNumber?: string;
  
  // 
  partnerId?: string;
  partnerName?: string;
  
  // 
  tickets?: Ticket[];
  ticketUsed?: boolean;
}

// ========================================
// DTO
// ========================================

/**
 * 티켓 사용 처리 DTO
 */
export interface UseTicketDto {
  orderId: string;
  ticketNumber: string;
  usedBy: string; // ID 
}

/**
 * 티켓 사용 취소 DTO
 */
export interface CancelTicketUseDto {
  orderId: string;
  ticketNumber: string;
}

// ========================================
// / DTO
// ========================================

/**
 * 주문 검색 필터
 */
export interface TicketOrderFilter {
  search?: string;                  // (, , )
  orderStatus?: TicketOrderStatus;  // 
  paymentStatus?: PaymentStatus;    // 
  channel?: OrderChannel;           // 
  partnerId?: string;               // ID
  startDate?: Timestamp;            // 
  endDate?: Timestamp;              // 
  ticketUsed?: boolean;             // 
}

// ========================================
// Export all types from types.ts
// ========================================
export type {
  TicketOrderStatus,
  PaymentStatus,
  PaymentMethod,
  OrderChannel,
  Timestamp,
} from './types';