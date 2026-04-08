import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
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
import { ResponsiveOrderTable } from "@/components/ui/responsive-order-table";
import { TablePagination } from "@/components/common/table-pagination";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Search,
  Download,
  FileSpreadsheet,
  FileText,
  CalendarIcon,
  X,
  Clock,
  Package,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { CoachMark, useCoachMark, TourHelpButton, type TourStep } from "@/components/coach-mark";
import {
  getAdminOrders,
  getOrderStatusSummary,
  type AdminOrderListItem,
  type OrderStatusSummary,
} from "@/lib/api/order";
import type { TicketOrder } from "@/data/dto/ticket-order.dto";
import * as XLSX from "xlsx";
import { authStore } from "@/data/auth";
import { TicketUseModal } from "@/components/ticket-use-modal";
import { getChannels, type ChannelListItem } from "@/lib/api/channel";

export function AdminOrders() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // 검색 및 필터 상태
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("all");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>("all");
  const [selectedChannel, setSelectedChannel] = useState<string>("all");
  const [channels, setChannels] = useState<ChannelListItem[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // 데이터 상태
  const [orders, setOrders] = useState<AdminOrderListItem[]>([]);
  const [summary, setSummary] = useState<OrderStatusSummary | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 티켓 사용 모달 상태
  const [isTicketUseModalOpen, setIsTicketUseModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderListItem | null>(null);

  // 투어 가이드
  const orderTourSteps: TourStep[] = [
    { target: "ao-stats", title: "주문 통계", description: "전체/결제완료/취소 주문 수와 총 매출을\n한눈에 확인합니다.", placement: "bottom" },
    { target: "ao-filters", title: "검색 & 필터", description: "주문번호, 고객명, 상품명으로 검색하고\n날짜, 결제수단, 결제상태로 필터링합니다.\n내보내기로 Excel/CSV 다운로드 가능합니다.", placement: "bottom", waitForTarget: 500 },
    { target: "ao-table", title: "주문 목록", description: "주문 목록입니다. 행을 클릭하면 상세로 이동합니다.\n상품가격, 할인, 결제금액, 상태를 확인할 수 있습니다.", placement: "top", waitForTarget: 500 },
  ];

  const { isActive: isTourActive, startTour: _startTour, endTour } = useCoachMark("admin_orders_tour");

  const startTour = () => {
    if (orders.length === 0) {
      setOrders([{
        id: "dummy-order", orderNumber: "ORD-SAMPLE-001", orderedAt: new Date().toISOString(),
        customerName: "홍길동", customerPhone: "010-1234-5678",
        productName: "[투어용] 샘플 입장권", productCnt: 2,
        totalPrice: 70000, discountPrice: 0, finalPrice: 56000,
        status: "COMPLETED", paymentStatus: "PAID", paymentMethod: "CARD",
        channelName: "자체몰", partnerName: "샘플파트너", pointAmount: 0,
        allTicketUsed: false,
      } as any]);
    }
    _startTour();
  };

  // 페이징 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  // 현장관리자 여부 확인
  const currentUser = authStore.getCurrentUser();
  const isSupervisor = 
    currentUser?.userType === "supervisor" || 
    currentUser?.userType === "field-manager" ||
    currentUser?.roleId === "ROLE002"; // ⭐ 모든 현장관리자 케이스 체크
  
  console.log("🔍 [주문관리-AdminOrders] 현재 사용자:", currentUser);
  console.log("🔍 [주문관리-AdminOrders] isSupervisor:", isSupervisor);

  // URL에서 페이지 번호 읽기
  useEffect(() => {
    const page = searchParams.get('page');
    if (page) {
      const pageNum = parseInt(page, 10);
      if (!isNaN(pageNum) && pageNum > 0) {
        setCurrentPage(pageNum);
      }
    }
  }, []);

  // 페이지 변경 시 URL 업데이트
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSearchParams({ page: page.toString() });
  };

  // 데이터 로드
  const loadOrders = async () => {
    setLoading(true);
    try {
      // ⭐ 달력 필터 값을 API 파라미터로 전달
      const begDateStr = startDate
        ? startDate.toISOString().split("T")[0]
        : undefined;
      const endDateStr = endDate
        ? endDate.toISOString().split("T")[0]
        : undefined;
      const response = await getAdminOrders(0, 1000, undefined, begDateStr, endDateStr);

      if (response.success && response.data) {
        if (response.data.content && Array.isArray(response.data.content)) {
          setOrders(response.data.content);
        } else if (Array.isArray(response.data)) {
          setOrders(response.data);
        } else {
          setOrders([]);
        }
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Failed to load orders:", error);
      toast.error("주문 목록을 불러오는데 실패했습니다");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // 요약 통계 로드
  const loadSummary = async () => {
    try {
      const response = await getOrderStatusSummary();
      if (response.success && response.data) {
        setSummary(response.data);
      }
    } catch (error) {
      console.error("Failed to load summary:", error);
    }
  };

  useEffect(() => {
    loadOrders();
    loadSummary();
  }, [startDate, endDate]);

  // 채널 목록 로드
  useEffect(() => {
    (async () => {
      try {
        const res = await getChannels();
        if (res.success && res.data) {
          setChannels(res.data);
        }
      } catch (error) {
        console.error("Failed to load channels:", error);
      }
    })();
  }, []);

  // AdminOrderListItem을 TicketOrder 형태로 변환
  const convertToTicketOrder = (order: AdminOrderListItem): TicketOrder => {
    const finalPrice = typeof order.finalPrice === 'string' 
      ? parseFloat(order.finalPrice) 
      : order.finalPrice;
    
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      orderDate: order.orderedAt,
      orderStatus: mapStatusToTicketOrderStatus(order.status) as any,
      paymentStatus: mapPaymentStatus(order.paymentStatus) as any,
      paymentAmount: finalPrice,
      totalAmount: finalPrice,
      itemsTotal: order.totalPrice,
      channel: 'partner' as any,
      channelName: order.channelName,
      visible: true,
      
      ordererInfo: {
        name: order.customerName,
        phone: order.customerPhone || '',
        email: '',
        company: order.partnerName,
      },
      
      items: [{
        id: order.id,
        productId: order.id,
        productCode: '',
        productName: order.productName,
        categoryName: '',
        quantity: order.productCnt,
        unitPrice: order.totalPrice / order.productCnt,
        subtotal: order.totalPrice,
        isUsed: false,
        partnerName: order.partnerName,
      }],
      
      partnerId: '',
      partnerName: order.partnerName,
      paymentMethod: mapPaymentMethod(order.paymentMethod, order.pointAmount) as any,
      createdAt: order.orderedAt,
      updatedAt: order.orderedAt,
    };
  };

  const mapStatusToTicketOrderStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      'PENDING_PAYMENT': '입금전',
      'COMPLETED': '주문처리완료',
      'CANCEL_REQUESTED': '취소신청',
      'CANCELED': '취소완료',
      'REFUNDED': '환불완료',
      'REQUESTED': '결제요청',
    };
    return statusMap[status] || status;
  };

  const mapPaymentStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      'READY': '입금대기',
      'PAID': '결제완료',
      'FAILED': '결제실패',
      'CANCELED': '취소완료',
      'REQUESTED': 'PG에 결제 요청함',
      'REFUNDED': '환불완료',
    };
    return statusMap[status] || status;
  };

  const mapPaymentMethod = (method: string, pointAmount?: number): string => {
    const methodMap: Record<string, string> = {
      'CARD': '카드',
      'VIRTUAL_ACCOUNT': '무통장입금',
      'POINT': '베네피아 포인트',
      'GIFT': '베네피아 상품권',
      'KAKAOPAY': '카카오페이',
    };
    const label = methodMap[method] || method;
    if (pointAmount && pointAmount > 0 && method !== 'POINT') {
      return `${label}, 포인트`;
    }
    return label;
  };

  // 필터링된 주문
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (order) =>
          order.orderNumber?.toLowerCase().includes(term) ||
          order.customerName?.toLowerCase().includes(term) ||
          order.partnerName?.toLowerCase().includes(term) ||
          order.productName?.toLowerCase().includes(term)
      );
    }

    if (selectedPaymentMethod !== "all") {
      result = result.filter((order) => order.paymentMethod === selectedPaymentMethod);
    }

    if (selectedPaymentStatus !== "all") {
      result = result.filter((order) => order.paymentStatus === selectedPaymentStatus);
    }

    if (selectedChannel !== "all") {
      result = result.filter((order) => order.channelName === selectedChannel);
    }

    if (startDate) {
      result = result.filter((order) => new Date(order.orderedAt) >= startDate);
    }
    if (endDate) {
      result = result.filter((order) => new Date(order.orderedAt) <= endDate);
    }

    return result;
  }, [orders, searchTerm, selectedPaymentMethod, selectedPaymentStatus, selectedChannel, startDate, endDate]);

  // 통계 계산
  const statistics = useMemo(() => {
    const stats = {
      all: { count: 0, amount: 0 },
      READY: { count: 0, amount: 0 },
      PAID: { count: 0, amount: 0 },
      CANCELED: { count: 0, amount: 0 },
    };

    orders.forEach((order) => {
      const finalPrice = typeof order.finalPrice === 'string' 
        ? parseFloat(order.finalPrice) 
        : order.finalPrice;

      stats.all.count += 1;
      stats.all.amount += finalPrice;

      if (order.paymentStatus === 'READY') {
        stats.READY.count += 1;
        stats.READY.amount += finalPrice;
      }

      if (order.paymentStatus === 'PAID') {
        stats.PAID.count += 1;
        stats.PAID.amount += finalPrice;
      }

      if (order.status === 'CANCELED') {
        stats.CANCELED.count += 1;
        stats.CANCELED.amount += finalPrice;
      }
    });

    return stats;
  }, [orders]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, currentPage]);

  const ticketOrders = useMemo(() => {
    if (!paginatedOrders || paginatedOrders.length === 0) {
      return [];
    }
    return paginatedOrders.map(convertToTicketOrder);
  }, [paginatedOrders]);

  const handleExportCSV = () => {
    try {
      const headers = [
        "주문일",
        "주문번호",
        "주문자",
        "연락처",
        "상품명",
        "수량",
        "상품가격",
        "결제금액",
        "주문상태",
        "결제상태",
        "결제수단",
      ];

      const csvData = filteredOrders.map((order) => {
        return [
          new Date(order.orderedAt).toLocaleDateString("ko-KR"),
          order.orderNumber,
          order.customerName,
          order.customerPhone || '-',
          order.productName,
          order.productCnt,
          order.totalPrice,
          order.finalPrice,
          mapStatusToTicketOrderStatus(order.status),
          mapPaymentStatus(order.paymentStatus),
          mapPaymentMethod(order.paymentMethod),
        ].join(",");
      });

      const csvContent = [
        "\uFEFF" + headers.join(","),
        ...csvData,
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute("download", `주문목록_${new Date().toISOString().slice(0, 10)}.csv`);
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

  const handleExportExcel = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("srchWord", searchTerm);
      if (startDate) params.append("begDate", startDate.toISOString().slice(0, 10));
      if (endDate) params.append("endDate", endDate.toISOString().slice(0, 10));
      if (selectedPaymentStatus !== "all") params.append("status", selectedPaymentStatus);
      if (selectedChannel !== "all") {
        const ch = channels.find((c) => c.name === selectedChannel);
        if (ch?.id) params.append("channelId", ch.id);
      }

      const token = localStorage.getItem("access_token") ||
        (() => { try { return JSON.parse(localStorage.getItem("erp_auth") || "{}").accessToken; } catch { return null; } })();

      const { getApiBaseUrl } = await import("@/lib/config");
      const baseUrl = getApiBaseUrl();
      const url = `${baseUrl}/admin/order/export${params.toString() ? "?" + params.toString() : ""}`;

      const response = await fetch(url, {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) throw new Error("서버 오류");

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `주문목록_${new Date().toISOString().slice(0, 10)}.xls`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      toast.success("Excel 파일이 다운로드되었습니다.");
    } catch (error) {
      toast.error("Excel 내보내기에 실패했습니다.");
      console.error(error);
    }
  };

  const openDetailDialog = (order: TicketOrder) => {
    navigate(`/admin/orders/${order.id}`);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="주문 관리"
        subtitle="쇼핑몰 주문 내역을 조회하고 관리합니다"
        language="ko"
        rightContent={
          <TourHelpButton onClick={startTour} />
        }
      />

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4" data-tour="ao-stats">
        {/* 전체 */}
        <button
          onClick={() => {
            setSelectedPaymentMethod('all');
            setSelectedPaymentStatus('all');
            setCurrentPage(1);
          }}
          className="bg-card rounded-[8px] p-4 md:p-5 border border-border hover:bg-accent transition-colors cursor-pointer text-left w-full touch-manipulation"
        >
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-md bg-gray-500/10 flex items-center justify-center">
                <Package className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-500" />
              </div>
              <h3 className="text-[12px] md:text-[13px] text-muted-foreground">전체</h3>
            </div>
          </div>
          <div className="space-y-0.5 md:space-y-1">
            <p className="text-[20px] md:text-[24px] font-semibold">{statistics.all.count}건</p>
            <p className="text-[11px] md:text-[13px] text-muted-foreground truncate">
              ₩{formatCurrency(statistics.all.amount)}
            </p>
          </div>
        </button>

        {/* 입금전 */}
        <button
          onClick={() => {
            setSelectedPaymentStatus('READY');
            setCurrentPage(1);
          }}
          className="bg-card rounded-[8px] p-4 md:p-5 border border-border hover:bg-accent transition-colors cursor-pointer text-left w-full touch-manipulation"
        >
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-md bg-orange-500/10 flex items-center justify-center">
                <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-orange-500" />
              </div>
              <h3 className="text-[12px] md:text-[13px] text-muted-foreground">입금전</h3>
            </div>
          </div>
          <div className="space-y-0.5 md:space-y-1">
            <p className="text-[20px] md:text-[24px] font-semibold">{statistics.READY.count}건</p>
            <p className="text-[11px] md:text-[13px] text-muted-foreground truncate">
              ₩{formatCurrency(statistics.READY.amount)}
            </p>
          </div>
        </button>

        {/* 결제완료 */}
        <button
          onClick={() => {
            setSelectedPaymentStatus('PAID');
            setCurrentPage(1);
          }}
          className="bg-card rounded-[8px] p-4 md:p-5 border border-border hover:bg-accent transition-colors cursor-pointer text-left w-full touch-manipulation"
        >
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-md bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-500" />
              </div>
              <h3 className="text-[12px] md:text-[13px] text-muted-foreground">결제완료</h3>
            </div>
          </div>
          <div className="space-y-0.5 md:space-y-1">
            <p className="text-[20px] md:text-[24px] font-semibold">{statistics.PAID.count}건</p>
            <p className="text-[11px] md:text-[13px] text-muted-foreground truncate">
              ₩{formatCurrency(statistics.PAID.amount)}
            </p>
          </div>
        </button>

        {/* 취소완료 */}
        <button
          onClick={() => {
            setSelectedPaymentStatus('CANCELED');
            setCurrentPage(1);
          }}
          className="bg-card rounded-[8px] p-4 md:p-5 border border-border hover:bg-accent transition-colors cursor-pointer text-left w-full touch-manipulation"
        >
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-md bg-red-500/10 flex items-center justify-center">
                <XCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-red-500" />
              </div>
              <h3 className="text-[12px] md:text-[13px] text-muted-foreground">취소완료</h3>
            </div>
          </div>
          <div className="space-y-0.5 md:space-y-1">
            <p className="text-[20px] md:text-[24px] font-semibold">{statistics.CANCELED.count}건</p>
            <p className="text-[11px] md:text-[13px] text-muted-foreground truncate">
              ₩{formatCurrency(statistics.CANCELED.amount)}
            </p>
          </div>
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-card relative rounded-[8px] flex-1 flex flex-col">
        <div
          aria-hidden="true"
          className="absolute border border-border border-solid inset-0 pointer-events-none rounded-[8px]"
        />

        <div className="box-border content-stretch flex flex-col gap-[20px] items-start px-[32px] py-[20px] flex-1 overflow-hidden">
          {/* Filters */}
          <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-tour="ao-filters">
            <div className="content-stretch flex items-end justify-between relative shrink-0 w-full flex-wrap gap-3">
              <div className="flex items-end gap-3 flex-wrap flex-1 w-full">
                {/* Search */}
                <div className="bg-background box-border content-stretch flex gap-[8px] h-[40px] md:h-[36px] items-center px-[16px] py-[8px] relative rounded-[6px] shrink-0 w-full md:w-[300px] focus-within:shadow-[0_0_0_1px_#0c8ce9] transition-shadow">
                  <div
                    aria-hidden="true"
                    className="absolute border border-border border-solid inset-0 pointer-events-none rounded-[6px]"
                  />
                  <Search className="h-[18px] w-[18px] text-muted-foreground flex-shrink-0" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="주문번호, 주문자, 회사명, 상품명으로 검색..."
                    className="text-[13px] md:text-[12px] text-muted-foreground placeholder:text-muted-foreground bg-transparent border-none outline-none flex-1 min-w-0"
                  />
                </div>

                {/* 시작일 */}
                <div className="flex flex-col gap-1.5 w-full sm:w-[calc(50%-6px)] md:w-[140px]">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-[40px] md:h-[36px] text-[13px] justify-start text-left font-normal w-full"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{startDate ? startDate.toLocaleDateString('ko-KR') : "시작일"}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* 종료일 */}
                <div className="flex flex-col gap-1.5 w-full sm:w-[calc(50%-6px)] md:w-[140px]">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-[40px] md:h-[36px] text-[13px] justify-start text-left font-normal w-full"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{endDate ? endDate.toLocaleDateString('ko-KR') : "종료일"}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* 채널 선택 */}
                <div className="flex flex-col gap-1.5 w-full sm:w-[calc(50%-6px)] md:w-[140px]">
                  <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                    <SelectTrigger className="h-[40px] md:h-[36px] text-[13px] w-full">
                      <SelectValue placeholder="채널" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체 채널</SelectItem>
                      {channels.map((ch) => (
                        <SelectItem key={ch.id} value={ch.name}>
                          {ch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 결제수단 선택 */}
                <div className="flex flex-col gap-1.5 w-full sm:w-[calc(50%-6px)] md:w-[140px]">
                  <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                    <SelectTrigger className="h-[40px] md:h-[36px] text-[13px] w-full">
                      <SelectValue placeholder="결제수단" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="CARD">카드</SelectItem>
                      <SelectItem value="VIRTUAL_ACCOUNT">무통장입금</SelectItem>
                      <SelectItem value="POINT">베네피아 포인트</SelectItem>
                      <SelectItem value="GIFT">베네피아 상품권</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 결제상태 선택 */}
                <div className="flex flex-col gap-1.5 w-full sm:w-[calc(50%-6px)] md:w-[140px]">
                  <Select value={selectedPaymentStatus} onValueChange={setSelectedPaymentStatus}>
                    <SelectTrigger className="h-[40px] md:h-[36px] text-[13px] w-full">
                      <SelectValue placeholder="결제상태" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="READY">입금대기</SelectItem>
                      <SelectItem value="PAID">결제완료</SelectItem>
                      <SelectItem value="FAILED">결제실패</SelectItem>
                      <SelectItem value="CANCELED">취소완료</SelectItem>
                      <SelectItem value="REQUESTED">PG 결제 요청</SelectItem>
                      <SelectItem value="REFUNDED">환불완료</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 필터 초기화 버튼 */}
                {(selectedPaymentMethod !== "all" || selectedPaymentStatus !== "all" || selectedChannel !== "all" || startDate || endDate) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedPaymentMethod("all");
                      setSelectedPaymentStatus("all");
                      setSelectedChannel("all");
                      setStartDate(undefined);
                      setEndDate(undefined);
                    }}
                    className="h-[40px] md:h-[36px] w-full sm:w-auto self-end"
                  >
                    <X className="h-4 w-4 mr-1" />
                    초기화
                  </Button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end w-full md:w-auto">
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
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full flex-1 overflow-auto" data-tour="ao-table">
            <ResponsiveOrderTable
              orders={ticketOrders}
              onEdit={() => {}}
              onDelete={() => {}}
              onViewDetail={openDetailDialog}
              onTicketClick={isSupervisor ? (order) => {
                setSelectedOrder(order as any);
                setIsTicketUseModalOpen(true);
              } : undefined}
              isSupervisor={isSupervisor}
              showActions={false}
              getOrderStatusBadgeVariant={(status) => {
                const statusMap: Record<string, any> = {
                  '입금전': 'secondary',
                  '배송대기중': 'default',
                  '배송준비중': 'default',
                  '배송완료': 'default',
                  '주문처리완료': 'default',
                  '취소신청': 'destructive',
                  '취소완료': 'secondary',
                  '환불완료': 'secondary',
                };
                return statusMap[status] || 'secondary';
              }}
              getPaymentStatusBadgeVariant={(status) => {
                const statusMap: Record<string, any> = {
                  '입금대기': 'secondary',
                  '입금완료': 'default',
                  '결제완료': 'default',
                  '환불완료': 'secondary',
                  '부분환불': 'secondary',
                };
                return statusMap[status] || 'secondary';
              }}
            />
          </div>

          {/* Pagination */}
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {/* 티켓 사용 모달 */}
      <TicketUseModal
        isOpen={isTicketUseModalOpen}
        onClose={() => setIsTicketUseModalOpen(false)}
        order={selectedOrder}
      />

      <CoachMark steps={orderTourSteps} isActive={isTourActive} onFinish={endTour} storageKey="admin_orders_tour" />
    </div>
  );
}
export default AdminOrders;
