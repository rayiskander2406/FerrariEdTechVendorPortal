# TODO - SchoolDay Vendor Portal

**Last Updated**: November 30, 2025

This is the **master task list** for the SchoolDay Vendor Integration Portal.

---

## Active Focus

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

| Task ID | Task | Priority | Effort | Notes |
|---------|------|----------|--------|-------|
| TEST-01 | Standardize vitest.config.ts environments | P1 | S | jsdom default, node for API |
| TEST-02 | Create tests/helpers/ shared utilities | P1 | S | SSE mocks, flexible matchers, static analysis |
| TEST-03 | Add contract tests for API routes | P1 | M | Route ↔ consumer, tool ↔ handler |
| TEST-04 | Document TESTING_PATTERNS.md | P2 | S | When static analysis vs runtime |
| TEST-05 | Convert remaining complex mocks | P2 | M | Apply static analysis to sandbox/SSO |

**Total Effort**: 2-3 days | **ROI**: Invest 2 days → Save 3+ days across v1.0

---

### v1.0 Release Tasks (Post-TEST-INFRA)

> **Technical Spec**: See [ARCHITECTURE_SPEC.md](./ARCHITECTURE_SPEC.md) for implementation details

| Task ID | Task | Priority | Days | Notes |
|---------|------|----------|------|-------|
| V1-01 | PostgreSQL + Prisma schema | P1 | 2 | Vendor, Integration, Credential, ApiKey, Message, AuditLog models |
| V1-02 | API Key authentication | P1 | 1 | SHA-256 hashed keys, Bearer auth, scope-based permissions |
| V1-03 | Rate limiting (Upstash) | P1 | 0.5 | Tier-based: 100/500/1000 req/min |
| V1-04 | Vendor Session layer | P1 | 2 | State persistence, conversation history, cleanup cron |
| V1-05 | CPaaS message queue | P1 | 2 | BullMQ, POST /api/cpaas/messages, delivery tracking |
| V1-06 | Pricing engine | P1 | 1 | Volume-based tiered pricing, usage tracking |
| V1-07 | Observability stack | P1 | 2 | Pino logging, Sentry, Prometheus metrics |
| V1-08 | Audit logging | P2 | 0.5 | All mutations logged to audit table |
| V1-09 | Environment config | P2 | 0.5 | Zod validation for all env vars |
| V1-10 | Integration tests | P2 | 1 | All API endpoints covered |
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
| TEST-INFRA | Testing infrastructure sprint | 📋 Planned (2-3 days) |
| v1.0 | Production-ready with PostgreSQL | 📋 Planned |
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
