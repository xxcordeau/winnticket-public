import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Package,
  Building2,
  Ticket,
  ShoppingCart,
  RefreshCw,
  Download,
  FileSpreadsheet,
  FileText,
  Clock,
  Menu,
  PackageCheck,
  PackagePlus,
  Users,
  UserCheck,
  UserMinus,
  Calendar,
  XCircle,
} from "lucide-react";
import { CoachMark, useCoachMark, TourHelpButton, type TourStep } from "@/components/coach-mark";
import { PageHeader } from "@/components/page-header";
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
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { toast } from "sonner";
import { getAdminDashboard } from "@/lib/api/admin";
import type { DashboardData, DashboardPeriod } from "@/lib/api/admin";

type Language = "ko" | "en";

interface DashboardProps {
  language: Language;
}

export function Dashboard({ language }: DashboardProps) {
  const navigate = useNavigate();
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [timePeriod, setTimePeriod] = useState<DashboardPeriod>("week");
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  const title = language === "ko" ? "대시보드" : "Dashboard";
  const description =
    language === "ko"
      ? "티켓 판매 시스템 현황을 한눈에 확인하세요."
      : "View your ticket sales system overview at a glance.";

  // 투어 가이드
  const tourSteps: TourStep[] = [
    {
      target: "header-shop",
      title: "쇼핑몰 바로가기",
      description: "등록된 채널별 쇼핑몰 페이지로 바로 이동할 수 있습니다.\n자체몰과 연동된 채널 쇼핑몰을 확인하세요.",
      placement: "bottom",
    },
    {
      target: "header-status",
      title: "서버 통신 상태",
      description: "백엔드 서버와의 연결 상태를 실시간으로 표시합니다.\n초록색이면 정상, 빨간색이면 연결 끊김 상태입니다.",
      placement: "bottom",
    },
    {
      target: "dashboard-stats",
      title: "통계 카드",
      description: "전체 상품, 판매중, 준비중, 파트너 수 등\n핵심 지표를 한눈에 확인할 수 있습니다.\n카드를 클릭하면 해당 관리 페이지로 이동합니다.",
      placement: "bottom",
    },
    {
      target: "dashboard-period",
      title: "기간 필터링",
      description: "주간, 월간, 연간 단위로 대시보드 데이터를 필터링합니다.\n선택한 기간에 따라 차트와 통계가 변경됩니다.",
      placement: "bottom",
    },
    {
      target: "dashboard-export",
      title: "내보내기",
      description: "대시보드 데이터를 Excel(.xls) 또는 CSV 파일로 다운로드할 수 있습니다.",
      placement: "bottom",
    },
    {
      target: "dashboard-refresh",
      title: "새로고침",
      description: "최신 데이터로 대시보드를 새로고침합니다.\n하단에 마지막 업데이트 시각이 표시됩니다.",
      placement: "bottom",
    },
  ];

  const { isActive: isTourActive, startTour, endTour } = useCoachMark("dashboard_tour");

  // 데이터 로드 함수 - period를 직접 인자로 받아서 클로저 문제 방지
  const loadDashboardData = async (period: DashboardPeriod, signal?: AbortSignal) => {
    setIsLoading(true);

    try {
      console.log("📊 [대시보드] 기간:", period);
      const response = await getAdminDashboard(period);

      if (signal?.aborted) {
        return;
      }

      if (response.success && response.data) {
        setDashboardData(response.data);
        console.log("✅ [대시보드] 데이터 로드 성공, period:", period);
      } else {
        console.warn("⚠️ [대시보드] 데이터 로드 실패:", response.message);
        toast.error(response.message || "대시보드 데이터를 불러올 수 없습니다.");
      }
    } catch (error) {
      console.error("❌ [대시보드] 데이터 로드 에러:", error);
      toast.error("대시보드 데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  };

  // 컴포넌트 마운트 시 및 timePeriod 변경 시 데이터 로드
  useEffect(() => {
    const controller = new AbortController();
    loadDashboardData(timePeriod, controller.signal);

    return () => {
      controller.abort();
    };
  }, [timePeriod]);

  const handleRefresh = () => {
    setLastUpdate(new Date());
    loadDashboardData(timePeriod);
  };

  const formatDateTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR").format(amount);
  };

  // 파트너별 매출 차트 데이터 (API 기반)
  const partnerSalesData =
    dashboardData?.partnerSales.map((item) => ({
      name: item.partnerName,
      상품수: item.productCount,
      매출: Math.round(item.salesAmount / 10000), // 만원 단위
      순이익: Math.round(item.netProfit / 10000), // 만원 단위
      주문: item.orderCount,
    })) || [];

  // 카테고리별 상품 차트 데이터 (API 기반)
  const categoryColors = [
    "#0c8ce9",
    "#34c759",
    "#ff9500",
    "#af52de",
    "#ff375f",
    "#5856d6",
  ];

  const categoryData =
    dashboardData?.categoryProducts.map((item, index) => ({
      name: item.categoryName,
      value: item.productCount,
      color: categoryColors[index % categoryColors.length],
    })) || [];

  // 상위 판매 상품 데이터 (API 기반)
  const topProducts =
    dashboardData?.topProducts.map((item, index) => ({
      id: item.productId,
      name: item.productName,
      sales: item.orderCount,
    })) || [];

  // 일별 매출 차트 데이터 (API 기반)
  const dailySalesData =
    dashboardData?.dailySales.map((item) => ({
      date: item.date,
      주문수: item.orderCount,
      매출액: Math.round(item.salesAmount / 10000), // 만원 단위
      순이익: Math.round(item.netProfit / 10000), // 만원 단위
    })) || [];

  // CSV 내보내기
  const handleExportCSV = () => {
    if (!dashboardData) {
      toast.error("내보낼 데이터가 없습니다.");
      return;
    }

    try {
      const headers = ["구분", "항목", "값"];
      const csvData: string[] = [];

      // 통계 데이터
      csvData.push(`"통계","전체 상품",${dashboardData.productCount}`);
      csvData.push(`"통계","판매중 상품",${dashboardData.onSaleProductCount}`);
      csvData.push(`"통계","준비중 상품",${dashboardData.readyProductCount}`);
      csvData.push(`"통계","전체 파트너",${dashboardData.partnerCount}`);
      csvData.push(`"통계","활성 파트너",${dashboardData.activePartnerCount}`);
      csvData.push(`"통계","비활성 파트너",${dashboardData.inactivePartnerCount}`);
      csvData.push(`"통계","전체 주문",${dashboardData.totalOrderCount}`);
      csvData.push(`"통계","취소 주문",${dashboardData.cancelOrderCount}`);
      csvData.push(`"통계","이번달 전체 주문",${dashboardData.thisMonthTotalOrderCount}`);
      csvData.push(`"통계","이번달 주문 완료",${dashboardData.thisMonthOrderCount}`);
      csvData.push(`"통계","이번달 주문 취소",${dashboardData.thisMonthCancelOrderCount}`);
      csvData.push(""); // 빈 줄

      // 파트너별 매출
      csvData.push(`"파트너명","상품수","매출","순이익","주문"`);
      dashboardData.partnerSales.forEach((p) => {
        csvData.push(
          `"${p.partnerName}",${p.productCount},${p.salesAmount},${p.netProfit},${p.orderCount}`,
        );
      });
      csvData.push(""); // 빈 줄

      // 카테고리별 상품
      csvData.push(`"카테고리","상품수"`);
      dashboardData.categoryProducts.forEach((c) => {
        csvData.push(`"${c.categoryName}",${c.productCount}`);
      });
      csvData.push(""); // 빈 줄

      // 상위 판매 상품
      csvData.push(`"순위","상품명","판매수"`);
      dashboardData.topProducts.forEach((p, idx) => {
        csvData.push(`${idx + 1},"${p.productName}",${p.orderCount}`);
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
        `대시보드_${new Date().toISOString().slice(0, 10)}.csv`,
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
    if (!dashboardData) {
      toast.error("내보낼 데이터가 없습니다.");
      return;
    }

    try {
      let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head>
          <meta charset="UTF-8">
          <style>
            table { border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .section-title { background-color: #e3f2fd; font-weight: bold; }
          </style>
        </head>
        <body>
          <table>
            <thead>
              <tr class="section-title">
                <th colspan="3">대시보드 통계</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>통계</td><td>전체 상품</td><td>${dashboardData.productCount}</td></tr>
              <tr><td>통계</td><td>판매중 상품</td><td>${dashboardData.onSaleProductCount}</td></tr>
              <tr><td>통계</td><td>준비중 상품</td><td>${dashboardData.readyProductCount}</td></tr>
              <tr><td>통계</td><td>전체 파트너</td><td>${dashboardData.partnerCount}</td></tr>
              <tr><td>통계</td><td>활성 파트너</td><td>${dashboardData.activePartnerCount}</td></tr>
              <tr><td>통계</td><td>비활성 파트너</td><td>${dashboardData.inactivePartnerCount}</td></tr>
              <tr><td>통계</td><td>전체 주문</td><td>${dashboardData.totalOrderCount}</td></tr>
              <tr><td>통계</td><td>취소 주문</td><td>${dashboardData.cancelOrderCount}</td></tr>
              <tr><td>통계</td><td>이번달 전체 주문</td><td>${dashboardData.thisMonthTotalOrderCount}</td></tr>
              <tr><td>통계</td><td>이번달 주문 완료</td><td>${dashboardData.thisMonthOrderCount}</td></tr>
              <tr><td>통계</td><td>이번달 주문 취소</td><td>${dashboardData.thisMonthCancelOrderCount}</td></tr>
              <tr><td colspan="3"></td></tr>
              
              <tr class="section-title">
                <th>파트너명</th>
                <th>상품수</th>
                <th>매출</th>
                <th>순이익</th>
                <th>주문</th>
              </tr>
      `;

      dashboardData.partnerSales.forEach((p) => {
        html += `<tr><td>${p.partnerName}</td><td>${p.productCount}</td><td>${p.salesAmount}</td><td>${p.netProfit}</td><td>${p.orderCount}</td></tr>`;
      });

      html += `
              <tr><td colspan="5"></td></tr>
              <tr class="section-title">
                <th>카테고리</th>
                <th>상품수</th>
              </tr>
      `;

      dashboardData.categoryProducts.forEach((c) => {
        html += `<tr><td>${c.categoryName}</td><td>${c.productCount}</td></tr>`;
      });

      html += `
              <tr><td colspan="2"></td></tr>
              <tr class="section-title">
                <th>순위</th>
                <th>상품명</th>
                <th>판매수</th>
              </tr>
      `;

      dashboardData.topProducts.forEach((p, idx) => {
        html += `<tr><td>${idx + 1}</td><td>${p.productName}</td><td>${p.orderCount}</td></tr>`;
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
        `대시보드_${new Date().toISOString().slice(0, 10)}.xls`,
      );
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Excel 파일이 다운로드되었습니다.");
    } catch (error) {
      toast.error("Excel 내보내기에 실패했습니다.");
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {language === "ko" ? "데이터를 불러오는 중..." : "Loading data..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-5">
      {/* 헤더 */}
      <PageHeader
        title={title}
        subtitle={description}
        language={language}
        lastUpdate={lastUpdate}
        onRefresh={handleRefresh}
        rightContent={
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* 기간 선택 */}
              <Select
                value={timePeriod}
                onValueChange={(value) => setTimePeriod(value as DashboardPeriod)}
              >
                <SelectTrigger className="w-[90px] h-8 text-xs" data-tour="dashboard-period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week" className="text-xs">
                    주간
                  </SelectItem>
                  <SelectItem value="month" className="text-xs">
                    월간
                  </SelectItem>
                  <SelectItem value="year" className="text-xs">
                    연간
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* 내보내기 드롭다운 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-accent transition-colors" data-tour="dashboard-export">
                    <Download className="h-3.5 w-3.5" />
                    <span className="text-[11px] sm:text-[13px]">
                      내보내기
                    </span>
                  </button>
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

              {/* 새로고침 버튼 */}
              <button
                onClick={handleRefresh}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-accent transition-colors"
                data-tour="dashboard-refresh"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span className="text-[11px] sm:text-[13px] hidden sm:inline">
                  {language === "ko" ? "새로고침" : "Refresh"}
                </span>
              </button>

              {/* 도움말(투어) 버튼 */}
              <TourHelpButton onClick={startTour} />
            </div>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground">
              {language === "ko"
                ? "마지막 업데이트"
                : "Last Update"}{" "}
              : {formatDateTime(lastUpdate)}
            </p>
          </div>
        }
      />

      {/* 상단 숫자 카드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-tour="dashboard-stats">
        {/* 전체 상품 */}
        <div
          onClick={() => navigate('/admin/products')}
          className="rounded-lg border bg-card p-5 cursor-pointer transition-colors hover:bg-accent/5"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">전체 상품</p>
              <p className="text-4xl font-bold mt-2">
                {formatCurrency(dashboardData?.productCount || 0)}
              </p>
            </div>
            <div
              className="h-12 w-12 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#0c8ce9" + "1A" }}
            >
              <Package className="h-6 w-6" style={{ color: "#0c8ce9" }} />
            </div>
          </div>
        </div>

        {/* 판매중 상품 */}
        <div
          onClick={() => navigate('/admin/products?status=ON_SALE')}
          className="rounded-lg border bg-card p-5 cursor-pointer transition-colors hover:bg-accent/5"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">판매중</p>
              <p className="text-4xl font-bold mt-2">
                {formatCurrency(dashboardData?.onSaleProductCount || 0)}
              </p>
            </div>
            <div
              className="h-12 w-12 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#34c759" + "1A" }}
            >
              <PackageCheck className="h-6 w-6" style={{ color: "#34c759" }} />
            </div>
          </div>
        </div>

        {/* 준비중 상품 */}
        <div
          onClick={() => navigate('/admin/products?status=READY')}
          className="rounded-lg border bg-card p-5 cursor-pointer transition-colors hover:bg-accent/5"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">준비중</p>
              <p className="text-4xl font-bold mt-2">
                {formatCurrency(dashboardData?.readyProductCount || 0)}
              </p>
            </div>
            <div
              className="h-12 w-12 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#ff9500" + "1A" }}
            >
              <PackagePlus className="h-6 w-6" style={{ color: "#ff9500" }} />
            </div>
          </div>
        </div>

        {/* 전체 파트너 */}
        <div
          onClick={() => navigate('/admin/partners')}
          className="rounded-lg border bg-card p-5 cursor-pointer transition-colors hover:bg-accent/5"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">전체 파트너</p>
              <p className="text-4xl font-bold mt-2">
                {formatCurrency(dashboardData?.partnerCount || 0)}
              </p>
            </div>
            <div
              className="h-12 w-12 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#af52de" + "1A" }}
            >
              <Users className="h-6 w-6" style={{ color: "#af52de" }} />
            </div>
          </div>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="space-y-4">
        {/* 주문 관련 차트 - 한 줄 (2+1+1) */}
        <div className="grid gap-4 lg:grid-cols-4">
          {/* 최근 주문 추이 */}
          <div className="rounded-lg border bg-card p-5 lg:col-span-2">
            <h4 className="text-xs font-medium text-muted-foreground mb-4">최근 주문 추이 (7일)</h4>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailySalesData.slice(-7)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                    angle={-45}
                    textAnchor="end"
                    height={45}
                  />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} width={30} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="주문수"
                    stroke="#0c8ce9"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 주문 상태 비율 (전체 주문 포함) */}
          <div className="rounded-lg border bg-card p-5">
            <h4 className="text-xs font-medium text-muted-foreground mb-4">전체 주문</h4>
            <div className="flex flex-col items-center gap-3">
              <div className="relative w-44 h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: '주문완료',
                          value: dashboardData?.orderCount || 0,
                          color: '#34c759'
                        },
                        {
                          name: '주문취소',
                          value: dashboardData?.cancelOrderCount || 0,
                          color: '#ff375f'
                        }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      dataKey="value"
                      paddingAngle={2}
                    >
                      <Cell fill="#34c759" />
                      <Cell fill="#ff375f" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="text-2xl font-bold">
                    {formatCurrency(dashboardData?.totalOrderCount || 0)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    전체 주문
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-xs text-muted-foreground">주문완료</span>
                  </div>
                  <span className="text-xs font-semibold">
                    {formatCurrency(dashboardData?.orderCount || 0)} (
                    {((dashboardData?.orderCount || 0) / (dashboardData?.totalOrderCount || 1) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="text-xs text-muted-foreground">주문취소</span>
                  </div>
                  <span className="text-xs font-semibold">
                    {formatCurrency(dashboardData?.cancelOrderCount || 0)} (
                    {((dashboardData?.cancelOrderCount || 0) / (dashboardData?.totalOrderCount || 1) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 이번달 전체 주문 */}
          <div className="rounded-lg border bg-card p-5">
            <h4 className="text-xs font-medium text-muted-foreground mb-4">이번달 전체 주문</h4>
            <div className="flex flex-col items-center gap-3">
              <div className="relative w-44 h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: '주문완료',
                          value: dashboardData?.thisMonthOrderCount || 0,
                          color: '#34c759'
                        },
                        {
                          name: '주문취소',
                          value: dashboardData?.thisMonthCancelOrderCount || 0,
                          color: '#ff375f'
                        }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      dataKey="value"
                      paddingAngle={2}
                    >
                      <Cell fill="#34c759" />
                      <Cell fill="#ff375f" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="text-2xl font-bold">
                    {formatCurrency(dashboardData?.thisMonthTotalOrderCount || 0)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    이번달 주문
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-xs text-muted-foreground">주문완료</span>
                  </div>
                  <span className="text-xs font-semibold">
                    {formatCurrency(dashboardData?.thisMonthOrderCount || 0)} (
                    {((dashboardData?.thisMonthOrderCount || 0) / (dashboardData?.thisMonthTotalOrderCount || 1) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="text-xs text-muted-foreground">주문취소</span>
                  </div>
                  <span className="text-xs font-semibold">
                    {formatCurrency(dashboardData?.thisMonthCancelOrderCount || 0)} (
                    {((dashboardData?.thisMonthCancelOrderCount || 0) / (dashboardData?.thisMonthTotalOrderCount || 1) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 파트너 및 차트 영역 (4열) */}
        <div className="grid gap-4 lg:grid-cols-4">
          {/* 파트너 활성화 상태 */}
          <div className="rounded-lg border bg-card p-5">
            <h4 className="text-xs font-medium text-muted-foreground mb-4">파트너 활성화 상태</h4>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    {
                      name: '활성',
                      value: dashboardData?.activePartnerCount || 0,
                    },
                    {
                      name: '비활성',
                      value: dashboardData?.inactivePartnerCount || 0,
                    }
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {[
                      { color: '#34c759' },
                      { color: '#ff375f' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 파트너별 매출 현황 */}
          <div className="rounded-lg border bg-card p-5 lg:col-span-3">
            <h4 className="text-xs font-medium text-muted-foreground mb-4">파트너별 매출 현황</h4>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={partnerSalesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="상품수" fill="#0c8ce9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="매출" fill="#34c759" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="순이익" fill="#ff9500" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="주문" fill="#af52de" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 분석 차트 - 한 줄 (1+1+2) */}
        <div className="grid gap-4 lg:grid-cols-4">
          {/* 상위 판매 상품 */}
          <div className="rounded-lg border bg-card p-5">
            <h4 className="text-xs font-medium text-muted-foreground mb-4">상위 판매 상품</h4>
            <div className="space-y-2.5 max-h-96 overflow-y-auto">
              {topProducts.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-xs">판매 데이터가 없습니다</p>
                </div>
              ) : (
                topProducts.slice(0, 10).map((product, index) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 p-3.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/products/${product.id}`)}
                  >
                    <div className="text-base font-bold text-muted-foreground w-7">
                      #{index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate font-medium">{product.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold">
                        {formatCurrency(product.sales)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 카테고리별 상품 */}
          <div className="rounded-lg border bg-card p-5">
            <h4 className="text-xs font-medium text-muted-foreground mb-4">카테고리별 상품</h4>
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-40 h-40">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                        paddingAngle={2}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : null}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="text-2xl font-bold">
                    {dashboardData?.productCount || 0}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    전체 상품
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 w-full">
                {categoryData.map((item, index) => {
                  const total = categoryData.reduce((sum, d) => sum + d.value, 0);
                  const percentage = total > 0 ? ((item.value / total) * 100).toFixed(0) : "0";
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] truncate">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {percentage}% · {item.value}개
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 일별 매출 추이 */}
          <div className="rounded-lg border bg-card p-5 lg:col-span-2">
            <h4 className="text-xs font-medium text-muted-foreground mb-4">일별 매출 추이</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailySalesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                    angle={-45}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} width={35} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Line type="monotone" dataKey="주문수" stroke="#0c8ce9" strokeWidth={2} />
                  <Line type="monotone" dataKey="매출액" stroke="#34c759" strokeWidth={2} />
                  <Line type="monotone" dataKey="순이익" stroke="#ff9500" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* 투어 가이드 */}
      <CoachMark
        steps={tourSteps}
        isActive={isTourActive}
        onFinish={endTour}
        storageKey="dashboard_tour"
      />
    </div>
  );
}
export default Dashboard;
