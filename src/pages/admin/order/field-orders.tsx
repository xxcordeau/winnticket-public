import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/page-header";
import { toast } from "sonner";
import { TablePagination } from "@/components/common/table-pagination";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Search,
  CalendarIcon,
  X,
  Download,
  FileSpreadsheet,
  FileText,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  HelpCircle,
} from "lucide-react";
import { CoachMark, useCoachMark, type TourStep } from "@/components/coach-mark";
import {
  getFieldOrders,
  getFieldOrderStatus,
  useFieldTicket,
  type FieldOrderListItem,
  type FieldOrderStatus,
} from "@/lib/api/order";
import * as XLSX from "xlsx";
import { FieldOrderDetailModal } from "@/components/field-order-detail-modal";

// 현장관리자 코치마크 투어 스텝
const fieldOrderTourSteps: TourStep[] = [
  {
    target: "search-bar",
    title: "검색",
    description: "주문번호, 이름, 상품명, 쿠폰번호로\n원하는 주문을 빠르게 검색할 수 있습니다.",
    placement: "bottom",
  },
  {
    target: "date-filter",
    title: "날짜 필터",
    description: "시작일과 종료일을 설정하여\n특정 기간의 주문만 조회할 수 있습니다.",
    placement: "bottom",
  },
  {
    target: "status-filter",
    title: "상태 필터",
    description: "사용가능, 사용완료, 취소, 기간만료 등\n상태별로 주문을 필터링할 수 있습니다.",
    placement: "bottom",
  },
  {
    target: "export-btn",
    title: "내보내기",
    description: "내보내기를 클릭하면 현재 조회된 데이터를\nExcel(.xlsx) 또는 CSV(.csv) 파일로\n추출할 수 있습니다.",
    placement: "bottom",
  },
  {
    target: "order-number-col",
    title: "주문번호",
    description: "주문번호를 클릭하면 주문 상세를 확인할 수 있고,\n상대방의 주문번호와 대조해볼 수 있습니다.\n좌우로 스크롤하여 다른 정보도 확인 가능합니다.",
    placement: "bottom",
  },
  {
    target: "status-col",
    title: "상태",
    description: "현재 티켓의 상태를 확인할 수 있습니다.\n\n사용가능: 아직 사용하지 않은 티켓\n사용완료: 이미 사용 처리된 티켓\n취소: 취소된 주문\n기간만료: 유효기간이 지난 티켓",
    placement: "left",
  },
  {
    target: "table-row",
    title: "주문 상세 보기",
    description: "행을 클릭하면 티켓 모달이 열립니다.\n다음 버튼을 누르면 모달이 열리면서\n기능을 하나씩 안내합니다.",
    placement: "bottom",
  },
  // --- 모달 내부 투어 스텝 ---
  {
    target: "modal-use-ticket",
    title: "사용 처리",
    description: "녹색 체크 아이콘을 클릭하면\n티켓을 사용완료로 처리합니다.\n이미 사용된 티켓은 회색으로 표시됩니다.",
    placement: "bottom",
    waitForTarget: 1500,
  },
  {
    target: "modal-ticket-number",
    title: "티켓번호 확인",
    description: "해당 티켓의 고유번호입니다.\n고객이 제시한 쿠폰번호와\n대조하여 확인할 수 있습니다.",
    placement: "left",
    waitForTarget: 500,
  },
  {
    target: "modal-order-number",
    title: "주문번호 확인",
    description: "주문 시 발급된 주문번호입니다.\n고객의 주문번호와 대조하여\n본인 확인에 활용할 수 있습니다.",
    placement: "left",
    waitForTarget: 500,
  },
  {
    target: "modal-ticket-nav",
    title: "티켓 넘기기",
    description: "좌우 화살표를 눌러 여러 티켓 간\n이동할 수 있습니다.\n현재/전체 매수와 미사용·사용 현황도\n한눈에 확인 가능합니다.",
    placement: "bottom",
    waitForTarget: 500,
  },
  {
    target: "modal-close-btn",
    title: "닫기",
    description: "확인이 끝나면 닫기 버튼을 눌러\n모달을 닫을 수 있습니다.",
    placement: "top",
    waitForTarget: 500,
  },
];

// 모달 내부 투어 스텝 시작 인덱스
const MODAL_TOUR_START_INDEX = 7;

// 투어용 더미 주문 데이터 (실제 데이터가 없을 때 사용)
const DUMMY_ORDER: FieldOrderListItem = {
  ticketId: "tour-demo-ticket",
  orderId: "tour-demo-order",
  orderNumber: "W00000000000000000",
  productName: "[체험] 투어 안내용 샘플 상품",
  orderedAt: new Date().toISOString(),
  unitPrice: 10000,
  supplyPrice: 8000,
  couponNumber: "TOUR-SAMPLE-001",
  validFrom: new Date().toISOString().split("T")[0],
  validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  partnerName: "샘플업체",
  customerName: "홍길동",
  customerPhone: "010-0000-0000",
  ticketSentDate: null,
  ticketUsedDate: null,
  canceledAt: null,
  ticketStatus: "사용가능",
  processedAt: null,
};

export function FieldOrders() {
  const [searchParams, setSearchParams] = useSearchParams();

  const tableScrollRef = useRef<HTMLDivElement>(null);

  // 코치마크 상태
  const { isActive: isTourActive, startTour, endTour } = useCoachMark(
    "field-orders-tour",
    true, // 첫 방문 시 자동 시작
  );

  // 검색 및 필터 상태
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // 데이터 상태
  const [orders, setOrders] = useState<FieldOrderListItem[]>([]);
  const [statusData, setStatusData] = useState<FieldOrderStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // 모달 상태
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<FieldOrderListItem | null>(null);

  // 투어 스텝 변경 시 모달 열기/닫기 제어
  const handleTourStepChange = useCallback((stepIndex: number) => {
    if (stepIndex >= MODAL_TOUR_START_INDEX) {
      // 모달 투어 구간 → 첫 번째 주문 또는 더미로 모달 열기
      if (!isDetailOpen) {
        setSelectedOrder(orders.length > 0 ? orders[0] : DUMMY_ORDER);
        setIsDetailOpen(true);
      }
    } else {
      // 모달 밖 투어 구간 → 모달 닫기
      if (isDetailOpen) {
        setIsDetailOpen(false);
      }
    }
  }, [isDetailOpen, orders]);

  // 페이징 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // URL에서 페이지 번호 읽기
  useEffect(() => {
    const page = searchParams.get("page");
    if (page) {
      const pageNum = parseInt(page, 10);
      if (!isNaN(pageNum) && pageNum > 0) setCurrentPage(pageNum);
    }
  }, []);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSearchParams({ page: page.toString() });
  };

  // 데이터 로드
  const loadOrders = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (searchTerm.trim()) params.srchWord = searchTerm.trim();
      if (startDate) params.begDate = formatDate(startDate);
      if (endDate) params.endDate = formatDate(endDate);
      if (selectedStatus !== "ALL") params.status = selectedStatus;

      const [ordersRes, statusRes] = await Promise.all([
        getFieldOrders(params),
        getFieldOrderStatus(params),
      ]);

      if (ordersRes.success && ordersRes.data) {
        setOrders(ordersRes.data);
      } else {
        setOrders([]);
      }

      if (statusRes.success && statusRes.data) {
        setStatusData(statusRes.data);
      }
    } catch (error) {
      console.error("Failed to load orders:", error);
      toast.error("주문 목록을 불러오는데 실패했습니다");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // 필터/검색 변경 시 자동 검색 (디바운스)
  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrders();
    }, searchTerm ? 400 : 0);
    return () => clearTimeout(timer);
  }, [selectedStatus, startDate, endDate, searchTerm]);

  const formatDate = (date: Date): string => date.toISOString().split("T")[0];

  const formatDateTime = (dateStr: string | null): string => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const formatCurrency = (value: number) => value?.toLocaleString() || "0";

  // 티켓 사용 처리
  const handleUseTicket = async (orderId: string, ticketId: string) => {
    if (!confirm("이 티켓을 사용완료 처리하시겠습니까?")) return;
    try {
      const res = await useFieldTicket(orderId, ticketId);
      if (res.success) {
        toast.success("티켓 사용 처리 완료");
        loadOrders();
      } else {
        toast.error(res.message || "처리 실패");
      }
    } catch {
      toast.error("티켓 사용 처리에 실패했습니다");
    }
  };

  // 상태별 badge
  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      "사용완료": "bg-blue-50 text-blue-600",
      "사용가능": "bg-green-50 text-green-600",
      "취소": "bg-red-50 text-red-600",
      "기간만료": "bg-gray-100 text-gray-500",
    };
    return map[status] || "bg-gray-100 text-gray-500";
  };

  // 통계
  const statistics = useMemo(() => {
    const stats = {
      all: { count: 0, label: "전체" },
      used: { count: 0, label: "사용완료" },
      unused: { count: 0, label: "사용가능" },
      canceled: { count: 0, label: "취소" },
    };
    orders.forEach((o) => {
      stats.all.count++;
      if (o.ticketStatus === "사용완료") stats.used.count++;
      else if (o.ticketStatus === "사용가능") stats.unused.count++;
      else if (o.ticketStatus === "취소") stats.canceled.count++;
    });
    return stats;
  }, [orders]);

  // 엑셀 내보내기
  const handleExportExcel = () => {
    try {
      const headers = ["번호", "주문번호", "상품명", "예약일자", "판매가", "공급가", "쿠폰번호", "유효기간(시작)", "유효기간(종료)", "회사/관명", "이름", "휴대폰번호", "발송일시", "사용일시", "취소일시", "상태", "처리일시"];
      const data = orders.map((o, i) => [
        i + 1, o.orderNumber, o.productName, formatDateTime(o.orderedAt),
        o.unitPrice, o.supplyPrice, o.couponNumber || "", o.validFrom || "", o.validTo || "",
        o.partnerName, o.customerName, o.customerPhone,
        formatDateTime(o.ticketSentDate), formatDateTime(o.ticketUsedDate),
        formatDateTime(o.canceledAt), o.ticketStatus, formatDateTime(o.processedAt),
      ]);
      const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
      ws["!cols"] = headers.map(() => ({ wch: 16 }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "주문관리");
      XLSX.writeFile(wb, `주문관리_${formatDate(new Date())}.xlsx`);
      toast.success("Excel 파일이 다운로드되었습니다.");
    } catch {
      toast.error("Excel 내보내기에 실패했습니다.");
    }
  };

  const handleExportCSV = () => {
    try {
      const headers = ["번호", "주문번호", "상품명", "판매가", "공급가", "쿠폰번호", "회사/관명", "이름", "휴대폰번호", "상태"];
      const csvData = orders.map((o, i) => [i + 1, o.orderNumber, o.productName, o.unitPrice, o.supplyPrice, o.couponNumber || "", o.partnerName, o.customerName, o.customerPhone, o.ticketStatus].join(","));
      const csvContent = ["\uFEFF" + headers.join(","), ...csvData].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.setAttribute("href", URL.createObjectURL(blob));
      link.setAttribute("download", `주문관리_${formatDate(new Date())}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV 파일이 다운로드되었습니다.");
    } catch {
      toast.error("CSV 내보내기에 실패했습니다.");
    }
  };

  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    const s = (currentPage - 1) * itemsPerPage;
    return orders.slice(s, s + itemsPerPage);
  }, [orders, currentPage]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="주문 관리"
        subtitle="주문 내역을 조회하고 관리합니다"
        language="ko"
      />

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <button
          onClick={() => { setSelectedStatus("ALL"); setCurrentPage(1); }}
          className="bg-card rounded-[8px] p-4 md:p-5 border border-border hover:bg-accent transition-colors cursor-pointer text-left w-full touch-manipulation"
        >
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-md bg-gray-500/10 flex items-center justify-center">
              <Package className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-500" />
            </div>
            <h3 className="text-[12px] md:text-[13px] text-muted-foreground">전체</h3>
          </div>
          <div className="space-y-0.5">
            <p className="text-[20px] md:text-[24px] font-semibold">{statusData ? statusData.totalTicketCnt : statistics.all.count}건</p>
            <p className="text-[11px] md:text-[13px] text-muted-foreground">
              {statusData ? `₩${formatCurrency(statusData.totalSalesPrice)}` : ""}
            </p>
          </div>
        </button>

        <button
          onClick={() => { setSelectedStatus("UNUSED"); setCurrentPage(1); }}
          className="bg-card rounded-[8px] p-4 md:p-5 border border-border hover:bg-accent transition-colors cursor-pointer text-left w-full touch-manipulation"
        >
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-md bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-500" />
            </div>
            <h3 className="text-[12px] md:text-[13px] text-muted-foreground">사용가능</h3>
          </div>
          <div className="space-y-0.5">
            <p className="text-[20px] md:text-[24px] font-semibold">{statistics.unused.count}건</p>
          </div>
        </button>

        <button
          onClick={() => { setSelectedStatus("USED"); setCurrentPage(1); }}
          className="bg-card rounded-[8px] p-4 md:p-5 border border-border hover:bg-accent transition-colors cursor-pointer text-left w-full touch-manipulation"
        >
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-md bg-orange-500/10 flex items-center justify-center">
              <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-orange-500" />
            </div>
            <h3 className="text-[12px] md:text-[13px] text-muted-foreground">사용완료</h3>
          </div>
          <div className="space-y-0.5">
            <p className="text-[20px] md:text-[24px] font-semibold">{statistics.used.count}건</p>
          </div>
        </button>

        <button
          onClick={() => { setSelectedStatus("CANCELED"); setCurrentPage(1); }}
          className="bg-card rounded-[8px] p-4 md:p-5 border border-border hover:bg-accent transition-colors cursor-pointer text-left w-full touch-manipulation"
        >
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-md bg-red-500/10 flex items-center justify-center">
              <XCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-red-500" />
            </div>
            <h3 className="text-[12px] md:text-[13px] text-muted-foreground">취소</h3>
          </div>
          <div className="space-y-0.5">
            <p className="text-[20px] md:text-[24px] font-semibold">{statistics.canceled.count}건</p>
          </div>
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-card relative rounded-[8px] flex-1 flex flex-col">
        <div aria-hidden="true" className="absolute border border-border border-solid inset-0 pointer-events-none rounded-[8px]" />

        <div className="box-border content-stretch flex flex-col gap-[20px] items-start px-[32px] py-[20px] flex-1 overflow-hidden">
          {/* Filters */}
          <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
            <div className="content-stretch flex items-end justify-between relative shrink-0 w-full flex-wrap gap-3">
              <div className="flex items-end gap-3 flex-wrap flex-1 w-full">
                {/* Search */}
                <div data-tour="search-bar" className="bg-background box-border content-stretch flex gap-[8px] h-[40px] md:h-[36px] items-center px-[16px] py-[8px] relative rounded-[6px] shrink-0 w-full md:w-[300px] focus-within:shadow-[0_0_0_1px_#0c8ce9] transition-shadow">
                  <div aria-hidden="true" className="absolute border border-border border-solid inset-0 pointer-events-none rounded-[6px]" />
                  <Search className="h-[18px] w-[18px] text-muted-foreground flex-shrink-0" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}

                    placeholder="주문번호, 이름, 상품명, 쿠폰번호로 검색..."
                    className="text-[13px] md:text-[12px] text-muted-foreground placeholder:text-muted-foreground bg-transparent border-none outline-none flex-1 min-w-0"
                  />
                </div>

                {/* 시작일 */}
                <div data-tour="date-filter" className="flex flex-col gap-1.5 w-full sm:w-[calc(50%-6px)] md:w-[140px]">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="h-[40px] md:h-[36px] text-[13px] justify-start text-left font-normal w-full">
                        <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{startDate ? startDate.toLocaleDateString("ko-KR") : "시작일"}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* 종료일 */}
                <div className="flex flex-col gap-1.5 w-full sm:w-[calc(50%-6px)] md:w-[140px]">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="h-[40px] md:h-[36px] text-[13px] justify-start text-left font-normal w-full">
                        <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{endDate ? endDate.toLocaleDateString("ko-KR") : "종료일"}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* 상태 필터 */}
                <div data-tour="status-filter" className="flex flex-col gap-1.5 w-full sm:w-[calc(50%-6px)] md:w-[140px]">
                  <Select value={selectedStatus} onValueChange={(v) => { setSelectedStatus(v); setCurrentPage(1); }} >
                    <SelectTrigger className="h-[40px] md:h-[36px] text-[13px] w-full">
                      <SelectValue placeholder="쿠폰상태" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">전체</SelectItem>
                      <SelectItem value="UNUSED">사용가능</SelectItem>
                      <SelectItem value="USED">사용완료</SelectItem>
                      <SelectItem value="CANCELED">취소</SelectItem>
                      <SelectItem value="EXPIRED">기간만료</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 필터 초기화 */}
                {(selectedStatus !== "ALL" || startDate || endDate || searchTerm) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedStatus("ALL");
                      setStartDate(undefined);
                      setEndDate(undefined);
                      setCurrentPage(1);
                    }}
                    className="h-[40px] md:h-[36px] w-full sm:w-auto self-end"
                  >
                    <X className="h-4 w-4 mr-1" />
                    초기화
                  </Button>
                )}
              </div>

              {/* 내보내기 */}
              <div data-tour="export-btn" className="flex items-center gap-2 self-end w-full md:w-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 h-[40px] md:h-[36px] w-full md:w-auto">
                      <Download className="h-4 w-4" />
                      <span>내보내기</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleExportExcel}>
                      <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                      Excel (.xlsx)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportCSV}>
                      <FileText className="h-4 w-4 mr-2 text-blue-600" />
                      CSV (.csv)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Table */}
          <div ref={tableScrollRef} className="content-stretch flex flex-col items-start relative shrink-0 w-full flex-1 overflow-auto">
            <table className="w-full text-[13px]" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr className="h-[46px] bg-[#f8f9fa]">
                  {[
                    { label: "번호", w: "w-[60px]", tour: "" },
                    { label: "주문번호", w: "w-[200px]", tour: "order-number-col" },
                    { label: "상품명", w: "w-[280px]", tour: "" },
                    { label: "예약일자", w: "w-[140px]", tour: "" },
                    { label: "판매가", w: "w-[100px]", tour: "" },
                    { label: "공급가", w: "w-[100px]", tour: "" },
                    { label: "쿠폰번호", w: "w-[140px]", tour: "" },
                    { label: "유효기간", w: "w-[200px]", tour: "" },
                    { label: "회사/관명", w: "w-[140px]", tour: "" },
                    { label: "이름", w: "w-[90px]", tour: "" },
                    { label: "휴대폰번호", w: "w-[140px]", tour: "" },
                    { label: "발송일시", w: "w-[140px]", tour: "" },
                    { label: "사용일시", w: "w-[140px]", tour: "" },
                    { label: "취소일시", w: "w-[140px]", tour: "" },
                    { label: "상태", w: "w-[120px]", tour: "status-col" },
                    { label: "처리일시", w: "w-[140px]", tour: "" },
                  ].map((col, i) => (
                    <th key={col.label} className={`${col.w} shrink-0 h-full`} {...(col.tour ? { "data-tour": col.tour } : {})}>
                      <div className="flex h-full items-center justify-between pl-[20px] pr-0">
                        <p className="text-[13px] text-nowrap whitespace-pre font-medium text-muted-foreground">{col.label}</p>
                        <div className="shrink-0 w-[28px] flex items-center justify-end">
                          <div className="h-[16px] w-px bg-border" />
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={16} className="text-center py-16 text-muted-foreground">로딩 중...</td>
                  </tr>
                ) : paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="text-center py-16 text-muted-foreground">데이터가 없습니다</td>
                  </tr>
                ) : (
                  paginatedOrders.map((order, index) => {
                    const rowNum = orders.length - ((currentPage - 1) * itemsPerPage + index);
                    const isEvenPair = index % 2 === 1;
                    return (
                      <tr
                        key={order.ticketId}
                        className={`h-[48px] hover:bg-accent/50 transition-colors cursor-pointer ${isEvenPair ? "bg-muted/30" : ""}`}
                        onClick={() => { setSelectedOrder(order); setIsDetailOpen(true); }}
                        {...(index === 0 ? { "data-tour": "table-row" } : {})}
                      >
                        <td className="pl-[20px] text-muted-foreground whitespace-nowrap">{rowNum}</td>
                        <td className="pl-[20px] font-mono text-[13px] text-primary whitespace-nowrap">
                          {order.orderNumber}
                        </td>
                        <td className="pl-[20px] max-w-[280px] truncate" title={order.productName}>
                          {order.productName}
                        </td>
                        <td className="pl-[20px] whitespace-nowrap">{formatDateTime(order.orderedAt)}</td>
                        <td className="pl-[20px] tabular-nums whitespace-nowrap">{formatCurrency(order.unitPrice)}</td>
                        <td className="pl-[20px] tabular-nums whitespace-nowrap">{formatCurrency(order.supplyPrice)}</td>
                        <td className="pl-[20px] font-mono text-[13px] whitespace-nowrap">{order.couponNumber || "-"}</td>
                        <td className="pl-[20px] whitespace-nowrap">
                          {order.validFrom && order.validTo ? `${order.validFrom} ~ ${order.validTo}` : "-"}
                        </td>
                        <td className="pl-[20px] whitespace-nowrap">{order.partnerName}</td>
                        <td className="pl-[20px] whitespace-nowrap">{order.customerName}</td>
                        <td className="pl-[20px] whitespace-nowrap">{order.customerPhone}</td>
                        <td className="pl-[20px] whitespace-nowrap">{formatDateTime(order.ticketSentDate)}</td>
                        <td className="pl-[20px] whitespace-nowrap">{formatDateTime(order.ticketUsedDate)}</td>
                        <td className="pl-[20px] whitespace-nowrap">{formatDateTime(order.canceledAt)}</td>
                        <td className="px-[20px] whitespace-nowrap text-center">
                          <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded text-[12px] font-medium ${getStatusBadge(order.ticketStatus)}`}>
                            {order.ticketStatus}
                          </span>
                        </td>
                        <td className="pl-[20px] whitespace-nowrap">{formatDateTime(order.processedAt)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {/* 주문 상세 모달 */}
      <FieldOrderDetailModal
        order={selectedOrder}
        isOpen={isDetailOpen}
        onClose={() => { if (!isTourActive) setIsDetailOpen(false); }}
        onUpdate={loadOrders}
        preventOutsideInteraction={isTourActive}
      />

      {/* 코치마크 투어 */}
      <CoachMark
        steps={fieldOrderTourSteps}
        isActive={isTourActive}
        onFinish={() => {
          setIsDetailOpen(false);
          endTour();
          // 테이블 스크롤을 처음으로 되돌리기
          if (tableScrollRef.current) tableScrollRef.current.scrollLeft = 0;
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        storageKey="field-orders-tour"
        onStepChange={handleTourStepChange}
      />

      {/* 도움말 토글 버튼 (우측 하단 FAB) */}
      {!isTourActive && (
        <button
          onClick={startTour}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
          title="가이드 투어 보기"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

export default FieldOrders;
