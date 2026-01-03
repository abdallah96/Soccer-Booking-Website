'use client';

import { useEffect, useState } from 'react';
import { useFields } from '@/lib/hooks/useFields';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PriceDisplay } from '@/components/fields/PriceDisplay';
import { trackPageView } from '@/lib/utils/analytics';
import Link from 'next/link';

export default function FieldsInfoPage() {
  const { fields, isLoading } = useFields();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    trackPageView('fields_info');
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Chargement..." />;
  }

  const field = fields[0]; // Assuming single field for now

  if (!field) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-8xl mb-6">⚽</div>
          <h1 className="text-4xl font-black text-white mb-4">AUCUN TERRAIN</h1>
          <p className="text-white/60 mb-8 font-light">
            Aucun terrain disponible pour le moment.
          </p>
          <Link href="/">
            <button className="px-8 py-4 bg-red-600 text-white font-black hover:bg-red-700 transition-colors">
              RETOUR À L'ACCUEIL
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 md:py-20 px-4 sm:px-6 lg:px-12">
      <div className="max-w-6xl mx-auto">
        <Link href="/fields" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8 font-light font-mono text-sm transition-colors">
          ← RETOUR
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Field Header */}
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-full h-full border-2 border-white/10 hidden md:block"></div>
              <div className="relative bg-white/5 backdrop-blur-md border border-white/10 p-6 md:p-10 rounded-lg md:rounded-none">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-black text-white mb-2">{field.name.toUpperCase()}</h1>
                    <p className="text-white/60 text-base md:text-lg font-light flex items-center">
                      <span className="mr-2">📍</span>
                      {field.location}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 border border-white/20 rounded-lg">
                    <span className="text-yellow-400">★</span>
                    <span className="text-white font-black text-lg">{field.rating.toFixed(1)}</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <h2 className="text-xl md:text-2xl font-black text-white mb-4 uppercase">Description</h2>
                  <p className="text-white/70 leading-relaxed font-light text-sm md:text-base">{field.description}</p>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <h2 className="text-xl md:text-2xl font-black text-white mb-4 uppercase">Équipements</h2>
                  <div className="flex flex-wrap gap-2 md:gap-3">
                    {field.facilities.map((facility) => (
                      <span
                        key={facility}
                        className="px-3 md:px-4 py-1.5 md:py-2 bg-red-500/20 text-red-300 border border-red-500/30 text-xs md:text-sm font-mono uppercase rounded"
                      >
                        {facility}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10 grid grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <div className="text-xs md:text-sm text-white/40 font-mono uppercase mb-2">Capacité</div>
                    <div className="text-2xl md:text-3xl font-black text-white">{field.capacity} joueurs</div>
                  </div>
                  <div>
                    <PriceDisplay 
                      pricePerHour={field.price_per_hour || 20000} 
                      variant="detailed"
                      showLabel={true}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics Section */}
            {stats && (
              <div className="relative">
                <div className="absolute -top-4 -right-4 w-full h-full border-2 border-red-500/20 hidden md:block"></div>
                <div className="relative bg-white/5 backdrop-blur-md border border-white/10 p-6 md:p-10 rounded-lg md:rounded-none">
                  <h2 className="text-xl md:text-2xl font-black text-white mb-6 uppercase">Statistiques</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    <div className="bg-gray-800/30 p-4 rounded-lg">
                      <div className="text-xs md:text-sm text-white/60 font-mono uppercase mb-1">Total réservations</div>
                      <div className="text-2xl md:text-3xl font-black text-white">
                        {stats.stats?.total_bookings || 0}
                      </div>
                    </div>
                    <div className="bg-gray-800/30 p-4 rounded-lg">
                      <div className="text-xs md:text-sm text-white/60 font-mono uppercase mb-1">Confirmées</div>
                      <div className="text-2xl md:text-3xl font-black text-green-400">
                        {stats.stats?.confirmed_bookings || 0}
                      </div>
                    </div>
                    <div className="bg-gray-800/30 p-4 rounded-lg">
                      <div className="text-xs md:text-sm text-white/60 font-mono uppercase mb-1">Revenus total</div>
                      <div className="text-lg md:text-2xl font-black text-red-400">
                        {new Intl.NumberFormat('fr-FR').format(stats.stats?.total_revenue || 0)}
                        <span className="text-xs md:text-sm ml-1">FCFA</span>
                      </div>
                    </div>
                    <div className="bg-gray-800/30 p-4 rounded-lg">
                      <div className="text-xs md:text-sm text-white/60 font-mono uppercase mb-1">30 derniers jours</div>
                      <div className="text-lg md:text-2xl font-black text-red-400">
                        {new Intl.NumberFormat('fr-FR').format(stats.stats?.revenue_last_30_days || 0)}
                        <span className="text-xs md:text-sm ml-1">FCFA</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Map Section */}
            <div className="relative">
              <div className="absolute -bottom-2 -right-2 w-full h-full border-2 border-gray-500/30 hidden md:block"></div>
              <div className="relative bg-white/5 backdrop-blur-md border border-white/10 p-6 md:p-10 rounded-lg md:rounded-none">
                <h2 className="text-xl md:text-2xl font-black text-white mb-4 uppercase">Localisation</h2>
                <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden border-2 border-white/10">
                  <iframe
                    src={`https://www.google.com/maps?q=${encodeURIComponent(field.location)}&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="absolute inset-0"
                  />
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(field.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-light"
                >
                  <span>📍</span>
                  <span>Voir sur Google Maps</span>
                </a>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <div className="relative">
                <div className="absolute -bottom-4 -left-4 w-full h-full border-2 border-gray-500/30 hidden md:block"></div>
                <div className="relative bg-white/5 backdrop-blur-md border border-white/10 p-6 md:p-8 rounded-lg md:rounded-none">
                  <h2 className="text-xl md:text-2xl font-black text-white mb-6 uppercase">Informations</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <div className="text-xs md:text-sm text-white/40 font-mono uppercase mb-2">Horaires</div>
                      <div className="text-white font-light">
                        <div className="mb-1">Lundi - Dimanche</div>
                        <div className="text-red-400 font-black">8h - 2h</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs md:text-sm text-white/40 font-mono uppercase mb-2">Tarifs</div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-white/60 text-sm">Jour (8h-18h)</span>
                          <span className="text-red-400 font-black">
                            {(field.price_per_hour || 20000).toLocaleString()} FCFA/h
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60 text-sm">Nuit (19h-2h)</span>
                          <span className="text-gray-400 font-black">
                            {Math.round((field.price_per_hour || 20000) * 1.25).toLocaleString()} FCFA/h
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs md:text-sm text-white/40 font-mono uppercase mb-2">Modes de paiement</div>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1.5 bg-gray-800/50 border border-white/20 rounded text-xs text-white/80">Wave</span>
                        <span className="px-3 py-1.5 bg-gray-800/50 border border-white/20 rounded text-xs text-white/80">Orange Money</span>
                        <span className="px-3 py-1.5 bg-gray-800/50 border border-white/20 rounded text-xs text-white/80">Espèces</span>
                      </div>
                    </div>

                    <Link href={`/fields/${field.id}`}>
                      <button className="w-full px-6 py-4 bg-red-600 text-white font-black hover:bg-red-700 transition-colors rounded-xl">
                        RÉSERVER MAINTENANT
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

