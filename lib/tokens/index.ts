/**
 * Token Generation Utilities
 *
 * This module provides deterministic token generation for privacy-safe data handling.
 * All functions are pure and deterministic - same input always produces same output.
 *
 * Token Formats:
 *   - Student:    TKN_STU_{8-char hash}
 *   - Teacher:    TKN_TCH_{8-char hash}
 *   - Parent:     TKN_PAR_{8-char hash}
 *   - School:     TKN_SCH_{8-char hash}
 *   - Class:      TKN_CLS_{8-char hash}
 *   - Enrollment: TKN_ENR_{8-char hash}
 *
 * @module lib/tokens
 */

// =============================================================================
// CORE HASH GENERATION
// =============================================================================

/**
 * Generate a deterministic 8-character hash from a seed string.
 * Uses a simple 32-bit hash with base-36 encoding.
 *
 * @param seed - Input string to hash
 * @returns 8-character uppercase alphanumeric hash
 */
export function generateHash(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Convert to base36 and ensure 8 characters
  const base36 = Math.abs(hash).toString(36).toUpperCase();
  const padded = (base36 + '00000000').slice(0, 8);
  return padded;
}

// =============================================================================
// TOKEN GENERATION FUNCTIONS
// =============================================================================

export type TokenType = 'STU' | 'TCH' | 'PAR' | 'SCH' | 'CLS' | 'ENR' | 'ADM';

/**
 * Generate a token with the specified type prefix.
 *
 * @param type - Token type (STU, TCH, PAR, etc.)
 * @param seed - Seed for deterministic hash generation
 * @returns Token in format TKN_{TYPE}_{8-char hash}
 */
export function generateToken(type: TokenType, seed: string): string {
  return `TKN_${type}_${generateHash(seed)}`;
}

/**
 * Generate a student token.
 * @param schoolId - School identifier
 * @param index - Student index within school
 */
export function studentToken(schoolId: string, index: number): string {
  return generateToken('STU', `student_${schoolId}_${index}`);
}

/**
 * Generate a teacher token.
 * @param schoolId - School identifier
 * @param index - Teacher index within school
 */
export function teacherToken(schoolId: string, index: number): string {
  return generateToken('TCH', `teacher_${schoolId}_${index}`);
}

/**
 * Generate a parent token.
 * @param studentToken - Associated student's token
 * @param index - Parent index (0 = primary, 1 = secondary)
 */
export function parentToken(studentToken: string, index: number): string {
  return generateToken('PAR', `parent_${studentToken}_${index}`);
}

/**
 * Generate a school token.
 * @param schoolName - School name
 */
export function schoolToken(schoolName: string): string {
  return generateToken('SCH', `school_${schoolName}`);
}

/**
 * Generate a class token.
 * @param schoolId - School identifier
 * @param subject - Subject name
 * @param period - Period number
 */
export function classToken(
  schoolId: string,
  subject: string,
  period: number
): string {
  return generateToken('CLS', `class_${schoolId}_${subject}_${period}`);
}

/**
 * Generate an enrollment token.
 * @param studentToken - Student's token
 * @param classToken - Class's token
 */
export function enrollmentToken(
  studentToken: string,
  classToken: string
): string {
  return generateToken('ENR', `enrollment_${studentToken}_${classToken}`);
}

// =============================================================================
// TOKENIZED EMAIL/PHONE
// =============================================================================

/**
 * Generate a tokenized email address.
 * @param token - User token (TKN_STU_xxx or TKN_TCH_xxx)
 * @returns Tokenized email at relay domain
 */
export function tokenizedEmail(token: string): string {
  // Extract hash from token and use lowercase for email
  const match = token.match(/^TKN_(STU|TCH|PAR|ADM)_([A-Z0-9]{8})$/);
  if (!match) {
    throw new Error(`Invalid token format: ${token}`);
  }
  const [, type, hash] = match;
  return `TKN_${type}_${hash.toLowerCase()}@relay.schoolday.lausd.net`;
}

/**
 * Generate a tokenized phone number.
 * Uses 555 prefix (reserved for fictional use).
 * @param seed - Seed for deterministic generation
 * @returns Tokenized phone in format TKN_555_XXX_XXXX
 */
export function tokenizedPhone(seed: string): string {
  const hash = generateHash(seed);
  // Use first 3 chars for area-like portion, last 4 for number
  const area = hash.slice(0, 3).replace(/[^0-9]/g, '0').padEnd(3, '0');
  const number = hash.slice(3, 7).replace(/[^0-9]/g, '0').padEnd(4, '0');
  return `TKN_555_${area}_${number}`;
}

// =============================================================================
// TOKEN PARSING & VALIDATION
// =============================================================================

export interface ParsedToken {
  type: TokenType;
  hash: string;
  original: string;
}

/**
 * Parse a token into its components.
 * @param token - Token string to parse
 * @returns Parsed token or null if invalid
 */
export function parseToken(token: string): ParsedToken | null {
  const match = token.match(/^TKN_(STU|TCH|PAR|SCH|CLS|ENR|ADM)_([A-Z0-9]{8})$/);
  if (!match) {
    return null;
  }
  return {
    type: match[1] as TokenType,
    hash: match[2],
    original: token,
  };
}

/**
 * Validate a token format.
 * @param token - Token to validate
 * @param expectedType - Optional: expected token type
 * @returns true if valid
 */
export function isValidToken(token: string, expectedType?: TokenType): boolean {
  const parsed = parseToken(token);
  if (!parsed) return false;
  if (expectedType && parsed.type !== expectedType) return false;
  return true;
}

// =============================================================================
// TOKEN PATTERNS (for testing/validation)
// =============================================================================

export const TOKEN_PATTERNS = {
  student: /^TKN_STU_[A-Z0-9]{8}$/,
  teacher: /^TKN_TCH_[A-Z0-9]{8}$/,
  parent: /^TKN_PAR_[A-Z0-9]{8}$/,
  school: /^TKN_SCH_[A-Z0-9]{8}$/,
  class: /^TKN_CLS_[A-Z0-9]{8}$/,
  enrollment: /^TKN_ENR_[A-Z0-9]{8}$/,
  admin: /^TKN_ADM_[A-Z0-9]{8}$/,
  email_student: /^TKN_STU_[a-z0-9]+@relay\.schoolday\.lausd\.net$/,
  email_teacher: /^TKN_TCH_[a-z0-9]+@relay\.schoolday\.lausd\.net$/,
  phone: /^TKN_555_[0-9]{3}_[0-9]{4}$/,
} as const;

// =============================================================================
// DETOKENIZATION (Lookup-based, requires token store)
// =============================================================================

// Token store for reverse lookups (populated by synthetic data or real DB)
const tokenStore = new Map<string, string>();

/**
 * Register a token-to-value mapping for detokenization.
 * @param token - The token
 * @param value - The original value
 */
export function registerToken(token: string, value: string): void {
  tokenStore.set(token, value);
}

/**
 * Detokenize a token back to its original value.
 * Requires the token to have been registered.
 * @param token - Token to detokenize
 * @returns Original value or null if not found
 */
export function detokenize(token: string): string | null {
  return tokenStore.get(token) ?? null;
}

/**
 * Clear all registered tokens.
 * Useful for testing.
 */
export function clearTokenStore(): void {
  tokenStore.clear();
}

/**
 * Get the number of registered tokens.
 */
export function getTokenStoreSize(): number {
  return tokenStore.size;
}
