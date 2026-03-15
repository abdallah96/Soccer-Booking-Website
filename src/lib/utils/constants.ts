/**
 * App constants: hours, payment methods, field fallback, logo
 */

const hours = Array.from({ length: 18 }, (_, i) => {
  const h = (i + 8) % 24;
  return `${String(h).padStart(2, '0')}:00`;
});
// 08:00 -> 01:00 (next day) for night slots
const night = ['02:00', '03:00', '04:00', '05:00', '06:00', '07:00'];
export const AVAILABLE_HOURS = [...hours, ...night];

export const PAYMENT_METHODS = [
  { id: 'wave', name: 'Wave' },
  { id: 'orange_money', name: 'Orange Money' },
  { id: 'cash', name: 'Espèces' },
] as const;

export const PETIT_CAMP_FIELD = {
  id: 'petit-camp-1',
  name: 'Petit Camp',
  description: 'Terrain professionnel',
  location: 'Dakar, Sénégal',
  price_per_hour: 20000,
  capacity: 18,
  rating: 0,
  images: [] as string[],
  facilities: [] as string[],
};

export const LOGO_URL = process.env.NEXT_PUBLIC_LOGO_URL || '/logo-placeholder.png';

export function isValidLogoUrl(url: string): boolean {
  if (!url || url === '/logo-placeholder.png') return false;
  return url.startsWith('http') || url.startsWith('/');
}
