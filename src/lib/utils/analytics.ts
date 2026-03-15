/**
 * Client-side analytics stubs (track events for analytics provider)
 */

export function trackPageView(name: string, _props?: Record<string, unknown>) {
  if (typeof window !== 'undefined') {
    // console.debug('trackPageView', name, _props);
  }
}

export function trackAuth(_event: string, _props?: Record<string, unknown>) {
  if (typeof window !== 'undefined') {
    // console.debug('trackAuth', _event, _props);
  }
}

export function trackAction(_event: string, _label?: string) {
  if (typeof window !== 'undefined') {
    // console.debug('trackAction', _event, _label);
  }
}

export function trackField(_event: string, _props?: Record<string, unknown>) {
  if (typeof window !== 'undefined') {
    // console.debug('trackField', _event, _props);
  }
}

export function trackPayment(_event: string, _props?: Record<string, unknown>) {
  if (typeof window !== 'undefined') {
    // console.debug('trackPayment', _event, _props);
  }
}

export function trackBooking(_event: string, _props?: Record<string, unknown>) {
  if (typeof window !== 'undefined') {
    // console.debug('trackBooking', _event, _props);
  }
}
