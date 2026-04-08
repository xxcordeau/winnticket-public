import React, { useState, useEffect } from "react";
import type { Channel } from "@/data/dto/channel.dto";
import type { ProductChannelDiscount, CreateProductChannelDiscountDto, UpdateProductChannelDiscountDto, ChannelDiscountStatus } from "@/data/dto/product.dto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Switch } from "@/components/ui/switch";
import { Search, Plus, Edit, Trash2, Calculator, Download } from "lucide-react";
import { toast } from "sonner";
import {
  getProductChannelDiscounts,
  createProductChannelDiscount,
  updateProductChannelDiscount,
  deleteProductChannelDiscount,
  resetChannelDiscounts,
} from "@/data/products";
import * as ChannelAPI from "@/lib/api/channel"; // ⭐ 실제 채널 API
import type { ChannelListItem } from "@/lib/api/channel";

interface ProductChannelDiscountsProps {
  productId: string;
  productPrice: number;
  channels?: ChannelListItem[]; // ⭐ 부모로부터 전달받는 채널 데이터
}

export function ProductChannelDiscounts({
  productId,
  productPrice,
  channels: channelsProp,
}: ProductChannelDiscountsProps) {
  const [discounts, setDiscounts] = useState<ProductChannelDiscount[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [filteredDiscounts, setFilteredDiscounts] = useState<ProductChannelDiscount[]>([]);
  
  // 필터 상태
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterPeriod, setFilterPeriod] = useState<string>("ALL");
  const [searchKeyword, setSearchKeyword] = useState("");

  // Dialog 상태
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<ProductChannelDiscount | null>(null);

  // 폼 상태
  const [formData, setFormData] = useState({
    channelId: "",
    discountRate: 0,
    startDate: "",
    endDate: "",
    visible: true,
  });

  // 자동 계산된 판매가
  const [calculatedPrice, setCalculatedPrice] = useState(productPrice);

  // 시뮬레이터 상태
  const [simulatorRate, setSimulatorRate] = useState(0);
  const [simulatorBasePrice, setSimulatorBasePrice] = useState(productPrice);

  useEffect(() => {
    loadDiscounts();
    loadChannels();
  }, [productId, channelsProp]);

  useEffect(() => {
    applyFilters();
  }, [discounts, filterStatus, filterPeriod, searchKeyword]);

  useEffect(() => {
    // 할인율 변경 시 판매가 자동 계산
    const salePrice = Math.round(productPrice * (1 - formData.discountRate / 100));
    setCalculatedPrice(salePrice);
  }, [formData.discountRate, productPrice]);

  const loadDiscounts = () => {
    const response = getProductChannelDiscounts(productId);
    if (response.success) {
      setDiscounts(response.data);
    }
  };

  const loadChannels = async () => {
    // ⭐ 부모로부터 전달받은 채널 데이터가 있으면 그것을 사용
    if (channelsProp && channelsProp.length > 0) {
      console.log('✅ [채널별 할인 Mobile] 부모로부터 채널 데이터 전달받음:', channelsProp.length, '개');
      
      // ⭐ ChannelListItem을 Channel 타입으로 변환
      const mappedChannels: Channel[] = channelsProp.map((item) => ({
        id: item.id,
        channelCode: item.code,
        channelName: item.name,
        companyName: item.companyName,
        logoUrl: item.logoUrl || '',
        faviconUrl: '',
        description: '',
        contactEmail: '',
        contactPhone: '',
        websiteUrl: item.domain || '',
        domain: item.domain,
        commissionRate: 0,
        active: item.visible,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      
      setChannels(mappedChannels);
      return;
    }
    
    // ⭐ 부모로부터 전달받은 데이터가 없으면 API 호출 (fallback)
    try {
      // 토큰 확인
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        console.log('💡 [채널별 할인 Mobile] 토큰 없음 - 빈 배열 사용');
        setChannels([]);
        return;
      }
      
      console.log('🛍️ [채널별 할인 Mobile] /api/admin/channels API 호출 시작...');
      const apiResponse = await ChannelAPI.getChannels();
      
      if (apiResponse.success && apiResponse.data && apiResponse.data.length > 0) {
        console.log('✅ [채널별 할인 Mobile] API에서 채널 목록 로드:', apiResponse.data.length, '개');
        
        // ⭐ API 응답을 Channel 타입으로 변환
        const mappedChannels: Channel[] = apiResponse.data.map((item) => ({
          id: item.id,
          channelCode: item.code,
          channelName: item.name,
          companyName: item.companyName,
          logoUrl: item.logoUrl || '',
          faviconUrl: '',
          description: '',
          contactEmail: '',
          contactPhone: '',
          websiteUrl: item.domain || '',
          domain: item.domain,
          commissionRate: 0,
          active: item.visible,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        
        console.log('✅ [채널별 할인 Mobile] 변환된 채널:', mappedChannels.map(c => c.channelName));
        setChannels(mappedChannels);
      } else {
        console.log('💡 [채널별 할인 Mobile] API 데이터 없음 - 빈 배열 사용');
        setChannels([]);
      }
    } catch (error) {
      console.log('💡 [채널별 할인 Mobile] API 연결 실패 - 빈 배열 사용');
      setChannels([]);
    }
  };

  const applyFilters = () => {
    let filtered = [...discounts];

    // 검색
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter(d => {
        const channel = channels.find(c => c.id === d.channelId);
        const channelName = channel?.channelName || d.channelName || "";
        return channelName.toLowerCase().includes(keyword);
      });
    }

    // 상태 필터
    if (filterStatus !== "ALL") {
      filtered = filtered.filter(d => d.status === filterStatus);
    }

    // 기간 필터
    if (filterPeriod !== "ALL") {
      const now = new Date();
      if (filterPeriod === "CURRENT") {
        // 진행중인 할인
        filtered = filtered.filter(d => {
          const start = new Date(d.startDate);
          const end = new Date(d.endDate);
          return now >= start && now <= end;
        });
      } else if (filterPeriod === "UPCOMING") {
        // 예정된 할인
        filtered = filtered.filter(d => new Date(d.startDate) > now);
      } else if (filterPeriod === "EXPIRED") {
        // 만료된 할인
        filtered = filtered.filter(d => new Date(d.endDate) < now);
      }
    }

    setFilteredDiscounts(filtered);
  };

  const resetForm = () => {
    setFormData({
      channelId: "",
      discountRate: 0,
      startDate: "",
      endDate: "",
      visible: true,
    });
    setCalculatedPrice(productPrice);
  };

  const handleCreate = () => {
    if (!formData.channelId) {
      toast.error("채널을 선택해주세요.");
      return;
    }
    if (formData.discountRate < 0 || formData.discountRate > 100) {
      toast.error("할인율은 0~100% 사이로 입력해주세요.");
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      toast.error("할인 기간을 입력해주세요.");
      return;
    }
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      toast.error("종료일은 시작일 이후여야 합니다.");
      return;
    }

    const dto: CreateProductChannelDiscountDto = {
      productId,
      ...formData,
    };

    const response = createProductChannelDiscount(dto);
    if (response.success) {
      toast.success(response.message);
      setIsCreateDialogOpen(false);
      resetForm();
      loadDiscounts();
    } else {
      toast.error(response.message);
    }
  };

  const handleEdit = () => {
    if (!selectedDiscount) return;

    if (formData.discountRate < 0 || formData.discountRate > 100) {
      toast.error("할인율은 0~100% 사이로 입력해주세요.");
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      toast.error("할인 기간을 입력해주세요.");
      return;
    }
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      toast.error("종료일은 시작일 이후여야 합니다.");
      return;
    }

    const dto: UpdateProductChannelDiscountDto = {
      discountRate: formData.discountRate,
      startDate: formData.startDate,
      endDate: formData.endDate,
      visible: formData.visible,
    };

    const response = updateProductChannelDiscount(selectedDiscount.id, dto);
    if (response.success) {
      toast.success(response.message);
      setIsEditDialogOpen(false);
      setSelectedDiscount(null);
      resetForm();
      loadDiscounts();
    } else {
      toast.error(response.message);
    }
  };

  const handleDelete = () => {
    if (!selectedDiscount) return;

    const response = deleteProductChannelDiscount(selectedDiscount.id);
    if (response.success) {
      toast.success(response.message);
      setIsDeleteDialogOpen(false);
      setSelectedDiscount(null);
      loadDiscounts();
    } else {
      toast.error(response.message);
    }
  };

  const openEditDialog = (discount: ProductChannelDiscount) => {
    setSelectedDiscount(discount);
    setFormData({
      channelId: discount.channelId,
      discountRate: discount.discountRate,
      startDate: discount.startDate.split("T")[0],
      endDate: discount.endDate.split("T")[0],
      visible: discount.visible,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (discount: ProductChannelDiscount) => {
    setSelectedDiscount(discount);
    setIsDeleteDialogOpen(true);
  };

  const getStatusBadgeVariant = (status: ChannelDiscountStatus) => {
    switch (status) {
      case "활성":
        return "default";
      case "예정":
        return "secondary";
      case "만료":
        return "outline";
      case "비활성":
        return "destructive";
      default:
        return "outline";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}/${day}`;
  };

  // CSV Export 기능
  const handleExportCSV = () => {
    const headers = ["채널명", "할인율(%)", "판매가", "시작일", "종료일", "상태", "노출여부"];
    const rows = filteredDiscounts.map(d => [
      d.channelName || "-",
      d.discountRate.toString(),
      d.salePrice.toString(),
      d.startDate.split("T")[0],
      d.endDate.split("T")[0],
      d.status,
      d.visible ? "O" : "X",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `channel_discounts_${productId}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast.success("CSV 파일이 다운로드되었습니다.");
  };

  // 시뮬레이터 가격 계산
  const simulatedPrice = Math.round(simulatorBasePrice * (1 - simulatorRate / 100));

  // 만료 여부 확인
  const isExpired = (discount: ProductChannelDiscount) => {
    return new Date(discount.endDate) < new Date();
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 적용가 시뮬레이터 카드 */}
      <div className="bg-card rounded-[8px] border border-border p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Calculator className="size-4 sm:size-5 text-[#0c8ce9]" />
          <h3 className="text-sm sm:text-[15px] font-medium">적용가 시뮬레이터</h3>
        </div>
        <p className="text-xs sm:text-[13px] text-muted-foreground mb-3 sm:mb-4">
          할인율을 입력하여 최종 판매가를 미리 확인하세요.
        </p>
        {/* 모바일: 2x2 그리드, PC: 가로 배치 */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="space-y-2">
            <Label className="text-xs sm:text-[13px]">할인율 (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={simulatorRate || ""}
              onChange={(e) => setSimulatorRate(Number(e.target.value))}
              placeholder="0-100"
              className="h-9 sm:h-10 text-sm w-full"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs sm:text-[13px]">기본가</Label>
            <Input
              type="number"
              min="0"
              value={simulatorBasePrice || ""}
              onChange={(e) => setSimulatorBasePrice(Number(e.target.value))}
              placeholder="기본가 입력"
              className="h-9 sm:h-10 text-sm w-full"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs sm:text-[13px]">최종 판매가</Label>
            <div className="h-9 sm:h-10 px-2 sm:px-3 flex items-center bg-primary/10 rounded-md text-primary text-sm sm:text-base font-semibold w-full">
              ₩{simulatedPrice.toLocaleString()}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs sm:text-[13px]">할인금액</Label>
            <div className="h-9 sm:h-10 px-2 sm:px-3 flex items-center bg-destructive/10 rounded-md text-destructive text-sm sm:text-base font-medium w-full">
              -₩{(simulatorBasePrice - simulatedPrice).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* 컨테이너 */}
      <div className="bg-card relative rounded-[8px] flex-1 flex flex-col border">
        <div className="box-border content-stretch flex flex-col gap-3 sm:gap-[20px] items-start px-4 py-4 sm:px-[32px] sm:py-[20px] flex-1 overflow-hidden">
          {/* 검색 및 액션 */}
          <div className="content-stretch flex flex-col sm:flex-row items-stretch sm:items-center justify-between relative shrink-0 w-full gap-3 sm:gap-4">
            {/* 검색 */}
            <div className="bg-background box-border content-stretch flex gap-2 h-9 items-center px-3 sm:px-4 py-2 relative rounded-md shrink-0 w-full sm:w-[300px] border focus-within:ring-1 focus-within:ring-primary transition-shadow">
              <Search className="h-4 w-4 sm:h-[18px] sm:w-[18px] text-muted-foreground" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="채널명으로 검색..."
                className="text-xs sm:text-sm text-foreground placeholder:text-muted-foreground bg-transparent border-none outline-none flex-1"
              />
            </div>

            {/* 필터 및 액션 버튼 */}
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[110px] sm:w-[120px] h-8 sm:h-9 text-xs sm:text-sm">
                  <SelectValue placeholder="상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">전체 상태</SelectItem>
                  <SelectItem value="활성">활성</SelectItem>
                  <SelectItem value="예정">예정</SelectItem>
                  <SelectItem value="만료">만료</SelectItem>
                  <SelectItem value="비활성">비활성</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                <SelectTrigger className="w-[110px] sm:w-[120px] h-8 sm:h-9 text-xs sm:text-sm">
                  <SelectValue placeholder="기간" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">전체 기간</SelectItem>
                  <SelectItem value="CURRENT">진행중</SelectItem>
                  <SelectItem value="UPCOMING">예정</SelectItem>
                  <SelectItem value="EXPIRED">만료</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={handleExportCSV} className="h-8 sm:h-9 text-xs sm:text-sm">
                <Download className="size-3.5 sm:size-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">CSV</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    if (confirm('채널별 할인 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
                      resetChannelDiscounts();
                      loadDiscounts();
                      toast.success('할인 데이터가 초기화되었습니다.');
                    }
                  }
                }}
                className="opacity-0 hover:opacity-100 transition-opacity h-8 sm:h-9"
                title="Ctrl + 클릭하여 데이터 초기화"
              >
                🔄
              </Button>
              <Button onClick={() => {
                resetForm();
                setIsCreateDialogOpen(true);
              }} size="sm" className="gap-1.5 sm:gap-2 h-8 sm:h-9 text-xs sm:text-sm">
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">할인 추가</span>
                <span className="sm:hidden">추가</span>
              </Button>
            </div>
          </div>

          {/* 모바일 카드 리스트 */}
          <div className="sm:hidden w-full space-y-3">
            {filteredDiscounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center w-full py-12 gap-3">
                <p className="text-sm text-muted-foreground">등록된 채널별 할인이 없습니다.</p>
              </div>
            ) : (
              filteredDiscounts.map((discount) => {
                const expired = isExpired(discount);
                const channel = channels.find(c => c.id === discount.channelId);
                return (
                  <div
                    key={discount.id}
                    className={`rounded-lg border bg-card p-4 space-y-3 ${expired ? "opacity-50" : ""}`}
                  >
                    {/* 채널명 & 상태 */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {channel?.channelName || discount.channelName || "-"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Badge variant={getStatusBadgeVariant(discount.status)} className="text-[10px]">
                          {discount.status}
                        </Badge>
                        {expired && discount.discountRate > 0 && (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            만료
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* 가격 정보 */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">할인율</p>
                        <p className="font-medium">
                          {discount.discountRate > 0 ? `${discount.discountRate}%` : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">정가</p>
                        <p className="font-medium">₩{productPrice.toLocaleString()}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground mb-1">판매가</p>
                        {discount.discountRate > 0 ? (
                          <div>
                            <p className="text-primary font-medium">
                              ₩{discount.salePrice.toLocaleString()}
                            </p>
                            <p className="text-xs text-destructive">
                              (-₩{(productPrice - discount.salePrice).toLocaleString()} 할인)
                            </p>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">
                            ₩{productPrice.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 기간 */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground mb-1">시작일</p>
                        <p>{discount.discountRate > 0 ? formatDate(discount.startDate) : "-"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">종료일</p>
                        <p>{discount.discountRate > 0 ? formatDate(discount.endDate) : "-"}</p>
                      </div>
                    </div>

                    {/* 액션 */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">노출</span>
                        <Switch
                          checked={discount.visible}
                          onCheckedChange={(checked) => {
                            const dto: UpdateProductChannelDiscountDto = {
                              discountRate: discount.discountRate,
                              startDate: discount.startDate,
                              endDate: discount.endDate,
                              visible: checked,
                            };
                            const response = updateProductChannelDiscount(discount.id, dto);
                            if (response.success) {
                              toast.success("노출 여부가 변경되었습니다.");
                              loadDiscounts();
                            } else {
                              toast.error(response.message);
                            }
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(discount)}
                          className="h-8 px-2"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(discount)}
                          className="h-8 px-2"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* PC 테이블 (간소화) */}
          <div className="hidden sm:block w-full overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-3 text-sm font-medium">채널명</th>
                  <th className="text-left p-3 text-sm font-medium">할인율</th>
                  <th className="text-left p-3 text-sm font-medium">정가</th>
                  <th className="text-left p-3 text-sm font-medium">판매가</th>
                  <th className="text-left p-3 text-sm font-medium">시작일</th>
                  <th className="text-left p-3 text-sm font-medium">종료일</th>
                  <th className="text-left p-3 text-sm font-medium">상태</th>
                  <th className="text-center p-3 text-sm font-medium">노출</th>
                  <th className="text-center p-3 text-sm font-medium">관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredDiscounts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-muted-foreground">
                      등록된 채널별 할인이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredDiscounts.map((discount, index) => {
                    const expired = isExpired(discount);
                    const channel = channels.find(c => c.id === discount.channelId);
                    return (
                      <tr
                        key={discount.id}
                        className={`border-b hover:bg-muted/50 ${expired ? "opacity-50" : ""} ${
                          index % 2 === 0 ? "bg-card" : "bg-muted/10"
                        }`}
                      >
                        <td className="p-3 text-sm">
                          {channel?.channelName || discount.channelName || "-"}
                        </td>
                        <td className="p-3 text-sm">
                          {discount.discountRate > 0 ? `${discount.discountRate}%` : "-"}
                        </td>
                        <td className="p-3 text-sm">₩{productPrice.toLocaleString()}</td>
                        <td className="p-3 text-sm">
                          {discount.discountRate > 0 ? (
                            <div>
                              <div className="text-primary font-medium">
                                ₩{discount.salePrice.toLocaleString()}
                              </div>
                              <div className="text-xs text-destructive">
                                (-₩{(productPrice - discount.salePrice).toLocaleString()})
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">
                              ₩{productPrice.toLocaleString()}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {discount.discountRate > 0 ? formatDate(discount.startDate) : "-"}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {discount.discountRate > 0 ? formatDate(discount.endDate) : "-"}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Badge variant={getStatusBadgeVariant(discount.status)} className="text-[10px]">
                              {discount.status}
                            </Badge>
                            {expired && discount.discountRate > 0 && (
                              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                만료
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex justify-center">
                            <Switch
                              checked={discount.visible}
                              onCheckedChange={(checked) => {
                                const dto: UpdateProductChannelDiscountDto = {
                                  discountRate: discount.discountRate,
                                  startDate: discount.startDate,
                                  endDate: discount.endDate,
                                  visible: checked,
                                };
                                const response = updateProductChannelDiscount(discount.id, dto);
                                if (response.success) {
                                  toast.success("노출 여부가 변경되었습니다.");
                                  loadDiscounts();
                                } else {
                                  toast.error(response.message);
                                }
                              }}
                            />
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEditDialog(discount)}
                              className="p-2 rounded-md transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => openDeleteDialog(discount)}
                              className="p-2 rounded-md transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 할인 추가 Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>채널별 할인 추가</DialogTitle>
            <DialogDescription>
              채널별 특별 할인을 등록합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>채널</Label>
              <Select value={formData.channelId} onValueChange={(value) => {
                setFormData({ ...formData, channelId: value });
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="채널 선택">
                    {formData.channelId && (() => {
                      const selectedChannel = channels.find(c => c.id === formData.channelId);
                      return selectedChannel ? (
                        <div className="flex items-center gap-2">
                          {selectedChannel.logoUrl ? (
                            <img
                              src={selectedChannel.logoUrl}
                              alt={selectedChannel.channelName}
                              className="h-5 w-5 rounded object-cover"
                            />
                          ) : (
                            <div
                              className="h-5 w-5 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground"
                            >
                              {selectedChannel.channelName.charAt(0)}
                            </div>
                          )}
                          <span>{selectedChannel.channelName}</span>
                        </div>
                      ) : null;
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {channels.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      <div className="flex items-center gap-2">
                        {channel.logoUrl ? (
                          <img
                            src={channel.logoUrl}
                            alt={channel.channelName}
                            className="h-5 w-5 rounded object-cover"
                          />
                        ) : (
                          <div
                            className="h-5 w-5 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground"
                          >
                            {channel.channelName.charAt(0)}
                          </div>
                        )}
                        <span>{channel.channelName}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>할인율 (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.discountRate || ""}
                onChange={(e) =>
                  setFormData({ ...formData, discountRate: Number(e.target.value) })
                }
                placeholder="0-100"
              />
            </div>

            <div className="space-y-2">
              <Label>판매가 (자동 계산)</Label>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <span className="line-through text-muted-foreground text-sm">
                  ₩{productPrice.toLocaleString()}
                </span>
                <span className="text-lg text-primary">
                  → ₩{calculatedPrice.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>시작일</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>종료일</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="border border-border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">활성화</Label>
                <Switch
                  checked={formData.visible}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, visible: checked })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleCreate}>추가</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 할인 수정 Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>채널별 할인 수정</DialogTitle>
            <DialogDescription>
              할인 정보를 수정합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>채널</Label>
              <Input
                value={channels.find(c => c.id === selectedDiscount?.channelId)?.channelName || selectedDiscount?.channelName || ""}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label>할인율 (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.discountRate || ""}
                onChange={(e) =>
                  setFormData({ ...formData, discountRate: Number(e.target.value) })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>판매가 (자동 계산)</Label>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <span className="line-through text-muted-foreground text-sm">
                  ₩{productPrice.toLocaleString()}
                </span>
                <span className="text-lg text-primary">
                  → ₩{calculatedPrice.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>시작일</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>종료일</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="border border-border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">활성화</Label>
                <Switch
                  checked={formData.visible}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, visible: checked })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleEdit}>수정</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>할인 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 할인을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}