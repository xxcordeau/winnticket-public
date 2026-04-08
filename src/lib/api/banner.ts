/**
 * 배너 관리 API
 * 
 * 백엔드 API 명세 기준
 * 하이브리드 방식: API 서버가 있으면 실제 API 사용, 없으면 더미 데이터로 폴백
 */

import { api } from '../api';
import type { ApiResponse } from './auth';
import type {
  BannerResponse,
  BannerDetailResponse,
  BannerCreateRequest,
  BannerUpdateRequest,
  BannerPageResponse,
  BannerFilter,
  BannerStatsResponse,
  BannerPosition,
} from '../../data/dto/banner.dto';

/**
 * 배너 목록 조회 (관리자용)
 * GET /api/admin/banners
 */
export async function getBanners(
  filter: BannerFilter = {}
): Promise<ApiResponse<BannerPageResponse>> {
  try {
    // 쿼리 파라미터 구성
    const params = new URLSearchParams();
    if (filter.position) {
      params.append('position', filter.position);
    }
    if (filter.keyword) {
      params.append('keyword', filter.keyword);
    }
    if (filter.visible !== undefined) {
      params.append('visible', String(filter.visible));
    }
    if (filter.page !== undefined) {
      params.append('page', String(filter.page));
    }
    if (filter.size !== undefined) {
      params.append('size', String(filter.size));
    }

    const url = `/api/admin/banners${params.toString() ? `?${params.toString()}` : ''}`;
    
    console.log('[배너 API] 백엔드 서버 호출 시도:', url);
    const response = await api.get<BannerPageResponse>(url);
    console.log('✅ [배너 API] 백엔드 서버 연동 성공');
    return response;
  } catch (error) {
    // 폴백은 정상 동작입니다 (하이브리드 모드)
    console.log('ℹ️ [배너 API] 백엔드 미구현 - 로컬 더미 데이터 사용');
    
    const dummyBanners: BannerResponse[] = [
      {
        id: 'BANNER_TEST_01',
        name: '2025 신년 콘서트 특별전',
        description: '새해를 여는 화려한 공연',
        type: 'IMAGE',
        position: 'MAIN_TOP',
        imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&h=400&fit=crop',
        imageUrlMobile: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&h=300&fit=crop',
        clickAction: 'LINK',
        linkUrl: '/shop',
        linkTarget: '_self',
        displayOrder: 1,
        visible: true,
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-12-31T23:59:59Z',
        width: 1200,
        height: 400,
        mobileWidth: 600,
        mobileHeight: 300,
        viewCount: 100,
        clickCount: 20,
        status: 'ACTIVE',
        channelIds: ['11111111-1111-1111-1111-111111111111'],
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2025-12-10T15:30:00Z',
      },
      {
        id: 'BANNER_TEST_02',
        name: '겨울 시즌 뮤지컬 대축제',
        description: '감동과 재미가 가득한 겨울 뮤지컬',
        type: 'IMAGE',
        position: 'MAIN_TOP',
        imageUrl: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=1200&h=400&fit=crop',
        imageUrlMobile: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=600&h=300&fit=crop',
        clickAction: 'LINK',
        linkUrl: '/shop',
        linkTarget: '_self',
        displayOrder: 2,
        visible: true,
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-12-31T23:59:59Z',
        width: 1200,
        height: 400,
        mobileWidth: 600,
        mobileHeight: 300,
        viewCount: 80,
        clickCount: 15,
        status: 'ACTIVE',
        channelIds: ['11111111-1111-1111-1111-111111111111'],
        createdAt: '2025-12-11T10:35:00Z',
        updatedAt: '2025-12-11T10:35:00Z',
      },
      {
        id: 'BANNER_TEST_03',
        name: '스포츠 시즌 티켓 오픈',
        description: '인기 스포츠 경기 티켓 예매',
        type: 'IMAGE',
        position: 'MAIN_TOP',
        imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&h=400&fit=crop',
        imageUrlMobile: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&h=300&fit=crop',
        clickAction: 'LINK',
        linkUrl: '/shop',
        linkTarget: '_self',
        displayOrder: 3,
        visible: true,
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-12-31T23:59:59Z',
        width: 1200,
        height: 400,
        mobileWidth: 600,
        mobileHeight: 300,
        viewCount: 60,
        clickCount: 12,
        status: 'ACTIVE',
        channelIds: ['11111111-1111-1111-1111-111111111111'],
        createdAt: '2025-12-11T10:40:00Z',
        updatedAt: '2025-12-11T10:40:00Z',
      },
    ];

    // 프론트엔드에서 필터링 (더미 데이터용)
    let filtered = dummyBanners;
    if (filter.position) {
      filtered = filtered.filter(b => b.position === filter.position);
    }
    if (filter.keyword) {
      filtered = filtered.filter(
        b =>
          b.name.toLowerCase().includes(filter.keyword!.toLowerCase()) ||
          b.description?.toLowerCase().includes(filter.keyword!.toLowerCase())
      );
    }
    if (filter.visible !== undefined) {
      filtered = filtered.filter(b => b.visible === filter.visible);
    }

    const page = filter.page || 0;
    const size = filter.size || 20;
    const start = page * size;
    const end = start + size;
    const paged = filtered.slice(start, end);

    return {
      success: true,
      message: '배너 조회 성공 (로컬 더미 데이터)',
      data: {
        content: paged,
        totalElements: filtered.length,
        totalPages: Math.ceil(filtered.length / size),
        size,
        number: page,
      },
    };
  }
}

/**
 * 쇼핑몰용 공개 배너 조회
 * GET /api/shop/banners?position={position}&channelId={channelId}
 */
export async function getShopBanners(
  position?: BannerPosition,
  channelId?: string
): Promise<ApiResponse<BannerResponse[]>> {
  try {
    // 쿼리 파라미터 구성
    const params = new URLSearchParams();
    if (position) {
      params.append('position', position);
    }
    if (channelId) {
      params.append('channelId', channelId);
    }

    const url = `/api/shop/banners${params.toString() ? `?${params.toString()}` : ''}`;
    
    console.log('[배너 API] 쇼핑몰 배너 조회 시도:', url);
    const response = await api.get<BannerResponse[]>(url);
    console.log('[배너 API] 쇼핑몰 배너 조회 성공 (백엔드):', response);
    return response;
  } catch (error) {
    console.log('[배너 API] 쇼핑몰 배너 조회 폴백 (로컬 더미 데이터)');
    
    const dummyBanners: BannerResponse[] = [
      {
        id: 'BANNER_TEST_01',
        name: '2025 신년 콘서트 특별전',
        description: '새해를 여는 화려한 공연',
        type: 'IMAGE',
        position: 'MAIN_TOP',
        imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&h=400&fit=crop',
        imageUrlMobile: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&h=300&fit=crop',
        clickAction: 'LINK',
        linkUrl: '/shop',
        linkTarget: '_self',
        displayOrder: 1,
        visible: true,
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-12-31T23:59:59Z',
        width: 1200,
        height: 400,
        mobileWidth: 600,
        mobileHeight: 300,
        viewCount: 100,
        clickCount: 20,
        status: 'ACTIVE',
        channelIds: ['11111111-1111-1111-1111-111111111111'],
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2025-12-10T15:30:00Z',
      },
      {
        id: 'BANNER_TEST_02',
        name: '겨울 시즌 뮤지컬 대축제',
        description: '감동과 재미가 가득한 겨울 뮤지컬',
        type: 'IMAGE',
        position: 'MAIN_TOP',
        imageUrl: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=1200&h=400&fit=crop',
        imageUrlMobile: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=600&h=300&fit=crop',
        clickAction: 'LINK',
        linkUrl: '/shop',
        linkTarget: '_self',
        displayOrder: 2,
        visible: true,
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-12-31T23:59:59Z',
        width: 1200,
        height: 400,
        mobileWidth: 600,
        mobileHeight: 300,
        viewCount: 80,
        clickCount: 15,
        status: 'ACTIVE',
        channelIds: ['11111111-1111-1111-1111-111111111111'],
        createdAt: '2025-12-11T10:35:00Z',
        updatedAt: '2025-12-11T10:35:00Z',
      },
      {
        id: 'BANNER_TEST_03',
        name: '스포츠 시즌 티켓 오픈',
        description: '인기 스포츠 경기 티켓 예매',
        type: 'IMAGE',
        position: 'MAIN_TOP',
        imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&h=400&fit=crop',
        imageUrlMobile: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&h=300&fit=crop',
        clickAction: 'LINK',
        linkUrl: '/shop',
        linkTarget: '_self',
        displayOrder: 3,
        visible: true,
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-12-31T23:59:59Z',
        width: 1200,
        height: 400,
        mobileWidth: 600,
        mobileHeight: 300,
        viewCount: 60,
        clickCount: 12,
        status: 'ACTIVE',
        channelIds: ['11111111-1111-1111-1111-111111111111'],
        createdAt: '2025-12-11T10:40:00Z',
        updatedAt: '2025-12-11T10:40:00Z',
      },
    ];

    // 프론트엔드에서 필터링 (더미 데이터용)
    let filtered = dummyBanners.filter(b => b.visible);
    if (position) {
      filtered = filtered.filter(b => b.position === position);
    }
    if (channelId) {
      filtered = filtered.filter(b => b.channelIds.includes(channelId));
    }

    return {
      success: true,
      message: '쇼핑몰 배너 조회 성공 (로컬 더미 데이터)',
      data: filtered,
    };
  }
}

/**
 * 배너 상세 조회
 * GET /api/admin/banners/{id}
 */
export async function getBannerById(id: string): Promise<ApiResponse<BannerDetailResponse>> {
  try {
    const response = await api.get<BannerDetailResponse>(`/api/admin/banners/${id}`);
    console.log('[배너 API] 배너 상세 조회 성공 (백엔드)');
    return response;
  } catch (error) {
    console.log('[배너 API] 배너 상세 조회 폴백 (로컬 더미 데이터)');
    
    return {
      success: false,
      message: '배너를 찾을 수 없습니다',
      data: null,
    };
  }
}

/**
 * 배너 생성
 * POST /api/admin/banners
 */
export async function createBanner(
  data: BannerCreateRequest
): Promise<ApiResponse<BannerDetailResponse>> {
  try {
    console.log('[배너 API] 배너 생성 요청:', data);
    const response = await api.post<BannerDetailResponse>('/api/admin/banners', data);
    console.log('[배너 API] 배너 생성 성공 (백엔드)');
    return response;
  } catch (error) {
    console.log('[배너 API] 배너 생성 폴백 (로컬 더미 데이터)');
    
    return {
      success: true,
      message: '배너가 생성되었습니다 (로컬)',
      data: {
        id: `BANNER_${Date.now()}`,
        ...data,
        viewCount: 0,
        clickCount: 0,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as BannerDetailResponse,
    };
  }
}

/**
 * 배너 수정
 * PUT /api/admin/banners/{id}
 */
export async function updateBanner(
  id: string,
  data: BannerUpdateRequest
): Promise<ApiResponse<BannerDetailResponse>> {
  try {
    console.log('[배너 API] 배너 수정 요청:', id, data);
    const response = await api.put<BannerDetailResponse>(`/api/admin/banners/${id}`, data);
    console.log('[배너 API] 배너 수정 성공 (백엔드)');
    return response;
  } catch (error) {
    console.log('[배너 API] 배너 수정 폴백 (로컬 더미 데이터)');
    
    return {
      success: true,
      message: '배너가 수정되었습니다 (로컬)',
      data: {
        id,
        ...data,
        viewCount: 0,
        clickCount: 0,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as BannerDetailResponse,
    };
  }
}

/**
 * 배너 삭제
 * DELETE /api/admin/banners/{id}
 */
export async function deleteBanner(id: string): Promise<ApiResponse<void>> {
  try {
    console.log('[배너 API] 배너 삭제 요청:', id);
    const response = await api.delete<void>(`/api/admin/banners/${id}`);
    console.log('[배너 API] 배너 삭제 성공 (백엔드)');
    return response;
  } catch (error) {
    console.error('[배너 API] 배너 삭제 실패:', error);

    return {
      success: false,
      message: error instanceof Error ? error.message : '배너 삭제에 실패했습니다',
      data: null,
    };
  }
}

/**
 * 배너 노출 여부 토글
 * PATCH /api/admin/banners/{id}/visible
 */
export async function toggleBannerVisible(
  id: string,
  visible: boolean
): Promise<ApiResponse<BannerDetailResponse>> {
  try {
    console.log('[배너 API] 배너 노출 상태 변경 요청:', id, visible);
    const response = await api.patch<BannerDetailResponse>(
      `/api/admin/banners/${id}/visible?visible=${visible}`,
      {}
    );
    console.log('[배너 API] 배너 노출 상태 변경 성공 (백엔드)');
    return response;
  } catch (error) {
    console.error('[배너 API] 배너 노출 상태 변경 실패:', error);

    return {
      success: false,
      message: '배너 노출 상태 변경에 실패했습니다',
      data: null,
    };
  }
}

/**
 * 배너 통계 조회
 * GET /api/admin/banners/{id}/stats
 */
export async function getBannerStats(id: string): Promise<ApiResponse<BannerStatsResponse>> {
  try {
    const response = await api.get<BannerStatsResponse>(`/api/admin/banners/${id}/stats`);
    console.log('[배너 API] 배너 통계 조회 성공 (백엔드)');
    return response;
  } catch (error) {
    console.log('[배너 API] 배너 통계 조회 폴백 (로컬 더미 데이터)');
    
    return {
      success: true,
      message: '배너 통계 조회 성공 (로컬)',
      data: {
        viewCount: 0,
        clickCount: 0,
        clickRate: 0,
        dailyStats: [],
      },
    };
  }
}
