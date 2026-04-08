import React, { Suspense, useState, useEffect } from "react";
import {
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate,
  BrowserRouter,
} from "react-router";
import { Toaster } from "sonner";
import { AppSidebar } from "./components/app-sidebar";
import { AppHeader } from "./components/app-header";
import { DndWrapper } from "./components/DndWrapper";
import { SidebarProvider } from "./components/ui/sidebar";
import { getAdminMenuList } from "./lib/api/admin-menu";
import { ChannelProvider } from "./lib/channel-context";
import * as ChannelAPI from "./lib/api/channel";
import { ScrollToTop } from "./components/scroll-to-top";
import { authStore } from "./data/auth";
import { resetRolesAndPermissions } from "./data/roles-permissions";
import {
  cleanupDuplicateChannelDiscounts,
  resetChannelDiscountsToInitial,
  resetProductsToInitial,
} from "./data/products";
import { adminMenuStore } from "./data/admin-menus";
import { resetPosts } from "./data/community";
import { logDataMode } from "./lib/data-mode";

// ============================================
// Lazy-loaded Admin Pages
// ============================================
const Dashboard = React.lazy(() => import("@/pages/admin/dashboard"));
const MenuManagement = React.lazy(() => import("@/pages/admin/menu"));
const ProductManagement = React.lazy(() => import("@/pages/admin/product"));
const ProductDetailPage = React.lazy(() => import("@/pages/admin/product/detail-page"));
const ProductContentEditor = React.lazy(() => import("@/pages/admin/product/content-editor"));
const PartnerManagement = React.lazy(() => import("@/pages/admin/partner"));
const PartnerDetail = React.lazy(() => import("@/pages/admin/partner/detail"));
const EmployeeDetail = React.lazy(() => import("@/pages/admin/partner/employee-detail"));
const SupervisorDetail = React.lazy(() => import("@/pages/admin/partner/supervisor-detail"));
const CouponDetail = React.lazy(() => import("@/pages/admin/partner/coupon-detail"));
const AdminOrders = React.lazy(() => import("@/pages/admin/order"));
const AdminOrderDetail = React.lazy(() => import("@/pages/admin/order/detail"));
const FieldOrders = React.lazy(() => import("@/pages/admin/order/field-orders"));
const BannerManagement = React.lazy(() => import("@/pages/admin/banner"));
const ChannelManagement = React.lazy(() => import("@/pages/admin/channel"));
const CommunityManagement = React.lazy(() => import("@/pages/admin/community"));
const NoticeEditor = React.lazy(() => import("@/pages/admin/community/notice/notice-editor"));
const NoticeDetail = React.lazy(() => import("@/pages/admin/community/notice/notice-detail"));
const EventEditor = React.lazy(() => import("@/pages/admin/community/event/event-editor"));
const EventDetail = React.lazy(() => import("@/pages/admin/community/event/event-detail"));
const SiteInfoPage = React.lazy(() => import("@/pages/admin/site-info"));
const VoucherExchange = React.lazy(() => import("@/pages/admin/voucher"));
const ApiTest = React.lazy(() => import("@/pages/admin/api-test"));

// ============================================
// Lazy-loaded Shop Pages
// ============================================
const Shop = React.lazy(() => import("@/pages/shop/home"));
const ShopProductDetail = React.lazy(() => import("@/pages/shop/product/detail"));
const ShopSearch = React.lazy(() => import("@/pages/shop/product/search"));
const ShopCategory = React.lazy(() => import("@/pages/shop/product/category"));
const ShopCart = React.lazy(() => import("@/pages/shop/cart"));
const ShopOrder = React.lazy(() => import("@/pages/shop/order"));
const ShopOrderLookup = React.lazy(() => import("@/pages/shop/order/lookup"));
const ShopOrderDetail = React.lazy(() => import("@/pages/shop/order/detail"));
const ShopPaymentInfo = React.lazy(() => import("@/pages/shop/payment/info"));
const ShopPaymentSuccess = React.lazy(() => import("@/pages/shop/payment/success"));
const ShopPaymentCallback = React.lazy(() => import("@/pages/shop/payment/callback"));
const ShopPaymentLoad = React.lazy(() => import("@/pages/shop/payment/load"));
const ShopNotices = React.lazy(() => import("@/pages/shop/community/notices"));
const ShopNoticeDetail = React.lazy(() => import("@/pages/shop/community/notice-detail"));
const ShopEvents = React.lazy(() => import("@/pages/shop/community/events"));
const ShopEventDetail = React.lazy(() => import("@/pages/shop/community/event-detail"));
const ShopFAQ = React.lazy(() => import("@/pages/shop/community/faq"));
const ShopInquiries = React.lazy(() => import("@/pages/shop/community/inquiries"));
const ShopInquiryLookup = React.lazy(() => import("@/pages/shop/community/inquiry-lookup"));
const ShopCompanyInfo = React.lazy(() => import("@/pages/shop/info/company"));
const QrCoupon = React.lazy(() => import("@/pages/shop/voucher/qr-coupon"));
const BarcodeCoupon = React.lazy(() => import("@/pages/shop/voucher/barcode-coupon"));

// ============================================
// Lazy-loaded Auth & Field Pages
// ============================================
const Login = React.lazy(() => import("@/pages/auth/login"));
const FieldTicketScannerPage = React.lazy(() => import("@/pages/field/ticket-scanner"));

/**
 * 티켓몰 메인 앱
 * - 채널 관리 시스템 통합
 * - 베네피아 iframe 감지 로직
 * - 전액 포인트 결제 지원
 * - React.lazy 코드 스플리팅 적용
 */

// 페이지 로딩 폴백
function PageLoading() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );
}

// Suspense 래퍼 헬퍼
function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoading />}>{children}</Suspense>;
}

export type Page =
  | "dashboard"
  | "menu-management"
  | "products"
  | "partners"
  | "orders"
  | "banners"
  | "channels"
  | "community"
  | "site-info"
  | "voucher-exchange"
  | "field-orders";

type CurrentUser = "admin" | "employee";

// ⭐ Protected Route Component for Admin Pages
function RequireAuth({ children }: { children: JSX.Element }) {
  const location = useLocation();
  const navigate = useNavigate();

  const token = localStorage.getItem("access_token");
  const user = authStore.getCurrentUser();

  useEffect(() => {
    if (!token || !user) {
      console.log(
        "🚫 No auth - redirecting to login from:",
        location.pathname,
      );
      navigate("/login", { replace: true });
    } else {
      console.log("✅ User authenticated:", user.username);

      if (user.roleId === "ROLE002") {
        const isFieldOrdersPage =
          location.pathname.startsWith("/admin/field-orders");
        const isAdminRoot =
          location.pathname === "/admin" ||
          location.pathname === "/admin/";

        if (!isFieldOrdersPage && !isAdminRoot) {
          console.log(
            "🚫 ROLE002 - Redirecting to field-orders from:",
            location.pathname,
          );
          navigate("/admin/field-orders", { replace: true });
        }
      }
    }
  }, [location.pathname, navigate, token, user]);

  if (!token || !user) {
    navigate("/login", { replace: true });
    return null;
  }

  return children;
}

export function AppContent() {
  const language = "ko";
  const [isDark, setIsDark] = useState(false);
  const [currentUser, setCurrentUser] =
    useState<CurrentUser>("admin");
  const location = useLocation();
  const navigate = useNavigate();

  // 개발용: 권한 데이터 초기화 함수를 window에 등록
  useEffect(() => {
    (window as any).resetPermissions = () => {
      resetRolesAndPermissions();
      console.log(
        "권한 데이터가 초기화되었습니다. 페이지를 새로고침해주세요.",
      );
    };

    (window as any).cleanupChannelDiscounts = () => {
      const removedCount = cleanupDuplicateChannelDiscounts();
      if (removedCount > 0) {
        console.log(
          `${removedCount}개의 중복 할인 정보를 정리했습니다. 페이지를 새로고침해주세요.`,
        );
      } else {
        console.log("중복된 할인 정보가 없습니다.");
      }
    };

    (window as any).resetChannelDiscounts = () => {
      resetChannelDiscountsToInitial();
      console.log(
        "채널별 할인 데이터가 초기 상태로 재설정되었습니다. 페이지를 새로고침해주세요.",
      );
    };

    (window as any).resetPartners = () => {
      localStorage.removeItem("ticketing_partners");
      localStorage.removeItem("ticketing_partner_discounts");
      console.log(
        "파트너 데이터가 초기화되었습니다. 페이지를 새로고침해주세요.",
      );
      window.location.reload();
    };

    (window as any).resetSupervisors = () => {
      localStorage.removeItem("supervisors");
      console.log(
        "현장관리자 데이터가 초기화되었습니다. 페이지를 새로고침해주세요.",
      );
      window.location.reload();
    };

    (window as any).resetProducts = () => {
      resetProductsToInitial();
      console.log(
        "페이지를 새로고침하여 변경사항을 확인하세요.",
      );
      setTimeout(() => window.location.reload(), 500);
    };

    (window as any).resetAllData = () => {
      localStorage.removeItem("ticketing_partners");
      localStorage.removeItem("ticketing_partner_discounts");
      localStorage.removeItem("supervisors");
      localStorage.removeItem("erp_products");
      localStorage.removeItem("erp_product_options");
      localStorage.removeItem("erp_product_partner_discounts");
      console.log(
        "모든 데이터가 초기화되었습니다. 페이지를 새로고침해주세요.",
      );
      window.location.reload();
    };

    (window as any).resetMenus = () => {
      localStorage.removeItem("erp_admin_menus_data");
      console.log(
        "메뉴 데이터가 초기화되었습니다. 페이지를 새로고침해주세요.",
      );
      window.location.reload();
    };

    (window as any).addBannerMenu = () => {
      const menus = adminMenuStore.getMenus();
      const hasBannerMenu = menus.some(
        (m) => m.id === "menu-16",
      );
      if (!hasBannerMenu) {
        adminMenuStore.addMenu({
          id: "menu-16",
          title: "배너관리",
          titleEn: "Banner Management",
          icon: "MdImage",
          page: "banners",
          displayOrder: 6,
          visible: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        console.log(
          "배너관리 메뉴가 추가되었습니다. 페이지를 새로고침해주세요.",
        );
        window.location.reload();
      } else {
        console.log("배너관리 메뉴가 이미 존재합니다.");
      }
    };

    (window as any).resetCommunityPosts = () => {
      resetPosts();
      console.log(
        "커뮤니티 게시글 데이터가 초기화되었습니다. 페이지를 새로고침해주세요.",
      );
      window.location.reload();
    };

    (window as any).resetShopData = () => {
      localStorage.removeItem("shop-menu-categories");
      console.log("✅ 쇼핑몰 메뉴 데이터가 초기화되었습니다.");
      console.log(
        "페이지를 새로고침하면 기본 메뉴 데이터가 로드됩니다.",
      );
      window.location.reload();
    };


    console.log(
      "%c관리자 데모 계정",
      "color: #10b981; font-weight: bold; font-size: 14px;",
    );
    console.log("아이디: demo / 비밀번호: demo");
    console.log(
      "%c현장관리자 (Supervisor) 데모 계정",
      "color: #0c8ce9; font-weight: bold; font-size: 14px;",
    );
    console.log(
      "아이디: field / 비밀번호: demo (샤롯데씨어터)",
    );
    console.log(
      "아이디: manager / 비밀번호: demo (하이브 엔터테인먼트)",
    );

    console.log(
      "%c📡 채널 관리 도구",
      "color: #8b5cf6; font-weight: bold; font-size: 14px;",
    );
    console.log("window.checkChannel() - 현재 채널 상태 확인");

    const removedCount = cleanupDuplicateChannelDiscounts();
    if (removedCount > 0) {
      console.log(
        `앱 로드 시 ${removedCount}개의 중복 할인 정보가 자동으로 정리되었습니다.`,
      );
    }

  }, []);

  const handleLoginSuccess = () => {
    const user = authStore.getCurrentUser();
    if (user?.roleId === "ROLE002") {
      navigate("/admin/field-orders");
    } else {
      navigate("/admin");
    }
  };

  const getCurrentPage = (): Page => {
    const path = location.pathname
      .replace(/^\/admin\/?/, "")
      .split("/")[0];

    const validPages: Page[] = [
      "dashboard",
      "menu-management",
      "products",
      "partners",
      "orders",
      "banners",
      "channels",
      "community",
      "site-info",
      "voucher-exchange",
      "field-orders",
    ];

    if (
      path === "supervisors" ||
      path === "employees" ||
      path === "coupons"
    ) {
      return "partners";
    }

if (path === "" || !validPages.includes(path as Page)) {
      const user = authStore.getCurrentUser();
      if (user?.userType === "supervisor" || user?.userType === "field-manager" || user?.roleId === "ROLE002") {
        return "field-orders" as Page;
      }
      return "dashboard";
    }

    return path as Page;
  };

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const getBreadcrumb = (): string[] => {
    const currentPage = getCurrentPage();

    const breadcrumbs: Record<string, string[]> = {
      dashboard: ["홈", "대시보드"],
      "menu-management": ["홈", "메뉴관리"],
      products: ["홈", "상품관리"],
      partners: ["홈", "파트너관리"],
      orders: ["홈", "주문관리"],
      banners: ["홈", "배너관리"],
      channels: ["홈", "채널관리"],
      community: ["홈", "커뮤니티"],
      "site-info": ["홈", "사이트 정보"],
      "voucher-exchange": ["홈", "바우처 교환"],
    };

    return breadcrumbs[currentPage] || breadcrumbs.dashboard;
  };

  const handlePageChange = (page: Page) => {
    navigate(`/admin/${page === "dashboard" ? "" : page}`);
  };

  // Admin Layout Component
  function AdminLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    useEffect(() => {
      getAdminMenuList()
        .then((response) => {
          if (response.success && response.data) {
            console.log(
              `✅ Admin menu loaded: ${response.data.length} menus`,
            );
            adminMenuStore.setMenus(response.data);
          }
        })
        .catch((error) => {
          console.error("Failed to load admin menus:", error);
        });
    }, []);

    return (
      <DndWrapper>
        <SidebarProvider>
          <div className="flex h-screen w-full overflow-hidden">
            <AppSidebar
              currentPage={getCurrentPage()}
              onPageChange={handlePageChange}
              language={language}
              isDark={isDark}
              currentUser={currentUser}
              onUserSwitch={() =>
                setCurrentUser(
                  currentUser === "admin"
                    ? "employee"
                    : "admin",
                )
              }
            />
            <div className="flex flex-1 flex-col min-w-0">
              <AppHeader
                breadcrumb={getBreadcrumb()}
                isDark={isDark}
                onDarkModeToggle={toggleDarkMode}
              />
              <main className="flex-1 overflow-auto pt-3 sm:pt-4 px-4 sm:px-6 pb-4 sm:pb-6 bg-background">
                <Suspense fallback={<PageLoading />}>
                  {children}
                </Suspense>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </DndWrapper>
    );
  }

  // 현장관리자 여부 체크 (admin root route용)
  const isFieldUser = () => {
    const user = authStore.getCurrentUser();
    return user?.roleId === "ROLE002" ||
      user?.userType === "supervisor" ||
      user?.userType === "field-manager";
  };

  return (
    <Routes>
      {/* 로그인 페이지 */}
      <Route
        path="/login"
        element={
          <Lazy>
            <Login
              language={language}
              onLoginSuccess={handleLoginSuccess}
            />
          </Lazy>
        }
      />

      {/* 관리자 페이지 - 인증 필요 */}
      <Route
        path="/admin/*"
        element={
          <RequireAuth>
            <AdminLayout>
              <Routes>
                <Route
                  path="/"
                  element={
                    isFieldUser() ? (
                      <FieldOrders />
                    ) : (
                      <Dashboard language={language} />
                    )
                  }
                />
                <Route
                  path="/dashboard"
                  element={<Dashboard language={language} />}
                />
                <Route
                  path="/menu-management"
                  element={<MenuManagement language={language} />}
                />
                <Route
                  path="/products"
                  element={<ProductManagement />}
                />
                <Route
                  path="/products/:id/content"
                  element={<ProductContentEditor />}
                />
                <Route
                  path="/products/:id"
                  element={<ProductDetailPage />}
                />
                <Route
                  path="/partners"
                  element={<PartnerManagement language={language} />}
                />
                <Route
                  path="/partners/:id"
                  element={<PartnerDetail language={language} />}
                />
                <Route
                  path="/employees/:id"
                  element={<EmployeeDetail language={language} />}
                />
                <Route
                  path="/supervisors/:id"
                  element={<SupervisorDetail language={language} />}
                />
                <Route
                  path="/coupons/:id"
                  element={<CouponDetail language={language} />}
                />
                <Route
                  path="/orders"
                  element={<AdminOrders />}
                />
                <Route
                  path="/orders/:id"
                  element={<AdminOrderDetail />}
                />
                <Route
                  path="/field-orders"
                  element={<FieldOrders />}
                />
                <Route
                  path="/banners"
                  element={<BannerManagement />}
                />
                <Route
                  path="/channels"
                  element={<ChannelManagement language={language} />}
                />
                <Route
                  path="/community"
                  element={<CommunityManagement language={language} />}
                />
                <Route
                  path="/community/notice/new"
                  element={<NoticeEditor language={language} />}
                />
                <Route
                  path="/community/notice/:id"
                  element={<NoticeEditor language={language} />}
                />
                <Route
                  path="/community/notice/view/:id"
                  element={<NoticeDetail language={language} />}
                />
                <Route
                  path="/community/event/new"
                  element={<EventEditor language={language} />}
                />
                <Route
                  path="/community/event/:id"
                  element={<EventEditor language={language} />}
                />
                <Route
                  path="/community/event/view/:id"
                  element={<EventDetail language={language} />}
                />
                <Route
                  path="/site-info"
                  element={<SiteInfoPage language={language} />}
                />
                <Route
                  path="/voucher-exchange"
                  element={<VoucherExchange language={language} />}
                />
                <Route
                  path="/api-test"
                  element={<ApiTest language={language} />}
                />
              </Routes>
            </AdminLayout>
          </RequireAuth>
        }
      />

      {/* 쇼핑몰 페이지 (기본) */}
      <Route
        path="*"
        element={
          <ChannelProvider>
            <Suspense fallback={<PageLoading />}>
              <Routes>
                <Route
                  path="/"
                  element={<Shop language={language} />}
                />
                <Route path="/qr" element={<QrCoupon />} />
                <Route path="/barcode" element={<BarcodeCoupon />} />
                <Route
                  path="/order-lookup/:channelId/:orderNumber"
                  element={<ShopOrderDetail language={language} />}
                />
                <Route
                  path="/order-lookup"
                  element={<ShopOrderLookup language={language} />}
                />
                <Route
                  path="/inquiries"
                  element={<ShopInquiries language={language} />}
                />
                <Route
                  path="/inquiry-lookup"
                  element={<ShopInquiryLookup language={language} />}
                />
                <Route
                  path="/notices"
                  element={<ShopNotices language={language} />}
                />
                <Route
                  path="/notices/:id"
                  element={<ShopNoticeDetail language={language} />}
                />
                <Route
                  path="/faq"
                  element={<ShopFAQ language={language} />}
                />
                <Route
                  path="/events"
                  element={<ShopEvents language={language} />}
                />
                <Route
                  path="/events/:id"
                  element={<ShopEventDetail language={language} />}
                />
                <Route
                  path="/order"
                  element={<ShopOrder language={language} />}
                />
                <Route
                  path="/payment-info"
                  element={<ShopPaymentInfo language={language} />}
                />
                <Route
                  path="/payment-success"
                  element={<ShopPaymentSuccess language={language} />}
                />
                <Route
                  path="/payment-callback"
                  element={<ShopPaymentCallback language={language} />}
                />
                <Route
                  path="/payment-load"
                  element={<ShopPaymentLoad language={language} />}
                />
                <Route
                  path="/product/:productId"
                  element={<ShopProductDetail language={language} />}
                />
                <Route
                  path="/search"
                  element={<ShopSearch language={language} />}
                />
                <Route
                  path="/cart"
                  element={<ShopCart language={language} />}
                />
                <Route
                  path="/company-info"
                  element={<ShopCompanyInfo language={language} />}
                />
                <Route
                  path="/point-change"
                  element={<VoucherExchange language={language} />}
                />
                <Route
                  path="/voucher-exchange"
                  element={<VoucherExchange language={language} />}
                />
                <Route
                  path="/shop/product/:productId"
                  element={<ShopProductDetail language={language} />}
                />
                <Route
                  path="/shop/order"
                  element={<ShopOrder language={language} />}
                />
                <Route
                  path="/shop/cart"
                  element={<ShopCart language={language} />}
                />
                <Route
                  path="/shop/search"
                  element={<ShopSearch language={language} />}
                />
                <Route
                  path="/shop/:level1/:level2"
                  element={<ShopCategory language={language} />}
                />
                <Route
                  path="/shop/:level1"
                  element={<ShopCategory language={language} />}
                />
                <Route
                  path="/shop"
                  element={<Navigate to="/" replace />}
                />
                <Route
                  path="/field/ticket-scanner"
                  element={<FieldTicketScannerPage />}
                />
                <Route
                  path="/:level1"
                  element={<ShopCategory language={language} />}
                />
                <Route
                  path="/:level1/:level2"
                  element={<ShopCategory language={language} />}
                />
              </Routes>
            </Suspense>
            <ScrollToTop />
          </ChannelProvider>
        }
      />
    </Routes>
  );
}

export default function App() {
  useEffect(() => {
    logDataMode();
  }, []);

  return (
    <>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
      <Toaster
        expand={true}
        richColors
        position="bottom-center"
      />
    </>
  );
}
