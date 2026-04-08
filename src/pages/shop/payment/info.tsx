import { useLocation } from "react-router";
import { useNavigate } from "@/lib/channel-context";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getSiteInfo } from "@/data/site-info";
import { getVisibleBankAccounts } from "@/lib/api/bank-account";
import { createShopOrder, type ShopOrderRequest } from "@/lib/api/order";
import { getCurrentChannel } from "@/data/channels";
import { getProductById } from "@/lib/api/product"; // ⭐ UUID 조회용
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShopHeader } from "@/components/shop-header";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Copy,
  CreditCard,
} from "lucide-react";

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

interface ShopPaymentInfoProps {
  language: Language;
}

export function ShopPaymentInfo({ language }: ShopPaymentInfoProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const orderItems: OrderItem[] = location.state?.orderItems || [];
  const ordererInfo = location.state?.ordererInfo || {};
  const totalAmount = location.state?.totalAmount || 0;
  const cartItemIds: string[] = location.state?.cartItemIds || []; // 장바구니에서 온 아이템 ID들
  const apiOrderNumber: string = location.state?.orderNumber || ""; // ⭐ API에서 받은 실제 주문번호

  const [siteInfo, setSiteInfo] = useState<any>(null);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [orderNumber, setOrderNumber] = useState("");
  const [deadline, setDeadline] = useState("");

  // 주문 정보가 없으면 쇼핑 홈으로 리다이렉트
  useEffect(() => {
    if (!orderItems.length) {
      navigate("/");
    }
  }, [orderItems.length, navigate]);

  useEffect(() => {
    const loadData = async () => {
      // 사이트 정보 로드
      const siteResponse = getSiteInfo();
      if (siteResponse.success && siteResponse.data) {
        setSiteInfo(siteResponse.data);
      }

      // 은행계좌 정보 로드
      const bankResponse = await getVisibleBankAccounts();
      if (bankResponse.success && bankResponse.data) {
        setBankAccounts(bankResponse.data);
      }
    };

    loadData();

    // ⭐ API에서 받은 실제 주문번호만 사용
    setOrderNumber(apiOrderNumber);

    // 입금 마감시간 설정 (3일 후 23:59:59)
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 3);
    deadline.setHours(23, 59, 59, 999);
    const year = deadline.getFullYear();
    const month = String(deadline.getMonth() + 1).padStart(2, "0");
    const day = String(deadline.getDate()).padStart(2, "0");
    setDeadline(`${year}년 ${month}월 ${day}일 23시 59분`);
  }, [apiOrderNumber]);

  // 주문 정보가 없으면 null 반환 (리다이렉트 중)
  if (!orderItems.length) {
    return null;
  }

  const formatPrice = (price: number) => {
    return price.toLocaleString();
  };

  const copyToClipboard = (text: string, label: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand("copy");
      textArea.remove();
      toast.success(`${label}이(가) 복사되었습니다.`);
    } catch (error) {
      textArea.remove();
      toast.error("복사에 실패했습니다.");
    }
  };

  const handleConfirmDeposit = async () => {
    // 장바구니에서 구매한 아이템 제거
    if (cartItemIds.length > 0) {
      try {
        const savedCart = localStorage.getItem("shop_cart");
        if (savedCart) {
          const cartItems = JSON.parse(savedCart);
          // 구매한 아이템 제외하고 필터링
          const updatedCart = cartItems.filter(
            (item: any) => !cartItemIds.includes(item.id)
          );
          localStorage.setItem("shop_cart", JSON.stringify(updatedCart));
          // 장바구니 업데이트 이벤트 발생
          window.dispatchEvent(new Event('cartUpdated'));
        }
      } catch (error) {
        console.error("Failed to remove items from cart:", error);
      }
    }
    
    toast.success("입금 확인 후 처리됩니다.");
    
    // ⭐ 쇼핑몰 홈으로 이동 (채널 파라미터 유지)
    const searchParams = new URLSearchParams(window.location.search);
    const channelParam = searchParams.get('channel');
    const homeUrl = channelParam ? `/?channel=${channelParam}` : '/';
    navigate(homeUrl);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ShopHeader language={language} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            주문이 접수되었습니다
          </h1>
          <p className="text-muted-foreground">
            아래 계좌로 입금해주시면 주문이 완료됩니다.
          </p>
        </div>

        {/* 입금 안내 */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <h2 className="text-xl font-semibold">입금 안내</h2>
          </div>
          <Separator className="mb-4" />

          <div className="space-y-4">
            {/* 입금 마감 시간 */}
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <span className="font-semibold text-orange-900 dark:text-orange-100">
                  입금 마감 시간
                </span>
              </div>
              <p className="text-orange-800 dark:text-orange-200">
                <span className="text-xl font-bold">{deadline}</span>까지 입금해주세요.
              </p>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-2">
                입금 기한이 지나면 자동으로 주문이 취소됩니다.
              </p>
            </div>

            {/* 주문번호 */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground mb-1">주문번호</p>
                {orderNumber ? (
                  <p className="font-mono font-semibold">{orderNumber}</p>
                ) : (
                  <p className="text-sm text-destructive">주문번호를 불러오지 못했습니다. 고객센터에 문의해주세요.</p>
                )}
              </div>
              {orderNumber && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(orderNumber, "주문번호")}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  복사
                </Button>
              )}
            </div>

            {/* 입금 금액 */}
            <div className="flex items-center justify-between p-4 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20">
              <div>
                <p className="text-sm text-muted-foreground mb-1">입금 금액</p>
                <p className="text-2xl font-bold text-primary">
                  {formatPrice(totalAmount)}원
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(String(totalAmount), "입금 금액")}
              >
                <Copy className="h-4 w-4 mr-2" />
                복사
              </Button>
            </div>
          </div>
        </Card>

        {/* 계좌 정보 */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5" />
            <h2 className="text-xl font-semibold">입금 계좌</h2>
          </div>
          <Separator className="mb-4" />

          <div className="space-y-3">
            {bankAccounts.length > 0 ? (
              bankAccounts.map((account: any, index: number) => (
                <div
                  key={account.id || index}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <Badge className="mb-2">{account.bankName}</Badge>
                      <p className="font-mono text-lg font-semibold">
                        {account.accountNumber}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        예금주: {account.accountHolder}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(account.accountNumber, "계좌번호")
                      }
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      복사
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                등록된 계좌 정보가 없습니다.
              </p>
            )}
          </div>
        </Card>

        {/* 주문 상품 정보 */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">주문 상품</h2>
          <Separator className="mb-4" />

          <div className="space-y-3">
            {orderItems.map((item, index) => (
              <div
                key={index}
                className="flex gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                {item.thumbnailUrl && (
                  <img
                    src={item.thumbnailUrl}
                    alt={item.productName}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold mb-1">{item.productName}</h3>
                  {item.optionName && (
                    <p className="text-sm text-muted-foreground mb-1">
                      옵션: {item.optionName}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    수량: {item.quantity} | 가격: {formatPrice(item.unitPrice)}원
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatPrice(item.subtotal)}원</p>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <div className="flex justify-between items-center">
            <span className="font-semibold">총 결제 금액</span>
            <span className="text-2xl font-bold text-primary">
              {formatPrice(totalAmount)}원
            </span>
          </div>
        </Card>

        {/* 주문자 정보 */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">주문자 정보</h2>
          <Separator className="mb-4" />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <p className="text-muted-foreground">이름</p>
            <p className="font-medium">{ordererInfo.name}</p>
            <p className="text-muted-foreground">전화번호</p>
            <p className="font-medium">{ordererInfo.phone}</p>
            <p className="text-muted-foreground">이메일</p>
            <p className="font-medium break-all">{ordererInfo.email}</p>
            {ordererInfo.requestMessage && (
              <>
                <p className="text-muted-foreground">요청사항</p>
                <p className="font-medium">{ordererInfo.requestMessage}</p>
              </>
            )}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center">
          <Button 
            className="w-full" 
            size="lg"
            onClick={handleConfirmDeposit}
          >
            쇼핑 계속하기
          </Button>
        </div>

        {/* 안내 메시지 */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>안내:</strong> 주문이 접수되었습니다. 위 계좌로 입금하시면 
            관리자가 입금을 확인한 후 주문이 확정됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
export default ShopPaymentInfo;
