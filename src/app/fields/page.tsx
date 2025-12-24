'use client';

import { useEffect } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { FieldCard } from '@/components/fields/FieldCard';
import { useFields } from '@/lib/hooks/useFields';
import { trackPageView } from '@/lib/utils/analytics';

export default function FieldsPage() {
  const { fields, isLoading, error } = useFields();

  useEffect(() => {
    trackPageView('fields_list');
  }, []);

  if (isLoading) {
    return <LoadingSpinner message="Chargement des terrains..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-8xl mb-6">⚠️</div>
          <p className="text-white text-2xl md:text-3xl font-black mb-3">
            Erreur de chargement
          </p>
          <p className="text-white/60">{error}</p>
        </div>
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-8xl mb-6">⚽</div>
          <p className="text-white text-2xl md:text-3xl font-black mb-3">
            Aucun terrain disponible
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-16 md:py-20 px-6 sm:px-8 lg:px-12 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-1/2 h-full bg-[radial-gradient(circle_at_0%_50%,rgba(34,197,94,0.1),transparent_70%)]"></div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(circle_at_100%_50%,rgba(59,130,246,0.1),transparent_70%)]"></div>
      </div>
      
      <div className="relative z-10 max-w-6xl mx-auto text-white">
        <div className="mb-12 md:mb-16 text-center">
          <div className="inline-block mb-6">
            <span className="text-white/40 text-sm font-mono tracking-[0.3em] uppercase">NOS TERRAINS</span>
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6">
            CHOISISSEZ VOTRE <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">TERRAIN</span>
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto font-light">
            Terrains professionnels avec installations modernes. Réservez votre créneau maintenant.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fields.map((field) => (
            <FieldCard key={field.id} field={field} variant="compact" />
          ))}
        </div>
      </div>
    </div>
  );
}
