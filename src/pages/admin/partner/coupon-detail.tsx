import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { SegmentTabs } from "@/components/ui/segment-tabs";
import { PageHeader } from "@/components/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Edit,
  Tag,
  Calendar,
  ShoppingCart,
  TrendingUp,
  Package,
  Percent,
  DollarSign,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  getCouponById,
  updateCoupon,
} from "@/data/coupons";
import { getImageUrl } from "@/lib/utils/image";

type Language = "ko" | "en";

interface CouponDetailProps {
  language: Language;
}

export function CouponDetail({ language }: CouponDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [editedCoupon, setEditedCoupon] = useState<Coupon | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState("basic");
  const [isEditing, setIsEditing] = useState(false);

  // 
  const fetchData = () => {
    if (id) {
      const response = getCouponById(id);
      if (response.success) {
        setCoupon(response.data);
        setEditedCoupon(response.data);
      }

      const productsResponse = getProducts(0, 1000);
      if (productsResponse.success) {
        setProducts(productsResponse.data.content);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (!coupon) {
    return <div>Loading...</div>;
  }

  // 
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // 
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR").format(amount);
  };

  // 
  const handleEdit = () => {
    setIsEditing(true);
  };

  // 
  const handleSave = () => {
    if (!editedCoupon) return;

    if (!editedCoupon.code || !editedCoupon.name) {
      toast.error("필수 항��을 모두 입력해주세요.");
      return;
    }

    const response = updateCoupon(coupon!.id, editedCoupon);
    if (response.success) {
      toast.success("쿠폰이 수정되었습니다.");
      fetchData();
      setIsEditing(false);
    }
  };

  // 
  const handleCancel = () => {
    setEditedCoupon(coupon);
    setIsEditing(false);
  };

  // 
  const handleToggleActive = (checked: boolean) => {
    if (isEditing && editedCoupon) {
      setEditedCoupon({ ...editedCoupon, isActive: checked });
    } else {
      const response = updateCoupon(coupon!.id, { isActive: checked });
      if (response.success) {
        toast.success(checked ? "쿠폰이 활성화되었습니다." : "쿠폰이 비활성화되었습니다.");
        fetchData();
      }
    }
  };

  const currentCoupon = isEditing ? editedCoupon! : coupon;

  // 
  const appliedProducts = currentCoupon.productIds.length > 0
    ? products.filter((p) => currentCoupon.productIds.includes(p.id))
    : products;

  // 
  const usageData = [
    { name: "사용됨", value: currentCoupon.usedCount, color: "#0c8ce9" },
    { name: "남음", value: currentCoupon.usageLimit - currentCoupon.usedCount, color: "#e5e7eb" },
  ];

  // ( )
  const dailyUsageData = [
    { date: "11/01", count: 12 },
    { date: "11/02", count: 19 },
    { date: "11/03", count: 15 },
    { date: "11/04", count: 25 },
    { date: "11/05", count: 22 },
    { date: "11/06", count: 30 },
    { date: "11/07", count: 28 },
  ];

  // ( )
  const productUsageData = appliedProducts.slice(0, 5).map((product, index) => ({
    name: product.name.length > 10 ? product.name.substring(0, 10) + "..." : product.name,
    count: Math.floor(Math.random() * 50) + 10,
  }));

  const tabOptions = [
    { value: "basic", label: "기본 정보" },
    { value: "products", label: "적용 상품" },
    { value: "stats", label: "사용 통계" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/products")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          목록으로
        </Button>
        <div className="flex-1">
          <PageHeader
            title={currentCoupon.name}
            subtitle={currentCoupon.code}
            language="ko"
            rightContent={
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label>활성화</Label>
                  <Switch
                    checked={currentCoupon.isActive}
                    onCheckedChange={handleToggleActive}
                  />
                </div>
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={handleCancel} className="gap-1.5">
                      <X className="h-4 w-4" />
                      취소
                    </Button>
                    <Button onClick={handleSave} className="bg-[#0c8ce9] hover:bg-[#0c8ce9]/90 gap-1.5">
                      <Save className="h-4 w-4" />
                      저장
                    </Button>
                  </>
                ) : (
                  <Button onClick={handleEdit} className="bg-[#0c8ce9] hover:bg-[#0c8ce9]/90 gap-1.5">
                    <Edit className="h-4 w-4" />
                    편집
                  </Button>
                )}
              </div>
            }
          />
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card relative rounded-[8px] p-5">
          <div
            aria-hidden="true"
            className="absolute border border-border border-solid inset-0 pointer-events-none rounded-[8px]"
          />
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-muted-foreground text-[12px]">할인 타입</p>
              <div className="flex items-baseline gap-2">
                {currentCoupon.discountType === "정률" ? (
                  <Percent className="h-5 w-5 text-blue-500" />
                ) : (
                  <DollarSign className="h-5 w-5 text-green-500" />
                )}
                <span className="text-foreground">
                  {currentCoupon.discountType}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card relative rounded-[8px] p-5">
          <div
            aria-hidden="true"
            className="absolute border border-border border-solid inset-0 pointer-events-none rounded-[8px]"
          />
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-muted-foreground text-[12px]">할인값</p>
              <p className="text-foreground">
                {currentCoupon.discountType === "정률"
                  ? `${currentCoupon.discountValue}%`
                  : `${formatCurrency(currentCoupon.discountValue)}원`}
              </p>
              {currentCoupon.maxDiscountAmount && (
                <p className="text-muted-foreground text-[11px]">
                  최대 {formatCurrency(currentCoupon.maxDiscountAmount)}원
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-card relative rounded-[8px] p-5">
          <div
            aria-hidden="true"
            className="absolute border border-border border-solid inset-0 pointer-events-none rounded-[8px]"
          />
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-muted-foreground text-[12px]">사용률</p>
              <p className="text-foreground">
                {currentCoupon.usedCount} / {currentCoupon.usageLimit}
              </p>
              <p className="text-muted-foreground text-[11px]">
                {Math.round((currentCoupon.usedCount / currentCoupon.usageLimit) * 100)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card relative rounded-[8px] p-5">
          <div
            aria-hidden="true"
            className="absolute border border-border border-solid inset-0 pointer-events-none rounded-[8px]"
          />
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-muted-foreground text-[12px]">유효기간</p>
              <p className="text-foreground text-[13px]">
                {formatDate(currentCoupon.validFrom)}
              </p>
              <p className="text-muted-foreground text-[11px]">
                ~ {formatDate(currentCoupon.validUntil)}
              </p>
            </div>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-card relative rounded-[8px]">
        <div
          aria-hidden="true"
          className="absolute border border-border border-solid inset-0 pointer-events-none rounded-[8px]"
        />
        <div className="p-6">
          <SegmentTabs
            value={activeTab}
            onValueChange={setActiveTab}
            options={tabOptions}
          />

          <div className="mt-6">
            {activeTab === "basic" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>쿠폰 코드 *</Label>
                    {isEditing ? (
                      <Input
                        value={editedCoupon?.code || ""}
                        onChange={(e) =>
                          setEditedCoupon({ ...editedCoupon!, code: e.target.value.toUpperCase() })
                        }
                      />
                    ) : (
                      <div className="bg-muted/30 p-3 rounded-md">
                        <p className="text-foreground">{currentCoupon.code}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>쿠폰명 *</Label>
                    {isEditing ? (
                      <Input
                        value={editedCoupon?.name || ""}
                        onChange={(e) =>
                          setEditedCoupon({ ...editedCoupon!, name: e.target.value })
                        }
                      />
                    ) : (
                      <div className="bg-muted/30 p-3 rounded-md">
                        <p className="text-foreground">{currentCoupon.name}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>설명</Label>
                  {isEditing ? (
                    <Textarea
                      value={editedCoupon?.description || ""}
                      onChange={(e) =>
                        setEditedCoupon({ ...editedCoupon!, description: e.target.value })
                      }
                      rows={2}
                    />
                  ) : (
                    <div className="bg-muted/30 p-3 rounded-md">
                      <p className="text-foreground">{currentCoupon.description || "-"}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>할인 타입 *</Label>
                    {isEditing ? (
                      <Select
                        value={editedCoupon?.discountType}
                        onValueChange={(value) =>
                          setEditedCoupon({
                            ...editedCoupon!,
                            discountType: value as DiscountType,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="정률">정률 (%)</SelectItem>
                          <SelectItem value="정액">정액 (원)</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="bg-muted/30 p-3 rounded-md">
                        <p className="text-foreground">{currentCoupon.discountType}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>할인값 *</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editedCoupon?.discountValue || 0}
                        onChange={(e) =>
                          setEditedCoupon({
                            ...editedCoupon!,
                            discountValue: Number(e.target.value),
                          })
                        }
                      />
                    ) : (
                      <div className="bg-muted/30 p-3 rounded-md">
                        <p className="text-foreground">
                          {currentCoupon.discountType === "정률"
                            ? `${currentCoupon.discountValue}%`
                            : `${formatCurrency(currentCoupon.discountValue)}원`}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>최대 할인 금액</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editedCoupon?.maxDiscountAmount || ""}
                        onChange={(e) =>
                          setEditedCoupon({
                            ...editedCoupon!,
                            maxDiscountAmount: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          })
                        }
                        disabled={editedCoupon?.discountType === "정액"}
                      />
                    ) : (
                      <div className="bg-muted/30 p-3 rounded-md">
                        <p className="text-foreground">
                          {currentCoupon.maxDiscountAmount
                            ? `${formatCurrency(currentCoupon.maxDiscountAmount)}원`
                            : "-"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>최소 구매 금액 *</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editedCoupon?.minPurchaseAmount || 0}
                        onChange={(e) =>
                          setEditedCoupon({
                            ...editedCoupon!,
                            minPurchaseAmount: Number(e.target.value),
                          })
                        }
                      />
                    ) : (
                      <div className="bg-muted/30 p-3 rounded-md">
                        <p className="text-foreground">
                          {formatCurrency(currentCoupon.minPurchaseAmount)}원
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>사용 횟수 제한 *</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editedCoupon?.usageLimit || 0}
                        onChange={(e) =>
                          setEditedCoupon({
                            ...editedCoupon!,
                            usageLimit: Number(e.target.value),
                          })
                        }
                      />
                    ) : (
                      <div className="bg-muted/30 p-3 rounded-md">
                        <p className="text-foreground">
                          {formatCurrency(currentCoupon.usageLimit)}회
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>유효 시작일 *</Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={editedCoupon?.validFrom.split("T")[0] || ""}
                        onChange={(e) =>
                          setEditedCoupon({
                            ...editedCoupon!,
                            validFrom: new Date(e.target.value).toISOString(),
                          })
                        }
                      />
                    ) : (
                      <div className="bg-muted/30 p-3 rounded-md">
                        <p className="text-foreground">{formatDate(currentCoupon.validFrom)}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>유효 종료일 *</Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={editedCoupon?.validUntil.split("T")[0] || ""}
                        onChange={(e) =>
                          setEditedCoupon({
                            ...editedCoupon!,
                            validUntil: new Date(e.target.value).toISOString(),
                          })
                        }
                      />
                    ) : (
                      <div className="bg-muted/30 p-3 rounded-md">
                        <p className="text-foreground">{formatDate(currentCoupon.validUntil)}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>생성일</Label>
                    <div className="bg-muted/30 p-3 rounded-md">
                      <p className="text-foreground">{formatDate(currentCoupon.createdAt)}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>수정일</Label>
                    <div className="bg-muted/30 p-3 rounded-md">
                      <p className="text-foreground">{formatDate(currentCoupon.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "products" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground">
                    {currentCoupon.productIds.length === 0
                      ? "모든 상품에 적용됩니다"
                      : `${appliedProducts.length}개 상품에 적용`}
                  </p>
                </div>

                {appliedProducts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {appliedProducts.map((product) => (
                      <div
                        key={product.id}
                        className="bg-muted/30 relative rounded-[8px] p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => {
                          // ( ID state )
                          navigate("/admin/products", { state: { openProductId: product.id } });
                        }}
                      >
                        <div
                          aria-hidden="true"
                          className="absolute border border-border border-solid inset-0 pointer-events-none rounded-[8px]"
                        />
                        <div className="flex gap-3">
                          {product.imageUrl ? (
                            <img
                              src={getImageUrl(product.imageUrl)}
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded-md shrink-0"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center shrink-0">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-foreground truncate">
                              {product.name}
                            </p>
                            <p className="text-muted-foreground text-[12px] mt-1">
                              {formatCurrency(product.price)}원
                            </p>
                            {product.categoryName && (
                              <Badge variant="outline" className="mt-2">
                                {product.categoryName}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <Package className="size-12 text-muted-foreground opacity-20" />
                    <p className="text-muted-foreground">적용된 상품이 없습니다.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "stats" && (
              <div className="space-y-6">
                {/* 사용률 차트 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-muted/30 relative rounded-[8px] p-6">
                    <div
                      aria-hidden="true"
                      className="absolute border border-border border-solid inset-0 pointer-events-none rounded-[8px]"
                    />
                    <h3 className="text-foreground mb-4">사용률</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={usageData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {usageData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-muted/30 relative rounded-[8px] p-6">
                    <div
                      aria-hidden="true"
                      className="absolute border border-border border-solid inset-0 pointer-events-none rounded-[8px]"
                    />
                    <h3 className="text-foreground mb-4">일별 사용 추이</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={dailyUsageData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="#0c8ce9"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 상품별 사용 통계 */}
                {productUsageData.length > 0 && (
                  <div className="bg-muted/30 relative rounded-[8px] p-6">
                    <div
                      aria-hidden="true"
                      className="absolute border border-border border-solid inset-0 pointer-events-none rounded-[8px]"
                    />
                    <h3 className="text-foreground mb-4">상품별 사용 통계</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={productUsageData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#0c8ce9" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* 통계 요약 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-muted/30 relative rounded-[8px] p-5">
                    <div
                      aria-hidden="true"
                      className="absolute border border-border border-solid inset-0 pointer-events-none rounded-[8px]"
                    />
                    <p className="text-muted-foreground text-[12px] mb-2">총 사용 횟수</p>
                    <p className="text-foreground text-[24px]">
                      {formatCurrency(coupon.usedCount)}
                    </p>
                  </div>

                  <div className="bg-muted/30 relative rounded-[8px] p-5">
                    <div
                      aria-hidden="true"
                      className="absolute border border-border border-solid inset-0 pointer-events-none rounded-[8px]"
                    />
                    <p className="text-muted-foreground text-[12px] mb-2">남은 횟수</p>
                    <p className="text-foreground text-[24px]">
                      {formatCurrency(coupon.usageLimit - coupon.usedCount)}
                    </p>
                  </div>

                  <div className="bg-muted/30 relative rounded-[8px] p-5">
                    <div
                      aria-hidden="true"
                      className="absolute border border-border border-solid inset-0 pointer-events-none rounded-[8px]"
                    />
                    <p className="text-muted-foreground text-[12px] mb-2">평균 할인 금액</p>
                    <p className="text-foreground text-[24px]">
                      {coupon.discountType === "정률"
                        ? `${coupon.discountValue}%`
                        : `${formatCurrency(coupon.discountValue)}원`}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default CouponDetail;
