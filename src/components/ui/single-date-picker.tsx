import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "./utils";

interface SingleDatePickerProps {
  value?: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: string; // YYYY-MM-DD
  maxDate?: string; // YYYY-MM-DD
}

export function SingleDatePicker({
  value,
  onChange,
  placeholder = "날짜 선택",
  disabled = false,
  minDate,
  maxDate,
}: SingleDatePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(
    value ? new Date(value + "T00:00:00") : undefined
  );

  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      onChange(`${year}-${month}-${day}`);
    }
  };

  React.useEffect(() => {
    if (value) {
      setDate(new Date(value + "T00:00:00"));
    } else {
      setDate(undefined);
    }
  }, [value]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? date.toLocaleDateString("ko-KR") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          numberOfMonths={1}
          disabled={(checkDate) => {
            if (minDate) {
              const min = new Date(minDate + "T00:00:00");
              if (checkDate < min) return true;
            }
            if (maxDate) {
              const max = new Date(maxDate + "T00:00:00");
              if (checkDate > max) return true;
            }
            return false;
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}