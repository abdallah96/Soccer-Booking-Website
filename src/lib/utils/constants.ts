export const COLORS = {
  primary: '#0f9d0f',      // Green (Senegal flag)
  secondary: '#e88c00',    // Orange-Gold
  accent: '#e60000',       // Red
  background: '#ffffff',
  text: '#333333',
  lightGray: '#f5f5f5',
  border: '#e0e0e0',
};

// Available time slots for Petit Camp (8h to 2h next day)
export const AVAILABLE_HOURS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00',
  '22:00', '23:00', '00:00', '01:00'
];

export const PAYMENT_METHODS = [
  { id: 'wave', name: 'Wave' },
  { id: 'orange_money', name: 'Orange Money' },
  { id: 'cash', name: 'Espèces' },
];

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
};

// Petit Camp - Single field organization
export const PETIT_CAMP_FIELD = {
  id: 'petit-camp-1',
  name: 'Petit Camp',
  description: 'Terrain de football professionnel avec installations modernes. Éclairage de qualité, vestiaires équipés, parking sécurisé et rafraîchissements disponibles.',
  location: 'Dakar, Sénégal',
  price_per_hour: 20000, // Base price, actual price calculated dynamically based on time
  capacity: 22,
  facilities: ['Éclairage', 'Vestiaires', 'Parking', 'Rafraîchissements'],
  rating: 4.8,
  images: [],
};

export const DEFAULT_ADMIN_EMAIL = 'admin@petitcamp.sn';
export const DEFAULT_ADMIN_PASSWORD = 'admin123'; // Change in production!
