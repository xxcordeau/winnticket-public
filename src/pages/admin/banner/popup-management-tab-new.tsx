import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Calendar,
  Upload,
  X,
  Search,
  MoreVertical,
  Edit,
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { authStore } from "@/data/auth";
import { getChannels as getChannelsLocal } from "@/data/channels"; // 로컬 폴백
import * as ChannelAPI from "@/lib/api/channel"; // ⭐ 새 API 사용
import { toast } from "sonner";
import { TablePagination } from "@/components/common/table-pagination";
import { uploadFile } from "@/lib/api/file";

// 새 API 임포트
import {
  getPopups,
  createPopup,
  updatePopup,
  deletePopup,
  togglePopupVisible,
} from "@/lib/api/popup";
import type {
  PopupResponse,
  PopupCreateRequest,
  PopupUpdateRequest,
  PopupPosition,
  PopupType,
  PopupShowCondition,
} from "@/data/dto/popup.dto";

interface Channel {
  code: string;
  name: string;
  logoUrl?: string; // ⭐ 채널 로고 URL 추가
}

// formData를 위한 인터페이스 (DTO와 맞춤)
interface PopupFormData {
  name: string;
  description?: string;
  type: PopupType;
  position: PopupPosition;
  imageUrl?: string;
  imageUrlMobile?: string;
  htmlContent?: string;
  iframeUrl?: string;
  linkUrl?: string;
  linkTarget?: string;
  startDate: string;
  endDate?: string;
  visible: boolean;
  displayOrder: number;
  showCondition: PopupShowCondition;
  showDelay: number;
  width?: number;
  height?: number;
  mobileWidth?: number;
  mobileHeight?: number;
  showCloseButton: boolean;
  showTodayCloseButton: boolean;
  backgroundOverlay: boolean;
  overlayOpacity?: number;
  channelCodes: string[];
  pagePaths: string[];
}

export function PopupManagementTab() {
  const [popups, setPopups] = useState<PopupResponse[]>([]);
  const [filteredPopups, setFilteredPopups] = useState<PopupResponse[]>([]);
  const [selectedPopup, setSelectedPopup] = useState<PopupResponse | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 날짜 필터 상태
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const [formData, setFormData] = useState<PopupFormData>({
    name: "",
    description: "",
    type: "IMAGE",
    imageUrl: "",
    linkUrl: "",
    linkTarget: "_self",
    width: 500,
    height: 700,
    position: "CENTER",
    displayOrder: 1,
    visible: true,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    showCondition: "ALWAYS",
    showDelay: 0,
    showCloseButton: true,
    showTodayCloseButton: true,
    backgroundOverlay: true,
    overlayOpacity: 0.5,
    channelCodes: [],
    pagePaths: ["/home"],
  });

  const pageSize = 20;

  const canView = authStore.hasPermission("banners", "view");
  const canCreate = authStore.hasPermission("banners", "create");
  const canEdit = authStore.hasPermission("banners", "edit");
  const canDelete = authStore.hasPermission("banners", "delete");

  useEffect(() => {
    if (canView) {
      loadPopups();
    }
  }, [canView, currentPage]);

  useEffect(() => {
    filterPopups();
  }, [popups, searchTerm, startDate, endDate]);

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      console.log('[팝업관리] 채널 목록 조회 시작...');
      const response = await ChannelAPI.getChannels();
      
      if (response.success && response.data) {
        console.log('[팝업관리] 채널 API 응답:', response.data);
        
        // ⭐ API가 직접 배열을 반환 (ChannelListItem[])
        const channelList = response.data.map((ch) => ({
          code: ch.code,
          name: ch.name,
          logoUrl: ch.logoUrl, // ⭐ 채널 로고 URL 추가
        }));
        
        console.log('[팝업관리] 채널 목록 로드 완료:', channelList);
        setChannels(channelList);
        return;
      }
      
      // API 실패 시 로컬 폴백
      console.log('[팝업관리] API 실패, 로컬 데이터 사용');
      const localResponse = getChannelsLocal();
      if (localResponse.success && localResponse.data) {
        const channelList = localResponse.data.content.map((ch) => ({
          code: ch.channelCode,
          name: ch.channelName,
        }));
        setChannels(channelList);
      }
    } catch (error) {
      console.error('[팝업관리] 채널 로드 오류:', error);
      // 오류 시 로컬 폴백
      const localResponse = getChannelsLocal();
      if (localResponse.success && localResponse.data) {
        const channelList = localResponse.data.content.map((ch) => ({
          code: ch.channelCode,
          name: ch.channelName,
        }));
        setChannels(channelList);
      }
    }
  };

  const loadPopups = async () => {
    setLoading(true);
    try {
      const response = await getPopups(); // 쿼리 파라미터 제거
      if (response.success && response.data) {
        setPopups(response.data.content);
        setTotalPages(Math.ceil(response.data.content.length / pageSize));
      } else {
        toast.error(response.message || "팝업 목록을 불러오는데 실패했습니다");
      }
    } catch (error) {
      console.error("팝업 로드 오류:", error);
      toast.error("팝업 목록을 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const filterPopups = () => {
    let filtered = [...popups];
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((popup) =>
        popup.name.toLowerCase().includes(searchLower) ||
        (popup.description && popup.description.toLowerCase().includes(searchLower))
      );
    }
    if (startDate) {
      filtered = filtered.filter((popup) => new Date(popup.startDate) >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter((popup) => {
        if (!popup.endDate) return true;
        return new Date(popup.endDate) <= endDate;
      });
    }
    setFilteredPopups(filtered);
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.imageUrl) {
      toast.error("필수 항목을 입력해주세요");
      return;
    }

    setLoading(true);
    try {
      const response = await createPopup(formData);
      if (response.success) {
        toast.success(response.message || "팝업이 생성었습니다");
        setIsCreateDialogOpen(false);
        resetForm();
        loadPopups();
        window.dispatchEvent(new Event("popupUpdated"));
      } else {
        toast.error(response.message || "팝업 생성에 실패했습니다");
      }
    } catch (error) {
      console.error("팝업 생성 오류:", error);
      toast.error("팝업 생성 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedPopup) return;
    if (!formData.name || !formData.imageUrl) {
      toast.error("필수 항목을 입력해주세요");
      return;
    }

    setLoading(true);
    try {
      const updateData: PopupUpdateRequest = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        imageUrl: formData.imageUrl,
        imageUrlMobile: formData.imageUrlMobile,
        htmlContent: formData.htmlContent,
        iframeUrl: formData.iframeUrl,
        linkUrl: formData.linkUrl,
        linkTarget: formData.linkTarget,
        width: formData.width,
        height: formData.height,
        mobileWidth: formData.mobileWidth,
        mobileHeight: formData.mobileHeight,
        position: formData.position,
        displayOrder: formData.displayOrder,
        visible: formData.visible,
        startDate: formData.startDate,
        endDate: formData.endDate,
        showCondition: formData.showCondition,
        showDelay: formData.showDelay,
        showCloseButton: formData.showCloseButton,
        showTodayCloseButton: formData.showTodayCloseButton,
        backgroundOverlay: formData.backgroundOverlay,
        overlayOpacity: formData.overlayOpacity,
        channelCodes: formData.channelCodes,
        pagePaths: formData.pagePaths,
      };

      const response = await updatePopup(selectedPopup.id, updateData);
      if (response.success) {
        toast.success(response.message || "팝업이 수정되었습니다");
        setIsEditDialogOpen(false);
        setSelectedPopup(null);
        resetForm();
        loadPopups();
        window.dispatchEvent(new Event("popupUpdated"));
      } else {
        toast.error(response.message || "팝업 수정에 실패했습니다");
      }
    } catch (error) {
      console.error("팝업 수정 오류:", error);
      toast.error("팝업 수정 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPopup) return;

    setLoading(true);
    try {
      const response = await deletePopup(selectedPopup.id);
      if (response.success) {
        toast.success(response.message || "팝업이 삭제되었습니다");
        setIsDeleteDialogOpen(false);
        setSelectedPopup(null);
        loadPopups();
        window.dispatchEvent(new Event("popupUpdated"));
      } else {
        toast.error(response.message || "팝업 삭제에 실패했습니다");
      }
    } catch (error) {
      console.error("팝업 삭제 오류:", error);
      toast.error("팝업 삭제 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisible = async (popup: PopupResponse) => {
    try {
      const response = await togglePopupVisible(popup.id, !popup.visible);
      if (response.success) {
        toast.success(response.message || "팝업 노출 여부가 변경되었습니다");
        loadPopups();
        window.dispatchEvent(new Event("popupUpdated"));
      } else {
        toast.error(response.message || "노출 여부 변경에 실패했습니다");
      }
    } catch (error) {
      console.error("노출 여부 변경 오류:", error);
      toast.error("노출 여��� 변경 중 오류가 발생했습니다");
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("이미지 일만 업로드 가능합니다.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("파일 크기는 5MB 이하여야 합니다.");
      return;
    }

    setUploading(true);
    try {
      const response = await uploadFile(file);
      if (response.success && response.data) {
        // response.data는 FileUploadResponse 객체이므로 fileUrl 추출
        setFormData({ ...formData, imageUrl: response.data.fileUrl });
        toast.success(response.message || "이미지가 업로드되었습니다");
      } else {
        toast.error(response.message || "이미지 업로드에 실패했습니다");
      }
    } catch (error) {
      console.error("이미지 업로드 오류:", error);
      toast.error("이미지 업로드 중 오류가 발생했습니다");
    } finally {
      setUploading(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (popup: PopupResponse) => {
    setSelectedPopup(popup);
    setFormData({
      name: popup.name,
      description: popup.description || "",
      type: popup.type,
      imageUrl: popup.imageUrl,
      imageUrlMobile: popup.imageUrlMobile,
      htmlContent: popup.htmlContent,
      iframeUrl: popup.iframeUrl,
      linkUrl: popup.linkUrl || "",
      linkTarget: popup.linkTarget || "_self",
      width: popup.width || 500,
      height: popup.height || 700,
      mobileWidth: popup.mobileWidth,
      mobileHeight: popup.mobileHeight,
      position: popup.position,
      displayOrder: popup.displayOrder,
      visible: popup.visible,
      startDate: popup.startDate,
      endDate: popup.endDate || "",
      showCondition: popup.showCondition,
      showDelay: popup.showDelay,
      showCloseButton: popup.showCloseButton,
      showTodayCloseButton: popup.showTodayCloseButton,
      backgroundOverlay: popup.backgroundOverlay,
      overlayOpacity: popup.overlayOpacity || 0.5,
      channelCodes: popup.channelCodes || [],
      pagePaths: popup.pagePaths || ["/home"],
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (popup: PopupResponse) => {
    setSelectedPopup(popup);
    setIsDeleteDialogOpen(true);
  };

  const openDetailDialog = (popup: PopupResponse) => {
    setSelectedPopup(popup);
    setIsDetailDialogOpen(true);
  };

  const handleRowClick = (popup: PopupResponse, e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest('[role="switch"]') ||
      target.closest("[data-radix-collection-item]")
    ) {
      return;
    }
    openDetailDialog(popup);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "IMAGE",
      imageUrl: "",
      linkUrl: "",
      linkTarget: "_self",
      width: 500,
      height: 700,
      position: "CENTER",
      displayOrder: 1,
      visible: true,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      showCondition: "ALWAYS",
      showDelay: 0,
      showCloseButton: true,
      showTodayCloseButton: true,
      backgroundOverlay: true,
      overlayOpacity: 0.5,
      channelCodes: [],
      pagePaths: ["/home"],
    });
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isActivePeriod = (popup: PopupResponse) => {
    const now = new Date();
    const start = new Date(popup.startDate);
    if (!popup.endDate) return now >= start;
    const end = new Date(popup.endDate);
    return now >= start && now <= end;
  };

  const handleChannelToggle = (channelCode: string) => {
    const existingChannel = formData.channelCodes.find((ch) => ch === channelCode);
    if (existingChannel) {
      setFormData({
        ...formData,
        channelCodes: formData.channelCodes.filter((ch) => ch !== channelCode),
      });
    } else {
      setFormData({
        ...formData,
        channelCodes: [...formData.channelCodes, channelCode],
      });
    }
  };

  const getPositionLabel = (position: PopupPosition) => {
    const labels: Record<PopupPosition, string> = {
      CENTER: "중앙",
      TOP_LEFT: "좌측 상단",
      TOP_RIGHT: "우측 상단",
      BOTTOM_LEFT: "좌측 하단",
      BOTTOM_RIGHT: "우측 하단",
    };
    return labels[position];
  };

  return (
    <div className="space-y-4">
      {/* Search and Actions */}
      <div className="flex flex-col gap-3 w-full sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
        <div className="bg-background box-border content-stretch flex gap-[8px] h-[36px] items-center px-[16px] py-[8px] relative rounded-[6px] shrink-0 w-full sm:w-[300px] focus-within:shadow-[0_0_0_1px_#0c8ce9] transition-shadow">
          <div
            aria-hidden="true"
            className="absolute border border-border border-solid inset-0 pointer-events-none rounded-[6px]"
          />
          <Search className="h-[18px] w-[18px] text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="팝업명으로 검색..."
            className="text-[12px] text-muted-foreground placeholder:text-muted-foreground bg-transparent border-none outline-none flex-1"
          />
        </div>

        {/* 날짜 범위 선택 */}
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          startPlaceholder="시작일"
          endPlaceholder="종료일"
          className="w-full sm:w-auto"
        />

        {/* 하단: 초기화 + 추가 버튼 */}
        <div className="flex gap-2 sm:ml-auto">
          {/* 필터 초기화 버튼 */}
          {(startDate || endDate || searchTerm) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStartDate(undefined);
                setEndDate(undefined);
                setSearchTerm("");
              }}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              필터 초기화
            </Button>
          )}

          {canCreate && (
            <Button onClick={openCreateDialog} className="ml-auto sm:ml-0" disabled={loading}>
              <Plus className="h-4 w-4 mr-2" />
              팝업 추가
            </Button>
          )}
        </div>
      </div>

      {/* 모바일 리스트 (md 미만) */}
      {filteredPopups.length === 0 ? (
        <div className="md:hidden flex flex-col items-center justify-center w-full py-16 gap-4">
          <p className="text-muted-foreground">등록된 팝업이 없습니다.</p>
        </div>
      ) : (
        <div className="md:hidden divide-y divide-border w-full">
          {filteredPopups.map((popup) => (
            <div key={popup.id} className="py-4 px-2">
              <div className="flex items-start gap-3">
                {/* 이미지 */}
                <div className="w-16 h-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
                  <img
                    src={popup.imageUrl}
                    alt={popup.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{popup.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(popup.startDate)} ~ {formatDate(popup.endDate || "")}
                  </p>
                </div>
                {/* 상태 + 액션 */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isActivePeriod(popup) ? (
                    <Badge variant="default" className="text-[10px]">진행중</Badge>
                  ) : new Date() < new Date(popup.startDate) ? (
                    <Badge variant="secondary" className="text-[10px]">대기중</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">종료</Badge>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canEdit && (
                        <DropdownMenuItem onClick={() => openEditDialog(popup)}>
                          <Edit className="h-4 w-4 mr-2" />
                          수정
                        </DropdownMenuItem>
                      )}
                      {canDelete && (
                        <DropdownMenuItem
                          onClick={() => openDeleteDialog(popup)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          삭제
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              {/* 노출 스위치 */}
              <div className="flex items-center justify-between pt-2 mt-2 border-t">
                <span className="text-xs text-muted-foreground">노출</span>
                <Switch
                  checked={popup.visible}
                  onCheckedChange={() => handleToggleVisible(popup)}
                  disabled={!canEdit || loading}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="hidden md:block w-full flex-1">
      <div className="content-stretch flex flex-col items-start relative shrink-0 w-full flex-1 overflow-x-auto overflow-y-auto">
        <div className="min-w-[1300px] w-full">
          {/* Table Header */}
          <div className="h-[40px] relative shrink-0 bg-muted/30">
            <div className="content-stretch flex h-[40px] items-start overflow-clip relative rounded-[inherit]">
              <div className="content-stretch flex h-full items-center relative w-full">
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[80px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">순서</p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[120px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">이미지</p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[200px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">팝업명</p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[100px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">크기</p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[120px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">위치</p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[140px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">시작일</p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[140px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">종료일</p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[100px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">기간상태</p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[100px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">노출</p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[140px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">등록일</p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>
              </div>
              <div className="content-stretch flex gap-[4px] h-full items-center justify-start overflow-clip relative shrink-0 w-[80px] pr-[20px]">
                <div className="h-[16px] w-px bg-border" />
                <p className="text-[13px] text-nowrap whitespace-pre">작업</p>
              </div>
            </div>
            <div
              aria-hidden="true"
              className="absolute border-[1px_0px] border-border border-solid inset-0 pointer-events-none"
            />
          </div>

          {/* Table Body */}
          <div className="content-stretch flex flex-col items-start relative shrink-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center w-full py-16">
                <LoadingSpinner size="lg" text="로딩 중..." />
              </div>
            ) : !filteredPopups || filteredPopups.length === 0 ? (
              <div className="flex flex-col items-center justify-center w-full py-16 gap-4">
                <Search className="size-12 text-muted-foreground opacity-20" />
                <p className="text-muted-foreground">
                  {searchTerm ? "검색 결과가 없습니다." : "팝업이 없습니다."}
                </p>
              </div>
            ) : (
              filteredPopups.map((popup, rowIndex) => (
                <div
                  key={popup.id}
                  className={`content-stretch flex h-[80px] items-center overflow-clip relative shrink-0 w-full cursor-pointer transition-colors ${
                    rowIndex % 2 === 0
                      ? "bg-card hover:bg-[#F3F4F6] dark:hover:bg-muted/10"
                      : "bg-[#F9FAFB] dark:bg-muted/30 hover:bg-[#F3F4F6] dark:hover:bg-muted/10"
                  }`}
                  onClick={(e) => handleRowClick(popup, e)}
                >
                  <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[80px]">
                    <p className="text-[14px] text-foreground">{popup.displayOrder}</p>
                  </div>
                  <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[120px]">
                    <div className="w-[60px] h-[60px] rounded-md overflow-hidden bg-muted">
                      <img
                        src={popup.imageUrl}
                        alt={popup.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[200px]">
                    <p className="text-[13px] text-foreground text-nowrap overflow-ellipsis overflow-hidden">
                      {popup.name}
                    </p>
                  </div>
                  <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[100px]">
                    <p className="text-xs text-muted-foreground">
                      {popup.width} x {popup.height}
                    </p>
                  </div>
                  <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[120px]">
                    <Badge variant="outline">{getPositionLabel(popup.position)}</Badge>
                  </div>
                  <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[140px]">
                    <p className="text-[13px] text-foreground">
                      {formatDate(popup.startDate)}
                    </p>
                  </div>
                  <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[140px]">
                    <p className="text-sm text-foreground">
                      {formatDate(popup.endDate || "")}
                    </p>
                  </div>
                  <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[100px]">
                    {isActivePeriod(popup) ? (
                      <Badge variant="default">진행중</Badge>
                    ) : new Date() < new Date(popup.startDate) ? (
                      <Badge variant="secondary">대기중</Badge>
                    ) : (
                      <Badge variant="secondary">종료</Badge>
                    )}
                  </div>
                  <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[100px]">
                    <Switch
                      checked={popup.visible}
                      onCheckedChange={() => handleToggleVisible(popup)}
                      disabled={!canEdit || loading}
                    />
                  </div>
                  <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[140px]">
                    <p className="text-[13px] text-muted-foreground">
                      {formatDate(popup.createdAt)}
                    </p>
                  </div>
                  <div className="content-stretch flex gap-[8px] h-full items-center justify-center overflow-clip relative shrink-0 w-[80px] pr-[20px]">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 rounded-md transition-colors hover:bg-muted text-muted-foreground hover:text-foreground">
                          <MoreVertical className="h-[14px] w-[14px]" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canEdit && (
                          <DropdownMenuItem onClick={() => openEditDialog(popup)}>
                            <Edit className="h-4 w-4 mr-2" />
                            수정
                          </DropdownMenuItem>
                        )}
                        {canDelete && (
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(popup)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            삭제
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      </div>

      {/* 페이지네이션 */}
      <TablePagination
        currentPage={currentPage + 1}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page - 1)}
      />

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreateDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setIsEditDialogOpen(false);
            setSelectedPopup(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isCreateDialogOpen ? "팝업 추가" : "팝업 수정"}
            </DialogTitle>
            <DialogDescription>
              팝업 정보를 입력해주세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 기본 정보 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold border-b pb-2">기본 정보</h3>
              
              <div className="space-y-2">
                <Label htmlFor="name">팝업명 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="팝업 이름을 입력하세요"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">설명</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="팝업 설명을 입력하세요"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayOrder">정렬 순서 *</Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    min={1}
                    value={formData.displayOrder}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        displayOrder: e.target.value === "" ? "" as any : Math.max(1, parseInt(e.target.value) || 1),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>위치 *</Label>
                  <Select
                    value={formData.position}
                    onValueChange={(value: PopupPosition) =>
                      setFormData({ ...formData, position: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CENTER">중앙</SelectItem>
                      <SelectItem value="TOP_LEFT">좌측 상단</SelectItem>
                      <SelectItem value="TOP_RIGHT">우측 상단</SelectItem>
                      <SelectItem value="BOTTOM_LEFT">좌측 하단</SelectItem>
                      <SelectItem value="BOTTOM_RIGHT">우측 하단</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 이미지 설정 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold border-b pb-2">이미지</h3>
              
              <div className="space-y-2">
                <Label htmlFor="imageUrl">이미지 URL *</Label>
                <div className="flex gap-2">
                  <Input
                    id="imageUrl"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("popupFileInput")?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    업로드
                  </Button>
                  <input
                    type="file"
                    id="popupFileInput"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
                {formData.imageUrl && (
                  <div className="w-full h-40 rounded-md overflow-hidden bg-muted border">
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="width">너비 (px) *</Label>
                  <Input
                    id="width"
                    type="number"
                    min={100}
                    max={1200}
                    value={formData.width}
                    onChange={(e) =>
                      setFormData({ ...formData, width: parseInt(e.target.value) || 500 })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="height">높이 (px) *</Label>
                  <Input
                    id="height"
                    type="number"
                    min={100}
                    max={1200}
                    value={formData.height}
                    onChange={(e) =>
                      setFormData({ ...formData, height: parseInt(e.target.value) || 700 })
                    }
                  />
                </div>
              </div>
            </div>

            {/* 링크 설정 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold border-b pb-2">링크 설정</h3>
              
              <div className="space-y-2">
                <Label htmlFor="linkUrl">링크 URL (선택)</Label>
                <Input
                  id="linkUrl"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  placeholder="예: /products/123 또는 https://example.com"
                />
                <p className="text-xs text-muted-foreground">
                  💡 팝업 클릭 시 이동할 페이지 URL<br/>
                  💡 채널별 링크: <code className="bg-muted px-1 py-0.5 rounded text-xs">?channel=&#123;채널코드&#125;</code> 추가 권장<br/>
                  예시: <code className="bg-muted px-1 py-0.5 rounded text-xs">/products/123?channel=A001</code>
                </p>
              </div>

              {formData.type === 'IFRAME' && (
                <div className="space-y-2">
                  <Label htmlFor="iframeUrl">아이프레임 URL (선택)</Label>
                  <Input
                    id="iframeUrl"
                    value={formData.iframeUrl}
                    onChange={(e) => setFormData({ ...formData, iframeUrl: e.target.value })}
                    placeholder="예: https://example.com/iframe-content"
                  />
                  <p className="text-xs text-muted-foreground">
                    💡 외부 페이지를 팝업에 임베드<br/>
                    💡 채널별 URL: <code className="bg-muted px-1 py-0.5 rounded text-xs">?channel=&#123;채널코드&#125;</code> 추가 능
                  </p>
                </div>
              )}
            </div>

            {/* 노출 기간 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold border-b pb-2">노출 기간</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>시작일 *</Label>
                  <DatePicker
                    value={formData.startDate ? formData.startDate.slice(0, 10) : undefined}
                    onChange={(date) =>
                      setFormData({ ...formData, startDate: date + "T00:00:00.000Z" })
                    }
                    placeholder="시작일 선택"
                  />
                </div>

                <div className="space-y-2">
                  <Label>종료일</Label>
                  <DatePicker
                    value={formData.endDate ? formData.endDate.slice(0, 10) : undefined}
                    onChange={(date) =>
                      setFormData({
                        ...formData,
                        endDate: date + "T23:59:59.000Z",
                      })
                    }
                    placeholder="종료일 미설정"
                  />
                </div>
              </div>
            </div>

            {/* 표시 옵션 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold border-b pb-2">표시 옵션</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="visible" className="cursor-pointer">팝업 활성화</Label>
                  <Switch
                    id="visible"
                    checked={formData.visible}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, visible: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="showTodayCloseButton" className="cursor-pointer">
                    "오늘 하루 보지 않기" 버튼
                  </Label>
                  <Switch
                    id="showTodayCloseButton"
                    checked={formData.showTodayCloseButton}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, showTodayCloseButton: checked })
                    }
                  />
                </div>
              </div>
            </div>

            {/* 채널 설정 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold border-b pb-2">채널 설정</h3>
              
              <div className="space-y-2">
                <Label>표시 채널 (선택)</Label>
                <div className="border rounded-md p-3 space-y-2 max-h-[150px] overflow-y-auto bg-muted/30">
                  {!channels || channels.length === 0 ? (
                    <p className="text-sm text-muted-foreground">채널이 없습니다</p>
                  ) : (
                    channels.map((channel) => {
                      const isSelected = formData.channelCodes.some(
                        (ch) => ch === channel.code
                      );
                      return (
                        <div key={channel.code} className="flex items-center gap-2">
                          <Checkbox
                            id={`popup-channel-${channel.code}`}
                            checked={isSelected}
                            onCheckedChange={() => handleChannelToggle(channel.code)}
                          />
                          {/* ⭐ 채널 로고 이미지 */}
                          {channel.logoUrl ? (
                            <img
                              src={channel.logoUrl}
                              alt={channel.name}
                              className="h-5 w-5 rounded object-cover shrink-0"
                            />
                          ) : (
                            <div
                              className="h-5 w-5 rounded flex items-center justify-center text-xs text-white shrink-0"
                              style={{ backgroundColor: '#0c8ce9' }}
                            >
                              {channel.name.charAt(0)}
                            </div>
                          )}
                          <label
                            htmlFor={`popup-channel-${channel.code}`}
                            className="text-sm cursor-pointer flex-1"
                          >
                            {channel.name} <span className="text-muted-foreground">({channel.code})</span>
                          </label>
                        </div>
                      );
                    })
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  선택하지 않으면 모든 채널에 표시됩니다
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setIsEditDialogOpen(false);
                setSelectedPopup(null);
                resetForm();
              }}
            >
              취소
            </Button>
            <Button
              onClick={isCreateDialogOpen ? handleCreate : handleUpdate}
              disabled={loading || uploading}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  저장 중...
                </>
              ) : (
                "저장"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>팝업 상세 정보</DialogTitle>
          </DialogHeader>
          {selectedPopup && (
            <div className="space-y-6 py-4">
              {/* 이미지 미리보기 */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold border-b pb-2">이미지</h3>
                <div className="w-full max-h-80 rounded-md overflow-hidden bg-muted border flex items-center justify-center">
                  <img
                    src={selectedPopup.imageUrl}
                    alt={selectedPopup.name}
                    className="max-w-full max-h-80 object-contain"
                  />
                </div>
              </div>

              {/* 기본 정보 */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold border-b pb-2">기본 정보</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">팝업명</p>
                    <p className="font-medium">{selectedPopup.name}</p>
                  </div>
                  {selectedPopup.description && (
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">설명</p>
                      <p className="font-medium">{selectedPopup.description}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">정렬 순서</p>
                    <p className="font-medium">{selectedPopup.displayOrder}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">위치</p>
                    <p className="font-medium">{getPositionLabel(selectedPopup.position)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">크기</p>
                    <p className="font-medium">
                      {selectedPopup.width} x {selectedPopup.height} px
                    </p>
                  </div>
                </div>
              </div>

              {/* 링크 설정 */}
              {selectedPopup.linkUrl && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold border-b pb-2">링크 설정</h3>
                  <div className="text-sm">
                    <p className="text-muted-foreground text-xs mb-1">링크 URL</p>
                    <a
                      href={selectedPopup.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline break-all"
                    >
                      {selectedPopup.linkUrl}
                    </a>
                  </div>
                </div>
              )}

              {/* 노출 기간 */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold border-b pb-2">노출 기간</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">시작일</p>
                    <p className="font-medium">{formatDateTime(selectedPopup.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">종료일</p>
                    <p className="font-medium">
                      {selectedPopup.endDate
                        ? formatDateTime(selectedPopup.endDate)
                        : "종료일 미설정"}
                    </p>
                  </div>
                </div>
              </div>

              {/* 표시 상태 */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold border-b pb-2">표시 상태</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">노출 상태</p>
                    <Badge variant={selectedPopup.visible ? "default" : "secondary"}>
                      {selectedPopup.visible ? "노출 중" : "숨김"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">기간 상태</p>
                    {isActivePeriod(selectedPopup) ? (
                      <Badge variant="default">진행중</Badge>
                    ) : new Date() < new Date(selectedPopup.startDate) ? (
                      <Badge variant="secondary">대기중</Badge>
                    ) : (
                      <Badge variant="secondary">종료</Badge>
                    )}
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">오늘 하루 보지 않기</p>
                    <Badge variant={selectedPopup.showTodayCloseButton ? "default" : "secondary"}>
                      {selectedPopup.showTodayCloseButton ? "사용" : "사용 안 함"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* 채널 설정 */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold border-b pb-2">채널 설정</h3>
                <div className="text-sm">
                  <p className="text-muted-foreground text-xs mb-2">표시 채널</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedPopup.channelCodes && selectedPopup.channelCodes.length > 0 ? (
                      selectedPopup.channelCodes.map((channelCode) => {
                        const channel = channels.find(ch => ch.code === channelCode);
                        return (
                          <Badge key={channelCode} variant="default">
                            {channel ? `${channel.name} (${channel.code})` : channelCode}
                          </Badge>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground">모든 채널</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 등록 정보 */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold border-b pb-2">등록 정보</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">등록일</p>
                    <p className="font-medium">{formatDateTime(selectedPopup.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">수정일</p>
                    <p className="font-medium">{formatDateTime(selectedPopup.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDetailDialogOpen(false)}
            >
              닫기
            </Button>
            {canEdit && selectedPopup && (
              <Button
                onClick={() => {
                  setIsDetailDialogOpen(false);
                  openEditDialog(selectedPopup);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                수정
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>팝업 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 팝업을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              {selectedPopup && (
                <div className="mt-2 p-2 bg-muted rounded-md">
                  <p className="font-medium">{selectedPopup.name}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  삭제 중...
                </>
              ) : (
                "삭제"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}