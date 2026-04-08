import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { useNavigate } from "@/lib/channel-context";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { ShopHeader } from "@/components/shop-header";

type Language = "ko" | "en";

interface ShopPaymentCallbackProps {
  language: Language;
}

export function ShopPaymentCallback({ language }: ShopPaymentCallbackProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");

  const text = {
    ko: {
      processing: "결제 결과를 확인하고 있습니다...",
      verifying: "결제 정보를 검증 중입니다",
      success: "결제가 완료되었습니다",
      redirecting: "결제 완료 페이지로 이동합니다...",
      failed: "결제에 실패했습니다",
      errorMessage: "결제 처리 중 오류가 발생했습니다",
      returnHome: "홈으로 돌아갑니다...",
    },
    en: {
      processing: "Verifying payment result...",
      verifying: "Verifying payment information",
      success: "Payment completed",
      redirecting: "Redirecting to payment success page...",
      failed: "Payment failed",
      errorMessage: "An error occurred during payment processing",
      returnHome: "Returning to home...",
    },
  };

  const t = text[language];

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // URL 
        const resultCode = searchParams.get("resultCode");
        const orderNumber = searchParams.get("orderNumber");
        const orderId = searchParams.get("orderId");
        const amount = searchParams.get("amount");
        const paymentKey = searchParams.get("paymentKey");


        // (resultCode "0000" "SUCCESS" )
        if (resultCode === "0000" || resultCode === "SUCCESS") {
          setStatus("success");

          // sessionStorage (PG )
          let pendingOrder: Record<string, unknown> | null = null;
          try {
            const stored = sessionStorage.getItem("pendingOrder");
            if (stored) {
              pendingOrder = JSON.parse(stored);
              sessionStorage.removeItem("pendingOrder");
            }
          } catch { /* ignore */ }

          // 
          setTimeout(() => {
            navigate("/payment-success", {
              state: pendingOrder ? {
                ...pendingOrder,
                paymentMethod: (pendingOrder.paymentMethod as string) || "CARD",
              } : {
                orderNumber: orderNumber || "",
                orderId: orderId || "",
                totalAmount: amount ? parseInt(amount) : 0,
                paymentMethod: "CARD",
                ordererInfo: {
                  name: searchParams.get("customerName") || "",
                  phone: searchParams.get("customerPhone") || "",
                  email: searchParams.get("customerEmail") || "",
                },
                orderItems: [],
              },
            });
          }, 1500);
        } else {
          // 
          setStatus("failed");

          // 
          setTimeout(() => {
            navigate("/");
          }, 3000);
        }
      } catch (error) {
        setStatus("failed");

        // 
        setTimeout(() => {
          navigate("/");
        }, 3000);
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ShopHeader language={language} />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="p-8">
          <div className="text-center space-y-6">
            {/* 로딩 상태 */}
            {status === "loading" && (
              <>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/20">
                  <Loader2 className="h-12 w-12 text-blue-600 dark:text-blue-400 animate-spin" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold mb-2">{t.processing}</h1>
                  <p className="text-muted-foreground">{t.verifying}</p>
                </div>
              </>
            )}

            {/* 성공 상태 */}
            {status === "success" && (
              <>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20">
                  <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold mb-2">{t.success}</h1>
                  <p className="text-muted-foreground">{t.redirecting}</p>
                </div>
              </>
            )}

            {/* 실패 상태 */}
            {status === "failed" && (
              <>
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20">
                  <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold mb-2">{t.failed}</h1>
                  <p className="text-muted-foreground">{t.errorMessage}</p>
                  <p className="text-sm text-muted-foreground mt-2">{t.returnHome}</p>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default ShopPaymentCallback;
