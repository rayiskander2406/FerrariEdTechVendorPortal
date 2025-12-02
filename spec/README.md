# Specification-Driven Development

> **Single Source of Truth for Privacy Rules and Invariants**

This directory contains the formal specification that drives all privacy-related behavior in the LAUSD Vendor Portal.

## Quick Start

```bash
# Install dependencies (if not already done)
npm install

# Generate tests and documentation from spec
npm run generate:spec

# Run generated tests
npm run test:generated

# Verify spec is in sync
npm run verify:spec
```

## Files

| File | Purpose |
|------|---------|
| `vendor-portal-rules.yaml` | **THE SOURCE OF TRUTH** - all privacy rules |
| `generator/index.ts` | TypeScript generator for tests and docs |
| `README.md` | This file |

## What Gets Generated

```
tests/generated/
├── token.generated.test.ts       # Token format tests
├── state-machine.generated.test.ts # State transition tests
├── invariant.generated.test.ts   # Data integrity tests
└── privacy-tier.generated.test.ts # Authorization tests

docs/generated/
└── spec.md                       # Human-readable specification
```

## Specification Structure

### Axioms
Mathematical properties that MUST hold:
- `injectivity` - Different users produce different tokens
- `roundtrip` - Tokenize then detokenize returns original
- `access_tier_enforcement` - Vendors only see data matching their tier

### Privacy Tiers
Three levels of data access:
1. **PRIVACY_SAFE** (Level 1) - Zero PII, instant approval
2. **SELECTIVE** (Level 2) - Limited PII, requires review
3. **FULL_ACCESS** (Level 3) - Full PII, extensive review

### Token Types
- `student` - TKN_STU_{8char}
- `teacher` - TKN_TCH_{8char}
- `parent` - TKN_PAR_{8char}
- `email` - TKN_STU_xxx@relay.schoolday.lausd.net
- `phone` - TKN_555_xxx_xxxx

### State Machines
- `sync_status` - pending → syncing → synced/conflict/error
- `circuit_breaker` - closed → open → half_open → closed
- `vendor_grant_status` - pending_review → approved/rejected → expired/revoked
- `enrollment_status` - active → completed/withdrawn/transferred

### Invariants
Data integrity rules:
- `grade_bounds` - Score cannot exceed maximum
- `effective_dating` - End date after start date
- `parent_child_roles` - Correct role assignments
- `unique_enrollment` - No duplicate active enrollments

## Adding New Rules

1. Edit `vendor-portal-rules.yaml`
2. Run `npm run generate:spec`
3. Implement the rule in code
4. Tests auto-verify compliance

## CI Integration

The project includes a GitHub Actions workflow (`.github/workflows/spec-verification.yml`) that:
1. Regenerates tests from the YAML specification
2. Verifies no generated files have drifted
3. Runs all property-based tests
4. Fails the PR if spec and tests are out of sync

For other CI systems, add:
```yaml
- name: Verify spec
  run: npm run verify:spec

- name: Run generated tests
  run: npm run test:generated
```

## Pre-Commit Hook

To prevent committing when spec and tests are out of sync:

### Option 1: Manual Installation
```bash
cp scripts/pre-commit-spec-check.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

### Option 2: Using Husky (Recommended)
```bash
npm install -D husky
npx husky init
echo "npm run verify:spec" > .husky/pre-commit
```

### What the Hook Does
- Detects when `vendor-portal-rules.yaml` is modified
- Auto-regenerates tests and adds them to the commit
- Verifies generated files are in sync before allowing commit
- Optionally runs generated tests (set `RUN_GENERATED_TESTS=true`)

## Token Utilities

The `lib/tokens/index.ts` module provides exportable functions for token generation:

```typescript
import {
  studentToken,      // TKN_STU_{8char}
  teacherToken,      // TKN_TCH_{8char}
  parentToken,       // TKN_PAR_{8char}
  tokenizedEmail,    // TKN_STU_xxx@relay.schoolday.lausd.net
  tokenizedPhone,    // TKN_555_xxx_xxxx
  parseToken,        // Parse token into components
  isValidToken,      // Validate token format
  registerToken,     // Register for detokenization
  detokenize,        // Lookup original value
} from '@/lib/tokens';
```

All token functions are pure and deterministic - same input always produces same output.
