import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

interface FilterDropdownProps {
  value: string;
  items: { label: string; value: string }[];
  onSelect: (value: string) => void;
  width?: string;
}

export function FilterDropdown({ value, items, onSelect, width = "130px" }: FilterDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          className="backdrop-blur-2xl backdrop-filter bg-background box-border content-stretch flex flex-col h-[36px] items-start p-[5px] relative rounded-[6px] shrink-0 cursor-pointer"
          style={{ width }}
        >
          <div aria-hidden="true" className="absolute border border-border border-solid inset-0 pointer-events-none rounded-[6px]" />
          <div className="basis-0 grow min-h-px min-w-px relative rounded-[5px] shrink-0 w-full">
            <div className="flex flex-row items-center size-full">
              <div className="box-border content-stretch flex items-center justify-between pl-[14px] pr-[10px] py-[10px] relative size-full">
                <div className="flex flex-col justify-center leading-[0] not-italic relative shrink-0 text-[13px] text-muted-foreground text-nowrap">
                  <p className="leading-[16px] whitespace-pre">{value}</p>
                </div>
                <ChevronDown className="h-[10px] w-[10px] text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {items.map((item) => (
          <DropdownMenuItem key={item.value} onClick={() => onSelect(item.value)}>
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
