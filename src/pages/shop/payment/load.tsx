import { Loader2 } from "lucide-react";

type Language = "ko" | "en";

interface ShopPaymentLoadProps {
  language: Language;
}

export function ShopPaymentLoad({ language }: ShopPaymentLoadProps) {
  const text = {
    ko: {
      processing: "결제 처리 중입니다...",
      wait: "잠시만 기다려주세요",
    },
    en: {
      processing: "Processing payment...",
      wait: "Please wait a moment",
    },
  };

  const t = text[language];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/20">
          <Loader2 className="h-12 w-12 text-blue-600 dark:text-blue-400 animate-spin" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold mb-2">{t.processing}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t.wait}</p>
        </div>
      </div>
    </div>
  );
}
export default ShopPaymentLoad;
