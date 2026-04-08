/**
 * 서버 상태 확인
 */
export const checkServerStatus = async (): Promise<ApiResponse<ServerStatus>> => {
  try {
    const response = await api.get<ServerStatus>('/api/common/status');
    return response;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || '서버 상태 확인에 실패했습니다.',
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
};