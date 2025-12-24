import { PRICING } from '@/lib/config/constants';

interface PriceDisplayProps {
  pricePerHour: number;
  variant?: 'inline' | 'detailed' | 'compact';
  showLabel?: boolean;
}

/**
 * Reusable component for displaying field prices
 * Automatically calculates night rate from day rate
 */
export function PriceDisplay({ 
  pricePerHour, 
  variant = 'detailed',
  showLabel = true 
}: PriceDisplayProps) {
  const dayPrice = pricePerHour || PRICING.DEFAULT_DAY_RATE;
  const nightPrice = Math.round(dayPrice * PRICING.NIGHT_RATE_MULTIPLIER);

  if (variant === 'inline') {
    return (
      <span className="text-emerald-400 font-black">
        {dayPrice.toLocaleString()} <span className="text-xs text-white/40 font-mono">FCFA/h</span>
      </span>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="text-right">
        <div className="text-emerald-400 font-black text-lg">{dayPrice.toLocaleString()}</div>
        <div className="text-white/40 text-xs font-mono">FCFA/h</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="text-sm text-white/40 font-mono uppercase mb-2">Tarifs</div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-white/60 font-light">Jour (8h-18h)</span>
        <span className="text-2xl font-black text-emerald-400">
          {dayPrice.toLocaleString()} <span className="text-xs text-white/40 font-mono">FCFA/h</span>
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-white/60 font-light">Nuit (19h-2h)</span>
        <span className="text-2xl font-black text-blue-400">
          {nightPrice.toLocaleString()} <span className="text-xs text-white/40 font-mono">FCFA/h</span>
        </span>
      </div>
    </div>
  );
}

