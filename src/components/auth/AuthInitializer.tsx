'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/stores/authStore';

/**
 * Component to initialize user from httpOnly cookie on app load
 */
export function AuthInitializer() {
  const { fetchUser } = useAuthStore();

  useEffect(() => {
    // Fetch user from cookie on mount
    fetchUser();
  }, [fetchUser]);

  return null;
}

