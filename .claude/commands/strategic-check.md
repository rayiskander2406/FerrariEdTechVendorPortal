---
name: strategic-check
description: Evaluate new ideas against roadmap before committing
---

# Strategic Check - Evaluate New Ideas

You are helping evaluate whether a new idea or feature should be pursued.

## Purpose

Before adding new work, evaluate:
1. Does this align with current release goals?
2. Is this the right time to do it?
3. What's the opportunity cost?
4. Should this be a moonshot (feature flag)?

## Instructions

### Step 1: Understand the Idea

```
╔══════════════════════════════════════════════════════════════╗
║                    STRATEGIC CHECK                           ║
╠══════════════════════════════════════════════════════════════╣
║                                                               ║
║  What idea or feature are you considering?                   ║
║                                                               ║
║  Please describe:                                            ║
║  • What is it?                                               ║
║  • Why is it valuable?                                       ║
║  • Who requested it? (you, stakeholder, user)                ║
║                                                               ║
╚══════════════════════════════════════════════════════════════╝
```

### Step 2: Load Context

Read:
- `.claude/PLANNING.md` - Current roadmap and release goals
- `.claude/TODO.md` - Current workload
- `CLAUDE.md` - Project principles

### Step 3: Evaluate Against Framework

```
╔══════════════════════════════════════════════════════════════╗
║                    EVALUATION                                ║
╠══════════════════════════════════════════════════════════════╣

  IDEA: [Description]

  ALIGNMENT CHECK
  ───────────────
  Current Release: [MVP / v1.0 / etc]
  Release Goal:    [Goal statement]

  Does this idea support the current release goal?
  [✅ Yes - directly supports / ⚠️ Partially / ❌ No]

  TIMING ANALYSIS
  ───────────────
  Current sprint tasks remaining: [X]
  This idea's estimated effort: [S/M/L]
  Impact on current commitments: [None/Minor/Major]

  OPPORTUNITY COST
  ────────────────
  If we do this, we delay: [What gets pushed]
  If we don't do this, we risk: [What we might miss]

  FEATURE FLAG CANDIDATE?
  ───────────────────────
  Could this be a moonshot feature flag?
  [✅ Yes - good candidate / ❌ No - core feature]

  If yes, potential flag name: [feature-name]

╚══════════════════════════════════════════════════════════════╝
```

### Step 4: Make Recommendation

```
╔══════════════════════════════════════════════════════════════╗
║                    RECOMMENDATION                            ║
╠══════════════════════════════════════════════════════════════╣

  VERDICT: [DO NOW / DEFER / MOONSHOT / DECLINE]

  [For DO NOW]
  ────────────
  This aligns with current goals. Recommended approach:
  • Add to current sprint as [P1/P2]
  • Estimated effort: [S/M/L]
  • Suggested task ID: [ID]

  [For DEFER]
  ───────────
  Good idea, but not the right time.
  • Add to backlog for [v1.0 / v1.1 / v2.0]
  • Priority: [P1/P2/P3]
  • Revisit when: [Trigger condition]

  [For MOONSHOT]
  ──────────────
  This is a moonshot feature. Recommended approach:
  • Create feature flag: [flag-name]
  • Add to /features for future enablement
  • Document in PLANNING.md v2.0 section

  [For DECLINE]
  ─────────────
  This doesn't align with project goals because:
  • [Reason 1]
  • [Reason 2]
  Alternative suggestion: [If any]

╚══════════════════════════════════════════════════════════════╝
```

### Step 5: Document Decision

If proceeding (DO NOW or DEFER), update:
- `TODO.md` - Add task with appropriate priority
- `PLANNING.md` - Add to decision log

```
  DECISION LOG ENTRY
  ──────────────────
  Date: [Today]
  Decision: [Brief description]
  Rationale: [Why this decision]
  Action: [What happens next]
```

## Quick Evaluation Matrix

| Question | Yes | No |
|----------|-----|-----|
| Supports current release? | +2 | -2 |
| Requested by stakeholder? | +1 | 0 |
| Small effort (< 1 day)? | +1 | -1 |
| Required for demo? | +3 | 0 |
| Privacy/security impact? | Must review | +1 |
| Can be feature-flagged? | 0 | -1 |

Score:
- 5+: DO NOW
- 2-4: DEFER (add to backlog)
- 0-1: MOONSHOT (feature flag)
- <0: DECLINE (doesn't fit)

## Current Feature Flags

The following moonshot features can be enabled via `/features`:

| Flag | Status | Description |
|------|--------|-------------|
| ai-health-monitor | Disabled | AI tool health monitoring |
| compliance-pipeline | Disabled | Automated compliance checks |
| synthetic-sandbox | **Enabled** | Synthetic data testing |
| vendor-marketplace | Disabled | Vendor discovery marketplace |
| predictive-onboarding | Disabled | AI-predicted onboarding |
| teacher-feedback | Disabled | Teacher feedback collection |
| multi-district | Disabled | Multi-tenant support |
| zero-touch-deploy | Disabled | Automated deployment |
| parent-transparency | Disabled | Parent-facing portal |
| impact-analytics | Disabled | Learning impact analytics |

---

**Usage**: `/strategic-check`
**Related**: `/plan-release` for roadmap, `/dashboard` for status
