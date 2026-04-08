interface UnderlineTabsProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: {
    value: T;
    label: string;
    count?: number;
  }[];
}

export function UnderlineTabs<T extends string>({
  value,
  onValueChange,
  options,
}: UnderlineTabsProps<T>) {
  return (
    <div className="inline-flex gap-6">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onValueChange(option.value)}
          className={`cursor-pointer pb-3 border-b-2 transition-all text-sm hover:scale-105 ${
            value === option.value
              ? "text-[#0c8ce9] border-[#0c8ce9]"
              : "text-muted-foreground border-transparent hover:text-foreground"
          }`}
        >
          {option.label}
          {option.count !== undefined && (
            <span> ({option.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}