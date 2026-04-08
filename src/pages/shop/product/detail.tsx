import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { useNavigate } from "@/lib/channel-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShoppingCart,
  Minus,
  Plus,
  ArrowLeft,
  Truck,
  Shield,
  RefreshCw,
  CalendarClock,
  X,
  Ticket,
  Info,
} from "lucide-react";
import { shopStore } from "@/data/shop-data";
import { getProducts } from "@/data/products";
// 쇼핑몰 상품 API 사용 (하이브리드 방식)
import {
  getProductById,
  getShopProductDetail,
  type ProductDetail as ProductDetailType,
  type ShopProductDetail as ShopProductDetailType,
} from "@/lib/api/product";
import {
  addToCart,
  type AddToCartRequest,
} from "@/lib/api/shop-cart";
import { ShopHeader } from "@/components/shop-header";
import type { Product as ShopProduct } from "@/data/dto/shop.dto";
import {
  Product as ProductData,
  ProductOption,
} from "@/data/dto/product.dto";
import { toast } from "sonner";
import { ShopStayProductOptions } from "./stay-product-options";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  getImageUrl,
  getImageUrls,
} from "@/lib/utils/image";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";

// 마크다운을 HTML로 변환하는 수
const renderMarkdown = (md: string) => {
  let html = md;

  // 먼저 이미지 변환 (링크보다 먼저 처리해야 함)
  html = html.replace(
    /!\[([^\]]*)\]\(([^\)]+)\)/g,
    '<img src="$2" alt="$1" style="width: 100%; height: auto; border-radius: 0.5rem; margin: 1rem 0; display: block;" />',
  );

  // 링크
  html = html.replace(
    /\[([^\]]+)\]\(([^\)]+)\)/g,
    '<a href="$2" style="color: #2563eb; text-decoration: underline;">$1</a>',
  );

  // 헤딩 (h3부터 처리해야 h1으로 잘못 매칭되지 않음)
  html = html.replace(
    /^### (.*$)/gim,
    '<h3 style="font-size: 1.25em; font-weight: bold; margin: 1rem 0;">$1</h3>',
  );
  html = html.replace(
    /^## (.*$)/gim,
    '<h2 style="font-size: 1.5em; font-weight: bold; margin: 1.25rem 0;">$1</h2>',
  );
  html = html.replace(
    /^# (.*$)/gim,
    '<h1 style="font-size: 2em; font-weight: bold; margin: 1.5rem 0;">$1</h1>',
  );

  // 볼드와 이탤릭 (***가 가장 먼저)
  html = html.replace(
    /\*\*\*(.+?)\*\*\*/g,
    "<strong><em>$1</em></strong>",
  );
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // 코드 블록
  html = html.replace(
    /```([^`]+)```/g,
    '<pre style="background-color: #f3f4f6; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0; overflow-x: auto;"><code>$1</code></pre>',
  );

  // 인라인 코드
  html = html.replace(
    /`([^`]+)`/g,
    '<code style="background-color: #f3f4f6; padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-size: 0.875rem;">$1</code>',
  );

  // 인용구
  html = html.replace(
    /^> (.*$)/gim,
    '<blockquote style="border-left: 4px solid #d1d5db; padding-left: 1rem; font-style: italic; margin: 1rem 0; color: #6b7280;">$1</blockquote>',
  );

  // 리 (순서 있는 것과 없는 것 구분)
  html = html.replace(
    /^\d+\. (.*$)/gim,
    '<li style="margin-left: 2rem; list-style-type: decimal;">$1</li>',
  );
  html = html.replace(
    /^\* (.*$)/gim,
    '<li style="margin-left: 2rem; list-style-type: disc;">$1</li>',
  );

  // 구분선
  html = html.replace(
    /^---$/gim,
    '<hr style="margin: 2rem 0; border: none; border-top: 1px solid #e5e7eb;" />',
  );

  // 줄바꿈 (마지막에 처리)
  html = html.replace(/\n/g, "<br />");

  return html;
};

interface ShopProductDetailProps {
  language?: "ko" | "en";
}

// 선택된 옵션 항목 인터페이스
interface SelectedOptionItem {
  id: string; // 고유 ID (timestamp + random)
  optionText: string; // 표시할 옵션 텍스트
  optionValues: Record<string, string>; // 옵션 ID -> 값 ID 매핑
  quantity: number;
  unitPrice: number; // 기본가 + 옵션 추가금
}

export function ShopProductDetail({
  language = "ko",
}: ShopProductDetailProps) {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<ShopProduct | null>(
    null,
  );
  const [productDetail, setProductDetail] =
    useState<ProductData | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);

  // 옵션 선택용 (임시)
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});

  // 선택 옵션 항목 목록
  const [selectedItems, setSelectedItems] = useState<
    SelectedOptionItem[]
  >([]);

  // 숙박형 상품 선택 정보
  const [stayProductSelection, setStayProductSelection] =
    useState<{
      optionValues: Record<string, string>;
      dateRange: { from: Date; to: Date };
      totalPrice: number;
      priceBreakdown: { date: string; price: number }[];
    } | null>(null);

  // 헤더 높이 계산
  const [headerHeight, setHeaderHeight] = useState(0);

  // 모바일 옵션 시트 상태
  const [showMobileOptions, setShowMobileOptions] =
    useState(false);

  useEffect(() => {
    // 헤더 높이 측정 (더 정확하게)
    const updateHeaderHeight = () => {
      const header = document.querySelector("header");
      if (header) {
        // getBoundingClientRect를 사용하여 실제 렌더링된 높이를 가져옴
        const rect = header.getBoundingClientRect();
        const height = rect.height;
        setHeaderHeight(height);
      }
    };

    // 초기 측정 - 여러  서 도 향상
    updateHeaderHeight();

    // 렌더링 완료 후 측정
    setTimeout(updateHeaderHeight, 100);
    setTimeout(updateHeaderHeight, 300);
    setTimeout(updateHeaderHeight, 500);

    // requestAnimationFrame으로도 측정
    requestAnimationFrame(() => {
      requestAnimationFrame(updateHeaderHeight);
    });

    // 리사이즈 이벤트 리스너 (디바운스 적용)
    let resizeTimer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        updateHeaderHeight();
      }, 100);
    };

    window.addEventListener("resize", handleResize);

    // MutationObserver로 헤더 내부 변경 감지 (메뉴 표시/숨김 등)
    const header = document.querySelector("header");
    if (header) {
      const observer = new MutationObserver(() => {
        updateHeaderHeight();
      });

      observer.observe(header, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "style"],
      });

      return () => {
        window.removeEventListener("resize", handleResize);
        observer.disconnect();
        clearTimeout(resizeTimer);
      };
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  useEffect(() => {
    if (!productId) {
      navigate("/");
      return;
    }

    const loadProduct = async () => {
      // 쇼핑몰 상품 정보 가져오기 - 모든 상품에서 검색
      const allProductsResponse = shopStore.getAllProducts();

      let foundProduct: ShopProduct | null = null;

      if (allProductsResponse.success) {
        foundProduct =
          allProductsResponse.data.find(
            (p) => p.id === productId,
          ) || null;
      }

      // 상품 상세 정보 가져오기 (API 우선, 실패 시 로컬 데이터)
      try {
        // ⭐ 쇼핑몰 상품 상세 API 호출 (type 필드 제공)
        const apiResponse =
          await getShopProductDetail(productId);

        if (apiResponse.success && apiResponse.data) {
          // API 응답을 ProductData 형식으로 변환
          const imageUrls = apiResponse.data.imageUrl || [];

          // 옵션 데이터
          let options: ProductOption[] = [];
          if (
            apiResponse.data.options &&
            Array.isArray(apiResponse.data.options)
          ) {
            options = apiResponse.data.options.map(
              (opt: any, optIndex: number) => ({
                id: opt.id,
                name: opt.name,
                code: opt.code,
                priceType: opt.priceType, // ⭐ API에서 priceType 포함 (옵션 레벨)
                values: opt.values.map(
                  (val: any, valIndex: number) => ({
                    id: val.id,
                    optionId: opt.id,
                    value: val.value,
                    code: val.code,
                    additionalPrice: val.additionalPrice || 0,
                    displayOrder: valIndex,
                    visible: true,
                  }),
                ),
                required: opt.required !== false,
                displayOrder: optIndex,
                visible: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }),
            );
          }

          // 날짜별 가격 이터 변환
          const datePrices =
            apiResponse.data.datePrices?.map((dp: any) => ({
              optionValueId: dp.optionValueId,
              optionValueName: dp.optionValueName,
              startDate: dp.priceDate, // priceDate를 startDate로 매핑
              endDate: dp.priceDate, // 1일 단위이므로 같은 날짜
              price: dp.price,
              discountPrice: dp.discountPrice,
            })) || [];

          const detail: ProductData = {
            id: apiResponse.data.id, // ⭐ API 응답의 실제 UUID 사용
            code: apiResponse.data.code,
            name: apiResponse.data.name,
            categoryId: "",
            categoryName: apiResponse.data.categoryName,
            partnerId: undefined,
            partnerName: undefined,
            productType: apiResponse.data.type, // ⭐ type을 productType으로 매핑
            description: apiResponse.data.description,
            imageUrls: imageUrls,
            price: apiResponse.data.price,
            discountPrice: apiResponse.data.discountPrice,
            stock: 999,
            salesStatus: apiResponse.data.salesStatus || "ON_SALE",
            salesStartDate: undefined,
            salesEndDate: undefined,
            displayOrder: 0,
            visible: true,
            shippingInfo: apiResponse.data.shippingInfo,
            warrantyInfo: apiResponse.data.warrantyInfo,
            returnInfo: apiResponse.data.returnInfo,
            usagePeriod: (apiResponse.data as any).usagePeriod, // ⭐ 유효기간 추가
            detailContent: apiResponse.data.detailContent,
            detailImages: [],
            sections: undefined,
            options: options,
            datePrices: datePrices, // ⭐ 날짜별 가격 추가
            sms: undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setProductDetail(detail);

          // API에서 받은 데이터로 Shop 상품 정보도 업데이트
          if (!foundProduct) {
            foundProduct = {
              id: productId,
              name: apiResponse.data.name,
              categoryId: "",
              category: apiResponse.data.categoryName || "기타",
              price:
                apiResponse.data.discountPrice ||
                apiResponse.data.price,
              originalPrice: apiResponse.data.discountPrice
                ? apiResponse.data.price
                : undefined,
              discountRate: apiResponse.data.discountRate,
              description: apiResponse.data.description || "",
              thumbnailUrl: imageUrls[0] || "",
              imageUrls: imageUrls,
              stock: 999,
              soldCount: 0,
              rating: 4.5,
              reviewCount: 0,
              isNew: false,
              isBest: false,
              isSale: !!apiResponse.data.discountPrice,
              salesStatus: apiResponse.data.salesStatus || "ON_SALE", // ⭐ 판매상태 매핑
              tags: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          } else {
            // ⭐ 기존 foundProduct에도 salesStatus 반영
            foundProduct.salesStatus = apiResponse.data.salesStatus || foundProduct.salesStatus;
          }
        } else {
          // API 실패 시 로컬 데이터 사용
          const productsResponse = getProducts(0, 1000);
          if (productsResponse.success) {
            const detail = productsResponse.data.content.find(
              (p) => p.id === productId,
            );
            setProductDetail(detail || null);
          }
        }
      } catch (error) {
        // 하이브리드 방식: API 실패는 정상 동작이므로 조용히 로컬 데이터로 백
        const productsResponse = getProducts(0, 1000);
        if (productsResponse.success) {
          const detail = productsResponse.data.content.find(
            (p) => p.id === productId,
          );
          setProductDetail(detail || null);
        }
      }

      // 상품을 찾지 못한 경우에만 리다이렉트
      if (!foundProduct) {
        toast.error("상품을 찾을 수 없습니다.");
        navigate("/");
        return;
      }

      // ⭐ 아이유 콘서트인 경우 카테고리 임의 설정
      if (productId === "IU_CONCERT_2025") {
        foundProduct.category = "콘서트";
      }

      setProduct(foundProduct);
      setLoading(false);
    };

    loadProduct();
  }, [productId, navigate]);

  if (loading || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner
          size="lg"
          text="상품 정보를 불러오는 중..."
        />
      </div>
    );
  }

  const hasDiscount =
    product.isSale &&
    product.discountRate &&
    product.originalPrice;

  // 상품 이미지 목록 (imageUrls 우선, 없으면 thumbnailUrl과 detailImages 사용)
  const rawImages =
    productDetail?.imageUrls &&
    productDetail.imageUrls.length > 0
      ? productDetail.imageUrls.filter(
          (url): url is string =>
            typeof url === "string" && url.length > 0,
        )
      : [
          product.thumbnailUrl,
          ...(productDetail?.detailImages || []),
        ].filter(
          (url): url is string =>
            typeof url === "string" && url.length > 0,
        );

  // 이미지 URL 변환
  const images = getImageUrls(rawImages);

  // 옵션 목록
  const options = productDetail?.options || [];

  // 선택된 옵션에 따른 추가 금액 계산
  const getAdditionalPrice = (
    optionValues: Record<string, string>,
  ) => {
    let additionalPrice = 0;
    options.forEach((option) => {
      const selectedValueId = optionValues[option.id];
      if (selectedValueId) {
        const selectedValue = option.values.find(
          (v) => v.id === selectedValueId,
        );
        if (selectedValue) {
          additionalPrice += selectedValue.additionalPrice;
        }
      }
    });
    return additionalPrice;
  };

  // ⭐ priceType을 고려한 최종 가격 계산
  const calculateFinalPrice = (
    optionValues: Record<string, string>,
  ) => {
    let finalPrice = 0;
    let hasOverrideOption = false;

    options.forEach((option) => {
      const selectedValueId = optionValues[option.id];
      if (selectedValueId) {
        const selectedValue = option.values.find(
          (v) => v.id === selectedValueId,
        );
        if (selectedValue) {
          if (option.priceType === "OVERRIDE") {
            // OVERRIDE: 기존 가격 무시, 옵션 가격만 사용
            finalPrice = selectedValue.additionalPrice;
            hasOverrideOption = true;
          } else {
            // ADDITIONAL: 기존 가격에 추가
            if (!hasOverrideOption) {
              finalPrice += selectedValue.additionalPrice;
            }
          }
        }
      }
    });

    // OVERRIDE 옵션이 없는 경우에만 기본 가격 추가
    if (!hasOverrideOption) {
      finalPrice = product.price + finalPrice;
    }

    return finalPrice;
  };

  // 수 옵션 모 선택되었는지 확인
  const areRequiredOptionsSelected = () => {
    const requiredOptions = options.filter(
      (opt) => opt.required,
    );
    return requiredOptions.every(
      (opt) => selectedOptions[opt.id],
    );
  };

  // ⭐ 유효기간 만료 여부 확인 ("사용기한 2026-02-05~2026-03-22" 형식 파싱)
  const isProductExpired = () => {
    const usagePeriod = (productDetail as any)?.usagePeriod as
      | string
      | undefined;
    if (!usagePeriod) return false;
    const match = usagePeriod.match(
      /(\d{4}-\d{2}-\d{2})~(\d{4}-\d{2}-\d{2})/,
    );
    if (!match) return false;
    const endDate = new Date(match[2]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return endDate < today;
  };

  // ⭐ 판매중이 아닌 상품인지 확인
  const isNotOnSale = () => {
    return !!(
      product?.salesStatus &&
      ["SOLD_OUT", "READY", "PAUSED", "STOPPED"].includes(
        product.salesStatus,
      )
    );
  };

  // ⭐ 구매 불가 사유 텍스트
  const getPurchaseDisabledText = () => {
    if (isProductExpired()) return "유효기간 만료";
    if (product?.salesStatus === "SOLD_OUT") return "품절";
    if (product?.salesStatus === "READY") return "준비중";
    if (product?.salesStatus === "PAUSED") return "판매 일시중지";
    if (product?.salesStatus === "STOPPED") return "판매 중단";
    return "바로 구매";
  };

  // ⭐ 선택된 옵션의 최소 재고 수량 가져오기
  const getItemMaxStock = (item: SelectedOptionItem): number | undefined => {
    let minStock: number | undefined;
    for (const [optId, valId] of Object.entries(item.optionValues)) {
      const opt = options.find((o) => o.id === optId);
      const val = opt?.values.find((v) => v.id === valId);
      if (val?.stock !== undefined) {
        minStock = minStock === undefined
          ? val.stock
          : Math.min(minStock, val.stock);
      }
    }
    return minStock;
  };

  // 옵션 텍스트 생성
  const getOptionText = (
    optionValues: Record<string, string>,
  ) => {
    return options
      .map((opt) => {
        const valueId = optionValues[opt.id];
        const value = opt.values.find((v) => v.id === valueId);
        return value ? `${opt.name}: ${value.value}` : null;
      })
      .filter(Boolean)
      .join(", ");
  };

  // 옵션 추가 (optionsParam을 받으면 state 대신 사용 - onValueChange 자동추가 대응)
  const handleAddOption = (optionsParam?: Record<string, string>) => {
    const opts = optionsParam ?? selectedOptions;
    const requiredOptions = options.filter((opt) => opt.required);
    if (!requiredOptions.every((opt) => opts[opt.id])) {
      toast.error("필수 옵션을 모두 선택해주세요.");
      return;
    }

    // 이미 같은 옵션 조합이 있는지 확인
    const optionText = getOptionText(opts);
    const existingItem = selectedItems.find(
      (item) => item.optionText === optionText,
    );

    if (existingItem) {
      // 이미 있으면 수량 증가
      updateItemQuantity(
        existingItem.id,
        existingItem.quantity + 1,
      );
      toast.success("수량이 증가되었습니다.");
      setSelectedOptions({});
      return;
    }

    // 선택 항목 추가 - ⭐ priceType을 고려한 최종 가격 사용
    const finalPrice = calculateFinalPrice(opts);

    const newItem: SelectedOptionItem = {
      id: `${Date.now()}-${Math.random()}`,
      optionText,
      optionValues: { ...opts },
      quantity: 1,
      unitPrice: finalPrice, // ⭐ 수정: calculateFinalPrice 사용
    };

    setSelectedItems([...selectedItems, newItem]);

    // 옵션 선택 초기화
    setSelectedOptions({});

    toast.success("옵션이 추가되었습니다.");
  };

  // 옵션이 없는 경우 상품 추가
  const handleAddNoOptionProduct = () => {
    const existingItem = selectedItems.find(
      (item) => item.optionText === "",
    );

    if (existingItem) {
      // 이미 있으면 수량 증가
      updateItemQuantity(
        existingItem.id,
        existingItem.quantity + 1,
      );
      return;
    }

    const newItem: SelectedOptionItem = {
      id: `${Date.now()}-${Math.random()}`,
      optionText: "",
      optionValues: {},
      quantity: 1,
      unitPrice: product.price,
    };

    setSelectedItems([newItem]);
  };

  // 항목 수량 변경
  const updateItemQuantity = (
    itemId: string,
    newQuantity: number,
  ) => {
    if (newQuantity < 1) return;

    // ⭐ 재고 초과 방지
    const targetItem = selectedItems.find((i) => i.id === itemId);
    if (targetItem) {
      const maxStock = getItemMaxStock(targetItem);
      if (maxStock !== undefined && newQuantity > maxStock) {
        toast.error(`재고가 ${maxStock}개 남아있습니다.`);
        return;
      }
    }

    setSelectedItems((items) =>
      items.map((item) =>
        item.id === itemId
          ? { ...item, quantity: newQuantity }
          : item,
      ),
    );
  };

  // 항목 삭제
  const removeItem = (itemId: string) => {
    setSelectedItems((items) =>
      items.filter((item) => item.id !== itemId),
    );
  };

  // 총 금액 계산
  const getTotalAmount = () => {
    return selectedItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
  };

  const handleAddToCart = async () => {
    // productDetail이 없으면 에러
    if (!productDetail) {
      toast.error(
        "상품 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.",
      );
      return;
    }

    // ⭐ 판매중이 아닌 상품은 장바구니 추가 차단
    if (isNotOnSale()) {
      toast.error("현재 구매할 수 없는 상품입니다.");
      return;
    }
    if (isProductExpired()) {
      toast.error("유효기간이 만료된 상품입니다.");
      return;
    }

    // ⭐ 모바일에서 옵션이 있는 경우 시트 열기 (숙박형 포함)
    if (
      window.innerWidth < 1024 &&
      options.length > 0 &&
      selectedItems.length === 0
    ) {
      // 숙박형 상품이고 선택이 없으면 옵션창 열기
      if (
        productDetail?.productType === "STAY" &&
        !stayProductSelection
      ) {
        setShowMobileOptions(true);
        return;
      }
      // 일반 옵션 상품이면 옵션창 열기
      if (productDetail?.productType !== "STAY") {
        setShowMobileOptions(true);
        return;
      }
    }

    // 숙박형 상품 처리
    if (productDetail?.productType === "STAY") {
      if (!stayProductSelection) {
        toast.error("날짜와 옵션을 선택해주세요.");
        return;
      }

      // ⭐ API 방식으로 장바구니 추가
      try {
        const optionArray = Object.entries(
          stayProductSelection.optionValues,
        ).map(([optionId, optionValueId]) => ({
          optionId,
          optionValueId,
        }));

        // ⭐ stayOptionValueId: 첫 번째 옵션값을 사용 (숙박형 상품의 경우 필수)
        const firstOptionValueId = Object.values(
          stayProductSelection.optionValues,
        )[0];

        const request: AddToCartRequest = {
          productId: productDetail.id, // ⭐ API 응답의 UUID 사용
          quantity: 1,
          options: optionArray,
          // ⭐ 숙박형 필수 필드 추가
          stayOptionValueId: firstOptionValueId, // ⭐ 숙박형 상품 필수 필드
          startDate: stayProductSelection.dateRange.from
            .toISOString()
            .split("T")[0],
          endDate: stayProductSelection.dateRange.to
            .toISOString()
            .split("T")[0],
        };

        const response = await addToCart(request);

        if (!response.success) {
          // ⭐ API 실패 시 에러 메시지만 표시 (카운트 증가 안 함)
          toast.error(
            response.message || "장바구니 추가에 실패했습니다.",
          );
          return;
        }

        // ⭐ API 성공 (200) 시에만 카운트 증가
        toast.success(
          `${product.name}이(가) 장바구니에 추가되었습니다.`,
        );

        // 선택 초기화
        setStayProductSelection(null);

        // 장바구니 업데이트 이벤트 발생
        window.dispatchEvent(new Event("cartUpdated"));
      } catch (error) {
        // ⭐ 네트워크 오류 등의 경우 에러 메시지만 표시
        console.error("[장바구니 추가] API 오류:", error);
        toast.error(
          "네트워크 오류가 발생했습니다. 다시 시도해주세요.",
        );
      }

      return;
    }

    // 옵션이 없는 상품인 경우, selectedItems가 비어있으면 직접 장바구니에 추가
    if (selectedItems.length === 0 && options.length === 0) {
      // ⭐ API 방식으로 장바구니 추가
      try {
        const request: AddToCartRequest = {
          productId: productDetail.id, // ⭐ API 응답의 UUID 사용
          quantity: 1,
          options: [],
        };

        const response = await addToCart(request);

        if (!response.success) {
          // ⭐ API 실패 시 에러 메시지만 표시 (카운트 증가 안 함)
          toast.error(
            response.message || "장바구니 추가에 실패했습니다.",
          );
          return;
        }

        // ⭐ API 성공 (200) 시에만 카운트 증가
        toast.success(
          `${product.name} 1개 장바구니에 추가되었습니다.`,
        );

        // 장바구니 업데이트 이벤트 발생
        window.dispatchEvent(new Event("cartUpdated"));
      } catch (error) {
        // ⭐ 네트워크 오류 등의 경우 에러 메시지만 표시
        console.error("[장바구니 추가] API 오류:", error);
        toast.error(
          "네트워크 오류가 발생했습니다. 다시 시도해주세요.",
        );
      }

      return;
    }

    if (selectedItems.length === 0) {
      if (options.length > 0) {
        toast.error("옵션을 선택해주세요.");
      } else {
        toast.error("상품을 추가해주세요.");
      }
      return;
    }

    addToCartFromSelectedItems();
  };

  const addToCartFromSelectedItems = async () => {
    if (selectedItems.length === 0) return;

    // productDetail이 없으면 에러
    if (!productDetail) {
      toast.error("상품 정보를 불러올 수 없습니다.");
      return;
    }

    try {
      // ⭐ API 방식으로 장바구니 추가
      for (const item of selectedItems) {
        // 옵션 값 ID 배열 생성
        const optionArray = Object.entries(
          item.optionValues,
        ).map(([optionId, optionValueId]) => ({
          optionId,
          optionValueId,
        }));

        const request: AddToCartRequest = {
          productId: productDetail.id, // ⭐ API 응답의 UUID 사용
          quantity: item.quantity,
          options: optionArray,
        };

        const response = await addToCart(request);

        if (!response.success) {
          // ⭐ API 실패 시 에러 메시지만 표시 (카운트 증가 안 함)
          toast.error(
            response.message || "장바구니 추가에 실패했습니다.",
          );
          return;
        }
      }

      // ⭐ API 성공 (200) 시에만 카운트 증가
      const totalQuantity = selectedItems.reduce(
        (sum, item) => sum + item.quantity,
        0,
      );
      toast.success(
        `${product.name} ${totalQuantity}개가 장바구니에 추가되었습니다.`,
      );

      // 선택 항목 초기화
      setSelectedItems([]);

      // 장바구니 업데이트 이벤트 발생
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error) {
      // ⭐ 네트워크 오류 등의 경우 에러 메시지만 표시
      console.error("[장바구니 추가] API 오류:", error);
      toast.error(
        "네트워크 오류가 발생했습니다. 다시 시도해주세요.",
      );
    }
  };

  // 로컬 스토리지에 장바구니 추가 (폴백용)
  const addToLocalCart = () => {
    // 장바구니에 추가할 상품 이터 구성
    const cartItems = selectedItems.map((item) => ({
      id: `${product.id}-${item.id}-${Date.now()}`, // 유니크한 ID 생성
      productId: product.id,
      productName: product.name,
      productCode: productDetail?.code || "",
      categoryName: product.category,
      optionName: item.optionText || undefined,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      thumbnailUrl: product.thumbnailUrl,
      venue: productDetail?.venue,
      date: productDetail?.performanceDate,
    }));

    // 기존 장바구니 가져오기
    const savedCart = localStorage.getItem("shop_cart");
    let existingCart = [];
    if (savedCart) {
      try {
        existingCart = JSON.parse(savedCart);
      } catch (e) {
        console.error("Failed to parse cart:", e);
      }
    }

    // 새 아이템 추가
    const updatedCart = [...existingCart, ...cartItems];
    localStorage.setItem(
      "shop_cart",
      JSON.stringify(updatedCart),
    );

    // 장바구니 업데이트 이벤트 발생
    window.dispatchEvent(new Event("cartUpdated"));

    const totalQuantity = selectedItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    toast.success(
      `${product.name} ${totalQuantity}개가 장바구니에 추가되었습니다.`,
    );

    // 선택 항목 초기화
    setSelectedItems([]);
  };

  // 숙박형 상품을 로컬 스토리지에 추가 (폴백용)
  const addStayProductToLocalCart = () => {
    if (!stayProductSelection) return;

    const optionText = options
      .map((opt) => {
        const valueId =
          stayProductSelection.optionValues[opt.id];
        const value = opt.values.find((v) => v.id === valueId);
        return value ? `${opt.name}: ${value.value}` : null;
      })
      .filter(Boolean)
      .join(", ");

    const cartItem = {
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      productCode: productDetail?.code || "",
      categoryName: product.category,
      optionName: `${optionText} | ${stayProductSelection.dateRange.from.toLocaleDateString()} - ${stayProductSelection.dateRange.to.toLocaleDateString()}`,
      quantity: 1,
      unitPrice: stayProductSelection.totalPrice,
      thumbnailUrl: product.thumbnailUrl,
      checkIn:
        stayProductSelection.dateRange.from.toISOString(),
      checkOut: stayProductSelection.dateRange.to.toISOString(),
    };

    // 기존 장바구니 가져오기
    const savedCart = localStorage.getItem("shop_cart");
    let existingCart = [];
    if (savedCart) {
      try {
        existingCart = JSON.parse(savedCart);
      } catch (e) {
        console.error("Failed to parse cart:", e);
      }
    }

    // 새 아이템 추가
    const updatedCart = [...existingCart, cartItem];
    localStorage.setItem(
      "shop_cart",
      JSON.stringify(updatedCart),
    );

    // 장바구니 업데이트 이벤트 발생
    window.dispatchEvent(new Event("cartUpdated"));

    toast.success(
      `${product.name}이(가) 장바구니에 추가되었습니다.`,
    );

    // 선택 초기화
    setStayProductSelection(null);
  };

  // 옵션 없는 상품을 로컬 스토리지에 추가 (폴백용)
  const addNoOptionProductToLocalCart = () => {
    const newItem: SelectedOptionItem = {
      id: `${Date.now()}-${Math.random()}`,
      optionText: "",
      optionValues: {},
      quantity: 1,
      unitPrice: product.price,
    };

    // 직접 장바구니에 추가
    const cartItem = {
      id: `${product.id}-${newItem.id}-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      productCode: productDetail?.code || "",
      categoryName: product.category,
      optionName: undefined,
      quantity: newItem.quantity,
      unitPrice: newItem.unitPrice,
      thumbnailUrl: product.thumbnailUrl,
      venue: productDetail?.venue,
      date: productDetail?.performanceDate,
    };

    // 기존 장바구니 가져오기
    const savedCart = localStorage.getItem("shop_cart");
    let existingCart = [];
    if (savedCart) {
      try {
        existingCart = JSON.parse(savedCart);
      } catch (e) {
        console.error("Failed to parse cart:", e);
      }
    }

    // 새 아이템 추가
    const updatedCart = [...existingCart, cartItem];
    localStorage.setItem(
      "shop_cart",
      JSON.stringify(updatedCart),
    );

    // 장바구니 업데이트 이벤트 발생
    window.dispatchEvent(new Event("cartUpdated"));

    toast.success(
      `${product.name} 1개 장바구니에 추가되었습니다.`,
    );
  };

  const handleBuyNow = () => {
    // ⭐ 판매중이 아닌 상품은 구매 차단
    if (isNotOnSale()) {
      toast.error("현재 구매할 수 없는 상품입니다.");
      return;
    }
    if (isProductExpired()) {
      toast.error("유효기간이 만료된 상품입니다.");
      return;
    }

    // ⭐ 현재 URL의 채널 파라미터 가져오기
    const searchParams = new URLSearchParams(
      window.location.search,
    );
    const channelParam = searchParams.get("channel");
    const orderUrl = channelParam
      ? `/order?channel=${channelParam}`
      : "/order";

    // ⭐ 모바일에서 STAY 타입이거나 옵션이 있는 경우
    if (
      window.innerWidth < 1024 &&
      (productDetail?.productType === "STAY" ||
        options.length > 0)
    ) {
      // 숙박형 상품 처리
      if (productDetail?.productType === "STAY") {
        // 옵션창이 닫혀있으면 옵션창 열기
        if (!showMobileOptions) {
          setShowMobileOptions(true);
          return;
        }
        // 옵션창이 열려있지만 선택이 없으면 알림
        if (!stayProductSelection) {
          toast.error("날짜와 옵션을 선택해주세요.");
          return;
        }
        // 옵션창이 열려있고 선택이 있으면 구매 진행 (아래 로직 계속)
      } else {
        // 일반 옵션 상품 처리
        // 옵션창이 닫혀있으면 옵션창 열기
        if (!showMobileOptions) {
          setShowMobileOptions(true);
          return;
        }
        // 옵션창이 열려있지만 선택된 항목이 없으면 알림
        if (selectedItems.length === 0) {
          toast.error("옵션을 선택해주세요.");
          return;
        }
        // 옵션창이 열려있고 선택된 항목이 있으면 구매 진행 (아래 로직 계속)
      }
    }

    // 숙박형 상품 처리
    if (productDetail?.productType === "STAY") {
      if (!stayProductSelection) {
        toast.error("날짜와 옵션을 선택해주세요.");
        return;
      }

      // 옵션 텍스트 생성
      const optionText = options
        .map((opt) => {
          const valueId =
            stayProductSelection.optionValues[opt.id];
          const value = opt.values.find(
            (v) => v.id === valueId,
          );
          return value ? `${opt.name}: ${value.value}` : null;
        })
        .filter(Boolean)
        .join(", ");

      // ⭐ 체크인부터 체크아웃까지의 모든 날짜 생성 (YYYY-MM-DD 형식)
      const stayDates: string[] = [];
      const currentDate = new Date(
        stayProductSelection.dateRange.from,
      );
      const endDate = new Date(
        stayProductSelection.dateRange.to,
      );

      while (currentDate <= endDate) {
        stayDates.push(currentDate.toISOString().split("T")[0]); // YYYY-MM-DD 형식
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // 주문 페이지로 이동
      const orderItems = [
        {
          productId: product.id,
          productName: product.name,
          productCode: productDetail?.code || "",
          categoryName: product.category,
          optionName: `${optionText} | ${stayProductSelection.dateRange.from.toLocaleDateString()} - ${stayProductSelection.dateRange.to.toLocaleDateString()}`,
          quantity: 1,
          unitPrice: stayProductSelection.totalPrice,
          subtotal: stayProductSelection.totalPrice,
          thumbnailUrl: product.thumbnailUrl,
          checkIn:
            stayProductSelection.dateRange.from.toISOString(),
          checkOut:
            stayProductSelection.dateRange.to.toISOString(),
          // ⭐ optionValues를 options 배열로 변환
          options: Object.entries(
            stayProductSelection.optionValues,
          ).map(([optionId, optionValueId]) => ({
            optionId,
            optionValueId,
          })),
          // ⭐ 숙박 날짜 배열 (YYYY-MM-DD 형식)
          stayDates: stayDates,
        },
      ];

      // 주문 데이터를 sessionStorage에 저장
      sessionStorage.setItem(
        "shop_order_items",
        JSON.stringify(orderItems),
      );

      try {
        navigate(orderUrl, { state: { items: orderItems } });
      } catch (error) {
        window.location.href = orderUrl;
      }
      return;
    }

    // ⭐ 옵션이 없는 상품의 경우 기본 수량 1개로 바로 구매
    if (selectedItems.length === 0 && options.length === 0) {
      const orderItems = [
        {
          productId: product.id,
          productName: product.name,
          productCode: productDetail?.code || "",
          categoryName: product.category,
          optionName: undefined,
          quantity: 1,
          unitPrice: product.price,
          subtotal: product.price,
          thumbnailUrl: product.thumbnailUrl,
          // ⭐ 옵션이 없으므로 빈 배열
          options: [],
        },
      ];

      // 주문 데이터를 sessionStorage에 저장 (폴백용)
      sessionStorage.setItem(
        "shop_order_items",
        JSON.stringify(orderItems),
      );

      try {
        navigate(orderUrl, { state: { items: orderItems } });
      } catch (error) {
        window.location.href = orderUrl;
      }
      return;
    }

    if (selectedItems.length === 0) {
      if (options.length > 0) {
        toast.error("옵션을 선택해주세요.");
      } else {
        toast.error("상품을 추가해주세요.");
      }
      return;
    }

    // 주문 페이지로 이동
    const orderItems = selectedItems.map((item) => ({
      productId: product.id,
      productName: product.name,
      productCode: productDetail?.code || "",
      categoryName: product.category,
      optionName: item.optionText || undefined,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.unitPrice * item.quantity,
      thumbnailUrl: product.thumbnailUrl,
      // ⭐ optionValues를 options 배열로 변환
      options: Object.entries(item.optionValues).map(
        ([optionId, optionValueId]) => ({
          optionId,
          optionValueId,
        }),
      ),
    }));

    // 주문 데이터를 sessionStorage에 저장 (폴백용)
    sessionStorage.setItem(
      "shop_order_items",
      JSON.stringify(orderItems),
    );

    try {
      navigate(orderUrl, { state: { items: orderItems } });
    } catch (error) {
      window.location.href = orderUrl;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
      {/* 헤더 */}
      <ShopHeader language={language} />

      {/* 뒤로가기 버튼 - 좌측 상단 고정 */}
      <div
        className="sticky z-40 pointer-events-none"
        style={{ top: `${headerHeight + 12}px` }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-4 lg:px-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                navigate("/");
              }
            }}
            className="pointer-events-auto shadow-sm bg-white border text-muted-foreground hover:text-foreground hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">뒤로가기</span>
          </Button>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="">
        <div className="max-w-5xl mx-auto px-0 sm:px-4 lg:px-6 py-0 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-8 mb-8">
            {/* 이미지 갤러리 */}
            <div className="space-y-4 px-0 lg:px-0">
              {/* 메인 이미지 */}
              <div className="aspect-square rounded-none sm:rounded-2xl overflow-hidden bg-muted">
                <ImageWithFallback
                  src={images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* 썸네일 이미지 목록 */}
              {images.length > 1 && (
                <div className="grid grid-cols-5 gap-2 px-4 lg:px-0">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === index
                          ? "border-primary"
                          : "border-transparent hover:border-muted-foreground/20"
                      }`}
                    >
                      <ImageWithFallback
                        src={img}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 상품 정보 */}
            <div className="space-y-6 px-4 sm:px-0 mt-6 sm:mt-0">
              {/* 카테고리 */}
              <Badge variant="secondary">
                {product.category}
              </Badge>

              {/* 상품명 */}
              <h1 className="text-3xl">{product.name}</h1>

              {/* 간단한 설명 */}
              {productDetail?.description && (
                <p className="text-muted-foreground">
                  {productId === "IU_CONCERT_2025"
                    ? "2025년 아이유 월드투어 서울 앵콜 콘서트 티켓을 만나보세요."
                    : productDetail.description}
                </p>
              )}

              <Separator />

              {/* 가격 */}
              <div className="space-y-2">
                {hasDiscount ? (
                  <>
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl text-red-500 font-bold">
                        {product.discountRate}%
                      </span>
                      <span className="text-3xl font-bold">
                        {product.price.toLocaleString()}원
                      </span>
                    </div>
                    <div className="text-muted-foreground line-through">
                      정가{" "}
                      {product.originalPrice?.toLocaleString()}
                      원
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {(
                        product.originalPrice! - product.price
                      ).toLocaleString()}
                      원 할인
                    </div>
                  </>
                ) : (
                  <div className="text-3xl font-bold">
                    {product.price.toLocaleString()}원
                  </div>
                )}
              </div>

              <Separator />

              {/* ⭐ 사용기한 정보 - 가격 바로 아래로 이동하고 강조 */}
              {(() => {
                // 서버에서 받은 usagePeriod 우선 표시
                if ((productDetail as any)?.usagePeriod) {
                  const usagePeriod = (productDetail as any)
                    .usagePeriod;

                  return (
                    <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <CalendarClock className="h-6 w-6 text-gray-600 dark:text-gray-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 dark:text-gray-100 mb-1">
                            유효기간
                          </p>
                          <p className="text-gray-700 dark:text-gray-300 font-medium">
                            {usagePeriod}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }

                // 로컬스토리지에서 유효기간 정보 가져오기 (폴백)
                const savedValidity = localStorage.getItem(
                  `product_validity_${productId}`,
                );
                if (!savedValidity) return null;

                try {
                  const validity = JSON.parse(savedValidity);
                  if (validity.type === "NONE") return null;

                  return (
                    <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <CalendarClock className="h-6 w-6 text-gray-600 dark:text-gray-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 dark:text-gray-100 mb-1">
                            유효기간
                          </p>
                          {validity.type === "FIXED_DATE" &&
                            validity.fixedDates &&
                            validity.fixedDates.length > 0 && (
                              <div className="space-y-1">
                                {validity.fixedDates.map(
                                  (
                                    dateRange: {
                                      startDate: string;
                                      endDate: string;
                                    },
                                    index: number,
                                  ) => (
                                    <p
                                      key={index}
                                      className="text-gray-700 dark:text-gray-300 font-medium"
                                    >
                                      {new Date(
                                        dateRange.startDate,
                                      ).toLocaleDateString(
                                        "ko-KR",
                                      )}{" "}
                                      ~{" "}
                                      {new Date(
                                        dateRange.endDate,
                                      ).toLocaleDateString(
                                        "ko-KR",
                                      )}
                                    </p>
                                  ),
                                )}
                              </div>
                            )}
                          {validity.type === "RELATIVE_DAYS" &&
                            validity.days && (
                              <p className="text-gray-700 dark:text-gray-300 font-medium">
                                구매일로부터 {validity.days}일간
                                사용 가능
                              </p>
                            )}
                        </div>
                      </div>
                    </div>
                  );
                } catch (e) {
                  console.error("유효기간 정보 파싱 실패:", e);
                  return null;
                }
              })()}

              <Separator />

              {/* 옵션 선택 - 숙박형 vs 일반형 */}
              {productDetail?.productType === "STAY" ? (
                /* 숙박형 상품 - 날짜 선택 기반 */
                <div className="hidden lg:block">
                  <ShopStayProductOptions
                    product={productDetail}
                    onAddToCart={(data) => {
                      // 숙박형 상품 선택 정보 저장
                      setStayProductSelection(data);
                    }}
                  />
                </div>
              ) : options.length > 0 ? (
                /* 반 상품 - 기존 옵션 선 방식 */
                <div className="space-y-4 hidden lg:block">
                  <div className="space-y-3">
                    {options.map((option) => (
                      <div
                        key={option.id}
                        className="space-y-2"
                      >
                        <Label className="text-sm">
                          {option.name}
                          {option.required && (
                            <span className="text-destructive ml-1">
                              *
                            </span>
                          )}
                        </Label>
                        <Select
                          value={
                            selectedOptions[option.id] || ""
                          }
                          onValueChange={(value) => {
                            if (value === "__NONE__") {
                              // 선택 안함
                              const newOptions = {
                                ...selectedOptions,
                              };
                              delete newOptions[option.id];
                              setSelectedOptions(newOptions);
                            } else {
                              const newOptions = {
                                ...selectedOptions,
                                [option.id]: value,
                              };
                              setSelectedOptions(newOptions);
                              // ⭐ 필수 옵션이 모두 선택된 경우 자동으로 추가
                              const requiredOpts = options.filter(
                                (opt) => opt.required,
                              );
                              const allRequiredSelected =
                                requiredOpts.length > 0 &&
                                requiredOpts.every(
                                  (opt) => newOptions[opt.id],
                                );
                              if (allRequiredSelected) {
                                handleAddOption(newOptions);
                              }
                            }
                          }}
                        >
                          <SelectTrigger className="h-auto min-h-14 py-3.5 px-4">
                            <SelectValue
                              placeholder={`${option.name}을(를) 선택하세요`}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {!option.required && (
                              <SelectItem value="__NONE__">
                                <span className="text-muted-foreground">
                                  선택안함
                                </span>
                              </SelectItem>
                            )}
                            {option.values
                              .filter((v) => v.visible)
                              .map((value) => {
                                const isOutOfStock =
                                  value.stock !== undefined &&
                                  value.stock === 0;
                                return (
                                  <SelectItem
                                    key={value.id}
                                    value={value.id}
                                    disabled={isOutOfStock}
                                  >
                                    <div className="flex flex-col items-start py-2.5">
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={
                                            isOutOfStock
                                              ? "text-muted-foreground"
                                              : ""
                                          }
                                        >
                                          {value.value}
                                        </span>
                                        {isOutOfStock && (
                                          <span className="text-xs text-destructive">
                                            (품절)
                                          </span>
                                        )}
                                      </div>
                                      {value.additionalPrice !==
                                        0 && (
                                        <span className="text-xs text-muted-foreground mt-0.5">
                                          {option.priceType ===
                                          "OVERRIDE"
                                            ? `${value.additionalPrice.toLocaleString()}원`
                                            : value.additionalPrice >
                                                0
                                              ? `+${value.additionalPrice.toLocaleString()}원`
                                              : `${value.additionalPrice.toLocaleString()}원`}
                                        </span>
                                      )}
                                      {!isOutOfStock &&
                                        value.stock !==
                                          undefined && (
                                          <span className="text-xs text-muted-foreground mt-0.5">
                                            재고: {value.stock}
                                          </span>
                                        )}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleAddOption}
                    disabled={!areRequiredOptionsSelected()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    옵션 추가
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleAddNoOptionProduct}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  상품 추가
                </Button>
              )}

              {/* 선택된 옵션 목록 - 일반 상품만 표시 */}
              {productDetail?.productType !== "STAY" &&
                selectedItems.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3 hidden lg:block">
                      <Label className="text-sm">
                        선택한 상품
                      </Label>
                      <div className="space-y-2">
                        {selectedItems.map((item) => (
                          <div
                            key={item.id}
                            className="bg-muted/50 rounded-lg p-4 space-y-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold">
                                  {product.name}
                                </p>
                                {item.optionText && (
                                  <p className="text-sm text-muted-foreground">
                                    {item.optionText}
                                  </p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                onClick={() =>
                                  removeItem(item.id)
                                }
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    updateItemQuantity(
                                      item.id,
                                      item.quantity - 1,
                                    )
                                  }
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <div className="w-12 text-center">
                                  {item.quantity}
                                </div>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    updateItemQuantity(
                                      item.id,
                                      item.quantity + 1,
                                    )
                                  }
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="font-semibold">
                                {(
                                  item.unitPrice * item.quantity
                                ).toLocaleString()}
                                원
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

              {/* 총 금액 */}
              {selectedItems.length > 0 &&
                productDetail?.productType !== "STAY" && (
                  <div className="hidden lg:block bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        총 금액
                      </span>
                      <span className="text-2xl">
                        {getTotalAmount().toLocaleString()}원
                      </span>
                    </div>
                  </div>
                )}

              {/* 구매 버튼 - 데스크탑에서만 표시 */}
              <div className="hidden lg:flex gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  disabled={isProductExpired() || isNotOnSale()}
                  onClick={() => {
                    handleAddToCart();
                  }}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  장바구니
                </Button>
                <Button
                  size="lg"
                  className="flex-1"
                  disabled={isProductExpired() || isNotOnSale()}
                  onClick={() => {
                    handleBuyNow();
                  }}
                >
                  {getPurchaseDisabledText()}
                </Button>
              </div>
            </div>
          </div>

          {/* 배송 정보, 이용 안내, 환불 규정 */}
          {(productDetail?.shippingInfo ||
            productDetail?.warrantyInfo ||
            productDetail?.returnInfo) && (
            <div className="space-y-3 py-[24px] px-4 sm:px-0 max-w-6xl mx-auto">
              <Separator className="mb-3" />
              {productDetail?.shippingInfo && (
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    {productDetail?.productType === "STAY" ? (
                      <Info className="h-5 w-5 text-foreground/60 shrink-0 mt-0.5" />
                    ) : (
                      <Truck className="h-5 w-5 text-foreground/60 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold mb-1.5">
                        {productDetail?.productType === "STAY"
                          ? "예약 안내"
                          : "발송 정보"}
                      </p>
                      <p className="text-sm text-foreground/70 whitespace-pre-line">
                        {productDetail.shippingInfo}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {productDetail?.warrantyInfo && (
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <Shield className="h-5 w-5 text-foreground/60 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold mb-1.5">
                        이용 안내
                      </p>
                      <p className="text-sm text-foreground/70 whitespace-pre-line">
                        {productDetail.warrantyInfo}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {productDetail?.returnInfo && (
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <RefreshCw className="h-5 w-5 text-foreground/60 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold mb-1.5">
                        환불 규정
                      </p>
                      <p className="text-sm text-foreground/70 whitespace-pre-line">
                        {productDetail.returnInfo}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 상세 설명 */}
          {productDetail?.detailContent && (
            <div className="max-w-6xl mx-auto px-0 sm:px-0 mb-12">
              <h2 className="text-2xl mb-6 px-4 sm:px-0">
                상품 상세 정보
              </h2>
              <div className="bg-white sm:rounded-xl sm:border overflow-hidden">
                {/* 아이유 콘서트인 경우 사진 추가 */}
                {productId === "IU_CONCERT_2025" && (
                  <div className="space-y-0">
                    <div className="grid grid-cols-1 md:grid-cols-2">
                      <ImageWithFallback
                        src="https://images.unsplash.com/photo-1566735355837-2269c24e644e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jZXJ0JTIwc3RhZ2UlMjBwZXJmb3JtYW5jZXxlbnwxfHx8fDE3NjU0MzAyMjR8MA&ixlib=rb-4.1.0&q=80&w=1080"
                        alt="콘서트 무대"
                        className="w-full h-64 object-cover object-center"
                      />
                      <ImageWithFallback
                        src="https://images.unsplash.com/photo-1674154083391-2a226ee1c5a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrb3JlYW4lMjBmZW1hbGUlMjBzaW5nZXIlMjBjb25jZXJ0fGVufDF8fHx8MTc2NTUxNjI1Nnww&ixlib=rb-4.1.0&q=80&w=1080"
                        alt="공연 현장"
                        className="w-full h-64 object-cover object-center"
                      />
                    </div>
                    <ImageWithFallback
                      src="https://images.unsplash.com/photo-1647524904834-1ed784e73d2c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdGFkaXVtJTIwY29uY2VydCUyMGNyb3dkfGVufDF8fHx8MTc2NTQ0NjYyM3ww&ixlib=rb-4.1.0&q=80&w=1080"
                      alt="공연장 전경"
                      className="w-full h-80 object-cover object-center"
                    />
                  </div>
                )}
                <div className="p-4 sm:p-8">
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(
                        productDetail.detailContent,
                      ),
                    }}
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* 모바일 하단 고정 버튼 */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-50">
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            disabled={isProductExpired() || isNotOnSale()}
            onClick={() => {
              handleAddToCart();
            }}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            장바구니
          </Button>
          <Button
            size="lg"
            className="flex-1"
            disabled={isProductExpired() || isNotOnSale()}
            onClick={() => {
              handleBuyNow();
            }}
          >
            {getPurchaseDisabledText()}
          </Button>
        </div>
      </div>

      {/* 모바일 옵션 선택 Bottom Sheet */}
      {showMobileOptions && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-[60] animate-in fade-in duration-200"
            onClick={() => setShowMobileOptions(false)}
          />

          {/* Bottom Sheet */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background rounded-t-2xl z-[70] max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            <div className="p-6 space-y-6">
              {/* 헤더 */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  옵션 선택
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMobileOptions(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* 옵션 선택 */}
              {productDetail?.productType === "STAY" ? (
                /* 숙박형 상품 옵션 선택 */
                <ShopStayProductOptions
                  product={productDetail}
                  alwaysShowDatePicker={true}
                  onAddToCart={(data) => {
                    // 숙박형 상품 선택 정보 저장
                    setStayProductSelection(data);
                  }}
                />
              ) : options.length > 0 ? (
                /* 일반 상품 옵션 선택 */
                <div className="space-y-4">
                  <div className="space-y-3">
                    {options.map((option) => (
                      <div
                        key={option.id}
                        className="space-y-2"
                      >
                        <Label className="text-sm">
                          {option.name}
                          {option.required && (
                            <span className="text-destructive ml-1">
                              *
                            </span>
                          )}
                        </Label>
                        <Select
                          value={
                            selectedOptions[option.id] || ""
                          }
                          onValueChange={(value) => {
                            if (value === "__NONE__") {
                              const newOptions = {
                                ...selectedOptions,
                              };
                              delete newOptions[option.id];
                              setSelectedOptions(newOptions);
                            } else {
                              const newOptions = {
                                ...selectedOptions,
                                [option.id]: value,
                              };
                              setSelectedOptions(newOptions);
                              // ⭐ 필수 옵션이 모두 선택된 경우 자동으로 추가
                              const requiredOpts = options.filter(
                                (opt) => opt.required,
                              );
                              const allRequiredSelected =
                                requiredOpts.length > 0 &&
                                requiredOpts.every(
                                  (opt) => newOptions[opt.id],
                                );
                              if (allRequiredSelected) {
                                handleAddOption(newOptions);
                              }
                            }
                          }}
                        >
                          <SelectTrigger className="h-auto min-h-14 py-3 px-4">
                            <SelectValue
                              placeholder={`${option.name}을(를) 선택하세요`}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {!option.required && (
                              <SelectItem value="__NONE__">
                                <span className="text-muted-foreground">
                                  선택안함
                                </span>
                              </SelectItem>
                            )}
                            {option.values
                              .filter((v) => v.visible)
                              .map((value) => {
                                const isOutOfStock =
                                  value.stock !== undefined &&
                                  value.stock === 0;
                                return (
                                  <SelectItem
                                    key={value.id}
                                    value={value.id}
                                    disabled={isOutOfStock}
                                  >
                                    <div className="flex flex-col items-start py-2.5">
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={
                                            isOutOfStock
                                              ? "text-muted-foreground line-through"
                                              : ""
                                          }
                                        >
                                          {value.value}
                                        </span>
                                        {isOutOfStock && (
                                          <span className="text-xs text-destructive font-medium">
                                            (품절)
                                          </span>
                                        )}
                                      </div>
                                      {value.additionalPrice !==
                                        0 && (
                                        <span className="text-xs text-muted-foreground mt-0.5">
                                          {option.priceType ===
                                          "OVERRIDE"
                                            ? `${value.additionalPrice.toLocaleString()}원`
                                            : value.additionalPrice >
                                                0
                                              ? `+${value.additionalPrice.toLocaleString()}원`
                                              : `${value.additionalPrice.toLocaleString()}원`}
                                        </span>
                                      )}
                                      {!isOutOfStock &&
                                        value.stock !==
                                          undefined && (
                                          <span className="text-xs text-muted-foreground mt-0.5">
                                            재고: {value.stock}
                                          </span>
                                        )}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleAddOption}
                    disabled={!areRequiredOptionsSelected()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    옵션 추가
                  </Button>
                </div>
              ) : null}

              {/* 선택된 옵션 목록 */}
              {productDetail?.productType !== "STAY" &&
                selectedItems.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <Label className="text-sm">
                        선택한 상품
                      </Label>
                      <div className="space-y-2">
                        {selectedItems.map((item) => (
                          <div
                            key={item.id}
                            className="bg-muted/50 rounded-lg p-4 space-y-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold">
                                  {product.name}
                                </p>
                                {item.optionText && (
                                  <p className="text-sm text-muted-foreground">
                                    {item.optionText}
                                  </p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                onClick={() =>
                                  removeItem(item.id)
                                }
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    updateItemQuantity(
                                      item.id,
                                      item.quantity - 1,
                                    )
                                  }
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <div className="w-12 text-center">
                                  {item.quantity}
                                </div>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    updateItemQuantity(
                                      item.id,
                                      item.quantity + 1,
                                    )
                                  }
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="font-semibold">
                                {(
                                  item.unitPrice * item.quantity
                                ).toLocaleString()}
                                원
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

              {/* 총 금액 */}
              {(productDetail?.productType === "STAY"
                ? stayProductSelection
                : selectedItems.length > 0) && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      총 금액
                    </span>
                    <span className="text-2xl font-bold">
                      {productDetail?.productType === "STAY"
                        ? stayProductSelection?.totalPrice.toLocaleString()
                        : getTotalAmount().toLocaleString()}
                      원
                    </span>
                  </div>
                </div>
              )}

              {/* 구매 버튼 */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  disabled={
                    isProductExpired() ||
                    isNotOnSale() ||
                    (productDetail?.productType === "STAY"
                      ? !stayProductSelection
                      : selectedItems.length === 0)
                  }
                  onClick={async () => {
                    await handleAddToCart();
                    setShowMobileOptions(false);
                  }}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  장바구니
                </Button>
                <Button
                  size="lg"
                  className="flex-1"
                  disabled={
                    isProductExpired() ||
                    isNotOnSale() ||
                    (productDetail?.productType === "STAY"
                      ? !stayProductSelection
                      : selectedItems.length === 0)
                  }
                  onClick={() => {
                    setShowMobileOptions(false);
                    setTimeout(() => {
                      handleBuyNow();
                    }, 100);
                  }}
                >
                  {getPurchaseDisabledText()}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
export default ShopProductDetail;
