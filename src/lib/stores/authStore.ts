import { create } from 'zustand';
import { User } from '@/types';

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }
    set({ user: null });
  },
  fetchUser: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        set({ user: data.user });
      } else {
        set({ user: null });
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      set({ user: null, error: 'Failed to fetch user' });
    } finally {
      set({ isLoading: false });
    }
  },
}));
