import { format, addDays, isAfter, isBefore, startOfDay } from 'date-fns';

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd/MM/yyyy');
};

export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd/MM/yyyy HH:mm');
};

export const getAvailableDates = (daysAhead: number = 30): string[] => {
  const dates: string[] = [];
  const today = startOfDay(new Date());
  
  for (let i = 0; i < daysAhead; i++) {
    const date = addDays(today, i);
    dates.push(format(date, 'yyyy-MM-dd'));
  }
  
  return dates;
};

export const isValidBookingDate = (date: string): boolean => {
  const bookingDate = startOfDay(new Date(date));
  const today = startOfDay(new Date());
  return isAfter(bookingDate, today) || format(bookingDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
};

export const parseTimeSlot = (slot: string): { start: string; end: string } => {
  const [start, end] = slot.split(' - ');
  return { start: start.trim(), end: end.trim() };
};
