# API Reference

Complete reference for the SchoolDay Vendor Portal API.

**Base URL**: `http://localhost:3000/api` (development) or `https://your-domain.com/api` (production)

---

## Table of Contents

- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [Endpoints](#endpoints)
  - [Health](#health)
  - [Vendors](#vendors)
  - [API Keys](#api-keys)
  - [Messages (CPaaS)](#messages-cpaas)
  - [Pricing](#pricing)
  - [Audit Logs](#audit-logs)
  - [Sandbox/OneRoster](#sandboxoneroster)
  - [Chat](#chat)

---

## Authentication

Most endpoints require API key authentication via the `Authorization` header.

```http
Authorization: Bearer sk_test_abc123...
```

### API Key Scopes

| Scope | Description |
|-------|-------------|
| `read` | Read vendor info, list resources |
| `write` | Create/update resources |
| `message` | Send messages via CPaaS |
| `admin` | Manage API keys, delete resources |
| `audit` | Access audit logs |

### Obtaining API Keys

1. Complete PoDS-Lite onboarding via chat
2. Use `POST /api/auth/keys` with admin scope

---

## Rate Limiting

Rate limits are applied per vendor based on privacy tier:

| Tier | Limit |
|------|-------|
| PRIVACY_SAFE | 100 requests/minute |
| SELECTIVE | 500 requests/minute |
| FULL_ACCESS | 1000 requests/minute |

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
Retry-After: 60
```

---

## Error Handling

All errors follow this format:

```json
{
  "error": "Error message",
  "details": [...],
  "requestId": "req_abc123"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing/invalid API key |
| 403 | Forbidden - Missing required scope |
| 404 | Not Found |
| 429 | Rate Limit Exceeded |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

---

## Endpoints

---

### Health

Health check endpoints for monitoring and load balancers.

#### GET /api/health

Comprehensive health check including all dependencies.

**Authentication**: None required

**Response**:

```json
{
  "status": "healthy",
  "components": {
    "database": "healthy",
    "cache": "healthy"
  },
  "version": "1.0.0",
  "uptime": 3600,
  "timestamp": "2025-12-06T12:00:00.000Z"
}
```

**Status Values**:
- `healthy` - All components operational
- `degraded` - Some non-critical components unhealthy
- `unhealthy` - Critical components failing (returns 503)

#### GET /api/health/live

Kubernetes liveness probe.

**Response**: `200 OK` with `{"status": "ok"}`

#### GET /api/health/ready

Kubernetes readiness probe (checks database).

**Response**: `200 OK` or `503 Service Unavailable`

---

### Vendors

Vendor information endpoints.

#### GET /api/vendors/me

Get authenticated vendor's information.

**Authentication**: Required (any scope)

**Response**:

```json
{
  "vendor": {
    "id": "vendor_abc123",
    "name": "EdTech Company",
    "contactEmail": "contact@edtech.com",
    "contactName": "John Doe",
    "website": "https://edtech.com",
    "defaultAccessTier": "PRIVACY_SAFE",
    "podsStatus": "APPROVED",
    "createdAt": "2025-12-01T00:00:00.000Z"
  },
  "scopes": ["read", "write"],
  "requestId": "req_abc123"
}
```

---

### API Keys

Manage API keys for authentication.

#### GET /api/auth/keys

List all API keys for the authenticated vendor.

**Authentication**: Required (read scope)

**Response**:

```json
{
  "keys": [
    {
      "id": "key_abc123",
      "name": "Production Key",
      "prefix": "sk_live_abc",
      "scopes": ["read", "write"],
      "createdAt": "2025-12-01T00:00:00.000Z",
      "lastUsedAt": "2025-12-06T12:00:00.000Z",
      "expiresAt": null
    }
  ],
  "requestId": "req_abc123"
}
```

#### POST /api/auth/keys

Create a new API key.

**Authentication**: Required (admin scope)

**Request**:

```json
{
  "name": "Production Key",
  "scopes": ["read", "write", "message"],
  "expiresAt": "2026-12-01T00:00:00.000Z"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Key name for identification |
| scopes | string[] | No | Permissions (default: ["read", "write"]) |
| expiresAt | string | No | ISO date for expiration |

**Response** (201 Created):

```json
{
  "key": "sk_test_abc123...",
  "keyPrefix": "sk_test_abc",
  "id": "key_abc123",
  "name": "Production Key",
  "scopes": ["read", "write", "message"],
  "createdAt": "2025-12-06T12:00:00.000Z",
  "expiresAt": "2026-12-01T00:00:00.000Z",
  "message": "Store this key securely. It will not be shown again.",
  "requestId": "req_abc123"
}
```

#### DELETE /api/auth/keys/:id

Revoke an API key.

**Authentication**: Required (admin scope)

**Response**: `204 No Content`

#### POST /api/auth/keys/:id/rotate

Rotate an API key (revoke old, create new).

**Authentication**: Required (admin scope)

**Response**: Same as POST /api/auth/keys

---

### Messages (CPaaS)

Send and track messages via the Communication Platform.

#### POST /api/cpaas/messages

Send a single message or batch of messages.

**Authentication**: Required (message scope)

**Headers**:
- `Idempotency-Key` (optional): Prevent duplicate sends

##### Single Message

```json
{
  "channel": "EMAIL",
  "recipient": "TKN_PAR_A1B2C3D4",
  "recipientType": "PARENT",
  "subject": "Important Update",
  "body": "Hello, this is a test message.",
  "priority": "NORMAL",
  "scheduledAt": "2025-12-07T09:00:00.000Z",
  "metadata": { "campaignId": "camp_123" }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| channel | "EMAIL" \| "SMS" | Yes | Delivery channel |
| recipient | string | Yes | Tokenized recipient (TKN_PAR/STU/TCH_*) |
| recipientType | "PARENT" \| "STUDENT" \| "TEACHER" | Yes | Recipient type |
| subject | string | Email only | Email subject line |
| body | string | Yes | Message content |
| priority | "HIGH" \| "NORMAL" \| "LOW" | No | Default: NORMAL |
| scheduledAt | string | No | ISO date for scheduled send |
| metadata | object | No | Custom metadata |

**Response** (201 Created):

```json
{
  "messageId": "msg_abc123",
  "status": "QUEUED",
  "duplicate": false,
  "estimatedCost": 0.0025,
  "requestId": "req_abc123"
}
```

##### Batch Messages

```json
{
  "channel": "SMS",
  "recipients": [
    { "token": "TKN_PAR_A1B2C3D4", "type": "PARENT" },
    { "token": "TKN_PAR_E5F6G7H8", "type": "PARENT" }
  ],
  "body": "School closed tomorrow due to weather.",
  "priority": "HIGH"
}
```

**Response** (201 Created):

```json
{
  "batchId": "batch_abc123",
  "messageCount": 2,
  "status": "QUEUED",
  "scheduledAt": null,
  "estimatedCost": 0.018,
  "requestId": "req_abc123"
}
```

#### GET /api/cpaas/messages

Get message status or list messages.

**Authentication**: Required

**Query Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| id | string | Get single message status |
| batchId | string | Get batch status |
| status | string | Filter by status |
| channel | "EMAIL" \| "SMS" | Filter by channel |
| startDate | ISO date | Filter from date |
| endDate | ISO date | Filter to date |
| limit | number | Max results (default: 50, max: 100) |
| offset | number | Pagination offset |

**Response** (list):

```json
{
  "messages": [
    {
      "id": "msg_abc123",
      "channel": "EMAIL",
      "recipientToken": "TKN_PAR_A1B2C3D4",
      "recipientType": "PARENT",
      "status": "DELIVERED",
      "sentAt": "2025-12-06T12:00:00.000Z",
      "deliveredAt": "2025-12-06T12:00:05.000Z",
      "createdAt": "2025-12-06T11:59:55.000Z"
    }
  ],
  "limit": 50,
  "offset": 0,
  "requestId": "req_abc123"
}
```

**Message Status Values**:
- `QUEUED` - Waiting to be sent
- `SENDING` - Currently being sent
- `SENT` - Sent to provider
- `DELIVERED` - Confirmed delivered
- `FAILED` - Delivery failed
- `BOUNCED` - Email bounced

---

### Pricing

Get pricing information and cost estimates.

#### GET /api/pricing

Get pricing tiers and base prices.

**Authentication**: Required

**Response**:

```json
{
  "tiers": [
    { "name": "STARTER", "minVolume": 0, "discount": 0 },
    { "name": "GROWTH", "minVolume": 1000, "discount": 0.1 },
    { "name": "SCALE", "minVolume": 10000, "discount": 0.2 },
    { "name": "ENTERPRISE", "minVolume": 100000, "discount": 0.3 }
  ],
  "basePrices": {
    "email": 0.0025,
    "sms": 0.0075
  },
  "requestId": "req_abc123"
}
```

#### POST /api/pricing

Estimate costs for messages.

**Authentication**: Required

##### Batch Estimate

```json
{
  "channel": "EMAIL",
  "messageCount": 1000
}
```

**Response**:

```json
{
  "estimate": {
    "unitCost": 0.00225,
    "totalCost": 2.25,
    "tier": "GROWTH",
    "discount": 0.1
  },
  "currentVolume": 500,
  "requestId": "req_abc123"
}
```

##### Monthly Estimate

```json
{
  "type": "monthly",
  "emailCount": 10000,
  "smsCount": 5000
}
```

**Response**:

```json
{
  "estimate": {
    "email": { "count": 10000, "cost": 20.00 },
    "sms": { "count": 5000, "cost": 30.00 },
    "total": 50.00,
    "tier": "SCALE"
  },
  "requestId": "req_abc123"
}
```

#### GET /api/pricing/usage

Get current month's usage.

**Response**:

```json
{
  "usage": {
    "emailCount": 5000,
    "smsCount": 2000,
    "totalMessages": 7000,
    "totalCost": 35.00
  },
  "month": "2025-12",
  "requestId": "req_abc123"
}
```

---

### Audit Logs

Access audit trail for compliance.

#### GET /api/audit

List audit logs for the authenticated vendor.

**Authentication**: Required (audit or admin scope)

**Query Parameters**:

| Param | Type | Description |
|-------|------|-------------|
| action | string | Filter by action type |
| resourceType | string | Filter by resource type |
| resourceId | string | Filter by resource ID |
| startDate | ISO date | Filter from date |
| endDate | ISO date | Filter to date |
| limit | number | Max results (default: 50, max: 100) |
| offset | number | Pagination offset |

**Response**:

```json
{
  "logs": [
    {
      "id": "audit_abc123",
      "vendorId": "vendor_abc123",
      "action": "MESSAGE_SENT",
      "resourceType": "MESSAGE",
      "resourceId": "msg_abc123",
      "details": { "channel": "EMAIL", "recipient": "TKN_PAR_*" },
      "ipAddress": "192.168.1.1",
      "userAgent": "SchoolDay-SDK/1.0",
      "timestamp": "2025-12-06T12:00:00.000Z",
      "retainUntil": "2032-12-06T12:00:00.000Z"
    }
  ],
  "total": 150,
  "pagination": {
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

**Audit Actions**:
- `API_KEY_CREATED`, `API_KEY_ROTATED`, `API_KEY_REVOKED`
- `MESSAGE_SENT`, `MESSAGE_DELIVERED`, `MESSAGE_FAILED`
- `PODS_SUBMITTED`, `PODS_APPROVED`, `PODS_REJECTED`
- `SSO_CONFIGURED`, `LTI_CONFIGURED`
- `ONEROSTER_ACCESSED`

---

### Sandbox/OneRoster

Test OneRoster API integration.

#### GET /api/sandbox/oneroster/:path

Proxy to OneRoster sandbox endpoints.

**Authentication**: Via sandbox credentials (OAuth 2.0)

**Available Endpoints**:
- `/users` - List users (tokenized)
- `/classes` - List classes
- `/courses` - List courses
- `/enrollments` - List enrollments
- `/orgs` - List organizations
- `/academicSessions` - List academic sessions
- `/demographics` - List demographics (tokenized)

**Response** (OneRoster format):

```json
{
  "users": [
    {
      "sourcedId": "TKN_STU_A1B2C3D4",
      "status": "active",
      "givenName": "Emma",
      "familyName": "[TOKENIZED]",
      "email": "TKN_STU_a1b2c3d4@relay.schoolday.lausd.net",
      "role": "student"
    }
  ]
}
```

#### GET /api/sandbox/credentials

Get sandbox OAuth credentials.

**Authentication**: Required

**Response**:

```json
{
  "credentials": {
    "clientId": "sandbox_abc123",
    "clientSecret": "secret_xyz789",
    "tokenUrl": "https://api.schoolday.com/oauth/token",
    "baseUrl": "https://sandbox.schoolday.com/oneroster/v1p1"
  },
  "endpoints": ["/users", "/classes", "/enrollments"],
  "expiresAt": "2025-12-13T00:00:00.000Z"
}
```

---

### Chat

AI-powered chat interface.

#### POST /api/chat

Send a message to the AI assistant.

**Authentication**: Optional (for public demo)

**Request**:

```json
{
  "messages": [
    { "role": "user", "content": "How do I integrate with OneRoster?" }
  ],
  "vendorId": "vendor_abc123"
}
```

**Response**: Server-Sent Events (SSE) stream

```
data: {"type": "content", "text": "To integrate with OneRoster..."}
data: {"type": "tool_use", "name": "provision_sandbox", "input": {...}}
data: {"type": "done"}
```

---

## Webhooks

Configure webhooks for real-time notifications.

### Delivery Status Webhook

Receive message delivery updates.

**POST to your endpoint**:

```json
{
  "event": "message.delivered",
  "messageId": "msg_abc123",
  "status": "DELIVERED",
  "timestamp": "2025-12-06T12:00:05.000Z",
  "metadata": { "campaignId": "camp_123" }
}
```

**Event Types**:
- `message.sent`
- `message.delivered`
- `message.failed`
- `message.bounced`

---

## SDKs & Examples

### cURL Examples

```bash
# Get vendor info
curl -H "Authorization: Bearer sk_test_abc123" \
  https://api.schoolday.com/api/vendors/me

# Send email
curl -X POST \
  -H "Authorization: Bearer sk_test_abc123" \
  -H "Content-Type: application/json" \
  -d '{"channel":"EMAIL","recipient":"TKN_PAR_A1B2C3D4","recipientType":"PARENT","subject":"Test","body":"Hello!"}' \
  https://api.schoolday.com/api/cpaas/messages

# Check health
curl https://api.schoolday.com/api/health
```

### TypeScript Example

```typescript
const response = await fetch('https://api.schoolday.com/api/vendors/me', {
  headers: {
    'Authorization': `Bearer ${apiKey}`,
  },
});

const data = await response.json();
console.log(data.vendor.name);
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| v1.0 | 2025-12-06 | Initial API release |

---

For questions, contact support or use the `/help-me` command in the chat interface.
