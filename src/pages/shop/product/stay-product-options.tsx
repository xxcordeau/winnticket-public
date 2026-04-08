import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarIcon, AlertCircle, Minus, Plus } from "lucide-react";
import type { Product, ProductOption, ProductOptionValue, DatePrice } from "@/data/dto/product.dto";

interface ShopStayProductOptionsProps {
  product: Product;
  onAddToCart: (options: {
    optionValues: Record<string, string>;
    dateRange: { from: Date; to: Date };
    totalPrice: number;
    priceBreakdown: { date: string; price: number }[];
  }) => void;
  alwaysShowDatePicker?: boolean;
}

export function ShopStayProductOptions({
  product,
  onAddToCart,
  alwaysShowDatePicker = false,
}: ShopStayProductOptionsProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [overrideQuantities, setOverrideQuantities] = useState<Record<string, number>>({});
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [priceBreakdown, setPriceBreakdown] = useState<{
    date: string;
    price: number;
    discountPrice?: number;
    details: Array<{ optionValueId: string; optionValueName: string; price: number; discountPrice?: number }>;
  }[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);

  // API startDate~endDate 
  const datePrices = (product.datePrices || [])
    .flatMap(dp => {
      if (dp.startDate && dp.endDate) {
        const dates: Array<typeof dp & { date: string }> = [];
        const start = new Date(dp.startDate);
        const end = new Date(dp.endDate);
        
        const current = new Date(start);
        while (current <= end) {
          const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
          dates.push({ ...dp, date: dateStr });
          current.setDate(current.getDate() + 1);
        }
        return dates;
      }
      
      const date = dp.priceDate || dp.date || dp.Date || dp.PriceDate;
      if (date) {
        return [{ ...dp, date: date }];
      }
      
      return [];
    })
    .filter(dp => Boolean(dp.date));
  
  const options = product.options || [];

  const areRequiredOptionsSelected = () => {
    return options.every((option) => {
      if (option.required) {
        return selectedOptions[option.id] !== undefined && selectedOptions[option.id] !== "";
      }
      return true;
    });
  };

  const getSelectedOptionValueIds = () => {
    return Object.values(selectedOptions).filter(Boolean);
  };

  const getSelectedOptionValueIdsExcludingOverride = () => {
    const result = Object.entries(selectedOptions)
      .filter(([optionId, valueId]) => {
        const option = options.find(opt => opt.id === optionId);
        if (!option || !valueId) return false;
        return option.priceType !== "OVERRIDE";
      })
      .map(([, valueId]) => valueId);
    
    return result;
  };

  const availableDatePrices = datePrices.filter((dp) => {
    const selectedValueIds = getSelectedOptionValueIdsExcludingOverride();
    
    if (selectedValueIds.length === 0) return true;
    
    if (dp.optionValueId) {
      const isOverrideOption = options.some((option) => {
        if (option.priceType !== "OVERRIDE") return false;
        return option.values.some((v) => v.id === dp.optionValueId);
      });
      
      if (isOverrideOption) return false;
      
      return selectedValueIds.includes(dp.optionValueId);
    }
    return true;
  });

  useEffect(() => {
    setDateRange({});
    setPriceBreakdown([]);
    setTotalPrice(0);
  }, [selectedOptions]);

  useEffect(() => {
    if (areRequiredOptionsSelected() && dateRange.from && dateRange.to && priceBreakdown.length > 0) {
      onAddToCart({
        optionValues: selectedOptions,
        dateRange: {
          from: dateRange.from,
          to: dateRange.to,
        },
        totalPrice,
        priceBreakdown: priceBreakdown.map((item) => ({
          date: item.date,
          price: item.discountPrice || item.price,
        })),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOptions, dateRange, priceBreakdown, totalPrice]);

  useEffect(() => {
    if (!dateRange.from || !dateRange.to || !areRequiredOptionsSelected()) {
      setPriceBreakdown([]);
      setTotalPrice(0);
      return;
    }

    calculatePriceBreakdown();
  }, [dateRange, selectedOptions, overrideQuantities]);

  const toLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getPriceForDate = (date: Date) => {
    const dateString = toLocalDateString(date);
    const selectedValueIds = getSelectedOptionValueIdsExcludingOverride();
    
    if (availableDatePrices.length > 0) {
      const matchingDatePrice = availableDatePrices.find((dp) => {
        const dpDate = dp.date || dp.priceDate;
        return dpDate === dateString;
      });
      
      if (!matchingDatePrice) {
        return null;
      }
      
      if (selectedValueIds.length === 0) {
        const basePrice = matchingDatePrice.price || product.price || 0;
        const baseDiscountPrice = (matchingDatePrice.discountPrice && matchingDatePrice.discountPrice > 0) 
          ? matchingDatePrice.discountPrice 
          : basePrice;
        
        return {
          date: dateString,
          price: basePrice,
          discountPrice: baseDiscountPrice !== basePrice ? baseDiscountPrice : undefined,
          details: [{
            optionValueId: '',
            optionValueName: '기본',
            price: basePrice,
            discountPrice: baseDiscountPrice !== basePrice ? baseDiscountPrice : undefined,
          }],
        };
      }
      
      let totalPrice = 0;
      let totalDiscountPrice = 0;
      const details: Array<{ optionValueId: string; optionValueName: string; price: number; discountPrice?: number }> = [];
      
      for (const valueId of selectedValueIds) {
        const datePriceForValue = availableDatePrices.find((dp) => {
          const dpDate = dp.date || dp.priceDate;
          return dpDate === dateString && dp.optionValueId === valueId;
        });
        
        let basePrice = datePriceForValue?.price || product.price || 0;
        let baseDiscountPrice = (datePriceForValue?.discountPrice && datePriceForValue.discountPrice > 0)
          ? datePriceForValue.discountPrice
          : basePrice;
        
        let optionValueName = "";
        for (const option of options) {
          const optionValue = option.values.find((v) => v.id === valueId);
          if (optionValue) {
            optionValueName = optionValue.value;
            
            if (option.priceType === "ADDITIONAL" && optionValue.additionalPrice !== 0) {
              basePrice += optionValue.additionalPrice;
              baseDiscountPrice += optionValue.additionalPrice;
            }
            break;
          }
        }
        
        totalPrice += basePrice;
        totalDiscountPrice += baseDiscountPrice;
        
        details.push({
          optionValueId: valueId,
          optionValueName: optionValueName || "기본",
          price: basePrice,
          discountPrice: baseDiscountPrice !== basePrice ? baseDiscountPrice : undefined,
        });
      }
      
      return {
        date: dateString,
        price: totalPrice,
        discountPrice: totalDiscountPrice !== totalPrice ? totalDiscountPrice : undefined,
        details,
      };
    }
    
    if (product.stock && product.stock > 0) {
      const basePrice = product.price || 0;
      const baseDiscountPrice = product.discountPrice || basePrice;
      
      if (selectedValueIds.length === 0) {
        return {
          date: dateString,
          price: basePrice,
          discountPrice: baseDiscountPrice !== basePrice ? baseDiscountPrice : undefined,
          details: [{
            optionValueId: '',
            optionValueName: '기본',
            price: basePrice,
            discountPrice: baseDiscountPrice !== basePrice ? baseDiscountPrice : undefined,
          }],
        };
      }
      
      let totalPrice = 0;
      let totalDiscountPrice = 0;
      const details: Array<{ optionValueId: string; optionValueName: string; price: number; discountPrice?: number }> = [];
      
      for (const valueId of selectedValueIds) {
        let optionPrice = basePrice;
        let optionDiscountPrice = baseDiscountPrice;
        let optionValueName = "";
        
        for (const option of options) {
          const optionValue = option.values.find((v) => v.id === valueId);
          if (optionValue) {
            optionValueName = optionValue.value;
            
            if (option.priceType === "ADDITIONAL") {
              optionPrice += optionValue.additionalPrice;
              optionDiscountPrice += optionValue.additionalPrice;
            }
            break;
          }
        }
        
        totalPrice += optionPrice;
        totalDiscountPrice += optionDiscountPrice;
        
        details.push({
          optionValueId: valueId,
          optionValueName: optionValueName || "기본",
          price: optionPrice,
          discountPrice: optionDiscountPrice !== optionPrice ? optionDiscountPrice : undefined,
        });
      }
      
      return {
        date: dateString,
        price: totalPrice,
        discountPrice: totalDiscountPrice !== totalPrice ? totalDiscountPrice : undefined,
        details,
      };
    }
    
    return null;
  };

  const calculatePriceBreakdown = () => {
    if (!dateRange.from || !dateRange.to) return;

    const breakdown: {
      date: string;
      price: number;
      discountPrice?: number;
      details: Array<{ optionValueId: string; optionValueName: string; price: number; discountPrice?: number }>;
    }[] = [];
    
    const current = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate());
    const endDate = new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate());

    while (current < endDate) {
      const priceInfo = getPriceForDate(current);

      if (priceInfo) {
        breakdown.push({
          date: toLocalDateString(current),
          price: priceInfo.price,
          discountPrice: priceInfo.discountPrice,
          details: priceInfo.details,
        });
      }

      current.setDate(current.getDate() + 1);
    }

    setPriceBreakdown(breakdown);
    
    const overrideAdditionalPrice = options.reduce((sum, option) => {
      if (option.priceType !== "OVERRIDE") return sum;
      
      const selectedValueId = selectedOptions[option.id];
      if (!selectedValueId) return sum;
      
      const selectedValue = option.values.find((v) => v.id === selectedValueId);
      const quantity = overrideQuantities[option.id] || 1;
      return sum + (selectedValue?.additionalPrice || 0) * quantity;
    }, 0);
    
    const baseTotal = breakdown.reduce(
      (sum, item) => sum + (item.discountPrice || item.price),
      0
    );
    const total = baseTotal + overrideAdditionalPrice;
    setTotalPrice(total);
  };

  const isDateAvailable = (date: Date): boolean => {
    if (!areRequiredOptionsSelected()) return false;
    
    const priceInfo = getPriceForDate(date);
    return priceInfo !== null;
  };

  const baseColors = [
    'emerald',
    'amber',
    'pink',
    'blue',
    'purple',
    'orange',
    'teal',
    'indigo',
  ];

  // ( )
  const getSortedUniquePrices = (): number[] => {
    if (!areRequiredOptionsSelected()) return [];

    const priceSet = new Set<number>();
    
    if (availableDatePrices.length > 0) {
      availableDatePrices.forEach((dp) => {
        const price = (dp.discountPrice && dp.discountPrice > 0) ? dp.discountPrice : dp.price;
        priceSet.add(price);
      });
    } else if (product.stock && product.stock > 0) {
      const basePrice = product.discountPrice || product.price || 0;
      priceSet.add(basePrice);
    }

    return Array.from(priceSet).sort((a, b) => a - b);
  };

  const getDayModifiersByPrice = () => {
    if (!areRequiredOptionsSelected()) return {};
    
    const modifiers: Record<string, Date[]> = {};
    const priceMap = new Map<number, Date[]>();
    
    if (availableDatePrices.length > 0) {
      availableDatePrices.forEach((dp) => {
        const dateStr = dp.date || dp.priceDate;
        if (!dateStr) return;
        
        const price = (dp.discountPrice && dp.discountPrice > 0) ? dp.discountPrice : dp.price;
        
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        
        if (!priceMap.has(price)) {
          priceMap.set(price, []);
        }
        priceMap.get(price)!.push(date);
      });
    } else if (product.stock && product.stock > 0) {
      const basePrice = product.discountPrice || product.price || 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const dates: Date[] = [];
      for (let i = 0; i < 90; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        dates.push(date);
      }
      
      if (!priceMap.has(basePrice)) {
        priceMap.set(basePrice, []);
      }
      priceMap.set(basePrice, dates);
    }

    const sortedPrices = Array.from(priceMap.keys()).sort((a, b) => a - b);
    
    sortedPrices.forEach((price) => {
      modifiers[`price_${price}`] = priceMap.get(price)!;
    });
    
    const selectedDates: Date[] = [];
    if (dateRange.from && dateRange.to) {
      const current = new Date(dateRange.from);
      const end = new Date(dateRange.to);
      while (current <= end) {
        selectedDates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
    } else if (dateRange.from) {
      selectedDates.push(new Date(dateRange.from));
    }
    
    if (selectedDates.length > 0) {
      modifiers['selected_date'] = selectedDates;
    }

    return modifiers;
  };

  const getPriceColorClasses = () => {
    if (!areRequiredOptionsSelected()) return {};

    // 
    const sortedPrices = getSortedUniquePrices();
    const classNames: Record<string, string> = {};
    
    const colorClasses = [
      'bg-emerald-200 hover:bg-emerald-300 dark:bg-emerald-800/50 dark:hover:bg-emerald-800/70',
      'bg-amber-200 hover:bg-amber-300 dark:bg-amber-800/50 dark:hover:bg-amber-800/70',
      'bg-pink-200 hover:bg-pink-300 dark:bg-pink-800/50 dark:hover:bg-pink-800/70',
      'bg-blue-200 hover:bg-blue-300 dark:bg-blue-800/50 dark:hover:bg-blue-800/70',
      'bg-purple-200 hover:bg-purple-300 dark:bg-purple-800/50 dark:hover:bg-purple-800/70',
      'bg-orange-200 hover:bg-orange-300 dark:bg-orange-800/50 dark:hover:bg-orange-800/70',
      'bg-teal-200 hover:bg-teal-300 dark:bg-teal-800/50 dark:hover:bg-teal-800/70',
      'bg-indigo-200 hover:bg-indigo-300 dark:bg-indigo-800/50 dark:hover:bg-indigo-800/70',
    ];
    
    sortedPrices.forEach((price, index) => {
      classNames[`price_${price}`] = colorClasses[index % colorClasses.length];
    });
    
    classNames['no_price'] = 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/30 dark:hover:bg-slate-700/50';
    classNames['selected_date'] = '!bg-slate-900 dark:!bg-slate-800 !text-white hover:!bg-slate-800 dark:hover:!bg-slate-700 !font-bold';

    return classNames;
  };

  const handleAddToCart = () => {
    if (!areRequiredOptionsSelected()) {
      alert("옵션을 선택해주세요.");
      return;
    }

    if (!dateRange.from || !dateRange.to) {
      alert("날짜를 선택해주세요.");
      return;
    }

    if (priceBreakdown.length === 0) {
      alert("선택한 날짜에 가격이 설정되지 않았습니다.");
      return;
    }

    onAddToCart({
      optionValues: selectedOptions,
      dateRange: {
        from: dateRange.from,
        to: dateRange.to,
      },
      totalPrice,
      priceBreakdown: priceBreakdown.map((item) => ({
        date: item.date,
        price: item.discountPrice || item.price,
      })),
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const getOptionsWithAdditionalPrice = () => {
    const baseOptionIds = new Set<string>();
    
    availableDatePrices.forEach((dp) => {
      if (dp.optionValueId) {
        options.forEach((option) => {
          const value = option.values.find((v) => v.id === dp.optionValueId);
          if (value) {
            baseOptionIds.add(option.id);
          }
        });
      }
    });
    
    return options
      .map((option) => {
        const selectedValueId = selectedOptions[option.id];
        if (!selectedValueId) return null;
        
        if (baseOptionIds.has(option.id)) return null;
        if (option.priceType === "OVERRIDE") return null;
        
        const selectedValue = option.values.find((v) => v.id === selectedValueId);
        if (!selectedValue || selectedValue.additionalPrice === 0) return null;
        
        return {
          name: option.name,
          valueName: selectedValue.value,
          additionalPrice: selectedValue.additionalPrice,
        };
      })
      .filter(Boolean) as { name: string; valueName: string; additionalPrice: number }[];
  };
  
  const getOverrideOptions = () => {
    return options
      .map((option) => {
        if (option.priceType !== "OVERRIDE") return null;
        
        const selectedValueId = selectedOptions[option.id];
        if (!selectedValueId) return null;
        
        const selectedValue = option.values.find((v) => v.id === selectedValueId);
        if (!selectedValue || selectedValue.additionalPrice === 0) return null;
        
        const quantity = overrideQuantities[option.id] || 1;
        
        return {
          name: option.name,
          valueName: selectedValue.value,
          additionalPrice: selectedValue.additionalPrice,
          quantity,
        };
      })
      .filter(Boolean) as { name: string; valueName: string; additionalPrice: number; quantity: number }[];
  };

  return (
    <div className="space-y-6">
      {/* 옵션 선택 */}
      <div className="space-y-4">
        <div className="space-y-3">
          {options.map((option) => (
            <div key={option.id} className="space-y-2">
              <Label className="text-sm">
                {option.name}
                {option.required && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </Label>
              
              {option.priceType === "OVERRIDE" ? (
                <div className="space-y-2">
                  <Select
                    value={selectedOptions[option.id] || ""}
                    onValueChange={(value) => {
                      if (value === "__NONE__") {
                        const newOptions = { ...selectedOptions };
                        delete newOptions[option.id];
                        setSelectedOptions(newOptions);
                        const newQuantities = { ...overrideQuantities };
                        delete newQuantities[option.id];
                        setOverrideQuantities(newQuantities);
                      } else {
                        setSelectedOptions({
                          ...selectedOptions,
                          [option.id]: value,
                        });
                        if (!overrideQuantities[option.id]) {
                          setOverrideQuantities({
                            ...overrideQuantities,
                            [option.id]: 1,
                          });
                        }
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`${option.name}을(를) 선택하세요`} />
                    </SelectTrigger>
                    <SelectContent>
                      {!option.required && (
                        <SelectItem value="__NONE__">
                          <span className="text-muted-foreground">선택안함</span>
                        </SelectItem>
                      )}
                      {option.values
                        .filter((v) => v.visible)
                        .map((value) => (
                          <SelectItem key={value.id} value={value.id}>
                            {value.value}
                            {value.additionalPrice > 0 && (
                              <span className="text-muted-foreground ml-2">
                                (+{value.additionalPrice.toLocaleString()}원)
                              </span>
                            )}
                            {value.additionalPrice < 0 && (
                              <span className="text-muted-foreground ml-2">
                                ({value.additionalPrice.toLocaleString()}원)
                              </span>
                            )}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedOptions[option.id] && (() => {
                    const selectedValue = option.values.find((v) => v.id === selectedOptions[option.id]);
                    const maxStock = selectedValue?.stock || 999;
                    
                    return (
                      <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                        <Label className="text-xs text-muted-foreground min-w-fit">수량</Label>
                        <div className="flex items-center gap-2 ml-auto">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              const currentQty = overrideQuantities[option.id] || 1;
                              if (currentQty > 1) {
                                setOverrideQuantities({
                                  ...overrideQuantities,
                                  [option.id]: currentQty - 1,
                                });
                              }
                            }}
                            disabled={(overrideQuantities[option.id] || 1) <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-12 text-center font-medium">
                            {overrideQuantities[option.id] || 1}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              const currentQty = overrideQuantities[option.id] || 1;
                              if (currentQty < maxStock) {
                                setOverrideQuantities({
                                  ...overrideQuantities,
                                  [option.id]: currentQty + 1,
                                });
                              }
                            }}
                            disabled={(overrideQuantities[option.id] || 1) >= maxStock}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        {selectedValue?.stock && (
                          <span className="text-xs text-muted-foreground">
                            (최대 {maxStock}개)
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <Select
                  value={selectedOptions[option.id] || ""}
                  onValueChange={(value) => {
                    if (value === "__NONE__") {
                      const newOptions = { ...selectedOptions };
                      delete newOptions[option.id];
                      setSelectedOptions(newOptions);
                    } else {
                      setSelectedOptions({
                        ...selectedOptions,
                        [option.id]: value,
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`${option.name}을(를) 선택하세요`} />
                  </SelectTrigger>
                  <SelectContent>
                    {!option.required && (
                      <SelectItem value="__NONE__">
                        <span className="text-muted-foreground">선택안함</span>
                      </SelectItem>
                    )}
                    {option.values
                      .filter((v) => v.visible)
                      .map((value) => (
                        <SelectItem key={value.id} value={value.id}>
                          {value.value}
                          {value.additionalPrice > 0 && (
                            <span className="text-muted-foreground ml-2">
                              (+{value.additionalPrice.toLocaleString()}원)
                            </span>
                          )}
                          {value.additionalPrice < 0 && (
                            <span className="text-muted-foreground ml-2">
                              ({value.additionalPrice.toLocaleString()}원)
                            </span>
                          )}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 날짜 선택 */}
      {(areRequiredOptionsSelected() || alwaysShowDatePicker) && (
        <div className="space-y-2">
          <Label>체크인 / 체크아웃 날짜 *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal hover:scale-100 h-auto min-h-14 py-3 px-4 text-base"
              >
                <CalendarIcon className="mr-2 h-5 w-5" />
                {dateRange.from && dateRange.to ? (
                  <>
                    {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                  </>
                ) : (
                  <span>날짜를 선택하세요</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 max-w-[95vw] md:max-w-none" align="start">
              <div className="p-2 md:p-4 border-b bg-muted/50">
                <p className="text-xs md:text-sm font-medium">
                  {options
                    .map((opt) => {
                      const valueId = selectedOptions[opt.id];
                      const value = opt.values.find((v) => v.id === valueId);
                      return value ? `${opt.name}: ${value.value}` : null;
                    })
                    .filter(Boolean)
                    .join(", ")}
                </p>
                <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                  가격이 설정된 날짜만 선택 가능합니다
                </p>
              </div>
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => setDateRange(range || {})}
                disabled={(date) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  if (date < today) return true;

                  return !isDateAvailable(date);
                }}
                modifiers={getDayModifiersByPrice()}
                modifiersClassNames={getPriceColorClasses()}
                className="[&_.rdp-day_button:disabled]:opacity-20 [&_.rdp-day_button:disabled]:bg-transparent [&_.rdp-day_button:disabled]:cursor-not-allowed
                  [&_.rdp-months]:flex [&_.rdp-months]:flex-row [&_.rdp-months]:gap-2 md:[&_.rdp-months]:gap-4
                  [&_.rdp-month]:scale-90 md:[&_.rdp-month]:scale-100
                  [&_.rdp-day_button]:h-8 [&_.rdp-day_button]:w-8 md:[&_.rdp-day_button]:h-10 md:[&_.rdp-day_button]:w-10
                  [&_.rdp-day_button]:text-xs md:[&_.rdp-day_button]:text-sm
                  [&_.rdp-caption]:text-xs md:[&_.rdp-caption]:text-sm
                  [&_.rdp-weekday]:text-[10px] md:[&_.rdp-weekday]:text-xs
                  [&_.rdp-nav_button]:h-6 [&_.rdp-nav_button]:w-6 md:[&_.rdp-nav_button]:h-8 md:[&_.rdp-nav_button]:w-8
                  [&_.rdp-day_range_middle]:!bg-emerald-100/40 [&_.rdp-day_range_middle]:!brightness-100 [&_.rdp-day_range_middle]:rounded-md dark:[&_.rdp-day_range_middle]:!bg-emerald-900/20"
                showOutsideDays={false}
                weekStartsOn={0}
              />
              
              {getSortedUniquePrices().length > 0 && (() => {
                // 
                const priceLegend = getSortedUniquePrices();
                const colors = [
                  'bg-emerald-200',
                  'bg-amber-200',
                  'bg-pink-200',
                  'bg-blue-200',
                  'bg-purple-200',
                  'bg-orange-200',
                  'bg-teal-200',
                  'bg-indigo-200',
                ];
                
                return (
                  <div className="p-3 border-t bg-muted/20">
                    <p className="text-xs font-medium mb-2 text-muted-foreground">가격 범례</p>
                    <div className="grid grid-cols-2 gap-2">
                      {priceLegend.map((price, index) => (
                        <div key={price} className="flex items-center gap-2">
                          <div 
                            className={`w-4 h-4 rounded border ${colors[index % colors.length]}`}
                          />
                          <span className="text-xs">
                            {price.toLocaleString()}원
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* 가격 내역 */}
      {priceBreakdown.length > 0 && (() => {
        const baseTotal = priceBreakdown.reduce(
          (sum, item) => sum + (item.discountPrice || item.price),
          0
        );
        
        const groupedPrices: Array<{
          startDate: string;
          endDate: string;
          price: number;
          discountPrice?: number;
          details: Array<{ optionValueId: string; optionValueName: string; price: number; discountPrice?: number }>;
        }> = [];
        
        priceBreakdown.forEach((item, index) => {
          const currentPrice = item.discountPrice || item.price;
          const lastGroup = groupedPrices[groupedPrices.length - 1];
          
          if (lastGroup && (lastGroup.discountPrice || lastGroup.price) === currentPrice) {
            lastGroup.endDate = item.date;
          } else {
            groupedPrices.push({
              startDate: item.date,
              endDate: item.date,
              price: item.price,
              discountPrice: item.discountPrice,
              details: item.details,
            });
          }
        });
        
        return (
          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <h4 className="font-medium">가격 내역</h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between pb-2">
                <span className="text-muted-foreground">기본 숙박요금 ({priceBreakdown.length}박)</span>
              </div>
              {groupedPrices.map((group, index) => {
                const isSingleDay = group.startDate === group.endDate;
                const displayPrice = group.discountPrice || group.price;
                
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between pl-3">
                      <span className="text-muted-foreground text-xs font-medium">
                        {isSingleDay ? (
                          formatDate(group.startDate)
                        ) : (
                          `${formatDate(group.startDate)} ~ ${formatDate(group.endDate)}`
                        )}
                      </span>
                      <span className="text-xs">
                        {group.discountPrice && group.discountPrice !== group.price ? (
                          <>
                            <span className="line-through text-muted-foreground mr-2">
                              {group.price.toLocaleString()}원
                            </span>
                            <span className="font-medium text-primary">
                              {group.discountPrice.toLocaleString()}원
                            </span>
                          </>
                        ) : (
                          <span>{group.price.toLocaleString()}원</span>
                        )}
                      </span>
                    </div>
                    {group.details.length >= 1 && (
                      <div className="pl-6 space-y-0.5">
                        {group.details.map((detail, detailIndex) => (
                          <div key={detailIndex} className="flex justify-between text-xs text-muted-foreground">
                            <span className="italic">└ {detail.optionValueName}</span>
                            <span>
                              {detail.discountPrice && detail.discountPrice !== detail.price ? (
                                <>
                                  <span className="line-through mr-1">
                                    {detail.price.toLocaleString()}원
                                  </span>
                                  <span className="text-primary">
                                    {detail.discountPrice.toLocaleString()}원
                                  </span>
                                </>
                              ) : (
                                <span>{detail.price.toLocaleString()}원</span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="flex justify-between pl-3 pt-1 border-t">
                <span className="text-xs">소계</span>
                <span className="text-xs font-medium">{baseTotal.toLocaleString()}원</span>
              </div>
            </div>

            {getOverrideOptions().length > 0 && (() => {
              const overrideOptions = getOverrideOptions();
              const overrideTotal = overrideOptions.reduce((sum, opt) => sum + opt.additionalPrice * opt.quantity, 0);
              
              return (
                <>
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between pb-2">
                      <span className="text-muted-foreground">추가 금액</span>
                    </div>
                    {overrideOptions.map((opt, index) => (
                      <div key={index} className="flex justify-between pl-3">
                        <span className="text-xs text-muted-foreground">
                          {opt.name}: {opt.valueName}
                        </span>
                        <span className="text-xs">
                          {opt.additionalPrice > 0 ? "+" : ""}
                          {opt.additionalPrice.toLocaleString()}원 × {opt.quantity}개
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between pl-3 pt-1 border-t">
                      <span className="text-xs">소계</span>
                      <span className="text-xs font-medium">{overrideTotal.toLocaleString()}원</span>
                    </div>
                  </div>
                </>
              );
            })()}

            <Separator />
            <div className="flex justify-between items-center font-medium">
              <span>총 합계</span>
              <span className="text-lg text-primary">{totalPrice.toLocaleString()}원</span>
            </div>
            {dateRange.to && (
              <p className="text-xs text-muted-foreground">
                * 체크아웃 날짜({dateRange.to.toLocaleDateString()})는 요금에 포함되지 않습니다
              </p>
            )}
          </div>
        );
      })()}

      {!areRequiredOptionsSelected() && (
        <div className="flex items-start gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <AlertCircle className="size-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900">
            <p className="font-medium">옵션을 먼저 선택해주세요</p>
            <p className="text-blue-700 mt-1">
              옵션을 선택하면 해당 옵션에 설정된 날짜와 가격을 확인할 수 있습니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}