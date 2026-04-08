import { api, type ApiResponse } from '../api';

// ========================================
// 
// ========================================
const SESSION_CHANNEL_KEY = 'benepia_channel';

/**
 * 세션에서 베네피아 채널 코드 가져오기
 */
export function getSessionChannel(): string | null {
  if (typeof sessionStorage === 'undefined') return null;
  return sessionStorage.getItem(SESSION_CHANNEL_KEY);
}

/**
 * 세션에 베네피아 채널 코드 저장
 */
export function setSessionChannel(channelCode: string): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(SESSION_CHANNEL_KEY, channelCode);
}

/**
 * 세션에서 베네피아 채널 코드 제거
 */
export function clearSessionChannel(): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(SESSION_CHANNEL_KEY);
}

// ========================================
// API
// ========================================

/**
 * 베네피아 세션 응답 타입
 */
export interface BenepiaSessionResponse {
  channelCode: string;
}

/**
 * 베네피아 세션 API 호출
 * 
 * GET /api/benepia/session
 * - 서버에서 요청 헤더/쿠키/encParam으로 채널 코드 판단
 * - encParam이 있으면 복호화하여 채널 코드 반환
 * - 세션에 저장된 채널 코드 반환
 */
export async function getBenepiaSession(): Promise<ApiResponse<BenepiaSessionResponse>> {
  try {
    const response = await api.get<BenepiaSessionResponse>(`/api/benepia/session`);
    
    if (response.success && response.data) {
    } else {
    }
    
    return response;
  } catch (error) {
    // throw 
    return {
      success: false,
      message: '베네피아 세션 조회 실패',
      data: null,
      errorCode: 'BENEPIA_SESSION_ERROR'
    };
  }
}

/**
 * 베네피아 세션 초기화
 * encParam이 있는 경우 서버에서 채널 코드를 받아와 저장
 * 
 * @returns 채널 코드 (없거나 DEFAULT인 경우 null)
 */
export async function initBenepiaSession(): Promise<string | null> {
  try {
    // 1. 
    const savedChannel = getSessionChannel();
    if (savedChannel && savedChannel !== 'DEFAULT') {
      return savedChannel;
    }

    // 2. 
    const response = await getBenepiaSession();
    if (response.success && response.data?.channelCode) {
      const channelCode = response.data.channelCode;
      
      // 3. DEFAULT 
      if (channelCode !== 'DEFAULT') {
        setSessionChannel(channelCode);
        return channelCode;
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

// ========================================
// KCP API
// ========================================

/**
 * 베네피아 KCP 포인트 조회 요청
 */
export interface BenepiaPointRequest {
  amount: number;           // 
  benepiaId: string;        // ID
  benepiaPwd: string;       // 
  memcorpCd?: string;       // ()
}

/**
 * 베네피아 KCP 포인트 조회 응답
 */
export interface BenepiaPointResponse {
  res_cd: string;           // 
  res_msg: string;          // 
  rsv_pnt: number;          // 
}

/**
 * 베네피아 KCP 포인트 조회
 * 
 * POST /api/benepia/kcp/point
 */
export async function getBenepiaPoint(
  request: BenepiaPointRequest
): Promise<ApiResponse<BenepiaPointResponse>> {
  return api.post<BenepiaPointResponse>('/api/benepia/kcp/point', request);
}

// ========================================
// KCP API
// ========================================

/**
 * 베네피아 포인트 결제 요청
 */
export interface BenepiaPaymentRequest {
  amount: number;           // 
  benepiaId: string;        // ID
  benepiaPwd: string;       // 
  memcorpCd?: string;       // ()
  orderCode: string;        // 
  productName: string;      // 
}

/**
 * 베네피아 포인트 결제 응답
 */
export interface BenepiaPaymentResponse {
  success: boolean;         // 
  transactionId: string;    // ID
  amount: number;           // 
  remainingPoints: number;  // 
}

/**
 * 베네피아 KCP 포인트로 결제
 * 
 * POST /api/benepia/pay
 */
export async function payWithBenepiaPoint(
  request: BenepiaPaymentRequest
): Promise<ApiResponse<BenepiaPaymentResponse>> {
  return api.post<BenepiaPaymentResponse>('/api/benepia/pay', request);
}