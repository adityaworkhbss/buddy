import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  getDay
} from "date-fns";

import { cn } from "@/lib/utils";

export interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  className?: string;
  defaultMonth?: Date;
}

export function Calendar({
  selected,
  onSelect,
  disabled,
  className,
  defaultMonth = new Date(),
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => {
    // If a date is selected, show that month, otherwise use defaultMonth or today
    if (selected) {
      return startOfMonth(selected);
    }
    return startOfMonth(defaultMonth);
  });

  // Update current month when selected date changes (if it's a different month)
  React.useEffect(() => {
    if (selected) {
      const selectedMonth = startOfMonth(selected);
      setCurrentMonth(prev => {
        const prevMonth = startOfMonth(prev);
        if (!isSameMonth(selectedMonth, prevMonth)) {
          return selectedMonth;
        }
        return prev;
      });
    }
  }, [selected]);

  // Get all days to display (only current month days)
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get first day of week for the month and pad with empty cells
  const firstDayOfMonth = getDay(monthStart); // 0 = Sunday, 1 = Monday, etc.
  
  // Weekday headers
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Normalize date to remove time component
  const normalizeDate = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  };

  // Handle date selection
  const handleDateClick = (date: Date) => {
    if (disabled && disabled(date)) return;
    
    const normalized = normalizeDate(date);
    const currentSelected = selected ? normalizeDate(selected) : null;
    
    // Toggle selection if clicking the same date
    if (currentSelected && isSameDay(normalized, currentSelected)) {
      onSelect?.(undefined);
    } else {
      onSelect?.(normalized);
    }
  };

  const isDateSelected = (date: Date): boolean => {
    if (!selected) return false;
    return isSameDay(normalizeDate(date), normalizeDate(selected));
  };

  const isDateToday = (date: Date): boolean => {
    return isToday(date);
  };

  return (
    <div className={cn("p-4 bg-white rounded-lg shadow-sm border border-gray-200 w-fit", className)}>
      {/* Header with month/year and navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={goToPreviousMonth}
          className="inline-flex items-center justify-center rounded-md h-7 w-7 text-sm font-medium hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-gray-600 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        
        <h2 className="text-base font-semibold text-gray-900">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        
        <button
          type="button"
          onClick={goToNextMonth}
          className="inline-flex items-center justify-center rounded-md h-7 w-7 text-sm font-medium hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-gray-600 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0 mb-2">
        {weekDays.map((day, index) => (
          <div
            key={index}
            className="text-gray-500 font-medium text-[11px] uppercase tracking-wider text-center h-9 flex items-center justify-center"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0">
        {/* Empty cells for days before month starts */}
        {Array.from({ length: firstDayOfMonth }).map((_, index) => (
          <div key={`empty-${index}`} className="h-9 w-9" />
        ))}
        
        {/* Month days */}
        {monthDays.map((date, index) => {
          const selected = isDateSelected(date);
          const today = isDateToday(date);
          const isDisabled = disabled ? disabled(date) : false;
          
          return (
            <button
              key={index}
              type="button"
              onClick={() => handleDateClick(date)}
              disabled={isDisabled}
              className={cn(
                "h-9 w-9 rounded-md text-sm font-normal transition-colors",
                "flex items-center justify-center",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                !selected && !today && "text-gray-900 hover:bg-gray-100",
                !selected && !today && !isDisabled && "cursor-pointer",
                today && !selected && "bg-gray-100 text-gray-900 font-semibold",
                selected && "bg-pink-500 text-white font-medium hover:bg-pink-600",
                isDisabled && "text-gray-300 opacity-50 cursor-not-allowed"
              )}
            >
              {format(date, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
