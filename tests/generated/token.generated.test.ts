/**
 * Generated Token Format Tests
 * DO NOT EDIT - Generated from spec/vendor-portal-rules.yaml
 * Regenerate with: npm run generate:spec
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import {
  generateToken,
  generateHash,
  studentToken,
  teacherToken,
  parentToken,
  tokenizedEmail,
  tokenizedPhone,
  parseToken,
  isValidToken,
  registerToken,
  detokenize,
  clearTokenStore,
  TOKEN_PATTERNS,
  type TokenType,
} from '../../lib/tokens';

// =============================================================================
// Student Token Tests
// =============================================================================

describe('Generated: Student Token', () => {
  const TOKEN_PATTERN = /TKN_STU_[A-Z0-9]{8}/;

  beforeEach(() => {
    clearTokenStore();
  });

  describe('Format Preservation', () => {
    it('should match expected format: TKN_STU_{hash:8}', () => {
      // Example token should match pattern
      const exampleToken = 'TKN_STU_8X9Y2Z3A';
      expect(exampleToken).toMatch(TOKEN_PATTERN);
    });

    it('generated tokens should always match pattern (property)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.nat({ max: 1000 }),
          (schoolId, index) => {
            const token = studentToken(schoolId, index);
            return TOKEN_PATTERN.test(token);
          }
        )
      );
    });
  });

  describe('Injectivity (no collisions)', () => {
    it('different inputs produce different tokens (property)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.nat({ max: 100 }),
          fc.nat({ max: 100 }),
          (schoolId, index1, index2) => {
            if (index1 === index2) return true; // Skip equal inputs
            const token1 = studentToken(schoolId, index1);
            const token2 = studentToken(schoolId, index2);
            return token1 !== token2;
          }
        )
      );
    });

    it('same hash function is deterministic', () => {
      const seed = 'test-seed-123';
      const hash1 = generateHash(seed);
      const hash2 = generateHash(seed);
      expect(hash1).toBe(hash2);
    });
  });

  describe('Roundtrip', () => {
    it('tokenize then detokenize returns original (property)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.nat({ max: 100 }),
          (schoolId, index) => {
            const originalValue = `Student ${schoolId}-${index}`;
            const token = studentToken(schoolId, index);
            registerToken(token, originalValue);
            const restored = detokenize(token);
            return restored === originalValue;
          }
        )
      );
    });

    it('parseToken correctly extracts token components', () => {
      const token = studentToken('test-school', 42);
      const parsed = parseToken(token);
      expect(parsed).not.toBeNull();
      expect(parsed?.type).toBe('STU');
      expect(parsed?.hash).toHaveLength(8);
    });

    it('isValidToken validates student tokens', () => {
      const token = studentToken('school', 0);
      expect(isValidToken(token)).toBe(true);
      expect(isValidToken(token, 'STU')).toBe(true);
      expect(isValidToken(token, 'TCH')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('Empty student ID still produces valid token', () => {
      const token = studentToken('', 0);
      expect(isValidToken(token, 'STU')).toBe(true);
    });

    it('Very long school ID still produces 8-char hash', () => {
      const longSchoolId = 'school_with_extremely_long_identifier_12345678901234567890';
      const token = studentToken(longSchoolId, 0);
      expect(isValidToken(token, 'STU')).toBe(true);
      const parsed = parseToken(token);
      expect(parsed?.hash).toHaveLength(8);
    });

    it('Special characters in school ID are handled', () => {
      const token = studentToken('school-with_special.chars!', 0);
      expect(isValidToken(token, 'STU')).toBe(true);
    });

    it('Unicode characters in school ID are handled', () => {
      const token = studentToken('中文学校', 0);
      expect(isValidToken(token, 'STU')).toBe(true);
    });
  });
});

// =============================================================================
// Teacher Token Tests
// =============================================================================

describe('Generated: Teacher Token', () => {
  const TOKEN_PATTERN = /TKN_TCH_[A-Z0-9]{8}/;

  beforeEach(() => {
    clearTokenStore();
  });

  describe('Format Preservation', () => {
    it('should match expected format: TKN_TCH_{hash:8}', () => {
      // Example token should match pattern
      const exampleToken = 'TKN_TCH_7B8C9D0E';
      expect(exampleToken).toMatch(TOKEN_PATTERN);
    });

    it('generated tokens should always match pattern (property)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.nat({ max: 1000 }),
          (schoolId, index) => {
            const token = teacherToken(schoolId, index);
            return TOKEN_PATTERN.test(token);
          }
        )
      );
    });
  });

  describe('Injectivity (no collisions)', () => {
    it('different inputs produce different tokens (property)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.nat({ max: 100 }),
          fc.nat({ max: 100 }),
          (schoolId, index1, index2) => {
            if (index1 === index2) return true; // Skip equal inputs
            const token1 = teacherToken(schoolId, index1);
            const token2 = teacherToken(schoolId, index2);
            return token1 !== token2;
          }
        )
      );
    });
  });

  describe('Roundtrip', () => {
    it('tokenize then detokenize returns original', () => {
      const originalValue = 'Ms. Johnson';
      const token = teacherToken('school-1', 0);
      registerToken(token, originalValue);
      const restored = detokenize(token);
      expect(restored).toBe(originalValue);
    });

    it('parseToken correctly extracts teacher token components', () => {
      const token = teacherToken('test-school', 5);
      const parsed = parseToken(token);
      expect(parsed).not.toBeNull();
      expect(parsed?.type).toBe('TCH');
    });
  });
});

// =============================================================================
// Parent Token Tests
// =============================================================================

describe('Generated: Parent Token', () => {
  const TOKEN_PATTERN = /TKN_PAR_[A-Z0-9]{8}/;

  beforeEach(() => {
    clearTokenStore();
  });

  describe('Format Preservation', () => {
    it('should match expected format: TKN_PAR_{hash:8}', () => {
      // Example token should match pattern
      const exampleToken = 'TKN_PAR_1F2G3H4I';
      expect(exampleToken).toMatch(TOKEN_PATTERN);
    });

    it('generated tokens should always match pattern (property)', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 100 }),
          (index) => {
            const stuToken = studentToken('test-school', index);
            const token = parentToken(stuToken, 0);
            return TOKEN_PATTERN.test(token);
          }
        )
      );
    });
  });

  describe('Injectivity (no collisions)', () => {
    it('different parent indices produce different tokens', () => {
      const stuToken = studentToken('test-school', 0);
      const parent1 = parentToken(stuToken, 0);
      const parent2 = parentToken(stuToken, 1);
      expect(parent1).not.toBe(parent2);
    });
  });

  describe('Roundtrip', () => {
    it('tokenize then detokenize returns original', () => {
      const stuToken = studentToken('school', 0);
      const originalValue = 'John Doe (Parent)';
      const token = parentToken(stuToken, 0);
      registerToken(token, originalValue);
      const restored = detokenize(token);
      expect(restored).toBe(originalValue);
    });

    it('parseToken correctly extracts parent token components', () => {
      const stuToken = studentToken('school', 0);
      const token = parentToken(stuToken, 0);
      const parsed = parseToken(token);
      expect(parsed).not.toBeNull();
      expect(parsed?.type).toBe('PAR');
    });
  });
});

// =============================================================================
// Email Token Tests
// =============================================================================

describe('Generated: Email Token', () => {
  const TOKEN_PATTERN = /TKN_STU_[A-Z0-9]{8}@relay\.schoolday\.lausd\.net/;

  beforeEach(() => {
    clearTokenStore();
  });

  describe('Format Preservation', () => {
    it('should match expected format: TKN_STU_{hash:8}@relay.schoolday.lausd.net', () => {
      // Example token should match pattern
      const exampleToken = 'TKN_STU_8X9Y2Z3A@relay.schoolday.lausd.net';
      expect(exampleToken).toMatch(TOKEN_PATTERN);
    });

    it('generated tokens should always match pattern (property)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.nat({ max: 100 }),
          (schoolId, index) => {
            const stuToken = studentToken(schoolId, index);
            const email = tokenizedEmail(stuToken);
            // Email pattern uses lowercase
            return /^TKN_STU_[a-z0-9]+@relay\.schoolday\.lausd\.net$/.test(email);
          }
        )
      );
    });
  });

  describe('Injectivity (no collisions)', () => {
    it('different students produce different emails', () => {
      const stu1 = studentToken('school', 0);
      const stu2 = studentToken('school', 1);
      const email1 = tokenizedEmail(stu1);
      const email2 = tokenizedEmail(stu2);
      expect(email1).not.toBe(email2);
    });
  });
});

// =============================================================================
// Phone Token Tests
// =============================================================================

describe('Generated: Phone Token', () => {
  const TOKEN_PATTERN = /TKN_555_[0-9]{3}_[0-9]{4}/;

  beforeEach(() => {
    clearTokenStore();
  });

  describe('Format Preservation', () => {
    it('should match expected format: TKN_555_{hash:3}_{hash:4}', () => {
      // Example token should match pattern
      const exampleToken = 'TKN_555_123_4567';
      expect(exampleToken).toMatch(TOKEN_PATTERN);
    });

    it('generated tokens should always match pattern (property)', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 50 }), (seed) => {
          const phone = tokenizedPhone(seed);
          return TOKEN_PATTERN.test(phone);
        })
      );
    });
  });
});

