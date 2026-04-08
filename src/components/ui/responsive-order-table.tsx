import { TicketOrder, TicketOrderStatus } from "../../data/dto/ticket-order.dto";
import { Badge } from "./badge";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "./tooltip";
import { MoreVertical, Edit, Trash2, Eye, Package, CheckCircle2 } from "lucide-react";

interface ResponsiveOrderTableProps {
  orders: TicketOrder[];
  onEdit: (order: TicketOrder) => void;
  onDelete: (order: TicketOrder) => void;
  onViewDetail: (order: TicketOrder) => void;
  onTicketClick?: (order: TicketOrder) => void;
  isSupervisor?: boolean;
  showActions?: boolean; // 
  getOrderStatusBadgeVariant: (status: TicketOrderStatus) => "default" | "destructive" | "secondary" | "outline";
  getPaymentStatusBadgeVariant: (status: string) => "default" | "destructive" | "secondary" | "outline";
}

export function ResponsiveOrderTable({
  orders,
  onEdit,
  onDelete,
  onViewDetail,
  onTicketClick,
  isSupervisor = false,
  showActions = true, // 
  getOrderStatusBadgeVariant,
  getPaymentStatusBadgeVariant,
}: ResponsiveOrderTableProps) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full py-16 gap-4">
        <Package className="size-12 text-muted-foreground opacity-20" />
        <p className="text-muted-foreground">등록된 주문이 없습니다.</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // 
  const areAllTicketsUsed = (order: TicketOrder): boolean => {
    if (!order.tickets || order.tickets.length === 0) return false;
    return order.tickets.every(ticket => ticket.used);
  };

  return (
    <>
      {/* 모바일 리스트 (md 미만) */}
      <div className="md:hidden divide-y divide-border w-full">
        {orders.map((order) => (
          <div key={order.id} className="py-4 px-2 cursor-pointer hover:bg-muted/50 hover:px-3 transition-all" onClick={() => onViewDetail(order)}>
              <div className="space-y-3">
                {/* 헤더: 주문번호, 날짜, 액션 */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetail(order);
                      }}
                      className="text-sm font-medium hover:text-primary hover:underline transition-colors text-left"
                    >
                      {order.orderNumber}
                    </button>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(order.orderDate)}
                    </p>
                  </div>

                  {/* 액션 메뉴 */}
                  {showActions && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {isSupervisor && (
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onTicketClick?.(order);
                          }}>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            티켓 확인
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onEdit(order);
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          수정
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(order);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {/* 주문 정보 */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-clamp-2">
                        {order.items.map(item => item.productName).join(', ')}
                      </p>
                      {order.channelName && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {order.channelName}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-muted-foreground">수량</p>
                      <p className="text-sm font-medium">
                        {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                      </p>
                    </div>
                  </div>

                  {/* 주문자 정보 - 안전하게 처리 */}
                  {order.ordererInfo?.name && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">주문자:</span>
                      <span>{order.ordererInfo.name}</span>
                      {order.ordererInfo.phone && (
                        <span className="text-muted-foreground">({order.ordererInfo.phone})</span>
                      )}
                    </div>
                  )}

                  {/* 가격 정보 */}
                  <div className="pt-2 border-t">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-muted-foreground">총 주문금액</span>
                      <span className="font-medium">
                        ₩{order.totalAmount.toLocaleString()}
                      </span>
                    </div>
                    {order.paymentAmount !== undefined && (
                      <div className="flex items-baseline justify-between mt-1">
                        <span className="text-xs text-muted-foreground">결제금액</span>
                        <span className="font-medium text-primary">
                          ₩{order.paymentAmount.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 상태 배지들 */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={getOrderStatusBadgeVariant(order.orderStatus)} className="text-xs">
                      {order.orderStatus}
                    </Badge>
                    <Badge variant={getPaymentStatusBadgeVariant(order.paymentStatus)} className="text-xs">
                      {order.paymentStatus}
                    </Badge>
                    {order.paymentMethod && (
                      <Badge variant="outline" className="text-xs">
                        {order.paymentMethod}
                      </Badge>
                    )}
                    {order.ticketUsed !== undefined && (
                      order.ticketUsed ? (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-100 dark:bg-green-900/20">
                          <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                          <span className="text-xs font-medium text-green-600 dark:text-green-400">사용됨</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800">
                          <CheckCircle2 className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">미사용</span>
                        </div>
                      )
                    )}
                  </div>

                  {/* 현장관리자용 티켓 확인 버튼 */}
                  {isSupervisor && (
                    <div className="pt-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTicketClick?.(order);
                        }}
                        className="w-full h-11 text-base touch-manipulation"
                        variant={order.ticketUsed ? "outline" : "default"}
                      >
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        {order.ticketUsed ? "티켓 확인" : "티켓 사용하기"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
          </div>
        ))}
      </div>

      {/* 데스크톱 테이블 (md 이상) - 가로 스롤 지원 */}
      <div className="hidden md:block w-full overflow-x-auto">
        <div className="min-w-max w-full">
          {/* Table Header */}
          <div className="h-[40px] relative shrink-0 bg-muted/30">
            <div className="content-stretch flex h-[40px] items-start overflow-clip relative rounded-[inherit]">
              <div className="content-stretch flex h-full items-center relative">
                {/* 티켓사용 Header - 현장관리자만 표시 */}
                {isSupervisor && (
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[110px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">티켓사용</p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>
                )}

                {/* 주문일 Header */}
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[140px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">주문일</p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>

                {/* 주문번호 Header */}
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[200px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">주문번호</p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>

                {/* 주문자 Header */}
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[120px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">주문자</p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>

                {/* 채널명 Header - 새로 추가 */}
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[150px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">채널명</p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>

                {/* 연락처 Header */}
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[170px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">연락처</p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>

                {/* 상품명/옵션값 Header */}
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[300px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">상품명/옵션값</p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>

                {/* 수량 Header */}
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[80px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">수량</p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>

                {/* 상품가격 Header */}
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[130px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">상품가격</p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>

                {/* 결제금액 Header */}
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[130px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">결제금액</p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>

                {/* 주문상태 Header */}
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[140px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">주문상태</p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>

                {/* 결제상태 Header */}
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[130px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">결제상태</p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>

                {/* 결제수단 Header */}
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[130px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">결제수단</p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>

                {/* Actions Header */}
                {showActions && (
                  <div className="content-stretch flex h-full items-center justify-center overflow-clip relative shrink-0 w-[40px]">
                    <p className="text-[13px] text-nowrap whitespace-pre">액션</p>
                  </div>
                )}
              </div>
            </div>
            <div aria-hidden="true" className="absolute border-[1px_0px] border-border border-solid inset-0 pointer-events-none" />
          </div>

          {/* Table Body */}
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
            {orders.map((order, rowIndex) => (
              <div
                key={order.id}
                onClick={() => onViewDetail(order)}
                className={`content-stretch flex min-h-[52px] items-center overflow-clip relative shrink-0 w-full group transition-colors cursor-pointer ${
                  rowIndex % 2 === 0
                    ? "bg-card hover:bg-[#F3F4F6] dark:hover:bg-muted/10"
                    : "bg-[#F9FAFB] dark:bg-muted/30 hover:bg-[#F3F4F6] dark:hover:bg-muted/10"
                }`}
              >
                {/* 티켓사용 Column - 현장관리자만 표시 */}
                {isSupervisor && (
                <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-[12px] relative shrink-0 w-[110px]">
                  {isSupervisor ? (
                    <button
                      className="flex items-center justify-center w-10 h-10 rounded-lg transition-all hover:scale-110 active:scale-95 cursor-pointer"
                      style={{
                        backgroundColor: order.ticketUsed
                          ? 'rgb(220, 252, 231)'
                          : 'rgb(243, 244, 246)',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTicketClick?.(order);
                      }}
                    >
                      {order.ticketUsed !== undefined ? (
                        order.ticketUsed ? (
                          <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                        ) : (
                          <CheckCircle2 className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                        )
                      ) : (
                        <p className="text-[13px] text-muted-foreground">-</p>
                      )}
                    </button>
                  ) : (
                    <div className="flex items-center justify-center">
                      {order.ticketUsed !== undefined ? (
                        order.ticketUsed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        )
                      ) : (
                        <p className="text-[13px] text-muted-foreground">-</p>
                      )}
                    </div>
                  )}
                </div>
                )}

                {/* 주문일 Column */}
                <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-[12px] relative shrink-0 w-[140px]">
                  <p className="text-[13px] text-muted-foreground text-nowrap">
                    {formatDate(order.orderDate)}
                  </p>
                </div>

                {/* 주문번호 Column */}
                <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-[12px] relative shrink-0 w-[200px]">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="text-[13px] text-foreground text-nowrap overflow-ellipsis overflow-hidden hover:text-primary hover:underline transition-colors cursor-default">
                        {order.orderNumber}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">{order.orderNumber}</TooltipContent>
                  </Tooltip>
                </div>

                {/* 주문자 Column */}
                <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-[12px] relative shrink-0 w-[120px]">
                  <p className="text-[13px] text-foreground text-nowrap overflow-ellipsis overflow-hidden">
                    {order.ordererInfo?.name || "-"}
                  </p>
                </div>

                {/* 채널명 Column - 새로 추가 */}
                <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-[12px] relative shrink-0 w-[150px]">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="text-[13px] text-muted-foreground text-nowrap overflow-ellipsis overflow-hidden cursor-default">
                        {order.channelName || "-"}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">{order.channelName || "-"}</TooltipContent>
                  </Tooltip>
                </div>

                {/* 연락처 Column */}
                <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-[12px] relative shrink-0 w-[170px]">
                  <p className="text-[13px] text-muted-foreground text-nowrap overflow-ellipsis overflow-hidden">
                    {order.ordererInfo?.phone || "-"}
                  </p>
                </div>

                {/* 상품명/옵션값 Column */}
                <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-[12px] relative shrink-0 w-[300px]">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="text-[13px] text-foreground text-nowrap overflow-ellipsis overflow-hidden cursor-default">
                        {order.items.map(item => item.productName).join(', ')}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[400px] whitespace-pre-wrap">
                      {order.items.map((item, i) => (
                        <div key={i}>
                          {item.productName}
                          {item.optionName && (
                            <span className="text-primary-foreground/70">
                              {" "}({item.optionName})
                            </span>
                          )}
                          {item.quantity > 1 && <span> x{item.quantity}</span>}
                        </div>
                      ))}
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* 수량 Column */}
                <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-[12px] relative shrink-0 w-[80px]">
                  <p className="text-[13px] text-foreground">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </p>
                </div>

                {/* 상품가격 Column */}
                <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-[12px] relative shrink-0 w-[130px]">
                  <span className="text-[13px] text-foreground">
                    ₩{order.itemsTotal.toLocaleString()}
                  </span>
                </div>

                {/* 결제금액 Column */}
                <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-[12px] relative shrink-0 w-[130px]">
                  <span className="text-[13px] text-primary font-medium">
                    {order.paymentAmount !== undefined
                      ? `₩${order.paymentAmount.toLocaleString()}`
                      : "-"}
                  </span>
                </div>

                {/* 주문상태 Column */}
                <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-[12px] relative shrink-0 w-[140px]">
                  <Badge variant={getOrderStatusBadgeVariant(order.orderStatus)} className="text-[10px]">
                    {order.orderStatus}
                  </Badge>
                </div>

                {/* 결제상태 Column */}
                <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-[12px] relative shrink-0 w-[130px]">
                  <Badge variant={getPaymentStatusBadgeVariant(order.paymentStatus)} className="text-[10px]">
                    {order.paymentStatus}
                  </Badge>
                </div>

                {/* 결제수단 Column */}
                <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-[12px] relative shrink-0 w-[130px]">
                  <p className="text-[13px] text-foreground text-nowrap overflow-ellipsis overflow-hidden">
                    {order.paymentMethod || "-"}
                  </p>
                </div>

                {/* Actions Column */}
                {showActions && (
                  <div className="content-stretch flex gap-[11px] h-full items-center justify-center overflow-clip relative shrink-0 w-[40px]">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <button className="p-2 rounded-md transition-colors hover:bg-muted text-muted-foreground hover:text-foreground">
                          <MoreVertical className="h-[14px] w-[14px]" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onEdit(order);
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          수정
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(order);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}