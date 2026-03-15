interface PriceDisplayProps {
  pricePerHour: number;
  variant?: 'simple' | 'detailed';
  showLabel?: boolean;
}

export function PriceDisplay({
  pricePerHour,
  variant = 'simple',
  showLabel = false,
}: PriceDisplayProps) {
  const nightRate = Math.round(pricePerHour * 1.25);
  return (
    <div>
      {showLabel && (
        <div className="text-xs md:text-sm text-white/40 font-mono uppercase mb-2">Tarifs</div>
      )}
      <div className="text-2xl md:text-3xl font-black text-white">
        {pricePerHour.toLocaleString('fr-FR')} FCFA/h
      </div>
      {variant === 'detailed' && (
        <div className="text-sm text-white/60 mt-1">
          Jour · Nuit: {nightRate.toLocaleString('fr-FR')} FCFA/h
        </div>
      )}
    </div>
  );
}
