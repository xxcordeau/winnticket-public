import { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router";
import { useNavigate } from "@/lib/channel-context";
import { ShopHeader } from "@/components/shop-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Home, ShoppingBag, Copy } from "lucide-react";
import { toast } from "sonner";

type Language = "ko" | "en";

interface OrderItem {
  productId: string;
  productName: string;
  productCode: string;
  categoryName: string;
  optionName?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  thumbnailUrl?: string;
}

interface ShopPaymentSuccessProps {
  language: Language;
}

export function ShopPaymentSuccess({ language }: ShopPaymentSuccessProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState<{
    orderNumber: string;
    orderId: string;
    orderItems: OrderItem[];
    ordererInfo: { name: string; phone: string; email: string };
    totalAmount: number;
    paymentMethod: string;
    pointAmount: number;
  } | null>(null);

  // URL 파라미터에서 주문번호 가져오기
  const orderNumberFromUrl = searchParams.get("orderNumber") || searchParams.get("orderId") || "";

  // state에서 주문 정보 가져오기 (우선순위 1)
  const stateOrderNumber = location.state?.orderNumber || "";
  const stateOrderId = location.state?.orderId || "";
  const stateOrderItems: OrderItem[] = location.state?.orderItems || [];
  const stateOrdererInfo = location.state?.ordererInfo || null;
  const stateTotalAmount = location.state?.totalAmount || 0;
  const statePaymentMethod = location.state?.paymentMethod || "CARD";
  const statePointAmount = location.state?.pointAmount || 0;

  // 주문 정보 처리
  useEffect(() => {
    // state에 정보가 있으면 사용
    if (stateOrderNumber && stateOrderItems.length > 0) {
      setOrderData({
        orderNumber: stateOrderNumber,
        orderId: stateOrderId,
        orderItems: stateOrderItems,
        ordererInfo: stateOrdererInfo || { name: "", phone: "", email: "" },
        totalAmount: stateTotalAmount,
        paymentMethod: statePaymentMethod,
        pointAmount: statePointAmount,
      });
      return;
    }

    // URL에 주문번호만 있으면 간단한 성공 페이지 표시 (API 호출 없이)
    if (orderNumberFromUrl) {
      // 최소한의 정보만 표시
      setOrderData({
        orderNumber: orderNumberFromUrl,
        orderId: orderNumberFromUrl,
        orderItems: [],
        ordererInfo: { name: "", phone: "", email: "" },
        totalAmount: 0,
        paymentMethod: "CARD",
        pointAmount: 0,
      });
      return;
    }

    // 주문번호도 없으면 홈으로
    navigate("/");
  }, [orderNumberFromUrl, stateOrderNumber, stateOrderItems.length, navigate]);

  // 로딩 중이거나 주문 데이터가 없으면 표시 안 함
  if (loading || !orderData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite] mb-4"></div>
          <p className="text-muted-foreground">
            {language === "ko" ? "주문 정보를 불러오는 중..." : "Loading order..."}
          </p>
        </div>
      </div>
    );
  }

  const { orderNumber, orderItems, ordererInfo, totalAmount, paymentMethod, pointAmount } = orderData;

  // ⭐ 결제수단 한글 매핑
  const getPaymentMethodLabel = (method: string): string => {
    const map: Record<string, string> = {
      CARD: "카드",
      VIRTUAL_ACCOUNT: "무통장입금",
      POINT: "베네피아 포인트",
      GIFT: "베네피아 상품권",
      KAKAOPAY: "카카오페이",
    };
    return map[method.trim()] || method.trim();
  };

  // 쉼표로 구분된 결제수단을 배열로 변환
  const paymentMethods = paymentMethod
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

  const text = {
    ko: {
      title: "결제 완료",
      subtitle: "결제가 성공적으로 완료되었습니다",
      thankYou: "이용해 주셔서 감사합니다",
      orderNumber: "주문번호",
      paymentMethod: "결제 방법",
      cardPayment: "카드 결제",
      ordererInfo: "주문자 정보",
      name: "이름",
      phone: "전화번호",
      email: "이메일",
      orderItems: "주문 상품",
      option: "옵션",
      quantity: "수량",
      price: "가격",
      totalAmount: "총 결제 금액",
      goHome: "홈으로",
      goToMyOrders: "주문내역 보기",
      won: "원",
      items: "건",
    },
    en: {
      title: "Payment Complete",
      subtitle: "Your payment has been successfully processed",
      thankYou: "Thank you for your purchase",
      orderNumber: "Order Number",
      paymentMethod: "Payment Method",
      cardPayment: "Card Payment",
      ordererInfo: "Orderer Information",
      name: "Name",
      phone: "Phone",
      email: "Email",
      orderItems: "Order Items",
      option: "Option",
      quantity: "Qty",
      price: "Price",
      totalAmount: "Total Amount",
      goHome: "Go Home",
      goToMyOrders: "View Orders",
      won: "KRW",
      items: "items",
    },
  };

  const t = text[language];

  const formatPrice = (price: number) => {
    return price.toLocaleString();
  };

  // 주문번호 복사 기능
  const handleCopyOrderNumber = async () => {
    try {
      await navigator.clipboard.writeText(orderNumber);
      toast.success(language === "ko" ? "주문번호가 복사되었습니다" : "Order number copied");
    } catch (error) {
      toast.error(language === "ko" ? "복사에 실패했습니다" : "Failed to copy");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ShopHeader language={language} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl mb-2">{t.title}</h1>
          <p className="text-muted-foreground text-lg">{t.subtitle}</p>
          <p className="text-muted-foreground mt-2">{t.thankYou}</p>
        </div>

        <div className="space-y-6">
          {/* 주문 정보 */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t.orderNumber}</span>
                <button
                  onClick={handleCopyOrderNumber}
                  className="flex items-center gap-2 font-semibold font-mono text-lg hover:text-primary transition-colors cursor-pointer group"
                  title={language === "ko" ? "클릭하여 복사" : "Click to copy"}
                >
                  {orderNumber}
                  <Copy className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t.paymentMethod}</span>
                <div className="text-right">
                  {paymentMethods.map((method, idx) => (
                    <span key={method} className="font-medium">
                      {idx > 0 && " + "}
                      {getPaymentMethodLabel(method)}
                    </span>
                  ))}
                </div>
              </div>
              {pointAmount > 0 && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {language === "ko" ? "포인트 사용" : "Points Used"}
                    </span>
                    <span className="font-medium text-primary">
                      -{formatPrice(pointAmount)}{t.won}
                    </span>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* 주문자 정보 */}
          {(ordererInfo.name || ordererInfo.phone || ordererInfo.email) && (
            <Card className="p-6 overflow-hidden">
              <h2 className="text-xl font-semibold mb-4">{t.ordererInfo}</h2>
              <Separator className="mb-4" />
              <div className="space-y-3">
                {ordererInfo.name && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground shrink-0">{t.name}</span>
                    <span className="font-medium text-right truncate">{ordererInfo.name}</span>
                  </div>
                )}
                {ordererInfo.phone && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground shrink-0">{t.phone}</span>
                    <span className="font-medium text-right truncate">{ordererInfo.phone}</span>
                  </div>
                )}
                {ordererInfo.email && (
                  <div className="flex justify-between gap-4 overflow-hidden">
                    <span className="text-muted-foreground shrink-0">{t.email}</span>
                    <span className="font-medium break-all text-right flex-1 min-w-0 overflow-hidden">{ordererInfo.email}</span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* 주문 상품 */}
          {orderItems.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                {t.orderItems}
              </h2>
              <Separator className="mb-4" />

              <div className="space-y-4">
                {orderItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    {item.thumbnailUrl && (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.productName}
                        className="w-20 h-20 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1">{item.productName}</h3>
                      {item.optionName && (
                        <p className="text-sm text-muted-foreground mb-1">
                          {t.option}: {item.optionName}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {t.quantity}: {item.quantity} | {t.price}: {formatPrice(item.unitPrice)}
                        {t.won}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatPrice(item.subtotal)}
                        {t.won}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* 결제 금액 */}
          {totalAmount > 0 && (
            <Card className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    {language === "ko" ? "상품금액" : "Subtotal"}
                  </span>
                  <span className="font-medium">
                    ₩{formatPrice(totalAmount)}
                  </span>
                </div>
                {pointAmount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      {language === "ko" ? "포인트 할인" : "Point Discount"}
                    </span>
                    <span className="font-medium text-red-500">
                      -₩{formatPrice(pointAmount)}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">{t.totalAmount}</span>
                  <span className="text-2xl font-bold text-primary">
                    ₩{formatPrice(totalAmount - pointAmount)}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* 액션 버튼 */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => navigate("/")}
            >
              <Home className="h-4 w-4 mr-2" />
              {t.goHome}
            </Button>
            <Button
              size="lg"
              className="flex-1"
              onClick={() => navigate("/order-lookup")}
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              {t.goToMyOrders}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ShopPaymentSuccess;
