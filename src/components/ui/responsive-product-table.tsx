import { Product, SalesStatus } from "../../data/dto/product.dto";
import { Badge } from "./badge";
import { Switch } from "./switch";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { MoreVertical, Edit, Settings, Trash2, Eye, Package } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { getImageUrl } from "../../lib/utils/image";

interface ResponsiveProductTableProps {
  products: Product[];
  onDelete: (product: Product) => void;
  onOpenDetail: (product: Product) => void;
  onToggleVisible: (product: Product) => void;
  onNavigateToContentEditor: (productId: string) => void;
  getCategoryName: (categoryId: string) => string;
  getSalesStatusBadgeVariant: (status: SalesStatus) => "default" | "destructive" | "secondary" | "outline";
}

const salesStatusLabelMap: Record<string, string> = {
  READY: "준비중",
  ON_SALE: "판매중",
  PAUSED: "판매중단",
  SOLD_OUT: "품절",
  ENDED: "판매종료",
};

export function ResponsiveProductTable({
  products,
  onDelete,
  onOpenDetail,
  onToggleVisible,
  onNavigateToContentEditor,
  getCategoryName,
  getSalesStatusBadgeVariant,
}: ResponsiveProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full py-16 gap-4">
        <Package className="size-12 text-muted-foreground opacity-20" />
        <p className="text-muted-foreground">등록된 상품이 없습니다.</p>
      </div>
    );
  }

  return (
    <>
      {/* 모바일 카드 레이아웃 (md 미만) */}
      <div className="md:hidden space-y-0 w-full divide-y divide-border">
        {products.map((product) => (
          <div
            key={product.id} 
            className="py-4 px-2 cursor-pointer hover:bg-muted/50 hover:px-3 transition-all rounded-md"
            onClick={() => onOpenDetail(product)}
          >
            <div className="flex gap-3">
              {/* 상품 이미지 */}
              {product.imageUrl && (
                <div className="w-20 h-20 rounded-md overflow-hidden border bg-muted flex-shrink-0">
                  <ImageWithFallback
                    src={getImageUrl(product.imageUrl)}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* 상품 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm line-clamp-2">
                      {product.name}
                    </h3>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded mt-1 inline-block">
                      {product.code}
                    </code>
                  </div>

                  {/* 액션 메뉴 */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onOpenDetail(product);
                      }}>
                        <Settings className="h-4 w-4 mr-2" />
                        상세 관리
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToContentEditor(product.id);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        상세 내용 편집
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(product);
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* 카테고리 */}
                <p className="text-xs text-muted-foreground mb-2 truncate">
                  {getCategoryName(product.categoryId)}
                </p>

                {/* 가격 정보 */}
                <div className="mb-2">
                  {product.discountPrice !== undefined && product.discountPrice !== null ? (
                    <div className="flex items-baseline gap-2">
                      <span className="font-medium text-primary">
                        ₩{product.discountPrice.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground line-through">
                        ₩{(product.price || 0).toLocaleString()}
                      </span>
                    </div>
                  ) : (
                    <span className="font-medium">
                      ₩{(product.price || 0).toLocaleString()}
                    </span>
                  )}
                </div>

                {/* 상태 및 스위치 */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={getSalesStatusBadgeVariant(product.salesStatus)} className="text-xs">
                      {salesStatusLabelMap[product.salesStatus] || product.salesStatus}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs text-muted-foreground">활성</span>
                    <Switch
                      checked={product.visible}
                      onCheckedChange={() => onToggleVisible(product)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 데스크톱 테이블 (md 이상) - 가로 스크롤 지원 + 상품명 고정 */}
      <div className="hidden md:block w-full overflow-x-auto relative">
        <div className="content-stretch flex flex-col items-start relative shrink-0 min-w-[1600px]">
          {/* Table Header */}
          <div className="h-[40px] relative shrink-0 w-full bg-muted/30">
            <div className="content-stretch flex h-[40px] items-start overflow-clip relative rounded-[inherit] w-full">
              <div className="basis-0 content-stretch flex grow h-full items-start overflow-clip relative shrink-0">
                {/* 상품코드 Header - sticky */}
                <div className="sticky left-0 z-10 bg-muted/30 box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[120px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">상품코드</p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>

                {/* 상품명 Header - sticky */}
                <div className="sticky left-[120px] z-10 bg-muted/30 basis-0 grow h-full min-h-px min-w-[300px] relative shrink-0">
                  <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
                    <div className="box-border content-stretch flex items-center justify-between gap-[10px] pl-[20px] pr-0 py-[7px] relative size-full">
                      <p className="text-[13px] text-nowrap whitespace-pre">상품명</p>
                      <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                        <div className="h-[16px] w-px bg-border" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 카테고리 Header */}
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[180px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">카테고리</p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>

                {/* 파트너 Header */}
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[160px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">파트너</p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>

                {/* 정가 Header */}
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[120px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">정가</p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>

                {/* 판매가 Header */}
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[180px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">판매가</p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>

                {/* 판매상태 Header */}
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[120px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">판매상태</p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>

                {/* 활성화 Header */}
                <div className="box-border content-stretch flex h-full items-center justify-between overflow-clip pl-[20px] pr-0 py-0 relative shrink-0 w-[100px]">
                  <p className="text-[13px] text-nowrap whitespace-pre">활성화</p>
                  <div className="relative shrink-0 size-[28px] flex items-center justify-end">
                    <div className="h-[16px] w-px bg-border" />
                  </div>
                </div>
              </div>

              {/* Actions Header */}
              <div className="content-stretch flex gap-[11px] h-full items-center justify-center overflow-clip relative shrink-0 w-[60px]">
                <div className="h-[16px] w-px bg-border" />
              </div>
            </div>
            <div aria-hidden="true" className="absolute border-[1px_0px] border-border border-solid inset-0 pointer-events-none" />
          </div>

          {/* Table Body */}
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
            {products.map((product, rowIndex) => (
              <div
                key={product.id}
                onClick={() => onOpenDetail(product)}
                className={`content-stretch flex h-[52px] items-center overflow-clip relative shrink-0 w-full group transition-colors cursor-pointer ${
                  rowIndex % 2 === 0
                    ? "bg-card hover:bg-[#F3F4F6] dark:hover:bg-muted/10"
                    : "bg-[#F9FAFB] dark:bg-muted/30 hover:bg-[#F3F4F6] dark:hover:bg-muted/10"
                }`}
              >
                {/* 상품코드 Column - sticky */}
                <div className={`sticky left-0 z-10 box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[120px] ${
                  rowIndex % 2 === 0
                    ? "bg-card group-hover:bg-[#F3F4F6] dark:group-hover:bg-muted/10"
                    : "bg-[#F9FAFB] dark:bg-muted/30 group-hover:bg-[#F3F4F6] dark:group-hover:bg-muted/10"
                }`}>
                  <code className="text-[12px] bg-muted px-2 py-1 rounded text-nowrap">
                    {product.code}
                  </code>
                </div>

                {/* 상품명 Column - sticky */}
                <div className={`sticky left-[120px] z-10 basis-0 grow h-full min-h-px min-w-[300px] relative shrink-0 ${
                  rowIndex % 2 === 0
                    ? "bg-card group-hover:bg-[#F3F4F6] dark:group-hover:bg-muted/10"
                    : "bg-[#F9FAFB] dark:bg-muted/30 group-hover:bg-[#F3F4F6] dark:group-hover:bg-muted/10"
                }`}>
                  <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
                    <div className="box-border content-stretch flex items-center gap-3 pl-[20px] pr-[16px] py-[7px] relative size-full">
                      {product.imageUrl && (
                        <div className="w-10 h-10 rounded-md overflow-hidden border bg-muted flex-shrink-0">
                          <ImageWithFallback
                            src={getImageUrl(product.imageUrl)}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <p className="text-[14px] text-foreground text-nowrap overflow-ellipsis overflow-hidden">
                        {product.name}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 카테고리 Column */}
                <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[180px]">
                  <p className="text-[13px] text-muted-foreground text-nowrap overflow-ellipsis overflow-hidden">
                    {getCategoryName(product.categoryId)}
                  </p>
                </div>

                {/* 파트너 Column */}
                <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[160px]">
                  <p className="text-[13px] text-foreground text-nowrap overflow-ellipsis overflow-hidden">
                    {product.partnerName || "-"}
                  </p>
                </div>

                {/* 정가 Column */}
                <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[120px]">
                  <span className="text-[14px] text-foreground">
                    ₩{(product.price || 0).toLocaleString()}
                  </span>
                </div>

                {/* 판매가 Column */}
                <div className="box-border content-stretch flex flex-col gap-[2px] h-full items-start justify-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[180px]">
                  {product.discountPrice !== undefined && product.discountPrice !== null ? (
                    <>
                      <span className="text-[14px] text-primary font-medium">
                        ₩{product.discountPrice.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-destructive">
                        (-₩{((product.price || 0) - product.discountPrice).toLocaleString()} 할인)
                      </span>
                    </>
                  ) : (
                    <span className="text-[14px] text-muted-foreground">
                      ₩{(product.price || 0).toLocaleString()}
                    </span>
                  )}
                </div>

                {/* 판매상태 Column */}
                <div className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[120px]">
                  <Badge variant={getSalesStatusBadgeVariant(product.salesStatus)} className="text-[10px]">
                    {salesStatusLabelMap[product.salesStatus] || product.salesStatus}
                  </Badge>
                </div>

                {/* 활성화 Column */}
                <div 
                  className="box-border content-stretch flex gap-[10px] h-full items-center overflow-clip pl-[20px] pr-[16px] py-0 relative shrink-0 w-[100px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Switch
                    checked={product.visible}
                    onCheckedChange={() => onToggleVisible(product)}
                  />
                </div>

                {/* Actions Column */}
                <div 
                  className="content-stretch flex gap-[11px] h-full items-center justify-center overflow-clip relative shrink-0 w-[60px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 rounded-md transition-colors hover:bg-muted text-muted-foreground hover:text-foreground">
                        <MoreVertical className="h-[14px] w-[14px]" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onOpenDetail(product);
                      }}>
                        <Settings className="h-4 w-4 mr-2" />
                        상세 관리
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToContentEditor(product.id);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        상세 내용 편집
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(product);
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}