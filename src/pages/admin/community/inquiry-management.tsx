import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { QnaPost } from "@/data/dto/community.dto";
import { toast } from "sonner";
import { Search, X, MessageCircle, CheckCircle, Clock, ShieldAlert } from "lucide-react";
import { ResponsiveCommunityTable } from "@/components/ui/responsive-community-table";
import { TablePagination } from "@/components/common/table-pagination";
import { getQnas, getQnaById, answerQna, blockQna, unblockQna, deleteQna, getQnaCount, incrementQnaViewCount } from "@/lib/api/qna";

// 1:1 문의 관리 페이지
interface InquiryManagementProps {
  language: "ko" | "en";
}

export function InquiryManagement({ language }: InquiryManagementProps) {
  const [inquiries, setInquiries] = useState<QnaPost[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "answered" | "blocked">("all");
  const [loading, setLoading] = useState(false);
  
  // Dialog 상태
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isAnswerDialogOpen, setIsAnswerDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  
  const [selectedInquiry, setSelectedInquiry] = useState<QnaPost | null>(null);
  const [inquiryToDelete, setInquiryToDelete] = useState<QnaPost | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [blockReason, setBlockReason] = useState("");
  
  // 통계 상태
  const [stats, setStats] = useState({
    allCnt: 0,
    pendingCnt: 0,
    answeredCnt: 0,
    blockedCnt: 0,
  });
  
  const itemsPerPage = 20;

  useEffect(() => {
    loadInquiries();
    loadStats();
  }, []);

  // 필터 변경 시 목록 새로고침
  useEffect(() => {
    loadInquiries();
  }, [searchQuery, startDate, endDate, filterStatus]);

  const loadStats = async () => {
    const response = await getQnaCount();
    if (response.success && response.data) {
      setStats(response.data);
    }
  };

  const loadInquiries = async () => {
    setLoading(true);
    
    // 쿼리 파라미터 생성
    const params: any = {};
    
    // 검색어 (제목+내용+작성자)
    if (searchQuery.trim()) {
      params.keyword = searchQuery.trim();
    }
    
    // 날짜 범위
    if (startDate) {
      params.begDate = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
    }
    if (endDate) {
      params.endDate = endDate.toISOString().split('T')[0]; // YYYY-MM-DD
    }
    
    // 상태 필터
    if (filterStatus !== "all") {
      params.status = filterStatus.toUpperCase(); // PENDING, ANSWERED, BLOCKED
    } else {
      params.status = 'ALL';
    }
    
    const response = await getQnas(params);
    if (response.success && response.data) {
      setInquiries(response.data);
    }
    setLoading(false);
  };

  const handleView = async (inquiry: QnaPost) => {
    // 조회수 증가
    await incrementQnaViewCount(inquiry.id);
    // 상세 정보 조회
    const response = await getQnaById(inquiry.id);
    if (response.success && response.data) {
      setSelectedInquiry(response.data);
      setIsDetailDialogOpen(true);
    } else {
      toast.error(response.message || "문의를 불러오는데 실패했습니다");
    }
  };

  const handleAnswer = () => {
    if (!selectedInquiry) return;
    setAnswerText(selectedInquiry.answer || "");
    setIsAnswerDialogOpen(true);
  };

  const handleDelete = (inquiry: QnaPost) => {
    setInquiryToDelete(inquiry);
    setIsDeleteDialogOpen(true);
  };

  const handleBlock = () => {
    setBlockReason("");
    setIsBlockDialogOpen(true);
  };

  const confirmAnswer = async () => {
    if (!selectedInquiry || !answerText.trim()) {
      toast.error("답변을 입력해주세요");
      return;
    }

    const response = await answerQna(selectedInquiry.id, answerText, "관리자");
    
    if (response.success) {
      await loadInquiries();
      await loadStats();
      toast.success("답변이 등록되었습니다");
      setIsAnswerDialogOpen(false);
      setIsDetailDialogOpen(false);
      setAnswerText("");
      setSelectedInquiry(null);
    } else {
      toast.error(response.message || "답변 등록에 실패했습니다");
    }
  };

  const confirmDelete = async () => {
    if (!inquiryToDelete) return;

    const response = await deleteQna(inquiryToDelete.id);
    
    if (response.success) {
      await loadInquiries();
      await loadStats();
      toast.success("문의가 삭제되었습니다");
      setIsDeleteDialogOpen(false);
      setIsDetailDialogOpen(false);
      setInquiryToDelete(null);
    } else {
      toast.error(response.message || "문의 삭제에 실패했습니다");
    }
  };

  const confirmBlock = async () => {
    if (!selectedInquiry || !blockReason.trim()) {
      toast.error("차단 사유를 입력해주세요");
      return;
    }

    const response = await blockQna(selectedInquiry.id, blockReason, "관리자");
    
    if (response.success) {
      await loadInquiries();
      await loadStats();
      toast.success("문의가 차단되었습니다");
      setIsBlockDialogOpen(false);
      setIsDetailDialogOpen(false);
      setBlockReason("");
      setSelectedInquiry(null);
    } else {
      toast.error(response.message || "차단에 실패했습니다");
    }
  };

  const handleUnblock = async () => {
    if (!selectedInquiry) return;

    const response = await unblockQna(selectedInquiry.id);
    
    if (response.success) {
      await loadInquiries();
      await loadStats();
      toast.success("차단이 해제되었습니다");
      setIsDetailDialogOpen(false);
      setSelectedInquiry(null);
    } else {
      toast.error(response.message || "차단 해제에 실패했습니다");
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStartDate(undefined);
    setEndDate(undefined);
    setFilterStatus("all");
    setCurrentPage(1);
  };

  // API가 이미 필터링을 수행하므로, 여기서는 단순히 페이지네이션만 처리
  const totalPages = Math.ceil(inquiries.length / itemsPerPage);
  const paginatedInquiries = inquiries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (inquiry: QnaPost) => {
    if (inquiry.isBlocked) {
      return (
        <Badge variant="destructive">
          <ShieldAlert className="h-3 w-3 mr-1" />
          차단됨
        </Badge>
      );
    }
    if (inquiry.status === "ANSWERED") {
      return (
        <Badge className="bg-green-500 hover:bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          답변완료
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-orange-500 border-orange-500">
        <Clock className="h-3 w-3 mr-1" />
        답변대기
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
          onClick={() => setFilterStatus("all")}
          className={`bg-card rounded-lg sm:border border-0 p-4 flex items-center gap-3 cursor-pointer transition-all hover:shadow-md ${
            filterStatus === "all" ? "ring-2 ring-orange-500 shadow-md" : ""
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="h-6 w-6 text-orange-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground mb-1">전체 문의</div>
            <div className="text-2xl">{stats.allCnt}</div>
          </div>
        </div>

        <div
          onClick={() => setFilterStatus("pending")}
          className={`bg-card rounded-lg sm:border border-0 p-4 flex items-center gap-3 cursor-pointer transition-all hover:shadow-md ${
            filterStatus === "pending" ? "ring-2 ring-blue-500 shadow-md" : ""
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Clock className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground mb-1">답변 대기</div>
            <div className="text-2xl text-blue-600">{stats.pendingCnt}</div>
          </div>
        </div>

        <div
          onClick={() => setFilterStatus("answered")}
          className={`bg-card rounded-lg sm:border border-0 p-4 flex items-center gap-3 cursor-pointer transition-all hover:shadow-md ${
            filterStatus === "answered" ? "ring-2 ring-green-500 shadow-md" : ""
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground mb-1">답변 완료</div>
            <div className="text-2xl text-green-600">{stats.answeredCnt}</div>
          </div>
        </div>

        <div
          onClick={() => setFilterStatus("blocked")}
          className={`bg-card rounded-lg sm:border border-0 p-4 flex items-center gap-3 cursor-pointer transition-all hover:shadow-md ${
            filterStatus === "blocked" ? "ring-2 ring-red-500 shadow-md" : ""
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="h-6 w-6 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground mb-1">차단됨</div>
            <div className="text-2xl text-red-600">{stats.blockedCnt}</div>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full flex-wrap">
        {/* 검색 */}
        <div className="bg-background box-border content-stretch flex gap-[8px] h-[36px] items-center px-[16px] py-[8px] relative rounded-[6px] w-full sm:w-[300px] focus-within:shadow-[0_0_0_1px_#0c8ce9] transition-shadow">
          <div
            aria-hidden="true"
            className="absolute border border-border border-solid inset-0 pointer-events-none rounded-[6px]"
          />
          <Search className="h-[18px] w-[18px] text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="제목, 내용, 작성자 검색..."
            className="text-[12px] text-muted-foreground placeholder:text-muted-foreground bg-transparent border-none outline-none flex-1"
          />
        </div>

        {/* 날짜 범위 선택기 */}
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          startPlaceholder="시작일"
          endPlaceholder="종료일"
          className="w-full sm:w-auto"
        />

        {/* 상태 필터 */}
        <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as typeof filterStatus)}>
          <SelectTrigger className="w-full sm:w-[150px] h-[36px]">
            <SelectValue>
              {filterStatus === "all" && `전체 (${stats.allCnt})`}
              {filterStatus === "pending" && `답변대기 (${stats.pendingCnt})`}
              {filterStatus === "answered" && `답변완료 (${stats.answeredCnt})`}
              {filterStatus === "blocked" && `차단됨 (${stats.blockedCnt})`}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 ({stats.allCnt})</SelectItem>
            <SelectItem value="pending">답변대기 ({stats.pendingCnt})</SelectItem>
            <SelectItem value="answered">답변완료 ({stats.answeredCnt})</SelectItem>
            <SelectItem value="blocked">차단됨 ({stats.blockedCnt})</SelectItem>
          </SelectContent>
        </Select>

        {/* 필터 초기화 */}
        {(searchQuery || startDate || endDate || filterStatus !== "all") && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters} className="gap-2 w-full sm:w-auto">
            <X className="h-4 w-4" />
            필터 초기화
          </Button>
        )}
      </div>

      {/* 테이블 */}
      {loading ? (
        <div className="py-12 text-center text-muted-foreground">
          로딩 중...
        </div>
      ) : (
        <ResponsiveCommunityTable
          posts={paginatedInquiries}
          activeTab="inquiry"
          language={language}
          onView={handleView}
          onDelete={handleDelete}
          pagination={
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={inquiries.length}
              itemsPerPage={itemsPerPage}
            />
          }
        />
      )}

      {/* 문의 상세 Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>문의 상세</DialogTitle>
            <DialogDescription>문의 상세 정보를 확인하세요</DialogDescription>
          </DialogHeader>
          {selectedInquiry && (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(selectedInquiry)}
                  </div>
                  <h3 className="text-lg">{selectedInquiry.title}</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-y">
                <div>
                  <Label className="text-xs text-muted-foreground">작성자</Label>
                  <p className="text-sm mt-1">{selectedInquiry.authorName}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">작성일</Label>
                  <p className="text-sm mt-1">
                    {new Date(selectedInquiry.createdAt).toLocaleString('ko-KR')}
                  </p>
                </div>
              </div>

              <div>
                <Label>문의 내용</Label>
                <p className="mt-2 text-sm whitespace-pre-wrap p-4 bg-muted rounded-md">
                  {selectedInquiry.content}
                </p>
              </div>

              {selectedInquiry.answer && (
                <div>
                  <Label>답변</Label>
                  <p className="mt-2 text-sm whitespace-pre-wrap p-4 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                    {selectedInquiry.answer}
                  </p>
                  {selectedInquiry.answeredAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      답변일: {new Date(selectedInquiry.answeredAt).toLocaleString('ko-KR')}
                    </p>
                  )}
                </div>
              )}

              {selectedInquiry.isBlocked && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
                  <Label className="text-red-700 dark:text-red-400">차단 사유</Label>
                  <p className="text-sm mt-1">{selectedInquiry.blockedReason || '사유 없음'}</p>
                  {selectedInquiry.blockedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      차단일: {new Date(selectedInquiry.blockedAt).toLocaleString('ko-KR')}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              닫기
            </Button>
            {selectedInquiry && !selectedInquiry.isBlocked && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setInquiryToDelete(selectedInquiry);
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  삭제
                </Button>
                <Button variant="outline" onClick={handleBlock}>
                  차단
                </Button>
                <Button onClick={handleAnswer}>
                  {selectedInquiry.answer ? "답변 수정" : "답변 등록"}
                </Button>
              </>
            )}
            {selectedInquiry?.isBlocked && (
              <Button onClick={handleUnblock}>차단 해제</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 답변 Dialog */}
      <Dialog open={isAnswerDialogOpen} onOpenChange={setIsAnswerDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>답변 등록</DialogTitle>
            <DialogDescription>문의에 대한 답변을 작성하세요</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>답변</Label>
              <Textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="답변을 입력하세요"
                className="mt-2 min-h-[200px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsAnswerDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={confirmAnswer}>등록</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 차단 Dialog */}
      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>문의 차단</DialogTitle>
            <DialogDescription>차단 사유를 입력하세요</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>차단 사유</Label>
              <Textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="차단 사유를 입력하세요"
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsBlockDialogOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={confirmBlock}>
              차단
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>문의 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 문의를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}