import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Plus, Search, ExternalLink, Copy, Edit2, Trash2, Download, FileSpreadsheet, FileText, Upload, X } from "lucide-react";
import { CoachMark, useCoachMark, TourHelpButton, type TourStep } from "@/components/coach-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { getChannelUrl } from "@/lib/config";
import { PageHeader } from "@/components/page-header";
import * as ChannelAPI from "@/lib/api/channel";
import {
  getChannels,
  createChannel,
  updateChannel,
  deleteChannel as deleteChannelApi,
  type ChannelListItem,
  type ChannelCreateRequest,
  type ChannelUpdateRequest,
} from "@/lib/api/channel";

// ========================================
// 📦 로컬 저장소 헬퍼 함수
// ========================================

/**
 * 채널별 파비콘 정보를 localStorage에 저장
 */
const saveChannelFavicons = (
  channelId: string,
  faviconUrl: string,
) => {
  try {
    const stored = localStorage.getItem("channel_favicons");
    const favicons = stored ? JSON.parse(stored) : {};
    favicons[channelId] = faviconUrl;
    localStorage.setItem(
      "channel_favicons",
      JSON.stringify(favicons),
    );
  } catch (error) {
    console.error(
      "[Channel Management] 파비콘 저장 실패:",
      error,
    );
  }
};

/**
 * localStorage에서 채널별 파비콘 정보를 로드
 */
const loadChannelFavicons = (): Record<string, string> => {
  try {
    const stored = localStorage.getItem("channel_favicons");
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error(
      "[Channel Management] 파비콘 로드 실패:",
      error,
    );
    return {};
  }
};

// ⭐ 로컬 폴백용
import {
  getChannels as getChannelsLocal,
  createChannel as createChannelLocal,
  updateChannel as updateChannelLocal,
  deleteChannel as deleteChannelLocal,
} from "@/data/channels";
import { ChannelDetail } from "./detail";
import type {
  Channel,
  CreateChannelDto,
} from "@/data/dto/channel.dto";
import { ResponsiveChannelTable } from "@/components/ui/responsive-channel-table";
import { TablePagination } from "@/components/common/table-pagination";

type Language = "ko" | "en";

interface ChannelManagementProps {
  language: Language;
}

export function ChannelManagement({
  language,
}: ChannelManagementProps) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] =
    useState(false);

  // 투어 가이드
  const chTourSteps: TourStep[] = [
    { target: "ch-add-btn", title: "채널 추가", description: "새로운 판매 채널을 추가합니다.\n채널 코드, 이름, 도메인 등을 설정합니다.", placement: "bottom" },
    { target: "ch-dialog-form", title: "채널 정보 입력", description: "• 채널 코드: 고유 코드 (영문)\n• 채널명/회사명: 표시 이름\n• 도메인: 채널 쇼핑몰 URL\n• 로고: 채널 로고 이미지", placement: "bottom", waitForTarget: 1500 },
    { target: "ch-table", title: "채널 목록", description: "등록된 채널 목록입니다.\n행을 클릭하면 상세 모달이 열립니다.\n활성화 토글로 채널을 켜고 끌 수 있습니다.", placement: "top" },
    // 상세 모달 스텝
    { target: "chd-basic", title: "채널 상세 - 기본 정보", description: "채널 코드, 이름, 회사명, 도메인을 수정합니다.\n로고/파비콘 업로드, 카드/포인트 결제 설정,\n이메일, 전화번호 등을 관리합니다.", placement: "bottom", waitForTarget: 1500 },
    { target: "chd-products-tab", title: "채널 상세 - 상품 관리", description: "'상품 관리' 탭에서 해당 채널에 노출되는\n상품을 관리합니다.\n특정 상품을 채널에서 제외/복구할 수 있습니다.", placement: "bottom", waitForTarget: 500 },
  ];

  const { isActive: isTourActive, startTour: _startTour, endTour } = useCoachMark("channel_mgmt_tour");

  const startTour = () => {
    if (channels.length === 0) {
      setChannels([{
        id: "dummy-ch", code: "SAMPLE", name: "[투어용] 샘플 채널", companyName: "샘플회사",
        visible: true, domain: "sample.winnticket.co.kr", logoUrl: "",
      } as any]);
    }
    _startTour();
  };

  const handleChTourStep = (stepIndex: number, _step: TourStep) => {
    const isCreateStep = stepIndex === 1;
    const isDetailStep = stepIndex >= 3;

    // 추가 모달 제어
    if (isCreateStep && !isCreateDialogOpen) {
      handleOpenCreateDialog();
    } else if (!isCreateStep && isCreateDialogOpen) {
      setIsCreateDialogOpen(false);
    }

    // 상세 모달 제어
    if (isDetailStep && !isDetailDialogOpen) {
      const firstChannel = channels[0];
      if (firstChannel) {
        setSelectedChannel(firstChannel);
        setIsDetailDialogOpen(true);
      }
    } else if (!isDetailStep && isDetailDialogOpen) {
      setIsDetailDialogOpen(false);
    }

    // 상세 모달 내부 탭 전환 이벤트
    if (stepIndex === 3) {
      window.dispatchEvent(new CustomEvent("channelDetailTab", { detail: "basic" }));
    } else if (stepIndex === 4) {
      window.dispatchEvent(new CustomEvent("channelDetailTab", { detail: "products" }));
    }
  };
  const [isDetailDialogOpen, setIsDetailDialogOpen] =
    useState(false);
  const [selectedChannel, setSelectedChannel] =
    useState<Channel | null>(null);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [formData, setFormData] = useState<CreateChannelDto>({
    channelCode: "",
    channelName: "",
    companyName: "",
    domain: undefined,
    commissionRate: 0,
    active: true,
    useCard: false, // ⭐ 카드 사용 여부 기본값
    usePoint: false, // ⭐ 포인트 사용 여부 기본값
    logoUrl: undefined,
    faviconUrl: undefined,
    description: undefined,
    contactEmail: undefined,
    contactPhone: undefined,
    websiteUrl: undefined,
  });

  useEffect(() => {
    loadChannels();
  }, [searchKeyword, currentPage]);

  const loadChannels = async () => {
    try {
      // ⭐ 새로운 API로 채널 목록 조회 시도
      console.log(
        "[Channel Management] 새 API로 채널 목록 조회 시도...",
      );
      
      // ⭐ 검색어를 모든 필드에 전달 (API가 OR 조건으로 검색)
      const keyword = searchKeyword || undefined;
      const apiResponse = await getChannels(
        keyword, // code 검색
        keyword, // name 검색
        keyword, // companyName 검색
      );

      if (apiResponse.success && apiResponse.data) {
        console.log(
          "[Channel Management] API로 채널 목록을 로드했습니다:",
          apiResponse.data.length,
          "개",
        );
        console.log(
          "[Channel Management] 첫 번째 채널 데이터:",
          apiResponse.data[0],
        );

        // ⭐ localStorage에서 파비콘 정보 로드
        const storedFavicons = loadChannelFavicons();

        // ⭐ API 응답 데이터가 배열인지 확인
        let dataArray: any[] = [];
        if (Array.isArray(apiResponse.data)) {
          dataArray = apiResponse.data;
        } else if (apiResponse.data && typeof apiResponse.data === 'object' && Array.isArray((apiResponse.data as any).content)) {
          dataArray = (apiResponse.data as any).content;
        }

        // ⭐ API 응답을 Channel 타입으로 변환 (id 필드 사용)
        const mappedChannels: Channel[] = dataArray.map(
          (item: any) => {
            console.log(
              "[Channel Management] 채널 매핑:",
              item.code,
              "id:",
              item.id,
            );
            return {
              id: item.id, // ⭐ UUID를 id로 사용 (API 응답 필드명 변경)
              channelCode: item.code,
              channelName: item.name,
              companyName: item.companyName,
              logoUrl: item.logoUrl || "",
              faviconUrl: storedFavicons[item.id] || "", // ⭐ localStorage에서 복원
              description: "",
              contactEmail: "",
              contactPhone: "",
              websiteUrl: item.domain || "",
              domain: item.domain,
              commissionRate: 0,
              active: item.visible,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          },
        );

        setChannels(mappedChannels);
        return;
      }

      // API 실패 시 로컬 데이터 사용
      console.log(
        "[Channel Management] API 실패 또는 데이터 없음, 로컬 데이터 사용",
      );
      const response = getChannelsLocal(
        currentPage - 1,
        itemsPerPage,
        searchKeyword,
      );
      if (response.success && response.data) {
        setChannels(response.data.content);
      }
    } catch (error) {
      console.error(
        "[Channel Management] 채널 목록 로드 중 오류:",
        error,
      );
      // 오류 발생 시에도 로컬 데이터 사용
      const response = getChannelsLocal(
        currentPage - 1,
        itemsPerPage,
        searchKeyword,
      );
      if (response.success && response.data) {
        setChannels(response.data.content);
      }
    }
  };

  const handleOpenDetail = async (channel: Channel) => {
    // ⭐ 로딩 토스트 표시
    const loadingToast = toast.loading(
      "채널 정보를 불러오는 중...",
    );

    try {
      // ⭐ API로 채널 상세 정보 조회
      console.log(
        "[Channel Management] 채널 상세 조회 API 호출:",
        channel.id,
      );
      const apiResponse = await ChannelAPI.getChannelDetail(
        channel.id,
      );

      if (apiResponse.success && apiResponse.data) {
        console.log(
          "[Channel Management] 채널 상세 정보 로드 성공:",
          apiResponse.data,
        );

        // ⭐ API 응답을 Channel 타입으로 변환
        const detailedChannel: Channel = {
          id: apiResponse.data.id || channel.id, // ⭐ id 필드 사용 (API 응답 필명 변경)
          channelCode: apiResponse.data.code,
          channelName: apiResponse.data.name,
          companyName: apiResponse.data.companyName,
          commissionRate: apiResponse.data.commissionRate,
          active: apiResponse.data.visible,
          useCard: apiResponse.data.useCard, // ⭐ 카드 사용 여부 추가
          usePoint: apiResponse.data.usePoint, // ⭐ 포인트 사용 여부 추가
          description: apiResponse.data.description || "",
          logoUrl: apiResponse.data.logoUrl || "",
          faviconUrl: apiResponse.data.faviconUrl || "",
          contactEmail: apiResponse.data.email || "",
          contactPhone: apiResponse.data.phone || "",
          websiteUrl: apiResponse.data.domain || "",
          domain: apiResponse.data.domain,
          createdAt: apiResponse.data.createdAt,
          updatedAt: apiResponse.data.updatedAt,
        };

        setSelectedChannel(detailedChannel);
        toast.dismiss(loadingToast);
      } else {
        // API 실패 시 목록에서 가져온 채널 데이터 사용
        console.log(
          "[Channel Management] API 실패, 목록 데터 사용",
        );
        setSelectedChannel(channel);
        toast.dismiss(loadingToast);
        toast.warning("일부 정보를 불러오지 못했습니다.");
      }

      setIsDetailDialogOpen(true);
    } catch (error) {
      console.error(
        "[Channel Management] 채널 상세 조회 중 오류:",
        error,
      );
      // 오류 발생 시에도 목록에서 가져온 채널 데이터 사용
      setSelectedChannel(channel);
      toast.dismiss(loadingToast);
      toast.warning("일부 정보를 불러오지 못했습니다.");
      setIsDetailDialogOpen(true);
    }
  };

  const handleOpenCreateDialog = () => {
    setFormData({
      channelCode: "",
      channelName: "",
      companyName: "",
      domain: undefined,
      commissionRate: 0,
      active: true,
      useCard: false, // ⭐ 카드 사용 여부 기본값
      usePoint: false, // ⭐ 포인트 사용 여부 기본값
      logoUrl: undefined,
      faviconUrl: undefined,
      description: undefined,
      contactEmail: undefined,
      contactPhone: undefined,
      websiteUrl: undefined,
    });
    setIsCreateDialogOpen(true);
  };

  const handleCreate = async () => {
    if (
      !formData.channelCode.trim() ||
      !formData.channelName.trim() ||
      !formData.companyName.trim()
    ) {
      toast.error("필수 항목을 입력해주세요.");
      return;
    }

    try {
      // ⭐ API 요청 데이터 준비 (모든 필드 필수)
      const requestData: ChannelAPI.ChannelRequest = {
        code: formData.channelCode,
        name: formData.channelName,
        companyName: formData.companyName,
        commissionRate: 0, // 기본값
        logoUrl: formData.logoUrl || "",
        faviconUrl: formData.faviconUrl || "",
        email: formData.contactEmail || "",
        phone: formData.contactPhone || "",
        domain: formData.websiteUrl || "",
        description: formData.description || "",
        visible: formData.active,
        useCard: formData.useCard, // ⭐ 카 사용 여부 추가
        usePoint: formData.usePoint, // ⭐ 포인트 사용 여부 추가
      };

      // ⭐ API 호출
      console.log(
        "[Channel Management] 채널 생성 API 호출:",
        requestData,
      );
      const apiResponse =
        await ChannelAPI.createChannel(requestData);

      if (apiResponse.success) {
        toast.success("채널이 생성되었습니다.");
        setIsCreateDialogOpen(false);
        loadChannels();
      } else {
        // ⭐ API 에러 메시지 확인
        const errorMessage = apiResponse.message || '채널 생성에 실패했습니다';
        
        // ⭐ 중복/검증 에러인 경우 바로 에러 표시 (로컬 폴백 없음)
        if (errorMessage.includes('중복') || 
            errorMessage.includes('존재') || 
            errorMessage.includes('사용 중') ||
            errorMessage.includes('이미')) {
          toast.error(errorMessage);
          return;
        }
        
        // ⭐ 네트워크 에러 등 일부 경우만 로컬 데이터에 저장 시도
        console.log(
          "[Channel Management] API 실패, 로컬 데이터에 저장 시도",
        );
        const localResponse = createChannelLocal(formData);
        if (localResponse.success) {
          toast.success(localResponse.message);
          setIsCreateDialogOpen(false);
          loadChannels();
        } else {
          // ⭐ 로컬도 실패하면 원래 API 에러 메시지 표시
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      console.error(
        "[Channel Management] 채널 생성 중 오류:",
        error,
      );

      // 오류 발생 시 로컬 데이터에 저장 시도
      const localResponse = createChannelLocal(formData);
      if (localResponse.success) {
        toast.success(localResponse.message);
        setIsCreateDialogOpen(false);
        loadChannels();
      } else {
        toast.error("채널 생성에 실패했습니다.");
      }
    }
  };

  const handleUpdateChannel = (updatedChannel: Channel) => {
    loadChannels();
    setSelectedChannel(updatedChannel);
  };

  const handleDeleteChannel = () => {
    setIsDetailDialogOpen(false);
    loadChannels();
  };

  const copyChannelUrl = (channelCode: string) => {
    const channelUrl = getChannelUrl(channelCode);

    const textArea = document.createElement("textarea");
    textArea.value = channelUrl;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand("copy");
      textArea.remove();
      toast.success("채널 URL이 클립보드에 복사되었습니다.");
    } catch (error) {
      textArea.remove();
      console.error("클립보드 복사 실패:", error);
      toast.error("클립보드 복사에 실패했습니다.");
    }
  };

  const openChannelUrl = (channelCode: string) => {
    const channelUrl = getChannelUrl(channelCode);
    window.open(channelUrl, "_blank");
  };

  // 검색 필터링
  const filteredChannels = channels.filter((channel) => {
    const searchLower = searchKeyword.toLowerCase();
    return (
      channel.channelCode.toLowerCase().includes(searchLower) ||
      channel.channelName.toLowerCase().includes(searchLower) ||
      channel.companyName.toLowerCase().includes(searchLower)
    );
  });

  // 페이지네이션 계산
  const totalPages = Math.ceil(
    filteredChannels.length / itemsPerPage,
  );
  const paginatedChannels = filteredChannels.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // CSV 내보내기
  const handleExportCSV = () => {
    try {
      const headers = [
        "채널코드",
        "채널명",
        "회사명",
        "상태",
        "연락처 이메일",
        "연락처 전화",
        "웹사이트",
        "설명",
      ];

      const csvData = filteredChannels.map((channel) => {
        return [
          channel.channelCode,
          `"${channel.channelName}"`,
          `"${channel.companyName}"`,
          channel.active ? "활성" : "비활성",
          channel.contactEmail || "-",
          channel.contactPhone || "-",
          channel.websiteUrl || "-",
          `"${channel.description || "-"}"`,
        ].join(",");
      });

      const csvContent = [
        "\uFEFF" + headers.join(","),
        ...csvData,
      ].join("\n");

      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `채널목록_${new Date().toISOString().slice(0, 10)}.csv`,
      );
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("CSV 파일이 다운로드되었습니다.");
    } catch (error) {
      toast.error("CSV 내보내기에 실패했습니다.");
      console.error(error);
    }
  };

  // Excel 내보내기
  const handleExportExcel = () => {
    try {
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
                <th>채널코드</th>
                <th>채널명</th>
                <th>회사명</th>
                <th>상태</th>
                <th>연락처 이메일</th>
                <th>연락처 전화</th>
                <th>웹사이트</th>
                <th>로고 URL</th>
                <th>파비콘 URL</th>
                <th>설명</th>
              </tr>
            </thead>
            <tbody>
      `;

      filteredChannels.forEach((channel) => {
        html += "<tr>";
        html += `<td>${channel.channelCode}</td>`;
        html += `<td>${channel.channelName}</td>`;
        html += `<td>${channel.companyName}</td>`;
        html += `<td>${channel.active ? "활성" : "비활성"}</td>`;
        html += `<td>${channel.contactEmail || "-"}</td>`;
        html += `<td>${channel.contactPhone || "-"}</td>`;
        html += `<td>${channel.websiteUrl || "-"}</td>`;
        html += `<td>${channel.logoUrl || "-"}</td>`;
        html += `<td>${channel.faviconUrl || "-"}</td>`;
        html += `<td>${channel.description || "-"}</td>`;
        html += "</tr>";
      });

      html += `
            </tbody>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob([html], {
        type: "application/vnd.ms-excel;charset=utf-8;",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `채널목록_${new Date().toISOString().slice(0, 10)}.xls`,
      );
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Excel 파일이 다운로드되었습니다.");
    } catch (error) {
      toast.error("Excel 보내기에 실패했습니다.");
      console.error(error);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={language === "ko" ? "채널 관리" : "Channel Management"}
        subtitle={language === "ko" ? "멀티 채널 쇼핑몰을 관리합니다" : "Manage multi-channel stores"}
        language={language}
        rightContent={
          <TourHelpButton onClick={startTour} />
        }
      />

      {/* Table Container */}
      <div className="bg-card relative rounded-[8px] flex-1 flex flex-col">
        <div
          aria-hidden="true"
          className="absolute border border-border border-solid inset-0 pointer-events-none rounded-[8px]"
        />

        <div className="flex flex-col gap-4 px-4 py-4 sm:gap-[20px] sm:items-start sm:px-[32px] sm:py-[20px] sm:flex-1 sm:overflow-hidden sm:box-border sm:content-stretch">
          {/* Search and Actions */}
          <div className="flex flex-col gap-3 w-full sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
            {/* Search */}
            <div className="bg-background box-border content-stretch flex gap-[8px] h-[36px] items-center px-[16px] py-[8px] relative rounded-[6px] shrink-0 w-full sm:w-[300px] focus-within:shadow-[0_0_0_1px_#0c8ce9] transition-shadow">
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
                placeholder="채널 코드, 이름, 회사이름으로 검색..."
                className="text-[12px] text-muted-foreground placeholder:text-muted-foreground bg-transparent border-none outline-none flex-1"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:ml-auto">
              {/* Export Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    내보내기
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportExcel}>
                    <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                    Excel (.xls)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportCSV}>
                    <FileText className="h-4 w-4 mr-2 text-blue-600" />
                    CSV (.csv)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                onClick={handleOpenCreateDialog}
                className="gap-2"
                data-tour="ch-add-btn"
              >
                <Plus className="h-4 w-4" />
                채널 추가
              </Button>
            </div>
          </div>

          {/* Table */}
          <div data-tour="ch-table" className="w-full">
          <ResponsiveChannelTable
            channels={paginatedChannels}
            onOpenDetail={handleOpenDetail}
            onToggleActive={async (channel, checked) => {
              try {
                console.log('[채널 상태 변경] API 호출:', { 
                  channelId: channel.id, 
                  visible: checked 
                });
                
                // ⭐ 새로운 API 사용
                const apiResponse = await ChannelAPI.updateChannelVisibility(
                  channel.id,
                  checked
                );
                
                console.log('[채널 상태 변경] API 응답:', apiResponse);
                
                if (apiResponse.success) {
                  loadChannels();
                  toast.success(
                    checked
                      ? "채널이 활성화되었습니다."
                      : "채널이 비활성화되습니다.",
                  );
                } else {
                  toast.error(apiResponse.message || "상태 변경에 실패했습니다.");
                }
              } catch (error) {
                console.error('[채널 상태 변경] 오류:', error);
                toast.error("상태 변경 중 오류가 발생했습니다.");
              }
            }}
            onCopyUrl={copyChannelUrl}
            onOpenUrl={openChannelUrl}
          />
          </div>

          {/* 페이지네이션 */}
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredChannels.length}
            itemsPerPage={itemsPerPage}
          />
        </div>
      </div>

      {/* 채널 생성 다이얼로그 */}
      <Dialog
        open={isCreateDialogOpen}
        modal={!isTourActive}
        onOpenChange={(open) => { if (isTourActive && !open) return; setIsCreateDialogOpen(open); }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => { if (isTourActive) e.preventDefault(); }} onEscapeKeyDown={(e) => { if (isTourActive) e.preventDefault(); }}>
          <DialogHeader>
            <DialogTitle>채널 추가</DialogTitle>
            <DialogDescription>
              새로운 채널을 등록합니다. 필수 항목을
              입력해주세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4" data-tour="ch-dialog-form">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">채널 코드 *</Label>
                <Input
                  value={formData.channelCode}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    
                    // 한글 입력 체크
                    if (/[ㄱ-ㅎ가-힣]/.test(inputValue)) {
                      toast.error('채널 코드는 영문, 숫자, 하이픈, 언더스코어만 입력 가능합니다');
                      return;
                    }
                    
                    // 영문, 숫자, 하이픈, 언더코어만 허용
                    const filtered = inputValue.replace(/[^A-Za-z0-9\-_]/g, '');
                    setFormData({
                      ...formData,
                      channelCode: filtered.toUpperCase(),
                    });
                  }}
                  placeholder="ABC"
                />
                <p className="text-xs text-muted-foreground">
                  영문 대문자와 숫자만 사용가능
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">채널 이름 *</Label>
                <Input
                  value={formData.channelName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      channelName: e.target.value,
                    })
                  }
                  placeholder="ABC 쇼핑몰"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label className="text-xs">회사명 *</Label>
                <Input
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      companyName: e.target.value,
                    })
                  }
                  placeholder="주식회사 ABC"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">로고 이미지</Label>
                {formData.logoUrl ? (
                  <div className="relative border rounded-lg p-2">
                    <img
                      src={formData.logoUrl}
                      alt="Logo preview"
                      className="h-20 w-auto mx-auto object-contain"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          logoUrl: undefined,
                        })
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="logo-upload"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const toastId =
                            toast.loading(
                              "이미지 업로드 중...",
                            );
                          
                          try {
                            const response =
                              await ChannelAPI.uploadImage(file);
                            if (
                              response.success &&
                              response.data
                            ) {
                              setFormData({
                                ...formData,
                                logoUrl: response.data.url,
                              });
                              toast.success(
                                "이미지 업로드 완료",
                                { id: toastId },
                              );
                            } else {
                              toast.error(
                                response.message ||
                                  "이미지 업로드 실패",
                                { id: toastId },
                              );
                            }
                          } catch (error) {
                            console.error('로고 업로드 에러:', error);
                            // HTTPS 인증서 에러인 경우 안내
                            if (error instanceof Error && error.message.includes('Failed to fetch')) {
                              toast.error(
                                "서버 인증서 신뢰가 필요합니다",
                                { id: toastId, duration: 5000 }
                              );
                              // 인증서 신뢰를 위한 페이지를 새 탭으로 열기
                              const apiUrl = 'https://api.winnticket.store';
                              toast.info(
                                `새 탭에서 ${apiUrl} 에 접속하여 인증서를 신뢰해주세요`,
                                { duration: 8000 }
                              );
                              // 자동으로 새 탭 열기
                              window.open(apiUrl, '_blank');
                            } else {
                              toast.error(
                                "이미지 업로드 실패",
                                { id: toastId },
                              );
                            }
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() =>
                        document
                          .getElementById("logo-upload")
                          ?.click()
                      }
                    >
                      <Upload className="h-4 w-4" />
                      로고 업로드
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs">파비콘 이미지</Label>
                {formData.faviconUrl ? (
                  <div className="relative border rounded-lg p-2">
                    <img
                      src={formData.faviconUrl}
                      alt="Favicon preview"
                      className="h-16 w-auto mx-auto object-contain"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          faviconUrl: undefined,
                        })
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="favicon-upload"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const toastId =
                            toast.loading(
                              "이미지 업로드 중...",
                            );
                          
                          try {
                            const response =
                              await ChannelAPI.uploadImage(file);
                            if (
                              response.success &&
                              response.data
                            ) {
                              setFormData({
                                ...formData,
                                faviconUrl: response.data.url,
                              });
                              toast.success(
                                "이미지 업로드 완료",
                                { id: toastId },
                              );
                            } else {
                              toast.error(
                                response.message ||
                                  "이미지 업로드 실패",
                                { id: toastId },
                              );
                            }
                          } catch (error) {
                            console.error('파비콘 업로드 에러:', error);
                            // HTTPS 인증서 에러인 경우 안내
                            if (error instanceof Error && error.message.includes('Failed to fetch')) {
                              toast.error(
                                "서버 인증서 신뢰가 필요합니다",
                                { id: toastId, duration: 5000 }
                              );
                              // 인증서 신뢰를 위한 페이지를 새 탭으로 열기
                              const apiUrl = 'https://api.winnticket.store';
                              toast.info(
                                `새 탭에서 ${apiUrl} 에 접속하여 인증서를 신뢰해주세요`,
                                { duration: 8000 }
                              );
                              // 자동으로 새 탭 열기
                              window.open(apiUrl, '_blank');
                            } else {
                              toast.error(
                                "이미지 업로드 실패",
                                { id: toastId },
                              );
                            }
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() =>
                        document
                          .getElementById("favicon-upload")
                          ?.click()
                      }
                    >
                      <Upload className="h-4 w-4" />
                      파비콘 업로드
                    </Button>
                  </div>
                )}
              </div>


              <div className="space-y-2 sm:col-span-2">
                <Label className="text-xs">채널 설명</Label>
                <Textarea
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value || undefined,
                    })
                  }
                  placeholder="채널에 대한 설명을 입력하세요"
                  rows={3}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label className="text-xs">상태</Label>
                <div className="flex items-center justify-between gap-2 bg-muted/50 rounded-lg px-4 py-3 border">
                  <span className="text-sm font-medium">
                    {formData.active ? "활성" : "비활성"}
                  </span>
                  <Switch
                    checked={formData.active}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        active: checked,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label className="text-xs">
                  카드 사용 여부
                </Label>
                <div className="flex items-center justify-between gap-2 bg-muted/50 rounded-lg px-4 py-3 border">
                  <span className="text-sm font-medium">
                    {formData.useCard
                      ? "카드 사용"
                      : "카드 미사용"}
                  </span>
                  <Switch
                    checked={formData.useCard || false}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        useCard: checked,
                      })
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  카드 형식의 UI를 사용할지 여부를 설정합니다
                </p>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label className="text-xs">
                  포인트 사용 여부
                </Label>
                <div className="flex items-center justify-between gap-2 bg-muted/50 rounded-lg px-4 py-3 border">
                  <span className="text-sm font-medium">
                    {formData.usePoint
                      ? "포인트 사용"
                      : "포인트 미사용"}
                  </span>
                  <Switch
                    checked={formData.usePoint || false}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        usePoint: checked,
                      })
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  포인트 형식의 UI를 사용할지 여부를 설정합니다
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              취소
            </Button>
            <Button onClick={handleCreate}>생성</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 채널 상세 다이얼로그 */}
      {selectedChannel && (
        <ChannelDetail
          channel={selectedChannel}
          isOpen={isDetailDialogOpen}
          onClose={() => setIsDetailDialogOpen(false)}
          onUpdate={handleUpdateChannel}
          onDelete={handleDeleteChannel}
          language={language}
          isTourActive={isTourActive}
        />
      )}

      <CoachMark steps={chTourSteps} isActive={isTourActive} onFinish={() => { setIsCreateDialogOpen(false); setIsDetailDialogOpen(false); endTour(); }} storageKey="channel_mgmt_tour" onStepChange={handleChTourStep} />
    </div>
  );
}
export default ChannelManagement;
