import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X } from "lucide-react";

interface OptionValue {
  value: string;
  code: string;
  additionalPrice: number;
  stock?: number;
}

interface OptionValueEditProps {
  value: OptionValue;
  onChange: (value: OptionValue) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function OptionValueEdit({ value, onChange, onSave, onCancel }: OptionValueEditProps) {
  return (
    <>
      {/* 모바일: 세로 레이아웃 */}
      <div className="sm:hidden space-y-2">
        <Input
          placeholder="값"
          value={value?.value || ""}
          onChange={(e) =>
            onChange({
              ...value,
              value: e.target.value,
            })
          }
          className="text-sm"
        />
        <Input
          placeholder="옵션코드"
          value={value?.code || ""}
          onChange={(e) =>
            onChange({
              ...value,
              code: e.target.value,
            })
          }
          onBlur={(e) =>
            onChange({
              ...value,
              code: e.target.value.toUpperCase(),
            })
          }
          className="text-sm uppercase"
        />
        <Input
          type="text"
          placeholder="추가금액"
          value={
            value && value.additionalPrice > 0
              ? value.additionalPrice.toLocaleString()
              : ""
          }
          onChange={(e) => {
            const val = e.target.value.replace(/,/g, "");
            onChange({
              ...value,
              additionalPrice: parseInt(val) || 0,
            });
          }}
          className="text-sm"
        />
        <Input
          type="number"
          placeholder="재고"
          value={value?.stock || ""}
          onChange={(e) =>
            onChange({
              ...value,
              stock: parseInt(e.target.value) || undefined,
            })
          }
          className="text-sm"
          min="0"
        />
        <div className="flex gap-1">
          <Button
            variant="default"
            size="sm"
            onClick={onSave}
            className="flex-1 h-8"
          >
            <Check className="size-3.5 mr-1" />
            저장
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="flex-1 h-8"
          >
            <X className="size-3.5 mr-1" />
            취소
          </Button>
        </div>
      </div>
      {/* PC: 가로 레이아웃 */}
      <Input
        placeholder="값"
        value={value?.value || ""}
        onChange={(e) =>
          onChange({
            ...value,
            value: e.target.value,
          })
        }
        className="hidden sm:block text-sm"
      />
      <Input
        placeholder="옵션코드"
        value={value?.code || ""}
        onChange={(e) =>
          onChange({
            ...value,
            code: e.target.value,
          })
        }
        onBlur={(e) =>
          onChange({
            ...value,
            code: e.target.value.toUpperCase(),
          })
        }
        className="hidden sm:block text-sm uppercase"
      />
      <Input
        type="text"
        placeholder="추가금액"
        value={
          value && value.additionalPrice > 0
            ? value.additionalPrice.toLocaleString()
            : ""
        }
        onChange={(e) => {
          const val = e.target.value.replace(/,/g, "");
          onChange({
            ...value,
            additionalPrice: parseInt(val) || 0,
          });
        }}
        className="hidden sm:block text-sm"
      />
      <Input
        type="number"
        placeholder="재고"
        value={value?.stock || ""}
        onChange={(e) =>
          onChange({
            ...value,
            stock: parseInt(e.target.value) || undefined,
          })
        }
        className="hidden sm:block text-sm"
        min="0"
      />
      <div className="hidden sm:flex gap-1">
        <Button
          variant="default"
          size="sm"
          onClick={onSave}
          className="h-8 w-8 p-0"
        >
          <Check className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="h-8 w-8 p-0"
        >
          <X className="size-4" />
        </Button>
      </div>
    </>
  );
}