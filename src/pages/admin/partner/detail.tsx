import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { SegmentTabs } from "@/components/ui/segment-tabs";
import { PageHeader } from "@/components/page-header";
import { DataTable, ColumnDef } from "@/components/ui/data-table";
import { DatePicker } from "@/components/ui/date-picker";
import { uploadFile } from "@/lib/api/file";
import { isApiOnlyMode } from "@/lib/data-mode";
import lotteConcertLogo from "@/assets/d3a078d044ed8fb80e890a1f321da57a19ac6624.png";
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
import { Switch } from "@/components/ui/switch";
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
  ArrowLeft,
  Edit,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  ShoppingCart,
  Ticket,
  User,
  X,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { CoachMark, useCoachMark, TourHelpButton, type TourStep } from "@/components/coach-mark";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  getPartnerDetail,
  getPartnerProducts,
  getSalesSummary,
  getDailySales,
  getTopProducts,
  getCategorySales,
  updatePartner as updatePartnerApi,
  type PartnerDetail as ApiPartnerDetail,
} from "@/lib/api/partner";
import {
  getFieldManagers,
  createFieldManager,
  updateFieldManager,
  deleteFieldManager,
  type FieldManagerListItem,
  type FieldManagerDetail,
} from "@/lib/api/partner";
import {
  Partner,
  PartnerStatus,
  PartnerType,
  PartnerProduct,
  PartnerSalesStats,
} from "@/data/dto/partner.dto";
import type { Supervisor, CreateSupervisorDto } from "@/data/dto/supervisor.dto";
import { 
  updatePartner, 
  getPartnerById as getPartnerByIdDummy,
  getPartnerProducts as getPartnerProductsDummy, 
  getPartnerSalesStats as getPartnerSalesStatsDummy 
} from "@/data/partners";
import { getSupervisorsByPartnerId as getSupervisorsByPartnerIdDummy } from "@/data/supervisors";

type Language = "ko" | "en";

interface PartnerDetailProps {
  language: Language;
}

export function PartnerDetail({ language }: PartnerDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [products, setProducts] = useState<PartnerProduct[]>([]);
  const [salesStats, setSalesStats] = useState<PartnerSalesStats | null>(null);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  // 판매현황 실제 API 데이터
  const [salesSummary, setSalesSummary] = useState<{ totalRevenue: number; totalOrders: number; totalTickets: number; averageOrderValue: number } | null>(null);
  const [dailySalesData, setDailySalesData] = useState<{ date: string; revenue: number }[]>([]);
  const [topProductsData, setTopProductsData] = useState<{ productCode: string; productName: string; revenue: number; tickets: number }[]>([]);
  const [categorySalesData, setCategorySalesData] = useState<{ category: string; revenue: number }[]>([]);
  const [isSalesLoading, setIsSalesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  // 투어 가이드
  const detailTourSteps: TourStep[] = [
    // 기본정보 탭
    {
      target: "detail-info-card",
      title: "파트너 기본정보",
      description: "파트너의 코드, 이름, 타입, 사업자번호, 주소 등\n기본 정보를 확인할 수 있습니다.\n우측 상단 수정 버튼으로 편집 가능합니다.",
      placement: "bottom",
    },
    {
      target: "detail-contract-card",
      title: "계약 정보",
      description: "계약 기간, 수수료율, 티켓코드 타입 등\n계약 관련 정보를 확인합니다.",
      placement: "top",
      waitForTarget: 500,
    },
    // 현장관리자 탭
    {
      target: "supervisor-add-btn",
      title: "현장관리자 추가",
      description: "이 버튼을 눌러 현장관리자를 추가합니다.",
      placement: "bottom",
      waitForTarget: 1500,
    },
    {
      target: "supervisor-dialog-account",
      title: "계정 정보 (아이디/비밀번호)",
      description: "사용자명과 비밀번호를 생성합니다.\n이 계정으로 현장관리자 전용 로그인에\n접속할 수 있습니다.",
      placement: "bottom",
      waitForTarget: 1500,
    },
    {
      target: "supervisor-dialog-contact",
      title: "연락처 정보",
      description: "현장관리자의 이름, 이메일, 전화번호를\n입력합니다. 활성 토글로 계정 사용 여부를\n제어할 수 있습니다.",
      placement: "top",
      waitForTarget: 500,
    },
    {
      target: "supervisor-table",
      title: "현장관리자 목록",
      description: "등록된 현장관리자 목록입니다.\n이름, 이메일, 연락처, 활성 상태를 확인하고\n수정/삭제할 수 있습니다.",
      placement: "top",
      waitForTarget: 500,
    },
    // 적용상품 탭
    {
      target: "products-table",
      title: "적용상품 목록",
      description: "해당 파트너사에 적용된 상품 목록입니다.\n상품명, 카테고리, 가격, 판매수량, 매출을\n한눈에 확인할 수 있습니다.",
      placement: "top",
      waitForTarget: 1500,
    },
    // 판매현황 탭
    {
      target: "sales-summary",
      title: "판매현황 통계",
      description: "총 매출, 총 주문, 판매 티켓 수, 평균 주문금액 등\n파트너의 판매 실적을 한눈에 확인할 수 있습니다.\n차트와 상위 판매 상품도 함께 제공됩니다.",
      placement: "bottom",
      waitForTarget: 1500,
    },
  ];

  const { isActive: isTourActive, startTour, endTour } = useCoachMark("partner_detail_tour");

  // 투어용 더미 데이터 (데이터 없을 때 투어 진행용)
  const dummySupervisors: Supervisor[] = [{
    id: "dummy-1",
    name: "홍길동",
    email: "hong@example.com",
    phone: "010-1234-5678",
    active: true,
    partnerId: id || "",
    username: "hong_manager",
    createdAt: new Date().toISOString(),
  }];

  const dummyProducts: PartnerProduct[] = [{
    id: "dummy-prod-1",
    name: "[투어용] 샘플 입장권",
    category: "테마파크",
    price: 35000,
    salesVolume: 128,
    revenue: 4480000,
    salesStatus: "ON_SALE",
  }];

  const handleDetailTourStepChange = (stepIndex: number, _step: TourStep) => {
    // 기본정보 탭 (0~1)
    if (stepIndex <= 1) {
      setActiveTab("basic");
      setIsSupervisorDialogOpen(false);
    }
    // 현장관리자 탭 - 버튼 (2)
    if (stepIndex === 2) {
      setActiveTab("supervisors");
      setIsSupervisorDialogOpen(false);
      if (supervisors.length === 0) setSupervisors(dummySupervisors);
    }
    // 현장관리자 탭 - 모달 내부 (3~4)
    if (stepIndex === 3 || stepIndex === 4) {
      setActiveTab("supervisors");
      if (!isSupervisorDialogOpen) {
        setSupervisorFormData({
          username: "", password: "", name: "", email: "", phone: "",
          partnerId: id || "", active: true,
        });
        setIsSupervisorEditMode(false);
        setIsSupervisorDialogOpen(true);
      }
    }
    // 현장관리자 탭 - 테이블 (5)
    if (stepIndex === 5) {
      setActiveTab("supervisors");
      setIsSupervisorDialogOpen(false);
      if (supervisors.length === 0) setSupervisors(dummySupervisors);
    }
    // 적용상품 탭 (6)
    if (stepIndex === 6) {
      setActiveTab("products");
      setIsSupervisorDialogOpen(false);
      if (products.length === 0) setProducts(dummyProducts);
    }
    // 판매현황 탭 (7)
    if (stepIndex === 7) {
      setActiveTab("sales");
      setIsSupervisorDialogOpen(false);
      if (!salesSummary) {
        setSalesSummary({ totalRevenue: 4480000, totalOrders: 128, totalTickets: 256, averageOrderValue: 35000 });
      }
    }
  };

  // 상태를 한글로 변환하는 헬퍼 함수
  const getStatusLabel = (status: PartnerStatus): string => {
    const labels: Record<PartnerStatus, string> = {
      [PartnerStatus.ACTIVE]: '활성',
      [PartnerStatus.INACTIVE]: '비활성',
      [PartnerStatus.PENDING]: '대기',
      [PartnerStatus.SUSPENDED]: '중지',
    };
    return labels[status] || status;
  };

  // 파트너 정보 수정 다이얼로그
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [partnerFormData, setPartnerFormData] = useState({
    name: "",
    status: PartnerStatus.ACTIVE,
    ticketCodeType: "NUMBER",
    managerName: "",
    managerEmail: "",
    managerPhone: "",
    contractStartDate: "",
    contractEndDate: "",
    commissionRate: 0,
    couponCode: true,
    businessNumber: "",
    address: "",
    description: "",
    logoUrl: "",
  });
  const [logoPreviewBlob, setLogoPreviewBlob] = useState<string | null>(null);

  // Supervisor 다이얼로그
  const [isSupervisorDialogOpen, setIsSupervisorDialogOpen] = useState(false);
  const [isDeleteSupervisorDialogOpen, setIsDeleteSupervisorDialogOpen] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState<Supervisor | null>(null);
  const [isSupervisorEditMode, setIsSupervisorEditMode] = useState(false);
  const [isSupervisorViewDialogOpen, setIsSupervisorViewDialogOpen] = useState(false);
  const [viewingSupervisor, setViewingSupervisor] = useState<Supervisor | null>(null);
  const [supervisorFormData, setSupervisorFormData] = useState<CreateSupervisorDto>({
    username: "",
    password: "",
    name: "",
    email: "",
    phone: "",
    partnerId: id || "",
    active: true,
  });

  // 상품 상세 다이얼로그
  const [isProductDetailDialogOpen, setIsProductDetailDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<PartnerProduct | null>(null);

  // 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      // 파트너 상세 정보 조회 (API -> 더미 데이터 폴백)
      const response = await getPartnerDetail(id);
      if (response.success && response.data) {
        // API 응답을 Partner 형식으로 변환
        const apiPartner: Partner = {
          id: response.data.code,
          code: response.data.code,
          name: response.data.name,
          type: response.data.type as PartnerType,
          status: (response.data.status as PartnerStatus) || PartnerStatus.ACTIVE,
          managerName: response.data.managerName,
          managerEmail: response.data.managerEmail,
          managerPhone: response.data.managerPhone,
          businessNumber: response.data.businessNumber,
          address: response.data.address,
          contractStartDate: response.data.contractStartDate || new Date().toISOString(),
          contractEndDate: response.data.contractEndDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
          commissionRate: response.data.commissionRate,
          couponCode: response.data.couponCode ?? true,
          description: response.data.description,
          logoUrl: response.data.logoUrl,
          productCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setPartner(apiPartner);
      } else {
        // API 실패 시 처리
        if (!isApiOnlyMode()) {
          // API_WITH_FALLBACK 모드: 더미 데이터 사용
          console.log('[Partner Detail] API 실패, 더미 데이터 사용');
          const dummyResponse = getPartnerByIdDummy(id);
          if (dummyResponse.success && dummyResponse.data) {
            setPartner(dummyResponse.data);
          } else {
            console.error('[Partner Detail] 파트너를 찾을 수 없습니다:', id);
            navigate('/admin/partners');
          }
        } else {
          // API_ONLY 모드: 에러 처리
          console.error('[Partner Detail] API 실패, 파트너를 찾을 수 없습니다:', id);
          navigate('/admin/partners');
        }
      }

      // 판매현황 조회
      if (!isApiOnlyMode()) {
        const statsResponse = getPartnerSalesStatsDummy(id, "2025-11");
        if (statsResponse.success) {
          setSalesStats(statsResponse.data);
        }
      }
    };

    fetchData();
  }, [id]);

  // 현장관리자 탭 클릭 시 목록 조회
  useEffect(() => {
    const fetchSupervisors = async () => {
      if (!id || activeTab !== 'supervisors') return;
      // 투어 중이면 API 호출 스킵 (더미 데이터 유지)
      if (isTourActive) return;

      console.log('[Field Managers] 현장관리자 탭 선택, API 호출');
      // 현장관리자 목록 조회 (API -> 더미 데이터 폴백)
      const supervisorsResponse = await getFieldManagers(id);
      if (supervisorsResponse.success && supervisorsResponse.data) {
        console.log('[Field Managers] API 성공:', supervisorsResponse.data);
        // FieldManagerListItem을 Supervisor로 변환
        const supervisorsList: Supervisor[] = supervisorsResponse.data.map((fm: FieldManagerListItem) => ({
          id: fm.id || '',
          username: fm.userName,
          password: '****',
          name: fm.name,
          email: fm.email,
          phone: fm.phone,
          partnerId: id,
          partnerName: partner?.name || '',
          active: fm.active,
          createdAt: fm.createdAt,
          updatedAt: fm.createdAt,
        }));
        setSupervisors(supervisorsList);
      } else {
        // API 실패 시 처리
        if (!isApiOnlyMode()) {
          console.log('[Field Managers] API 실패, 더미 데이터 사용');
          const dummyResponse = getSupervisorsByPartnerIdDummy(id);
          if (dummyResponse.success && dummyResponse.data) {
            setSupervisors(dummyResponse.data);
          }
        } else {
          console.error('[Field Managers] API 실패');
        }
      }
    };

    fetchSupervisors();
  }, [id, activeTab]);

  // 적용상품 탭 클릭 시 상품 목록 조회
  useEffect(() => {
    const fetchProducts = async () => {
      if (!id || activeTab !== 'products') return;
      // 투어 중이면 API 호출 스킵 (더미 데이터 유지)
      if (isTourActive) return;

      console.log('[Partner Products] 적용상품 탭 선택, API 호출');
      // 상품 목록 조회 (API -> 더미 데이터 폴백)
      const productsResponse = await getPartnerProducts(id);
      if (productsResponse.success && productsResponse.data) {
        console.log('[Partner Products] API 성공:', productsResponse.data);
        // PartnerProductItem을 PartnerProduct로 변환
        const productsList: PartnerProduct[] = productsResponse.data.map((item) => ({
          id: item.productId,
          productId: item.productId,
          name: item.productName,
          optionValue: item.optionValue,
          category: item.categoryName,
          price: item.price,
          discountRate: 0,
          salesStatus: item.salesStatus,
          stock: item.stock,
          salesCount: item.salesCount,
          revenue: item.totalSalesAmount,
        }));
        setProducts(productsList);
      } else {
        // API 실패 시 처리
        if (!isApiOnlyMode()) {
          console.log('[Partner Products] API 실패, 더미 데이터 사용');
          const dummyResponse = getPartnerProductsDummy(id);
          if (dummyResponse.success) {
            setProducts(dummyResponse.data.content);
          }
        } else {
          console.error('[Partner Products] API 실패');
        }
      }
    };

    fetchProducts();
  }, [id, activeTab]);

  // 판매현황 탭 클릭 시 통계 API 호출
  useEffect(() => {
    const fetchSalesStats = async () => {
      if (!id || activeTab !== 'sales') return;
      // 투어 중이면 API 호출 스킵 (더미 데이터 유지)
      if (isTourActive) return;

      setIsSalesLoading(true);

      // 날짜 범위 설정 (최근 30일)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);

      const fmt = (date: Date) =>
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      const startDateStr = fmt(startDate);
      const endDateStr = fmt(endDate);

      const [summaryResponse, dailyResponse, topProductsResponse, categoryResponse] = await Promise.all([
        getSalesSummary(id, startDateStr, endDateStr),
        getDailySales(id, startDateStr, endDateStr),
        getTopProducts(id, startDateStr, endDateStr),
        getCategorySales(id, startDateStr, endDateStr),
      ]);

      if (summaryResponse.success && summaryResponse.data) {
        setSalesSummary(summaryResponse.data);
      }
      if (dailyResponse.success && dailyResponse.data) {
        setDailySalesData(dailyResponse.data);
      }
      if (topProductsResponse.success && topProductsResponse.data) {
        setTopProductsData(topProductsResponse.data);
      }
      if (categoryResponse.success && categoryResponse.data) {
        setCategorySalesData(categoryResponse.data);
      }

      setIsSalesLoading(false);
    };

    fetchSalesStats();
  }, [id, activeTab]);

  // blob URL 정리
  useEffect(() => {
    return () => {
      if (logoPreviewBlob) {
        URL.revokeObjectURL(logoPreviewBlob);
      }
    };
  }, [logoPreviewBlob]);

  // 상태 뱃지 스타일
  const getStatusBadge = (status: PartnerStatus) => {
    const styles = {
      [PartnerStatus.ACTIVE]: "bg-green-500/10 text-green-500",
      [PartnerStatus.INACTIVE]: "bg-gray-500/10 text-gray-500",
      [PartnerStatus.PENDING]: "bg-yellow-500/10 text-yellow-500",
      [PartnerStatus.SUSPENDED]: "bg-red-500/10 text-red-500",
    };
    return styles[status] || "";
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  // 금액 포맷팅
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR").format(amount);
  };

  // 로고 URL 해결
  const resolveLogoUrl = (logoUrl: string) => {
    if (logoUrl === '@/assets/d3a078d044ed8fb80e890a1f321da57a19ac6624.png') {
      return lotteConcertLogo;
    }
    // 미리보기용 blob URL이 있으면 사용
    if (logoPreviewBlob && (logoUrl.includes('/api/') || logoUrl.startsWith('/uploads/'))) {
      return logoPreviewBlob;
    }
    return logoUrl;
  };

  // Supervisor 다이얼로그 열기
  const handleOpenSupervisorDialog = (supervisor?: Supervisor) => {
    if (supervisor) {
      setIsSupervisorEditMode(true);
      setSelectedSupervisor(supervisor);
      setSupervisorFormData({
        username: supervisor.username,
        password: "",
        name: supervisor.name,
        email: supervisor.email,
        phone: supervisor.phone,
        partnerId: supervisor.partnerId,
        active: supervisor.active,
      });
    } else {
      setIsSupervisorEditMode(false);
      setSelectedSupervisor(null);
      setSupervisorFormData({
        username: "",
        password: "",
        name: "",
        email: "",
        phone: "",
        partnerId: id || "",
        active: true,
      });
    }
    setIsSupervisorDialogOpen(true);
  };

  // Supervisor 저장
  const handleSaveSupervisor = async () => {
    if (!supervisorFormData.name) {
      toast.error("필수 정보를 입력해주세요.");
      return;
    }

    try {
      if (isSupervisorEditMode && selectedSupervisor) {
        // UI 데이터를 API 형식으로 변환
        const apiData = {
          userName: supervisorFormData.username,
          password: supervisorFormData.password,
          name: supervisorFormData.name,
          email: supervisorFormData.email,
          phone: supervisorFormData.phone,
          active: supervisorFormData.active,
        };
        
        const response = await updateFieldManager(id!, selectedSupervisor.id!, apiData);
        if (response.success) {
          toast.success("담당자가 수정되었습니다.");
          const supervisorsResponse = await getFieldManagers(id!);
          if (supervisorsResponse.success) {
            setSupervisors(supervisorsResponse.data.map((fm: FieldManagerListItem) => ({
              id: fm.id || '',
              username: fm.userName,
              password: '****',
              name: fm.name,
              email: fm.email,
              phone: fm.phone,
              partnerId: id!,
              partnerName: partner?.name || '',
              active: fm.active,
              createdAt: fm.createdAt,
              updatedAt: fm.createdAt,
            })));
          }
          setIsSupervisorDialogOpen(false);
        } else {
          toast.error(response.message || "담당자 수정에 실패했습니다.");
        }
      } else {
        // UI 데이터를 API 형식으로 변환
        const apiData = {
          userName: supervisorFormData.username,
          password: supervisorFormData.password,
          name: supervisorFormData.name,
          email: supervisorFormData.email,
          phone: supervisorFormData.phone,
          active: supervisorFormData.active,
        };

        const response = await createFieldManager(id!, apiData);
        if (response.success) {
          toast.success("담당자가 생성되었습니다.");
          const supervisorsResponse = await getFieldManagers(id!);
          if (supervisorsResponse.success) {
            setSupervisors(supervisorsResponse.data.map((fm: FieldManagerListItem) => ({
              id: fm.id || '',
              username: fm.userName,
              password: '****',
              name: fm.name,
              email: fm.email,
              phone: fm.phone,
              partnerId: id!,
              partnerName: partner?.name || '',
              active: fm.active,
              createdAt: fm.createdAt,
              updatedAt: fm.createdAt,
            })));
          }
          setIsSupervisorDialogOpen(false);
        } else {
          toast.error(response.message || "담당자 생성에 실패했습니다.");
        }
      }
    } catch (error) {
      toast.error("오류가 발생했습니다.");
    }
  };

  // Supervisor 삭제
  const handleDeleteSupervisor = async () => {
    if (selectedSupervisor) {
      try {
        const response = await deleteFieldManager(id!, selectedSupervisor.id!);
        if (response.success) {
          toast.success("담당자가 삭제되었습니다.");
          const supervisorsResponse = await getFieldManagers(id!);
          if (supervisorsResponse.success) {
            setSupervisors(supervisorsResponse.data.map((fm: FieldManagerListItem) => ({
              id: fm.id || '',
              username: fm.userName,
              password: '****',
              name: fm.name,
              email: fm.email,
              phone: fm.phone,
              partnerId: id!,
              partnerName: partner?.name || '',
              active: fm.active,
              createdAt: fm.createdAt,
              updatedAt: fm.createdAt,
            })));
          }
          setIsDeleteSupervisorDialogOpen(false);
        } else {
          toast.error(response.message || "담당자 삭제에 실패했습니다.");
        }
      } catch (error) {
        toast.error("오류가 발생했습니다.");
      }
    }
  };

  const CHART_COLORS = ["#0c8ce9", "#34c759", "#ff9500", "#af52de", "#ff375f"];

  if (!partner) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6 p-4 md:p-0">
      {/* Header */}
      <PageHeader
        title={partner.name}
        subtitle={`${partner.code} | ${partner.type}`}
        language={language}
        rightContent={
          <div className="flex items-center gap-3">
            <TourHelpButton onClick={startTour} />
            <Button
              variant="outline"
              onClick={() => navigate("/admin/partners")}
            >
              <ArrowLeft className="size-4 mr-2" />
              목록으로
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="space-y-6">
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <SegmentTabs
            value={activeTab}
            onValueChange={setActiveTab}
            options={[
              { value: "basic", label: "기본정보" },
              { value: "supervisors", label: language === "ko" ? "현장관리자" : "Supervisors" },
              { value: "products", label: "적용상품" },
              { value: "sales", label: "판매현황" },
            ]}
          />
        </div>

        {/* 기본정보 탭 */}
        {activeTab === "basic" && (
          <div className="space-y-6">
            <div className="bg-card rounded-[8px] border p-4 md:p-6" data-tour="detail-info-card">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
                <h3 className="text-[15px]">파트너 정보</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (partner) {
                      setPartnerFormData({
                        name: partner.name,
                        status: partner.status || PartnerStatus.ACTIVE,
                        ticketCodeType: (partner as any).ticketCodeType || "NUMBER",
                        managerName: partner.managerName,
                        managerEmail: partner.managerEmail,
                        managerPhone: partner.managerPhone,
                        contractStartDate: partner.contractStartDate ? partner.contractStartDate.split('T')[0] : "",
                        contractEndDate: partner.contractEndDate ? partner.contractEndDate.split('T')[0] : "",
                        commissionRate: partner.commissionRate,
                        couponCode: partner.couponCode ?? true,
                        businessNumber: partner.businessNumber || "",
                        address: partner.address || "",
                        description: partner.description || "",
                        logoUrl: partner.logoUrl || "",
                      });
                    }
                    setIsEditDialogOpen(true);
                  }}
                  className="w-full sm:w-auto"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  수정
                </Button>
              </div>
              <div className="flex flex-col md:flex-row gap-6">
                {/* 로고 */}
                {partner.logoUrl && (
                  <div className="shrink-0 self-center md:self-start">
                    <img 
                      src={resolveLogoUrl(partner.logoUrl)} 
                      alt={partner.name}
                      className="h-24 w-24 rounded-md object-cover border border-border"
                    />
                  </div>
                )}
                
                {/* 정보 */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <Label className="text-muted-foreground text-xs">파트너 코드</Label>
                    <p className="mt-1">{partner.code}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">파트너명</Label>
                    <p className="mt-1">{partner.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">파트너 유형</Label>
                    <p className="mt-1">{(partner as any).type || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">사업자번호</Label>
                    <p className="mt-1">{partner.businessNumber || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">주소</Label>
                    <p className="mt-1">{partner.address || "-"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-[8px] border p-4 md:p-6">
              <h3 className="text-[15px] mb-4">담당자 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div>
                  <Label className="text-muted-foreground text-xs">담당자명</Label>
                  <p className="mt-1">{partner.managerName || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">이메일</Label>
                  <p className="mt-1">{partner.managerEmail || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">전화번호</Label>
                  <p className="mt-1">{partner.managerPhone || "-"}</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-[8px] border p-4 md:p-6" data-tour="detail-contract-card">
              <h3 className="text-[15px] mb-4">계약 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div>
                  <Label className="text-muted-foreground text-xs">계약 시작일</Label>
                  <p className="mt-1">{partner.contractStartDate ? partner.contractStartDate.split("T")[0] : "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">계약 종료일</Label>
                  <p className="mt-1">{partner.contractEndDate ? partner.contractEndDate.split("T")[0] : "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">수수료율</Label>
                  <p className="mt-1">{partner.commissionRate}%</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">쿠폰코드 생성</Label>
                  <p className="mt-1">{partner.couponCode ? "관리자 자동 생성" : "파트너 생성"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">티켓코드 유형</Label>
                  <p className="mt-1">{(partner as any).ticketCodeType || "-"}</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* 현장관리자 탭 */}
        {activeTab === "supervisors" && (
          <div className="space-y-4">
            {/* 액션 버튼 */}
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setSupervisorFormData({
                    username: "",
                    password: "",
                    name: "",
                    email: "",
                    phone: "",
                    partnerId: id || "",
                    active: true,
                  });
                  setIsSupervisorEditMode(false);
                  setIsSupervisorDialogOpen(true);
                }}
                className="gap-2"
                data-tour="supervisor-add-btn"
              >
                <Plus className="h-4 w-4" />
                현장관리자 추가
              </Button>
            </div>

            {/* 현장관리자 목록 */}
            <div data-tour="supervisor-table">
              {/* 모바일 카드 */}
              <div className="md:hidden space-y-3">
                {supervisors.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">등록된 현장관리자가 없습니다</p>
                ) : supervisors.map((row) => (
                  <div
                    key={row.id}
                    className="relative bg-card rounded-[8px] p-4 flex items-center justify-between gap-3 cursor-pointer"
                    onClick={() => { setViewingSupervisor(row); setIsSupervisorViewDialogOpen(true); }}
                  >
                    <div aria-hidden="true" className="absolute border border-border inset-0 rounded-[8px] pointer-events-none" />
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{row.name}</p>
                        <Badge variant={row.active ? "default" : "secondary"} className="text-[10px]">
                          {row.active ? "활성" : "비활성"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{row.email}</p>
                      <p className="text-xs text-muted-foreground">{row.phone}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                        onClick={(e) => { e.stopPropagation(); handleOpenSupervisorDialog(row); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setSelectedSupervisor(row); setIsDeleteSupervisorDialogOpen(true); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {/* 데스크톱 테이블 */}
              <div className="hidden md:block">
                <DataTable
                  data={supervisors}
                  columns={[
                    {
                      field: "name",
                      header: "이름",
                      width: "w-[120px]",
                      render: (value) => (
                        <span className="text-[12px]">{value}</span>
                      ),
                    },
                    {
                      field: "email",
                      header: "이메일",
                      grow: true,
                      render: (value) => (
                        <span className="text-[12px]">{value}</span>
                      ),
                    },
                    {
                      field: "phone",
                      header: "연락처",
                      width: "w-[140px]",
                      render: (value) => (
                        <span className="text-[12px]">{value}</span>
                      ),
                    },
                    {
                      field: "active",
                      header: "상태",
                      width: "w-[80px]",
                      render: (value) => (
                        <Badge variant={value ? "default" : "secondary"} className="text-[10px]">
                          {value ? "활성" : "비활성"}
                        </Badge>
                      ),
                    },
                    {
                      field: "actions",
                      header: "작업",
                      width: "w-[100px]",
                      align: "center",
                      render: (_, row) => (
                        <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenSupervisorDialog(row);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSupervisor(row);
                              setIsDeleteSupervisorDialogOpen(true);
                            }}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ),
                    },
                  ]}
                  language={language}
                  onRowClick={(row) => {
                    setViewingSupervisor(row);
                    setIsSupervisorViewDialogOpen(true);
                  }}
                  tableId="partner-supervisors"
                  disableDrag={true}
                />
              </div>
            </div>
          </div>
        )}

        {/* 적용상품 탭 */}
        {activeTab === "products" && (
          <div data-tour="products-table">
          <DataTable
            data={products}
            columns={[
              {
                field: "name",
                header: "상품명",
                grow: true,
              },
              {
                field: "category",
                header: "카테고리",
                width: "w-[120px]",
                align: "center",
                render: (value) => (
                  <Badge variant="outline" className="text-xs">
                    {value}
                  </Badge>
                ),
              },
              {
                field: "price",
                header: "가격",
                width: "w-[140px]",
                align: "right",
                render: (value) => `${formatCurrency(value)}`,
              },
              {
                field: "salesCount",
                header: "판매량",
                width: "w-[100px]",
                align: "center",
                render: (value) => formatCurrency(value),
              },
              {
                field: "revenue",
                header: "매출",
                width: "w-[140px]",
                align: "right",
                render: (value) => `₩${formatCurrency(value)}`,
              },
              {
                field: "salesStatus",
                header: "판매상태",
                width: "w-[100px]",
                align: "center",
                render: (value) => {
                  const statusStyles: Record<string, string> = {
                    "준비중": "bg-gray-500/10 text-gray-500",
                    "판���중": "bg-green-500/10 text-green-500",
                    "품절": "bg-red-500/10 text-red-500",
                    "판매중단": "bg-orange-500/10 text-orange-500",
                  };
                  return (
                    <Badge className={statusStyles[value] || "bg-gray-500/10 text-gray-500"}>
                      {value}
                    </Badge>
                  );
                },
              },
            ]}
            language={language}
            tableId="partner-products"
            disableDrag={true}
            disableSettings={true}
            onRowClick={(product) => {
              setSelectedProduct(product);
              setIsProductDetailDialogOpen(true);
            }}
          />
          </div>
        )}

        {/* 판매현황 탭 */}
        {activeTab === "sales" && (
          <div className="space-y-6">
            {isSalesLoading ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
                통계 데이터를 불러오는 중...
              </div>
            ) : (
              <>
                {/* 요약 통계 카드 */}
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4" data-tour="sales-summary">
                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">총 매출</p>
                        <p className="text-2xl mt-2">
                          ₩{formatCurrency(salesSummary?.totalRevenue ?? 0)}
                        </p>
                      </div>
                      <div className="h-12 w-12 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#34c75920" }}>
                        <DollarSign className="h-6 w-6" style={{ color: "#34c759" }} />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">총 주문</p>
                        <p className="text-2xl mt-2">
                          {formatCurrency(salesSummary?.totalOrders ?? 0)}
                        </p>
                      </div>
                      <div className="h-12 w-12 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#0c8ce920" }}>
                        <ShoppingCart className="h-6 w-6" style={{ color: "#0c8ce9" }} />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">판매 티켓</p>
                        <p className="text-2xl mt-2">
                          {formatCurrency(salesSummary?.totalTickets ?? 0)}
                        </p>
                      </div>
                      <div className="h-12 w-12 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#af52de20" }}>
                        <Ticket className="h-6 w-6" style={{ color: "#af52de" }} />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-card p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">평균 주문금액</p>
                        <p className="text-2xl mt-2">
                          ₩{formatCurrency(salesSummary?.averageOrderValue ?? 0)}
                        </p>
                      </div>
                      <div className="h-12 w-12 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "#ff950020" }}>
                        <Package className="h-6 w-6" style={{ color: "#ff9500" }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 차트 */}
                <div className="grid gap-5 md:grid-cols-2">
                  {/* 일별 매출 추이 */}
                  <div className="bg-card rounded-[8px] border p-6">
                    <h3 className="text-[15px] mb-4">일별 매출 추이 (최근 30일)</h3>
                    {dailySalesData.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-10">데이터가 없습니다.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={dailySalesData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                          <YAxis />
                          <Tooltip formatter={(v: number) => [`₩${formatCurrency(v)}`, "매출"]} />
                          <Legend />
                          <Line type="monotone" dataKey="revenue" stroke="#0c8ce9" name="매출" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* 카테고리별 매출 */}
                  <div className="bg-card rounded-[8px] border p-6">
                    <h3 className="text-[15px] mb-4">카테고리별 매출</h3>
                    {categorySalesData.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-10">데이터가 없습니다.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={categorySalesData}
                            dataKey="revenue"
                            nameKey="category"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label
                          >
                            {categorySalesData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: number) => `₩${formatCurrency(v)}`} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* 상위 판매 상품 */}
                <div className="bg-card rounded-[8px] border p-6">
                  <h3 className="text-[15px] mb-4">상위 판매 상품</h3>
                  {topProductsData.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">데이터가 없습니다.</p>
                  ) : (
                    <div className="space-y-3">
                      {topProductsData.map((product, index) => (
                        <div
                          key={product.productCode}
                          className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-2xl text-muted-foreground">#{index + 1}</div>
                            <div>
                              <p className="font-medium">{product.productName}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatCurrency(product.tickets)}개 판매 · 코드: {product.productCode}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">₩{formatCurrency(product.revenue)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Supervisor 다이얼로그 */}
      <Dialog
        open={isSupervisorDialogOpen}
        modal={!isTourActive}
        onOpenChange={(open) => {
          if (isTourActive && !open) return;
          setIsSupervisorDialogOpen(open);
        }}
      >
        <DialogContent
          className="max-w-2xl"
          onInteractOutside={(e) => { if (isTourActive) e.preventDefault(); }}
          onEscapeKeyDown={(e) => { if (isTourActive) e.preventDefault(); }}
        >
          <DialogHeader>
            <DialogTitle>
              {isSupervisorEditMode ? "현장관리자 수정" : "현장관리자 추가"}
            </DialogTitle>
            <DialogDescription>현장관리자 정보를 입력해주세요.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* 현장관리자 정보 입력 카드 */}
            <div className="border border-border rounded-lg p-6 bg-background">
              <h3 className="text-sm font-medium mb-4">현장관리자 정보</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-tour="supervisor-dialog-account">
                  <div className="space-y-2">
                    <Label className="text-xs">사용자명 *</Label>
                    <Input
                      value={supervisorFormData.username}
                      onChange={(e) =>
                        setSupervisorFormData({ ...supervisorFormData, username: e.target.value })
                      }
                      placeholder="supervisor1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">비밀번호 *</Label>
                    <Input
                      type="password"
                      value={supervisorFormData.password}
                      onChange={(e) =>
                        setSupervisorFormData({ ...supervisorFormData, password: e.target.value })
                      }
                      placeholder="비밀번호 입력"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-tour="supervisor-dialog-contact">
                  <div className="space-y-2">
                    <Label className="text-xs">이름*</Label>
                    <Input
                      value={supervisorFormData.name}
                      onChange={(e) =>
                        setSupervisorFormData({ ...supervisorFormData, name: e.target.value })
                      }
                      placeholder="김담당자"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">이메일</Label>
                    <Input
                      type="email"
                      value={supervisorFormData.email}
                      onChange={(e) =>
                        setSupervisorFormData({ ...supervisorFormData, email: e.target.value })
                      }
                      placeholder="supervisor1@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">전화번호</Label>
                    <Input
                      type="tel"
                      value={supervisorFormData.phone}
                      onChange={(e) =>
                        setSupervisorFormData({ ...supervisorFormData, phone: e.target.value })
                      }
                      placeholder="010-1234-5678"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 활성화 상태 카드 */}
            <div className="border border-border rounded-lg p-6 bg-background">
              <h3 className="text-sm font-medium mb-4">활성화 상태</h3>
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={supervisorFormData.active}
                  onCheckedChange={(checked) =>
                    setSupervisorFormData({
                      ...supervisorFormData,
                      active: checked,
                    })
                  }
                />
                <Label htmlFor="active" className="cursor-pointer">활성화</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSupervisorDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSaveSupervisor}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog
        open={isDeleteSupervisorDialogOpen}
        onOpenChange={setIsDeleteSupervisorDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>담당자 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 담당자를 삭제하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSupervisor}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 현장관리자 상세 보기 모달 */}
      <Dialog open={isSupervisorViewDialogOpen} onOpenChange={setIsSupervisorViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-semibold">현장관리자 상세 정보</DialogTitle>
            <DialogDescription className="flex items-center justify-between">
              <span>현장관리자의 상세 정보를 확인할 수 있습니다.</span>
              {viewingSupervisor && (
                <Badge
                  className={
                    viewingSupervisor.active
                      ? "bg-green-500/10 text-green-500"
                      : "bg-gray-500/10 text-gray-500"
                  }
                >
                  {viewingSupervisor.active ? "활성" : "비활성"}
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>

          {viewingSupervisor && (
            <div className="space-y-6 py-4">
              {/* 프로필 */}
              <div className="flex items-center gap-4">
                {viewingSupervisor.logoUrl ? (
                  <img
                    src={viewingSupervisor.logoUrl}
                    alt={viewingSupervisor.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xl font-semibold text-primary">
                      {viewingSupervisor.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold">{viewingSupervisor.name}</h3>
                  <p className="text-sm text-muted-foreground">@{viewingSupervisor.username}</p>
                </div>
              </div>

              <div className="border-t" />

              {/* 계정 정보 */}
              <div>
                <h4 className="text-sm font-semibold mb-3">계정 정보</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">아이디</Label>
                    <p className="mt-1">{viewingSupervisor.username}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">비밀번호</Label>
                    <p className="mt-1">{viewingSupervisor.password}</p>
                  </div>
                </div>
              </div>

              <div className="border-t" />

              {/* 기본 정보 */}
              <div>
                <h4 className="text-sm font-semibold mb-3">기본 정보</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">이메일</Label>
                    <p className="mt-1">{viewingSupervisor.email}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">전화번호</Label>
                    <p className="mt-1">{viewingSupervisor.phone}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">소속 파트너</Label>
                    <p className="mt-1">{viewingSupervisor.partnerName}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">등록일</Label>
                    <p className="mt-1">{formatDate(viewingSupervisor.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsSupervisorViewDialogOpen(false);
                if (viewingSupervisor) {
                  handleOpenSupervisorDialog(viewingSupervisor);
                }
              }}
            >
              수정
            </Button>
            <Button onClick={() => setIsSupervisorViewDialogOpen(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 상품 상세 다이얼로그 */}
      <Dialog open={isProductDetailDialogOpen} onOpenChange={setIsProductDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>상품 상세 정보</DialogTitle>
            <DialogDescription className="flex items-center justify-between">
              <span>상품의 상세 정보를 확인할 수 있습니다.</span>
              {selectedProduct && (
                <Badge
                  className={
                    selectedProduct.salesStatus === "판매중"
                      ? "bg-green-500/10 text-green-500"
                      : selectedProduct.salesStatus === "준비중"
                      ? "bg-gray-500/10 text-gray-500"
                      : selectedProduct.salesStatus === "품절"
                      ? "bg-red-500/10 text-red-500"
                      : "bg-orange-500/10 text-orange-500"
                  }
                >
                  {selectedProduct.salesStatus}
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-6 py-4">
              {/* 기본 정보 */}
              <div>
                <h4 className="text-sm font-semibold mb-3">기본 정보</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">상품명</Label>
                    <p className="mt-1">{selectedProduct.productName}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">카테고리</Label>
                    <p className="mt-1">
                      <Badge variant="outline" className="text-xs">
                        {selectedProduct.categoryName}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">가격</Label>
                    <p className="mt-1 text-lg">₩{formatCurrency(selectedProduct.price)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">판매상태</Label>
                    <p className="mt-1">{selectedProduct.salesStatus}</p>
                  </div>
                </div>
              </div>

              <div className="border-t" />

              {/* 재고 및 판매 정보 */}
              <div>
                <h4 className="text-sm font-semibold mb-3">재고 및 판매 정보</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">재고</Label>
                    <p className="mt-1 text-lg">{formatCurrency(selectedProduct.stock)}개</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">판매량</Label>
                    <p className="mt-1 text-lg">{formatCurrency(selectedProduct.salesCount)}개</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">매출</Label>
                    <p className="mt-1 text-lg">₩{formatCurrency(selectedProduct.revenue)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">등록일</Label>
                    <p className="mt-1">{formatDate(selectedProduct.registeredAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsProductDetailDialogOpen(false)}
            >
              닫기
            </Button>
            <Button
              onClick={() => {
                setIsProductDetailDialogOpen(false);
                navigate(`/admin/products?selectedId=${selectedProduct?.productId}`);
              }}
            >
              <Package className="h-4 w-4 mr-2" />
              해당 상품으로 이동
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 파트너 정보 수정 다이얼로그 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl sm:max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-semibold">파트너 정보 수정</DialogTitle>
            <DialogDescription>파트너 정보를 수정합니다.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 기본 정보 */}
            <div className="border border-border rounded-lg p-6 bg-background">
              <h3 className="text-sm font-medium mb-4">기본 정보</h3>
              
              {/* 로고 미리보기 */}
              {partnerFormData.logoUrl && (
                <div className="mb-6 flex justify-center">
                  <div className="relative">
                    <img 
                      src={resolveLogoUrl(partnerFormData.logoUrl)} 
                      alt="Partner Logo"
                      className="h-24 w-24 rounded-md object-cover border border-border"
                    />
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">파트너 코드 *</Label>
                  <Input
                    value={partner?.code || ""}
                    placeholder="VENUE001"
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">파트너명 *</Label>
                  <Input
                    value={partnerFormData.name}
                    onChange={(e) => setPartnerFormData({ ...partnerFormData, name: e.target.value })}
                    placeholder="예) 롯데콘서트홀"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">상태 *</Label>
                  <Select
                    value={partnerFormData.status}
                    onValueChange={(value: PartnerStatus) =>
                      setPartnerFormData({ ...partnerFormData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="상태 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PartnerStatus.ACTIVE}>활성</SelectItem>
                      <SelectItem value={PartnerStatus.INACTIVE}>비활성</SelectItem>
                      <SelectItem value={PartnerStatus.PENDING}>대기</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">티켓코드 타입</Label>
                  <Select
                    value={partnerFormData.ticketCodeType}
                    onValueChange={(value) =>
                      setPartnerFormData({ ...partnerFormData, ticketCodeType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="타입 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NUMBER">숫자 (NUMBER)</SelectItem>
                      <SelectItem value="BARCODE">바코드 (BARCODE)</SelectItem>
                      <SelectItem value="QR">QR코드 (QR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">사업자번호</Label>
                  <Input
                    value={partnerFormData.businessNumber}
                    onChange={(e) => setPartnerFormData({ ...partnerFormData, businessNumber: e.target.value })}
                    placeholder="000-00-00000"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-xs">주소</Label>
                  <Input
                    value={partnerFormData.address}
                    onChange={(e) => setPartnerFormData({ ...partnerFormData, address: e.target.value })}
                    placeholder="서울특별시 강남구..."
                  />
                </div>
              </div>
            </div>

            {/* 담당자 정보 */}
            <div className="border border-border rounded-lg p-6 bg-background">
              <h3 className="text-sm font-medium mb-4">담당자 정보</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-xs">담당자명</Label>
                  <Input
                    value={partnerFormData.managerName}
                    onChange={(e) => setPartnerFormData({ ...partnerFormData, managerName: e.target.value })}
                    placeholder="홍길동"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">담당자 이메일</Label>
                  <Input
                    type="email"
                    value={partnerFormData.managerEmail}
                    onChange={(e) => setPartnerFormData({ ...partnerFormData, managerEmail: e.target.value })}
                    placeholder="manager@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">담당자 전화</Label>
                  <Input
                    value={partnerFormData.managerPhone}
                    onChange={(e) => setPartnerFormData({ ...partnerFormData, managerPhone: e.target.value })}
                    placeholder="010-0000-0000"
                  />
                </div>
              </div>
            </div>

            {/* 계약 정보 */}
            <div className="border border-border rounded-lg p-6 bg-background">
              <h3 className="text-sm font-medium mb-4">계약 정보</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">계약 시작일</Label>
                  <DatePicker
                    value={partnerFormData.contractStartDate || undefined}
                    onChange={(dateStr) => setPartnerFormData({ ...partnerFormData, contractStartDate: dateStr })}
                    placeholder="계약 시작일 선택"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">계약 종료일</Label>
                  <DatePicker
                    value={partnerFormData.contractEndDate || undefined}
                    onChange={(dateStr) => setPartnerFormData({ ...partnerFormData, contractEndDate: dateStr })}
                    placeholder="계약 종료일 선택"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">수수료율 (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={partnerFormData.commissionRate}
                    onChange={(e) =>
                      setPartnerFormData({ ...partnerFormData, commissionRate: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="15"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">쿠폰코드 생성 여부</Label>
                  <Select
                    value={partnerFormData.couponCode ? 'Y' : 'N'}
                    onValueChange={(value: 'Y' | 'N') =>
                      setPartnerFormData({ ...partnerFormData, couponCode: value === 'Y' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Y">관리자 자동 생성</SelectItem>
                      <SelectItem value="N">파트너 생성</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">
                    관리자 자동 생성: 시스템에서 자동으로 쿠폰 코드 생성 | 파트너 생성: 파트너사에서 직접 쿠폰 코드 생성
                  </p>
                </div>
              </div>
            </div>

            {/* 추가 정보 */}
            <div className="border border-border rounded-lg p-6 bg-background">
              <h3 className="text-sm font-medium mb-4">추가 정보</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">설명</Label>
                  <Textarea
                    value={partnerFormData.description}
                    onChange={(e) => setPartnerFormData({ ...partnerFormData, description: e.target.value })}
                    placeholder="파트너에 대한 설명을 입력하세요"
                    rows={3}
                  />
                </div>
              </div>
            </div>

          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={async () => {
              if (!partner) return;
              
              try {
                // API 호출
                const patchPayload = {
                  code: partner.code,
                  name: partnerFormData.name,
                  type: partner.type,
                  ticketCodeType: partnerFormData.ticketCodeType || "NUMBER",
                  status: partnerFormData.status || PartnerStatus.ACTIVE,
                  businessNumber: partnerFormData.businessNumber || "",
                  address: partnerFormData.address || "",
                  managerName: partnerFormData.managerName || "",
                  managerEmail: partnerFormData.managerEmail || "",
                  managerPhone: partnerFormData.managerPhone || "",
                  contractStartDate: partnerFormData.contractStartDate || "",
                  contractEndDate: partnerFormData.contractEndDate || "",
                  commissionRate: partnerFormData.commissionRate,
                  logoUrl: partnerFormData.logoUrl || "",
                  couponCode: partnerFormData.couponCode ?? true,
                  description: partnerFormData.description || "",
                };
                console.log('📤 [Partner Update] Full PATCH payload:', JSON.stringify(patchPayload));
                const apiResponse = await updatePartnerApi(id!, patchPayload);

                if (apiResponse.success) {
                  toast.success("파트너 정보가 수정되었습니다.");
                  
                  // 파트너 정보 새로고침
                  const response = await getPartnerDetail(id!);
                  if (response.success && response.data) {
                    const updatedPartner: Partner = {
                      id: response.data.code,
                      code: response.data.code,
                      name: response.data.name,
                      type: response.data.type as PartnerType,
                      status: (response.data.status as PartnerStatus) || PartnerStatus.ACTIVE,
                      managerName: response.data.managerName,
                      managerEmail: response.data.managerEmail,
                      managerPhone: response.data.managerPhone,
                      businessNumber: response.data.businessNumber,
                      address: response.data.address,
                      contractStartDate: response.data.contractStartDate || new Date().toISOString(),
                      contractEndDate: response.data.contractEndDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
                      commissionRate: response.data.commissionRate,
                      couponCode: response.data.couponCode ?? true,
                      description: response.data.description,
                      logoUrl: response.data.logoUrl,
                      productCount: partner.productCount,
                      createdAt: partner.createdAt,
                      updatedAt: new Date().toISOString(),
                    };
                    setPartner(updatedPartner);
                  }
                  
                  setIsEditDialogOpen(false);
                } else if (apiResponse.message === 'local_fallback') {
                  // 서버 사용 불가 시 로컬 모드로 폴백
                  if (!isApiOnlyMode()) {
                    console.log('서버 사용 불가, 로컬 데이터 업데이트');
                    const response = updatePartner(partner.id, partnerFormData);
                    if (response.success) {
                      toast.success("파트너 정보가 수정되었습니다.");
                      setPartner(response.data);
                      setIsEditDialogOpen(false);
                    } else {
                      toast.error(response.message);
                    }
                  } else {
                    toast.error("서버 연결에 실패했습니다.");
                  }
                } else {
                  // API 실패 시 처리
                  if (!isApiOnlyMode()) {
                    const response = updatePartner(partner.id, partnerFormData);
                    if (response.success) {
                      toast.success("파트너 정보가 수정되었습니다.");
                      setPartner(response.data);
                      setIsEditDialogOpen(false);
                    } else {
                      toast.error(response.message);
                    }
                  } else {
                    toast.error(apiResponse.message || "파트너 정보 수정에 실패했습니다.");
                  }
                }
              } catch (error) {
                console.error("파트너 수정 실패:", error);
                toast.error("파트너 수정 중 오류가 발생했습니다.");
              }
            }}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 투어 가이드 */}
      <CoachMark
        steps={detailTourSteps}
        isActive={isTourActive}
        onFinish={() => {
          setActiveTab("basic");
          endTour();
        }}
        storageKey="partner_detail_tour"
        onStepChange={handleDetailTourStepChange}
      />
    </div>
  );
}
export default PartnerDetail;
