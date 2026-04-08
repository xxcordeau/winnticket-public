"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { ko } from "date-fns/locale";

import { cn } from "./utils";
import { buttonVariants } from "./button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => {
    if (props.month) return props.month;
    // selected 
    if (props.selected && props.selected instanceof Date) return props.selected;
    return new Date();
  });

  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  React.useEffect(() => {
    if (props.month) {
      setCurrentMonth(props.month);
    } else if (props.selected && props.selected instanceof Date) {
      setCurrentMonth(props.selected);
    }
  }, [props.month, props.selected]);

  const numberOfMonths = isMobile ? 1 : 2;

  const years = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 10;
    const endYear = currentYear + 10;
    return Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
  }, []);

  const months = [
    "1월", "2월", "3월", "4월", "5월", "6월",
    "7월", "8월", "9월", "10월", "11월", "12월"
  ];

  const handleMonthChange = (month: string) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(parseInt(month));
    setCurrentMonth(newDate);
    props.onMonthChange?.(newDate);
  };

  const handleYearChange = (year: string) => {
    const newDate = new Date(currentMonth);
    newDate.setFullYear(parseInt(year));
    setCurrentMonth(newDate);
    props.onMonthChange?.(newDate);
  };

  const goToPreviousYear = () => {
    const newDate = new Date(currentMonth);
    newDate.setFullYear(newDate.getFullYear() - 1);
    setCurrentMonth(newDate);
    props.onMonthChange?.(newDate);
  };

  const goToNextYear = () => {
    const newDate = new Date(currentMonth);
    newDate.setFullYear(newDate.getFullYear() + 1);
    setCurrentMonth(newDate);
    props.onMonthChange?.(newDate);
  };

  const goToPreviousMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentMonth(newDate);
    props.onMonthChange?.(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentMonth(newDate);
    props.onMonthChange?.(newDate);
  };

  return (
    <DayPicker
      locale={ko}
      showOutsideDays={showOutsideDays}
      className={cn("p-2 md:p-4", className)}
      month={currentMonth}
      onMonthChange={setCurrentMonth}
      numberOfMonths={numberOfMonths}
      fixedWeeks
      classNames={{
        months: "flex flex-row gap-4",
        month: "flex flex-col gap-2 md:gap-4",
        caption: "flex justify-center pt-1 relative items-center w-full mb-2",
        caption_label: "hidden", // 
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "size-8 md:size-8 bg-transparent p-0 border-0 hover:bg-accent transition-colors",
        ),
        nav_button_previous: "hidden", // 
        nav_button_next: "hidden", // 
        table: "w-full border-collapse mx-auto mt-2",
        head_row: "grid grid-cols-7 mb-2",
        head_cell:
          "text-muted-foreground rounded-md w-11 h-11 md:w-10 md:h-10 flex items-center justify-center text-center font-semibold text-sm md:text-sm",
        row: "grid grid-cols-7 gap-y-2 md:gap-y-2",
        cell: cn(
          "relative p-0.5 text-center focus-within:relative focus-within:z-20 w-11 h-11 md:w-10 md:h-10 [&:has([aria-selected])]:!p-0",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "",
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "w-10 h-10 md:w-9 md:h-9 p-0 font-normal text-base md:text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-all aria-selected:opacity-100 aria-selected:w-full aria-selected:h-full",
        ),
        day_range_start:
          "day-range-start rounded-l-md",
        day_range_end:
          "day-range-end rounded-r-md",
        day_selected:
          "bg-primary text-primary-foreground hover:!bg-primary hover:!text-primary-foreground font-semibold",
        day_today: "bg-accent/50 text-foreground font-medium",
        day_outside:
          "day-outside text-muted-foreground/30 aria-selected:text-muted-foreground/30",
        day_disabled: "text-muted-foreground/20 opacity-40 cursor-not-allowed",
        day_range_middle:
          "rounded-md aria-selected:rounded-md",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Caption: ({ displayMonth }) => {
          return (
            <div className="flex items-center justify-between w-full pb-2 border-b">
              {/* 좌측 버튼들 */}
              <div className="flex items-center gap-1">
                {/* 연도 이전 버튼 */}
                <button
                  type="button"
                  onClick={goToPreviousYear}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "size-8 bg-transparent p-0 border hover:bg-accent hover:border-accent transition-colors rounded-md"
                  )}
                  title="이전 연도"
                >
                  <ChevronsLeft className="size-4" />
                </button>

                {/* 월 이전 버튼 */}
                <button
                  type="button"
                  onClick={goToPreviousMonth}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "size-8 bg-transparent p-0 border hover:bg-accent hover:border-accent transition-colors rounded-md"
                  )}
                  title="이전 월"
                >
                  <ChevronLeft className="size-4" />
                </button>
              </div>

              {/* 연도/월 선택 (중앙) */}
              <div className="flex items-center gap-2">
                <Select
                  value={displayMonth.getFullYear().toString()}
                  onValueChange={handleYearChange}
                >
                  <SelectTrigger className="h-8 w-[90px] text-sm font-semibold border-0 hover:bg-accent transition-colors focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}년
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={displayMonth.getMonth().toString()}
                  onValueChange={handleMonthChange}
                >
                  <SelectTrigger className="h-8 w-[70px] text-sm font-semibold border-0 hover:bg-accent transition-colors focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 우측 버튼들 */}
              <div className="flex items-center gap-1">
                {/* 월 다음 버튼 */}
                <button
                  type="button"
                  onClick={goToNextMonth}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "size-8 bg-transparent p-0 border hover:bg-accent hover:border-accent transition-colors rounded-md"
                  )}
                  title="다음 월"
                >
                  <ChevronRight className="size-4" />
                </button>

                {/* 연도 다음 버튼 */}
                <button
                  type="button"
                  onClick={goToNextYear}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "size-8 bg-transparent p-0 border hover:bg-accent hover:border-accent transition-colors rounded-md"
                  )}
                  title="다음 연도"
                >
                  <ChevronsRight className="size-4" />
                </button>
              </div>
            </div>
          );
        },
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("size-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("size-4", className)} {...props} />
        ),
        ...props.components,
      }}
      {...props}
    />
  );
}

export { Calendar };