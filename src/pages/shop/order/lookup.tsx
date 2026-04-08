import { useState } from "react";
import { useNavigate } from "@/lib/channel-context";
import { useSearchParams } from "react-router";
import { ShopHeader } from "@/components/shop-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search } from "lucide-react";
import { getPublicChannelByCode } from "@/lib/api/channel";
import { toast } from "sonner";

type Language = "ko" | "en";

interface ShopOrderLookupProps {
  language: Language;
}

export function ShopOrderLookup({ language }: ShopOrderLookupProps) {
  const [orderNumber, setOrderNumber] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const text = {
    ko: {
      title: "주문 조회",
      subtitle: "주문번호로 주문 내역을 확인하세요",
      orderNumberLabel: "주문번호",
      orderNumberPlaceholder: "주문번호를 입력하세요 (예: ORD-2024-001)",
      searchButton: "조회",
    },
    en: {
      title: "Order Lookup",
      subtitle: "Check your order status with order number",
      orderNumberLabel: "Order Number",
      orderNumberPlaceholder: "Enter order number (e.g., ORD-2024-001)",
      searchButton: "Search",
    },
  };

  const t = text[language];

  const handleSearch = async () => {
    if (!orderNumber.trim()) {
      return;
    }

    const trimmedOrderNumber = orderNumber.trim();
    
    // ( 'DEFAULT' )
    const channelCode = searchParams.get('channel') || 'DEFAULT';
    
    // API ID 
    try {
      const response = await getPublicChannelByCode(channelCode);
      
      if (response.success && response.data && response.data.id) {
        // ID URL 
        navigate(`/order-lookup/${response.data.id}/${trimmedOrderNumber}`);
      } else {
        // 
        toast.error(language === 'ko' ? '채널 정보를 불러올 수 없습니다' : 'Failed to load channel information');
      }
    } catch (error) {
      toast.error(language === 'ko' ? '채널 조회 중 오류가 발생했습니다' : 'Error occurred while loading channel');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ShopHeader language={language} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl mb-2">{t.title}</h1>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>

        {/* Search Box */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                type="text"
                placeholder={t.orderNumberPlaceholder}
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="h-12"
              />
            </div>
            <Button onClick={handleSearch} size="lg" className="sm:w-auto w-full">
              <Search className="h-4 w-4 mr-2" />
              {t.searchButton}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
export default ShopOrderLookup;
