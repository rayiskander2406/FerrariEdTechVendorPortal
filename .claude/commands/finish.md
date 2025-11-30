---
name: finish
description: Mark current task as complete and update all tracking files
---

# Finish - Complete Current Task

You are helping the developer properly complete and document their current task.

## Instructions

### Step 1: Identify Current Task

Read `.claude/TODO.md` to find the task marked as 🚧 In Progress.

If no task is in progress:
```
╔══════════════════════════════════════════════════════════════╗
║                    NO ACTIVE TASK                            ║
╠══════════════════════════════════════════════════════════════╣

  No task is currently marked as in progress.

  Options:
  • /start - Begin a new task
  • /dashboard - Check project status

╚══════════════════════════════════════════════════════════════╝
```

### Step 2: Verify Completion

```
╔══════════════════════════════════════════════════════════════╗
║                    COMPLETING TASK                           ║
╠══════════════════════════════════════════════════════════════╣

  TASK: [Task ID] - [Task description]

  ACCEPTANCE CRITERIA
  ───────────────────
  [✅/❌] Criterion 1
  [✅/❌] Criterion 2
  [✅/❌] Criterion 3

  VERIFICATION CHECKS
  ───────────────────
  [✅/❌] Code changes tested
  [✅/❌] No regressions introduced
  [✅/❌] Documentation updated (if needed)

╚══════════════════════════════════════════════════════════════╝
```

### Step 3: Gather Completion Details

Ask the developer:
1. What was accomplished?
2. Any key learnings or decisions?
3. Any follow-up tasks needed?
4. Time spent (optional)?

### Step 4: Update Tracking Files

#### Update TODO.md
- Change task status from 🚧 to ✅ Complete
- Add any new follow-up tasks discovered

#### Update COMPLETED.md
Add entry:
```markdown
### [Date] - [Task Title]

**Task ID**: [ID]

**Completed:**
- [x] What was done
- [x] Additional accomplishments

**Key Learnings:**
- What was learned

**Artifacts:**
- Files created/modified

**Time Spent**: [If provided]

**Follow-up**: [Any new tasks created]
```

### Step 5: Present Summary

```
╔══════════════════════════════════════════════════════════════╗
║                    TASK COMPLETED ✅                         ║
╠══════════════════════════════════════════════════════════════╣

  COMPLETED
  ─────────
  [Task ID]: [Task description]

  SUMMARY
  ───────
  [Brief description of what was accomplished]

  FILES UPDATED
  ─────────────
  ✅ TODO.md - Task marked complete
  ✅ COMPLETED.md - Entry added

  SPRINT PROGRESS
  ───────────────
  [X] / [Y] tasks complete
  [Progress bar visualization]

  NEXT RECOMMENDED TASK
  ─────────────────────
  [Next highest priority task]

  QUICK ACTIONS
  ─────────────
  /start      - Begin next task
  /dashboard  - Check overall status

╚══════════════════════════════════════════════════════════════╝
```

## Task-Specific Completion

### For AI Tool Tasks
After completing MVP-01 (AI tools verification):
```
  AI TOOLS STATUS
  ───────────────
  All 12 tools verified: ✅

  Consider running /privacy-check next to verify
  no PII is leaking through AI responses.
```

### For Privacy Tasks
After completing MVP-02 (Privacy audit):
```
  PRIVACY STATUS
  ──────────────
  PII leakage check: ✅ None found

  Consider running /run-demo to test full
  workflows with privacy in mind.
```

### For Demo Tasks
After completing MVP-03 (Demo workflows):
```
  DEMO STATUS
  ───────────
  All 4 workflows tested: ✅

  MVP may be ready for stakeholder review.
  Run /dashboard to check all gates.
```

## Partial Completion

If task isn't fully complete:
```
╔══════════════════════════════════════════════════════════════╗
║                    TASK INCOMPLETE                           ║
╠══════════════════════════════════════════════════════════════╣

  Some acceptance criteria not met:

  ❌ [Failing criterion]

  Options:
  1. Continue working on this task
  2. Mark as partially complete and create follow-up
  3. Mark as blocked and document blocker

  Choose option:

╚══════════════════════════════════════════════════════════════╝
```

---

**Usage**: `/finish`
**Related**: `/start` for next task, `/dashboard` for status
