'use client';

import { useState } from 'react';

interface DayBookingInfo {
  total: number;       // Total number of slots
  booked: number;      // Number of booked slots
  isFullyBooked: boolean;
}

interface CalendarProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  minDate?: string;
  maxDate?: string;
  isDateAvailable?: (date: Date) => boolean;
  bookingInfo?: Record<string, DayBookingInfo>; // Key is date string YYYY-MM-DD
}

export function Calendar({ selectedDate, onDateSelect, minDate, maxDate, isDateAvailable, bookingInfo }: CalendarProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(
    selectedDate ? new Date(selectedDate) : today
  );

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const isDateDisabled = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    
    if (minDate && dateStr < minDate) return true;
    if (maxDate && dateStr > maxDate) return true;
    
    // Disable past dates
    const todayStr = today.toISOString().split('T')[0];
    if (dateStr < todayStr) return true;

    // Check if date is in an open week (if availability checker provided)
    if (isDateAvailable && !isDateAvailable(date)) return true;

    return false;
  };

  const isDateSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    return date.toISOString().split('T')[0] === selectedDate;
  };

  const isToday = (date: Date): boolean => {
    const todayStr = today.toISOString().split('T')[0];
    return date.toISOString().split('T')[0] === todayStr;
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;
    onDateSelect(date.toISOString().split('T')[0]);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div className="bg-black/50 border-2 border-white/20 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          className="px-3 py-1 text-white/60 hover:text-white transition-colors"
        >
          ←
        </button>
        <div className="text-white font-black text-lg">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </div>
        <button
          onClick={goToNextMonth}
          className="px-3 py-1 text-white/60 hover:text-white transition-colors"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-xs text-white/40 font-mono py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dateStr = date.toISOString().split('T')[0];
          const disabled = isDateDisabled(date);
          const selected = isDateSelected(date);
          const todayDate = isToday(date);
          
          // Get booking info for this date
          const dayInfo = bookingInfo?.[dateStr];
          const isFullyBooked = dayInfo?.isFullyBooked || false;
          const hasBookings = dayInfo && dayInfo.booked > 0;
          const bookingPercentage = dayInfo ? Math.round((dayInfo.booked / dayInfo.total) * 100) : 0;

          return (
            <button
              key={date.toISOString()}
              onClick={() => handleDateClick(date)}
              disabled={disabled || isFullyBooked}
              title={isFullyBooked ? 'Complet' : hasBookings ? `${bookingPercentage}% réservé` : undefined}
              className={`
                aspect-square text-sm font-light transition-all relative
                ${disabled || isFullyBooked
                  ? 'text-white/20 cursor-not-allowed' 
                  : selected
                  ? 'bg-red-500 text-white font-black border-2 border-red-400'
                  : todayDate
                  ? 'bg-white/10 text-white border-2 border-white/30 hover:bg-white/20'
                  : 'text-white/60 hover:bg-white/10 hover:text-white border-2 border-transparent'
                }
                ${isFullyBooked ? 'bg-gray-800/50' : ''}
                ${hasBookings && !isFullyBooked && !selected ? 'border-yellow-500/50' : ''}
              `}
            >
              {date.getDate()}
              {/* Visual indicators */}
              {isFullyBooked && !disabled && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-[8px] flex items-center justify-center">✕</span>
              )}
              {hasBookings && !isFullyBooked && !selected && (
                <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Legend */}
      {bookingInfo && Object.keys(bookingInfo).length > 0 && (
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10 text-xs text-white/50">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
            <span>Partiellement réservé</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-red-500 rounded-full text-[6px] flex items-center justify-center text-white">✕</span>
            <span>Complet</span>
          </div>
        </div>
      )}
    </div>
  );
}

