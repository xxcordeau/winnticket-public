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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { authStore } from "@/data/auth";
import { getChannels as getChannelsLocal } from "@/data/channels";
import * as ChannelAPI from "@/lib/api/channel";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { DatePicker } from "@/components/ui/date-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { TablePagination } from "@/components/common/table-pagination";
import { uploadFile } from "@/lib/api/file";
import { getImageUrl } from "@/lib/utils/image"; // ⭐ 이미지 URL 유틸리티 추가

// 새 API 임포트
import {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerVisible,
} from "@/lib/api/banner";
import type {
  BannerResponse,
  BannerCreateRequest,
  BannerUpdateRequest,
  BannerPosition,
} from "@/data/dto/banner.dto";

interface Channel {
  id: string;
  code: string;
  name: string;
  logoUrl?: string; // ⭐ 채널 로고 URL 추가
}

export function BannerManagementTab() {
  const [banners, setBanners] = useState<BannerResponse[]>([]);
  const [filteredBanners, setFilteredBanners] = useState<
    BannerResponse[]
  >([]);
  const [selectedBanner, setSelectedBanner] =
    useState<BannerResponse | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 날짜 필터 상태
  const [startDate, setStartDate] = useState<Date | undefined>(
    undefined,
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    undefined,
  );

  const [isCreateDialogOpen, setIsCreateDialogOpen] =
    useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] =
    useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] =
    useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] =
    useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "IMAGE",
    position: "MAIN_TOP",
    imageUrl: "",
    imageUrlMobile: "",
    clickAction: "LINK",
    linkUrl: "",
    displayOrder: 1,
    visible: true,
    startDate: new Date().toISOString().slice(0, 19),
    endDate: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ).toISOString().slice(0, 19),
    channelIds: [],
    imageOnly: false, // ⭐ 이미지만 표시 여부
  });

  const pageSize = 20;

  const canView = authStore.hasPermission("banners", "view");
  const canCreate = authStore.hasPermission(
    "banners",
    "create",
  );
  const canEdit = authStore.hasPermission("banners", "edit");
  const canDelete = authStore.hasPermission(
    "banners",
    "delete",
  );

  useEffect(() => {
    if (canView) {
      loadBanners();
    }
  }, [canView]);

  useEffect(() => {
    filterBanners();
  }, [banners, searchTerm, startDate, endDate, currentPage]);

  useEffect(() => {
    loadChannels();
  }, []);

  // ⭐ 컴포넌트 언마운트 시 필��� 상태 초기화
  useEffect(() => {
    return () => {
      setSearchTerm("");
      setStartDate(undefined);
      setEndDate(undefined);
      setCurrentPage(0);
    };
  }, []);

  const loadChannels = async () => {
    try {
      const response = await ChannelAPI.getChannels();

      if (response.success && response.data) {
        // ⭐ API가 직접 배열을 반환 (ChannelListItem[])
        const channelList = response.data.map((ch) => ({
          id: ch.code, // code를 id로 사용
          code: ch.code,
          name: ch.name,
          logoUrl: ch.logoUrl, // ⭐ 채널 로고 URL 추가
        }));

        setChannels(channelList);
        return;
      }

      // API 실패 시 로컬 폴백
      const localResponse = getChannelsLocal();
      if (localResponse.success && localResponse.data) {
        const channelList = localResponse.data.content.map(
          (ch) => ({
            id: ch.id,
            code: ch.channelCode,
            name: ch.channelName,
          }),
        );
        setChannels(channelList);
      }
    } catch (error) {
      // 네트워크 오류 등으로 API 호출 실패 시 로컬 폴백
      const localResponse = getChannelsLocal();
      if (localResponse.success && localResponse.data) {
        const channelList = localResponse.data.content.map(
          (ch) => ({
            id: ch.id,
            code: ch.channelCode,
            name: ch.channelName,
          }),
        );
        setChannels(channelList);
      }
    }
  };

  const loadBanners = async () => {
    setLoading(true);
    try {
      console.log("[배너관리] API 호출 시작");
      const response = await getBanners({
        position: "MAIN_TOP",
      }); // position 파라미터 추가
      console.log("[배너관리] API 응답:", response);

      if (response.success && response.data) {
        // 백엔드가 배열로 직접 반환하는지, 페이징 객체로 반환하는지 체크
        let bannerList: BannerResponse[];

        if (Array.isArray(response.data)) {
          // 백엔드가 배열로 직접 반환하는 경우
          bannerList = response.data;
        } else if (
          response.data.content &&
          Array.isArray(response.data.content)
        ) {
          // 백엔드가 BannerPageResponse 형태로 반환하는 경우
          bannerList = response.data.content;
        } else {
          console.error(
            "[배너관리] 예상치 못한 응답 구조:",
            response.data,
          );
          bannerList = [];
        }

        setBanners(bannerList);
        setTotalPages(Math.ceil(bannerList.length / pageSize));
      } else {
        toast.error(
          response.message ||
            "배너 목록을 불러오는데 실패했습니다",
        );
      }
    } catch (error) {
      console.error("배너 로드 오류:", error);
      toast.error("배너 목록을 불러오는데 실패했습다");
    } finally {
      setLoading(false);
    }
  };

  const filterBanners = () => {
    // 배너 배열이 유효하지 않으면 빈 배열로 처리
    if (!Array.isArray(banners)) {
      setFilteredBanners([]);
      setTotalPages(0);
      return;
    }

    let filtered = [...banners];
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (banner) =>
          banner.name.toLowerCase().includes(searchLower) ||
          (banner.description &&
            banner.description
              .toLowerCase()
              .includes(searchLower)),
      );
    }
    if (startDate) {
      filtered = filtered.filter(
        (banner) => new Date(banner.startDate) >= startDate,
      );
    }
    if (endDate) {
      filtered = filtered.filter((banner) => {
        if (!banner.endDate) return true;
        return new Date(banner.endDate) <= endDate;
      });
    }

    // 프론트엔드 페이징 처리
    const start = currentPage * pageSize;
    const end = start + pageSize;
    setFilteredBanners(filtered.slice(start, end));
    setTotalPages(Math.ceil(filtered.length / pageSize));
  };

  const handleCreate = async () => {
    // ⭐ 이미지만 모드일 때는 name 검증 스킵
    if (!formData.imageOnly && !formData.name) {
      toast.error("필수 항목을 입력해주세요");
      return;
    }
    if (!formData.imageUrl) {
      toast.error("이미지는 필수입니다");
      return;
    }
    if (!formData.startDate) {
      toast.error("시작일은 필수입니다");
      return;
    }

    setLoading(true);
    try {
      // 백엔드 API 형식에 맞게 데이터 구성 (imageUrl 문자열)
      const createData: BannerCreateRequest = {
        name: formData.imageOnly ? "" : formData.name, // ⭐ 이미지만 모드일 때는 빈 문자열
        description: formData.imageOnly
          ? ""
          : formData.description,
        type: formData.type as any,
        position: formData.position as any,
        imageUrl: Array.isArray(formData.imageUrl)
          ? formData.imageUrl[0]
          : formData.imageUrl, // 배열이면 첫 번째 요소 추출
        imageUrlMobile: formData.imageUrlMobile || "",
        clickAction: formData.clickAction as any,
        linkUrl: formData.linkUrl,
        displayOrder: formData.displayOrder,
        visible: formData.visible,
        startDate: formData.startDate,
        endDate: formData.endDate,
        channelIds: formData.channelIds as any,
      };

      const response = await createBanner(createData);
      if (response.success) {
        toast.success(
          response.message || "배너가 생성되었습니다",
        );
        setIsCreateDialogOpen(false);
        resetForm();
        loadBanners();
        window.dispatchEvent(new Event("bannerUpdated"));
      } else {
        toast.error(
          response.message || "배너 생성에 실패했습니다",
        );
      }
    } catch (error) {
      console.error("배너 생성 오류:", error);
      toast.error("배너 생성 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedBanner) return;
    // ⭐ 이미지만 모드일 때는 name 검증 스킵
    if (!formData.imageOnly && !formData.name) {
      toast.error("필수 항목을 입력해주세요");
      return;
    }
    if (!formData.imageUrl) {
      toast.error("이미지는 필수입니다");
      return;
    }

    setLoading(true);
    try {
      // 백엔드 API 형식에 맞게 데이터 구성 (imageUrl은 문자열)
      const updateData: BannerUpdateRequest = {
        name: formData.imageOnly ? "" : formData.name,
        description: formData.imageOnly
          ? ""
          : formData.description,
        type: formData.type as any,
        position: formData.position as any,
        imageUrl: Array.isArray(formData.imageUrl)
          ? formData.imageUrl[0]
          : formData.imageUrl, // 배열이면 첫 번째 요소, 아니면 그대로
        imageUrlMobile: formData.imageUrlMobile,
        clickAction: formData.clickAction as any,
        linkUrl: formData.linkUrl,
        displayOrder: formData.displayOrder,
        visible: formData.visible,
        startDate: formData.startDate,
        endDate: formData.endDate,
        channelIds: formData.channelIds as any,
      };

      const response = await updateBanner(
        selectedBanner.id,
        updateData,
      );
      if (response.success) {
        toast.success(
          response.message || "배너가 수정되었습니다",
        );
        setIsEditDialogOpen(false);
        setSelectedBanner(null);
        resetForm();
        loadBanners();
        window.dispatchEvent(new Event("bannerUpdated"));
      } else {
        toast.error(
          response.message || "배너 수정에 실패했습니다",
        );
      }
    } catch (error) {
      console.error("배너 수정 오류:", error);
      toast.error("배너 수정 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedBanner) return;

    setLoading(true);
    try {
      const response = await deleteBanner(selectedBanner.id);
      if (response.success) {
        toast.success(
          response.message || "배너가 삭제되었습니다",
        );
        setIsDeleteDialogOpen(false);
        setSelectedBanner(null);
        loadBanners();
        window.dispatchEvent(new Event("bannerUpdated"));
      } else {
        toast.error(
          response.message || "배너 삭제에 실패했습니다",
        );
      }
    } catch (error) {
      console.error("배너 삭제 오류:", error);
      toast.error("배너 삭제 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisible = async (
    banner: BannerResponse,
  ) => {
    const newVisible = !banner.visible;
    // 낙관적 업데이트: 로컬 상태를 먼저 반영
    setBanners((prev) =>
      prev.map((b) =>
        b.id === banner.id ? { ...b, visible: newVisible } : b,
      ),
    );
    try {
      const response = await toggleBannerVisible(
        banner.id,
        newVisible,
      );
      if (response.success) {
        toast.success(
          response.message || "배너 노출 여부가 변경되었습니다",
        );
        loadBanners();
        window.dispatchEvent(new Event("bannerUpdated"));
      } else {
        // 실패 시 원래 상태로 되돌리기
        setBanners((prev) =>
          prev.map((b) =>
            b.id === banner.id
              ? { ...b, visible: banner.visible }
              : b,
          ),
        );
        toast.error(
          response.message || "노출 여부 변경에 실패했습니다",
        );
      }
    } catch (error) {
      // 오류 시 원래 상태로 되돌리기
      setBanners((prev) =>
        prev.map((b) =>
          b.id === banner.id
            ? { ...b, visible: banner.visible }
            : b,
        ),
      );
      console.error("노출 여부 변경 오류:", error);
      toast.error("노출 여부 변경 중 오류가 발생했습니다");
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 업로드 가능합니다.");
      return;
    }

    if (file.size > 30 * 1024 * 1024) {
      toast.error("파일 크기는 30MB 이하여야 합니다.");
      return;
    }

    setUploading(true);
    try {
      const response = await uploadFile(file);
      if (response.success && response.data) {
        // response.data는 FileUploadResponse 객체므로 fileUrl 추출
        const imageUrl = response.data.fileUrl;
        setFormData({ ...formData, imageUrl });
        toast.success(
          response.message || "이미지가 업로드되었습니다",
        );
      } else {
        toast.error(
          response.message || "이미지 업로드에 실패했습니다",
        );
      }
    } catch (error) {
      console.error("이미지 업로드 오류:", error);
      toast.error("이미지 업로드 중 류가 발생했니다");
    } finally {
      setUploading(false);
      // input 초기화
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (banner: BannerResponse) => {
    setSelectedBanner(banner);
    setFormData({
      name: banner.name,
      description: banner.description || "",
      type: banner.type,
      position: banner.position,
      imageUrl: Array.isArray(banner.imageUrl)
        ? banner.imageUrl[0]
        : banner.imageUrl, // 배열이면 첫 번째 요소 추출
      imageUrlMobile: banner.imageUrlMobile || "",
      clickAction: banner.clickAction,
      linkUrl: banner.linkUrl || "",
      displayOrder: banner.displayOrder,
      visible: banner.visible,
      startDate: banner.startDate,
      endDate: banner.endDate || "",
      channelIds: banner.channelIds || [],
      imageOnly: !banner.name && !banner.description, // ⭐ 배너명과 설명이 둘 다 비어있으면 imageOnly
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (banner: BannerResponse) => {
    setSelectedBanner(banner);
    setIsDeleteDialogOpen(true);
  };

  const openDetailDialog = (banner: BannerResponse) => {
    setSelectedBanner(banner);
    setIsDetailDialogOpen(true);
  };

  const handleRowClick = (
    banner: BannerResponse,
    e: React.MouseEvent,
  ) => {
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest('[role="switch"]') ||
      target.closest("[data-radix-collection-item]")
    ) {
      return;
    }
    openDetailDialog(banner);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "IMAGE",
      position: "MAIN_TOP",
      imageUrl: "",
      imageUrlMobile: "",
      clickAction: "LINK",
      linkUrl: "",
      displayOrder: 1,
      visible: true,
      startDate: new Date().toISOString(),
      endDate: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      channelIds: [],
      imageOnly: false, // ⭐ 이미지만 표시 여부
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

  const isActivePeriod = (banner: BannerResponse) => {
    const now = new Date();
    const start = new Date(banner.startDate);
    if (!banner.endDate) return now >= start;
    const end = new Date(banner.endDate);
    return now >= start && now <= end;
  };

  const handleChannelToggle = (channelId: string) => {
    if (formData.channelIds.includes(channelId)) {
      // 이미 있으면 제거
      setFormData({
        ...formData,
        channelIds: formData.channelIds.filter(
          (id) => id !== channelId,
        ),
      });
    } else {
      // 없으면 추가
      setFormData({
        ...formData,
        channelIds: [...formData.channelIds, channelId],
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full flex-wrap">
        <div className="bg-background box-border content-stretch flex gap-[8px] h-[36px] items-center px-[16px] py-[8px] relative rounded-[6px] w-full sm:w-[300px] focus-within:shadow-[0_0_0_1px_#0c8ce9] transition-shadow">
          <div
            aria-hidden="true"
            className="absolute border border-border border-solid inset-0 pointer-events-none rounded-[6px]"
          />
          <Search className="h-[18px] w-[18px] text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="배너명으로 검색..."
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

        <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
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
            <Button
              onClick={openCreateDialog}
              className="ml-auto sm:ml-0"
              disabled={loading}
            >
              <Plus className="h-4 w-4 mr-2" />
              배너 추가
            </Button>
          )}
        </div>
      </div>

      {/* 모바일 리스트 (md 미만) */}
      {filteredBanners.length === 0 ? (
        <div className="md:hidden flex flex-col items-center justify-center w-full py-16 gap-4">
          <p className="text-muted-foreground">등록된 배너가 없습니다.</p>
        </div>
      ) : (
        <div className="md:hidden divide-y divide-border w-full">
          {filteredBanners.map((banner) => (
            <div key={banner.id} className="py-4 px-2 cursor-pointer" onClick={(e) => handleRowClick(banner, e)}>
              <div className="flex items-start gap-3">
                {/* 이미지 */}
                <div className="w-16 h-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
                  <img
                    src={getImageUrl(banner.imageUrl)}
                    alt={banner.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{banner.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(banner.startDate)} ~ {formatDate(banner.endDate || "")}
                  </p>
                </div>
                {/* 상태 + 액션 */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isActivePeriod(banner) ? (
                    <Badge variant="default" className="text-[10px]">진행중</Badge>
                  ) : new Date() < new Date(banner.startDate) ? (
                    <Badge variant="secondary" className="text-[10px]">대기중</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">종료</Badge>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canEdit && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(banner); }}>
                          <Edit className="h-4 w-4 mr-2" />
                          수정
                        </DropdownMenuItem>
                      )}
                      {canDelete && (
                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); openDeleteDialog(banner); }}
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
              <div className="flex items-center justify-between pt-2 mt-2 border-t" onClick={(e) => e.stopPropagation()}>
                <span className="text-xs text-muted-foreground">노출</span>
                <Switch
                  checked={banner.visible}
                  onCheckedChange={() => handleToggleVisible(banner)}
                  disabled={!canEdit || loading}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="hidden md:block">
      <div className="content-stretch flex flex-col items-start relative shrink-0 w-full flex-1 overflow-x-auto overflow-y-auto">
        <div className="min-w-[1000px] w-full">
          {/* Table Header */}
          <div className="h-[40px] relative shrink-0 bg-muted/30">
            <div className="content-stretch flex h-[40px] items-start overflow-clip relative rounded-[inherit]">
              <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[80px]">
                <p className="text-[13px] text-nowrap whitespace-pre">
                  순서
                </p>
                <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                  <div className="h-[16px] w-px bg-border" />
                </div>
              </div>
              <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[120px]">
                <p className="text-[13px] text-nowrap whitespace-pre">
                  이미지
                </p>
                <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                  <div className="h-[16px] w-px bg-border" />
                </div>
              </div>
              <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative flex-1">
                <p className="text-[13px] text-nowrap whitespace-pre">
                  배너명
                </p>
                <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                  <div className="h-[16px] w-px bg-border" />
                </div>
              </div>
              <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[140px]">
                <p className="text-[13px] text-nowrap whitespace-pre">
                  시작일
                </p>
                <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                  <div className="h-[16px] w-px bg-border" />
                </div>
              </div>
              <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[140px]">
                <p className="text-[13px] text-nowrap whitespace-pre">
                  종료일
                </p>
                <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                  <div className="h-[16px] w-px bg-border" />
                </div>
              </div>
              <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[100px]">
                <p className="text-[13px] text-nowrap whitespace-pre">
                  기간상태
                </p>
                <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                  <div className="h-[16px] w-px bg-border" />
                </div>
              </div>
              <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[100px]">
                <p className="text-[13px] text-nowrap whitespace-pre">
                  노출
                </p>
                <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                  <div className="h-[16px] w-px bg-border" />
                </div>
              </div>
              <div className="content-stretch flex gap-[4px] h-full items-center justify-center overflow-clip relative shrink-0 w-[80px] pr-[20px]">
                <div className="h-[16px] w-px bg-border" />
                <p className="text-[13px] text-nowrap whitespace-pre">
                  작업
                </p>
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
            ) : !filteredBanners ||
              filteredBanners.length === 0 ? (
              <div className="flex flex-col items-center justify-center w-full py-16 gap-4">
                <Search className="size-12 text-muted-foreground opacity-20" />
                <p className="text-muted-foreground">
                  {searchTerm
                    ? "검색 결과가 없습니다."
                    : "배너가 없습니다."}
                </p>
              </div>
            ) : (
              filteredBanners.map((banner, rowIndex) => (
                <div
                  key={banner.id}
                  className={`content-stretch flex h-[80px] items-center overflow-clip relative shrink-0 w-full cursor-pointer transition-colors ${
                    rowIndex % 2 === 0
                      ? "bg-card hover:bg-[#F3F4F6] dark:hover:bg-muted/10"
                      : "bg-[#F9FAFB] dark:bg-muted/30 hover:bg-[#F3F4F6] dark:hover:bg-muted/10"
                  }`}
                  onClick={(e) => handleRowClick(banner, e)}
                >
                  <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[80px]">
                    <p className="text-[14px] text-foreground">
                      {banner.displayOrder}
                    </p>
                  </div>
                  <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[120px]">
                    <div className="w-[80px] h-[50px] rounded-md overflow-hidden bg-muted">
                      <img
                        src={getImageUrl(banner.imageUrl)}
                        alt={banner.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative flex-1">
                    <p className="text-[13px] text-foreground text-nowrap overflow-ellipsis overflow-hidden">
                      {banner.name}
                    </p>
                  </div>
                  <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[140px]">
                    <p className="text-[13px] text-foreground">
                      {formatDate(banner.startDate)}
                    </p>
                  </div>
                  <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[140px]">
                    <p className="text-sm text-foreground">
                      {formatDate(banner.endDate || "")}
                    </p>
                  </div>
                  <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[100px]">
                    {isActivePeriod(banner) ? (
                      <Badge variant="default">진행중</Badge>
                    ) : new Date() <
                      new Date(banner.startDate) ? (
                      <Badge variant="secondary">대기중</Badge>
                    ) : (
                      <Badge variant="secondary">종료</Badge>
                    )}
                  </div>
                  <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[100px]">
                    <Switch
                      checked={banner.visible}
                      onCheckedChange={() =>
                        handleToggleVisible(banner)
                      }
                      disabled={!canEdit || loading}
                    />
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
                          <DropdownMenuItem
                            onClick={() =>
                              openEditDialog(banner)
                            }
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            수정
                          </DropdownMenuItem>
                        )}
                        {canDelete && (
                          <DropdownMenuItem
                            onClick={() =>
                              openDeleteDialog(banner)
                            }
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
            setSelectedBanner(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isCreateDialogOpen ? "배너 추가" : "배너 수정"}
            </DialogTitle>
            <DialogDescription>
              배너 정보를 입력해주세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 기본 정보 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold border-b pb-2">
                기본 정보
              </h3>

              {/* ⭐ 이미지만 스위치 */}
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <Label
                    htmlFor="imageOnly"
                    className="cursor-pointer"
                  >
                    이미지만
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    배너명과 설명을 입력하지 않고 이미지만
                    표시합니다
                  </p>
                </div>
                <Switch
                  id="imageOnly"
                  checked={formData.imageOnly}
                  onCheckedChange={(checked) => {
                    setFormData({
                      ...formData,
                      imageOnly: checked,
                    });
                    // 이미지만 모드로 전환하면 배너명과 설명 비우기
                    if (checked) {
                      setFormData((prev) => ({
                        ...prev,
                        imageOnly: true,
                        name: "",
                        description: "",
                      }));
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">
                  배너명 {!formData.imageOnly && "*"}
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                    })
                  }
                  placeholder="배너 이름을 입력하세요"
                  disabled={formData.imageOnly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">설명</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  placeholder="배너 설명을 입력하세요"
                  disabled={formData.imageOnly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayOrder">
                  정렬 순서 *
                </Label>
                <Input
                  id="displayOrder"
                  type="number"
                  min={0}
                  value={formData.displayOrder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      displayOrder:
                        parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            {/* 이미지 설정 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold border-b pb-2">
                이미지
              </h3>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">이미지 URL *</Label>
                <div className="flex gap-2">
                  <Input
                    id="imageUrl"
                    value={formData.imageUrl}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        imageUrl: e.target.value,
                      })
                    }
                    placeholder="https://example.com/image.jpg"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      document
                        .getElementById("bannerFileInput")
                        ?.click()
                    }
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
                    id="bannerFileInput"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
                {formData.imageUrl && (
                  <div className="w-full h-32 rounded-md overflow-hidden bg-muted border">
                    <img
                      src={getImageUrl(formData.imageUrl)}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  권장 크기: 1200 x 400px
                </p>
              </div>
            </div>

            {/* 링크 설정 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold border-b pb-2">
                링크 설정
              </h3>

              <div className="space-y-2">
                <Label>
                  링크 URL{" "}
                  <span className="text-muted-foreground text-xs">
                    (선택)
                  </span>
                </Label>
                <Input
                  value={formData.linkUrl}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      linkUrl: e.target.value,
                    })
                  }
                  placeholder="예: /products/123 또는 https://example.com"
                />
                <p className="text-xs text-muted-foreground">
                  💡 채널별 링크:{" "}
                  <code className="bg-muted px-1 py-0.5 rounded text-xs">
                    ?channel=&#123;채널코드&#125;
                  </code>{" "}
                  추가 권장
                  <br />
                  예시:{" "}
                  <code className="bg-muted px-1 py-0.5 rounded text-xs">
                    /products/123?channel=A001
                  </code>
                </p>
              </div>
            </div>

            {/* 노출 기간 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold border-b pb-2">
                노출 기간
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>시작일 *</Label>
                  <DatePicker
                    value={formData.startDate ? formData.startDate.split('T')[0] : ''}
                    onChange={(dateStr) =>
                      setFormData({
                        ...formData,
                        startDate: dateStr + 'T00:00:00',
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>종료일</Label>
                  <DatePicker
                    value={formData.endDate ? formData.endDate.split('T')[0] : ''}
                    onChange={(dateStr) =>
                      setFormData({
                        ...formData,
                        endDate: dateStr ? dateStr + 'T23:59:59' : '',
                      })
                    }
                    placeholder="종료일 미설정"
                  />
                </div>
              </div>
            </div>

            {/* 표시 옵션 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold border-b pb-2">
                표시 옵션
              </h3>

              <div className="flex items-center justify-between">
                <div>
                  <Label
                    htmlFor="visible"
                    className="cursor-pointer"
                  >
                    배너 활성화
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    비활성화하면 사용자에게 표시되지 않습니다
                  </p>
                </div>
                <Switch
                  id="visible"
                  checked={formData.visible}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      visible: checked,
                    })
                  }
                />
              </div>
            </div>

            {/* 채널 설정 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold border-b pb-2">
                채널 설정
              </h3>

              <div className="space-y-2">
                <Label>표시 채널 (선택)</Label>
                <div className="border rounded-md p-3 space-y-2 max-h-[150px] overflow-y-auto bg-muted/30">
                  {!channels || channels.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      채널이 없습니다
                    </p>
                  ) : (
                    channels.map((channel) => {
                      const isSelected =
                        formData.channelIds.includes(
                          channel.id,
                        );
                      return (
                        <div
                          key={channel.id}
                          className="flex items-center gap-2"
                        >
                          <Checkbox
                            id={`channel-${channel.id}`}
                            checked={isSelected}
                            onCheckedChange={() =>
                              handleChannelToggle(channel.id)
                            }
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
                              style={{
                                backgroundColor: "#0c8ce9",
                              }}
                            >
                              {channel.name.charAt(0)}
                            </div>
                          )}
                          <label
                            htmlFor={`channel-${channel.id}`}
                            className="text-sm cursor-pointer flex-1"
                          >
                            {channel.name}{" "}
                            <span className="text-muted-foreground">
                              ({channel.code})
                            </span>
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
                setSelectedBanner(null);
                resetForm();
              }}
            >
              취소
            </Button>
            <Button
              onClick={
                isCreateDialogOpen ? handleCreate : handleUpdate
              }
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
      <Dialog
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>배너 상세 정보</DialogTitle>
          </DialogHeader>
          {selectedBanner && (
            <div className="space-y-6 py-4">
              {/* 이미지 미리보기 */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold border-b pb-2">
                  이미지
                </h3>
                <div className="w-full h-48 rounded-md overflow-hidden bg-muted border">
                  <img
                    src={getImageUrl(selectedBanner.imageUrl)}
                    alt={selectedBanner.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* 기본 정보 */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold border-b pb-2">
                  기본 정보
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">
                      배너명
                    </p>
                    <p className="font-medium">
                      {selectedBanner.name}
                    </p>
                  </div>
                  {selectedBanner.description && (
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">
                        설명
                      </p>
                      <p className="font-medium">
                        {selectedBanner.description}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">
                      정렬 순서
                    </p>
                    <p className="font-medium">
                      {selectedBanner.displayOrder}
                    </p>
                  </div>
                </div>
              </div>

              {/* 링크 설정 */}
              {selectedBanner.linkUrl && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold border-b pb-2">
                    링크 설정
                  </h3>
                  <div className="text-sm">
                    <p className="text-muted-foreground text-xs mb-1">
                      링크 URL
                    </p>
                    <a
                      href={selectedBanner.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline break-all"
                    >
                      {selectedBanner.linkUrl}
                    </a>
                  </div>
                </div>
              )}

              {/* 노출 기간 */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold border-b pb-2">
                  노출 기간
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">
                      시작일
                    </p>
                    <p className="font-medium">
                      {formatDateTime(selectedBanner.startDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">
                      종료일
                    </p>
                    <p className="font-medium">
                      {selectedBanner.endDate
                        ? formatDateTime(selectedBanner.endDate)
                        : "종료일 미설정"}
                    </p>
                  </div>
                </div>
              </div>

              {/* 표시 상태 */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold border-b pb-2">
                  배너 상태
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">
                      노출 상태
                    </p>
                    <Badge
                      variant={
                        selectedBanner.visible
                          ? "default"
                          : "secondary"
                      }
                    >
                      {selectedBanner.visible
                        ? "노출 중"
                        : "숨김"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">
                      기간 상태
                    </p>
                    {isActivePeriod(selectedBanner) ? (
                      <Badge variant="default">진행중</Badge>
                    ) : new Date() <
                      new Date(selectedBanner.startDate) ? (
                      <Badge variant="secondary">대기중</Badge>
                    ) : (
                      <Badge variant="secondary">종료</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* 채널 설정 */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold border-b pb-2">
                  채널 설정
                </h3>
                <div className="text-sm">
                  <p className="text-muted-foreground text-xs mb-2">
                    표시 채널
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedBanner.channelIds &&
                    selectedBanner.channelIds.length > 0 ? (
                      selectedBanner.channelIds.map(
                        (channelId) => {
                          const channel = channels.find(
                            (ch) => ch.code === channelId,
                          );
                          return (
                            <Badge
                              key={channelId}
                              variant="default"
                            >
                              {channel
                                ? `${channel.name} (${channel.code})`
                                : channelId}
                            </Badge>
                          );
                        },
                      )
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        모든 채널
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 등록 정보 */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold border-b pb-2">
                  등록 정보
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">
                      등록일
                    </p>
                    <p className="font-medium">
                      {formatDateTime(selectedBanner.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">
                      수정일
                    </p>
                    <p className="font-medium">
                      {formatDateTime(selectedBanner.updatedAt)}
                    </p>
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
            {canEdit && selectedBanner && (
              <Button
                onClick={() => {
                  setIsDetailDialogOpen(false);
                  openEditDialog(selectedBanner);
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
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>배너 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 배너를 삭제하시겠습니까? 이 작업은
              되돌릴 수 없습니다.
              {selectedBanner && (
                <div className="mt-2 p-2 bg-muted rounded-md">
                  <p className="font-medium">
                    {selectedBanner.name}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>
              취소
            </AlertDialogCancel>
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