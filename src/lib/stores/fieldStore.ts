import { create } from 'zustand';
import { Field } from '@/types';

interface FieldStore {
  fields: Field[];
  selectedField: Field | null;
  isLoading: boolean;
  error: string | null;
  setFields: (fields: Field[]) => void;
  setSelectedField: (field: Field | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useFieldStore = create<FieldStore>((set) => ({
  fields: [],
  selectedField: null,
  isLoading: false,
  error: null,
  setFields: (fields) => set({ fields }),
  setSelectedField: (selectedField) => set({ selectedField }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
