import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Plus, Pencil, Trash2, AlertCircle, DollarSign } from "lucide-react";
import type { Product, ProductOption } from "@/data/dto/product.dto";
import type { Season, SeasonFormData } from "@/types/season";
import { toast } from "sonner";

interface ProductDetailSeasonsProps {
  product: Product;
  options?: ProductOption[];
  onUpdate?: (product: Product) => void;
}

export function ProductDetailSeasons({
  product,
  options = [],
  onUpdate,
}: ProductDetailSeasonsProps) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSeasonId, setEditingSeasonId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SeasonFormData>({
    name: "",
    startDate: "",
    endDate: "",
    basePrice: "",
    discountPrice: "",
    optionSetIds: [],
    optionPriceAdjustments: {},
    priority: "1",
    enabled: true,
  });

  // 
  useEffect(() => {
    const storedSeasons = localStorage.getItem(`product_seasons_${product.id}`);
    if (storedSeasons) {
      try {
        setSeasons(JSON.parse(storedSeasons));
      } catch (e) {
      }
    }
  }, [product.id]);

  // 
  const saveSeasons = (newSeasons: Season[]) => {
    localStorage.setItem(`product_seasons_${product.id}`, JSON.stringify(newSeasons));
    setSeasons(newSeasons);
    onUpdate?.({ ...product, seasons: newSeasons });
  };

  // 
  const resetForm = () => {
    setFormData({
      name: "",
      startDate: "",
      endDate: "",
      basePrice: product.price.toString(),
      discountPrice: (product.discountPrice || product.price).toString(),
      optionSetIds: [],
      optionPriceAdjustments: {},
      priority: (seasons.length + 1).toString(),
      enabled: true,
    });
    setEditingSeasonId(null);
  };

  // / 
  const handleOpenDialog = (season?: Season) => {
    if (season) {
      setEditingSeasonId(season.id);
      setFormData({
        name: season.name,
        startDate: season.startDate,
        endDate: season.endDate,
        basePrice: season.basePrice.toString(),
        discountPrice: (season.discountPrice || season.basePrice).toString(),
        optionSetIds: season.optionSetIds,
        optionPriceAdjustments: Object.fromEntries(
          Object.entries(season.optionPriceAdjustments || {}).map(([k, v]) => [k, v.toString()])
        ),
        priority: season.priority.toString(),
        enabled: season.enabled,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  // 
  const handleSaveSeason = () => {
    // 
    if (!formData.name.trim()) {
      toast.error("시즌 이름을 입력해주세요.");
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      toast.error("시작일과 종료일을 입력해주세요.");
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      toast.error("종료일은 시작일 이후여야 합니다.");
      return;
    }

    const basePrice = parseFloat(formData.basePrice);
    const discountPrice = parseFloat(formData.discountPrice);
    const priority = parseInt(formData.priority);

    if (isNaN(basePrice) || basePrice < 0) {
      toast.error("올바른 기본가를 입력해주세요.");
      return;
    }

    if (isNaN(discountPrice) || discountPrice < 0) {
      toast.error("올바른 할인가를 입력해주세요.");
      return;
    }

    if (isNaN(priority) || priority < 1) {
      toast.error("우선순위는 1 이상이어야 합니다.");
      return;
    }

    // 
    const optionPriceAdjustments: Record<string, number> = {};
    Object.entries(formData.optionPriceAdjustments).forEach(([optionId, value]) => {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        optionPriceAdjustments[optionId] = numValue;
      }
    });

    const seasonData: Season = {
      id: editingSeasonId || `season_${Date.now()}`,
      name: formData.name,
      startDate: formData.startDate,
      endDate: formData.endDate,
      basePrice,
      discountPrice,
      optionSetIds: formData.optionSetIds,
      optionPriceAdjustments,
      priority,
      enabled: formData.enabled,
      createdAt: editingSeasonId
        ? seasons.find((s) => s.id === editingSeasonId)?.createdAt
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let newSeasons: Season[];
    if (editingSeasonId) {
      newSeasons = seasons.map((s) => (s.id === editingSeasonId ? seasonData : s));
      toast.success("시즌이 수정되었습니다.");
    } else {
      newSeasons = [...seasons, seasonData];
      toast.success("시즌이 추가되었습니다.");
    }

    // 
    newSeasons.sort((a, b) => a.priority - b.priority);

    saveSeasons(newSeasons);
    setIsDialogOpen(false);
    resetForm();
  };

  // 
  const handleDeleteSeason = (seasonId: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    const newSeasons = seasons.filter((s) => s.id !== seasonId);
    saveSeasons(newSeasons);
    toast.success("시즌이 삭제되었습니다.");
  };

  // /
  const handleToggleSeason = (seasonId: string, enabled: boolean) => {
    const newSeasons = seasons.map((s) =>
      s.id === seasonId ? { ...s, enabled } : s
    );
    saveSeasons(newSeasons);
    toast.success(enabled ? "시즌이 활성화되었습니다." : "시즌이 비활성화되었습니다.");
  };

  // /
  const handleToggleOption = (optionId: string) => {
    setFormData((prev) => {
      const optionSetIds = prev.optionSetIds.includes(optionId)
        ? prev.optionSetIds.filter((id) => id !== optionId)
        : [...prev.optionSetIds, optionId];
      return { ...prev, optionSetIds };
    });
  };

  // 
  const handleOptionPriceChange = (optionId: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      optionPriceAdjustments: {
        ...prev.optionPriceAdjustments,
        [optionId]: value,
      },
    }));
  };

  // 
  const checkOverlappingSeasons = (season: Season): Season[] => {
    const startDate = new Date(season.startDate);
    const endDate = new Date(season.endDate);

    return seasons.filter((s) => {
      if (s.id === season.id || !s.enabled) return false;

      const sStartDate = new Date(s.startDate);
      const sEndDate = new Date(s.endDate);

      return (
        (startDate >= sStartDate && startDate <= sEndDate) ||
        (endDate >= sStartDate && endDate <= sEndDate) ||
        (startDate <= sStartDate && endDate >= sEndDate)
      );
    });
  };

  // 
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // 
  const getPriceDifference = (seasonPrice: number, originalPrice: number) => {
    const diff = seasonPrice - originalPrice;
    if (diff === 0) return null;
    const sign = diff > 0 ? "+" : "";
    return `${sign}${diff.toLocaleString()}원`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-medium">시즌/일정 관리</h3>
          <p className="text-sm text-muted-foreground mt-1">
            특정 기간에 적용되는 가격과 옵션을 설정합니다.
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="size-4 mr-2" />
          시즌 추가
        </Button>
      </div>

      {/* 기본 상품 정보 */}
      <div className="border rounded-lg p-4 bg-muted/30">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="size-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">기본 가격 정보</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">기본가</p>
            <p className="font-medium">{product.price.toLocaleString()}원</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">할인가</p>
            <p className="font-medium">
              {(product.discountPrice || product.price).toLocaleString()}원
            </p>
          </div>
        </div>
      </div>

      {/* 시즌 목록 */}
      {seasons.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-12 text-center">
          <Calendar className="size-12 mx-auto text-muted-foreground mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground mb-4">
            등록된 시즌이 없습니다.
            <br />
            시즌을 추가하여 기간별 가격과 옵션을 설정하세요.
          </p>
          <Button variant="outline" onClick={() => handleOpenDialog()}>
            <Plus className="size-4 mr-2" />
            첫 시즌 추가하기
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {seasons.map((season) => {
            const overlapping = checkOverlappingSeasons(season);
            const priceDiff = getPriceDifference(
              season.discountPrice || season.basePrice,
              product.discountPrice || product.price
            );

            return (
              <div
                key={season.id}
                className={`border rounded-lg p-4 ${
                  season.enabled ? "bg-background" : "bg-muted/50 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{season.name}</h4>
                      <Badge variant={season.enabled ? "default" : "secondary"}>
                        우선순위 {season.priority}
                      </Badge>
                      {!season.enabled && (
                        <Badge variant="outline">비활성</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="size-3.5" />
                      <span>
                        {formatDate(season.startDate)} ~ {formatDate(season.endDate)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={season.enabled}
                      onCheckedChange={(enabled) =>
                        handleToggleSeason(season.id, enabled)
                      }
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(season)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSeason(season.id)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {/* 가격 정보 */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-muted/50 rounded p-3">
                    <p className="text-xs text-muted-foreground mb-1">기본가</p>
                    <p className="font-medium">
                      {season.basePrice.toLocaleString()}원
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded p-3">
                    <p className="text-xs text-muted-foreground mb-1">할인가</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {(season.discountPrice || season.basePrice).toLocaleString()}원
                      </p>
                      {priceDiff && (
                        <Badge
                          variant={
                            season.discountPrice! > (product.discountPrice || product.price)
                              ? "destructive"
                              : "default"
                          }
                          className="text-xs"
                        >
                          {priceDiff}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* 적용 옵션 */}
                {season.optionSetIds.length > 0 && options && (
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground mb-2">적용 옵션</p>
                    <div className="flex flex-wrap gap-1.5">
                      {season.optionSetIds.map((optionId) => {
                        const option = options.find((o) => o.id === optionId);
                        if (!option) return null;

                        const adjustment = season.optionPriceAdjustments?.[optionId];
                        const adjustmentText =
                          adjustment && adjustment !== 0
                            ? ` (${adjustment > 0 ? "+" : ""}${adjustment.toLocaleString()}원)`
                            : "";

                        return (
                          <Badge key={optionId} variant="outline" className="text-xs">
                            {option.name}
                            {adjustmentText}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 겹치는 기간 경고 */}
                {overlapping.length > 0 && season.enabled && (
                  <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded p-3">
                    <AlertCircle className="size-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-amber-800 dark:text-amber-200 mb-1">
                        기간이 겹치는 시즌이 있습니다
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {overlapping.map((s) => (
                          <Badge
                            key={s.id}
                            variant="outline"
                            className="text-xs bg-background"
                          >
                            {s.name} (우선순위 {s.priority})
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                        우선순위가 낮은 시즌이 적용됩니다.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 시즌 추가/수정 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSeasonId ? "시즌 수정" : "시즌 추가"}
            </DialogTitle>
            <DialogDescription>
              특정 기간에 적용할 가격과 옵션을 설정합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 시즌 이름 */}
            <div className="space-y-2">
              <Label>
                시즌 이름 <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="예: 여름 성수기, 크리스마스 특가"
              />
            </div>

            {/* 기간 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  시작일 <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>
                  종료일 <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                />
              </div>
            </div>

            {/* 가격 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  기본가 <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) =>
                    setFormData({ ...formData, basePrice: e.target.value })
                  }
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  현재 상품 기본가: {product.price.toLocaleString()}원
                </p>
              </div>
              <div className="space-y-2">
                <Label>할인가</Label>
                <Input
                  type="number"
                  value={formData.discountPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, discountPrice: e.target.value })
                  }
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  현재 상품 할인가:{" "}
                  {(product.discountPrice || product.price).toLocaleString()}원
                </p>
              </div>
            </div>

            {/* 우선순위 */}
            <div className="space-y-2">
              <Label>
                우선순위 <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                min="1"
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                숫자가 낮을수록 우선순위가 높습니다. (1이 가장 높음)
              </p>
            </div>

            {/* 적용 옵션 선택 */}
            {options && options.length > 0 && (
              <div className="space-y-2">
                <Label>적용 옵션 선택</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  이 시즌에 판매할 옵션을 선택하세요. 선택하지 않으면 모든 옵션이
                  적용됩니다.
                </p>
                <div className="border rounded-lg p-4 space-y-3 max-h-60 overflow-y-auto">
                  {options.map((option) => {
                    const isSelected = formData.optionSetIds.includes(option.id);

                    return (
                      <div
                        key={option.id}
                        className={`border rounded-lg p-3 transition-colors ${
                          isSelected
                            ? "bg-primary/5 border-primary"
                            : "bg-background hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleOption(option.id)}
                              className="size-4 rounded"
                            />
                            <div>
                              <p className="font-medium text-sm">{option.name}</p>
                              <p className="text-xs text-muted-foreground">
                                기본 가격: +{(option.priceAdjustment || 0).toLocaleString()}원
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* 옵션별 가격 조정 */}
                        {isSelected && (
                          <div className="mt-3 pt-3 border-t">
                            <Label className="text-xs mb-2 block">
                              이 시즌 추가 가격 조정 (선택사항)
                            </Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                placeholder="0"
                                value={
                                  formData.optionPriceAdjustments[option.id] || ""
                                }
                                onChange={(e) =>
                                  handleOptionPriceChange(option.id, e.target.value)
                                }
                                className="text-sm"
                              />
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                원
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formData.optionPriceAdjustments[option.id] &&
                              parseFloat(formData.optionPriceAdjustments[option.id]) !==
                                0
                                ? `최종 옵션 가격: +${(
                                    (option.priceAdjustment || 0) +
                                    parseFloat(
                                      formData.optionPriceAdjustments[option.id]
                                    )
                                  ).toLocaleString()}원`
                                : `기본 옵션 가격: +${(option.priceAdjustment || 0).toLocaleString()}원`}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 활성화 */}
            <div className="flex items-center justify-between border rounded-lg p-4">
              <div>
                <Label>시즌 활성화</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  활성화하면 설정된 기간에 자동으로 적용됩니다.
                </p>
              </div>
              <Switch
                checked={formData.enabled}
                onCheckedChange={(enabled) =>
                  setFormData({ ...formData, enabled })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                resetForm();
              }}
            >
              취소
            </Button>
            <Button onClick={handleSaveSeason}>
              {editingSeasonId ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}