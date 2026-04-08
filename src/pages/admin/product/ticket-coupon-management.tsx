import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  Plus,
  Package,
  CheckCircle2,
  XCircle,
  List,
  MoreVertical,
} from "lucide-react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Calendar } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CoachMark, useCoachMark, type TourStep } from "@/components/coach-mark";
import type {
  TicketCouponGroup,
  TicketCoupon,
  CouponStatus,
  CreateCouponGroupRequest,
} from "@/data/dto/ticket-coupon.dto";
import type { ProductOption, ProductOptionValue } from "@/data/dto/product.dto";
import {
  getCouponGroups,
  createCouponGroup,
  updateCouponGroup,
  deleteCouponGroup,
  updateCoupon,
  deleteCoupon,
  getGroupCoupons,
} from "@/lib/api/ticket-coupon";
import { getProductOptions } from "@/lib/api/product";

interface TicketCouponManagementProps {
  productId: string;
  options: ProductOption[];
}

// 옵션별 그룹 구조
interface OptionGroupStructure {
  option: ProductOption;
  optionValueGroups: {
    optionValue: ProductOptionValue;
    dateGroups: TicketCouponGroup[];
  }[];
}

export function TicketCouponManagement({ productId, options: propsOptions }: TicketCouponManagementProps) {
  const [groups, setGroups] = useState<TicketCouponGroup[]>([]);
  const [options, setOptions] = useState<ProductOption[]>(propsOptions || []);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedOptions, setExpandedOptions] = useState<Set<string>>(new Set());
  const [expandedOptionValues, setExpandedOptionValues] = useState<Set<string>>(new Set());
  const [expandedDateGroups, setExpandedDateGroups] = useState<Set<string>>(new Set());

  // 쿠폰 목록 모달
  const [isCouponListModalOpen, setIsCouponListModalOpen] = useState(false);
  const [selectedGroupForView, setSelectedGroupForView] = useState<TicketCouponGroup | null>(null);

  // 날짜 그룹 수정 다이얼로그
  const [isEditGroupDialogOpen, setIsEditGroupDialogOpen] = useState(false);
  const [selectedGroupForEdit, setSelectedGroupForEdit] = useState<TicketCouponGroup | null>(null);
  const [editGroupForm, setEditGroupForm] = useState({
    validFrom: "",
    validUntil: "",
  });

  // 날짜  삭제 확인
  const [isDeleteGroupDialogOpen, setIsDeleteGroupDialogOpen] = useState(false);
  const [selectedGroupForDelete, setSelectedGroupForDelete] = useState<TicketCouponGroup | null>(null);

  // 개별 쿠폰 추가 다이얼로그
  const [isAddCouponDialogOpen, setIsAddCouponDialogOpen] = useState(false);
  const [selectedGroupForAddCoupon, setSelectedGroupForAddCoupon] = useState<TicketCouponGroup | null>(null);
  const [addCouponForm, setAddCouponForm] = useState({
    prefix: "",
    startNum: "",
    endNum: "",
  });

  // 개별 쿠폰 수정 다이얼로그
  const [isEditCouponDialogOpen, setIsEditCouponDialogOpen] = useState(false);
  const [selectedCouponForEdit, setSelectedCouponForEdit] = useState<TicketCoupon | null>(null);
  const [editCouponForm, setEditCouponForm] = useState({
    couponNumber: "",
    status: "ACTIVE" as CouponStatus,
    validFrom: "",
    validUntil: "",
  });

  // 개별 쿠폰 삭제 확인
  const [isDeleteCouponDialogOpen, setIsDeleteCouponDialogOpen] = useState(false);
  const [selectedCouponForDelete, setSelectedCouponForDelete] = useState<TicketCoupon | null>(null);

  // 투어 가이드
  const tcTourSteps: TourStep[] = [
    { target: "tc-stats", title: "쿠폰 통계", description: "전체 쿠폰 수, 사용 가능한 쿠폰,\n사용 완료된 쿠폰 수를 한눈에 확인합니다.", placement: "bottom" },
    { target: "tc-options", title: "옵션별 쿠폰 그룹", description: "옵션값별로 쿠폰 그룹을 관리합니다.\n+ 버튼으로 새 쿠폰 그룹을 생성하세요.\n그룹을 클릭하면 쿠폰 목록을 확인할 수 있습니다.", placement: "bottom", waitForTarget: 500 },
    { target: "tc-create-form", title: "쿠폰 그룹 생성", description: "• 접두사: 쿠폰번호 앞 코드 (예: WINN)\n• 시작/끝 번호: 일괄 생성 범위\n• 유효기간: 쿠폰 사용 가능 기간\n번호 범위만큼 쿠폰이 자동 생성됩니다.", placement: "bottom", waitForTarget: 1500 },
  ];

  const { isActive: isTcTourActive, startTour: startTcTour, endTour: endTcTour } = useCoachMark("product_detail_coupons");

  useEffect(() => {
    const handler = () => startTcTour();
    window.addEventListener("startTabTour", handler);
    return () => window.removeEventListener("startTabTour", handler);
  }, [startTcTour]);

  const handleTcTourStep = (stepIndex: number, _step: TourStep) => {
    if (stepIndex === 2 && !isCreateDialogOpen) {
      setIsCreateDialogOpen(true);
    } else if (stepIndex < 2 && isCreateDialogOpen) {
      setIsCreateDialogOpen(false);
    }
  };

  // 쿠폰 생성 다이얼로그
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string>("");
  const [selectedOptionValueId, setSelectedOptionValueId] = useState<string>("");
  const [createForm, setCreateForm] = useState({
    prefix: "",
    startNum: "",
    endNum: "",
    validFrom: "",
    validUntil: "",
  });

  // 통계 계산
  const stats = groups.reduce(
    (acc, group) => {
      // ⭐ 서버가 제공하는 activeCount, usedCount 우선 사용
      const coupons = group.coupons || [];
      const totalCount = coupons.length > 0 ? coupons.length : (group.activeCount || 0) + (group.soldCount || 0) + (group.usedCount || 0);
      const activeCount = coupons.length > 0 
        ? coupons.filter(c => c.status === "ACTIVE").length 
        : (group.activeCount || 0);
      const usedCount = coupons.length > 0 
        ? coupons.filter(c => c.status === "USED").length 
        : (group.usedCount || 0);
      
      return {
        total: acc.total + totalCount,
        active: acc.active + activeCount,
        used: acc.used + usedCount,
      };
    },
    { total: 0, active: 0, used: 0 }
  );

  // 데이터 로드
  const loadData = async () => {
    setIsLoading(true);
    try {
      // 그룹만 조회 (옵션은 props로 받음)
      const groupsResponse = await getCouponGroups(productId);

      if (groupsResponse.success && groupsResponse.data) {
        setGroups(groupsResponse.data);
      }
    } catch (error) {
      console.error("데이터 로드 오류:", error);
      toast.error("데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [productId]);

  // props로 받은 옵션 업데이트
  useEffect(() => {
    setOptions(propsOptions || []);
  }, [propsOptions]);

  // ⭐ 쿠폰 목록 모달 열릴 때 API 호출
  useEffect(() => {
    if (isCouponListModalOpen && selectedGroupForView) {
      loadGroupCoupons(selectedGroupForView.id);
    }
  }, [isCouponListModalOpen, selectedGroupForView?.id]);

  // 그룹별 쿠폰 목록 API 호출
  const loadGroupCoupons = async (groupId: string) => {
    try {
      const response = await getGroupCoupons(groupId);
      if (response.success && response.data) {
        // selectedGroupForView 업데이트
        setSelectedGroupForView(prev => {
          if (!prev) return null;
          return {
            ...prev,
            coupons: response.data,
          };
        });
      }
    } catch (error) {
      console.error("쿠폰 목록 로드 오류:", error);
      toast.error("쿠폰 목록을 불러오는데 실패했습니다.");
    }
  };

  // 옵션별로 그룹 구조화
  const structuredData: OptionGroupStructure[] = options.map(option => {
    const optionValueGroups = option.values.map(optionValue => {
      // 해당 옵션값에 속한 그룹들 필터링
      const dateGroups = groups.filter(
        g => g.productOptionValueId === optionValue.id
      );
      return {
        optionValue,
        dateGroups,
      };
    });

    return {
      option,
      optionValueGroups,
    };
  });

  // 옵션 없는 그룹들 (기본 그룹)
  const defaultGroups = groups.filter(g => !g.productOptionId && !g.productOptionValueId);

  // 토글 함수들
  const toggleOption = (optionId: string) => {
    const newExpanded = new Set(expandedOptions);
    if (newExpanded.has(optionId)) {
      newExpanded.delete(optionId);
    } else {
      newExpanded.add(optionId);
    }
    setExpandedOptions(newExpanded);
  };

  const toggleOptionValue = (key: string) => {
    const newExpanded = new Set(expandedOptionValues);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedOptionValues(newExpanded);
  };

  const toggleDateGroup = (groupId: string) => {
    const newExpanded = new Set(expandedDateGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedDateGroups(newExpanded);
  };

  // 쿠폰 생성
  const handleCreateGroup = async () => {
    if (!createForm.prefix || !createForm.startNum || !createForm.endNum) {
      toast.error("프리픽스와 번호 범위를 입력해주세요.");
      return;
    }
    if (!createForm.validFrom || !createForm.validUntil) {
      toast.error("유효기간을 설정해주세요.");
      return;
    }

    try {
      // 종료번호 길이에 맞춰 시작번호 패딩
      const endLength = createForm.endNum.length;
      const paddedStart = createForm.startNum.padStart(endLength, '0');
      
      const request: CreateCouponGroupRequest = {
        productId,
        productOptionId: selectedOptionId || undefined,
        productOptionValueId: selectedOptionValueId || undefined,
        startNumber: createForm.prefix + paddedStart,
        endNumber: createForm.prefix + createForm.endNum,
        validFrom: createForm.validFrom,
        validUntil: createForm.validUntil,
      };

      const response = await createCouponGroup(request);
      if (response.success) {
        toast.success("쿠폰 그룹이 생성되었습니다.");
        setIsCreateDialogOpen(false);
        resetCreateForm();
        loadData();
      } else {
        toast.error(response.message || "쿠폰 그룹 생성에 실패했습니다.");
      }
    } catch (error) {
      console.error("쿠폰 그룹 생성 오류:", error);
      toast.error("쿠폰 그룹 생성 중 오류가 발생했습니다.");
    }
  };

  const resetCreateForm = () => {
    setSelectedOptionId("");
    setSelectedOptionValueId("");
    setCreateForm({
      prefix: "",
      startNum: "",
      endNum: "",
      validFrom: "",
      validUntil: "",
    });
  };

  // 날짜 그룹 수정
  const handleEditGroup = async () => {
    if (!selectedGroupForEdit) return;
    if (!editGroupForm.validFrom || !editGroupForm.validUntil) {
      toast.error("유효기간을 설정해주세요.");
      return;
    }

    try {
      const response = await updateCouponGroup(
        selectedGroupForEdit.id,
        editGroupForm.validFrom,
        editGroupForm.validUntil
      );

      if (response.success) {
        toast.success("날짜 그룹이 수정되었습니다.");
        setIsEditGroupDialogOpen(false);
        setSelectedGroupForEdit(null);
        loadData();
      } else {
        toast.error(response.message || "날짜 그룹 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("날짜 그룹 수정 오류:", error);
      toast.error("날짜 그룹 수정 중 오류가 발생했습니다.");
    }
  };

  // 날짜 그룹 삭제
  const handleDeleteGroup = async () => {
    if (!selectedGroupForDelete) return;

    try {
      const response = await deleteCouponGroup(selectedGroupForDelete.id);

      if (response.success) {
        toast.success("날짜 그룹이 삭제되었습니다.");
        setIsDeleteGroupDialogOpen(false);
        setSelectedGroupForDelete(null);
        loadData();
      } else {
        toast.error(response.message || "날짜 그룹 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("날짜 그룹 삭제 오류:", error);
      toast.error("날짜 그룹 삭제 중 오류가 발생했습니다.");
    }
  };

  // 개별 쿠폰 추가
  const handleAddCoupon = async () => {
    if (!selectedGroupForAddCoupon) return;
    if (!addCouponForm.prefix || !addCouponForm.startNum || !addCouponForm.endNum) {
      toast.error("프리픽스와 번호 범위를 입력해주세요.");
      return;
    }

    try {
      // 종료번호 길이에 맞춰 시작번호 패딩
      const endLength = addCouponForm.endNum.length;
      const paddedStart = addCouponForm.startNum.padStart(endLength, '0');
      
      const request: CreateCouponGroupRequest = {
        productId,
        productOptionId: selectedGroupForAddCoupon.productOptionId,
        productOptionValueId: selectedGroupForAddCoupon.productOptionValueId,
        startNumber: addCouponForm.prefix + paddedStart,
        endNumber: addCouponForm.prefix + addCouponForm.endNum,
        validFrom: selectedGroupForAddCoupon.validFrom,
        validUntil: selectedGroupForAddCoupon.validUntil,
      };

      const response = await createCouponGroup(request);
      if (response.success) {
        toast.success("쿠폰이 추가되었습니다.");
        setIsAddCouponDialogOpen(false);
        setSelectedGroupForAddCoupon(null);
        setAddCouponForm({ prefix: "", startNum: "", endNum: "" });
        loadData();
      } else {
        toast.error(response.message || "쿠폰 추가에 실패했습니다.");
      }
    } catch (error) {
      console.error("쿠폰 추가 오류:", error);
      toast.error("쿠폰 추가 중 오류가 발생했습니다.");
    }
  };

  // 개별 쿠폰 수정
  const handleEditCoupon = async () => {
    if (!selectedCouponForEdit) return;
    if (!editCouponForm.couponNumber || !editCouponForm.validFrom || !editCouponForm.validUntil) {
      toast.error("필수 정보를 입력해주세요.");
      return;
    }

    try {
      const response = await updateCoupon(
        selectedCouponForEdit.id,
        {
          couponNumber: editCouponForm.couponNumber,
          status: editCouponForm.status,
          validFrom: editCouponForm.validFrom,
          validUntil: editCouponForm.validUntil,
        }
      );

      if (response.success) {
        toast.success("쿠폰이 수정되었습니다.");
        setIsEditCouponDialogOpen(false);
        setSelectedCouponForEdit(null);
        
        // ⭐ 모달 열려있으면 쿠폰 목록 다시 로드
        if (isCouponListModalOpen && selectedGroupForView) {
          await loadGroupCoupons(selectedGroupForView.id);
        }
        
        loadData();
      } else {
        toast.error(response.message || "쿠폰 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("쿠폰 수정 오류:", error);
      toast.error("쿠폰 수정 중 오류가 발생했습니다.");
    }
  };

  // 개별 쿠폰 삭제
  const handleDeleteCoupon = async () => {
    if (!selectedCouponForDelete) return;

    try {
      const response = await deleteCoupon(selectedCouponForDelete.id);

      if (response.success) {
        toast.success("쿠폰이 삭제되었습니다.");
        setIsDeleteCouponDialogOpen(false);
        setSelectedCouponForDelete(null);
        
        // ⭐ 모달 열려있으면 쿠폰 목록 다시 로드
        if (isCouponListModalOpen && selectedGroupForView) {
          await loadGroupCoupons(selectedGroupForView.id);
        }
        
        loadData();
      } else {
        toast.error(response.message || "쿠폰 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("쿠폰 삭제 오류:", error);
      toast.error("쿠폰 삭제 중 오류가 발생했습니다.");
    }
  };

  // 상태 배지
  const getStatusBadge = (status: CouponStatus) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            사용가능
          </Badge>
        );
      case "SOLD":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            판매됨
          </Badge>
        );
      case "USED":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            사용완료
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // 선택된 옵션의 값들
  const selectedOptionValues = selectedOptionId
    ? options.find(opt => opt.id === selectedOptionId)?.values || []
    : [];

  return (
    <div className="space-y-4">
      {/* 제목 */}
      <h3 className="font-medium text-[18px]">티켓 쿠폰 관리</h3>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4" data-tour="tc-stats">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 mb-1">등록</p>
              <p className="text-2xl font-semibold text-blue-700">{stats.total}</p>
            </div>
            <Package className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 mb-1">사용가능</p>
              <p className="text-2xl font-semibold text-green-700">{stats.active}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">사용완료</p>
              <p className="text-2xl font-semibold text-gray-700">{stats.used}</p>
            </div>
            <XCircle className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* 검색 & 액션 */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Input
            placeholder="쿠폰번호, 메모 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
      </div>

      {/* 그룹 목록 */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          불러오는 중...
        </div>
      ) : options.length === 0 ? (
        // ⭐ 옵션이 없을 때 안내 메시지
        <div className="border rounded-lg p-8 text-center bg-muted/10">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-orange-50 flex items-center justify-center">
              <Package className="h-8 w-8 text-orange-500" />
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-lg">옵션을 먼저 생성해주세요</h4>
              <p className="text-sm text-muted-foreground max-w-md">
                티켓을 관리하려면 먼저 상품 옵션을 생성해야 합니다.<br />
                '옵션 관리' 탭으로 이동하여 옵션을 추가해주세요.
              </p>
            </div>
            <Button
              variant="default"
              onClick={() => {
                // 옵션 관리 탭으로 이동 (부모 컴포넌트에서 처리하도록 이벤트 발생)
                const event = new CustomEvent('navigateToOptions');
                window.dispatchEvent(event);
              }}
            >
              옵션 관리로 이동
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3" data-tour="tc-options">
          {/* 기본 그룹 (옵션 없음) */}
          {defaultGroups.length > 0 && (
            <div className="border rounded-lg">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30"
                onClick={() => toggleOption("default")}
              >
                <div className="flex items-center gap-3 flex-1">
                  <button className="text-muted-foreground">
                    {expandedOptions.has("default") ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </button>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">기본</span>
                  </div>
                </div>
              </div>

              {expandedOptions.has("default") && (
                <div className="border-t">
                  {defaultGroups.map(group => renderDateGroup(group, "default"))}
                </div>
              )}
            </div>
          )}

          {/* 옵션별 그룹 */}
          {structuredData.map(({ option, optionValueGroups }) => {
            const isOptionExpanded = expandedOptions.has(option.id);
            const totalCoupons = optionValueGroups.reduce(
              (sum, ovg) => sum + ovg.dateGroups.reduce((s, g) => s + (g.coupons?.length || 0), 0),
              0
            );

            return (
              <div key={option.id} className="border rounded-lg">
                {/* 옵션 레벨 */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30"
                  onClick={() => toggleOption(option.id)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <button className="text-muted-foreground">
                      {isOptionExpanded ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                    </button>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{option.name}</span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    총 {totalCoupons}개
                  </div>
                </div>

                {/* 옵션값 레벨 */}
                {isOptionExpanded && (
                  <div className="border-t">
                    {optionValueGroups.map(({ optionValue, dateGroups }) => {
                      const ovKey = `${option.id}-${optionValue.id}`;
                      const isOVExpanded = expandedOptionValues.has(ovKey);
                      
                      // ⭐ 서버가 제공하는 activeCount, usedCount 사용
                      const ovTotalCoupons = dateGroups.reduce((sum, g) => {
                        const coupons = g.coupons || [];
                        return sum + (coupons.length > 0 ? coupons.length : (g.activeCount || 0) + (g.usedCount || 0));
                      }, 0);
                      const ovActiveCoupons = dateGroups.reduce((sum, g) => {
                        const coupons = g.coupons || [];
                        return sum + (coupons.length > 0 
                          ? coupons.filter(c => c.status === "ACTIVE").length 
                          : (g.activeCount || 0));
                      }, 0);
                      const ovUsedCoupons = dateGroups.reduce((sum, g) => {
                        const coupons = g.coupons || [];
                        return sum + (coupons.length > 0 
                          ? coupons.filter(c => c.status === "USED").length 
                          : (g.usedCount || 0));
                      }, 0);
                      const ovUsageRate = ovTotalCoupons > 0 ? Math.round((ovUsedCoupons / ovTotalCoupons) * 100) : 0;

                      return (
                        <div key={ovKey} className="border-t bg-muted/10">
                          <div
                            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30"
                            onClick={() => toggleOptionValue(ovKey)}
                          >
                            <div className="flex items-center gap-3">
                              <button className="text-muted-foreground ml-8">
                                {isOVExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </button>
                              <span className="font-medium">{optionValue.value}</span>
                              <span className="text-sm text-muted-foreground">
                                티켓 {ovTotalCoupons}개
                              </span>
                            </div>

                            <div className="flex items-center gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">사용가능 </span>
                                <span className="font-medium text-green-600">{ovActiveCoupons}개</span>
                              </div>
                              <div className="min-w-[60px] text-right">
                                <span className="font-medium">{ovUsageRate}%</span>
                              </div>
                              <div className="text-muted-foreground">사용률</div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedOptionId(option.id);
                                  setSelectedOptionValueId(optionValue.id);
                                  setIsCreateDialogOpen(true);
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* 날짜 그룹들 */}
                          {isOVExpanded && (
                            <div>
                              {dateGroups.map(group => renderDateGroup(group, ovKey))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 쿠폰 생성 다이얼로그 */}
      <Dialog open={isCreateDialogOpen} modal={!isTcTourActive} onOpenChange={(open) => { if (isTcTourActive && !open) return; setIsCreateDialogOpen(open); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>쿠폰 그룹 생성</DialogTitle>
            <DialogDescription>
              선사입형 티켓 쿠폰을 번호 범위로 일괄 생성합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 옵션 정보 (읽기 전용) */}
            {(selectedOptionId || selectedOptionValueId) && (
              <div className="bg-muted/30 border rounded-lg p-4 space-y-2">
                <Label className="text-muted-foreground">연결된 옵션</Label>
                {selectedOptionId && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {options.find(opt => opt.id === selectedOptionId)?.name || "옵션"}
                    </Badge>
                    {selectedOptionValueId && (
                      <>
                        <span className="text-muted-foreground">/</span>
                        <Badge variant="outline">
                          {selectedOptionValues.find(val => val.id === selectedOptionValueId)?.value || "옵션값"}
                        </Badge>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 쿠폰 번호 범위 */}
            <div className="space-y-3" data-tour="tc-create-form">
              <div className="space-y-2">
                <Label>티켓 앞글자 *</Label>
                <Input
                  value={createForm.prefix}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, prefix: e.target.value.toUpperCase() })}
                  placeholder="예: S (쿠폰번호 앞에 붙는 영문자)"
                  className="uppercase"
                />
                <p className="text-xs text-muted-foreground">
                  쿠폰번호 앞에 붙는 영문자입니다. 예: S20260001의 'S'
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>시작 번호 *</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={createForm.startNum || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ''); // 숫자만 허용
                      setCreateForm({ ...createForm, startNum: value });
                    }}
                    placeholder="예: 20260001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>종료 번호 *</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={createForm.endNum || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ''); // 숫자만 허용
                      // 종료번호가 변경되면 시작번호를 종료번호 길이에 맞춰 패딩
                      const paddedStartNum = createForm.startNum 
                        ? createForm.startNum.padStart(value.length, '0')
                        : '';
                      setCreateForm({ 
                        ...createForm, 
                        endNum: value,
                        startNum: paddedStartNum
                      });
                    }}
                    placeholder="예: 20261000"
                  />
                </div>
              </div>
              {createForm.prefix && createForm.startNum && createForm.endNum && (() => {
                // 종료번호 길이에 맞춰 시작번호 패딩
                const endLength = createForm.endNum.length;
                const paddedStart = createForm.startNum.padStart(endLength, '0');
                
                return (
                  <div className="text-sm text-muted-foreground bg-blue-50 border border-blue-200 rounded p-3">
                    <span className="font-medium">생성 범위: </span>
                    <code className="bg-white px-2 py-0.5 rounded">{createForm.prefix}{paddedStart}</code>
                    <span> ~ </span>
                    <code className="bg-white px-2 py-0.5 rounded">{createForm.prefix}{createForm.endNum}</code>
                  </div>
                );
              })()}
            </div>

            {/* 유효기간 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>유효 시작일 *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="mr-2 h-4 w-4" />
                      {createForm.validFrom ? (
                        new Date(createForm.validFrom + "T00:00:00").toLocaleDateString("ko-KR")
                      ) : (
                        <span>날짜 선택</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={
                        createForm.validFrom
                          ? new Date(createForm.validFrom + "T00:00:00")
                          : undefined
                      }
                      onSelect={(date) => {
                        if (date) {
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, "0");
                          const day = String(date.getDate()).padStart(2, "0");
                          setCreateForm({
                            ...createForm,
                            validFrom: `${year}-${month}-${day}`,
                          });
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>유효 종료일 *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="mr-2 h-4 w-4" />
                      {createForm.validUntil ? (
                        new Date(createForm.validUntil + "T00:00:00").toLocaleDateString("ko-KR")
                      ) : (
                        <span>날짜 선택</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={
                        createForm.validUntil
                          ? new Date(createForm.validUntil + "T00:00:00")
                          : undefined
                      }
                      onSelect={(date) => {
                        if (date) {
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, "0");
                          const day = String(date.getDate()).padStart(2, "0");
                          setCreateForm({
                            ...createForm,
                            validUntil: `${year}-${month}-${day}`,
                          });
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                resetCreateForm();
              }}
            >
              취소
            </Button>
            <Button onClick={handleCreateGroup}>생성</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 쿠폰 목록 모달 */}
      <Dialog open={isCouponListModalOpen} onOpenChange={setIsCouponListModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>쿠폰 목록</DialogTitle>
            <DialogDescription>
              {selectedGroupForView && (
                <>
                  유효기간: {selectedGroupForView.validFrom} ~ {selectedGroupForView.validUntil}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            {selectedGroupForView && (
              <table className="w-full">
                <thead className="sticky top-0 border-y bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground bg-muted/50">
                      #
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground bg-muted/50">
                      쿠폰번호
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground bg-muted/50">
                      상태
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground bg-muted/50">
                      생성일
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground bg-muted/50">
                      사용일
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground bg-muted/50">
                      메모
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground bg-muted/50">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(selectedGroupForView.coupons || []).map((coupon, index) => (
                    <tr key={coupon.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-sm">{coupon.couponNumber}</code>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(coupon.status)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {coupon.createdAt ? new Date(coupon.createdAt).toLocaleDateString("ko-KR") : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {coupon.usedAt
                          ? new Date(coupon.usedAt).toLocaleDateString("ko-KR")
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        -
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCouponForEdit(coupon);
                              setEditCouponForm({
                                couponNumber: coupon.couponNumber,
                                status: coupon.status,
                                validFrom: coupon.validFrom,
                                validUntil: coupon.validUntil,
                              });
                              setIsEditCouponDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCouponForDelete(coupon);
                              setIsDeleteCouponDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCouponListModalOpen(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 날짜 그룹 수정 다이얼로그 */}
      <Dialog open={isEditGroupDialogOpen} onOpenChange={setIsEditGroupDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>날짜 그룹 수정</DialogTitle>
            <DialogDescription>
              이 그룹에 속한 모든 쿠폰의 유효기간이 변경됩니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>유효 시작일 *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="mr-2 h-4 w-4" />
                      {editGroupForm.validFrom ? (
                        new Date(editGroupForm.validFrom + "T00:00:00").toLocaleDateString("ko-KR")
                      ) : (
                        <span>날짜 선택</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={
                        editGroupForm.validFrom
                          ? new Date(editGroupForm.validFrom + "T00:00:00")
                          : undefined
                      }
                      onSelect={(date) => {
                        if (date) {
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, "0");
                          const day = String(date.getDate()).padStart(2, "0");
                          setEditGroupForm({
                            ...editGroupForm,
                            validFrom: `${year}-${month}-${day}`,
                          });
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>유효 종료일 *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="mr-2 h-4 w-4" />
                      {editGroupForm.validUntil ? (
                        new Date(editGroupForm.validUntil + "T00:00:00").toLocaleDateString("ko-KR")
                      ) : (
                        <span>날짜 선택</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={
                        editGroupForm.validUntil
                          ? new Date(editGroupForm.validUntil + "T00:00:00")
                          : undefined
                      }
                      onSelect={(date) => {
                        if (date) {
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, "0");
                          const day = String(date.getDate()).padStart(2, "0");
                          setEditGroupForm({
                            ...editGroupForm,
                            validUntil: `${year}-${month}-${day}`,
                          });
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditGroupDialogOpen(false);
                setSelectedGroupForEdit(null);
              }}
            >
              취소
            </Button>
            <Button onClick={handleEditGroup}>수정</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 날짜 그룹 삭제 확인 다이얼로그 */}
      <Dialog open={isDeleteGroupDialogOpen} onOpenChange={setIsDeleteGroupDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>날짜 그룹 삭제</DialogTitle>
            <DialogDescription>
              정말 이 날짜 그룹을 삭제하시겠습니까?
            </DialogDescription>
          </DialogHeader>

          {selectedGroupForDelete && (
            <div className="bg-muted/30 border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">유효기간</span>
                <span className="font-medium">
                  {selectedGroupForDelete.validFrom} ~ {selectedGroupForDelete.validUntil}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">쿠폰 수</span>
                <span className="font-medium">{selectedGroupForDelete.coupons?.length || 0}개</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteGroupDialogOpen(false);
                setSelectedGroupForDelete(null);
              }}
            >
              취소
            </Button>
            <Button variant="destructive" onClick={handleDeleteGroup}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 개별 쿠폰 추가 다이얼로그 */}
      <Dialog open={isAddCouponDialogOpen} onOpenChange={setIsAddCouponDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>쿠폰 추가</DialogTitle>
            <DialogDescription>
              {selectedGroupForAddCoupon && (
                <>
                  유효기간: {selectedGroupForAddCoupon.validFrom} ~{" "}
                  {selectedGroupForAddCoupon.validUntil}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label>티켓 앞글자 *</Label>
              <Input
                value={addCouponForm.prefix}
                onChange={(e) =>
                  setAddCouponForm({ ...addCouponForm, prefix: e.target.value.toUpperCase() })
                }
                placeholder="예: S (쿠폰번호 앞에 붙는 영문자)"
                className="uppercase"
              />
              <p className="text-xs text-muted-foreground">
                쿠폰번호 앞에 붙는 영문자입니다. 예: S20260001의 'S'
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>시작 번호 *</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={addCouponForm.startNum || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ''); // 숫자만 허용
                    setAddCouponForm({ ...addCouponForm, startNum: value });
                  }}
                  placeholder="예: 20260001"
                />
              </div>
              <div className="space-y-2">
                <Label>종료 번호 *</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={addCouponForm.endNum || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ''); // 숫자만 허용
                    // 종료번호가 변경되면 시작번호를 종료번호 길이에 맞춰 패딩
                    const paddedStartNum = addCouponForm.startNum 
                      ? addCouponForm.startNum.padStart(value.length, '0')
                      : '';
                    setAddCouponForm({ 
                      ...addCouponForm, 
                      endNum: value,
                      startNum: paddedStartNum
                    });
                  }}
                  placeholder="예: 20261000"
                />
              </div>
            </div>
            {addCouponForm.prefix && addCouponForm.startNum && addCouponForm.endNum && (() => {
              // 종료번호 길이에 맞춰 시작번호 패딩
              const endLength = addCouponForm.endNum.length;
              const paddedStart = addCouponForm.startNum.padStart(endLength, '0');
              
              return (
                <div className="text-sm text-muted-foreground bg-blue-50 border border-blue-200 rounded p-3">
                  <span className="font-medium">생성 범위: </span>
                  <code className="bg-white px-2 py-0.5 rounded">
                    {addCouponForm.prefix}
                    {paddedStart}
                  </code>
                  <span> ~ </span>
                  <code className="bg-white px-2 py-0.5 rounded">
                    {addCouponForm.prefix}
                    {addCouponForm.endNum}
                  </code>
                </div>
              );
            })()}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddCouponDialogOpen(false);
                setSelectedGroupForAddCoupon(null);
                setAddCouponForm({ prefix: "", startNum: "", endNum: "" });
              }}
            >
              취소
            </Button>
            <Button onClick={handleAddCoupon}>추가</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 개별 쿠폰 수정 다이얼로그 */}
      <Dialog open={isEditCouponDialogOpen} onOpenChange={setIsEditCouponDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>쿠폰 수정</DialogTitle>
            <DialogDescription>
              쿠폰의 정보를 수정합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label>쿠폰번호 *</Label>
              <Input
                value={editCouponForm.couponNumber}
                onChange={(e) =>
                  setEditCouponForm({ ...editCouponForm, couponNumber: e.target.value })
                }
                placeholder="예: S20260001"
              />
            </div>
            <div className="space-y-2">
              <Label>상태 *</Label>
              <Select
                value={editCouponForm.status}
                onValueChange={(value) => setEditCouponForm({ ...editCouponForm, status: value as CouponStatus })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="상태 선택">
                    {getStatusBadge(editCouponForm.status)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">사용가능</SelectItem>
                  <SelectItem value="SOLD">판매됨</SelectItem>
                  <SelectItem value="USED">사용완료</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditCouponDialogOpen(false);
                setSelectedCouponForEdit(null);
              }}
            >
              취소
            </Button>
            <Button onClick={handleEditCoupon}>수정</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 개별 쿠폰 삭제 확인 다이얼로그 */}
      <Dialog open={isDeleteCouponDialogOpen} onOpenChange={setIsDeleteCouponDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>쿠폰 삭제</DialogTitle>
            <DialogDescription>
              정말 이 쿠폰을 삭제하시겠습니까?
            </DialogDescription>
          </DialogHeader>

          {selectedCouponForDelete && (
            <div className="bg-muted/30 border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">쿠폰번호</span>
                <span className="font-medium">
                  {selectedCouponForDelete.couponNumber}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">상태</span>
                <span className="font-medium">
                  {getStatusBadge(selectedCouponForDelete.status)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">유효기간</span>
                <span className="font-medium">
                  {selectedCouponForDelete.validFrom} ~ {selectedCouponForDelete.validUntil}
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteCouponDialogOpen(false);
                setSelectedCouponForDelete(null);
              }}
            >
              취소
            </Button>
            <Button variant="destructive" onClick={handleDeleteCoupon}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CoachMark steps={tcTourSteps} isActive={isTcTourActive} onFinish={() => { setIsCreateDialogOpen(false); endTcTour(); }} storageKey="product_detail_coupons" onStepChange={handleTcTourStep} />
    </div>
  );

  // 날짜 그룹 렌더링 함수
  function renderDateGroup(group: TicketCouponGroup, parentKey: string) {
    // ⭐ 서버가 제공하는 activeCount, usedCount 우선 사용
    const coupons = group.coupons || [];
    const totalCount = coupons.length > 0 ? coupons.length : (group.activeCount || 0) + (group.usedCount || 0);
    const activeCount = coupons.length > 0 
      ? coupons.filter(c => c.status === "ACTIVE").length 
      : (group.activeCount || 0);
    const usedCount = coupons.length > 0 
      ? coupons.filter(c => c.status === "USED").length 
      : (group.usedCount || 0);
    const usageRate = totalCount > 0 ? Math.round((usedCount / totalCount) * 100) : 0;

    return (
      <div key={group.id} className="bg-muted/20 border-t">
        <div className="flex items-center justify-between px-4 py-3">
          <div 
            className="flex items-center gap-3 ml-12 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => {
              setSelectedGroupForView(group);
              setIsCouponListModalOpen(true);
            }}
          >
            <span className="text-sm font-medium">
              {group.validFrom} ~ {group.validUntil}
            </span>
            <span className="text-sm text-muted-foreground">
              티켓 {totalCount}개
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">사용가능 </span>
              <span className="font-medium text-green-600">{activeCount}개</span>
            </div>
            <div className="min-w-[60px] text-right">
              <span className="font-medium">{usageRate}%</span>
            </div>
            <div className="text-muted-foreground">사용률</div>
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedGroupForView(group);
                      setIsCouponListModalOpen(true);
                    }}
                  >
                    <List className="h-4 w-4 mr-2 text-blue-600" />
                    쿠폰 보기
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedGroupForAddCoupon(group);
                      setIsAddCouponDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2 text-green-600" />
                    쿠폰 추가
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedGroupForEdit(group);
                      setEditGroupForm({
                        validFrom: group.validFrom,
                        validUntil: group.validUntil,
                      });
                      setIsEditGroupDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2 text-orange-600" />
                    날짜 수정
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedGroupForDelete(group);
                      setIsDeleteGroupDialogOpen(true);
                    }}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    그룹 삭제
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    );
  }
}