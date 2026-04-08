import type {
  ApiResponse,
  MenuCategory,
  Product as ShopProduct,
  Banner,
  Promotion,
  Brand,
  ShopMainData,
  PagedResponse,
} from "./dto/shop.dto";
import { getProducts as getAdminProducts, getProductOptions } from "./products";
import type { Product as AdminProduct } from "./dto/product.dto";
import { getChannelByCode, getCurrentChannel } from "./channels";

/**
 * 현재 시간 ISO 형식 반환
 */
const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * 메뉴 코드로 라우트 경로 생성
 * 부모 카테고리 코드를 기준으로 계층 구조 경로 생성
 */
const generateRoutePath = (category: MenuCategory, allCategories: MenuCategory[]): string => {
  const pathParts: string[] = [];
  
  let current: MenuCategory | undefined = category;
  while (current) {
    pathParts.unshift(current.code);
    current = allCategories.find(cat => cat.id === current?.parentId);
  }
  
  return `/${pathParts.join('/')}`;
};

/**
 * API 응답 래퍼 (Spring Boot 스타일)
 */
const createApiResponse = <T extends unknown>(data: T, message = "Success"): ApiResponse<T> => {
  return {
    success: true,
    message,
    data,
    timestamp: getCurrentTimestamp(),
    code: 200,
  };
};

/**
 * 로컬스토리지 키
 */
const STORAGE_KEY = "shop-menu-categories";

/**
 * 메뉴 카테고리 routePath 마이그레이션
 * 기존 /FASHION/FASHION_MEN 형식을 /FASHION/MEN 형식으로 변환
 */
const migrateRoutePath = (categories: MenuCategory[]): MenuCategory[] => {
  // 
  const sorted = [...categories].sort((a, b) => a.level - b.level);
  const migrated = new Map<string, MenuCategory>();
  
  sorted.forEach((cat) => {
    if (!cat.parentId) {
      // 
      migrated.set(cat.id, { ...cat, routePath: `/${cat.code}` });
    } else {
      // : routePath + suffix
      const parent = migrated.get(cat.parentId) || categories.find((c) => c.id === cat.parentId);
      if (parent && parent.routePath) {
        // suffix 
        // : SIRU_YULMU SIRU_ → YULMU
        let suffix = cat.code;
        if (cat.code.startsWith(parent.code + "_")) {
          suffix = cat.code.substring(parent.code.length + 1);
        } else {
          // _ 
          suffix = cat.code.split("_").pop() || cat.code;
        }
        migrated.set(cat.id, { ...cat, routePath: `${parent.routePath}/${suffix}` });
      } else {
        migrated.set(cat.id, cat);
      }
    }
  });
  
  // 
  return categories.map((cat) => migrated.get(cat.id) || cat);
};

/**
 * 로컬스토리지에서 메뉴 카테고리 로드
 */
const loadMenuCategoriesFromStorage = (): MenuCategory[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const categories = JSON.parse(stored);
      // routePath 
      const migrated = migrateRoutePath(categories);
      // 
      if (JSON.stringify(categories) !== JSON.stringify(migrated)) {
        saveMenuCategoriesToStorage(migrated);
        return migrated;
      }
      return categories;
    }
  } catch (error) {
  }
  return getDefaultMenuCategories();
};

/**
 * 로컬스토리지에 메뉴 카테고리 저장
 */
const saveMenuCategoriesToStorage = (categories: MenuCategory[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  } catch (error) {
  }
};

/**
 * 기본 메뉴 카테고리 데이터
 */
const getDefaultMenuCategories = (): MenuCategory[] => [
  // 1 
  {
    id: "CAT001",
    code: "CONCERT",
    name: "콘서트",
    level: 1,
    displayOrder: 1,
    visible: true,
    routePath: "/CONCERT",
  },
  {
    id: "CAT002",
    code: "MUSICAL",
    name: "뮤지컬",
    level: 1,
    displayOrder: 2,
    visible: true,
    routePath: "/MUSICAL",
  },
  {
    id: "CAT003",
    code: "SPORTS",
    name: "스포츠",
    level: 1,
    displayOrder: 3,
    visible: true,
    routePath: "/SPORTS",
  },
  {
    id: "CAT004",
    code: "EXHIBITION",
    name: "전시/행사",
    level: 1,
    displayOrder: 4,
    visible: true,
    routePath: "/EXHIBITION",
  },
  {
    id: "CAT005",
    code: "CLASSIC",
    name: "클래식/오페라",
    level: 1,
    displayOrder: 5,
    visible: true,
    routePath: "/CLASSIC",
  },
  // 2 - 
  {
    id: "CAT001001",
    code: "CONCERT_KPOP",
    name: "K-POP",
    parentId: "CAT001",
    level: 2,
    displayOrder: 1,
    visible: true,
    routePath: "/shop/CONCERT/KPOP",
  },
  {
    id: "CAT001002",
    code: "CONCERT_ROCK",
    name: "록/인디",
    parentId: "CAT001",
    level: 2,
    displayOrder: 2,
    visible: true,
    routePath: "/shop/CONCERT/ROCK",
  },
  {
    id: "CAT001003",
    code: "CONCERT_TROT",
    name: "트로트",
    parentId: "CAT001",
    level: 2,
    displayOrder: 3,
    visible: true,
    routePath: "/shop/CONCERT/TROT",
  },
  // 2 - 
  {
    id: "CAT002001",
    code: "MUSICAL_LARGE",
    name: "대극장 뮤지컬",
    parentId: "CAT002",
    level: 2,
    displayOrder: 1,
    visible: true,
    routePath: "/shop/MUSICAL/LARGE",
  },
  {
    id: "CAT002002",
    code: "MUSICAL_SMALL",
    name: "소극장 뮤지컬",
    parentId: "CAT002",
    level: 2,
    displayOrder: 2,
    visible: true,
    routePath: "/shop/MUSICAL/SMALL",
  },
  // 2 - 
  {
    id: "CAT003001",
    code: "SPORTS_BASEBALL",
    name: "야구",
    parentId: "CAT003",
    level: 2,
    displayOrder: 1,
    visible: true,
    routePath: "/shop/SPORTS/BASEBALL",
  },
  {
    id: "CAT003002",
    code: "SPORTS_SOCCER",
    name: "축구",
    parentId: "CAT003",
    level: 2,
    displayOrder: 2,
    visible: true,
    routePath: "/shop/SPORTS/SOCCER",
  },
  {
    id: "CAT003003",
    code: "SPORTS_BASKETBALL",
    name: "농구/배구",
    parentId: "CAT003",
    level: 2,
    displayOrder: 3,
    visible: true,
    routePath: "/shop/SPORTS/BASKETBALL",
  },
];

/**
 * 관리자 상품을 쇼핑몰 상품으로 변환
 */
const convertAdminProductToShopProduct = (adminProduct: AdminProduct): ShopProduct | null => {
  // visible false 
  if (!adminProduct.visible) {
    return null;
  }

  const now = new Date();
  const hasStartDate = adminProduct.salesStartDate && new Date(adminProduct.salesStartDate) > now;
  const hasEndDate = adminProduct.salesEndDate && new Date(adminProduct.salesEndDate) < now;
  
  // 
  if (hasStartDate || hasEndDate) {
    return null;
  }

  // 
  let discountRate = 0;
  if (adminProduct.discountPrice && adminProduct.discountPrice < adminProduct.price) {
    discountRate = Math.round(((adminProduct.price - adminProduct.discountPrice) / adminProduct.price) * 100);
  }

  return {
    id: adminProduct.id,
    name: adminProduct.name,
    categoryId: adminProduct.categoryId,
    category: adminProduct.categoryName || "기타", // 
    price: adminProduct.discountPrice || adminProduct.price,
    originalPrice: adminProduct.discountPrice ? adminProduct.price : undefined,
    discountRate: discountRate > 0 ? discountRate : undefined,
    description: adminProduct.description || "",
    thumbnailUrl: (adminProduct.imageUrls && adminProduct.imageUrls.length > 0) 
      ? adminProduct.imageUrls[0] 
      : adminProduct.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
    imageUrls: (adminProduct.imageUrls && adminProduct.imageUrls.length > 0) 
      ? adminProduct.imageUrls 
      : (adminProduct.imageUrl ? [adminProduct.imageUrl] : []),
    stock: adminProduct.stock,
    soldCount: 0, // 
    rating: 4.5, // 
    reviewCount: 0, // 
    isNew: adminProduct.isNew ?? false,
    isBest: adminProduct.isBest ?? false,
    isSale: adminProduct.isSale ?? (discountRate > 0),
    tags: getTags(adminProduct, discountRate),
    createdAt: adminProduct.createdAt,
    updatedAt: adminProduct.updatedAt,
  };
};

/**
 * 상품 태그 생성
 */
const getTags = (product: AdminProduct, discountRate: number): string[] => {
  const tags: string[] = [];
  if (product.isNew) tags.push("신상");
  if (discountRate > 0) tags.push("세일");
  if (product.salesStatus === "품절") tags.push("품절");
  return tags;
};

/**
 * 관리자 상품 목록을 쇼핑몰 상품으로 변환
 */
const getShopProducts = (channelCode?: string): ShopProduct[] => {
  const response = getAdminProducts(0, 1000);
  
  if (!response.success) {
    // API 
    return [];
  }
  
  // 
  let excludedProductIds: string[] = [];
  
  if (channelCode) {
    // 
    const channelResponse = getChannelByCode(channelCode);
    if (channelResponse.success && channelResponse.data) {
      excludedProductIds = channelResponse.data.excludedProductIds || [];
    }
  } else {
    // URL ( )
    const currentChannel = getCurrentChannel();
    excludedProductIds = currentChannel.excludedProductIds || [];
  }
  
  const adminProducts = response.data.content
    .filter((p) => !excludedProductIds.includes(p.id)) // 
    .map(convertAdminProductToShopProduct)
    .filter((p): p is ShopProduct => p !== null);
  
  return adminProducts;
};

/**
 * 레거시 티켓 더미 데이터 (폴백용)
 */
const legacyProducts: ShopProduct[] = [
  {
    id: "PRD001",
    name: "아이유 2025 콘서트 <The Golden Hour>",
    categoryId: "CAT001001",
    price: 110000,
    originalPrice: 132000,
    discountRate: 17,
    description: "아이유의 전국투어 콘서트가 돌아왔습니다. 특별한 무대를 경험하세요.",
    thumbnailUrl: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=400&fit=crop",
    imageUrls: [
      "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=800&fit=crop",
    ],
    stock: 150,
    soldCount: 2840,
    rating: 4.9,
    reviewCount: 542,
    isNew: false,
    isBest: true,
    isSale: true,
    salesStatus: 'ON_SALE', // 
    tags: ["베스트", "조기마감"],
    createdAt: "2025-01-15T10:00:00Z",
    updatedAt: "2025-11-02T14:30:00Z",
  },
  {
    id: "PRD002",
    name: "뮤지컬 <위키드> - 샤롯데씨어터",
    categoryId: "CAT002001",
    price: 140000,
    originalPrice: 170000,
    discountRate: 18,
    description: "브로드웨이 최고의 뮤지컬, 위키드가 한국에서 펼쳐집니다.",
    thumbnailUrl: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=400&h=400&fit=crop",
    imageUrls: [
      "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&h=800&fit=crop",
    ],
    stock: 85,
    soldCount: 1856,
    rating: 4.8,
    reviewCount: 445,
    isNew: false,
    isBest: true,
    isSale: true,
    salesStatus: 'SOLD_OUT', // 
    tags: ["베스트", "프리미엄"],
    createdAt: "2025-02-10T10:00:00Z",
    updatedAt: "2025-11-01T09:15:00Z",
  },
  {
    id: "PRD003",
    name: "SSG 랜더스 vs LG 트윈스 - 야구",
    categoryId: "CAT003001",
    price: 15000,
    description: "인천 SSG 랜더스 필드에서 펼쳐지는 프로야구 경기",
    thumbnailUrl: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=400&h=400&fit=crop",
    imageUrls: [
      "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&h=800&fit=crop",
    ],
    stock: 245,
    soldCount: 934,
    rating: 4.5,
    reviewCount: 189,
    isNew: true,
    isBest: false,
    isSale: false,
    salesStatus: 'ON_SALE', // 
    tags: ["신규"],
    createdAt: "2025-10-20T10:00:00Z",
    updatedAt: "2025-11-03T08:00:00Z",
  },
  {
    id: "PRD004",
    name: "BTS 정국 솔로 콘서트 <Golden>",
    categoryId: "CAT001001",
    price: 154000,
    originalPrice: 198000,
    discountRate: 22,
    description: "BTS 정국의 첫 솔로 콘서트! 잠실 올림픽 주경기장에서 만나요.",
    thumbnailUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=400&fit=crop",
    imageUrls: [
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=800&fit=crop",
    ],
    stock: 200,
    soldCount: 5341,
    rating: 5.0,
    reviewCount: 978,
    isNew: false,
    isBest: true,
    isSale: true,
    salesStatus: 'ON_SALE', // 
    tags: ["베스트", "조기마감"],
    createdAt: "2025-03-05T10:00:00Z",
    updatedAt: "2025-11-02T16:45:00Z",
  },
  {
    id: "PRD005",
    name: "서울 재즈 페스티벌 2025",
    categoryId: "CAT001001",
    price: 88000,
    description: "올림픽공원에서 열리는 국내 최대 재즈 페스티벌",
    thumbnailUrl: "https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=400&h=400&fit=crop",
    imageUrls: [
      "https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=800&h=800&fit=crop",
    ],
    stock: 320,
    soldCount: 1267,
    rating: 4.7,
    reviewCount: 334,
    isNew: true,
    isBest: false,
    isSale: false,
    salesStatus: 'ON_SALE', // 
    tags: ["신규"],
    createdAt: "2025-10-25T10:00:00Z",
    updatedAt: "2025-11-03T07:30:00Z",
  },
  {
    id: "PRD006",
    name: "국립중앙박물관 특별전 <고려의 미>",
    categoryId: "CAT004",
    price: 18000,
    originalPrice: 25000,
    discountRate: 28,
    description: "고려시대 문화유산을 한눈에 볼 수 있는 특별 전시회",
    thumbnailUrl: "https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=400&h=400&fit=crop",
    imageUrls: [
      "https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800&h=800&fit=crop",
    ],
    stock: 195,
    soldCount: 2456,
    rating: 4.6,
    reviewCount: 567,
    isNew: false,
    isBest: true,
    isSale: true,
    salesStatus: 'ON_SALE', // 
    tags: ["베스트", "할인"],
    createdAt: "2025-04-12T10:00:00Z",
    updatedAt: "2025-11-02T11:20:00Z",
  },
  {
    id: "PRD007",
    name: "서울시향 정기연주회 - 차이콥스키 교향곡",
    categoryId: "CAT005",
    price: 70000,
    description: "예술의전당 콘서트홀에서 펼쳐지는 클래식 음악회",
    thumbnailUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&h=400&fit=crop",
    imageUrls: [
      "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&h=800&fit=crop",
    ],
    stock: 160,
    soldCount: 589,
    rating: 4.8,
    reviewCount: 245,
    isNew: true,
    salesStatus: 'ON_SALE', // 
    tags: ["신규"],
    createdAt: "2025-10-28T10:00:00Z",
    updatedAt: "2025-11-03T09:00:00Z",
  },
  {
    id: "PRD008",
    name: "2024-25 프로농구 KBL - 서울 SK vs 안양 KGC",
    categoryId: "CAT003003",
    price: 25000,
    originalPrice: 35000,
    discountRate: 29,
    description: "잠실 학생체육관에서 열리는 프로농구 경기",
    thumbnailUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=400&fit=crop",
    imageUrls: [
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=800&fit=crop",
    ],
    stock: 340,
    soldCount: 1278,
    rating: 4.4,
    reviewCount: 392,
    isNew: false,
    isBest: true,
    isSale: true,
    salesStatus: 'ON_SALE', // 
    tags: ["베스트", "할인"],
    createdAt: "2025-01-20T10:00:00Z",
    updatedAt: "2025-11-02T13:10:00Z",
  },
];

/**
 * 배너 더미 데이터 - 티켓 판매용
 */
const banners: Banner[] = [
  {
    id: "BAN001",
    title: "K-POP 콘서트 시즌 오픈",
    description: "최대 30% 조기예매 할인",
    imageUrl: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200&h=400&fit=crop",
    linkUrl: "/shop/category/new",
    linkType: "internal",
    displayOrder: 1,
    startDate: "2025-11-01T00:00:00Z",
    endDate: "2025-11-30T23:59:59Z",
    isActive: true,
    backgroundColor: "#f5f5f5",
  },
  {
    id: "BAN002",
    title: "겨울 뮤지컬 시즌",
    description: "인기 공연 특별 할인",
    imageUrl: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=1200&h=400&fit=crop",
    linkUrl: "/shop/category/musical",
    linkType: "internal",
    displayOrder: 2,
    startDate: "2025-11-01T00:00:00Z",
    endDate: "2025-12-31T23:59:59Z",
    isActive: true,
    backgroundColor: "#e8f5e9",
  },
  {
    id: "BAN003",
    title: "스포츠 경기 패키지",
    description: "시즌권 특가 판매",
    imageUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&h=400&fit=crop",
    linkUrl: "/shop/category/sports",
    linkType: "internal",
    displayOrder: 3,
    startDate: "2025-11-01T00:00:00Z",
    endDate: "2025-11-15T23:59:59Z",
    isActive: true,
    backgroundColor: "#e3f2fd",
  },
];

/**
 * 프로모션 더미 데이터 - 티켓 판매용
 */
const promotions: Promotion[] = [
  {
    id: "PROMO001",
    title: "조기예매 한정 할인",
    description: "선착순 조기예매 특가",
    type: "discount",
    discountRate: 25,
    startDate: "2025-11-01T00:00:00Z",
    endDate: "2025-11-10T23:59:59Z",
    isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&h=400&fit=crop",
    targetProducts: ["PRD001", "PRD004"],
  },
  {
    id: "PROMO002",
    title: "주중 공연 특별 할인",
    description: "평일 공연 7일간 특가",
    type: "discount",
    discountAmount: 20000,
    startDate: "2025-11-01T00:00:00Z",
    endDate: "2025-11-08T23:59:59Z",
    isActive: true,
    targetProducts: ["PRD006", "PRD008"],
  },
  {
    id: "PROMO003",
    title: "오늘만 특가 티켓",
    description: "당일 예매 특별 가격",
    type: "special",
    startDate: "2025-11-03T00:00:00Z",
    endDate: "2025-11-03T23:59:59Z",
    isActive: true,
    targetProducts: ["PRD002"],
  },
];

/**
 * 인기 공연장/주최사 더미 데이터
 */
const brands: Brand[] = [
  {
    id: "BRAND001",
    name: "샤롯데씨어터",
    logoUrl: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=200&h=100&fit=crop",
    description: "대한민국 최고의 뮤지컬 전용관",
    isPopular: true,
    productCount: 45,
  },
  {
    id: "BRAND002",
    name: "예술의전당",
    logoUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=200&h=100&fit=crop",
    description: "클래식과 오페라의 메카",
    isPopular: true,
    productCount: 32,
  },
  {
    id: "BRAND003",
    name: "잠실 올림픽주경기장",
    logoUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=200&h=100&fit=crop",
    description: "대형 콘서트 전용 경기장",
    isPopular: true,
    productCount: 89,
  },
  {
    id: "BRAND004",
    name: "KBO 프로야구",
    logoUrl: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=200&h=100&fit=crop",
    description: "한국 프로야구 경기",
    isPopular: true,
    productCount: 67,
  },
];

/**
 * Shop Store - 서버 응답 시뮬레이션
 */
class ShopStore {
  private menuCategories: MenuCategory[];
  private listeners: (() => void)[] = [];

  constructor() {
    // , 
    this.menuCategories = loadMenuCategoriesFromStorage();
    
    // routePath - routePath 
    this.migrateRoutePaths();
  }
  
  /**
   * routePath 마이그레이션 - 기 데이터의 잘못된 routePath 수정
   */
  private migrateRoutePaths(): void {
    let needsSave = false;
    
    this.menuCategories.forEach(category => {
      const correctPath = generateRoutePath(category, this.menuCategories);
      if (category.routePath !== correctPath) {
        category.routePath = correctPath;
        needsSave = true;
      }
    });
    
    if (needsSave) {
      saveMenuCategoriesToStorage(this.menuCategories);
    }
  }

  /**
   * 변경 사항 구독
   */
  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * 리스너들에게 변경 알림
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }

  /**
   * 메뉴 카테고리 조회 (계층 구조)
   */
  getMenuCategories(): ApiResponse<MenuCategory[]> {
    // visible true 
    const visibleCategories = this.menuCategories.filter(cat => cat.visible);
    
    // 
    const rootCategories = visibleCategories
      .filter(cat => cat.level === 1)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(root => ({
        ...root,
        children: visibleCategories
          .filter(cat => cat.parentId === root.id)
          .sort((a, b) => a.displayOrder - b.displayOrder),
      }));
    
    return createApiResponse(rootCategories, "메뉴 카테고리를 성공적으로 조회했습니다.");
  }

  /**
   * 메뉴 카테고리 조회 (평면 구조)
   */
  getMenuCategoriesFlat(): ApiResponse<MenuCategory[]> {
    return createApiResponse(this.menuCategories, "메뉴 카테고리를 성공적으로 조회했습니다.");
  }

  /**
   * 특정 카테고리의 하위 카테고리 조회
   */
  getSubCategories(parentId: string): ApiResponse<MenuCategory[]> {
    const subCategories = this.menuCategories
      .filter(cat => cat.parentId === parentId && cat.visible)
      .sort((a, b) => a.displayOrder - b.displayOrder);
    return createApiResponse(subCategories, "하위 카테고리를 성공적으로 조회했습니다.");
  }

  /**
   * 메뉴 카테고리 추가
   */
  addMenuCategory(category: MenuCategory): ApiResponse<MenuCategory> {
    // routePath 
    if (!category.routePath) {
      category.routePath = generateRoutePath(category, this.menuCategories);
    }
    
    this.menuCategories.push(category);
    saveMenuCategoriesToStorage(this.menuCategories);
    this.notifyListeners();
    return createApiResponse(category, "메뉴 카테고리가 추가되었습니다.");
  }

  /**
   * 메뉴 카테고리 수정
   */
  updateMenuCategory(id: string, updates: Partial<MenuCategory>): ApiResponse<MenuCategory> {
    const index = this.menuCategories.findIndex(cat => cat.id === id);
    if (index === -1) {
      return {
        success: false,
        message: "메뉴 카테고리를 찾을 수 없습니다.",
        data: null as any,
        timestamp: getCurrentTimestamp(),
        code: 404,
      };
    }

    // 
    const updatedCategory = {
      ...this.menuCategories[index],
      ...updates,
    };
    
    // routePath 
    if (updates.code || updates.parentId !== undefined) {
      updatedCategory.routePath = generateRoutePath(
        updatedCategory,
        this.menuCategories
      );
    }
    
    // 
    this.menuCategories = [
      ...this.menuCategories.slice(0, index),
      updatedCategory,
      ...this.menuCategories.slice(index + 1)
    ];
    
    saveMenuCategoriesToStorage(this.menuCategories);
    this.notifyListeners();
    return createApiResponse(updatedCategory, "메뉴 카테고리가 수정되었습니다.");
  }

  /**
   * 메뉴 카테고리 삭제
   */
  deleteMenuCategory(id: string): ApiResponse<void> {
    // 
    const deleteRecursive = (categoryId: string) => {
      const children = this.menuCategories.filter(cat => cat.parentId === categoryId);
      children.forEach(child => deleteRecursive(child.id));
      this.menuCategories = this.menuCategories.filter(cat => cat.id !== categoryId);
    };

    deleteRecursive(id);
    saveMenuCategoriesToStorage(this.menuCategories);
    this.notifyListeners();
    return createApiResponse(undefined as any, "메뉴 카테고리가 삭제되었습니다.");
  }

  /**
   * 여러 메뉴 카테고리 일괄 업데이트
   */
  updateMenuCategories(categories: MenuCategory[]): ApiResponse<MenuCategory[]> {
    this.menuCategories = categories;
    saveMenuCategoriesToStorage(this.menuCategories);
    this.notifyListeners();
    return createApiResponse(categories, "메뉴 카테고리가 업데이트되었습니다.");
  }

  /**
   * 전체 상품 조회
   */
  getAllProducts(channelCode?: string): ApiResponse<ShopProduct[]> {
    const shopProducts = getShopProducts(channelCode);
    return createApiResponse(shopProducts, "상품 목록을 성공적으로 조회했습니다.");
  }

  /**
   * 신상품 조회
   */
  getNewProducts(limit = 8, channelCode?: string): ApiResponse<ShopProduct[]> {
    const shopProducts = getShopProducts(channelCode);
    const newProducts = shopProducts
      .filter(p => p.isNew)
      .slice(0, limit);
    return createApiResponse(newProducts, "신상품 목록을 성공적으로 조회했습니다.");
  }

  /**
   * 베스트 상품 조회
   */
  getBestProducts(limit = 8, channelCode?: string): ApiResponse<ShopProduct[]> {
    const shopProducts = getShopProducts(channelCode);
    const bestProducts = shopProducts
      .filter(p => p.isBest)
      .sort((a, b) => b.soldCount - a.soldCount)
      .slice(0, limit);
    return createApiResponse(bestProducts, "베스트 상품 목록을 성공적으로 조회했습니다.");
  }

  /**
   * 세일 상품 조회
   */
  getSaleProducts(limit = 8, channelCode?: string): ApiResponse<ShopProduct[]> {
    const shopProducts = getShopProducts(channelCode);
    const saleProducts = shopProducts
      .filter(p => p.isSale)
      .sort((a, b) => (b.discountRate || 0) - (a.discountRate || 0))
      .slice(0, limit);
    return createApiResponse(saleProducts, "세일 상품 목록을 성공적으로 조회했습니다.");
  }

  /**
   * 카테고리별 상품 조회
   */
  getProductsByCategory(categoryId: string, channelCode?: string): ApiResponse<ShopProduct[]> {
    const shopProducts = getShopProducts(channelCode);
    const categoryProducts = shopProducts.filter(p => p.categoryId === categoryId);
    return createApiResponse(categoryProducts, "카테고리별 상품 목록을 성공적으로 조회했습니다.");
  }

  /**
   * 상품 상세 조회
   */
  getProductById(productId: string, channelCode?: string): ApiResponse<ShopProduct | null> {
    const shopProducts = getShopProducts(channelCode);
    const product = shopProducts.find(p => p.id === productId);
    if (product) {
      return createApiResponse(product, "상품 상세 정보를 성공적으로 조회했습니다.");
    }
    return {
      success: false,
      message: "상품을 찾을 수 없습니다.",
      data: null,
      timestamp: getCurrentTimestamp(),
      code: 404,
    };
  }

  /**
   * 배너 조회
   */
  getBanners(): ApiResponse<Banner[]> {
    const activeBanners = banners
      .filter(b => b.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);
    return createApiResponse(activeBanners, "배너 목록을 성공적으로 조회했습니다.");
  }

  /**
   * 프로모션 조회
   */
  getPromotions(): ApiResponse<Promotion[]> {
    const activePromotions = promotions.filter(p => p.isActive);
    return createApiResponse(activePromotions, "프로모션 목록을 성공적으로 조회했습니다.");
  }

  /**
   * 인기 브랜드 조회
   */
  getPopularBrands(): ApiResponse<Brand[]> {
    const popularBrands = brands
      .filter(b => b.isPopular)
      .sort((a, b) => b.productCount - a.productCount);
    return createApiResponse(popularBrands, "인기 브랜드 목록을 성공적으로 조회했습니다.");
  }

  /**
   * 쇼핑몰 메인 페이지 데이터 일괄 조회
   */
  getShopMainData(channelCode?: string): ApiResponse<ShopMainData> {
    const mainData: ShopMainData = {
      banners: this.getBanners().data,
      categories: this.getMenuCategories().data,
      newProducts: this.getNewProducts(8, channelCode).data,
      bestProducts: this.getBestProducts(8, channelCode).data,
      saleProducts: this.getSaleProducts(8, channelCode).data,
      allProducts: this.getAllProducts(channelCode).data,
      promotions: this.getPromotions().data,
      popularBrands: this.getPopularBrands().data,
    };
    
    return createApiResponse(mainData, "쇼핑몰 메인 데이터를 성공적으로 조했습니다.");
  }

  /**
   * 상품 검색
   */
  searchProducts(keyword: string, channelCode?: string): ApiResponse<ShopProduct[]> {
    const shopProducts = getShopProducts(channelCode);
    const searchResults = shopProducts.filter(p => 
      p.name.toLowerCase().includes(keyword.toLowerCase()) ||
      p.description.toLowerCase().includes(keyword.toLowerCase()) ||
      p.tags.some(tag => tag.toLowerCase().includes(keyword.toLowerCase()))
    );
    return createApiResponse(searchResults, `검색 결과 ${searchResults.length}건을 찾았습니다.`);
  }
}

// export
export const shopStore = new ShopStore();

// export ()
export { legacyProducts, banners, promotions, brands };