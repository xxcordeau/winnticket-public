import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import type { Page } from "../App";
import { toast } from "sonner";
import { getChannels } from "../data/channels";
import type { Channel } from "../data/dto/channel.dto";
import { logout as apiLogout, getRefreshToken, getCurrentUser } from "../lib/api/auth";
import { getPartnerDetail } from "../lib/api/partner";
import { 
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  useSidebar 
} from "./ui/sidebar";
import { authStore } from "../data/auth";
import { useAdminMenus } from "../data/hooks/useAdminMenus";
import { getIconForPage, getTitleEnForPage } from "../data/admin-menus";
import { ChevronDown } from "lucide-react";
import {
  MdDashboard,
  MdFolder,
  MdReceipt,
  MdPeople,
  MdCalendarToday,
  MdImage,
  MdBarChart,
  MdSecurity,
  MdMenu,
  MdSettings,
  MdForum,
  MdShoppingCart,
} from "react-icons/md";
import logoImage from "@/assets/1e9c9bc30e0ca074f3b3154198e56d5fc9accd11.png";

type Language = "ko" | "en";
type CurrentUser = "admin" | "employee";

interface AppSidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  language: Language;
  isDark: boolean;
  currentUser: CurrentUser;
  onUserSwitch: () => void;
}

export function AppSidebar({
  currentPage,
  onPageChange,
  language,
  isDark,
  currentUser,
  onUserSwitch,
}: AppSidebarProps) {
  const navigate = useNavigate();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [accessibleModules, setAccessibleModules] = useState<string[]>([]);
  const [currentAuthUser, setCurrentAuthUser] = useState(authStore.getCurrentUser());
  const { visibleMenus } = useAdminMenus();
  const [activeChannels, setActiveChannels] = useState<Channel[]>([]);
  
  useEffect(() => {
    const updateAccessibleModules = () => {
      const modules = authStore.getAccessibleModules();
      setAccessibleModules(modules);
      setCurrentAuthUser(authStore.getCurrentUser());
    };

    updateAccessibleModules();
    const unsubscribe = authStore.subscribe(updateAccessibleModules);

    // 
    const response = getChannels(0, 100);
    if (response.success && response.data) {
      setActiveChannels(response.data.content.filter(channel => channel.active));
    }

    return () => unsubscribe();
  }, []);

  const moduleMapping: Record<string, string> = {
    dashboard: "dashboard",
    "menu-management": "menu-management",
    products: "products",
    partners: "partners",
    orders: "orders",
    banners: "banners",
    channels: "channels",
    "entity-diagram": "entity-diagram",
    community: "community",
    "site-info": "site-info",
    "voucher-exchange": "voucher-exchange",
    "field-orders": "field-orders",
  };
  
  // 
  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, any> = {
      MdDashboard,
      MdFolder,
      MdReceipt,
      MdPeople,
      MdCalendarToday,
      MdImage,
      MdBarChart,
      MdSecurity,
      MdMenu,
      MdSettings,
      MdForum,
      MdShoppingCart,
    };
    return iconMap[iconName] || MdDashboard;
  };
  
  // ROLE002(현장관리자)는 고정 메뉴 표시
  const isFieldManager = currentAuthUser?.roleId === "ROLE002" ||
    currentAuthUser?.userType === "field-manager" ||
    currentAuthUser?.userType === "supervisor";

  const items = isFieldManager
    ? [{
        title: "현장주문관리",
        icon: getIconComponent("MdReceipt"),
        page: "field-orders" as Page,
        id: "menu-field-orders",
      }]
    : visibleMenus
        .filter(menu => {
          const module = moduleMapping[menu.page] || menu.page;
          return accessibleModules.includes(module);
        })
        .map(menu => {
          const iconName = getIconForPage(menu.page);
          return {
            title: language === "ko" ? menu.title : getTitleEnForPage(menu.page),
            icon: getIconComponent(iconName),
            page: menu.page as Page,
            id: menu.id,
          };
        })
        .filter((item, index, self) =>
          index === self.findIndex(t => t.page === item.page)
        );

  const userText = currentAuthUser ? {
    ko: {
      name: `${currentAuthUser.name} 님`,
      email: currentAuthUser.userType === "supervisor" 
        ? `${currentAuthUser.accountId} (현장관리자)` 
        : `${currentAuthUser.accountId}@acron.co.kr`,
      fallback: currentAuthUser.name.charAt(0),
      avatar: currentAuthUser.avatarUrl,
    },
    en: {
      name: currentAuthUser.name,
      email: currentAuthUser.userType === "supervisor"
        ? `${currentAuthUser.accountId} (Supervisor)`
        : `${currentAuthUser.accountId}@acron.co.kr`,
      fallback: currentAuthUser.name.charAt(0),
      avatar: currentAuthUser.avatarUrl,
    },
  } : {
    ko: {
      name: "게스트",
      email: "guest@acron.co.kr",
      fallback: "G",
    },
    en: {
      name: "Guest",
      email: "guest@acron.co.kr",
      fallback: "G",
    },
  };

  const handleReset = () => {
    // localStorage ERP 
    localStorage.removeItem("erp_projects_data");
    localStorage.removeItem("erp_tasks_data");
    localStorage.removeItem("erp_team_members_data");
    localStorage.removeItem("erp_employees_data");
    localStorage.removeItem("erp_organizations_data");
    localStorage.removeItem("erp_roles_data");
    localStorage.removeItem("erp_permissions_data");
    
    // 
    window.location.reload();
    
    toast.success(language === "ko" ? "데이터가 초기화되었습니다." : "Data has been reset.");
  };

  const handleLogout = async () => {
    const refreshToken = getRefreshToken();
    
    // API (refreshToken accessToken )
    // 
    await apiLogout({ refreshToken: refreshToken || '' });
    
    authStore.logout();
    navigate("/login");
    toast.success(language === "ko" ? "로그아웃되었습니다." : "Logged out successfully.");
  };

  const handleMyProfile = () => {
    if (currentAuthUser) {
      // 
      if (currentAuthUser.userType === 'supervisor') {
        // supervisors 
        navigate(`/admin/supervisors/${currentAuthUser.id}`);
      } else if (currentAuthUser.userType === 'employee') {
        // employees 
        navigate(`/admin/employees/${currentAuthUser.id}`);
      } else {
        // employees ()
        navigate(`/admin/employees/${currentAuthUser.id}`);
      }
    }
  };

  const handleChannelClick = (channelCode: string) => {
    const url = channelCode === "DEFAULT" ? "/" : `/?channel=${channelCode}`;
    navigate(url);
  };

  const text = {
    ko: {
      channelShops: "채널별 쇼핑몰",
      goToShop: "쇼핑몰 바로가기",
    },
    en: {
      channelShops: "Channel Shops",
      goToShop: "Go to Shop",
    },
  };

  const t = text[language];

  return (
    <Sidebar className="border-r border-border bg-background">
      <SidebarHeader className="h-[46px] border-b border-border bg-background px-[10px] py-[10px]">
        <div className="flex w-full items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2 pl-[6px]">
              <img 
                src={logoImage} 
                alt="WinnTicket" 
                className="h-3 md:h-4 object-contain"
              />
            </div>
          )}
          <SidebarTrigger className={isCollapsed ? "mx-auto" : ""} />
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-background px-[5px] py-[10px]">
        <div className="flex flex-col gap-1">
          {items.map((item) => {
            const isActive = currentPage === item.page;
            const IconComponent = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.page)}
                data-sidebar="menu-button"
                className={`flex h-[36px] w-full cursor-pointer items-center gap-2 rounded px-[10px] py-[6px] transition-all hover:scale-105 ${
                  isActive
                    ? "bg-[#F9FAFB] dark:bg-accent"
                    : "bg-transparent hover:bg-[#F9FAFB] dark:hover:bg-accent"
                }`}
              >
                <IconComponent
                  className={`size-4 shrink-0 ${isActive ? "text-[#0c8ce9]" : "text-foreground/60"}`}
                />
                {!isCollapsed && (
                  <span 
                    className={`text-[13px] tracking-[0.48px] ${
                      isActive ? "text-[#0c8ce9]" : "text-foreground/60"
                    }`}
                    style={{ fontWeight: 500 }}
                  >
                    {item.title}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </SidebarContent>

      <SidebarFooter className="bg-background p-[5px]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              data-sidebar="menu-button"
              className="flex w-full items-center justify-between rounded-lg p-[10px] transition-all hover:bg-[#F9FAFB] dark:hover:bg-accent cursor-pointer hover:scale-105"
            >
              <div className="flex items-center gap-[8px]">
                <Avatar className="size-[26px] shrink-0">
                  {userText[language].avatar && (
                    <AvatarImage src={userText[language].avatar} alt={userText[language].name} />
                  )}
                  <AvatarFallback className="bg-[#0c8ce9] font-['Pretendard',_sans-serif] text-[12px] text-white">
                    {userText[language].fallback}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="text-[13px] text-foreground" style={{ fontWeight: 500 }}>
                    {userText[language].name}
                  </div>
                )}
              </div>
              {!isCollapsed && (
                <ChevronDown className="size-3 shrink-0 text-foreground/50" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            {currentAuthUser && (
              <DropdownMenuItem onClick={handleMyProfile}>
                {language === "ko" ? "내 프로필" : "My Profile"}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleLogout}>
              {language === "ko" ? "로그아웃" : "Logout"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}