import React from "react";
import { Partner, PartnerType, PartnerStatus } from "../../data/dto/partner.dto";
import { Badge } from "./badge";
import { Button } from "./button";
import { Switch } from "./switch";
import { Input } from "./input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Building2,
  Download,
  FileSpreadsheet,
  FileText,
  MoreVertical,
} from "lucide-react";

interface ResponsivePartnerTableProps {
  partners: Partner[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterType: string;
  setFilterType: (type: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  onOpenDialog: (partner?: Partner) => void;
  onViewDetail: (partnerId: string) => void;
  onToggleStatus: (partner: Partner, checked: boolean) => void;
  onOpenDeleteDialog: (partner: Partner) => void;
  onExportCSV: () => void;
  onExportExcel: () => void;
  pagination?: React.ReactNode;
}

export function ResponsivePartnerTable({
  partners,
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  filterStatus,
  setFilterStatus,
  onOpenDialog,
  onViewDetail,
  onToggleStatus,
  onOpenDeleteDialog,
  onExportCSV,
  onExportExcel,
  pagination,
}: ResponsivePartnerTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const getStatusBadge = (status: PartnerStatus) => {
    switch (status) {
      case PartnerStatus.ACTIVE:
        return <Badge variant="default" className="text-[10px]">활성</Badge>;
      case PartnerStatus.PENDING:
        return <Badge variant="secondary" className="text-[10px]">대기</Badge>;
      case PartnerStatus.SUSPENDED:
        return <Badge variant="destructive" className="text-[10px]">중단</Badge>;
      case PartnerStatus.INACTIVE:
        return <Badge variant="outline" className="text-[10px]">비활성</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: PartnerType) => {
    const typeMap: Record<string, string> = {
      [PartnerType.FIELD_MANAGER]: "현장관리자",
      [PartnerType.PARTNER]: "연동처",
    };
    return typeMap[type] || type;
  };

  return (
    <div className="bg-card relative rounded-[8px] flex-1 flex flex-col">
      <div aria-hidden="true" className="absolute border border-border border-solid inset-0 pointer-events-none rounded-[8px]" />

      <div className="flex flex-col gap-4 px-4 py-4 sm:gap-[20px] sm:items-start sm:px-[32px] sm:py-[20px] sm:flex-1 sm:overflow-hidden sm:box-border sm:content-stretch">
        {/* Search and Actions */}
        <div className="flex flex-col gap-3 w-full sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
          {/* Search */}
          <div className="bg-background box-border content-stretch flex gap-[8px] h-[36px] items-center px-[16px] py-[8px] relative rounded-[6px] shrink-0 w-full sm:w-[360px] focus-within:shadow-[0_0_0_1px_#0c8ce9] transition-shadow">
            <div aria-hidden="true" className="absolute border border-border border-solid inset-0 pointer-events-none rounded-[6px]" />
            <Search className="h-[18px] w-[18px] text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
              placeholder="파트너명, 코드, 담당자로 검색..."
              className="text-[12px] text-muted-foreground placeholder:text-muted-foreground bg-transparent border-none outline-none flex-1"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="전체 타입" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체 타입</SelectItem>
                <SelectItem value={PartnerType.FIELD_MANAGER}>현장관리자</SelectItem>
                <SelectItem value={PartnerType.PARTNER}>연동처</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="전체 상태" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체 상태</SelectItem>
                <SelectItem value={PartnerStatus.ACTIVE}>활성</SelectItem>
                <SelectItem value={PartnerStatus.PENDING}>대기</SelectItem>
                <SelectItem value={PartnerStatus.SUSPENDED}>중단</SelectItem>
                <SelectItem value={PartnerStatus.INACTIVE}>비활성</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 sm:ml-auto">
            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  내보내기
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onExportExcel}>
                  <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                  Excel (.xls)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onExportCSV}>
                  <FileText className="h-4 w-4 mr-2 text-blue-600" />
                  CSV (.csv)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Add Button */}
            <Button onClick={() => onOpenDialog()} className="gap-2" data-tour="partner-add-btn">
              <Plus className="h-4 w-4" />
              파트너 추가
            </Button>
          </div>
        </div>

        {/* Table */}
        {partners.length === 0 ? (
          <div className="flex flex-col items-center justify-center w-full py-16 gap-4">
            <Building2 className="size-12 text-muted-foreground opacity-20" />
            <p className="text-muted-foreground">등록된 파트너가 없습니다.</p>
          </div>
        ) : (
          <>
            {/* 모바일 리스트 (md 미만) */}
            <div className="md:hidden divide-y divide-border w-full">
              {partners.map((partner) => (
                <div key={partner.id} className="py-4 px-2">
                  <div className="space-y-3">
                    {/* 헤더: 파트너명, 상태, 액션 */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => onViewDetail(partner.id)}
                          className="text-sm font-medium hover:text-primary hover:underline transition-colors text-left line-clamp-2"
                        >
                          {partner.name}
                        </button>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {partner.code}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {getStatusBadge(partner.status)}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onViewDetail(partner.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              상세 보기
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onOpenDeleteDialog(partner)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* 정보 */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">타입</span>
                        <span>{getTypeBadge(partner.type)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">담당자</span>
                        <div className="text-right">
                          <div>{partner.managerName}</div>
                          {partner.managerPhone && (
                            <div className="text-xs text-muted-foreground">{partner.managerPhone}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-muted-foreground">활성화</span>
                        <Switch
                          checked={partner.status === PartnerStatus.ACTIVE}
                          onCheckedChange={(checked) => onToggleStatus(partner, checked)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 데스크톱 테이블 (md 이상) */}
            <div className="hidden md:block w-full overflow-x-auto" data-tour="partner-table">
              <div className="content-stretch flex flex-col items-start relative shrink-0 min-w-[1000px]">
                {/* Table Header */}
                <div className="h-[40px] relative shrink-0 w-full bg-muted/30">
                  <div className="content-stretch flex h-[40px] items-start overflow-clip relative rounded-[inherit] w-full">
                    <div className="basis-0 content-stretch flex grow h-full items-center min-h-px min-w-px relative shrink-0">
                      {/* 파트너코드 Header */}
                      <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[120px]">
                        <p className="text-[13px] text-nowrap whitespace-pre">파트너코드</p>
                        <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                          <div className="h-[16px] w-px bg-border" />
                        </div>
                      </div>

                      {/* 파트너명 Header */}
                      <div className="basis-0 grow h-full min-h-px min-w-px relative shrink-0">
                        <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
                          <div className="box-border content-stretch flex items-center justify-between gap-[10px] pl-[20px] pr-0 py-[7px] relative size-full">
                            <p className="text-[13px] text-nowrap whitespace-pre">파트너명</p>
                          </div>
                        </div>
                      </div>

                      {/* 타입 Header */}
                      <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[120px]">
                        <p className="text-[13px] text-nowrap whitespace-pre">타입</p>
                        <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                          <div className="h-[16px] w-px bg-border" />
                        </div>
                      </div>

                      {/* 담당자 Header */}
                      <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[180px]">
                        <p className="text-[13px] text-nowrap whitespace-pre">담당자</p>
                        <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                          <div className="h-[16px] w-px bg-border" />
                        </div>
                      </div>

                      {/* 상태 Header */}
                      <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[100px]">
                        <p className="text-[13px] text-nowrap whitespace-pre">상태</p>
                        <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                          <div className="h-[16px] w-px bg-border" />
                        </div>
                      </div>

                      {/* 활성화 Header */}
                      <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[100px]">
                        <p className="text-[13px] text-nowrap whitespace-pre">활성화</p>
                        <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                          <div className="h-[16px] w-px bg-border" />
                        </div>
                      </div>
                    </div>

                    {/* Actions Header */}
                    <div className="content-stretch flex gap-[11px] h-full items-center justify-center overflow-clip relative shrink-0 w-[40px]">
                      <div className="h-[16px] w-px bg-border" />
                    </div>
                  </div>
                  <div aria-hidden="true" className="absolute border-[1px_0px] border-border border-solid inset-0 pointer-events-none" />
                </div>

                {/* Table Body */}
                <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
                  {partners.map((partner, rowIndex) => (
                    <div
                      key={partner.id}
                      onClick={() => onViewDetail(partner.id)}
                      className={`content-stretch flex h-[52px] items-center overflow-clip relative shrink-0 w-full group transition-colors cursor-pointer ${
                        rowIndex % 2 === 0
                          ? "bg-card hover:bg-[#F3F4F6] dark:hover:bg-muted/10"
                          : "bg-[#F9FAFB] dark:bg-muted/30 hover:bg-[#F3F4F6] dark:hover:bg-muted/10"
                      }`}
                    >
                      {/* 파트너코드 Column */}
                      <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[120px]">
                        <code className="text-[12px] bg-muted px-2 py-1 rounded text-nowrap">
                          {partner.code}
                        </code>
                      </div>

                      {/* 파트너명 Column */}
                      <div className="basis-0 grow h-full min-h-px min-w-px relative shrink-0">
                        <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
                          <div className="box-border content-stretch flex items-center gap-3 pl-[20px] pr-[16px] py-[7px] relative size-full">
                            <button
                              type="button"
                              onClick={() => onViewDetail(partner.id)}
                              className="text-[14px] text-foreground text-nowrap overflow-ellipsis overflow-hidden hover:text-primary hover:underline transition-colors text-left cursor-pointer"
                            >
                              {partner.name}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 타입 Column */}
                      <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[120px]">
                        <p className="text-[13px] text-foreground">{getTypeBadge(partner.type)}</p>
                      </div>

                      {/* 담당자 Column */}
                      <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[180px]">
                        <p className="text-[13px] text-foreground text-nowrap overflow-ellipsis overflow-hidden">
                          {partner.managerName}
                        </p>
                      </div>

                      {/* 상태 Column */}
                      <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[100px]">
                        {getStatusBadge(partner.status)}
                      </div>

                      {/* 활성화 Column */}
                      <div
                        className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[100px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Switch
                          checked={partner.status === PartnerStatus.ACTIVE}
                          onCheckedChange={(checked) => onToggleStatus(partner, checked)}
                        />
                      </div>

                      {/* Actions Column */}
                      <div
                        className="content-stretch flex gap-[11px] h-full items-center justify-center overflow-clip relative shrink-0 w-[40px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button type="button" className="p-2 rounded-md transition-colors hover:bg-muted text-muted-foreground hover:text-foreground">
                              <MoreVertical className="h-[14px] w-[14px]" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onViewDetail(partner.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              상세 보기
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onOpenDeleteDialog(partner)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
        {pagination && pagination}
      </div>
    </div>
  );
}