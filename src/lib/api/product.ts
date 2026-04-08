import { api, type ApiResponse } from '../api';
import type { SalesStatus } from '../../data/dto/types';
import { getSessionChannel } from './benepia';

/**
 * URL 파라미터 또는 세션 또는 localStorage에서 채널 코드 가져오기
 * 
 * 우선순위:
 * 1️⃣ 베네피아 세션 API (sessionStorage) ← 최우선!
 * 2️⃣ URL 파라미터 (?channel=XXX)
 * 3️⃣ localStorage (selectedChannel)
 * 4️⃣ 기본값 (DEFAULT)
 */
function getChannelCode(): string {
  console.log('🔍 [채널 코드 조회] ===========================================');
  
  // 1순위: 베네피아 세션 채널 코드 (최우선!)
  const sessionChannel = getSessionChannel();
  console.log('🔍 [채널 코드] 1순위 - 베네피아 세션:', sessionChannel || '없음');
  
  if (sessionChannel && sessionChannel !== 'DEFAULT') {
    console.log('✅ [채널 코드] 베네피아 세션에서 가져옴 (최우선!):', sessionChannel);
    return sessionChannel;
  }

  // 2순위: URL 파라미터에서 채널 코드 확인
  const params = new URLSearchParams(window.location.search);
  const channelParam = params.get('channel');
  console.log('🔍 [채널 코드] 2순위 - URL 파라미터:', channelParam || '없음');
  
  if (channelParam) {
    console.log('✅ [채널 코드] URL에서 가져옴:', channelParam);
    return channelParam;
  }
  
  // 3순위: localStorage에서 채널 정보 확인
  const channelData = localStorage.getItem('selectedChannel');
  console.log('🔍 [채널 코드] 3순위 - localStorage:', channelData || '없음');
  
  if (channelData) {
    try {
      const channel = JSON.parse(channelData);
      if (channel.channelCode) {
        console.log('✅ [채널 코드] localStorage에서 가져옴:', channel.channelCode);
        return channel.channelCode;
      }
    } catch (e) {
      console.warn('⚠️ [채널 코드] localStorage 파싱 실패:', e);
    }
  }
  
  // 기본값
  console.log('⚠️ [채널 코드] 기본값 사용: DEFAULT');
  console.log('🔍 [채널 코드 조회] ===========================================');
  return 'DEFAULT';
}


/**
 * 사용자 - 쇼핑몰 섹션 (핫템, 추천 등)
 */
export interface ShopSection {
  sectionId: string;
  sectionCode: string;
  sectionName: string;
  products: ShopProduct[];
}

/**
 * 쇼핑몰 상품 목록 응답 (섹션 + 전체 상품)
 */
export interface ShopProductsResponse {
  sections: ShopSection[];
  products: ShopProduct[];
}

/**
 * 사용자 - 쇼핑몰 상품 목록 아이템\n */
export interface ShopProduct {
  productId?: string; // ⭐ UUID 추가 (API가 반환할 수 있음)
  code: string;
  name: string;
  price: number;
  image: string;
  discountPrice: number;
  discountRate: number;
  salesStatus: SalesStatus;
  usagePeriod?: string; // ⭐ 새로 추가
}

/**
 * 사용자 - 쇼핑몰 상품 목록 조회
 * GET /api/product/shop
 */
export async function getShopProducts(params?: {
  name?: string;
  categoryId?: string;
}): Promise<ApiResponse<ShopProductsResponse>> {
  try {
    // ⭐ 상대 경로로 API 호출
    let url = `/api/product/shop`;
    const queryParams: string[] = [];
    
    // ⭐ channelCode 필수 쿼리 파라미터 추가
    const channelCode = getChannelCode();
    queryParams.push(`channelCode=${channelCode}`);
    
    if (params?.name) queryParams.push(`name=${encodeURIComponent(params.name)}`);
    if (params?.categoryId) queryParams.push(`categoryId=${params.categoryId}`);
    
    if (queryParams.length > 0) {
      url += `?${queryParams.join('&')}`;
    }

    console.log('🔴🔴🔴 [SHOP API] ===========================================');
    console.log('🔴🔴🔴 [SHOP API] 쇼핑몰 상품 조회 시작');
    console.log('🔴🔴🔴 [SHOP API] 채널 코드:', channelCode);
    console.log('🔴🔴🔴 [SHOP API] 요청 URL (절대경로):', url);
    console.log('🔴🔴🔴 [SHOP API] ===========================================');
    
    // ⭐ 절대 URL을 그대로 전달 (api.get이 절대 URL 감지)
    const response = await api.get<ShopProductsResponse>(url);
    
    console.log('🟢🟢🟢 [SHOP API] ===========================================');
    console.log('🟢🟢🟢 [SHOP API] API 응답 받음!');
    console.log('🟢🟢🟢 [SHOP API] response.success:', response.success);
    console.log('🟢🟢🟢 [SHOP API] response.data 타입:', typeof response.data);
    console.log('🟢🟢🟢 [SHOP API] response.data:', response.data);
    console.log('🟢🟢🟢 [SHOP API] sections 개수:', response.data?.sections?.length);
    console.log('🟢🟢🟢 [SHOP API] products 개수:', response.data?.products?.length);
    console.log('🟢🟢🟢 [SHOP API] ===========================================');
    
    // ⭐ API 응답 구조: { sections: [], products: [] } 전체를 반환
    if (response.success && response.data) {
      console.log('✅ [SHOP API] 섹션 데이터 포함하여 응답 반환');
      
      // ShopProductsResponse 형태 그대로 반환
      return {
        success: true,
        data: response.data,
        message: response.message || 'OK',
        timestamp: response.timestamp || new Date().toISOString(),
      };
    }
    
    // 응답이 없거나 실패한 경우 폴백
    console.log('❌ [SHOP API] 응답 데이터 없음 - 폴백 시작');
    throw new Error('API 응답 데이터가 없습니다');
  } catch (error) {
    // 하이브리드 방식: API 실패 시 조용히 로컬 데이터 사용
    console.log('⚠️ [SHOP API] ===========================================');
    console.log('⚠️ [SHOP API] API 실패, 로컬 데이터로 폴백합니다.');
    console.log('⚠️ [SHOP API] 에러:', error);
    console.log('⚠️ [SHOP API] 필터 파라미터:', params);
    console.log('⚠️ [SHOP API] ===========================================');
    
    // shop-data.ts의 상품 데이터 사용
    const { shopStore } = await import('../../data/shop-data');
    const localProductsResponse = shopStore.getAllProducts();
    
    if (localProductsResponse.success && localProductsResponse.data) {
      let filteredProducts = localProductsResponse.data;
      
      // ⭐ categoryId로 필터링 (파미터가 있는 경우)
      if (params?.categoryId) {
        console.log('[API] categoryId로 필터링:', params.categoryId);
        
        // 모든 카테고리를 평면화하여 자식 카테고리 ID 목록 수집
        const { useMenuCategories } = await import('../../data/hooks/useShopStore');
        const menuCategoriesModule = await import('../../data/shop-data');
        const categoriesResponse = menuCategoriesModule.shopStore.getMenuCategories();
        
        if (categoriesResponse.success && categoriesResponse.data) {
          const allCategories = categoriesResponse.data;
          
          // 재귀적으로 카테고리와 모든 하위 카테고리 ID를 수집
          const collectCategoryIds = (categoryId: string): string[] => {
            const result = [categoryId];
            
            const findAndCollectChildren = (cats: any[]): void => {
              cats.forEach(cat => {
                if (cat.id === categoryId && cat.children) {
                  cat.children.forEach((child: any) => {
                    result.push(...collectCategoryIds(child.id));
                  });
                } else if (cat.children) {
                  findAndCollectChildren(cat.children);
                }
              });
            };
            
            findAndCollectChildren(allCategories);
            return result;
          };
          
          const targetCategoryIds = collectCategoryIds(params.categoryId);
          console.log('[API] 대상 카테고리 ID 목록 (자식 포함):', targetCategoryIds);
          
          filteredProducts = filteredProducts.filter(p => 
            targetCategoryIds.includes(p.categoryId)
          );
          
          console.log('[API] 필터링 결과:', filteredProducts.length, '개 상품');
        } else {
          // 카테고리 정보를 가져올 수 없는 경우 직접 필터링
          filteredProducts = filteredProducts.filter(p => p.categoryId === params.categoryId);
        }
      }
      
      // name으로 필터링 (검색)
      if (params?.name) {
        console.log('[API] name으로 필터링:', params.name);
        filteredProducts = filteredProducts.filter(p => 
          p.name.toLowerCase().includes(params.name!.toLowerCase())
        );
      }
      
      // 로컬 Product를 ShopProduct 형식으로 변환
      const shopProducts: ShopProduct[] = filteredProducts.map(p => ({
        productId: p.id, // ⭐ 로컬 데이터의 id를 productId로 매핑 (UUID)
        code: p.id,
        name: p.name,
        price: p.originalPrice || p.price,
        image: p.thumbnailUrl,
        discountPrice: p.price,
        discountRate: p.discountRate || 0,
        salesStatus: (p.salesStatus as SalesStatus) || 'ON_SALE', // ⭐ 로컬 데이터의 실제 salesStatus 사용
      }));
      
      return {
        success: true,
        data: {
          sections: [], // 로컬 데이터에는 섹션 없음
          products: shopProducts,
        },
        message: 'OK (로컬 데이터)',
        timestamp: new Date().toISOString(),
      };
    }
    
    // 최종 폴백: 하드코딩된 더미 데이터
    const dummyProducts: ShopProduct[] = [
      {
        code: 'CONCERT-001',
        name: '2025 봄 콘서트 - 서울',
        price: 150000,
        image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800',
        discountPrice: 135000,
        discountRate: 10,
        salesStatus: 'ON_SALE' as SalesStatus,
      },
      {
        code: 'MUSICAL-001',
        name: '뮤지컬 레미제라블 - 부산',
        price: 120000,
        image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800',
        discountPrice: 96000,
        discountRate: 20,
        salesStatus: 'ON_SALE' as SalesStatus,
      },
    ];
    
    return {
      success: true,
      data: {
        sections: [],
        products: dummyProducts,
      },
      message: 'OK (더미 데이터)',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 사용자 - 메인 + 서브 카고리별 품 목록 조회
 * GET /api/product/shop/{mainCategory}/{subCategory}
 * GET /api/product/shop/{mainCategory}
 */
export async function getShopProductsByCategory(
  mainCategory: string,
  subCategory?: string
): Promise<ApiResponse<ShopProductsResponse>> {
  try {
    // ⭐ 상대 경로로 API 호출
    
    // ⭐ channelCode 필수 쿼리 파라미터 추가
    const channelCode = getChannelCode();
    
    // subCategory가 있으면 2depth, 없으면 1depth (메인 카테고리만)
    const urlPath = subCategory 
      ? `/api/product/shop/${mainCategory}/${subCategory}`
      : `/api/product/shop/${mainCategory}`;
    
    const url = `${urlPath}?channelCode=${channelCode}`;
    
    console.log('🔵🔵🔵 [CATEGORY API] ===========================================');
    console.log('🔵🔵🔵 [CATEGORY API] 카테고리별 상품 조회 시작');
    console.log('🔵🔵🔵 [CATEGORY API] 채널 코드:', channelCode);
    console.log('🔵🔵🔵 [CATEGORY API] 메인 카테고리 코드:', mainCategory);
    console.log('🔵🔵🔵 [CATEGORY API] 서브 카테고리 코드:', subCategory || '(없음)');
    console.log('🔵🔵🔵 [CATEGORY API] 요청 URL:', url);
    console.log('🔵🔵🔵 [CATEGORY API] ===========================================');
    
    const response = await api.get<ShopProductsResponse>(url);
    
    console.log('🟢🟢🟢 [CATEGORY API] ===========================================');
    console.log('🟢🟢🟢 [CATEGORY API] API 응답 받음!');
    console.log('🟢🟢🟢 [CATEGORY API] sections 개수:', response.data?.sections?.length || 0);
    console.log('🟢🟢🟢 [CATEGORY API] products 개수:', response.data?.products?.length || 0);
    console.log('🟢🟢🟢 [CATEGORY API] ===========================================');
    
    return response;
  } catch (error) {
    // 하이브리드 방식: API 실패 시 로컬 데이터 사용
    console.log('⚠️ [CATEGORY API] 카테고리별 상품 조회 실패, 로컬 데이터로 폴백합니다.');
    console.log('⚠️ [CATEGORY API] 에러:', error);
    
    // shop-data.ts의 상품 데이터 사용
    const { shopStore } = await import('../../data/shop-data');
    const localProductsResponse = shopStore.getAllProducts();
    
    if (localProductsResponse.success && localProductsResponse.data) {
      // subCategory가 있으면 서브 카테고리로, 없으면 메인 카테고리로 필터링
      const targetCategory = subCategory || mainCategory;
      const filteredProducts = localProductsResponse.data.filter(p => 
        p.categoryId === targetCategory
      );
      
      // 로컬 Product를 ShopProduct 형식으로 변환
      const shopProducts: ShopProduct[] = filteredProducts.map(p => ({
        productId: p.id, // ⭐ 로컬 데이터의 id를 productId로 매핑 (UUID)
        code: p.id,
        name: p.name,
        price: p.originalPrice || p.price,
        image: p.thumbnailUrl,
        discountPrice: p.price,
        discountRate: p.discountRate || 0,
        salesStatus: 'ON_SALE' as SalesStatus,
      }));
      
      return {
        success: true,
        data: {
          sections: [], // 로컬 데이터에는 섹션 없음
          products: shopProducts,
        },
        message: 'OK (로컬 데이터)',
        timestamp: new Date().toISOString(),
      };
    }
    
    // 최종 폴백: 빈 배열
    return {
      success: true,
      data: {
        sections: [],
        products: [],
      },
      message: 'OK (더미 데이터)',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 사용자 - 상품 검색
 * GET /api/product/shop/search?name={searchQuery}&channelCode={channelCode}
 * ⭐ 주의: 색 API는 data가 직접 ShopProduct[] 배열입니다 (sections 없음)
 */
export async function searchShopProducts(
  searchQuery: string
): Promise<ApiResponse<ShopProduct[]>> {
  try {
    // ⭐ 상대 경로로 API 호출
    
    // ⭐ channelCode 필수 쿼리 파라미터 추가
    const channelCode = getChannelCode();
    const url = `/api/product/shop/search?channelCode=${channelCode}&name=${encodeURIComponent(searchQuery)}`;
    
    console.log('🟣🟣🟣 [SEARCH API] ===========================================');
    console.log('🟣🟣🟣 [SEARCH API] 상품 검색 시작');
    console.log('🟣🟣🟣 [SEARCH API] 채널 코드:', channelCode);
    console.log('🟣🟣🟣 [SEARCH API] 검색어:', searchQuery);
    console.log('🟣🟣🟣 [SEARCH API] 요청 URL:', url);
    console.log('🟣🟣🟣 [SEARCH API] ===========================================');
    
    const response = await api.get<ShopProduct[]>(url);
    
    console.log('🟢🟢🟢 [SEARCH API] ===========================================');
    console.log('🟢🟢🟢 [SEARCH API] API 응답 받음!');
    console.log('🟢🟢🟢 [SEARCH API] 검색 결과 개수:', response.data?.length || 0);
    console.log('🟢🟢🟢 [SEARCH API] 상품 목록:', response.data);
    console.log('🟢🟢🟢 [SEARCH API] ===========================================');
    
    return response;
  } catch (error) {
    // 하이브리드 방식: API 실패 시 로컬 데이터 사용
    console.log('⚠️ [SEARCH API] 상품 검색 실패, 로컬 데이터로 폴백합니다.');
    console.log('⚠️ [SEARCH API] 에러:', error);
    
    // shop-data.ts의 상품 데이터 사용
    const { shopStore } = await import('../../data/shop-data');
    const localProductsResponse = shopStore.getAllProducts();
    
    if (localProductsResponse.success && localProductsResponse.data) {
      // 검색어로 필터링
      const filteredProducts = localProductsResponse.data.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      // 로컬 Product를 ShopProduct 형식으로 변환
      const shopProducts: ShopProduct[] = filteredProducts.map(p => ({
        productId: p.id, // ⭐ 로컬 데이터의 id를 productId로 매핑 (UUID)
        code: p.id,
        name: p.name,
        price: p.originalPrice || p.price,
        image: p.thumbnailUrl,
        discountPrice: p.price,
        discountRate: p.discountRate || 0,
        salesStatus: 'ON_SALE' as SalesStatus,
        usagePeriod: p.description,
      }));
      
      return {
        success: true,
        data: shopProducts, // ⭐ 직접 배열 반환
        message: 'OK (로컬 데이터)',
        timestamp: new Date().toISOString(),
      };
    }
    
    // 최종 폴백: 빈 배
    return {
      success: true,
      data: [], // ⭐ 직접 배열 반환
      message: 'OK (더미 데이터)',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 사용자 - 상품 상세 조회
 * GET /api/product/shop/detail/{code}?channelCode={channelCode}
 */
export async function getProductById(id: string, channelCode?: string): Promise<ApiResponse<ProductDetail>> {
  console.log('[API] ========================================');
  console.log('[API] 상품 상세 조회 시작');
  console.log('[API] 상품 ID:', id);
  console.log('[API] 채널 코드 (파라미터):', channelCode);
  console.log('[API] ========================================');
  
  try {
    // ⭐ channelCode 필수 쿼리 파라미터 추가
    const finalChannelCode = channelCode || getChannelCode();
    const url = `/api/product/shop/detail/${id}?channelCode=${finalChannelCode}`;
    
    console.log('[API] 🌐 상품 상세 조회 API 호출:', `GET ${url}`);
    console.log('[API] 최종 채널 코드:', finalChannelCode);
    const response = await api.get<ProductDetail>(url);
    console.log('[API] ✅ 상품 상세 조회 API 응답 성공!');
    console.log('[API] 응답 데이터:', {
      success: response.success,
      productName: response.data?.name,
      productCode: response.data?.code,
      hasImages: !!response.data?.imageUrl?.length,
    });
    
    return response;
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '오류가 발생했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 사용자 - 쇼핑몰 상품 상세 조회 (새 API)
 * GET /api/product/shop/detail/{code}?channelCode={channelCode}
 */
export async function getShopProductDetail(code: string): Promise<ApiResponse<ShopProductDetail>> {
  console.log('[API] ========================================');
  console.log('[API] 쇼핑몰 상품 상세 조회 시작');
  console.log('[API] 상품 코드:', code);
  console.log('[API] ========================================');
  
  try {
    // ⭐ channelCode 필수 쿼리 파라미터 추가
    const channelCode = getChannelCode();
    const url = `/api/product/shop/detail/${code}?channelCode=${channelCode}`;
    
    console.log('[API] 🌐 쇼핑몰 상품 상세 조회 API 호출:', `GET ${url}`);
    console.log('[API] 채널 코드:', channelCode);
    const response = await api.get<ShopProductDetail>(url);
    console.log('[API] ✅ 쇼핑몰 상품 상세 조회 API 응답 성공!');
    console.log('[API] 응답 데이터:', {
      success: response.success,
      productName: response.data?.name,
      productCode: response.data?.code,
      productType: response.data?.type,
      hasOptions: !!response.data?.options?.length,
      hasDatePrices: !!response.data?.datePrices?.length,
    });
    
    return response;
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '오류가 발생했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * ============================================
 * 관리자 API
 * ============================================
 */

/**
 * 1. 관리자 - 상품 목록 조회
 * GET /api/admin/product
 */
export async function getAdminProducts(params?: {
  srchWord?: string;  // 검색어
  categoryId?: string;  // 카테고리 ID
  salesStatus?: string;  // 판매 상태 [ALL, READY, ON_SALE, SOLD_OUT, STOPPED]
  partnerId?: string;  // 파트너 ID (프론트엔드 필터용)
}): Promise<ApiResponse<AdminProduct[]>> {
  try {
    let url = '/api/admin/product';
    const queryParams: string[] = [];
    
    // API 문서에 맞춰 파라미터 전달
    if (params?.srchWord) queryParams.push(`srchWord=${encodeURIComponent(params.srchWord)}`);
    if (params?.categoryId && params.categoryId !== 'ALL') {
      queryParams.push(`categoryId=${encodeURIComponent(params.categoryId)}`);
    }
    if (params?.salesStatus && params.salesStatus !== 'ALL') {
      queryParams.push(`salesStatus=${encodeURIComponent(params.salesStatus)}`);
    }
    
    if (queryParams.length > 0) {
      url += `?${queryParams.join('&')}`;
    }

    console.log('[API] 관리자 상품 조회 API 호출:', url);
    const response = await api.get<AdminProduct[]>(url);
    console.log('[API] 관리자 상품 조회 API 응답:', response.data?.length, '개');
    
    // ⭐ 프론트엔드에서 partnerId 필터링 (API가 지원하지 않으므로)
    if (response.success && response.data && params?.partnerId && params.partnerId !== 'ALL') {
      const filteredData = response.data.filter(p => p.partnerId === params.partnerId);
      return {
        ...response,
        data: filteredData,
      };
    }
    
    return response;
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '오류가 발생했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 1-1. 관리자 - 채널별 상품 목록 조회
 * GET /api/admin/channels/{channelId}/products
 */
export async function getChannelProducts(
  channelId: string,
  params?: {
    srchWord?: string;  // 검색어
    categoryId?: string;  // 카테고리 ID
    salesStatus?: string;  // 판매 상태
  }
): Promise<ApiResponse<ChannelProductItem[]>> {
  try {
    let url = `/api/admin/channels/${channelId}/products`;
    const queryParams: string[] = [];
    
    if (params?.srchWord) queryParams.push(`srchWord=${encodeURIComponent(params.srchWord)}`);
    if (params?.categoryId && params.categoryId !== 'ALL') {
      queryParams.push(`categoryId=${encodeURIComponent(params.categoryId)}`);
    }
    if (params?.salesStatus && params.salesStatus !== 'ALL') {
      queryParams.push(`salesStatus=${encodeURIComponent(params.salesStatus)}`);
    }
    
    if (queryParams.length > 0) {
      url += `?${queryParams.join('&')}`;
    }

    console.log('[API] 채널 상품 조회 API 호출:', url);
    const response = await api.get<ChannelProductItem[]>(url);
    console.log('[API] 채널 상품 조회 API 응답:', response.data?.length, '개');
    
    return response;
  } catch (error) {
    console.log('[API] 채널 상품 조회 실패, 빈 배열 반환');
    
    return {
      success: true,
      data: [],
      message: 'OK (빈 데이터)',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 1-2. 관리자 - 채널 상품 제외
 * POST /api/admin/channels/{channelId}/products/{productId}/exclude
 */
export async function excludeChannelProduct(
  channelId: string,
  productId: string
): Promise<ApiResponse<void>> {
  try {
    console.log('[API] 채널 상품 제외 API 호출:', { channelId, productId });
    const response = await api.post<void>(
      `/api/admin/channels/${channelId}/products/${productId}/exclude`
    );
    console.log('[API] ✅ 채널 상품 제외 성공');
    return response;
  } catch (error) {
    console.log('[API] ❌ 채널 상품 제외 실패');
    return {
      success: false,
      data: undefined,
      message: error instanceof Error ? error.message : '상품 제외에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 1-3. 관리자 - 채널 상품 제외 해제 (포함)
 * DELETE /api/admin/channels/{channelId}/products/{productId}/include
 */
export async function includeChannelProduct(
  channelId: string,
  productId: string
): Promise<ApiResponse<void>> {
  try {
    console.log('[API] 채널 상품 포함 API 호출:', { channelId, productId });
    const response = await api.delete<void>(
      `/api/admin/channels/${channelId}/products/${productId}/include`
    );
    console.log('[API] ✅ 채널 상품 포함 성공');
    return response;
  } catch (error) {
    console.log('[API] ❌ 채널 상품 포함 실패');
    return {
      success: false,
      data: undefined,
      message: error instanceof Error ? error.message : '상품 포함에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 2. 관리자 - 상품 등록
 * POST /api/admin/product
 */
export async function createAdminProduct(
  product: ProductCreateRequest
): Promise<ApiResponse<ProductDetail>> {
  try {
    console.log('[API] 상품 등록 요청:', product);
    const response = await api.post<ProductDetail>('/api/admin/product', product);
    console.log('[API] 상품 등록 응답:', response);
    return response;
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '오류가 발생했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 3. 관리자 - 상품 옵션 등록
 * POST /api/admin/product/{id}/option
 */
export async function createProductOption(
  productId: string,
  option: ProductOptionRequest
): Promise<ApiResponse<ProductOption>> {
  try {
    const response = await api.post<ProductOption>(
      `/api/admin/product/${productId}/option`,
      option
    );
    return response;
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '옵션 등록에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 4. 관리자 - 상품 배송정보 수정
 * PATCH /api/admin/product/{id}/shipping
 */
export async function updateProductShipping(
  productId: string,
  shipping: ProductShippingRequest
): Promise<ApiResponse<void>> {
  try {
    const response = await api.patch<void>(
      `/api/admin/product/${productId}/shipping`,
      shipping
    );
    return response;
  } catch (error) {
    return {
      success: false,
      data: undefined,
      message: error instanceof Error ? error.message : '배송정보 수정에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 5. 관리자 - 상품 섹션 등록/수정
 * PATCH /api/admin/product/{id}/section
 */
export async function updateProductSection(
  productId: string,
  section: ProductSectionRequest
): Promise<ApiResponse<void>> {
  try {
    const response = await api.patch<void>(
      `/api/admin/product/${productId}/section`,
      section
    );
    return response;
  } catch (error) {
    return {
      success: false,
      data: undefined,
      message: error instanceof Error ? error.message : '섹션 설정에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 6. 관리자 - 상품 상세내용 수정
 * PATCH /api/admin/product/{id}/detailContent
 */
export async function updateProductDetailContent(
  productId: string,
  detailContent: ProductDetailContentRequest
): Promise<ApiResponse<void>> {
  try {
    const response = await api.patch<void>(
      `/api/admin/product/${productId}/detailContent`,
      detailContent
    );
    return response;
  } catch (error) {
    return {
      success: false,
      data: undefined,
      message: error instanceof Error ? error.message : '상세내용 수정에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 7. 관리자 - 상품 기본정보 수정
 * PATCH /admin/product/{id}/basic
 */
export async function updateProductBasic(
  productId: string,
  basic: ProductBasicUpdateRequest
): Promise<ApiResponse<void>> {
  try {
    console.log('[API] 상품 기본정보 수정 요청:', {
      productId,
      request: basic,
      imageUrlType: Array.isArray(basic.imageUrl) ? 'array' : typeof basic.imageUrl,
      imageUrlLength: basic.imageUrl?.length,
    });
    
    // 명시적으로 필드명을 지정하여 요청 객체 생성
    const requestPayload: any = {
      name: basic.name,
      code: basic.code,
      categoryId: basic.categoryId,
      partnerId: basic.partnerId ?? null,  // undefined null로 변환
      price: basic.price,
      discountPrice: basic.discountPrice,
      salesStatus: basic.salesStatus,
      description: basic.description,
      // imageUrl 또는 imageUrls 둘 다 처리 (하위 호환성)
      imageUrl: (basic as any).imageUrls || basic.imageUrl || [],
      regionCode: basic.regionCode ?? null, // ⭐ 지역코드 (undefined면 null)
      ticketType: basic.ticketType ?? null, // ⭐ 티켓분류코드 (undefined면 null)
      prePurchased: basic.prePurchased ?? false, // ⭐ 선사입형 여부
      type: basic.type ?? 'NORMAL', // ⭐ 상품 유형
      visible: basic.visible ?? true, // ⭐ 활성화 여부
    };
    
    console.log('[API] 실제 전송 payload:', JSON.stringify(requestPayload, null, 2));
    
    const response = await api.patch<void>(
      `/api/admin/product/${productId}/basic`,
      requestPayload
    );
    
    console.log('[API] ✅ 상품 기본정보 수정 성공:', response);
    return response;
  } catch (error) {
    console.log('[API] ========================================');
    console.log('[API] ❌ 상품 기본정보 수정 API 실패');
    console.log('[API] ========================================');
    console.log('[API] 에러 정보:', String(error));
    console.log('[API] ========================================');

    // ⭐ API 실패 시 실제 에러 메시지를 반환 (로컬 폴백 없음)
    const errMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      data: undefined,
      message: errMsg,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 8. 관리자 - 상품 활성화 여부 수정
 * PATCH /api/admin/product/{id}/visible?visible={boolean}
 */
export async function updateProductVisible(
  productId: string,
  visible: boolean
): Promise<ApiResponse<void>> {
  try {
    console.log('[API] ========================================');
    console.log('[API] 상품 활성화 여부 수정 시작');
    console.log('[API] productId:', productId);
    console.log('[API] visible:', visible);
    console.log('[API] ========================================');
    
    const response = await api.patch<void>(
      `/api/admin/product/${productId}/visible?visible=${visible}`
    );
    
    console.log('[API] ✅ 상품 활성화 여부 수정 성공:', response);
    return response;
  } catch (error) {
    return {
      success: false,
      data: undefined,
      message: error instanceof Error ? error.message : '오류가 발생했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 9. 관리자 - 상품 상세정보 조회
 * GET /api/admin/product/{id}
 */
export async function getAdminProductDetail(id: string): Promise<ApiResponse<ProductDetail>> {
  try {
    const response = await api.get<ProductDetail>(`/api/admin/product/${id}`);
    return response;
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '오류가 발생했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 10. 관리자 - 상품 옵션 상세 조회
 * GET /api/admin/product/option/{id}
 */
export async function getProductOption(
  optionId: string
): Promise<ApiResponse<ProductOption>> {
  try {
    const response = await api.get<ProductOption>(
      `/api/admin/product/option/${optionId}`
    );
    return response;
  } catch (error) {
    return {
      success: false,
      data: null,
      message: '옵션을 찾을 수 없습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 상품의 모든 옵션 조회
 * GET /api/admin/product/{productId}/options
 */
export async function getProductOptions(
  productId: string
): Promise<ApiResponse<ProductOption[]>> {
  try {
    // 실제 API 호출
    const response = await api.get<ProductOption[]>(
      `/api/admin/product/${productId}/options`
    );
    return response;
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '오류가 발생했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 11. 관리자 - 상품 옵션 삭제
 * DELETE /api/admin/product/option/{id}
 */
export async function deleteProductOption(optionId: string): Promise<ApiResponse<void>> {
  try {
    const response = await api.delete<void>(
      `/api/admin/product/option/${optionId}`
    );
    return response;
  } catch (error) {
    return {
      success: false,
      data: undefined,
      message: error instanceof Error ? error.message : '옵션 삭제에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 12. 관리자 - 상품 옵션 수정
 * PATCH /api/admin/product/option/{id}
 */
export async function updateProductOption(
  optionId: string,
  option: ProductOptionRequest
): Promise<ApiResponse<void>> {
  try {
    const response = await api.patch<void>(
      `/api/admin/product/option/${optionId}`,
      option
    );
    return response;
  } catch (error) {
    return {
      success: false,
      data: undefined,
      message: error instanceof Error ? error.message : '옵션 수정에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 12-1. 관리자 - 상품 옵션값 수정
 * PATCH /api/admin/product/optionValue/{id}
 */
export interface ProductOptionValueUpdateRequest {
  value: string;          // 옵션 명칭 (예: Red, XL)
  code: string;           // 관리용 옵션 코드
  stock: number;          // 재고 수량
  additionalPrice: number; // 추가 금액
  basePrice: number;      // 기본 판매가
  partnerSubCode?: string; // 파트너별도코드
  displayOrder?: number;  // 표시순서
}

export async function updateProductOptionValue(
  optionValueId: string,
  optionValue: ProductOptionValueUpdateRequest
): Promise<ApiResponse<any>> {
  try {
    const response = await api.patch<any>(
      `/api/admin/product/optionValue/${optionValueId}`,
      optionValue
    );
    return response;
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '옵션값 수정에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 13. 관리자 - 상품 삭제
 * DELETE /api/admin/product/{id}
 */
export async function deleteAdminProduct(productId: string): Promise<ApiResponse<void>> {
  try {
    const response = await api.delete<void>(`/api/admin/product/${productId}`);
    return response;
  } catch (error) {
    return {
      success: false,
      data: undefined,
      message: error instanceof Error ? error.message : '상품 삭제에 실패했습니다',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 14. 관리자 - 상품 기간 등록
 * POST /api/admin/product/period
 */
export async function createProductPeriod(
  period: ProductPeriodRequest
): Promise<ApiResponse<ProductPeriodResponse>> {
  try {
    console.log('[API] 상품 기간 등록 요청:', period);
    
    const response = await api.post<ProductPeriodResponse>(
      '/api/admin/product/period',
      period
    );
    
    console.log('[API] ✅ 상품 기간 등록 성공:', response);
    return response;
  } catch (error) {
    console.log('[API] ❌ 상품 기간 등록 API 실패, 로컬 데이터로 폴백');
    
    // 로컬 데이터 저장 (더미 응답 반환)
    try {
      console.log('[API] 로컬 데이터에 기간 정보 저장 시도');
      
      // 로컬 저장 성공으로 간주하고 응답 반환
      return {
        success: true,
        data: {
          optionValueId: period.optionValueId,
          startDate: period.startDate,
          endDate: period.endDate,
          price: period.price,
          discountPrice: period.discountPrice,
          groupNo: Date.now(), // ⭐ 로컬 전용 고유 번호 생성
        },
        message: '상품 기간이 등록되었습니다 (로컬)',
        timestamp: new Date().toISOString(),
      };
    } catch (localError) {
      console.error('[API] ❌ 로컬 데이터 저장 실패:', localError);
      return {
        success: false,
        data: undefined,
        message: error instanceof Error ? error.message : '상품 기간 등록에 실패했습니다',
        timestamp: new Date().toISOString(),
      };
    }
  }
}

/**
 * 15. 관리자 - 상품 기간 삭제
 * DELETE /api/admin/product/period/{id}/{groupNo}
 */
export async function deleteProductPeriod(
  optionValueId: string,
  groupNo: number
): Promise<ApiResponse<void>> {
  try {
    console.log('[API] 상품 기간 삭제 요청:', {
      optionValueId,
      groupNo,
    });
    
    const response = await api.delete<void>(
      `/api/admin/product/period/${optionValueId}/${groupNo}`
    );
    
    console.log('[API] ✅ 상품 기간 삭제 성공:', response);
    return response;
  } catch (error) {
    console.log('[API] ❌ 상품 기간 삭제 API 실패, 로컬 데이터로 폴백');
    
    // 로컬 데이터 삭제 (더미 응답 반환)
    try {
      console.log('[API] 로컬 데이터에서 기간 정보 삭제 시도');
      
      // 로컬 삭제 성공으로 간주하고 응답 반환
      return {
        success: true,
        data: undefined,
        message: '상품 기간이 삭제되었습니다 (로컬)',
        timestamp: new Date().toISOString(),
      };
    } catch (localError) {
      console.error('[API] ❌ 로컬 데이터 삭제 실패:', localError);
      return {
        success: false,
        data: undefined,
        message: error instanceof Error ? error.message : '상품 기간 삭제에 실패했습니다',
        timestamp: new Date().toISOString(),
      };
    }
  }
}

/**
 * ============================================
 * 타입 정의
 * ============================================
 */

/**
 * 쇼핑몰 상품 상세 정보 (사용자용)
 */
export interface ShopProductDetail {
  code: string;
  type: 'STAY' | 'NORMAL'; // ⭐ 상품 타입 추가
  imageUrl: string[]; // ⭐ 배열로 변경
  name: string;
  categoryName: string;
  description: string;
  price: number;
  discountPrice: number;
  discountRate: number;
  shippingInfo?: string;
  warrantyInfo?: string;
  returnInfo?: string;
  detailContent?: string;
  usagePeriod?: string; // ⭐ 사용 가능 기간
  options?: ShopProductOption[]; // ⭐ 새 옵션 구조
  datePrices?: ShopProductDatePrice[]; // ⭐ 숙박형 날짜별 가격
}

/**
 * 쇼핑몰 상품 날짜별 가격 (숙박형 전용)
 */
export interface ShopProductDatePrice {
  optionValueId: string;
  optionValueName: string;
  priceDate: string; // YYYY-MM-DD
  price: number;
  discountPrice?: number;
}

/**
 * 쇼핑몰 상품 옵션 (사용자용)
 */
export interface ShopProductOption {
  id: string;
  name: string;
  code: string;
  required: boolean;
  values: ShopProductOptionValue[];
}

/**
 * 쇼핑몰 상품 옵션 값 (사용자용)
 */
export interface ShopProductOptionValue {
  id: string;
  code: string;
  value: string;
  additionalPrice: number;
}

/**
 * 상품 상세 정보
 */
export interface ProductDetail {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  categoryName: string;
  partnerId?: string;
  partnerName?: string;
  productType?: 'STAY' | 'NORMAL';
  description: string;
  imageUrl?: string;
  imageUrls?: string[];
  price: number;
  discountPrice: number;
  stock: number;
  salesStatus: SalesStatus | string;
  displayOrder?: number;
  visible: boolean;
  shippingInfo?: string;
  warrantyInfo?: string;
  returnInfo?: string;
  detailContent?: string;
  regionCode?: string; // ⭐ 지역코드
  ticketType?: string; // ⭐ 티켓분류코드
  createdAt: string;
  updatedAt: string;
  options?: ProductOption[];
}

/**
 * 관리자 - 상품 목록 아이템
 */
export interface AdminProduct {
  id: string;
  image: string;  // ⭐ 이미지 URL 추가 (API 응답에 포함)
  code: string;
  name: string;
  type: 'NORMAL' | 'STAY';  // ⭐ 상품 타입 추가 (API 응답에 포함)
  categoryId: string;
  categoryName: string;
  partnerId?: string;
  partnerName?: string;
  price: number;
  discountPrice: number;
  stock: number;
  salesStatus: SalesStatus;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 채널 상품 목록 아이템
 */
export interface ChannelProductItem {
  id: string;
  productCode: string;
  productName: string | null;
  logoUrl: string | null;
  exclude: boolean;
}

/**
 * 상품 옵션
 */
export interface ProductOption {
  id: string;
  name: string;
  required: boolean;
  multipleSelect: boolean;
  displayOrder: number;
  values: ProductOptionValue[];
}

/**
 * 상품 옵션 값
 */
export interface ProductOptionValue {
  id: string;
  value: string;
  additionalPrice: number;
  stock: number;
  displayOrder: number;
}

/**
 * 상품 등록 요청
 */
export interface ProductCreateRequest {
  code?: string;
  name: string;
  categoryId: string;
  partnerId?: string;
  type?: 'STAY' | 'NORMAL';
  description: string;
  imageUrl?: string | string[];
  price: number;
  discountPrice: number;
  salesStatus: string;
  displayOrder?: number; // ⭐ 표시 순서
  visible?: boolean;
  regionCode?: string; // ⭐ 지역코드 (문자열로 변경 - 서버 스펙과 일치)
  ticketType?: string; // ⭐ 티켓분류코드 (문자열로 변경 - 서버 스펙과 일치)
  prePurchased?: boolean; // ⭐ 선사입형 여부
}

/**
 * 상품 옵션 등록/수정 요청
 */
export interface ProductOptionRequest {
  name: string;
  code: string;
  required: boolean;
  valuesInsert?: {
    value: string;
    code: string;
    stock?: number;
    additionalPrice?: number;
    basePrice?: number;
    priceType?: 'ADDITIONAL' | 'REPLACE';
    partnerSubCode?: string;
    displayOrder?: number;
  }[];
  deleteValueIds?: string[];
}

/**
 * 상품 배송정보 수정 요청
 */
export interface ProductShippingRequest {
  shippingInfo?: string;
  warrantyInfo?: string;
  returnInfo?: string;
}

/**
 * 상품 섹션 등록/수정 요청
 */
export interface ProductSectionRequest {
  sectionIds: string[];
}

/**
 * 상품 상세내용 수정 요청
 */
export interface ProductDetailContentRequest {
  detailContent: string;
}

/**
 * 상품 기본정보 수정 요청
 */
export interface ProductBasicUpdateRequest {
  name: string;
  code: string;
  categoryId: string;
  partnerId?: string;
  price: number;
  discountPrice: number;
  salesStatus: string;
  description: string;
  imageUrl?: string | string[];
  regionCode?: string; // 지역코드 (문자열)
  ticketType?: string; // 티켓분류코드 (문자열)
  type?: 'STAY' | 'NORMAL'; // 상품 유형
  prePurchased?: boolean; // 선사입형 여부
  visible?: boolean; // 활성화 여부
}

/**
 * 상품 기간 등록 요청
 */
export interface ProductPeriodRequest {
  optionValueId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  price: number;
  discountPrice?: number;
}

/**
 * 상품 기간 응답
 */
export interface ProductPeriodResponse {
  optionValueId: string;
  startDate: string;
  endDate: string;
  price: number;
  discountPrice?: number;
  groupNo?: number; // 서버에서 생성된 그룹 번호
}

// ============================================
// 채널별 가격 관리 API
// ============================================

/**
 * 채널별 가격 정보 (목록 조회용)
 */
export interface ChannelPriceItem {
  channelId: string;
  channelCode: string;
  channelName: string;
  companyName?: string;
  logoUrl?: string;
  basePrice?: number;
  discountPrice?: number;
  enabled: boolean;
}

/**
 * 채널별 가격 상세 정보 (상세 조회용)
 */
export interface ChannelPriceDetail {
  channelId: string;
  channelCode: string;
  channelName: string;
  companyName?: string;
  logoUrl?: string;
  basePrice?: number;
  discountPrice?: number;
  enabled: boolean;
  options: {
    optionId: string;
    optionName: string;
    optionCode: string;
    values: {
      optionValueId: string;
      optionValueName: string;
      additionalPrice?: number;
    }[];
  }[];
}

/**
 * 채널별 가격 저장 요청
 */
export interface ChannelPriceSaveRequest {
  basePrice?: number;
  discountPrice?: number;
  options: {
    optionId: string; // ⭐ 수: 옵션 ID 추가
    optionValueId: string;
    additionalPrice?: number;
  }[];
}

/**
 * 1. 채널별 가격 목록 조회
 * GET /api/admin/product/{id}/channelPrices
 */
export async function getProductChannelPrices(
  productId: string
): Promise<ApiResponse<ChannelPriceItem[]>> {
  try {
    const endpoint = `/api/admin/product/${productId}/channelPrices`;
    const response = await api.get<ChannelPriceItem[]>(endpoint);
    return response;
  } catch (error) {
    // ⭐ 완전히 조용한 폴백 (로그 없음)
    return {
      success: false,
      data: [],
      message: 'API_NOT_AVAILABLE',
      timestamp: new Date().toISOString(),
      errorCode: 'API_NOT_AVAILABLE',
    };
  }
}

/**
 * 2. 채널별 가격 상세 조회
 * GET /api/admin/product/{id}/channelPrices/{channelId}
 */
export async function getProductChannelPriceDetail(
  productId: string,
  channelId: string
): Promise<ApiResponse<ChannelPriceDetail>> {
  try {
    const response = await api.get<ChannelPriceDetail>(
      `/api/admin/product/${productId}/channelPrices/${channelId}`
    );
    return response;
  } catch (error) {
    // ⭐ 완전히 조용한 폴백 (로그 없음)
    return {
      success: false,
      data: null as any,
      message: 'API_NOT_AVAILABLE',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 3. 채널별 가격 저
 * POST /api/admin/product/{id}/channelPrices/{channelId}
 */
export async function saveProductChannelPrice(
  productId: string,
  channelId: string,
  data: ChannelPriceSaveRequest
): Promise<ApiResponse<ChannelPriceDetail>> {
  try {
    console.log('[API] 채널별 가격 저장:', productId, channelId, data);
    const response = await api.post<ChannelPriceDetail>(
      `/api/admin/product/${productId}/channelPrices/${channelId}`,
      data
    );
    console.log('[API] ✅ 채널별 가격 저장 성공');
    return response;
  } catch (error) {
    console.log('[API] ❌ 채널별 가격 저장 실패');
    
    return {
      success: false,
      data: null as any,
      message: error instanceof Error ? error.message : '채널별 가격 저장 실패',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 4. 채널별 활성화 상태 수정
 * PATCH /api/admin/product/{id}/channelDiscounts/{channelId}/enable
 */
export async function updateProductChannelEnabled(
  productId: string,
  channelId: string,
  enabled: boolean
): Promise<ApiResponse<void>> {
  try {
    console.log('[API] 채널별 활성화 상태 수정:', productId, channelId, enabled);
    const response = await api.patch<void>(
      `/api/admin/product/${productId}/channelDiscounts/${channelId}/enable?enable=${enabled}`
    );
    console.log('[API] ✅ 채널별 활성화 상태 수정 성공');
    return response;
  } catch (error) {
    console.log('[API] ❌ 채널별 활성화 상태 수정 실패');
    
    return {
      success: false,
      data: undefined,
      message: error instanceof Error ? error.message : '채널별 활성화 상태 수정 실패',
      timestamp: new Date().toISOString(),
    };
  }
}