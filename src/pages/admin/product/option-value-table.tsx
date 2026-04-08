import { Button } from "@/components/ui/button";
import { Edit, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { OptionValueEdit } from "./option-value-edit";
import type { ProductOptionValue } from "@/data/dto/product.dto";

interface OptionValueTableProps {
  values: Array<
    Omit<ProductOptionValue, "id" | "optionId"> & {
      id?: string;
      validityStartDate?: Date;
      validityEndDate?: Date;
    }
  >;
  editingIndex: number | null;
  editingValue: {
    value: string;
    code: string;
    additionalPrice: number;
    stock: number | undefined;
    validityStartDate: Date | undefined;
    validityEndDate: Date | undefined;
  } | null;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditingValueChange: (
    value: {
      value: string;
      code: string;
      additionalPrice: number;
      stock: number | undefined;
      validityStartDate: Date | undefined;
      validityEndDate: Date | undefined;
    } | null
  ) => void;
  onMoveUp?: (index: number) => void; // 
  onMoveDown?: (index: number) => void; // 
}

export function OptionValueTable({
  values,
  editingIndex,
  editingValue,
  onEdit,
  onDelete,
  onSaveEdit,
  onCancelEdit,
  onEditingValueChange,
  onMoveUp,
  onMoveDown,
}: OptionValueTableProps) {
  if (values.length === 0) return null;

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              {(onMoveUp || onMoveDown) && (
                <th className="px-2 py-2 text-center font-medium text-muted-foreground w-16">
                  순서
                </th>
              )}
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                옵션값
              </th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                코드
              </th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                금액
              </th>
              <th className="px-3 py-2 text-center font-medium text-muted-foreground">
                재고
              </th>
              <th className="px-3 py-2 text-center font-medium text-muted-foreground">
                유효기간
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
                {editingIndex === idx ? (
                  <td colSpan={(onMoveUp || onMoveDown) ? 7 : 6} className="p-2">
                    <OptionValueEdit
                      value={editingValue!}
                      onChange={onEditingValueChange}
                      onSave={onSaveEdit}
                      onCancel={onCancelEdit}
                    />
                  </td>
                ) : (
                  <>
                    {(onMoveUp || onMoveDown) && (
                      <td className="px-2 py-2.5 text-center">
                        <div className="flex flex-col gap-0.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onMoveUp?.(idx)}
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
                            onClick={() => onMoveDown?.(idx)}
                            disabled={idx === values.length - 1}
                            className="h-5 w-full p-0 hover:bg-muted"
                            title="아래로 이동"
                          >
                            <ChevronDown className="size-3" />
                          </Button>
                        </div>
                      </td>
                    )}
                    <td className="px-3 py-2.5 font-medium">
                      {val.value}
                    </td>
                    <td className="px-3 py-2.5">
                      <code className="text-xs bg-muted px-2 py-0.5 rounded">
                        {val.code || "-"}
                      </code>
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium">
                      {val.additionalPrice > 0 ? (
                        <span className="text-primary">
                          +₩{val.additionalPrice.toLocaleString()}
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
                    <td className="px-3 py-2.5 text-center text-xs">
                      {val.validityStartDate || val.validityEndDate ? (
                        <div className="flex flex-col gap-0.5">
                          {val.validityStartDate && (
                            <span>
                              {new Date(
                                val.validityStartDate
                              ).toLocaleDateString()}
                            </span>
                          )}
                          {val.validityStartDate &&
                            val.validityEndDate && (
                              <span className="text-muted-foreground">
                                ~
                              </span>
                            )}
                          {val.validityEndDate && (
                            <span>
                              {new Date(
                                val.validityEndDate
                              ).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(idx)}
                          className="h-7 w-7 p-0"
                        >
                          <Edit className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(idx)}
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