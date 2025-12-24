/**
 * Centralized API client utilities
 * Provides consistent error handling and response parsing
 */

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

export class ApiClientError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Generic API fetch wrapper with error handling
 */
export async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiClientError(
        data.error || 'An error occurred',
        response.status,
        data.code
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    
    if (error instanceof Error) {
      throw new ApiClientError(error.message, 500);
    }
    
    throw new ApiClientError('An unknown error occurred', 500);
  }
}

/**
 * API methods for common operations
 */
export const api = {
  fields: {
    getAll: () => apiFetch<{ fields: any[] }>('/api/fields'),
    getById: (id: string) => apiFetch<{ field: any }>(`/api/fields/${id}`),
  },
  bookings: {
    create: (data: any) => apiFetch('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getByUser: (userId: string) => apiFetch(`/api/bookings?user_id=${userId}`),
    getAvailability: (fieldId: string, date: string) => 
      apiFetch(`/api/bookings/availability?field_id=${fieldId}&date=${date}`),
  },
};

