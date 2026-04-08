/**
 * 채널 관리 데이터 스토어
 */

import type { Channel, CreateChannelDto, UpdateChannelDto, ChannelPointPolicy, CreateChannelPointPolicyDto, PointEarnType } from "./dto/channel.dto";
import type { ApiResponse, PageResponse } from "./dto/common.dto";

const STORAGE_KEY = "ticket_channels";
const POINT_POLICY_STORAGE_KEY = "ticket_channel_point_policies";

// 
const initialChannels: Channel[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001" as any, // UUID 
    channelCode: "DEFAULT",
    channelName: "기본 채널",
    companyName: "티켓플러스",
    logoUrl: undefined,
    faviconUrl: undefined,
    primaryColor: "#0c8ce9",
    secondaryColor: "#666666",
    description: "기본 쇼핑몰 채널",
    contactEmail: "contact@ticketplus.com",
    contactPhone: "02-1234-5678",
    websiteUrl: "https://ticketplus.com",
    commissionRate: 5.0, // 5%
    active: true,
    excludedProductIds: [],
    createdAt: "2024-01-01T00:00:00Z" as any,
    updatedAt: "2024-01-01T00:00:00Z" as any,
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002" as any, // UUID 
    channelCode: "POLICE",
    channelName: "경찰청 티켓몰",
    companyName: "대한민국 경찰청",
    logoUrl: undefined,
    faviconUrl: undefined,
    primaryColor: "#1e40af",
    secondaryColor: "#3b82f6",
    description: "경찰청 공식 문화행사 티켓 판매 채널",
    contactEmail: "ticket@police.go.kr",
    contactPhone: "182",
    websiteUrl: "https://www.police.go.kr",
    commissionRate: 3.0, // 3%
    active: true,
    excludedProductIds: ["prod-003", "prod-005"], // 
    createdAt: "2024-01-15T00:00:00Z" as any,
    updatedAt: "2024-01-15T00:00:00Z" as any,
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440003" as any, // UUID 
    channelCode: "CULTURE",
    channelName: "컬처라이프",
    companyName: "주식회사 컬처라이프",
    logoUrl: undefined,
    faviconUrl: undefined,
    primaryColor: "#059669",
    secondaryColor: "#10b981",
    description: "문화생활 전문 티켓 판매 플랫폼",
    contactEmail: "help@culturelife.kr",
    contactPhone: "1588-9999",
    websiteUrl: "https://culturelife.kr",
    commissionRate: 7.5, // 7.5%
    active: true,
    excludedProductIds: ["prod-001", "prod-004"], // , 
    createdAt: "2024-02-01T00:00:00Z" as any,
    updatedAt: "2024-02-01T00:00:00Z" as any,
  },
];

// 
function loadChannels(): Channel[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const channels = JSON.parse(stored);
      // ID UUID 
      if (channels.length > 0 && channels[0].id && !channels[0].id.includes('-')) {
        localStorage.removeItem(STORAGE_KEY);
        return initialChannels;
      }
      return channels;
    }
  } catch (error) {
  }
  return initialChannels;
}

// 
function saveChannels(channels: Channel[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(channels));
  } catch (error) {
  }
}

// ID 
function generateId(): string {
  // UUID v4 
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 채널 목록 조회 (페이징)
 */
export function getChannels(
  page: number = 0,
  size: number = 20,
  search?: string,
  active?: boolean
): ApiResponse<PageResponse<Channel>> {
  try {
    let channels = loadChannels();

    // 
    if (search) {
      const searchLower = search.toLowerCase();
      channels = channels.filter(
        (channel) =>
          channel.channelCode.toLowerCase().includes(searchLower) ||
          channel.channelName.toLowerCase().includes(searchLower) ||
          channel.companyName.toLowerCase().includes(searchLower)
      );
    }

    // 
    if (active !== undefined) {
      channels = channels.filter((channel) => channel.active === active);
    }

    // ()
    channels.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 
    const totalElements = channels.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const end = start + size;
    const content = channels.slice(start, end);

    return {
      success: true,
      message: "채널 목록을 성공적으로 조회했습니다.",
      data: {
        content,
        page,
        size,
        totalElements,
        totalPages,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: "채널 목록 조회에 실패했습니다.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * 채널 코드로 채널 ��회
 */
export function getChannelByCode(channelCode: string): ApiResponse<Channel> {
  try {
    const channels = loadChannels();
    const channel = channels.find((c) => c.channelCode === channelCode);

    if (!channel) {
      return {
        success: false,
        message: "채널을 찾을 수 없습니다.",
        error: "Channel not found",
      };
    }

    return {
      success: true,
      message: "채널을 성공적으로 조회했습니다.",
      data: channel,
    };
  } catch (error) {
    return {
      success: false,
      message: "채널 조회에 실패했습니다.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * ID로 채널 조회
 */
export function getChannelById(id: string): ApiResponse<Channel> {
  try {
    const channels = loadChannels();
    const channel = channels.find((c) => c.id === id);

    if (!channel) {
      return {
        success: false,
        message: "채널을 찾을 수 없습니다.",
        error: "Channel not found",
      };
    }

    return {
      success: true,
      message: "채널을 성공적으로 조회했습니다.",
      data: channel,
    };
  } catch (error) {
    return {
      success: false,
      message: "채널 조회에 실패했습니다.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * 채널 생성
 */
export function createChannel(dto: CreateChannelDto): ApiResponse<Channel> {
  try {
    const channels = loadChannels();

    // 
    const exists = channels.some((c) => c.channelCode === dto.channelCode);
    if (exists) {
      return {
        success: false,
        message: "이미 존재하는 채널 코드입니다.",
        error: "Duplicate channel code",
      };
    }

    const now = new Date().toISOString() as any;
    const newChannel: Channel = {
      id: generateId() as any,
      channelCode: dto.channelCode,
      channelName: dto.channelName,
      companyName: dto.companyName,
      logoUrl: dto.logoUrl,
      faviconUrl: dto.faviconUrl,
      primaryColor: dto.primaryColor,
      secondaryColor: dto.secondaryColor,
      description: dto.description,
      contactEmail: dto.contactEmail,
      contactPhone: dto.contactPhone,
      websiteUrl: dto.websiteUrl,
      commissionRate: dto.commissionRate ?? 0.0,
      active: dto.active ?? true,
      excludedProductIds: [],
      createdAt: now,
      updatedAt: now,
    };

    channels.push(newChannel);
    saveChannels(channels);

    return {
      success: true,
      message: "채널이 성공적으로 생성되었습니다.",
      data: newChannel,
    };
  } catch (error) {
    return {
      success: false,
      message: "채널 생성에 실패했습니다.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * 채널 수정
 */
export function updateChannel(dto: UpdateChannelDto): ApiResponse<Channel> {
  try {
    const channels = loadChannels();
    const index = channels.findIndex((c) => c.id === dto.id);

    if (index === -1) {
      return {
        success: false,
        message: "채널을 찾을 수 없습니다.",
        error: "Channel not found",
      };
    }

    // ( )
    if (dto.channelCode) {
      const exists = channels.some(
        (c) => c.channelCode === dto.channelCode && c.id !== dto.id
      );
      if (exists) {
        return {
          success: false,
          message: "이미 존재하는 채��� 코드입니다.",
          error: "Duplicate channel code",
        };
      }
    }

    const updatedChannel: Channel = {
      ...channels[index],
      ...(dto.channelCode && { channelCode: dto.channelCode }),
      ...(dto.channelName && { channelName: dto.channelName }),
      ...(dto.companyName && { companyName: dto.companyName }),
      ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
      ...(dto.faviconUrl !== undefined && { faviconUrl: dto.faviconUrl }),
      ...(dto.primaryColor !== undefined && { primaryColor: dto.primaryColor }),
      ...(dto.secondaryColor !== undefined && { secondaryColor: dto.secondaryColor }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.contactEmail !== undefined && { contactEmail: dto.contactEmail }),
      ...(dto.contactPhone !== undefined && { contactPhone: dto.contactPhone }),
      ...(dto.websiteUrl !== undefined && { websiteUrl: dto.websiteUrl }),
      ...(dto.commissionRate !== undefined && { commissionRate: dto.commissionRate }),
      ...(dto.active !== undefined && { active: dto.active }),
      updatedAt: new Date().toISOString() as any,
    };

    channels[index] = updatedChannel;
    saveChannels(channels);

    return {
      success: true,
      message: "널이 성공적으로 수정되었습니다.",
      data: updatedChannel,
    };
  } catch (error) {
    return {
      success: false,
      message: "채널 수정에 실패했습니다.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * 채널 삭제
 */
export function deleteChannel(id: string): ApiResponse<void> {
  try {
    const channels = loadChannels();
    const index = channels.findIndex((c) => c.id === id);

    if (index === -1) {
      return {
        success: false,
        message: "채널을 찾을 수 없습니다.",
        error: "Channel not found",
      };
    }

    // 
    if (channels[index].channelCode === "DEFAULT") {
      return {
        success: false,
        message: "기본 채널은 삭제할 수 없습니다.",
        error: "Cannot delete default channel",
      };
    }

    channels.splice(index, 1);
    saveChannels(channels);

    return {
      success: true,
      message: "채널이 성공적으로 삭제되었습니다.",
    };
  } catch (error) {
    return {
      success: false,
      message: "채널 삭제에 실패했습니다.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * 현재 채널 정보 가져오기 (URL 파라미터 기반)
 */
export function getCurrentChannel(): Channel {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const channelCode = urlParams.get("channel");

    if (channelCode) {
      const response = getChannelByCode(channelCode);
      if (response.success && response.data) {
        return response.data;
      }
    }

    // 
    const defaultResponse = getChannelByCode("DEFAULT");
    if (defaultResponse.success && defaultResponse.data) {
      return defaultResponse.data;
    }

    // 
    return initialChannels[0];
  } catch (error) {
    return initialChannels[0];
  }
}

/**
 * 채널에서 상품 제외 추가
 */
export function addExcludedProduct(channelId: string, productId: string): ApiResponse<Channel> {
  try {
    const channels = loadChannels();
    const index = channels.findIndex((c) => c.id === channelId);

    if (index === -1) {
      return {
        success: false,
        message: "채널을 찾을 수 없습니다.",
        error: "Channel not found",
      };
    }

    const excludedProductIds = channels[index].excludedProductIds || [];
    
    if (excludedProductIds.includes(productId)) {
      return {
        success: false,
        message: "이미 제외된 상품입니다.",
        error: "Product already excluded",
      };
    }

    channels[index] = {
      ...channels[index],
      excludedProductIds: [...excludedProductIds, productId],
      updatedAt: new Date().toISOString() as any,
    };

    saveChannels(channels);

    return {
      success: true,
      message: "상품이 제외 목록에 추가되었습니다.",
      data: channels[index],
    };
  } catch (error) {
    return {
      success: false,
      message: "상품 제외에 실패했습니다.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * 채널에서 상품 제외 제거
 */
export function removeExcludedProduct(channelId: string, productId: string): ApiResponse<Channel> {
  try {
    const channels = loadChannels();
    const index = channels.findIndex((c) => c.id === channelId);

    if (index === -1) {
      return {
        success: false,
        message: "채널을 찾을 수 없습니다.",
        error: "Channel not found",
      };
    }

    const excludedProductIds = channels[index].excludedProductIds || [];
    
    channels[index] = {
      ...channels[index],
      excludedProductIds: excludedProductIds.filter((id) => id !== productId),
      updatedAt: new Date().toISOString() as any,
    };

    saveChannels(channels);

    return {
      success: true,
      message: "상품이 제외 목록에서 제거되었습니다.",
      data: channels[index],
    };
  } catch (error) {
    return {
      success: false,
      message: "상품 제외 해제에 실패했습니다.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * 채널의 제외 상품 목록 일괄 업데이트
 */
export function updateExcludedProducts(channelId: string, productIds: string[]): ApiResponse<Channel> {
  try {
    const channels = loadChannels();
    const index = channels.findIndex((c) => c.id === channelId);

    if (index === -1) {
      return {
        success: false,
        message: "채널을 찾을 수 없습니다.",
        error: "Channel not found",
      };
    }

    channels[index] = {
      ...channels[index],
      excludedProductIds: productIds,
      updatedAt: new Date().toISOString() as any,
    };

    saveChannels(channels);

    return {
      success: true,
      message: "제외 상품 목록이 업데이트되었습니다.",
      data: channels[index],
    };
  } catch (error) {
    return {
      success: false,
      message: "제외 상품 목록 업데이트에 실패했습니다.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ========================================
// Channel Point Policy Functions
// ========================================

// 
function loadPointPolicies(): ChannelPointPolicy[] {
  try {
    const stored = localStorage.getItem(POINT_POLICY_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
  }
  return [];
}

function savePointPolicies(policies: ChannelPointPolicy[]): void {
  try {
    localStorage.setItem(POINT_POLICY_STORAGE_KEY, JSON.stringify(policies));
  } catch (error) {
  }
}

function generatePointPolicyId(): string {
  const policies = loadPointPolicies();
  const maxId = policies.reduce((max, policy) => {
    const num = parseInt(policy.id.replace("CPP", ""));
    return num > max ? num : max;
  }, 0);
  return `CPP${String(maxId + 1).padStart(3, "0")}`;
}

/**
 * 채널별 포인트 정책 조회
 */
export function getPointPoliciesByChannelId(channelId: string): ApiResponse<ChannelPointPolicy[]> {
  try {
    const policies = loadPointPolicies();
    const channelPolicies = policies.filter((p) => p.channelId === channelId);

    // 
    channelPolicies.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      success: true,
      message: "포인트 정책 목록을 성공적으로 조회했습니다.",
      data: channelPolicies,
    };
  } catch (error) {
    return {
      success: false,
      message: "포인트 정책 목록 조회에 실패했습니다.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * 포인트 정책 생성
 */
export function createPointPolicy(dto: CreateChannelPointPolicyDto): ApiResponse<ChannelPointPolicy> {
  try {
    const policies = loadPointPolicies();
    
    const now = new Date().toISOString() as any;
    const newPolicy: ChannelPointPolicy = {
      id: generatePointPolicyId(),
      channelId: dto.channelId,
      earnType: dto.earnType,
      earnAmount: dto.earnAmount,
      earnRate: dto.earnRate,
      earnCondition: dto.earnCondition,
      createdAt: now,
      updatedAt: now,
    };

    policies.push(newPolicy);
    savePointPolicies(policies);

    return {
      success: true,
      message: "포인트 정책이 성공적으로 생성되었습니다.",
      data: newPolicy,
    };
  } catch (error) {
    return {
      success: false,
      message: "포인트 정책 생성에 실패했습니다.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * 포인트 정책 수정
 */
export function updatePointPolicy(policy: ChannelPointPolicy): ApiResponse<ChannelPointPolicy> {
  try {
    const policies = loadPointPolicies();
    const index = policies.findIndex((p) => p.id === policy.id);

    if (index === -1) {
      return {
        success: false,
        message: "포인트 정책을 찾을 수 없습니다.",
        error: "Point policy not found",
      };
    }

    const updatedPolicy: ChannelPointPolicy = {
      ...policy,
      updatedAt: new Date().toISOString() as any,
    };

    policies[index] = updatedPolicy;
    savePointPolicies(policies);

    return {
      success: true,
      message: "포인트 정책이 성공적으로 수정되었습니다.",
      data: updatedPolicy,
    };
  } catch (error) {
    return {
      success: false,
      message: "포인트 정책 수정에 실패했습니다.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * 포인트 정책 삭제
 */
export function deletePointPolicy(id: string): ApiResponse<void> {
  try {
    const policies = loadPointPolicies();
    const index = policies.findIndex((p) => p.id === id);

    if (index === -1) {
      return {
        success: false,
        message: "포인트 정책을 찾을 수 없습니다.",
        error: "Point policy not found",
      };
    }

    policies.splice(index, 1);
    savePointPolicies(policies);

    return {
      success: true,
      message: "포인트 정책이 성공적으로 삭제되었습니다.",
    };
  } catch (error) {
    return {
      success: false,
      message: "포인트 정책 삭제에 실패했습니다.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}