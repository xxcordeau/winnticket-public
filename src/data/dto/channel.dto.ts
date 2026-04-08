/**
 * Channel DTO
 * 채널 데이터 전송 객체
 */

// ========================================
// Brand Types ( )
// ========================================
type UUID = string & { __brand: "UUID" };
type Timestamp = string & { __brand: "Timestamp" };

// ========================================
// Channel ()
// ========================================

/**
 * 채널 응답 DTO
 */
export interface Channel {
  id: UUID;
  channelCode: string;
  channelName: string;
  companyName: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  websiteUrl?: string;
  domain?: string; // (API )
  commissionRate?: number; // (%)
  active: boolean;
  useCard?: boolean; // 
  usePoint?: boolean; // 
  excludedProductIds?: string[]; // ID 
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * 채널 생성 요청 DTO
 */
export interface CreateChannelDto {
  channelCode: string;
  channelName: string;
  companyName: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  websiteUrl?: string;
  domain?: string; // (API )
  commissionRate?: number; // (%)
  active?: boolean;
  useCard?: boolean; // 
  usePoint?: boolean; // 
}

/**
 * 채널 수정 요청 DTO
 */
export interface UpdateChannelDto {
  id: string;
  channelCode?: string;
  channelName?: string;
  companyName?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  websiteUrl?: string;
  domain?: string; // (API )
  commissionRate?: number; // (%)
  active?: boolean;
  useCard?: boolean; // 
  usePoint?: boolean; // 
  excludedProductIds?: string[]; // ID 
}

// ========================================
// Channel Point Policy ( )
// ========================================

/**
 * 포인트 획득 타입
 */
export type PointEarnType = "ORDER" | "REVIEW" | "LOGIN";

/**
 * 채널 포인트 정책 응답 DTO
 */
export interface ChannelPointPolicy {
  id: string;
  channelId: string;
  earnType: PointEarnType;          // 
  earnAmount: number;               // 
  earnRate: number;                 // (%)
  earnCondition: string;            // 
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * 채널 포인트 정책 생성 요청 DTO
 */
export interface CreateChannelPointPolicyDto {
  channelId: string;
  earnType: PointEarnType;          // 
  earnAmount: number;               // 
  earnRate: number;                 // (%)
  earnCondition: string;            // 
}