/**
 * 팝업 관리 DTO
 * 
 * 백엔드 API 명세 기준
 */

/**
 * 팝업 타입
 */
export type PopupType = 'IMAGE' | 'HTML' | 'IFRAME';

/**
 * 팝업 위치
 */
export type PopupPosition = 'CENTER' | 'TOP_LEFT' | 'TOP_RIGHT' | 'BOTTOM_LEFT' | 'BOTTOM_RIGHT';

/**
 * 팝업 표시 조건
 */
export type PopupShowCondition = 'ALWAYS' | 'ONCE_PER_DAY' | 'ONCE_PER_SESSION' | 'ONCE_FOREVER';

/**
 * 팝업 상태
 */
export type PopupStatus = 'ACTIVE' | 'INACTIVE' | 'SCHEDULED' | 'EXPIRED';

/**
 * 팝업 채널 정보
 */
export interface PopupChannel {
  channelCode: string;
  channelName: string;
  visible: boolean;
}

/**
 * 팝업 목록 조회 응답 (관리자)
 */
export interface PopupResponse {
  id: string;
  name: string;
  description?: string;
  type: PopupType;
  position: PopupPosition;
  imageUrl?: string;
  imageUrlMobile?: string;
  htmlContent?: string;
  iframeUrl?: string;
  linkUrl?: string;
  linkTarget?: string; // _blank, _self
  startDate: string; // ISO 8601
  endDate?: string; // ISO 8601
  visible: boolean;
  displayOrder: number;
  showCondition: PopupShowCondition;
  showDelay: number; // milliseconds
  width?: number;
  height?: number;
  mobileWidth?: number;
  mobileHeight?: number;
  showCloseButton: boolean;
  showTodayCloseButton: boolean;
  backgroundOverlay: boolean;
  overlayOpacity?: number; // 0.0 ~ 1.0
  status: PopupStatus;
  channelCodes: string[]; // (: ["DEFAULT", "MOBILE"])
  channels: PopupChannel[]; // 
  pagePaths: string[]; // ["/home", "/product/{id}"]
  viewCount: number;
  clickCount: number;
  closeCount: number;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/**
 * 팝업 상세 조회 응답 (관리자)
 */
export interface PopupDetailResponse extends PopupResponse {
  // 
}

/**
 * 팝업 생성 요청
 */
export interface PopupCreateRequest {
  name: string;
  description?: string;
  type: PopupType;
  position: PopupPosition;
  imageUrl?: string;
  imageUrlMobile?: string;
  htmlContent?: string;
  iframeUrl?: string;
  linkUrl?: string;
  linkTarget?: string;
  startDate: string; // ISO 8601
  endDate?: string; // ISO 8601
  visible: boolean;
  displayOrder: number;
  showCondition: PopupShowCondition;
  showDelay: number;
  width?: number;
  height?: number;
  mobileWidth?: number;
  mobileHeight?: number;
  showCloseButton: boolean;
  showTodayCloseButton: boolean;
  backgroundOverlay: boolean;
  overlayOpacity?: number;
  channelCodes: string[];
  pagePaths: string[];
}

/**
 * 팝업 수정 요청 (모든 필드 선택사항)
 */
export interface PopupUpdateRequest {
  name?: string;
  description?: string;
  type?: PopupType;
  position?: PopupPosition;
  imageUrl?: string;
  imageUrlMobile?: string;
  htmlContent?: string;
  iframeUrl?: string;
  linkUrl?: string;
  linkTarget?: string;
  startDate?: string;
  endDate?: string;
  visible?: boolean;
  displayOrder?: number;
  showCondition?: PopupShowCondition;
  showDelay?: number;
  width?: number;
  height?: number;
  mobileWidth?: number;
  mobileHeight?: number;
  showCloseButton?: boolean;
  showTodayCloseButton?: boolean;
  backgroundOverlay?: boolean;
  overlayOpacity?: number;
  channelCodes?: string[];
  pagePaths?: string[];
}

/**
 * 팝업 목록 페이지 응답
 */
export interface PopupPageResponse {
  content: PopupResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

/**
 * 팝업 필터 (Query Parameters)
 */
export interface PopupFilter {
  keyword?: string;
  visible?: boolean;
  type?: PopupType;
  showCondition?: PopupShowCondition;
  page?: number;
  size?: number;
  sort?: string;
}

/**
 * 팝업 통계 응답
 */
export interface PopupStatsResponse {
  popupId: string;
  totalViews: number;
  totalClicks: number;
  totalClose: number;
  totalTodayClose: number;
  viewsByDate: {
    date: string;
    views: number;
  }[];
  viewsByChannel: {
    channelId: string;
    views: number;
  }[];
}