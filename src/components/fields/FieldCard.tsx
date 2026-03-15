'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Field } from '@/types';
import { PRICING } from '@/lib/config/constants';
import { trackField } from '@/lib/utils/analytics';

interface FieldCardProps {
  field: Field;
  variant?: 'compact' | 'detailed';
  showButton?: boolean;
}

/**
 * Reusable FieldCard component for displaying field information
 * Supports both compact (list) and detailed (single) variants
 */
export function FieldCard({ field, variant = 'compact', showButton = true }: FieldCardProps) {
  const [imageError, setImageError] = useState(false);
  const dayPrice = field.price_per_hour || PRICING.DEFAULT_DAY_RATE;
  const nightPrice = Math.round(dayPrice * PRICING.NIGHT_RATE_MULTIPLIER);

  const handleClick = () => {
    trackField('field_viewed', field.id, { source: 'field_card' });
  };

  const cardContent = (
    <div className="relative">
      <div className="absolute -bottom-2 -right-2 w-full h-full border-2 border-emerald-500/30 group-hover:border-emerald-500/50 transition-colors"></div>
      <div className="relative bg-white/5 backdrop-blur-md border border-white/10 overflow-hidden group-hover:bg-white/10 transition-colors">
        <div className={`relative w-full ${variant === 'compact' ? 'h-64' : 'h-96'} overflow-hidden`}>
          {field.images && field.images[0] && !imageError ? (
            <>
              <img
                src={field.images[0]}
                alt={field.name}
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                onError={() => setImageError(true)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center">
              <span className={`text-white ${variant === 'compact' ? 'text-7xl' : 'text-9xl'}`}>⚽</span>
            </div>
          )}
          
          <div className={`absolute ${variant === 'compact' ? 'top-4 right-4' : 'top-6 right-6'}`}>
            <div className="bg-black/80 backdrop-blur-sm px-3 py-1.5 border-2 border-white/20 flex items-center space-x-1.5">
              <span className="text-yellow-400 text-sm">★</span>
              <span className="text-white font-black text-sm">{field.rating}</span>
            </div>
          </div>

          <div className={`absolute ${variant === 'compact' ? 'bottom-4 left-4 right-4' : 'bottom-6 left-6 right-6'}`}>
            <h2 className={`${variant === 'compact' ? 'text-3xl' : 'text-5xl'} font-black text-white mb-2 group-hover:text-emerald-400 transition-colors`}>
              {field.name.toUpperCase()}
            </h2>
            <p className={`text-white/80 ${variant === 'compact' ? 'text-sm' : 'text-lg'} flex items-center font-light`}>
              <span className="mr-1.5">📍</span>
              {field.location}
            </p>
          </div>
        </div>

        <div className={variant === 'compact' ? 'p-6' : 'p-8'}>
          <p className={`text-white/70 ${variant === 'compact' ? 'text-sm mb-4 line-clamp-2' : 'text-base mb-8'} leading-relaxed font-light`}>
            {field.description}
          </p>

          {variant === 'compact' ? (
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-white/40 text-xs">👥</span>
                <span className="text-white font-black text-sm">{field.capacity} joueurs</span>
              </div>
              <div className="text-right">
                <div className="text-emerald-400 font-black text-lg">{dayPrice.toLocaleString()}</div>
                <div className="text-white/40 text-xs font-mono">FCFA/h</div>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8 mb-8 pb-8 border-b border-white/10">
              <div>
                <div className="text-sm text-white/40 font-mono uppercase mb-2">Capacité</div>
                <div className="text-3xl font-black text-white flex items-center">
                  <span className="mr-2">👥</span>
                  {field.capacity} joueurs
                </div>
              </div>
              <div>
                <div className="text-sm text-white/40 font-mono uppercase mb-2">Tarifs</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 font-light">Jour (8h-18h)</span>
                    <span className="text-2xl font-black text-emerald-400">{dayPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 font-light">Nuit (19h-2h)</span>
                    <span className="text-2xl font-black text-blue-400">{nightPrice.toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-white/40 font-mono">FCFA / heure</div>
                </div>
              </div>
            </div>
          )}

          {field.facilities && field.facilities.length > 0 && (
            <div className={variant === 'compact' ? 'mb-4' : 'mb-8'}>
              {variant === 'compact' ? (
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
              ) : (
                <>
                  <p className="text-xs font-black text-white/40 mb-4 uppercase tracking-wider font-mono">
                    Équipements
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {field.facilities.map((facility) => (
                      <span
                        key={facility}
                        className="bg-emerald-500/20 text-emerald-300 px-4 py-2 border border-emerald-500/30 text-sm font-mono uppercase"
                      >
                        {facility}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {showButton && (
            <button className={`w-full ${variant === 'compact' ? 'px-6 py-3 text-sm' : 'px-8 py-5 text-lg'} bg-emerald-500 text-black font-black tracking-tight hover:bg-emerald-400 transition-colors transform group-hover:scale-105`}>
              {variant === 'compact' ? 'VOIR DÉTAILS' : 'RÉSERVER MAINTENANT'}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (variant === 'compact') {
    return (
      <Link 
        href={`/fields/${field.id}`} 
        className="block group"
        onClick={handleClick}
      >
        {cardContent}
      </Link>
    );
  }

  return <div className="group">{cardContent}</div>;
}

