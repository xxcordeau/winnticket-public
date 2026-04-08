import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { CheckCircle2, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useFieldTicket } from "../lib/api/order";
import { api } from "../lib/api";
import type { FieldOrderListItem } from "../lib/api/order";
import { toast } from "sonner";

interface FieldOrderDetailModalProps {
  order: FieldOrderListItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  /** 투어 중 모달 외부 클릭 방지 */
  preventOutsideInteraction?: boolean;
}

interface TicketDetail {
  ticketId: string;
  ticketNumber: string;
  productName: string;
  ticketUsed: boolean;
  ticketUsedDate: string | null;
  pointAmount: number | null;
}

interface TicketCheckData {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  totalTicketCnt: number;
  usedTicketCnt: number;
  unusedTicketCnt: number;
  tickets: TicketDetail[];
}

export function FieldOrderDetailModal({
  order,
  isOpen,
  onClose,
  onUpdate,
  preventOutsideInteraction,
}: FieldOrderDetailModalProps) {
  const [ticketData, setTicketData] = useState<TicketCheckData | null>(null);
  const [currentTicketIndex, setCurrentTicketIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && order) {
      loadTicketData();
    }
  }, [isOpen, order]);

  const loadTicketData = async () => {
    if (!order) return;
    setIsLoading(true);
    try {
      const response = await api.get<TicketCheckData>(`/api/admin/field-order/tickets/${order.orderId}/${order.ticketId}`);
      if (response.success && response.data) {
        setTicketData(response.data as any);
        const tickets = (response.data as any).tickets || [];
        const targetIdx = tickets.findIndex((t: any) => t.ticketId === order.ticketId);
        const firstUnused = tickets.findIndex((t: any) => !t.ticketUsed);
        setCurrentTicketIndex(targetIdx !== -1 ? targetIdx : (firstUnused !== -1 ? firstUnused : 0));
      }
    } catch (error) {
      toast.error("티켓 정보를 불러오는데 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseTicket = async () => {
    if (!ticketData || !currentTicket || currentTicket.ticketUsed) return;

    setIsSubmitting(true);
    try {
      const response = await useFieldTicket(ticketData.orderId, currentTicket.ticketId);
      if (response.success) {
        toast.success("티켓이 사용 처리되었습니다.");
        onUpdate();
        await loadTicketData();
      } else {
        toast.error(response.message || "티켓 사용 처리에 실패했습니다.");
      }
    } catch {
      toast.error("티켓 사용 처리 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrev = () => {
    if (!tickets.length) return;
    setCurrentTicketIndex((prev) => (prev > 0 ? prev - 1 : tickets.length - 1));
  };

  const handleNext = () => {
    if (!tickets.length) return;
    setCurrentTicketIndex((prev) => (prev < tickets.length - 1 ? prev + 1 : 0));
  };

  if (!order) return null;

  const tickets = ticketData?.tickets || [];
  const currentTicket = tickets[currentTicketIndex];
  const usedCount = tickets.filter((t) => t.ticketUsed).length;
  const unusedCount = tickets.length - usedCount;

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={!preventOutsideInteraction}>
      <DialogContent
        className="max-w-md w-[95vw] sm:w-full"
        onInteractOutside={(e) => { if (preventOutsideInteraction) e.preventDefault(); }}
        onPointerDownOutside={(e) => { if (preventOutsideInteraction) e.preventDefault(); }}
        onEscapeKeyDown={(e) => { if (preventOutsideInteraction) e.preventDefault(); }}
      >
        <DialogHeader>
          <DialogTitle className="text-center text-lg sm:text-xl">티켓 확인</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 py-4 sm:py-6">
            {/* 티켓 네비게이션 */}
            {tickets.length > 1 ? (
              <div data-tour="modal-ticket-nav" className="flex items-center justify-between px-2 sm:px-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrev}
                  disabled={isSubmitting}
                  className="h-14 w-14 sm:h-12 sm:w-12 rounded-full hover:bg-accent touch-manipulation"
                >
                  <ChevronLeft className="h-8 w-8 sm:h-7 sm:w-7" />
                </Button>

                <div className="text-center">
                  <p className="text-base sm:text-sm font-semibold sm:font-medium">
                    {currentTicketIndex + 1} / {tickets.length}
                  </p>
                  <p className="text-sm sm:text-xs text-muted-foreground mt-0.5">
                    미사용 {unusedCount}매 · 사용 {usedCount}매
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="h-14 w-14 sm:h-12 sm:w-12 rounded-full hover:bg-accent touch-manipulation"
                >
                  <ChevronRight className="h-8 w-8 sm:h-7 sm:w-7" />
                </Button>
              </div>
            ) : (
              <div data-tour="modal-ticket-nav" className="flex items-center justify-center px-2 sm:px-4">
                <p className="text-sm text-muted-foreground">티켓 1매</p>
              </div>
            )}

            {/* 큰 체크 아이콘 + 클릭으로 사용 처리 */}
            <div data-tour="modal-use-ticket" className="flex justify-center">
              {currentTicket?.ticketUsed ? (
                /* 사용완료 → 회색 체크 */
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center justify-center w-24 h-24 sm:w-20 sm:h-20 rounded-full bg-gray-100 dark:bg-gray-800">
                    <CheckCircle2 className="h-16 w-16 sm:h-12 sm:w-12 text-gray-400 dark:text-gray-500" />
                  </div>
                  <Badge variant="outline" className="text-lg sm:text-base px-5 py-2.5 sm:px-4 sm:py-2 bg-gray-50 dark:bg-gray-900/10 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700">
                    사용 완료
                  </Badge>
                </div>
              ) : (
                /* 미사용 → 녹색 체크 (클릭하면 사용 처리) */
                <button
                  onClick={handleUseTicket}
                  disabled={isSubmitting}
                  className="flex flex-col items-center gap-3 group cursor-pointer disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-center w-24 h-24 sm:w-20 sm:h-20 rounded-full bg-green-100 dark:bg-green-900/20 group-hover:bg-green-200 dark:group-hover:bg-green-900/30 transition-colors">
                    {isSubmitting ? (
                      <Loader2 className="h-16 w-16 sm:h-12 sm:w-12 text-green-600 dark:text-green-400 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-16 w-16 sm:h-12 sm:w-12 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform" />
                    )}
                  </div>
                  <Badge variant="outline" className="text-lg sm:text-base px-5 py-2.5 sm:px-4 sm:py-2 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 group-hover:bg-green-100 transition-colors">
                    {isSubmitting ? "처리 중..." : "사용하기"}
                  </Badge>
                </button>
              )}
            </div>

            {/* 주문 정보 */}
            <div className="space-y-5 sm:space-y-4 border-t border-b py-6">
              <div data-tour="modal-ticket-number" className="space-y-1.5 sm:space-y-1">
                <p className="text-sm sm:text-sm text-muted-foreground">티켓번호</p>
                <p className="text-2xl sm:text-xl font-mono font-semibold sm:font-medium break-all">
                  {currentTicket?.ticketNumber || "-"}
                </p>
              </div>

              <div data-tour="modal-order-number" className="space-y-1.5 sm:space-y-1">
                <p className="text-sm sm:text-sm text-muted-foreground">주문번호</p>
                <p className="text-xl sm:text-lg font-semibold sm:font-medium break-all">
                  {order.orderNumber}
                </p>
              </div>

              <div className="space-y-1.5 sm:space-y-1">
                <p className="text-sm sm:text-sm text-muted-foreground">상품명</p>
                <p className="text-lg sm:text-base leading-relaxed">
                  {currentTicket?.productName || order.productName}
                </p>
              </div>

              {currentTicket?.ticketUsed && currentTicket?.ticketUsedDate && (
                <div className="space-y-1.5 sm:space-y-1 pt-2">
                  <p className="text-sm sm:text-sm text-muted-foreground">사용일시</p>
                  <p className="text-base sm:text-sm">
                    {new Date(currentTicket.ticketUsedDate).toLocaleString("ko-KR")}
                  </p>
                </div>
              )}

              <div className="space-y-1.5 sm:space-y-1 pt-2">
                <p className="text-sm sm:text-sm text-muted-foreground">주문자</p>
                <p className="text-lg sm:text-base">
                  {order.customerName}
                  {order.customerPhone && ` · ${order.customerPhone}`}
                </p>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div data-tour="modal-close-btn" className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 h-12 sm:h-10 text-base sm:text-sm touch-manipulation"
                disabled={isSubmitting}
              >
                닫기
              </Button>
              {currentTicket && !currentTicket.ticketUsed && (
                <Button
                  onClick={handleUseTicket}
                  className="flex-1 h-12 sm:h-10 text-base sm:text-sm bg-primary hover:bg-primary/90 touch-manipulation"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 sm:h-4 sm:w-4 animate-spin" />
                      처리 중...
                    </>
                  ) : (
                    "티켓 사용하기"
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
