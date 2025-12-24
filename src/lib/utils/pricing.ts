/**
 * Pricing utility for Petit Camp
 * Day rate (8h-18h): base price from field
 * Night rate (19h-2h): base price * 1.25 (25% more)
 * Duration options: 60 minutes (1h) or 90 minutes (1h30)
 */
import { PRICING } from '@/lib/config/constants';

/**
 * Calculate booking price based on start time, duration, and field's base price
 * 
 * @param startTime - Format: "HH:MM" (e.g., "08:00", "19:00", "00:00")
 * @param durationMinutes - 60 or 90 minutes
 * @param basePricePerHour - Base price per hour from field (day rate)
 * @returns Total price in FCFA
 */
export function calculateBookingPrice(
  startTime: string, 
  durationMinutes: number, 
  basePricePerHour: number = PRICING.DEFAULT_DAY_RATE
): number {
  const [hours] = startTime.split(':').map(Number);
  const hour = hours;
  
  // Determine if it's day rate (8h-18h) or night rate (19h-2h)
  // Note: 00:00 and 01:00 are considered night rate (next day)
  const isDayRate = hour >= PRICING.DAY_HOURS_START && hour < PRICING.DAY_HOURS_END;
  const hourlyRate = isDayRate 
    ? basePricePerHour 
    : Math.round(basePricePerHour * PRICING.NIGHT_RATE_MULTIPLIER);
  
  // Calculate total price
  const hoursDecimal = durationMinutes / 60;
  return Math.round(hourlyRate * hoursDecimal);
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return `${price.toLocaleString('fr-FR')} FCFA`;
}

/**
 * Get hourly rate based on time and field's base price
 */
export function getHourlyRate(
  time: string, 
  basePricePerHour: number = PRICING.DEFAULT_DAY_RATE
): number {
  const [hours] = time.split(':').map(Number);
  const hour = hours;
  const isDayRate = hour >= PRICING.DAY_HOURS_START && hour < PRICING.DAY_HOURS_END;
  return isDayRate 
    ? basePricePerHour 
    : Math.round(basePricePerHour * PRICING.NIGHT_RATE_MULTIPLIER);
}

/**
 * Check if a time slot is day rate or night rate
 */
export function isDayRate(time: string): boolean {
  const [hours] = time.split(':').map(Number);
  return hours >= PRICING.DAY_HOURS_START && hours < PRICING.DAY_HOURS_END;
}

