import { useState, useEffect } from "react";
import { useNavigate } from "@/lib/channel-context";
import { ShopHeader } from "@/components/shop-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  getCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
  type ShopCartItem,
  type ShopCartResponse,
} from "@/lib/api/shop-cart";
import { shopStore } from "@/data/shop-data";
import { getProductById } from "@/lib/api/product"; // ⭐ 상품 상세 조회
import { getImageUrl } from "@/lib/utils/image";

type Language = "ko" | "en";

// 로컬 전용 CartItem (폴백용)
interface LocalCartItem {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  categoryName: string;
  optionName?: string;
  quantity: number;
  unitPrice: number;
  thumbnailUrl?: string;
  venue?: string;
  date?: string;
  salesStatus?: string; // 판매상태 추가
}

interface ShopCartProps {
  language: Language;
}

export function ShopCart({ language }: ShopCartProps) {
  const navigate = useNavigate();
  const [cartData, setCartData] = useState<ShopCartResponse | null>(null);
  const [localCartItems, setLocalCartItems] = useState<LocalCartItem[]>([]); // 폴백용
  const [useLocalCart, setUseLocalCart] = useState(false); // API 실패 시 로컬 사용
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const text = {
    ko: {
      title: "장바구니",
      empty: "장바구니가 비어있습니다",
      emptyDesc: "원하시는 상품을 장바구니에 담아보세요",
      continueShopping: "쇼핑 계속하기",
      product: "상품",
      price: "가격",
      quantity: "수량",
      total: "합계",
      selectAll: "전체 선택",
      deleteSelected: "선택 삭제",
      orderSelected: "선택 상품 주문",
      itemCount: "개 상품",
      totalAmount: "총 주문금액",
      orderAmount: "주문금액",
      discountAmount: "할인금액",
      finalAmount: "최종 결제금액",
      won: "원",
      delete: "삭제",
    },
    en: {
      title: "Shopping Cart",
      empty: "Your cart is empty",
      emptyDesc: "Add items to your shopping cart",
      continueShopping: "Continue Shopping",
      product: "Product",
      price: "Price",
      quantity: "Quantity",
      total: "Total",
      selectAll: "Select All",
      deleteSelected: "Delete Selected",
      orderSelected: "Order Selected",
      itemCount: "items",
      totalAmount: "Total Order Amount",
      orderAmount: "Order Amount",
      discountAmount: "Discount",
      finalAmount: "Final Amount",
      won: "",
      delete: "Delete",
    },
  };

  const t = text[language];

  // 장바구니 불러오기
  useEffect(() => {
    const fetchCart = async () => {
      setIsLoading(true);
      
      const response = await getCart();
      console.log('[장바구니 조회] API 응답:', response);
      
      if (response.success && response.data) {
        // API 성공
        
        // ⭐ 이미지 URL이 없는 경우 shopStore에서 보완
        const productsResponse = shopStore.getAllProducts();
        if (productsResponse.success) {
          const products = productsResponse.data;
          
          response.data.items = response.data.items.map(item => {
            // ⭐ imageUrl이 배열인 경우 첫 번째 요소를 사용
            let imageUrl = item.imageUrl;
            if (Array.isArray(imageUrl)) {
              imageUrl = imageUrl.length > 0 ? imageUrl[0] : '';
            }
            
            // productId로 상품 찾기
            const product = products.find(p => p.id === item.productId);
            
            // 이미지 URL 보완
            if (!imageUrl || (typeof imageUrl === 'string' && imageUrl.trim() === '')) {
              if (product && product.thumbnailUrl) {
                console.log(`[장바구니] 이미지 URL 보완: ${item.productName} -> ${product.thumbnailUrl}`);
                imageUrl = product.thumbnailUrl;
              }
            }
            
            // ⭐ salesStatus 추가
            return {
              ...item,
              imageUrl: imageUrl,
              salesStatus: product?.salesStatus, // 상품의 판매상태 추가
            };
          });
        }
        
        setCartData(response.data);
        setUseLocalCart(false);
        
        // 기본적으로 모든 항목 선택
        const allIds = new Set(response.data.items.map(item => item.id));
        setSelectedItems(allIds);
        setSelectAll(true);
      } else {
        // API 실패 시 로컬 장바구니 사용
        console.log('[장바구니 조회] API 실패, 로컬 장바구니 사용');
        setUseLocalCart(true);
        loadLocalCart();
      }
      
      setIsLoading(false);
    };

    fetchCart();

    // 장바구니 업데이트 이벤트 리스너 추가
    const handleCartUpdate = () => {
      fetchCart();
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  const loadLocalCart = () => {
    const savedCart = localStorage.getItem("shop_cart");
    if (savedCart) {
      try {
        const items = JSON.parse(savedCart);
        setLocalCartItems(items);
        // 기본적으로 모든 항목 선택
        const allIds = new Set(items.map((item: LocalCartItem) => item.id));
        setSelectedItems(allIds);
        setSelectAll(true);
      } catch (e) {
        console.error("Failed to load cart:", e);
      }
    }
  };

  const saveLocalCart = (items: LocalCartItem[]) => {
    localStorage.setItem("shop_cart", JSON.stringify(items));
    setLocalCartItems(items);
    // 장바구니 업데이트 이벤트 발생
    window.dispatchEvent(new Event('cartUpdated'));
  };

  // 전체 선택/해제
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedItems(new Set(useLocalCart ? localCartItems.map(item => item.id) : cartData?.items.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  // 개별 선택
  const handleSelectItem = (itemId: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedItems(newSelected);
    setSelectAll(newSelected.size === (useLocalCart ? localCartItems.length : cartData?.items.length));
  };

  // 수량 변경
  const handleQuantityChange = async (itemId: string, delta: number) => {
    const currentItem = useLocalCart ? localCartItems.find(item => item.id === itemId) : cartData?.items.find(item => item.id === itemId);
    if (!currentItem) return;
    
    const newQuantity = Math.max(1, currentItem.quantity + delta);
    
    if (useLocalCart) {
      const newItems = localCartItems.map(item => {
        if (item.id === itemId) {
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
      saveLocalCart(newItems);
    } else {
      try {
        const response = await updateCartItemQuantity(itemId, newQuantity);
        if (response.success) {
          const cartResponse = await getCart();
          if (cartResponse.success && cartResponse.data) {
            setCartData(cartResponse.data);
          }
          // 장바구니 업데이트 이벤트 발생
          window.dispatchEvent(new Event('cartUpdated'));
        } else {
          toast.error(response.message || "수량 변경에 실패했습니다");
        }
      } catch (e) {
        console.error("Failed to update cart item quantity:", e);
        toast.error("수량 변경에 실패했습니다");
      }
    }
  };

  // 항목 삭제
  const handleDeleteItem = async (itemId: string) => {
    if (useLocalCart) {
      const newItems = localCartItems.filter(item => item.id !== itemId);
      saveLocalCart(newItems);
      selectedItems.delete(itemId);
      setSelectedItems(new Set(selectedItems));
      toast.success("상품이 삭제되었습니다");
    } else {
      try {
        await removeCartItem(itemId);
        const response = await getCart();
        if (response.success && response.data) {
          setCartData(response.data);
        }
        selectedItems.delete(itemId);
        setSelectedItems(new Set(selectedItems));
        toast.success("상품이 삭제되었습니다");
        // 장바구니 업데이트 이벤트 발생
        window.dispatchEvent(new Event('cartUpdated'));
      } catch (e) {
        console.error("Failed to remove cart item:", e);
        toast.error("상품 삭제에 실패했습니다");
      }
    }
  };

  // 선택 항목 삭제
  const handleDeleteSelected = async () => {
    if (selectedItems.size === 0) {
      toast.error("삭제할 상품을 선택해주세요");
      return;
    }

    if (useLocalCart) {
      const newItems = localCartItems.filter(item => !selectedItems.has(item.id));
      saveLocalCart(newItems);
      setSelectedItems(new Set());
      setSelectAll(false);
      toast.success(`${selectedItems.size}개 상품이 삭제되었습니다`);
    } else {
      try {
        await Promise.all(Array.from(selectedItems).map(itemId => removeCartItem(itemId)));
        const response = await getCart();
        if (response.success && response.data) {
          setCartData(response.data);
        }
        setSelectedItems(new Set());
        setSelectAll(false);
        toast.success(`${selectedItems.size}개 상품이 삭제되었습니다`);
        // 장바구니 업데이트 이벤트 발생
        window.dispatchEvent(new Event('cartUpdated'));
      } catch (e) {
        console.error("Failed to remove selected cart items:", e);
        toast.error("선택한 상품 삭제에 실패했습니다");
      }
    }
  };

  // 주문하기
  const handleOrder = () => {
    if (selectedItems.size === 0) {
      toast.error("주문할 상품을 선택해주세요");
      return;
    }

    const selectedCartItems = (useLocalCart ? localCartItems : cartData?.items || []).filter(item => selectedItems.has(item.id));
    const orderItems = selectedCartItems.map(item => {
      // API 응답 (ShopCartItem)과 로컬 (LocalCartItem) 구가 다르므로 통일
      const unitPrice = 'unitPrice' in item ? item.unitPrice : item.unitFinalPrice;
      const imageUrl = 'thumbnailUrl' in item ? item.thumbnailUrl : item.imageUrl;
      
      // ⭐ options 정보 추출 (API 요청에 필요)
      const options = 'options' in item ? item.options : [];
      
      // ⭐ 숙박형 상품의 경우 stayDates 생성
      let stayDates: string[] | undefined = undefined;
      if ('startDate' in item && 'endDate' in item && item.startDate && item.endDate) {
        stayDates = [];
        const currentDate = new Date(item.startDate);
        const endDate = new Date(item.endDate);
        
        while (currentDate <= endDate) {
          stayDates.push(currentDate.toISOString().split('T')[0]); // YYYY-MM-DD 형식
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
      
      console.log(`[장바구니→주문] Item: ${item.productName}`, {
        productId: item.productId,
        options: options, // ⭐ 옵션 정보 확인
        stayDates: stayDates, // ⭐ 숙박 날짜 확인
      });
      
      return {
        productId: item.productId,
        productName: item.productName,
        productCode: 'productCode' in item ? item.productCode : '',
        categoryName: 'categoryName' in item ? item.categoryName : '',
        optionName: 'optionName' in item ? item.optionName : item.options?.map(o => `${o.optionName}: ${o.optionValue}`).join(', '),
        quantity: item.quantity,
        unitPrice: unitPrice,
        subtotal: unitPrice * item.quantity,
        thumbnailUrl: imageUrl,
        options: options, // ⭐ 옵션 정보 포함
        stayDates: stayDates, // ⭐ 숙박 날짜 배열 포함
      };
    });
    
    console.log('[장바구니→주문] 최종 orderItems:', orderItems); // ⭐ 최종 데이터 확인
    
    // 주문하기로 이동
    // 장바구니 아이템 ID도 함께 전달하여 주문 완료 시 장바구니서 제거할 수 있도록 함
    const cartItemIds = selectedCartItems.map(item => item.id);

    navigate("/order", { 
      state: { 
        items: orderItems,
        cartItemIds // 장바구니에서 구매한 아이템 ID 목록
      },
    });
  };

  // 계산
  const selectedCartItems = (useLocalCart ? localCartItems : cartData?.items || []).filter(item => selectedItems.has(item.id));
  const orderAmount = useLocalCart 
    ? selectedCartItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
    : selectedCartItems.reduce((sum, item) => sum + (item.unitFinalPrice * item.quantity), 0);
  const discountAmount = cartData?.discountAmount || 0;
  const finalAmount = cartData?.finalAmount || (orderAmount - discountAmount);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ShopHeader language={language} />
      
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 md:py-8">
        <h1 className="text-xl md:text-2xl mb-6">{t.title}</h1>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 md:py-24">
            <LoadingSpinner size="lg" text="로딩 중..." />
          </div>
        ) : (useLocalCart ? localCartItems.length : cartData?.items.length) === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 md:py-24">
            <ShoppingBag className="h-16 w-16 md:h-20 md:w-20 text-muted-foreground mb-4" />
            <h3 className="text-lg md:text-xl mb-2">{t.empty}</h3>
            <p className="text-sm text-muted-foreground mb-6">{t.emptyDesc}</p>
            <Button onClick={() => navigate("/")}>
              {t.continueShopping}
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* 장바구니 목록 */}
            <div className="lg:col-span-2 space-y-4">
              {/* 전체 선택 */}
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm">{t.selectAll}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteSelected}
                    disabled={selectedItems.size === 0}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    {t.deleteSelected}
                  </Button>
                </div>
              </Card>

              {/* 상품 목록 */}
              {(useLocalCart ? localCartItems : cartData?.items || []).map((item) => {
                // API 응답과 로컬 데이터 구조 통일
                const unitPrice = 'unitPrice' in item ? item.unitPrice : item.unitFinalPrice;
                const imageUrl = 'thumbnailUrl' in item ? item.thumbnailUrl : item.imageUrl;
                const displayOptionName = 'optionName' in item ? item.optionName : item.options?.map(o => `${o.optionName}: ${o.optionValue}`).join(', ');
                
                //  판매상태 확인 (품절/준비중/판매중단)
                const isUnavailable = item.salesStatus && ['SOLD_OUT', 'READY', 'PAUSED', 'STOPPED'].includes(item.salesStatus);
                
                return (
                <Card key={item.id} className={`p-4 ${isUnavailable ? 'opacity-60 bg-gray-100' : ''}`}>
                  <div className="flex gap-4">
                    <Checkbox
                      checked={selectedItems.has(item.id)}
                      onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                      className="mt-1"
                      disabled={isUnavailable}
                    />
                    
                    <div className="flex-1 flex flex-col sm:flex-row gap-4">
                      {/* 상품 이미지 */}
                      <div className="w-full sm:w-24 h-32 sm:h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                        {imageUrl ? (
                          <ImageWithFallback
                            src={getImageUrl(imageUrl)}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        {/* ⭐ 품절/준비중/판매중단 오버레이 */}
                        {isUnavailable && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white text-xs sm:text-sm font-bold">
                              {item.salesStatus === 'SOLD_OUT' && 'SOLD OUT'}
                              {item.salesStatus === 'READY' && 'COMING SOON'}
                              {(item.salesStatus === 'PAUSED' || item.salesStatus === 'STOPPED') && '판매중단'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 상품 정보 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium mb-1 line-clamp-2">{item.productName}</h3>
                            {displayOptionName && (
                              <p className="text-sm text-muted-foreground">{displayOptionName}</p>
                            )}
                            {'venue' in item && item.venue && (
                              <p className="text-xs text-muted-foreground mt-1">{item.venue}</p>
                            )}
                            {/* ⭐ 판매불가 상태 표시 */}
                            {isUnavailable && (
                              <p className="text-xs text-red-500 mt-1 font-medium">
                                {item.salesStatus === 'SOLD_OUT' && '품절된 상품입니다'}
                                {item.salesStatus === 'READY' && '준비 중인 상품입니다'}
                                {(item.salesStatus === 'PAUSED' || item.salesStatus === 'STOPPED') && '판매 중단된 상품입니다'}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteItem(item.id)}
                            className="flex-shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* 가격 및 수량 */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuantityChange(item.id, -1)}
                              disabled={item.quantity <= 1 || isUnavailable}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-12 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuantityChange(item.id, 1)}
                              disabled={isUnavailable}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">
                              {(unitPrice * item.quantity).toLocaleString()}{t.won}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {unitPrice.toLocaleString()}{t.won} × {item.quantity}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
              })}
            </div>

            {/* 주문 요약 */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-20">
                <h2 className="font-semibold mb-4">{t.totalAmount}</h2>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>{t.orderAmount}</span>
                    <span>{orderAmount.toLocaleString()}{t.won}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t.discountAmount}</span>
                    <span className="text-red-500">-{discountAmount.toLocaleString()}{t.won}</span>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between items-center mb-6">
                  <span className="font-semibold">{t.finalAmount}</span>
                  <span className="text-xl font-bold text-primary">
                    {finalAmount.toLocaleString()}{t.won}
                  </span>
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleOrder}
                  disabled={selectedItems.size === 0}
                >
                  {t.orderSelected} ({selectedItems.size}{t.itemCount})
                </Button>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
export default ShopCart;
