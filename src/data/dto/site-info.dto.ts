/**
 * 사이트 정보 DTO
 * 단일 레코드로 관리되는 사이트 기본 정보
 */

export interface BankAccount {
  id: string;
  bankName: string; // 
  accountNumber: string; // 
  accountHolder: string; // 
  visible: boolean; // 
}

export interface Terms {
  id: string;
  title: string; // 
  content: string; // (HTML)
  required: boolean; // 
  displayOrder: number; // 
  createdAt: string;
  updatedAt: string;
}

export interface SiteInfo {
  id: string;
  siteName: string; // 
  businessNumber: string; // 
  companyName: string; // ()
  ceoName: string; // 
  ecommerceNumber: string; // 
  privacyOfficer: string; // 
  phone: string; // 
  fax: string; // 
  email: string; // 
  copyright: string; // 
  companyIntro: string; // 
  companyIntroImage?: string; // URL
  bankAccounts: BankAccount[]; // 
  terms: Terms[]; // 
  updatedAt: string;
}