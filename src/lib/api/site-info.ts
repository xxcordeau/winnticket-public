import { api } from '../api';
import type { ApiResponse } from '../api';

/**
 * 사이트 정보 Response DTO
 */
export interface SiteInfoResponse {
  id: number;
  
  // 
  companyName: string;
  businessNumber: string;
  ceoName: string;
  establishedDate: string; // ISO 8601 date string
  
  // 
  address: string;
  addressDetail: string;
  postalCode: string;
  tel: string;
  fax: string;
  email: string;
  
  // 
  customerServiceTel: string;
  customerServiceEmail: string;
  businessHours: string;
  
  // 
  onlineMarketingNumber: string;
  privacyOfficerName: string;
  privacyOfficerEmail: string;
  
  // 
  companyIntroduction: string;
  termsOfService: string;
  privacyPolicy: string;
  refundPolicy: string;
  
  // 
  createdAt: string; // ISO 8601 datetime string
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

/**
 * 사이트 정보 Request DTO (등록/수정)
 */
export interface SiteInfoRequest {
  // 
  companyName: string;
  businessNumber: string;
  ceoName: string;
  establishedDate: string;
  
  // 
  address: string;
  addressDetail: string;
  postalCode: string;
  tel: string;
  fax: string;
  email: string;
  
  // 
  customerServiceTel: string;
  customerServiceEmail: string;
  businessHours: string;
  
  // 
  onlineMarketingNumber: string;
  privacyOfficerName: string;
  privacyOfficerEmail: string;
  
  // 
  companyIntroduction: string;
  termsOfService: string;
  privacyPolicy: string;
  refundPolicy: string;
}

/**
 * 회사소개 Response DTO (공개용)
 */
export interface CompanyIntroResponse {
  companyName: string;
  businessNumber: string;
  ceoName: string;
  establishedDate: string;
  address: string;
  tel: string;
  email: string;
  companyIntroduction: string;
}

// ( API )
let MOCK_SITE_INFO: SiteInfoResponse = {
  id: 1,
  
  // 
  companyName: "(주)티켓박스",
  businessNumber: "123-45-67890",
  ceoName: "홍길동",
  establishedDate: "2020-01-01",
  
  // 
  address: "서울특별시 강남구 테헤란로 123",
  addressDetail: "위너빌딩 5층",
  postalCode: "06234",
  tel: "02-1234-5678",
  fax: "02-1234-5679",
  email: "contact@ticketbox.com",
  
  // 
  customerServiceTel: "1588-1234",
  customerServiceEmail: "support@ticketbox.com",
  businessHours: "평일 09:00-18:00 (주말 및 공휴일 휴무)",
  
  // 
  onlineMarketingNumber: "제2024-서울강남-12345호",
  privacyOfficerName: "김철수",
  privacyOfficerEmail: "privacy@ticketbox.com",
  
  // 
  companyIntroduction: `티켓박스는 대한민국 최고의 티켓 판매 플랫폼입니다.

콘서트, 뮤지컬, 스포츠, 전시, 클래식 등 다양한 장르의 티켓을 안전하고 편리하게 구매하실 수 있습니다.

2020년 설립 이래로 고객 만족을 최우선으로 하며, 신뢰할 수 있는 서비스를 제공하기 위해 노력하고 있습니다.`,
  termsOfService: "이용약관 내용이 여기에 표시됩니다.",
  privacyPolicy: "개인정보처리방침 내용이 여기에 표시됩니다.",
  refundPolicy: "환불정책 내용이 여기에 표시됩니다.",
  
  // 
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: new Date().toISOString(),
  createdBy: "admin",
  updatedBy: "admin",
};

/**
 * 사이트 정보 조회
 * GET /api/admin/site-info
 */
export async function getSiteInfo(): Promise<ApiResponse<SiteInfoResponse>> {
  try {
    const response = await api.get<SiteInfoResponse>('/api/admin/site-info');
    return response;
  } catch (error) {
    // API 
    return {
      success: true,
      data: MOCK_SITE_INFO,
      message: '사이트 정보 조회 성공',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 사이트 정보 등록
 * POST /api/admin/site-info
 */
export async function createSiteInfo(data: SiteInfoRequest): Promise<ApiResponse<SiteInfoResponse>> {
  try {
    const response = await api.post<SiteInfoResponse>('/api/admin/site-info', data);
    return response;
  } catch (error) {
    // API 
    const newData: SiteInfoResponse = {
      ...MOCK_SITE_INFO,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return {
      success: true,
      data: newData,
      message: '사이트 정보 등록 성공',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 사이트 정보 수정
 * PUT /api/admin/site-info
 */
export async function updateSiteInfo(data: SiteInfoRequest): Promise<ApiResponse<SiteInfoResponse>> {
  try {
    const response = await api.put<SiteInfoResponse>('/api/admin/site-info', data);
    return response;
  } catch (error) {
    // API 
    const updatedData: SiteInfoResponse = {
      ...MOCK_SITE_INFO,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    // ( )
    MOCK_SITE_INFO = updatedData;
    return {
      success: true,
      data: updatedData,
      message: '사이트 정보 수정 성공',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 회사소개 조회 (공개용)
 * GET /api/admin/site-info/company-intro
 */
export async function getCompanyIntro(): Promise<ApiResponse<CompanyIntroResponse>> {
  try {
    const response = await api.get<CompanyIntroResponse>('/api/admin/site-info/company-intro');
    return response;
  } catch (error) {
    // API 
    const companyIntro: CompanyIntroResponse = {
      companyName: MOCK_SITE_INFO.companyName,
      businessNumber: MOCK_SITE_INFO.businessNumber,
      ceoName: MOCK_SITE_INFO.ceoName,
      establishedDate: MOCK_SITE_INFO.establishedDate,
      address: MOCK_SITE_INFO.address,
      tel: MOCK_SITE_INFO.tel,
      email: MOCK_SITE_INFO.email,
      companyIntroduction: MOCK_SITE_INFO.companyIntroduction,
    };
    return {
      success: true,
      data: companyIntro,
      message: '회사소개 조회 성공',
      timestamp: new Date().toISOString(),
    };
  }
}