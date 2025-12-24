import { useState, useEffect } from 'react';
import { Field } from '@/types';

interface UseFieldReturn {
  field: Field | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching a single field by ID
 * @param fieldId - The ID of the field to fetch
 */
export function useField(fieldId: string | null): UseFieldReturn {
  const [field, setField] = useState<Field | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchField = async () => {
    if (!fieldId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/fields/${fieldId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Field not found');
        }
        throw new Error('Failed to fetch field');
      }
      
      const data = await response.json();
      setField(data.field || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Failed to fetch field:', err);
      setField(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchField();
  }, [fieldId]);

  return {
    field,
    isLoading,
    error,
    refetch: fetchField,
  };
}

