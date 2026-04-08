import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

interface SegmentTabsProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: {
    value: T;
    label: string;
  }[];
}

export function SegmentTabs<T extends string>({
  value,
  onValueChange,
  options,
}: SegmentTabsProps<T>) {
  // : options undefined
  if (!options || !Array.isArray(options)) {
    return null;
  }

  const currentLabel = options.find((o) => o.value === value)?.label ?? "";

  return (
    <>
      {/* 모바일: Select */}
      <div className="md:hidden w-full">
        <Select value={value} onValueChange={(v) => onValueChange(v as T)}>
          <SelectTrigger className="w-full">
            <SelectValue>{currentLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 데스크톱: 기존 탭 */}
      <div className="hidden md:inline-flex flex-nowrap rounded-lg bg-muted/50 p-1 overflow-x-auto max-w-full">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onValueChange(option.value)}
            className={`cursor-pointer rounded-md px-4 md:px-6 py-1.5 text-[11px] md:text-[13px] transition-all hover:scale-105 whitespace-nowrap flex-shrink-0 ${
              value === option.value
                ? "bg-background text-[#0c8ce9] font-medium shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </>
  );
}
