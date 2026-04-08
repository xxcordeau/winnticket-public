import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { EventPost } from "@/data/dto/community.dto";
import { toast } from "sonner";
import { Search, Plus, X } from "lucide-react";
import { ResponsiveCommunityTable } from "@/components/ui/responsive-community-table";
import { TablePagination } from "@/components/common/table-pagination";
import { getEvents, deleteEvent, updateEvent, updateEventActive } from "@/lib/api/event";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface EventManagementProps {
  language: "ko" | "en";
}

export function EventManagement({ language }: EventManagementProps) {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventPost[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<EventPost | null>(null);
  
  const itemsPerPage = 20;

  useEffect(() => {
    loadEvents();
  }, [searchQuery, startDate, endDate]);

  const loadEvents = async () => {
    // API 
    const params: { title?: string; begDate?: string; endDate?: string } = {};
    
    if (searchQuery.trim()) {
      params.title = searchQuery.trim();
    }
    
    if (startDate) {
      // YYYY-MM-DD 
      params.begDate = startDate.toISOString().split('T')[0];
    }
    
    if (endDate) {
      // YYYY-MM-DD 
      params.endDate = endDate.toISOString().split('T')[0];
    }
    
    const response = await getEvents(Object.keys(params).length > 0 ? params : undefined);
    if (response.success && response.data) {
      setEvents(response.data);
    } else {
      setEvents([]);
    }
  };

  const handleView = (event: EventPost) => {
    navigate(`/admin/community/event/view/${event.id}`);
  };

  const handleEdit = (event: EventPost) => {
    navigate(`/admin/community/event/${event.id}`);
  };

  const handleDelete = (event: EventPost) => {
    setEventToDelete(event);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!eventToDelete) return;

    const response = await deleteEvent(eventToDelete.id);
    if (response.success) {
      loadEvents();
      toast.success("이벤트가 삭제되었습니다");
    } else {
      toast.error(response.message || "삭제에 실패했습니다");
    }

    setIsDeleteDialogOpen(false);
    setEventToDelete(null);
  };

  const handleToggleActive = async (event: EventPost) => {
    const newActiveState = !event.isActive;
    const response = await updateEventActive(event.id, newActiveState);
    
    if (response.success) {
      loadEvents();
      toast.success(newActiveState ? "활성화되었습니다" : "비활성화되었습니다");
    } else {
      toast.error(response.message || "상태 변경에 실패했습니다");
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStartDate(undefined);
    setEndDate(undefined);
    setCurrentPage(1);
  };

  // 
  const totalPages = Math.ceil(events.length / itemsPerPage);
  const paginatedEvents = events.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-4">
      {/* 검색 및 액션 */}
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
            placeholder="제목 또는 내용 검색..."
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

        {/* 액션 버튼 */}
        <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
          {(searchQuery || startDate || endDate) && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters} className="gap-2">
              <X className="h-4 w-4" />
              필터 초기화
            </Button>
          )}
          <Button onClick={() => navigate("/admin/community/event/new")} className="ml-auto sm:ml-0">
            <Plus className="h-4 w-4 mr-2" />
            작성
          </Button>
        </div>
      </div>

      {/* 테이블 */}
      <ResponsiveCommunityTable
        posts={paginatedEvents}
        activeTab="event"
        language={language}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
        pagination={
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={events.length}
            itemsPerPage={itemsPerPage}
          />
        }
      />

      {/* 삭제 확인 Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이벤트 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 이벤트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
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