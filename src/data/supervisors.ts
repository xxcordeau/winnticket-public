import type { Supervisor, CreateSupervisorDto, UpdateSupervisorDto } from "./dto/supervisor.dto";
import type { ApiResponse } from "./dto/types";
import { getPartners } from "./partners";

const STORAGE_KEY = "supervisors";

// 
const defaultSupervisors: Supervisor[] = [
  {
    id: "sup1",
    username: "field",
    password: "demo", //
    name: "김현장",
    email: "field@venue.com",
    phone: "010-1234-5678",
    logoUrl: "",
    partnerId: "PARTNER-CHARLOTTE",
    partnerName: "샤롯데씨어터",
    active: true,
    createdAt: "2024-01-15T09:00:00Z",
    updatedAt: "2024-01-15T09:00:00Z",
  },
  {
    id: "sup2",
    username: "manager",
    password: "demo",
    name: "박관리",
    email: "manager@partner.com",
    phone: "010-9876-5432",
    logoUrl: "",
    partnerId: "PARTNER-HYBE",
    partnerName: "하이브 엔터테인먼트",
    active: true,
    createdAt: "2024-01-20T09:00:00Z",
    updatedAt: "2024-01-20T09:00:00Z",
  },
  {
    id: "sup3",
    username: "olympic",
    password: "demo",
    name: "윤스포츠",
    email: "sports@olympicpark.co.kr",
    phone: "010-1111-2222",
    logoUrl: "",
    partnerId: "PARTNER-OLYMPIC-PARK",
    partnerName: "올림픽공원 체조경기장",
    active: true,
    createdAt: "2024-02-01T09:00:00Z",
    updatedAt: "2024-02-01T09:00:00Z",
  },
  {
    id: "sup4",
    username: "sejong",
    password: "demo",
    name: "임전통",
    email: "culture@sejongpac.or.kr",
    phone: "010-3333-4444",
    logoUrl: "",
    partnerId: "PARTNER-SEJONG",
    partnerName: "세종문화회관",
    active: true,
    createdAt: "2024-02-05T09:00:00Z",
    updatedAt: "2024-02-05T09:00:00Z",
  },
];

// 
function getSupervisorsFromStorage(): Supervisor[] {
  if (typeof window === 'undefined') return defaultSupervisors;
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
    }
  }
  // 
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSupervisors));
  return defaultSupervisors;
}

// 
function saveSupervisorsToStorage(supervisors: Supervisor[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(supervisors));
}

// 
export function getSupervisors(
  page: number = 0,
  size: number = 20
): ApiResponse<{ content: Supervisor[]; totalElements: number; totalPages: number }> {
  const supervisors = getSupervisorsFromStorage();
  
  // 
  const partners = getPartners(0, 1000);
  const partnersMap = new Map(
    partners.data.content.map(p => [p.id, p.name])
  );
  
  const enrichedSupervisors = supervisors.map(sup => ({
    ...sup,
    partnerName: partnersMap.get(sup.partnerId) || "알 수 없음",
  }));

  const start = page * size;
  const end = start + size;
  const paginatedData = enrichedSupervisors.slice(start, end);

  return {
    success: true,
    message: "현장관리자 목록을 조회했습니다.",
    data: {
      content: paginatedData,
      totalElements: enrichedSupervisors.length,
      totalPages: Math.ceil(enrichedSupervisors.length / size),
    },
  };
}

// 
export function getSupervisor(id: string): ApiResponse<Supervisor> {
  const supervisors = getSupervisorsFromStorage();
  const supervisor = supervisors.find((sup) => sup.id === id);

  if (!supervisor) {
    return {
      success: false,
      message: "현장관리자를 찾을 수 없습니다.",
      data: null as any,
    };
  }

  // 
  const partners = getPartners(0, 1000);
  const partner = partners.data.content.find(p => p.id === supervisor.partnerId);
  
  return {
    success: true,
    message: "현장관리자를 조회했습니다.",
    data: {
      ...supervisor,
      partnerName: partner?.name || "알 수 없음",
    },
  };
}

// 
export function getSupervisorsByPartnerId(partnerId: string): ApiResponse<Supervisor[]> {
  const supervisors = getSupervisorsFromStorage();
  const filteredSupervisors = supervisors.filter((sup) => sup.partnerId === partnerId);

  // 
  const partners = getPartners(0, 1000);
  const partner = partners.data.content.find(p => p.id === partnerId);
  
  const enrichedSupervisors = filteredSupervisors.map(sup => ({
    ...sup,
    partnerName: partner?.name || "알 수 없음",
  }));

  return {
    success: true,
    message: "현장관리자 목록을 조회했습니다.",
    data: enrichedSupervisors,
  };
}

// username 
export function getSupervisorByUsername(username: string): ApiResponse<Supervisor> {
  const supervisors = getSupervisorsFromStorage();
  const supervisor = supervisors.find((sup) => sup.username === username);

  if (!supervisor) {
    return {
      success: false,
      message: "현장관리자를 찾을 수 없습니다.",
      data: null as any,
    };
  }

  // 
  const partners = getPartners(0, 1000);
  const partner = partners.data.content.find(p => p.id === supervisor.partnerId);

  return {
    success: true,
    message: "현장관리자를 조회했습니다.",
    data: {
      ...supervisor,
      partnerName: partner?.name || "알 수 없음",
    },
  };
}

// 
export function createSupervisor(dto: CreateSupervisorDto): ApiResponse<Supervisor> {
  const supervisors = getSupervisorsFromStorage();

  // username 
  const existingSupervisor = supervisors.find((sup) => sup.username === dto.username);
  if (existingSupervisor) {
    return {
      success: false,
      message: "이미 존재하는 아이디입니다.",
      data: null as any,
    };
  }

  const newSupervisor: Supervisor = {
    id: `sup${Date.now()}`,
    username: dto.username,
    password: dto.password,
    name: dto.name,
    email: dto.email,
    phone: dto.phone,
    logoUrl: dto.logoUrl || "",
    partnerId: dto.partnerId,
    active: dto.active !== undefined ? dto.active : true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  supervisors.push(newSupervisor);
  saveSupervisorsToStorage(supervisors);

  return {
    success: true,
    message: "현장관리자가 생성되었습니다.",
    data: newSupervisor,
  };
}

// 
export function updateSupervisor(
  id: string,
  dto: Partial<UpdateSupervisorDto>
): ApiResponse<Supervisor> {
  const supervisors = getSupervisorsFromStorage();
  const index = supervisors.findIndex((sup) => sup.id === id);

  if (index === -1) {
    return {
      success: false,
      message: "현장관리자를 찾을 수 없습니다.",
      data: null as any,
    };
  }

  // username ( )
  if (dto.username && dto.username !== supervisors[index].username) {
    const existingSupervisor = supervisors.find(
      (sup) => sup.username === dto.username && sup.id !== id
    );
    if (existingSupervisor) {
      return {
        success: false,
        message: "이미 존재하는 아이디입니다.",
        data: null as any,
      };
    }
  }

  supervisors[index] = {
    ...supervisors[index],
    ...dto,
    updatedAt: new Date().toISOString(),
  };

  saveSupervisorsToStorage(supervisors);

  return {
    success: true,
    message: "현장관리자가 수정되었습니다.",
    data: supervisors[index],
  };
}

// 
export function deleteSupervisor(id: string): ApiResponse<void> {
  const supervisors = getSupervisorsFromStorage();
  const index = supervisors.findIndex((sup) => sup.id === id);

  if (index === -1) {
    return {
      success: false,
      message: "현장관리자를 찾을 수 없습니다.",
      data: null as any,
    };
  }

  supervisors.splice(index, 1);
  saveSupervisorsToStorage(supervisors);

  return {
    success: true,
    message: "현장관리자가 삭제되었습니다.",
    data: undefined as any,
  };
}