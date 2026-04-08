import { useState } from "react";
import { useLocation } from "react-router";
import { ShopHeader } from "@/components/shop-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, ArrowRight, Coins, CheckCircle } from "lucide-react";
import { toast } from "sonner";

type Language = "ko" | "en";

interface VoucherExchangeProps {
  language: Language;
}

export function VoucherExchange({ language }: VoucherExchangeProps) {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  
  const [externalPoints, setExternalPoints] = useState(50000); // 
  const [isExchanging, setIsExchanging] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const exchangeRate = 1; // 1:1 
  const minExchange = 1000; // 
  
  const text = {
    ko: {
      title: "포인트 변경",
      subtitle: "타 고객몰 포인트를 상품권으로 변환",
      externalPoints: "보유 포인트",
      exchangeAmount: "교환할 포인트",
      willReceive: "받을 상품권",
      exchangeRate: "교환 비율",
      minExchange: "최소 교환 금액",
      allIn: "전액",
      exchange: "상품권으로 교환",
      exchanging: "교환 중...",
      success: "교환 완료!",
      successMessage: "포인트가 상품권으로 교환되었습니다",
      error: "오류",
      errorMinAmount: `최소 ${minExchange.toLocaleString()}포인트 이상 교환 가능합니다`,
      errorInsufficientPoints: "보유 포인트가 부족합니다",
      placeholder: "교환할 포인트를 입력하세요",
      allInOnly: "전액 교환만 가능합니다",
    },
    en: {
      title: "Point Exchange",
      subtitle: "Convert external points to vouchers",
      externalPoints: "Available Points",
      exchangeAmount: "Points to Exchange",
      willReceive: "Voucher Amount",
      exchangeRate: "Exchange Rate",
      minExchange: "Minimum Exchange",
      allIn: "All",
      exchange: "Exchange to Voucher",
      exchanging: "Exchanging...",
      success: "Exchange Complete!",
      successMessage: "Points have been converted to vouchers",
      error: "Error",
      errorMinAmount: `Minimum ${minExchange.toLocaleString()} points required`,
      errorInsufficientPoints: "Insufficient points",
      placeholder: "Enter points to exchange",
      allInOnly: "Full amount exchange only",
    },
  };

  const t = text[language];

  const handleExchange = async () => {
    const amount = externalPoints;

    if (!amount || amount < minExchange) {
      toast.error(t.errorMinAmount);
      return;
    }

    setIsExchanging(true);

    // API 
    setTimeout(() => {
      setExternalPoints(0);
      setIsExchanging(false);
      setShowSuccess(true);

      toast.success(t.successMessage, {
        description: `${amount.toLocaleString()}P → ${(amount * exchangeRate).toLocaleString()}원`,
      });

      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    }, 1500);
  };

  const voucherAmount = externalPoints * exchangeRate;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* 쇼핑몰 페이지에서만 ShopHeader 렌더링 */}
      {!isAdminPage && <ShopHeader language={language} />}

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Coins className="h-8 w-8 text-primary" />
            <h1 className="text-3xl">{t.title}</h1>
          </div>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>

        <div className="space-y-6">
          {/* 보유 포인트 카드 */}
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                  <Coins className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">{t.externalPoints}</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                    {externalPoints.toLocaleString()}
                    <span className="text-lg ml-1">P</span>
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* 교환 폼 */}
          <Card className="p-6">
            <div className="space-y-6">
              {/* 교환 금액 입력 */}
              <div className="space-y-2">
                <Label htmlFor="exchangeAmount" className="text-sm font-medium">
                  {t.exchangeAmount}
                </Label>
                <div className="relative">
                  <Input
                    id="exchangeAmount"
                    type="text"
                    value={`${externalPoints.toLocaleString()} (${t.allIn})`}
                    readOnly
                    className="pr-12 bg-muted/50 cursor-not-allowed"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    P
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t.allInOnly}
                </p>
              </div>

              {/* 교환 비율 안내 */}
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {externalPoints.toLocaleString()}P
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">포인트</p>
                </div>
                <ArrowRight className="w-6 h-6 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {voucherAmount.toLocaleString()}원
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">상품권</p>
                </div>
              </div>

              {/* 교환 버튼 */}
              <Button
                onClick={handleExchange}
                disabled={externalPoints === 0 || isExchanging || showSuccess}
                className="w-full h-12 text-base"
                size="lg"
              >
                {showSuccess ? (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    {t.success}
                  </>
                ) : isExchanging ? (
                  t.exchanging
                ) : (
                  <>
                    <Gift className="w-5 h-5 mr-2" />
                    {t.exchange}
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* 안내 사항 */}
          <Card className="p-4 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
            <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
              안내사항
            </h3>
            <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
              <li>• 타 고객몰에서 적립한 포인트를 상품권으로 교환할 수 있습니다</li>
              <li>• 교환 비율은 1포인트 = 1원입니다</li>
              <li>• 전액 교환만 가능하며, 일부 금액만 교환할 수 없습니다</li>
              <li>• 교환된 상품권은 즉시 사용 가능합니다</li>
              <li>• 교환 후 취소는 불가능하니 신중히 선택해주세요</li>
            </ul>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default VoucherExchange;