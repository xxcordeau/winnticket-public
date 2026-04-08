import { API_BASE_URL } from './auth';

// DTO
export interface ShopCartItemOption {
  optionName: string;
  optionValue: string;
  optionId?: string; // API UUID
  optionValueId?: string; // API UUID
}

export interface ShopCartItem {
  id: string;
  productId: string;
  productName: string;
  imageUrl: string;
  quantity: number;
  unitOriginPrice: number;
  discountPrice: number;
  unitFinalPrice: number;
  itemTotalPrice: number;
  options: ShopCartItemOption[];
  salesStatus?: string; // (SOLD_OUT, READY, PAUSED, STOPPED )
  // 
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

export interface ShopCartResponse {
  items: ShopCartItem[];
  orderAmount: number;
  discountAmount: number;
  finalAmount: number;
}

// 
export interface AddToCartRequest {
  productId: string;
  quantity: number;
  options: {
    optionId: string;
    optionValueId: string;
  }[];
  // 
  stayOptionValueId?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

// API Response 
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * 장바구니 상품 추가
 */
export async function addToCart(request: AddToCartRequest): Promise<ApiResponse<ShopCartItem>> {
  try {
    const response = await fetch(`${API_BASE_URL}/shopCart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        message: data.message || '장바구니 추가에 실패했습니다.',
      };
    }

    return data;
  } catch (error) {
    // : 
    return {
      success: false,
      message: 'API 서버에 연결할 수 없습니다. 로컬 장바구니를 사용합니다.',
    };
  }
}

/**
 * 장바구니 조회
 */
export async function getCart(): Promise<ApiResponse<ShopCartResponse>> {
  try {
    const response = await fetch(`${API_BASE_URL}/shopCart`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const data = await response.json();
    
    if (!response.ok) {
      // API 
      return getLocalCart();
    }

    // URL 
    if (data.success && data.data?.items) {
      data.data.items.forEach((item: ShopCartItem, index: number) => {
      });
    }

    return data;
  } catch (error) {
    // : 
    return getLocalCart();
  }
}

/**
 * 로컬 스토리지에서 장바구니 조회
 */
function getLocalCart(): ApiResponse<ShopCartResponse> {
  try {
    const savedCart = localStorage.getItem('shop_cart');
    if (!savedCart) {
      return {
        success: true,
        data: {
          items: [],
          orderAmount: 0,
          discountAmount: 0,
          finalAmount: 0,
        },
      };
    }

    const localItems = JSON.parse(savedCart);
    
    // API 
    const items: ShopCartItem[] = localItems.map((item: any) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      imageUrl: item.thumbnailUrl || '',
      quantity: item.quantity,
      unitOriginPrice: item.unitPrice,
      discountPrice: 0,
      unitFinalPrice: item.unitPrice,
      itemTotalPrice: item.unitPrice * item.quantity,
      options: item.optionName ? [{
        optionName: '옵션',
        optionValue: item.optionName,
      }] : [],
    }));

    const orderAmount = items.reduce((sum, item) => sum + item.itemTotalPrice, 0);

    return {
      success: true,
      data: {
        items,
        orderAmount,
        discountAmount: 0,
        finalAmount: orderAmount,
      },
    };
  } catch (error) {
    return {
      success: true,
      data: {
        items: [],
        orderAmount: 0,
        discountAmount: 0,
        finalAmount: 0,
      },
    };
  }
}

/**
 * 장바구니 수량 변경
 */
export async function updateCartItemQuantity(
  itemId: string,
  quantity: number
): Promise<ApiResponse<ShopCartItem>> {
  try {
    const response = await fetch(`${API_BASE_URL}/shopCart/${itemId}?quantity=${quantity}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        message: data.message || '수량 변경에 실패했습니다.',
      };
    }

    return data;
  } catch (error) {
    // : 
    return {
      success: false,
      message: 'API 서버에 연결할 수 없습니다. 로컬 장바구니를 사용합니다.',
    };
  }
}

/**
 * 장바구니 개별 상품 삭제
 */
export async function removeCartItem(itemId: string): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(`${API_BASE_URL}/shopCart/${itemId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        message: data.message || '상품 삭제에 실패했습니다.',
      };
    }

    return data;
  } catch (error) {
    // : 
    return {
      success: false,
      message: 'API 서버에 연결할 수 없습니다. 로컬 장바구니를 사용합니다.',
    };
  }
}

/**
 * 장바구니 전체 비우기 (세션 초기화)
 */
export async function clearCart(): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(`${API_BASE_URL}/shopCart/session`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        message: data.message || '장바구니 비우기에 실패했습니다.',
      };
    }

    return data;
  } catch (error) {
    // : 
    return {
      success: false,
      message: 'API 서버에 연결할 수 없습니다. 로컬 장바구니를 사용합니다.',
    };
  }
}

/**
 * 장바구니 수량 카운트 조회
 */
export async function getCartCount(): Promise<number> {
  try {
    const response = await fetch(`${API_BASE_URL}/shopCart/count`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const data = await response.json();
    
    if (!response.ok || !data.success) {
      // API localStorage 
      const savedCount = localStorage.getItem('shop_cart_count');
      return savedCount ? parseInt(savedCount, 10) : 0;
    }

    const count = data.data?.count || 0;
    
    // localStorage 
    localStorage.setItem('shop_cart_count', count.toString());
    
    return count;
  } catch (error) {
    // : localStorage 
    const savedCount = localStorage.getItem('shop_cart_count');
    return savedCount ? parseInt(savedCount, 10) : 0;
  }
}