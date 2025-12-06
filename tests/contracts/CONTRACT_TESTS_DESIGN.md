# TEST-03: Contract Tests Design

## Overview

Contract tests verify that API endpoints adhere to their documented contracts:
- Request validation (required fields, types, constraints)
- Response structure (shape, required fields, types)
- HTTP status codes for success/error cases
- Required headers (rate limiting, caching)

## Design Principles

1. **Schema-first**: Use Zod schemas to define and validate contracts
2. **Fail early**: Tests should fail if contract changes unexpectedly
3. **Independence**: Each test should be self-contained
4. **Coverage**: Test happy path, validation errors, auth errors, edge cases

## API Endpoints to Test

### Tier 1: Public/Health Endpoints (No Auth)

| Endpoint | Methods | Priority |
|----------|---------|----------|
| `GET /api/health` | GET | High |
| `GET /api/health/live` | GET | High |
| `GET /api/health/ready` | GET | High |

### Tier 2: Authenticated Endpoints

| Endpoint | Methods | Priority |
|----------|---------|----------|
| `GET /api/vendors/me` | GET | High |
| `GET /api/auth/keys` | GET, POST | High |
| `GET /api/pricing` | GET, POST | High |
| `GET /api/audit` | GET | Medium |

### Tier 3: Complex Business Endpoints

| Endpoint | Methods | Priority |
|----------|---------|----------|
| `POST /api/cpaas/messages` | POST | High |
| `GET /api/pricing/usage` | GET | Medium |

## Contract Schemas

### Health Endpoint Contract

```typescript
// GET /api/health - 200 OK
const HealthResponseSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  components: z.object({
    database: z.enum(['healthy', 'unhealthy']),
    cache: z.enum(['healthy', 'unhealthy']),
  }),
  version: z.string(),
  uptime: z.number().int().nonnegative(),
  timestamp: z.string().datetime(),
});
```

### Vendor Me Contract

```typescript
// GET /api/vendors/me - 200 OK (authenticated)
const VendorMeResponseSchema = z.object({
  vendor: z.object({
    id: z.string().uuid(),
    name: z.string(),
    contactEmail: z.string().email(),
    contactName: z.string().nullable(),
    website: z.string().nullable(),
    defaultAccessTier: z.enum(['PRIVACY_SAFE', 'SELECTIVE', 'FULL_ACCESS']),
    podsStatus: z.string(),
    createdAt: z.string().datetime(),
  }),
  scopes: z.array(z.string()),
  requestId: z.string(),
});

// 401 Unauthorized
const UnauthorizedResponseSchema = z.object({
  error: z.string(),
});

// 403 Forbidden (invalid scope)
const ForbiddenResponseSchema = z.object({
  error: z.string(),
});
```

### Pricing Contract

```typescript
// GET /api/pricing - 200 OK
const PricingResponseSchema = z.object({
  tiers: z.array(z.object({
    name: z.enum(['STARTER', 'GROWTH', 'SCALE', 'ENTERPRISE']),
    minVolume: z.number().int(),
    maxVolume: z.number().int().nullable(),
    discountPercent: z.number(),
    description: z.string(),
  })),
  basePrices: z.object({
    email: z.number(),
    sms: z.number(),
  }),
  requestId: z.string(),
});

// POST /api/pricing - 200 OK (batch estimate)
const BatchEstimateResponseSchema = z.object({
  estimate: z.object({
    baseCost: z.number(),
    discountedCost: z.number(),
    discount: z.number(),
    tier: z.string(),
    effectiveRate: z.number(),
  }),
  currentVolume: z.number(),
  requestId: z.string(),
});
```

### Error Response Contract

```typescript
// Standard error response
const ErrorResponseSchema = z.object({
  error: z.string(),
  requestId: z.string().optional(),
  details: z.array(z.unknown()).optional(),
});

// Rate limit error (429)
const RateLimitResponseSchema = z.object({
  error: z.literal('Rate limit exceeded'),
  retryAfter: z.number(),
  requestId: z.string(),
});
```

## Test Structure

```
tests/contracts/
  api.contracts.test.ts      # Main contract test file
  schemas/
    health.schema.ts         # Health endpoint schemas
    auth.schema.ts           # Auth endpoint schemas
    pricing.schema.ts        # Pricing endpoint schemas
    error.schema.ts          # Common error schemas
  helpers/
    request.ts               # HTTP request helpers
    auth.ts                  # Auth test helpers
```

## Test Cases

### Health Endpoints

1. **GET /api/health**
   - [x] Returns 200 with valid HealthResponse schema
   - [x] Contains required headers (Cache-Control: no-cache)
   - [x] Returns 503 when database is unhealthy

2. **GET /api/health/live**
   - [x] Returns 200 with status ok
   - [x] Is fast (< 100ms)

3. **GET /api/health/ready**
   - [x] Returns 200 when dependencies ready
   - [x] Returns 503 when dependencies not ready

### Auth Endpoints

4. **GET /api/vendors/me**
   - [x] Returns 401 without API key
   - [x] Returns 401 with invalid API key
   - [x] Returns 200 with valid VendorMe schema when authenticated
   - [x] Contains X-RateLimit-* headers

5. **GET /api/auth/keys**
   - [x] Returns 401 without authentication
   - [x] Returns 403 without 'admin' scope
   - [x] Returns 200 with list of API keys when authorized

### Pricing Endpoints

6. **GET /api/pricing**
   - [x] Returns 401 without authentication
   - [x] Returns 200 with valid Pricing schema
   - [x] Contains exactly 4 pricing tiers

7. **POST /api/pricing**
   - [x] Returns 401 without authentication
   - [x] Returns 400 with invalid body
   - [x] Returns 200 with valid estimate for batch request
   - [x] Returns 200 with valid estimate for monthly request

### Audit Endpoints

8. **GET /api/audit**
   - [x] Returns 401 without authentication
   - [x] Returns 403 without 'audit' scope
   - [x] Returns 200 with paginated audit logs
   - [x] Respects limit parameter (max 100)

## Required Headers Contract

All authenticated endpoints MUST include:
- `X-RateLimit-Limit`: Maximum requests per window
- `X-RateLimit-Remaining`: Remaining requests in window

Error responses (429) MUST include:
- `Retry-After`: Seconds until rate limit resets

## Implementation Plan

1. Create schema files with Zod definitions
2. Create request helper utilities
3. Write failing tests for each endpoint
4. Verify tests fail as expected (TDD red phase)
5. Tests should pass against existing implementation (TDD green phase)
