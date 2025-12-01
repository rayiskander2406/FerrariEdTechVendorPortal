# PLANNING - SchoolDay Vendor Portal

**Last Updated**: November 29, 2025
**Mission**: Disrupt Clever and become the dominant K-12 integration platform in 18 months
**Version**: MVP → v1.0 → v2.0 → v3.0 (Market Leader)

> **Strategic Context**: Before starting development, read [STRATEGY.md](./STRATEGY.md) for the "True North" - why we chose Ed-Fi as our internal data model, the competitive analysis, and the SSO strategy.

---

## Current Release: MVP

```
╔══════════════════════════════════════════════════════════════════════════╗
║                         MVP RELEASE PLAN                                  ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  GOAL: Demo-ready for LAUSD stakeholder presentations                    ║
║  STATUS: 🚧 In Progress (7 of 10 P1 tasks complete)                      ║
║                                                                          ║
║  ┌────────────────────────────────────────────────────────────────────┐ ║
║  │ COMPLETED                          │ REMAINING                     │ ║
║  ├────────────────────────────────────┼───────────────────────────────┤ ║
║  │ ✅ MVP-01: AI tools verified       │ 📋 MVP-04: Streaming fixes    │ ║
║  │    574 tests, 90%+ coverage        │ 📋 MVP-05: Form triggers      │ ║
║  │ ✅ MVP-02: Privacy audit           │ 📋 MVP-06: CPaaS demo polish  │ ║
║  │    Zero PII leakage detected       │    (Revenue showcase)         │ ║
║  │ ✅ MVP-03: Demo workflows          │                               │ ║
║  │    ALL 5 WORKFLOWS PASS ✅         │                               │ ║
║  │ ✅ BUG-002: Sandbox endpoints      │                               │ ║
║  │    87 tests, honors vendor prefs   │                               │ ║
║  │ ✅ CONFIG-01: Forms centralized    │                               │ ║
║  │    79 tests, forms.ts SSOT         │                               │ ║
║  │ ✅ CONFIG-02: SSO centralized      │                               │ ║
║  │    93 tests, sso.ts SSOT           │                               │ ║
║  │ ✅ CONFIG-03: AI Tools centralized │                               │ ║
║  │    91 tests, ai-tools.ts SSOT      │                               │ ║
║  └────────────────────────────────────┴───────────────────────────────┘ ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

### MVP GO/NO-GO Gates

| Gate | Criteria | Test Command | Status |
|------|----------|--------------|--------|
| **CORRECTNESS** | All 12 AI tools respond correctly | `/test-ai-tools` | ✅ Pass |
| **PRIVACY** | Zero PII in Claude API requests | `/privacy-check` | ✅ Pass |
| **DEMO** | All 5 workflows complete end-to-end | `/run-demo` | ✅ Pass |
| **SANDBOX** | Sandbox honors vendor's OneRoster selections | BUG-002 fix | ✅ Pass (87 tests) |
| **CONFIG-DRY** | No cross-layer config duplication | Consistency tests | 🚧 1/4 done |
| **PERFORMANCE** | Response time < 3 seconds | Manual observation | 📋 Pending |
| **VERIFICATION** | Vendor verification scoring works | Unit tests | ✅ Pass |
| **CPAAS** | Communication demo showcases revenue | Manual test | 📋 Pending |

### MVP Requirements

```
╔══════════════════════════════════════════════════════════════════════════╗
║                         MVP REQUIREMENTS                                  ║
╠══════════════════════════════════════════════════════════════════════════╣

  MUST HAVE (P1) - Block release if not done
  ────────────────────────────────────────────
  ✅ All 12 AI tools work reliably (MVP-01)
  ✅ Privacy audit passes - no PII leaks (MVP-02)
  ✅ All 5 demo workflows complete (MVP-03)
  ✅ Vendor verification with scoring (BONUS)
  ✅ CPaaS strategy documented (CPAAS_DEVSPIKE.md)
  ✅ BUG-002: Sandbox honors vendor's OneRoster selections (87 tests)
  📋 CONFIG-01: Form types centralization (prevent BUG-002 class bugs)

  SHOULD HAVE (P2) - Improve demo but not blocking
  ─────────────────────────────────────────────────
  📋 CONFIG-02: SSO providers centralization
  📋 CONFIG-03: AI tool names type safety
  📋 Streaming response issues fixed (MVP-04)
  📋 Form triggers work ([FORM:*]) (MVP-05)
  📋 CPaaS demo polish - cost preview, delivery status (MVP-06)
  📋 Suggestion chips work reliably

  NICE TO HAVE (P3) - If time permits
  ────────────────────────────────────
  📋 EdTech directory API stubs callable
  📋 Error boundaries for graceful recovery

  OUT OF SCOPE (Deferred to v1.0)
  ────────────────────────────────
  • PostgreSQL migration
  • Rate limiting
  • CI/CD pipeline
  • Multi-district support
  • Full CPaaS API implementation

╚══════════════════════════════════════════════════════════════════════════╝
```

### MVP Risk Assessment

```
╔══════════════════════════════════════════════════════════════════════════╗
║                         RISK ASSESSMENT                                   ║
╠══════════════════════════════════════════════════════════════════════════╣

  HIGH RISK
  ─────────
  Risk: PII leakage in demo
  Impact: Privacy violation during LAUSD presentation
  Mitigation: ✅ RESOLVED - /privacy-check passes; tokenization layer tested

  Risk: AI hallucinates incorrect information
  Impact: Loses credibility with district IT
  Mitigation: AI tools return structured data; 187 tests validate responses

  MEDIUM RISK
  ───────────
  Risk: Streaming cuts off mid-response
  Impact: Demo requires restart
  Mitigation: MVP-04 addresses this; fallback to non-streaming if needed

  Risk: Form doesn't trigger after AI response
  Impact: Demo flow interrupted
  Mitigation: MVP-05 addresses this; can manually open forms

  Risk: CPaaS value proposition unclear in demo
  Impact: Miss opportunity to showcase revenue model
  Mitigation: MVP-06 adds cost preview, delivery status animation

  LOW RISK
  ────────
  Risk: Slow response times
  Impact: Awkward pauses in demo
  Mitigation: Pre-warm the API; have backup demo data ready

  DEPENDENCIES
  ────────────
  • Anthropic API availability (99.9% SLA)
  • Demo device has stable internet

╚══════════════════════════════════════════════════════════════════════════╝
```

### MVP Next Steps

```
  RECOMMENDED TASK ORDER
  ──────────────────────
  1. ✅ BUG-002: Sandbox honors vendor's OneRoster selections (DONE)
  2. ✅ CONFIG-01: Form Types Centralization (DONE - 79 tests)
  3. ✅ CONFIG-02: SSO Providers Centralization (DONE - 93 tests)
  4. ✅ CONFIG-03: AI Tool Names Type Safety (DONE - 91 tests)
  5. ✅ MVP-04: Streaming Tests (DONE - 188 tests, static analysis + runtime)
  6. 📋 MVP-05: Form triggers work ([FORM:*])
  7. 📋 MVP-06: CPaaS demo polish
```

---

### TEST-INFRA: Testing Infrastructure Sprint (Post-MVP, Pre-v1.0)

```
╔══════════════════════════════════════════════════════════════════════════╗
║                    TESTING INFRASTRUCTURE SPRINT                          ║
║              "Scale the Testing Patterns from MVP-04"                     ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  GOAL: Systematize MVP-04 learnings into reusable infrastructure        ║
║  TIMING: Immediately after MVP, before v1.0 development                 ║
║  EFFORT: 2-3 days                                                        ║
║                                                                          ║
║  WHY NOW (NOT LATER)?                                                    ║
║  ────────────────────                                                    ║
║  • v1.0 adds 12 new tasks → each benefits from patterns                 ║
║  • 762 tests exist → standardization prevents inconsistency             ║
║  • Static analysis pattern proven → apply to all external integrations  ║
║  • Contract testing reduces integration bugs 50%+                        ║
║                                                                          ║
║  ┌────────────────────────────────────────────────────────────────────┐ ║
║  │ TASK                                       │ EFFORT │ IMPACT      │ ║
║  ├────────────────────────────────────────────┼────────┼─────────────┤ ║
║  │ TEST-01: Standardize vitest.config.ts      │ S      │ High        │ ║
║  │   • jsdom default for component tests      │        │             │ ║
║  │   • node for API tests                     │        │             │ ║
║  │   • Consistent setup files                 │        │             │ ║
║  │                                            │        │             │ ║
║  │ TEST-02: Create tests/helpers/             │ S      │ High        │ ║
║  │   • createMockSSEStream()                  │        │             │ ║
║  │   • expectErrorMessage() flexible matcher  │        │             │ ║
║  │   • readSourceCode() static analysis       │        │             │ ║
║  │   • createMockStreamResponse()             │        │             │ ║
║  │                                            │        │             │ ║
║  │ TEST-03: Add contract tests                │ M      │ High        │ ║
║  │   • API route ↔ frontend consumer          │        │             │ ║
║  │   • Tool definition ↔ handler              │        │             │ ║
║  │   • Form config ↔ component                │        │             │ ║
║  │                                            │        │             │ ║
║  │ TEST-04: Document TESTING_PATTERNS.md      │ S      │ Medium      │ ║
║  │   • When to use static analysis            │        │             │ ║
║  │   • When to use runtime mocks              │        │             │ ║
║  │   • Contract testing guidelines            │        │             │ ║
║  │                                            │        │             │ ║
║  │ TEST-05: Convert remaining complex mocks   │ M      │ High        │ ║
║  │   • Apply static analysis to sandbox tests │        │             │ ║
║  │   • Apply to SSO integration tests         │        │             │ ║
║  └────────────────────────────────────────────┴────────┴─────────────┘ ║
║                                                                          ║
║  ESTIMATED TOTAL: 2-3 days                                               ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

#### TEST-INFRA GO/NO-GO Gates

| Gate | Criteria | Test |
|------|----------|------|
| **STANDARDIZED** | All tests use consistent environment config | vitest.config.ts check |
| **HELPERS** | Shared utilities reduce code duplication | tests/helpers/ exists |
| **CONTRACTS** | 3+ contract test suites exist | Contract tests pass |
| **DOCUMENTED** | TESTING_PATTERNS.md covers all patterns | Doc review |

#### TEST-INFRA Impact Analysis

```
╔══════════════════════════════════════════════════════════════════════════╗
║                    ACCELERATOR EFFECT                                     ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  WITHOUT TEST-INFRA (each v1.0 task reinvents patterns):                ║
║  ─────────────────────────────────────────────────────────               ║
║  V1-01 + V1-02 + ... + V1-10 = 12 days + 3 days rework = 15 days        ║
║                                                                          ║
║  WITH TEST-INFRA (patterns reused across all tasks):                    ║
║  ────────────────────────────────────────────────────                    ║
║  TEST-INFRA = 2 days upfront                                            ║
║  V1-01 + V1-02 + ... + V1-10 = 12 days - 2 days saved = 10 days         ║
║                                                                          ║
║  NET SAVINGS: 3+ days of development time                               ║
║  ROI: 150% (invest 2 days, save 3+ days)                                ║
║                                                                          ║
║  ADDITIONAL BENEFITS:                                                    ║
║  • Fewer integration bugs (contract testing)                            ║
║  • Faster test development (shared helpers)                             ║
║  • Consistent codebase (standardized config)                            ║
║  • Easier onboarding (documented patterns)                              ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

### MVP Next Steps (Original)

```
  ORIGINAL TASK ORDER (for reference)
  ────────────────────────────────────
  1. ✅ BUG-002: Sandbox honors vendor's OneRoster selections (DONE)
     - Root cause: createSandbox() hardcodes allowedEndpoints
     - Fix: Created lib/config/oneroster.ts as single source of truth
     - Tests: 87 BUG-002 tests + 37 consistency tests
     - Artifacts: Centralized config pattern established

  2. CONFIG-01: Form Types Centralization (P1 - HIGH RISK) ⬅️ NEXT
     - Same pattern as BUG-002, same risk level
     - Currently duplicated across 5 files
     - Create lib/config/forms.ts
     - Estimated: 30 min

  3. CONFIG-02: SSO Providers Centralization (P2)
     - Duplicated in types, tools, handlers
     - Leverage existing Zod enum in lib/types
     - Estimated: 15 min

  4. CONFIG-03: AI Tool Names Type Safety (P2)
     - Add ToolName type to handlers switch
     - Catch typos at compile time
     - Estimated: 15 min

  5. MVP-06: CPaaS demo polish (CommTestForm enhancements)
     - Add cost preview section
     - Add delivery status animation
     - Reference: CPAAS_DEVSPIKE.md Part 5
     - Estimated: 2-3 hours

  RUN: /start CONFIG-01 to begin form types centralization
```

### Configuration DRY Initiative (Learned from BUG-002)

```
╔══════════════════════════════════════════════════════════════════════════╗
║                  CONFIGURATION CENTRALIZATION PLAN                        ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  ROOT CAUSE: BUG-002 occurred because endpoint config was duplicated    ║
║  across 3 files. When backend changed, UI remained stale.               ║
║                                                                          ║
║  SOLUTION: Single Source of Truth pattern for all cross-layer config    ║
║                                                                          ║
║  ┌────────────────────────────────────────────────────────────────────┐ ║
║  │ PATTERN       │ FILES AFFECTED │ RISK   │ STATUS     │ PRIORITY  │ ║
║  ├───────────────┼────────────────┼────────┼────────────┼───────────┤ ║
║  │ OneRoster EP  │ 3 → 1          │ HIGH   │ ✅ DONE    │ P1        │ ║
║  │ Form Types    │ 5 files        │ HIGH   │ 📋 Pending │ P1        │ ║
║  │ SSO Providers │ 4 files        │ MEDIUM │ 📋 Pending │ P2        │ ║
║  │ AI Tool Names │ 4 files        │ MEDIUM │ 📋 Pending │ P2        │ ║
║  └────────────────────────────────────────────────────────────────────┘ ║
║                                                                          ║
║  COMPLETED:                                                              ║
║  ✅ Created lib/config/oneroster.ts (single source of truth)            ║
║  ✅ Refactored db, handlers, UI to import from config                   ║
║  ✅ Added 37 cross-layer consistency tests                              ║
║  ✅ Updated CLAUDE.md with "Configuration DRY Rule"                     ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

#### CONFIG-01: Form Types (P1 - HIGH RISK)

**Problem**: Form identifiers duplicated across 5 files
- `lib/ai/handlers.ts` - returns `showForm: "pods_lite"`
- `app/chat/page.tsx` - switch statement `case "pods_lite":`
- `lib/hooks/useChat.ts` - regex `FORM_TRIGGER_REGEX`
- `lib/ai/system-prompt.ts` - documents `[FORM:PODS_LITE]`
- `CLAUDE.md` - documents form markers

**Risk**: If new form added to handlers but not to chat/page.tsx, it silently fails.

**Fix**:
```typescript
// lib/config/forms.ts
export const FORM_TYPES = {
  PODS_LITE: { id: "pods_lite", marker: "[FORM:PODS_LITE]", label: "PoDS-Lite" },
  SSO_CONFIG: { id: "sso_config", marker: "[FORM:SSO_CONFIG]", label: "SSO Config" },
  // ... all 7 forms
} as const;

export type FormId = typeof FORM_TYPES[keyof typeof FORM_TYPES]["id"];
```

**Effort**: 30 minutes

#### CONFIG-02: SSO Providers (P2)

**Problem**: Defined in `lib/types/index.ts` as Zod enum, but hardcoded in:
- `lib/ai/tools.ts:136` - `enum: ["CLEVER", "CLASSLINK", "GOOGLE"]`
- `lib/ai/handlers.ts:1011` - provider metadata

**Fix**: Export array from types.ts, import in tools.ts

**Effort**: 15 minutes

#### CONFIG-03: AI Tool Names (P2)

**Problem**: Tool names in TOOLS array, handlers use string switch cases.

**Fix**: Add `ToolName` type, use in handler switch for compile-time checking.

**Effort**: 15 minutes

---

## Next Release: v1.0 (Production-Ready)

```
╔══════════════════════════════════════════════════════════════════════════╗
║                         v1.0 RELEASE PLAN                                 ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  GOAL: Production-ready with real database, authentication, and CPaaS    ║
║  STATUS: 📋 Planned (blocked on MVP completion)                          ║
║  TECHNICAL SPEC: ARCHITECTURE_SPEC.md                                    ║
║                                                                          ║
║  ┌────────────────────────────────────────────────────────────────────┐ ║
║  │ 5 ARCHITECTURAL IMPROVEMENTS                                       │ ║
║  ├────────────────────────────────────────────────────────────────────┤ ║
║  │ 1. DATA LAYER        PostgreSQL + Prisma ORM                      │ ║
║  │ 2. AUTHENTICATION    API keys + session management                │ ║
║  │ 3. VENDOR SESSION    State persistence + conversation history     │ ║
║  │ 4. CPAAS METERING    Message queue + pricing + billing            │ ║
║  │ 5. OBSERVABILITY     Logging + tracing + error tracking           │ ║
║  └────────────────────────────────────────────────────────────────────┘ ║
║                                                                          ║
║  ESTIMATED EFFORT: 12 development days                                   ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

### v1.0 GO/NO-GO Gates

| Gate | Criteria | Test | Status |
|------|----------|------|--------|
| **DATABASE** | PostgreSQL migrations run successfully | `npx prisma migrate deploy` | 📋 Pending |
| **AUTH** | API key authentication working | Integration tests | 📋 Pending |
| **RATE LIMIT** | Rate limiting prevents abuse | Load test | 📋 Pending |
| **SESSION** | Conversation history persists across requests | E2E test | 📋 Pending |
| **CPAAS** | Messages queue and deliver successfully | Integration test | 📋 Pending |
| **AUDIT** | All mutations logged to audit table | Audit query test | 📋 Pending |
| **OBSERVABILITY** | Structured logs + error tracking working | Sentry + Pino | 📋 Pending |
| **SECURITY** | OWASP top 10 audit passes | Security checklist | 📋 Pending |

### v1.0 Requirements

```
╔══════════════════════════════════════════════════════════════════════════╗
║                         v1.0 REQUIREMENTS                                 ║
╠══════════════════════════════════════════════════════════════════════════╣

  MUST HAVE (P1) - Block release if not done
  ────────────────────────────────────────────
  📋 V1-01: PostgreSQL + Prisma schema (Days 1-2)
     - Vendor, Integration, Credential, ApiKey models
     - VendorSession, Message, MessageEvent models
     - AuditLog model for compliance

  📋 V1-02: API Key Authentication (Day 3)
     - SHA-256 hashed key storage
     - Bearer token auth middleware
     - Scope-based permissions

  📋 V1-03: Rate Limiting (Day 3)
     - Upstash Redis integration
     - Tier-based limits (100/500/1000 req/min)
     - 429 response with Retry-After header

  📋 V1-04: Vendor Session Layer (Days 4-5)
     - Session creation and retrieval
     - Conversation history persistence
     - Session cleanup cron job

  📋 V1-05: CPaaS Message Queue (Days 6-7)
     - BullMQ + Redis queue
     - Send endpoint POST /api/cpaas/messages
     - Delivery status tracking

  📋 V1-06: Pricing Engine (Day 7)
     - Volume-based tiered pricing
     - Monthly usage tracking
     - Cost calculation per message

  📋 V1-07: Observability Stack (Days 9-10)
     - Pino structured logging
     - Request context + tracing
     - Sentry error tracking
     - Prometheus metrics endpoint

  SHOULD HAVE (P2) - Improve quality but not blocking
  ─────────────────────────────────────────────────────
  📋 V1-08: Audit logging for all mutations
  📋 V1-09: Environment configuration with Zod validation
  📋 V1-10: Integration tests for all API endpoints

  NICE TO HAVE (P3) - If time permits
  ────────────────────────────────────
  📋 V1-11: E2E tests with Playwright
  📋 V1-12: k6 load testing scripts
  📋 V1-13: CI/CD pipeline (GitHub Actions)
  📋 V1-14: Provider abstraction layer (Vonage/Sinch)
     - Unified interface for both providers
     - Route optimization based on rates
     - Failover between providers
     - Provider health monitoring
  📋 V1-15: Margin tracking and cost optimization
     - Track actual cost per message per provider
     - Compare revenue vs provider cost (margin)
     - Rate change monitoring
     - Cost anomaly alerting

  OUT OF SCOPE (Deferred to v1.1)
  ────────────────────────────────
  • Multi-district support
  • Full Clever API compatibility
  • GraphQL data access layer
  • Real-time sync engine

╚══════════════════════════════════════════════════════════════════════════╝
```

### v1.0 Implementation Timeline

| Phase | Days | Focus | Key Deliverables |
|-------|------|-------|------------------|
| **Foundation** | 1-3 | Data + Auth | Prisma schema, migrations, API keys, rate limiting |
| **Session** | 4-5 | State | VendorSessionManager, chat persistence, cleanup |
| **CPaaS** | 6-8 | Revenue | Message queue, pricing engine, usage API |
| **Observability** | 9-10 | Operations | Logging, tracing, Sentry, metrics |
| **Hardening** | 11-12 | Quality | Integration tests, E2E tests, security audit |

### v1.0 Risk Assessment

```
╔══════════════════════════════════════════════════════════════════════════╗
║                         v1.0 RISK ASSESSMENT                              ║
╠══════════════════════════════════════════════════════════════════════════╣

  HIGH RISK
  ─────────
  Risk: Database migration corrupts demo data
  Impact: Demo becomes unusable during presentation
  Mitigation: Run migration script first; keep mock DB as fallback

  Risk: Rate limiting blocks legitimate demo requests
  Impact: Demo fails during presentation
  Mitigation: Whitelist demo IP; generous sandbox limits

  MEDIUM RISK
  ───────────
  Risk: Redis unavailable in production
  Impact: Rate limiting and queues fail
  Mitigation: Upstash managed Redis; fallback to in-memory

  Risk: CPaaS providers reject test messages
  Impact: Communication demo fails
  Mitigation: Use sandbox modes; mock providers for demo

  LOW RISK
  ────────
  Risk: Logging volume exceeds storage
  Impact: Increased costs
  Mitigation: Log level configuration; log rotation

  DEPENDENCIES
  ────────────
  • PostgreSQL database (Supabase or Neon recommended)
  • Redis service (Upstash recommended for serverless)
  • Vonage + Sinch accounts for CPaaS
  • Sentry account for error tracking

╚══════════════════════════════════════════════════════════════════════════╝
```

### v1.0 Architecture Summary

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    v1.0 PRODUCTION ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   CLIENT                                                                 │
│     │                                                                    │
│     ▼                                                                    │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                    NEXT.JS API ROUTES                            │   │
│   │  ┌──────────────────────────────────────────────────────────┐   │   │
│   │  │ REQUEST CONTEXT (requestId, vendorId, tracing)           │   │   │
│   │  └──────────────────────────────────────────────────────────┘   │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐      │   │
│   │  │ AUTH        │  │ RATE LIMIT  │  │ VALIDATION (Zod)    │      │   │
│   │  │ (API Keys)  │  │ (Upstash)   │  │                     │      │   │
│   │  └─────────────┘  └─────────────┘  └─────────────────────┘      │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                     │
│     ┌──────────────────────────────┼──────────────────────────────┐     │
│     │                              │                              │     │
│     ▼                              ▼                              ▼     │
│   ┌──────────────┐  ┌────────────────────────┐  ┌──────────────────┐   │
│   │ SESSION MGR  │  │ AI LAYER (Claude)       │  │ CPAAS METERING   │   │
│   │              │  │ - System prompt         │  │ - Message queue  │   │
│   │ - State      │  │ - 12 tools              │  │ - Pricing engine │   │
│   │ - History    │  │ - Streaming             │  │ - Usage tracking │   │
│   └──────────────┘  └────────────────────────┘  └──────────────────┘   │
│          │                    │                         │               │
│          └────────────────────┼─────────────────────────┘               │
│                               │                                         │
│                               ▼                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                    DATA LAYER (Prisma + PostgreSQL)              │   │
│   │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────────┐     │   │
│   │  │Vendors │ │Integra-│ │Creden- │ │Messages│ │ AuditLogs  │     │   │
│   │  │        │ │tions   │ │tials   │ │        │ │            │     │   │
│   │  └────────┘ └────────┘ └────────┘ └────────┘ └────────────┘     │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                    OBSERVABILITY                                 │   │
│   │  ┌─────────┐  ┌─────────┐  ┌──────────────┐  ┌──────────────┐   │   │
│   │  │ Pino    │  │ Sentry  │  │ Prometheus   │  │ Audit Trail  │   │   │
│   │  │ Logging │  │ Errors  │  │ Metrics      │  │ (Compliance) │   │   │
│   │  └─────────┘  └─────────┘  └──────────────┘  └──────────────┘   │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Next Release: v1.5 (Multi-Protocol Sandbox Suite)

> **Full Documentation**: See [SANDBOX_PLANNING.md](./SANDBOX_PLANNING.md) for detailed specifications

```
╔══════════════════════════════════════════════════════════════════════════╗
║                         v1.5 RELEASE PLAN                                 ║
║              Multi-Protocol Data Exchange Sandbox Suite                   ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  GOAL: Support all major K-12 data exchange protocols beyond OneRoster   ║
║  STATUS: 📋 Planned (blocked on v1.0 completion)                         ║
║  STRATEGIC VALUE: Serve 100% of vendors regardless of tech stack         ║
║                                                                          ║
║  ┌────────────────────────────────────────────────────────────────────┐ ║
║  │ SANDBOX PROTOCOLS BY PHASE                                         │ ║
║  ├────────────────────────────────────────────────────────────────────┤ ║
║  │                                                                    │ ║
║  │ PHASE 1 (P1): BULK DATA - Week 1                                  │ ║
║  │ ├── CSV over HTTP    (Excel users, legacy systems)                │ ║
║  │ └── CSV over SFTP    (PowerSchool, Infinite Campus syncs)         │ ║
║  │                                                                    │ ║
║  │ PHASE 2 (P2): MODERN APIs - Weeks 2-3                             │ ║
║  │ ├── Ed-Fi API        (Texas-mandated, attendance/grades/discipline)│ ║
║  │ └── GraphQL API      (Modern vendors, flexible queries)           │ ║
║  │                                                                    │ ║
║  │ PHASE 3 (P3): LEARNING ANALYTICS - Week 4                         │ ║
║  │ ├── xAPI             (Experience API, "learner did X")            │ ║
║  │ └── Caliper          (IMS Global, LTI companion)                  │ ║
║  │                                                                    │ ║
║  │ PHASE 4 (P4): LEGACY & SPECIALIZED - Future                       │ ║
║  │ ├── SIF              (XML/SOAP, legacy SIS)                       │ ║
║  │ ├── QTI              (Assessment item exchange)                   │ ║
║  │ └── CASE             (Academic standards alignment)               │ ║
║  │                                                                    │ ║
║  └────────────────────────────────────────────────────────────────────┘ ║
║                                                                          ║
║  ESTIMATED EFFORT: 4 weeks (Phases 1-3)                                  ║
║  CURRENTLY IMPLEMENTED: OneRoster REST API ✅                            ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

### v1.5 GO/NO-GO Gates

| Gate | Criteria | Test | Status |
|------|----------|------|--------|
| **CSV/HTTP** | Bulk download all 6 entity types | Download test | 📋 Pending |
| **CSV/SFTP** | SFTP server accepts vendor connections | SSH connection test | 📋 Pending |
| **ED-FI** | Ed-Fi 5.x endpoints return valid responses | Schema validation | 📋 Pending |
| **GRAPHQL** | GraphQL queries resolve correctly | Query test suite | 📋 Pending |
| **XAPI** | xAPI statements store and retrieve | LRS compatibility | 📋 Pending |
| **CALIPER** | Caliper events accepted | Event validation | 📋 Pending |
| **TOKENIZATION** | All protocols enforce PII tokenization | Privacy scan | 📋 Pending |
| **AUTH** | All protocols use unified API key auth | Auth test | 📋 Pending |

### v1.5 Requirements

```
╔══════════════════════════════════════════════════════════════════════════╗
║                         v1.5 REQUIREMENTS                                 ║
╠══════════════════════════════════════════════════════════════════════════╣

  MUST HAVE (P1) - Block release if not done
  ────────────────────────────────────────────

  📋 SANDBOX-01: CSV over HTTP (1 day)
     - GET /api/sandbox/csv/{entity}.csv
     - Support: users, orgs, classes, enrollments, courses, demographics
     - Query params: format, encoding, delimiter, date_format
     - Stream large files, proper Content-Disposition

  📋 SANDBOX-02: CSV over SFTP (2-3 days)
     - Mock SFTP server on sftp-sandbox.schoolday.lausd.net
     - Directory structure: /outbound/daily/, /inbound/uploads/, /archive/
     - Daily timestamped file generation
     - Credential management (vendor_{id}, auto-rotated)

  SHOULD HAVE (P2) - Important for full vendor coverage
  ─────────────────────────────────────────────────────

  📋 SANDBOX-03: Ed-Fi API (3-4 days)
     - Ed-Fi 5.x ODS/API compatibility
     - Endpoints: students, staff, schools, sections, associations
     - Extended: attendance, grades, assessments
     - Descriptor URIs for enumerations
     - $filter, $orderby query support

  📋 SANDBOX-04: GraphQL API (2-3 days)
     - Schema: students, teachers, schools, classes, enrollments
     - Resolvers with DataLoader for N+1 prevention
     - Query complexity limiting
     - Introspection + GraphQL Playground

  NICE TO HAVE (P3) - Analytics vendors
  ────────────────────────────────────

  📋 SANDBOX-05: xAPI Learning Record Store (2-3 days)
     - POST/GET /api/sandbox/xapi/statements
     - Statement format per ADL spec
     - Statement batching, voiding
     - Agent/activity profiles

  📋 SANDBOX-06: Caliper Event Receiver (1 day)
     - POST /api/sandbox/caliper/events
     - Caliper 1.2 envelope format
     - Event validation

  OUT OF SCOPE (Deferred to v2.0)
  ────────────────────────────────
  • SIF (Legacy XML/SOAP - declining usage)
  • QTI (Assessment-specific)
  • CASE (Standards alignment)
  • Real-time GraphQL subscriptions

╚══════════════════════════════════════════════════════════════════════════╝
```

### v1.5 Implementation Timeline

| Phase | Days | Focus | Key Deliverables | New AI Tools |
|-------|------|-------|------------------|--------------|
| **Phase 1** | 1-3 | Bulk Data | CSV/HTTP, CSV/SFTP | `test_csv_download`, `test_sftp` |
| **Phase 2** | 4-10 | Modern APIs | Ed-Fi, GraphQL | `test_edfi`, `test_graphql` |
| **Phase 3** | 11-14 | Analytics | xAPI, Caliper | `test_xapi`, `test_caliper` |
| **Buffer** | 15-18 | Testing | Integration, E2E | - |

### v1.5 Vendor Coverage Analysis

```
╔══════════════════════════════════════════════════════════════════════════╗
║                    VENDOR COVERAGE BY PROTOCOL                            ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  CURRENT (OneRoster only): ~60% of vendors                               ║
║                                                                          ║
║  AFTER v1.5: ~95% of vendors                                             ║
║                                                                          ║
║  ┌──────────────────────────────────────────────────────────────────┐   ║
║  │ Protocol        │ Vendor Type                    │ Coverage Add │   ║
║  ├──────────────────────────────────────────────────────────────────┤   ║
║  │ OneRoster ✅    │ Most modern EdTech             │ 60%          │   ║
║  │ CSV/HTTP        │ Legacy, Excel-based tools      │ +15%         │   ║
║  │ CSV/SFTP        │ SIS vendors, enterprise        │ +10%         │   ║
║  │ Ed-Fi           │ State reporting, comprehensive │ +5%          │   ║
║  │ GraphQL         │ Modern startups                │ +3%          │   ║
║  │ xAPI/Caliper    │ Learning analytics vendors     │ +2%          │   ║
║  └──────────────────────────────────────────────────────────────────┘   ║
║                                                                          ║
║  STRATEGIC INSIGHT:                                                      ║
║  CSV over SFTP is critical for PowerSchool and Infinite Campus          ║
║  Ed-Fi is mandatory for Texas and growing in other states               ║
║  GraphQL differentiates us from Clever (they don't have it)             ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

### v1.5 Risk Assessment

```
╔══════════════════════════════════════════════════════════════════════════╗
║                         v1.5 RISK ASSESSMENT                              ║
╠══════════════════════════════════════════════════════════════════════════╣

  HIGH RISK
  ─────────
  Risk: SFTP server security vulnerabilities
  Impact: Credential compromise, unauthorized access
  Mitigation: Use battle-tested ssh2 library, security audit, IP allowlist

  Risk: Ed-Fi spec complexity leads to incomplete implementation
  Impact: Texas vendors can't integrate
  Mitigation: Focus on core resources first, expand iteratively

  MEDIUM RISK
  ───────────
  Risk: GraphQL query abuse (expensive queries)
  Impact: Server resource exhaustion
  Mitigation: Query complexity analysis, depth limiting, rate limiting

  Risk: xAPI/Caliper low adoption doesn't justify effort
  Impact: Wasted development time
  Mitigation: Phase 3 is P3 - can defer if vendor demand is low

  LOW RISK
  ────────
  Risk: CSV encoding issues (Windows vs UTF-8)
  Impact: Garbled characters in Excel
  Mitigation: Support multiple encodings via query param

  DEPENDENCIES
  ────────────
  • v1.0 complete (auth, rate limiting, audit logging)
  • SFTP hosting decision (self-host vs AWS Transfer Family)
  • Ed-Fi version decision (5.x vs 3.x)

╚══════════════════════════════════════════════════════════════════════════╝
```

### v1.5 Shared Infrastructure

All sandboxes share these v1.0 components:

| Component | Source | Usage |
|-----------|--------|-------|
| **Synthetic Data** | `lib/data/synthetic.ts` | Same 6,600 students, 5 schools |
| **Tokenization** | Built-in | All PII tokenized identically |
| **API Keys** | `provision_sandbox` | Single credential for all protocols |
| **Rate Limiting** | v1.0 Upstash | Unified limits across protocols |
| **Audit Logging** | v1.0 AuditLog | All access logged |

---

## Strategic Initiative: EdTech Credit Bureau

> **Full Documentation**: See [EDTECH_CREDIT_BUREAU.md](./EDTECH_CREDIT_BUREAU.md) for comprehensive executive briefing

```
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║     SCHOOLDAY EDTECH CREDIT BUREAU                                       ║
║     "The Trust Layer for K-12 Education Technology"                      ║
║                                                                          ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  CONCEPT: Verification-as-a-Service API                                  ║
║  ─────────────────────────────────────                                   ║
║                                                                          ║
║  Districts → SchoolDay API → Credibility Score + Recommendation          ║
║                                                                          ║
║  KEY COMPONENTS                                                          ║
║  ──────────────                                                          ║
║  • VERIFICATION ENGINE: 13+ signals across 8 directories                 ║
║  • SCORING ENGINE: 0-100 score with percentile ranking                   ║
║  • CONTRACT EVALUATOR: District-specific tier requirements               ║
║  • SCHOOLDAY VERIFICATION API: RESTful API for integrations              ║
║                                                                          ║
║  REVENUE MODEL                                                           ║
║  ─────────────                                                           ║
║  • Free Tier: 100 verifications/month, basic signals                     ║
║  • Pro Tier: $500/month, unlimited, all features                         ║
║  • Enterprise: Custom pricing, SLA, dedicated support                    ║
║                                                                          ║
║  18-MONTH TARGETS                                                        ║
║  ────────────────                                                        ║
║  • 1,000 districts using API                                             ║
║  • 5,000 vendors in database                                             ║
║  • $3.3M ARR                                                             ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

### EdTech Credit Bureau Execution Plan

| Phase | Weeks | Focus | Deliverable | Effort |
|-------|-------|-------|-------------|--------|
| **Phase 1** | 1-4 | Foundation | MVP API with basic verification | 60 hrs |
| **Phase 2** | 5-8 | Enhanced Signals | Full signal coverage + directories | 80 hrs |
| **Phase 3** | 9-12 | Contracts & Caching | Production-ready with contracts | 80 hrs |
| **Phase 4** | 13-16 | Commercialization | Pricing, billing, documentation | 60 hrs |

**Total**: 280 hours over 16 weeks

### EdTech Credit Bureau GO/NO-GO Gates

| Gate | Criteria | Status |
|------|----------|--------|
| API Design | OpenAPI spec approved | 📋 Pending |
| Basic Signals | All 5 basic signals working | 📋 Pending |
| Directory Integration | At least 3 directories connected | 📋 Pending |
| Contract System | Tiered contracts implemented | 📋 Pending |
| Pricing | Stripe integration working | 📋 Pending |
| Documentation | API docs + SDK available | 📋 Pending |

---

## Strategic Initiative: CPaaS (Communication Platform as a Service)

> **Full Documentation**: See [CPAAS_DEVSPIKE.md](./CPAAS_DEVSPIKE.md) for comprehensive technical specification

```
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║     SCHOOLDAY CPAAS - "THE PRIVACY TOLL ROAD"                            ║
║     Core Revenue Driver & Key Differentiator                             ║
║                                                                          ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  BUSINESS MODEL COMPARISON                                               ║
║  ─────────────────────────                                               ║
║                                                                          ║
║  CLEVER / CLASSLINK          │  SCHOOLDAY                                ║
║  ────────────────────────────│─────────────────────────────────────────  ║
║  Revenue: Per-student fees   │  Revenue: PER-MESSAGE (CPaaS)             ║
║  Model:   Data pipeline      │  Model:   Secure relay network            ║
║  Moat:    School relations   │  Moat:    Privacy + Communication IP      ║
║  Value:   One-time connect   │  Value:   RECURRING on every email/SMS    ║
║                                                                          ║
║  KEY INSIGHT: Communication Gateway is not a feature—it's THE BUSINESS   ║
║                                                                          ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  REVENUE PROJECTIONS                                                     ║
║  ───────────────────                                                     ║
║                                                                          ║
║  LAUSD Year 1:                                                           ║
║  • Email: 670K families × 5 msgs/mo × 50 vendors × $0.002 = $335K/yr    ║
║  • SMS:   670K families × 2 msgs/mo × 20 vendors × $0.01 = $268K/yr     ║
║  • Total: ~$600K ARR from LAUSD alone                                    ║
║                                                                          ║
║  National Scale (Year 3):                                                ║
║  • 100 districts, 10M families, 2,000 vendors                            ║
║  • Email: $1M + SMS: $1M + Push: $300K = $2.3M ARR                       ║
║                                                                          ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  INTELLECTUAL PROPERTY CLAIMS                                            ║
║  ────────────────────────────                                            ║
║                                                                          ║
║  IP-1: Token-Based Privacy-Preserving Communication Relay                ║
║        • Deterministic tokenization                                      ║
║        • Relay-based message routing                                     ║
║        • Zero PII exposure to vendors                                    ║
║                                                                          ║
║  IP-2: Automated Vendor Trust Scoring for Communication Privileges       ║
║        • Multi-signal credibility scoring                                ║
║        • Progressive capability unlocking                                ║
║        • Automatic throttling for abuse                                  ║
║                                                                          ║
║  IP-3: District-Controlled Vendor Communication Firewall                 ║
║        • Per-vendor allow/block lists                                    ║
║        • Content filtering rules                                         ║
║        • Time-of-day restrictions                                        ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

### CPaaS Implementation Phases

| Phase | Focus | Key Deliverables | Status |
|-------|-------|------------------|--------|
| **Phase 1: Demo** | MVP polish | Cost preview, delivery status animation | 📋 MVP-06 |
| **Phase 2: Foundation** | Core API | /api/cpaas/messages, pricing module | 📋 Planned |
| **Phase 3: Production** | Infrastructure | Message queue, provider integrations | 📋 Planned |
| **Phase 4: Advanced** | Features | SDKs, templates, analytics dashboard | 📋 Planned |

### CPaaS Pricing Model

| Channel | Volume Tier | Price | Notes |
|---------|------------|-------|-------|
| **Email** | 0-10K | $0.003 | Starter |
| **Email** | 10K-100K | $0.002 | Growth |
| **Email** | 100K-1M | $0.0015 | Scale |
| **Email** | 1M+ | $0.001 | Enterprise |
| **SMS** | 0-5K | $0.015 | Per segment |
| **SMS** | 5K-50K | $0.012 | |
| **SMS** | 50K-500K | $0.009 | |
| **Push** | 0-100K | $0.0005 | iOS + Android |
| **Push** | 100K+ | $0.0002 | |

---

## Strategic Initiative: UX Redesign (Dashboard-First + AI Augmentation)

> **Prototypes Created**: See `portal-reimagined.html` and `pitch-presentation.html` in project root

```
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║     UX REDESIGN - FROM CHAT-FIRST TO DASHBOARD-FIRST                     ║
║     Status: 📋 SCOPED - Pending Management Review                        ║
║                                                                          ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  CURRENT STATE (Chat-First)          │  PROPOSED STATE (Dashboard-First) ║
║  ────────────────────────────────────│──────────────────────────────────  ║
║  • AI chat is primary interface      │  • Traditional dashboard primary   ║
║  • Users type to do anything         │  • One-click for common tasks      ║
║  • Discoverability is poor           │  • Clear navigation sidebar        ║
║  • Repeat tasks require typing       │  • AI assists at specific points   ║
║  • Great for demos, slow for work    │  • Fast for power users + guided   ║
║                                                                          ║
║  KEY INSIGHT: Chat is the guide, not the destination.                    ║
║                                                                          ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  AI AUGMENTATION TOUCHPOINTS (Where AI adds genuine value)               ║
║  ─────────────────────────────────────────────────────────               ║
║                                                                          ║
║  TOUCHPOINT          │  TRIGGER               │  AI BEHAVIOR             ║
║  ────────────────────│────────────────────────│────────────────────────  ║
║  Error Diagnosis     │  Click "AI Diagnose"   │  Analyzes config/logs    ║
║  Response Explainer  │  Click "Explain"       │  Describes tokenized     ║
║  Upgrade Helper      │  Click "Request"       │  Drafts justification    ║
║  Message Drafter     │  Click "Draft with AI" │  Generates templates     ║
║  Onboarding Guide    │  First login / "Help"  │  Shows next steps        ║
║  Config Validator    │  Pre-submit            │  Validates settings      ║
║                                                                          ║
║  NON-AI TASKS (Traditional UI is better)                                 ║
║  • View credentials    → Card with copy button                           ║
║  • Check status        → Dashboard with indicators                       ║
║  • Rotate keys         → Button + confirm modal                          ║
║  • View audit logs     → Filterable table                                ║
║  • Download exports    → Direct download button                          ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

### UX Redesign: Key Decisions Required

| # | Decision | Options | Considerations | Owner |
|---|----------|---------|----------------|-------|
| UX-D1 | **Keep current chat UI as fallback?** | A) Replace entirely B) Keep as "Chat Mode" toggle C) Deprecate after transition | Option B allows A/B testing; Option A is cleaner | TBD |
| UX-D2 | **AI panel behavior** | A) Slide-in from right B) Modal overlay C) Inline expansion | Slide-in (A) tested well in prototype; doesn't obscure main content | TBD |
| UX-D3 | **Component library** | A) Build custom B) Use shadcn/ui C) Use Radix + custom styling | shadcn/ui (B) is Tailwind-native, copy-paste components | TBD |
| UX-D4 | **Design system ownership** | A) Internal only B) Hire contractor C) Partner with design agency | Depends on timeline and budget | TBD |
| UX-D5 | **Mobile responsiveness** | A) Desktop-only MVP B) Responsive from start C) Separate mobile app | EdTech IT admins are desktop-primary; (A) acceptable for v1 | TBD |
| UX-D6 | **Accessibility standard** | A) WCAG 2.1 AA B) WCAG 2.1 AAA C) Best effort | K-12 contracts often require AA compliance; recommend (A) | TBD |
| UX-D7 | **User testing approach** | A) Internal only B) Beta with 3-5 vendors C) Public beta | Recommend (B) - real feedback without scale risk | TBD |

### UX Redesign: Implementation Phases

| Phase | Focus | Deliverables | Effort | Dependencies |
|-------|-------|--------------|--------|--------------|
| **Phase 0: Decision** | Resolve UX-D1 through UX-D7 | Decision document signed off | 1 week | Management review |
| **Phase 1: Design System** | Colors, typography, components | Figma/code component library | 2 weeks | UX-D3, UX-D4 |
| **Phase 2: Dashboard Shell** | Layout, navigation, routing | Sidebar + header + routing | 1 week | Phase 1 |
| **Phase 3: Core Pages** | Status, Credentials, SSO, API | 4 main dashboard pages | 2 weeks | Phase 2 |
| **Phase 4: AI Integration** | Panel, touchpoints, responses | AI assistance layer | 1 week | Phase 3 |
| **Phase 5: Migration** | Port existing functionality | All current features working | 2 weeks | Phase 4 |
| **Phase 6: Polish** | Animations, edge cases, a11y | Production-ready UI | 1 week | Phase 5 |

**Total Estimated Effort**: 10 weeks (can parallelize with backend work)

### UX Redesign: GO/NO-GO Gates

| Gate | Criteria | Status |
|------|----------|--------|
| **DECISION** | All UX-D* decisions documented and approved | 📋 Pending |
| **PROTOTYPE** | Interactive prototype tested with 3+ users | ✅ Done (portal-reimagined.html) |
| **DESIGN** | Component library covers all current features | 📋 Pending |
| **PARITY** | All current functionality works in new UI | 📋 Pending |
| **PERFORMANCE** | Page load < 2s, interactions < 100ms | 📋 Pending |
| **ACCESSIBILITY** | WCAG 2.1 AA compliance verified | 📋 Pending |

### UX Redesign: Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Scope creep ("while we're at it...") | High | High | Strict feature parity first, enhancements in v2 |
| User resistance to change | Medium | Medium | Keep chat mode as fallback (UX-D1 Option B) |
| Timeline pressure | Medium | High | Phase 1-2 can run parallel to v1.0 backend work |
| Design inconsistency | Medium | Medium | Establish design system before building pages |
| AI touchpoints feel gimmicky | Low | High | User test each touchpoint; remove if not valuable |

### UX Redesign: Open Questions for Management

1. **Priority vs. v1.0 backend work?** This is UI; v1.0 is infrastructure (PostgreSQL, auth, sessions). Can run in parallel if resourced.

2. **Who owns design?** Options: existing team, contractor, agency partnership. Impacts timeline and budget.

3. **Is current chat UI acceptable for LAUSD demo?** If yes, UX redesign can be post-v1.0. If not, needs to be parallel.

4. **Budget for user testing?** Recommend compensating 3-5 beta vendor users for feedback sessions.

5. **Success metric?** Suggest: "Task completion time 50% faster than chat-first UI" measured via user testing.

---

## Strategic Initiative: District Admin Portal

> **Dependency**: Requires v1.0 data layer (PostgreSQL, authentication) to be complete

```
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║     DISTRICT ADMIN PORTAL                                                ║
║     "Self-Service District Configuration & Vendor Governance"            ║
║     Status: 📋 SCOPED - Pending Management Review                        ║
║                                                                          ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  WHY THIS MATTERS                                                        ║
║  ─────────────────                                                       ║
║  • Districts can't onboard vendors without configuring their environment ║
║  • LAUSD alone has 1,000+ schools - manual setup is not scalable         ║
║  • Vendor governance (credit scores, policies) is a key differentiator   ║
║  • Self-service reduces SchoolDay support burden                         ║
║                                                                          ║
║  CURRENT STATE: Vendor Portal only. No district-side configuration.      ║
║                                                                          ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  5 CORE MODULES                                                          ║
║  ──────────────                                                          ║
║                                                                          ║
║  MODULE 1: DISTRICT SETUP WIZARD                                         ║
║  ├── Basic info (name, domain, NCES ID, student count)                   ║
║  ├── Schools management (CRUD, grade ranges, enrollment)                 ║
║  ├── Organizational hierarchy (district → local districts → schools)     ║
║  ├── SIS connection (PowerSchool, Infinite Campus, Skyward, Aeries)      ║
║  └── District staff SSO (separate from vendor SSO)                       ║
║                                                                          ║
║  MODULE 2: VENDOR GOVERNANCE                                             ║
║  ├── Minimum credit score thresholds per access tier                     ║
║  │   • Privacy-Safe: Score ≥ 40 (configurable)                           ║
║  │   • Selective: Score ≥ 60 + manual review                             ║
║  │   • Full Access: Score ≥ 80 + board approval                          ║
║  ├── Custom approval workflows (single approver → multi-level)           ║
║  ├── Vendor allow/block lists                                            ║
║  ├── Category restrictions (e.g., "no social media apps")                ║
║  └── Contract/DPA template management                                    ║
║                                                                          ║
║  MODULE 3: COMMUNICATION POLICIES                                        ║
║  ├── Time-of-day restrictions (e.g., "no messages before 7am")           ║
║  ├── Message frequency limits per vendor                                 ║
║  ├── Content filtering rules (prohibited words, PII detection)           ║
║  ├── Channel permissions (email only, SMS allowed, push allowed)         ║
║  └── Parent opt-out management                                           ║
║                                                                          ║
║  MODULE 4: DATA POLICIES                                                 ║
║  ├── Field-level access control per tier                                 ║
║  ├── Data retention requirements (30 days, 1 year, etc.)                 ║
║  ├── Export/deletion request handling                                    ║
║  ├── Tokenization settings (which fields to tokenize)                    ║
║  └── Sync frequency configuration                                        ║
║                                                                          ║
║  MODULE 5: ANALYTICS & COMPLIANCE                                        ║
║  ├── Vendor usage dashboards (API calls, messages sent)                  ║
║  ├── Compliance reports (FERPA, COPPA, SOPIPA)                           ║
║  ├── Audit log access with search/filter                                 ║
║  ├── Anomaly alerts (unusual access patterns)                            ║
║  └── Annual review reminders                                             ║
║                                                                          ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  LAUSD-SPECIFIC REQUIREMENTS                                             ║
║  ────────────────────────────                                            ║
║  • 1,000+ schools across 8 Local Districts                               ║
║  • 670,000 students, 75,000 employees                                    ║
║  • Existing systems: Schoology (LMS), MiSiS (SIS), Google Workspace      ║
║  • Nested hierarchy: LAUSD → Local District → School → Department        ║
║  • Board approval required for Full Access tier                          ║
║                                                                          ║
║  ESTIMATED EFFORT: 10-12 weeks                                           ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

### District Admin Portal: Key Decisions Required

| # | Decision | Options | Considerations | Owner |
|---|----------|---------|----------------|-------|
| DAP-D1 | **Start with LAUSD-specific or generic?** | A) LAUSD-first, generalize later B) Generic from start C) Configurable multi-tenant | LAUSD is the pilot; (A) faster to market, (B) more scalable | TBD |
| DAP-D2 | **Credit score enforcement** | A) Hard block B) Soft warning + override C) Configurable per district | Recommend (C) - districts have different risk tolerances | TBD |
| DAP-D3 | **School data source** | A) Manual entry B) SIS sync C) NCES database import D) All of above | (D) provides flexibility; NCES gives baseline | TBD |
| DAP-D4 | **Approval workflow complexity** | A) Single approver B) Role-based (IT → Privacy → Legal) C) Fully customizable | LAUSD needs (B) minimum; (C) is over-engineering risk | TBD |
| DAP-D5 | **Multi-tenant architecture** | A) Single DB, district isolation B) DB-per-district C) Hybrid | (A) simpler; (B) better for enterprise sales | TBD |
| DAP-D6 | **Admin portal tech stack** | A) Same as vendor portal (Next.js) B) Separate admin app C) Embedded in vendor portal | (A) code reuse; (B) cleaner separation | TBD |
| DAP-D7 | **SIS integration depth** | A) Manual CSV upload B) Scheduled sync C) Real-time webhooks D) All tiers | Start with (A+B), add (C) for premium | TBD |
| DAP-D8 | **Sub-admin roles** | A) District-wide admins only B) School-level admins C) Department-level | LAUSD Local Districts need (B) minimum | TBD |

### District Admin Portal: Implementation Phases

| Phase | Focus | Deliverables | Effort | Dependencies |
|-------|-------|--------------|--------|--------------|
| **Phase 0: Decision** | Resolve DAP-D1 through DAP-D8 | Decision document signed off | 1 week | Management review |
| **Phase 1: District Setup** | Basic config + schools | Wizard, school CRUD, basic info | 2 weeks | v1.0 data layer |
| **Phase 2: SIS Integration** | Connect to student data | PowerSchool, IC, Skyward adapters | 2 weeks | Phase 1 |
| **Phase 3: Vendor Governance** | Credit scores + approvals | Score thresholds, approval workflows | 2 weeks | EdTech Credit Bureau |
| **Phase 4: Policies** | Communication + data rules | Policy configuration UI, enforcement | 2 weeks | Phase 3 |
| **Phase 5: Analytics** | Dashboards + compliance | Usage reports, audit access | 2 weeks | Phase 4 |
| **Phase 6: Polish** | LAUSD pilot feedback | Bug fixes, UX refinements | 2 weeks | LAUSD testing |

**Total Estimated Effort**: 10-12 weeks

### District Admin Portal: GO/NO-GO Gates

| Gate | Criteria | Status |
|------|----------|--------|
| **DECISION** | All DAP-D* decisions documented and approved | 📋 Pending |
| **SCHOOLS** | LAUSD can import/manage 1,000+ schools | 📋 Pending |
| **SIS** | At least one SIS integration working (PowerSchool or IC) | 📋 Pending |
| **GOVERNANCE** | Credit score thresholds configurable and enforced | 📋 Pending |
| **POLICIES** | Communication time restrictions working | 📋 Pending |
| **SCALE** | System handles LAUSD scale (670K students) | 📋 Pending |
| **SECURITY** | Role-based access control verified | 📋 Pending |

### District Admin Portal: Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Scope creep (every district wants custom features) | High | High | Start with LAUSD, say "no" to others until v2 |
| SIS integration complexity | High | Medium | Start with CSV upload, add live sync later |
| LAUSD organizational complexity | Medium | High | Involve LAUSD IT early; build for nested hierarchy |
| Performance at scale (1000 schools) | Medium | High | Pagination, caching, lazy loading from day 1 |
| Approval workflow edge cases | Medium | Medium | Keep workflows simple; avoid Turing-complete rules |
| Security (district admins have broad access) | Medium | Critical | Audit logging, principle of least privilege |

### District Admin Portal: Data Model Sketch

```typescript
interface District {
  id: string;
  name: string;                    // "Los Angeles Unified School District"
  slug: string;                    // "lausd"
  ncesId: string;                  // National Center for Education Statistics ID
  domain: string;                  // "lausd.net"
  studentCount: number;
  employeeCount: number;

  // Hierarchy
  localDistricts?: LocalDistrict[];  // For large districts like LAUSD
  schools: School[];

  // Integrations
  sisType: 'powerschool' | 'infinite_campus' | 'skyward' | 'aeries' | 'other';
  sisConfig: SISConfig;
  lmsType: 'schoology' | 'canvas' | 'google_classroom' | 'other';
  idpType: 'google' | 'azure_ad' | 'clever' | 'classlink' | 'other';

  // Governance
  vendorPolicies: VendorPolicies;
  communicationPolicies: CommPolicies;
  dataPolicies: DataPolicies;

  // Admin
  admins: DistrictAdmin[];
  createdAt: Date;
  updatedAt: Date;
}

interface VendorPolicies {
  minCreditScore: {
    privacySafe: number;           // e.g., 40
    selective: number;             // e.g., 60
    fullAccess: number;            // e.g., 80
  };
  requireManualReview: {
    selective: boolean;            // true
    fullAccess: boolean;           // true
  };
  blockedCategories: string[];     // ["social_media", "gaming"]
  blockedVendors: string[];        // Vendor IDs
  allowedVendors: string[];        // Whitelist (if set, only these allowed)
  approvalWorkflow: ApprovalWorkflow;
}

interface CommPolicies {
  allowedChannels: ('email' | 'sms' | 'push')[];
  quietHours: { start: string; end: string };  // "22:00" - "07:00"
  maxMessagesPerVendorPerDay: number;
  contentFilters: ContentFilter[];
  requireParentOptIn: boolean;
}

interface School {
  id: string;
  districtId: string;
  localDistrictId?: string;
  name: string;
  ncesId: string;
  gradeRange: { low: string; high: string };  // "K" - "5", "6" - "8", "9" - "12"
  studentCount: number;
  address: Address;
  principal?: string;
  active: boolean;
}
```

### District Admin Portal: Open Questions for Management

1. **Priority relative to Vendor Portal UX Redesign?** Both are significant efforts. Can they run in parallel with separate teams?

2. **LAUSD as design partner?** Should we formally engage LAUSD IT as co-designers with early access and feedback loops?

3. **Pricing model?** Is District Admin Portal:
   - A) Free (districts are the customer, vendors pay via CPaaS)
   - B) Freemium (basic free, advanced governance features paid)
   - C) Enterprise sales (custom pricing per district)

4. **Build vs. buy for SIS integration?** Should we use existing SIS middleware (e.g., Clever, ClassLink) initially and build native later?

5. **Compliance certifications?** Do we need SOC 2 Type II before enterprise districts will adopt?

6. **Who is the buyer?** Is this sold to:
   - A) District CTO/CIO
   - B) Privacy Officer
   - C) Superintendent
   - D) School Board

---

## Strategic Vision

```
╔══════════════════════════════════════════════════════════════════════════╗
║                    18-MONTH DISRUPTION ROADMAP                           ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  TODAY          6 MONTHS         12 MONTHS         18 MONTHS             ║
║    │               │                │                  │                 ║
║    ▼               ▼                ▼                  ▼                 ║
║  ┌────┐         ┌────┐           ┌────┐            ┌────┐               ║
║  │MVP │ ──────▶ │v2.0│ ────────▶ │v3.0│ ─────────▶ │LEAD│               ║
║  └────┘         └────┘           └────┘            └────┘               ║
║    │               │                │                  │                 ║
║  LAUSD      Integration       Clever Parity      Market Leader          ║
║  Demo        Platform         + 100 Vendors      + 1000 Districts       ║
║              + 10 Districts   + 500 Districts                           ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

## Moonshot Features Backlog

These are ranked future features with toggleable feature flags. Code location: `lib/features/feature-flags.ts`

Dashboard: `/dashboard/features` | CLI: `/features enable <id>` | `/features disable <id>`

### Feature Matrix

| Rank | ID | Name | Status | Enabled | Dependencies | Maps To |
|------|-----|------|--------|---------|--------------|---------|
| 1 | `ai-health-monitor` | AI Integration Health Monitor | Beta | ❌ | - | UX Redesign |
| 2 | `compliance-pipeline` | Automated Compliance Certification | Alpha | ❌ | - | v1.0 Enhancement |
| 3 | `synthetic-sandbox` | Synthetic Student Data Sandbox | Beta | ✅ | - | MVP (core) |
| 4 | `vendor-marketplace` | Vendor-to-Vendor Marketplace | Experimental | ❌ | - | EdTech Credit Bureau |
| 5 | `predictive-onboarding` | Predictive Onboarding Assistant | Alpha | ❌ | ai-health-monitor | UX Redesign |
| 6 | `teacher-feedback` | Teacher Feedback Loop | Experimental | ❌ | - | v2.0+ |
| 7 | `multi-district` | Multi-District Federation | Experimental | ❌ | - | District Admin Portal |
| 8 | `zero-touch-deploy` | Zero-Touch Deployment Pipeline | Alpha | ❌ | compliance-pipeline | v1.5+ |
| 9 | `parent-transparency` | Parent Transparency Portal | Experimental | ❌ | - | v2.0+ |
| 10 | `impact-analytics` | Impact Analytics Dashboard | Experimental | ❌ | synthetic-sandbox | v2.0+ |

### Feature Descriptions & Value

| Feature | Description | Value Proposition |
|---------|-------------|-------------------|
| **AI Health Monitor** | Real-time AI-powered monitoring for integration anomalies | Reduces support burden 70%+, enables self-diagnosis, positions LAUSD as tech-forward |
| **Compliance Pipeline** | Self-service FERPA, COPPA, CA-AB1584 verification | Removes legal/procurement bottleneck, provides marketing badges, creates audit trail |
| **Synthetic Sandbox** | Realistic synthetic student cohorts (IEP, ELL, foster youth) for testing | Eliminates vendor testing complaints, includes edge cases, zero privacy risk |
| **Vendor Marketplace** | Vendors discover and connect with each other | Network effects, platform positioning, vendors build on each other |
| **Predictive Onboarding** | AI learns from successful onboardings to predict blockers | First-time-right rate increases, reduces back-and-forth, institutional memory |
| **Teacher Feedback** | Anonymous teacher ratings for vendor products | Classroom accountability, actionable vendor signals, empowers teachers |
| **Multi-District** | Allow other CA districts to federate into same portal | Investment amortization, integrate once deploy many, statewide standards |
| **Zero-Touch Deploy** | GitOps-style deployment with compliance gates | Removes deployment overhead, automated compliance, faster iteration |
| **Parent Transparency** | Parent-facing view of data access and opt-out | Community trust, preempts complaints, differentiates as privacy-first |
| **Impact Analytics** | Track student outcomes correlated with vendor usage | Answers "is this helping students?", data-driven procurement, proof-of-impact |

### Suggested Release Mapping

```
v1.0 (Production-Ready)
├── synthetic-sandbox (already enabled)
└── compliance-pipeline (high value, accelerates vendor approvals)

v1.5 (Multi-Protocol Sandbox)
├── ai-health-monitor (supports multiple protocol debugging)
├── predictive-onboarding (depends on ai-health-monitor)
└── zero-touch-deploy (depends on compliance-pipeline)

Strategic: UX Redesign
├── ai-health-monitor
└── predictive-onboarding

Strategic: District Admin Portal
└── multi-district

Strategic: EdTech Credit Bureau
└── vendor-marketplace

v2.0+ (Future Vision)
├── teacher-feedback
├── parent-transparency
└── impact-analytics
```

### Implementation Notes

- **FeatureGate component**: Wrap UI sections to conditionally show based on flags
- **Dependencies**: Enabling a feature auto-enables its dependencies
- **Persistence**: Flags stored in localStorage, can be exported/imported as JSON
- **Status levels**: stable → beta → alpha → experimental (risk indicator)

---

## Competitive Analysis: Clever vs SchoolDay

| Dimension | Clever (Incumbent) | SchoolDay (Disruptor) |
|-----------|--------------------|-----------------------|
| **Market Share** | 65% of US districts | 0% → Target: 30%+ |
| **Moat** | Network effects, vendor lock-in | Privacy-first, open standards |
| **Pricing** | Vendors pay per-student | Free for Privacy-Safe tier |
| **Privacy** | Transmits raw PII | Tokenized by default |
| **Onboarding** | Manual, weeks | AI-guided, minutes |
| **API** | Proprietary | Open + Clever-compatible |
| **Compliance** | Standard PoDS | PoDS-Lite (instant approval) |

**Our Wedge**: Privacy + Speed + Free tier for tokenized access

---

## Success Metrics (18-Month Targets)

| Metric | 6 Months | 12 Months | 18 Months |
|--------|----------|-----------|-----------|
| Districts | 10 | 500 | 1,000+ |
| Vendors Integrated | 20 | 100 | 300+ |
| Students Covered | 100K | 5M | 15M+ |
| API Calls/Month | 1M | 50M | 500M+ |
| Clever Migrations | 0 | 50 | 200+ |

---

## Phase Overview

| Phase | Timeframe | Focus | Key Deliverable |
|-------|-----------|-------|-----------------|
| **Phase 1** | Months 1-3 | Foundation | Integration Platform SDK |
| **Phase 2** | Months 4-6 | Compatibility | Clever API Layer + Sync |
| **Phase 3** | Months 7-9 | Marketplace | Vendor Portal + Discovery |
| **Phase 4** | Months 10-12 | Scale | 100 Vendors, 500 Districts |
| **Phase 5** | Months 13-18 | Dominate | Market Leadership |

---

# PHASE 1: FOUNDATION (Months 1-3)

**Goal**: Build world-class integration SDK with multi-district support

## GO/NO-GO Gates

| Gate | Criteria | Test |
|------|----------|------|
| Architecture | Monorepo builds, strict TypeScript | `npm run build` |
| Quality | 90%+ unit, 80%+ integration coverage | Coverage report |
| Documentation | 100% API documented | TypeDoc generation |
| Production | Error handling, audit logging | Security audit |

---

### Phase 1.1: Monorepo Setup (Week 1-2)

#### Task IP-1.1: Monorepo Infrastructure
- **ID**: IP-1.1
- **Effort**: 4 hours
- **Deliverables**:
  - [ ] Initialize Turborepo
  - [ ] Configure workspace packages
  - [ ] Set up shared TypeScript config (strict mode)
  - [ ] Set up shared ESLint config
  - [ ] Configure Vitest for testing
  - [ ] Add Husky pre-commit hooks
  - [ ] Configure Changesets for versioning
- **Acceptance Criteria**:
  - `npm install` works from root
  - `npm run build` builds all packages
  - `npm run test` runs all tests
  - `npm run lint` checks all packages

#### Task IP-1.2: Core Types Definition
- **ID**: IP-1.2
- **Effort**: 8 hours
- **Deliverables**:
  - [ ] Define `IntegrationType` enum (ONEROSTER, LTI, SAML, OIDC, SFTP, GRAPHQL, CLEVER)
  - [ ] Define `IntegrationVersion` types
  - [ ] Define `Credentials` interfaces per integration type
  - [ ] Define `DistrictConfig` interface
  - [ ] Define `VendorApplication` interface
  - [ ] Define `AuditEvent` interface
  - [ ] Define `ValidationResult` interface
  - [ ] Define `SyncEvent` interface (for real-time sync)
- **Types**:
```typescript
export enum IntegrationType {
  ONEROSTER = 'ONEROSTER',
  LTI = 'LTI',
  SAML = 'SAML',
  OIDC = 'OIDC',
  SFTP = 'SFTP',
  GRAPHQL = 'GRAPHQL',    // v2.1
  CLEVER = 'CLEVER',       // Compatibility layer
}

export interface DistrictConfig {
  id: string;
  name: string;
  slug: string;
  domain: string;
  studentCount: number;
  endpoints: DistrictEndpoints;
  features: DistrictFeatures;
  privacy: PrivacyConfig;
  cleverMigration?: CleverMigrationConfig;  // For districts switching from Clever
}

export interface SyncEvent {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'student' | 'teacher' | 'class' | 'enrollment' | 'school';
  entityId: string;
  timestamp: Date;
  data: Record<string, unknown>;
  districtId: string;
  vendorIds: string[];  // Which vendors should receive this
}
```

#### Task IP-1.3: Base Generator Interface
- **ID**: IP-1.3
- **Effort**: 6 hours
- **Deliverables**:
  - [ ] Define `ICredentialGenerator<T>` interface
  - [ ] Define `GeneratorOptions` type
  - [ ] Define `GeneratorResult<T>` type
  - [ ] Create abstract `BaseGenerator` class
  - [ ] Implement generator registration system
- **Interface**:
```typescript
export interface ICredentialGenerator<T extends BaseCredentials> {
  readonly type: IntegrationType;
  readonly supportedVersions: string[];

  generate(options: GeneratorOptions): Promise<GeneratorResult<T>>;
  validate(credentials: T): Promise<ValidationResult>;
  rotate(credentials: T): Promise<GeneratorResult<T>>;
  revoke(credentials: T): Promise<void>;
}
```

#### Task IP-1.4: District Adapter Interface
- **ID**: IP-1.4
- **Effort**: 4 hours
- **Deliverables**:
  - [ ] Define `IDistrictAdapter` interface
  - [ ] Define adapter lifecycle methods
  - [ ] Create adapter factory pattern
  - [ ] Document adapter creation process

#### Task IP-1.5: Unified Data Resolver
- **ID**: IP-1.5
- **Effort**: 12 hours
- **Priority**: P0 (Critical for GraphQL + Clever compatibility)
- **Deliverables**:
  - [ ] Design protocol-agnostic data resolver
  - [ ] Entity resolution layer (Student, Teacher, Class, etc.)
  - [ ] Access tier enforcement
  - [ ] Field-level tokenization
  - [ ] Caching layer (Redis-ready)
  - [ ] Audit logging integration
- **Architecture**:
```
┌─────────────────────────────────────────────────────────────┐
│                    PROTOCOL LAYERS                          │
│  OneRoster REST │ GraphQL │ Clever API │ Future protocols   │
├─────────────────────────────────────────────────────────────┤
│                 UNIFIED DATA RESOLVER                        │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ • Entity resolution                                     ││
│  │ • Access tier enforcement (Privacy-Safe/Selective/Full) ││
│  │ • Field-level tokenization                              ││
│  │ • Query optimization                                    ││
│  │ • Caching (Redis)                                       ││
│  │ • Audit logging                                         ││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│                    DATA SOURCES                              │
│  PostgreSQL │ District SIS │ External OneRoster providers    │
└─────────────────────────────────────────────────────────────┘
```

---

### Phase 1.2: Generators (Week 3-4)

#### Task IP-2.1: OneRoster Generator
- **ID**: IP-2.1
- **Effort**: 8 hours
- **Deliverables**:
  - [ ] Implement `OneRosterGenerator` class
  - [ ] Support OneRoster 1.1 and 1.2
  - [ ] Generate OAuth 2.0 client credentials
  - [ ] Generate endpoint URLs based on district config
  - [ ] Implement resource filtering
  - [ ] Add rate limit configuration
- **Test Coverage**: 95%+

#### Task IP-2.2: LTI 1.3 Generator
- **ID**: IP-2.2
- **Effort**: 10 hours
- **Deliverables**:
  - [ ] Implement `LtiGenerator` class
  - [ ] Support LTI 1.1 (legacy) and 1.3
  - [ ] Generate client ID and deployment ID
  - [ ] Configure platform endpoints
  - [ ] Support Deep Linking, AGS, NRPS
- **Test Coverage**: 95%+

#### Task IP-2.3: SAML Generator
- **ID**: IP-2.3
- **Effort**: 8 hours
- **Deliverables**:
  - [ ] Implement `SamlGenerator` class
  - [ ] Generate SP entity ID and ACS URL
  - [ ] Configure IdP metadata reference
  - [ ] Support attribute mapping
  - [ ] Generate SP metadata XML
- **Test Coverage**: 95%+

#### Task IP-2.4: OIDC Generator
- **ID**: IP-2.4
- **Effort**: 6 hours
- **Deliverables**:
  - [ ] Implement `OidcGenerator` class
  - [ ] Generate client ID and secret
  - [ ] Configure redirect URIs
  - [ ] Support scope and claim configuration
- **Test Coverage**: 95%+

#### Task IP-2.5: SFTP Generator
- **ID**: IP-2.5
- **Effort**: 6 hours
- **Deliverables**:
  - [ ] Implement `SftpGenerator` class
  - [ ] Generate SSH key pairs
  - [ ] Configure remote directory and file patterns
  - [ ] Configure delivery schedule
- **Test Coverage**: 95%+

#### Task IP-2.6: Generator Registry
- **ID**: IP-2.6
- **Effort**: 4 hours
- **Deliverables**:
  - [ ] Implement `GeneratorRegistry` singleton
  - [ ] Auto-register all generators
  - [ ] Type-safe generator retrieval
  - [ ] Generator health check
- **Test Coverage**: 95%+

---

### Phase 1.3: Validators (Week 5)

#### Task IP-3.1: Connection Validator
- **ID**: IP-3.1
- **Effort**: 8 hours
- **Deliverables**:
  - [ ] OneRoster endpoint validation
  - [ ] LTI platform validation
  - [ ] SAML IdP validation
  - [ ] OIDC discovery validation
  - [ ] SFTP connectivity validation
- **Test Coverage**: 90%+

#### Task IP-3.2: Schema Validator
- **ID**: IP-3.2
- **Effort**: 6 hours
- **Deliverables**:
  - [ ] Zod schemas for all credential types
  - [ ] Runtime validation for all responses
  - [ ] Clear error messages
- **Test Coverage**: 90%+

#### Task IP-3.3: Compliance Validator
- **ID**: IP-3.3
- **Effort**: 6 hours
- **Deliverables**:
  - [ ] FERPA compliance checks
  - [ ] COPPA compliance checks
  - [ ] SOPIPA compliance checks
  - [ ] Data minimization validation
- **Test Coverage**: 90%+

---

### Phase 1.4: District Adapters (Week 6)

#### Task IP-4.1: Base Adapter Implementation
- **ID**: IP-4.1
- **Effort**: 6 hours
- **Deliverables**:
  - [ ] `BaseDistrictAdapter` abstract class
  - [ ] Adapter lifecycle (init, configure, destroy)
  - [ ] Configuration validation
  - [ ] Event emitter integration
- **Test Coverage**: 95%+

#### Task IP-4.2: LAUSD Adapter
- **ID**: IP-4.2
- **Effort**: 8 hours
- **Deliverables**:
  - [ ] LAUSD-specific endpoints
  - [ ] Schoology LMS integration
  - [ ] LAUSD privacy policies
  - [ ] LAUSD tokenization rules
- **Test Coverage**: 95%+

#### Task IP-4.3: Generic Adapter
- **ID**: IP-4.3
- **Effort**: 6 hours
- **Deliverables**:
  - [ ] Configuration-driven adapter
  - [ ] Template for new districts
  - [ ] Comprehensive validation
- **Test Coverage**: 95%+

#### Task IP-4.4: Adapter Factory
- **ID**: IP-4.4
- **Effort**: 4 hours
- **Deliverables**:
  - [ ] `AdapterFactory` class
  - [ ] Lazy loading support
  - [ ] Adapter caching
- **Test Coverage**: 95%+

---

### Phase 1.5: Ed-Fi Data Model (Week 7-8)

**Strategic Alignment**: See STRATEGY.md for the "why" behind Ed-Fi as our internal canonical model.

#### Task IP-1.6: Ed-Fi Core Domain Implementation
- **ID**: IP-1.6
- **Effort**: 24 hours
- **Priority**: P0 (Foundation for comprehensive data access)
- **Deliverables**:
  - [ ] Implement Ed-Fi Student entity (demographics, enrollment)
  - [ ] Implement Ed-Fi Staff entity (teachers, admins)
  - [ ] Implement Ed-Fi Education Organization entities (schools, districts)
  - [ ] Implement Ed-Fi Section (class) and Course entities
  - [ ] Implement Ed-Fi StudentSectionAssociation (enrollment)
  - [ ] Implement Ed-Fi StudentSchoolAssociation
  - [ ] Implement Ed-Fi Attendance entities (daily + section)
  - [ ] Implement Ed-Fi Discipline entities (incidents, actions)
  - [ ] Implement Ed-Fi Assessment entities (comprehensive)
  - [ ] Implement Ed-Fi StudentSpecialEducationProgramAssociation
  - [ ] Database schema for Ed-Fi entities (PostgreSQL/Prisma)
- **Schema Example**:
```typescript
// Core Ed-Fi entities mapped to TypeScript
export interface EdFiStudent {
  studentUniqueId: string;
  firstName: string;
  lastSurname: string;
  birthDate: string;
  studentIdentificationCodes: StudentIdentificationCode[];
  electronicMails?: ElectronicMail[];
  addresses?: Address[];
  races?: Race[];
  hispanicLatinoEthnicity?: boolean;
}

export interface EdFiStudentSchoolAssociation {
  studentReference: StudentReference;
  schoolReference: SchoolReference;
  entryDate: string;
  entryGradeLevelDescriptor: string;
  exitWithdrawDate?: string;
}

export interface EdFiStudentSectionAssociation {
  studentReference: StudentReference;
  sectionReference: SectionReference;
  beginDate: string;
  endDate?: string;
}
```
- **Test Coverage**: 95%+
- **Acceptance Criteria**:
  - All core Ed-Fi entities implemented
  - CEDS alignment verified
  - Relationships properly modeled

#### Task IP-1.7: Protocol Translation Layer
- **ID**: IP-1.7
- **Effort**: 20 hours
- **Priority**: P0 (Required for external API compatibility)
- **Deliverables**:
  - [ ] OneRoster ↔ Ed-Fi bidirectional mapper
  - [ ] Clever ↔ Ed-Fi bidirectional mapper
  - [ ] Field-level transformation rules
  - [ ] Handle terminology differences (Clever "sections" → Ed-Fi "sections")
  - [ ] Handle missing fields gracefully (OneRoster lacks attendance)
  - [ ] GraphQL schema that maps to Ed-Fi entities
  - [ ] xAPI/Caliper event transformer (for learning analytics)
- **Mappers**:
```typescript
// OneRoster to Ed-Fi mapping
export const oneRosterToEdFi = {
  user: (orUser: OneRosterUser): EdFiStudent | EdFiStaff => {
    // Map based on role
  },
  org: (orOrg: OneRosterOrg): EdFiEducationOrganization => {
    // Map school/district
  },
  class: (orClass: OneRosterClass): EdFiSection => {
    // Map class to section
  },
  enrollment: (orEnrollment: OneRosterEnrollment): EdFiStudentSectionAssociation => {
    // Map enrollment
  },
};

// Clever to Ed-Fi mapping
export const cleverToEdFi = {
  section: (clSection: CleverSection): EdFiSection => {
    // Clever calls them "sections" too
  },
  student: (clStudent: CleverStudent): EdFiStudent => {
    // Map Clever student format
  },
};
```
- **Test Coverage**: 95%+
- **Acceptance Criteria**:
  - Bidirectional translation works
  - No data loss in translation
  - Handles edge cases gracefully

---

### Phase 1.6: Lifecycle & Audit (Week 9)

#### Task IP-5.1: Credential Rotation
- **ID**: IP-5.1
- **Effort**: 8 hours
- **Deliverables**:
  - [ ] `RotationService` class
  - [ ] Scheduled and on-demand rotation
  - [ ] Credential history
  - [ ] Zero-downtime rotation
- **Test Coverage**: 90%+

#### Task IP-5.2: Credential Revocation
- **ID**: IP-5.2
- **Effort**: 6 hours
- **Deliverables**:
  - [ ] `RevocationService` class
  - [ ] Immediate and scheduled revocation
  - [ ] Webhook notifications
- **Test Coverage**: 90%+

#### Task IP-5.3: Expiration Management
- **ID**: IP-5.3
- **Effort**: 6 hours
- **Deliverables**:
  - [ ] `ExpirationService` class
  - [ ] Warning notifications
  - [ ] Auto-revocation
  - [ ] Grace periods
- **Test Coverage**: 90%+

#### Task IP-5.4: Audit Service
- **ID**: IP-5.4
- **Effort**: 8 hours
- **Deliverables**:
  - [ ] `AuditService` class
  - [ ] Structured audit events
  - [ ] Cryptographic signing
  - [ ] Export capabilities
- **Test Coverage**: 90%+

---

### Phase 1.7: Testing & Documentation (Week 10-12)

#### Task IP-6.1: Unit Test Suite
- **ID**: IP-6.1
- **Effort**: 12 hours
- **Target**: 90%+ overall coverage

#### Task IP-6.2: Integration Test Suite
- **ID**: IP-6.2
- **Effort**: 12 hours
- **Target**: 80%+ coverage

#### Task IP-6.3: E2E Test Suite
- **ID**: IP-6.3
- **Effort**: 8 hours
- **Target**: Critical paths covered

#### Task IP-6.4: Performance Testing
- **ID**: IP-6.4
- **Effort**: 4 hours
- **Target**: <100ms p95 generation, <50ms p95 validation

#### Task IP-7.1: API Reference
- **ID**: IP-7.1
- **Effort**: 8 hours
- **Deliverable**: TypeDoc-generated API docs

#### Task IP-7.2: Getting Started Guide
- **ID**: IP-7.2
- **Effort**: 6 hours
- **Deliverable**: 5-minute quickstart

#### Task IP-7.3: Integration Guides
- **ID**: IP-7.3
- **Effort**: 12 hours
- **Deliverable**: Guide per integration type

#### Task IP-7.4: District Adapter Guide
- **ID**: IP-7.4
- **Effort**: 6 hours
- **Deliverable**: How to onboard new district

#### Task IP-7.5: Examples Repository
- **ID**: IP-7.5
- **Effort**: 8 hours
- **Deliverable**: 5+ working examples

---

### Phase 1 Summary

| Metric | Target |
|--------|--------|
| **Duration** | 12 weeks |
| **Total Effort** | ~244 hours |
| **Test Coverage** | 90%+ unit, 80%+ integration |
| **Documentation** | 100% public API |
| **Deliverable** | `@schoolday/integration-core` v1.0.0 |
| **Ed-Fi Coverage** | Core domains + protocol translation |

---

# PHASE 2: CLEVER COMPATIBILITY (Months 4-6)

**Goal**: Enable zero-friction migration from Clever. Vendors switch with no code changes.

## Why This Is Critical

```
┌─────────────────────────────────────────────────────────────┐
│                    THE NETWORK EFFECT TRAP                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Vendors won't integrate ──► Districts won't adopt         │
│            ▲                           │                    │
│            └───────────────────────────┘                    │
│                                                             │
│   CLEVER COMPATIBILITY BREAKS THIS CYCLE                    │
│   ─────────────────────────────────────                     │
│   • 800+ vendors already integrated with Clever             │
│   • Accept Clever API calls → Instant vendor support        │
│   • Districts can switch → Vendors come along for free      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Task IP-8.1: Clever API Compatibility Layer
- **ID**: IP-8.1
- **Effort**: 32 hours
- **Priority**: P0 (CRITICAL)
- **Deliverables**:
  - [ ] Implement Clever API v3.0 endpoint compatibility
  - [ ] `/v3.0/districts` endpoint
  - [ ] `/v3.0/schools` endpoint
  - [ ] `/v3.0/sections` endpoint (Clever's term for classes)
  - [ ] `/v3.0/students` endpoint
  - [ ] `/v3.0/teachers` endpoint
  - [ ] `/v3.0/enrollments` endpoint
  - [ ] Map Clever data model to SchoolDay internal model
  - [ ] Support Clever OAuth 2.0 flow
  - [ ] Support Clever Bearer token authentication
  - [ ] Return Clever-formatted JSON responses
- **Test Coverage**:
  - [ ] Unit: Each endpoint mapping
  - [ ] Integration: Full Clever API flow
  - [ ] Compatibility: Test with real Clever SDK
- **Acceptance Criteria**:
  - Vendor using Clever SDK can point to SchoolDay with zero code changes
  - All Clever API endpoints have equivalents
  - 95%+ test coverage

**Clever API Mapping**:
```typescript
// Clever uses different terminology
const CLEVER_TO_SCHOOLDAY = {
  'sections': 'classes',
  'district': 'district',
  'school': 'school',
  'student': 'student',
  'teacher': 'teacher',
};

// Clever API response format
interface CleverResponse<T> {
  data: T[];
  links: {
    self: string;
    next?: string;
    prev?: string;
  };
}
```

---

### Task IP-8.2: Clever OAuth Compatibility
- **ID**: IP-8.2
- **Effort**: 12 hours
- **Priority**: P0
- **Deliverables**:
  - [ ] Implement Clever OAuth 2.0 authorization flow
  - [ ] `/oauth/authorize` endpoint
  - [ ] `/oauth/tokens` endpoint
  - [ ] Token introspection
  - [ ] Refresh token support
  - [ ] Map Clever scopes to SchoolDay permissions
- **Acceptance Criteria**:
  - Vendors can use existing Clever OAuth integration
  - Tokens are interchangeable
  - 95%+ test coverage

---

### Task IP-8.3: Clever Instant Login Alternative
- **ID**: IP-8.3
- **Effort**: 16 hours
- **Priority**: P1
- **Deliverables**:
  - [ ] Implement SchoolDay Instant Login
  - [ ] QR code-based login for students
  - [ ] Badge/picture-based login for K-2
  - [ ] Portal-based login for teachers
  - [ ] SSO bridge to district IdP
- **Acceptance Criteria**:
  - Students can log in with same ease as Clever Badges
  - Works offline (QR codes)
  - 90%+ test coverage

---

### Task IP-8.4: Real-Time Sync Engine
- **ID**: IP-8.4
- **Effort**: 40 hours
- **Priority**: P0 (Required for production use)
- **Deliverables**:
  - [ ] Implement roster change detection
  - [ ] Event queue (Redis-backed)
  - [ ] Webhook delivery system with retries
  - [ ] Delta sync protocol
  - [ ] Conflict resolution
  - [ ] Sync status dashboard
  - [ ] Bulk sync for initial onboarding
- **Architecture**:
```
┌────────────┐     ┌────────────────┐     ┌─────────────────┐
│  District  │────▶│  Sync Engine   │────▶│  Vendor Apps    │
│    SIS     │     │                │     │                 │
└────────────┘     │ • Change detect│     │ • Webhooks      │
                   │ • Event queue  │     │ • Polling       │
                   │ • Delivery     │     │ • GraphQL Sub   │
                   │ • Retry logic  │     │                 │
                   └────────────────┘     └─────────────────┘
```
- **Acceptance Criteria**:
  - Roster changes propagate in <30 seconds
  - 99.9% webhook delivery success
  - Handles 1000 events/second
  - 90%+ test coverage

---

### Task IP-8.5: Clever Migration Tool
- **ID**: IP-8.5
- **Effort**: 16 hours
- **Priority**: P1
- **Deliverables**:
  - [ ] District migration wizard
  - [ ] Export from Clever (API-based)
  - [ ] Import to SchoolDay
  - [ ] Vendor notification system
  - [ ] Rollback capability
  - [ ] Migration status tracking
- **Acceptance Criteria**:
  - District can migrate from Clever in <1 hour
  - Zero data loss
  - Vendor apps continue working

---

### Task IP-8.6: Clever Webhook Compatibility
- **ID**: IP-8.6
- **Effort**: 8 hours
- **Priority**: P1
- **Deliverables**:
  - [ ] Implement Clever webhook format
  - [ ] `students.created`, `students.updated`, `students.deleted`
  - [ ] `teachers.created`, `teachers.updated`, `teachers.deleted`
  - [ ] `sections.created`, `sections.updated`, `sections.deleted`
  - [ ] Webhook signing (Clever format)
- **Acceptance Criteria**:
  - Vendors using Clever webhooks receive identical payloads
  - 95%+ test coverage

---

### Phase 2 Summary

| Metric | Target |
|--------|--------|
| **Duration** | 12 weeks |
| **Total Effort** | ~150 hours |
| **Clever API Coverage** | 100% of v3.0 endpoints |
| **Migration Time** | <1 hour per district |
| **Deliverable** | Clever compatibility layer + Sync engine |

---

# PHASE 3: MARKETPLACE & SCALE (Months 7-9)

**Goal**: Self-service vendor onboarding, app discovery, district growth

---

### Task IP-9.1: Vendor Marketplace Portal
- **ID**: IP-9.1
- **Effort**: 40 hours
- **Deliverables**:
  - [ ] Vendor registration flow
  - [ ] App listing management
  - [ ] Category/tag system
  - [ ] Search and discovery
  - [ ] App detail pages
  - [ ] Integration status display
  - [ ] Pricing tier display (Free/Privacy-Safe prominent)

---

### Task IP-9.2: District Self-Service Onboarding
- **ID**: IP-9.2
- **Effort**: 32 hours
- **Deliverables**:
  - [ ] District signup flow
  - [ ] SIS connection wizard
  - [ ] Bulk vendor approval
  - [ ] Privacy policy configuration
  - [ ] Admin dashboard

---

### Task IP-9.3: Usage Analytics
- **ID**: IP-9.3
- **Effort**: 24 hours
- **Deliverables**:
  - [ ] API usage tracking
  - [ ] Per-vendor analytics
  - [ ] Per-district analytics
  - [ ] Cost attribution (for premium tiers)
  - [ ] Usage reports

---

### Task IP-9.4: Multi-District Federation
- **ID**: IP-9.4
- **Effort**: 24 hours
- **Deliverables**:
  - [ ] Regional district groups
  - [ ] Shared vendor approvals
  - [ ] Federated admin
  - [ ] Cross-district analytics

---

### Task IP-9.5: GraphQL Data Access Layer
- **ID**: IP-9.5
- **Effort**: 44 hours
- **Deliverables**:
  - [ ] GraphQL schema for all entities
  - [ ] GraphQL generator
  - [ ] Resolver layer with DataLoader
  - [ ] Apollo/Yoga server integration
  - [ ] GraphQL documentation + explorer

---

### Phase 3 Summary

| Metric | Target |
|--------|--------|
| **Duration** | 12 weeks |
| **Total Effort** | ~200 hours |
| **Vendors Onboarded** | 100+ |
| **Districts Live** | 500+ |
| **Deliverable** | Full marketplace + GraphQL |

---

# PHASE 4: GO-TO-MARKET (Months 10-12)

**Goal**: Aggressive growth, Clever displacement

---

### Task IP-10.1: Top 20 Vendor Integrations
- **ID**: IP-10.1
- **Effort**: Ongoing
- **Target Vendors**:
  - [ ] Google Classroom
  - [ ] Canvas
  - [ ] Schoology
  - [ ] Khan Academy
  - [ ] IXL
  - [ ] Newsela
  - [ ] Quizlet
  - [ ] Kahoot
  - [ ] Nearpod
  - [ ] Pear Deck
  - [ ] + 10 more high-value apps

---

### Task IP-10.2: District Acquisition
- **ID**: IP-10.2
- **Effort**: Ongoing
- **Strategy**:
  - [ ] LAUSD case study
  - [ ] State-level partnerships
  - [ ] Privacy-conscious district targeting
  - [ ] Free tier marketing

---

### Task IP-10.3: Pricing Strategy
- **ID**: IP-10.3
- **Effort**: 8 hours
- **Proposed Model**:

| Tier | Price | Features |
|------|-------|----------|
| **Privacy-Safe** | FREE | Tokenized data, basic API |
| **Selective** | $0.10/student/month | Limited PII, advanced API |
| **Full Access** | $0.25/student/month | Full PII, premium support |
| **Enterprise** | Custom | SLA, dedicated support |

---

### Phase 4 Summary

| Metric | Target |
|--------|--------|
| **Duration** | 12 weeks |
| **Vendors** | 100+ integrated |
| **Districts** | 500+ |
| **Clever Migrations** | 50+ |

---

# PHASE 5: MARKET LEADERSHIP (Months 13-18)

**Goal**: Become the default choice for K-12 integration

---

### Key Initiatives

1. **Enterprise Features**
   - SLA guarantees
   - Dedicated support
   - Custom integrations
   - On-premise option

2. **International Expansion**
   - UK schools
   - Canadian provinces
   - Australian states

3. **Advanced Analytics**
   - Learning analytics
   - Engagement metrics
   - Predictive insights

4. **Platform Extensions**
   - Developer SDK
   - Plugin marketplace
   - White-label option

---

### Phase 5 Targets

| Metric | 18-Month Target |
|--------|-----------------|
| **Districts** | 1,000+ |
| **Vendors** | 300+ |
| **Students** | 15M+ |
| **Market Share** | 30%+ |
| **Clever Migrations** | 200+ |

---

## Full Timeline Summary

```
MONTH:  1   2   3   4   5   6   7   8   9  10  11  12  13  14  15  16  17  18
        │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │   │
PHASE:  ├───────────┤   │   │   │   │   │   │   │   │   │   │   │   │   │   │
        │  PHASE 1  │   │   │   │   │   │   │   │   │   │   │   │   │   │   │
        │Foundation │   │   │   │   │   │   │   │   │   │   │   │   │   │   │
        └───────────┼───────────┤   │   │   │   │   │   │   │   │   │   │   │
                    │  PHASE 2  │   │   │   │   │   │   │   │   │   │   │   │
                    │  Clever   │   │   │   │   │   │   │   │   │   │   │   │
                    └───────────┼───────────┤   │   │   │   │   │   │   │   │
                                │  PHASE 3  │   │   │   │   │   │   │   │   │
                                │Marketplace│   │   │   │   │   │   │   │   │
                                └───────────┼───────────┤   │   │   │   │   │
                                            │  PHASE 4  │   │   │   │   │   │
                                            │   GTM     │   │   │   │   │   │
                                            └───────────┼───────────────────┤
                                                        │     PHASE 5       │
                                                        │   DOMINATION      │
                                                        └───────────────────┘

DISTRICTS:   10          100         500              1,000+
VENDORS:     20           50         100               300+
STUDENTS:   100K         1M          5M                15M+
```

---

## Total Effort Estimate

| Phase | Effort | Cumulative |
|-------|--------|------------|
| Phase 1: Foundation + Ed-Fi | 244 hrs | 244 hrs |
| Phase 2: Clever | 150 hrs | 394 hrs |
| Phase 3: Marketplace | 200 hrs | 594 hrs |
| Phase 4: GTM | 100 hrs | 694 hrs |
| Phase 5: Scale | 300 hrs | 994 hrs |

**Total Development**: ~1,000 hours over 18 months

At 25 hrs/week = **40 weeks** of development time
Leaves buffer for go-to-market, sales, support

**Note**: Ed-Fi data model work in Phase 1 is the foundation for comprehensive data access (vs. OneRoster's limited scope). See STRATEGY.md for strategic rationale.

---

## Risk Assessment

### High Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Clever legal action | Program halt | API interoperability is legal (see Oracle v Google) |
| Slow district adoption | No network effect | Free tier + privacy wedge + LAUSD case study |
| Vendor resistance | No apps | Clever compatibility = zero-effort migration |
| Scale issues | Service outages | Load testing, auto-scaling, Redis caching |

### Medium Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Funding runway | Development stops | Milestone-based development, revenue from premium |
| Key person dependency | Knowledge loss | Documentation, pair programming |
| Security breach | Trust destruction | Security audit, bug bounty, SOC 2 |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| Dec 1 | **UX Redesign Initiative Scoped** | Chat-first UI is great for demos but suboptimal for daily vendor use. Scoped dashboard-first approach with AI augmentation at 6 specific touchpoints (error diagnosis, response explanation, upgrade help, message drafting, onboarding, config validation). Created prototypes: `portal-reimagined.html` (full dashboard) and `pitch-presentation.html` (exec slides). 7 key decisions (UX-D1 to UX-D7) documented for management review. Estimated 10 weeks effort, can run parallel to v1.0 backend. Key insight: "Chat is the guide, not the destination." |
| Dec 1 | **District Admin Portal Initiative Scoped** | Identified gap in planning: no mechanism for district IT to configure their vendor ecosystem. Scoped 5 core modules: District Setup Wizard (SSO/SIS/LMS integration), Vendor Governance (credit score thresholds, approval workflows), Communication Policies (channel restrictions, rate limits), Data Policies (default privacy tiers, field blocking), Analytics & Compliance (dashboards, FERPA reports). 8 key decisions (DAP-D1 to DAP-D8) documented. Estimated 10-12 weeks. Critical insight: district-level config enables per-district defaults that simplify individual vendor onboarding. Multi-tenant architecture required. |
| Dec 1 | **Moonshot Features Integrated into PLANNING.md** | Feature flags existed in code (`lib/features/feature-flags.ts`) but weren't visible in roadmap. Added Moonshot Features Backlog section with: 10 ranked features, status/dependencies matrix, value propositions, and suggested release mapping. Features now cross-referenced to releases (v1.0, v1.5, v2.0+) and Strategic Initiatives (UX Redesign, District Admin Portal, EdTech Credit Bureau). Only `synthetic-sandbox` enabled by default. Key enabler for future planning discussions. |
| Nov 30 | **MVP Complete: 10/10 tasks, 1070 tests** | MVP-06 CPaaS demo polish completed with 205 new tests. Created lib/config/cpaas.ts SSOT (pricing, channels, delivery status, LAUSD scale constants). CommTestForm now includes: cost preview section, delivery status simulation (QUEUED→SENT→DELIVERED), privacy explainer panel with FERPA/COPPA badges, scale calculator showing LAUSD-wide costs. Following DEVELOPMENT_PATTERNS.md: centralized config first, then consistency tests, then implementation. Total MVP: 1070 tests, zero bugs in production. |
| Nov 30 | **CPaaS Provider Stack: Vonage + Sinch** | Updated CPAAS_DEVSPIKE.md from SendGrid/Twilio references to actual providers (Vonage/Sinch). Multi-provider strategy enables: rate negotiation leverage, hedging against single provider dependency, failover for reliability. Added V1-14 (provider abstraction) and V1-15 (margin tracking) to v1.0 backlog as P3 tasks. Demo (MVP-06) abstracts this - vendors see "SchoolDay Secure Network" not provider details. |
| Nov 30 | **MVP-05 Form Triggers Complete** | 103 tests verifying form trigger system: detection from [FORM:*] markers, tool result showForm handling, all 8 forms render correctly, cross-layer consistency (handlers → useChat → page). Total: 865 tests passing. MVP now 9/10 complete. |
| Nov 30 | **TEST-INFRA Sprint Added** | MVP-04 streaming tests revealed reusable patterns: static code analysis for external SDKs, contract testing for cross-layer consistency, jsdom environment for React hooks. Created TEST-INFRA sprint (2-3 days) to systematize these patterns before v1.0. ROI: invest 2 days, save 3+ days across 12 v1.0 tasks. |
| Nov 30 | **MVP-04 Streaming Tests Complete** | 188 tests covering backend (95), frontend (39), integration (54). Key learnings: static analysis avoids SDK mocking complexity; jsdom required for React hooks; contract tests verify backend/frontend agreements. Total: 762 tests passing. |
| Nov 30 | **v1.5 Multi-Protocol Sandbox Suite** | Added 9 new sandbox types beyond OneRoster: CSV/HTTP, CSV/SFTP, Ed-Fi, GraphQL, xAPI, Caliper, SIF, QTI, CASE. Prioritized by vendor coverage: P1 bulk data (CSV), P2 modern APIs (Ed-Fi, GraphQL), P3 analytics (xAPI/Caliper), P4 legacy (SIF/QTI/CASE). GraphQL differentiates from Clever. Ed-Fi mandatory for Texas. |
| Nov 30 | **CONFIG-03 Completed** | AI Tool Names centralized in lib/config/ai-tools.ts. 91 tests added. All 3 CONFIG tasks now complete (forms, SSO, AI tools). 574 total tests passing. |
| Nov 29 | **Configuration DRY Initiative** | After fixing BUG-002, identified 3 more patterns with same risk: Form Types (5 files), SSO Providers (4 files), AI Tool Names (4 files). Created centralization plan in PLANNING.md. Estimated 1 hour total. |
| Nov 29 | **BUG-002 RESOLVED + Learnings Captured** | Fixed sandbox endpoint hardcoding. Created lib/config/oneroster.ts as single source of truth. Added 124 tests (87 BUG-002 + 37 consistency). Updated CLAUDE.md with "Configuration DRY Rule". |
| Nov 29 | **v1.0 architecture spec created** | Comprehensive technical specification (ARCHITECTURE_SPEC.md) covering 5 production gaps: data layer, auth, sessions, CPaaS metering, observability. 12-day implementation roadmap. |
| Nov 29 | **CPaaS as core revenue driver** | Per-message pricing creates recurring revenue vs competitors' one-time fees. Communication Gateway is THE business model, not just a feature. See CPAAS_DEVSPIKE.md. |
| Nov 29 | **5 demo workflows (up from 4)** | Added LTI 1.3 as 5th workflow. Communication Gateway (Workflow 2) marked as revenue showcase. See DEMO_WORKFLOWS.md. |
| Nov 29 | **3 patentable IP areas identified** | Token-based relay, vendor trust scoring for comms, district-controlled firewall. See CPAAS_DEVSPIKE.md Part 3. |
| Nov 29 | **Vendor verification system** | Digital-age legitimacy checks without bureaucracy: domain match, SSL, website age, LinkedIn, EdTech directories. Tiered for Privacy-Safe (auto) vs PII access (enhanced). |
| Nov 29 | **8 EdTech directories integrated** | 1EdTech, Common Sense, SDPC, iKeepSafe, Privacy Pledge, Clever, ClassLink, CA State. Common Sense required for Full Access tier. |
| Nov 28 | **Ed-Fi as internal canonical model** | Most comprehensive K-12 data standard (16+ domains vs OneRoster's 2); CEDS-aligned; state mandates growing (TX, WI, AZ, MI). See STRATEGY.md. |
| Nov 28 | **Multi-protocol external APIs** | OneRoster, Clever, GraphQL, Ed-Fi externally; translation at protocol layer |
| Nov 28 | Extract to monorepo | Enable independent versioning, publishing |
| Nov 28 | Turborepo for build | Fast, caching, proven at scale |
| Nov 28 | Vitest for testing | Fast, TypeScript native, Jest compatible |
| Nov 28 | 90%+ coverage target | Enterprise-grade quality |
| Nov 28 | GraphQL deferred to Phase 3 | Keep Phase 1-2 focused |
| Nov 28 | Clever API compatibility | Critical for network effects, zero-friction migration |
| Nov 28 | Real-time sync engine | Required for production parity with Clever |
| Nov 28 | Free Privacy-Safe tier | Disrupt Clever's vendor-pays model |
| Nov 28 | 18-month disruption target | Aggressive but achievable with focus |
| Nov 28 | Open standards for SSO | SAML/OIDC are industry standards; avoid Clever-style proprietary lock-in |

---

## Quick Reference

```bash
# Start development
/start

# Check progress
/dashboard

# Run tests
npm run test
npm run test:coverage

# Build
npm run build
```

---

*This is a living document. The goal is clear: Disrupt Clever in 18 months.*
*Update via `/plan-release` when strategy evolves.*
