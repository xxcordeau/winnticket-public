/**
 * 배너 관리 DTO
 * 
 * 백엔드 API 명세 기준
 */

/**
 * 배너 위치
 */
export type BannerPosition = 'MAIN_TOP' | 'MAIN_MIDDLE' | 'MAIN_BOTTOM' | 'SUB' | 'FOOTER';

/**
 * 배너 타입
 */
export type BannerType = 'IMAGE' | 'HTML' | 'VIDEO';

/**
 * 배너 클릭 액션
 */
export type BannerClickAction = 'LINK' | 'NONE';

/**
 * 배너 상태
 */
export type BannerStatus = 'ACTIVE' | 'INACTIVE' | 'SCHEDULED' | 'EXPIRED';

/**
 * 배너 목록 조회 응답 (관리자)
 */
export interface BannerResponse {
  id: string;
  name: string;
  description?: string;
  type: BannerType;
  position: BannerPosition;
  imageUrl?: string;
  imageUrlMobile?: string;
  htmlContent?: string;
  videoUrl?: string;
  clickAction: BannerClickAction;
  linkUrl?: string;
  linkTarget?: string; // _blank, _self
  startDate: string; // ISO 8601
  endDate?: string; // ISO 8601
  visible: boolean;
  displayOrder: number;
  viewCount: number;
  clickCount: number;
  width?: number;
  height?: number;
  mobileWidth?: number;
  mobileHeight?: number;
  status: BannerStatus;
  channelIds: string[]; // UUID[]
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/**
 * 배너 상세 조회 응답 (관리자)
 */
export interface BannerDetailResponse extends BannerResponse {
  // 
}

/**
 * 배너 생성 요청
 */
export interface BannerCreateRequest {
  name: string;
  description?: string;
  type: BannerType;
  position: BannerPosition;
  imageUrl?: string;
  imageUrlMobile?: string;
  htmlContent?: string;
  videoUrl?: string;
  clickAction: BannerClickAction;
  linkUrl?: string;
  linkTarget?: string;
  startDate: string; // ISO 8601
  endDate?: string; // ISO 8601
  visible: boolean;
  displayOrder: number;
  width?: number;
  height?: number;
  mobileWidth?: number;
  mobileHeight?: number;
  channelIds: string[]; // UUID[]
}

/**
 * 배너 수정 요청 (모든 필드 선택사항)
 */
export interface BannerUpdateRequest {
  name?: string;
  description?: string;
  type?: BannerType;
  position?: BannerPosition;
  imageUrl?: string;
  imageUrlMobile?: string;
  htmlContent?: string;
  videoUrl?: string;
  clickAction?: BannerClickAction;
  linkUrl?: string;
  linkTarget?: string;
  startDate?: string;
  endDate?: string;
  visible?: boolean;
  displayOrder?: number;
  width?: number;
  height?: number;
  mobileWidth?: number;
  mobileHeight?: number;
  channelIds?: string[];
}

/**
 * 배너 목록 페이지 응답
 */
export interface BannerPageResponse {
  content: BannerResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

/**
 * 배너 필터 (Query Parameters)
 */
export interface BannerFilter {
  keyword?: string; // / 
  position?: BannerPosition;
  visible?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

/**
 * 배너 통계 응답
 */
export interface BannerStatsResponse {
  bannerId: string;
  totalViews: number;
  totalClicks: number;
  clickRate: number;
  viewsByDate: {
    date: string;
    views: number;
  }[];
  viewsByChannel: {
    channelId: string;
    views: number;
  }[];
}
