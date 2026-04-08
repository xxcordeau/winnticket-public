import { useState, useEffect } from "react";
import { adminMenuStore, type AdminMenuItem } from "../admin-menus";
import { getAdminMenuList } from "../../lib/api/admin-menu";

// 
let adminMenuCache: AdminMenuItem[] | null = null;
let adminMenuCacheTimestamp: number = 0;
const CACHE_DURATION = 60000; // 1 
let isLoadingAdminMenu = false;
let loadPromise: Promise<void> | null = null;

/**
 * 서버에서 관리자 메뉴를 로드하는 함수 (캐싱 포함)
 */
export async function loadAdminMenuFromServer(forceReload: boolean = false): Promise<AdminMenuItem[]> {
  const now = Date.now();
  
  // 
  if (!forceReload && adminMenuCache && (now - adminMenuCacheTimestamp < CACHE_DURATION)) {
    return adminMenuCache;
  }

  // Promise 
  if (isLoadingAdminMenu && loadPromise) {
    await loadPromise;
    return adminMenuCache || [];
  }

  // 
  isLoadingAdminMenu = true;
  loadPromise = (async () => {
    try {
      const response = await getAdminMenuList();
      
      
      if (response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
        adminMenuCache = response.data.map((item: any) => {
          
          return {
            id: item.id,
            title: item.title,
            titleEn: item.titleEn,
            icon: item.icon,
            page: item.page,
            displayOrder: item.displayOrder,
            visible: item.visible,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          };
        });
        
        adminMenuCacheTimestamp = now;
        adminMenuStore.updateMenus(adminMenuCache);
      } else {
        // API 
        adminMenuCache = getDefaultAdminMenus();
        adminMenuCacheTimestamp = now;
        adminMenuStore.updateMenus(adminMenuCache);
      }
    } catch (error) {
      // ( )
      adminMenuCache = getDefaultAdminMenus();
      adminMenuCacheTimestamp = now;
      adminMenuStore.updateMenus(adminMenuCache);
    } finally {
      isLoadingAdminMenu = false;
      loadPromise = null;
    }
  })();

  await loadPromise;
  return adminMenuCache || [];
}

/**
 * 관리자 메뉴 캐시를 무효화하는 함수
 */
export function invalidateAdminMenuCache() {
  adminMenuCache = null;
  adminMenuCacheTimestamp = 0;
}

export function useAdminMenus() {
  const [menus, setMenus] = useState<AdminMenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const updateMenus = () => {
      setMenus(adminMenuStore.getMenus());
    };

    // 
    updateMenus();
    
    // 
    loadAdminMenuFromServer().finally(() => {
      setIsLoading(false);
    });

    const unsubscribe = adminMenuStore.subscribe(updateMenus);

    return () => unsubscribe();
  }, []);

  return {
    menus,
    isLoading,
    visibleMenus: menus.filter((m) => m.visible).sort((a, b) => a.displayOrder - b.displayOrder),
    addMenu: (menu: AdminMenuItem) => adminMenuStore.addMenu(menu),
    updateMenu: (id: string, updates: Partial<AdminMenuItem>) =>
      adminMenuStore.updateMenu(id, updates),
    deleteMenu: (id: string) => adminMenuStore.deleteMenu(id),
    toggleVisibility: (id: string) => adminMenuStore.toggleVisibility(id),
    updateMenus: (menus: AdminMenuItem[]) => adminMenuStore.updateMenus(menus),
    refreshFromServer: () => loadAdminMenuFromServer(true),
  };
}

/**
 * 기본 관리자 메뉴 목록
 */
function getDefaultAdminMenus(): AdminMenuItem[] {
  return [
    {
      id: "menu-dashboard",
      title: "대시보드",
      titleEn: "Dashboard",
      icon: "LayoutDashboard",
      page: "dashboard",
      displayOrder: 1,
      visible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "menu-products",
      title: "상품관리",
      titleEn: "Products",
      icon: "Package",
      page: "products",
      displayOrder: 2,
      visible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "menu-orders",
      title: "주문관리",
      titleEn: "Orders",
      icon: "ShoppingCart",
      page: "orders",
      displayOrder: 3,
      visible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "menu-partners",
      title: "파트너관리",
      titleEn: "Partners",
      icon: "Users",
      page: "partners",
      displayOrder: 4,
      visible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "menu-banners",
      title: "배너관리",
      titleEn: "Banners",
      icon: "Image",
      page: "banners",
      displayOrder: 5,
      visible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "menu-channels",
      title: "채널관리",
      titleEn: "Channels",
      icon: "Radio",
      page: "channels",
      displayOrder: 6,
      visible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "menu-community",
      title: "커뮤니티",
      titleEn: "Community",
      icon: "MessageSquare",
      page: "community",
      displayOrder: 7,
      visible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "menu-menu-management",
      title: "메뉴관리",
      titleEn: "Menu Management",
      icon: "Menu",
      page: "menu-management",
      displayOrder: 8,
      visible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "menu-site-info",
      title: "사이트 정보",
      titleEn: "Site Info",
      icon: "Info",
      page: "site-info",
      displayOrder: 9,
      visible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "menu-voucher-exchange",
      title: "바우처 교환",
      titleEn: "Voucher Exchange",
      icon: "Ticket",
      page: "voucher-exchange",
      displayOrder: 10,
      visible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}