/**
 * Coupons Data Layer
 * 쿠폰 데이터 관리
 */

import type {
  Coupon,
  CreateCouponDto,
  UpdateCouponDto,
  CouponListResponse,
  CouponResponse,
  DiscountType,
} from './dto/coupon.dto';

// 
const STORAGE_KEY = 'erp_coupons';

/**
 * 현재 시간 ISO 형식 반환
 */
const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * API 응답 래퍼
 */
const createApiResponse = <T extends unknown>(
  data: T,
  message = 'Success'
): { success: true; message: string; data: T; timestamp: string; code: number } => {
  return {
    success: true,
    message,
    data,
    timestamp: getCurrentTimestamp(),
    code: 200,
  };
};

/**
 * 초기 쿠폰 데이터
 */
const initialCoupons: Coupon[] = [
  {
    id: 'coupon-001',
    code: 'WELCOME2024',
    name: '신규고객 환영 쿠폰',
    description: '첫 구매 시 10% 할인',
    discountType: '정률' as DiscountType,
    discountValue: 10,
    productIds: [],
    minPurchaseAmount: 50000,
    maxDiscountAmount: 10000,
    usageLimit: 1000,
    usedCount: 234,
    validFrom: '2024-01-01T00:00:00Z',
    validUntil: '2024-12-31T23:59:59Z',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'coupon-002',
    code: 'CONCERT5000',
    name: '콘서트 5천원 할인',
    description: '콘서트 티켓 구매 시 5천원 할인',
    discountType: '정액' as DiscountType,
    discountValue: 5000,
    productIds: ['prod-001', 'prod-006'],
    minPurchaseAmount: 30000,
    usageLimit: 500,
    usedCount: 123,
    validFrom: '2024-01-01T00:00:00Z',
    validUntil: '2024-06-30T23:59:59Z',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'coupon-003',
    code: 'MUSICAL20',
    name: '뮤지컬 20% 할인',
    description: '뮤지컬 티켓 20% 할인',
    discountType: '정률' as DiscountType,
    discountValue: 20,
    productIds: ['prod-003'],
    minPurchaseAmount: 100000,
    maxDiscountAmount: 30000,
    usageLimit: 300,
    usedCount: 89,
    validFrom: '2024-02-01T00:00:00Z',
    validUntil: '2024-08-31T23:59:59Z',
    isActive: true,
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
  },
  {
    id: 'coupon-004',
    code: 'SPORTS3000',
    name: '스포츠 3천원 할인',
    description: '스포츠 티켓 구매 시 3천원 할인',
    discountType: '정액' as DiscountType,
    discountValue: 3000,
    productIds: ['prod-002', 'prod-007'],
    minPurchaseAmount: 20000,
    usageLimit: 1000,
    usedCount: 456,
    validFrom: '2024-01-01T00:00:00Z',
    validUntil: '2024-12-31T23:59:59Z',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'coupon-005',
    code: 'EXHIBITION15',
    name: '전시 15% 할인',
    description: '전시 입장권 15% 할인',
    discountType: '정률' as DiscountType,
    discountValue: 15,
    productIds: ['prod-004'],
    minPurchaseAmount: 10000,
    maxDiscountAmount: 5000,
    usageLimit: 200,
    usedCount: 67,
    validFrom: '2024-03-01T00:00:00Z',
    validUntil: '2024-09-30T23:59:59Z',
    isActive: false,
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z',
  },
];

// 
function loadCoupons(): Coupon[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
  }
  return initialCoupons;
}

// 
function saveCoupons(coupons: Coupon[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons));
  } catch (error) {
  }
}

// ID 
function generateId(): string {
  const coupons = loadCoupons();
  const maxId = coupons.reduce((max, coupon) => {
    const num = parseInt(coupon.id.replace('coupon-', ''));
    return num > max ? num : max;
  }, 0);
  return `coupon-${String(maxId + 1).padStart(3, '0')}`;
}

/**
 * 쿠폰 목록 조회
 */
export function getCoupons(
  page: number = 0,
  size: number = 20,
  search?: string,
  productId?: string
): CouponListResponse {
  try {
    let coupons = loadCoupons();

    // 
    if (productId) {
      coupons = coupons.filter((c) => c.productIds.includes(productId));
    }

    // 
    if (search) {
      const searchLower = search.toLowerCase();
      coupons = coupons.filter(
        (c) =>
          c.code.toLowerCase().includes(searchLower) ||
          c.name.toLowerCase().includes(searchLower) ||
          c.description?.toLowerCase().includes(searchLower)
      );
    }

    const total = coupons.length;
    const content = coupons.slice(page * size, (page + 1) * size);

    return createApiResponse({
      content,
      page,
      size,
      total,
      totalPages: Math.ceil(total / size),
    });
  } catch (error) {
    throw error;
  }
}

/**
 * 쿠폰 단건 조회
 */
export function getCouponById(id: string): CouponResponse {
  try {
    const coupons = loadCoupons();
    const coupon = coupons.find((c) => c.id === id);

    if (!coupon) {
      throw new Error('Coupon not found');
    }

    return createApiResponse(coupon);
  } catch (error) {
    throw error;
  }
}

/**
 * 쿠폰 생성
 */
export function createCoupon(dto: CreateCouponDto): CouponResponse {
  try {
    const coupons = loadCoupons();

    // 
    if (coupons.some((c) => c.code === dto.code)) {
      throw new Error('이미 존재하는 쿠폰 코드입니다.');
    }

    const newCoupon: Coupon = {
      id: generateId(),
      ...dto,
      usedCount: 0,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };

    coupons.push(newCoupon);
    saveCoupons(coupons);

    return createApiResponse(newCoupon, '쿠폰이 생성되었습니다.');
  } catch (error) {
    throw error;
  }
}

/**
 * 쿠폰 수정
 */
export function updateCoupon(id: string, dto: UpdateCouponDto): CouponResponse {
  try {
    const coupons = loadCoupons();
    const index = coupons.findIndex((c) => c.id === id);

    if (index === -1) {
      throw new Error('Coupon not found');
    }

    // ( )
    if (dto.code && coupons.some((c) => c.code === dto.code && c.id !== id)) {
      throw new Error('이미 존재하는 쿠폰 코드입니다.');
    }

    const updatedCoupon = {
      ...coupons[index],
      ...dto,
      updatedAt: getCurrentTimestamp(),
    };

    coupons[index] = updatedCoupon;
    saveCoupons(coupons);

    return createApiResponse(updatedCoupon, '쿠폰이 수정되었습니다.');
  } catch (error) {
    throw error;
  }
}

/**
 * 쿠폰 삭제
 */
export function deleteCoupon(id: string): { success: true; message: string } {
  try {
    const coupons = loadCoupons();
    const filteredCoupons = coupons.filter((c) => c.id !== id);

    if (filteredCoupons.length === coupons.length) {
      throw new Error('Coupon not found');
    }

    saveCoupons(filteredCoupons);

    return {
      success: true,
      message: '쿠폰이 삭제되었습니다.',
    };
  } catch (error) {
    throw error;
  }
}

/**
 * 상품별 쿠폰 개수 조회
 */
export function getCouponCountByProduct(productId: string): number {
  try {
    const coupons = loadCoupons();
    return coupons.filter((c) => c.productIds.includes(productId) && c.isActive).length;
  } catch (error) {
    return 0;
  }
}
