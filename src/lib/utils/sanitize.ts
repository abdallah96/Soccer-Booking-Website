/**
 * Input sanitization utilities
 */

/**
 * Sanitize string input - remove dangerous characters
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .slice(0, 1000); // Limit length
}

/**
 * Sanitize email - basic validation and sanitization
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') {
    return '';
  }

  return email
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9@._-]/g, '') // Remove invalid characters
    .slice(0, 255); // Email max length
}

/**
 * Sanitize phone number
 */
export function sanitizePhone(phone: string | null | undefined): string | null {
  if (!phone || typeof phone !== 'string') {
    return null;
  }

  // Keep only digits, +, spaces, and hyphens
  const sanitized = phone.replace(/[^\d+\s-]/g, '').trim().slice(0, 20);

  return sanitized || null;
}

/**
 * Sanitize UUID
 */
export function sanitizeUUID(uuid: string): string | null {
  if (typeof uuid !== 'string') {
    return null;
  }

  // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(uuid)) {
    return null;
  }

  return uuid;
}

/**
 * Sanitize date string (YYYY-MM-DD)
 */
export function sanitizeDate(date: string): string | null {
  if (typeof date !== 'string') {
    return null;
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  
  if (!dateRegex.test(date)) {
    return null;
  }

  // Validate it's a valid date
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) {
    return null;
  }

  return date;
}

/**
 * Sanitize time string (HH:MM)
 */
export function sanitizeTime(time: string): string | null {
  if (typeof time !== 'string') {
    return null;
  }

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  
  if (!timeRegex.test(time)) {
    return null;
  }

  return time;
}

/**
 * Sanitize number
 */
export function sanitizeNumber(value: unknown, min?: number, max?: number): number | null {
  const num = typeof value === 'string' ? parseFloat(value) : typeof value === 'number' ? value : null;

  if (num === null || isNaN(num)) {
    return null;
  }

  if (min !== undefined && num < min) {
    return null;
  }

  if (max !== undefined && num > max) {
    return null;
  }

  return num;
}

