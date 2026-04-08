/**
 * 파트너 관리 데이터 스토어
 */

import {
  Partner,
  PartnerStatus,
  PartnerType,
  PartnerDiscountPolicy,
  CreatePartnerDto,
  UpdatePartnerDto,
  PartnerListResponse,
  PartnerResponse,
  PartnerDiscountPolicyListResponse,
  PartnerDiscountPolicyResponse,
  PartnerProduct,
  PartnerProductListResponse,
  PartnerSalesStats,
  PartnerSalesStatsResponse,
} from './dto';
import { DiscountType } from './dto/partner.dto';
import { ApiResponse, PagedResponse } from './dto/utils';
import { generateUUID } from '../lib/utils/uuid';

// LocalStorage 
const STORAGE_KEY_PARTNERS = 'ticketing_partners';
const STORAGE_KEY_PARTNER_DISCOUNTS = 'ticketing_partner_discounts';

// 
const INITIAL_PARTNERS: Partner[] = [
  // API 
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    code: 'VENUE001',
    name: '올림픽공원 체조경기장',
    type: PartnerType.VENUE,
    status: PartnerStatus.ACTIVE,
    managerName: '김영희',
    managerEmail: 'younghee@olympicpark.co.kr',
    managerPhone: '02-410-1114',
    contractStartDate: '2024-01-01T00:00:00Z',
    contractEndDate: '2024-12-31T23:59:59Z',
    commissionRate: 15,
    couponCode: true,
    productCount: 156,
    lastOrderDate: '2024-11-23T16:00:00Z',
    totalSales: 295000000,
    totalOrders: 8930,
    businessNumber: '123-45-67890',
    address: '서울특별시 송파구 올림픽로 424',
    description: '대형 콘서트 및 스포츠 경기 전용',
    logoUrl: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=200&h=200&fit=crop',
    createdAt: '2024-01-01T09:00:00Z',
    updatedAt: '2024-11-23T16:00:00Z',
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174001',
    code: 'PROMOTER001',
    name: '예스24 라이브홀',
    type: PartnerType.PROMOTER,
    status: PartnerStatus.ACTIVE,
    managerName: '이철수',
    managerEmail: 'cheolsu@yes24.com',
    managerPhone: '1544-3800',
    contractStartDate: '2024-01-01T00:00:00Z',
    contractEndDate: '2024-12-31T23:59:59Z',
    commissionRate: 12,
    couponCode: true,
    productCount: 89,
    lastOrderDate: '2024-11-24T10:30:00Z',
    totalSales: 180000000,
    totalOrders: 5240,
    businessNumber: '234-56-78901',
    address: '서울특별시 강남구 강남대로 456',
    description: '인디 음악과 소규모 공연 전문',
    logoUrl: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=200&h=200&fit=crop',
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-11-24T10:30:00Z',
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174002',
    code: 'AGENCY001',
    name: 'SM엔터테인먼트',
    type: PartnerType.AGENCY,
    status: PartnerStatus.ACTIVE,
    managerName: '박민수',
    managerEmail: 'minsu@smtown.com',
    managerPhone: '02-3416-8888',
    contractStartDate: '2024-01-01T00:00:00Z',
    contractEndDate: '2024-12-31T23:59:59Z',
    commissionRate: 10,
    couponCode: false,
    productCount: 67,
    lastOrderDate: '2024-11-23T12:00:00Z',
    totalSales: 420000000,
    totalOrders: 12450,
    businessNumber: '345-67-89012',
    address: '서울특별시 강남구 압구정로 456',
    description: 'K-POP 콘서트 및 팬미팅 전문',
    logoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-11-23T12:00:00Z',
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174003',
    code: 'VENUE002',
    name: '세종문화회관',
    type: PartnerType.VENUE,
    status: PartnerStatus.ACTIVE,
    managerName: '정수진',
    managerEmail: 'sujin@sejongpac.or.kr',
    managerPhone: '02-399-1000',
    contractStartDate: '2024-02-01T00:00:00Z',
    contractEndDate: '2025-01-31T23:59:59Z',
    commissionRate: 18,
    couponCode: true,
    productCount: 98,
    lastOrderDate: '2024-11-22T11:30:00Z',
    totalSales: 178000000,
    totalOrders: 4560,
    businessNumber: '456-78-90123',
    address: '서울특별시 종로구 세종대로 175',
    description: '클래식과 국악 중심의 전통 문화 공간',
    logoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
    createdAt: '2024-02-01T08:30:00Z',
    updatedAt: '2024-11-22T11:30:00Z',
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174004',
    code: 'ARTIST001',
    name: 'BTS 공식 에이전시',
    type: PartnerType.ARTIST,
    status: PartnerStatus.ACTIVE,
    managerName: '최지훈',
    managerEmail: 'jihoon@bighit.com',
    managerPhone: '02-6980-8888',
    contractStartDate: '2024-01-01T00:00:00Z',
    contractEndDate: '2025-12-31T23:59:59Z',
    commissionRate: 8,
    couponCode: false,
    productCount: 45,
    lastOrderDate: '2024-11-24T14:20:00Z',
    totalSales: 850000000,
    totalOrders: 28900,
    businessNumber: '567-89-01234',
    address: '서울특별시 용산구 한강대로 42',
    description: '글로벌 아티스트 BTS 공식 공연 관리',
    logoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-11-24T14:20:00Z',
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174005',
    code: 'CORPORATE001',
    name: '현대카드 DIVE',
    type: PartnerType.CORPORATE,
    status: PartnerStatus.PENDING,
    managerName: '강민호',
    managerEmail: 'minho@hyundaicard.com',
    managerPhone: '1577-6000',
    contractStartDate: '2024-03-01T00:00:00Z',
    contractEndDate: '2024-12-31T23:59:59Z',
    commissionRate: 20,
    couponCode: true,
    productCount: 23,
    lastOrderDate: '2024-11-21T09:15:00Z',
    totalSales: 78000000,
    totalOrders: 1890,
    businessNumber: '678-90-12345',
    address: '서울특별시 종로구 청계천로 86',
    description: '현대카드 멤버십 전용 공연장',
    logoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
    createdAt: '2024-03-01T11:00:00Z',
    updatedAt: '2024-11-21T09:15:00Z',
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174006',
    code: 'VENUE003',
    name: '롯데콘서트홀',
    type: PartnerType.VENUE,
    status: PartnerStatus.INACTIVE,
    managerName: '윤서연',
    managerEmail: 'seoyeon@lotteconcerthall.com',
    managerPhone: '02-1234-5678',
    contractStartDate: '2023-01-01T00:00:00Z',
    contractEndDate: '2023-12-31T23:59:59Z',
    commissionRate: 16,
    couponCode: true,
    productCount: 0,
    lastOrderDate: '2023-12-30T18:45:00Z',
    totalSales: 85000000,
    totalOrders: 2340,
    businessNumber: '789-01-23456',
    address: '서울특별시 송파구 올림픽로 300',
    description: '세계적 수준의 음향 시설을 갖춘 클래식 전문 공연장 (계약 만료)',
    logoUrl: '@/assets/d3a078d044ed8fb80e890a1f321da57a19ac6624.png',
    createdAt: '2023-01-15T09:00:00Z',
    updatedAt: '2023-12-30T18:45:00Z',
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174007',
    code: 'PROMOTER002',
    name: '인터파크 티켓',
    type: PartnerType.PROMOTER,
    status: PartnerStatus.ACTIVE,
    managerName: '송민재',
    managerEmail: 'minjae@interpark.com',
    managerPhone: '1544-1555',
    contractStartDate: '2024-01-15T00:00:00Z',
    contractEndDate: '2024-12-31T23:59:59Z',
    commissionRate: 13,
    couponCode: true,
    productCount: 342,
    lastOrderDate: '2024-11-24T14:20:00Z',
    totalSales: 680000000,
    totalOrders: 28900,
    businessNumber: '890-12-34567',
    address: '서울특별시 강남구 삼성동 159',
    description: '온라인 티켓 예매 플랫폼',
    logoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-11-24T14:20:00Z',
  },
  // 
  {
    id: 'PARTNER-SAC',
    code: 'VENUE006',
    name: '예술의전당',
    type: PartnerType.VENUE,
    status: PartnerStatus.ACTIVE,
    managerName: '박예술',
    managerEmail: 'art@sac.or.kr',
    managerPhone: '02-580-1300',
    contractStartDate: '2024-01-01T00:00:00Z',
    contractEndDate: '2025-12-31T23:59:59Z',
    commissionRate: 12,
    couponCode: true,
    productCount: 128,
    lastOrderDate: '2024-11-22T18:45:00Z',
    totalSales: 230000000,
    totalOrders: 5680,
    businessNumber: '234-56-78901',
    address: '서울특별시 서초구 남부순환로 2406',
    description: '대한민국 대표 종합 예술 공간',
    logoUrl: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=200&h=200&fit=crop',
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-11-22T18:45:00Z',
  },
  {
    id: 'PARTNER-LG-ART',
    code: 'VENUE007',
    name: 'LG아트센터',
    type: PartnerType.VENUE,
    status: PartnerStatus.ACTIVE,
    managerName: '최공연',
    managerEmail: 'performance@lgartcenter.com',
    managerPhone: '02-2005-0114',
    contractStartDate: '2024-03-01T00:00:00Z',
    contractEndDate: '2026-02-28T23:59:59Z',
    commissionRate: 10,
    couponCode: false,
    productCount: 67,
    lastOrderDate: '2024-11-23T12:00:00Z',
    totalSales: 145000000,
    totalOrders: 3240,
    businessNumber: '345-67-89012',
    address: '서울특별시 강남구 역삼동 679',
    description: '뮤지컬과 연극 중심의 복합 문화 공간',
    logoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-11-23T12:00:00Z',
  },
  {
    id: 'PARTNER-CHARLOTTE',
    code: 'AGENCY004',
    name: '샤롯데씨어터',
    type: PartnerType.AGENCY,
    status: PartnerStatus.ACTIVE,
    managerName: '정기획',
    managerEmail: 'plan@charlottetheater.com',
    managerPhone: '02-3456-7890',
    contractStartDate: '2024-01-15T00:00:00Z',
    contractEndDate: '2025-12-31T23:59:59Z',
    commissionRate: 18,
    couponCode: true,
    productCount: 23,
    lastOrderDate: '2024-11-21T09:15:00Z',
    totalSales: 78000000,
    totalOrders: 1890,
    businessNumber: '456-78-90123',
    address: '서울특별시 중구 소공로 106',
    description: '글로벌 뮤지컬 제작 및 공연 기획',
    logoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
    createdAt: '2024-01-15T11:00:00Z',
    updatedAt: '2024-11-21T09:15:00Z',
  },
  {
    id: 'PARTNER-HYBE',
    code: 'AGENCY005',
    name: '하이브 엔터테인먼트',
    type: PartnerType.AGENCY,
    status: PartnerStatus.ACTIVE,
    managerName: '강콘서트',
    managerEmail: 'concert@hybe.com',
    managerPhone: '02-6980-8888',
    contractStartDate: '2024-02-01T00:00:00Z',
    contractEndDate: '2026-01-31T23:59:59Z',
    commissionRate: 20,
    couponCode: false,
    productCount: 89,
    lastOrderDate: '2024-11-24T10:30:00Z',
    totalSales: 420000000,
    totalOrders: 12450,
    businessNumber: '567-89-01234',
    address: '서울특별시 용산구 한강대로 42',
    description: 'K-POP 콘서트 및 팬미팅 전문',
    logoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    createdAt: '2024-02-01T09:30:00Z',
    updatedAt: '2024-11-24T10:30:00Z',
  },
  {
    id: 'PARTNER-CJENM',
    code: 'AGENCY006',
    name: 'CJ ENM 라이브',
    type: PartnerType.AGENCY,
    status: PartnerStatus.ACTIVE,
    managerName: '송제작',
    managerEmail: 'live@cjenm.com',
    managerPhone: '02-371-7777',
    contractStartDate: '2024-02-15T00:00:00Z',
    contractEndDate: '2026-02-14T23:59:59Z',
    commissionRate: 15,
    couponCode: false,
    productCount: 112,
    lastOrderDate: '2024-11-24T13:45:00Z',
    totalSales: 340000000,
    totalOrders: 9870,
    businessNumber: '901-23-45678',
    address: '서울특별시 마포구 상암산로 66',
    description: 'K-POP 및 페스티벌 기획 전문',
    logoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop',
    createdAt: '2024-02-15T10:00:00Z',
    updatedAt: '2024-11-24T13:45:00Z',
  },
  {
    id: 'PARTNER-BLUESQUARE',
    code: 'VENUE008',
    name: '블루스퀘어',
    type: PartnerType.VENUE,
    status: PartnerStatus.ACTIVE,
    managerName: '한뮤지컬',
    managerEmail: 'musical@bluesquare.kr',
    managerPhone: '1644-1897',
    contractStartDate: '2024-01-01T00:00:00Z',
    contractEndDate: '2025-12-31T23:59:59Z',
    commissionRate: 14,
    couponCode: true,
    productCount: 76,
    lastOrderDate: '2024-11-24T09:00:00Z',
    totalSales: 198000000,
    totalOrders: 5430,
    businessNumber: '012-34-56789',
    address: '서울특별시 용산구 이태원로 294',
    description: '뮤지컬 전용 공연장',
    logoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    createdAt: '2024-01-01T09:00:00Z',
    updatedAt: '2024-11-24T09:00:00Z',
  },
  {
    id: 'PARTNER-SM',
    code: 'ARTIST002',
    name: 'SM엔터테인먼트',
    type: PartnerType.ARTIST,
    status: PartnerStatus.ACTIVE,
    managerName: '조아티스트',
    managerEmail: 'artist@smtown.com',
    managerPhone: '02-3443-0505',
    contractStartDate: '2024-03-01T00:00:00Z',
    contractEndDate: '2026-02-28T23:59:59Z',
    commissionRate: 22,
    couponCode: true,
    productCount: 54,
    lastOrderDate: '2024-11-23T17:30:00Z',
    totalSales: 560000000,
    totalOrders: 18900,
    businessNumber: '123-98-76543',
    address: '서울특별시 강남구 압구정로 423',
    description: 'K-POP 아티스트 소속사',
    logoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
    createdAt: '2024-03-01T11:00:00Z',
    updatedAt: '2024-11-23T17:30:00Z',
  },
  {
    id: 'PARTNER-LOTTEWORLD',
    code: 'CORPORATE002',
    name: '롯데월드 어드벤처',
    type: PartnerType.CORPORATE,
    status: PartnerStatus.ACTIVE,
    managerName: '서테마',
    managerEmail: 'theme@lotteworld.com',
    managerPhone: '02-411-2000',
    contractStartDate: '2024-01-01T00:00:00Z',
    contractEndDate: '2025-12-31T23:59:59Z',
    commissionRate: 8,
    couponCode: false,
    productCount: 234,
    lastOrderDate: '2024-11-24T15:00:00Z',
    totalSales: 890000000,
    totalOrders: 45600,
    businessNumber: '234-87-65432',
    address: '서울특별시 송파구 올림픽로 240',
    description: '테마파크 및 전시 이벤트',
    logoUrl: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=200&h=200&fit=crop',
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2024-11-24T15:00:00Z',
  },
  {
    id: 'PARTNER-MUSEUM',
    code: 'VENUE009',
    name: '국립중앙박물관',
    type: PartnerType.VENUE,
    status: PartnerStatus.ACTIVE,
    managerName: '전시관',
    managerEmail: 'exhibition@museum.go.kr',
    managerPhone: '02-2077-9000',
    contractStartDate: '2024-01-01T00:00:00Z',
    contractEndDate: '2025-12-31T23:59:59Z',
    commissionRate: 5,
    couponCode: true,
    productCount: 189,
    lastOrderDate: '2024-11-24T14:00:00Z',
    totalSales: 234000000,
    totalOrders: 12340,
    businessNumber: '345-76-54321',
    address: '서울특별시 용산구 서빙고로 137',
    description: '전시 및 문화 행사 전문',
    logoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    createdAt: '2024-01-01T09:00:00Z',
    updatedAt: '2024-11-24T14:00:00Z',
  },
  {
    id: 'PARTNER-SHOWNOTE',
    code: 'AGENCY007',
    name: '쇼노트',
    type: PartnerType.AGENCY,
    status: PartnerStatus.PENDING,
    managerName: '노신규',
    managerEmail: 'new@shownote.net',
    managerPhone: '02-1111-2222',
    contractStartDate: '2024-12-01T00:00:00Z',
    contractEndDate: '2026-11-30T23:59:59Z',
    commissionRate: 16,
    couponCode: true,
    productCount: 0,
    totalSales: 0,
    totalOrders: 0,
    businessNumber: '456-65-43210',
    address: '서울특별시 마포구 월드컵북로 396',
    description: '공연 기획 및 제작 (신규)',
    logoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
    createdAt: '2024-11-15T10:00:00Z',
    updatedAt: '2024-11-15T10:00:00Z',
  },
  {
    id: 'PARTNER-DCUBE',
    code: 'VENUE010',
    name: '디큐브아트센터',
    type: PartnerType.VENUE,
    status: PartnerStatus.INACTIVE,
    managerName: '권휴관',
    managerEmail: 'dcube@dcubecity.com',
    managerPhone: '02-2211-0000',
    contractStartDate: '2023-01-01T00:00:00Z',
    contractEndDate: '2024-12-31T23:59:59Z',
    commissionRate: 12,
    couponCode: false,
    productCount: 23,
    lastOrderDate: '2024-09-15T10:00:00Z',
    totalSales: 45000000,
    totalOrders: 890,
    businessNumber: '567-54-32109',
    address: '서울특별시 구로구 경인로 662',
    description: '복합 쇼핑몰 내 공연장 (현재 리모델링 중)',
    logoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
    createdAt: '2023-01-01T09:00:00Z',
    updatedAt: '2024-09-15T10:00:00Z',
  },
];

// 
const INITIAL_PARTNER_DISCOUNTS: PartnerDiscountPolicy[] = [
  {
    id: generateUUID(),
    partnerId: INITIAL_PARTNERS[0].id,
    name: '단체 할인',
    discountType: DiscountType.PERCENTAGE,
    discountValue: 10,
    minQuantity: 10,
    maxQuantity: 50,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    description: '10명 이상 단체 구매 시 10% 할인',
    isActive: true,
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-15T09:00:00Z',
  },
  {
    id: generateUUID(),
    partnerId: INITIAL_PARTNERS[1].id,
    name: '조기 예매 할인',
    discountType: DiscountType.PERCENTAGE,
    discountValue: 15,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    description: '공연 30일 전 예매 시 15% 할인',
    isActive: true,
    createdAt: '2024-01-20T10:30:00Z',
    updatedAt: '2024-01-20T10:30:00Z',
  },
];

/**
 * 파트너 목록 로드
 */
function loadPartners(): Partner[] {
  if (typeof window === 'undefined') return INITIAL_PARTNERS;
  
  const stored = localStorage.getItem(STORAGE_KEY_PARTNERS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY_PARTNERS, JSON.stringify(INITIAL_PARTNERS));
    return INITIAL_PARTNERS;
  }
  
  return JSON.parse(stored);
}

/**
 * 파트너 목록 저장
 */
function savePartners(partners: Partner[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_PARTNERS, JSON.stringify(partners));
}

/**
 * 파트너 할인 정책 목록 로드
 */
function loadPartnerDiscounts(): PartnerDiscountPolicy[] {
  if (typeof window === 'undefined') return INITIAL_PARTNER_DISCOUNTS;
  
  const stored = localStorage.getItem(STORAGE_KEY_PARTNER_DISCOUNTS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY_PARTNER_DISCOUNTS, JSON.stringify(INITIAL_PARTNER_DISCOUNTS));
    return INITIAL_PARTNER_DISCOUNTS;
  }
  
  return JSON.parse(stored);
}

/**
 * 파트너 할인 정책 목록 저장
 */
function savePartnerDiscounts(discounts: PartnerDiscountPolicy[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_PARTNER_DISCOUNTS, JSON.stringify(discounts));
}

/**
 * 파트너 목록 조회 (페이징)
 */
export function getPartners(
  page: number = 1,
  pageSize: number = 10,
  status?: PartnerStatus,
  type?: PartnerType,
  search?: string
): PartnerListResponse {
  let partners = loadPartners();
  
  // 
  if (status) {
    partners = partners.filter(p => p.status === status);
  }
  if (type) {
    partners = partners.filter(p => p.type === type);
  }
  if (search) {
    const searchLower = search.toLowerCase();
    partners = partners.filter(p => 
      p.name.toLowerCase().includes(searchLower) ||
      p.code.toLowerCase().includes(searchLower) ||
      p.managerName?.toLowerCase().includes(searchLower)
    );
  }
  
  // 
  const total = partners.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const paginatedPartners = partners.slice(start, start + pageSize);
  
  const pagedResponse: PagedResponse<Partner> = {
    content: paginatedPartners,
    page,
    pageSize,
    totalElements: total,
    totalPages,
  };
  
  return {
    success: true,
    data: pagedResponse,
    message: '파트너 목록을 조회했습니다.',
    timestamp: new Date().toISOString(),
  };
}

/**
 * 파트너 상세 조회
 */
export function getPartnerById(id: string): PartnerResponse {
  const partners = loadPartners();
  const partner = partners.find(p => p.id === id);
  
  if (!partner) {
    return {
      success: false,
      data: null as any,
      message: '파트너를 찾을 수 없습니다.',
      timestamp: new Date().toISOString(),
    };
  }
  
  return {
    success: true,
    data: partner,
    message: '파트너 정보를 조회했습니다.',
    timestamp: new Date().toISOString(),
  };
}

/**
 * 파트너 생성
 */
export function createPartner(dto: CreatePartnerDto): PartnerResponse {
  const partners = loadPartners();
  
  // 
  if (partners.some(p => p.code === dto.code)) {
    return {
      success: false,
      data: null as any,
      message: '이미 존재하는 파트너 코드입니다.',
      timestamp: new Date().toISOString(),
    };
  }
  
  const newPartner: Partner = {
    id: generateUUID(),
    code: dto.code,
    name: dto.name,
    type: dto.type,
    status: PartnerStatus.ACTIVE,
    managerName: dto.managerName,
    managerEmail: dto.managerEmail,
    managerPhone: dto.managerPhone,
    contractStartDate: dto.contractStartDate,
    contractEndDate: dto.contractEndDate,
    commissionRate: dto.commissionRate || 0,
    couponCode: dto.couponCode !== undefined ? dto.couponCode : true, // true
    productCount: dto.productCount || 0,
    lastOrderDate: dto.lastOrderDate,
    totalSales: dto.totalSales || 0,
    totalOrders: dto.totalOrders || 0,
    businessNumber: dto.businessNumber,
    address: dto.address,
    description: dto.description,
    logoUrl: dto.logoUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  partners.push(newPartner);
  savePartners(partners);
  
  return {
    success: true,
    data: newPartner,
    message: '파트너가 생성되었습니다.',
    timestamp: new Date().toISOString(),
  };
}

/**
 * 파트너 수정
 */
export function updatePartner(id: string, dto: UpdatePartnerDto): PartnerResponse {
  const partners = loadPartners();
  const index = partners.findIndex(p => p.id === id);
  
  if (index === -1) {
    return {
      success: false,
      data: null as any,
      message: '파트너를 찾을 수 없습니다.',
      timestamp: new Date().toISOString(),
    };
  }
  
  const updatedPartner: Partner = {
    ...partners[index],
    ...dto,
    updatedAt: new Date().toISOString(),
  };
  
  partners[index] = updatedPartner;
  savePartners(partners);
  
  return {
    success: true,
    data: updatedPartner,
    message: '파트너 정보가 수정되었습니다.',
    timestamp: new Date().toISOString(),
  };
}

/**
 * 파트너 삭제
 */
export function deletePartner(id: string): PartnerResponse {
  const partners = loadPartners();
  const index = partners.findIndex(p => p.id === id);
  
  if (index === -1) {
    return {
      success: false,
      data: null as any,
      message: '파트너를 찾을 수 없습니다.',
      timestamp: new Date().toISOString(),
    };
  }
  
  const deletedPartner = partners[index];
  partners.splice(index, 1);
  savePartners(partners);
  
  return {
    success: true,
    data: deletedPartner,
    message: '파트너가 삭제되었습니다.',
    timestamp: new Date().toISOString(),
  };
}

/**
 * 파트너 할인 정책 목록 조회
 */
export function getPartnerDiscountPolicies(partnerId?: string): PartnerDiscountPolicyListResponse {
  let discounts = loadPartnerDiscounts();
  
  if (partnerId) {
    discounts = discounts.filter(d => d.partnerId === partnerId);
  }
  
  return {
    success: true,
    data: discounts,
    message: '할인 정책 목록을 조회했습니다.',
    timestamp: new Date().toISOString(),
  };
}

/**
 * 파트너 할인 정책 생성
 */
export function createPartnerDiscountPolicy(
  partnerId: string,
  data: Omit<PartnerDiscountPolicy, 'id' | 'partnerId' | 'createdAt' | 'updatedAt'>
): PartnerDiscountPolicyResponse {
  const discounts = loadPartnerDiscounts();
  
  const newDiscount: PartnerDiscountPolicy = {
    id: generateUUID(),
    partnerId,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  discounts.push(newDiscount);
  savePartnerDiscounts(discounts);
  
  return {
    success: true,
    data: newDiscount,
    message: '할인 정책이 생성되었습니다.',
    timestamp: new Date().toISOString(),
  };
}

/**
 * 파트너 할인 정책 수정
 */
export function updatePartnerDiscountPolicy(
  id: string,
  data: Partial<Omit<PartnerDiscountPolicy, 'id' | 'partnerId' | 'createdAt' | 'updatedAt'>>
): PartnerDiscountPolicyResponse {
  const discounts = loadPartnerDiscounts();
  const index = discounts.findIndex(d => d.id === id);
  
  if (index === -1) {
    return {
      success: false,
      data: null as any,
      message: '할인 정책을 찾을 수 없습니다.',
      timestamp: new Date().toISOString(),
    };
  }
  
  const updatedDiscount: PartnerDiscountPolicy = {
    ...discounts[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  
  discounts[index] = updatedDiscount;
  savePartnerDiscounts(discounts);
  
  return {
    success: true,
    data: updatedDiscount,
    message: '할인 정책이 수정되었습니다.',
    timestamp: new Date().toISOString(),
  };
}

/**
 * 파트너 할인 정책 삭제
 */
export function deletePartnerDiscountPolicy(id: string): PartnerDiscountPolicyResponse {
  const discounts = loadPartnerDiscounts();
  const index = discounts.findIndex(d => d.id === id);
  
  if (index === -1) {
    return {
      success: false,
      data: null as any,
      message: '할인 정책을 찾을 수 없습니다.',
      timestamp: new Date().toISOString(),
    };
  }
  
  const deletedDiscount = discounts[index];
  discounts.splice(index, 1);
  savePartnerDiscounts(discounts);
  
  return {
    success: true,
    data: deletedDiscount,
    message: '할인 정책이 삭제되었습니다.',
    timestamp: new Date().toISOString(),
  };
}

/**
 * 데이터 초기화 (개발용)
 */
export function resetPartnersToInitial(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY_PARTNERS);
  localStorage.removeItem(STORAGE_KEY_PARTNER_DISCOUNTS);
}

// ===== ( ) =====

/**
 * 파트너별 할인 정책 목록 조회 (별칭)
 */
export function getDiscountPoliciesByPartnerId(partnerId: string): PartnerDiscountPolicyListResponse {
  return getPartnerDiscountPolicies(partnerId);
}

/**
 * 할인 정책 생성 (별칭)
 */
export function createDiscountPolicy(
  partnerId: string,
  data: Omit<PartnerDiscountPolicy, 'id' | 'partnerId' | 'createdAt' | 'updatedAt'>
): PartnerDiscountPolicyResponse {
  return createPartnerDiscountPolicy(partnerId, data);
}

/**
 * 할인 정책 수정 (별칭)
 */
export function updateDiscountPolicy(
  id: string,
  data: Partial<Omit<PartnerDiscountPolicy, 'id' | 'partnerId' | 'createdAt' | 'updatedAt'>>
): PartnerDiscountPolicyResponse {
  return updatePartnerDiscountPolicy(id, data);
}

/**
 * 할인 정책 삭제 (별칭)
 */
export function deleteDiscountPolicy(id: string): PartnerDiscountPolicyResponse {
  return deletePartnerDiscountPolicy(id);
}

/**
 * 파트너 적용 상품 목록 조회
 */
export function getPartnerProducts(
  partnerId: string,
  page: number = 1,
  pageSize: number = 1000  // 
): PartnerProductListResponse {
  // products.ts 
  let allProducts: any[] = [];
  
  try {
    // localStorage 
    const productsData = typeof window !== 'undefined' ? localStorage.getItem('erp_products') : null;
    if (productsData) {
      allProducts = JSON.parse(productsData);
    }
    
    // localStorage 
    if (allProducts.length === 0 && typeof window !== 'undefined') {
      // products.ts getProducts import ( )
      // localStorage 
      
      // products.ts loadProducts initialProducts 
      // 
    }
  } catch (error) {
  }
  
  
  // 
  const partnerProducts = allProducts.filter((p: any) => p.partnerId === partnerId);
  
  
  // PartnerProduct 
  const mappedProducts: PartnerProduct[] = partnerProducts.map((p: any) => ({
    id: p.id,
    partnerId: p.partnerId,
    productId: p.id,
    productName: p.name,
    categoryName: p.categoryName || '미분류',
    price: p.price,
    stock: p.stock,
    salesCount: Math.floor(Math.random() * 100), // Mock 
    revenue: p.price * Math.floor(Math.random() * 100), // Mock 
    salesStatus: p.salesStatus || '판매중', // salesStatus 
    registeredAt: p.createdAt,
  }));
  
  // 
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pagedProducts = mappedProducts.slice(startIndex, endIndex);
  
  const pagedResponse: PagedResponse<PartnerProduct> = {
    content: pagedProducts,
    page,
    pageSize,
    totalElements: mappedProducts.length,
    totalPages: Math.ceil(mappedProducts.length / pageSize),
  };
  
  return {
    success: true,
    data: pagedResponse,
    message: '파트너 상품 목록을 조회했습니다.',
    timestamp: new Date().toISOString(),
  };
}

/**
 * 파트너 판매 통계 조회
 */
export function getPartnerSalesStats(
  partnerId: string,
  period: string
): PartnerSalesStatsResponse {
  // Mock 
  const mockStats: PartnerSalesStats = {
    partnerId,
    period,
    totalRevenue: 0,
    totalOrders: 0,
    totalTickets: 0,
    averageOrderValue: 0,
    topProducts: [],
    dailySales: [],
    categoryBreakdown: [],
  };
  
  return {
    success: true,
    data: mockStats,
    message: '판매 통계를 조회했습니다.',
    timestamp: new Date().toISOString(),
  };
}