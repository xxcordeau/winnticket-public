import { api, type ApiResponse } from "../api";
import type {
  TicketCoupon,
  TicketCouponGroup,
  CreateCouponGroupRequest,
  UpdateGroupDateRequest,
  UpdateCouponRequest,
} from "../../data/dto/ticket-coupon.dto";

/**
 * 로컬 스토리지 키
 */
const STORAGE_KEY = "ticketCouponGroups";

/**
 * 로컬 데이터 로드
 */
function loadLocalGroups(): TicketCouponGroup[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("로컬 데이터 로드 실패:", error);
    return [];
  }
}

/**
 * 로컬 데이터 저장
 */
function saveLocalGroups(groups: TicketCouponGroup[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
  } catch (error) {
    console.error("로컬 데이터 저장 실패:", error);
  }
}

/**
 * UUID 생성
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 🎫 쿠폰 그룹 관리 API
 */

/**
 * 쿠폰 생성 (선사입)
 */
export async function createCouponGroup(
  request: CreateCouponGroupRequest,
): Promise<ApiResponse<TicketCouponGroup>> {
  try {
    return await api.post("/api/admin/ticketCoupon/groups/coupons", request);
  } catch (error) {
    console.error("[API] 쿠폰 그룹 생성 API 실패:", error);
    const errMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      data: null as any,
      message: errMsg,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 그룹 목록 조회
 */
export async function getCouponGroups(
  productId?: string,
): Promise<ApiResponse<TicketCouponGroup[]>> {
  try {
    const url = productId
      ? `/api/admin/ticketCoupon/products/${productId}/groups`
      : "/api/admin/ticketCoupon/groups";
    const response = await api.get<TicketCouponGroup[]>(url);
    return response;
  } catch (error) {
    console.log("[API] 쿠폰 그룹 목록 조회 API 실패, 로컬 데이터로 폴백");
    
    // 로컬 데이터로 폴백
    let groups = loadLocalGroups();
    
    // productId 필터링
    if (productId) {
      groups = groups.filter((g) => g.productId === productId);
    }
    
    return {
      success: true,
      data: groups,
      message: "OK (로컬 데이터)",
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 그룹 단건 조회
 */
export async function getCouponGroup(
  groupId: string,
): Promise<ApiResponse<TicketCouponGroup>> {
  try {
    return await api.get(`/api/admin/ticketCoupon/groups/${groupId}`);
  } catch (error) {
    console.log("[API] 쿠폰 그룹 조회 API 실패, 로컬 데이터로 폴백");
    
    // 로컬 데이터로 폴백
    const groups = loadLocalGroups();
    const group = groups.find((g) => g.id === groupId);
    
    if (group) {
      return {
        success: true,
        data: group,
        message: "OK (로컬 데이터)",
        timestamp: new Date().toISOString(),
      };
    }
    
    return {
      success: false,
      data: null as any,
      message: "그룹을 찾을 수 없습니다",
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 그룹 유효기간 일괄 변경
 * 서버 응답: {} (빈 객체)
 */
export async function updateGroupDate(
  request: UpdateGroupDateRequest,
): Promise<ApiResponse<{}>> {
  try {
    const { groupId, validFrom, validUntil } = request;
    return await api.put("/api/admin/ticketCoupon/group/date", null, { groupId, validFrom, validUntil });
  } catch (error) {
    console.log("[API] 그룹 유효기간 수정 API 실패, 로컬 데이터로 폴백");
    
    // 로컬 데이터로 폴백
    const groups = loadLocalGroups();
    const groupIndex = groups.findIndex((g) => g.id === request.groupId);
    
    if (groupIndex !== -1) {
      groups[groupIndex].validFrom = request.validFrom;
      groups[groupIndex].validUntil = request.validUntil;
      
      // 모든 쿠폰의 유효기간도 변경
      groups[groupIndex].coupons.forEach((coupon) => {
        coupon.validFrom = request.validFrom;
        coupon.validUntil = request.validUntil;
      });
      
      saveLocalGroups(groups);
      
      return {
        success: true,
        data: {},
        message: "OK (로컬 데이터)",
        timestamp: new Date().toISOString(),
      };
    }
    
    return {
      success: false,
      data: null as any,
      message: "그룹을 찾을 수 없습니다",
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 그룹 정보 수정
 * 서버 응답: {} (빈 객체)
 */
export async function updateCouponGroup(
  groupId: string,
  validFrom: string,
  validUntil: string,
): Promise<ApiResponse<{}>> {
  try {
    return await api.patch(`/api/admin/ticketCoupon/groups/${groupId}`, null, { validFrom, validUntil });
  } catch (error) {
    console.log("[API] 그룹 정보 수정 API 실패, 로컬 데이터로 폴백");
    
    // updateGroupDate와 동일한 로직
    return updateGroupDate({ groupId, validFrom, validUntil });
  }
}

/**
 * 그룹 삭제
 */
export async function deleteCouponGroup(
  groupId: string,
): Promise<ApiResponse<void>> {
  try {
    return await api.delete(`/api/admin/ticketCoupon/groups/${groupId}`);
  } catch (error) {
    console.log("[API] 그룹 삭제 API 실패, 로컬 데이터로 폴백");
    
    // 로컬 데이터로 폴백
    const groups = loadLocalGroups();
    const filteredGroups = groups.filter((g) => g.id !== groupId);
    saveLocalGroups(filteredGroups);
    
    return {
      success: true,
      data: undefined,
      message: "OK (로컬 데이터)",
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 🎟️ 개별 쿠폰 관리 API
 */

/**
 * 그룹별 쿠폰 목록 조회
 */
export async function getGroupCoupons(
  groupId: string,
): Promise<ApiResponse<TicketCoupon[]>> {
  try {
    return await api.get(`/api/admin/ticketCoupon/groups/${groupId}/coupons`);
  } catch (error) {
    console.log("[API] 쿠폰 목록 조회 API 실패, 로컬 데이터로 폴백");
    
    // 로컬 데이터로 폴백
    const groups = loadLocalGroups();
    const group = groups.find((g) => g.id === groupId);
    
    if (group) {
      return {
        success: true,
        data: group.coupons,
        message: "OK (로컬 데이터)",
        timestamp: new Date().toISOString(),
      };
    }
    
    return {
      success: true,
      data: [],
      message: "OK (빈 데이터)",
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 쿠폰 단건 조회
 */
export async function getCoupon(
  couponId: string,
): Promise<ApiResponse<TicketCoupon>> {
  try {
    return await api.get(`/api/admin/ticketCoupon/coupons/${couponId}`);
  } catch (error) {
    console.log("[API] 쿠폰 조회 API 실패, 로컬 데이터로 폴백");
    
    // 로컬 데이터로 폴백
    const groups = loadLocalGroups();
    for (const group of groups) {
      const coupon = group.coupons.find((c) => c.id === couponId);
      if (coupon) {
        return {
          success: true,
          data: coupon,
          message: "OK (로컬 데이터)",
          timestamp: new Date().toISOString(),
        };
      }
    }
    
    return {
      success: false,
      data: null as any,
      message: "쿠폰을 찾을 수 없습니다",
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 쿠폰 발급 (판매)
 * 서버 응답: "S202600000001" (쿠폰 번호 문자열)
 */
export async function issueCoupon(
  orderItemId: string,
): Promise<ApiResponse<string>> {
  try {
    return await api.post(`/api/admin/ticketCoupon/issue/${orderItemId}`);
  } catch (error) {
    console.log("[API] 쿠폰 발급 API 실패, 로컬 데이터로 폴백");
    
    return {
      success: false,
      data: null as any,
      message: "쿠폰 발급 기능은 서버 연동이 필요합니다",
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 쿠폰 사용 취소/복구
 * 서버 응답: {} (빈 객체)
 */
export async function cancelCouponUsage(
  couponId: string,
): Promise<ApiResponse<{}>> {
  try {
    return await api.post(`/api/admin/ticketCoupon/usedCancel/${couponId}`);
  } catch (error) {
    console.log("[API] 쿠폰 사용 취소 API 실패, 로컬 데이터로 폴백");
    
    // 로컬 데이터로 폴백
    const groups = loadLocalGroups();
    let updatedCoupon: TicketCoupon | null = null;
    
    for (const group of groups) {
      const couponIndex = group.coupons.findIndex((c) => c.id === couponId);
      if (couponIndex !== -1) {
        group.coupons[couponIndex].status = "ACTIVE";
        group.coupons[couponIndex].usedAt = undefined;
        updatedCoupon = group.coupons[couponIndex];
        
        // 카운트 업데이트
        group.usedCount = group.coupons.filter((c) => c.status === "USED").length;
        group.activeCount = group.coupons.filter((c) => c.status === "ACTIVE").length;
        
        saveLocalGroups(groups);
        break;
      }
    }
    
    if (updatedCoupon) {
      return {
        success: true,
        data: {},
        message: "OK (로컬 데이터)",
        timestamp: new Date().toISOString(),
      };
    }
    
    return {
      success: false,
      data: null as any,
      message: "쿠폰을 찾을 수 없습니다",
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 쿠폰 정보 수정
 * 서버 응답: {} (빈 객체)
 */
export async function updateCoupon(
  couponId: string,
  request: UpdateCouponRequest,
): Promise<ApiResponse<{}>> {
  try {
    return await api.patch(`/api/admin/ticketCoupon/coupons/${couponId}`, request);
  } catch (error: any) {
    console.error("[API] 쿠폰 수정 실패:", error);

    // API 에러 메시지가 있으면 그대로 반환
    if (error?.message) {
      return {
        success: false,
        data: null as any,
        message: error.message,
        timestamp: new Date().toISOString(),
      };
    }

    // 로컬 데이터로 폴백
    const groups = loadLocalGroups();
    let updatedCoupon: TicketCoupon | null = null;

    for (const group of groups) {
      const couponIndex = group.coupons.findIndex((c) => c.id === couponId);
      if (couponIndex !== -1) {
        const coupon = group.coupons[couponIndex];

        // 요청된 필드만 업데이트
        if (request.couponNumber) coupon.couponNumber = request.couponNumber;
        if (request.status) coupon.status = request.status;
        if (request.usedAt !== undefined) coupon.usedAt = request.usedAt;
        if (request.validFrom) coupon.validFrom = request.validFrom;
        if (request.validUntil) coupon.validUntil = request.validUntil;

        updatedCoupon = coupon;
        
        // 카운트 업데이트
        group.usedCount = group.coupons.filter((c) => c.status === "USED").length;
        group.activeCount = group.coupons.filter((c) => c.status === "ACTIVE").length;
        group.soldCount = group.coupons.filter((c) => c.status === "SOLD").length;
        
        saveLocalGroups(groups);
        break;
      }
    }
    
    if (updatedCoupon) {
      return {
        success: true,
        data: {},
        message: "OK (로컬 데이터)",
        timestamp: new Date().toISOString(),
      };
    }
    
    return {
      success: false,
      data: null as any,
      message: "쿠폰을 찾을 수 없습니다",
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 쿠폰 삭제
 */
export async function deleteCoupon(
  couponId: string,
): Promise<ApiResponse<void>> {
  try {
    return await api.delete(`/api/admin/ticketCoupon/coupons/${couponId}`);
  } catch (error) {
    console.log("[API] 쿠폰 삭제 API 실패, 로컬 데이터로 폴백");
    
    // 로컬 데이터로 폴백
    const groups = loadLocalGroups();
    
    for (const group of groups) {
      const couponIndex = group.coupons.findIndex((c) => c.id === couponId);
      if (couponIndex !== -1) {
        group.coupons.splice(couponIndex, 1);
        
        // 카운트 업데이트
        group.totalCount = group.coupons.length;
        group.usedCount = group.coupons.filter((c) => c.status === "USED").length;
        group.activeCount = group.coupons.filter((c) => c.status === "ACTIVE").length;
        group.soldCount = group.coupons.filter((c) => c.status === "SOLD").length;
        
        saveLocalGroups(groups);
        
        return {
          success: true,
          data: undefined,
          message: "OK (로컬 데이터)",
          timestamp: new Date().toISOString(),
        };
      }
    }
    
    return {
      success: false,
      data: undefined,
      message: "쿠폰을 찾을 수 없습니다",
      timestamp: new Date().toISOString(),
    };
  }
}