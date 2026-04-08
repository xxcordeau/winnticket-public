/**
 * File API Service
 * 공통 파일 업로드/삭제 API
 */

import { api } from '../api';
import type { ApiResponse } from '../api';

/**
 * 파일 업로드 응답 DTO
 */
export interface FileUploadResponse {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}

/**
 * 파일 삭제 요청 DTO
 */
export interface FileDeleteRequest {
  fileUrl: string;
}

/**
 * 1️⃣ 파일 업로드
 * POST /api/admin/common/files/upload
 * ⭐ 서버 스펙: 필드명 'files' (복수형), 응답 data는 문자열 배열
 */
export async function uploadFile(
  file: File
): Promise<ApiResponse<FileUploadResponse>> {
  try {
    
    // API upload - 'files' ()
    const response = await api.upload<string[]>(
      '/api/admin/common/files/upload',
      file,
      'files' // 'files' () 
    );


    if (response.success && response.data) {
      // 
      if (Array.isArray(response.data) && response.data.length > 0) {
        const fileUrl = response.data[0];
        
        if (!fileUrl) {
          return {
            success: false,
            message: '파일 URL을 받지 못했습니다.',
            code: 'EMPTY_URL',
            data: null,
          };
        }
        
        return {
          success: true,
          message: response.message || '파일 업로드 성공',
          data: {
            fileUrl: fileUrl,
            fileName: file.name,
            fileSize: file.size,
            contentType: file.type,
          },
          code: response.code,
        };
      }
      
      // 
      if (typeof response.data === 'string') {
        const fileUrl = response.data;
        
        if (!fileUrl) {
          return {
            success: false,
            message: '파일 URL을 받지 못했습니다.',
            code: 'EMPTY_URL',
            data: null,
          };
        }
        
        return {
          success: true,
          message: response.message || '파일 업로드 성공',
          data: {
            fileUrl: fileUrl,
            fileName: file.name,
            fileSize: file.size,
            contentType: file.type,
          },
          code: response.code,
        };
      }
      
      // 
      return {
        success: false,
        message: '파일 업로드 응답 형식이 올바르지 않습니다.',
        code: 'INVALID_RESPONSE',
        data: null,
      };
    } else {
      return {
        success: false,
        message: response.message || '파일 업로드 실패',
        code: response.code,
        data: null,
      };
    }
  } catch (error) {
    
    // Base64 fallback
    
    try {
      // Base64 
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      
      
      return {
        success: true,
        message: '이미지가 로컬에 저장되었습니다.',
        data: {
          fileUrl: base64, // Base64 URL 
          fileName: file.name,
          fileSize: file.size,
          contentType: file.type,
        },
        code: 'LOCAL_STORAGE',
      };
    } catch (base64Error) {
      
      return {
        success: false,
        message: '이미지 처리 중 오류가 발생했습니다.',
        code: 'LOCAL_ERROR',
        data: null,
      };
    }
  }
}

/**
 * 2️⃣ 파일 삭제
 * DELETE /api/admin/common/files/delete
 */
export async function deleteFile(
  fileUrl: string
): Promise<ApiResponse<void>> {
  try {
    
    const response = await api.delete('/api/admin/common/files/delete', {
      fileUrl,
    });

    if (response.success) {
    }

    return response;
  } catch (error) {
    return {
      success: false,
      message: '파일 삭제 중 오류가 발생했습니다.',
      code: 'NETWORK_ERROR',
      data: null,
    };
  }
}

/**
 * 3️⃣ 여러 파일 업로드 (병렬 처리)
 * POST /api/admin/common/files/upload (여러 번 호출)
 * ⭐ 반환: URL 문자열 배열 (상품 관리에서 사용)
 */
export async function uploadFiles(
  files: File[]
): Promise<ApiResponse<string[]>> {
  try {
    
    // 
    const uploadPromises = files.map(file => uploadFile(file));
    const results = await Promise.all(uploadPromises);
    
    // 
    const failedUploads = results.filter(r => !r.success);
    if (failedUploads.length > 0) {
      return {
        success: false,
        message: `${failedUploads.length}개 파일 업로드에 실패했습니다.`,
        code: 'PARTIAL_FAILURE',
        data: null,
      };
    }
    
    // - URL 
    const uploadedUrls = results.map(r => r.data!.fileUrl);
    
    return {
      success: true,
      message: `${uploadedUrls.length}개 파일이 업로드되었습니다.`,
      code: 'SUCCESS',
      data: uploadedUrls, // URL 
    };
  } catch (error) {
    return {
      success: false,
      message: '파일 업로드 중 오류가 발생했습니다.',
      code: 'NETWORK_ERROR',
      data: null,
    };
  }
}