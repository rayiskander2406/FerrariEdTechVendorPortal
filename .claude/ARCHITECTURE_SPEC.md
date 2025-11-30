# SchoolDay Vendor Portal - Technical Architecture Specification

**Version**: 1.0
**Created**: November 29, 2025
**Status**: APPROVED FOR IMPLEMENTATION
**Author**: Architecture Review

---

## Executive Summary

This document provides detailed technical specifications for evolving the SchoolDay Vendor Portal from MVP to production-ready v1.0. It addresses the five critical gaps identified in the architectural review:

1. **Data Layer** - PostgreSQL + Prisma implementation
2. **Authentication & Authorization** - API key and session management
3. **Vendor Session Layer** - State persistence and audit
4. **CPaaS Metering Infrastructure** - Message tracking and billing
5. **Observability Stack** - Logging, monitoring, error tracking

**Total Estimated Effort**: 12-15 days
**Target Completion**: v1.0 Release

---

## Part 1: Data Layer Specification

### 1.1 Database Selection

| Requirement | Solution |
|-------------|----------|
| Production Database | PostgreSQL 15+ |
| ORM | Prisma 5.x |
| Migrations | Prisma Migrate |
| Connection Pooling | Prisma with PgBouncer for production |
| Development | SQLite or PostgreSQL via Docker |

### 1.2 Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// CORE ENTITIES
// ============================================================================

model Vendor {
  id                String            @id @default(uuid())
  name              String
  email             String            @unique
  website           String?
  linkedInUrl       String?           @map("linkedin_url")

  // Privacy & Access
  accessTier        AccessTier        @default(PRIVACY_SAFE) @map("access_tier")
  podsStatus        PodsStatus        @default(NOT_STARTED) @map("pods_status")
  podsSubmittedAt   DateTime?         @map("pods_submitted_at")
  podsApprovedAt    DateTime?         @map("pods_approved_at")

  // Verification
  verificationScore Int?              @map("verification_score")
  verificationData  Json?             @map("verification_data")
  verifiedAt        DateTime?         @map("verified_at")

  // Metadata
  createdAt         DateTime          @default(now()) @map("created_at")
  updatedAt         DateTime          @updatedAt @map("updated_at")

  // Relations
  integrations      Integration[]
  credentials       Credential[]
  apiKeys           ApiKey[]
  sessions          VendorSession[]
  messages          Message[]
  auditLogs         AuditLog[]

  @@map("vendors")
}

model Integration {
  id              String              @id @default(uuid())
  vendorId        String              @map("vendor_id")
  type            IntegrationType
  status          IntegrationStatus   @default(PENDING)
  config          Json                @default("{}")

  // Metadata
  configuredAt    DateTime?           @map("configured_at")
  lastTestedAt    DateTime?           @map("last_tested_at")
  lastTestResult  Json?               @map("last_test_result")
  createdAt       DateTime            @default(now()) @map("created_at")
  updatedAt       DateTime            @updatedAt @map("updated_at")

  // Relations
  vendor          Vendor              @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  credentials     Credential[]

  @@unique([vendorId, type])
  @@map("integrations")
}

model Credential {
  id              String              @id @default(uuid())
  vendorId        String              @map("vendor_id")
  integrationId   String?             @map("integration_id")
  type            CredentialType

  // Encrypted values (use application-level encryption)
  keyEncrypted    String              @map("key_encrypted")
  secretEncrypted String?             @map("secret_encrypted")

  // Metadata
  environment     Environment         @default(SANDBOX)
  expiresAt       DateTime            @map("expires_at")
  rotatedAt       DateTime?           @map("rotated_at")
  revokedAt       DateTime?           @map("revoked_at")
  createdAt       DateTime            @default(now()) @map("created_at")

  // Relations
  vendor          Vendor              @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  integration     Integration?        @relation(fields: [integrationId], references: [id])

  @@index([vendorId, type])
  @@index([expiresAt])
  @@map("credentials")
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

model ApiKey {
  id              String              @id @default(uuid())
  vendorId        String              @map("vendor_id")

  // Key is stored as hash, prefix stored for identification
  keyPrefix       String              @map("key_prefix")  // e.g., "sd_live_abc"
  keyHash         String              @unique @map("key_hash")

  name            String              @default("Default")
  scopes          String[]            @default(["read", "write"])

  // Usage tracking
  lastUsedAt      DateTime?           @map("last_used_at")
  usageCount      Int                 @default(0) @map("usage_count")

  // Lifecycle
  expiresAt       DateTime?           @map("expires_at")
  revokedAt       DateTime?           @map("revoked_at")
  createdAt       DateTime            @default(now()) @map("created_at")

  // Relations
  vendor          Vendor              @relation(fields: [vendorId], references: [id], onDelete: Cascade)

  @@index([keyPrefix])
  @@map("api_keys")
}

model VendorSession {
  id                String            @id @default(uuid())
  vendorId          String            @map("vendor_id")

  // Conversation state
  conversationHistory Json            @default("[]") @map("conversation_history")
  vendorState       Json              @default("{}") @map("vendor_state")
  activeForm        String?           @map("active_form")

  // Session metadata
  ipAddress         String?           @map("ip_address")
  userAgent         String?           @map("user_agent")

  // Lifecycle
  lastActiveAt      DateTime          @default(now()) @map("last_active_at")
  expiresAt         DateTime          @map("expires_at")
  createdAt         DateTime          @default(now()) @map("created_at")

  // Relations
  vendor            Vendor            @relation(fields: [vendorId], references: [id], onDelete: Cascade)

  @@index([vendorId, lastActiveAt])
  @@index([expiresAt])
  @@map("vendor_sessions")
}

// ============================================================================
// CPAAS - COMMUNICATION PLATFORM
// ============================================================================

model Message {
  id                String            @id @default(uuid())
  vendorId          String            @map("vendor_id")

  // Message details
  channel           MessageChannel
  recipientToken    String            @map("recipient_token")  // TKN_PAR_xxx
  subject           String?
  bodyPreview       String?           @map("body_preview")     // First 100 chars
  templateId        String?           @map("template_id")

  // Delivery tracking
  status            MessageStatus     @default(QUEUED)
  queuedAt          DateTime          @default(now()) @map("queued_at")
  sentAt            DateTime?         @map("sent_at")
  deliveredAt       DateTime?         @map("delivered_at")
  failedAt          DateTime?         @map("failed_at")
  failureReason     String?           @map("failure_reason")

  // Engagement (for email)
  openedAt          DateTime?         @map("opened_at")
  clickedAt         DateTime?         @map("clicked_at")

  // Billing
  costCents         Int               @default(0) @map("cost_cents")  // Store as cents
  billed            Boolean           @default(false)
  billedAt          DateTime?         @map("billed_at")

  // Metadata
  metadata          Json              @default("{}")
  idempotencyKey    String?           @unique @map("idempotency_key")

  // Relations
  vendor            Vendor            @relation(fields: [vendorId], references: [id])
  events            MessageEvent[]

  @@index([vendorId, queuedAt])
  @@index([status])
  @@index([recipientToken])
  @@map("messages")
}

model MessageEvent {
  id                String            @id @default(uuid())
  messageId         String            @map("message_id")

  eventType         MessageEventType  @map("event_type")
  timestamp         DateTime          @default(now())
  details           Json              @default("{}")

  // Relations
  message           Message           @relation(fields: [messageId], references: [id], onDelete: Cascade)

  @@index([messageId, timestamp])
  @@map("message_events")
}

model MessageTemplate {
  id                String            @id @default(uuid())
  vendorId          String            @map("vendor_id")

  name              String
  channel           MessageChannel
  subject           String?
  body              String
  variables         String[]          @default([])

  // Metadata
  isActive          Boolean           @default(true) @map("is_active")
  usageCount        Int               @default(0) @map("usage_count")
  createdAt         DateTime          @default(now()) @map("created_at")
  updatedAt         DateTime          @updatedAt @map("updated_at")

  @@unique([vendorId, name])
  @@map("message_templates")
}

// ============================================================================
// AUDIT & COMPLIANCE
// ============================================================================

model AuditLog {
  id                String            @id @default(uuid())
  vendorId          String?           @map("vendor_id")

  // Action details
  action            String            // e.g., "vendor.created", "message.sent"
  resource          String            // e.g., "vendor", "message", "credential"
  resourceId        String?           @map("resource_id")

  // Context
  actorType         ActorType         @default(VENDOR) @map("actor_type")
  actorId           String?           @map("actor_id")
  ipAddress         String?           @map("ip_address")
  userAgent         String?           @map("user_agent")
  requestId         String?           @map("request_id")

  // Data
  details           Json              @default("{}")
  previousState     Json?             @map("previous_state")
  newState          Json?             @map("new_state")

  // Metadata
  timestamp         DateTime          @default(now())

  // Relations
  vendor            Vendor?           @relation(fields: [vendorId], references: [id])

  @@index([vendorId, timestamp])
  @@index([action, timestamp])
  @@index([resource, resourceId])
  @@index([requestId])
  @@map("audit_logs")
}

// ============================================================================
// ENUMS
// ============================================================================

enum AccessTier {
  PRIVACY_SAFE
  SELECTIVE
  FULL_ACCESS
}

enum PodsStatus {
  NOT_STARTED
  IN_PROGRESS
  SUBMITTED
  APPROVED
  REJECTED
}

enum IntegrationType {
  ONEROSTER
  LTI
  SAML
  OIDC
  SFTP
  COMMUNICATION
}

enum IntegrationStatus {
  PENDING
  CONFIGURED
  TESTING
  ACTIVE
  FAILED
  DISABLED
}

enum CredentialType {
  ONEROSTER_OAUTH
  LTI_PLATFORM
  SAML_SP
  OIDC_CLIENT
  SFTP_KEY
  API_KEY
}

enum Environment {
  SANDBOX
  PRODUCTION
}

enum MessageChannel {
  EMAIL
  SMS
  PUSH
}

enum MessageStatus {
  QUEUED
  SENDING
  SENT
  DELIVERED
  FAILED
  BOUNCED
}

enum MessageEventType {
  QUEUED
  SENT
  DELIVERED
  OPENED
  CLICKED
  BOUNCED
  FAILED
  UNSUBSCRIBED
  SPAM_REPORTED
}

enum ActorType {
  VENDOR
  SYSTEM
  ADMIN
  DISTRICT
}
```

### 1.3 Database Migration Strategy

```typescript
// scripts/migrate.ts

import { execSync } from 'child_process';

const MIGRATION_STEPS = [
  // Step 1: Create initial schema
  'npx prisma migrate dev --name init',

  // Step 2: Seed demo data
  'npx prisma db seed',

  // Step 3: Generate client
  'npx prisma generate',
];

async function migrate() {
  console.log('Starting database migration...');

  for (const step of MIGRATION_STEPS) {
    console.log(`Running: ${step}`);
    execSync(step, { stdio: 'inherit' });
  }

  console.log('Migration complete!');
}

migrate().catch(console.error);
```

### 1.4 Seed Data for Development

```typescript
// prisma/seed.ts

import { PrismaClient, AccessTier, PodsStatus } from '@prisma/client';
import { hashApiKey, generateApiKey } from '../lib/auth/api-keys';

const prisma = new PrismaClient();

async function seed() {
  // Create demo vendor
  const demoVendor = await prisma.vendor.create({
    data: {
      id: 'demo-vendor-001',
      name: 'MathGenius Learning',
      email: 'demo@mathgenius.com',
      website: 'https://mathgenius.com',
      accessTier: AccessTier.PRIVACY_SAFE,
      podsStatus: PodsStatus.APPROVED,
      verificationScore: 85,
    },
  });

  // Create API key for demo vendor
  const { key, prefix, hash } = await generateApiKey();
  await prisma.apiKey.create({
    data: {
      vendorId: demoVendor.id,
      keyPrefix: prefix,
      keyHash: hash,
      name: 'Demo API Key',
      scopes: ['read', 'write', 'message'],
    },
  });

  console.log(`Demo vendor created with API key: ${key}`);
  console.log('Store this key securely - it cannot be retrieved later!');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### 1.5 Database Access Layer

```typescript
// lib/db/prisma.ts

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// lib/db/repositories/vendor.repository.ts

import { prisma } from '../prisma';
import { Vendor, AccessTier, PodsStatus } from '@prisma/client';
import { encrypt, decrypt } from '../../crypto';

export class VendorRepository {
  async create(data: CreateVendorInput): Promise<Vendor> {
    return prisma.vendor.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        website: data.website,
        linkedInUrl: data.linkedInUrl,
        accessTier: this.determineAccessTier(data.dataElements),
        podsStatus: PodsStatus.SUBMITTED,
        podsSubmittedAt: new Date(),
      },
    });
  }

  async findByEmail(email: string): Promise<Vendor | null> {
    return prisma.vendor.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        integrations: true,
        credentials: true,
      },
    });
  }

  async findById(id: string): Promise<Vendor | null> {
    return prisma.vendor.findUnique({
      where: { id },
      include: {
        integrations: true,
        credentials: true,
      },
    });
  }

  async updateVerification(
    id: string,
    score: number,
    data: VerificationData
  ): Promise<Vendor> {
    return prisma.vendor.update({
      where: { id },
      data: {
        verificationScore: score,
        verificationData: data as any,
        verifiedAt: new Date(),
      },
    });
  }

  private determineAccessTier(dataElements: string[]): AccessTier {
    const piiElements = ['FULL_NAME', 'DATE_OF_BIRTH', 'ADDRESS', 'PHONE', 'EMAIL'];
    const hasPii = dataElements.some(el => piiElements.includes(el));

    if (!hasPii) return AccessTier.PRIVACY_SAFE;

    const fullPii = ['ADDRESS', 'PHONE', 'SSN'];
    const hasFullPii = dataElements.some(el => fullPii.includes(el));

    return hasFullPii ? AccessTier.FULL_ACCESS : AccessTier.SELECTIVE;
  }
}

export const vendorRepository = new VendorRepository();
```

---

## Part 2: Authentication & Authorization Specification

### 2.1 API Key System

```typescript
// lib/auth/api-keys.ts

import { createHash, randomBytes } from 'crypto';

const API_KEY_PREFIX = 'sd';
const KEY_LENGTH = 32;

export interface GeneratedApiKey {
  key: string;      // Full key (only shown once)
  prefix: string;   // First 12 chars for identification
  hash: string;     // SHA-256 hash for storage
}

export async function generateApiKey(): Promise<GeneratedApiKey> {
  const environment = process.env.NODE_ENV === 'production' ? 'live' : 'test';
  const randomPart = randomBytes(KEY_LENGTH).toString('base64url');
  const key = `${API_KEY_PREFIX}_${environment}_${randomPart}`;

  return {
    key,
    prefix: key.substring(0, 15),
    hash: hashApiKey(key),
  };
}

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export async function validateApiKey(key: string): Promise<ApiKeyValidation> {
  const hash = hashApiKey(key);

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash: hash },
    include: { vendor: true },
  });

  if (!apiKey) {
    return { valid: false, error: 'Invalid API key' };
  }

  if (apiKey.revokedAt) {
    return { valid: false, error: 'API key has been revoked' };
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return { valid: false, error: 'API key has expired' };
  }

  // Update usage stats
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: {
      lastUsedAt: new Date(),
      usageCount: { increment: 1 },
    },
  });

  return {
    valid: true,
    vendorId: apiKey.vendorId,
    vendor: apiKey.vendor,
    scopes: apiKey.scopes,
  };
}
```

### 2.2 Authentication Middleware

```typescript
// lib/auth/middleware.ts

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from './api-keys';
import { createRequestContext } from '../observability/context';

export interface AuthenticatedRequest extends NextRequest {
  vendorId: string;
  vendor: Vendor;
  scopes: string[];
  requestId: string;
}

export async function withAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<Response>
): Promise<Response> {
  const requestId = createRequestContext();

  // Extract API key from header
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing or invalid Authorization header' },
      { status: 401 }
    );
  }

  const apiKey = authHeader.substring(7);
  const validation = await validateApiKey(apiKey);

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error },
      { status: 401 }
    );
  }

  // Attach auth context to request
  const authenticatedRequest = request as AuthenticatedRequest;
  authenticatedRequest.vendorId = validation.vendorId!;
  authenticatedRequest.vendor = validation.vendor!;
  authenticatedRequest.scopes = validation.scopes!;
  authenticatedRequest.requestId = requestId;

  return handler(authenticatedRequest);
}

// Scope checking
export function requireScopes(...requiredScopes: string[]) {
  return (req: AuthenticatedRequest): boolean => {
    return requiredScopes.every(scope => req.scopes.includes(scope));
  };
}
```

### 2.3 Rate Limiting

```typescript
// lib/auth/rate-limiter.ts

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Use Upstash Redis for serverless-compatible rate limiting
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// Different rate limits by tier
const rateLimiters = {
  // Free/Privacy-Safe: 100 requests per minute
  PRIVACY_SAFE: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    prefix: 'ratelimit:privacy_safe',
  }),

  // Selective: 500 requests per minute
  SELECTIVE: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(500, '1 m'),
    prefix: 'ratelimit:selective',
  }),

  // Full Access: 1000 requests per minute
  FULL_ACCESS: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1000, '1 m'),
    prefix: 'ratelimit:full_access',
  }),
};

export async function checkRateLimit(
  vendorId: string,
  accessTier: AccessTier
): Promise<RateLimitResult> {
  const limiter = rateLimiters[accessTier];
  const result = await limiter.limit(vendorId);

  return {
    allowed: result.success,
    remaining: result.remaining,
    reset: result.reset,
    limit: result.limit,
  };
}

export function withRateLimit(handler: Function) {
  return async (req: AuthenticatedRequest) => {
    const rateLimit = await checkRateLimit(
      req.vendorId,
      req.vendor.accessTier
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((rateLimit.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimit.reset),
            'Retry-After': String(Math.ceil((rateLimit.reset - Date.now()) / 1000)),
          },
        }
      );
    }

    const response = await handler(req);

    // Add rate limit headers to successful responses
    response.headers.set('X-RateLimit-Limit', String(rateLimit.limit));
    response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
    response.headers.set('X-RateLimit-Reset', String(rateLimit.reset));

    return response;
  };
}
```

---

## Part 3: Vendor Session Layer Specification

### 3.1 Session Manager

```typescript
// lib/session/vendor-session.ts

import { prisma } from '../db/prisma';
import { AccessTier, Vendor, Integration } from '@prisma/client';
import { logger } from '../observability/logger';

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface VendorSessionData {
  id: string;
  vendorId: string;
  vendor: Vendor;
  integrations: Integration[];
  conversationHistory: ChatMessage[];
  vendorState: VendorState;
  activeForm: string | null;
}

export class VendorSessionManager {

  async createSession(
    vendorId: string,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<VendorSessionData> {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: { integrations: true },
    });

    if (!vendor) {
      throw new Error(`Vendor not found: ${vendorId}`);
    }

    const session = await prisma.vendorSession.create({
      data: {
        vendorId,
        conversationHistory: [],
        vendorState: this.initializeVendorState(vendor),
        expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      },
    });

    logger.info({ vendorId, sessionId: session.id }, 'Session created');

    return {
      id: session.id,
      vendorId,
      vendor,
      integrations: vendor.integrations,
      conversationHistory: [],
      vendorState: session.vendorState as VendorState,
      activeForm: null,
    };
  }

  async getSession(sessionId: string): Promise<VendorSessionData | null> {
    const session = await prisma.vendorSession.findUnique({
      where: { id: sessionId },
      include: {
        vendor: {
          include: { integrations: true },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return {
      id: session.id,
      vendorId: session.vendorId,
      vendor: session.vendor,
      integrations: session.vendor.integrations,
      conversationHistory: session.conversationHistory as ChatMessage[],
      vendorState: session.vendorState as VendorState,
      activeForm: session.activeForm,
    };
  }

  async updateSession(
    sessionId: string,
    updates: Partial<{
      conversationHistory: ChatMessage[];
      vendorState: VendorState;
      activeForm: string | null;
    }>
  ): Promise<void> {
    await prisma.vendorSession.update({
      where: { id: sessionId },
      data: {
        ...updates,
        lastActiveAt: new Date(),
      },
    });
  }

  async appendMessage(sessionId: string, message: ChatMessage): Promise<void> {
    const session = await prisma.vendorSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const history = session.conversationHistory as ChatMessage[];
    history.push(message);

    // Keep last 50 messages to prevent unbounded growth
    const trimmedHistory = history.slice(-50);

    await prisma.vendorSession.update({
      where: { id: sessionId },
      data: {
        conversationHistory: trimmedHistory,
        lastActiveAt: new Date(),
      },
    });
  }

  async deleteSession(sessionId: string): Promise<void> {
    await prisma.vendorSession.delete({
      where: { id: sessionId },
    });
    logger.info({ sessionId }, 'Session deleted');
  }

  // Cleanup expired sessions (run via cron)
  async cleanupExpiredSessions(): Promise<number> {
    const result = await prisma.vendorSession.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    logger.info({ count: result.count }, 'Expired sessions cleaned up');
    return result.count;
  }

  private initializeVendorState(vendor: Vendor): VendorState {
    return {
      vendorId: vendor.id,
      vendorName: vendor.name,
      accessTier: vendor.accessTier,
      podsStatus: vendor.podsStatus,
      integrations: {},
      onboardingStep: vendor.podsStatus === 'APPROVED' ? 'complete' : 'pods',
    };
  }
}

export const sessionManager = new VendorSessionManager();
```

### 3.2 Session-Aware Chat API

```typescript
// app/api/chat/route.ts (updated)

import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { withRateLimit } from '@/lib/auth/rate-limiter';
import { sessionManager } from '@/lib/session/vendor-session';
import { auditLogger } from '@/lib/observability/audit';

export async function POST(request: Request) {
  return withAuth(request as any, async (req: AuthenticatedRequest) => {
    return withRateLimit(async (req: AuthenticatedRequest) => {
      const { messages, sessionId } = await req.json();

      // Get or create session
      let session = sessionId
        ? await sessionManager.getSession(sessionId)
        : null;

      if (!session) {
        session = await sessionManager.createSession(req.vendorId, {
          ipAddress: req.ip,
          userAgent: req.headers.get('user-agent') || undefined,
        });
      }

      // Log the chat request
      await auditLogger.log({
        vendorId: req.vendorId,
        action: 'chat.message',
        resource: 'session',
        resourceId: session.id,
        requestId: req.requestId,
        details: {
          messageCount: messages.length,
        },
      });

      // Build context-aware system prompt
      const systemPrompt = buildSystemPrompt({
        vendor: session.vendor,
        integrations: session.integrations,
        vendorState: session.vendorState,
        conversationHistory: session.conversationHistory,
      });

      // Process with Claude (existing streaming logic)
      const response = await processWithClaude(
        systemPrompt,
        [...session.conversationHistory, ...messages],
        session.id
      );

      // Save the new messages to session
      for (const msg of messages) {
        await sessionManager.appendMessage(session.id, msg);
      }

      return response;
    })(req);
  });
}
```

---

## Part 4: CPaaS Metering Infrastructure Specification

### 4.1 Message Queue System

```typescript
// lib/cpaas/queue.ts

import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { prisma } from '../db/prisma';
import { sendEmail, sendSms, sendPush } from './providers';
import { logger } from '../observability/logger';

const redis = new Redis(process.env.REDIS_URL!);

// Message processing queue
export const messageQueue = new Queue('messages', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 100,
    removeOnFail: 1000,
  },
});

// Worker to process messages
const messageWorker = new Worker(
  'messages',
  async (job: Job<QueuedMessage>) => {
    const { messageId, channel, recipientToken, subject, body } = job.data;

    logger.info({ messageId, channel }, 'Processing message');

    try {
      // Update status to SENDING
      await updateMessageStatus(messageId, 'SENDING');

      // Route to appropriate provider
      let result: SendResult;
      switch (channel) {
        case 'EMAIL':
          result = await sendEmail(recipientToken, subject!, body);
          break;
        case 'SMS':
          result = await sendSms(recipientToken, body);
          break;
        case 'PUSH':
          result = await sendPush(recipientToken, subject!, body);
          break;
        default:
          throw new Error(`Unknown channel: ${channel}`);
      }

      // Update status based on result
      await updateMessageStatus(
        messageId,
        result.success ? 'SENT' : 'FAILED',
        result
      );

      logger.info({ messageId, success: result.success }, 'Message processed');

      return result;
    } catch (error) {
      logger.error({ messageId, error }, 'Message processing failed');
      await updateMessageStatus(messageId, 'FAILED', { error: String(error) });
      throw error;
    }
  },
  { connection: redis, concurrency: 10 }
);

async function updateMessageStatus(
  messageId: string,
  status: MessageStatus,
  details?: any
): Promise<void> {
  const updates: any = { status };

  if (status === 'SENT') updates.sentAt = new Date();
  if (status === 'DELIVERED') updates.deliveredAt = new Date();
  if (status === 'FAILED') {
    updates.failedAt = new Date();
    updates.failureReason = details?.error;
  }

  await prisma.message.update({
    where: { id: messageId },
    data: updates,
  });

  // Record event
  await prisma.messageEvent.create({
    data: {
      messageId,
      eventType: status as MessageEventType,
      details: details || {},
    },
  });
}
```

### 4.2 CPaaS API Endpoints

```typescript
// app/api/cpaas/messages/route.ts

import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { withRateLimit } from '@/lib/auth/rate-limiter';
import { messageQueue } from '@/lib/cpaas/queue';
import { calculateMessageCost } from '@/lib/cpaas/pricing';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const SendMessageSchema = z.object({
  channel: z.enum(['EMAIL', 'SMS', 'PUSH']),
  recipients: z.array(z.string().regex(/^TKN_PAR_[A-Z0-9]{8}$/)),
  subject: z.string().optional(),
  body: z.string().min(1).max(10000),
  templateId: z.string().optional(),
  templateVars: z.record(z.string()).optional(),
  priority: z.enum(['HIGH', 'NORMAL', 'LOW']).default('NORMAL'),
  scheduledAt: z.string().datetime().optional(),
  idempotencyKey: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export async function POST(request: Request) {
  return withAuth(request as any, async (req: AuthenticatedRequest) => {
    return withRateLimit(async (req: AuthenticatedRequest) => {
      const body = await req.json();
      const input = SendMessageSchema.parse(body);

      // Check idempotency
      if (input.idempotencyKey) {
        const existing = await prisma.message.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
        });
        if (existing) {
          return Response.json({
            messageId: existing.id,
            status: existing.status,
            duplicate: true,
          });
        }
      }

      // Calculate cost
      const costPerMessage = calculateMessageCost(
        input.channel,
        req.vendor.accessTier
      );
      const totalCost = costPerMessage * input.recipients.length;

      // Create message records
      const messages = await prisma.$transaction(
        input.recipients.map((recipientToken) =>
          prisma.message.create({
            data: {
              vendorId: req.vendorId,
              channel: input.channel,
              recipientToken,
              subject: input.subject,
              bodyPreview: input.body.substring(0, 100),
              templateId: input.templateId,
              costCents: Math.round(costPerMessage * 100),
              idempotencyKey: input.idempotencyKey,
              metadata: input.metadata || {},
            },
          })
        )
      );

      // Queue for delivery
      for (const message of messages) {
        await messageQueue.add(
          'send',
          {
            messageId: message.id,
            channel: input.channel,
            recipientToken: message.recipientToken,
            subject: input.subject,
            body: input.body,
          },
          {
            priority: input.priority === 'HIGH' ? 1 : input.priority === 'LOW' ? 3 : 2,
            delay: input.scheduledAt
              ? new Date(input.scheduledAt).getTime() - Date.now()
              : 0,
          }
        );
      }

      return Response.json({
        batchId: messages[0]?.id,
        messageIds: messages.map((m) => m.id),
        recipientsCount: messages.length,
        status: 'QUEUED',
        estimatedCost: {
          amount: totalCost,
          currency: 'USD',
        },
      });
    })(req);
  });
}
```

### 4.3 Pricing Engine

```typescript
// lib/cpaas/pricing.ts

import { AccessTier, MessageChannel } from '@prisma/client';

// Pricing in dollars per message
const PRICING_TIERS: Record<AccessTier, Record<MessageChannel, PricingTier[]>> = {
  PRIVACY_SAFE: {
    EMAIL: [
      { maxVolume: 10000, price: 0.003 },
      { maxVolume: 100000, price: 0.002 },
      { maxVolume: Infinity, price: 0.0015 },
    ],
    SMS: [
      { maxVolume: 5000, price: 0.015 },
      { maxVolume: 50000, price: 0.012 },
      { maxVolume: Infinity, price: 0.009 },
    ],
    PUSH: [
      { maxVolume: 100000, price: 0.0005 },
      { maxVolume: Infinity, price: 0.0003 },
    ],
  },
  SELECTIVE: {
    // 10% discount for verified vendors
    EMAIL: [
      { maxVolume: 10000, price: 0.0027 },
      { maxVolume: 100000, price: 0.0018 },
      { maxVolume: Infinity, price: 0.00135 },
    ],
    SMS: [
      { maxVolume: 5000, price: 0.0135 },
      { maxVolume: 50000, price: 0.0108 },
      { maxVolume: Infinity, price: 0.0081 },
    ],
    PUSH: [
      { maxVolume: 100000, price: 0.00045 },
      { maxVolume: Infinity, price: 0.00027 },
    ],
  },
  FULL_ACCESS: {
    // 20% discount for enterprise
    EMAIL: [
      { maxVolume: 10000, price: 0.0024 },
      { maxVolume: 100000, price: 0.0016 },
      { maxVolume: Infinity, price: 0.0012 },
    ],
    SMS: [
      { maxVolume: 5000, price: 0.012 },
      { maxVolume: 50000, price: 0.0096 },
      { maxVolume: Infinity, price: 0.0072 },
    ],
    PUSH: [
      { maxVolume: 100000, price: 0.0004 },
      { maxVolume: Infinity, price: 0.00024 },
    ],
  },
};

export function calculateMessageCost(
  channel: MessageChannel,
  accessTier: AccessTier,
  monthlyVolume: number = 0
): number {
  const tiers = PRICING_TIERS[accessTier][channel];

  for (const tier of tiers) {
    if (monthlyVolume < tier.maxVolume) {
      return tier.price;
    }
  }

  return tiers[tiers.length - 1].price;
}

export async function getMonthlyUsage(vendorId: string): Promise<UsageSummary> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const usage = await prisma.message.groupBy({
    by: ['channel'],
    where: {
      vendorId,
      queuedAt: { gte: startOfMonth },
    },
    _count: { id: true },
    _sum: { costCents: true },
  });

  return {
    period: {
      start: startOfMonth,
      end: new Date(),
    },
    byChannel: usage.reduce((acc, u) => {
      acc[u.channel] = {
        count: u._count.id,
        costCents: u._sum.costCents || 0,
      };
      return acc;
    }, {} as Record<string, { count: number; costCents: number }>),
    totalCostCents: usage.reduce((sum, u) => sum + (u._sum.costCents || 0), 0),
  };
}
```

---

## Part 5: Observability Stack Specification

### 5.1 Structured Logging

```typescript
// lib/observability/logger.ts

import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',

  // Add standard fields
  base: {
    service: 'schoolday-vendor-portal',
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV,
  },

  // Pretty print in development
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined,

  // Redact sensitive fields
  redact: {
    paths: [
      'apiKey',
      'password',
      'secret',
      'token',
      '*.apiKey',
      '*.password',
      '*.secret',
      '*.token',
    ],
    censor: '[REDACTED]',
  },
});

// Child logger with request context
export function createRequestLogger(requestId: string, vendorId?: string) {
  return logger.child({
    requestId,
    vendorId,
  });
}

// Specialized loggers
export const auditLogger = logger.child({ type: 'audit' });
export const performanceLogger = logger.child({ type: 'performance' });
export const securityLogger = logger.child({ type: 'security' });
```

### 5.2 Request Context & Tracing

```typescript
// lib/observability/context.ts

import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

interface RequestContext {
  requestId: string;
  vendorId?: string;
  sessionId?: string;
  startTime: number;
}

const contextStorage = new AsyncLocalStorage<RequestContext>();

export function createRequestContext(): string {
  const requestId = randomUUID();
  const context: RequestContext = {
    requestId,
    startTime: Date.now(),
  };
  contextStorage.enterWith(context);
  return requestId;
}

export function getRequestContext(): RequestContext | undefined {
  return contextStorage.getStore();
}

export function setVendorContext(vendorId: string, sessionId?: string): void {
  const context = contextStorage.getStore();
  if (context) {
    context.vendorId = vendorId;
    context.sessionId = sessionId;
  }
}

// Middleware to add request ID to responses
export function withRequestContext(handler: Function) {
  return async (request: Request, ...args: any[]) => {
    const requestId = createRequestContext();

    try {
      const response = await handler(request, ...args);
      response.headers.set('X-Request-ID', requestId);
      return response;
    } finally {
      // Log request completion
      const context = getRequestContext();
      if (context) {
        const duration = Date.now() - context.startTime;
        performanceLogger.info({
          requestId: context.requestId,
          vendorId: context.vendorId,
          duration,
          path: new URL(request.url).pathname,
          method: request.method,
        }, 'Request completed');
      }
    }
  };
}
```

### 5.3 Audit Logging

```typescript
// lib/observability/audit.ts

import { prisma } from '../db/prisma';
import { getRequestContext } from './context';
import { logger } from './logger';

interface AuditEntry {
  vendorId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  previousState?: Record<string, any>;
  newState?: Record<string, any>;
}

class AuditLogger {
  async log(entry: AuditEntry): Promise<void> {
    const context = getRequestContext();

    const auditLog = await prisma.auditLog.create({
      data: {
        vendorId: entry.vendorId,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        actorType: entry.vendorId ? 'VENDOR' : 'SYSTEM',
        actorId: entry.vendorId,
        requestId: context?.requestId,
        details: entry.details || {},
        previousState: entry.previousState,
        newState: entry.newState,
      },
    });

    logger.info({
      auditId: auditLog.id,
      ...entry,
      requestId: context?.requestId,
    }, `Audit: ${entry.action}`);
  }

  // Query audit logs
  async query(filters: {
    vendorId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({
      where: {
        vendorId: filters.vendorId,
        action: filters.action ? { contains: filters.action } : undefined,
        resource: filters.resource,
        timestamp: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      },
      orderBy: { timestamp: 'desc' },
      take: filters.limit || 100,
    });
  }
}

export const auditLogger = new AuditLogger();
```

### 5.4 Error Tracking Integration

```typescript
// lib/observability/errors.ts

import * as Sentry from '@sentry/nextjs';
import { logger } from './logger';
import { getRequestContext } from './context';

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  beforeSend(event) {
    // Scrub sensitive data
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }
    return event;
  },
});

export function captureError(
  error: Error,
  context?: Record<string, any>
): void {
  const requestContext = getRequestContext();

  // Log locally
  logger.error({
    error: error.message,
    stack: error.stack,
    requestId: requestContext?.requestId,
    vendorId: requestContext?.vendorId,
    ...context,
  }, 'Error captured');

  // Send to Sentry
  Sentry.withScope((scope) => {
    if (requestContext?.requestId) {
      scope.setTag('requestId', requestContext.requestId);
    }
    if (requestContext?.vendorId) {
      scope.setUser({ id: requestContext.vendorId });
    }
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureException(error);
  });
}

// Wrapper for async handlers
export function withErrorHandling(handler: Function) {
  return async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      captureError(error as Error);
      throw error;
    }
  };
}
```

### 5.5 Metrics Collection

```typescript
// lib/observability/metrics.ts

import { Counter, Histogram, Gauge, Registry } from 'prom-client';

export const metricsRegistry = new Registry();

// Request metrics
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [metricsRegistry],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [metricsRegistry],
});

// CPaaS metrics
export const messagesQueued = new Counter({
  name: 'cpaas_messages_queued_total',
  help: 'Total messages queued',
  labelNames: ['channel', 'vendor_tier'],
  registers: [metricsRegistry],
});

export const messagesDelivered = new Counter({
  name: 'cpaas_messages_delivered_total',
  help: 'Total messages delivered',
  labelNames: ['channel', 'status'],
  registers: [metricsRegistry],
});

export const messageDeliveryDuration = new Histogram({
  name: 'cpaas_message_delivery_seconds',
  help: 'Message delivery duration in seconds',
  labelNames: ['channel'],
  buckets: [0.5, 1, 2, 5, 10, 30],
  registers: [metricsRegistry],
});

// AI metrics
export const aiToolCalls = new Counter({
  name: 'ai_tool_calls_total',
  help: 'Total AI tool invocations',
  labelNames: ['tool', 'status'],
  registers: [metricsRegistry],
});

export const aiResponseDuration = new Histogram({
  name: 'ai_response_duration_seconds',
  help: 'AI response generation duration',
  labelNames: ['has_tools'],
  buckets: [1, 2, 5, 10, 30, 60],
  registers: [metricsRegistry],
});

// Metrics endpoint
export async function getMetrics(): Promise<string> {
  return metricsRegistry.metrics();
}
```

---

## Part 6: Environment Configuration

### 6.1 Environment Variables

```env
# .env.example

# =============================================================================
# REQUIRED - Application will not start without these
# =============================================================================

# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-...

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/schoolday

# Redis (for rate limiting, queues, sessions)
REDIS_URL=redis://localhost:6379
UPSTASH_REDIS_URL=https://...
UPSTASH_REDIS_TOKEN=...

# =============================================================================
# SECURITY
# =============================================================================

# Encryption key for credentials (32 bytes, base64)
ENCRYPTION_KEY=...

# Session secret
SESSION_SECRET=...

# =============================================================================
# OBSERVABILITY
# =============================================================================

# Logging
LOG_LEVEL=info  # debug, info, warn, error

# Error tracking
SENTRY_DSN=https://...@sentry.io/...

# =============================================================================
# CPAAS PROVIDERS (optional for demo)
# =============================================================================

# Email (SendGrid)
SENDGRID_API_KEY=SG....

# SMS (Twilio)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# Push (Firebase)
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...

# =============================================================================
# FEATURE FLAGS
# =============================================================================

# Use server-side feature flags instead of localStorage
FEATURE_FLAGS_BACKEND=server  # localStorage | server

# =============================================================================
# DEVELOPMENT
# =============================================================================

# Use mock database (in-memory)
USE_MOCK_DB=false

# Claude model version
CLAUDE_MODEL=claude-sonnet-4-20250514

# =============================================================================
# DEPLOYMENT
# =============================================================================

NODE_ENV=development  # development | production
VERCEL_URL=...
```

### 6.2 Configuration Module

```typescript
// lib/config/index.ts

import { z } from 'zod';

const ConfigSchema = z.object({
  // Required
  anthropicApiKey: z.string().min(1),
  databaseUrl: z.string().url(),
  redisUrl: z.string().min(1),

  // Security
  encryptionKey: z.string().min(32).optional(),
  sessionSecret: z.string().min(32).optional(),

  // Observability
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  sentryDsn: z.string().optional(),

  // Features
  useMockDb: z.boolean().default(false),
  claudeModel: z.string().default('claude-sonnet-4-20250514'),
  featureFlagsBackend: z.enum(['localStorage', 'server']).default('localStorage'),

  // Environment
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  vercelUrl: z.string().optional(),
});

export type Config = z.infer<typeof ConfigSchema>;

function loadConfig(): Config {
  const config = ConfigSchema.parse({
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL,
    encryptionKey: process.env.ENCRYPTION_KEY,
    sessionSecret: process.env.SESSION_SECRET,
    logLevel: process.env.LOG_LEVEL,
    sentryDsn: process.env.SENTRY_DSN,
    useMockDb: process.env.USE_MOCK_DB === 'true',
    claudeModel: process.env.CLAUDE_MODEL,
    featureFlagsBackend: process.env.FEATURE_FLAGS_BACKEND,
    nodeEnv: process.env.NODE_ENV,
    vercelUrl: process.env.VERCEL_URL,
  });

  // Validate required secrets in production
  if (config.nodeEnv === 'production') {
    if (!config.encryptionKey) {
      throw new Error('ENCRYPTION_KEY is required in production');
    }
    if (!config.sessionSecret) {
      throw new Error('SESSION_SECRET is required in production');
    }
    if (config.useMockDb) {
      throw new Error('Cannot use mock database in production');
    }
  }

  return config;
}

export const config = loadConfig();
```

---

## Part 7: Implementation Roadmap

### Phase 1: Foundation (Days 1-3)

| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Prisma schema | `prisma/schema.prisma` complete |
| 1 | Database setup | PostgreSQL + migrations running |
| 2 | Repository layer | All CRUD operations working |
| 2 | Seed data | Demo vendor + API key |
| 3 | API key system | Auth middleware integrated |
| 3 | Rate limiting | Upstash integration |

### Phase 2: Session & State (Days 4-5)

| Day | Task | Deliverable |
|-----|------|-------------|
| 4 | Session manager | `lib/session/vendor-session.ts` |
| 4 | Chat persistence | Conversation history saved |
| 5 | Session cleanup | Cron job for expired sessions |
| 5 | Chat API update | Session-aware streaming |

### Phase 3: CPaaS Metering (Days 6-8)

| Day | Task | Deliverable |
|-----|------|-------------|
| 6 | Message schema | Prisma models + migrations |
| 6 | Queue setup | BullMQ + Redis |
| 7 | Pricing engine | `lib/cpaas/pricing.ts` |
| 7 | Send endpoint | `POST /api/cpaas/messages` |
| 8 | Status tracking | Webhook delivery status |
| 8 | Usage API | `GET /api/cpaas/usage` |

### Phase 4: Observability (Days 9-10)

| Day | Task | Deliverable |
|-----|------|-------------|
| 9 | Structured logging | Pino setup + request logging |
| 9 | Audit logging | All mutations logged |
| 10 | Error tracking | Sentry integration |
| 10 | Metrics | Prometheus endpoint |

### Phase 5: Testing & Hardening (Days 11-12)

| Day | Task | Deliverable |
|-----|------|-------------|
| 11 | Integration tests | API endpoints covered |
| 11 | E2E tests | Critical paths with Playwright |
| 12 | Load testing | k6 scripts for CPaaS |
| 12 | Security audit | OWASP checklist review |

---

## Appendix A: Migration from Mock Database

```typescript
// scripts/migrate-from-mock.ts

/**
 * One-time migration script to move data from in-memory mock to PostgreSQL.
 * Run BEFORE deploying the new database layer.
 */

import { mockVendorStore, mockSandboxStore, mockAuditStore } from '../lib/db/mock';
import { prisma } from '../lib/db/prisma';

async function migrate() {
  console.log('Starting migration from mock database...');

  // 1. Migrate vendors
  const vendors = Array.from(mockVendorStore.values());
  console.log(`Migrating ${vendors.length} vendors...`);

  for (const vendor of vendors) {
    await prisma.vendor.upsert({
      where: { email: vendor.email },
      create: {
        id: vendor.id,
        name: vendor.name,
        email: vendor.email,
        website: vendor.website,
        accessTier: vendor.accessTier,
        podsStatus: vendor.podsStatus,
        createdAt: vendor.createdAt,
      },
      update: {},
    });
  }

  // 2. Migrate credentials
  const sandboxes = Array.from(mockSandboxStore.values());
  console.log(`Migrating ${sandboxes.length} sandbox credentials...`);

  for (const sandbox of sandboxes) {
    await prisma.credential.create({
      data: {
        vendorId: sandbox.vendorId,
        type: 'ONEROSTER_OAUTH',
        keyEncrypted: encrypt(sandbox.clientId),
        secretEncrypted: encrypt(sandbox.clientSecret),
        environment: 'SANDBOX',
        expiresAt: sandbox.expiresAt,
        createdAt: sandbox.createdAt,
      },
    });
  }

  // 3. Migrate audit logs
  console.log(`Migrating ${mockAuditStore.length} audit logs...`);

  await prisma.auditLog.createMany({
    data: mockAuditStore.map((log) => ({
      vendorId: log.vendorId,
      action: log.action,
      resource: log.resource || 'unknown',
      details: log.details,
      timestamp: log.timestamp,
    })),
  });

  console.log('Migration complete!');
}

migrate().catch(console.error).finally(() => prisma.$disconnect());
```

---

## Appendix B: API Endpoint Summary

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/chat` | POST | API Key | AI chat with session |
| `/api/vendors` | GET | API Key | Get vendor profile |
| `/api/vendors` | PUT | API Key | Update vendor profile |
| `/api/integrations` | GET | API Key | List integrations |
| `/api/integrations/:type` | PUT | API Key | Configure integration |
| `/api/credentials` | GET | API Key | Get active credentials |
| `/api/credentials/rotate` | POST | API Key | Rotate credentials |
| `/api/cpaas/messages` | POST | API Key | Send message(s) |
| `/api/cpaas/messages/:id` | GET | API Key | Get message status |
| `/api/cpaas/usage` | GET | API Key | Get usage summary |
| `/api/cpaas/templates` | GET | API Key | List templates |
| `/api/cpaas/templates` | POST | API Key | Create template |
| `/api/audit` | GET | API Key | Query audit logs |
| `/api/health` | GET | None | Health check |
| `/api/metrics` | GET | Internal | Prometheus metrics |

---

*This specification provides the technical foundation for evolving SchoolDay Vendor Portal from MVP to production. Implementation should follow the phased roadmap, with each phase validated before proceeding.*
