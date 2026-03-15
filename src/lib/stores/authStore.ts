import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'user' | 'admin' | 'super_admin';
}

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      setError: () => set({}),
      logout: () => set({ user: null }),
      fetchUser: async () => {
        try {
          const res = await fetch('/api/auth/me', { credentials: 'include' });
          if (!res.ok) {
            set({ user: null });
            return;
          }
          const { user } = await res.json();
          set({ user: user ?? null });
        } catch {
          set({ user: null });
        }
      },
    }),
    { name: 'auth-storage', partialize: (s) => ({ user: s.user }) }
  )
);
