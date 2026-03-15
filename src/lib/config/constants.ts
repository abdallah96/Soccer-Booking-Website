/**
 * App config constants (pricing, contact, field config)
 */

export const PRICING = {
  DEFAULT_DAY_RATE: 20000,
  DAY_HOURS_START: 8,
  DAY_HOURS_END: 18,
  NIGHT_RATE_MULTIPLIER: 1.25,
} as const;

export const CONTACT = {
  WHATSAPP_NUMBER: '+491776287739',
} as const;

export const FIELD_CONFIG = {
  PETIT_CAMP_NAME: 'Petit Camp',
  PETIT_CAMP_CAPACITY: 18,
} as const;
