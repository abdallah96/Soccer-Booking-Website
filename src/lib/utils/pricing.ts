/**
 * Pricing utility for Petit Camp
 * Supports custom pricing rules (weekday/weekend/hour ranges)
 * Priority: custom rule > default night/day rate
 */
import { PRICING } from '@/lib/config/constants';

export interface PricingRule {
  id: string;
  field_id: string;
  name: string;
  day_type: 'weekday' | 'weekend' | 'all';
  hour_start: number;
  hour_end: number;
  price_per_hour: number;
  is_active: boolean;
}

export function findMatchingRule(
  startTime: string,
  date: string,
  rules: PricingRule[]
): PricingRule | null {
  if (!rules || rules.length === 0) return null;
  const [hours] = startTime.split(':').map(Number);
  const dayOfWeek = new Date(date + 'T12:00:00').getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const active = rules.filter(r => r.is_active);
  const matched = active
    .filter(r => {
      if (r.day_type === 'weekday' && isWeekend) return false;
      if (r.day_type === 'weekend' && !isWeekend) return false;
      if (r.hour_end > r.hour_start) return hours >= r.hour_start && hours < r.hour_end;
      return hours >= r.hour_start || hours < r.hour_end;
    })
    .sort((a, b) => (b.day_type === 'all' ? 0 : 1) - (a.day_type === 'all' ? 0 : 1));
  return matched[0] ?? null;
}

function getDefaultRate(startTime: string, base: number): number {
  const [h] = startTime.split(':').map(Number);
  const isDay = h >= PRICING.DAY_HOURS_START && h < PRICING.DAY_HOURS_END;
  return isDay ? base : Math.round(base * PRICING.NIGHT_RATE_MULTIPLIER);
}

export function calculateBookingPrice(
  startTime: string,
  durationMinutes: number,
  basePricePerHour: number = PRICING.DEFAULT_DAY_RATE,
  rules?: PricingRule[],
  date?: string
): number {
  let rate: number;
  if (rules && rules.length > 0 && date) {
    const rule = findMatchingRule(startTime, date, rules);
    rate = rule ? rule.price_per_hour : getDefaultRate(startTime, basePricePerHour);
  } else {
    rate = getDefaultRate(startTime, basePricePerHour);
  }
  return Math.round(rate * (durationMinutes / 60));
}

export function formatPrice(price: number): string {
  return `${price.toLocaleString('fr-FR')} FCFA`;
}

export function getHourlyRate(
  time: string,
  basePricePerHour: number = PRICING.DEFAULT_DAY_RATE,
  rules?: PricingRule[],
  date?: string
): number {
  if (rules && rules.length > 0 && date) {
    const rule = findMatchingRule(time, date, rules);
    if (rule) return rule.price_per_hour;
  }
  return getDefaultRate(time, basePricePerHour);
}

export function isDayRate(time: string): boolean {
  const [h] = time.split(':').map(Number);
  return h >= PRICING.DAY_HOURS_START && h < PRICING.DAY_HOURS_END;
}
