import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar as CalendarIcon, Plus, Trash2, ChevronDown, ChevronUp, Edit, Check, X } from "lucide-react";
import { toast } from "sonner";
import type { Product, DatePrice, ProductOption, ProductOptionValue } from "@/data/dto/product.dto";
import { updateProduct } from "@/data/products";
import { createProductPeriod, deleteProductPeriod, type ProductPeriodRequest } from "@/lib/api/product";

interface ProductDetailDatePricesProps {
  product: Product;
  options: ProductOption[];
  onUpdate: (product: Product) => void;
}

interface DatePriceForm {
  dateRange: { from?: Date; to?: Date };
  price: string;
  discountPrice: string;
}

export function ProductDetailDatePrices({
  product,
  options,
  onUpdate,
}: ProductDetailDatePricesProps) {
  const [datePrices, setDatePrices] = useState<DatePrice[]>(product.datePrices || []);
  
  // /
  const [selectedOptionId, setSelectedOptionId] = useState<string>("");
  const [selectedOptionValueId, setSelectedOptionValueId] = useState<string>("");
  
  // 
  const [dateForms, setDateForms] = useState<DatePriceForm[]>([
    { dateRange: {}, price: "", discountPrice: "" }
  ]);

  // 
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // 
  const [editingDatePriceId, setEditingDatePriceId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<{
    dateRange: { from?: Date; to?: Date };
    price: string;
    discountPrice: string;
  } | null>(null);

  const selectedOption = options.find((opt) => opt.id === selectedOptionId);
  const availableValues: ProductOptionValue[] = selectedOption?.values || [];

  useEffect(() => {
    setDatePrices(product.datePrices || []);
  }, [product.datePrices]);

  useEffect(() => {
    setSelectedOptionValueId("");
  }, [selectedOptionId]);

  // ( )
  const getDisabledDatesForCurrentOption = (): Date[] => {
    if (!selectedOptionValueId) return [];
    
    const disabled: Date[] = [];
    datePrices
      .filter((dp) => dp.optionValueId === selectedOptionValueId)
      .forEach((dp) => {
        const start = new Date(dp.startDate);
        const end = new Date(dp.endDate);
        const current = new Date(start);
        
        while (current <= end) {
          disabled.push(new Date(current));
          current.setDate(current.getDate() + 1);
        }
      });
    return disabled;
  };

  const handleAddDateForm = () => {
    setDateForms([...dateForms, { dateRange: {}, price: "", discountPrice: "" }]);
  };

  const handleRemoveDateForm = (index: number) => {
    if (dateForms.length === 1) {
      toast.error("최소 1개 이상의 날짜 범위가 필요합니다.");
      return;
    }
    setDateForms(dateForms.filter((_, i) => i !== index));
  };

  const handleSaveAll = async () => {
    if (!selectedOptionId) {
      toast.error("옵션을 선택해주세요.");
      return;
    }

    if (!selectedOptionValueId) {
      toast.error("옵션 값을 선택해주세요.");
      return;
    }

    const selectedOption = options.find((opt) => opt.id === selectedOptionId);
    const selectedValue = selectedOption?.values.find((val) => val.id === selectedOptionValueId);
    
    if (!selectedOption || !selectedValue) {
      toast.error("옵션을 찾을 수 없습니다.");
      return;
    }

    // 
    for (let i = 0; i < dateForms.length; i++) {
      const form = dateForms[i];
      
      if (!form.dateRange.from || !form.dateRange.to) {
        toast.error(`${i + 1}번째 날짜 범위를 선택해주세요.`);
        return;
      }

      if (!form.price) {
        toast.error(`${i + 1}번째 가격을 입력주세요.`);
        return;
      }

      const priceNum = parseFloat(form.price);
      const discountPriceNum = form.discountPrice ? parseFloat(form.discountPrice) : undefined;

      if (isNaN(priceNum) || priceNum < 0) {
        toast.error(`${i + 1}번째 가격이 올바르지 않습니다.`);
        return;
      }

      if (form.discountPrice && (isNaN(discountPriceNum!) || discountPriceNum! < 0)) {
        toast.error(`${i + 1}번째 할인가가 올바르지 않습니다.`);
        return;
      }

      if (form.discountPrice && discountPriceNum! >= priceNum) {
        toast.error(`${i + 1}번째 할인가는 정가보다 낮아야 합니다.`);
        return;
      }
    }

    // API ( )
    try {
      const newDatePrices: DatePrice[] = [];
      
      for (let i = 0; i < dateForms.length; i++) {
        const form = dateForms[i];
        const priceNum = parseFloat(form.price);
        const discountPriceNum = form.discountPrice ? parseFloat(form.discountPrice) : undefined;
        
        // API 
        const periodRequest: ProductPeriodRequest = {
          optionValueId: selectedOptionValueId,
          startDate: form.dateRange.from!.toISOString().split("T")[0],
          endDate: form.dateRange.to!.toISOString().split("T")[0],
          price: priceNum,
          discountPrice: discountPriceNum,
        };
        
        const response = await createProductPeriod(periodRequest);
        
        if (response.success) {
          // 
          newDatePrices.push({
            id: `dp-${Date.now()}-${i}`,
            productId: product.id,
            optionId: selectedOptionId,
            optionName: selectedOption.name,
            optionValueId: selectedOptionValueId,
            optionValueName: selectedValue.value,
            startDate: response.data!.startDate,
            endDate: response.data!.endDate,
            price: response.data!.price,
            discountPrice: response.data!.discountPrice,
            groupNo: response.data!.groupNo, // 
          });
        } else {
          toast.error(`${i + 1}번째 기간 등록에 실패했습니다: ${response.message}`);
          return;
        }
      }

      // 
      const updatedDatePrices = [...datePrices, ...newDatePrices];
      setDatePrices(updatedDatePrices);

      const updatedProduct = { ...product, datePrices: updatedDatePrices };
      updateProduct(updatedProduct);
      onUpdate(updatedProduct);

      // 
      setSelectedOptionId("");
      setSelectedOptionValueId("");
      setDateForms([{ dateRange: {}, price: "", discountPrice: "" }]);

      toast.success(`${newDatePrices.length}개의 기간이 추가되었습니다.`);
    } catch (error) {
      toast.error("기간 등록 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteDatePrice = async (id: string) => {
    const datePrice = datePrices.find((dp) => dp.id === id);
    if (!datePrice) {
      toast.error("삭제할 기간을 찾을 수 없습니다.");
      return;
    }

    // groupNo API ( )
    if (datePrice.groupNo !== undefined) {
      try {
        
        const response = await deleteProductPeriod(
          datePrice.optionValueId,
          datePrice.groupNo
        );
        
        
        if (!response.success) {
          toast.error(response.message || '기간 삭제에 실패했습니다.');
          return;
        }
      } catch (error) {
        toast.error('기간 삭제 중 오류가 발생했습니다.');
        return;
      }
    }

    // 
    const updatedDatePrices = datePrices.filter((dp) => dp.id !== id);
    setDatePrices(updatedDatePrices);

    const updatedProduct = { ...product, datePrices: updatedDatePrices };
    updateProduct(updatedProduct);
    onUpdate(updatedProduct);

    toast.success("날짜별 가격이 삭제되었습니.");
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${start.getFullYear()}.${String(start.getMonth() + 1).padStart(2, '0')}.${String(start.getDate()).padStart(2, '0')} - ${end.getFullYear()}.${String(end.getMonth() + 1).padStart(2, '0')}.${String(end.getDate()).padStart(2, '0')}`;
  };

  // 
  const groupedByOptionValue = datePrices.reduce((acc, dp) => {
    const key = `${dp.optionId}-${dp.optionValueId}`;
    if (!acc[key]) {
      acc[key] = {
        optionName: dp.optionName,
        optionValueName: dp.optionValueName,
        items: [],
      };
    }
    acc[key].items.push(dp);
    return acc;
  }, {} as Record<string, { optionName: string; optionValueName: string; items: DatePrice[] }>);

  const toggleGroup = (key: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedGroups(newExpanded);
  };

  // 
  const formatNumberWithCommas = (value: string): string => {
    // 
    const numbers = value.replace(/[^\d]/g, '');
    if (!numbers) return '';
    // 
    return Number(numbers).toLocaleString();
  };

  // 
  const removeCommas = (value: string): string => {
    return value.replace(/,/g, '');
  };

  // 
  const handleStartEditDatePrice = (dp: DatePrice) => {
    setEditingDatePriceId(dp.id);
    setEditingData({
      dateRange: {
        from: new Date(dp.startDate),
        to: new Date(dp.endDate),
      },
      price: dp.price.toString(),
      discountPrice: dp.discountPrice?.toString() || '',
    });
  };

  // 
  const handleSaveEditDatePrice = async () => {
    if (!editingDatePriceId || !editingData) return;

    const dp = datePrices.find((d) => d.id === editingDatePriceId);
    if (!dp) return;

    // 
    if (!editingData.dateRange.from || !editingData.dateRange.to) {
      toast.error("날짜 범위를 선택해주세요.");
      return;
    }

    if (!editingData.price) {
      toast.error("가격을 입력해주세요.");
      return;
    }

    const priceNum = parseFloat(removeCommas(editingData.price));
    const discountPriceNum = editingData.discountPrice ? parseFloat(removeCommas(editingData.discountPrice)) : undefined;

    if (isNaN(priceNum) || priceNum < 0) {
      toast.error("가격이 올바르지 않습니다.");
      return;
    }

    if (editingData.discountPrice && (isNaN(discountPriceNum!) || discountPriceNum! < 0)) {
      toast.error("할인가가 올바르지 않습니다.");
      return;
    }

    if (editingData.discountPrice && discountPriceNum! >= priceNum) {
      toast.error("할인가는 정가보다 낮아야 합니다.");
      return;
    }

    // API : 
    try {
      // 1. groupNo 
      if (dp.groupNo !== undefined) {
        
        const deleteResponse = await deleteProductPeriod(
          dp.optionValueId,
          dp.groupNo
        );
        
        
        if (!deleteResponse.success) {
          toast.error(deleteResponse.message || '기존 기간 삭제에 실패했습니다.');
          return;
        }
      }

      // 2. 
      const periodRequest: ProductPeriodRequest = {
        optionValueId: dp.optionValueId,
        startDate: editingData.dateRange.from!.toISOString().split('T')[0],
        endDate: editingData.dateRange.to!.toISOString().split('T')[0],
        price: priceNum,
        discountPrice: discountPriceNum,
      };
      
      const createResponse = await createProductPeriod(periodRequest);
      
      if (!createResponse.success) {
        toast.error(createResponse.message || '새 기간 등록에 실패했습니다.');
        return;
      }

      // 3. (API )
      const updatedDatePrices = datePrices.map((d) =>
        d.id === editingDatePriceId
          ? {
              ...d,
              startDate: createResponse.data!.startDate,
              endDate: createResponse.data!.endDate,
              price: createResponse.data!.price,
              discountPrice: createResponse.data!.discountPrice,
              groupNo: createResponse.data!.groupNo, // 
            }
          : d
      );

      setDatePrices(updatedDatePrices);
      const updatedProduct = { ...product, datePrices: updatedDatePrices };
      updateProduct(updatedProduct);
      onUpdate(updatedProduct);

      setEditingDatePriceId(null);
      setEditingData(null);
      toast.success("기간이 수정되었습니다.");
    } catch (error) {
      toast.error("기간 수정 중 오류가 발생했습니다.");
    }
  };

  // 
  const handleCancelEditDatePrice = () => {
    setEditingDatePriceId(null);
    setEditingData(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-medium">기간별 가격 설정</h3>
        <p className="text-sm text-muted-foreground mt-1">
          숙박형 상품의 옵션값별로 날짜 범위와 가격을 설정합니다.
        </p>
      </div>

      {/* 새 기간 추가 폼 */}
      <div className="border rounded-lg p-6 space-y-6 bg-muted/30">
        <h4 className="font-medium">새 기간 추가</h4>

        {/* 1단계: 옵션과 옵션값 선택 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b">
          <div className="space-y-2">
            <Label className="text-sm">1. 옵션 선택 *</Label>
            <Select value={selectedOptionId} onValueChange={setSelectedOptionId}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="옵션 선택 (예: 좌석 등급)" />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">2. 옵션 값 선택 *</Label>
            <Select 
              value={selectedOptionValueId} 
              onValueChange={setSelectedOptionValueId}
              disabled={!selectedOptionId}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder={selectedOptionId ? "옵션 값 선택 (예: VIP석)" : "먼저 옵션을 선택하세요"} />
              </SelectTrigger>
              <SelectContent>
                {availableValues.map((value) => (
                  <SelectItem key={value.id} value={value.id}>
                    {value.value}
                    {value.additionalPrice !== 0 && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({value.additionalPrice > 0 ? '+' : ''}{value.additionalPrice.toLocaleString()}원)
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 2단계: 날짜 범위들 추가 */}
        {selectedOptionId && selectedOptionValueId && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm">3. 날짜 범위 및 가격 설정</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddDateForm}
              >
                <Plus className="size-4 mr-2" />
                날짜 범위 추가
              </Button>
            </div>

            <div className="space-y-3">
              {dateForms.map((form, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-4 border rounded-lg bg-background">
                  <div className="md:col-span-5 space-y-2">
                    <Label className="text-xs text-muted-foreground">날짜 범위 *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal hover:scale-100"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.dateRange.from && form.dateRange.to ? (
                            <>
                              {form.dateRange.from.toLocaleDateString()} - {form.dateRange.to.toLocaleDateString()}
                            </>
                          ) : (
                            <span>날짜 선택</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="range"
                          selected={form.dateRange}
                          onSelect={(range) => {
                            const newForms = [...dateForms];
                            newForms[index].dateRange = range || {};
                            setDateForms(newForms);
                          }}
                          disabled={(date) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            if (date < today) return true;

                            const disabledDates = getDisabledDatesForCurrentOption();
                            return disabledDates.some(
                              (d) => d.toDateString() === date.toDateString()
                            );
                          }}
                          numberOfMonths={2}
                          showOutsideDays={false}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="md:col-span-3 space-y-2">
                    <Label className="text-xs text-muted-foreground">가격 *</Label>
                    <Input
                      type="text"
                      value={formatNumberWithCommas(form.price)}
                      onChange={(e) => {
                        const formatted = formatNumberWithCommas(e.target.value);
                        const newForms = [...dateForms];
                        newForms[index].price = removeCommas(formatted);
                        setDateForms(newForms);
                      }}
                      placeholder="0"
                      className="text-right"
                    />
                  </div>

                  <div className="md:col-span-3 space-y-2">
                    <Label className="text-xs text-muted-foreground">할인가</Label>
                    <Input
                      type="text"
                      value={formatNumberWithCommas(form.discountPrice)}
                      onChange={(e) => {
                        const formatted = formatNumberWithCommas(e.target.value);
                        const newForms = [...dateForms];
                        newForms[index].discountPrice = removeCommas(formatted);
                        setDateForms(newForms);
                      }}
                      placeholder="할인가 (선택)"
                      className="text-right"
                    />
                  </div>

                  <div className="md:col-span-1">
                    {dateForms.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveDateForm(index)}
                        className="w-full"
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={handleSaveAll}>
                <Plus className="size-4 mr-2" />
                모두 저장
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 등록된 기간 목록 (옵션값별 그룹핑) */}
      {Object.keys(groupedByOptionValue).length > 0 ? (
        <div className="space-y-3">
          <h4 className="font-medium">등록된 기간</h4>
          {Object.entries(groupedByOptionValue).map(([key, group]) => {
            const isExpanded = expandedGroups.has(key);
            return (
              <div key={key} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleGroup(key)}
                  className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="font-medium">{group.optionName}</div>
                    <div className="text-sm px-2 py-1 bg-primary/10 text-primary rounded">
                      {group.optionValueName || "옵션값"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {group.items.length}개 기간
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  )}
                </button>

                {isExpanded && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="py-3 px-4">기간</TableHead>
                        <TableHead className="text-right py-3 px-4">가격</TableHead>
                        <TableHead className="text-right py-3 px-4">할인가</TableHead>
                        <TableHead className="w-[120px] py-3 px-4"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.items.map((dp) => (
                        <TableRow key={dp.id}>
                          {editingDatePriceId === dp.id ? (
                            // 
                            <>
                              <TableCell className="py-3 px-4">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className="w-full justify-start text-left font-normal text-sm hover:scale-100"
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {editingData?.dateRange.from && editingData?.dateRange.to ? (
                                        <>
                                          {formatDateRange(
                                            editingData.dateRange.from.toISOString().split('T')[0],
                                            editingData.dateRange.to.toISOString().split('T')[0]
                                          )}
                                        </>
                                      ) : (
                                        <span>날짜 선택</span>
                                      )}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="range"
                                      selected={editingData?.dateRange}
                                      onSelect={(range) => {
                                        if (editingData) {
                                          setEditingData({
                                            ...editingData,
                                            dateRange: range || {},
                                          });
                                        }
                                      }}
                                      numberOfMonths={2}
                                      showOutsideDays={false}
                                    />
                                  </PopoverContent>
                                </Popover>
                              </TableCell>
                              <TableCell className="text-right py-3 px-4">
                                <Input
                                  type="text"
                                  value={formatNumberWithCommas(editingData?.price || '')}
                                  onChange={(e) => {
                                    const formatted = formatNumberWithCommas(e.target.value);
                                    if (editingData) {
                                      setEditingData({
                                        ...editingData,
                                        price: removeCommas(formatted),
                                      });
                                    }
                                  }}
                                  placeholder="0"
                                  className="text-right text-sm"
                                />
                              </TableCell>
                              <TableCell className="text-right py-3 px-4">
                                <Input
                                  type="text"
                                  value={formatNumberWithCommas(editingData?.discountPrice || '')}
                                  onChange={(e) => {
                                    const formatted = formatNumberWithCommas(e.target.value);
                                    if (editingData) {
                                      setEditingData({
                                        ...editingData,
                                        discountPrice: removeCommas(formatted),
                                      });
                                    }
                                  }}
                                  placeholder="할인가"
                                  className="text-right text-sm"
                                />
                              </TableCell>
                              <TableCell className="py-3 px-4">
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleSaveEditDatePrice}
                                  >
                                    <Check className="size-4 text-green-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCancelEditDatePrice}
                                  >
                                    <X className="size-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </>
                          ) : (
                            // 
                            <>
                              <TableCell className="py-3 px-4">{formatDateRange(dp.startDate, dp.endDate)}</TableCell>
                              <TableCell className="text-right py-3 px-4">
                                {dp.price.toLocaleString()}원
                              </TableCell>
                              <TableCell className="text-right py-3 px-4">
                                {dp.discountPrice
                                  ? `${dp.discountPrice.toLocaleString()}원`
                                  : "-"}
                              </TableCell>
                              <TableCell className="py-3 px-4">
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleStartEditDatePrice(dp)}
                                  >
                                    <Edit className="size-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteDatePrice(dp.id)}
                                  >
                                    <Trash2 className="size-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/30">
          <CalendarIcon className="size-12 mx-auto mb-3 opacity-50" />
          <p>등록된 기간별 가격이 없습니다.</p>
          <p className="text-sm mt-1">위의 폼에서 옵션을 선택하고 날짜 범위를 추가해주세요.</p>
        </div>
      )}
    </div>
  );
}