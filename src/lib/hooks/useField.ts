import { useState, useEffect } from 'react';

export interface Field {
  id: string;
  name: string;
  description?: string;
  location: string;
  price_per_hour: number;
  capacity: number;
  rating: number;
  images?: string[];
  facilities?: string[];
}

export function useField(id: string | null) {
  const [field, setField] = useState<Field | null>(null);
  const [isLoading, setIsLoading] = useState(!!id);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setField(null);
      setIsLoading(false);
      setError('ID manquant');
      return;
    }
    setIsLoading(true);
    setError(null);
    fetch(`/api/fields/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error('Terrain introuvable');
        return r.json();
      })
      .then((data) => {
        setField(data.field ?? null);
      })
      .catch((e) => {
        setError(e.message || 'Erreur de chargement');
        setField(null);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  return { field, isLoading, error };
}
