# Testing Patterns - SchoolDay Vendor Portal

**TEST-04**: Standardized testing patterns for consistent, maintainable test suites.

This document codifies the testing patterns discovered and refined during MVP and v1.0 development. Following these patterns ensures:

- Consistent test structure across the codebase
- Proper database isolation and cleanup
- Clear distinction between static analysis and runtime tests
- Efficient test execution

---

## Table of Contents

1. [Test Categories](#test-categories)
2. [When to Use Static Analysis vs Runtime Testing](#when-to-use-static-analysis-vs-runtime-testing)
3. [Test Data Management](#test-data-management)
4. [Database Testing Patterns](#database-testing-patterns)
5. [Contract Testing with Zod](#contract-testing-with-zod)
6. [Cross-Layer Consistency Testing](#cross-layer-consistency-testing)
7. [Environment Configuration](#environment-configuration)
8. [Test File Organization](#test-file-organization)

---

## Test Categories

### 1. Generated Property-Based Tests (65 tests)
**Location**: `tests/generated/*.generated.test.ts`
**Source**: Auto-generated from `spec/vendor-portal-rules.yaml`

```bash
npm run test:generated   # Run only generated tests
npm run verify:spec      # Ensure spec and tests are in sync
```

**DO NOT EDIT** these files manually. Regenerate with:
```bash
npm run generate:spec
```

**Test Types**:
- Token format preservation
- Injectivity (no collision)
- Roundtrip (tokenize → detokenize)
- State machine transitions
- Privacy tier authorization

### 2. Unit Tests
**Purpose**: Test individual functions in isolation
**Location**: `tests/lib/*.test.ts`, `tests/ai-tools/*.test.ts`

```typescript
// Example: Pure function test
describe('calculateBatchCost', () => {
  it('should apply GROWTH tier discount for 5000 messages', () => {
    const result = calculateBatchCost('EMAIL', 5000);
    expect(result.tier).toBe('GROWTH');
    expect(result.discountPercent).toBe(10);
  });
});
```

### 3. Integration Tests
**Purpose**: Test API routes with real database
**Location**: `tests/v1-*/*.test.ts`, `tests/contracts/*.test.ts`

```typescript
// Example: API route test
describe('POST /api/auth/keys', () => {
  it('creates new API key with valid request', async () => {
    const { POST } = await import('@/app/api/auth/keys/route');
    const request = createAuthRequest('/api/auth/keys', testApiKey, {
      method: 'POST',
      body: { name: 'Test Key', scopes: ['read'] },
    });
    const response = await POST(request);
    expect(response.status).toBe(201);
  });
});
```

### 4. Contract Tests
**Purpose**: Validate API response shapes with Zod schemas
**Location**: `tests/contracts/*.test.ts`

See [Contract Testing with Zod](#contract-testing-with-zod) for details.

### 5. Consistency Tests
**Purpose**: Verify cross-layer configuration alignment
**Location**: `tests/config/*-consistency.test.ts`

See [Cross-Layer Consistency Testing](#cross-layer-consistency-testing) for details.

### 6. Static Analysis Tests
**Purpose**: Verify code patterns without execution
**Location**: `tests/streaming/*.test.ts`

See [When to Use Static Analysis](#when-to-use-static-analysis-vs-runtime-testing) for details.

---

## When to Use Static Analysis vs Runtime Testing

### Static Analysis Testing

Use static analysis when:
- **Code structure matters more than output** (e.g., SSE format compliance)
- **Runtime requires complex setup** (e.g., streaming responses, WebSocket)
- **Verifying pattern usage** (e.g., correct headers, event formats)
- **Testing code that's hard to mock** (e.g., ReadableStream behavior)

**Pattern**: Read source file and verify patterns exist:

```typescript
import fs from 'fs';
import path from 'path';

function getRouteCode(): string {
  const routePath = path.resolve(__dirname, '../../app/api/chat/route.ts');
  return fs.readFileSync(routePath, 'utf-8');
}

describe('SSE Format Correctness', () => {
  it('should set Content-Type header to text/event-stream', () => {
    const code = getRouteCode();
    expect(code).toContain('"Content-Type": "text/event-stream"');
  });

  it('should format events as data: {...}\\n\\n', () => {
    const code = getRouteCode();
    expect(code).toContain('`data: ${JSON.stringify');
    expect(code).toMatch(/}\\n\\n`/);
  });

  it('should end stream with [DONE] marker', () => {
    const code = getRouteCode();
    expect(code).toContain('[DONE]');
  });
});
```

**Advantages**:
- Fast (no setup/teardown)
- No external dependencies
- Catches structural issues early

**Disadvantages**:
- Doesn't verify runtime behavior
- Brittle to refactoring (code changes break tests)

### Runtime Testing

Use runtime testing when:
- **Behavior verification needed** (e.g., correct calculation results)
- **Database interaction required** (e.g., CRUD operations)
- **External service integration** (e.g., API calls)
- **Error handling verification** (e.g., edge cases, validation)

```typescript
describe('Pricing Calculation', () => {
  it('calculates batch estimate correctly', async () => {
    const { POST } = await import('@/app/api/pricing/route');
    const request = createAuthRequest('/api/pricing', testApiKey, {
      method: 'POST',
      body: { channel: 'EMAIL', messageCount: 100 },
    });
    const response = await POST(request);
    const body = await response.json();

    expect(body.estimate.totalCost).toBeGreaterThan(0);
    expect(body.estimate.messageCount).toBe(100);
  });
});
```

### Decision Matrix

| Scenario | Approach |
|----------|----------|
| API response structure | Contract test (runtime) |
| SSE stream format | Static analysis |
| Database CRUD | Runtime integration |
| Form trigger patterns | Static analysis |
| Authentication flow | Runtime integration |
| Error message format | Runtime unit test |
| Header presence | Can be either |

---

## Test Data Management

### TestDataTracker Pattern

Use `TestDataTracker` to automatically track and clean up test data:

```typescript
import {
  TestDataTracker,
  createTestVendor,
  createTestApiKey,
  cleanupTestData,
} from '@/tests/utils';

describe('My Test Suite', () => {
  const tracker = new TestDataTracker();

  afterAll(async () => {
    await cleanupTestData(tracker);
  });

  it('creates vendor and API key', async () => {
    const vendor = await createTestVendor({ tracker });
    const apiKey = await createTestApiKey({
      vendorId: vendor.id,
      tracker,
      scopes: ['read', 'write'],
    });

    // Test logic here...
  });
});
```

### Unique ID Generation

Always use `createTestId` for database entities:

```typescript
import { createTestId } from '@/tests/utils';

const vendorId = createTestId('vendor');  // test-vendor-abc123-0001-xyz9
const keyId = createTestId('key');        // test-key-abc124-0002-xyz8
```

**Why**: Prevents collisions between parallel tests and test reruns.

### withTestVendor Convenience Wrapper

For single-test scenarios:

```typescript
import { withTestVendor } from '@/tests/utils';

it('tests vendor functionality', async () => {
  await withTestVendor(
    async (vendor, apiKey) => {
      // Test with vendor and optional API key
      expect(vendor.id).toBeDefined();
      expect(apiKey?.key).toBeDefined();
    },
    { withApiKey: true, scopes: ['read', 'admin'] }
  );
  // Cleanup happens automatically
});
```

---

## Database Testing Patterns

### Fork Isolation

Tests run in separate processes via Vitest's fork pool:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,  // Each file gets its own fork
        maxForks: 1,        // Run one file at a time
      },
    },
    fileParallelism: false,  // Sequential file execution
  },
});
```

**Why**: Prevents database connection conflicts and ensures isolation.

### Cleanup Order

Always clean up in FK-safe order:

```typescript
// Correct order (child → parent):
// 1. Messages
// 2. Audit logs
// 3. Sessions
// 4. API keys
// 5. Vendors

await prisma.communicationMessage.deleteMany({ where: { id: { in: messageIds } } });
await prisma.auditLog.deleteMany({ where: { id: { in: auditIds } } });
await prisma.vendorSession.deleteMany({ where: { id: { in: sessionIds } } });
await prisma.apiKey.deleteMany({ where: { id: { in: keyIds } } });
await prisma.vendor.deleteMany({ where: { id: { in: vendorIds } } });
```

### Request Factory Functions

Use consistent request creation:

```typescript
function createRequest(
  url: string,
  options: { method?: string; headers?: Record<string, string>; body?: unknown } = {}
): Request {
  const { method = 'GET', headers = {}, body } = options;
  return new Request(`http://localhost:3000${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function createAuthRequest(url: string, apiKey: string, options = {}): Request {
  return createRequest(url, {
    ...options,
    headers: { Authorization: `Bearer ${apiKey}`, ...options.headers },
  });
}
```

---

## Contract Testing with Zod

### Schema Definition

Define schemas in `tests/contracts/schemas/`:

```typescript
// tests/contracts/schemas/health.schema.ts
import { z } from 'zod';

export const HealthResponseSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  components: z.object({
    database: z.enum(['healthy', 'unhealthy']),
    cache: z.enum(['healthy', 'unhealthy']),
  }),
  version: z.string().min(1),
  uptime: z.number().int().nonnegative(),
  timestamp: z.string().datetime(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
```

### Contract Test Pattern

```typescript
describe('GET /api/health', () => {
  it('returns 200 with valid HealthResponse schema', async () => {
    const { GET } = await import('@/app/api/health/route');
    const request = createRequest('/api/health');
    const response = await GET(request);

    expect(response.status).toBe(200);

    const body = await response.json();
    const result = HealthResponseSchema.safeParse(body);

    expect(result.success).toBe(true);
    if (!result.success) {
      console.error('Schema validation failed:', result.error.issues);
    }
  });
});
```

### TDD with Contract Tests

1. **Define schema first** (expected contract)
2. **Write failing test** (validates against schema)
3. **Implement endpoint** (make test pass)
4. **Refine schema** if actual response differs intentionally

---

## Cross-Layer Consistency Testing

### Purpose

Verify that configuration values are consistent across:
- Configuration modules (`lib/config/*`)
- AI handlers (`lib/ai/handlers.ts`)
- UI components (`app/*`, `components/*`)
- Documentation

### Pattern

```typescript
// tests/config/forms-consistency.test.ts
describe('Cross-Layer Consistency', () => {
  const HANDLER_FORM_IDS = ['pods_lite', 'credentials', 'sso_config'];
  const UI_SWITCH_CASES = ['pods_lite', 'sso_config', 'credentials'];
  const CONFIG_FORM_IDS = Object.values(FORM_TYPES).map(f => f.id);

  it('handlers use IDs defined in config', () => {
    HANDLER_FORM_IDS.forEach(id => {
      expect(CONFIG_FORM_IDS).toContain(id);
    });
  });

  it('UI switch cases match config', () => {
    expect(CONFIG_FORM_IDS.sort()).toEqual(UI_SWITCH_CASES.sort());
  });
});
```

### What to Test

| Config Type | Cross-Layer Locations |
|-------------|----------------------|
| Form types | `lib/config/forms.ts` → handlers → UI switch cases |
| SSO providers | `lib/config/sso.ts` → form options → API validation |
| OneRoster endpoints | `lib/config/oneroster.ts` → sandbox API → UI dropdown |
| AI tools | `lib/config/ai-tools.ts` → tool definitions → handler functions |

---

## Environment Configuration

### Vitest Config

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',            // Default for API/library tests
    env: {
      NODE_ENV: 'test',
      SHADOW_MODE: 'true',
    },
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: false, maxForks: 1 },
    },
    fileParallelism: false,
    globalSetup: ['./tests/globalSetup.ts'],
    setupFiles: ['./tests/setup.ts'],
  },
});
```

### Environment Selection

| Test Type | Environment |
|-----------|-------------|
| API routes | `node` |
| Library functions | `node` |
| React hooks | `jsdom` |
| React components | `jsdom` |

Override per-file:

```typescript
/**
 * @vitest-environment jsdom
 */
import { renderHook } from '@testing-library/react';
```

### Coverage Thresholds

Per-file thresholds for critical modules:

```typescript
coverage: {
  thresholds: {
    'lib/ai/tools.ts': { statements: 90, branches: 85 },
    'lib/ai/handlers.ts': { statements: 85, branches: 75 },
    'lib/db/index.ts': { statements: 80, branches: 70 },
  },
},
```

---

## Test File Organization

### Directory Structure

```
tests/
├── contracts/           # API contract tests (Zod schemas)
│   ├── schemas/         # Zod schema definitions
│   │   ├── health.schema.ts
│   │   ├── auth.schema.ts
│   │   └── index.ts
│   └── api.contracts.test.ts
├── config/              # Cross-layer consistency tests
│   ├── forms-consistency.test.ts
│   ├── sso-consistency.test.ts
│   └── oneroster-consistency.test.ts
├── generated/           # Auto-generated from spec (DO NOT EDIT)
│   ├── token.generated.test.ts
│   └── state-machine.generated.test.ts
├── hard-*/              # v1.0-hardening sprint tests
├── v1-*/                # v1.0 feature tests
├── streaming/           # Static analysis streaming tests
├── utils/               # Test utilities
│   └── index.ts
├── setup.ts             # Test setup (runs before each file)
├── globalSetup.ts       # Global setup (runs once)
└── vitest.config.ts
```

### Naming Conventions

| Pattern | Example |
|---------|---------|
| Feature tests | `tests/v1-02/api-keys.test.ts` |
| Integration | `tests/v1-02/integration.test.ts` |
| Consistency | `tests/config/forms-consistency.test.ts` |
| Contract | `tests/contracts/api.contracts.test.ts` |
| Generated | `tests/generated/token.generated.test.ts` |

### Test IDs in TODO.md

Reference tests by task ID:

```markdown
| Task ID | Task | Status | Tests |
|---------|------|--------|-------|
| V1-02 | API Key authentication | Complete | 92 |
| TEST-03 | Contract tests | Complete | 29 |
```

---

## Quick Reference

### Running Tests

```bash
npm test                    # All tests (3222+)
npm run test:generated      # Generated spec tests (65)
npm run verify:spec         # Verify spec sync
npm test -- --coverage      # With coverage report
npm test -- tests/v1-02/    # Specific directory
```

### Creating New Tests

1. **Choose category** based on what you're testing
2. **Use TestDataTracker** for any database entities
3. **Import from `@/tests/utils`** for utilities
4. **Define Zod schemas** for contract tests
5. **Clean up in afterAll** using proper FK order

### Common Imports

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/db';
import {
  TestDataTracker,
  createTestId,
  createTestVendor,
  createTestApiKey,
  cleanupTestData,
  withTestVendor,
} from '@/tests/utils';
```

---

*Last updated: December 6, 2025 (TEST-04)*
