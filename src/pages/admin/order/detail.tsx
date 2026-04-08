import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Package,
  User,
  Phone,
  Mail,
  Building2,
  CreditCard,
  CheckCircle2,
  XCircle,
  Printer,
  MessageSquare,
  Clock,
  Ticket,
  ArrowLeft,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import {
  getAdminOrderDetail,
  payOrder,
  type AdminOrderDetail,
  cancelCardPayment,
  cancelPointPayment,
  cancelGiftPayment,
  adminCancelOrder,
  resendTicketSms,
} from "@/lib/api/order";

export function AdminOrderDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false); // 
  const [processing, setProcessing] = useState(false);

  // 
  const loadOrderDetail = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const response = await getAdminOrderDetail(id);
      if (response.success && response.data) {
        setOrder(response.data);
      } else {
        toast.error(response.message || "주문을 찾을 수 없습니다");
        navigate("/admin/orders");
      }
    } catch (error) {
      toast.error("주문 상세를 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrderDetail();
  }, [id]);

  // 
  const handlePaymentConfirm = async () => {
    if (!id) return;
    
    setProcessing(true);
    try {
      const response = await payOrder(id);
      if (response.success) {
        toast.success("결제가 완료되었습니다. 티켓이 발급되었습니다.");
        setPaymentDialog(false);
        loadOrderDetail(); // 
      } else {
        toast.error(response.message || "결제 처리에 실패했습니다");
      }
    } catch (error) {
      toast.error("결제 처리 중 오류가 발생했습니다");
    } finally {
      setProcessing(false);
    }
  };

  // 
  const handleCancelOrder = async () => {
    if (!id || !order) return;
    
    setProcessing(true);
    try {
      // POST /api/admin/order/{id}/cancel API 
      const response = await adminCancelOrder(id);
      
      if (response.success) {
        toast.success("주문이 취소되었습니다.", {
          duration: 3000,
        });
        setCancelDialog(false);
        loadOrderDetail(); // 
      } else {
        toast.error(response.message || "주문 취소에 실패했습니다.");
      }
    } catch (error) {
      toast.error("주문 취소 중 오류가 발생했습니다.");
    } finally {
      setProcessing(false);
    }
  };

  // 
  const handlePrint = () => {
    window.print();
  };

  // (API )
  const handleResendTicketSMS = async () => {
    if (!id || !order) return;
    
    setProcessing(true);
    try {
      const response = await resendTicketSms(id);
      
      if (response.success) {
        toast.success(`${order?.customerPhone}로 티켓 정보를 재발송했습니다.`);
      } else {
        toast.error(response.message || "티켓 문자 재발송에 실패했습니다.");
      }
    } catch (error) {
      toast.error("티켓 문자 재발송 중 오류가 발생했습니다.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">주문을 찾을 수 없습니다</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: string; colors: string }> = {
      'PENDING_PAYMENT': { label: '입금전', variant: 'outline', colors: 'bg-yellow-50 text-yellow-700 border-yellow-300' },
      'COMPLETED': { label: '주문처리완료', variant: 'outline', colors: 'bg-green-50 text-green-700 border-green-300' },
      'CANCEL_REQUESTED': { label: '취소신청', variant: 'outline', colors: 'bg-orange-50 text-orange-700 border-orange-300' },
      'CANCELED': { label: '취소완료', variant: 'outline', colors: 'bg-gray-50 text-gray-700 border-gray-300' },
      'REFUNDED': { label: '환불완료', variant: 'outline', colors: 'bg-blue-50 text-blue-700 border-blue-300' },
      'REQUESTED': { label: '결제요청', variant: 'outline', colors: 'bg-purple-50 text-purple-700 border-purple-300' },
    };
    
    const statusInfo = statusMap[status];
    if (statusInfo) {
      return <Badge variant="outline" className={statusInfo.colors}>{statusInfo.label}</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    const statusMap: Record<string, { label: string; variant: 'outline'; colors: string }> = {
      'READY': { label: '입금대기', variant: 'outline', colors: 'bg-gray-50 text-gray-700' },
      'PAID': { label: '입금완료', variant: 'outline', colors: 'bg-green-50 text-green-700' },
      'FAILED': { label: '결제실패', variant: 'outline', colors: 'bg-red-50 text-red-700' },
      'CANCELED': { label: '취소완료', variant: 'outline', colors: 'bg-gray-50 text-gray-700' },
      'REFUNDED': { label: '환불완료', variant: 'outline', colors: 'bg-blue-50 text-blue-700' },
      'REQUESTED': { label: '결제요청', variant: 'outline', colors: 'bg-purple-50 text-purple-700' },
    };
    
    const statusInfo = statusMap[paymentStatus];
    if (statusInfo) {
      return <Badge variant="outline" className={statusInfo.colors}>{statusInfo.label}</Badge>;
    }
    return <Badge variant="outline">{paymentStatus}</Badge>;
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      'PENDING_PAYMENT': '입금전',
      'COMPLETED': '주문처리완료',
      'CANCEL_REQUESTED': '취소신청',
      'CANCELED': '취소완료',
      'REFUNDED': '환불완료',
      'REQUESTED': '결제요청',
    };
    return map[status] || status;
  };

  const getPaymentStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      'READY': '입금대기',
      'PAID': '입금완료',
      'FAILED': '결제실패',
      'CANCELED': '취소완료',
      'REFUNDED': '환불완료',
      'REQUESTED': '결제요청',
    };
    return map[status] || status;
  };

  const getPaymentMethodLabel = (method: string) => {
    const methodMap: Record<string, string> = {
      'CARD': '카드',
      'VIRTUAL_ACCOUNT': '무통장입금',
      'POINT': '베네피아 포인트',
      'GIFT': '베네피아 상품권',
      'KAKAOPAY': '카카오페이',
    };
    return methodMap[method] || method;
  };

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return numPrice.toLocaleString();
  };

  const formatDateTime = (dateTime: string) => {
    if (!dateTime) return '-';
    const date = new Date(dateTime);
    if (isNaN(date.getTime())) return dateTime; // Invalid date 
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 화면 표시용 - 인쇄 시 숨김 */}
      <div className="print:hidden">
        <PageHeader
          title={`주문 상세 - ${order.orderNumber}`}
          subtitle="주문 정보 및 결제 상태를 관리합니다"
        />

        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/orders")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} className="hidden sm:flex">
            <Printer className="h-4 w-4 mr-2" />
            인쇄
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 주문 기본 정보 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 주문 정보 */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Package className="h-5 w-5" />
                주문 정보
              </h3>
              <Separator className="mb-4" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">주문번호</p>
                  <p className="font-mono font-semibold break-all">{order.orderNumber}</p>
                </div>
                {order.channelName && (
                  <div>
                    <p className="text-muted-foreground mb-1">채널</p>
                    <p className="font-semibold">{order.channelName}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground mb-1">파트너사</p>
                  <p className="font-semibold">{order.partnerName || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">주문일시</p>
                  <p>{formatDateTime(order.orderedAt || order.createdAt)}</p>
                </div>
                {order.paidAt && (
                  <div>
                    <p className="text-muted-foreground mb-1">결제일시</p>
                    <p>{formatDateTime(order.paidAt)}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground mb-1">주문 상태</p>
                  <div className="mt-1">{getStatusBadge(order.status)}</div>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">결제 상태</p>
                  <div className="mt-1">{getPaymentStatusBadge(order.paymentStatus)}</div>
                </div>
                {order.memo && (
                  <div className="sm:col-span-2">
                    <p className="text-muted-foreground mb-1">메모</p>
                    <p className="text-sm bg-muted/50 p-2 rounded">{order.memo}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* 고객 정보 */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                고객 정보
              </h3>
              <Separator className="mb-4" />

              <div className="space-y-3">
                {order.companyName && (
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">기관명(회사명)</p>
                      <p className="font-medium">{order.companyName}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">이름</p>
                    <p className="font-medium">{order.customerName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">전화번호</p>
                    <p className="font-medium">{order.customerPhone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">이메일</p>
                    <p className="font-medium break-all">{order.customerEmail}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* 주문 상품 */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Package className="h-5 w-5" />
                주문 상품
              </h3>
              <Separator className="mb-4" />

              <div className="space-y-3">
                {order.products.map((product, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-semibold">{product.productName}</p>
                        {product.optionName && (
                          <p className="text-sm text-muted-foreground mt-0.5">옵션: {product.optionName}</p>
                        )}
                        {(product.categoryName || product.partnerName) && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {product.categoryName && <span>{product.categoryName}</span>}
                            {product.categoryName && product.partnerName && <span className="mx-1">•</span>}
                            {product.partnerName && <span>{product.partnerName}</span>}
                          </p>
                        )}
                      </div>
                      <p className="font-semibold">{formatPrice(product.totalPrice || product.unitPrice * product.quantity)}원</p>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>수량: {product.quantity}개</span>
                      <span>단가: {formatPrice(product.unitPrice)}원</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* 발급된 티켓 */}
            {order.tickets && order.tickets.length > 0 && (
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  발급된 티켓
                </h3>
                <Separator className="mb-4" />

                {/* 모바일 카드 레이아웃 */}
                <div className="sm:hidden divide-y divide-border">
                  {order.tickets.map((ticket, index) => (
                    <div key={index} className="py-3 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono break-all flex-1">
                          {ticket.ticketNumber}
                        </code>
                        {ticket.ticketUsed ? (
                          <Badge variant="outline" className="bg-gray-50 text-gray-700 flex-shrink-0">사용 완료</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700 flex-shrink-0">미사용</Badge>
                        )}
                      </div>
                      <p className="text-sm">{ticket.productName}</p>
                    </div>
                  ))}
                </div>
                {/* 데스크톱 테이블 레이아웃 */}
                <div className="hidden sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>티켓번호</TableHead>
                        <TableHead>품명</TableHead>
                        <TableHead className="text-center">사용여부</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.tickets.map((ticket, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono">{ticket.ticketNumber}</TableCell>
                          <TableCell>{ticket.productName}</TableCell>
                          <TableCell className="text-center">
                            {ticket.ticketUsed ? (
                              <Badge variant="outline" className="bg-gray-50 text-gray-700">
                                사용 완료
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-50 text-green-700">
                                미사용
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* 티켓 문자 재발송 버튼 */}
                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleResendTicketSMS}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    티켓 정보 문자 재발송
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    {order.customerPhone}로 티켓 정보를 다시 전송합니다
                  </p>
                </div>
              </Card>
            )}
          </div>

          {/* 결제 정보 및 액션 */}
          <div className="space-y-6">
            {/* 결제 정보 */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                결제 정보
              </h3>
              <Separator className="mb-4" />

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">상품 금액</span>
                  <span className="font-medium">{formatPrice(order.totalPrice)}원</span>
                </div>
                {order.discountPrice > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">할인 금액</span>
                    <span className="font-medium text-red-600">
                      -{formatPrice(order.discountPrice)}원
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-semibold">실 결제 금액</span>
                  <span className="text-xl font-bold text-primary">
                    {formatPrice(order.finalPrice)}원
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">결제 수단</span>
                  <Badge variant="outline">
                    {order.pointAmount && order.pointAmount > 0 && order.paymentMethod
                      ? `${getPaymentMethodLabel(order.paymentMethod)}, 포인트`
                      : order.pointAmount && order.pointAmount > 0
                        ? '포인트'
                        : getPaymentMethodLabel(order.paymentMethod)}
                  </Badge>
                </div>
                {order.pointAmount != null && order.pointAmount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">포인트 결제</span>
                    <span className="font-medium text-blue-600">
                      {formatPrice(order.pointAmount)}P
                    </span>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                {order.paymentStatus === "READY" && (
                  <Button
                    className="w-full"
                    onClick={() => setPaymentDialog(true)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    결제 완료 처리
                  </Button>
                )}

                {order.paymentStatus === "PAID" && order.status === "COMPLETED" && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">주문이 완료되었습니다</span>
                    </div>
                  </div>
                )}

                {order.paymentStatus === "PAID" && order.tickets && order.tickets.length > 0 && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleResendTicketSMS}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    티켓 정보 문자 재발송
                  </Button>
                )}

                {order.paymentStatus === "PAID" && order.status === "COMPLETED" && (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setCancelDialog(true)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    주문 취소
                  </Button>
                )}

                {order.status === "CANCEL_REQUESTED" && (
                  <Button variant="outline" className="w-full">
                    <XCircle className="h-4 w-4 mr-2" />
                    취소 승인
                  </Button>
                )}
              </div>
            </Card>

            {/* 주문 타임라인 */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                주문 타임라인
              </h3>
              <Separator className="mb-4" />

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">주문 접수</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(order.orderedAt || order.createdAt)}
                    </p>
                  </div>
                </div>

                {order.paidAt && (
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <div className="h-2 w-2 rounded-full bg-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">결제 완료</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(order.paidAt)}
                      </p>
                    </div>
                  </div>
                )}

                {(order.status === "CANCELED" || order.status === "CANCEL_REQUESTED") && (
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <div className="h-2 w-2 rounded-full bg-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {order.status === "CANCEL_REQUESTED" ? "취소 요청" : "주문 취소"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.canceledAt ? formatDateTime(order.canceledAt) : order.updatedAt ? formatDateTime(order.updatedAt) : "-"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* 결제 완료 처리 확인 다이얼로그 */}
      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>결제 완료 처리</DialogTitle>
            <DialogDescription>
              이 주문을 결제 완료 처리하시겠습니까?
              <br />
              결제 완료 후 티켓이 자동으로 발급됩니다.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">주문번호</span>
                <span className="font-mono font-semibold">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">고객명</span>
                <span className="font-semibold">{order.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">결제 금액</span>
                <span className="font-bold text-lg text-primary">
                  {formatPrice(order.finalPrice)}원
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPaymentDialog(false)}
              disabled={processing}
            >
              취소
            </Button>
            <Button onClick={handlePaymentConfirm} disabled={processing}>
              {processing ? "처리 중..." : "결제 완료 처리"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 주문 취소 확인 다이얼로그 */}
      <Dialog open={cancelDialog} onOpenChange={setCancelDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>주문 취소</DialogTitle>
            <DialogDescription>
              이 주문을 취소하시겠습니까?
              <br />
              결제가 취소되고 티켓이 무효화됩니다.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">주문번호</span>
                <span className="font-mono font-semibold">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">고객명</span>
                <span className="font-semibold">{order.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">결제 금액</span>
                <span className="font-bold text-lg text-red-600">
                  {formatPrice(order.finalPrice)}원
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">결제 수단</span>
                <span className="font-semibold">{getPaymentMethodLabel(order.paymentMethod)}</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              ⚠️ 이 작업은 되돌릴 수 없습니다. 주문 취소 후 환불 처리가 진행됩니다.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialog(false)}
              disabled={processing}
            >
              닫기
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelOrder} 
              disabled={processing}
            >
              {processing ? "처리 중..." : "주문 취소"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 인쇄 전용 레이아웃 - 화면에서는 숨김 */}
      <div className="hidden print:block">
        {/* 1페이지 - 주문 정보 */}
        <div 
          className="print-page-1"
          style={{
            pageBreakAfter: 'always',
            minHeight: '100vh',
            display: 'block'
          }}
        >
          <div className="max-w-4xl mx-auto p-8" style={{fontSize: '13px'}}>
            {/* 헤더 */}
            <div className="text-center mb-8 pb-6 border-b-2 border-gray-800">
              <h1 className="text-3xl font-bold mb-2">주문 상세 내역</h1>
              <p className="text-lg text-gray-600">{order.orderNumber}</p>
            </div>

            {/* 주문 기본 정보 */}
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-3 pb-2 border-b border-gray-300">주문 정보</h2>
              <table className="w-full mb-4">
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 px-3 bg-gray-50 font-semibold" style={{width: '80px', whiteSpace: 'nowrap'}}>주문번호</td>
                    <td className="py-2 px-3 font-mono text-xs" style={{wordBreak: 'break-all'}}>{order.orderNumber}</td>
                    {order.channelName ? (
                      <>
                        <td className="py-2 px-3 bg-gray-50 font-semibold" style={{width: '80px', whiteSpace: 'nowrap'}}>채널</td>
                        <td className="py-2 px-3">{order.channelName}</td>
                      </>
                    ) : (
                      <>
                        <td className="py-2 px-3 bg-gray-50 font-semibold" style={{width: '80px', whiteSpace: 'nowrap'}}>파트너사</td>
                        <td className="py-2 px-3">{order.partnerName || '-'}</td>
                      </>
                    )}
                  </tr>
                  {order.channelName && (
                    <tr className="border-b">
                      <td className="py-2 px-3 bg-gray-50 font-semibold" style={{whiteSpace: 'nowrap'}}>파트너사</td>
                      <td className="py-2 px-3">{order.partnerName || '-'}</td>
                      <td className="py-2 px-3 bg-gray-50 font-semibold" style={{whiteSpace: 'nowrap'}}>주문일시</td>
                      <td className="py-2 px-3" style={{whiteSpace: 'nowrap'}}>{formatDateTime(order.orderedAt || order.createdAt)}</td>
                    </tr>
                  )}
                  {!order.channelName && (
                    <tr className="border-b">
                      <td className="py-2 px-3 bg-gray-50 font-semibold" style={{whiteSpace: 'nowrap'}}>주문일시</td>
                      <td className="py-2 px-3" style={{whiteSpace: 'nowrap'}}>{formatDateTime(order.orderedAt || order.createdAt)}</td>
                      <td className="py-2 px-3 bg-gray-50 font-semibold" style={{whiteSpace: 'nowrap'}}>주문 상태</td>
                      <td className="py-2 px-3">{getStatusLabel(order.status)}</td>
                    </tr>
                  )}
                  {order.channelName && (
                    <tr className="border-b">
                      <td className="py-2 px-3 bg-gray-50 font-semibold" style={{whiteSpace: 'nowrap'}}>주문 상태</td>
                      <td className="py-2 px-3">{getStatusLabel(order.status)}</td>
                      <td className="py-2 px-3 bg-gray-50 font-semibold" style={{whiteSpace: 'nowrap'}}>결제 상태</td>
                      <td className="py-2 px-3">{getPaymentStatusLabel(order.paymentStatus)}</td>
                    </tr>
                  )}
                  {order.paidAt && (
                    <tr className="border-b">
                      <td className="py-2 px-3 bg-gray-50 font-semibold" style={{whiteSpace: 'nowrap'}}>결제일시</td>
                      <td className="py-2 px-3" style={{whiteSpace: 'nowrap'}}>{formatDateTime(order.paidAt)}</td>
                      {!order.channelName && (
                        <>
                          <td className="py-2 px-3 bg-gray-50 font-semibold" style={{whiteSpace: 'nowrap'}}>결제 상태</td>
                          <td className="py-2 px-3">{getPaymentStatusLabel(order.paymentStatus)}</td>
                        </>
                      )}
                      {order.channelName && (
                        <>
                          <td className="py-2 px-3 bg-gray-50 font-semibold"></td>
                          <td className="py-2 px-3"></td>
                        </>
                      )}
                    </tr>
                  )}
                  {order.memo && (
                    <tr className="border-b">
                      <td className="py-2 px-3 bg-gray-50 font-semibold">메모</td>
                      <td className="py-2 px-3" colSpan={3}>{order.memo}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 고객 정보 */}
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-3 pb-2 border-b border-gray-300">고객 정보</h2>
              <table className="w-full mb-4">
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 px-3 bg-gray-50 font-semibold" style={{width: '80px', whiteSpace: 'nowrap'}}>고객명</td>
                    <td className="py-2 px-3">{order.customerName}</td>
                    <td className="py-2 px-3 bg-gray-50 font-semibold" style={{width: '80px', whiteSpace: 'nowrap'}}>전화번호</td>
                    <td className="py-2 px-3" style={{whiteSpace: 'nowrap'}}>{order.customerPhone}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3 bg-gray-50 font-semibold">이메일</td>
                    <td className="py-2 px-3" colSpan={3}>{order.customerEmail}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 주문 상품 */}
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-3 pb-2 border-b border-gray-300">주문 상품</h2>
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 py-2 px-3 text-left">상품명</th>
                    <th className="border border-gray-300 py-2 px-3 text-left">옵션/카테고리</th>
                    <th className="border border-gray-300 py-2 px-3 text-center">수량</th>
                    <th className="border border-gray-300 py-2 px-3 text-right">단가</th>
                    <th className="border border-gray-300 py-2 px-3 text-right">합계</th>
                  </tr>
                </thead>
                <tbody>
                  {order.products.map((product, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 py-2 px-3">
                        <div className="font-semibold">{product.productName}</div>
                      </td>
                      <td className="border border-gray-300 py-2 px-3 text-sm">
                        {product.optionName && <div>{product.optionName}</div>}
                        {product.categoryName && <div className="text-gray-600">{product.categoryName}</div>}
                        {!product.optionName && !product.categoryName && '-'}
                      </td>
                      <td className="border border-gray-300 py-2 px-3 text-center">
                        {product.quantity}개
                      </td>
                      <td className="border border-gray-300 py-2 px-3 text-right">
                        {formatPrice(product.unitPrice)}원
                      </td>
                      <td className="border border-gray-300 py-2 px-3 text-right font-semibold">
                        {formatPrice(product.totalPrice || product.unitPrice * product.quantity)}원
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 2페이지 - 결제 및 티켓 정보 */}
        <div 
          className="print-page-2"
          style={{
            pageBreakBefore: 'always',
            minHeight: '100vh',
            display: 'block'
          }}
        >
          <div className="max-w-4xl mx-auto p-8">
            {/* 헤더 반복 */}
            <div className="text-center mb-8 pb-6 border-b-2 border-gray-800">
              <h1 className="text-3xl font-bold mb-2">주문 상세 내역</h1>
              <p className="text-lg text-gray-600">{order.orderNumber}</p>
            </div>

            {/* 결제 정보 */}
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-3 pb-2 border-b border-gray-300">결제 정보</h2>
              <table className="w-full mb-4">
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 px-3 bg-gray-50 font-semibold w-1/3">상품 금액</td>
                    <td className="py-2 px-3 text-right">{formatPrice(order.totalPrice)}원</td>
                  </tr>
                  {order.discountPrice > 0 && (
                    <tr className="border-b">
                      <td className="py-2 px-3 bg-gray-50 font-semibold">할인 금액</td>
                      <td className="py-2 px-3 text-right text-red-600">
                        -{formatPrice(order.discountPrice)}원
                      </td>
                    </tr>
                  )}
                  <tr className="border-b border-gray-800">
                    <td className="py-3 px-3 bg-gray-100 font-bold text-lg">실 결제 금액</td>
                    <td className="py-3 px-3 text-right font-bold text-xl">
                      {formatPrice(order.finalPrice)}원
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-3 bg-gray-50 font-semibold">결제 수단</td>
                    <td className="py-2 px-3 text-right">{getPaymentMethodLabel(order.paymentMethod)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 발급된 티켓 */}
            {order.tickets && order.tickets.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-3 pb-2 border-b border-gray-300">발급된 티켓</h2>
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 py-2 px-3 text-left">티켓번호</th>
                      <th className="border border-gray-300 py-2 px-3 text-left">상품명</th>
                      <th className="border border-gray-300 py-2 px-3 text-center">사용여부</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.tickets.map((ticket, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 py-2 px-3 font-mono">
                          {ticket.ticketNumber}
                        </td>
                        <td className="border border-gray-300 py-2 px-3">
                          {ticket.productName}
                        </td>
                        <td className="border border-gray-300 py-2 px-3 text-center">
                          {ticket.ticketUsed ? '사용 완료' : '미사용'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-2 text-sm text-gray-600">
                  총 {order.allCnt || order.tickets?.length || 0}개 티켓 중 {order.usedTicketCnt || 0}개 사용됨
                </div>
              </div>
            )}

            {/* 인쇄 시간 */}
            <div className="mt-8 pt-4 border-t border-gray-300 text-sm text-gray-600 text-right">
              인쇄일시: {formatDateTime(new Date().toISOString())}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default AdminOrderDetail;
