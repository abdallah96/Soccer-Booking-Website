import { create } from 'zustand';
import { Booking, BookingWithField } from '@/types';

interface BookingStore {
  bookings: BookingWithField[];
  currentBooking: Partial<Booking> | null;
  isLoading: boolean;
  error: string | null;
  setBookings: (bookings: BookingWithField[]) => void;
  setCurrentBooking: (booking: Partial<Booking> | null) => void;
  updateCurrentBooking: (partial: Partial<Booking>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetCurrentBooking: () => void;
}

export const useBookingStore = create<BookingStore>((set) => ({
  bookings: [],
  currentBooking: null,
  isLoading: false,
  error: null,
  setBookings: (bookings) => set({ bookings }),
  setCurrentBooking: (currentBooking) => set({ currentBooking }),
  updateCurrentBooking: (partial) =>
    set((state) => ({
      currentBooking: state.currentBooking
        ? { ...state.currentBooking, ...partial }
        : partial,
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  resetCurrentBooking: () => set({ currentBooking: null }),
}));
