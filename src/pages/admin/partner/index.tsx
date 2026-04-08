// Partner Management - Manage ticket supplier partners (Fixed v4)
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { CoachMark, useCoachMark, TourHelpButton, type TourStep } from "@/components/coach-mark";
import type { Partner, CreatePartnerDto } from "@/data/dto/partner.dto";
import { PartnerType, PartnerStatus } from "@/data/dto/partner.dto";
import {
  getPartners as getPartnersAPI,
  createPartner as createPartnerAPI,
  updatePartner as updatePartnerAPI,
  deletePartner as deletePartnerAPI,
  togglePartnerStatus as togglePartnerStatusAPI,
  getPartnerDetail as getPartnerDetailAPI,
  type PartnerListItem,
  type PartnerRequest,
} from "@/lib/api/partner";
import { ResponsivePartnerTable } from "@/components/ui/responsive-partner-table";
import { TablePagination } from "@/components/common/table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";

type Language = "ko" | "en";

interface PartnerManagementProps {
  language: Language;
}

export function PartnerManagement({ language }: PartnerManagementProps) {
  const navigate = useNavigate();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // 투어 가이드
  const tourSteps: TourStep[] = [
    {
      target: "partner-add-btn",
      title: "파트너 추가",
      description: "새로운 파트너를 등록합니다.\n현장관리자 또는 연동처 타입으로 추가할 수 있습니다.",
      placement: "bottom",
    },
    {
      target: "partner-dialog-basic",
      title: "기본 정보 입력",
      description: "파트너 코드, 이름, 타입(현장관리자/연동처),\n상태, 사업자번호, 주소를 입력합니다.\n코드는 영문·숫자만 가능합니다.",
      placement: "bottom",
      waitForTarget: 1500,
    },
    {
      target: "partner-dialog-manager",
      title: "담당자 정보",
      description: "파트너사의 담당자 이름, 이메일, 전화번호를\n입력합니다.",
      placement: "top",
      waitForTarget: 500,
    },
    {
      target: "partner-table",
      title: "파트너 목록",
      description: "등록된 파트너 목록입니다.\n행을 클릭하면 상세 페이지로 이동합니다.\n상세 페이지에서 현장관리자, 적용상품, 판매현황을 확인할 수 있습니다.",
      placement: "top",
    },
  ];

  const { isActive: isTourActive, startTour: _startTour, endTour } = useCoachMark("partner_mgmt_tour");

  const startTour = () => {
    if (partners.length === 0) {
      setPartners([{
        id: "dummy-p", code: "SAMPLE001", name: "[투어용] 샘플 파트너",
        type: "FIELD_MANAGER" as any, status: "ACTIVE" as any,
        managerName: "김담당", managerEmail: "sample@test.com", managerPhone: "010-0000-0000",
        visible: true,
      } as any]);
    }
    _startTour();
  };

  const handleTourStepChange = (stepIndex: number, _step: TourStep) => {
    if (stepIndex === 1 || stepIndex === 2) {
      if (!isDialogOpen) {
        setIsEditMode(false);
        setSelectedPartner(null);
        handleOpenDialog();
      }
    } else {
      if (isDialogOpen) setIsDialogOpen(false);
    }
  };

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [formData, setFormData] = useState<CreatePartnerDto>({
    code: "",
    name: "",
    type: PartnerType.PARTNER,
    status: PartnerStatus.ACTIVE,
    managerName: "",
    managerEmail: "",
    managerPhone: "",
    contractStartDate: "",
    contractEndDate: "",
    commissionRate: 15,
    couponCode: true,
    businessNumber: "",
    address: "",
    description: "",
    logoUrl: "",
  });

  // 파트너 목록 조회
  const fetchPartners = async () => {
    const response = await getPartnersAPI();
    if (response.success && response.data) {
      // API 응답 데이터가 배열인지 확인
      const dataArray = Array.isArray(response.data) ? response.data : [];
      
      // API 응답을 Partner 형식으로 변환
      const apiPartners: Partner[] = dataArray.map((p: PartnerListItem) => ({
        id: p.id, // API가 반환하는 id 사용 (필수)
        code: p.code,
        name: p.name,
        type: p.type,
        status: p.status,
        managerName: p.managerName,
        managerEmail: '',
        managerPhone: '',
        businessNumber: '',
        address: '',
        contractStartDate: p.contractStartDate,
        contractEndDate: p.contractEndDate,
        commissionRate: p.commissionRate,
        couponCode: true,
        description: '',
        logoUrl: '',
        productCount: 0,
        totalSales: 0,
        totalOrders: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      setPartners(apiPartners);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  // ⭐ 컴포넌트 언마운트 시 필터 상태 초기화
  useEffect(() => {
    return () => {
      setSearchQuery("");
      setFilterType("ALL");
      setFilterStatus("ALL");
      setCurrentPage(1);
    };
  }, []);

  // 검색 및 필터링
  const filteredPartners = partners.filter((partner) => {
    const matchesSearch =
      partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (partner.managerName || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === "ALL" || partner.type === filterType;
    const matchesStatus = filterStatus === "ALL" || partner.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  // 파트너 생성/수정 다이얼로그 열기
  const handleOpenDialog = (partner?: Partner) => {
    if (partner) {
      setIsEditMode(true);
      setSelectedPartner(partner);
      
      // 기존 partner 데이터로 formData 설정
      setFormData({
        code: partner.code,
        name: partner.name,
        type: partner.type,
        status: partner.status,
        managerName: partner.managerName,
        managerEmail: partner.managerEmail,
        managerPhone: partner.managerPhone,
        contractStartDate: partner.contractStartDate.split("T")[0],
        contractEndDate: partner.contractEndDate.split("T")[0],
        commissionRate: partner.commissionRate,
        couponCode: partner.couponCode,
        businessNumber: partner.businessNumber || "",
        address: partner.address || "",
        description: partner.description || "",
        logoUrl: partner.logoUrl || "",
      });
    } else {
      setIsEditMode(false);
      setSelectedPartner(null);
      setFormData({
        code: "",
        name: "",
        type: PartnerType.PARTNER,
        status: PartnerStatus.ACTIVE,
        managerName: "",
        managerEmail: "",
        managerPhone: "",
        contractStartDate: "",
        contractEndDate: "",
        commissionRate: 15,
        couponCode: true,
        businessNumber: "",
        address: "",
        description: "",
        logoUrl: "",
      });
    }
    setIsDialogOpen(true);
  };

  // 파트너 생성/수정 제출
  const handleSubmit = async () => {
    try {
      if (isEditMode && selectedPartner) {
        const response = await updatePartnerAPI(selectedPartner.id, formData as PartnerRequest);
        if (response.success) {
          toast.success("파트너가 수정되었습니다.");
          await fetchPartners();
          setIsDialogOpen(false);
        } else {
          toast.error(response.message || "파트너 수정에 실패했습니다.");
        }
      } else {
        const response = await createPartnerAPI(formData as PartnerRequest);
        if (response.success) {
          toast.success("파트너가 추가되었습니다.");
          await fetchPartners();
          setIsDialogOpen(false);
        } else {
          toast.error(response.message || "파트너 추가에 실패했습니다.");
        }
      }
    } catch (error) {
      toast.error("오류가 발생했습니다.");
    }
  };

  // 파트너 삭제 다이얼로그 열기
  const handleOpenDeleteDialog = (partner: Partner) => {
    setSelectedPartner(partner);
    setIsDeleteDialogOpen(true);
  };

  // 파트너 삭제
  const handleDelete = async () => {
    if (selectedPartner) {
      try {
        const response = await deletePartnerAPI(selectedPartner.id);
        if (response.success) {
          toast.success("파트너가 삭제되었습니다.");
          await fetchPartners();
          setIsDeleteDialogOpen(false);
        } else {
          toast.error(response.message || "파트너 삭제에 실패했습니다.");
        }
      } catch (error) {
        toast.error("오류가 발생했습니다.");
      }
    }
  };

  // 파트너 상세 페이지로 이동
  const handleViewDetail = (partnerId: string) => {
    navigate(`/admin/partners/${partnerId}`);
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

  // 타입을 한글로 변환하는 헬퍼 함수
  const getTypeLabel = (type: PartnerType): string => {
    const labels: Record<PartnerType, string> = {
      [PartnerType.FIELD_MANAGER]: '현장관리자',
      [PartnerType.PARTNER]: '연동처',
    };
    return labels[type] || type;
  };

  // 파트너 활성화 상태 토글
  const handleToggleStatus = async (partner: Partner, checked: boolean) => {
    const newStatus = checked ? PartnerStatus.ACTIVE : PartnerStatus.INACTIVE;
    
    // 낙관적 UI 업데이트 (즉시 UI 변경)
    setPartners((prevPartners) =>
      prevPartners.map((p) =>
        p.id === partner.id ? { ...p, status: newStatus } : p
      )
    );
    
    try {
      const response = await togglePartnerStatusAPI(partner.id, newStatus);
      
      if (response.success) {
        toast.success(checked ? "파트너가 활성화되었습니다." : "파트너가 비활성화되었습니다.");
      } else {
        // API 실패 시 롤백
        setPartners((prevPartners) =>
          prevPartners.map((p) =>
            p.id === partner.id ? { ...p, status: partner.status } : p
          )
        );
        toast.error(response.message || "상태 변경에 실패했습니다.");
      }
    } catch (error) {
      // 에러 발생 시 롤백
      setPartners((prevPartners) =>
        prevPartners.map((p) =>
          p.id === partner.id ? { ...p, status: partner.status } : p
        )
      );
      toast.error("오류가 발생했습니다.");
    }
  };

  // 상태 뱃지 스타일
  const getStatusBadgeVariant = (status: PartnerStatus) => {
    switch (status) {
      case PartnerStatus.ACTIVE:
        return "default";
      case PartnerStatus.PENDING:
        return "secondary";
      case PartnerStatus.SUSPENDED:
        return "destructive";
      case PartnerStatus.INACTIVE:
        return "outline";
      default:
        return "outline";
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}/${day}`;
  };

  // 금액 포맷팅
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR").format(amount);
  };

  // CSV 내보내기
  const handleExportCSV = () => {
    try {
      // CSV 헤더
      const headers = [
        "파트너코드",
        "파트너명",
        "타입",
        "상태",
        "담당자",
        "담당자 이메일",
        "담당자 전화",
        "사업자번호",
        "주소",
        "등록상품 수",
        "활성화"
      ];

      // CSV 데이터 생성
      const csvData = filteredPartners.map((partner) => {
        return [
          partner.code,
          `"${partner.name}"`,
          partner.type,
          getStatusLabel(partner.status),
          partner.managerName,
          partner.managerEmail,
          partner.managerPhone,
          partner.businessNumber || "-",
          `"${partner.address || "-"}"`,
          partner.productCount,
          partner.status === PartnerStatus.ACTIVE ? "활성" : "비활성"
        ].join(",");
      });

      // CSV 파일 생성
      const csvContent = [
        "\uFEFF" + headers.join(","), // UTF-8 BOM 추가
        ...csvData
      ].join("\n");

      // 파일 다운로드
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute("download", `파트너목록_${new Date().toISOString().slice(0, 10)}.csv`);
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
      // Excel 데이터 준비
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
                <th>파트너코드</th>
                <th>파트너명</th>
                <th>타입</th>
                <th>상태</th>
                <th>담당자</th>
                <th>담당자 이메일</th>
                <th>담당자 전화</th>
                <th>사업자번호</th>
                <th>주소</th>
                <th>등록상품 수</th>
                <th>활성화</th>
                <th>설명</th>
              </tr>
            </thead>
            <tbody>
      `;

      filteredPartners.forEach((partner) => {
        html += "<tr>";
        html += `<td>${partner.code}</td>`;
        html += `<td>${partner.name}</td>`;
        html += `<td>${partner.type}</td>`;
        html += `<td>${getStatusLabel(partner.status)}</td>`;
        html += `<td>${partner.managerName}</td>`;
        html += `<td>${partner.managerEmail}</td>`;
        html += `<td>${partner.managerPhone}</td>`;
        html += `<td>${partner.businessNumber || "-"}</td>`;
        html += `<td>${partner.address || "-"}</td>`;
        html += `<td>${partner.productCount}</td>`;
        html += `<td>${partner.status === PartnerStatus.ACTIVE ? "활성" : "비활성"}</td>`;
        html += `<td>${partner.description || "-"}</td>`;
        html += "</tr>";
      });

      html += `
            </tbody>
          </table>
        </body>
        </html>
      `;

      // 파일 다운로드
      const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute("download", `파트너목록_${new Date().toISOString().slice(0, 10)}.xls`);
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

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredPartners.length / itemsPerPage);
  const paginatedPartners = filteredPartners.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        title="파트너 관리"
        subtitle="티켓 공급 파트너를 관리합니다."
        language={language}
        rightContent={
          <TourHelpButton onClick={startTour} />
        }
      />

      {/* Responsive Table */}
      <ResponsivePartnerTable
        partners={paginatedPartners}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterType={filterType}
        setFilterType={setFilterType}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        onOpenDialog={handleOpenDialog}
        onViewDetail={handleViewDetail}
        onToggleStatus={handleToggleStatus}
        onOpenDeleteDialog={handleOpenDeleteDialog}
        onExportCSV={handleExportCSV}
        onExportExcel={handleExportExcel}
        pagination={
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredPartners.length}
            itemsPerPage={itemsPerPage}
          />
        }
      />

      {/* 파트너 추가/수정 Dialog */}
      <Dialog
        open={isDialogOpen}
        modal={!isTourActive}
        onOpenChange={(open) => {
          if (isTourActive && !open) return;
          setIsDialogOpen(open);
        }}
      >
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => { if (isTourActive) e.preventDefault(); }}
          onEscapeKeyDown={(e) => { if (isTourActive) e.preventDefault(); }}
        >
          <DialogHeader>
            <DialogTitle>{isEditMode ? "파트너 수정" : "파트너 추가"}</DialogTitle>
            <DialogDescription>
              {isEditMode ? "파트너 정보를 수정합니다." : "새로운 파트너를 추가합니다."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* 기본 정보 */}
            <div className="space-y-4" data-tour="partner-dialog-basic">
              <h4 className="text-sm font-medium">기본 정보</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">파트너 코드 *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => {
                      // 영문, 숫자만 허용
                      const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
                      setFormData({ ...formData, code: value });
                    }}
                    placeholder="VENUE001"
                    disabled={isEditMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">파트너명 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="예) 롯데콘서트홀"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">파트너 타입 *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: PartnerType) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="파트너 타입 선택">
                        {getTypeLabel(formData.type)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PartnerType.FIELD_MANAGER}>현장관리자</SelectItem>
                      <SelectItem value={PartnerType.PARTNER}>연동처</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">상태 *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: PartnerStatus) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="상태 선택">
                        {getStatusLabel(formData.status)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PartnerStatus.ACTIVE}>활성</SelectItem>
                      <SelectItem value={PartnerStatus.INACTIVE}>비활성</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessNumber">사업자번호</Label>
                <Input
                  id="businessNumber"
                  value={formData.businessNumber}
                  onChange={(e) => {
                    // 숫자와 하이픈만 허용
                    const value = e.target.value.replace(/[^0-9-]/g, '');
                    setFormData({ ...formData, businessNumber: value });
                  }}
                  placeholder="000-00-00000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">주소</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="서울특별시 강남구..."
                />
              </div>
            </div>

            {/* 담당자 정보 */}
            <div className="space-y-4" data-tour="partner-dialog-manager">
              <h4 className="text-sm font-medium">담당자 정보</h4>
              
              <div className="space-y-2">
                <Label htmlFor="managerName">담당자명</Label>
                <Input
                  id="managerName"
                  value={formData.managerName}
                  onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                  placeholder="홍길동"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="managerEmail">담당자 이메일</Label>
                  <Input
                    id="managerEmail"
                    type="email"
                    value={formData.managerEmail}
                    onChange={(e) => {
                      // 한글 입력 방지
                      const value = e.target.value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, '');
                      setFormData({ ...formData, managerEmail: value });
                    }}
                    placeholder="manager@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="managerPhone">담당자 전화</Label>
                  <Input
                    id="managerPhone"
                    value={formData.managerPhone}
                    onChange={(e) => {
                      // 숫자와 하이픈만 허용
                      const value = e.target.value.replace(/[^0-9-]/g, '');
                      setFormData({ ...formData, managerPhone: value });
                    }}
                    placeholder="010-0000-0000"
                  />
                </div>
              </div>
            </div>

            {/* 추가 정보 */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">추가 정보</h4>

              <div className="space-y-2">
                <Label htmlFor="description">설명</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="파트너에 대한 설명을 입력하세요"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSubmit}>
              {isEditMode ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>파트너 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말 이 파트너를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedPartner && (
            <div className="mt-2 p-3 bg-muted rounded-md">
              <p className="text-sm">
                <strong>파트너명:</strong> {selectedPartner.name}
              </p>
              <p className="text-sm">
                <strong>파트너 코드:</strong> {selectedPartner.code}
              </p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 투어 가이드 */}
      <CoachMark
        steps={tourSteps}
        isActive={isTourActive}
        onFinish={() => {
          setIsDialogOpen(false);
          endTour();
        }}
        storageKey="partner_mgmt_tour"
        onStepChange={handleTourStepChange}
      />
    </div>
  );
}
export default PartnerManagement;
