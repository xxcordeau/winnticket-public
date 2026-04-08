import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router";
import { getMenuList, type MenuItem } from "../lib/api/menu";
import { shopStore } from "../data/shop-data";
import type { MenuCategory } from "../data/dto/shop.dto";
import { loadMenuFromServer, syncChannelFromUrl, getCurrentChannel as getStoredChannel, setCurrentChannel } from "../data/hooks/useShopStore";
import { getCurrentChannel } from "../data/channels";
import type { Channel } from "../data/dto/channel.dto";
import { getCartCount } from "../lib/api/shop-cart"; // ⭐ 장바구니 수량 API 추가
import { useChannel } from "../lib/channel-context"; // ⭐ 채널 컨텍스트 추가
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import {
  Search,
  ShoppingCart,
  MessageCircle,
  ArrowLeft,
  Store,
  ChevronDown,
  Menu,
  ChevronRight,
  Bell,
  Package,
  MoreVertical,
  FileText,
  Info,
  Gift,
  Coins,
  Building2,
  HelpCircle,
  MessageCircleMore,
} from "lucide-react";
import logoImage from "@/assets/1e9c9bc30e0ca074f3b3154198e56d5fc9accd11.png";

// ⭐ 채널 목록 캐시 (전역)
let channelCache: Channel[] | null = null;
let channelCacheTimestamp: number = 0;
const CHANNEL_CACHE_DURATION = 300000; // 5분 캐시

type Language = "ko" | "en";

interface ShopHeaderProps {
  language: Language;
}

export function ShopHeader({ language }: ShopHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const [logoError, setLogoError] = useState(false); // ⭐ 로고 이미지 에러 상태 추가
  
  // 현재 채널 정보 가져오기
  const currentChannel = getCurrentChannel();
  const { currentChannel: channelCode, channelLogoUrl } = useChannel(); // ⭐ 채널 코드 + 로고 URL 가져오기
  
  // ⭐ 채널 변경 시 로고 에러 상태 초기화
  useEffect(() => {
    setLogoError(false);
  }, [channelLogoUrl]);

  // ⭐ 검색창 placeholder 배열 (채널이 디폴트일 때만 "윈앤티켓..." 포함)
  const searchPlaceholders = currentChannel.code === 'DEFAULT' 
    ? [
        "요즘 가장 핫한 전시회 티켓은?",
        "윈앤티켓에서 최저가 티켓을 겟!",
        "이번 주말 어디 갈지 고민된다면?",
        "겨울엔 역시 뜨끈한 스파? 아니면 스키?",
        "집에만 있기 아쉬운 오늘, 갈만한 곳은?"
      ]
    : [
        "요즘 가장 핫한 전시회 티켓은?",
        "이번 주말 어디 갈지 고민된다면?",
        "겨울엔 역시 뜨끈한 스파? 아니면 스키?",
        "집에만 있기 아쉬운 오늘, 갈만한 곳은?"
      ];

  // ⭐ 2-3초마다 placeholder 순환
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceholderIndex((prev) => (prev + 1) % searchPlaceholders.length);
    }, 2500); // 2.5초

    return () => clearInterval(interval);
  }, [searchPlaceholders.length]);

  // ⭐ URL 검색 파라미터와 검색창 동기화
  useEffect(() => {
    const queryFromUrl = searchParams.get('q') || '';
    setSearchQuery(queryFromUrl);
  }, [searchParams]);

  // ⭐ URL 진입 시 채널 정보 동기화
  useEffect(() => {
    const channelCode = syncChannelFromUrl();
    console.log('🔗 [ShopHeader] URL 채널 동기화 완료:', channelCode);
  }, [location.search]); // URL이 변경될 때마다 실행

  // 장바구니 개수 업데이트
  useEffect(() => {
    const updateCartCount = async () => {
      try {
        const count = await getCartCount();
        setCartCount(count);
      } catch (error) {
        console.error("Failed to get cart count:", error);
        setCartCount(0);
      }
    };

    // 초기 로드
    updateCartCount();

    // 장바구니 업데이트 이벤트 리스너
    window.addEventListener('cartUpdated', updateCartCount);

    return () => {
      window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, []);

  // API에서 메뉴 목록 가져오기 (캐시 사용)
  useEffect(() => {
    const fetchMenus = async () => {
      setMenuLoading(true);
      setMenuError(null);
      
      try {
        // 강제 리로드 (캐시 무시)
        const menuData = await loadMenuFromServer(true);
        
        console.log('🍔 [ShopHeader] Loaded menu data from cache/server:', menuData);
        
        if (menuData.length > 0) {
          // 전체 메뉴를 계층 구조로 변환
          const buildHierarchy = (items: MenuItem[]): MenuItem[] => {
            const itemMap = new Map<string, MenuItem & { children: MenuItem[] }>();
            
            // 모든 항목을 맵에 추가하 children 배열 초기화
            items.forEach(item => {
              itemMap.set(item.id, { ...item, children: [] });
            });
            
            // 계층 구조 구성
            const roots: MenuItem[] = [];
            itemMap.forEach(item => {
              if (item.parentId && itemMap.has(item.parentId)) {
                itemMap.get(item.parentId)!.children.push(item);
              } else if (item.level === 1) {
                roots.push(item);
              }
            });
            
            // displayOrder로 정렬 (재귀적으로)
            const sortByDisplayOrder = (items: MenuItem[]) => {
              items.sort((a, b) => a.displayOrder - b.displayOrder);
              items.forEach(item => {
                if ('children' in item && item.children) {
                  sortByDisplayOrder(item.children);
                }
              });
            };
            
            sortByDisplayOrder(roots);
            
            return roots;
          };
          
          const hierarchicalMenus = buildHierarchy(menuData.filter(m => m.visible !== false));
          console.log('🍔 [ShopHeader] Hierarchical Menus:', hierarchicalMenus);
          console.log(`✅ [ShopHeader] Total: ${hierarchicalMenus.length} parent menus`);
          setMenuItems(hierarchicalMenus);
        } else {
          // 메뉴가 없으 빈 배열 정 (전체상품만 표시)
          console.log('⚠️ [ShopHeader] No menu data available');
          setMenuItems([]);
        }
      } catch (error) {
        // 에러 발생 시 빈 배열 설정 (전체상품만 표시)
        console.log('⚠️ [ShopHeader] Error fetching menus:', error);
        setMenuItems([]);
      } finally {
        setMenuLoading(false);
      }
    };

    fetchMenus();
  }, []); // 한 번만 실

  const text = {
    ko: {
      title: "Winnticket",
      search: "상품 검색",
      cart: "장바구니",
      myPage: "마이페이지",
      inquiry: "문의하기",
      kakaoInquiry: "카카오톡 문의하기",
      backToAdmin: "관리자",
      notices: "공지사항",
      faq: "FAQ",
      events: "이벤트",
      orderLookup: "주문조회",
      inquiryLookup: "문의조회",
      channelSelect: "채널 선택",
      allProducts: "전체상품",
      concert: "콘서트",
      musical: "뮤지컬",
      sports: "스포츠",
      exhibition: "전시",
      classic: "클래식",
      menu: "메뉴",
      quickMenu: "고객서비스",
      pointChange: "포인트 변경",
      companyInfo: "회사개요",
    },
    en: {
      title: "Winnticket",
      search: "Search products",
      cart: "Cart",
      myPage: "My Page",
      inquiry: "Inquiry",
      kakaoInquiry: "KakaoTalk Inquiry",
      backToAdmin: "Admin",
      notices: "Notices",
      faq: "FAQ",
      events: "Events",
      orderLookup: "Order Lookup",
      inquiryLookup: "Inquiry Lookup",
      channelSelect: "Select Channel",
      allProducts: "All Products",
      concert: "Concert",
      musical: "Musical",
      sports: "Sports",
      exhibition: "Exhibition",
      classic: "Classic",
      menu: "Menu",
      quickMenu: "Quick Menu",
      pointChange: "Point Change",
      companyInfo: "Company Info",
    },
  };

  const t = text[language];

  // 현재 쇼핑몰 메인 페이지인지 확인
  const isShopMain = location.pathname === "/shop";

  const handleChannelChange = (channelCode: string) => {
    const currentPath = location.pathname;
    if (channelCode === "DEFAULT") {
      // 기본 널: channel 파라미터 제거
      navigate(currentPath);
    } else {
      // 다른 채널: channel 파라미터 추가
      navigate(`${currentPath}?channel=${channelCode}`);
    }
  };

  const handleNavigation = (path: string) => {
    // ⭐ 관리자 페이지로 이동 시 채널 파라미터 제거
    if (path === "/" || path.startsWith("/dashboard") || path.startsWith("/admin")) {
      // URL에서 channel 파라미터를 제거하고 이동
      navigate(path, { replace: true });
    } else {
      navigate(path);
    }
    setMobileMenuOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // 상품 디테일 페이지 여부 확인
  const isProductDetailPage = location.pathname.startsWith('/product/');

  return (
    <header className="bg-white dark:bg-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto lg:px-4 lg:sm:px-6 lg:px-8">
        {/* 첫 번째 줄: 로고, 검색창(PC만), 장바구니, 고객서비스 */}
        <div className="flex items-center justify-between gap-4 py-2 md:py-3 px-4 lg:px-0">
          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9 shrink-0">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>메뉴</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col h-full">
                {/* Mobile Menu Header */}
                <div className="p-4 border-b">
                  <div className="flex items-center gap-3 mb-4">
                    {currentChannel.logoUrl ? (
                      <img 
                        src={currentChannel.logoUrl} 
                        alt={currentChannel.channelName}
                        className="h-8 w-auto object-contain"
                      />
                    ) : (
                      <div 
                        className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center"
                      >
                        <span className="text-muted-foreground text-sm font-bold">
                          {currentChannel.channelName.charAt(0)}
                        </span>
                      </div>
                    )}
                    <h2 className="font-semibold text-base">{currentChannel.channelName}</h2>
                  </div>
                </div>

                {/* Mobile Menu Content */}
                <div className="flex-1 overflow-y-auto">
                  {/* 주요 카테고리 */}
                  <div className="p-4 space-y-2">
                    <div className="text-xs font-medium text-muted-foreground mb-3">카테고리</div>
                    <button
                      onClick={() => handleNavigation("/")}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-sm"
                    >
                      <span>{t.allProducts}</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    {menuItems.map((menu) => (
                      <button
                        key={menu.id}
                        onClick={() => handleNavigation(`/${menu.code}`)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-sm"
                      >
                        <span>{menu.name}</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo - 모바일에서 가운데 정렬 */}
          <div className="flex items-center gap-2 md:gap-3 lg:shrink-0 absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0">
            <img 
              src={(channelLogoUrl && !logoError) ? channelLogoUrl : logoImage} 
              alt={channelLogoUrl ? currentChannel.channelName : "WinnTicket"}
              className={`${channelCode && channelCode !== 'DEFAULT' && channelLogoUrl && !logoError ? 'h-8 md:h-10' : 'h-4 md:h-5'} object-contain cursor-pointer`}
              onClick={() => {
                const searchParams = new URLSearchParams(location.search);
                const channelParam = searchParams.get('channel');
                navigate(channelParam ? `/?channel=${channelParam}` : '/');
              }}
              onError={() => {
                console.error('❌ [ShopHeader] Logo image failed to load:', channelLogoUrl);
                setLogoError(true);
              }}
            />
          </div>

          {/* 검색창 (PC만) */}
          <div className="hidden lg:flex flex-1 max-w-2xl">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={searchPlaceholders[currentPlaceholderIndex]}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12"
                />
              </div>
            </form>
          </div>

          {/* 우측: 장바구니, 고객서비스 */}
          <div className="flex items-center gap-2 shrink-0">
            {/* 장바구니 */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate("/cart")}
              className="h-10 w-10 md:h-12 md:w-12 relative"
            >
              <ShoppingCart className="h-5 w-5 md:h-6 md:w-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Button>

            {/* 고객서비스 메뉴 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-10 w-10 md:h-12 md:w-12"
                >
                  <MoreVertical className="h-5 w-5 md:h-6 md:w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{t.quickMenu}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => window.open('https://pf.kakao.com/_sxeSvxl', '_blank')}
                  className="cursor-pointer"
                >
                  <MessageCircleMore className="mr-2 h-4 w-4" />
                  <span>{t.kakaoInquiry}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate("/order-lookup")}
                  className="cursor-pointer"
                >
                  <Package className="mr-2 h-4 w-4" />
                  <span>{t.orderLookup}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate("/notices")}
                  className="cursor-pointer"
                >
                  <Bell className="mr-2 h-4 w-4" />
                  <span>{t.notices}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate("/faq")}
                  className="cursor-pointer"
                >
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>{t.faq}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate("/inquiries")}
                  className="cursor-pointer"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  <span>{t.inquiry}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate("/events")}
                  className="cursor-pointer"
                >
                  <Gift className="mr-2 h-4 w-4" />
                  <span>{t.events}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate("/point-change")}
                  className="cursor-potential"
                >
                  <Coins className="mr-2 h-4 w-4" />
                  <span>{t.pointChange}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate("/company-info")}
                  className="cursor-pointer"
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  <span>{t.companyInfo}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* 모바일 검색창 (별도 줄) - 상품 디테일 페이지에서는 숨김 */}
        {!isProductDetailPage && (
          <div className="lg:hidden pb-4 px-4">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={searchPlaceholders[currentPlaceholderIndex]}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-10"
                />
              </div>
            </form>
          </div>
        )}

        {/* 두 번째 줄: 메뉴 (데스크톱) */}
        <div className="hidden md:flex items-center gap-6 xl:gap-8 py-3">
          <button
            onClick={() => navigate("/")}
            className="text-sm hover:text-primary transition-colors whitespace-nowrap cursor-pointer"
          >
            {t.allProducts}
          </button>
          {menuItems.map((menu: any) => {
            const hasChildren = menu.children && menu.children.length > 0;
            
            if (hasChildren) {
              return (
                <DropdownMenu key={menu.id}>
                  <DropdownMenuTrigger asChild>
                    <button className="text-sm hover:text-primary transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1">
                      {menu.name}
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      onClick={() => navigate(`/${menu.code}`)}
                      className="cursor-pointer"
                    >
                      전체
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {menu.children.map((child: any) => (
                      <DropdownMenuItem
                        key={child.id}
                        onClick={() => navigate(`/${menu.code}/${child.code}`)}
                        className="cursor-pointer"
                      >
                        {child.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }
            
            return (
              <button
                key={menu.id}
                onClick={() => navigate(`/${menu.code}`)}
                className="text-sm hover:text-primary transition-colors whitespace-nowrap cursor-pointer"
              >
                {menu.name}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}