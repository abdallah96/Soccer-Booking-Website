import { useState, useEffect } from 'react';
import { Field } from '@/types';

interface UseFieldsReturn {
  fields: Field[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching and managing fields data
 * Provides loading state, error handling, and refetch capability
 */
export function useFields(): UseFieldsReturn {
  const [fields, setFields] = useState<Field[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFields = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/fields');
      
      if (!response.ok) {
        throw new Error('Failed to fetch fields');
      }
      
      const data = await response.json();
      if (data.fields && Array.isArray(data.fields)) {
        setFields(data.fields);
      } else {
        setFields([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Failed to fetch fields:', err);
      setFields([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, []);

  return {
    fields,
    isLoading,
    error,
    refetch: fetchFields,
  };
}

