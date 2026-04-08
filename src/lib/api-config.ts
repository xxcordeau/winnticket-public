/**
 * API Configuration
 * 서버 API 연결 설정
 */

/**
 * API 엔드포인트 맵
 * 서버 API의 엔드포인트 경로를 정의
 */
export const API_ENDPOINTS = {
  // 
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    ME: '/api/auth/me',
  },
  
  // 
  PRODUCTS: {
    LIST: '/api/products',
    DETAIL: (id: string) => `/api/products/${id}`,
    CREATE: '/api/products',
    UPDATE: (id: string) => `/api/products/${id}`,
    DELETE: (id: string) => `/api/products/${id}`,
    UPLOAD_IMAGE: '/api/products/upload-image',
  },
  
  // 
  PRODUCT_OPTIONS: {
    LIST: '/api/product-options',
    DETAIL: (id: string) => `/api/product-options/${id}`,
    CREATE: '/api/product-options',
    UPDATE: (id: string) => `/api/product-options/${id}`,
    DELETE: (id: string) => `/api/product-options/${id}`,
  },
  
  // 
  PARTNER_DISCOUNTS: {
    LIST: '/api/partner-discounts',
    DETAIL: (id: string) => `/api/partner-discounts/${id}`,
    CREATE: '/api/partner-discounts',
    UPDATE: (id: string) => `/api/partner-discounts/${id}`,
    DELETE: (id: string) => `/api/partner-discounts/${id}`,
  },
  
  // 
  ORDERS: {
    LIST: '/api/orders',
    DETAIL: (id: string) => `/api/orders/${id}`,
    CREATE: '/api/orders',
    UPDATE: (id: string) => `/api/orders/${id}`,
    DELETE: (id: string) => `/api/orders/${id}`,
    STATUS_UPDATE: (id: string) => `/api/orders/${id}/status`,
    // API
    SHOP_CREATE: '/api/orders/shop',
    SHOP_DETAIL: (orderNumber: string) => `/api/orders/shop/${orderNumber}`,
  },
  
  // 
  BANNERS: {
    LIST: '/api/banners',
    DETAIL: (id: string) => `/api/banners/${id}`,
    CREATE: '/api/banners',
    UPDATE: (id: string) => `/api/banners/${id}`,
    DELETE: (id: string) => `/api/banners/${id}`,
    UPLOAD_IMAGE: '/api/banners/upload-image',
  },
  
  // 
  POPUPS: {
    LIST: '/api/popups',
    DETAIL: (id: string) => `/api/popups/${id}`,
    CREATE: '/api/popups',
    UPDATE: (id: string) => `/api/popups/${id}`,
    DELETE: (id: string) => `/api/popups/${id}`,
  },
  
  // 
  CHANNELS: {
    LIST: '/api/admin/channels',
    DETAIL: (id: string) => `/api/admin/channels/${id}`,
    CREATE: '/api/admin/channels',
    UPDATE: (id: string) => `/api/admin/channels/${id}`,
    DELETE: (id: string) => `/api/admin/channels/${id}`,
  },
  
  // 
  PARTNERS: {
    LIST: '/api/partners',
    DETAIL: (id: string) => `/api/partners/${id}`,
    CREATE: '/api/partners',
    UPDATE: (id: string) => `/api/partners/${id}`,
    DELETE: (id: string) => `/api/partners/${id}`,
  },
  
  // 
  COUPONS: {
    LIST: '/api/coupons',
    DETAIL: (id: string) => `/api/coupons/${id}`,
    CREATE: '/api/coupons',
    UPDATE: (id: string) => `/api/coupons/${id}`,
    DELETE: (id: string) => `/api/coupons/${id}`,
  },
  
  // 
  COMMUNITY: {
    NOTICES: {
      LIST: '/api/community/notices',
      DETAIL: (id: string) => `/api/community/notices/${id}`,
      CREATE: '/api/community/notices',
      UPDATE: (id: string) => `/api/community/notices/${id}`,
      DELETE: (id: string) => `/api/community/notices/${id}`,
    },
    FAQS: {
      LIST: '/api/community/faqs',
      DETAIL: (id: string) => `/api/community/faqs/${id}`,
      CREATE: '/api/community/faqs',
      UPDATE: (id: string) => `/api/community/faqs/${id}`,
      DELETE: (id: string) => `/api/community/faqs/${id}`,
    },
    INQUIRIES: {
      LIST: '/api/community/inquiries',
      DETAIL: (id: string) => `/api/community/inquiries/${id}`,
      CREATE: '/api/community/inquiries',
      UPDATE: (id: string) => `/api/community/inquiries/${id}`,
      DELETE: (id: string) => `/api/community/inquiries/${id}`,
      ANSWER: (id: string) => `/api/community/inquiries/${id}/answer`,
    },
    EVENTS: {
      LIST: '/api/community/events',
      DETAIL: (id: string) => `/api/community/events/${id}`,
      CREATE: '/api/community/events',
      UPDATE: (id: string) => `/api/community/events/${id}`,
      DELETE: (id: string) => `/api/community/events/${id}`,
    },
    // API
    VIEW_COUNT: (id: string) => `/api/community/common/viewCount/${id}`,
  },
  
  // 
  SITE_INFO: {
    GET: '/api/admin/site-info',
    CREATE: '/api/admin/site-info',
    UPDATE: '/api/admin/site-info',
  },
  
  // 
  EMPLOYEES: {
    LIST: '/api/employees',
    DETAIL: (id: string) => `/api/employees/${id}`,
    CREATE: '/api/employees',
    UPDATE: (id: string) => `/api/employees/${id}`,
    DELETE: (id: string) => `/api/employees/${id}`,
  },
  
  // 
  SUPERVISORS: {
    LIST: '/api/supervisors',
    DETAIL: (id: string) => `/api/supervisors/${id}`,
    CREATE: '/api/supervisors',
    UPDATE: (id: string) => `/api/supervisors/${id}`,
    DELETE: (id: string) => `/api/supervisors/${id}`,
  },
  
  // SMS 
  SMS: {
    SEND: '/api/sms/send',
    TEMPLATES: '/api/sms/templates',
    HISTORY: '/api/sms/history',
  },
  
  // /
  DASHBOARD: {
    OVERVIEW: '/api/dashboard/overview',
    SALES: '/api/dashboard/sales',
    ORDERS: '/api/dashboard/orders',
  },
  
  // 
  COMMON: {
    STATUS: '/api/common/status',
  },
} as const;

/**
 * API 설정 객체
 */
export const apiConfig = {
  endpoints: API_ENDPOINTS,
};

export default apiConfig;