/**
 * Simple analytics utility using Vercel Analytics
 * No database required - all events tracked via Vercel Analytics dashboard
 */

export type EventCategory = 
  | 'page_view'
  | 'user_action'
  | 'booking'
  | 'auth'
  | 'field'
  | 'payment';

export type EventName =
  // Page views
  | 'page_viewed'
  // User actions
  | 'button_clicked'
  | 'link_clicked'
  | 'form_started'
  | 'form_submitted'
  // Booking events
  | 'booking_created'
  | 'booking_cancelled'
  | 'booking_confirmed'
  | 'booking_viewed'
  | 'field_viewed'
  | 'availability_checked'
  // Auth events
  | 'user_registered'
  | 'user_logged_in'
  | 'user_logged_out'
  | 'login_failed'
  | 'registration_failed'
  // Payment events
  | 'payment_method_selected'
  | 'payment_initiated'
  | 'payment_completed'
  | 'payment_failed'
  // Review events
  | 'review_submitted'
  | 'review_edited'
  | 'rating_given';

/**
 * Track an analytics event (client-side only)
 * Uses Vercel Analytics - no database required!
 * Events appear in your Vercel Analytics dashboard
 * Non-blocking - doesn't throw errors
 */
export async function trackEvent(
  category: EventCategory,
  name: EventName,
  properties?: Record<string, any>
): Promise<void> {
  // Only run on client-side
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // Dynamically import Vercel Analytics (client-side only)
    const { track } = await import('@vercel/analytics');
    
    // Get user ID from localStorage if available
    let userId: string | undefined;
    const authData = localStorage.getItem('auth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        if (parsed.user?.id) {
          userId = parsed.user.id;
        }
      } catch {
        // Ignore parse errors
      }
    }

    // Track with Vercel Analytics
    // Format: category.name (e.g., "booking.booking_created")
    track(`${category}.${name}`, {
      ...properties,
      userId,
      url: window.location.pathname,
    });
  } catch (error) {
    // Silently fail - analytics shouldn't break the app
    // In development, Vercel Analytics might not be available
    console.debug('Analytics tracking failed:', error);
  }
}

/**
 * Track page view
 * Vercel Analytics automatically tracks page views via Next.js router
 * This is just for custom page tracking if needed
 */
export function trackPageView(page: string, properties?: Record<string, any>): void {
  trackEvent('page_view', 'page_viewed', {
    page,
    ...properties,
  });
}

/**
 * Track user action (button click, link click, etc.)
 */
export function trackAction(
  action: 'button_clicked' | 'link_clicked',
  target: string,
  properties?: Record<string, any>
): void {
  trackEvent('user_action', action, {
    target,
    ...properties,
  });
}

/**
 * Track booking events
 */
export function trackBooking(
  event: 'booking_created' | 'booking_cancelled' | 'booking_confirmed' | 'booking_viewed',
  properties?: Record<string, any>
): void {
  trackEvent('booking', event, properties);
}

/**
 * Track authentication events
 */
export function trackAuth(
  event: 'user_registered' | 'user_logged_in' | 'user_logged_out' | 'login_failed' | 'registration_failed',
  properties?: Record<string, any>
): void {
  trackEvent('auth', event, properties);
}

/**
 * Track field-related events
 */
export function trackField(
  event: 'field_viewed' | 'availability_checked',
  fieldId: string,
  properties?: Record<string, any>
): void {
  trackEvent('field', event, {
    field_id: fieldId,
    ...properties,
  });
}

/**
 * Track payment events
 */
export function trackPayment(
  event: 'payment_method_selected' | 'payment_initiated' | 'payment_completed' | 'payment_failed',
  properties?: Record<string, any>
): void {
  trackEvent('payment', event, properties);
}

/**
 * Track review/rating events
 */
export function trackReview(
  event: 'review_submitted' | 'review_edited' | 'rating_given',
  properties?: Record<string, any>
): void {
  trackEvent('field', event, properties);
}

