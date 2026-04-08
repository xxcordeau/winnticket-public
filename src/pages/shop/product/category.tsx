import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useParams } from "react-router";
import { useNavigate } from "@/lib/channel-context";
import { ShopHeader } from "@/components/shop-header";
import { ProductCard } from "@/components/product-card";
import { Filter, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { getShopProductsByCategory, type ShopProduct } from "@/lib/api/product";
import type { Product } from "@/data/dto/shop.dto";
import { shopStore } from "@/data/shop-data";
import { getImageUrl } from "@/lib/utils/image"; // ⭐ 이미지 URL 변환 유틸리티 임포트

type Language = "ko" | "en";

interface ShopCategoryProps {
  language: Language;
}

export function ShopCategory({ language }: ShopCategoryProps) {
  const navigate = useNavigate();
  const { level1, level2 } = useParams<{ level1?: string; level2?: string }>();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [categoryName, setCategoryName] = useState<string>("");
  const [sortBy, setSortBy] = useState("popular");

  const text = {
    ko: {
      allProducts: "전체 상품",
      filters: "필터",
      sortBy: "정렬",
      priceAsc: "가격 낮은순",
      priceDesc: "가격 높은순",
      newest: "최신순",
      popular: "인기순",
      noProducts: "상품이 없습니다.",
    },
    en: {
      allProducts: "All Products",
      filters: "Filters",
      sortBy: "Sort By",
      priceAsc: "Price: Low to High",
      priceDesc: "Price: High to Low",
      newest: "Newest",
      popular: "Popular",
      noProducts: "No products found.",
    },
  };

  const t = text[language];

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        if (!level1) {
          setProducts([]);
          setLoading(false);
          return;
        }

        // ⭐ 카테고리 이름 가져오기
        const categoriesResponse = shopStore.getMenuCategoriesFlat();
        if (categoriesResponse.success && categoriesResponse.data) {
          const targetCode = level2 || level1;
          const category = categoriesResponse.data.find(cat => cat.code === targetCode);
          if (category) {
            setCategoryName(category.name);
          } else {
            setCategoryName(targetCode); // 못 찾으면 코드 그대로 표시
          }
        }

        const response = await getShopProductsByCategory(level1, level2);
        
        if (response.success && response.data) {
          // response.data is ShopProductsResponse with { sections, products }
          const shopProducts = response.data.products || [];
          
          // Convert ShopProduct to Product format
          const convertedProducts: Product[] = shopProducts.map((item: ShopProduct) => ({
            id: item.productId || item.code,
            name: item.name,
            price: item.discountPrice || item.price,
            originalPrice: item.price,
            discountPrice: item.discountPrice,
            discountRate: item.discountRate,
            image: getImageUrl(item.image || ""), // ⭐ 이미지 URL 변환
            thumbnailUrl: getImageUrl(item.image || ""), // ⭐ ProductCard가 사용하는 필수 속성
            category: "",
            rating: 4.5,
            reviews: 0,
            reviewCount: 0,
            badge: item.discountRate > 0 ? `${item.discountRate}%` : undefined,
            description: item.usagePeriod || "",
            salesStatus: item.salesStatus,
            isSale: (item.discountRate || 0) > 0,
            categoryId: "",
            imageUrls: [getImageUrl(item.image || "")],
            stock: 100,
            soldCount: 0,
            isNew: false,
            isBest: false,
            tags: [],
            displayOrder: item.displayOrder ?? 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));

          setProducts(convertedProducts);
        }
      } catch (error) {
        console.error("Failed to load category products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [level1, level2]);

  const sortedProducts = useMemo(() => {
    const sorted = [...products];
    switch (sortBy) {
      case "popular":
        return sorted.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
      case "newest":
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case "price-asc":
        return sorted.sort((a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price));
      case "price-desc":
        return sorted.sort((a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price));
      default:
        return sorted;
    }
  }, [products, sortBy]);

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  const categoryTitle = categoryName || t.allProducts;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <ShopHeader language={language} />
      
      <div className="max-w-7xl mx-auto px-0 sm:px-4 py-4 sm:py-8">
        {/* Category Header */}
        <div className="mb-6 px-4 sm:px-0">
          <h1 className="text-3xl font-bold mb-2">{categoryTitle}</h1>
          <p className="text-muted-foreground">
            {products.length} {language === "ko" ? "개 상품" : "products"}
          </p>
        </div>

        {/* Filters and Sort */}
        <div className="flex items-center justify-between mb-6 px-4 sm:px-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {t.filters}
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">{t.sortBy}:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger size="sm" className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">{t.popular}</SelectItem>
                <SelectItem value="newest">{t.newest}</SelectItem>
                <SelectItem value="price-asc">{t.priceAsc}</SelectItem>
                <SelectItem value="price-desc">{t.priceDesc}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0.5 sm:gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-muted rounded-lg mb-2" />
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0.5 gap-y-8 sm:gap-2 sm:gap-y-10 md:gap-3 md:gap-y-12">
            {sortedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => handleProductClick(product.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t.noProducts}</p>
          </div>
        )}
      </div>
    </div>
  );
}
export default ShopCategory;
