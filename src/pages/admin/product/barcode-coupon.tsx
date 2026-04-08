import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router";
import { ChevronLeft, ChevronRight, Phone, Calendar, Package, User, CheckCircle2, XCircle } from "lucide-react";
import JsBarcode from "jsbarcode";
import { getShopOrderCoupon } from "@/lib/api/order";
import type { ShopOrderCouponResponse } from "@/lib/api/order";

export function BarcodeCoupon() {
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(location.search);
  const orderNumber = searchParams.get("orderNumber") || "";

  const [couponData, setCouponData] = useState<ShopOrderCouponResponse | null>(null);
  const [currentTicketIndex, setCurrentTicketIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!orderNumber) {
      setError("주문번호가 필요합니다.");
      setIsLoading(false);
      return;
    }

    const loadCouponData = async () => {
      try {
        setIsLoading(true);
        const response = await getShopOrderCoupon(orderNumber);

        if (response.success && response.data) {
          setCouponData(response.data);
        } else {
          setError(response.message || "쿠폰 정보를 불러올 수 없습니다.");
        }
      } catch (err) {
        setError("쿠폰 정보를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    loadCouponData();
  }, [orderNumber]);

  // 
  const renderBarcode = useCallback(() => {
    if (!barcodeRef.current || !couponData) return;
    const ticket = couponData.tickets[currentTicketIndex];
    if (!ticket) return;

    const barcodeValue = ticket.qrValue || ticket.ticketNumber;
    try {
      JsBarcode(barcodeRef.current, barcodeValue, {
        format: "CODE128",
        width: 2,
        height: 80,
        displayValue: true,
        fontSize: 14,
        margin: 10,
        background: "#FFFFFF",
        lineColor: "#000000",
      });
    } catch {
      // fallback
      try {
        JsBarcode(barcodeRef.current, ticket.ticketNumber, {
          format: "CODE128",
          width: 2,
          height: 80,
          displayValue: true,
          fontSize: 14,
          margin: 10,
        });
      } catch {
        // ignore
      }
    }
  }, [couponData, currentTicketIndex]);

  useEffect(() => {
    renderBarcode();
  }, [renderBarcode]);

  const handleNext = () => {
    if (couponData && currentTicketIndex < couponData.tickets.length - 1) {
      setCurrentTicketIndex(currentTicketIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentTicketIndex > 0) {
      setCurrentTicketIndex(currentTicketIndex - 1);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return dateStr.replace(/-/g, ".");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">쿠폰을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !couponData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">쿠폰을 찾을 수 없습니다</h2>
          <p className="text-sm text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => navigate("/order-lookup")}
            className="w-full py-3 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
          >
            주문 조회로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const currentTicket = couponData.tickets[currentTicketIndex];
  const totalTickets = couponData.tickets.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex flex-col">
      {/* 헤더 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/order-lookup")}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              뒤로
            </button>
            <h1 className="font-bold">입장 쿠폰</h1>
            <div className="w-12"></div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-3">
        {/* 티켓 카운터 */}
        {totalTickets > 1 && (
          <div className="text-center mb-2">
            <div className="inline-flex items-center gap-2 bg-white rounded-full px-3 py-1 shadow-sm text-sm">
              <Package className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-medium">
                {currentTicketIndex + 1} / {totalTickets}
              </span>
            </div>
          </div>
        )}

        {/* 티켓 카드 */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex-1 flex flex-col">
          {/* 상품 정보 헤더 */}
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="font-bold mb-0.5 truncate">{couponData.productName}</h2>
                <p className="text-xs text-amber-100 mb-1.5 truncate">{couponData.optionName}</p>
                <div className="flex items-center gap-1.5 text-amber-100 text-xs">
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{couponData.customerName}님</span>
                </div>
              </div>
              {currentTicket.ticketUsed ? (
                <div className="bg-red-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ml-2">
                  사용완료
                </div>
              ) : (
                <div className="bg-green-500 text-white px-2.5 py-1 rounded-full text-xs font-bold animate-pulse shrink-0 ml-2">
                  사용가능
                </div>
              )}
            </div>
          </div>

          {/* 바코드 영역 */}
          <div className="flex-1 flex flex-col items-center justify-center py-6 bg-gradient-to-b from-gray-50 to-white">
            <div className="flex flex-col items-center">
              <svg ref={barcodeRef} className="max-w-full"></svg>
              <div className="text-center mt-3">
                <p className="text-xs text-muted-foreground mb-0.5">티켓 번호</p>
                <p className="font-bold font-mono tracking-wider">
                  {currentTicket.ticketNumber}
                </p>
              </div>
            </div>

            {/* 티켓 상태 */}
            <div className="flex items-center justify-center gap-2 mt-4">
              {currentTicket.ticketUsed ? (
                <>
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-medium text-red-600">사용된 티켓</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-xs font-medium text-green-600">사용 가능</span>
                </>
              )}
            </div>
          </div>

          {/* 티켓 상세 정보 */}
          <div className="px-4 pb-4 space-y-2">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">발급일</p>
                <p className="text-sm font-medium">{formatDate(couponData.issuedAt)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-red-500 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">유효기간</p>
                <p className="text-sm font-medium">{formatDate(couponData.expireDate)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Phone className="w-5 h-5 text-green-500 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">고객센터</p>
                <a
                  href={`tel:${couponData.customerCenterPhone}`}
                  className="text-sm font-medium text-amber-500 hover:underline"
                >
                  {couponData.customerCenterPhone}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 네비게이션 버튼 */}
        {totalTickets > 1 && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={handlePrev}
              disabled={currentTicketIndex === 0}
              className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-sm ${
                currentTicketIndex === 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-amber-600 hover:bg-amber-50 shadow-md active:scale-95"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              이전
            </button>
            <button
              onClick={handleNext}
              disabled={currentTicketIndex === totalTickets - 1}
              className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-sm ${
                currentTicketIndex === totalTickets - 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-amber-600 hover:bg-amber-50 shadow-md active:scale-95"
              }`}
            >
              다음
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default BarcodeCoupon;
