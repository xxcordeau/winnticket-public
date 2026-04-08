import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { useNavigate } from "@/lib/channel-context";
import {
  TrendingUp,
  Star,
  ChevronLeft,
  ChevronRight,
  X,
  Package,
  FileText,
  Phone,
  Mail,
  ArrowUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { shopStore } from "@/data/shop-data";
import { getSiteInfo as getSiteInfoAPI } from "@/lib/api/site-info";
// 기존 쇼핑몰 상품 API 사용 (하이브리드 방식)
import {
  getShopProducts,
  type ShopProduct,
  type ShopSection,
} from "@/lib/api/product";
import { getShopBanners } from "@/lib/api/banner";
import {
  getShopPopups,
  isPopupTodayClosed,
  setPopupTodayClose,
} from "@/lib/api/popup";
import { getChannelByCode } from "@/lib/api/channel";
import { useMenuCategories } from "@/data/hooks/useShopStore";
import { ProductCard } from "@/components/product-card";
import { ShopHeader } from "@/components/shop-header";
import type {
  MenuCategory,
  Product,
  Banner,
  Promotion,
} from "@/data/dto/shop.dto";
import type { PopupResponse } from "@/data/dto/popup.dto";
import type { SiteInfoResponse } from "@/lib/api/site-info";
import { getImageUrl } from "@/lib/utils/image";

type Language = "ko" | "en";

interface ShopProps {
  language: Language;
}

export function Shop({ language }: ShopProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { visibleCategories: menuCategories } =
    useMenuCategories();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] =
    useState(0);
  const [sections, setSections] = useState<ShopSection[]>([]); // ⭐ 섹션 state 추가
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [bestProducts, setBestProducts] = useState<Product[]>(
    [],
  );
  const [saleProducts, setSaleProducts] = useState<Product[]>(
    [],
  );
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<
    string | null
  >(null);
  const [activePopups, setActivePopups] = useState<
    PopupResponse[]
  >([]);
  const [siteInfo, setSiteInfo] =
    useState<SiteInfoResponse | null>(null);

  // 스크롤 위치 상태
  const [showScrollTop, setShowScrollTop] = useState(false);

  // 현재 채널 코드 가져오기
  const currentChannelCode =
    searchParams.get("channel") || "DEFAULT";

  // 데이터 로드
  const loadShopData = async () => {
    // 배너 가져오기
    const bannerResponse = await getShopBanners("MAIN_TOP");
    if (bannerResponse.success && bannerResponse.data) {
      const now = new Date();
      
      // 배너 데이터가 배열인지 확인하고 안전하게 처리
      const bannerData = Array.isArray(bannerResponse.data) 
        ? bannerResponse.data 
        : [];
      
      const activeBanners = bannerData.filter(
        (banner) => {
          const startDate = new Date(banner.startDate);
          const endDate = banner.endDate
            ? new Date(banner.endDate)
            : null;
          return (
            banner.visible &&
            now >= startDate &&
            (!endDate || now <= endDate)
          );
        },
      );

      setBanners(
        activeBanners.map((banner) => ({
          id: banner.id,
          image: getImageUrl(banner.imageUrl) || "",
          title: banner.name,
          link: banner.linkUrl || "/",
        })),
      );
    }

    // 사이트 정보 로드
    const siteInfoResponse = await getSiteInfoAPI();
    if (siteInfoResponse.success && siteInfoResponse.data) {
      setSiteInfo(siteInfoResponse.data);
    }

    // 쇼핑몰 상품 목록 API 호출
    const productsResponse = await getShopProducts();
    if (productsResponse.success && productsResponse.data) {
      // 섹션 데이터 처리
      if (
        productsResponse.data.sections &&
        productsResponse.data.sections.length > 0
      ) {
        setSections(productsResponse.data.sections);
      } else {
        setSections([]);
      }

      // 전체 상품 데이터 처리
      const allApiProducts =
        productsResponse.data.products || [];

      // API 응답을 Product 형식으로 변환
      const apiProducts: Product[] = allApiProducts.map(
        (p) => ({
          id: p.productId || p.code,
          name: p.name,
          price: p.discountPrice || p.price,
          originalPrice: p.discountPrice ? p.price : undefined,
          discountPrice: p.discountPrice,
          discountRate: p.discountRate,
          image: getImageUrl(p.image),
          rating: 4.5,
          reviews: 0,
          sold: 0,
          badge: p.discountRate > 0 ? "sale" : undefined,
          categoryId: "",
          salesStatus: p.salesStatus,
          isSale: (p.discountRate || 0) > 0,
          thumbnailUrl: getImageUrl(p.image),
          category: "",
          description: p.usagePeriod || "",
          imageUrls: [getImageUrl(p.image)],
          stock: 100,
          soldCount: 0,
          reviewCount: 0,
          isNew: false,
          isBest: false,
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      );

      setAllProducts(apiProducts);
    } else {
      setSections([]);
      setAllProducts([]);
    }

    setPromotions([]);
  };

  // 팝업 닫기
  const closePopup = (popupId: string, hideToday: boolean) => {
    if (hideToday) {
      setPopupTodayClose(popupId);
    }
    setActivePopups((prev) =>
      prev.filter((p) => p.id !== popupId),
    );
  };

  useEffect(() => {
    loadShopData();

    // 상품 데이터가 변경될 때 재로드 (로컬스토리지 변경 감지)
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === "erp_products" ||
        e.key === "ticket_banners"
      ) {
        loadShopData();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // 같은 탭에서도 변경 감지를 위한 커텐 이벤트
    const handleProductUpdate = () => {
      loadShopData();
    };
    const handleBannerUpdate = () => {
      loadShopData();
    };
    const handlePopupUpdate = () => {
      loadShopData();
    };
    window.addEventListener(
      "productUpdated",
      handleProductUpdate,
    );
    window.addEventListener(
      "bannerUpdated",
      handleBannerUpdate,
    );
    window.addEventListener("popupUpdated", handlePopupUpdate);

    return () => {
      window.removeEventListener(
        "storage",
        handleStorageChange,
      );
      window.removeEventListener(
        "productUpdated",
        handleProductUpdate,
      );
      window.removeEventListener(
        "bannerUpdated",
        handleBannerUpdate,
      );
      window.removeEventListener(
        "popupUpdated",
        handlePopupUpdate,
      );
    };
  }, [currentChannelCode]); // 채널이 변경될 때도 데이터 다시 로드

  // 스크롤 위치 감지
  useEffect(() => {
    const handleScroll = () => {
      // 스크롤이 300px 이상 내려갔을 때 버튼 표시
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () =>
      window.removeEventListener("scroll", handleScroll);
  }, []);

  // 맨 위로 스크롤
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // 배너 자동 슬라이드
  useEffect(() => {
    if (banners.length <= 1) return;

    // 배너 배열이 변경되면 인덱스를 유효한 범위로 조정
    if (currentBannerIndex >= banners.length) {
      setCurrentBannerIndex(0);
    }

    const interval = setInterval(() => {
      setCurrentBannerIndex(
        (prev) => (prev + 1) % banners.length,
      );
    }, 5000); // 5초마다 자동 슬라이드

    return () => clearInterval(interval);
  }, [banners.length, currentBannerIndex]);

  // 배너 네비게이션
  const goToPrevBanner = () => {
    setCurrentBannerIndex(
      (prev) => (prev - 1 + banners.length) % banners.length,
    );
  };

  const goToNextBanner = () => {
    setCurrentBannerIndex(
      (prev) => (prev + 1) % banners.length,
    );
  };

  // 제품에 해당하는 프로모션 찾기
  const getProductPromotion = (
    productId: string,
  ): Promotion | undefined => {
    return promotions.find(
      (promo) =>
        promo.isActive &&
        promo.targetProducts?.includes(productId) &&
        new Date(promo.endDate) > new Date(),
    );
  };

  // 상품 클릭 핸들러
  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  // 카고리 클릭 핸들러
  const handleCategoryClick = (categoryId: string) => {
    // 모든 카테고리를 flat하게 가져오기
    const allCategories: MenuCategory[] = [];
    const flattenCategories = (cats: MenuCategory[]) => {
      cats.forEach((cat) => {
        allCategories.push(cat);
        if (cat.children) {
          flattenCategories(cat.children);
        }
      });
    };
    flattenCategories(menuCategories);

    const category = allCategories.find(
      (c) => c.id === categoryId,
    );
    if (category?.routePath) {
      // routePath가 있으면 해당 경로로 이동
      navigate(category.routePath);
      setSelectedCategory(categoryId);
    } else {
      // routePath가 없으면 선택만 처리
      setSelectedCategory(categoryId);
    }
  };

  const text = {
    ko: {
      categories: "카테고리",
      newProducts: "신상품",
      bestProducts: "베스트",
      saleProducts: "특가",
      allProducts: "전체 상품",
      viewAll: "전체보기",
      sold: "판매",
      reviews: "리뷰",
      discount: "할인",
      customerService: "고객센터",
    },
    en: {
      categories: "Categories",
      newProducts: "New Arrivals",
      bestProducts: "Best Sellers",
      saleProducts: "On Sale",
      allProducts: "All Products",
      viewAll: "View All",
      sold: "Sold",
      reviews: "Reviews",
      discount: "OFF",
      customerService: "Customer Service",
    },
  };

  const t = text[language];

  const formatPrice = (price: number) => {
    return price.toLocaleString("ko-KR");
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <ShopHeader language={language} />

      {/* Main Content - 헤더 높이만큼 상단 여백 */}
      <main className="max-w-7xl mx-auto px-0 sm:px-4 lg:px-6 pt-2 pb-4 sm:pb-6">
        {/* Banner Carousel */}
        {banners.length > 0 && banners[currentBannerIndex] && (
          <div className="mb-6 sm:mb-10 rounded-xl overflow-hidden relative group mx-4 sm:mx-0">
            <div
              className={`relative h-[180px] sm:h-[220px] md:h-[280px] ${banners[currentBannerIndex].link && banners[currentBannerIndex].link !== "/" ? "cursor-pointer" : ""}`}
              onClick={() => {
                const banner = banners[currentBannerIndex];
                if (banner.link && banner.link !== "/") {
                  // 외부 링크인지 내부 링크인지 확인
                  if (
                    banner.link.startsWith("http://") ||
                    banner.link.startsWith("https://")
                  ) {
                    window.open(
                      banner.link,
                      "_blank",
                      "noopener,noreferrer",
                    );
                  } else {
                    navigate(banner.link);
                  }
                }
              }}
            >
              <img
                src={banners[currentBannerIndex].image}
                alt={banners[currentBannerIndex].title}
                className="w-full h-full object-cover bg-gray-100"
                onError={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
              />
              {(banners[currentBannerIndex].title ||
                banners[currentBannerIndex].subtitle) && (
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-center pointer-events-none">
                  <div className="text-white px-8 md:px-16">
                    <h2 className="text-3xl md:text-5xl mb-2">
                      {banners[currentBannerIndex].title}
                    </h2>
                    <p className="text-lg md:text-xl mb-4">
                      {banners[currentBannerIndex].subtitle}
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              {banners.length > 1 && (
                <>
                  <button
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition-all opacity-0 group-hover:opacity-100 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToPrevBanner();
                    }}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition-all opacity-0 group-hover:opacity-100 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToNextBanner();
                    }}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}

              {/* Indicators */}
              {banners.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {banners.map((_, index) => (
                    <button
                      key={index}
                      className={`h-2 w-2 rounded-full transition-all ${
                        index === currentBannerIndex
                          ? "bg-white w-8"
                          : "bg-white/50 hover:bg-white/75"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentBannerIndex(index);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* New Products */}
        {newProducts.length > 0 && (
          <section className="mb-24">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-3xl">{t.newProducts}</h2>
            </div>
            <ProductCarousel
              products={newProducts}
              getProductPromotion={getProductPromotion}
              handleProductClick={handleProductClick}
            />
          </section>
        )}

        {/* Best Products */}
        {bestProducts.length > 0 && (
          <section className="mb-24">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-3xl">{t.bestProducts}</h2>
            </div>
            <ProductCarousel
              products={bestProducts}
              getProductPromotion={getProductPromotion}
              handleProductClick={handleProductClick}
            />
          </section>
        )}

        {/* Sale Products */}
        {saleProducts.length > 0 && (
          <section className="mb-24">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-3xl">{t.saleProducts}</h2>
            </div>
            <ProductCarousel
              products={saleProducts}
              getProductPromotion={getProductPromotion}
              handleProductClick={handleProductClick}
            />
          </section>
        )}

        {/* ⭐ 섹션별 상품 (핫템, 추천 등) */}
        {sections.length > 0 &&
          sections.map((section, index) => {
            // ShopProduct를 Product 변환
            const sectionProducts: Product[] =
              section.products.map((p) => ({
                id: p.productId || p.code, // ⭐ productId (UUID) 우선, 없으면 code 사용
                name: p.name,
                price: p.discountPrice || p.price,
                originalPrice: p.discountPrice
                  ? p.price
                  : undefined,
                discountPrice: p.discountPrice,
                discountRate: p.discountRate,
                image: getImageUrl(p.image), // ⭐ 이미지 URL 변환
                rating: 4.5,
                reviews: 0,
                sold: 0,
                badge: p.discountRate > 0 ? "sale" : undefined,
                categoryId: "",
                salesStatus: p.salesStatus,
                isSale: (p.discountRate || 0) > 0,
                thumbnailUrl: getImageUrl(p.image), // ⭐ 썸네일 URL 변환
                category: "",
                description: p.usagePeriod || "",
                imageUrls: [getImageUrl(p.image)], // ⭐ 이미지 URL 배열 변환
                stock: 100,
                soldCount: 0,
                reviewCount: 0,
                isNew: false,
                isBest: false,
                tags: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }));

            return (
              <section
                key={section.sectionId}
                className={`mb-8 sm:mb-14 ${index === 0 ? "mt-8 sm:mt-12" : ""}`}
              >
                <div className="flex items-center justify-between mb-3 sm:mb-5 px-4 sm:px-0">
                  <h2 className="text-2xl sm:text-3xl">
                    {section.sectionName}
                  </h2>
                </div>
                <ProductCarousel
                  products={sectionProducts}
                  getProductPromotion={getProductPromotion}
                  handleProductClick={handleProductClick}
                />
              </section>
            );
          })}

        {/* All Products */}
        {allProducts.length > 0 && (
          <section className="mb-8 sm:mb-14">
            <div className="flex items-center justify-between mb-3 sm:mb-5 px-4 sm:px-6 lg:px-0">
              <h1 className="text-2xl sm:text-3xl">
                모든 티켓
              </h1>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0.5 gap-y-8 sm:gap-2 sm:gap-y-10 md:gap-3 md:gap-y-12">
              {allProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  promotion={getProductPromotion(product.id)}
                  onClick={() => handleProductClick(product.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* No Products Message */}
        {allProducts.length === 0 &&
          newProducts.length === 0 &&
          bestProducts.length === 0 &&
          saleProducts.length === 0 && (
            <section className="mb-16">
              <div className="flex flex-col items-center justify-center py-20">
                <Package className="h-24 w-24 text-muted-foreground mb-4" />
                <p className="text-xl text-muted-foreground mb-2">
                  {language === "ko"
                    ? "등록된 상품이 없습니다"
                    : "No products available"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === "ko"
                    ? " 새로운 상품이 추가될 예정입니다"
                    : "New products will be added soon"}
                </p>
              </div>
            </section>
          )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-4">
                {t.customerService}
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {siteInfo?.customerServiceTel || siteInfo?.tel || "1588-0000"}
                </div>
                {(siteInfo?.customerServiceEmail || siteInfo?.email) && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {siteInfo?.customerServiceEmail || siteInfo?.email}
                  </div>
                )}
                {siteInfo?.businessHours && (
                  <p className="mt-1">{siteInfo.businessHours}</p>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">회사정보</h3>
              {siteInfo && (
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>{siteInfo.companyName}</li>
                  <li>대표: {siteInfo.ceoName}</li>
                  <li>
                    사업자등록번호: {siteInfo.businessNumber}
                  </li>
                  <li>
                    통신판매업: {siteInfo.onlineMarketingNumber}
                  </li>
                  {siteInfo.address && (
                    <li>주소: {siteInfo.address}{siteInfo.addressDetail ? ` ${siteInfo.addressDetail}` : ""}</li>
                  )}
                </ul>
              )}
            </div>
          </div>
          <div className="text-center text-sm text-muted-foreground mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            © {new Date().getFullYear()} {siteInfo?.companyName || "Winnticket"}. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Popups */}
      {activePopups.map((popup, index) => (
        <PopupModal
          key={popup.id}
          popup={popup}
          index={index}
          onClose={closePopup}
        />
      ))}

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-full p-3 shadow-lg transition-all border border-gray-200 dark:border-gray-700"
          onClick={scrollToTop}
        >
          <ArrowUp className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}

// Popup Modal Component
interface PopupModalProps {
  popup: PopupResponse;
  index: number;
  onClose: (popupId: string, hideToday: boolean) => void;
}

function PopupModal({
  popup,
  index,
  onClose,
}: PopupModalProps) {
  const [hideToday, setHideToday] = useState(false);

  const handleClose = () => {
    onClose(popup.id, hideToday);
  };

  const handleImageClick = () => {
    if (popup.linkUrl) {
      window.location.href = popup.linkUrl;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 md:bg-transparent md:inset-auto md:items-start md:justify-start"
      style={{
        zIndex: 1000 + index,
        ...(window.innerWidth >= 768
          ? {
              top: `${100 + index * 40}px`,
              left: `${100 + index * 40}px`,
            }
          : {}),
      }}
    >
      <div className="bg-white rounded-lg shadow-2xl overflow-hidden w-full max-w-[400px] max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Popup Image */}
        <div
          className={`w-full overflow-auto ${popup.linkUrl ? "cursor-pointer" : ""}`}
          onClick={handleImageClick}
        >
          <img
            src={getImageUrl(popup.imageUrl)}
            alt={popup.title}
            className="w-full h-auto object-contain"
          />
        </div>

        {/* Footer */}
        <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`hideToday-${popup.id}`}
              checked={hideToday}
              onCheckedChange={(checked) =>
                setHideToday(checked === true)
              }
            />
            <label
              htmlFor={`hideToday-${popup.id}`}
              className="text-sm cursor-pointer select-none"
            >
              오늘 하루 보지 않기
            </label>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
          >
            닫기
          </Button>
        </div>
      </div>
    </div>
  );
}

// Product Carousel Component
interface ProductCarouselProps {
  products: Product[];
  getProductPromotion: (
    productId: string,
  ) => Promotion | undefined;
  handleProductClick: (productId: string) => void;
}

function ProductCarousel({
  products,
  getProductPromotion,
  handleProductClick,
}: ProductCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } =
      scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(
      scrollLeft < scrollWidth - clientWidth - 10,
    );
  };

  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScroll);
      return () =>
        container.removeEventListener("scroll", checkScroll);
    }
  }, [products]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const scrollAmount =
      scrollContainerRef.current.clientWidth * 0.8;
    scrollContainerRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // 5개 이하면 그리드로 표시
  if (products.length <= 5) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0.5 gap-y-8 sm:gap-2 sm:gap-y-10 md:gap-3 md:gap-y-12">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            promotion={getProductPromotion(product.id)}
            onClick={() => handleProductClick(product.id)}
          />
        ))}
      </div>
    );
  }

  // 5개 초과면 캐러셀로 표시
  return (
    <div className="relative group">
      <div
        ref={scrollContainerRef}
        className="flex gap-0.5 sm:gap-2 md:gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="flex-none w-[calc(50%-1px)] sm:w-[calc(50%-4px)] md:w-[calc(33.333%-5.33px)] lg:w-[calc(25%-6px)]"
          >
            <ProductCard
              product={product}
              promotion={getProductPromotion(product.id)}
              onClick={() => handleProductClick(product.id)}
            />
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      {canScrollLeft && (
        <button
          className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-lg p-3 shadow-lg transition-all z-10 border border-gray-200 dark:border-gray-700"
          onClick={() => scroll("left")}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      {canScrollRight && (
        <button
          className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-lg p-3 shadow-lg transition-all z-10 border border-gray-200 dark:border-gray-700"
          onClick={() => scroll("right")}
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
export default Shop;
