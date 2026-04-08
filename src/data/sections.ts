import type { Section, CreateSectionDto, UpdateSectionDto } from "./dto/section.dto";
import type { ApiResponse } from "./dto/common.dto";

const STORAGE_KEY = 'erp_sections';

/**
 * 시스템 기본 섹션들
 */
const defaultSections: Section[] = [
  {
    id: 'section_new',
    code: 'NEW',
    name: '신상품',
    displayOrder: 1,
    description: '최근 등록된 신상품을 표시합니다',
    active: true,
    system: true,
  },
  {
    id: 'section_best',
    code: 'BEST',
    name: '베스트',
    displayOrder: 2,
    description: '인기 베스트 상품을 표시합니다',
    active: true,
    system: true,
  },
  {
    id: 'section_sale',
    code: 'SALE',
    name: '특가',
    displayOrder: 3,
    description: '특별 할인 상품을 표시합니다',
    active: true,
    system: true,
  },
  {
    id: 'section_recommend',
    code: 'RECOMMEND',
    name: '추천',
    displayOrder: 4,
    description: '추천 상품을 표시합니다',
    active: true,
    system: false,
  },
];

/**
 * API 응답 생성 헬퍼
 */
function createApiResponse<T>(
  data: T,
  message: string = "성공적으로 처리되었습니다.",
  success: boolean = true
): ApiResponse<T> {
  return {
    success,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 로컬스토리지에서 섹션 데이터 로드
 */
function loadSections(): Section[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    // 
    saveSections(defaultSections);
    return defaultSections;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return defaultSections;
  }
}

/**
 * 로컬스토리지에 섹션 데이터 저장
 */
function saveSections(sections: Section[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
  // 
  window.dispatchEvent(new Event('sectionUpdated'));
}

/**
 * 섹션 목록 조회 (전체 리스트)
 * GET /api/product/admin/section/list
 */
export function getSections(): ApiResponse<Section[]> {
  const sections = loadSections().sort((a, b) => a.displayOrder - b.displayOrder);
  return createApiResponse(sections, "섹션 목록을 성공적으로 조회했습니다.");
}

/**
 * 활성화된 섹션만 조회
 * GET /api/product/admin/section/list/active
 */
export function getActiveSections(): ApiResponse<Section[]> {
  const sections = loadSections()
    .filter(s => s.active)
    .sort((a, b) => a.displayOrder - b.displayOrder);
  return createApiResponse(sections, "활성화된 섹션 목록을 성공적으로 조회했습니다.");
}

/**
 * 섹션 상세 조회
 * GET /api/product/admin/section/{id}
 */
export function getSectionById(id: string): ApiResponse<Section | null> {
  const sections = loadSections();
  const section = sections.find(s => s.id === id);
  
  if (!section) {
    return createApiResponse(null, "섹션을 찾을 수 없습니다.", false);
  }
  
  return createApiResponse(section, "섹션을 성공적으로 조회했습니다.");
}

/**
 * 섹션 코드로 조회
 */
export function getSectionByCode(code: string): ApiResponse<Section | null> {
  const sections = loadSections();
  const section = sections.find(s => s.code === code);
  
  if (!section) {
    return createApiResponse(null, "섹션을 찾을 수 없습니다.", false);
  }
  
  return createApiResponse(section, "섹션을 성공적으로 조회했습니다.");
}

/**
 * 섹션 생성
 * POST /api/product/admin/section
 */
export function createSection(dto: CreateSectionDto): ApiResponse<Section> {
  const sections = loadSections();
  
  // 
  if (sections.some(s => s.code === dto.code)) {
    return createApiResponse(null as any, "이미 존재하는 섹션 코드입니다.", false);
  }
  
  const newSection: Section = {
    id: `section_${Date.now()}`,
    code: dto.code,
    name: dto.name,
    displayOrder: dto.displayOrder,
    description: dto.description,
    active: dto.active,
    system: false, // system: false
  };
  
  sections.push(newSection);
  saveSections(sections);
  
  return createApiResponse(newSection, "섹션이 성공적으로 생성되었습니다.");
}

/**
 * 섹션 수정
 * PATCH /api/product/admin/section/{id}
 */
export function updateSection(id: string, dto: UpdateSectionDto): ApiResponse<Section> {
  const sections = loadSections();
  const index = sections.findIndex(s => s.id === id);
  
  if (index === -1) {
    return createApiResponse(null as any, "섹션을 찾을 수 없습니다.", false);
  }
  
  const section = sections[index];
  
  // system 
  sections[index] = {
    ...section,
    code: dto.code ?? section.code,
    name: dto.name ?? section.name,
    displayOrder: dto.displayOrder ?? section.displayOrder,
    description: dto.description ?? section.description,
    active: dto.active ?? section.active,
  };
  
  saveSections(sections);
  
  return createApiResponse(sections[index], "섹션이 성공적으로 수정되었습니다.");
}

/**
 * 섹션 삭제
 * DELETE /api/product/admin/section/{id}
 */
export function deleteSection(id: string): ApiResponse<void> {
  const sections = loadSections();
  const section = sections.find(s => s.id === id);
  
  if (!section) {
    return createApiResponse(undefined as any, "섹션을 찾을 수 없습니다.", false);
  }
  
  if (section.system) {
    return createApiResponse(undefined as any, "시스템 기본 섹션은 삭제할 수 없습니다.", false);
  }
  
  const filtered = sections.filter(s => s.id !== id);
  saveSections(filtered);
  
  return createApiResponse(undefined as any, "섹션이 성공적으로 삭제되었습니다.");
}

/**
 * 섹션 순서 변경
 */
export function reorderSections(sectionIds: string[]): ApiResponse<Section[]> {
  const sections = loadSections();
  
  // ID displayOrder 
  sectionIds.forEach((id, index) => {
    const section = sections.find(s => s.id === id);
    if (section) {
      section.displayOrder = index + 1;
    }
  });
  
  saveSections(sections);
  
  return createApiResponse(sections.sort((a, b) => a.displayOrder - b.displayOrder), "섹션 순서가 성공적으로 변경되었습니다.");
}
