export const COLORS = {
  primary: '#0f9d0f',      // Green (Senegal flag)
  secondary: '#e88c00',    // Orange-Gold
  accent: '#e60000',       // Red
  background: '#ffffff',
  text: '#333333',
  lightGray: '#f5f5f5',
  border: '#e0e0e0',
};

export const TIME_SLOTS = [
  '08:00 - 10:00',
  '10:00 - 12:00',
  '12:00 - 14:00',
  '14:00 - 16:00',
  '16:00 - 18:00',
  '18:00 - 20:00',
  '20:00 - 22:00',
];

export const PAYMENT_METHODS = [
  { id: 'wave', name: 'Wave' },
  { id: 'orange_money', name: 'Orange Money' },
  { id: 'cash', name: 'Cash' },
];

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
};

export const SAMPLE_FIELDS = [
  {
    name: 'Stadium Elite Football Field',
    description: 'Professional-grade football field with modern facilities',
    location: 'Downtown Sports Complex, Dakar',
    price_per_hour: 15000,
    capacity: 22,
    facilities: ['Floodlights', 'Changing Rooms', 'Parking', 'Refreshments'],
    rating: 4.8,
    images: [
      'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800',
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
    ],
  },
  {
    name: 'Sunset Valley Field',
    description: 'Beautiful field with evening floodlights and great views',
    location: 'Plateau, Dakar',
    price_per_hour: 12000,
    capacity: 20,
    facilities: ['Floodlights', 'Parking', 'Seating Area'],
    rating: 4.5,
    images: [
      'https://images.unsplash.com/photo-1570902235392-8f6121c2a9f8?w=800',
    ],
  },
  {
    name: 'Riverside Sports Arena',
    description: 'Spacious field perfect for tournaments and big games',
    location: 'Île de Gorée, Dakar',
    price_per_hour: 18000,
    capacity: 24,
    facilities: ['Floodlights', 'Changing Rooms', 'Parking', 'Stadium Seating', 'Refreshments'],
    rating: 4.9,
    images: [
      'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=800',
    ],
  },
];

export const DEFAULT_ADMIN_EMAIL = 'admin@sport.sn';
export const DEFAULT_ADMIN_PASSWORD = 'admin123'; // Change in production!
