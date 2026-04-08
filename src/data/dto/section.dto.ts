/**
 * 쇼핑몰 섹션 DTO
 * API 엔드포인트: /api/product/admin/section
 */

/**
 * 섹션 엔티티
 */
export interface Section {
  id: string;
  code: string; // (: NEW, BEST, SALE)
  name: string; // (: , , )
  displayOrder: number; // 
  description: string; // 
  active: boolean; // 
  system: boolean; // (/ )
}

/**
 * 섹션 생성 DTO
 */
export interface CreateSectionDto {
  code: string;
  name: string;
  displayOrder: number;
  description: string;
  active: boolean;
}

/**
 * 섹션 수정 DTO
 */
export interface UpdateSectionDto {
  code?: string;
  name?: string;
  displayOrder?: number;
  description?: string;
  active?: boolean;
}
