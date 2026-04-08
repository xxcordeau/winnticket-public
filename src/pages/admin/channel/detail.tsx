import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Save, ExternalLink, Copy, Check, Upload, X, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { getChannelUrl } from "@/lib/config";
import * as ChannelAPI from "@/lib/api/channel";
import * as ProductAPI from "@/lib/api/product";
import * as FileAPI from "@/lib/api/file";
import {
  getChannel,
  updateChannel,
  type ChannelListItem,
  type ChannelUpdateRequest,
} from "@/lib/api/channel";
import {
  updateChannel as updateChannelLocal,
  deleteChannel as deleteChannelLocal,
  addExcludedProduct,
  removeExcludedProduct,
} from "@/data/channels";
import type { Product } from "@/data/products";
import { SegmentTabs } from "@/components/ui/segment-tabs";
import { getImageUrl } from "@/lib/utils/image";

type Language = "ko" | "en";

interface ChannelDetailProps {
  channel: ChannelListItem;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (channel: ChannelListItem) => void;
  onDelete: () => void;
  language: Language;
  isTourActive?: boolean;
}

export function ChannelDetail({
  channel,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  language,
  isTourActive: parentTourActive = false,
}: ChannelDetailProps) {
  const [activeTab, setActiveTab] = useState<"basic" | "products">("basic");

  // 부모 투어에서 탭 전환 이벤트 수신
  useEffect(() => {
    const handler = (e: Event) => {
      const tab = (e as CustomEvent).detail;
      if (tab) setActiveTab(tab);
    };
    window.addEventListener("channelDetailTab", handler);
    return () => window.removeEventListener("channelDetailTab", handler);
  }, []);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // 상품 관리 관련 상태
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    channelCode: channel.channelCode || "",
    channelName: channel.channelName || "",
    companyName: channel.companyName || "",
    domain: channel.domain || "",
    commissionRate: channel.commissionRate || 0,
    active: channel.active !== undefined ? channel.active : true,
    useCard: channel.useCard !== undefined ? channel.useCard : false, // ⭐ 카드 사용 여부
    usePoint: channel.usePoint !== undefined ? channel.usePoint : false, // ⭐ 포인트 사용 여부
    logoUrl: channel.logoUrl || "",
    faviconUrl: channel.faviconUrl || "",
    description: channel.description || "",
    contactEmail: channel.contactEmail || "",
    contactPhone: channel.contactPhone || "",
    websiteUrl: channel.websiteUrl || "",
  });

  // 파일 업로드 핸들러
  const handleFileUpload = async (file: File, field: "logoUrl" | "faviconUrl") => {
    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 업로드 가능합니다.");
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("파일 크기는 5MB 이하여야 합니다.");
      return;
    }

    // ⭐ 로딩 토스 표시
    const loadingToast = toast.loading("파일 업로드 중...");

    try {
      // ⭐ 파일 업로드 API 호출
      const uploadResponse = await FileAPI.uploadFile(file);

      // 로딩 토스트 제거
      toast.dismiss(loadingToast);

      if (uploadResponse.success && uploadResponse.data) {
        // ⭐ 서버 업로드 성공 - URL 저장
        console.log('[Channel Detail] 서버 업로드 성공:', uploadResponse.data.fileUrl);
        setFormData({ ...formData, [field]: uploadResponse.data.fileUrl });
        toast.success("파일이 업로드되었습니다.");
      } else {
        // ⭐ 서버 업로드 실패 - Base64 폴백
        console.log('[Channel Detail] ���버 업로드 실패, Base64 변환 시도');
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setFormData({ ...formData, [field]: result });
          toast.success("파일이 로컬에 저장되었습니다.");
        };
        reader.onerror = () => {
          toast.error("파일 읽기에 실패했습니다.");
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error('[Channel Detail] 파일 업로드 중 오류:', error);
      
      // ⭐ 로딩 토스트 제거 (에러 시에도)
      toast.dismiss(loadingToast);
      
      // ⭐ 에러 발생 시 Base64 폴백
      console.log('[Channel Detail] 에러 발생, Base64 변환 시도');
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFormData({ ...formData, [field]: result });
        toast.success("파일이 로컬에 저장되었습니다.");
      };
      reader.onerror = () => {
        toast.error("파일 읽기에 실패했습니다.");
      };
      reader.readAsDataURL(file);
    }
  };

  // 파일 삭제 핸들러
  const handleFileRemove = async (field: "logoUrl" | "faviconUrl") => {
    const currentUrl = formData[field];
    
    // 먼저 UI에서 제거
    setFormData({ ...formData, [field]: "" });

    // URL이 서버 URL인 경우 삭제 API 호출
    if (currentUrl && !currentUrl.startsWith("data:")) {
      try {
        const deleteResponse = await FileAPI.deleteFile(currentUrl);
        if (deleteResponse.success) {
          console.log('[Channel Detail] 파일 삭제 완료:', currentUrl);
        } else {
          console.warn('[Channel Detail] 파일 삭제 실패:', deleteResponse.message);
        }
      } catch (error) {
        console.error('[Channel Detail] 파일 삭제 중 오류:', error);
      }
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    // ⭐ 상품관리 탭이 열릴 때 상품 목록 로드
    if (activeTab === 'products') {
      loadProducts();
    }
  }, [activeTab]);

  useEffect(() => {
    // channel이 변경되면 formData도 업데이트
    setFormData({
      channelCode: channel.channelCode || "",
      channelName: channel.channelName || "",
      companyName: channel.companyName || "",
      domain: channel.domain || "",
      commissionRate: channel.commissionRate || 0,
      active: channel.active !== undefined ? channel.active : true,
      useCard: channel.useCard !== undefined ? channel.useCard : false, // ⭐ 카드 사용 여부
      usePoint: channel.usePoint !== undefined ? channel.usePoint : false, // ⭐ 포인트 사용 여부
      logoUrl: channel.logoUrl || "",
      faviconUrl: channel.faviconUrl || "",
      description: channel.description || "",
      contactEmail: channel.contactEmail || "",
      contactPhone: channel.contactPhone || "",
      websiteUrl: channel.websiteUrl || "",
    });
  }, [channel]);

  const loadProducts = async () => {
    try {
      console.log('🛍️ [채널 상품 관리] 상품 목록 로드 시작...');
      console.log('🛍️ [채널 상품 관리] 채널 ID:', channel.id);
      
      // ⭐ 채널별 상품 목록 API 호출
      const apiResponse = await ProductAPI.getChannelProducts(channel.id);
      
      if (apiResponse.success && apiResponse.data && apiResponse.data.length > 0) {
        console.log('✅ [채널 상품 관리] API에서 상품 목록 로드:', apiResponse.data.length, '개');
        
        // ⭐ ChannelProductItem를 Product 타입으로 변환
        const mappedProducts: Product[] = apiResponse.data.map((item) => ({
          id: item.id,
          code: item.productCode,
          name: item.productName || item.productCode, // productName이 null이면 code 사용
          price: 0, // API 응답에 없음
          discountPrice: 0,
          discountRate: 0,
          stock: 0,
          salesStatus: 'ON_SALE' as const,
          categoryId: '',
          categoryName: '',
          imageUrl: item.logoUrl || '', // ⭐ API의 logoUrl 필드 사용
          description: '',
          createdAt: '',
          updatedAt: '',
          excluded: item.exclude, // ⭐ 제외 여부 추가
        }));
        
        console.log('✅ [채널 상품 관리] 변환된 상품:', mappedProducts.length, '개');
        console.log('✅ [채널 상품 관리] 제외된 상품:', mappedProducts.filter(p => p.excluded).length, '개');
        setAllProducts(mappedProducts);
      } else {
        // ⭐ API 실패 시 빈 배열
        console.log('⚠️ [채널 상품 관리] API 응답 없음 - 상품 목록 비움');
        setAllProducts([]);
      }
    } catch (error) {
      console.error('❌ [채널 상품 관리] 상품 로드 오류:', error);
      // ⭐ 오류 시에도 빈 배열
      setAllProducts([]);
    }
  };

  const handleSaveBasicInfo = async () => {
    if (!formData.channelCode || !formData.channelName || !formData.companyName) {
      toast.error("필수 항목을 입력해주세요.");
      return;
    }

    try {
      // ⭐ API 요청 데이터 준비 (모든 필드 필수)
      const requestData: ChannelUpdateRequest = {
        code: formData.channelCode,
        name: formData.channelName,
        companyName: formData.companyName,
        commissionRate: formData.commissionRate,
        logoUrl: formData.logoUrl || "",
        faviconUrl: formData.faviconUrl || "",
        email: formData.contactEmail || "",
        phone: formData.contactPhone || "",
        domain: formData.websiteUrl || "",
        description: formData.description || "",
        visible: formData.active,
        useCard: formData.useCard, // ⭐ 카드 사용 여부
        usePoint: formData.usePoint, // ⭐ 포인트 사용 여부
      };

      // ⭐ API 호출 (channelId는 UUID)
      console.log('[Channel Detail] 채널 수정 API 호출:', channel.id, requestData);
      const apiResponse = await updateChannel(channel.id, requestData);

      if (apiResponse.success) {
        toast.success("기본 정보가 저장되었습니다.");
        
        // ⭐ 로컬 상태 업데이트
        const updatedChannel: ChannelListItem = {
          ...channel,
          channelCode: formData.channelCode,
          channelName: formData.channelName,
          companyName: formData.companyName,
          active: formData.active,
          useCard: formData.useCard,
          usePoint: formData.usePoint,
          description: formData.description,
          commissionRate: formData.commissionRate,
          logoUrl: formData.logoUrl || undefined,
          faviconUrl: formData.faviconUrl || undefined,
          contactEmail: formData.contactEmail || undefined,
          contactPhone: formData.contactPhone || undefined,
          websiteUrl: formData.websiteUrl || undefined,
          updatedAt: new Date().toISOString(),
        };
        onUpdate(updatedChannel);
      } else {
        // API 실패 시 로컬 업데이트 시도
        console.log('[Channel Detail] API 실패, 로컬 업데이트 시도');
        
        const localResponse = updateChannelLocal({
          id: channel.id,
          channelCode: formData.channelCode,
          channelName: formData.channelName,
          companyName: formData.companyName,
          active: formData.active,
          description: formData.description,
          commissionRate: formData.commissionRate,
          logoUrl: formData.logoUrl || undefined,
          faviconUrl: formData.faviconUrl || undefined,
          contactEmail: formData.contactEmail || undefined,
          contactPhone: formData.contactPhone || undefined,
          websiteUrl: formData.websiteUrl || undefined,
        });

        if (localResponse.success && localResponse.data) {
          toast.success("기본 정보가 저장되니다.");
          onUpdate(localResponse.data);
        } else {
          toast.error(apiResponse.message || localResponse.message);
        }
      }
    } catch (error) {
      console.error('[Channel Detail] 채널 수정 중 오류:', error);
      
      // 오류 발생 시 로컬 업데이트 시도
      const localResponse = updateChannelLocal({
        id: channel.id,
        channelCode: formData.channelCode,
        channelName: formData.channelName,
        companyName: formData.companyName,
        active: formData.active,
        description: formData.description,
        commissionRate: formData.commissionRate,
        logoUrl: formData.logoUrl || undefined,
        faviconUrl: formData.faviconUrl || undefined,
        contactEmail: formData.contactEmail || undefined,
        contactPhone: formData.contactPhone || undefined,
        websiteUrl: formData.websiteUrl || undefined,
      });

      if (localResponse.success && localResponse.data) {
        toast.success("기본 정보가 저장되었습니다.");
        onUpdate(localResponse.data);
      } else {
        toast.error("기본 정보 저장에 실패했습니다.");
      }
    }
  };

  const handleSaveBranding = () => {
    const response = updateChannelLocal({
      id: channel.id,
      logoUrl: formData.logoUrl || undefined,
      faviconUrl: formData.faviconUrl || undefined,
    });

    if (response.success && response.data) {
      toast.success("브랜딩 정보가 저장되었습니다.");
      onUpdate(response.data);
    } else {
      toast.error(response.message);
    }
  };

  const handleSaveContact = () => {
    const response = updateChannelLocal({
      id: channel.id,
      contactEmail: formData.contactEmail || undefined,
      contactPhone: formData.contactPhone || undefined,
      websiteUrl: formData.websiteUrl || undefined,
    });

    if (response.success && response.data) {
      toast.success("연락처 정보가 저장되었습니다.");
      onUpdate(response.data);
    } else {
      toast.error(response.message);
    }
  };

  const handleDelete = async () => {
    if (channel.channelCode === "DEFAULT") {
      toast.error("기본 채널은 삭제할 수 없습니다.");
      return;
    }

    try {
      // ⭐ API 호출 (channelId는 UUID)
      console.log('[Channel Detail] 채널 삭제 API 호출:', channel.id);
      const apiResponse = await ChannelAPI.deleteChannel(channel.id);

      if (apiResponse.success) {
        toast.success("채널이 삭제되었습니다.");
        setIsDeleteDialogOpen(false);
        onDelete();
      } else {
        // API 실패 시 로컬 삭제 시도
        console.log('[Channel Detail] API 실패, 로컬 삭제 시도');
        const localResponse = deleteChannelLocal(channel.id);
        if (localResponse.success) {
          toast.success(localResponse.message);
          setIsDeleteDialogOpen(false);
          onDelete();
        } else {
          toast.error(apiResponse.message || localResponse.message);
        }
      }
    } catch (error) {
      console.error('[Channel Detail] 채널 삭제 중 오류:', error);
      
      // 오류 발생 시 로컬 삭제 시도
      const localResponse = deleteChannelLocal(channel.id);
      if (localResponse.success) {
        toast.success(localResponse.message);
        setIsDeleteDialogOpen(false);
        onDelete();
      } else {
        toast.error("채널 삭에 실패했습니다.");
      }
    }
  };

  const handleAddExcludedProduct = async (productId: string) => {
    try {
      // ⭐ ProductAPI의 excludeChannelProduct 함수 호출
      console.log('[Channel Detail] 상품 제외 API 호출:', { channelId: channel.id, productId });
      
      const apiResponse = await ProductAPI.excludeChannelProduct(channel.id, productId);

      if (apiResponse.success) {
        toast.success("상품이 제외되었습니다.");
        
        // ⭐ 상품 목록 새로고침
        await loadProducts();
      } else {
        toast.error(apiResponse.message || "상품 제외에 실패했습니다.");
      }
    } catch (error) {
      console.error('[Channel Detail] 상품 제외 중 오류:', error);
      toast.error("상품 제외에 실패했습니다.");
    }
  };

  const handleRemoveExcludedProduct = async (productId: string) => {
    try {
      // ⭐ ProductAPI의 includeChannelProduct 함수 호출
      console.log('[Channel Detail] 상품 복구 API 호출:', { channelId: channel.id, productId });
      
      const apiResponse = await ProductAPI.includeChannelProduct(channel.id, productId);

      if (apiResponse.success) {
        toast.success("상품이 복구되었습니다.");
        
        // ⭐ 상품 목록 새로고침
        await loadProducts();
      } else {
        toast.error(apiResponse.message || "상품 복구에 실패했습니다.");
      }
    } catch (error) {
      console.error('[Channel Detail] 상품 복구 중 오류:', error);
      toast.error("상품 복구에 실패했습니다.");
    }
  };

  const copyChannelUrl = async () => {
    const channelUrl = getChannelUrl(channel.channelCode);
    try {
      await navigator.clipboard.writeText(channelUrl);
      toast.success("채널 URL이 클립보드에 복사되었습니다.");
    } catch {
      // Dialog focus trap으로 인해 navigator.clipboard 실패 시
      // dialog 내부에 input을 만들어 복사
      const dialogEl = document.querySelector('[role="dialog"]');
      const input = document.createElement("input");
      input.value = channelUrl;
      input.style.position = "absolute";
      input.style.opacity = "0";
      (dialogEl || document.body).appendChild(input);
      input.focus();
      input.select();
      try {
        document.execCommand("copy");
        toast.success("채널 URL이 클립보드에 복사되었습니다.");
      } catch {
        toast.error(`복사 실패. URL: ${channelUrl}`);
      }
      input.remove();
    }
  };

  const openChannelUrl = () => {
    const channelUrl = getChannelUrl(channel.channelCode);
    window.open(channelUrl, "_blank");
  };

  const excludedProductIds = channel.excludedProductIds || [];
  const excludedProducts = allProducts.filter((p) => p.excluded === true);
  const availableProducts = allProducts.filter(
    (p) => p.excluded !== true && 
    (searchTerm === "" || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
      <Dialog open={isOpen} modal={!parentTourActive} onOpenChange={(open) => { if (parentTourActive && !open) return; onClose(); }}>
        <DialogContent className="sm:max-w-[1100px] sm:w-[90vw] sm:h-[90vh] overflow-hidden flex flex-col" onInteractOutside={(e) => { if (parentTourActive) e.preventDefault(); }} onEscapeKeyDown={(e) => { if (parentTourActive) e.preventDefault(); }}>
          <DialogHeader>
            <DialogTitle className="font-semibold">채널 상세</DialogTitle>
            <DialogDescription>
              {channel.channelName}의 상세 정보를 관리합니다.
            </DialogDescription>
          </DialogHeader>

          {/* Header Actions */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 pb-2">
            <div className="overflow-x-auto w-full md:w-auto -mx-2 px-2 md:mx-0 md:px-0" data-tour="chd-products-tab">
              <SegmentTabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as "basic" | "products")}
                options={[
                  { value: "basic", label: "기본 정보" },
                  { value: "products", label: "상품 관리" },
                ]}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button variant="outline" size="sm" onClick={copyChannelUrl} className="flex-1 md:flex-none">
                <Copy className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">URL 복사</span>
                <span className="sm:hidden">복사</span>
              </Button>
              <Button variant="outline" size="sm" onClick={openChannelUrl} className="flex-1 md:flex-none">
                <ExternalLink className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">쇼핑몰</span>
                <span className="sm:hidden">쇼핑몰</span>
              </Button>
              {channel.channelCode !== "DEFAULT" && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="flex-1 md:flex-none"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">삭제</span>
                  <span className="sm:hidden">삭제</span>
                </Button>
              )}
            </div>
          </div>

          {/* 탭 콘텐츠 */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {activeTab === "basic" && (
              <div className="space-y-4 py-2">
                <div className="border border-border rounded-lg p-6 bg-background" data-tour="chd-basic">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium">기본 정보</h3>
                    <Button size="sm" onClick={handleSaveBasicInfo}>
                      <Save className="h-3 w-3 mr-1" />
                      저장
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">채널 코드 *</Label>
                      <Input
                        value={formData.channelCode}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            channelCode: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="ABC"
                        disabled={channel.channelCode === "DEFAULT"}
                      />
                      <p className="text-xs text-muted-foreground">
                        영문 대문자와 숫자만 사용 가능
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">채널 이름 *</Label>
                      <Input
                        value={formData.channelName}
                        onChange={(e) =>
                          setFormData({ ...formData, channelName: e.target.value })
                        }
                        placeholder="ABC 쇼핑몰"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">회사명 *</Label>
                      <Input
                        value={formData.companyName}
                        onChange={(e) =>
                          setFormData({ ...formData, companyName: e.target.value })
                        }
                        placeholder="주식회사 ABC"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">채널 상태</Label>
                      <div className="border rounded-md p-3 bg-muted/30 flex items-center gap-2">
                        <Switch
                          id="channel-active"
                          checked={formData.active}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, active: checked })
                          }
                        />
                        <Label htmlFor="channel-active" className="cursor-pointer">
                          {formData.active ? "활성" : "비활성"}
                        </Label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">카드 사용 여부</Label>
                      <div className="border rounded-md p-3 bg-muted/30 flex items-center gap-2">
                        <Switch
                          id="channel-useCard"
                          checked={formData.useCard}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, useCard: checked })
                          }
                        />
                        <Label htmlFor="channel-useCard" className="cursor-pointer">
                          {formData.useCard ? "카드 사용" : "카드 미사용"}
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        카드 형식의 UI를 사용할지 여부를 설정합니다
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">포인트 사용 여부</Label>
                      <div className="border rounded-md p-3 bg-muted/30 flex items-center gap-2">
                        <Switch
                          id="channel-usePoint"
                          checked={formData.usePoint}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, usePoint: checked })
                          }
                        />
                        <Label htmlFor="channel-usePoint" className="cursor-pointer">
                          {formData.usePoint ? "포인트 사용" : "포인트 미사용"}
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        포인트 형식의 UI를 사용할지 여부를 설정합니다
                      </p>
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label className="text-xs">채널 설명</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({ ...formData, description: e.target.value })
                        }
                        placeholder="채널에 대한 설명을 입력하세요"
                        rows={4}
                      />
                    </div>


                    {/* 브랜딩 섹션 - 로고와 파비콘 양옆 배치 */}
                    <div className="space-y-2">
                      <Label className="text-xs">로고 이미지</Label>
                      <div className="space-y-2">
                        <div
                          className="border-2 border-dashed rounded-lg p-6 hover:border-primary/50 transition-colors cursor-pointer min-h-[180px] flex items-center justify-center"
                          onClick={() => {
                            const input = document.getElementById("logo-upload") as HTMLInputElement;
                            input?.click();
                          }}
                        >
                          {formData.logoUrl ? (
                            <div className="flex flex-col items-center gap-2">
                              <img
                                src={formData.logoUrl}
                                alt="로고 미리보기"
                                className="h-20 object-contain"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFileRemove("logoUrl");
                                }}
                              >
                                <X className="h-3 w-3 mr-1" />
                                제거
                              </Button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                              <Upload className="h-8 w-8" />
                              <div className="text-center">
                                <p className="text-sm">클릭하여 로고 업로드</p>
                                <p className="text-xs">PNG, JPG, SVG (최대 5MB)</p>
                              </div>
                            </div>
                          )}
                        </div>
                        <input
                          id="logo-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(file, "logoUrl");
                            }
                            e.target.value = "";
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">파비콘 이미지</Label>
                      <div className="space-y-2">
                        <div
                          className="border-2 border-dashed rounded-lg p-6 hover:border-primary/50 transition-colors cursor-pointer min-h-[180px] flex items-center justify-center"
                          onClick={() => {
                            const input = document.getElementById("favicon-upload") as HTMLInputElement;
                            input?.click();
                          }}
                        >
                          {formData.faviconUrl ? (
                            <div className="flex flex-col items-center gap-2">
                              <img
                                src={formData.faviconUrl}
                                alt="파비콘 미리보기"
                                className="h-20 object-contain"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFileRemove("faviconUrl");
                                }}
                              >
                                <X className="h-3 w-3 mr-1" />
                                제거
                              </Button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                              <Upload className="h-8 w-8" />
                              <div className="text-center">
                                <p className="text-sm">클릭하여 파비콘 업로드</p>
                                <p className="text-xs">ICO, PNG (최대 5MB)</p>
                              </div>
                            </div>
                          )}
                        </div>
                        <input
                          id="favicon-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(file, "faviconUrl");
                            }
                            e.target.value = "";
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {activeTab === "products" && (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 제외된 상품 목록 */}
                  <div className="border border-border rounded-lg p-4 md:p-6 bg-background min-h-[520px]">
                    <h3 className="text-sm font-medium mb-4">
                      제외된 상품 ({excludedProducts.length})
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      이 채널에서는 아래 상품들이 표시되지 않습니다.
                    </p>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {excludedProducts.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-8">
                          제외된 상품이 없습니다.
                        </p>
                      ) : (
                        excludedProducts.map((product, index) => (
                          <div
                            key={`excluded-${product.id}-${product.code}-${index}`}
                            className="flex items-center justify-between p-3 border rounded hover:bg-accent"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {product.imageUrl && (
                                <img
                                  src={getImageUrl(product.imageUrl)}
                                  alt={product.name}
                                  className="w-10 h-10 object-cover rounded flex-shrink-0"
                                />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{product.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {product.code}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveExcludedProduct(product.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* 사용 가능한 상품 목록 */}
                  <div className="border border-border rounded-lg p-4 md:p-6 bg-background min-h-[520px]">
                    <h3 className="text-sm font-medium mb-4">
                      사용 가능한 상품 ({availableProducts.length})
                    </h3>
                    <Input
                      placeholder="상품명 또는 코드로 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="mb-4"
                    />
                    <div className="space-y-2 max-h-[450px] overflow-y-auto">
                      {availableProducts.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-8">
                          검색 결과가 없습니다.
                        </p>
                      ) : (
                        availableProducts.map((product, index) => (
                          <div
                            key={`available-${product.id}-${product.code}-${index}`}
                            className="flex items-center justify-between p-3 border rounded hover:bg-accent"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 flex-shrink-0 bg-muted rounded overflow-hidden flex items-center justify-center">
                                {product.imageUrl ? (
                                  <img
                                    src={getImageUrl(product.imageUrl)}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      const parent = e.currentTarget.parentElement;
                                      if (parent) {
                                        parent.innerHTML = '<div class="text-xs text-muted-foreground">No Image</div>';
                                      }
                                    }}
                                  />
                                ) : (
                                  <div className="text-xs text-muted-foreground">No Image</div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{product.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {product.code}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAddExcludedProduct(product.id)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>채널 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 채널을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </>
  );
}