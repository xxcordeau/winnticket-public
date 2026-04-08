export interface AdminMenuItem {
  id: string;
  title: string;
  titleEn?: string;
  icon?: string;
  page: string;
  displayOrder: number;
  visible: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 페이지 이름으로 아이콘 이름 가져오기 (프론트엔드 매핑)
 */
export const getIconForPage = (page: string): string => {
  const iconMap: Record<string, string> = {
    dashboard: "MdDashboard",
    products: "MdFolder",
    orders: "MdReceipt",
    partners: "MdPeople",
    banners: "MdImage",
    channels: "MdBarChart",
    community: "MdForum",
    "menu-management": "MdMenu",
    "site-info": "MdSettings",
    permissions: "MdSecurity",
    "voucher-exchange": "MdReceipt",
    "field-orders": "MdShoppingCart",
  };
  return iconMap[page] || "MdDashboard";
};

/**
 * 페이지 이름으로 영문 제목 가져오기 (프론트엔드 매핑)
 */
export const getTitleEnForPage = (page: string): string => {
  const titleMap: Record<string, string> = {
    dashboard: "Dashboard",
    products: "Products",
    orders: "Orders",
    partners: "Partners",
    permissions: "Admins",
    banners: "Banners",
    channels: "Channels",
    community: "Community",
    "menu-management": "Menus",
    "site-info": "Site Info",
    "voucher-exchange": "Voucher Exchange",
    "field-orders": "Field Orders",
  };
  return titleMap[page] || page;
};

/**
 * 관리자 메뉴 스토어
 * API에서 데이터를 가져와 관리합니다.
 */
class AdminMenuStore {
  private menus: AdminMenuItem[] = [];
  private listeners: Array<() => void> = [];

  constructor() {
    // 
    // API 
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener());
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  getMenus(): AdminMenuItem[] {
    return [...this.menus];
  }

  setMenus(menus: AdminMenuItem[]) {
    this.menus = menus;
    this.notifyListeners();
  }

  addMenu(menu: AdminMenuItem) {
    this.menus = [...this.menus, menu];
    this.notifyListeners();
  }

  updateMenu(id: string, updates: Partial<AdminMenuItem>) {
    const index = this.menus.findIndex((m) => m.id === id);
    if (index !== -1) {
      this.menus = [
        ...this.menus.slice(0, index),
        { 
          ...this.menus[index], 
          ...updates,
          updatedAt: new Date().toISOString()
        },
        ...this.menus.slice(index + 1)
      ];
      this.notifyListeners();
    }
  }

  deleteMenu(id: string) {
    this.menus = this.menus.filter((m) => m.id !== id);
    this.notifyListeners();
  }

  toggleVisibility(id: string) {
    const index = this.menus.findIndex((m) => m.id === id);
    if (index !== -1) {
      // 
      this.menus = [
        ...this.menus.slice(0, index),
        {
          ...this.menus[index],
          visible: !this.menus[index].visible,
          updatedAt: new Date().toISOString()
        },
        ...this.menus.slice(index + 1)
      ];
      this.notifyListeners();
    }
  }

  updateMenus(menus: AdminMenuItem[]) {
    this.menus = menus;
    this.notifyListeners();
  }

  getVisibleMenus(): AdminMenuItem[] {
    return this.menus
      .filter((m) => m.visible)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }
}

export const adminMenuStore = new AdminMenuStore();

// 
if (typeof window !== 'undefined') {
  (window as any).checkAdminMenus = () => {
  };
}