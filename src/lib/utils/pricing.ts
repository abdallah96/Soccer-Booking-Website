/**
 * Pricing utility for Petit Camp
 * Day rate (8h-18h): 20,000 FCFA/hour
 * Night rate (19h-2h): 25,000 FCFA/hour
 * Duration options: 60 minutes (1h) or 90 minutes (1h30)
 */

/**
 * Calculate booking price based on start time and duration
 * 
 * @param startTime - Format: "HH:MM" (e.g., "08:00", "19:00", "00:00")
 * @param durationMinutes - 60 or 90 minutes
 * @returns Total price in FCFA
 */
export function calculateBookingPrice(startTime: string, durationMinutes: number): number {
  const [hours, minutes] = startTime.split(':').map(Number);
  const hour = hours;
  
  // Determine if it's day rate (8h-18h) or night rate (19h-2h)
  // Note: 00:00 and 01:00 are considered night rate (next day)
  const isDayRate = hour >= 8 && hour < 19;
  const hourlyRate = isDayRate ? 20000 : 25000;
  
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
 * Get hourly rate based on time
 */
export function getHourlyRate(time: string): number {
  const [hours] = time.split(':').map(Number);
  const hour = hours;
  return (hour >= 8 && hour < 19) ? 20000 : 25000;
}

/**
 * Check if a time slot is day rate or night rate
 */
export function isDayRate(time: string): boolean {
  const [hours] = time.split(':').map(Number);
  return hours >= 8 && hours < 19;
}

