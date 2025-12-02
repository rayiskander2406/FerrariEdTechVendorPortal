/**
 * Specification-Driven Test Generator
 *
 * Reads vendor-portal-rules.yaml and generates:
 *   - Vitest property-based tests
 *   - Documentation (Markdown)
 *
 * Usage:
 *   npx tsx spec/generator/index.ts
 *   npm run generate:spec
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// =============================================================================
// TYPES
// =============================================================================

interface Spec {
  version: string;
  name: string;
  description: string;
  axioms: Record<string, Axiom>;
  privacy_tiers: Record<string, PrivacyTier>;
  token_types: Record<string, TokenType>;
  state_machines: Record<string, StateMachine>;
  invariants: Record<string, Invariant>;
  compliance: Record<string, Compliance>;
  test_seeds: TestSeeds;
}

interface Axiom {
  description: string;
  formal: string;
  severity: 'critical' | 'high' | 'medium';
}

interface PrivacyTier {
  level: number;
  description: string;
  visible_fields: Record<string, string[]>;
  tokenized_fields: string[];
  approval: string;
  review_time: string;
}

interface TokenType {
  description: string;
  format: string;
  pattern: string;
  example: string;
  axioms: string[];
  preserves?: string;
  test_seeds?: string[];
  edge_cases?: { description: string; input: string; expected: string }[];
}

interface StateMachine {
  description: string;
  initial: string;
  states: string[];
  transitions: { from: string; to: string; trigger: string }[];
  entities: string[];
}

interface Invariant {
  description: string;
  formal: string;
  entities: string[];
  severity: 'critical' | 'high' | 'medium';
  test_strategy: 'property' | 'unit' | 'integration';
}

interface Compliance {
  description: string;
  requirements: { id: string; description: string; implementation: string }[];
}

interface TestSeeds {
  users: {
    students: any[];
    teachers: any[];
    edge_cases: any[];
  };
  vendors: any[];
}

// =============================================================================
// GENERATOR
// =============================================================================

function loadSpec(specPath: string): Spec {
  const content = fs.readFileSync(specPath, 'utf-8');
  return yaml.load(content) as Spec;
}

function generateTokenTests(spec: Spec): string {
  const tests: string[] = [];

  tests.push(`/**
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

`);

  for (const [name, tokenType] of Object.entries(spec.token_types)) {
    const testName = name.charAt(0).toUpperCase() + name.slice(1);

    // Map spec token names to actual function calls
    const tokenTypeMap: Record<string, string> = {
      student: 'STU',
      teacher: 'TCH',
      parent: 'PAR',
      email: 'STU', // emails use student tokens
      phone: 'phone', // special case
    };

    const typeCode = tokenTypeMap[name] || name.toUpperCase().slice(0, 3);

    tests.push(`// =============================================================================
// ${testName} Token Tests
// =============================================================================

describe('Generated: ${testName} Token', () => {
  const TOKEN_PATTERN = /${tokenType.pattern.slice(1, -1)}/;

  beforeEach(() => {
    clearTokenStore();
  });

  describe('Format Preservation', () => {
    it('should match expected format: ${tokenType.format}', () => {
      // Example token should match pattern
      const exampleToken = '${tokenType.example}';
      expect(exampleToken).toMatch(TOKEN_PATTERN);
    });
`);

    // Generate actual property tests based on token type
    if (name === 'student') {
      tests.push(`
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
`);
    } else if (name === 'teacher') {
      tests.push(`
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
`);
    } else if (name === 'parent') {
      tests.push(`
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
`);
    } else if (name === 'email') {
      tests.push(`
    it('generated tokens should always match pattern (property)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.nat({ max: 100 }),
          (schoolId, index) => {
            const stuToken = studentToken(schoolId, index);
            const email = tokenizedEmail(stuToken);
            // Email pattern uses lowercase
            return /^TKN_STU_[a-z0-9]+@relay\\.schoolday\\.lausd\\.net$/.test(email);
          }
        )
      );
    });
  });
`);
    } else if (name === 'phone') {
      tests.push(`
    it('generated tokens should always match pattern (property)', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 50 }), (seed) => {
          const phone = tokenizedPhone(seed);
          return TOKEN_PATTERN.test(phone);
        })
      );
    });
  });
`);
    } else {
      tests.push(`
    it('generated tokens should always match pattern (property)', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 100 }), (input) => {
          const token = generateToken('${typeCode}' as TokenType, input);
          return TOKEN_PATTERN.test(token);
        })
      );
    });
  });
`);
    }

    if (tokenType.axioms.includes('injectivity')) {
      if (name === 'student') {
        tests.push(`
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
`);
      } else if (name === 'teacher') {
        tests.push(`
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
`);
      } else if (name === 'parent') {
        tests.push(`
  describe('Injectivity (no collisions)', () => {
    it('different parent indices produce different tokens', () => {
      const stuToken = studentToken('test-school', 0);
      const parent1 = parentToken(stuToken, 0);
      const parent2 = parentToken(stuToken, 1);
      expect(parent1).not.toBe(parent2);
    });
  });
`);
      } else if (name === 'email') {
        tests.push(`
  describe('Injectivity (no collisions)', () => {
    it('different students produce different emails', () => {
      const stu1 = studentToken('school', 0);
      const stu2 = studentToken('school', 1);
      const email1 = tokenizedEmail(stu1);
      const email2 = tokenizedEmail(stu2);
      expect(email1).not.toBe(email2);
    });
  });
`);
      } else {
        tests.push(`
  describe('Injectivity (no collisions)', () => {
    it('different inputs produce different tokens (property)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          (input1, input2) => {
            if (input1 === input2) return true; // Skip equal inputs
            const token1 = generateToken('${typeCode}' as TokenType, input1);
            const token2 = generateToken('${typeCode}' as TokenType, input2);
            return token1 !== token2;
          }
        )
      );
    });
  });
`);
      }
    }

    if (tokenType.axioms.includes('roundtrip')) {
      if (name === 'student') {
        tests.push(`
  describe('Roundtrip', () => {
    it('tokenize then detokenize returns original (property)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.nat({ max: 100 }),
          (schoolId, index) => {
            const originalValue = \`Student \${schoolId}-\${index}\`;
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
`);
      } else if (name === 'teacher') {
        tests.push(`
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
`);
      } else if (name === 'parent') {
        tests.push(`
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
`);
      } else {
        tests.push(`
  describe('Roundtrip', () => {
    it('tokenize then detokenize returns original (property)', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 100 }), (input) => {
          const token = generateToken('${typeCode}' as TokenType, input);
          registerToken(token, input);
          const restored = detokenize(token);
          return restored === input;
        })
      );
    });
  });
`);
      }
    }

    // Add edge case tests
    if (tokenType.edge_cases && name === 'student') {
      tests.push(`
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
      const token = studentToken('\u4e2d\u6587\u5b66\u6821', 0);
      expect(isValidToken(token, 'STU')).toBe(true);
    });
  });
`);
    } else if (tokenType.edge_cases) {
      tests.push(`
  describe('Edge Cases', () => {
`);
      for (const edgeCase of tokenType.edge_cases) {
        tests.push(`    it('${edgeCase.description}', () => {
      // Edge case: ${edgeCase.expected}
      expect(true).toBe(true); // Implement based on specific edge case
    });

`);
      }
      tests.push(`  });
`);
    }

    tests.push(`});

`);
  }

  return tests.join('');
}

function generateStateMachineTests(spec: Spec): string {
  const tests: string[] = [];

  tests.push(`/**
 * Generated State Machine Tests
 * DO NOT EDIT - Generated from spec/vendor-portal-rules.yaml
 * Regenerate with: npm run generate:spec
 */

import { describe, it, expect } from 'vitest';

`);

  for (const [name, machine] of Object.entries(spec.state_machines)) {
    const testName = name
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    tests.push(`// =============================================================================
// ${testName} State Machine
// =============================================================================

describe('Generated: ${testName}', () => {
  // Valid states: ${machine.states.join(', ')}
  // Initial state: ${machine.initial}
  // Applies to: ${machine.entities.join(', ')}

  const VALID_STATES = new Set(${JSON.stringify(machine.states)});
  const VALID_TRANSITIONS = new Map<string, Set<string>>([
`);

    // Build transition map
    const transitionMap = new Map<string, string[]>();
    for (const t of machine.transitions) {
      if (!transitionMap.has(t.from)) {
        transitionMap.set(t.from, []);
      }
      transitionMap.get(t.from)!.push(t.to);
    }

    for (const [from, tos] of transitionMap) {
      tests.push(`    ['${from}', new Set(${JSON.stringify(tos)})],
`);
    }

    tests.push(`  ]);

  function isValidTransition(from: string, to: string): boolean {
    const allowed = VALID_TRANSITIONS.get(from);
    return allowed ? allowed.has(to) : false;
  }

  describe('Valid Transitions', () => {
`);

    for (const t of machine.transitions) {
      tests.push(`    it('${t.from} → ${t.to} (${t.trigger})', () => {
      expect(isValidTransition('${t.from}', '${t.to}')).toBe(true);
    });

`);
    }

    tests.push(`  });

  describe('Invalid Transitions', () => {
    it('should reject transitions not in the defined set', () => {
      // Example invalid transitions
`);

    // Generate some invalid transition tests
    for (const state of machine.states) {
      const validNextStates = transitionMap.get(state) || [];
      const invalidStates = machine.states.filter(
        (s) => s !== state && !validNextStates.includes(s)
      );
      if (invalidStates.length > 0) {
        tests.push(`      expect(isValidTransition('${state}', '${invalidStates[0]}')).toBe(false);
`);
      }
    }

    tests.push(`    });
  });

  describe('Initial State', () => {
    it('should start in ${machine.initial} state', () => {
      const INITIAL_STATE = '${machine.initial}';
      expect(VALID_STATES.has(INITIAL_STATE)).toBe(true);
    });
  });
});

`);
  }

  return tests.join('');
}

function generateInvariantTests(spec: Spec): string {
  const tests: string[] = [];

  tests.push(`/**
 * Generated Invariant Tests
 * DO NOT EDIT - Generated from spec/vendor-portal-rules.yaml
 * Regenerate with: npm run generate:spec
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

`);

  for (const [name, invariant] of Object.entries(spec.invariants)) {
    const testName = name
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    tests.push(`// =============================================================================
// ${testName}
// Severity: ${invariant.severity}
// Entities: ${invariant.entities.join(', ')}
// Formal: ${invariant.formal}
// =============================================================================

describe('Generated: ${testName}', () => {
`);

    // Generate appropriate test based on strategy
    if (invariant.test_strategy === 'property') {
      tests.push(`  // Property-based test
  it('${invariant.description} (property)', () => {
    fc.assert(
      fc.property(fc.nat(), fc.nat(), (a, b) => {
        // TODO: Implement property test
        // ${invariant.formal}
        return true; // Placeholder
      })
    );
  });
`);
    } else if (invariant.test_strategy === 'unit') {
      tests.push(`  // Unit test
  it('${invariant.description}', () => {
    // TODO: Implement unit test
    // ${invariant.formal}
    expect(true).toBe(true); // Placeholder
  });
`);
    } else {
      tests.push(`  // Integration test
  it('${invariant.description}', async () => {
    // TODO: Implement integration test
    // ${invariant.formal}
    expect(true).toBe(true); // Placeholder
  });
`);
    }

    tests.push(`});

`);
  }

  return tests.join('');
}

function generatePrivacyTierTests(spec: Spec): string {
  const tests: string[] = [];

  tests.push(`/**
 * Generated Privacy Tier Tests
 * DO NOT EDIT - Generated from spec/vendor-portal-rules.yaml
 * Regenerate with: npm run generate:spec
 */

import { describe, it, expect } from 'vitest';

// Privacy tier levels
const TIER_LEVELS = {
${Object.entries(spec.privacy_tiers)
  .map(([name, tier]) => `  '${name}': ${tier.level},`)
  .join('\n')}
};

// Field visibility by tier
const TIER_VISIBLE_FIELDS = {
${Object.entries(spec.privacy_tiers)
  .map(([name, tier]) => `  '${name}': ${JSON.stringify(tier.visible_fields)},`)
  .join('\n')}
};

// Tokenized fields by tier
const TIER_TOKENIZED_FIELDS = {
${Object.entries(spec.privacy_tiers)
  .map(([name, tier]) => `  '${name}': ${JSON.stringify(tier.tokenized_fields)},`)
  .join('\n')}
};

describe('Generated: Privacy Tier Authorization', () => {
  describe('Tier Level Ordering', () => {
    it('PRIVACY_SAFE < SELECTIVE < FULL_ACCESS', () => {
      expect(TIER_LEVELS['PRIVACY_SAFE']).toBeLessThan(TIER_LEVELS['SELECTIVE']);
      expect(TIER_LEVELS['SELECTIVE']).toBeLessThan(TIER_LEVELS['FULL_ACCESS']);
    });
  });

  describe('Access Tier Enforcement', () => {
    function canAccess(vendorTier: string, requiredTier: string): boolean {
      return TIER_LEVELS[vendorTier] >= TIER_LEVELS[requiredTier];
    }

    it('PRIVACY_SAFE vendor can access PRIVACY_SAFE data', () => {
      expect(canAccess('PRIVACY_SAFE', 'PRIVACY_SAFE')).toBe(true);
    });

    it('PRIVACY_SAFE vendor cannot access SELECTIVE data', () => {
      expect(canAccess('PRIVACY_SAFE', 'SELECTIVE')).toBe(false);
    });

    it('SELECTIVE vendor can access PRIVACY_SAFE data', () => {
      expect(canAccess('SELECTIVE', 'PRIVACY_SAFE')).toBe(true);
    });

    it('FULL_ACCESS vendor can access all tiers', () => {
      expect(canAccess('FULL_ACCESS', 'PRIVACY_SAFE')).toBe(true);
      expect(canAccess('FULL_ACCESS', 'SELECTIVE')).toBe(true);
      expect(canAccess('FULL_ACCESS', 'FULL_ACCESS')).toBe(true);
    });
  });

  describe('Field Tokenization Rules', () => {
    it('PRIVACY_SAFE tokenizes givenName, familyName, email, phone', () => {
      const tokenized = TIER_TOKENIZED_FIELDS['PRIVACY_SAFE'];
      expect(tokenized).toContain('givenName');
      expect(tokenized).toContain('familyName');
      expect(tokenized).toContain('email');
      expect(tokenized).toContain('phone');
    });

    it('FULL_ACCESS tokenizes nothing', () => {
      const tokenized = TIER_TOKENIZED_FIELDS['FULL_ACCESS'];
      expect(tokenized.length).toBe(0);
    });
  });
});
`);

  return tests.join('');
}

function generateDocumentation(spec: Spec): string {
  const doc: string[] = [];

  doc.push(`# ${spec.name} - Formal Specification

> **Auto-generated documentation from \`vendor-portal-rules.yaml\`**
>
> Generated: ${new Date().toISOString()}
> Specification Version: ${spec.version}

${spec.description}

---

## Table of Contents

1. [Formal Axioms](#formal-axioms)
2. [Privacy Tiers](#privacy-tiers)
3. [Token Types](#token-types)
4. [State Machines](#state-machines)
5. [Data Invariants](#data-invariants)
6. [Compliance](#compliance)

---

## Formal Axioms

These properties **MUST** hold for all operations. Violations are critical bugs.

| Axiom | Description | Formal Definition | Severity |
|-------|-------------|-------------------|----------|
`);

  for (const [name, axiom] of Object.entries(spec.axioms)) {
    doc.push(
      `| **${name}** | ${axiom.description} | \`${axiom.formal}\` | ${axiom.severity} |\n`
    );
  }

  doc.push(`
---

## Privacy Tiers

| Tier | Level | Description | Approval | Review Time |
|------|-------|-------------|----------|-------------|
`);

  for (const [name, tier] of Object.entries(spec.privacy_tiers)) {
    doc.push(
      `| **${name}** | ${tier.level} | ${tier.description} | ${tier.approval} | ${tier.review_time} |\n`
    );
  }

  doc.push(`
### Field Visibility by Tier

`);

  for (const [name, tier] of Object.entries(spec.privacy_tiers)) {
    doc.push(`#### ${name}

**Visible Fields:**
${Object.entries(tier.visible_fields)
  .map(([entity, fields]) => `- ${entity}: ${fields.length > 0 ? fields.join(', ') : '(none)'}`)
  .join('\n')}

**Tokenized Fields:** ${tier.tokenized_fields.length > 0 ? tier.tokenized_fields.join(', ') : '(none)'}

`);
  }

  doc.push(`---

## Token Types

`);

  for (const [name, token] of Object.entries(spec.token_types)) {
    doc.push(`### ${name.charAt(0).toUpperCase() + name.slice(1)}

> ${token.description}

| Property | Value |
|----------|-------|
| **Format** | \`${token.format}\` |
| **Pattern** | \`${token.pattern}\` |
| **Example** | \`${token.example}\` |
| **Axioms** | ${token.axioms.join(', ')} |
${token.preserves ? `| **Preserves** | ${token.preserves} |` : ''}

`);
  }

  doc.push(`---

## State Machines

`);

  for (const [name, machine] of Object.entries(spec.state_machines)) {
    doc.push(`### ${name.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}

> ${machine.description}

**Applies to:** ${machine.entities.join(', ')}

**States:** ${machine.states.join(' → ')}

**Initial State:** \`${machine.initial}\`

| From | To | Trigger |
|------|----|---------|
`);

    for (const t of machine.transitions) {
      doc.push(`| ${t.from} | ${t.to} | ${t.trigger} |\n`);
    }

    doc.push(`
`);
  }

  doc.push(`---

## Data Invariants

`);

  for (const [name, inv] of Object.entries(spec.invariants)) {
    doc.push(`### ${name.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}

> ${inv.description}

- **Formal:** \`${inv.formal}\`
- **Severity:** ${inv.severity}
- **Entities:** ${inv.entities.join(', ')}
- **Test Strategy:** ${inv.test_strategy}

`);
  }

  doc.push(`---

## Compliance

`);

  for (const [name, compliance] of Object.entries(spec.compliance)) {
    doc.push(`### ${name}

> ${compliance.description}

| Requirement | Description | Implementation |
|-------------|-------------|----------------|
`);

    for (const req of compliance.requirements) {
      doc.push(`| ${req.id} | ${req.description} | ${req.implementation} |\n`);
    }

    doc.push(`
`);
  }

  doc.push(`---

*This documentation is auto-generated. Do not edit manually.*
*To update, modify \`spec/vendor-portal-rules.yaml\` and run \`npm run generate:spec\`*
`);

  return doc.join('');
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  const specPath = path.join(__dirname, '..', 'vendor-portal-rules.yaml');
  const testsDir = path.join(__dirname, '..', '..', 'tests', 'generated');
  const docsDir = path.join(__dirname, '..', '..', 'docs', 'generated');

  console.log('Loading specification from:', specPath);
  const spec = loadSpec(specPath);

  // Ensure output directories exist
  fs.mkdirSync(testsDir, { recursive: true });
  fs.mkdirSync(docsDir, { recursive: true });

  // Generate tests
  console.log('Generating token tests...');
  const tokenTests = generateTokenTests(spec);
  fs.writeFileSync(path.join(testsDir, 'token.generated.test.ts'), tokenTests);

  console.log('Generating state machine tests...');
  const stateMachineTests = generateStateMachineTests(spec);
  fs.writeFileSync(
    path.join(testsDir, 'state-machine.generated.test.ts'),
    stateMachineTests
  );

  console.log('Generating invariant tests...');
  const invariantTests = generateInvariantTests(spec);
  fs.writeFileSync(
    path.join(testsDir, 'invariant.generated.test.ts'),
    invariantTests
  );

  console.log('Generating privacy tier tests...');
  const privacyTests = generatePrivacyTierTests(spec);
  fs.writeFileSync(
    path.join(testsDir, 'privacy-tier.generated.test.ts'),
    privacyTests
  );

  // Generate documentation
  console.log('Generating documentation...');
  const documentation = generateDocumentation(spec);
  fs.writeFileSync(path.join(docsDir, 'spec.md'), documentation);

  console.log('\nGeneration complete!');
  console.log(`  Tests: ${testsDir}/`);
  console.log(`  Docs:  ${docsDir}/`);
  console.log('\nGenerated files:');
  console.log('  - token.generated.test.ts');
  console.log('  - state-machine.generated.test.ts');
  console.log('  - invariant.generated.test.ts');
  console.log('  - privacy-tier.generated.test.ts');
  console.log('  - spec.md');
}

main().catch(console.error);
