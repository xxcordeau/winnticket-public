/**
 * 상품 시즌/일정 타입 정의
 */

export interface Season {
  id: string;
  name: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  basePrice: number;
  discountPrice?: number;
  optionSetIds: string[]; // ID 
  optionPriceAdjustments?: Record<string, number>; // (+ -)
  priority: number; // (1 )
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SeasonFormData {
  name: string;
  startDate: string;
  endDate: string;
  basePrice: string;
  discountPrice: string;
  optionSetIds: string[];
  optionPriceAdjustments: Record<string, string>;
  priority: string;
  enabled: boolean;
}
