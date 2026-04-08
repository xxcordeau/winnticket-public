import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Upload,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import type { ProductOption } from "@/data/dto/product.dto";

type Mode = "add" | "edit";

interface OptionFormData {
  name: string;
  code: string;
  required: boolean;
  displayOrder: number;
  visible: boolean;
  priceType: "ADDITIONAL" | "OVERRIDE";
  values: any[];
}

interface NewValueData {
  value: string;
  code: string;
  additionalPrice: number;
  basePrice: number;
  stock: number | undefined;
  partnerSubCode: string;
}

interface EditingValueData {
  value: string;
  code: string;
  additionalPrice: number;
  basePrice: number;
  stock: number | undefined;
  partnerSubCode: string;
}

interface OptionFormDialogProps {
  mode: Mode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isOptTourActive?: boolean;

  optionFormData: OptionFormData;
  setOptionFormData: (data: OptionFormData) => void;

  newValue: NewValueData;
  setNewValue: (v: NewValueData) => void;

  editingValueIndex: number | null;
  editingValue: EditingValueData | null;
  setEditingValue: (
    updater:
      | EditingValueData
      | null
      | ((prev: EditingValueData | null) => EditingValueData | null),
  ) => void;

  selectedOption?: ProductOption | null;

  onAddOptionValue: () => void;
  onRemoveOptionValue: (index: number) => void;
  onStartEditValue: (index: number) => void;
  onSaveEditValue: () => Promise<void>;
  onCancelEditValue: () => void;
  onMoveValueUp: (index: number) => void;
  onMoveValueDown: (index: number) => void;

  onSubmit: () => Promise<void>;
  onCancel: () => void;
}

export function OptionFormDialog({
  mode,
  open,
  onOpenChange,
  isOptTourActive,
  optionFormData,
  setOptionFormData,
  newValue,
  setNewValue,
  editingValueIndex,
  editingValue,
  setEditingValue,
  selectedOption,
  onAddOptionValue,
  onRemoveOptionValue,
  onStartEditValue,
  onSaveEditValue,
  onCancelEditValue,
  onMoveValueUp,
  onMoveValueDown,
  onSubmit,
  onCancel,
}: OptionFormDialogProps) {
  const isAdd = mode === "add";
  const idPrefix = isAdd ? "" : "edit";
  const nameId = isAdd ? "optionName" : "editOptionName";
  const codeId = isAdd ? "optionCode" : "editOptionCode";
  const valueNameId = isAdd ? "optionValueName" : "editOptionValueName";
  const valueCodeId = isAdd ? "optionValueCode" : "editOptionValueCode";
  const valuePriceId = isAdd ? "optionValuePrice" : "editOptionValuePrice";
  const valueBasePriceId = isAdd
    ? "optionValueBasePrice"
    : "editOptionValueBasePrice";
  const valueStockId = isAdd ? "optionValueStock" : "editOptionValueStock";

  const title = isAdd ? "옵션 추가" : "옵션 수정";
  const description = isAdd
    ? "새로운 상품 옵션을 추가합니다."
    : "상품 옵션을 수정합니다.";
  const submitLabel = isAdd ? "추가" : "수정";
  const valuePlaceholder = isAdd ? "예: S, M, L" : "예: Small";
  const valueCodePlaceholder = isAdd ? "예: OPT_S" : "예: OPT_SMALL";
  void idPrefix; // not used, but kept for clarity

  const showOptionCode = isAdd ? true : !!selectedOption;

  return (
    <Dialog
      open={open}
      modal={isAdd ? !isOptTourActive : undefined}
      onOpenChange={onOpenChange}
    >
      <DialogContent
        className="sm:max-w-7xl sm:max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">{title}</DialogTitle>
          <DialogDescription className="text-sm">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
            {...(isAdd ? { "data-tour": "opt-dialog-name" } : {})}
          >
            <div className="space-y-2">
              <Label htmlFor={nameId} className="text-sm">
                옵션명 *
              </Label>
              <Input
                id={nameId}
                value={optionFormData.name}
                onChange={(e) =>
                  setOptionFormData({
                    ...optionFormData,
                    name: e.target.value,
                  })
                }
                placeholder="예: 사이즈, 색상"
                className="text-sm"
              />
            </div>
            {showOptionCode && (
              <div className="space-y-2">
                <Label htmlFor={codeId} className="text-sm">
                  옵션 코드 *
                </Label>
                <Select
                  value={optionFormData.code}
                  onValueChange={(value) =>
                    setOptionFormData({
                      ...optionFormData,
                      code: value,
                    })
                  }
                >
                  <SelectTrigger id={codeId} className="text-sm">
                    <SelectValue placeholder="옵션 코드 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MOBILE">모바일자동</SelectItem>
                    <SelectItem value="MOBILE_MANUAL">모바일수동</SelectItem>
                    <SelectItem value="OPTION">선택옵션</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="border border-border rounded-lg p-4 bg-card">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">필수 옵션</Label>
              <Switch
                checked={optionFormData.required}
                onCheckedChange={(checked) =>
                  setOptionFormData({
                    ...optionFormData,
                    required: checked,
                  })
                }
              />
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            {isAdd ? (
              <div className="flex items-center justify-between">
                <Label className="text-sm">옵션 값 *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    toast.info("엑셀 업로드 기능은 준비 중입니다.");
                  }}
                  className="text-sm hidden"
                >
                  <Upload className="size-4 mr-1.5" />
                  엑셀 업로드
                </Button>
              </div>
            ) : (
              <Label className="text-sm font-medium">옵션 값 추가</Label>
            )}

            <div
              className="space-y-3 border rounded-lg p-4 bg-muted/30"
              {...(isAdd ? { "data-tour": "opt-dialog-values" } : {})}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label
                    htmlFor={valueNameId}
                    className="text-xs text-muted-foreground"
                  >
                    옵션값 *
                  </Label>
                  <Input
                    id={valueNameId}
                    placeholder={valuePlaceholder}
                    value={newValue.value}
                    onChange={(e) =>
                      setNewValue({ ...newValue, value: e.target.value })
                    }
                    className="text-sm bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <Label
                    htmlFor={valueCodeId}
                    className="text-xs text-muted-foreground"
                  >
                    옵션코드
                  </Label>
                  <Input
                    id={valueCodeId}
                    placeholder={valueCodePlaceholder}
                    value={newValue.code}
                    onChange={(e) =>
                      setNewValue({ ...newValue, code: e.target.value })
                    }
                    onBlur={(e) =>
                      setNewValue({
                        ...newValue,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    className="text-sm bg-background uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <Label
                    htmlFor={valuePriceId}
                    className="text-xs text-muted-foreground"
                  >
                    {isAdd ? "금액 (원)" : "금액"}
                  </Label>
                  <Input
                    id={valuePriceId}
                    type="text"
                    placeholder="0"
                    value={
                      newValue.additionalPrice > 0
                        ? newValue.additionalPrice.toLocaleString()
                        : ""
                    }
                    onChange={(e) => {
                      const value = e.target.value.replace(/,/g, "");
                      setNewValue({
                        ...newValue,
                        additionalPrice: parseInt(value) || 0,
                      });
                    }}
                    className="text-sm bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <Label
                    htmlFor={valueBasePriceId}
                    className="text-xs text-muted-foreground"
                  >
                    {isAdd ? "원가 (원)" : "원가"}
                  </Label>
                  <Input
                    id={valueBasePriceId}
                    type="text"
                    placeholder="0"
                    value={
                      newValue.basePrice > 0
                        ? newValue.basePrice.toLocaleString()
                        : ""
                    }
                    onChange={(e) => {
                      const value = e.target.value.replace(/,/g, "");
                      setNewValue({
                        ...newValue,
                        basePrice: parseInt(value) || 0,
                      });
                    }}
                    className="text-sm bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <Label
                    htmlFor={valueStockId}
                    className="text-xs text-muted-foreground"
                  >
                    재고
                  </Label>
                  <Input
                    id={valueStockId}
                    type="number"
                    placeholder="0"
                    value={newValue.stock || ""}
                    onChange={(e) =>
                      setNewValue({
                        ...newValue,
                        stock: parseInt(e.target.value) || undefined,
                      })
                    }
                    className="text-sm bg-background"
                    min="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    파트너코드
                  </Label>
                  <Input
                    type="text"
                    placeholder="선택"
                    value={newValue.partnerSubCode}
                    onChange={(e) =>
                      setNewValue({
                        ...newValue,
                        partnerSubCode: e.target.value,
                      })
                    }
                    className="text-sm bg-background"
                  />
                </div>
              </div>

              <Button
                type="button"
                onClick={onAddOptionValue}
                className="w-full text-sm"
                variant="secondary"
              >
                <Plus className="size-4 mr-1.5" />값 추가
              </Button>

              {isAdd && optionFormData.values.length > 0 && (
                <OptionValuesTable
                  values={optionFormData.values}
                  editingValueIndex={editingValueIndex}
                  editingValue={editingValue}
                  setEditingValue={setEditingValue}
                  onSaveEditValue={onSaveEditValue}
                  onCancelEditValue={onCancelEditValue}
                  onStartEditValue={onStartEditValue}
                  onRemoveOptionValue={onRemoveOptionValue}
                  onMoveValueUp={onMoveValueUp}
                  onMoveValueDown={onMoveValueDown}
                />
              )}
            </div>
          </div>
        </div>

        {!isAdd && optionFormData.values.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">옵션 값 목록</Label>
            <OptionValuesTable
              values={optionFormData.values}
              editingValueIndex={editingValueIndex}
              editingValue={editingValue}
              setEditingValue={setEditingValue}
              onSaveEditValue={onSaveEditValue}
              onCancelEditValue={onCancelEditValue}
              onStartEditValue={onStartEditValue}
              onRemoveOptionValue={onRemoveOptionValue}
              onMoveValueUp={onMoveValueUp}
              onMoveValueDown={onMoveValueDown}
            />
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className={isAdd ? "min-w-[100px]" : "text-sm"}
          >
            취소
          </Button>
          <Button
            onClick={onSubmit}
            className={isAdd ? "min-w-[100px]" : "text-sm"}
            disabled={
              isAdd
                ? !optionFormData.name || optionFormData.values.length === 0
                : undefined
            }
          >
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface OptionValuesTableProps {
  values: any[];
  editingValueIndex: number | null;
  editingValue: EditingValueData | null;
  setEditingValue: (
    updater:
      | EditingValueData
      | null
      | ((prev: EditingValueData | null) => EditingValueData | null),
  ) => void;
  onSaveEditValue: () => Promise<void>;
  onCancelEditValue: () => void;
  onStartEditValue: (index: number) => void;
  onRemoveOptionValue: (index: number) => void;
  onMoveValueUp: (index: number) => void;
  onMoveValueDown: (index: number) => void;
}

function OptionValuesTable({
  values,
  editingValueIndex,
  editingValue,
  setEditingValue,
  onSaveEditValue,
  onCancelEditValue,
  onStartEditValue,
  onRemoveOptionValue,
  onMoveValueUp,
  onMoveValueDown,
}: OptionValuesTableProps) {
  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              <th className="px-2 py-2 text-center font-medium text-muted-foreground w-16">
                순서
              </th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                옵션값
              </th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                코드
              </th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                금액
              </th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                원가
              </th>
              <th className="px-3 py-2 text-center font-medium text-muted-foreground">
                재고
              </th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                파트너코드
              </th>
              <th className="px-3 py-2 text-center font-medium text-muted-foreground w-20">
                액션
              </th>
            </tr>
          </thead>
          <tbody>
            {values.map((val, idx) => (
              <tr
                key={idx}
                className="border-b border-border last:border-b-0 hover:bg-muted/10"
              >
                {editingValueIndex === idx ? (
                  <>
                    <td className="px-2 py-2 text-center">
                      <div className="text-muted-foreground text-xs">-</div>
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={editingValue?.value || ""}
                        onChange={(e) =>
                          setEditingValue((prev) =>
                            prev ? { ...prev, value: e.target.value } : null,
                          )
                        }
                        placeholder="옵션값"
                        className="h-8 text-sm w-full"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={editingValue?.code || ""}
                        onChange={(e) =>
                          setEditingValue((prev) =>
                            prev ? { ...prev, code: e.target.value } : null,
                          )
                        }
                        onBlur={(e) =>
                          setEditingValue((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  code: e.target.value.toUpperCase(),
                                }
                              : null,
                          )
                        }
                        placeholder="코드"
                        className="h-8 text-sm w-full uppercase"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        value={editingValue?.additionalPrice || 0}
                        onChange={(e) =>
                          setEditingValue((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  additionalPrice:
                                    parseInt(e.target.value) || 0,
                                }
                              : null,
                          )
                        }
                        placeholder="금액"
                        className="h-8 text-sm text-right w-full"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        value={editingValue?.basePrice || 0}
                        onChange={(e) =>
                          setEditingValue((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  basePrice: parseInt(e.target.value) || 0,
                                }
                              : null,
                          )
                        }
                        placeholder="원가"
                        className="h-8 text-sm text-right w-full"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        value={
                          editingValue?.stock !== undefined
                            ? editingValue.stock
                            : ""
                        }
                        onChange={(e) =>
                          setEditingValue((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  stock: parseInt(e.target.value) || 0,
                                }
                              : null,
                          )
                        }
                        placeholder="재고"
                        className="h-8 text-sm text-center w-full"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="text"
                        value={editingValue?.partnerSubCode || ""}
                        onChange={(e) =>
                          setEditingValue((prev) =>
                            prev
                              ? { ...prev, partnerSubCode: e.target.value }
                              : null,
                          )
                        }
                        placeholder="선택"
                        className="h-8 text-sm w-full"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={onSaveEditValue}
                          className="h-7 w-7 p-0 text-green-600 hover:text-green-600 hover:bg-green-50"
                        >
                          <Check className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={onCancelEditValue}
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-2 py-2.5 text-center">
                      <div className="flex flex-col gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onMoveValueUp(idx)}
                          disabled={idx === 0}
                          className="h-5 w-full p-0 hover:bg-muted"
                          title="위로 이동"
                        >
                          <ChevronUp className="size-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onMoveValueDown(idx)}
                          disabled={idx === values.length - 1}
                          className="h-5 w-full p-0 hover:bg-muted"
                          title="아래로 이동"
                        >
                          <ChevronDown className="size-3" />
                        </Button>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-medium">{val.value}</td>
                    <td className="px-3 py-2.5">
                      <code className="text-xs bg-muted px-2 py-0.5 rounded">
                        {val.code || "-"}
                      </code>
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium">
                      {val.additionalPrice > 0 ? (
                        <span className="text-primary text-sm">
                          ₩{val.additionalPrice.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium">
                      {(val as any).basePrice > 0 ? (
                        <span className="text-gray-600 text-sm">
                          ₩{((val as any).basePrice || 0).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {val.stock !== undefined ? (
                        <span
                          className={
                            val.stock > 0
                              ? "text-foreground"
                              : "text-destructive"
                          }
                        >
                          {val.stock}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-left">
                      <span className="text-xs text-muted-foreground">
                        {(val as any).partnerSubCode || "-"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onStartEditValue(idx)}
                          className="h-7 w-7 p-0"
                        >
                          <Edit className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveOptionValue(idx)}
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
