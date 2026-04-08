import { useState, useEffect, useMemo } from "react";
import { TicketOrder, Ticket } from "../data/dto/ticket-order.dto";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { CheckCircle2, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "./ui/badge";
import { authStore } from "../data/auth";
import { useTicket } from "../lib/api/order";
import { toast } from "sonner";

interface TicketUseModalProps {
  order: TicketOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onUse: (ticketNumber: string) => void;
}

export function TicketUseModal({
  order,
  isOpen,
  onClose,
  onUse,
}: TicketUseModalProps) {
  const [currentUser, setCurrentUser] = useState(authStore?.getCurrentUser() || null);
  const isSupervisor = currentUser?.userType === "supervisor";
  
  useEffect(() => {
    // authStore 
    const unsubscribe = authStore?.subscribe(() => {
      setCurrentUser(authStore.getCurrentUser());
    });
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);
  
  // 
  const visibleTickets = useMemo(() => {
    if (!order?.tickets) return [];
    
    if (isSupervisor && currentUser?.partnerId) {
      // 
      return order.tickets.filter(ticket => 
        ticket.partnerId === currentUser.partnerId
      );
    }
    
    // 
    return order.tickets;
  }, [order?.tickets, isSupervisor, currentUser?.partnerId]);

  const [currentTicketIndex, setCurrentTicketIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const tickets = visibleTickets;
  const currentTicket = tickets[currentTicketIndex];
  const totalTickets = tickets.length;
  
  useEffect(() => {
    if (isOpen) {
      // 
      const firstUnusedIndex = tickets.findIndex(t => !t.used);
      setCurrentTicketIndex(firstUnusedIndex !== -1 ? firstUnusedIndex : 0);
    }
  }, [isOpen, tickets]);

  const handleUseTicket = async () => {
    if (!currentTicket || !order) return;
    
    setIsLoading(true);
    try {
      // API : POST /api/order/{orderId}/ticket/{ticketId}/use
      const response = await useTicket(order.id, currentTicket.ticketNumber);
      
      if (response.success) {
        toast.success("티켓이 사용 처리되었습니다.");
        
        // onUse (UI )
        onUse(currentTicket.ticketNumber);
        
        // 
        setTimeout(() => {
          const nextUnusedIndex = tickets.findIndex((t, idx) => !t.used && idx !== currentTicketIndex);
          
          if (nextUnusedIndex !== -1) {
            // 
            setCurrentTicketIndex(nextUnusedIndex);
          } else {
            // 
            toast.success("모든 티켓이 사용 완료되었습니다!");
            onClose();
          }
        }, 100);
      } else {
        toast.error(response.message || "티켓 사용 처리에 실패했습니다.");
      }
    } catch (error) {
      toast.error("티켓 사용 처리 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevTicket = () => {
    setCurrentTicketIndex((prev) => (prev > 0 ? prev - 1 : tickets.length - 1));
  };

  const handleNextTicket = () => {
    setCurrentTicketIndex((prev) => (prev < tickets.length - 1 ? prev + 1 : 0));
  };

  const totalQuantity = tickets.length;
  const usedCount = tickets.filter(t => t.used).length;
  const unusedCount = totalQuantity - usedCount;

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-center text-lg sm:text-xl">티켓 확인</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4 sm:py-6">
          {/* 티켓 네비게이션 */}
          {tickets.length > 1 && (
            <div className="flex items-center justify-between px-2 sm:px-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevTicket}
                disabled={isLoading}
                className="h-14 w-14 sm:h-12 sm:w-12 rounded-full hover:bg-accent touch-manipulation"
              >
                <ChevronLeft className="h-8 w-8 sm:h-7 sm:w-7" />
              </Button>
              
              <div className="text-center">
                <p className="text-base sm:text-sm font-semibold sm:font-medium">
                  {currentTicketIndex + 1} / {totalQuantity}
                </p>
                <p className="text-sm sm:text-xs text-muted-foreground mt-0.5">
                  미사용 {unusedCount}매 · 사용 {usedCount}매
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextTicket}
                disabled={isLoading}
                className="h-14 w-14 sm:h-12 sm:w-12 rounded-full hover:bg-accent touch-manipulation"
              >
                <ChevronRight className="h-8 w-8 sm:h-7 sm:w-7" />
              </Button>
            </div>
          )}

          {/* 티켓 사용 상태 표시 */}
          <div className="flex justify-center">
            {currentTicket?.used ? (
              <div className="flex flex-col items-center gap-3 sm:gap-3">
                <div className="flex items-center justify-center w-24 h-24 sm:w-20 sm:h-20 rounded-full bg-green-100 dark:bg-green-900/20">
                  <CheckCircle2 className="h-16 w-16 sm:h-12 sm:w-12 text-green-600 dark:text-green-400" />
                </div>
                <Badge variant="outline" className="text-lg sm:text-base px-5 py-2.5 sm:px-4 sm:py-2 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                  사용 완료
                </Badge>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 sm:gap-3">
                <div className="flex items-center justify-center w-24 h-24 sm:w-20 sm:h-20 rounded-full bg-gray-100 dark:bg-gray-800">
                  <CheckCircle2 className="h-16 w-16 sm:h-12 sm:w-12 text-gray-400 dark:text-gray-500" />
                </div>
                <Badge variant="outline" className="text-lg sm:text-base px-5 py-2.5 sm:px-4 sm:py-2 bg-gray-50 dark:bg-gray-900/10 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-700">
                  미사용
                </Badge>
              </div>
            )}
          </div>

          {/* 주문 정보 */}
          <div className="space-y-5 sm:space-y-4 border-t border-b py-6">
            <div className="space-y-1.5 sm:space-y-1">
              <p className="text-sm sm:text-sm text-muted-foreground">티켓번호</p>
              <p className="text-2xl sm:text-xl font-mono font-semibold sm:font-medium break-all">{currentTicket?.ticketNumber || "-"}</p>
            </div>

            <div className="space-y-1.5 sm:space-y-1">
              <p className="text-sm sm:text-sm text-muted-foreground">주문번호</p>
              <p className="text-xl sm:text-lg font-semibold sm:font-medium break-all">{order.orderNumber}</p>
            </div>

            <div className="space-y-1.5 sm:space-y-1">
              <p className="text-sm sm:text-sm text-muted-foreground">상품명</p>
              <p className="text-lg sm:text-base leading-relaxed">{currentTicket?.productName || "-"}</p>
            </div>

            {currentTicket?.used && currentTicket?.usedAt && (
              <div className="space-y-1.5 sm:space-y-1 pt-2">
                <p className="text-sm sm:text-sm text-muted-foreground">사용일시</p>
                <p className="text-base sm:text-sm">
                  {new Date(currentTicket.usedAt).toLocaleString("ko-KR")}
                </p>
              </div>
            )}

            {order.ordererInfo && (
              <div className="space-y-1.5 sm:space-y-1 pt-2">
                <p className="text-sm sm:text-sm text-muted-foreground">주문자</p>
                <p className="text-lg sm:text-base">
                  {order.ordererInfo.name}
                  {order.ordererInfo.phone && ` · ${order.ordererInfo.phone}`}
                </p>
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12 sm:h-10 text-base sm:text-sm touch-manipulation"
              disabled={isLoading}
            >
              취소
            </Button>
            {currentTicket && !currentTicket.used && (
              <Button
                onClick={handleUseTicket}
                className="flex-1 h-12 sm:h-10 text-base sm:text-sm bg-primary hover:bg-primary/90 touch-manipulation"
                disabled={isLoading}
              >
                {isLoading ? (
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
      </DialogContent>
    </Dialog>
  );
}