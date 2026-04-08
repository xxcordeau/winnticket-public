import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { useNavigate } from "@/lib/channel-context";
import { Search, X, Filter, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { shopStore } from "@/data/shop-data";
import { ProductCard } from "@/components/product-card";
import { ShopHeader } from "@/components/shop-header";
import type { Product } from "@/data/dto/shop.dto";
// 기존 쇼핑몰 상품 API 사용 (하이브리드 방식)
import { searchShopProducts, type ShopProduct } from "@/lib/api/product";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getImageUrl } from "@/lib/utils/image"; // ⭐ 이미지 URL 변환 유틸리티 임포트

type Language = "ko" | "en";

interface ShopSearchProps {
  language: Language;
}

export function ShopSearch({ language }: ShopSearchProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<string>("recent");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const text = {
    ko: {
      searchResults: "검색 결과",
      searchPlaceholder: "상품 검색",
      noResults: "검색 결과가 없습니다",
      noResultsDesc: "다른 검색어로 다시 시도해보세요",
      resultsCount: "개의 상품을 찾았습니다",
      sortBy: "정렬",
      sortRecent: "최신순",
      sortPriceLow: "낮은 가격순",
      sortPriceHigh: "높은 가격순",
      sortName: "이름순",
      category: "카테고리",
      allCategories: "전체",
      concert: "콘서트",
      musical: "뮤지컬",
      sports: "스포츠",
      exhibition: "전시",
      classic: "클래식",
    },
    en: {
      searchResults: "Search Results",
      searchPlaceholder: "Search products",
      noResults: "No results found",
      noResultsDesc: "Please try a different search term",
      resultsCount: "products found",
      sortBy: "Sort by",
      sortRecent: "Recent",
      sortPriceLow: "Price: Low to High",
      sortPriceHigh: "Price: High to Low",
      sortName: "Name",
      category: "Category",
      allCategories: "All",
      concert: "Concert",
      musical: "Musical",
      sports: "Sports",
      exhibition: "Exhibition",
      classic: "Classic",
    },
  };

  const t = text[language];

  useEffect(() => {
    if (query) {
      performSearch(query);
    } else {
      setSearchResults([]);
    }
  }, [query, categoryFilter, sortBy]);

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    
    // ⭐ API 연동: 상품 검색 (GET /api/product/shop/search?name=검색어)
    const productsResponse = await searchShopProducts(searchQuery);
    
    if (productsResponse.success && productsResponse.data) {
      // ⭐ data가 직접 ShopProduct[] 배열
      const shopProducts = productsResponse.data;
      
      console.log('[Shop Search] 🔍 검색 API 응답:', shopProducts.length, '개 상품');
      
      // API 응답을 Product 형식으로 변환
      const apiProducts: Product[] = shopProducts.map(p => ({
        id: p.productId || p.code, // ⭐ productId (UUID) 우선, 없으면 code 사용
        name: p.name,
        price: p.discountPrice || p.price, // 할인가가 있으면 할인가를 price로
        originalPrice: p.discountPrice ? p.price : undefined, // 할인가가 있으면 원가를 originalPrice로
        discountPrice: p.discountPrice,
        discountRate: p.discountRate,
        image: getImageUrl(p.image), // ⭐ 이미지 URL 변환
        rating: 4.5,
        reviews: 0,
        sold: 0,
        badge: p.discountRate > 0 ? 'sale' : undefined,
        categoryId: '',
        salesStatus: p.salesStatus,
        isSale: (p.discountRate || 0) > 0, // 할인율이 있으면 세일 상품
        thumbnailUrl: getImageUrl(p.image), // 썸네일 URL 추가
        category: '', // 카테고리 이름
        description: p.usagePeriod || '',
        imageUrls: [getImageUrl(p.image)],
        stock: 100,
        soldCount: 0,
        reviewCount: 0,
        isNew: false,
        isBest: false,
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      
      // 카테고리 필터링 (로컬)
      const filtered = categoryFilter !== 'all' 
        ? apiProducts.filter(p => p.categoryId === categoryFilter)
        : apiProducts;
      
      // 정렬
      const sorted = sortProducts(filtered, sortBy);
      
      console.log('[Shop Search] ✅ 최종 결과:', sorted.length, '개 상품');
      setSearchResults(sorted);
    } else {
      // API 실패 시 로컬 데이터 폴백
      console.log('[Shop Search] ⚠️ API 실패, 로컬 데이터 사용');
      const response = shopStore.getShopMainData();
      
      if (response.success) {
        let allProducts = response.data.allProducts;
        
        // 검색어로 필터링
        const filtered = allProducts.filter((product) => {
          const searchLower = searchQuery.toLowerCase();
          const matchesQuery =
            product.name.toLowerCase().includes(searchLower) ||
            product.description?.toLowerCase().includes(searchLower) ||
            product.venue?.toLowerCase().includes(searchLower);
          
          // 카테고리 필터링
          const matchesCategory = 
            categoryFilter === "all" || product.category === categoryFilter;
          
          return matchesQuery && matchesCategory;
        });
        
        // 정렬
        const sorted = sortProducts(filtered, sortBy);
        
        setSearchResults(sorted);
      }
    }
    
    setIsLoading(false);
  };

  const sortProducts = (products: Product[], sortType: string): Product[] => {
    const sorted = [...products];
    
    switch (sortType) {
      case "recent":
        return sorted.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
      case "priceLow":
        return sorted.sort((a, b) => a.price - b.price);
      case "priceHigh":
        return sorted.sort((a, b) => b.price - a.price);
      case "name":
        return sorted.sort((a, b) => a.name.localeCompare(b.name, language));
      default:
        return sorted;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      <ShopHeader language={language} />
      
      <main className="max-w-7xl mx-auto px-0 sm:px-4 lg:px-6 py-6 md:py-8">
        {/* 검색어 표시 */}
        <div className="mb-6 px-2 sm:px-0">
          <h1 className="text-xl md:text-2xl mb-2">
            {t.searchResults}
            {query && (
              <span className="ml-2 text-primary">"{query}"</span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            {searchResults.length} {t.resultsCount}
          </p>
        </div>

        {/* 필터 및 정렬 */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 px-2 sm:px-0">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={t.category} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.allCategories}</SelectItem>
              <SelectItem value="CONCERT">{t.concert}</SelectItem>
              <SelectItem value="MUSICAL">{t.musical}</SelectItem>
              <SelectItem value="SPORTS">{t.sports}</SelectItem>
              <SelectItem value="EXHIBITION">{t.exhibition}</SelectItem>
              <SelectItem value="CLASSIC">{t.classic}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={t.sortBy} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">{t.sortRecent}</SelectItem>
              <SelectItem value="priceLow">{t.sortPriceLow}</SelectItem>
              <SelectItem value="priceHigh">{t.sortPriceHigh}</SelectItem>
              <SelectItem value="name">{t.sortName}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 검색 결과 */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <Ticket className="h-16 w-16 mx-auto mb-4 animate-spin text-rose-600 fill-rose-200" strokeWidth={1.5} />
              <p className="text-muted-foreground">검색 중...</p>
            </div>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-0.5 gap-y-8 sm:gap-2 sm:gap-y-10 md:gap-3 md:gap-y-12 lg:gap-3 lg:gap-y-12">
            {searchResults.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => navigate(`/product/${product.id}`)}
              />
            ))}
          </div>
        ) : query ? (
          <div className="flex flex-col items-center justify-center py-12 md:py-16">
            <Search className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg md:text-xl mb-2">{t.noResults}</h3>
            <p className="text-sm text-muted-foreground mb-6">{t.noResultsDesc}</p>
            <Button onClick={() => navigate("/")}>
              쇼핑몰 홈으로
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 md:py-16">
            <Search className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg md:text-xl mb-2">검색어를 입력해주세요</h3>
          </div>
        )}
      </main>
    </div>
  );
}
export default ShopSearch;
