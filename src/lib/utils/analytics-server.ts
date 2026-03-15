/**
 * Server-side analytics helper
 * For server-side events, we just log them
 * Vercel Analytics is client-side only, so server events are logged for debugging
 */
import { EventCategory, EventName } from './analytics';

/**
 * Track analytics event server-side
 * Since Vercel Analytics is client-side, we just log server events
 * You can extend this later to send to a service like PostHog, Mixpanel, etc.
 */
export async function trackEventServer(
  category: EventCategory,
  name: EventName,
  properties?: Record<string, any>,
  userId?: string
): Promise<void> {
  try {
    // Log server-side events (Vercel Analytics is client-side only)
    // In production, you might want to send these to a service like PostHog
    console.log(`[Analytics Server] ${category}.${name}`, { userId, ...properties });
  } catch (error) {
    // Silently fail - analytics shouldn't break the app
    console.debug('Server analytics tracking failed:', error);
  }
}

