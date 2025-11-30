---
name: qa
description: Quick quality assurance check for current work
---

# QA - Quick Quality Assurance

You are performing a quick quality check on recent work in the SchoolDay Vendor Portal.

## Purpose

Fast verification that recent changes haven't broken anything critical.

## Instructions

### Step 1: Identify Changes

```bash
# Check recent changes
git status
git diff --stat HEAD~1
```

```
╔══════════════════════════════════════════════════════════════╗
║                    QUICK QA CHECK                            ║
╠══════════════════════════════════════════════════════════════╣

  RECENT CHANGES
  ──────────────
  Modified files:
  • [file1.ts]
  • [file2.tsx]

  Change summary:
  [Brief description of what changed]

╚══════════════════════════════════════════════════════════════╝
```

### Step 2: Run Quick Checks

```
╔══════════════════════════════════════════════════════════════╗
║                    QA CHECKLIST                              ║
╠══════════════════════════════════════════════════════════════╣

  BUILD CHECK
  ───────────
  Command: npm run build
  Result: [✅ Pass / ❌ Fail]

  LINT CHECK
  ──────────
  Command: npm run lint
  Result: [✅ Pass / ❌ Fail]

  TYPE CHECK
  ──────────
  Command: npx tsc --noEmit
  Result: [✅ Pass / ❌ Fail]

  MANUAL SMOKE TEST
  ─────────────────
  □ App loads without errors
  □ Modified features work
  □ No console errors in browser

  Result: [✅ Pass / ❌ Fail]

╚══════════════════════════════════════════════════════════════╝
```

### Step 3: Feature-Specific Checks

Based on what changed, run targeted checks:

#### If AI Tools Changed
```
  AI TOOL CHECK
  ─────────────
  Run: /test-ai-tools

  □ Modified tool works correctly
  □ Other tools unaffected
  □ Response format valid

  Result: [✅ Pass / ❌ Fail]
```

#### If Privacy Code Changed
```
  PRIVACY CHECK
  ─────────────
  Run: /privacy-check

  □ Tokenization still works
  □ No new PII exposure
  □ Detokenization works

  Result: [✅ Pass / ❌ Fail]
```

#### If Demo Code Changed
```
  DEMO CHECK
  ──────────
  Run: /run-demo (or manual test)

  □ Demo mode toggles
  □ Keyboard shortcuts work
  □ Workflows complete

  Result: [✅ Pass / ❌ Fail]
```

#### If API Code Changed
```
  API CHECK
  ─────────
  Run: /api-test

  □ Endpoint responds
  □ Error handling works
  □ Response format correct

  Result: [✅ Pass / ❌ Fail]
```

### Step 4: Present Results

```
╔══════════════════════════════════════════════════════════════╗
║                    QA RESULTS                                ║
╠══════════════════════════════════════════════════════════════╣

  OVERALL: [✅ PASSED / ❌ FAILED]

  CHECKS RUN
  ──────────
  ✅ Build
  ✅ Lint
  ✅ Type check
  ✅ Smoke test
  [✅/❌] Feature-specific checks

  [If PASSED]
  ───────────
  Changes look good. Ready to:
  • Continue development
  • Commit changes
  • Proceed to next task

  [If FAILED]
  ───────────
  Issues found:

  ISSUE #1: [Description]
  Location: [file:line]
  Fix: [Suggested fix]

  Run /qa again after fixing issues.

╚══════════════════════════════════════════════════════════════╝
```

## Quick Commands

```bash
# One-liner for basic checks
npm run build && npm run lint && echo "✅ Basic checks passed"

# Dev server for manual testing
npm run dev

# Type check only
npx tsc --noEmit
```

## When to Use

- After making changes, before committing
- After pulling changes from others
- Before running full /release-checklist
- When something feels "off"

---

**Usage**: `/qa`
**Related**: `/code-review` for thorough review, `/release-checklist` for releases
