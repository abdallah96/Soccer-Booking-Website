'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Field } from '@/types';

export default function FieldsPage() {
  const [fields, setFields] = useState<Field[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchFields = async () => {
      try {
        const response = await fetch('/api/fields');
        const data = await response.json();
        setFields(data.fields);
      } catch (error) {
        console.error('Failed to fetch fields:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFields();
  }, []);

  const filteredFields = fields.filter(field =>
    field.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    field.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <LoadingSpinner message="Chargement des terrains..." />;
  }

  return (
    <div className="min-h-screen bg-black py-16 md:py-20 px-6 sm:px-8 lg:px-12 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-1/2 h-full bg-[radial-gradient(circle_at_0%_50%,rgba(34,197,94,0.1),transparent_70%)]"></div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(circle_at_100%_50%,rgba(59,130,246,0.1),transparent_70%)]"></div>
      </div>
      
      <div className="relative z-10 max-w-[1600px] mx-auto text-white">
        <div className="mb-12 md:mb-16">
          <div className="inline-block mb-6">
            <span className="text-white/40 text-sm font-mono tracking-[0.3em] uppercase">TROUVER UN TERRAIN</span>
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6">
            TERRAINS <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">DISPONIBLES</span>
          </h1>
          <p className="text-xl text-white/60 max-w-2xl font-light">
            Filtrez par quartier, style de jeu et budget. Tous les terrains sont vérifiés et notés par de vraies équipes.
          </p>
        </div>

        <div className="mb-12">
          <div className="relative">
            <div className="absolute -bottom-2 -right-2 w-full h-full border-2 border-emerald-500/30"></div>
            <div className="relative bg-white/5 backdrop-blur-md border border-white/10 p-6">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Rechercher par nom ou quartier (Plateau, Yoff, Parcelles...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-6 py-4 bg-black/50 border-2 border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-500 transition-all font-light"
                  />
                </div>
                <div className="flex flex-wrap gap-3 text-xs">
                  <button className="px-4 py-2 bg-white/5 border border-white/20 hover:bg-emerald-500/20 hover:border-emerald-500 transition-all font-mono uppercase">
                    💡 Soirée
                  </button>
                  <button className="px-4 py-2 bg-white/5 border border-white/20 hover:bg-blue-500/20 hover:border-blue-500 transition-all font-mono uppercase">
                    🏆 Tournoi
                  </button>
                  <button className="px-4 py-2 bg-white/5 border border-white/20 hover:bg-emerald-500/20 hover:border-emerald-500 transition-all font-mono uppercase">
                    💰 &lt; 15 000
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {filteredFields.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-8xl mb-6">⚽</div>
            <p className="text-white text-2xl md:text-3xl font-black mb-3">
              {searchQuery ? 'Aucun terrain ne correspond à vos filtres.' : 'Aucun terrain disponible pour le moment.'}
            </p>
            <p className="text-sm md:text-base text-white/60 mt-3 max-w-lg mx-auto leading-relaxed font-light">
              Essayez de vider la recherche, changer de quartier, ou revenez plus tard—de nouveaux terrains sont ajoutés chaque semaine.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFields.map((field, index) => (
              <div
                key={field.id}
                className="group cursor-pointer"
              >
                <div className="relative">
                  <div className="absolute -bottom-2 -right-2 w-full h-full border-2 border-emerald-500/30 group-hover:border-emerald-500/50 transition-colors"></div>
                  <div className="relative bg-white/5 backdrop-blur-md border border-white/10 overflow-hidden group-hover:bg-white/10 transition-colors">
                    <div className="relative w-full h-64 overflow-hidden">
                      {field.images && field.images[0] ? (
                        <>
                          <img
                            src={field.images[0]}
                            alt={field.name}
                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center">
                          <span className="text-white text-6xl">⚽</span>
                        </div>
                      )}
                      
                      <div className="absolute top-4 right-4">
                        <div className="bg-black/80 backdrop-blur-sm px-3 py-1.5 border-2 border-white/20 flex items-center space-x-1.5">
                          <span className="text-yellow-400 text-sm">★</span>
                          <span className="text-white font-black text-sm">{field.rating}</span>
                        </div>
                      </div>

                      <div className="absolute bottom-4 left-4 right-4">
                        <h2 className="text-3xl font-black text-white mb-2 group-hover:text-emerald-400 transition-colors">
                          {field.name.toUpperCase()}
                        </h2>
                        <p className="text-white/80 text-sm flex items-center font-light">
                          <span className="mr-2">📍</span>
                          {field.location}
                        </p>
                      </div>
                    </div>

                    <div className="p-6">
                      <p className="text-white/60 text-sm mb-6 line-clamp-2 min-h-[2.5rem] leading-relaxed font-light">
                        {field.description}
                      </p>

                      <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/10">
                        <div className="flex items-center space-x-2 text-white/60">
                          <span className="text-lg">👥</span>
                          <span className="text-sm font-light">{field.capacity} joueurs</span>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-emerald-400">
                            {field.price_per_hour.toLocaleString()}
                          </p>
                          <p className="text-xs text-white/40 font-mono">FCFA / heure</p>
                        </div>
                      </div>

                      <div className="mb-6">
                        <p className="text-xs font-black text-white/40 mb-3 uppercase tracking-wider font-mono">
                          Équipements
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {field.facilities.slice(0, 3).map((facility) => (
                            <span
                              key={facility}
                              className="bg-emerald-500/20 text-emerald-300 px-3 py-1.5 border border-emerald-500/30 text-xs font-mono uppercase"
                            >
                              {facility}
                            </span>
                          ))}
                          {field.facilities.length > 3 && (
                            <span className="bg-white/5 text-white/60 px-3 py-1.5 border border-white/10 text-xs font-mono uppercase">
                              +{field.facilities.length - 3}
                            </span>
                          )}
                        </div>
                      </div>

                      <Link href={`/fields/${field.id}`} className="block">
                        <button className="w-full px-6 py-4 bg-emerald-500 text-black font-black text-sm tracking-tight hover:bg-emerald-400 transition-colors transform group-hover:scale-105">
                          RÉSERVER MAINTENANT
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
