---
name: dashboard
description: Quick project status check - no interaction, just information
---

# Dashboard - SchoolDay Vendor Portal Status

You are showing a quick status dashboard for the SchoolDay Vendor Portal project.

## Instructions

Read the following files and present a concise dashboard:

1. `.claude/TODO.md` - Current tasks and sprint status
2. `.claude/PLANNING.md` - Release progress and gates
3. `.claude/COMPLETED.md` - Recent completions

## Dashboard Format

```
╔══════════════════════════════════════════════════════════════╗
║           SCHOOLDAY VENDOR PORTAL - DASHBOARD                ║
╠══════════════════════════════════════════════════════════════╣

  RELEASE STATUS
  ──────────────
  Current: [MVP / v1.0 / v1.1]
  Status:  [🟢 On Track / 🟡 At Risk / 🔴 Blocked]
  Focus:   [Current sprint goal]

  GO/NO-GO GATES
  ──────────────
  [✅/🔄/❌] Correctness - All 12 AI tools working
  [✅/🔄/❌] Privacy     - Zero PII leakage
  [✅/🔄/❌] Demo Ready  - All 4 workflows complete
  [✅/🔄/❌] Performance - Response time < 3s

  CURRENT SPRINT
  ──────────────
  [Sprint name and goal]

  Tasks:
  • [🔄/📋] Task 1 (P1)
  • [🔄/📋] Task 2 (P1)
  • [🔄/📋] Task 3 (P2)

  FEATURE FLAGS
  ─────────────
  Enabled:  [X] / 10
  • [List enabled flags]

  RECENT COMPLETIONS
  ──────────────────
  ✅ [Date] - [Task]
  ✅ [Date] - [Task]

  BLOCKERS
  ────────
  [None / List blockers]

  QUICK ACTIONS
  ─────────────
  /start       - Begin next task
  /run-demo    - Launch demo mode
  /test-ai-tools - Verify AI tools

╚══════════════════════════════════════════════════════════════╝
```

## Health Indicators

Use these symbols:
- 🟢 Green: On track, no issues
- 🟡 Yellow: Minor concerns, needs attention
- 🔴 Red: Blocked or critical issues
- ✅ Complete
- 🔄 In Progress
- 📋 Planned
- ⏸️ Paused
- ⏳ Blocked

## AI Tools Status

If recent test results available, show:
```
  AI TOOLS HEALTH
  ───────────────
  Working: [X] / 12
  Last tested: [Date/Time]
```

## Notes

- Keep the dashboard concise - this is a quick check, not a deep dive
- Highlight anything requiring immediate attention
- Suggest the most relevant next action based on status

---

**Usage**: `/dashboard`
**Related**: `/start` to begin work, `/finish` to complete tasks
