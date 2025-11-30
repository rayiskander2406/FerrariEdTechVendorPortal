---
name: plan-release
description: Analyze codebase and create strategic release plan in .claude/PLANNING.md
---

# Plan Release - Strategic Release Planning

You are creating a comprehensive release plan for the SchoolDay Vendor Portal.

## Instructions

### Step 1: Gather Current State

Read these files to understand where we are:
- `.claude/TODO.md` - Current tasks and backlog
- `.claude/PLANNING.md` - Existing roadmap
- `.claude/COMPLETED.md` - Recent progress
- `CLAUDE.md` - Project guidelines

### Step 2: Identify Release Target

```
╔══════════════════════════════════════════════════════════════╗
║                    RELEASE PLANNING                          ║
╠══════════════════════════════════════════════════════════════╣
║                                                               ║
║  WHICH RELEASE ARE WE PLANNING?                              ║
║  ─────────────────────────────────────────────────────────── ║
║                                                               ║
║  1. MVP      - Demo-ready for LAUSD presentations            ║
║  2. v1.0     - Production-ready with real database           ║
║  3. v1.1     - Multi-district support                        ║
║  4. v2.0     - Moonshot features enabled                     ║
║  5. CUSTOM   - Define a different release                    ║
║                                                               ║
║  Choose release (1-5):                                       ║
║                                                               ║
╚══════════════════════════════════════════════════════════════╝
```

### Step 3: Define GO/NO-GO Gates

Each release needs clear gates:

#### MVP Gates
```
  MVP GO/NO-GO GATES
  ──────────────────

  CORRECTNESS GATE
  • All 12 AI tools respond correctly
  • Test: /test-ai-tools
  • Criteria: 100% pass rate

  PRIVACY GATE
  • Zero PII in Claude API requests
  • Test: /privacy-check
  • Criteria: All PII tokenized

  DEMO GATE
  • All 4 workflows complete end-to-end
  • Test: /run-demo
  • Criteria: Smooth stakeholder experience

  PERFORMANCE GATE
  • Response time < 3 seconds
  • Test: Manual observation
  • Criteria: No timeouts or lag
```

#### v1.0 Gates
```
  v1.0 GO/NO-GO GATES
  ───────────────────

  ALL MVP GATES PLUS:

  DATABASE GATE
  • PostgreSQL integration working
  • Test: Database migrations
  • Criteria: All CRUD operations work

  SECURITY GATE
  • Rate limiting in place
  • Test: /security-audit
  • Criteria: No abuse vectors

  DEPLOYMENT GATE
  • CI/CD pipeline functional
  • Test: Push to main triggers deploy
  • Criteria: Automated Vercel deployment
```

### Step 4: Identify Required Work

Analyze codebase to determine what's needed:

```
╔══════════════════════════════════════════════════════════════╗
║                    RELEASE REQUIREMENTS                      ║
╠══════════════════════════════════════════════════════════════╣

  RELEASE: [Version]
  GOAL: [One-line description]

  MUST HAVE (P1)
  ──────────────
  □ [Requirement 1]
  □ [Requirement 2]
  □ [Requirement 3]

  SHOULD HAVE (P2)
  ────────────────
  □ [Requirement 4]
  □ [Requirement 5]

  NICE TO HAVE (P3)
  ─────────────────
  □ [Requirement 6]

  OUT OF SCOPE
  ────────────
  • [Feature explicitly excluded]
  • [Feature deferred to later release]

╚══════════════════════════════════════════════════════════════╝
```

### Step 5: Risk Assessment

```
╔══════════════════════════════════════════════════════════════╗
║                    RISK ASSESSMENT                           ║
╠══════════════════════════════════════════════════════════════╣

  HIGH RISK
  ─────────
  Risk: [Description]
  Impact: [What happens if this occurs]
  Mitigation: [How to prevent or handle]

  MEDIUM RISK
  ───────────
  Risk: [Description]
  Impact: [What happens if this occurs]
  Mitigation: [How to prevent or handle]

  DEPENDENCIES
  ────────────
  • [External dependency and its status]

╚══════════════════════════════════════════════════════════════╝
```

### Step 6: Update PLANNING.md

Update `.claude/PLANNING.md` with:
1. Clear release goal and scope
2. GO/NO-GO gates with measurable criteria
3. Required work items
4. Risk assessment
5. Decision log entries

### Step 7: Present Plan

```
╔══════════════════════════════════════════════════════════════╗
║                    RELEASE PLAN COMPLETE                     ║
╠══════════════════════════════════════════════════════════════╣

  RELEASE: [Version]
  GOAL: [Goal statement]

  SUMMARY
  ───────
  • [X] P1 tasks (must complete)
  • [X] P2 tasks (should complete)
  • [X] P3 tasks (nice to have)

  KEY GATES
  ─────────
  □ [Gate 1]
  □ [Gate 2]
  □ [Gate 3]

  TOP RISKS
  ─────────
  ⚠️ [Primary risk and mitigation]

  NEXT STEPS
  ──────────
  1. /start - Begin first P1 task
  2. Run gate checks as you progress
  3. Update PLANNING.md as things change

  FILES UPDATED
  ─────────────
  ✅ .claude/PLANNING.md

╚══════════════════════════════════════════════════════════════╝
```

## Release-Specific Considerations

### MVP Release
- Focus: Demo reliability over features
- Key stakeholder: LAUSD
- Success metric: Smooth 15-minute demo

### v1.0 Release
- Focus: Production readiness
- Key requirement: Real database, security
- Success metric: Pilot deployment

### v1.1+ Releases
- Focus: Scale and features
- Key requirement: Multi-tenancy
- Success metric: Multiple districts

---

**Usage**: `/plan-release`
**Related**: `/dashboard` for status, `/strategic-check` for new ideas
