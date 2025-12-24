'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Field } from '@/types';
import { trackPageView, trackField } from '@/lib/utils/analytics';

export default function FieldsPage() {
  const [fields, setFields] = useState<Field[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    trackPageView('fields_list');
  }, []);

  useEffect(() => {
    const fetchFields = async () => {
      try {
        const response = await fetch('/api/fields');
        const data = await response.json();
        if (data.fields && data.fields.length > 0) {
          setFields(data.fields);
          // Track view for all fields
          data.fields.forEach((field: Field) => {
            trackField('field_viewed', field.id);
          });
        }
      } catch (error) {
        console.error('Failed to fetch fields:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFields();
  }, []);

  if (isLoading) {
    return <LoadingSpinner message="Chargement des terrains..." />;
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
            <Link 
              key={field.id}
              href={`/fields/${field.id}`} 
              className="block group"
              onClick={() => trackField('field_viewed', field.id, { source: 'fields_list' })}
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
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
                      </>
                    ) : (
                      <div className="w-full h-64 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center">
                        <span className="text-white text-7xl">⚽</span>
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
                        <span className="mr-1.5">📍</span>
                        {field.location}
                      </p>
                    </div>
                  </div>

                  <div className="p-6">
                    <p className="text-white/70 text-sm mb-4 leading-relaxed font-light line-clamp-2">
                      {field.description}
                    </p>

                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="text-white/40 text-xs">👥</span>
                        <span className="text-white font-black text-sm">{field.capacity} joueurs</span>
                      </div>
                      <div className="text-right">
                        <div className="text-emerald-400 font-black text-lg">{field.price_per_hour?.toLocaleString() || '20 000'}</div>
                        <div className="text-white/40 text-xs font-mono">FCFA/h</div>
                      </div>
                    </div>

                    {field.facilities && field.facilities.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {field.facilities.slice(0, 3).map((facility, index) => (
                            <span
                              key={index}
                              className="bg-emerald-500/20 text-emerald-300 px-2 py-1 border border-emerald-500/30 text-xs font-mono uppercase"
                            >
                              {facility}
                            </span>
                          ))}
                          {field.facilities.length > 3 && (
                            <span className="text-white/40 text-xs font-mono">+{field.facilities.length - 3}</span>
                          )}
                        </div>
                      </div>
                    )}

                    <button className="w-full px-6 py-3 bg-emerald-500 text-black font-black text-sm tracking-tight hover:bg-emerald-400 transition-colors transform group-hover:scale-105">
                      VOIR DÉTAILS
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
