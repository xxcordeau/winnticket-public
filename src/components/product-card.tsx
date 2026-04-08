import type { Product } from "../data/dto/shop.dto";
import { useState, useEffect, useRef } from "react";
import { getImageUrl } from "../lib/utils/image";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface ProductCardProps {
  product: Product;
  promotion?: {
    endDate: string;
  };
  onClick?: () => void;
}

export function ProductCard({ product, promotion, onClick }: ProductCardProps) {
  const [bgColor, setBgColor] = useState<string>("#f7f8fb");
  const imgRef = useRef<HTMLImageElement>(null);

  // URL 
  const thumbnailUrl = getImageUrl(product.thumbnailUrl);

  // 
  const extractDominantColor = (img: HTMLImageElement): string => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return "#f7f8fb";

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      // CORS try-catch 
      try {
        ctx.drawImage(img, 0, 0);
      } catch (error) {
        return "#f7f8fb";
      }

      // 
      const topData = ctx.getImageData(0, 0, canvas.width, Math.floor(canvas.height * 0.1));
      const bottomData = ctx.getImageData(0, Math.floor(canvas.height * 0.9), canvas.width, Math.floor(canvas.height * 0.1));

      const getAverageColor = (data: Uint8ClampedArray) => {
        let r = 0, g = 0, b = 0;
        const pixelCount = data.length / 4;
        
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
        }
        
        return {
          r: Math.round(r / pixelCount),
          g: Math.round(g / pixelCount),
          b: Math.round(b / pixelCount)
        };
      };

      const topColor = getAverageColor(topData.data);
      const bottomColor = getAverageColor(bottomData.data);

      // 
      const avgR = Math.round((topColor.r + bottomColor.r) / 2);
      const avgG = Math.round((topColor.g + bottomColor.g) / 2);
      const avgB = Math.round((topColor.b + bottomColor.b) / 2);

      return `rgb(${avgR}, ${avgG}, ${avgB})`;
    } catch (error) {
      return "#f7f8fb";
    }
  };

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const handleLoad = () => {
      const color = extractDominantColor(img);
      setBgColor(color);
    };

    if (img.complete && img.naturalWidth > 0) {
      handleLoad();
    } else {
      img.addEventListener("load", handleLoad);
      return () => {
        img.removeEventListener("load", handleLoad);
      };
    }
  }, [thumbnailUrl]);

  // 
  const getExpirationInfo = () => {
    if (!promotion?.endDate) return null;
    
    const endDate = new Date(promotion.endDate);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return null; // 
    if (diffDays === 0) return "오늘 마감";
    if (diffDays <= 7) return `${diffDays}일 남음`;
    
    return null; // 7 
  };

  const expirationInfo = getExpirationInfo();
  const hasDiscount = product.isSale && product.discountRate && product.originalPrice;

  // 
  const getSalesStatusLabel = () => {
    if (!product.salesStatus) return null;
    
    const statusLabels: Record<string, { text: string; badgeColor: string; centerText: string }> = {
      'READY': { text: '준비중', badgeColor: 'bg-gray-500', centerText: 'COMING SOON' },
      'ON_SALE': { text: '', badgeColor: '', centerText: '' }, // 
      'SOLD_OUT': { text: '품절', badgeColor: 'bg-red-500', centerText: 'SOLD OUT' },
      'PAUSED': { text: '판매중단', badgeColor: 'bg-orange-500', centerText: '판매중단' },
      'STOPPED': { text: '판매중단', badgeColor: 'bg-orange-500', centerText: '판매중단' },
    };
    
    return statusLabels[product.salesStatus] || null;
  };

  const salesStatusInfo = getSalesStatusLabel();
  const hasOverlay = salesStatusInfo && salesStatusInfo.centerText; // 

  return (
    <div className="group cursor-pointer" onClick={onClick}>
      <div className="space-y-2 sm:space-y-3">
        {/* 썸네일 - 패딩 없음 */}
        <div className="relative w-full aspect-square bg-gray-100 rounded-none sm:rounded-xl overflow-hidden">
          <ImageWithFallback
            ref={imgRef}
            src={thumbnailUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* 사용기한 배지 */}
          {expirationInfo && (
            <div className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-black/70 text-white text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded sm:rounded-lg font-semibold">
              {expirationInfo}
            </div>
          )}
          
          {/* 오버레이 */}
          {hasOverlay && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-sm sm:text-base font-bold">
              {salesStatusInfo.centerText}
            </div>
          )}
        </div>
        
        {/* 상품 정보 - 패딩 추가 */}
        <div className="space-y-1.5 sm:space-y-2 px-2 sm:px-0">
          <h5 
            className="text-sm sm:text-base text-muted-foreground line-clamp-1 leading-snug font-light"
            style={{ fontFamily: "'Pretendard Variable', 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif" }}
          >
            {product.name}
          </h5>
          
          <div>
            {hasDiscount ? (
              <>
                <div className="flex items-baseline gap-1.5 sm:gap-2">
                  <span className="text-red-500 font-bold text-lg sm:text-xl">
                    {product.discountRate}%
                  </span>
                  <span className="text-lg sm:text-xl font-bold">
                    {product.price.toLocaleString()}원
                  </span>
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground line-through">
                  {product.originalPrice?.toLocaleString()}원
                </div>
              </>
            ) : (
              <p className="text-lg sm:text-xl font-bold">
                {product.price.toLocaleString()}원
              </p>
            )}
          </div>
          
          {/* 평점 정보 (있는 경우) */}
          {product.rating && product.reviewCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="text-yellow-500">★</span>
              <span>{product.rating}</span>
              <span>({product.reviewCount?.toLocaleString()})</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}