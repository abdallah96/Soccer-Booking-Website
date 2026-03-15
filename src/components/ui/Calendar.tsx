'use client';

export interface DayBookingInfo {
  total: number;
  booked: number;
  isFullyBooked: boolean;
}

interface CalendarProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  minDate: string;
  maxDate: string;
  isDateAvailable?: (date: Date) => boolean;
  bookingInfo?: Record<string, DayBookingInfo>;
}

export function Calendar({
  selectedDate,
  onDateSelect,
  minDate,
  maxDate,
  isDateAvailable = () => true,
  bookingInfo = {},
}: CalendarProps) {
  const min = new Date(minDate);
  const max = new Date(maxDate);
  const days: string[] = [];
  for (let d = new Date(min); d <= max; d.setDate(d.getDate() + 1)) {
    days.push(d.toISOString().split('T')[0]);
  }

  return (
    <div className="grid grid-cols-7 gap-1 text-sm">
      {days.map((day) => {
        const info = bookingInfo[day];
        const disabled = !isDateAvailable(new Date(day + 'T12:00:00')) || (info?.isFullyBooked ?? false);
        return (
          <button
            key={day}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onDateSelect(day)}
            className={`p-2 rounded border text-center ${
              selectedDate === day
                ? 'bg-red-600 border-red-500 text-white'
                : disabled
                ? 'border-gray-600 bg-gray-800/50 text-gray-500 cursor-not-allowed'
                : 'border-white/20 bg-gray-800/50 text-white hover:border-red-500/50'
            }`}
          >
            {new Date(day + 'T12:00:00').getDate()}
            {info?.isFullyBooked && <span className="block text-xs">✕</span>}
          </button>
        );
      })}
    </div>
  );
}
