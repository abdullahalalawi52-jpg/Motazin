/**
 * Generates a random alphanumeric ID of specified length as a fallback for crypto.randomUUID.
 */
function fallbackRandomId(length = 9): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const randomValues = new Uint32Array(length);
    window.crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return result;
}

/**
 * Generates a random 9-character ID securely using crypto.randomUUID if available,
 * or a secure fallback if not (e.g., on older browsers or non-secure HTTP contexts).
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID().replace(/-/g, '').substring(0, 9);
    } catch (e) {
      // Fallback if randomUUID fails
    }
  }
  return fallbackRandomId(9);
}
