import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { useNavigate } from "@/lib/channel-context";
import { ShopHeader } from "@/components/shop-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ArrowLeft,
  Package,
  Calendar,
  User,
  Smartphone,
  CreditCard,
} from "lucide-react";
import {
  getShopOrderByNumber,
  type ShopOrderResponse,
} from "@/lib/api/order";

type Language = "ko" | "en";

interface ShopOrderDetailProps {
  language: Language;
}

export function ShopOrderDetail({
  language,
}: ShopOrderDetailProps) {
  const { orderNumber, channelId } = useParams<{
    orderNumber: string;
    channelId?: string;
  }>();
  const [order, setOrder] = useState<ShopOrderResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const text = {
    ko: {
      backToSearch: "검색으로 돌아가기",
      notFound: "주문 내역을 찾을 수 없습니다",
      notFoundDesc: "입력하신 주문번호를 다시 확인해주세요",
      orderInfo: "주문 정보",
      orderNumber: "주문번호",
      orderDate: "주문일시",
      orderStatus: "주문상태",
      paymentStatus: "결제상태",
      ordererInfo: "주문자 정보",
      name: "이름",
      phone: "연락처",
      email: "이메일",
      orderItems: "주문 상품",
      option: "옵션",
      quantity: "수량",
      unitPrice: "단가",
      subtotal: "소계",
      paymentInfo: "결제 정보",
      itemsTotal: "상품금액",
      totalAmount: "총 결제금액",
      paymentMethod: "결제수단",
      requestMessage: "요청사항",
      channel: "판매채널",
      ticketDeliveryInfo: "티켓 발송 정보",
      ticketDeliveryDesc:
        "티켓은 주문자 연락처로 문자(SMS)를 통해 발송됩니다",
      loading: "주문 정보를 불러오는 중...",
    },
    en: {
      backToSearch: "Back to Search",
      notFound: "Order not found",
      notFoundDesc: "Please check your order number again",
      orderInfo: "Order Information",
      orderNumber: "Order Number",
      orderDate: "Order Date",
      orderStatus: "Order Status",
      paymentStatus: "Payment Status",
      ordererInfo: "Orderer Information",
      name: "Name",
      phone: "Phone (Ticket Delivery)",
      email: "Email",
      orderItems: "Order Items",
      option: "Option",
      quantity: "Quantity",
      unitPrice: "Unit Price",
      subtotal: "Subtotal",
      paymentInfo: "Payment Information",
      itemsTotal: "Items Total",
      totalAmount: "Total Amount",
      paymentMethod: "Payment Method",
      requestMessage: "Request Message",
      channel: "Sales Channel",
      ticketDeliveryInfo: "Ticket Delivery Information",
      ticketDeliveryDesc:
        "Tickets will be sent via SMS to the orderer's phone number",
      loading: "Loading order information...",
    },
  };

  const t = text[language];

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderNumber || !channelId) {
        navigate("/order-lookup");
        return;
      }

      setLoading(true);
      const response = await getShopOrderByNumber(
        channelId,
        orderNumber,
      );

      if (response.success && response.data) {
        setOrder(response.data);
      } else {
        toast.error(t.notFound);
      }
      setLoading(false);
    };

    fetchOrder();
  }, [orderNumber, channelId, t.notFound]); // channelId 추가

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(
      language === "ko" ? "ko-KR" : "en-US",
    ).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(
      language === "ko" ? "ko-KR" : "en-US",
      {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      },
    );
  };

  const getOrderStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING_PAYMENT: "입금대기",
      COMPLETED: "주문완료",
      CANCEL_REQUESTED: "취소신청",
      CANCELED: "취소완료",
      REFUNDED: "환불완료",
      REQUESTED: "요청됨",
    };
    return statusMap[status] || status;
  };

  const getPaymentStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      READY: "결제대기",
      PAID: "결제완료",
      FAILED: "결제실패",
      CANCELED: "결제취소",
      REQUESTED: "요청됨",
      REFUNDED: "환불완료",
    };
    return statusMap[status] || status;
  };

  const getPaymentMethodText = (method: string) => {
    const methodMap: Record<string, string> = {
      CARD: "카드",
      VIRTUAL_ACCOUNT: "무통장입금",
      POINT: "베네피아 포인트",
      GIFT: "베네피아 상품권",
      KAKAOPAY: "카카오페이",
    };
    // ⭐ 쉼표 구분된 결제수단 각각 한글 매핑
    return method
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean)
      .map((m) => methodMap[m] || m)
      .join(", ");
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus =
      getOrderStatusText(status) ||
      getPaymentStatusText(status);

    switch (normalizedStatus) {
      case "입금전":
      case "입금대기":
      case "결제대기":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "결제완료":
      case "주문완료":
      case "배송대기중":
      case "배송준비중":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "배송완료":
      case "주문처리완료":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "취소신청":
      case "취소완료":
      case "환불완료":
      case "결제취소":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "결제실패":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ShopHeader language={language} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/order-lookup")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.backToSearch}
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">{t.loading}</p>
          </Card>
        )}

        {/* Not Found */}
        {!loading && !order && (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl mb-2">{t.notFound}</h3>
            <p className="text-muted-foreground mb-6">
              {t.notFoundDesc}
            </p>
            <Button onClick={() => navigate("/order-lookup")}>
              {t.backToSearch}
            </Button>
          </Card>
        )}

        {/* Order Details */}
        {!loading && order && (
          <div className="space-y-6">
            {/* Order Info */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t.orderInfo}
              </h2>
              <Separator className="mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {t.orderNumber}
                  </p>
                  <p className="font-mono font-semibold">
                    {order.orderNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {t.orderDate}
                  </p>
                  <p className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(order.orderedAt)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {t.orderStatus}
                  </p>
                  <Badge
                    className={getStatusColor(order.status)}
                  >
                    {getOrderStatusText(order.status)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {t.paymentStatus}
                  </p>
                  <Badge
                    className={getStatusColor(
                      order.paymentStatus,
                    )}
                  >
                    {getPaymentStatusText(order.paymentStatus)}
                  </Badge>
                </div>
                {order.channelName && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {t.channel}
                    </p>
                    <p>{order.channelName}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Orderer Info */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                {t.ordererInfo}
              </h2>
              <Separator className="mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {t.name}
                  </p>
                  <p>{order.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {t.phone}
                  </p>
                  <p className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    {order.customerPhone}
                  </p>
                </div>
                {order.customerEmail && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {t.email}
                    </p>
                    <p className="break-all">{order.customerEmail}</p>
                  </div>
                )}
              </div>
              {/* Ticket Delivery Notice */}
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      {t.ticketDeliveryInfo}
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {t.ticketDeliveryDesc}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Order Items */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {t.orderItems}
              </h2>
              <Separator className="mb-4" />
              <div className="space-y-4">
                {order.products.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-semibold mb-1">
                        {item.productName}
                      </p>
                      {item.optionName && (
                        <p className="text-sm text-muted-foreground">
                          {t.option}: {item.optionName}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {item.categoryName &&
                          `${item.categoryName} · `}
                        {item.partnerName &&
                          `${item.partnerName} · `}
                        {t.unitPrice}: ₩
                        {formatCurrency(item.unitPrice)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 sm:text-right">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {t.quantity}
                        </p>
                        <p className="font-semibold">
                          {item.quantity}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {t.subtotal}
                        </p>
                        <p className="font-semibold">
                          ₩{formatCurrency(item.totalPrice)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Payment Info */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {t.paymentInfo}
              </h2>
              <Separator className="mb-4" />
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t.itemsTotal}
                  </span>
                  <span>
                    ₩{formatCurrency(order.totalPrice)}
                  </span>
                </div>
                {order.pointAmount && order.pointAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {language === "ko" ? "포인트 사용" : "Points Used"}
                    </span>
                    <span className="text-red-500">
                      -₩{formatCurrency(order.pointAmount)}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>{t.totalAmount}</span>
                  <span className="text-primary">
                    ₩{formatCurrency(order.totalPrice - (order.pointAmount || 0))}
                  </span>
                </div>
                {order.paymentMethod && (
                  <div className="flex justify-between pt-2">
                    <span className="text-muted-foreground">
                      {t.paymentMethod}
                    </span>
                    <span>
                      {getPaymentMethodText(
                        order.paymentMethod,
                      )}
                    </span>
                  </div>
                )}
                {order.memo && (
                  <div className="pt-2">
                    <p className="text-sm text-muted-foreground mb-1">
                      {t.requestMessage}
                    </p>
                    <p className="text-sm p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      {order.memo}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
export default ShopOrderDetail;
