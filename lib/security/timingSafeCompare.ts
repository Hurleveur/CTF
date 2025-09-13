import { timingSafeEqual } from 'crypto';

/**
 * Performs a timing-safe comparison of two strings to prevent timing attacks.
 * 
 * This function is crucial for comparing sensitive data like passwords, tokens,
 * or other authentication-related strings where timing differences could reveal
 * information to an attacker.
 * 
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns true if strings are identical, false otherwise
 * 
 * @example
 * ```typescript
 * // Safe password comparison
 * if (timingSafeCompare(password, confirmPassword)) {
 *   // Passwords match
 * }
 * 
 * // Safe token validation
 * if (timingSafeCompare(providedToken, expectedToken)) {
 *   // Token is valid
 * }
 * ```
 * 
 * @security This function uses Node.js crypto.timingSafeEqual which performs
 * constant-time comparison to prevent timing attacks. The comparison time does
 * not depend on the number of matching characters between the inputs.
 */
export function timingSafeCompare(a: string, b: string): boolean {
  // Convert strings to UTF-8 buffers
  const bufferA = Buffer.from(a, 'utf8');
  const bufferB = Buffer.from(b, 'utf8');
  
  // Get the maximum length to ensure constant-time execution
  const maxLength = Math.max(bufferA.length, bufferB.length);
  
  // Pad both buffers to the same length with null bytes
  const paddedA = Buffer.alloc(maxLength);
  const paddedB = Buffer.alloc(maxLength);
  
  // Copy original buffers to padded buffers
  bufferA.copy(paddedA);
  bufferB.copy(paddedB);
  
  try {
    // Perform timing-safe comparison on padded buffers
    const buffersEqual = timingSafeEqual(paddedA, paddedB);
    
    // Only return true if buffers are equal AND original lengths match
    // This prevents attacks based on padding differences
    return buffersEqual && bufferA.length === bufferB.length;
  } catch {
    // In case of any error, return false for security
    // This should never happen with valid string inputs
    return false;
  }
}