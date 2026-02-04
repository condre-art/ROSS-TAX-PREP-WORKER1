/**
 * Sanitization utilities for user input
 * Prevents XSS, SQL injection, and other security vulnerabilities
 */

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string | null | undefined): string {
  if (!input) return '';
  
  return String(input)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string | null | undefined): string {
  if (!email) return '';
  
  const sanitized = sanitizeString(email);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format');
  }
  
  return sanitized.toLowerCase();
}

/**
 * Sanitize phone number
 */
export function sanitizePhone(phone: string | null | undefined): string {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  const cleaned = String(phone).replace(/\D/g, '');
  
  // Validate 10-digit US phone number
  if (cleaned.length !== 10) {
    throw new Error('Invalid phone number format');
  }
  
  return cleaned;
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(value: any): number {
  const num = parseFloat(String(value));
  
  if (isNaN(num)) {
    throw new Error('Invalid numeric value');
  }
  
  return num;
}

/**
 * Sanitize SQL input (for use with parameterized queries)
 */
export function sanitizeSQLInput(input: string | null | undefined): string {
  if (!input) return '';
  
  // Remove SQL special characters
  return String(input)
    .replace(/;/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    .replace(/xp_/g, '')
    .replace(/sp_/g, '')
    .trim();
}
