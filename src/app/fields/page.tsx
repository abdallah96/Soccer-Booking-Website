'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useFields } from '@/lib/hooks/useFields';
import { PETIT_CAMP_FIELD } from '@/lib/utils/constants';

export default function FieldsPage() {
  const { fields, isLoading, error } = useFields();
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect to the first field's booking page
    if (!isLoading) {
      if (fields && fields.length > 0) {
        router.replace(`/fields/${fields[0].id}`);
      } else if (!error) {
        // Fallback to constant ID if fields array is empty but no error
        router.replace(`/fields/${PETIT_CAMP_FIELD.id}`);
      }
    }
  }, [fields, isLoading, error, router]);

  if (isLoading) {
    return <LoadingSpinner message="Chargement..." />;
  }

  if (error) {
    // On error, try redirecting to fallback field ID
    router.replace(`/fields/${PETIT_CAMP_FIELD.id}`);
    return <LoadingSpinner message="Redirection..." />;
  }

  if (fields.length === 0) {
    // If no fields, redirect to fallback
    router.replace(`/fields/${PETIT_CAMP_FIELD.id}`);
    return <LoadingSpinner message="Redirection..." />;
  }

  // This should not render, but just in case:
  return <LoadingSpinner message="Redirection..." />;
}
