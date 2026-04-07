'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useFields } from '@/lib/hooks/useFields';
import { trackPageView } from '@/lib/utils/analytics';
import { PRICING } from '@/lib/config/constants';

export default function FieldsPage() {
  const { fields, isLoading, error } = useFields();

  useEffect(() => {
    trackPageView('fields_list');
  }, []);

  if (isLoading) {
    return <LoadingSpinner message="Chargement..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-6">
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-8xl mb-6">⚽</div>
          <p className="text-white text-2xl md:text-3xl font-black mb-3">
            Aucun terrain disponible
          </p>
        </div>
      </div>
    );
  }

  const singleField = fields.length === 1;

  return (
    <div className="min-h-screen bg-gray-900 py-16 md:py-20 px-6 sm:px-8 lg:px-12 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-1/2 h-full bg-[radial-gradient(circle_at_0%_50%,rgba(220,38,38,0.1),transparent_70%)]"></div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(circle_at_100%_50%,rgba(107,114,128,0.1),transparent_70%)]"></div>
      </div>
      
      <div className="relative z-10 max-w-6xl mx-auto text-white">
        <div className="mb-12 md:mb-16 text-center">
          <div className="inline-block mb-6">
            <span className="text-white/40 text-sm font-mono tracking-[0.3em] uppercase">RÉSERVER</span>
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6">
            {singleField ? 'PETIT ' : 'NOS '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700">
              {singleField ? 'CAMP' : 'TERRAINS'}
            </span>
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto font-light">
            {singleField
              ? 'Réservez votre créneau en quelques clics. Disponible pour les 2 prochaines semaines.'
              : `${fields.length} terrains disponibles — choisissez et réservez en quelques clics.`}
          </p>
        </div>

        <div className={`${singleField ? 'max-w-2xl mx-auto' : 'grid md:grid-cols-2 xl:grid-cols-3 gap-8'}`}>
          {fields.map((field) => (
            <Link 
              key={field.id}
              href={`/fields/${field.id}`}
              className="group block"
            >
              <div className="relative h-full">
                <div className="absolute -bottom-3 -right-3 w-full h-full border-2 border-red-500/30 group-hover:border-red-500/50 transition-colors"></div>
                <div className="relative bg-white/5 backdrop-blur-md border border-white/10 overflow-hidden group-hover:bg-white/10 transition-colors h-full flex flex-col">
                  {field.images && field.images[0] ? (
                    <img
                      src={field.images[0]}
                      alt={field.name}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-red-500/20 to-gray-500/20 flex items-center justify-center">
                      <span className="text-6xl">⚽</span>
                    </div>
                  )}

                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-white/40 font-mono uppercase">{field.location}</span>
                      <span className="text-sm font-black text-yellow-400">{field.rating}★</span>
                    </div>
                    
                    <h2 className="text-2xl font-black text-white mb-2">{field.name.toUpperCase()}</h2>
                    
                    <p className="text-white/60 mb-4 font-light text-sm line-clamp-2">
                      {field.description || 'Terrain professionnel avec installations modernes'}
                    </p>

                    {field.facilities && field.facilities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {field.facilities.slice(0, 4).map((facility: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-mono uppercase"
                          >
                            {facility}
                          </span>
                        ))}
                        {field.facilities.length > 4 && (
                          <span className="px-2 py-0.5 text-white/40 text-xs">+{field.facilities.length - 4}</span>
                        )}
                      </div>
                    )}

                    <div className="mt-auto">
                      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10 mb-4">
                        <div className="text-center">
                          <div className="text-lg font-black text-white">{field.capacity}</div>
                          <div className="text-xs text-white/40 font-mono uppercase">Joueurs</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-black text-red-500">
                            {(field.price_per_hour || PRICING.DEFAULT_DAY_RATE).toLocaleString()}
                          </div>
                          <div className="text-xs text-white/40 font-mono uppercase">FCFA/h</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-black text-gray-400">
                            {Math.round((field.price_per_hour || PRICING.DEFAULT_DAY_RATE) * PRICING.NIGHT_RATE_MULTIPLIER).toLocaleString()}
                          </div>
                          <div className="text-xs text-white/40 font-mono uppercase">Nuit</div>
                        </div>
                      </div>

                      <div className="w-full px-6 py-3 bg-red-600 text-white font-black text-center group-hover:bg-red-700 transition-colors">
                        RÉSERVER →
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="max-w-2xl mx-auto mt-12 space-y-4">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl">
            <h3 className="text-lg font-black text-white mb-4">📅 Réservation</h3>
            <ul className="space-y-3 text-white/70 font-light">
              <li className="flex items-start gap-3">
                <span className="text-red-500">•</span>
                <span>Créneaux disponibles pour les <strong className="text-white">2 prochaines semaines</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500">•</span>
                <span>Durée: <strong className="text-white">1 heure</strong> ou <strong className="text-white">1 heure 30</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500">•</span>
                <span>Paiement: <strong className="text-white">Wave</strong>, <strong className="text-white">Orange Money</strong> ou <strong className="text-white">Espèces</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500">•</span>
                <span>Ouvert de <strong className="text-white">8h à 2h</strong> tous les jours</span>
              </li>
            </ul>
          </div>
          <Link href="/fields/info">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
              <h3 className="text-lg font-black text-white mb-2">ℹ️ Plus d&apos;informations</h3>
              <p className="text-white/60 text-sm font-light">
                Découvrez les statistiques détaillées, les équipements et toutes les informations sur le terrain.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
