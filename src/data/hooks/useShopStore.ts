import { useState, useEffect, useCallback } from "react";
import { shopStore } from "../shop-data";
import type { MenuCategory } from "../dto/shop.dto";
import { getShopMenus, getMenuList } from "../../lib/api/menu";

// ()
let menuCache: MenuCategory[] | null = null;
let menuCacheTimestamp: number = 0;
const CACHE_DURATION = 60000; // 1 
let isLoadingMenu = false;
let loadPromise: Promise<void> | null = null;

// ( )
const CHANNEL_STORAGE_KEY = "shop_current_channel";

interface ChannelInfo {
  channelCode: string;
  channelId?: string;
  channelName?: string;
  timestamp: number;
}

/**
 * ⭐ 현재 채널 정보를 로컬 스토리지에 저장
 */
export function setCurrentChannel(channelCode: string, channelId?: string, channelName?: string) {
  const channelInfo: ChannelInfo = {
    channelCode,
    channelId,
    channelName,
    timestamp: Date.now(),
  };
  
  try {
    localStorage.setItem(CHANNEL_STORAGE_KEY, JSON.stringify(channelInfo));
  } catch (error) {
  }
}

/**
 * ⭐ 현재 채널 정보를 로컬 스토리지에서 가져오기
 */
export function getCurrentChannel(): ChannelInfo | null {
  try {
    const stored = localStorage.getItem(CHANNEL_STORAGE_KEY);
    if (stored) {
      const channelInfo: ChannelInfo = JSON.parse(stored);
      return channelInfo;
    }
  } catch (error) {
  }
  return null;
}

/**
 * ⭐ 채널 정보 초기화
 */
export function clearCurrentChannel() {
  try {
    localStorage.removeItem(CHANNEL_STORAGE_KEY);
  } catch (error) {
  }
}

/**
 * ⭐ URL에서 채널 코드 추출 및 저장
 * URL에 채널 파라미터가 없으면 "DEFAULT" 반환 (저장된 채널 무시)
 */
export function syncChannelFromUrl(): string {
  const searchParams = new URLSearchParams(window.location.search);
  const channelCode = searchParams.get("channel");
  
  if (channelCode) {
    // URL 
    setCurrentChannel(channelCode);
    return channelCode;
  } else {
    // URL DEFAULT ( )
    return "DEFAULT";
  }
}

/**
 * shopStore의 메뉴 카테고리 상태를 관리하는 커스텀 훅
 */
export function useMenuCategories() {
  const [categories, setCategories] = useState<MenuCategory[]>(() => {
    const response = shopStore.getMenuCategoriesFlat();
    return response.success ? response.data : [];
  });

  const [visibleCategories, setVisibleCategories] = useState<MenuCategory[]>(() => {
    const response = shopStore.getMenuCategories();
    return response.success ? response.data : [];
  });

  const refreshCategories = useCallback(() => {
    const flatResponse = shopStore.getMenuCategoriesFlat();
    if (flatResponse.success) {
      setCategories(flatResponse.data);
    }

    const hierarchyResponse = shopStore.getMenuCategories();
    if (hierarchyResponse.success) {
      setVisibleCategories(hierarchyResponse.data);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = shopStore.subscribe(() => {
      refreshCategories();
    });

    return unsubscribe;
  }, [refreshCategories]);

  const addCategory = useCallback((category: MenuCategory) => {
    shopStore.addMenuCategory(category);
  }, []);

  const updateCategory = useCallback((id: string, updates: Partial<MenuCategory>) => {
    shopStore.updateMenuCategory(id, updates);
  }, []);

  const deleteCategory = useCallback((id: string) => {
    shopStore.deleteMenuCategory(id);
  }, []);

  const updateCategories = useCallback((newCategories: MenuCategory[]) => {
    shopStore.updateMenuCategories(newCategories);
    // 
    menuCache = null;
    menuCacheTimestamp = 0;
  }, []);

  const toggleVisibility = useCallback((id: string) => {
    const category = categories.find((c) => c.id === id);
    if (category) {
      shopStore.updateMenuCategory(id, { visible: !category.visible });
    }
  }, [categories]);

  return {
    categories,
    visibleCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    updateCategories,
    toggleVisibility,
    refreshCategories,
  };
}

/**
 * 서버에서 메뉴 데이터를 로드하는 함수 (캐싱 포함)
 * @param forceReload - 캐시 무시하고 강제 리로드
 * @param isAdmin - 관리자 API 사용 여부 (true: /api/admin/menu/menuCategory, false: /api/shop/menus)
 */
export async function loadMenuFromServer(forceReload: boolean = false, isAdmin: boolean = false): Promise<MenuCategory[]> {
  const now = Date.now();
  
  // 
  if (!forceReload && menuCache && (now - menuCacheTimestamp < CACHE_DURATION)) {
    return menuCache;
  }

  // Promise 
  if (isLoadingMenu && loadPromise) {
    await loadPromise;
    return menuCache || [];
  }

  // 
  isLoadingMenu = true;
  loadPromise = (async () => {
    try {
      // getMenuList, getShopMenus 
      const response = isAdmin ? await getMenuList() : await getShopMenus();
      
      
      let serverMenus: MenuCategory[] = [];
      
      if (Array.isArray(response)) {
        serverMenus = (response as any).map((item: any) => ({
          id: item.id,
          name: item.name,
          code: item.code,
          level: item.level,
          parentId: item.parentId,
          displayOrder: item.displayOrder,
          visible: item.visible,
          iconUrl: item.iconUrl || '',
          routePath: item.routePath || `/${item.code}`,
        }));
      } else if (response.success && response.data && Array.isArray(response.data)) {
        serverMenus = response.data.map((item: any) => ({
          id: item.id,
          name: item.name,
          code: item.code,
          level: item.level,
          parentId: item.parentId,
          displayOrder: item.displayOrder,
          visible: item.visible,
          iconUrl: item.iconUrl || '',
          routePath: item.routePath || `/${item.code}`,
        }));
      } else {
      }
      
      
      if (serverMenus.length > 0) {
        menuCache = serverMenus;
        menuCacheTimestamp = now;
        shopStore.updateMenuCategories(serverMenus);
      } else {
        menuCache = [];
        menuCacheTimestamp = now;
        shopStore.updateMenuCategories([]);
      }
    } catch (error) {
      // ( )
      menuCache = [];
      menuCacheTimestamp = now;
      shopStore.updateMenuCategories([]);
    } finally {
      isLoadingMenu = false;
      loadPromise = null;
    }
  })();

  await loadPromise;
  return menuCache || [];
}

/**
 * 메뉴 캐시를 무효화하는 함수
 */
export function invalidateMenuCache() {
  menuCache = null;
  menuCacheTimestamp = 0;
}