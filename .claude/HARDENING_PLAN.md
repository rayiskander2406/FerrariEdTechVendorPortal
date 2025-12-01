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
  ✅ HARD-01: Create VendorProvider context [COMPLETED Dec 1, 2024]
    - Single source of truth for vendorState
    - Auto-sync to localStorage
    - Expose via useVendor() hook
    - Handle hydration correctly
    Files: lib/contexts/VendorContext.tsx, lib/contexts/index.ts
    Also: Updated useChat.ts (removed vendorStateRef), page.tsx (simplified)

  ✅ HARD-02: Fix stale closure race condition [COMPLETED Dec 1, 2024]
    - DISCOVERED: isLoadingRef workaround was incomplete - ref only synced on render
    - Created tests/hooks/useChat-race-condition.test.ts (6 tests proving the bug)
    - Applied targeted fix: Add `isLoadingRef.current = true` immediately after setIsLoading(true)
    - All 6 race condition tests now pass
    - Full useReducer refactor deferred (optional - current fix is sufficient)
    Files: lib/hooks/useChat.ts:218-222, tests/hooks/useChat-race-condition.test.ts

  PHASE 2: Data Layer (P1 - MUST HAVE)
  ─────────────────────────────────────
  ✅ HARD-03: Replace globalThis with proper mock layer [COMPLETED Dec 1, 2024]
    - Chose Option B: MockDbService class with clear lifecycle
    - Created MockDbService class encapsulating all 4 stores (vendors, sandboxes, auditLogs, podsApplications)
    - Single globalThis.__mockDb reference instead of scattered stores
    - Added lifecycle methods: reset(), getStats(), isInitialized()
    - Updated synthetic.ts to use new MockDbService pattern
    Files: lib/db/index.ts, lib/data/synthetic.ts

  ✅ HARD-04: Unify API routes with data layer [COMPLETED Dec 1, 2024]
    - Added PodsApplication type to lib/types/index.ts
    - Added PoDS store to lib/db/index.ts with globalThis persistence
    - Updated synthetic.ts to use lib/db functions (wrapper for backwards compat)
    - Updated /api/pods to use lib/db directly
    - All API routes now use same globalThis-backed stores
    Files: lib/types/index.ts, lib/db/index.ts, lib/data/synthetic.ts, app/api/pods/route.ts

  PHASE 3: Config Consolidation (P2 - SHOULD HAVE)
  ─────────────────────────────────────────────────
  ✅ HARD-05: Audit and consolidate all configs [COMPLETED Dec 1, 2024]
    - Audited 5 config files in lib/config/
    - Fixed SsoProviderEnum duplication in lib/types/index.ts
    - Fixed ToolName duplication in lib/ai/tools.ts (now uses ToolId)
    - Result: All constants have single source of truth

  PHASE 4: Error Handling (P2 - SHOULD HAVE)
  ──────────────────────────────────────────
  ✅ HARD-06: Add React error boundaries [COMPLETED Dec 1, 2024]
    - Created base ErrorBoundary class component with reset capability
    - Created ChatErrorBoundary with chat-specific fallback UI
    - Created FormErrorBoundary with form-specific fallback UI
    - Integrated into app/chat/page.tsx around messages and form areas
    Files: components/ui/ErrorBoundary.tsx, app/chat/page.tsx

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
| Dec 1 | HARD-05 Complete | Config consolidation - fixed 2 duplicate definitions |
| Dec 1 | HARD-01 Complete | VendorProvider context eliminates vendorStateRef pattern |
| Dec 1 | HARD-04 Complete | Unified PoDS storage in lib/db with globalThis persistence |
| Dec 1 | HARD-03 Complete | MockDbService class replaces scattered globalThis stores |
| Dec 1 | HARD-02 Complete | Targeted fix for race condition (test-first de-risking) - useReducer deferred |
| Dec 1 | HARD-06 Complete | React error boundaries for chat and forms - graceful error handling |

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
