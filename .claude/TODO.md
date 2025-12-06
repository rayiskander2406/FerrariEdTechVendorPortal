# TODO - SchoolDay Vendor Portal

**Last Updated**: December 6, 2025

This is the **master task list** for the SchoolDay Vendor Integration Portal.

---

## Active Focus

### Current Sprint: v1.0-hardening (P1 Complete!)
**Goal**: Implement production-ready database schema with all 20 mitigations
**Status**: ✅ ALL Complete (9/9)
**Tests**: 3222 passing

| Task ID | Task | Status | Priority | Tests |
|---------|------|--------|----------|-------|
| HARD-01 | PostgreSQL setup (docker-compose) | ✅ Complete | P1 | 54 |
| HARD-02 | Run migrations (main + vault) | ✅ Complete | P1 | 2 |
| HARD-03 | Vault database infrastructure | ✅ Complete | P1 | 40 |
| HARD-04 | Entity operations (entities.ts) | ✅ Complete | P1 | 34 |
| HARD-05 | Seed LAUSD demo data | ✅ Complete | P1 | 17 |
| HARD-06 | Read replica configuration | ✅ Complete | P2 | 19 |
| HARD-07 | Circuit breaker for external services | ✅ Complete | P2 | 34 |
| HARD-08 | SyncJob infrastructure | ✅ Complete | P3 | 55 |
| HARD-09 | Vault rate limiting | ✅ Complete | P3 | (in HARD-03) |

**Key Deliverables:**
- `docker-compose.yml` - PostgreSQL 15 Alpine (main:5434, vault:5433)
- `lib/vault/*` - Vault client, operations, rate-limit, alerts
- `lib/db/entities.ts` - CRUD for District, School, User, Class, Enrollment
- `lib/db/seed.ts` - LAUSD seeder (610 students, 26 teachers, 5 schools)
- `npm run db:seed` - Seed command

---

### Previous Sprint: Integration Layer Bugfixes (Complete)
**Goal**: Fix 6 critical bugs blocking demo reliability
**Status**: ✅ Complete - All 38 tests passing
**Plan**: See [BUGFIX_RELEASE_PLAN.md](./BUGFIX_RELEASE_PLAN.md) for full details

| Fix ID | Bug Description | Status | Priority | Tests |
|--------|----------------|--------|----------|-------|
| FIX-001 | Form values don't match endpoint mapping (USERS→/users) | ✅ Fixed | P1 CRITICAL | 10 passing |
| FIX-002 | Random demo data overrides empty prefill | ✅ Fixed | P1 HIGH | 4 passing |
| FIX-003 | useState ignores prefill prop changes after mount | ✅ Fixed | P1 HIGH | 3 passing |
| FIX-004 | AI not extracting vendor names from conversation | ✅ Fixed | P2 | 3 passing |
| FIX-005 | SSO flow ignores existing vendorState | ✅ Fixed | P2 | 3 passing |
| FIX-006 | ACADEMIC_SESSIONS not mapped in dataElementsToEndpoints | ✅ Fixed | P3 | 4 passing |

**Test Status**: 38 passing, 0 failing
**Test File**: `tests/bugfix/integration-layer-fixes.test.ts`

---

### Previous Sprint: MVP Refinement (Complete)
**Goal**: Polish demo experience and ensure reliability for LAUSD presentations
**Status**: ✅ Complete (10/10 tasks)

| Task ID | Task | Status | Priority | Notes |
|---------|------|--------|----------|-------|
| MVP-01 | Verify all 12 AI tools work reliably | ✅ Complete | P1 | 187 tests, 90%+ coverage |
| MVP-02 | Privacy audit - no PII leaks | ✅ Complete | P1 | All PII properly tokenized |
| MVP-03 | Test all 5 demo workflows end-to-end | ✅ Complete | P1 | All 5 workflows validated |
| BUG-002 | Sandbox ignores vendor's selected OneRoster resources | ✅ Complete | P1 | Fixed - 87 tests + 37 consistency |
| CONFIG-01 | Form Types centralization (prevent BUG-002 class) | ✅ Complete | P1 | 79 tests, forms.ts SSOT |
| CONFIG-02 | SSO Providers centralization | ✅ Complete | P2 | 93 tests, sso.ts SSOT |
| CONFIG-03 | AI Tool Names type safety | ✅ Complete | P2 | 91 tests, ai-tools.ts SSOT |
| MVP-04 | Streaming response tests | ✅ Complete | P2 | 188 tests (static analysis + runtime) |
| MVP-05 | Form triggers ([FORM:*]) | ✅ Complete | P2 | 103 tests (unit + integration) |
| MVP-06 | CPaaS demo polish (CommTestForm) | ✅ Complete | P2 | 205 tests, cost preview + delivery status + privacy explainer + scale calculator |

**Status**: MVP Complete! All 10/10 tasks done.

### Strategic Documentation (Completed)
| Task ID | Task | Status | Notes |
|---------|------|--------|-------|
| DOC-01 | Design 5 demo workflows | ✅ Complete | DEMO_WORKFLOWS.md |
| DOC-02 | CPaaS devspike for IP development | ✅ Complete | CPAAS_DEVSPIKE.md |
| DOC-03 | Release planning | ✅ Complete | PLANNING.md updated |

---

## Backlog

### TEST-INFRA Sprint (Post-MVP, Pre-v1.0)

> **Strategic Value**: Systematize MVP-04 testing patterns for 150% ROI across v1.0 development

| Task ID | Task | Priority | Effort | Status | Notes |
|---------|------|----------|--------|--------|-------|
| TEST-01 | Standardize vitest environments | P1 | S | ✅ Complete | 23 tests, node + jsdom |
| TEST-02 | Create tests/utils/ shared utilities | P1 | S | ✅ Complete | 30 tests, TestDataTracker, factories |
| TEST-03 | Add contract tests for API routes | P1 | M | ✅ Complete | 29 tests, Zod schemas, TDD design |
| TEST-04 | Document TESTING_PATTERNS.md | P2 | S | ✅ Complete | docs/TESTING_PATTERNS.md |
| TEST-05 | Convert remaining complex mocks | P2 | M | 📋 Planned | Apply static analysis to sandbox/SSO |

**Status**: 4/5 Complete | **Total Effort**: 2-3 days

---

### v1.0 Release Tasks (Post-TEST-INFRA)

> **Technical Spec**: See [ARCHITECTURE_SPEC.md](./ARCHITECTURE_SPEC.md) for implementation details

| Task ID | Task | Priority | Days | Status | Notes |
|---------|------|----------|------|--------|-------|
| V1-01 | PostgreSQL + Prisma schema | P1 | 2 | ✅ Complete | Via v1.0-hardening sprint |
| V1-02 | API Key authentication | P1 | 1 | ✅ Complete | 92 tests, lib/auth/*, /api/auth/keys/* |
| V1-03 | Rate limiting (Upstash) | P1 | 0.5 | ✅ Complete | 69 tests, lib/rate-limit/*, tier-based: 100/500/1000 req/min |
| V1-04 | Vendor Session layer | P1 | 2 | ✅ Complete | 74 tests, lib/session/*, 24h expiry, conversation history |
| V1-05 | CPaaS message queue | P1 | 2 | ✅ Complete | 92 tests, lib/cpaas/*, POST /api/cpaas/messages, delivery tracking |
| V1-06 | Pricing engine | P1 | 1 | ✅ Complete | 90 tests, lib/pricing/*, 4-tier volume discounts, usage tracking |
| V1-07 | Observability stack | P1 | 2 | ✅ Complete | 84 tests, lib/observability/*, /api/health, /api/metrics |
| V1-08 | Audit logging | P2 | 0.5 | ✅ Complete | 46 tests, lib/audit/*, /api/audit endpoint, vendor isolation |
| V1-09 | Environment config | P2 | 0.5 | ✅ Complete | 69 tests, lib/config/env.ts, type-safe env access |
| V1-10 | Integration tests | P2 | 1 | ✅ Complete | 20 tests, direct route handler testing |
| V1-11 | E2E tests with Playwright | P3 | 1 | Critical paths covered |
| V1-12 | k6 load testing scripts | P3 | 0.5 | Performance baselines |
| V1-13 | CI/CD pipeline (GitHub Actions) | P3 | 1 | Auto-deploy to Vercel |
| V1-14 | Provider abstraction (Vonage/Sinch) | P3 | 2 | Multi-provider routing, failover, rate optimization |
| V1-15 | Margin tracking & cost optimization | P3 | 1 | Revenue vs provider cost, rate monitoring |

**Total Effort**: 12 days (P1) + 5.5 days (P2/P3) = 17.5 days

### High Priority (Parallel/Future)

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| B-03 | Add error boundary for chat failures | P1 | S | Graceful recovery |
| B-04 | CI/CD pipeline (GitHub Actions) | P1 | M | Auto-deploy to Vercel |

### Medium Priority (Future)

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| B-05 | Multi-tenant support (multiple districts) | P2 | L | Feature flag: multi-district |
| B-06 | Parent transparency portal | P2 | L | Feature flag: parent-transparency |
| B-07 | Vendor marketplace | P2 | L | Feature flag: vendor-marketplace |
| B-08 | Impact analytics dashboard | P2 | M | Feature flag: impact-analytics |

### Low Priority (Someday)

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| B-09 | Mobile-responsive chat | P3 | M | |
| B-10 | Dark mode support | P3 | S | |
| B-11 | Keyboard shortcuts | P3 | S | Beyond demo controls |

---

## Feature Flags Status

The following moonshot features can be enabled via `/features`:

| Feature | Status | Priority |
|---------|--------|----------|
| ai-health-monitor | Disabled | #1 |
| compliance-pipeline | Disabled | #2 |
| synthetic-sandbox | **Enabled** | #3 |
| vendor-marketplace | Disabled | #4 |
| predictive-onboarding | Disabled | #5 |
| teacher-feedback | Disabled | #6 |
| multi-district | Disabled | #7 |
| zero-touch-deploy | Disabled | #8 |
| parent-transparency | Disabled | #9 |
| impact-analytics | Disabled | #10 |

---

## Blockers

| ID | Blocker | Impact | Status |
|----|---------|--------|--------|
| None currently | | | |

---

## Recently Completed

| Date | Task ID | Task | Notes |
|------|---------|------|-------|
| Dec 6 | TEST-04 | Testing Patterns Documentation | docs/TESTING_PATTERNS.md - static analysis vs runtime, test data management, contract testing |
| Dec 6 | TEST-03 | Contract Tests | 29 tests, Zod schemas for API contracts, TDD design |
| Dec 6 | V1-10 | Integration Tests | 20 tests, direct route handler testing, uses TEST-02 utilities |
| Dec 6 | TEST-02 | Shared Test Utilities | 30 tests, TestDataTracker, createTestVendor/ApiKey, cleanupTestData |
| Dec 6 | TEST-01 | Vitest Environments | 23 tests, node + jsdom environment standardization |
| Dec 6 | DOCS | Documentation Overhaul | README.md, docs/API.md, docs/DEPLOYMENT.md, .claude/INDEX.md |
| Dec 6 | V1-09 | Environment Config | 69 tests, lib/config/env.ts, Zod validation, type-safe env access, production/dev/test requirements |
| Dec 5 | V1-08 | Audit Logging | 46 tests, lib/audit/*, /api/audit endpoint with auth, vendor isolation, query filtering, PII redaction in details |
| Dec 5 | V1-07 | Observability Stack | 84 tests, lib/observability/*, Pino logging with PII redaction, Sentry error tracking, Prometheus metrics, /api/health + /api/metrics endpoints |
| Dec 5 | V1-06 | Pricing Engine | 90 tests, lib/pricing/*, 4-tier volume pricing (STARTER/GROWTH/SCALE/ENTERPRISE), usage tracking per vendor/month |
| Dec 5 | V1-05 | CPaaS Message Queue | 92 tests, lib/cpaas/*, POST /api/cpaas/messages, batch messaging, delivery webhooks, retry with exponential backoff |
| Dec 5 | V1-04 | Vendor Session layer | 74 tests, lib/session/*, withSession/withAuthAndSession middleware, 24h expiry + 1h extension |
| Dec 5 | V1-03 | Rate limiting (Upstash) | 69 tests, lib/rate-limit/*, tier-based: PRIVACY_SAFE 100/min, SELECTIVE 500/min, FULL_ACCESS 1000/min |
| Dec 5 | HARD-08 | SyncJob infrastructure | 55 tests, lib/sync/index.ts, idempotency support |
| Dec 5 | HARD-07 | Circuit breaker for external services | 34 tests, lib/circuit-breaker/index.ts, API endpoint |
| Dec 5 | HARD-06 | Read replica configuration | 19 tests, lib/db/replica.ts, prismaRead client |
| Dec 5 | HARD-05 | Seed LAUSD demo data | 17 tests, lib/db/seed.ts, npm run db:seed |
| Dec 5 | HARD-04 | Entity operations | 34 tests, lib/db/entities.ts |
| Dec 5 | HARD-03 | Vault database infrastructure | 40 tests, lib/vault/*, rate limiting, alerts |
| Dec 5 | HARD-02 | Run migrations | Main (36 models) + Vault (6 models) |
| Dec 5 | HARD-01 | PostgreSQL setup | docker-compose.yml, main:5434, vault:5433 |
| Nov 30 | MVP-06 | CPaaS demo polish (CommTestForm) | 205 tests: lib/config/cpaas.ts SSOT, cost preview, delivery status simulation, privacy explainer, scale calculator |
| Nov 30 | MVP-05 | Form triggers ([FORM:*]) | 103 tests (unit + integration) |
| Nov 30 | MVP-04 | Streaming response tests | 188 tests (backend, frontend, integration) |
| Nov 30 | CONFIG-03 | AI Tool Names type safety | 91 tests, lib/config/ai-tools.ts SSOT |
| Nov 29 | CONFIG-02 | SSO Providers centralization | 93 tests, lib/config/sso.ts SSOT |
| Nov 29 | CONFIG-01 | Form Types centralization | 79 tests, lib/config/forms.ts SSOT |
| Nov 29 | BUG-002 | Sandbox honors vendor's OneRoster selections | 32 tests, all 7 endpoints supported |
| Nov 29 | MVP-03 | Test all 5 demo workflows end-to-end | Validator created, all pass |
| Nov 29 | TOOL | Demo Scenario Validator | scripts/validate-demo.ts |
| Nov 29 | TOOL | Changelog Generator | scripts/generate-changelog.sh |
| Nov 29 | TOOL | PII Pattern Scanner | scripts/pii-check.sh |
| Nov 29 | DOC | Moonshot acceleration docs | .claude/MOONSHOTS.md |
| Nov 28 | BUG-01 | LTI integration credentials fix | LtiConfigForm + tab selection |
| Nov 28 | SETUP | Command framework integration | 18 commands added |
| | | Initial project setup | Next.js 14 + Claude API |
| | | 12 AI tools implemented | All working |
| | | Demo workflows | 4 scenarios |
| | | Feature flags system | 10 moonshots |

---

## Milestones

| Version | Description | Status |
|---------|-------------|--------|
| MVP | Demo-ready for LAUSD presentations | ✅ Complete (10/10) - 1070 tests |
| v1.0-hardening | Database schema implementation | ✅ Complete (9/9) - 2829 tests |
| TEST-INFRA | Testing infrastructure sprint | 🚧 In Progress (3/5) - 82 tests added |
| v1.0 | Production-ready with auth & rate limiting | 🚧 In Progress (10/15) - 3222 tests |
| v1.5 | Multi-protocol sandbox suite | 📋 Planned |
| v2.0 | Full moonshot features | 📋 Planned |

---

## Status Legend

- 📋 Planned - Not started
- 🚧 In Progress - Actively working
- ⏸️ Paused - On hold
- ⏳ Blocked - Waiting on something
- ✅ Complete - Done!

## Priority Legend

- P1 - Must do (demo/launch critical)
- P2 - Should do (important for v1.0)
- P3 - Nice to do (future enhancement)

## Effort Legend

- S - Small (< 1 day)
- M - Medium (1-3 days)
- L - Large (3+ days)

---

## Quick Commands

| Command | Description |
|---------|-------------|
| `/dashboard` | Quick status view |
| `/start` | Begin next task |
| `/finish` | Complete current task |
| `/bug [description]` | File bug with RCA, dev spike, test plan |
| `/demo` | Demo mode controls |
| `/run-demo` | Quick launch demo |
| `/features` | Manage feature flags |

---

*Update this file whenever tasks change. Keep it current!*
