// DTO 

/**
 * API 공통 응답 형태 (Spring Boot 스타일)
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  code?: number;
}

/**
 * 페이징 정보
 */
export interface PageInfo {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/**
 * 페이징된 응답
 */
export interface PagedResponse<T> {
  content: T[];
  pageInfo: PageInfo;
}

/**
 * 메뉴 카테고리
 */
export interface MenuCategory {
  id: string;
  name: string;
  code: string;
  level: number; // 1: , 2: 
  parentId: string | null;
  displayOrder: number;
  visible: boolean;
  iconUrl?: string;
  routePath?: string; // (: /category/electronics)
  children?: MenuCategory[];
}

/**
 * 상품 정보
 */
export interface Product {
  id: string;
  name: string;
  categoryId: string;
  category: string; // 
  price: number;
  originalPrice?: number;
  discountRate?: number;
  description: string;
  thumbnailUrl: string;
  imageUrls: string[];
  stock: number;
  soldCount: number;
  rating: number;
  reviewCount: number;
  isNew: boolean;
  isBest: boolean;
  isSale: boolean;
  salesStatus?: 'READY' | 'ON_SALE' | 'SOLD_OUT' | 'PAUSED' | 'STOPPED'; // 
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * 배너 정보
 */
export interface Banner {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  linkUrl?: string;
  linkType: 'internal' | 'external' | 'none';
  displayOrder: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  backgroundColor?: string;
}

/**
 * 프로모션 정보
 */
export interface Promotion {
  id: string;
  title: string;
  description: string;
  type: 'discount' | 'coupon' | 'event' | 'special';
  discountRate?: number;
  discountAmount?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  imageUrl?: string;
  targetProducts?: string[]; // product IDs
}

/**
 * 브랜드 정보
 */
export interface Brand {
  id: string;
  name: string;
  logoUrl: string;
  description?: string;
  isPopular: boolean;
  productCount: number;
}

/**
 * 쇼핑몰 메인 페이지 데이터
 */
export interface ShopMainData {
  banners: Banner[];
  categories: MenuCategory[];
  newProducts: Product[];
  bestProducts: Product[];
  saleProducts: Product[];
  allProducts: Product[];
  promotions: Promotion[];
  popularBrands: Brand[];
}