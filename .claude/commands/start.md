---
name: start
description: Start your daily work session - shows status and recommends next task
---

# Start - Begin Work Session

You are helping the developer start a productive work session on the SchoolDay Vendor Portal.

## Instructions

### Step 1: Load Context

Read these files to understand current state:
- `.claude/TODO.md` - Current tasks
- `.claude/PLANNING.md` - Release context
- `.claude/COMPLETED.md` - Recent work
- `CLAUDE.md` - Project guidelines

### Step 2: Identify Next Task

Determine the highest priority actionable task:

1. **Check for blockers first** - Any blocked tasks that can now proceed?
2. **Current sprint P1 tasks** - Must-do items for MVP
3. **Current sprint P2 tasks** - Should-do items
4. **Backlog items** - If sprint is clear

### Step 3: Present Task

```
╔══════════════════════════════════════════════════════════════╗
║                    READY TO START                            ║
╠══════════════════════════════════════════════════════════════╣

  CURRENT STATUS
  ──────────────
  Release: [MVP / v1.0]
  Sprint:  [Sprint name]
  Progress: [X] / [Y] tasks complete

  RECOMMENDED TASK
  ────────────────
  Task ID:  [MVP-XX / B-XX]
  Title:    [Task description]
  Priority: [P1 / P2 / P3]
  Effort:   [S / M / L]

  WHY THIS TASK
  ─────────────
  [Brief explanation of why this is the right next task]

  CONTEXT
  ───────
  [Relevant background information]
  [Related files or code areas]
  [Any dependencies or prerequisites]

  ACCEPTANCE CRITERIA
  ───────────────────
  □ [Criterion 1]
  □ [Criterion 2]
  □ [Criterion 3]

  SUGGESTED APPROACH
  ──────────────────
  1. [First step]
  2. [Second step]
  3. [Third step]

╚══════════════════════════════════════════════════════════════╝
```

### Step 4: Confirm and Begin

Ask the developer:
```
Ready to start [Task ID]? (yes/different task/show options)
```

If confirmed:
1. Update TODO.md to mark task as 🚧 In Progress
2. Provide detailed guidance for the task
3. Suggest relevant commands (e.g., `/test-ai-tools` for MVP-01)

## Task-Specific Guidance

### For AI Tool Tasks (MVP-01, MVP-04, MVP-05)
```
  RELEVANT FILES
  ──────────────
  • /lib/ai-tools/ - Tool definitions
  • /app/api/chat/ - API endpoint
  • /lib/claude.ts  - Claude integration

  TESTING
  ───────
  Run: /test-ai-tools
  Or manually test each tool in demo mode
```

### For Privacy Tasks (MVP-02)
```
  RELEVANT FILES
  ──────────────
  • /lib/tokenizer/ - PII tokenization
  • /lib/privacy/   - Privacy utilities

  TESTING
  ───────
  Run: /privacy-check
  Review Claude API payloads
```

### For Demo Tasks (MVP-03)
```
  RELEVANT FILES
  ──────────────
  • /app/demo/     - Demo pages
  • /lib/workflows/ - Demo workflows

  TESTING
  ───────
  Run: /run-demo
  Test all 4 scenarios end-to-end
```

## Alternative Options

If developer wants different task:
```
  AVAILABLE TASKS
  ───────────────

  CURRENT SPRINT (MVP Refinement)
  • [MVP-01] Verify all 12 AI tools work reliably (P1)
  • [MVP-02] Privacy audit - no PII leaks (P1)
  • [MVP-03] Test all 4 demo workflows (P1)
  • [MVP-04] Fix streaming response issues (P2)
  • [MVP-05] Ensure form triggers work (P2)

  BACKLOG (High Priority)
  • [B-01] PostgreSQL support (P1, Large)
  • [B-02] Rate limiting (P1, Medium)
  • [B-03] Error boundary (P1, Small)
  • [B-04] CI/CD pipeline (P1, Medium)

  Choose task ID or describe what you'd like to work on:
```

---

**Usage**: `/start`
**Related**: `/dashboard` for quick status, `/finish` when done
