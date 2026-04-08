/**
 * Bank Account API Service
 * 은행계좌 관련 API 호출 함수
 */

import { api } from '../api';
import type { ApiResponse } from '../api';

/**
 * 은행계좌 Response DTO
 */
export interface BankAccountResponse {
  id: number;
  bankName: string; // 
  accountNumber: string; // 
  accountHolder: string; // 
  visible: boolean; // 
  displayOrder: number; // 
  
  // 
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

/**
 * 은행계좌 Request DTO (등록/수정)
 */
export interface BankAccountRequest {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  visible?: boolean;
  displayOrder?: number;
}

// ( API )
let MOCK_BANK_ACCOUNTS: BankAccountResponse[] = [
  {
    id: 1,
    bankName: '국민은행',
    accountNumber: '123-456-789012',
    accountHolder: '(주)티켓박스',
    visible: true,
    displayOrder: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
    createdBy: 'admin',
    updatedBy: 'admin',
  },
  {
    id: 2,
    bankName: '신한은행',
    accountNumber: '110-123-456789',
    accountHolder: '(주)티켓박스',
    visible: true,
    displayOrder: 2,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
    createdBy: 'admin',
    updatedBy: 'admin',
  },
  {
    id: 3,
    bankName: '우리은행',
    accountNumber: '1002-123-456789',
    accountHolder: '(주)티켓박스',
    visible: false,
    displayOrder: 3,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
    createdBy: 'admin',
    updatedBy: 'admin',
  },
];

/**
 * 전체 은행계좌 목록 조회 (관리자용)
 * GET /api/admin/bank-accounts
 */
export async function getAllBankAccounts(): Promise<ApiResponse<BankAccountResponse[]>> {
  try {
    const response = await api.get<BankAccountResponse[]>('/api/admin/bank-accounts');
    return response;
  } catch (error) {
    // API 
    return {
      success: true,
      data: [...MOCK_BANK_ACCOUNTS].sort((a, b) => a.displayOrder - b.displayOrder),
      message: '계좌 목록을 조회했습니다.',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 노출 계좌만 조회 (공개용)
 * GET /api/admin/bank-accounts/visible
 */
export async function getVisibleBankAccounts(): Promise<ApiResponse<BankAccountResponse[]>> {
  try {
    const response = await api.get<BankAccountResponse[]>('/api/admin/bank-accounts/visible');
    return response;
  } catch (error) {
    // API visible=true 
    const visibleAccounts = MOCK_BANK_ACCOUNTS
      .filter(account => account.visible)
      .sort((a, b) => a.displayOrder - b.displayOrder);
    
    return {
      success: true,
      data: visibleAccounts,
      message: '노출 계좌 목록을 조회했습니다.',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 단일 은행계좌 조회
 * GET /api/admin/bank-accounts/:id
 */
export async function getBankAccount(id: number): Promise<ApiResponse<BankAccountResponse>> {
  try {
    const response = await api.get<BankAccountResponse>(`/api/admin/bank-accounts/${id}`);
    return response;
  } catch (error) {
    // API 
    const account = MOCK_BANK_ACCOUNTS.find(acc => acc.id === id);
    if (!account) {
      return {
        success: false,
        data: null,
        message: '계좌 정보를 찾을 수 없습니다.',
        timestamp: new Date().toISOString(),
      };
    }
    return {
      success: true,
      data: account,
      message: '계좌 정보를 조회했습니다.',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 은행계좌 등록
 * POST /api/admin/bank-accounts
 */
export async function createBankAccount(data: BankAccountRequest): Promise<ApiResponse<BankAccountResponse>> {
  try {
    const response = await api.post<BankAccountResponse>('/api/admin/bank-accounts', data);
    return response;
  } catch (error) {
    // API 
    const newId = Math.max(...MOCK_BANK_ACCOUNTS.map(acc => acc.id), 0) + 1;
    const newAccount: BankAccountResponse = {
      id: newId,
      bankName: data.bankName,
      accountNumber: data.accountNumber,
      accountHolder: data.accountHolder,
      visible: data.visible !== undefined ? data.visible : true,
      displayOrder: data.displayOrder !== undefined ? data.displayOrder : MOCK_BANK_ACCOUNTS.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin',
      updatedBy: 'admin',
    };
    MOCK_BANK_ACCOUNTS.push(newAccount);
    
    return {
      success: true,
      data: newAccount,
      message: '계좌가 등록되었습니다.',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 은행계좌 수정
 * PUT /api/admin/bank-accounts/:id
 */
export async function updateBankAccount(id: number, data: BankAccountRequest): Promise<ApiResponse<BankAccountResponse>> {
  try {
    const response = await api.put<BankAccountResponse>(`/api/admin/bank-accounts/${id}`, data);
    return response;
  } catch (error) {
    // API 
    const index = MOCK_BANK_ACCOUNTS.findIndex(acc => acc.id === id);
    if (index === -1) {
      return {
        success: false,
        data: null,
        message: '계좌 정보를 찾을 수 없습니다.',
        timestamp: new Date().toISOString(),
      };
    }
    
    MOCK_BANK_ACCOUNTS[index] = {
      ...MOCK_BANK_ACCOUNTS[index],
      bankName: data.bankName,
      accountNumber: data.accountNumber,
      accountHolder: data.accountHolder,
      visible: data.visible !== undefined ? data.visible : MOCK_BANK_ACCOUNTS[index].visible,
      displayOrder: data.displayOrder !== undefined ? data.displayOrder : MOCK_BANK_ACCOUNTS[index].displayOrder,
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin',
    };
    
    return {
      success: true,
      data: MOCK_BANK_ACCOUNTS[index],
      message: '계좌 정보가 수정되었습니다.',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 은행계좌 삭제
 * DELETE /api/admin/bank-accounts/:id
 */
export async function deleteBankAccount(id: number): Promise<ApiResponse<void>> {
  try {
    const response = await api.delete<void>(`/api/admin/bank-accounts/${id}`);
    return response;
  } catch (error) {
    // API 
    const index = MOCK_BANK_ACCOUNTS.findIndex(acc => acc.id === id);
    if (index === -1) {
      return {
        success: false,
        data: null,
        message: '계좌 정보를 찾을 수 없습니다.',
        timestamp: new Date().toISOString(),
      };
    }
    
    MOCK_BANK_ACCOUNTS.splice(index, 1);
    
    return {
      success: true,
      data: null,
      message: '계좌가 삭제되었습니다.',
      timestamp: new Date().toISOString(),
    };
  }
}
