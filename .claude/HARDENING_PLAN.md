# Hardening Release Plan (v1.0-hardening)

**Created**: November 30, 2024
**Branch**: `refactor/hardening`
**Base Tag**: `v1.0-demo`
**Goal**: Eliminate architectural fragility before adding new features

---

## Release Context

```
╔══════════════════════════════════════════════════════════════╗
║                    RELEASE: v1.0-hardening                   ║
╠══════════════════════════════════════════════════════════════╣
║                                                               ║
║  POSITION IN ROADMAP                                         ║
║  ─────────────────────────────────────────────────────────── ║
║                                                               ║
║  ✅ MVP (v1.0-demo)     ← Tagged, demo-ready                 ║
║  🚧 HARDENING           ← You are here                       ║
║  📋 TEST-INFRA          ← After hardening                    ║
║  📋 v1.0                ← Production release                 ║
║                                                               ║
║  WHY THIS RELEASE?                                           ║
║  Bugfix session revealed architectural issues:               ║
║  • 4 sources of truth for vendor state                       ║
║  • Stale closure workarounds (refs) in useChat               ║
║  • globalThis patches for memory isolation                   ║
║  • Implicit config dependencies                              ║
║                                                               ║
║  Without hardening, each new feature compounds fragility.    ║
║                                                               ║
╚══════════════════════════════════════════════════════════════╝
```

---

## GO/NO-GO Gates

```
╔══════════════════════════════════════════════════════════════╗
║              v1.0-hardening GO/NO-GO GATES                   ║
╠══════════════════════════════════════════════════════════════╣

  REGRESSION GATE
  ───────────────
  □ All existing tests pass (1070+)
  □ Demo workflow: PoDS → SSO still works
  □ Reset button clears and restarts cleanly
  Test: npm test && manual demo run
  Criteria: Zero regressions

  STATE ARCHITECTURE GATE
  ───────────────────────
  □ Single VendorProvider context
  □ No stale closure refs (isLoadingRef, vendorStateRef removed)
  □ localStorage sync handled by provider
  Test: Code review - no useRef for state
  Criteria: One source of truth

  DATA LAYER GATE
  ───────────────
  □ globalThis stores removed
  □ Proper mock service layer OR SQLite
  □ Predictable lifecycle (no hot-reload surprises)
  Test: Restart server, data persists correctly
  Criteria: No memory isolation issues

  CONFIG CENTRALIZATION GATE
  ──────────────────────────
  □ All SSO providers from single source
  □ All data element mappings from single source
  □ All form triggers from single source
  Test: Grep for duplicated constants
  Criteria: Zero duplicate definitions

╚══════════════════════════════════════════════════════════════╝
```

---

## Required Work

```
╔══════════════════════════════════════════════════════════════╗
║                    RELEASE REQUIREMENTS                      ║
╠══════════════════════════════════════════════════════════════╣

  RELEASE: v1.0-hardening
  GOAL: Eliminate architectural fragility

  PHASE 1: State Architecture (P1 - MUST HAVE)
  ─────────────────────────────────────────────
  □ HARD-01: Create VendorProvider context
    - Single source of truth for vendorState
    - Auto-sync to localStorage
    - Expose via useVendor() hook
    - Handle hydration correctly
    Effort: M (1-2 days)

  □ HARD-02: Refactor useChat to useReducer
    - Actions: SEND_MESSAGE, RECEIVE_CHUNK, TOOL_RESULT
    - Eliminates stale closure issues by design
    - Remove isLoadingRef, vendorStateRef
    Effort: M (1-2 days)

  PHASE 2: Data Layer (P1 - MUST HAVE)
  ─────────────────────────────────────
  □ HARD-03: Replace globalThis with proper mock layer
    - Option A: SQLite with Prisma (production-like)
    - Option B: Mock service class with clear lifecycle
    - No hot-reload state loss
    Effort: M (1-2 days)

  □ HARD-04: Unify API routes with data layer
    - /api/vendors, /api/sandbox, /api/pods use same store
    - Clear initialization/reset semantics
    Effort: S (0.5 day)

  PHASE 3: Config Consolidation (P2 - SHOULD HAVE)
  ─────────────────────────────────────────────────
  □ HARD-05: Audit and consolidate all configs
    - SSO providers: single export
    - Data element mappings: single export
    - Form triggers: single export
    - AI tool names: single export
    Effort: S (0.5 day)

  PHASE 4: Error Handling (P2 - SHOULD HAVE)
  ──────────────────────────────────────────
  □ HARD-06: Add React error boundaries
    - Chat area boundary
    - Form boundary
    - Graceful fallback UI
    Effort: S (0.5 day)

  OUT OF SCOPE
  ────────────
  • New features (defer to v1.0)
  • Database migration to PostgreSQL (defer to v1.0)
  • Multi-district support (defer to v1.1)
  • Performance optimization (defer to v1.0)

╚══════════════════════════════════════════════════════════════╝
```

---

## Risk Assessment

```
╔══════════════════════════════════════════════════════════════╗
║                    RISK ASSESSMENT                           ║
╠══════════════════════════════════════════════════════════════╣

  HIGH RISK
  ─────────
  Risk: Refactoring breaks existing functionality
  Impact: Demo stops working
  Mitigation:
    • Tagged v1.0-demo as fallback
    • Run full test suite after each phase
    • Test demo workflow after each change

  Risk: useReducer refactor introduces new bugs
  Impact: Chat streaming breaks
  Mitigation:
    • Incremental refactor (one action at a time)
    • Keep old code until new code works
    • Add specific tests for each action

  MEDIUM RISK
  ───────────
  Risk: SQLite adds complexity
  Impact: Development friction
  Mitigation:
    • Consider simpler mock service first
    • Only use SQLite if mock layer insufficient

  Risk: Hydration issues with VendorProvider
  Impact: React hydration errors in console
  Mitigation:
    • Use 'use client' correctly
    • Handle initial state carefully
    • Test SSR behavior

  DEPENDENCIES
  ────────────
  • None external
  • All changes are internal refactoring

╚══════════════════════════════════════════════════════════════╝
```

---

## Implementation Order

```
  Recommended sequence (minimizes risk):

  1. HARD-05 (Config consolidation)     ← Low risk, high value
  2. HARD-01 (VendorProvider)           ← Foundation for state
  3. HARD-04 (Unify API routes)         ← Uses VendorProvider
  4. HARD-03 (Mock layer)               ← Replace globalThis
  5. HARD-02 (useReducer refactor)      ← Biggest change, do last
  6. HARD-06 (Error boundaries)         ← Polish

  After each step: Run tests + manual demo verification
```

---

## Acceptance Criteria

```
  ✅ HARDENING COMPLETE WHEN:

  1. Zero stale closure refs in codebase
     grep -r "useRef.*Loading\|useRef.*State" lib/hooks → no results

  2. Zero globalThis usage for stores
     grep -r "globalThis\.__" lib/ → no results

  3. Single VendorProvider wraps app
     VendorProvider in layout.tsx or Providers.tsx

  4. All 1070+ tests pass
     npm test → all green

  5. Demo workflow completes smoothly
     Reset → PoDS → SSO → API Test → works

  6. No duplicate config definitions
     Each constant defined once, exported from config/
```

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| Nov 30 | Create hardening branch before v1.0 | Fragility compounds with each feature |
| Nov 30 | VendorProvider over Redux | Simpler, sufficient for current needs |
| Nov 30 | useReducer over useState | Eliminates stale closures by design |
| Nov 30 | Mock layer before SQLite | Start simple, upgrade if needed |

---

## Next Steps

```
  TO BEGIN HARDENING:

  1. Ensure on correct branch:
     git checkout refactor/hardening

  2. Run baseline tests:
     npm test

  3. Start with HARD-05 (config consolidation):
     /start

  4. After each phase, verify:
     npm test && manual demo check
```

---

*This plan lives on the `refactor/hardening` branch. The `master` branch (v1.0-demo) remains untouched until merge.*
