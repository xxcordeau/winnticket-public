import { ProductChannelDiscounts } from "./detail-partner-discounts-mobile";
import { ProductDetailOptions } from "./detail-options";
import { ProductDetailSms } from "./detail-sms";
import { ProductDetailDatePrices } from "./detail-date-prices";
import { ProductDetailChannelPrices } from "./detail-channel-prices";
import { TicketCouponManagement } from "./ticket-coupon-management";
import {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  useParams,
  useNavigate,
  useSearchParams,
} from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SegmentTabs } from "@/components/ui/segment-tabs";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  FileText,
  Truck,
  Shield,
  RefreshCw,
  ArrowLeft,
  ImageIcon,
  X,
  Calendar,
  Clock,
  Plus,
  Trash2,
  Info,
} from "lucide-react";
import { CoachMark, TourHelpButton, type TourStep } from "@/components/coach-mark";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import type {
  Product,
  ProductOption,
  SalesStatus,
} from "@/data/dto/product.dto";
import { ProductDetailSeasons } from "./detail-seasons";
import {
  getProducts,
  updateProduct as updateProductLocal,
} from "@/data/products";
import { getPartners as getPartnersAPI } from "@/lib/api/partner";
import {
  getChannels,
  type ChannelListItem,
} from "@/lib/api/channel";
import { useMenuCategories } from "@/data/hooks/useShopStore";
import { getActiveSections } from "@/lib/api/section";
import type { Section } from "@/data/dto/section.dto";
import {
  getAdminProductDetail,
  updateProductBasic,
  updateProductShipping,
  updateProductSection,
  type ProductBasicUpdateRequest,
  type ProductShippingRequest,
} from "@/lib/api/product";
import { uploadFile } from "@/lib/api/file";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { isApiOnlyMode } from "@/lib/data-mode";

// 마크다운을 HTML로 변환하는 함수
const renderMarkdown = (md: string): string => {
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
  html = html.replace(
    /\*\*(.+?)\*\*/g,
    '<strong style="font-weight: bold;">$1</strong>',
  );
  html = html.replace(
    /\*(.+?)\*/g,
    '<em style="font-style: italic;">$1</em>',
  );

  // 코드 블록
  html = html.replace(
    /```([^`]+)```/g,
    '<pre style="background-color: #f3f4f6; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0; overflow-x: auto;"><code>$1</code></pre>',
  );

  // 인��인 코드
  html = html.replace(
    /`([^`]+)`/g,
    '<code style="background-color: #f3f4f6; padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-size: 0.875rem;">$1</code>',
  );

  // 인용구
  html = html.replace(
    /^> (.*$)/gim,
    '<blockquote style="border-left: 4px solid #d1d5db; padding-left: 1rem; font-style: italic; margin: 1rem 0; color: #6b7280;">$1</blockquote>',
  );

  // 리스트 (순서 있는 것과 없는 것 구분)
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

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isEditMode = Boolean(id); // 상품 수정 모드 여부

  const [product, setProduct] = useState<Product | null>(null);
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [activeTab, setActiveTab] = useState<
    | "basic"
    | "details"
    | "options"
    | "datePrices"
    | "discounts"
    | "channelPrices"
    | "sms"
    | "coupons"
  >("basic");
  const [loading, setLoading] = useState(true);
  const [silentRefreshing, setSilentRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 탭별 개별 투어 가이드
  const basicTourSteps: TourStep[] = [
    { target: "pd-basic-info", title: "기본 정보", description: "상품명, 코드, 카테고리, 파트너를 설정합니다.", placement: "bottom" },
    { target: "pd-prepurchased", title: "선사입형 설정", description: "선사입형을 체크하면 '티켓 관리' 탭이 생성됩니다.\n사전 구매한 티켓 쿠폰을 등록하고 관리할 수 있습니다.", placement: "bottom", waitForTarget: 500 },
    { target: "pd-price-info", title: "가격 & 판매 정보", description: "정가, 판매가, 판매상태를 설정합니다.\n할인가를 입력하면 자동으로 할인율이 계산됩니다.", placement: "bottom", waitForTarget: 500 },
{ target: "pd-images", title: "상품 이미지", description: "대표 이미지(썸네일)를 최대 4장까지 등록합니다.\n첫 번째 이미지가 메인 이미지로 사용됩니다.", placement: "top", waitForTarget: 500 },
    { target: "pd-save-btn", title: "저장", description: "수정한 기본 정보를 저장합니다.\n각 탭별로 별도 저장이 필요합니다.", placement: "bottom", waitForTarget: 500 },
  ];

  const detailsTourSteps: TourStep[] = [
    { target: "pd-shipping", title: "발송 및 이용안내", description: "발송 정보, 이용 안내, 취소/환불 정보를 입력합니다.\n쇼핑몰 상품 페이지 하단에 표시됩니다.", placement: "bottom" },
    { target: "pd-validity", title: "유효기간 설정", description: "티켓의 유효기간을 설정합니다.\n• 설정안함: 유효기간 없음\n• 고정 날짜: 특정 기간 지정\n• 구매일 기준: n일간 사용 가능", placement: "bottom", waitForTarget: 500 },
    { target: "pd-detail-editor", title: "상세 내용 편집", description: "블로그처럼 이미지와 텍스트를 자유롭게 작성할 수 있는\n전용 편집 페이지로 이동합니다.\n상품 상세 페이지에 표시되는 본문 내용입니다.", placement: "top", waitForTarget: 500 },
    { target: "pd-sections", title: "쇼핑몰 노출 설정", description: "메인 페이지의 어떤 섹션에 상품을 노출할지\n선택합니다. 체크한 섹션에 상품이 표시됩니다.", placement: "top", waitForTarget: 500 },
  ];

  // 탭별 투어 설정 맵 (옵션/SMS/채널/티켓은 각 컴포넌트에서 자체 관리)
  const tourConfigMap: Record<string, { steps: TourStep[]; key: string }> = {
    basic: { steps: basicTourSteps, key: "product_detail_basic" },
    details: { steps: detailsTourSteps, key: "product_detail_details" },
  };

  const tourConfig = tourConfigMap[activeTab] || null;

  // 직접 투어 상태 관리 (탭 변경 시 동적으로 대응)
  const [isTourActive, setIsTourActive] = useState(false);

  // 탭 변경 시 첫 방문이면 자동 시작
  useEffect(() => {
    if (!tourConfig) return;
    const seen = localStorage.getItem(tourConfig.key);
    if (!seen) {
      const timer = setTimeout(() => setIsTourActive(true), 800);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  const startTour = () => setIsTourActive(true);
  const endTour = () => setIsTourActive(false);

  // 기본 정보 상태
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [salesStatus, setSalesStatus] =
    useState<string>("READY");
  const [description, setDescription] = useState("");
  const [visible, setVisible] = useState(true);
  const [prePurchased, setPrePurchased] = useState(false);
  const [regionCard, setRegionCard] = useState<
    string | undefined
  >(undefined);
  const [ticketType, setTicketType] = useState<
    string | undefined
  >(undefined);
  const [productType, setProductType] = useState<
    "STAY" | "NORMAL" | undefined
  >(undefined);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>(
    [],
  );

  const MAX_IMAGES = 4;

  // 배송/보증/반품 정보 상태
  const DEFAULT_SHIPPING_INFO = "포인트/신용카드 결제 시 : 결제 즉시 모바일티켓이 문자 또는 카톡으로 발송됩니다.\n무통장 입금 시 : 결제 완료 후 30분~40분 내외로 모바일티켓이 문자 또는 카톡으로 발송됩니다.";
  const DEFAULT_WARRANTY_INFO = "주중/주말 이용권\n대인/청소년/소인 공통요금";
  const DEFAULT_RETURN_INFO = "전자상거래등에서의 소비자보호에 관한 법률에 의거 구매 후 7일 이내 취소 시는 모바일티켓 발송료 1,000원 적용되며, 7일 경과 취소시는 취소수수료 10% 적용됩니다.\n사용 후 잔여티켓의 부분 취소와 사용기한이 경과한 티켓은 일체 환불이 불가합니다.";

  const [shippingInfo, setShippingInfo] = useState(DEFAULT_SHIPPING_INFO);
  const [warrantyInfo, setWarrantyInfo] = useState(DEFAULT_WARRANTY_INFO);
  const [returnInfo, setReturnInfo] = useState(DEFAULT_RETURN_INFO);

  // 유효기간 상태
  const [validityType, setValidityType] = useState<
    "NONE" | "FIXED_DATE" | "RELATIVE_DAYS"
  >("NONE");
  const [validityFixedDates, setValidityFixedDates] = useState<
    Array<{ startDate: string; endDate: string }>
  >([]);
  const [validityDays, setValidityDays] = useState("");

  // 섹션 관리
  const [availableSections, setAvailableSections] = useState<
    Section[]
  >([]);
  const [productSections, setProductSections] = useState<
    Record<string, boolean>
  >({});

  // 파트너 및 카테고리 데이터
  const { visibleCategories } = useMenuCategories();
  const [partners, setPartners] = useState<
    Array<{ id: string; name: string; code: string }>
  >([]);

  // 채널 데이터
  const [channels, setChannels] = useState<ChannelListItem[]>(
    [],
  );

  // ⭐ 상품 데이터 로드 함수 (재사용 가능하도록 useCallback으로 추출)
  const loadProduct = useCallback(async (silent = false) => {
    if (!id) return;
    if (silent) {
      setSilentRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      // 먼저 백엔드 API에서 상세 정보 조회
      console.log("[상품 상세] API 요청 시작, ID:", id);
      const apiResponse = await getAdminProductDetail(id);

      console.log("[상품 상세] API 응답:", apiResponse);

      if (apiResponse.success && apiResponse.data) {
        const detail = apiResponse.data;
        console.log("[상품 상세] 상품 데이터:", detail);

        // imageUrl을 안전하게 배열로 변환 (중첩 배열 방지)
        let imageUrlArray: string[] = [];
        if (
          detail.imageUrls &&
          Array.isArray(detail.imageUrls)
        ) {
          // imageUrls가 이미 배열인 경우
          imageUrlArray = detail.imageUrls
            .flat()
            .filter(
              (url): url is string => typeof url === "string",
            );
        } else if (detail.imageUrl) {
          // imageUrl이 있는 경우
          if (Array.isArray(detail.imageUrl)) {
            // imageUrl이 배열인 경우 (중첩 가능성)
            imageUrlArray = detail.imageUrl
              .flat()
              .filter(
                (url): url is string => typeof url === "string",
              );
          } else if (typeof detail.imageUrl === "string") {
            // imageUrl이 문자열인 경우
            imageUrlArray = [detail.imageUrl];
          }
        }

        console.log(
          "[상품 로드] 원본 imageUrl:",
          detail.imageUrl,
        );
        console.log(
          "[상품 로드] 원본 imageUrls:",
          detail.imageUrls,
        );
        console.log(
          "[상품 로드] 변환된 imageUrlArray:",
          imageUrlArray,
        );

        // ⭐ API 응답의 periods를 datePrices로 변환
        let datePrices: any[] = [];
        if (
          (detail as any).periods &&
          Array.isArray((detail as any).periods)
        ) {
          console.log(
            "[상품 로드] periods 데이터 발견:",
            (detail as any).periods,
          );

          // periods 배열을 datePrices 형식으로 변환
          (detail as any).periods.forEach(
            (periodGroup: any) => {
              if (
                periodGroup.periods &&
                Array.isArray(periodGroup.periods)
              ) {
                periodGroup.periods.forEach((period: any) => {
                  datePrices.push({
                    id: `period-${periodGroup.periodId}-${period.groupNo}`,
                    productId: detail.id,
                    optionId: periodGroup.optionId,
                    optionName: periodGroup.optionName,
                    optionValueId: periodGroup.optionValueId,
                    optionValueName:
                      periodGroup.optionValueName,
                    startDate: period.startDate,
                    endDate: period.endDate,
                    price: period.price,
                    discountPrice: period.discountPrice,
                    groupNo: period.groupNo,
                  });
                });
              }
            },
          );

          console.log(
            "[상품 로드] 변환된 datePrices:",
            datePrices,
          );
        }

        // productType fallback 처리
        let dummyProduct = null;
        if (!isApiOnlyMode()) {
          const dummyResponse = getProducts(0, 1000);
          dummyProduct =
            dummyResponse.success && dummyResponse.data
              ? dummyResponse.data.content.find(
                  (p) => p.id === id,
                )
              : null;
        }

        // ⭐ stock이 없으면 옵션의 재고를 합산
        let totalStock = detail.stock ?? 0;
        if (
          !detail.stock &&
          detail.options &&
          detail.options.length > 0
        ) {
          totalStock = detail.options.reduce(
            (sum: number, option: any) => {
              if (
                option.values &&
                Array.isArray(option.values)
              ) {
                return (
                  sum +
                  option.values.reduce(
                    (optSum: number, value: any) => {
                      return optSum + (value.stock ?? 0);
                    },
                    0,
                  )
                );
              }
              return sum;
            },
            0,
          );
          console.log(
            "[상품 로드] stock 필드 없음, 옵션에서 계산된 재고:",
            totalStock,
          );
        }

        // API 응답 데이터를 Product 형식으로 변환
        const productData: Product = {
          id: detail.id,
          code: detail.code,
          name: detail.name,
          categoryId: detail.categoryId,
          categoryName: detail.categoryName,
          partnerId: detail.partnerId || undefined,
          partnerName: detail.partnerName || undefined,
          productType:
            (detail as any).type ||
            detail.productType ||
            dummyProduct?.productType ||
            undefined,
          description: detail.description,
          imageUrl: imageUrlArray[0] || undefined,
          imageUrls: imageUrlArray,
          price: detail.price ?? 0,
          discountPrice: detail.discountPrice ?? undefined,
          stock: totalStock,
          salesStatus: detail.salesStatus || "READY",
          displayOrder: detail.displayOrder || 0,
          visible: detail.visible !== false,
          shippingInfo: detail.shippingInfo,
          warrantyInfo: detail.warrantyInfo,
          returnInfo: detail.returnInfo,
          detailContent: detail.detailContent,
          detailImages: detail.detailImagesList || [],
          sections: detail.sections,
          options: detail.options || [],
          datePrices:
            datePrices.length > 0
              ? datePrices
              : dummyProduct?.datePrices || [],
          sms: detail.sms,
          createdAt: detail.createdAt,
          updatedAt: detail.updatedAt,
        };

        setProduct(productData);
        setOptions(detail.options || []);

        // 상태 초기화
        setName(detail.name);
        setCode(detail.code);
        setCategoryId(detail.categoryId);
        setPartnerId(detail.partnerId || "");
        setPrice((detail.price ?? 0).toString());
        setDiscountPrice(
          (detail.discountPrice ?? "").toString(),
        );
        setSalesStatus(detail.salesStatus || "READY");
        setDescription(detail.description);
        setVisible(detail.visible !== false);
        setPrePurchased(detail.prePurchased || false); // ⭐ 선사입형 여부
        // ⭐ regionCode, ticketType, productType 로드 (서버는 regionCode로 반환, 프론트는 regionCard 사용)
        setRegionCard(
          detail.regionCode ||
            (detail as any).regionCd ||
            (detail as any).regionCard,
        );
        setTicketType(detail.ticketType);
        setProductType(
          (detail as any).type || detail.productType,
        );
        setShippingInfo(detail.shippingInfo || DEFAULT_SHIPPING_INFO);
        setWarrantyInfo(detail.warrantyInfo || DEFAULT_WARRANTY_INFO);
        setReturnInfo(detail.returnInfo || DEFAULT_RETURN_INFO);

        // ⭐ 유효기간 정보 초기화 - usagePeriod 파싱
        if ((detail as any).usagePeriod) {
          const usagePeriod = (detail as any).usagePeriod;
          console.log("[상품 로드] usagePeriod:", usagePeriod);

          // "사용기한 2026-01-13~2026-01-16" 형식 파싱
          if (usagePeriod.startsWith("사용기한 ")) {
            const dateRangeStr = usagePeriod.replace(
              "사용기한 ",
              "",
            );
            const dateRanges = dateRangeStr
              .split(" / ")
              .map((range: string) => {
                const [startDate, endDate] = range.split("~");
                return {
                  startDate: startDate.trim(),
                  endDate: endDate.trim(),
                };
              });

            setValidityType("FIXED_DATE");
            setValidityFixedDates(dateRanges);
            setValidityDays("");
            console.log(
              "[상품 로드] 고정 날짜 파싱:",
              dateRanges,
            );
          }
          // "구매일로부터 30일 이내 사용가능" 또는 "구매로부터 12일 이내 사용가능" 형식 파싱
          else if (usagePeriod.includes("구매")) {
            const match = usagePeriod.match(/(\d+)일/);
            if (match) {
              setValidityType("RELATIVE_DAYS");
              setValidityDays(match[1]);
              setValidityFixedDates([]);
              console.log(
                "[상품 로드] 상대 일수 파싱:",
                match[1],
              );
            }
          } else {
            setValidityType("NONE");
            setValidityFixedDates([]);
            setValidityDays("");
          }
        } else {
          // usagePeriod가 없으면 로컬스토리지에서 로드 시도
          const savedValidity = localStorage.getItem(
            `product_validity_${detail.id}`,
          );
          if (savedValidity) {
            try {
              const validity = JSON.parse(savedValidity);
              setValidityType(validity.type || "NONE");
              setValidityFixedDates(validity.fixedDates || []);
              setValidityDays(validity.days?.toString() || "");
            } catch (e) {
              console.error("유효기간 데이터 로드 실패:", e);
            }
          } else {
            setValidityType("NONE");
            setValidityFixedDates([]);
            setValidityDays("");
          }
        }

        setImageUrls(imageUrlArray);
        setImagePreviews(imageUrlArray);

        // 섹션 초기화
        if (detail.sections) {
          const sectionMap: Record<string, boolean> = {};
          detail.sections.forEach((section) => {
            sectionMap[section.id] = section.visible;
          });
          setProductSections(sectionMap);
        }

        console.log(
          "[상품 상세] 백엔드 API로 상품 정보 로드:",
          apiResponse.message,
        );
      } else {
        // API 실패 시 로컬 데이터로 폴백
        console.log("[상품 상세] API 실패, 로컬 데이터로 폴백");
        const response = getProducts(0, 1000);
        if (response.success && response.data) {
          const foundProduct = response.data.content.find(
            (p) => p.id === id,
          );
          if (foundProduct) {
            setProduct(foundProduct);
            setOptions(foundProduct.options || []);

            // 상태 초기화
            setName(foundProduct.name);
            setCode(foundProduct.code);
            setCategoryId(foundProduct.categoryId);
            setPartnerId(foundProduct.partnerId || "");
            setPrice((foundProduct.price ?? 0).toString());
            setDiscountPrice(
              foundProduct.discountPrice?.toString() || "",
            );
            setSalesStatus(foundProduct.salesStatus);
            setDescription(foundProduct.description);
            setVisible(foundProduct.visible);
            setPrePurchased(
              (foundProduct as any).prePurchased || false,
            );
            setRegionCard(
              (foundProduct as any).regionCode ||
                (foundProduct as any).regionCd ||
                (foundProduct as any).regionCard,
            );
            setTicketType((foundProduct as any).ticketType);
            setProductType(
              (foundProduct as any).type ||
                foundProduct.productType,
            );
            setShippingInfo(foundProduct.shippingInfo || DEFAULT_SHIPPING_INFO);
            setWarrantyInfo(foundProduct.warrantyInfo || DEFAULT_WARRANTY_INFO);
            setReturnInfo(foundProduct.returnInfo || DEFAULT_RETURN_INFO);

            // ⭐ 유효기간 정보 초기화 - usagePeriod 파싱
            if ((foundProduct as any).usagePeriod) {
              const usagePeriod = (foundProduct as any)
                .usagePeriod;
              console.log(
                "[상품 로드 - 로컬] usagePeriod:",
                usagePeriod,
              );

              if (usagePeriod.startsWith("사용기한 ")) {
                const dateRangeStr = usagePeriod.replace(
                  "사용기한 ",
                  "",
                );
                const dateRanges = dateRangeStr
                  .split(" / ")
                  .map((range: string) => {
                    const [startDate, endDate] =
                      range.split("~");
                    return {
                      startDate: startDate.trim(),
                      endDate: endDate.trim(),
                    };
                  });

                setValidityType("FIXED_DATE");
                setValidityFixedDates(dateRanges);
                setValidityDays("");
              } else if (usagePeriod.includes("구매일로부터")) {
                const match = usagePeriod.match(/(\d+)일/);
                if (match) {
                  setValidityType("RELATIVE_DAYS");
                  setValidityDays(match[1]);
                  setValidityFixedDates([]);
                }
              } else {
                setValidityType("NONE");
                setValidityFixedDates([]);
                setValidityDays("");
              }
            } else {
              // usagePeriod가 없으면 로컬스토리지에서 로드 시도
              const savedValidity = localStorage.getItem(
                `product_validity_${foundProduct.id}`,
              );
              if (savedValidity) {
                try {
                  const validity = JSON.parse(savedValidity);
                  setValidityType(validity.type || "NONE");
                  setValidityFixedDates(
                    validity.fixedDates || [],
                  );
                  setValidityDays(
                    validity.days?.toString() || "",
                  );
                } catch (e) {
                  console.error(
                    "유효기간 데이터 로드 실패:",
                    e,
                  );
                }
              } else {
                setValidityType("NONE");
                setValidityFixedDates([]);
                setValidityDays("");
              }
            }

            const urls =
              foundProduct.imageUrls ||
              (foundProduct.imageUrl
                ? [foundProduct.imageUrl]
                : []);
            setImageUrls(urls);
            setImagePreviews(urls);
          } else {
            toast.error("상품을 찾을 수 없습니다.");
            navigate("/admin/products");
          }
        }
      }
    } catch (error) {
      console.error("[상품 상세] API 오류 발생:", error);
      console.log("[상품 상세] 로컬 데이터로 폴백합니다.");

      // 오류 발생 시 로컬 데이터로 폴백
      try {
        const response = getProducts(0, 1000);
        if (response.success && response.data) {
          const foundProduct = response.data.content.find(
            (p) => p.id === id,
          );
          if (foundProduct) {
            setProduct(foundProduct);
            setOptions(foundProduct.options || []);

            // 상태 초기화
            setName(foundProduct.name);
            setCode(foundProduct.code);
            setCategoryId(foundProduct.categoryId);
            setPartnerId(foundProduct.partnerId || "");
            setPrice((foundProduct.price ?? 0).toString());
            setDiscountPrice(
              foundProduct.discountPrice?.toString() || "",
            );
            setSalesStatus(foundProduct.salesStatus);
            setDescription(foundProduct.description);
            setVisible(foundProduct.visible);
            setPrePurchased(
              (foundProduct as any).prePurchased || false,
            );
            setRegionCard(
              (foundProduct as any).regionCode ||
                (foundProduct as any).regionCd ||
                (foundProduct as any).regionCard,
            );
            setTicketType((foundProduct as any).ticketType);
            setProductType(
              (foundProduct as any).type ||
                foundProduct.productType,
            );
            setShippingInfo(foundProduct.shippingInfo || DEFAULT_SHIPPING_INFO);
            setWarrantyInfo(foundProduct.warrantyInfo || DEFAULT_WARRANTY_INFO);
            setReturnInfo(foundProduct.returnInfo || DEFAULT_RETURN_INFO);

            // ⭐ 유효기간 정보 초기화 - usagePeriod 파싱
            if ((foundProduct as any).usagePeriod) {
              const usagePeriod = (foundProduct as any)
                .usagePeriod;
              console.log(
                "[상품 로드 - catch 블록] usagePeriod:",
                usagePeriod,
              );

              if (usagePeriod.startsWith("사용기한 ")) {
                const dateRangeStr = usagePeriod.replace(
                  "사용기한 ",
                  "",
                );
                const dateRanges = dateRangeStr
                  .split(" / ")
                  .map((range: string) => {
                    const [startDate, endDate] =
                      range.split("~");
                    return {
                      startDate: startDate.trim(),
                      endDate: endDate.trim(),
                    };
                  });

                setValidityType("FIXED_DATE");
                setValidityFixedDates(dateRanges);
                setValidityDays("");
              } else if (usagePeriod.includes("구매일로부터")) {
                const match = usagePeriod.match(/(\d+)일/);
                if (match) {
                  setValidityType("RELATIVE_DAYS");
                  setValidityDays(match[1]);
                  setValidityFixedDates([]);
                }
              } else {
                setValidityType("NONE");
                setValidityFixedDates([]);
                setValidityDays("");
              }
            } else {
              // usagePeriod가 없으면 로컬스토리지에서 로드 시도
              const savedValidity2 = localStorage.getItem(
                `product_validity_${foundProduct.id}`,
              );
              if (savedValidity2) {
                try {
                  const validity = JSON.parse(savedValidity2);
                  setValidityType(validity.type || "NONE");
                  setValidityFixedDates(
                    validity.fixedDates || [],
                  );
                  setValidityDays(
                    validity.days?.toString() || "",
                  );
                } catch (e) {
                  console.error(
                    "유효기간 데이터 로드 실패:",
                    e,
                  );
                }
              } else {
                setValidityType("NONE");
                setValidityFixedDates([]);
                setValidityDays("");
              }
            }

            const urls =
              foundProduct.imageUrls ||
              (foundProduct.imageUrl
                ? [foundProduct.imageUrl]
                : []);
            setImageUrls(urls);
            setImagePreviews(urls);

            console.log(
              "[상품 상세] 로컬 데이터로 상품 정보 로드",
            );
          } else {
            toast.error("상품을 찾을 수 없습니다.");
            navigate("/admin/products");
          }
        } else {
          toast.error("상품을 불러오는데 실패했습니다.");
          navigate("/admin/products");
        }
      } catch (fallbackError) {
        console.error("[상품 상세] 폴백 오류:", fallbackError);
        toast.error("상품을 불러오는데 실패했습니다.");
        navigate("/admin/products");
      }
    } finally {
      setLoading(false);
      setSilentRefreshing(false);
    }
  }, [id, navigate]);

  // 상품 데이터 로드 (useEffect에서 호출)
  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  // 섹션 목록 로드
  useEffect(() => {
    const loadSections = async () => {
      const sectionsResponse = await getActiveSections();
      if (sectionsResponse.success && sectionsResponse.data) {
        setAvailableSections(sectionsResponse.data);
      }
    };

    loadSections();
  }, []);

  // ⭐ 티켓 관리에서 옵션 관리로 이동 이벤트 감지
  useEffect(() => {
    const handleNavigateToOptions = () => {
      setActiveTab("options");
    };

    window.addEventListener(
      "navigateToOptions",
      handleNavigateToOptions,
    );

    return () => {
      window.removeEventListener(
        "navigateToOptions",
        handleNavigateToOptions,
      );
    };
  }, []);

  // 상품 상세 정보 ���회 (백엔드 API)
  const loadProductDetail = async (productId: string) => {
    try {
      const response = await getAdminProductDetail(productId);

      if (response.success && response.data) {
        const detail = response.data;

        // 옵 정보 업데이트
        if (detail.options) {
          setOptions(detail.options);
        }

        // 섹션 정보 업데이트
        const sections = detail.sections || [];
        const sectionMap: Record<string, boolean> = {};
        sections.forEach((section) => {
          sectionMap[section.id] = section.visible;
        });
        setProductSections(sectionMap);
      }
    } catch (error) {
      console.error("상품 세 정보 조회 오류:", error);
    }
  };

  // 파트너 목록 로드
  useEffect(() => {
    const loadPartners = async () => {
      try {
        console.log("🔄 [파트너 목록] API 호출 시작...");
        const partnersResponse = await getPartnersAPI({
          visible: true,
        });
        console.log(
          "✅ [파트너 목록] API 응답:",
          partnersResponse,
        );
        if (partnersResponse.success && partnersResponse.data) {
          setPartners(partnersResponse.data);
          console.log(
            "✅ [파트너 목록] 로드 완료:",
            partnersResponse.data.length,
            "개",
          );
        } else {
          // HTML 응답인 경우에는 경고 표시하지 않음
          if (partnersResponse.message !== "HTML_RESPONSE") {
            console.warn(
              "⚠️ [파트너 목록] API 응답 실패:",
              partnersResponse.message,
            );
          } else {
            if (!isApiOnlyMode()) {
              console.log(
                "💡 [파트너 목록] API 서버 미응답 - 더미 데이터 사용",
              );
            } else {
              console.log("💡 [파트너 목록] API 서버 미응답");
            }
          }
        }
      } catch (error) {
        console.error("❌ [파트너 목록] 로드 오류:", error);
      }
    };

    loadPartners();
  }, []);

  // 채널 목록 로드
  useEffect(() => {
    const loadChannels = async () => {
      // 토큰 확인
      const token = localStorage.getItem("access_token");

      if (!token) {
        // 토큰 없음 처리
        if (!isApiOnlyMode()) {
          console.log(
            "💡 [채널 목록] 토큰 없음 - 더미 데이터 사용",
          );
          setChannels(getDummyChannels());
        } else {
          console.log("💡 [채널 목록] 토큰 없음");
        }
        return;
      }

      try {
        console.log(
          "🔄 [채널 목록] /api/admin/channels API 호출 시작...",
        );
        const channelsResponse = await getChannels();
        console.log(
          "✅ [채널 목록] API 응답:",
          channelsResponse,
        );

        if (
          channelsResponse.success &&
          channelsResponse.data &&
          channelsResponse.data.length > 0
        ) {
          setChannels(channelsResponse.data);
          console.log(
            "✅ [채널 목록] API 로드 성공:",
            channelsResponse.data.length,
            "개",
          );
        } else {
          if (!isApiOnlyMode()) {
            console.log(
              "💡 [채널 목록] API 데이터 없음 - 더미 데이터 사용",
            );
            setChannels(getDummyChannels());
          } else {
            console.log("💡 [채널 목록] API 데이터 없음");
          }
        }
      } catch (error) {
        if (!isApiOnlyMode()) {
          console.log(
            "💡 [채널 목록] API 연결 실패 - 더미 데이터 사용",
          );
          setChannels(getDummyChannels());
        } else {
          console.log("💡 [채널 목록] API 연결 실패");
        }
      }
    };

    loadChannels();
  }, []);

  // 더미 채널 데이터
  const getDummyChannels = (): ChannelListItem[] => {
    return [
      {
        id: "CH001",
        code: "MAIN",
        name: "메인 채널",
        logoUrl: "",
        companyName: "위너티켓 본사",
        visible: true,
        domain: "winnticket.co.kr",
        useCard: true,
      },
      {
        id: "CH002",
        code: "PARTNER1",
        name: "파트너 채널 A",
        logoUrl: "",
        companyName: "파트너사 A",
        visible: true,
        domain: "partner-a.com",
        useCard: false,
      },
      {
        id: "CH003",
        code: "PARTNER2",
        name: "파트너 채널 B",
        logoUrl: "",
        companyName: "파트너사 B",
        visible: true,
        domain: "partner-b.com",
        useCard: true,
      },
    ];
  };

  // 모든 카테고리를 평면 리스트로 변환 (useMemo로 최적화)
  const allCategories = useMemo(() => {
    const result: Array<{
      id: string;
      name: string;
      level: number;
    }> = [];
    const flatten = (cats: any[], level = 0) => {
      cats.forEach((cat) => {
        result.push({ id: cat.id, name: cat.name, level });
        if (cat.children) {
          flatten(cat.children, level + 1);
        }
      });
    };
    flatten(visibleCategories);
    return result;
  }, [visibleCategories]);

  // 옵션 업데이트 핸들러
  const handleOptionsUpdate = useCallback(
    (updatedOptions: ProductOption[]) => {
      setOptions(updatedOptions);
      if (product) {
        const updated = { ...product, options: updatedOptions };
        setProduct(updated);
        updateProductLocal(updated);
      }
    },
    [product],
  );

  // 기본 정보 저장
  const handleBasicInfoSave = async () => {
    console.log("🚀 [handleBasicInfoSave] 함수 시작");
    console.log("📦 [handleBasicInfoSave] product:", product);
    console.log("💾 [handleBasicInfoSave] isSaving:", isSaving);

    if (!product) {
      console.log(
        "❌ [handleBasicInfoSave] product가 없어서 종료",
      );
      return;
    }

    if (isSaving) {
      console.log(
        "⏳ [handleBasicInfoSave] 이미 저장 중이므로 종료",
      );
      return;
    }

    setIsSaving(true);
    console.log(
      "⏳ [handleBasicInfoSave] 저장 시작 - isSaving = true",
    );

    const priceNum = parseFloat(price);
    const discountPriceNum = discountPrice
      ? parseFloat(discountPrice)
      : undefined;

    if (isNaN(priceNum) || priceNum < 0) {
      console.log("❌ [handleBasicInfoSave] 가격 검증 실패");
      toast.error("올바른 가격을 입력해주세요.");
      setIsSaving(false);
      return;
    }

    if (
      discountPrice &&
      (isNaN(discountPriceNum!) || discountPriceNum! < 0)
    ) {
      console.log("❌ [handleBasicInfoSave] 할인가 검증 실패");
      toast.error("올바른 할인가를 입력해주세요.");
      setIsSaving(false);
      return;
    }

    if (discountPrice && discountPriceNum! > priceNum) {
      toast.error("판매가는 정가보다 클 수 없습니다.");
      setIsSaving(false);
      return;
    }

    const categoryData = allCategories.find(
      (c) => c.id === categoryId,
    );
    const partnerData = partners.find(
      (p) => p.id === partnerId,
    );

    const basicUpdateRequest: ProductBasicUpdateRequest = {
      name,
      code,
      categoryId,
      partnerId: partnerId || undefined,
      price: priceNum,
      discountPrice: discountPriceNum || priceNum,
      salesStatus: salesStatus,
      description,
      imageUrl: imageUrls, // ✅ 필드명은 imageUrl (단수형)이지만 배열 타입
      regionCode: regionCard || undefined, // 지역카드코드 (선택사항)
      ticketType: ticketType || undefined, // 티켓분류코드 (이미 "01", "02" 형태)
      type: productType || "NORMAL", // 상품 유형 (기본값: NORMAL)
      prePurchased: prePurchased, // 선사입형 여부
      visible: visible, // 활성화 여부
    };

    console.log(
      "[기본정보 저장] imageUrls 타입:",
      Array.isArray(imageUrls),
    );
    console.log(
      "[기본정보 저장] imageUrls 길이:",
      imageUrls.length,
    );
    console.log("[기본정보 저장] imageUrls 내용:", imageUrls);
    console.log("[기본정보 저장] regionCard 값:", regionCard);
    console.log("[기본정보 저장] ticketType 값:", ticketType);
    console.log("[기본정보 저장] productType 값:", productType);
    console.log(
      "[기본정보 저장] 전송 데이터:",
      basicUpdateRequest,
    );

    console.log("🌐 [handleBasicInfoSave] API 호출 시작");
    try {
      const response = await updateProductBasic(
        product.id,
        basicUpdateRequest,
      );

      console.log(
        "📥 [handleBasicInfoSave] API 응답:",
        response,
      );

      if (response.success) {
        toast.success("기본 정보가 저장되었습니다.");
        const updated: Product = {
          ...product,
          name,
          code,
          categoryId,
          categoryName: categoryData?.name,
          partnerId: partnerId || undefined,
          partnerName: partnerData?.name,
          price: priceNum,
          discountPrice: discountPriceNum,
          salesStatus: salesStatus as SalesStatus,
          description,
          imageUrl: imageUrls[0] || "",
          imageUrls: imageUrls,
          visible,
        };
        setProduct(updated);
        updateProductLocal(updated);
        console.log("✅ [handleBasicInfoSave] 저장 성공");
      } else {
        // 상품코드 중복 에러 처리
        const errorMessage = response.message || "";
        if (
          errorMessage.includes("duplicate key") ||
          errorMessage.includes("products_code_key") ||
          errorMessage.includes("already exists")
        ) {
          toast.error("동일한 코드가 존재합니다. 다른 코드를 사용해주세요.");
        } else {
          toast.error(response.message || "저장에 실패했습니다.");
        }
        console.log(
          "❌ [handleBasicInfoSave] 저장 실패:",
          response.message,
        );
      }
    } catch (error) {
      console.error(
        "💥 [handleBasicInfoSave] API 호출 에러:",
        error,
      );
      toast.error("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
      console.log(
        "🏁 [handleBasicInfoSave] 저장 종료 - isSaving = false",
      );
    }
  };

  // 프론트엔드 SalesStatus를 백엔드 SalesStatus로 매핑
  const mapSalesStatusToBackend = (
    status: SalesStatus,
  ):
    | "READY"
    | "PENDING"
    | "ON_SALE"
    | "PAUSED"
    | "SOLD_OUT"
    | "ENDED" => {
    const statusMap: Record<
      SalesStatus,
      | "READY"
      | "PENDING"
      | "ON_SALE"
      | "PAUSED"
      | "SOLD_OUT"
      | "ENDED"
    > = {
      준비중: "READY",
      판매대기: "PENDING",
      판매중: "ON_SALE",
      판매중단: "PAUSED",
      품절: "SOLD_OUT",
      판매종료: "ENDED",
    };
    return statusMap[status] || "READY";
  };

  // 백엔드 SalesStatus를 프론트엔드 SalesStatus로 매핑
  const mapBackendToFrontendStatus = (
    status:
      | "READY"
      | "PENDING"
      | "ON_SALE"
      | "PAUSED"
      | "SOLD_OUT"
      | "ENDED",
  ): SalesStatus => {
    const statusMap: Record<
      | "READY"
      | "PENDING"
      | "ON_SALE"
      | "PAUSED"
      | "SOLD_OUT"
      | "ENDED",
      SalesStatus
    > = {
      READY: "준비중",
      PENDING: "판매대기",
      ON_SALE: "판매중",
      PAUSED: "판매중단",
      SOLD_OUT: "품절",
      ENDED: "판매종료",
    };
    return statusMap[status] || "준비중";
  };

  // 배송/보증/반품 정보 저장
  const handleAdditionalInfoSave = async () => {
    if (!product) return;

    // 유효기간 유효성 검사
    if (validityType === "FIXED_DATE") {
      if (validityFixedDates.length === 0) {
        toast.error(
          "유효기간 시작일과 종료일을 모두 입력해주세요.",
        );
        return;
      }
      for (const dateRange of validityFixedDates) {
        if (!dateRange.startDate || !dateRange.endDate) {
          toast.error(
            "유효기간 시작일과 종료일을 모두 입력해주세요.",
          );
          return;
        }
        if (
          new Date(dateRange.startDate) >
          new Date(dateRange.endDate)
        ) {
          toast.error("종료일은 시작일 이후여야 합니다.");
          return;
        }
      }
    } else if (validityType === "RELATIVE_DAYS") {
      const days = parseInt(validityDays);
      if (!validityDays || isNaN(days) || days <= 0) {
        toast.error("유효 일수는 1 이상의 숫자여야 합니다.");
        return;
      }
    }

    // 유효기간 문자열 생성
    let usagePeriod = "";
    if (validityType === "NONE") {
      usagePeriod = "";
    } else if (validityType === "FIXED_DATE") {
      // "사용기한 2025-01-01~2025-12-31 / 2026-01-01~2026-12-31" 형식
      const dateRangeStrings = validityFixedDates.map(
        (range) => `${range.startDate}~${range.endDate}`,
      );
      usagePeriod = `사용기한 ${dateRangeStrings.join(" / ")}`;
    } else if (validityType === "RELATIVE_DAYS") {
      // "구매일로부터 30일 이내 사용가능" 형식
      usagePeriod = `구매로부터 ${validityDays}일 이내 사용가능`;
    }

    const shippingRequest: ProductShippingRequest = {
      shippingInfo,
      warrantyInfo,
      returnInfo,
      usagePeriod,
    };

    const response = await updateProductShipping(
      product.id,
      shippingRequest,
    );

    if (response.success) {
      toast.success(
        "발송/취소/환불 및 유효기간 정보가 저장되었습니다.",
      );
      const updated = {
        ...product,
        shippingInfo,
        warrantyInfo,
        returnInfo,
      };
      setProduct(updated);
      updateProductLocal(updated);
    } else {
      toast.error(response.message);
    }
  };

  // 섹션 저장
  const handleSectionSave = async () => {
    if (!product) return;

    try {
      if (availableSections.length === 0) {
        toast.error(
          "저장할 셀이 습니다. 섹션 관리에서 섹션을 먼저 생성해주세요.",
        );
        return;
      }

      const promises = availableSections.map((section) => {
        const request = {
          sectionId: section.id,
          visible: productSections[section.id] || false,
        };
        return updateProductSection(product.id, request);
      });

      const results = await Promise.all(promises);
      const allSuccess = results.every((r) => r.success);

      if (allSuccess) {
        toast.success("쇼핑몰 노출 설정이 저장되었습니다.");
      } else {
        const failedResult = results.find((r) => !r.success);
        toast.error(
          failedResult?.message ||
            "일부 섹션 설정에 실패했습니다.",
        );
      }
    } catch (error) {
      console.error("섹션 저장 오류:", error);
      toast.error("섹션 설정 중 오류가 발생했습니다.");
    }
  };

  // 섹션 토글 핸들러
  const handleSectionToggle = useCallback(
    (sectionId: string, value: boolean) => {
      setProductSections((prev) => ({
        ...prev,
        [sectionId]: value,
      }));
    },
    [],
  );

  // 이미지 파일 업로드 핸들러
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    const inputElement = e.target; // 이벤트 객체가 무효화되기 전에 참조 저장

    if (!files || files.length === 0) {
      console.log("[이미지 업로드] 파일이 선택되지 않음");
      return;
    }

    console.log(
      "[이미지 업로드] ========================================",
    );
    console.log("[이미지 업로드] 새 업로드 시작");
    console.log(
      "[이미지 업로드] 선택된 파일 수:",
      files.length,
    );
    console.log(
      "[이미지 업로드] 현재 이미지 수:",
      imagePreviews.length,
    );

    const currentImageCount = imagePreviews.length;
    const remainingSlots = MAX_IMAGES - currentImageCount;

    if (remainingSlots <= 0) {
      toast.error(
        `최대 ${MAX_IMAGES}장까지만 업로드할 수 있습니다.`,
      );
      // input 초기화
      inputElement.value = "";
      console.log("[이미지 업로드] 최대 개수 도달, 종료");
      return;
    }

    const filesToProcess = Math.min(
      files.length,
      remainingSlots,
    );

    if (files.length > remainingSlots) {
      toast.warning(
        `최대 ${MAX_IMAGES}장까지만 업로드할 수 있어 ${filesToProcess}장만 추가됩니다.`,
      );
    }

    console.log(
      "[이미지 업로드] 처리할 파일 수:",
      filesToProcess,
    );
    console.log("[이미지 업로드] 남은 슬롯:", remainingSlots);

    let successCount = 0;
    const newImageUrls: string[] = [];
    const newImagePreviews: string[] = [];

    for (let i = 0; i < filesToProcess; i++) {
      const file = files[i];

      console.log(
        `[이미지 업로드] [${i + 1}/${filesToProcess}] 파일명: ${file.name}, 크기: ${file.size} bytes, 타입: ${file.type}`,
      );

      if (!file.type.startsWith("image/")) {
        console.error(
          `[이미지 업로드] [${i + 1}/${filesToProcess}] 이미지 파일이 아님:`,
          file.type,
        );
        toast.error(
          `${file.name}은(는) 이미지 파일이 아닙니다.`,
        );
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        console.error(
          `[이미지 업��드] [${i + 1}/${filesToProcess}] 파일 크기 초과:`,
          file.size,
        );
        toast.error(`${file.name}은(는) 5MB를 초과합니다.`);
        continue;
      }

      try {
        console.log(
          `[이미지 업로드] [${i + 1}/${filesToProcess}] 업로드 API 호출 시작...`,
        );

        // 미보기용 blob URL 생성
        const blobUrl = URL.createObjectURL(file);
        console.log(
          `[이미지 업로드] [${i + 1}/${filesToProcess}] Blob URL 생성 완료:`,
          blobUrl,
        );

        // 파일 업로드 API 호출
        const response = await uploadFile(file);

        console.log(
          `[이미지 업로드] [${i + 1}/${filesToProcess}] API 응답:`,
          {
            success: response.success,
            hasData: !!response.data,
            data: response.data,
            message: response.message,
            fullResponse: response,
          },
        );

        if (
          response.success &&
          response.data &&
          response.data.fileUrl
        ) {
          // ⭐ response.data는 FileUploadResponse 타입이므로 fileUrl 속성 사용
          let imageUrl = response.data.fileUrl;
          if (
            imageUrl &&
            !imageUrl.startsWith("http") &&
            !imageUrl.startsWith("data:")
          ) {
            imageUrl = `${window.location.origin}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
          }

          console.log(
            `[이미지 업로드] [${i + 1}/${filesToProcess}] ✅ 성공! URL:`,
            imageUrl,
          );

          // 배열에 추가 (한 번에 상태 업데이트하기 위해)
          newImageUrls.push(imageUrl);
          newImagePreviews.push(blobUrl);
          successCount++;
        } else {
          // 업로드 실패 시 경고 (base64는 사용하지 않음)
          console.error(
            `[이미지 업로드] [${i + 1}/${filesToProcess}] ❌ 실패:`,
            response,
          );
          toast.error(`${file.name} 업로드에 실패했습니다.`);
          URL.revokeObjectURL(blobUrl);
        }
      } catch (error) {
        console.error(
          `[이미지 업로드] [${i + 1}/${filesToProcess}] ❌ 예외 발생:`,
          error,
        );
        toast.error(
          `${file.name} 업로드 중 오류가 발생했습니다.`,
        );
      }
    }

    // ⭐ 모든 업로드가 끝난 후 한 번에 상태 업데이트
    if (successCount > 0) {
      console.log("[이미지 업로드] 상태 업데이트:", {
        newImageUrls,
        newImagePreviews,
      });

      setImageUrls((prev) => {
        const updated = [...prev, ...newImageUrls];
        console.log(
          "[이미지 업로드] imageUrls 업데이트:",
          prev.length,
          "->",
          updated.length,
        );
        return updated;
      });

      setImagePreviews((prev) => {
        const updated = [...prev, ...newImagePreviews];
        console.log(
          "[이미지 업로드] imagePreviews 업데이트:",
          prev.length,
          "->",
          updated.length,
        );
        return updated;
      });

      toast.success(
        `${successCount}장의 이미지가 업로드되었습니다.`,
      );
    }

    // ⭐ 중요: input을 초기화하여 같은 파일도 다시 선택할 수 있도록 함
    inputElement.value = "";
    console.log("[이미지 업로드] input 초기화 완료");
    console.log(
      "[이미지 업로드] ========================================",
    );
  };

  if (loading || !product) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" text="로딩 중..." />
      </div>
    );
  }

  const detailImages = product.detailImages || [];
  const detailContent = product.detailContent || "";

  return (
    <div className="space-y-6">
      <PageHeader
        title={product.name}
        subtitle="상품의 세부 정보를 관리합니다."
        language="ko"
        rightContent={
          <div className="flex items-center gap-3">
            <TourHelpButton onClick={() => {
              if (tourConfig) {
                startTour();
              } else {
                window.dispatchEvent(new CustomEvent("startTabTour"));
              }
            }} />
            <Button
              variant="outline"
              onClick={() => {
                const returnPage = searchParams.get("returnPage");
                if (returnPage) {
                  navigate(`/admin/products?page=${returnPage}`);
                } else {
                  navigate("/admin/products");
                }
              }}
            >
              <ArrowLeft className="size-4 mr-2" />
              목록으로
            </Button>
          </div>
        }
      />

      {/* 모바일: Select 드롭다운 */}
      <div className="md:hidden w-full">
        <Select
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as typeof activeTab)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="basic">기본 정보</SelectItem>
            <SelectItem value="details">상품 상세</SelectItem>
            <SelectItem value="options">옵션 관리</SelectItem>
            {product?.productType === "STAY" && (
              <SelectItem value="datePrices">
                기간 설정
              </SelectItem>
            )}
            {product?.productType !== "STAY" && (
              <SelectItem value="channelPrices">
                채널별 가격
              </SelectItem>
            )}
            <SelectItem value="sms">SMS 관리</SelectItem>
            {prePurchased && (
              <SelectItem value="coupons">티켓 관리</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* 데스크톱: 기존 탭 */}
      <div className="hidden md:block">
        <SegmentTabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as typeof activeTab)
          }
          options={[
            { value: "basic", label: "기본 정보" },
            { value: "details", label: "상품 상세" },
            { value: "options", label: "옵션 관리" },
            ...(product?.productType === "STAY"
              ? [
                  {
                    value: "datePrices" as const,
                    label: "기간 설정",
                  },
                ]
              : []),
            ...(product?.productType !== "STAY"
              ? [
                  {
                    value: "channelPrices" as const,
                    label: "채널별 가격",
                  },
                ]
              : []),
            { value: "sms", label: "SMS 관리" },
            ...(prePurchased
              ? [{ value: "coupons" as const, label: "티켓 관리" }]
              : []),
          ]}
        />
      </div>

      {/* 탭 콘텐츠 */}
      <div className="bg-background rounded-lg border p-6">
        {activeTab === "basic" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-[18px]">
                기본 정보 수정
              </h3>
              <Button
                onClick={() => {
                  console.log("🔘 [저장 버튼 클릭됨]");
                  handleBasicInfoSave();
                }}
                disabled={isSaving}
                data-tour="pd-save-btn"
              >
                {isSaving ? "저장 중..." : "저장"}
              </Button>
            </div>
            <div className="space-y-6">
              {/* 기본 정보 섹션 */}
              <div data-tour="pd-basic-info">
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">
                  기본 정보
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">상품명 *</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="상품명을 입력하세요"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">
                      상품코드 *
                    </Label>
                    <Input
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="상품코드를 입력하세요"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">
                      카테고리 *
                    </Label>
                    <Select
                      value={categoryId}
                      onValueChange={setCategoryId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="카테고리 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {allCategories.map((category) => (
                          <SelectItem
                            key={category.id}
                            value={category.id}
                          >
                            {"  ".repeat(category.level)}
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">파트너</Label>
                    <Select
                      value={partnerId || "none"}
                      onValueChange={(value) =>
                        setPartnerId(
                          value === "none" ? "" : value,
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="파트너 선택 (선택사항)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          없음
                        </SelectItem>
                        {partners.map((partner) => (
                          <SelectItem
                            key={partner.id}
                            value={partner.id}
                          >
                            {partner.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm">상품 설명</Label>
                    <Input
                      value={description}
                      onChange={(e) =>
                        setDescription(e.target.value)
                      }
                      placeholder="상품에 대한 간단한 설명을 입력하세요"
                    />
                  </div>
                </div>
              </div>

              {/* 분류 정보 섹션 */}
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">
                  분류 정보
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">상품 유형</Label>
                    <Select
                      value={productType || "NORMAL"}
                      onValueChange={(value) =>
                        setProductType(
                          value as "STAY" | "NORMAL",
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="상품 유형 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NORMAL">
                          일반 상품
                        </SelectItem>
                        <SelectItem value="STAY">
                          숙박 상품
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">티켓분류</Label>
                    <Select
                      value={ticketType || "none"}
                      onValueChange={(value) =>
                        setTicketType(
                          value === "none" ? undefined : value,
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="티켓분류 선택 (선택사항)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          없음
                        </SelectItem>
                        <SelectItem value="01">
                          테마파크
                        </SelectItem>
                        <SelectItem value="02">
                          수상.레저
                        </SelectItem>
                        <SelectItem value="03">체험</SelectItem>
                        <SelectItem value="04">
                          공연.전시
                        </SelectItem>
                        <SelectItem value="05">
                          실내관광지(박물관,정원 등)
                        </SelectItem>
                        <SelectItem value="06">
                          패키지
                        </SelectItem>
                        <SelectItem value="99">기타</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">지역</Label>
                    <Select
                      value={regionCard || "none"}
                      onValueChange={(value) =>
                        setRegionCard(
                          value === "none" ? undefined : value,
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="지역 선택 (선택사항)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          없음
                        </SelectItem>
                        <SelectItem value="0">전국</SelectItem>
                        <SelectItem value="1">서울</SelectItem>
                        <SelectItem value="2">인천</SelectItem>
                        <SelectItem value="3">대전</SelectItem>
                        <SelectItem value="4">대구</SelectItem>
                        <SelectItem value="5">광주</SelectItem>
                        <SelectItem value="6">부산</SelectItem>
                        <SelectItem value="7">울산</SelectItem>
                        <SelectItem value="8">
                          세종특별자치시
                        </SelectItem>
                        <SelectItem value="31">
                          경기도
                        </SelectItem>
                        <SelectItem value="32">
                          강원도
                        </SelectItem>
                        <SelectItem value="33">
                          충청도
                        </SelectItem>
                        <SelectItem value="35">
                          경상도
                        </SelectItem>
                        <SelectItem value="37">
                          전라도
                        </SelectItem>
                        <SelectItem value="39">
                          제주도
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 flex items-end" data-tour="pd-prepurchased">
                    <div className="flex items-center justify-between w-full px-4 py-3 border rounded-lg bg-muted/30">
                      <div className="flex-1">
                        <Label
                          htmlFor="prePurchased"
                          className="text-sm font-medium cursor-pointer"
                        >
                          선사입형
                        </Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          사전 구매 완료 상품
                        </p>
                      </div>
                      <Switch
                        id="prePurchased"
                        checked={prePurchased}
                        onCheckedChange={setPrePurchased}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 판매 정보 섹션 */}
              <div className="pt-4 border-t" data-tour="pd-price-info">
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">
                  판매 정보
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">정가 *</Label>
                    <Input
                      type="text"
                      value={
                        price
                          ? parseInt(price).toLocaleString()
                          : ""
                      }
                      onChange={(e) => {
                        const numericValue =
                          e.target.value.replace(/[^0-9]/g, "");
                        setPrice(numericValue);
                      }}
                      placeholder="0"
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">판매가</Label>
                    <Input
                      type="text"
                      value={
                        discountPrice
                          ? parseInt(
                              discountPrice,
                            ).toLocaleString()
                          : ""
                      }
                      onChange={(e) => {
                        const numericValue =
                          e.target.value.replace(/[^0-9]/g, "");
                        setDiscountPrice(numericValue);
                      }}
                      placeholder="할인가 (선택사항)"
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">
                      판매 상태 *
                    </Label>
                    <Select
                      value={salesStatus}
                      onValueChange={(value) =>
                        setSalesStatus(value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="READY">
                          준비중
                        </SelectItem>
                        <SelectItem value="ON_SALE">
                          판매중
                        </SelectItem>
                        <SelectItem value="SOLD_OUT">
                          품절
                        </SelectItem>
                        <SelectItem value="ENDED">
                          판매종료
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <div className="flex items-center justify-between px-4 py-3 border rounded-lg">
                      <Label className="text-sm cursor-pointer">
                        상품 활성화
                      </Label>
                      <Switch
                        checked={visible}
                        onCheckedChange={setVisible}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 상품 이미지 섹션 */}
              <div className="pt-4 border-t" data-tour="pd-images">
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">
                  상품 이미지
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">
                      상품 이미지 ({imagePreviews.length}/
                      {MAX_IMAGES})
                    </Label>
                    {imagePreviews.length < MAX_IMAGES && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          document
                            .getElementById(
                              "product-image-upload",
                            )
                            ?.click()
                        }
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        이미지 추가
                      </Button>
                    )}
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="product-image-upload"
                    multiple
                  />

                  {imagePreviews.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {imagePreviews.map((preview, index) => (
                        <div
                          key={index}
                          className="relative aspect-square rounded-lg border overflow-hidden bg-muted group"
                        >
                          <ImageWithFallback
                            src={preview}
                            alt={`${name} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setImagePreviews((prev) =>
                                  prev.filter(
                                    (_, i) => i !== index,
                                  ),
                                );
                                setImageUrls((prev) =>
                                  prev.filter(
                                    (_, i) => i !== index,
                                  ),
                                );
                                setImageFiles((prev) =>
                                  prev.filter(
                                    (_, i) => i !== index,
                                  ),
                                );
                                toast.success(
                                  "이미지가 삭제되었습니다.",
                                );
                              }}
                            >
                              <X className="h-4 w-4 mr-1" />
                              삭제
                            </Button>
                          </div>
                          {index === 0 && (
                            <Badge
                              className="absolute top-2 left-2"
                              variant="secondary"
                            >
                              대표
                            </Badge>
                          )}
                        </div>
                      ))}

                      {imagePreviews.length < MAX_IMAGES && (
                        <div
                          className="relative aspect-video rounded-lg border-2 border-dashed border-border bg-muted/30 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors flex items-center justify-center"
                          onClick={() =>
                            document
                              .getElementById(
                                "product-image-upload",
                              )
                              ?.click()
                          }
                        >
                          <div className="text-center">
                            <ImageIcon className="size-8 mx-auto text-muted-foreground mb-1" />
                            <p className="text-xs text-muted-foreground">
                              추가
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() =>
                        document
                          .getElementById(
                            "product-image-upload",
                          )
                          ?.click()
                      }
                    >
                      <ImageIcon className="size-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-1">
                        클릭하여 상품 이미지 업로드
                      </p>
                      <p className="text-xs text-muted-foreground">
                        최대 {MAX_IMAGES}장, 각 5MB 이하
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "details" && (
          <div className="space-y-6">
            {/* 배송/보증/반품 정보 */}
            <div data-tour="pd-shipping">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-[18px]">
                  발송 및 이용안내
                </h3>
                <Button onClick={handleAdditionalInfoSave}>
                  저장
                </Button>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">
                    {productType === "STAY" ? (
                      <Info className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Truck className="h-4 w-4 text-muted-foreground" />
                    )}
                    {productType === "STAY"
                      ? "예약 안내"
                      : "발송 정보"}
                  </Label>
                  <Textarea
                    value={shippingInfo}
                    onChange={(e) =>
                      setShippingInfo(e.target.value)
                    }
                    placeholder="예: 모바일 자동 티켓 : 결제 완료 후 1시간 전후 24시간 자동 문자 발송"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    이용 안내
                  </Label>
                  <Textarea
                    value={warrantyInfo}
                    onChange={(e) =>
                      setWarrantyInfo(e.target.value)
                    }
                    placeholder="예: 100% 정품 티켓 보장"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    취소/환불 정보
                  </Label>
                  <Textarea
                    value={returnInfo}
                    onChange={(e) =>
                      setReturnInfo(e.target.value)
                    }
                    placeholder="예: 7일 경과시는 취소수수료 10% 차감 후 환불됩니다."
                    rows={3}
                  />
                </div>

                {/* 유효기간 설정 */}
                <div className="space-y-2" data-tour="pd-validity">
                  <Label className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    유효기간 설정
                  </Label>
                  <Select
                    value={validityType}
                    onValueChange={(value: any) =>
                      setValidityType(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="유효기간 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">
                        없음 (제한 없음)
                      </SelectItem>
                      <SelectItem value="FIXED_DATE">
                        고정 날짜 (시작일 ~ 종료일)
                      </SelectItem>
                      <SelectItem value="RELATIVE_DAYS">
                        구매일 기준 (n일간 사용)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 고정 날짜 입력 */}
                {validityType === "FIXED_DATE" && (
                  <div className="space-y-3">
                    {validityFixedDates.map(
                      (dateRange, index) => (
                        <div
                          key={index}
                          className="flex gap-2 items-center"
                        >
                          <div className="flex-1 space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div className="space-y-2">
                                {index === 0 && (
                                  <Label className="text-sm flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    시작일
                                  </Label>
                                )}
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className="w-full justify-start text-left font-normal hover:scale-100"
                                    >
                                      <Calendar className="mr-2 h-4 w-4" />
                                      {dateRange.startDate ? (
                                        new Date(
                                          dateRange.startDate +
                                            "T00:00:00",
                                        ).toLocaleDateString(
                                          "ko-KR",
                                        )
                                      ) : (
                                        <span>날짜 선택</span>
                                      )}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    className="w-auto p-0"
                                    align="start"
                                  >
                                    <CalendarComponent
                                      mode="single"
                                      selected={
                                        dateRange.startDate
                                          ? new Date(
                                              dateRange.startDate +
                                                "T00:00:00",
                                            )
                                          : undefined
                                      }
                                      onSelect={(date) => {
                                        if (date) {
                                          const updated = [
                                            ...validityFixedDates,
                                          ];
                                          const year =
                                            date.getFullYear();
                                          const month = String(
                                            date.getMonth() + 1,
                                          ).padStart(2, "0");
                                          const day = String(
                                            date.getDate(),
                                          ).padStart(2, "0");
                                          updated[
                                            index
                                          ].startDate =
                                            `${year}-${month}-${day}`;
                                          setValidityFixedDates(
                                            updated,
                                          );
                                        }
                                      }}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                              <div className="space-y-2">
                                {index === 0 && (
                                  <Label className="text-sm flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    종료일
                                  </Label>
                                )}
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className="w-full justify-start text-left font-normal hover:scale-100"
                                    >
                                      <Calendar className="mr-2 h-4 w-4" />
                                      {dateRange.endDate ? (
                                        new Date(
                                          dateRange.endDate +
                                            "T00:00:00",
                                        ).toLocaleDateString(
                                          "ko-KR",
                                        )
                                      ) : (
                                        <span>날짜 선택</span>
                                      )}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    className="w-auto p-0"
                                    align="start"
                                  >
                                    <CalendarComponent
                                      mode="single"
                                      selected={
                                        dateRange.endDate
                                          ? new Date(
                                              dateRange.endDate +
                                                "T00:00:00",
                                            )
                                          : undefined
                                      }
                                      onSelect={(date) => {
                                        if (date) {
                                          const updated = [
                                            ...validityFixedDates,
                                          ];
                                          const year =
                                            date.getFullYear();
                                          const month = String(
                                            date.getMonth() + 1,
                                          ).padStart(2, "0");
                                          const day = String(
                                            date.getDate(),
                                          ).padStart(2, "0");
                                          updated[
                                            index
                                          ].endDate =
                                            `${year}-${month}-${day}`;
                                          setValidityFixedDates(
                                            updated,
                                          );
                                        }
                                      }}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={
                              index === 0 ? "mt-6" : ""
                            }
                            onClick={() => {
                              setValidityFixedDates((prev) =>
                                prev.filter(
                                  (_, i) => i !== index,
                                ),
                              );
                              toast.success(
                                "날짜 범위가 삭제되었습니다.",
                              );
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      ),
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setValidityFixedDates((prev) => [
                          ...prev,
                          { startDate: "", endDate: "" },
                        ]);
                      }}
                      className="w-full hover:scale-100"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      날짜 범위 추가
                    </Button>
                  </div>
                )}

                {/* 구매일 기준 일수 입력 */}
                {validityType === "RELATIVE_DAYS" && (
                  <div className="space-y-2">
                    <Label className="text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      유효 일수
                    </Label>
                    <Input
                      type="number"
                      value={validityDays}
                      onChange={(e) =>
                        setValidityDays(e.target.value)
                      }
                      placeholder="구매일로부터 며칠간 사용 가능한지 입력 (예: 30)"
                      min="1"
                    />
                    {validityDays &&
                      parseInt(validityDays) > 0 && (
                        <p className="text-xs text-muted-foreground">
                          예시: 오늘 구매 시{" "}
                          {new Date(
                            new Date().setDate(
                              new Date().getDate() +
                                parseInt(validityDays),
                            ),
                          ).toLocaleDateString("ko-KR")}
                          까지 사용 가능
                        </p>
                      )}
                  </div>
                )}
              </div>
            </div>

            {/* 쇼핑몰 노출 설정 - 상품 수정 모드에서만 표시 */}
            {isEditMode && (
              <div className="pt-6 border-t" data-tour="pd-sections">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-[18px]">
                    쇼핑몰 노출 설정
                  </h3>
                  <Button onClick={handleSectionSave}>
                    저장
                  </Button>
                </div>
                <div className="space-y-4">
                  {availableSections.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>등록된 섹션이 없습니다.</p>
                      <p className="text-xs mt-2">
                        섹션 관리 페이지에서 섹션을
                        추가해주세요.
                      </p>
                    </div>
                  ) : (
                    availableSections.map((section) => (
                      <div
                        key={section.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <Label className="text-sm cursor-pointer">
                                {section.name}
                              </Label>
                              <Badge
                                variant="outline"
                                className="text-xs"
                              >
                                {section.code}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              쇼핑몰 메인 페이지의{" "}
                              {section.name} 섹션에 표시됩니다
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={
                            productSections[section.id] || false
                          }
                          onCheckedChange={(value) =>
                            handleSectionToggle(
                              section.id,
                              value,
                            )
                          }
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 상세 내용 편집기 */}
            <div className="pt-6 border-t" data-tour="pd-detail-editor">
              <div className="border-2 border-dashed border-border rounded-lg p-6 sm:p-12 text-center bg-muted/30">
                <FileText className="size-12 sm:size-16 mx-auto text-muted-foreground mb-3 sm:mb-4 opacity-50" />
                <h3 className="text-base sm:text-lg mb-2">
                  상세 내용 편집기로 이동
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
                  블로그 글쓰기처럼 자유롭게 이미지와 텍스트를
                  추가할 수 있는
                  <br className="hidden sm:inline" />
                  <span className="sm:hidden"> </span>전용 편집
                  페이지에서 상품 상세 내용을 작성하세요.
                </p>

                {/* PC 전용 버튼 */}
                <div className="hidden sm:block">
                  <Button
                    onClick={() =>
                      navigate(
                        `/admin/products/${product.id}/content`,
                      )
                    }
                    size="lg"
                  >
                    <FileText className="size-5 mr-2" />
                    상세 내용 편집하기
                  </Button>
                </div>

                {/* 모바일 안내 */}
                <div className="sm:hidden bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    📱 상세 내용 편집은 PC에서만 가능합니다.
                    <br />
                    복잡한 편집 작업을 위해 PC 환경을
                    권장합니다.
                  </p>
                </div>

                {(detailImages.length > 0 || detailContent) && (
                  <div className="mt-6 sm:mt-8 pt-6 border-t text-left">
                    <p className="text-sm text-muted-foreground mb-4">
                      현재 등록된 내용 미리보기
                    </p>
                    {detailImages.length > 0 && (
                      <div className="mb-4">
                        <Badge
                          variant="outline"
                          className="mb-2"
                        >
                          상세 이미지 {detailImages.length}장
                        </Badge>
                      </div>
                    )}
                    {detailContent && (
                      <div>
                        <Badge
                          variant="outline"
                          className="mb-2"
                        >
                          상세 설명 {detailContent.length}자
                        </Badge>
                        <div
                          className="mt-2 p-4 bg-white rounded-lg border text-sm max-h-[400px] overflow-y-auto prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{
                            __html:
                              renderMarkdown(detailContent),
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "options" && (
          <ProductDetailOptions
            product={product}
            options={options}
            onOptionsUpdate={handleOptionsUpdate}
            onRefresh={() => loadProduct(true)}
          />
        )}

        {activeTab === "datePrices" && (
          <ProductDetailDatePrices
            product={product}
            options={options}
            onUpdate={(updated) => {
              setProduct(updated);
              updateProductLocal(updated);
            }}
          />
        )}

        {activeTab === "sms" && (
          <ProductDetailSms
            product={product}
            onUpdate={(updated) => {
              setProduct(updated);
              updateProductLocal(updated);
            }}
          />
        )}

        {activeTab === "channelPrices" && (
          <ProductDetailChannelPrices
            product={product}
            options={options}
            channels={channels}
            onSave={async (channelPrices) => {
              // 채널별 가격 저장 로직
              console.log("채널별 가격 저장:", channelPrices);
              // 추후 API 연동 시 여기에 추가
            }}
          />
        )}

        {activeTab === "coupons" && (
          <TicketCouponManagement
            productId={product.id}
            options={options}
          />
        )}
      </div>

      {/* 탭별 투어 가이드 */}
      {tourConfig && (
        <CoachMark
          steps={tourConfig.steps}
          isActive={isTourActive}
          onFinish={endTour}
          storageKey={tourConfig.key}
        />
      )}
    </div>
  );
}
export default ProductDetailPage;
