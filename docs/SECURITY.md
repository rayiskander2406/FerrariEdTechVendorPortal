# Security Documentation

This document describes the security measures implemented in the LAUSD Vendor Portal and provides guidelines for production deployment.

## Table of Contents

1. [Security Features](#security-features)
2. [XSS Protection](#xss-protection)
3. [Rate Limiting](#rate-limiting)
4. [Payload Validation](#payload-validation)
5. [Sandbox API Authentication](#sandbox-api-authentication)
6. [Production Deployment Checklist](#production-deployment-checklist)

---

## Security Features

The portal implements three layers of API security:

| Feature | Purpose | Default Limits |
|---------|---------|----------------|
| XSS Sanitization | Prevent cross-site scripting | All string inputs sanitized |
| Rate Limiting | Prevent abuse/DoS | 60 req/min (20 for chat) |
| Payload Validation | Prevent oversized requests | 1MB max (100KB for chat) |

## XSS Protection

### How It Works

All user input is sanitized before storage and display:

1. **HTML Entity Escaping**: Characters like `<`, `>`, `"`, `'` are escaped
2. **Dangerous Pattern Removal**: Script tags, event handlers, and data URIs are stripped
3. **URL Validation**: Only `http://` and `https://` protocols allowed
4. **Email Validation**: Strict format validation

### Usage

```typescript
import {
  sanitizeString,
  sanitizeEmail,
  sanitizeUrl,
  sanitizeObject
} from '@/lib/security';

// Sanitize individual strings
const safeName = sanitizeString(userInput);

// Sanitize emails (returns empty string if invalid)
const safeEmail = sanitizeEmail(email);

// Sanitize URLs (returns empty string if invalid)
const safeUrl = sanitizeUrl(url);

// Recursively sanitize entire objects
const safeBody = sanitizeObject(requestBody);
```

### XSS Attack Vectors Blocked

| Attack | Input | Output |
|--------|-------|--------|
| Script injection | `<script>alert('xss')</script>` | (removed) |
| Event handler | `<img onerror="alert('xss')">` | `&lt;img&gt;` |
| JavaScript URL | `javascript:alert('xss')` | (removed) |
| Data URI | `<a href="data:text/html,...">` | `&lt;a href=&quot;&quot;&gt;` |

## Rate Limiting

### Configuration

```typescript
import {
  DEFAULT_RATE_LIMIT,
  CHAT_RATE_LIMIT,
  checkRateLimit
} from '@/lib/security';

// Default: 60 requests per minute
const result = checkRateLimit(clientId);

// Chat endpoint: 20 requests per minute
const chatResult = checkRateLimit(clientId, CHAT_RATE_LIMIT);

// Custom configuration
const customResult = checkRateLimit(clientId, {
  maxRequests: 100,
  windowMs: 60 * 1000,
  identifier: 'custom-endpoint'
});
```

### Response Headers

Rate-limited responses include standard headers:

```
X-RateLimit-Remaining: 15
X-RateLimit-Reset: 2024-01-15T10:30:00.000Z
Retry-After: 45
```

### Client Identification

Clients are identified by:
1. `X-Forwarded-For` header (first IP)
2. `X-Real-IP` header
3. Fallback to "anonymous"

### Production Considerations

The in-memory rate limit store works for single-server deployments. For distributed systems, replace with Redis:

```typescript
// Production: Use Redis for distributed rate limiting
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

async function checkRateLimitRedis(clientId: string, config: RateLimitConfig) {
  const key = `ratelimit:${clientId}:${config.identifier}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, Math.ceil(config.windowMs / 1000));
  }
  return {
    allowed: count <= config.maxRequests,
    remaining: Math.max(0, config.maxRequests - count),
    // ...
  };
}
```

## Payload Validation

### Default Limits

| Limit | Default | Chat Endpoint |
|-------|---------|---------------|
| Max size | 1 MB | 100 KB |
| Max string length | 10,000 chars | 5,000 chars |
| Max array length | 1,000 items | 100 items |
| Max nesting depth | 10 levels | 5 levels |

### Usage

```typescript
import {
  validatePayload,
  DEFAULT_PAYLOAD_CONFIG,
  CHAT_PAYLOAD_CONFIG
} from '@/lib/security';

// Validate with default config
const result = validatePayload(requestBody);
if (!result.valid) {
  return NextResponse.json({ error: result.error }, { status: result.statusCode });
}

// Stricter validation for chat
const chatResult = validatePayload(messages, CHAT_PAYLOAD_CONFIG);
```

### Error Responses

```json
// 413 Payload Too Large
{ "error": "Payload too large: 2097152 bytes (max: 1048576)" }

// 400 Bad Request
{ "error": "String too long: 15000 chars (max: 10000)" }
{ "error": "Array too long: 1500 items (max: 1000)" }
{ "error": "Payload too deeply nested: depth 15 (max: 10)" }
```

## Sandbox API Authentication

### IMPORTANT: Demo Mode Behavior

**The sandbox API currently accepts ANY key matching the pattern `sbox_test_*` for demo purposes.**

```
Pattern: /^sbox_test_[a-zA-Z0-9]{24,}$/

Valid examples:
- sbox_test_abc123def456ghi789jkl012mno
- sbox_test_DEMO1234567890ABCDEFGHIJ
```

This allows easy testing without real credential validation. The API secret is also not validated in demo mode.

### Why This Design

1. **Demo Simplicity**: Stakeholders can test without setup
2. **No Secret Management**: No need to store/rotate real secrets during demo
3. **Isolated Environment**: Sandbox only returns synthetic/tokenized data

### Production Requirements

Before deploying to production, you **MUST** implement proper authentication:

```typescript
// PRODUCTION: Replace pattern matching with database lookup
async function validateSandboxCredentials(
  apiKey: string,
  apiSecret: string,
  endpoint: string
): Promise<{ valid: boolean; vendorId?: string; error?: string }> {
  // 1. Look up API key in database
  const sandbox = await db.sandbox.findUnique({
    where: { apiKey },
    include: { vendor: true }
  });

  if (!sandbox) {
    return { valid: false, error: 'Invalid API key' };
  }

  // 2. Validate API secret
  const secretValid = await bcrypt.compare(apiSecret, sandbox.apiSecretHash);
  if (!secretValid) {
    return { valid: false, error: 'Invalid API secret' };
  }

  // 3. Check sandbox status
  if (sandbox.status !== 'ACTIVE') {
    return { valid: false, error: 'Sandbox is not active' };
  }

  // 4. Check expiration
  if (sandbox.expiresAt < new Date()) {
    return { valid: false, error: 'Credentials expired' };
  }

  // 5. Verify endpoint access
  if (!sandbox.allowedEndpoints.includes(endpoint)) {
    return { valid: false, error: 'Endpoint not authorized for this tier' };
  }

  return { valid: true, vendorId: sandbox.vendorId };
}
```

## Production Deployment Checklist

### Pre-Deployment

- [ ] Replace in-memory rate limiting with Redis
- [ ] Implement database-backed API key validation
- [ ] Hash API secrets with bcrypt before storage
- [ ] Enable HTTPS only (redirect HTTP)
- [ ] Configure CORS for production domains only
- [ ] Set secure cookie flags (HttpOnly, Secure, SameSite)
- [ ] Enable Content Security Policy headers
- [ ] Remove or restrict debug endpoints
- [ ] Rotate all demo/test API keys

### Environment Variables

```env
# Required for production
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
ANTHROPIC_API_KEY=sk-ant-prod-...

# Security settings
RATE_LIMIT_ENABLED=true
PAYLOAD_VALIDATION_ENABLED=true
XSS_SANITIZATION_ENABLED=true

# CORS (comma-separated domains)
ALLOWED_ORIGINS=https://portal.lausd.net,https://admin.lausd.net
```

### API Key Rotation

1. Generate new production API keys with `crypto.randomBytes(32).toString('hex')`
2. Hash secrets before storage: `await bcrypt.hash(secret, 12)`
3. Set appropriate expiration dates
4. Log all credential access for audit trail

### Monitoring

- Set up alerts for rate limit violations
- Monitor for payload validation failures (potential attack probes)
- Track API key usage patterns
- Log authentication failures

---

## Security Contact

For security issues or vulnerability reports, contact the LAUSD IT Security team.
