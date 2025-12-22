'use client';

import { useState } from 'react';

interface CalendarProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  minDate?: string;
  maxDate?: string;
}

export function Calendar({ selectedDate, onDateSelect, minDate, maxDate }: CalendarProps) {
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

          const disabled = isDateDisabled(date);
          const selected = isDateSelected(date);
          const todayDate = isToday(date);

          return (
            <button
              key={date.toISOString()}
              onClick={() => handleDateClick(date)}
              disabled={disabled}
              className={`
                aspect-square text-sm font-light transition-all
                ${disabled 
                  ? 'text-white/20 cursor-not-allowed' 
                  : selected
                  ? 'bg-emerald-500 text-black font-black border-2 border-emerald-400'
                  : todayDate
                  ? 'bg-white/10 text-white border-2 border-white/30 hover:bg-white/20'
                  : 'text-white/60 hover:bg-white/10 hover:text-white border-2 border-transparent'
                }
              `}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

