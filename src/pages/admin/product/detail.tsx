import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { SegmentTabs } from "@/components/ui/segment-tabs";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import {
  Truck,
  Shield,
  RefreshCw,
  FileText,
  ImageIcon,
  X,
} from "lucide-react";
import { useNavigate } from "react-router";
import type {
  Product,
  SalesStatus,
  ProductOption,
} from "@/types/product";
import { updateProduct } from "@/data/products";
import { getPartners } from "@/data/partners";
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
import { getPartners as getAdminPartners } from "@/lib/api/partner";
import { toast } from "sonner";
import { ProductDetailOptions } from "./detail-options";
import { ProductChannelDiscounts } from "./detail-partner-discounts-mobile";
import { ProductDetailSms } from "./detail-sms";
import { TicketCouponManagement } from "./ticket-coupon-management";
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

  // 볼드와 이탤릭 (***가 가장 )
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

interface ProductDetailProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (product: Product) => void;
}

export function ProductDetail({
  product,
  isOpen,
  onClose,
  onUpdate,
}: ProductDetailProps) {
  const [options, setOptions] = useState<ProductOption[]>(
    product.options || [],
  );
  const [activeTab, setActiveTab] = useState<
    | "basic"
    | "details"
    | "options"
    | "discounts"
    | "sms"
    | "coupons"
  >("basic");
  const [loading, setLoading] = useState(false);

  // 상품 상세 데이터 (읽기 전용)
  const detailImages = product.detailImages || [];
  const detailContent = product.detailContent || "";

  // 기본 정보 상태
  const [name, setName] = useState(product.name);
  const [code, setCode] = useState(product.code);
  const [categoryId, setCategoryId] = useState(
    product.categoryId,
  );
  const [partnerId, setPartnerId] = useState(
    product.partnerId || "",
  );
  const [price, setPrice] = useState(product.price);
  const [discountPrice, setDiscountPrice] = useState(
    product.discountPrice || undefined,
  );
  const [salesStatus, setSalesStatus] = useState<string>(
    product.salesStatus || "READY",
  );
  const [description, setDescription] = useState(
    product.description,
  );
  const [visible, setVisible] = useState(product.visible);
  const [regionCard, setRegionCard] = useState<
    string | undefined
  >((product as any).regionCd || (product as any).regionCard);
  const [ticketType, setTicketType] = useState<
    string | undefined
  >((product as any).ticketType);
  const [imageUrls, setImageUrls] = useState<string[]>(
    product.imageUrls ||
      (product.imageUrl ? [product.imageUrl] : []),
  );
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>(
    product.imageUrls ||
      (product.imageUrl ? [product.imageUrl] : []),
  );

  const MAX_IMAGES = 4;

  // 배송/보증/반품 정보 상태
  const [shippingInfo, setShippingInfo] = useState(
    product.shippingInfo || "",
  );
  const [warrantyInfo, setWarrantyInfo] = useState(
    product.warrantyInfo || "",
  );
  const [returnInfo, setReturnInfo] = useState(
    product.returnInfo || "",
  );

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

  // 상품 상세 정보 조회 (백엔드 API)
  useEffect(() => {
    const loadProductDetail = async () => {
      if (!isOpen || !product.id) return;

      setLoading(true);
      try {
        const response = await getAdminProductDetail(
          product.id,
        );

        if (response.success && response.data) {
          const detail = response.data;

          // 상태 업데이트
          setName(detail.name);
          setCode(detail.code);
          setCategoryId(detail.categoryId);
          setPartnerId(detail.partnerId || "");
          setPrice(detail.price);
          setDiscountPrice(detail.discountPrice);
          setSalesStatus(detail.salesStatus || "READY");
          setDescription(detail.description);
          setShippingInfo(detail.shippingInfo);
          setWarrantyInfo(detail.warrantyInfo);
          setReturnInfo(detail.returnInfo);
          setRegionCard(
            (detail as any).regionCode ||
              (detail as any).regionCd ||
              (detail as any).regionCard,
          );
          setTicketType((detail as any).ticketType);

          // imageUrls 배열 설정
          const urls =
            detail.imageUrls ||
            (detail.imageUrl ? [detail.imageUrl] : []);
          setImageUrls(urls);
          setImagePreviews(urls);

          setVisible(detail.visible);

          // 옵션 정보 업데이트
          if (detail.options) {
            setOptions(detail.options);
          }

          // 섹션 정보 업데이트 - 동적으로 처리
          const sections = detail.sections || [];
          const sectionMap: Record<string, boolean> = {};
          sections.forEach((section) => {
            sectionMap[section.id] = section.visible;
          });
          setProductSections(sectionMap);
        }
      } catch (error) {
        console.error("상품 상세 정보 조회 오류:", error);
        toast.error("상품 정보를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadProductDetail();
  }, [isOpen, product.id]);

  useEffect(() => {
    const loadPartners = async () => {
      try {
        const partnersResponse = await getAdminPartners();
        console.log("🔍 [파트너 로드] 응답:", partnersResponse);

        if (partnersResponse.success && partnersResponse.data) {
          const partnerList = partnersResponse.data;
          setPartners(partnerList);
          console.log(
            "✅ [파트너 로드] 성공:",
            partnerList.length,
            "개",
          );
          console.log(
            "✅ [파트너 목록]:",
            partnerList.map((p) => ({
              id: p.id,
              name: p.name,
              code: p.code,
            })),
          );
        } else {
          // HTML 응답인 경우에는 경고 표시하지 않음 (정상적인 fallback)
          if (partnersResponse.message !== "HTML_RESPONSE") {
            console.warn(
              "⚠️ [파트너 로드] 실패:",
              partnersResponse.message,
            );
          } else {
            if (!isApiOnlyMode()) {
              console.log(
                "💡 [파트너 로드] API 서버 미응답 - 더미 데이터 사용",
              );
            } else {
              console.log("💡 [파트너 로드] API 서버 미응답");
            }
          }
          // 실패 시 빈 배열로 초기화
          setPartners([]);
        }
      } catch (error) {
        console.error("❌ [파트너 로드] 오류:", error);
        // 오류 시 빈 배열로 초기화
        setPartners([]);
      }
    };

    if (isOpen) {
      loadPartners();
    }
  }, [isOpen]);

  // 모든 카테고리를 평면 리스트로 변환
  const getAllCategories = () => {
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
  };

  const handleOptionsUpdate = (
    updatedOptions: ProductOption[],
  ) => {
    setOptions(updatedOptions);
    onUpdate({ ...product, options: updatedOptions });
  };

  const handleBasicInfoSave = async () => {
    const priceNum = parseFloat(price);
    const discountPriceNum = discountPrice
      ? parseFloat(discountPrice)
      : undefined;

    console.log("💾 [저장 시작] 현재 상태:", {
      partnerId,
      partnerId_type: typeof partnerId,
      partnerId_length: partnerId?.length,
      partnerId_isEmpty: partnerId === "",
      visible,
      imageUrls_count: imageUrls.length,
    });

    if (isNaN(priceNum) || priceNum < 0) {
      toast.error("올바른 가격을 입력해주세요.");
      return;
    }

    if (
      discountPrice &&
      (isNaN(discountPriceNum!) || discountPriceNum! < 0)
    ) {
      toast.error("올바른 할인가를 입력해주세요.");
      return;
    }

    const categoryData = getAllCategories().find(
      (c) => c.id === categoryId,
    );
    const partnerData = partners.find(
      (p) => p.id === partnerId,
    );

    // 이미지 파일이 있으면 먼 업로드
    let finalImageUrls = [...imageUrls];

    console.log("💾 [상품 저장] 이미지 상태 확인:", {
      imageUrls_count: imageUrls.length,
      imageUrls_preview: imageUrls.map(
        (url) => url.substring(0, 50) + "...",
      ),
      imageFiles_count: imageFiles.length,
      imageFiles_names: imageFiles.map((f) => f.name),
      imagePreviews_count: imagePreviews.length,
    });

    if (imageFiles.length > 0) {
      try {
        // uploadFiles API 호출
        const { uploadFiles } = await import(
          "@/lib/api/file"
        );
        const uploadResponse = await uploadFiles(imageFiles);

        console.log("📤 [이미지 업로드] 응답:", uploadResponse);

        if (
          uploadResponse.success &&
          uploadResponse.data &&
          uploadResponse.data.length > 0
        ) {
          // 업로드된 URL들
          const uploadedUrls = uploadResponse.data;
          console.log(
            "✅ [이미지 업로드] 성공한 URLs:",
            uploadedUrls,
          );

          // imageUrls에서 data:로 시작하는 URL을 찾아서 업로드된 URL로 교체
          let uploadIndex = 0;
          finalImageUrls = imageUrls.map((url) => {
            if (url.startsWith("data:")) {
              const replacedUrl =
                uploadedUrls[uploadIndex] || url;
              uploadIndex++;
              console.log(
                `🔄 [URL 교체] data URL -> ${replacedUrl}`,
              );
              return replacedUrl;
            }
            return url;
          });

          console.log("🎯 [최종 이미지 URLs]:", finalImageUrls);

          // 상태 업데이트
          setImageUrls(finalImageUrls);
          setImagePreviews(finalImageUrls);
          setImageFiles([]);

          toast.success(
            `${uploadResponse.data.length}개의 이미지가 업로드되었습니다.`,
          );
        } else if (
          uploadResponse.message === "local_fallback"
        ) {
          // 로컬 폴백 모드: data URL을 그대로 사용
          console.log(
            "[상품 수정] 로컬 모드로 폴백, data URL 사용",
          );
        } else {
          toast.error("이미지 업로드에 실패했습니다.");
          return;
        }
      } catch (error) {
        console.error("[상품 수정] 이미지 업로드 오류:", error);
        toast.error("이미지 업로드 중 오류가 발생했습니다.");
        return;
      }
    }

    // 백엔드 API 요청 형식으로 변환
    const basicUpdateRequest: ProductBasicUpdateRequest = {
      name,
      code,
      categoryId,
      partnerId: partnerId || null, // 빈 문자열이면 null로
      price: priceNum,
      discountPrice: discountPriceNum || priceNum,
      stock: 9999, // ⚠️ 재고는 기본값 9999로 고정
      salesStatus: salesStatus,
      description,
      imageUrl: finalImageUrls, // ⚠️ 배열지만 필드명은 imageUrl (백엔드 API 요구사항)
      visible: visible, // 상품 노출 여부 추가
      regionCode: regionCard || undefined, // 지역카드코드 (선택사항)
      ticketType: ticketType
        ? ticketType.padStart(2, "0")
        : undefined, // 두 자리 문자열로 ("01", "02" 등)
    };

    console.log("🔍 [상품 수정] 전송할 요청 데이터:", {
      ...basicUpdateRequest,
      imageUrl_type: Array.isArray(basicUpdateRequest.imageUrl)
        ? "array"
        : typeof basicUpdateRequest.imageUrl,
      imageUrl_count: basicUpdateRequest.imageUrl?.length,
      regionCard_from_state: regionCard,
      ticketType_from_state: ticketType,
      request_json: JSON.stringify(basicUpdateRequest, null, 2),
    });

    try {
      console.log("📡 [상품 수정] API 호출 시작...");
      const response = await updateProductBasic(
        product.id,
        basicUpdateRequest,
      );
      console.log("📡 [상품 수정] API 응답:", response);

      if (response.success) {
        const isLocalFallback =
          response.message?.includes("로 데이터");
        if (isLocalFallback) {
          toast.success(
            "기본 정보가 저장되었습니다. (로컬 모드)",
          );
        } else {
          toast.success("기본 정보가 저장되었습니다.");
        }

        onUpdate({
          ...product,
          name,
          code,
          categoryId,
          categoryName: categoryData?.name,
          partnerId: partnerId || undefined,
          partnerName: partnerData?.name,
          price: priceNum,
          discountPrice: discountPriceNum,
          salesStatus,
          description,
          imageUrl: finalImageUrls[0] || "",
          imageUrls: finalImageUrls,
          visible,
        });
      } else {
        console.error("❌ [상품 수정] 실패:", response.message);
        toast.error(
          response.message || "기본 정보 저장에 실패했습니다.",
        );
      }
    } catch (error) {
      console.error("❌ [상품 수정] 예외 발생:", error);
      toast.error("상품 정보 저장 중 오류가 발생했습니다.");
    }
  };

  // 프론트엔드 SalesStatus를 백엔드 SalesStatus로 매핑
  const mapSalesStatusToBackend = (
    status: SalesStatus,
  ): "READY" | "ON_SALE" | "PAUSED" | "SOLD_OUT" | "ENDED" => {
    const statusMap: Record<
      SalesStatus,
      "READY" | "ON_SALE" | "PAUSED" | "SOLD_OUT" | "ENDED"
    > = {
      준비중: "READY",
      판매대기: "READY",
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
      | "ON_SALE"
      | "PAUSED"
      | "SOLD_OUT"
      | "ENDED",
  ): SalesStatus => {
    const statusMap: Record<
      "READY" | "ON_SALE" | "PAUSED" | "SOLD_OUT" | "ENDED",
      SalesStatus
    > = {
      READY: "준비중",
      ON_SALE: "판매중",
      PAUSED: "판매중단",
      SOLD_OUT: "품절",
      ENDED: "판매종료",
    };
    return statusMap[status] || "준비중";
  };

  const handleAdditionalInfoSave = async () => {
    const shippingRequest: ProductShippingRequest = {
      shippingInfo,
      warrantyInfo,
      returnInfo,
    };

    const response = await updateProductShipping(
      product.id,
      shippingRequest,
    );

    if (response.success) {
      toast.success("배송/보증/반품 정보가 저장되었습니다.");
      onUpdate({
        ...product,
        shippingInfo,
        warrantyInfo,
        returnInfo,
      });
    } else {
      toast.error(response.message);
    }
  };

  const handleSectionSave = async () => {
    try {
      console.log("션 저장 시작:", {
        productId: product.id,
        availableSections: availableSections.map((s) => s.id),
        productSections,
      });

      if (availableSections.length === 0) {
        toast.error(
          "저장할 섹션이 없습니다. 섹션 관리에서 섹션을 먼저 생성해주세요.",
        );
        return;
      }

      // 동적으로 섹션 설정 저장
      const promises = availableSections.map((section) => {
        const request = {
          sectionId: section.id,
          visible: productSections[section.id] || false,
        };
        console.log("섹션 API 호출:", request);
        return updateProductSection(product.id, request);
      });

      console.log(`총 ${promises.length}개의 섹션 API 호출 작`);

      const results = await Promise.all(promises);

      console.log("섹션 저장 결과:", results);

      // 모든 결과가 성공인지 확인
      const allSuccess = results.every((r) => r.success);

      if (allSuccess) {
        toast.success("쇼핑몰 노출 설정이 저장되었습니다.");
      } else {
        const failedResult = results.find((r) => !r.success);
        console.error("실패한 섹션:", failedResult);
        toast.error(
          failedResult?.message ||
            "일부 섹션 설정에 실패했습니다.",
        );
      }
    } catch (error) {
      console.error("섹션 저장 오류:", error);
      toast.error("섹션 설정 중 오류 발생했습니다.");
    }
  };

  // 섹션 토글 핸들러
  const handleSectionToggle = (
    sectionId: string,
    value: boolean,
  ) => {
    setProductSections((prev) => ({
      ...prev,
      [sectionId]: value,
    }));
  };

  // 이미지 파 업로드 핸들러
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files) return;

    // 현재 이미지 개수 확인
    const currentImageCount = imagePreviews.length;
    const remainingSlots = MAX_IMAGES - currentImageCount;

    if (remainingSlots <= 0) {
      toast.error(
        `최대 ${MAX_IMAGES}장까지만 업로드할 수 있습니다.`,
      );
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

    const newImageFiles: File[] = [];
    let processedCount = 0;

    for (let i = 0; i < filesToProcess; i++) {
      const file = files[i];

      if (!file.type.startsWith("image/")) {
        toast.error(
          `${file.name}은(는) 이미지 파일이 아닙니다.`,
        );
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}은(는) 5MB를 과합니다.`);
        continue;
      }

      // 일 저장
      newImageFiles.push(file);

      // 프리뷰 생성
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setImagePreviews((prev) => [...prev, url]);
        setImageUrls((prev) => [...prev, url]);
        processedCount++;

        if (processedCount === filesToProcess) {
          toast.success(
            `${processedCount}장의 이미지가 추가되었습니다.`,
          );
        }
      };
      reader.readAsDataURL(file);
    }

    setImageFiles((prev) => [...prev, ...newImageFiles]);
  };

  const navigate = useNavigate();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1100px] sm:w-[90vw] sm:h-[90vh] overflow-hidden flex flex-col p-4 md:p-6">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-base md:text-lg">
            상품 상세
          </DialogTitle>
          <DialogDescription className="text-xs md:text-sm">
            {product.name}의 상세 정보를 관리합니다.
          </DialogDescription>
        </DialogHeader>

        {/* SegmentTabs - 고정 */}
        <div className="flex items-center justify-start pt-2 pb-3 overflow-x-auto flex-shrink-0 -mx-4 px-4 md:mx-0 md:px-0">
          <SegmentTabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(
                value as
                  | "basic"
                  | "details"
                  | "options"
                  | "discounts"
                  | "sms"
                  | "coupons",
              )
            }
            options={[
              { value: "basic", label: "기본 정보" },
              { value: "details", label: "상품 상세" },
              { value: "options", label: "옵션 관리" },
              { value: "discounts", label: "채널별 할" },
              { value: "sms", label: "SMS 관리" },
              ...(product.prePurchased
                ? [{ value: "coupons" as const, label: "티켓 관리" }]
                : []),
            ]}
          />
        </div>

        {/* 탭 콘텐츠 - 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto min-h-0 -mx-4 px-4 md:-mx-6 md:px-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">
                  로딩 중...
                </p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === "basic" && (
                <div className="space-y-4 py-2 pb-4">
                  <div className="border border-border rounded-lg p-4 md:p-6 bg-background">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
                      <h3 className="text-sm font-medium">
                        기본 정보 수정
                      </h3>
                      <Button
                        size="sm"
                        onClick={handleBasicInfoSave}
                        className="w-full sm:w-auto"
                      >
                        저장
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">
                          상품명 *
                        </Label>
                        <Input
                          value={name}
                          onChange={(e) =>
                            setName(e.target.value)
                          }
                          placeholder="상품명을 입력하세요"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">
                          상품코드 *
                        </Label>
                        <Input
                          value={code}
                          onChange={(e) =>
                            setCode(e.target.value)
                          }
                          placeholder="상품코드를 입력하세요"
                          disabled
                          className="bg-muted cursor-not-allowed"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">
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
                            {getAllCategories().map(
                              (category) => (
                                <SelectItem
                                  key={category.id}
                                  value={category.id}
                                >
                                  {"  ".repeat(category.level)}
                                  {category.name}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">
                          파트너
                        </Label>
                        <Select
                          value={partnerId || "none"}
                          onValueChange={(value) =>
                            setPartnerId(
                              value === "none" ? "" : value,
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="파트너 선택 (선항)" />
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
                      <div className="space-y-2">
                        <Label className="text-xs">지역</Label>
                        <Select
                          value={regionCard || "none"}
                          onValueChange={(value) =>
                            setRegionCard(
                              value === "none"
                                ? undefined
                                : value,
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
                        <Label className="text-xs">
                          티켓분류
                        </Label>
                        <Select
                          value={ticketType || "none"}
                          onValueChange={(value) =>
                            setTicketType(
                              value === "none"
                                ? undefined
                                : value,
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
                      <div className="space-y-2">
                        <Label className="text-xs">
                          정가 *
                        </Label>
                        <Input
                          type="text"
                          value={
                            price !== undefined &&
                            price !== null
                              ? price.toLocaleString()
                              : ""
                          }
                          onChange={(e) => {
                            const numericValue =
                              e.target.value.replace(
                                /[^0-9]/g,
                                "",
                              );
                            setPrice(
                              numericValue
                                ? parseInt(numericValue)
                                : 0,
                            );
                          }}
                          placeholder="0"
                          className="text-right"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">
                          판매가
                        </Label>
                        <Input
                          type="text"
                          value={
                            discountPrice !== undefined &&
                            discountPrice !== null
                              ? discountPrice.toLocaleString()
                              : ""
                          }
                          onChange={(e) => {
                            const numericValue =
                              e.target.value.replace(
                                /[^0-9]/g,
                                "",
                              );
                            setDiscountPrice(
                              numericValue
                                ? parseInt(numericValue)
                                : undefined,
                            );
                          }}
                          placeholder="할인가 (선택사항)"
                          className="text-right"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">
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
                      <div className="space-y-2 flex items-end">
                        <div className="flex items-center justify-between w-full px-4 py-3 border rounded-lg">
                          <Label className="text-xs cursor-pointer">
                            상품 활성화
                          </Label>
                          <Switch
                            checked={visible}
                            onCheckedChange={setVisible}
                          />
                        </div>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-xs">
                          상품 설명
                        </Label>
                        <Input
                          value={description}
                          onChange={(e) =>
                            setDescription(e.target.value)
                          }
                          placeholder="상품에 대한 간단한 설명 입력하세요"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">
                            상품 이미지 ({imagePreviews.length}/
                            {MAX_IMAGES})
                          </Label>
                          {imagePreviews.length <
                            MAX_IMAGES && (
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
                          <div className="grid grid-cols-2 gap-3">
                            {imagePreviews.map(
                              (preview, index) => (
                                <div
                                  key={index}
                                  className="relative aspect-video rounded-lg border overflow-hidden bg-muted group"
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
                                        setImagePreviews(
                                          (prev) =>
                                            prev.filter(
                                              (_, i) =>
                                                i !== index,
                                            ),
                                        );
                                        setImageUrls((prev) =>
                                          prev.filter(
                                            (_, i) =>
                                              i !== index,
                                          ),
                                        );
                                        setImageFiles((prev) =>
                                          prev.filter(
                                            (_, i) =>
                                              i !== index,
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
                              ),
                            )}

                            {/* 빈 슬롯 표시 */}
                            {imagePreviews.length <
                              MAX_IMAGES && (
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
                <div className="space-y-6 py-2">
                  {/* 배송/보증/반품 정보 */}
                  <div className="border border-border rounded-lg p-6 bg-background">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium">
                        배송 및 보증 정보
                      </h3>
                      <Button
                        size="sm"
                        onClick={handleAdditionalInfoSave}
                      >
                        저장
                      </Button>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs flex items-center gap-2">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          배송 정보
                        </Label>
                        <Input
                          value={shippingInfo}
                          onChange={(e) =>
                            setShippingInfo(e.target.value)
                          }
                          placeholder="예: 무료 배송 (50,000원 이상 구매 시)"
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          보증 정보
                        </Label>
                        <Input
                          value={warrantyInfo}
                          onChange={(e) =>
                            setWarrantyInfo(e.target.value)
                          }
                          placeholder="예: 100% 정품 보장"
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 text-muted-foreground" />
                          반품/교환 정보
                        </Label>
                        <Input
                          value={returnInfo}
                          onChange={(e) =>
                            setReturnInfo(e.target.value)
                          }
                          placeholder="예: 7일 이내 무료 반품"
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 쇼핑몰 노출 설정 */}
                  <div className="border border-border rounded-lg p-6 bg-background">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium">
                        쇼핑몰 노출 설정
                      </h3>
                      <Button
                        size="sm"
                        onClick={handleSectionSave}
                      >
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
                                  {section.name} 섹션에
                                  표시됩니다
                                </p>
                              </div>
                            </div>
                            <Switch
                              checked={
                                productSections[section.id] ||
                                false
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

                  {/* 상세 내용 편집기 */}
                  <div className="border border-dashed border-border rounded-lg p-12 text-center bg-muted/30">
                    <FileText className="size-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg mb-2">
                      상세 내용 편집기로 이동
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      블로그 글쓰기처럼 자유롭게 이미지와
                      텍스트를 가할 수 있는
                      <br />
                      전용 편집 페이지에서 상품 상세 내용을
                      성하세요.
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button
                        onClick={() => {
                          onClose();
                          navigate(
                            `/admin/products/${product.id}/content`,
                          );
                        }}
                        size="lg"
                      >
                        <FileText className="size-5 mr-2" />
                        상세 내용 편집하기
                      </Button>
                    </div>

                    {(detailImages.length > 0 ||
                      detailContent) && (
                      <div className="mt-8 pt-6 border-t text-left">
                        <p className="text-sm text-muted-foreground mb-4">
                          현재 등록된 내용 미리보기
                        </p>
                        {detailImages.length > 0 && (
                          <div className="mb-4">
                            <Badge
                              variant="outline"
                              className="mb-2"
                            >
                              상세 이미지 {detailImages.length}
                              장
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
              )}

              {activeTab === "options" && (
                <ProductDetailOptions
                  product={product}
                  options={options}
                  onOptionsUpdate={handleOptionsUpdate}
                />
              )}

              {activeTab === "discounts" && (
                <div className="py-2 pb-4">
                  <ProductChannelDiscounts
                    productId={product.id}
                    productPrice={product.price}
                  />
                </div>
              )}

              {activeTab === "sms" && (
                <ProductDetailSms
                  product={product}
                  onUpdate={onUpdate}
                />
              )}

              {activeTab === "coupons" && (
                <div className="py-2 pb-4">
                  <TicketCouponManagement
                    productId={product.id}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}