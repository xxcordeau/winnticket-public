import { Moon, Sun, Store, Wifi, WifiOff } from "lucide-react";
import { useNavigate } from "react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { SidebarTrigger } from "./ui/sidebar";
import { getChannels as getChannelsLocal } from "../data/channels"; // 
import * as ChannelAPI from "../lib/api/channel"; // API 
import { useEffect, useState } from "react";
import type { Channel } from "../data/dto/channel.dto";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { apiClient } from "../lib/api"; // API import
import winnTicketLogo from "@/assets/bee05894efbe96641b12e116dce823584b159d86.png"; // WinnTicket 
import { authStore } from "../data/auth"; // import

// () - ShopHeader 
let appHeaderChannelCache: Channel[] | null = null;
let appHeaderChannelCacheTimestamp: number = 0;
const APP_HEADER_CHANNEL_CACHE_DURATION = 300000; // 5 

interface AppHeaderProps {
  breadcrumb: string[];
  isDark: boolean;
  onDarkModeToggle: () => void;
}

export function AppHeader({
  breadcrumb,
  isDark,
  onDarkModeToggle,
}: AppHeaderProps) {
  const navigate = useNavigate();
  const [activeChannels, setActiveChannels] = useState<
    Channel[]
  >([]);
  const [serverStatus, setServerStatus] = useState<
    "online" | "offline" | "checking"
  >("checking");

  // 
  const currentUser = authStore.getCurrentUser();
  const isROLE002 = currentUser?.roleId === "ROLE002";

  useEffect(() => {
    // ROLE002 API 
    if (isROLE002) {
      return;
    }

    const loadChannels = async () => {
      try {
        // API ( )
        const apiResponse =
          await ChannelAPI.getPublicChannels();

        if (
          apiResponse.success &&
          apiResponse.data &&
          apiResponse.data.length > 0
        ) {

          // API Channel visible=true 
          const mappedChannels: Channel[] = apiResponse.data
            .filter((item) => item.visible) // 
            .map((item) => ({
              id: (item.id || item.code) as any,
              channelCode: item.code,
              channelName: item.name,
              companyName: item.companyName,
              logoUrl: item.logoUrl || "",
              faviconUrl: item.faviconUrl || "",
              description: item.description || "",
              contactEmail: item.email || "",
              contactPhone: item.phone || "",
              websiteUrl: item.domain || "",
              domain: item.domain || "",
              commissionRate: item.commissionRate || 0,
              active: item.visible,
              createdAt:
                item.createdAt || new Date().toISOString(),
              updatedAt:
                item.updatedAt || new Date().toISOString(),
            }));

          setActiveChannels(mappedChannels);
          appHeaderChannelCache = mappedChannels;
          appHeaderChannelCacheTimestamp = Date.now();
        } else {
          // API 
          setActiveChannels([]);
          appHeaderChannelCache = null;
          appHeaderChannelCacheTimestamp = 0;
        }
      } catch (error) {
        // 
        setActiveChannels([]);
        appHeaderChannelCache = null;
        appHeaderChannelCacheTimestamp = 0;
      }
    };

    // , API 
    if (
      appHeaderChannelCache &&
      Date.now() - appHeaderChannelCacheTimestamp <
        APP_HEADER_CHANNEL_CACHE_DURATION
    ) {
      setActiveChannels(appHeaderChannelCache);
    } else {
      loadChannels();
    }
  }, [isROLE002]);

  // - 5 
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          3000,
        );

        const response = await apiClient
          .get("/api/common/status")
          .catch(() => null);

        clearTimeout(timeoutId);
        setServerStatus(
          response && response.success ? "online" : "offline",
        );
      } catch (error) {
        setServerStatus("offline");
      }
    };

    // 
    checkServerStatus();

    // 5 (5 = 300,000ms)
    const intervalId = setInterval(
      checkServerStatus,
      5 * 60 * 1000,
    );

    return () => clearInterval(intervalId);
  }, []);

  const handleChannelClick = (channelCode: string) => {
    const url =
      channelCode === "DEFAULT"
        ? "/"
        : `/?channel=${channelCode}`;
    navigate(url);
  };

  return (
    <header className="sticky top-0 z-50 flex h-[46px] items-center gap-2 sm:gap-4 border-b bg-background px-3 sm:px-6">
      {/* 모바일 사이드바 토글 버튼 */}
      <SidebarTrigger className="lg:hidden" />

      <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
        <Breadcrumb className="flex-1 min-w-0">
          <BreadcrumbList className="flex-nowrap overflow-hidden">
            {breadcrumb.map((item, index) => (
              <span
                key={index}
                className="flex items-center min-w-0"
              >
                {index > 0 && (
                  <BreadcrumbSeparator className="flex-shrink-0" />
                )}
                <BreadcrumbItem className="min-w-0">
                  {index === breadcrumb.length - 1 ? (
                    <BreadcrumbPage className="truncate text-xs sm:text-sm">
                      {item}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (index === 0 && item === "홈") {
                          navigate("/admin/dashboard");
                        }
                      }}
                      className="truncate text-xs sm:text-sm cursor-pointer"
                    >
                      {item}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </span>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* 채널별 쇼핑몰 버튼 - ROLE002는 표시하지 않음 */}
          {!isROLE002 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 sm:gap-2 h-8 px-2 sm:px-3"
                  data-tour="header-shop"
                >
                  <Store className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden md:inline text-xs sm:text-sm">
                    쇼핑몰 바로가기
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  채널별 쇼핑몰
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* 기본 쇼핑몰 (하드코딩) */}
                <DropdownMenuItem
                  onClick={() => navigate("/")}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-3 w-full">
                    <img
                      src={winnTicketLogo}
                      alt="WinnTicket"
                      className="h-6 w-6 rounded object-contain shrink-0"
                      onError={(e) => {
                        // 
                        e.currentTarget.style.display = "none";
                        const parent =
                          e.currentTarget.parentElement;
                        if (parent) {
                          const fallback =
                            document.createElement("div");
                          fallback.className =
                            "h-6 w-6 rounded bg-primary/10 flex items-center justify-center shrink-0";
                          fallback.innerHTML =
                            '<svg class="h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>';
                          parent.insertBefore(
                            fallback,
                            parent.firstChild,
                          );
                        }
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        윈앤티켓
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        자체몰
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
                {activeChannels.length > 0 && (
                  <DropdownMenuSeparator />
                )}
                {activeChannels.length > 0
                  ? activeChannels.map((channel) => (
                      <DropdownMenuItem
                        key={channel.id}
                        onClick={() =>
                          handleChannelClick(channel.channelCode)
                        }
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-3 w-full">
                          {/* ⭐ 로고 이미지가 있으면 이미지 표시, 없으면 색상 배경 + 아이콘 */}
                          {channel.logoUrl ? (
                            <img
                              src={channel.logoUrl}
                              alt={channel.channelName}
                              className="h-8 w-8 rounded object-cover shrink-0"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                              <Store className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {channel.channelName}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {channel.companyName}
                            </div>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))
                  : null}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={onDarkModeToggle}
            className="h-8 w-8"
          >
            {isDark ? (
              <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </Button>

          {/* 서버 상태 표시 */}
          <div data-tour="header-status">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  {serverStatus === "checking" ? (
                    <Wifi className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  ) : serverStatus === "online" ? (
                    <Wifi className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  {serverStatus === "checking"
                    ? "서버 상태 확인 중..."
                    : serverStatus === "online"
                      ? "서버가 온라인 상태입니다."
                      : "서버가 오프라인 상태입니다."}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </header>
  );
}