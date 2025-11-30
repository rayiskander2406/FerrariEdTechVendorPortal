---
name: retrospective
description: Sprint reflection and improvement capture
---

# Retrospective - Sprint Reflection

You are facilitating a retrospective for the SchoolDay Vendor Portal team.

## Purpose

Capture learnings, celebrate wins, and identify improvements after a sprint or milestone.

## Instructions

### Step 1: Set Context

Read these files to understand what was accomplished:
- `.claude/COMPLETED.md` - Recent completions
- `.claude/TODO.md` - What was planned
- `.claude/PLANNING.md` - Original goals

```
╔══════════════════════════════════════════════════════════════╗
║                    RETROSPECTIVE                             ║
╠══════════════════════════════════════════════════════════════╣
║                                                               ║
║  WHAT ARE WE REFLECTING ON?                                  ║
║  ─────────────────────────────────────────────────────────── ║
║                                                               ║
║  1. SPRINT    - Current sprint work                          ║
║  2. MILESTONE - MVP or version release                       ║
║  3. FEATURE   - Specific feature implementation              ║
║  4. INCIDENT  - Post-incident review                         ║
║                                                               ║
║  Choose type (1-4):                                          ║
║                                                               ║
╚══════════════════════════════════════════════════════════════╝
```

### Step 2: Gather Data

```
╔══════════════════════════════════════════════════════════════╗
║                    SPRINT SUMMARY                            ║
╠══════════════════════════════════════════════════════════════╣

  PERIOD: [Start date] to [End date]
  GOAL: [What we set out to do]

  PLANNED VS COMPLETED
  ────────────────────
  Planned tasks: [X]
  Completed:     [X] ([%])
  Carried over:  [X]
  Added mid-sprint: [X]

  KEY ACCOMPLISHMENTS
  ───────────────────
  ✅ [Accomplishment 1]
  ✅ [Accomplishment 2]
  ✅ [Accomplishment 3]

  INCOMPLETE ITEMS
  ────────────────
  ⏳ [Item 1] - Reason: [Why]
  ⏳ [Item 2] - Reason: [Why]

╚══════════════════════════════════════════════════════════════╝
```

### Step 3: Reflect

Facilitate reflection in three areas:

```
╔══════════════════════════════════════════════════════════════╗
║                    REFLECTION                                ║
╠══════════════════════════════════════════════════════════════╣

  🟢 WHAT WENT WELL
  ─────────────────
  What should we keep doing?

  • [Thing 1]
  • [Thing 2]
  • [Thing 3]

  ═══════════════════════════════════════════════════════════

  🔴 WHAT DIDN'T GO WELL
  ──────────────────────
  What should we stop doing or change?

  • [Thing 1]
  • [Thing 2]
  • [Thing 3]

  ═══════════════════════════════════════════════════════════

  🟡 WHAT WE LEARNED
  ──────────────────
  New insights or knowledge gained?

  • [Learning 1]
  • [Learning 2]
  • [Learning 3]

  ═══════════════════════════════════════════════════════════

  💡 IDEAS FOR IMPROVEMENT
  ────────────────────────
  What could we try differently?

  • [Idea 1]
  • [Idea 2]
  • [Idea 3]

╚══════════════════════════════════════════════════════════════╝
```

### Step 4: Action Items

```
╔══════════════════════════════════════════════════════════════╗
║                    ACTION ITEMS                              ║
╠══════════════════════════════════════════════════════════════╣

  Based on this retrospective, here are concrete actions:

  PROCESS IMPROVEMENTS
  ────────────────────
  □ [Action 1] - Owner: [Who]
  □ [Action 2] - Owner: [Who]

  TECHNICAL IMPROVEMENTS
  ──────────────────────
  □ [Action 1] - Add to backlog
  □ [Action 2] - Add to backlog

  DOCUMENTATION UPDATES
  ─────────────────────
  □ [What to document]

  TOOLING/WORKFLOW
  ────────────────
  □ [Tool or workflow change]

╚══════════════════════════════════════════════════════════════╝
```

### Step 5: Document

Save retrospective to COMPLETED.md:

```markdown
---

## Retrospective: [Sprint/Milestone Name]
**Date**: [Date]
**Period**: [Start] to [End]

### Summary
[Brief summary of the period]

### What Went Well
- [Item 1]
- [Item 2]

### What Didn't Go Well
- [Item 1]
- [Item 2]

### Key Learnings
- [Learning 1]
- [Learning 2]

### Action Items
- [ ] [Action 1]
- [ ] [Action 2]

---
```

### Step 6: Close

```
╔══════════════════════════════════════════════════════════════╗
║                    RETROSPECTIVE COMPLETE                    ║
╠══════════════════════════════════════════════════════════════╣

  SUMMARY
  ───────
  Period reviewed: [Sprint/Milestone]
  Items discussed: [X]
  Action items created: [X]

  KEY TAKEAWAY
  ────────────
  [One sentence summary of main insight]

  FILES UPDATED
  ─────────────
  ✅ COMPLETED.md - Retrospective recorded

  NEXT STEPS
  ──────────
  • Action items added to TODO.md (if applicable)
  • Start fresh with /start for next sprint

  Thank you for taking time to reflect!

╚══════════════════════════════════════════════════════════════╝
```

## Retrospective Prompts

If stuck, use these prompts:

### For "What Went Well"
- What are you proud of from this sprint?
- What would you do the same way again?
- What tools or practices helped the most?

### For "What Didn't Go Well"
- What frustrated you this sprint?
- Where did you get stuck?
- What took longer than expected?

### For "Learnings"
- What do you know now that you didn't before?
- What surprised you?
- What would you tell past-you?

### For "Improvements"
- If you could change one thing, what would it be?
- What experiment would you try?
- What's one small change with big impact?

---

**Usage**: `/retrospective`
**Related**: `/dashboard` for status, `/plan-release` for next sprint
