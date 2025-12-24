/**
 * Application-wide constants and configuration
 * Centralized location for all magic numbers and strings
 */

// Pricing Configuration
export const PRICING = {
  NIGHT_RATE_MULTIPLIER: 1.25, // Night rate is 25% more than day rate
  DEFAULT_DAY_RATE: 20000, // Default price per hour in FCFA
  DEFAULT_NIGHT_RATE: 25000, // Default night rate in FCFA
  DAY_HOURS_START: 8,
  DAY_HOURS_END: 18,
  NIGHT_HOURS_START: 19,
  NIGHT_HOURS_END: 2, // 2 AM next day
} as const;

// Field Configuration
export const FIELD_CONFIG = {
  DEFAULT_CAPACITY: 18,
  DEFAULT_RATING: 4.8,
  PETIT_CAMP_NAME: 'Petit Camp',
  PETIT_CAMP_CAPACITY: 18,
} as const;

// Booking Configuration
export const BOOKING = {
  MIN_DURATION: 60, // minutes
  MAX_DURATION: 90, // minutes
  CANCELLATION_HOURS: 24, // hours before booking
  MAX_ADVANCE_DAYS: 30, // days in advance
} as const;

// Contact Information
export const CONTACT = {
  WHATSAPP_NUMBER: '+221789251834',
  WHATSAPP_FORMATTED: '+221 78 925 18 34',
  EMAIL: 'info@sportbook.sn',
  LOCATION: 'Thiés, Sénégal',
} as const;

// Time Configuration
export const TIME = {
  OPENING_HOUR: 8,
  CLOSING_HOUR: 2, // 2 AM next day
  TIME_FORMAT: 'HH:MM',
} as const;

// UI Configuration
export const UI = {
  ITEMS_PER_PAGE: 10,
  DEBOUNCE_DELAY: 300, // ms
} as const;

