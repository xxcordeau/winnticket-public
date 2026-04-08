import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Download,
  Plus,
  Edit,
  X,
  FileSpreadsheet,
  FileText,
  ImageIcon,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { CoachMark, useCoachMark, TourHelpButton, type TourStep } from "@/components/coach-mark";
import { PageHeader } from "@/components/page-header";
import { SectionManagement } from "./section-management";
import { ProductDetail } from "./detail";
import { SegmentTabs } from "@/components/ui/segment-tabs";
import { ResponsiveProductTable } from "@/components/ui/responsive-product-table";
import { MobilePcNotice } from "@/components/mobile-pc-notice";
import { TablePagination } from "@/components/common/table-pagination";
import type {
  Product,
  SalesStatus,
  CreateProductDto,
  UpdateProductDto,
} from "@/types/product";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/data/products";
import {
  getPartners as getPartnersAPI,
  type PartnerListItem,
} from "@/lib/api/partner";
import {
  useMenuCategories,
  loadMenuFromServer,
} from "@/data/hooks/useShopStore";
import { getActiveSections } from "@/lib/api/section";
import type { Section } from "@/data/dto/section.dto";
import {
  getAdminProducts,
  createAdminProduct,
  updateProductBasic,
  deleteAdminProduct,
  updateProductVisible,
  type AdminProduct,
  type ProductCreateRequest,
  type ProductBasicUpdateRequest,
  type ProductDetail as ProductDetailType,
} from "@/lib/api/product";
import { uploadFiles } from "@/lib/api/file";
import { isApiWithFallback } from "@/lib/data-mode";

export function ProductManagement() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [sections, setSections] = useState<Section[]>([]); // 섹션 목록
  const { categories: allCategories } = useMenuCategories();

  // 상위 카테고리만 필터링 (level 1) - 계층 구��로 변환
  const categories = allCategories
    .filter((cat) => cat.level === 1)
    .map((cat) => ({
      ...cat,
      children: allCategories.filter(
        (child) =>
          child.parentId === cat.id && child.level === 2,
      ),
    }));

  // ⭐ localStorage에서 저장된 상태 복원
  const getInitialState = () => {
    try {
      const saved = localStorage.getItem(
        "productManagementState",
      );
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("상태 복원 실패:", e);
    }
    return {
      searchKeyword: "",
      filterParentCategoryId: "ALL",
      filterSubCategoryId: "ALL",
      filterSalesStatus: "ALL",
      filterPartnerId: "ALL",
      currentPage: 1,
    };
  };

  const initialState = getInitialState();

  const [searchKeyword, setSearchKeyword] = useState(
    initialState.searchKeyword,
  );
  const [filterParentCategoryId, setFilterParentCategoryId] =
    useState<string>(initialState.filterParentCategoryId);
  const [filterSubCategoryId, setFilterSubCategoryId] =
    useState<string>(initialState.filterSubCategoryId);
  const [filterSalesStatus, setFilterSalesStatus] =
    useState<string>(initialState.filterSalesStatus);
  const [filterPartnerId, setFilterPartnerId] =
    useState<string>(initialState.filterPartnerId);
  const [isCreateDialogOpen, setIsCreateDialogOpen] =
    useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] =
    useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] =
    useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] =
    useState(false);
  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);
  const [partners, setPartners] = useState<
    Array<{ id: string; name: string; code: string }>
  >([]);

  // 투어 가이드
  const productTourSteps: TourStep[] = [
    {
      target: "product-add-btn",
      title: "상품 추가",
      description: "새로운 상품을 등록합니다.",
      placement: "bottom",
    },
    {
      target: "product-dialog-basic",
      title: "기본 정보",
      description: "상품명, 카테고리, 파트너를 선택하고\n정가와 판매가를 입력합니다.",
      placement: "bottom",
      waitForTarget: 1500,
    },
    {
      target: "product-dialog-price",
      title: "가격 & 판매상태",
      description: "정가, 판매가, 판매상태를 설정합니다.\n할인가를 입력하면 자동으로 할인율이 계산됩니다.",
      placement: "top",
      waitForTarget: 500,
    },
    {
      target: "product-filters",
      title: "필터 & 검색",
      description: "상위/하위 카테고리, 판매상태, 파트너별로\n상품을 필터링하고 검색할 수 있습니다.",
      placement: "bottom",
    },
    {
      target: "product-table",
      title: "상품 목록",
      description: "등록된 상품 목록입니다.\n행을 클릭하면 상세 관리 페이지로 이동합니다.\n상세 페이지에서 옵션, 가격, SMS 등을 설정할 수 있습니다.",
      placement: "top",
    },
    {
      target: "product-section-tab",
      title: "섹션 관리 탭",
      description: "탭을 전환하여 섹션을 관리할 수 있습니다.\n다음 스텝에서 섹션 기능을 안내합니다.",
      placement: "bottom",
    },
    // 섹션관리 스텝 (탭 전환 후)
    {
      target: "sec-add-btn",
      title: "섹션 추가",
      description: "쇼핑몰 메인 페이지에 표시할 섹션을 추가합니다.\n예: SALE, 인기상품, 신상품 등",
      placement: "bottom",
      waitForTarget: 1500,
    },
    {
      target: "sec-dialog-form",
      title: "섹션 설정",
      description: "• 코드: 섹션 고유 코드 (영문)\n• 이름: 메인에 표시될 섹션 이름\n• 순서: 숫자 작을수록 위에 표시\n• 활성화: 메인 페이지 노출 여부",
      placement: "bottom",
      waitForTarget: 1500,
    },
    {
      target: "sec-table",
      title: "섹션 목록",
      description: "등록된 섹션 목록입니다.\n··· 버튼으로 수정, 삭제할 수 있습니다.\n상품 상세 > 쇼핑몰 노출 설정에서\n각 상품을 섹션에 배치합니다.",
      placement: "top",
    },
  ];

  const { isActive: isTourActive, startTour: _startTour, endTour } = useCoachMark("product_mgmt_tour");
  const productsRef = useRef<Product[]>([]);

  const startTour = () => {
    if (products.length === 0) {
      productsRef.current = [];
      setProducts([{
        id: "dummy-1", code: "SAMPLE001", name: "[투어용] 샘플 입장권", type: "NORMAL",
        categoryId: "", partnerId: "", price: 35000, discountPrice: 28000,
        salesStatus: "ON_SALE" as any, visible: true, prePurchased: false,
        imageUrl: [], description: "투어 가이드용 샘플 상품입니다",
      } as any]);
    }
    _startTour();
  };

  const handleProductTourStepChange = (stepIndex: number, _step: TourStep) => {
    const isProductModalStep = stepIndex === 1 || stepIndex === 2;
    const isSectionTab = stepIndex >= 5; // 5~8: 섹션관리 스텝
    const isSectionModalStep = stepIndex === 7; // sec-dialog-form (모달 내부)

    // 상품 모달 (1~2)
    if (isProductModalStep) {
      if (!isCreateDialogOpen && !isEditDialogOpen) {
        resetForm();
        setSelectedProduct(null);
        setIsCreateDialogOpen(true);
      }
    } else {
      if (isCreateDialogOpen) setIsCreateDialogOpen(false);
      if (isEditDialogOpen) setIsEditDialogOpen(false);
    }

    // 탭 전환
    if (isSectionTab && activeTab !== "sections") {
      setActiveTab("sections");
    }
    if (!isSectionTab && activeTab !== "products") {
      setActiveTab("products");
    }

    // 섹션 모달 열기/닫기는 섹션 컴포넌트에 이벤트로 전달
    if (isSectionModalStep) {
      window.dispatchEvent(new CustomEvent("openSectionDialog"));
    } else if (isSectionTab && !isSectionModalStep) {
      window.dispatchEvent(new CustomEvent("closeSectionDialog"));
    }
  };

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(
    initialState.currentPage,
  );
  const itemsPerPage = 20;

  // 파일 업로드 ref
  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const detailImagesInputRef = useRef<HTMLInputElement>(null);

  // 이미지 파일 상태
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>(
    [],
  );

  // Form states
  const [formData, setFormData] = useState<CreateProductDto>({
    code: "",
    name: "",
    categoryId: "",
    partnerId: undefined,
    productType: "NORMAL" as "STAY" | "NORMAL", // 기본값: 기본형
    price: 0,
    discountPrice: undefined,
    salesStatus: "ON_SALE" as SalesStatus,
    options: [],
    description: "",
    imageUrl: "",
    detailImages: [],
    detailContent: "",
    visible: true,
    displayOrder: 1,
    regionCard: undefined, // 지역카드코드
    ticketType: undefined, // 티켓분류코드
    prePurchased: false, // 선사입형 여부 (기본값: false)
  });

  // ⭐ 상태 변경 시 localStorage에 저장
  useEffect(() => {
    const state = {
      searchKeyword,
      filterParentCategoryId,
      filterSubCategoryId,
      filterSalesStatus,
      filterPartnerId,
      currentPage,
    };
    localStorage.setItem(
      "productManagementState",
      JSON.stringify(state),
    );
  }, [
    searchKeyword,
    filterParentCategoryId,
    filterSubCategoryId,
    filterSalesStatus,
    filterPartnerId,
    currentPage,
  ]);

  // ⭐ 컴포넌트 언마운트 시 localStorage 초기화
  useEffect(() => {
    return () => {
      localStorage.removeItem("productManagementState");
    };
  }, []);

  // ⭐ URL 파라미터에서 페이지 번호 및 필터 복원
  useEffect(() => {
    const pageParam = searchParams.get("page");
    const statusParam = searchParams.get("status");
    if (pageParam) {
      const pageNum = parseInt(pageParam, 10);
      if (!isNaN(pageNum) && pageNum > 0) {
        setCurrentPage(pageNum);
      }
    }
    if (statusParam) {
      setFilterSalesStatus(statusParam);
    }
    // URL 파라미터 제거 (한 번만 적용)
    if (pageParam || statusParam) {
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // ⭐ 페이지 변경 시 스크롤 최상단으로 이동
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  useEffect(() => {
    loadCategories();
    loadProducts();
    loadPartners();
    loadSections();
  }, [
    searchKeyword,
    filterParentCategoryId,
    filterSubCategoryId,
    filterSalesStatus,
    filterPartnerId,
  ]);

  const loadCategories = async () => {
    try {
      console.log("[상품관리] 카테고리 목록 API 호출 시작");
      const categories = await loadMenuFromServer(false);
      console.log("[상품관리] 카테고리 API 응답:", categories);
      console.log(
        "[상품관리] 카테고리 목록 로드 완료:",
        categories.length,
        "개",
      );
    } catch (error) {
      console.error("[상품관리] 카테고리 로드 오류:", error);
    }
  };

  const loadPartners = async () => {
    try {
      console.log("[상품관리] 파트너 목록 API 호출 시작");
      const partnersResponse = await getPartnersAPI();
      console.log(
        "[상품관리] 파트너 API 응답:",
        partnersResponse,
      );

      if (partnersResponse?.success && partnersResponse?.data) {
        // API 응답 데이터가 배열인지 확인 (data.content 구조도 체크)
        let dataArray: any[] = [];
        if (Array.isArray(partnersResponse.data)) {
          dataArray = partnersResponse.data;
        } else if (partnersResponse.data && typeof partnersResponse.data === 'object' && Array.isArray((partnersResponse.data as any).content)) {
          dataArray = (partnersResponse.data as any).content;
        }
        
        // PartnerListItem을 { id, name, code } 형태로 변환
        const formattedPartners = dataArray.map(
          (p: any) => ({
            id: p.id,
            name: p.name,
            code: p.code,
          }),
        );
        setPartners(formattedPartners);
        console.log(
          "[상품관리] 파트너 목록 설정 완료:",
          formattedPartners.length,
          "개",
        );
      } else {
        console.log("[상품관리] 파트너 API 실패, 빈 배열 설정");
        setPartners([]);
      }
    } catch (error) {
      console.error("[상품관리] 파트너 로드 오류:", error);
      setPartners([]);
    }
  };

  const loadSections = async () => {
    try {
      const sectionsResponse = await getActiveSections();
      console.log(
        "[상품관리] 섹션 로드 응답:",
        sectionsResponse,
      );
      if (sectionsResponse.success && sectionsResponse.data) {
        setSections(sectionsResponse.data);
        console.log(
          "[상품관리] 섹션 목록:",
          sectionsResponse.data,
        );
      }
    } catch (error) {
      console.error("[상품관리] 섹션 로드 오류:", error);
    }
  };

  // 상위 카테고리가 변경되면 하위 카테고리 초기화
  useEffect(() => {
    setFilterSubCategoryId("ALL");
  }, [filterParentCategoryId]);

  const loadProducts = async () => {
    try {
      // 쿼리 파라미터 구성
      const params: {
        srchWord?: string;
        categoryId?: string;
        salesStatus?: string;
      } = {};

      // 검색어
      if (searchKeyword.trim()) {
        params.srchWord = searchKeyword;
      }

      // 카테고리 필터링
      if (filterSubCategoryId !== "ALL") {
        params.categoryId = filterSubCategoryId;
      } else if (filterParentCategoryId !== "ALL") {
        params.categoryId = filterParentCategoryId;
      }

      // 판매 상태 필터링
      if (filterSalesStatus !== "ALL") {
        params.salesStatus = filterSalesStatus;
      }

      // 실제 백엔드 API 호출
      const response = await getAdminProducts(params);

      if (response?.success && response?.data) {
        // API 응답 데이터가 배열인지 확인 (data.content 구조도 체크)
        let dataArray: any[] = [];
        if (Array.isArray(response.data)) {
          dataArray = response.data;
        } else if (response.data && typeof response.data === 'object' && Array.isArray((response.data as any).content)) {
          dataArray = (response.data as any).content;
        }
        
        // AdminProduct를 Product 타입으로 변환
        let filteredProducts = dataArray.map(
          (adminProduct): Product => {
            const category = allCategories.find(
              (cat) => cat.id === adminProduct.categoryId,
            );

            // 더미 데이터에서 상세 정보 가져오기 (이미지가 API 응답에 없을 때만)
            const dummyProductsResponse = getProducts(0, 1000);
            const dummyProduct =
              dummyProductsResponse.success &&
              dummyProductsResponse.data
                ? dummyProductsResponse.data.content.find(
                    (p) => p.id === adminProduct.id,
                  )
                : null;

            // API에서 image 필드가 있으면 사용, 없으면 더미 데이터 사용
            const imageUrl =
              adminProduct.image ||
              dummyProduct?.imageUrl ||
              "";

            return {
              id: adminProduct.id,
              code: adminProduct.code,
              name: adminProduct.name,
              categoryId: adminProduct.categoryId,
              categoryName: category?.name || "",
              partnerId: adminProduct.partnerId || undefined,
              partnerName: adminProduct.partnerName || undefined,
              price: adminProduct.price,
              discountPrice: adminProduct.discountPrice,
              salesStatus: adminProduct.salesStatus || "READY",
              stock: adminProduct.stock,
              visible: adminProduct.visible,
              displayOrder: dummyProduct?.displayOrder || 0,
              imageUrl: imageUrl,
              description: dummyProduct?.description || "",
              detailImages: dummyProduct?.detailImages || [],
              detailContent: dummyProduct?.detailContent || "",
              options: dummyProduct?.options || [],
              shippingInfo: dummyProduct?.shippingInfo,
              warrantyInfo: dummyProduct?.warrantyInfo,
              returnInfo: dummyProduct?.returnInfo,
              createdAt:
                dummyProduct?.createdAt ||
                new Date().toISOString(),
              updatedAt:
                dummyProduct?.updatedAt ||
                new Date().toISOString(),
            };
          },
        );

        // 파트너 필터링 (프론트엔드에서 처리 - API에 파라미터 없음)
        if (filterPartnerId !== "ALL") {
          filteredProducts = filteredProducts.filter(
            (p) => p.partnerId === filterPartnerId,
          );
        }

        // ⭐ 중복 제거: ID가 같은 상품이 여러 개 있을 경우 첫 번째만 유지
        const uniqueProducts = filteredProducts.reduce(
          (acc, current) => {
            const exists = acc.find(
              (item) => item.id === current.id,
            );
            if (!exists) {
              acc.push(current);
            }
            return acc;
          },
          [] as Product[],
        );

        console.log('[상품관리] 중복 제거 완료:', {
          원본: filteredProducts.length,
          중복제거후: uniqueProducts.length,
          제거된개수: filteredProducts.length - uniqueProducts.length
        });

        setProducts(uniqueProducts);
      } else {
        // API 실패 시 - fallback 모드면 더미 데이터 사용
        if (isApiWithFallback()) {
          console.log("[상품관리] API 실패, 더미 데이터로 fallback");
          const dummyResponse = getProducts(0, 1000);
          if (dummyResponse.success && dummyResponse.data) {
            // 더미 데이터에서도 중복 제거
            const uniqueDummyProducts = dummyResponse.data.content.reduce(
              (acc, current) => {
                const exists = acc.find((item) => item.id === current.id);
                if (!exists) {
                  acc.push(current);
                }
                return acc;
              },
              [] as Product[],
            );
            console.log('[상품관리] 더미 데이터 중복 제거:', {
              원본: dummyResponse.data.content.length,
              중복제거후: uniqueDummyProducts.length
            });
            setProducts(uniqueDummyProducts);
          } else {
            setProducts([]);
          }
        } else {
          setProducts([]);
        }
      }
    } catch (error) {
      console.error("상품 목록 로드 오류:", error);

      // 에러 시 - fallback 모드면 더미 데이터 사용
      if (isApiWithFallback()) {
        console.log("[상품관리] 에러 발생, 더미 데이터로 fallback");
        const dummyResponse = getProducts(0, 1000);
        if (dummyResponse.success && dummyResponse.data) {
          // 더미 데이터에서도 중복 제거
          const uniqueDummyProducts = dummyResponse.data.content.reduce(
            (acc, current) => {
              const exists = acc.find((item) => item.id === current.id);
              if (!exists) {
                acc.push(current);
              }
              return acc;
            },
            [] as Product[],
          );
          console.log('[상품관리] 더미 데이터 중복 제거 (에러):', {
            원본: dummyResponse.data.content.length,
            중복제거후: uniqueDummyProducts.length
          });
          setProducts(uniqueDummyProducts);
        } else {
          setProducts([]);
        }
      } else {
        setProducts([]);
      }
    }
  };

  // 백엔드 SalesStatus를 프론트엔드 SalesStatus로 매핑
  const mapSalesStatus = (
    status:
      | "READY"
      | "ON_SALE"
      | "PAUSED"
      | "SOLD_OUT"
      | "ENDED",
  ): SalesStatus => {
    const statusMap: Record<string, SalesStatus> = {
      READY: "판매대기",
      ON_SALE: "판매중",
      PAUSED: "판매중단",
      SOLD_OUT: "품절",
      ENDED: "판매종료",
    };
    return statusMap[status] || "판매대기";
  };

  // 프론트엔드 SalesStatus를 ���엔드 SalesStatus로 매핑
  const mapSalesStatusToBackend = (
    status: SalesStatus,
  ): "READY" | "ON_SALE" | "PAUSED" | "SOLD_OUT" | "ENDED" => {
    const statusMap: Record<
      SalesStatus,
      "READY" | "ON_SALE" | "PAUSED" | "SOLD_OUT" | "ENDED"
    > = {
      판매대기: "READY",
      판매중: "ON_SALE",
      판매중단: "PAUSED",
      품절: "SOLD_OUT",
      판매종료: "ENDED",
    };
    return statusMap[status] || "READY";
  };

  // 선택된 상위 카테고리의 하위 카테고리 목록
  const selectedParentCategory = categories.find(
    (cat) => cat.id === filterParentCategoryId,
  );
  const subCategories = selectedParentCategory?.children || [];

  const handleOpenDetail = (product: Product) => {
    navigate(`/admin/products/${product.id}?returnPage=${currentPage}`);
  };

  const handleUpdateProductFromDetail = (
    updatedProduct: Product,
  ) => {
    const response = updateProduct(updatedProduct);
    if (response.success) {
      loadProducts();
      toast.success("상품이 업데이트되었습니다.");
    } else {
      toast.error(response.message);
    }
  };

  const handleCreate = async () => {
    // 유효성 검사
    if (!formData.name.trim()) {
      toast.error("상품명을 입력해주세요.");
      return;
    }
    // ⭐ 상품 코드는 백엔드에서 자동 생성하므로 검증 제거
    if (!formData.categoryId) {
      toast.error("카테���리를 선택해주세요.");
      return;
    }
    if (formData.price <= 0) {
      toast.error("가격을 입력해주세요.");
      return;
    }
    if (formData.discountPrice && formData.discountPrice > formData.price) {
      toast.error("판매가는 정가보다 클 수 없습니다.");
      return;
    }

    try {
      // 백엔드 API 요청 형식으로 변환
      const productRequest: ProductCreateRequest = {
        name: formData.name,
        // ⭐ code는 백엔드에서 자동 생성하므로 보내지 않음
        categoryId: formData.categoryId,
        partnerId: formData.partnerId || undefined,
        type: formData.productType, // ⭐ productType → type으로 변경
        description: formData.description || "",
        imageUrl: imagePreviews.length > 0 ? imagePreviews : [], // ⭐ 이미지 없으면 빈 배열
        price: formData.price,
        discountPrice: formData.discountPrice || formData.price,
        salesStatus: formData.salesStatus,
        displayOrder: formData.displayOrder,
        visible: formData.visible,
        regionCode:
          formData.regionCard?.toString() || undefined, // ⭐ regionCard → regionCode로 변경, 빈 값이면 undefined
        ticketType:
          formData.ticketType?.toString().padStart(2, "0") ||
          undefined, // ⭐ 두 자리 문자열로 ("01", "02" 등), 빈 값이면 undefined
        prePurchased: formData.prePurchased ?? false, // ⭐ 선사입형 여부 (기본값: false)
      };

      console.log("[상품관리] formData:", formData);
      console.log(
        "[상품관리] productRequest 전송:",
        productRequest,
      );
      console.log("[상품관리] 이미지 URL들:", imagePreviews);

      // 이미지 URL이 이미 업로드되어 있으므로 파일 전송 불필요
      const response = await createAdminProduct(productRequest);

      if (response.success) {
        toast.success("상품이 등록되었습니다.");
        setIsCreateDialogOpen(false);
        resetForm();
        setImageFiles([]);
        setImagePreviews([]);
        loadProducts();
        return response.data; // 생성된 상품 반환
      } else {
        toast.error(response.message);
        return null;
      }
    } catch (error) {
      console.error("상품 등록 오류:", error);
      toast.error("상품 등록에 실패했습니다.");
      return null;
    }
  };

  const handleCreateAndEditContent = async () => {
    const createdProduct = await handleCreate(); // await 추가!
    if (createdProduct && createdProduct.id) {
      // 상세 내용 편집 페이지로 이동
      navigate(`/admin/products/${createdProduct.id}/content`);
    }
  };

  const handleEdit = async () => {
    if (!selectedProduct) return;

    try {
      // 백엔드 API 요청 형식으로 변환 (기본정보만)
      const productRequest: ProductBasicUpdateRequest = {
        name: formData.name,
        code: formData.code,
        categoryId: formData.categoryId,
        partnerId: formData.partnerId || undefined,
        price: formData.price,
        discountPrice: formData.discountPrice || formData.price,
        salesStatus: formData.salesStatus,
        description: formData.description || "",
        imageUrl:
          imagePreviews.length > 0
            ? imagePreviews
            : formData.imageUrl || "", // 업로드된 이미지 URL들
        regionCode: formData.regionCard?.toString(), // 지역카드코드
        ticketType: formData.ticketType
          ?.toString()
          .padStart(2, "0"), // 두 자리 문자열로 ("01", "02" 등)
      };

      console.log("[상품관리] 수정 formData:", formData);
      console.log(
        "[상품관리] 수정 productRequest 전송:",
        productRequest,
      );

      const response = await updateProductBasic(
        selectedProduct.id,
        productRequest,
      );
      if (response.success) {
        toast.success("상품이 수정되었습니다.");
        setIsEditDialogOpen(false);
        setSelectedProduct(null);
        resetForm();
        setImageFiles([]);
        setImagePreviews([]);
        loadProducts();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error("상품 수정 오류:", error);
      toast.error("상품 수���에 실패했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;

    try {
      const response = await deleteAdminProduct(
        selectedProduct.id,
      );
      if (response.success) {
        toast.success("상품이 삭제되었습니다.");
        setIsDeleteDialogOpen(false);
        setSelectedProduct(null);
        loadProducts();
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error("상품 삭제 오류:", error);
      toast.error("상품 삭제에 실패했습니다.");
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      categoryId: "",
      partnerId: undefined,
      productType: "NORMAL" as "STAY" | "NORMAL", // 기본값: 기본형
      price: 0,
      discountPrice: undefined,
      salesStatus: "ON_SALE" as SalesStatus,
      stock: 0,
      options: [],
      description: "",
      imageUrl: "",
      detailImages: [],
      detailContent: "",
      visible: true,
      displayOrder: 1,
    });
  };

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      code: product.code,
      name: product.name,
      categoryId: product.categoryId,
      categoryName: product.categoryName,
      partnerId: product.partnerId,
      partnerName: product.partnerName,
      price: product.price,
      discountPrice: product.discountPrice,
      salesStatus: product.salesStatus,
      stock: product.stock,
      options: product.options,
      description: product.description,
      imageUrl: product.imageUrl || "",
      detailImages: product.detailImages || [],
      detailContent: product.detailContent || "",
      visible: product.visible,
      displayOrder: product.displayOrder,
      regionCard:
        (product as any).regionCode ||
        (product as any).regionCd ||
        (product as any).regionCard, // 지역카드코드
      ticketType: (product as any).ticketType, // 티켓분류코드
    });

    // 기존 이미지 로드
    const existingImages =
      product.imageUrls ||
      (product.imageUrl ? [product.imageUrl] : []);
    setImagePreviews(existingImages);

    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const toggleVisible = async (product: Product) => {
    try {
      console.log(
        "[활성화 토글] 상품:",
        product.id,
        "현재 visible:",
        product.visible,
        "→ 변경:",
        !product.visible,
      );

      // 새로운 활성화 여부 수정 API 사용
      const response = await updateProductVisible(
        product.id,
        !product.visible,
      );

      if (response.success) {
        // 로컬 상태도 업데이트
        updateProduct({
          ...product,
          visible: !product.visible,
        });

        toast.success(
          !product.visible
            ? "상품이 활성화되었습니다."
            : "상품이 비활성화되었습니다.",
        );
        loadProducts();
      } else {
        toast.error(
          response.message ||
            "활성화 상태 변경에 실패했습니다.",
        );
      }
    } catch (error) {
      console.error("[활성화 토글] 오류:", error);
      toast.error("활성화 상태 변경 중 오류가 발생했습니다.");
    }
  };

  // 대표 이미지 업로드 (최대 4장)
  const handleMainImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files) return;

    const currentCount = imagePreviews.length;
    const newFiles = Array.from(files);

    if (currentCount + newFiles.length > 4) {
      toast.error(
        "대표 이미지는 최대 4장까지 등록할 수 있습니다.",
      );
      return;
    }

    // 파일 유효성 검사
    for (const file of newFiles) {
      if (!file.type.startsWith("image/")) {
        toast.error("이미지 파일만 업로드할 수 있습니다.");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("이미지 크기는 5MB 이하여야 합니다.");
        return;
      }
    }

    try {
      // 서버에 업로드하여 URL 받기
      console.log(
        "[대표 이미지] 업로드 시작:",
        newFiles.length,
        "개",
      );
      const uploadResponse = await uploadFiles(newFiles);

      if (!uploadResponse.success || !uploadResponse.data) {
        toast.error(
          uploadResponse.message ||
            "이미지 업로드에 실패했습니다.",
        );
        return;
      }

      const newUrls = uploadResponse.data;
      console.log("[대표 이미지] 업로드 성공 URL:", newUrls);

      // State 한 번에 업데이트
      setImageFiles((prev) => [...prev, ...newFiles]);
      setImagePreviews((prev) => {
        const updatedPreviews = [...prev, ...newUrls];
        setFormData((current) => ({
          ...current,
          imageUrl: updatedPreviews[0] || "",
          imageUrls: updatedPreviews,
        }));
        return updatedPreviews;
      });

      toast.success(
        `${newFiles.length}장의 이미지가 업로드되었습니다.`,
      );
    } catch (error) {
      console.error("[대표 이미지] 업로드 오류:", error);
      toast.error("이미지 업로드에 실패했습니다.");
    }

    // input 초기화 (같은 파일 다시 선택 가능하도록)
    e.target.value = "";
  };

  // 대표 이미지 삭제
  const handleRemoveMainImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => {
      const newPreviews = prev.filter((_, i) => i !== index);
      setFormData((current) => ({
        ...current,
        imageUrl: newPreviews[0] || "",
        imageUrls: newPreviews,
      }));
      return newPreviews;
    });
  };

  // 상세 이미지 업로드
  const handleDetailImagesUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error("이미지 파일만 업로드할 수 있습니다.");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("이미지 크기는 5MB 이하여야 합니다.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setFormData((prev) => {
          const newDetailImages = [
            ...(prev.detailImages || []),
            imageUrl,
          ];
          // 첫 번째 이미지가 없으면 자동으로 대표 이미지로 설정
          const newImageUrl = prev.imageUrl || imageUrl;
          return {
            ...prev,
            detailImages: newDetailImages,
            imageUrl: newImageUrl,
          };
        });
      };
      reader.readAsDataURL(file);
    });

    // input 초기화
    if (detailImagesInputRef.current) {
      detailImagesInputRef.current.value = "";
    }
  };

  const handleRemoveDetailImage = (index: number) => {
    const imageToRemove = formData.detailImages?.[index];
    const newDetailImages = formData.detailImages?.filter(
      (_, i) => i !== index,
    );

    // 삭제하려는 이미지가 대표 이미지인 경우
    if (imageToRemove === formData.imageUrl) {
      // 다른 이미지가 있으면 �� 번째 이미지를 대표로, 없으면 빈 문자열
      const newMainImage =
        newDetailImages && newDetailImages.length > 0
          ? newDetailImages[0]
          : "";
      setFormData({
        ...formData,
        detailImages: newDetailImages,
        imageUrl: newMainImage,
      });
    } else {
      setFormData({
        ...formData,
        detailImages: newDetailImages,
      });
    }
  };

  const handleSetMainImage = (imageUrl: string) => {
    setFormData({
      ...formData,
      imageUrl,
    });
    toast.success("대표 이미지가 변경되었습니다.");
  };

  const getSalesStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "ON_SALE":
        return "default";
      case "SOLD_OUT":
        return "destructive";
      case "READY":
        return "secondary";
      case "PAUSED":
        return "outline";
      default:
        return "outline";
    }
  };

  const getSalesStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      READY: "준비중",
      ON_SALE: "판매중",
      SOLD_OUT: "품절",
      PAUSED: "판매중단",
    };
    return labels[status] || status;
  };

  // 카테고리 리를 평평하게 만들기
  const flatCategories = categories.flatMap((cat) => [
    cat,
    ...(cat.children || []),
  ]);

  const getCategoryName = (categoryId: string) => {
    const category = flatCategories.find(
      (cat) => cat.id === categoryId,
    );
    if (!category) return "-";
    if (category.level === 2) {
      const parent = categories.find(
        (cat) => cat.id === category.parentId,
      );
      return parent
        ? `${parent.name} > ${category.name}`
        : category.name;
    }
    return category.name;
  };

  // 페이지네이션 계산
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const paginatedProducts = products.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const toggleOptionSelection = (optionId: string) => {
    const isSelected = formData.optionIds.includes(optionId);
    if (isSelected) {
      setFormData({
        ...formData,
        optionIds: formData.optionIds.filter(
          (id) => id !== optionId,
        ),
      });
    } else {
      setFormData({
        ...formData,
        optionIds: [...formData.optionIds, optionId],
      });
    }
  };

  // CSV 내보내기
  const handleExportCSV = () => {
    try {
      // CSV 헤더
      const headers = [
        "상품코드",
        "상품명",
        "카테고리",
        "파트너",
        "정가",
        "할인가",
        "판매가",
        "할인율(%)",
        "판매상태",
        "활성화",
        "등록일",
      ];

      // CSV 데이터 생성
      const csvData = products.map((product) => {
        const finalPrice =
          product.discountPrice ?? product.price;
        const discountRate = product.discountPrice
          ? Math.round(
              ((product.price - product.discountPrice) /
                product.price) *
                100,
            )
          : 0;

        return [
          product.code,
          `"${product.name}"`, // 쉼표 포함 가능성 때문에 따옴표로 감싸기
          `"${getCategoryName(product.categoryId)}"`,
          product.partnerName || "-",
          product.price,
          product.discountPrice || "-",
          finalPrice,
          discountRate,
          getSalesStatusLabel(product.salesStatus),
          product.visible ? "활성" : "비활성",
          new Date(product.createdAt).toLocaleDateString(
            "ko-KR",
          ),
        ].join(",");
      });

      // CSV 파일 생성
      const csvContent = [
        "\uFEFF" + headers.join(","), // UTF-8 BOM 추가
        ...csvData,
      ].join("\n");

      // 파일 다운로드
      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `상품목록_${new Date().toISOString().slice(0, 10)}.csv`,
      );
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("CSV 파일이 다운로드되었습니다.");
    } catch (error) {
      toast.error("CSV 내보내기에 실��했습니다.");
      console.error(error);
    }
  };

  // Excel 내보내기
  const handleExportExcel = () => {
    try {
      // Excel 데이터 준비
      const data = products.map((product) => {
        const finalPrice =
          product.discountPrice ?? product.price;
        const discountRate = product.discountPrice
          ? Math.round(
              ((product.price - product.discountPrice) /
                product.price) *
                100,
            )
          : 0;

        return {
          상품코드: product.code,
          상품명: product.name,
          카테고리: getCategoryName(product.categoryId),
          파트너: product.partnerName || "-",
          정가: product.price,
          할인가: product.discountPrice || "-",
          판매가: finalPrice,
          "할인율(%)": discountRate,
          판매상태: product.salesStatus,
          활성화: product.visible ? "활성" : "비활",
          표시순서: product.displayOrder,
          등록일: new Date(
            product.createdAt,
          ).toLocaleDateString("ko-KR"),
          수정일: new Date(
            product.updatedAt,
          ).toLocaleDateString("ko-KR"),
        };
      });

      // XLSX 라이브러리를 사용하지 고 간단한 HTML 테이블 기반 Excel 생성
      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head>
          <meta charset="UTF-8">
          <style>
            table { border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; }
            th { background-color: #f2f2f2; font-weight: bold; }
          </style>
        </head>
        <body>
          <table>
            <thead>
              <tr>
                <th>상품코드</th>
                <th>상품명</th>
                <th>카테고리</th>
                <th>파트너</th>
                <th>정가</th>
                <th>할인가</th>
                <th>판매가</th>
                <th>할인율(%)</th>
                <th>판매상태</th>
                <th>활성화</th>
                <th>표시순서</th>
                <th>등록일</th>
                <th>수정일</th>
              </tr>
            </thead>
            <tbody>
      `;

      data.forEach((row) => {
        html += "<tr>";
        html += `<td>${row["상품코드"]}</td>`;
        html += `<td>${row["상품명"]}</td>`;
        html += `<td>${row["카테고리"]}</td>`;
        html += `<td>${row["파트너"]}</td>`;
        html += `<td>${row["정가"]}</td>`;
        html += `<td>${row["할인가"]}</td>`;
        html += `<td>${row["판매가"]}</td>`;
        html += `<td>${row["할인율(%)"]}</td>`;
        html += `<td>${row["판매상태"]}</td>`;
        html += `<td>${row["활성화"]}</td>`;
        html += `<td>${row["표시순서"]}</td>`;
        html += `<td>${row["등록일"]}</td>`;
        html += `<td>${row["수정일"]}</td>`;
        html += "</tr>";
      });

      html += `
            </tbody>
          </table>
        </body>
        </html>
      `;

      // 파일 다운로드
      const blob = new Blob([html], {
        type: "application/vnd.ms-excel;charset=utf-8;",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `상품목록_${new Date().toISOString().slice(0, 10)}.xls`,
      );
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Excel 파일이 다운로드되었습니다.");
    } catch (error) {
      toast.error("Excel 내보내기에 실패했습니다.");
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="상품 관리"
        subtitle="쇼핑몰에 등록된 상품을 관리합니다."
        language="ko"
        rightContent={
          <TourHelpButton onClick={startTour} />
        }
        action={
          process.env.NODE_ENV === "development" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (
                  window.confirm(
                    "상품 데이터를 초기값으로 리셋하시겠습니까?\n\n최신 이미지가 포함된 데이터로 업데이트됩니다.",
                  )
                ) {
                  (window as any).resetProducts();
                }
              }}
            >
              🔄 데이터 리셋 (개발용)
            </Button>
          )
        }
      />

      {/* Tabs */}
      <div data-tour="product-section-tab" className="w-full md:inline-flex">
        <SegmentTabs
          value={activeTab}
          onValueChange={setActiveTab}
          options={[
            { value: "products", label: "상품 목록" },
            { value: "sections", label: "섹션 관리" },
          ]}
        />
      </div>

      {/* 모바일 안내 메시지 */}
      <MobilePcNotice pageName="상품관리 페이지" />

      {activeTab === "sections" ? (
        <SectionManagement isTourActive={isTourActive} />
      ) : (
        <>
          {/* Table Container */}
          <div className="bg-card relative rounded-[8px] flex-1 flex flex-col">
            <div
              aria-hidden="true"
              className="absolute border border-border border-solid inset-0 pointer-events-none rounded-[8px]"
            />

            <div className="flex flex-col gap-4 px-4 py-4 sm:gap-[20px] sm:px-[32px] sm:py-[20px] sm:flex-1 sm:overflow-hidden sm:box-border sm:content-stretch">
              {/* Search and Actions */}
              <div className="content-stretch flex items-center justify-between relative shrink-0 w-full flex-wrap gap-4">
                {/* Search */}
                <div className="bg-background box-border content-stretch flex gap-[8px] h-[36px] items-center px-[16px] py-[8px] relative rounded-[6px] shrink-0 w-full sm:w-[360px] focus-within:shadow-[0_0_0_1px_#0c8ce9] transition-shadow">
                  <div
                    aria-hidden="true"
                    className="absolute border border-border border-solid inset-0 pointer-events-none rounded-[6px]"
                  />
                  <Search className="h-[18px] w-[18px] text-muted-foreground" />
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) =>
                      setSearchKeyword(e.target.value)
                    }
                    placeholder="상품명, 코드로 검색..."
                    className="text-[12px] text-muted-foreground placeholder:text-muted-foreground bg-transparent border-none outline-none flex-1"
                  />
                </div>

                {/* Filters */}
                <div className="flex gap-2 flex-wrap w-full sm:w-auto" data-tour="product-filters">
                  <Select
                    value={filterParentCategoryId}
                    onValueChange={setFilterParentCategoryId}
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="상위메뉴">
                        {filterParentCategoryId === "ALL"
                          ? "상위메뉴"
                          : categories.find(
                              (cat) =>
                                cat.id ===
                                filterParentCategoryId,
                            )?.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">전체</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={filterSubCategoryId}
                    onValueChange={setFilterSubCategoryId}
                    disabled={
                      filterParentCategoryId === "ALL" ||
                      subCategories.length === 0
                    }
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="하위메뉴">
                        {filterSubCategoryId === "ALL"
                          ? "하위메뉴"
                          : subCategories.find(
                              (cat) =>
                                cat.id === filterSubCategoryId,
                            )?.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">전체</SelectItem>
                      {subCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={filterSalesStatus}
                    onValueChange={setFilterSalesStatus}
                  >
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="전체 상태" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">
                        전체 상태
                      </SelectItem>
                      <SelectItem value="ON_SALE">판매중</SelectItem>
                      <SelectItem value="READY">준비중</SelectItem>
                      <SelectItem value="SOLD_OUT">품절</SelectItem>
                      <SelectItem value="PAUSED">판매중단</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={filterPartnerId}
                    onValueChange={setFilterPartnerId}
                  >
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="전체 파트너" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">
                        전체 파트너
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

                {/* Action Buttons */}
                <div className="flex gap-2 ml-auto w-full sm:w-auto justify-end">
                  {/* Export Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        내보내기
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={handleExportExcel}
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                        Excel (.xls)
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleExportCSV}
                      >
                        <FileText className="h-4 w-4 mr-2 text-blue-600" />
                        CSV (.csv)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Add Button */}
                  <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="gap-2"
                    data-tour="product-add-btn"
                  >
                    <Plus className="h-4 w-4" />
                    상품 추가
                  </Button>
                </div>
              </div>

              {/* Table */}
              <div data-tour="product-table">
              <ResponsiveProductTable
                products={paginatedProducts}
                onDelete={openDeleteDialog}
                onOpenDetail={handleOpenDetail}
                onToggleVisible={toggleVisible}
                onNavigateToContentEditor={(productId) =>
                  navigate(
                    `/admin/products/${productId}/content`,
                  )
                }
                getCategoryName={getCategoryName}
                getSalesStatusBadgeVariant={
                  getSalesStatusBadgeVariant
                }
              />
              </div>
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>

          {/* Create/Edit Dialog */}
          <Dialog
            open={isCreateDialogOpen || isEditDialogOpen}
            modal={!isTourActive}
            onOpenChange={(open) => {
              if (isTourActive && !open) return;
              if (!open) {
                setIsCreateDialogOpen(false);
                setIsEditDialogOpen(false);
                setSelectedProduct(null);
                resetForm();
                setImageFiles([]);
                setImagePreviews([]);
              }
            }}
          >
            <DialogContent
              className="max-w-[700px] max-h-[85vh] overflow-y-auto"
              onInteractOutside={(e) => e.preventDefault()}
              onEscapeKeyDown={(e) => e.preventDefault()}
            >
              <DialogHeader>
                <DialogTitle>
                  {isCreateDialogOpen
                    ? "상품 추가"
                    : "상품 수정"}
                </DialogTitle>
                <DialogDescription>
                  상품 정보를 입력하세요.
                  {isCreateDialogOpen && (
                    <span className="block mt-1 text-xs text-muted-foreground">
                      💡 상품 추가 후 상세 내용(이미지, 설명)은
                      목록에서 "상세 내용 편집"을 클릭하여
                      작성할 수 있습니다.
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* 기본 정보 */}
                <div className="space-y-4 p-4 border rounded-lg" data-tour="product-dialog-basic">
                  <h3 className="font-medium">기본 정보</h3>
                  <div className="space-y-2">
                    <Label>
                      상품명{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          name: e.target.value,
                        })
                      }
                      placeholder="상품명 입력"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>
                        카테고리{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.categoryId}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            categoryId: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="카테고리 선택">
                            {formData.categoryId
                              ? getCategoryName(
                                  formData.categoryId,
                                )
                              : "카테고리 선택"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <div key={cat.id}>
                              <SelectItem value={cat.id}>
                                <span className="font-semibold">
                                  {cat.name}
                                </span>
                              </SelectItem>
                              {cat.children?.map((child) => (
                                <SelectItem
                                  key={child.id}
                                  value={child.id}
                                >
                                  <span className="ml-4">
                                    └ {child.name}
                                  </span>
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>파트너</Label>
                      <Select
                        value={formData.partnerId || "none"}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            partnerId:
                              value === "none"
                                ? undefined
                                : value,
                          })
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
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>지역</Label>
                      <Select
                        value={formData.regionCard || "none"}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            regionCard:
                              value === "none"
                                ? undefined
                                : value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="지역 선택 (선택사항)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            없음
                          </SelectItem>
                          <SelectItem value="0">
                            전국
                          </SelectItem>
                          <SelectItem value="1">
                            서울
                          </SelectItem>
                          <SelectItem value="2">
                            인천
                          </SelectItem>
                          <SelectItem value="3">
                            대전
                          </SelectItem>
                          <SelectItem value="4">
                            대구
                          </SelectItem>
                          <SelectItem value="5">
                            광주
                          </SelectItem>
                          <SelectItem value="6">
                            부산
                          </SelectItem>
                          <SelectItem value="7">
                            울산
                          </SelectItem>
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
                    <div className="space-y-2">
                      <Label>티켓분류</Label>
                      <Select
                        value={formData.ticketType || "none"}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            ticketType:
                              value === "none"
                                ? undefined
                                : value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="티켓분류 선택 (선택사항)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            없음
                          </SelectItem>
                          <SelectItem value="1">
                            테마파크
                          </SelectItem>
                          <SelectItem value="2">
                            수상.레저
                          </SelectItem>
                          <SelectItem value="3">
                            체험
                          </SelectItem>
                          <SelectItem value="4">
                            공연.전시
                          </SelectItem>
                          <SelectItem value="5">
                            실내관광지(박물관,정원 등)
                          </SelectItem>
                          <SelectItem value="6">
                            패키지
                          </SelectItem>
                          <SelectItem value="99">
                            기타
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>상품 설명 (간단한 한줄 설명)</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="예: 2025 서울 뮤지컬 페스티벌 얼리버드 티켓"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>
                      대표 이미지 (썸네일) - 최대 4장
                    </Label>
                    <div className="space-y-2">
                      <input
                        ref={mainImageInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleMainImageUpload}
                      />
                      {imagePreviews.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {imagePreviews.map(
                            (preview, index) => (
                              <div
                                key={index}
                                className="relative aspect-video rounded-lg border overflow-hidden bg-muted"
                              >
                                <img
                                  src={preview}
                                  alt={`대표 이미지 ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute top-2 right-2"
                                  onClick={() =>
                                    handleRemoveMainImage(index)
                                  }
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                                {index === 0 && (
                                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                                    대표
                                  </div>
                                )}
                              </div>
                            ),
                          )}
                          {imagePreviews.length < 4 && (
                            <div
                              className="aspect-video border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                              onClick={() =>
                                mainImageInputRef.current?.click()
                              }
                            >
                              <Plus className="size-8 text-muted-foreground mb-1" />
                              <p className="text-xs text-muted-foreground">
                                이미지 추가
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                          onClick={() =>
                            mainImageInputRef.current?.click()
                          }
                        >
                          <ImageIcon className="size-12 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground mb-1">
                            클릭하여 대표 이미지 업로드
                          </p>
                          <p className="text-xs text-muted-foreground">
                            최대 4장, 각 5MB 이하
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 상품 타입 선택 */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">상품 타입</h3>
                    {isEditDialogOpen && (
                      <span className="text-xs text-muted-foreground">
                        ⚠️ 등록 후 변경 불가
                      </span>
                    )}
                  </div>

                  {isCreateDialogOpen ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        상품의 타입을 선택하세요. 등록 후에는
                        변경할 수 없습니다.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* 기본형 */}
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              productType: "NORMAL",
                            })
                          }
                          className={`p-4 border-2 rounded-lg transition-all ${
                            formData.productType === "NORMAL"
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <div className="text-3xl">🎫</div>
                            <div className="font-medium">
                              기본형
                            </div>
                            <div className="text-xs text-muted-foreground text-center">
                              일반 티켓 및 상품
                            </div>
                          </div>
                        </button>

                        {/* 숙박형 */}
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              productType: "STAY",
                            })
                          }
                          className={`p-4 border-2 rounded-lg transition-all ${
                            formData.productType === "STAY"
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <div className="text-3xl">🏨</div>
                            <div className="font-medium">
                              숙박형
                            </div>
                            <div className="text-xs text-muted-foreground text-center">
                              숙박 시설 및 패키지
                            </div>
                          </div>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">
                          {formData.productType === "STAY"
                            ? "🏨"
                            : "🎫"}
                        </div>
                        <div>
                          <div className="font-medium">
                            {formData.productType === "STAY"
                              ? "숙박형"
                              : "기본형"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            상품 타입은 등록 후 변경할 수
                            없습니다.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 가격 설정 */}
                <div className="space-y-4 p-4 border rounded-lg" data-tour="product-dialog-price">
                  <h3 className="font-medium">가격 설정</h3>

                  {/* 선사입형 토글 */}
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                    <div className="flex-1">
                      <Label
                        htmlFor="prePurchased"
                        className="text-sm font-medium cursor-pointer"
                      >
                        선사입형
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        사전 구매가 완료된 티켓 및 상품입니다
                      </p>
                    </div>
                    <Switch
                      id="prePurchased"
                      checked={formData.prePurchased || false}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          prePurchased: checked,
                        })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>
                        정가{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="text"
                        value={
                          formData.price
                            ? formData.price.toLocaleString()
                            : ""
                        }
                        onChange={(e) => {
                          const numericValue =
                            e.target.value.replace(
                              /[^0-9]/g,
                              "",
                            );
                          setFormData({
                            ...formData,
                            price: numericValue
                              ? parseInt(numericValue)
                              : 0,
                          });
                        }}
                        placeholder="0"
                        className="text-right"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>할인가</Label>
                      <Input
                        type="text"
                        value={
                          formData.discountPrice
                            ? formData.discountPrice.toLocaleString()
                            : ""
                        }
                        onChange={(e) => {
                          const numericValue =
                            e.target.value.replace(
                              /[^0-9]/g,
                              "",
                            );
                          setFormData({
                            ...formData,
                            discountPrice: numericValue
                              ? parseInt(numericValue)
                              : undefined,
                          });
                        }}
                        placeholder="할인가 입력 (선택)"
                        className="text-right"
                      />
                    </div>
                  </div>
                </div>

                {/* 판매 설정 */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-medium">판매 설정</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>판매 상태</Label>
                      <Select
                        value={formData.salesStatus}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            salesStatus: value as SalesStatus,
                          })
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
                          <SelectItem value="PAUSED">
                            판매중단
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                </div>

                {/* 쇼핑몰 노출 설정 - 상품 추가 시에는 제외 */}
                {/* 상품 추가 후 상품 상세 페이지에서 설정 가능 */}

                {/* 기타 설정 */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-medium">기타 설정</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>표시 순서</Label>
                      <Input
                        type="number"
                        value={formData.displayOrder}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            displayOrder:
                              parseInt(e.target.value) || 1,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">
                        활성화 상태
                      </Label>
                      <div className="border rounded-md p-3 bg-muted/30 flex items-center gap-2">
                        <Switch
                          checked={formData.visible}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              visible: checked,
                            })
                          }
                        />
                        <Label className="cursor-pointer">
                          {formData.visible ? "활성" : "비활성"}
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                {isEditDialogOpen && selectedProduct && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      navigate(
                        `/admin/products/${selectedProduct.id}/content`,
                      );
                    }}
                    className="sm:mr-auto"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    상세 내용 편집
                  </Button>
                )}
                <div className="flex gap-2 sm:ml-auto">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      setIsEditDialogOpen(false);
                      setSelectedProduct(null);
                      resetForm();
                    }}
                  >
                    취소
                  </Button>
                  {isCreateDialogOpen ? (
                    <>
                      <Button onClick={handleCreate}>
                        추가
                      </Button>
                      <Button
                        onClick={handleCreateAndEditContent}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        추가 후 상세 내용 편집
                      </Button>
                    </>
                  ) : (
                    <Button onClick={handleEdit}>수정</Button>
                  )}
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Dialog */}
          <AlertDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  상품을 삭제하시겠습니까?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  이 작업은 되돌릴 수 없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  삭제
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Product Detail Dialog */}
          {selectedProduct && (
            <ProductDetail
              product={selectedProduct}
              isOpen={isDetailDialogOpen}
              onClose={() => {
                setIsDetailDialogOpen(false);
                setSelectedProduct(null);
              }}
              onUpdate={handleUpdateProductFromDetail}
            />
          )}
        </>
      )}

      {/* 투어 가이드 */}
      <CoachMark
        steps={productTourSteps}
        isActive={isTourActive}
        onFinish={() => {
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
          setActiveTab("products");
          window.dispatchEvent(new CustomEvent("closeSectionDialog"));
          endTour();
        }}
        storageKey="product_mgmt_tour"
        onStepChange={handleProductTourStepChange}
      />
    </div>
  );
}

export default ProductManagement;