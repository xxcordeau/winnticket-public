/**
 * 이미지 URL 유틸리티
 * API에서 받은 상대 경로를 절대 URL로 변환
 */

/**
 * 이미지 Base URL 가져오기
 * @returns 이미지 서버의 Base URL
 */
export function getImageBaseUrl(): string {
  // 1: 
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // 2: 
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // (winnticket.co.kr)
    if (hostname === 'www.winnticket.co.kr' || hostname === 'winnticket.co.kr') {
      return 'https://www.winnticket.co.kr';
    }
    
    // - Vite 
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return '';
    }

    // (winnticket.store)
    return 'https://www.winnticket.store';
  }
  
  // 3: 
  if (typeof import.meta !== 'undefined') {
    if (import.meta.env?.MODE === 'production') {
      return 'https://www.winnticket.co.kr';
    } else {
      return 'https://www.winnticket.store';
    }
  }
  
  // 4. ()
  return 'https://www.winnticket.store';
}

/**
 * URL의 경로 부분만 인코딩 (도메인과 프로토콜은 유지)
 * @param url - 인코딩할 URL
 * @returns 인코딩된 URL
 */
function encodeImageUrl(url: string): string {
  try {
    // URL 
    const urlObj = new URL(url);
    
    // 
    const pathSegments = urlObj.pathname.split('/');
    const encodedPath = pathSegments
      .map((segment) => {
        if (!segment) return segment; // 
        try {
          // 
          const decoded = decodeURIComponent(segment);
          return encodeURIComponent(decoded);
        } catch {
          // 
          return encodeURIComponent(segment);
        }
      })
      .join('/');
    
    // 
    return `${urlObj.protocol}//${urlObj.host}${encodedPath}${urlObj.search}${urlObj.hash}`;
  } catch (e) {
    // URL 
    return url;
  }
}

/**
 * 이미지 경로를 완전한 URL로 변환
 * @param path - API에서 받은 이미지 경로 (예: "/uploads/abc.jpg" 또는 "https://example.com/image.jpg")
 * @returns 완전한 이미지 URL
 */
export function getImageUrl(path: string | null | undefined): string {
  // : 
  if (typeof path !== 'string') {
    return '';
  }
  
  // null, undefined, 
  if (!path || path.trim() === '') {
    return '';
  }

  // base64 URL 
  if (path.startsWith('data:')) {
    return path;
  }

  // api.winnticket.co.kr (API IP) 
  if (path.includes('api.winnticket.co.kr')) {
    const baseUrl = getImageBaseUrl();
    const uploadPrefix = baseUrl === '' ? '/uploads' : `${baseUrl}/api/uploads`;
    const convertedUrl = path.replace(/https?:\/\/13\.209\.91\.167\/uploads/, uploadPrefix);
    return encodeImageUrl(convertedUrl);
  }

  // api.winnticket.co.kr 또는 api.winnticket.store → 현재 환경 URL로 변환
  // www. 또는 도메인 직접 접근은 변환하지 않음
  if (path.includes('api.winnticket.co.kr/uploads') || path.includes('api.winnticket.store/uploads')) {
    const baseUrl = getImageBaseUrl();
    const uploadPrefix = baseUrl === '' ? '/uploads' : `${baseUrl}/api/uploads`;
    const convertedUrl = path
      .replace(/https?:\/\/api\.winnticket\.co\.kr\/uploads/, uploadPrefix)
      .replace(/https?:\/\/api\.winnticket\.store\/uploads/, uploadPrefix);
    return encodeImageUrl(convertedUrl);
  }

  // URL 
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return encodeImageUrl(path);
  }

  // Base URL 
  const baseUrl = getImageBaseUrl();
  
  // /uploads : /api/uploads, /uploads (Vite )
  let normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (normalizedPath.startsWith('/uploads') && baseUrl !== '') {
    normalizedPath = `/api${normalizedPath}`;
  }
  
  const result = `${baseUrl}${normalizedPath}`;
  return encodeImageUrl(result);
}

/**
 * 배열의 모든 이미지 경로를 변환
 * @param paths - 이미지 경로 배열
 * @returns 변환된 이미지 URL 배열
 */
export function getImageUrls(paths: (string | null | undefined)[]): string[] {
  return paths
    .filter((path): path is string => typeof path === 'string' && path.length > 0)
    .map(getImageUrl);
}