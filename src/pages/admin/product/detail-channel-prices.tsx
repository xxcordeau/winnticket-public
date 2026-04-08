import { useState, useEffect } from "react";
import { Store, Save, ChevronDown, ChevronUp } from "lucide-react";
import { CoachMark, useCoachMark, type TourStep } from "@/components/coach-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Product, ProductOption } from "@/data/dto/product.dto";
import { getChannels, getPublicChannels, type ChannelListItem } from "@/lib/api/channel";
import {
  getProductChannelPrices,
  getProductChannelPriceDetail,
  saveProductChannelPrice,
  updateProductChannelEnabled,
  type ChannelPriceItem,
  type ChannelPriceDetail,
  type ChannelPriceSaveRequest,
} from "@/lib/api/product";

/**
 * 채널별 가격 설정 인터페이스
 */
export interface ChannelPrice {
  channelId: string;
  channelCode: string;
  channelName: string;
  enabled: boolean;
  basePrice?: number; // 기본 상품 가격
  discountPrice?: number; // 할인 가격
  optionPrices: {
    optionId: string;
    optionValueId: string;
    price?: number; // 옵션 추가 가격 또는 전체 가격
  }[];
}

interface ProductDetailChannelPricesProps {
  product: Product;
  options: ProductOption[];
  channels?: ChannelListItem[]; // ⭐ 부모로부터 전달받는 채널 데이터
  onSave: (channelPrices: ChannelPrice[]) => Promise<void>;
}

export function ProductDetailChannelPrices({
  product,
  options,
  channels: channelsProp,
  onSave,
}: ProductDetailChannelPricesProps) {
  const [channels, setChannels] = useState<ChannelListItem[]>([]);
  const [channelPrices, setChannelPrices] = useState<ChannelPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null); // ⭐ 에러 상태 추가
  
  // 투어 가이드
  const chTourSteps: TourStep[] = [
    { target: "ch-table", title: "채널 목록", description: "등록된 판매 채널 목록입니다.\n각 채널의 판매가/할인가를 설정하고\n활성화/비활성화를 제어합니다.\n행을 클릭하면 가격 편집 모달이 열립니다.", placement: "bottom" },
    { target: "ch-modal-price", title: "채널 가격 설정", description: "해당 채널의 판매가와 할인가를 입력합니다.\n비워두면 상품의 기본가가 적용됩니다.", placement: "bottom", waitForTarget: 1500 },
    { target: "ch-modal-options", title: "옵션별 가격", description: "등록된 옵션별로 채널 전용 가격을 설정합니다.\n옵션을 펼쳐서 각 옵션값의 가격을 개별 입력하세요.", placement: "top", waitForTarget: 500 },
  ];

  const { isActive: isChTourActive, startTour: startChTour, endTour: endChTour } = useCoachMark("product_detail_channel");

  useEffect(() => {
    const handler = () => startChTour();
    window.addEventListener("startTabTour", handler);
    return () => window.removeEventListener("startTabTour", handler);
  }, [startChTour]);

  const handleChTourStep = (stepIndex: number, _step: TourStep) => {
    if (stepIndex >= 1) {
      // 모달 열기 (첫 번째 채널)
      if (!isModalOpen && channelPrices.length > 0) {
        handleOpenModal(channelPrices[0]);
      }
    } else {
      if (isModalOpen) setIsModalOpen(false);
    }
  };

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<ChannelPrice | null>(null);
  const [modalData, setModalData] = useState<ChannelPrice | null>(null);
  const [modalDetailData, setModalDetailData] = useState<ChannelPriceDetail | null>(null);
  const [expandedOptions, setExpandedOptions] = useState<Set<string>>(new Set()); // ⭐ 아코디언 상태

  // 채널 목록 로드
  useEffect(() => {
    loadChannels();
  }, [channelsProp]);

  // ⭐ 채널별 가격 API로 로드
  useEffect(() => {
    if (channels.length > 0 && product.id) {
      loadChannelPrices();
    }
  }, [channels, product.id]);

  const loadChannels = async () => {
    // ⭐ 부모로부터 전달받은 채널 데이터가 있으면 그것을 사용
    if (channelsProp && channelsProp.length > 0) {
      console.log('✅ [채널별 가격] 부모로부터 채널 데이터 전달받음:', channelsProp.length, '개');
      
      // visible true인 채널만 필터링
      const visibleChannels = channelsProp
        .filter((ch) => ch.visible)
        .map((ch) => ({
          ...ch,
          channelCode: ch.code,
          channelName: ch.name,
          description: ch.companyName,
          active: ch.visible,
        }));
      
      setChannels(visibleChannels as any);
      setLoading(false);
      return;
    }
    
    // ⭐ 부모로부터 전달받은 데이터가 없으면 API 호출 (fallback)
    try {
      // 토큰 확인
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        console.log('💡 [채널별 가격] 토큰 없음 - 빈 배열 사용');
        setChannels([]);
        setLoading(false);
        return;
      }
      
      console.log('🌐 [채널별 가격] /api/admin/channels API 호출 시작...');
      const response = await getChannels();
      console.log('📡 [채널별 가격] API 응답:', response);
      
      if (response.success && response.data && response.data.length > 0) {
        // API 응답 구조를 컴포넌트가 사용하는 구조로 변환
        const mappedChannels = response.data
          .filter((ch) => ch.visible) // visible true인 채널만
          .map((ch) => ({
            ...ch,
            channelCode: ch.code,
            channelName: ch.name,
            description: ch.companyName,
            active: ch.visible,
          }));
        
        console.log('✅ [채널별 가격] API 로드 성공, 채널 수:', mappedChannels.length);
        setChannels(mappedChannels as any);
      } else {
        console.log('💡 [채널별 가격] API 데이터 없음 - 빈 배열 사용');
        setChannels([]);
      }
    } catch (error) {
      console.log('💡 [채널별 가격] API 연결 실패 - 빈 배열 사용');
      setChannels([]);
    } finally {
      setLoading(false);
    }
  };

  // ⭐ 새로운 API로 채널별 가격 목록 로드
  const loadChannelPrices = async () => {
    setLoading(true);
    setError(null); // 에러 초기화
    try {
      const response = await getProductChannelPrices(product.id);
      
      // ⭐ success: false인 경우 조용히 기본값 초기화
      if (!response.success) {
        initializeChannelPrices();
        return;
      }
      
      if (response.data && response.data.length > 0) {
        // API 응답을 컴포넌트 형식으로 변환
        const prices: ChannelPrice[] = response.data.map((item: ChannelPriceItem) => ({
          channelId: item.channelId,
          channelCode: item.channelCode,
          channelName: item.channelName,
          enabled: item.enabled,
          basePrice: item.basePrice,
          discountPrice: item.discountPrice,
          optionPrices: [], // 상세 조회에서 가져옴
        }));
        
        setChannelPrices(prices);
      } else {
        // 데이터가 없는 경우 기본값 초기화
        initializeChannelPrices();
      }
    } catch (error) {
      // ⭐ 에러 발생 시 조용히 기본값으로 초기화
      initializeChannelPrices();
    } finally {
      setLoading(false);
    }
  };

  const initializeChannelPrices = () => {
    // 기본값 설정 (API 실패 시 폴백)
    const defaultPrices: ChannelPrice[] = channels.map((channel) => ({
      channelId: channel.id,
      channelCode: channel.channelCode,
      channelName: channel.channelName,
      enabled: false, // 기본적으로 비활성화
      basePrice: product.price,
      discountPrice: product.discountPrice,
      optionPrices: [],
    }));

    // 각 채널별로 옵션 가격 초기화
    defaultPrices.forEach((channelPrice) => {
      options.forEach((option) => {
        option.values.forEach((value) => {
          channelPrice.optionPrices.push({
            optionId: option.id,
            optionValueId: value.id,
            price: value.additionalPrice,
          });
        });
      });
    });

    setChannelPrices(defaultPrices);
  };

  // ⭐ 활성화 토글 - API 호출
  const handleChannelToggle = async (channelId: string, enabled: boolean) => {
    setSaving(true);
    try {
      const response = await updateProductChannelEnabled(product.id, channelId, enabled);
      
      if (response.success) {
        // 상태 업데이트
        setChannelPrices((prev) =>
          prev.map((cp) =>
            cp.channelId === channelId ? { ...cp, enabled } : cp
          )
        );
        toast.success(enabled ? '상품 노출이 활성화되었습니다' : '상품 노출이 비활성화되었습니다');
      } else {
        toast.error(response.message || '활성화 상태 변경에 실패했습니다');
      }
    } catch (error) {
      console.error('[채널별 가격] 활성화 토글 실패:', error);
      toast.error('활성화 상태 변경 중 오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  };

  // ⭐ 모달 열기 - 상세 조회 API 호출
  const handleOpenModal = async (channelPrice: ChannelPrice) => {
    setSelectedChannel(channelPrice);
    setModalData(JSON.parse(JSON.stringify(channelPrice))); // 깊은 복사
    setIsModalOpen(true);
    
    // ⭐ 첫 번째 옵션만 펼쳐진 상태로 초기화
    if (options.length > 0) {
      setExpandedOptions(new Set([options[0].id]));
    }
    
    // 상세 정보 로드
    try {
      const response = await getProductChannelPriceDetail(product.id, channelPrice.channelId);
      
      if (response.success && response.data) {
        setModalDetailData(response.data);
        
        // 옵션 가격 정보 업데이트
        const optionPrices: any[] = [];
        response.data.options.forEach((opt: any) => {
          const valueList = opt.values ?? opt.optionsValues ?? [];
          valueList.forEach((val: any) => {
            optionPrices.push({
              optionId: opt.optionId,
              optionValueId: val.optionValueId ?? val.optionvalueId,
              price: val.additionalPrice ?? undefined, // ⭐ NULL이면 undefined (값 없음)
            });
          });
        });
        
        setModalData(prev => prev ? {
          ...prev,
          basePrice: response.data!.basePrice ?? undefined, // ⭐ NULL이면 undefined (기본가 사용)
          discountPrice: response.data!.discountPrice ?? undefined, // ⭐ NULL이면 undefined (할인 없음)
          optionPrices,
        } : null);
      }
    } catch (error) {
      console.error('[채널별 가격] 상세 조회 실패:', error);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedChannel(null);
    setModalData(null);
    setModalDetailData(null);
    setExpandedOptions(new Set()); // ⭐ 아코디언 상태 초기화
  };

  // ⭐ 아코디언 토글
  const toggleOptionExpanded = (optionId: string) => {
    const newExpanded = new Set(expandedOptions);
    if (newExpanded.has(optionId)) {
      newExpanded.delete(optionId);
    } else {
      newExpanded.add(optionId);
    }
    setExpandedOptions(newExpanded);
  };

  // ⭐ 저장 - API 호출
  const handleModalSave = async () => {
    if (!modalData) return;

    setSaving(true);
    try {
      // API 요청 데이터 구성
      const saveRequest: ChannelPriceSaveRequest = {
        basePrice: modalData.basePrice,
        discountPrice: modalData.discountPrice,
        options: modalData.optionPrices.map(op => ({
          optionId: op.optionId, // ⭐ optionId 추가
          optionValueId: op.optionValueId,
          additionalPrice: op.price,
        })),
      };
      
      const response = await saveProductChannelPrice(
        product.id,
        modalData.channelId,
        saveRequest
      );
      
      if (response.success) {
        // 상태 업데이트
        const updatedChannelPrices = channelPrices.map((cp) =>
          cp.channelId === modalData.channelId ? modalData : cp
        );
        setChannelPrices(updatedChannelPrices);
        
        toast.success("채널별 가격이 저장되었습니다");
        handleCloseModal();
      } else {
        toast.error(response.message || "채널별 가격 저장에 실패했습니다");
      }
    } catch (error) {
      console.error('[채널별 가격] 저장 실패:', error);
      toast.error("채널별 가격 저장 중 오류가 발생했습니다");
    } finally {
      setSaving(false);
    }
  };

  const handleModalBasePriceChange = (price: string) => {
    if (!modalData) return;
    const numericValue = price.replace(/[^0-9]/g, "");
    // ⭐ 0원도 허용 (빈 문자열일 때만 undefined)
    setModalData({
      ...modalData,
      basePrice: numericValue === "" ? undefined : parseInt(numericValue),
    });
  };

  const handleModalDiscountPriceChange = (price: string) => {
    if (!modalData) return;
    const numericValue = price.replace(/[^0-9]/g, "");
    // ⭐ 0원도 허용 (빈 문자열일 때만 undefined)
    setModalData({
      ...modalData,
      discountPrice: numericValue === "" ? undefined : parseInt(numericValue),
    });
  };

  const handleModalOptionPriceChange = (
    optionId: string,
    optionValueId: string,
    price: string
  ) => {
    if (!modalData) return;

    const numericValue = price.replace(/[^0-9]/g, "");
    const updatedOptionPrices = modalData.optionPrices.map((op) =>
      op.optionId === optionId && op.optionValueId === optionValueId
        ? { ...op, price: numericValue ? parseInt(numericValue) : undefined }
        : op
    );

    // 옵션이 없으면 추가
    const exists = modalData.optionPrices.some(
      (op) => op.optionId === optionId && op.optionValueId === optionValueId
    );
    if (!exists) {
      updatedOptionPrices.push({
        optionId,
        optionValueId,
        price: numericValue ? parseInt(numericValue) : undefined,
      });
    }

    setModalData({
      ...modalData,
      optionPrices: updatedOptionPrices,
    });
  };

  const getOptionPrice = (
    optionId: string,
    optionValueId: string
  ): number | undefined => {
    if (!modalData) return undefined;

    const optionPrice = modalData.optionPrices.find(
      (op) => op.optionId === optionId && op.optionValueId === optionValueId
    );
    return optionPrice?.price;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground text-sm">채널 정보 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (channels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Store className="size-12 text-muted-foreground" />
        <p className="text-muted-foreground">활성화된 채널이 없습니다.</p>
        <p className="text-sm text-muted-foreground">
          채널 관리에서 채널을 먼저 생성해주세요.
        </p>
      </div>
    );
  }

  // ⭐ 채널별 가격 데이터가 없을 때
  if (!loading && channelPrices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Store className="size-12 text-muted-foreground" />
        <p className="text-lg font-medium text-muted-foreground">채널별 가격 데이터가 없습니다</p>
        <p className="text-sm text-muted-foreground">
          채널이 설정되었지만 가격 정보를 불러올 수 없습니다.
        </p>
        <Button 
          variant="outline" 
          onClick={() => loadChannelPrices()}
          className="mt-4"
        >
          다시 시도
        </Button>
      </div>
    );
  }

  // ⭐ 에러가 발생했을 때
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <Store className="size-6 text-destructive" />
        </div>
        <p className="text-lg font-medium text-destructive">오류가 발생했습니다</p>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          {error}
        </p>
        <Button 
          variant="outline" 
          onClick={() => {
            setError(null);
            loadChannelPrices();
          }}
          className="mt-4"
        >
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium text-[18px]">채널별 가격 설정</h3>
        <p className="text-sm text-muted-foreground mt-1">
          각 채널마다 상품 및 옵션의 판매 가격을 개별적으로 설정할 수 있습니다.
        </p>
      </div>

      {/* 채널 목록 - 모바일 카드 */}
      <div className="md:hidden space-y-3" data-tour="ch-table">
        {channelPrices.map((channelPrice) => {
          const channel = channels.find((ch) => ch.id === channelPrice.channelId);
          if (!channel) return null;
          return (
            <div
              key={channelPrice.channelId}
              className="relative bg-card rounded-[8px] p-4 cursor-pointer"
              onClick={() => handleOpenModal(channelPrice)}
            >
              <div aria-hidden="true" className="absolute border border-border inset-0 rounded-[8px] pointer-events-none" />
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {channel.logoUrl ? (
                    <img src={channel.logoUrl} alt={channel.channelName} className="w-9 h-9 object-contain rounded flex-shrink-0" />
                  ) : (
                    <div className="w-9 h-9 bg-muted rounded flex items-center justify-center flex-shrink-0">
                      <Store className="size-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{channel.channelName}</p>
                    <Badge variant="outline" className="text-[10px] mt-0.5">{channel.channelCode}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Switch
                    checked={channelPrice.enabled}
                    onCheckedChange={(enabled) => handleChannelToggle(channelPrice.channelId, enabled)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground">기본가 </span>
                  <span className="font-medium">
                    {channelPrice.basePrice !== undefined ? `₩${channelPrice.basePrice.toLocaleString()}` : "기본가 사용"}
                  </span>
                </div>
                {channelPrice.discountPrice !== undefined && (
                  <div>
                    <span className="text-xs text-muted-foreground">할인가 </span>
                    <span className="font-medium text-primary">₩{channelPrice.discountPrice.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 채널 목록 테이블 - 데스크톱 */}
      <div className="hidden md:block w-full overflow-x-auto" data-tour="ch-table">
        <div className="content-stretch flex flex-col items-start relative shrink-0 min-w-[700px]">
          {/* Table Header */}
          <div className="h-[40px] relative shrink-0 w-full bg-muted/30">
            <div className="content-stretch flex h-[40px] items-start overflow-clip relative rounded-[inherit] w-full">
              <div className="basis-0 content-stretch flex grow h-full items-start overflow-clip relative shrink-0">
                {/* 로고 Header */}
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[80px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">로고</p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>

                {/* 채널명 Header */}
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[270px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">채널명</p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>

                {/* 채널코드 Header */}
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[100px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">코드</p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>

                {/* 기본가 Header */}
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[150px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">기본가</p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>

                {/* 할인가 Header */}
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[150px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">할인가</p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>

                {/* 판매 활성화 Header */}
                <div className="box-border content-stretch flex justify-end gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[20px] py-0 relative shrink-0 w-[80px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">활성화</p>
                </div>
              </div>
            </div>
            <div aria-hidden="true" className="absolute border-[1px_0px] border-border border-solid inset-0 pointer-events-none" />
          </div>

          {/* Table Body */}
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
            {channelPrices.map((channelPrice, rowIndex) => {
              const channel = channels.find((ch) => ch.id === channelPrice.channelId);
              if (!channel) return null;

              return (
                <div
                  key={channelPrice.channelId}
                  onClick={() => handleOpenModal(channelPrice)}
                  className={`content-stretch flex h-[52px] items-center overflow-clip relative shrink-0 w-full group transition-colors cursor-pointer ${
                    rowIndex % 2 === 0
                      ? "bg-card hover:bg-[#F3F4F6] dark:hover:bg-muted/10"
                      : "bg-[#F9FAFB] dark:bg-muted/30 hover:bg-[#F3F4F6] dark:hover:bg-muted/10"
                  }`}
                >
                  {/* 로고 Column */}
                  <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[80px]">
                    {channel.logoUrl ? (
                      <img
                        src={channel.logoUrl}
                        alt={channel.channelName}
                        className="w-10 h-10 object-contain rounded"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                        <Store className="size-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* 채널명 Column */}
                  <div className="box-border content-stretch flex flex-col gap-[2px] h-full items-start justify-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[270px]">
                    <p className="text-[14px] text-foreground text-nowrap overflow-ellipsis overflow-hidden">
                      {channel.channelName}
                    </p>
                    <p className="text-[11px] text-muted-foreground text-nowrap overflow-ellipsis overflow-hidden">
                      {channel.description}
                    </p>
                  </div>

                  {/* 채널코드 Column */}
                  <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[100px]">
                    <Badge variant="outline" className="text-[10px]">
                      {channel.channelCode}
                    </Badge>
                  </div>

                  {/* 기본가 Column */}
                  <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[150px]">
                    {channelPrice.basePrice !== undefined ? (
                      <span className="text-[14px] text-foreground">
                        ₩{channelPrice.basePrice.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-[13px] text-muted-foreground">기본가 사용</span>
                    )}
                  </div>

                  {/* 할인가 Column */}
                  <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[150px]">
                    {channelPrice.discountPrice !== undefined ? (
                      <span className="text-[14px] text-primary font-medium">
                        ₩{channelPrice.discountPrice.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-[13px] text-muted-foreground">-</span>
                    )}
                  </div>

                  {/* 판매 활성화 Column */}
                  <div 
                    className="box-border content-stretch flex justify-end gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[20px] py-0 relative shrink-0 w-[80px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Switch
                      checked={channelPrice.enabled}
                      onCheckedChange={(enabled) =>
                        handleChannelToggle(channelPrice.channelId, enabled)
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 가격 설정 모달 */}
      <Dialog open={isModalOpen} modal={!isChTourActive} onOpenChange={(open) => { if (isChTourActive && !open) return; setIsModalOpen(open); }}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {modalData && (
                <>
                  {channels.find((ch) => ch.id === modalData.channelId)?.logoUrl ? (
                    <img
                      src={channels.find((ch) => ch.id === modalData.channelId)?.logoUrl}
                      alt={modalData.channelName}
                      className="w-8 h-8 object-contain rounded"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                      <Store className="size-4 text-muted-foreground" />
                    </div>
                  )}
                  {modalData.channelName} 가격 설정
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              이 채널에서 판매될 상품과 옵션의 가격을 설정합니다.
            </DialogDescription>
          </DialogHeader>

          {modalData && (
            <div className="space-y-6 py-4">
              {/* 기본 가격 설정 */}
              <div className="space-y-4" data-tour="ch-modal-price">
                <h4 className="font-medium text-sm">기본 가격</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">판매가 (선택)</Label>
                    <Input
                      type="text"
                      value={
                        modalData.basePrice !== undefined
                          ? modalData.basePrice.toLocaleString()
                          : ""
                      }
                      onChange={(e) => handleModalBasePriceChange(e.target.value)}
                      placeholder="0"
                      className="text-right"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">할인가 (선택)</Label>
                    <Input
                      type="text"
                      value={
                        modalData.discountPrice !== undefined
                          ? modalData.discountPrice.toLocaleString()
                          : ""
                      }
                      onChange={(e) =>
                        handleModalDiscountPriceChange(e.target.value)
                      }
                      placeholder="0"
                      className="text-right"
                    />
                  </div>
                </div>
              </div>

              {/* 옵션별 가격 설정 */}
              {options.length > 0 && (
                <div className="space-y-4 pt-4 border-t" data-tour="ch-modal-options">
                  <h4 className="font-medium text-sm">옵션별 가격 설정</h4>
                  {options.map((option) => {
                    const isExpanded = expandedOptions.has(option.id);
                    
                    return (
                      <div key={option.id} className="space-y-3 border rounded-lg overflow-hidden">
                        {/* ⭐ 클릭 가능한 헤더 */}
                        <button
                          type="button"
                          onClick={() => toggleOptionExpanded(option.id)}
                          className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{option.name}</Badge>
                            <span className="text-xs text-muted-foreground">
                              ({option.code})
                            </span>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="size-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="size-4 text-muted-foreground" />
                          )}
                        </button>
                        
                        {/* ⭐ 조건부로 표시되는 내용 */}
                        {isExpanded && (
                          <div className="space-y-2 p-3 pt-0">
                            {option.values.map((value) => (
                              <div key={value.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-sm">{value.value}</div>
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    기본 추가금: +{value.additionalPrice?.toLocaleString() || "0"}원
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Label className="text-xs text-muted-foreground whitespace-nowrap">
                                    채널 가격
                                  </Label>
                                  <Input
                                    type="text"
                                    value={
                                      getOptionPrice(option.id, value.id)?.toLocaleString() ||
                                      ""
                                    }
                                    onChange={(e) =>
                                      handleModalOptionPriceChange(
                                        option.id,
                                        value.id,
                                        e.target.value
                                      )
                                    }
                                    placeholder={`+${value.additionalPrice?.toLocaleString() || "0"}`}
                                    className="text-right text-sm w-32"
                                  />
                                  <span className="text-xs text-muted-foreground">원</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal} disabled={saving}>
              취소
            </Button>
            <Button onClick={handleModalSave} disabled={saving}>
              <Save className="size-4 mr-2" />
              {saving ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CoachMark steps={chTourSteps} isActive={isChTourActive} onFinish={() => { setIsModalOpen(false); endChTour(); }} storageKey="product_detail_channel" onStepChange={handleChTourStep} />
    </div>
  );
}