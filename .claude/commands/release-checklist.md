---
name: release-checklist
description: Pre-release verification gate before deployment
---

# Release Checklist - Final Verification Gate

You are performing the final verification before a release of the SchoolDay Vendor Portal.

## Purpose

This is the last gate before release. Every item must pass or have documented exceptions.

## Instructions

### Step 1: Identify Release

```
╔══════════════════════════════════════════════════════════════╗
║                    RELEASE CHECKLIST                         ║
╠══════════════════════════════════════════════════════════════╣
║                                                               ║
║  RELEASE VERSION: [MVP / v1.0 / v1.1 / etc.]                 ║
║                                                               ║
║  Release type:                                               ║
║  1. MVP     - Demo to stakeholders                           ║
║  2. PATCH   - Bug fixes only                                 ║
║  3. MINOR   - New features, backward compatible              ║
║  4. MAJOR   - Breaking changes                               ║
║                                                               ║
╚══════════════════════════════════════════════════════════════╝
```

### Step 2: Execute Checklist

```
╔══════════════════════════════════════════════════════════════╗
║                    RELEASE VERIFICATION                      ║
╠══════════════════════════════════════════════════════════════╣

  RELEASE: [Version]
  DATE: [Today's date]
  VERIFIED BY: [Developer]

  ═══════════════════════════════════════════════════════════

  1. BUILD & LINT [Required]
  ──────────────────────────
  Run: npm run build && npm run lint

  □ Build completes without errors
  □ No TypeScript errors
  □ No lint errors
  □ No warnings (or documented exceptions)

  Status: [✅ Pass / ❌ Fail]
  Notes: [Any observations]

  ═══════════════════════════════════════════════════════════

  2. AI TOOLS [Required for MVP]
  ──────────────────────────────
  Run: /test-ai-tools

  □ All 12 AI tools respond correctly
  □ Response format is valid JSON
  □ Streaming works properly
  □ Error handling is graceful

  Status: [✅ Pass / ❌ Fail]
  Tools tested: [X] / 12
  Notes: [Any observations]

  ═══════════════════════════════════════════════════════════

  3. PRIVACY [Critical]
  ─────────────────────
  Run: /privacy-check

  □ No PII in Claude API requests
  □ Tokenization working correctly
  □ Detokenization working correctly
  □ No PII in console logs
  □ No PII in error messages

  Status: [✅ Pass / ❌ Fail]
  PII issues found: [Count]
  Notes: [Any observations]

  ═══════════════════════════════════════════════════════════

  4. DEMO WORKFLOWS [Required for MVP]
  ────────────────────────────────────
  Run: /run-demo

  □ Workflow 1: New vendor evaluation - Works
  □ Workflow 2: Compliance review - Works
  □ Workflow 3: Integration planning - Works
  □ Workflow 4: Risk assessment - Works
  □ Keyboard shortcuts work
  □ Demo mode toggles correctly
  □ Form triggers ([FORM:*]) work

  Status: [✅ Pass / ❌ Fail]
  Workflows tested: [X] / 4
  Notes: [Any observations]

  ═══════════════════════════════════════════════════════════

  5. SECURITY [Required]
  ──────────────────────
  Run: /security-audit

  □ No critical vulnerabilities
  □ No high vulnerabilities (or documented)
  □ Dependencies up to date
  □ No secrets in code
  □ API keys properly managed

  Status: [✅ Pass / ❌ Fail]
  npm audit: [X] vulnerabilities
  Notes: [Any observations]

  ═══════════════════════════════════════════════════════════

  6. PERFORMANCE [Required]
  ─────────────────────────
  Test manually in browser

  □ Initial page load < 3 seconds
  □ Chat response start < 2 seconds
  □ No memory leaks observed
  □ Mobile responsiveness (if applicable)

  Status: [✅ Pass / ❌ Fail]
  Notes: [Any observations]

  ═══════════════════════════════════════════════════════════

  7. DOCUMENTATION [Recommended]
  ──────────────────────────────
  □ README is current
  □ CLAUDE.md is current
  □ API documentation current (if any)
  □ Feature flags documented

  Status: [✅ Pass / ⚠️ Partial / ❌ Fail]
  Notes: [Any observations]

  ═══════════════════════════════════════════════════════════

  8. VERSION CONTROL [Required]
  ─────────────────────────────
  □ All changes committed
  □ No uncommitted files
  □ Branch is up to date with main
  □ Merge conflicts resolved

  Status: [✅ Pass / ❌ Fail]
  Notes: [Any observations]

╚══════════════════════════════════════════════════════════════╝
```

### Step 3: Go/No-Go Decision

```
╔══════════════════════════════════════════════════════════════╗
║                    GO / NO-GO DECISION                       ║
╠══════════════════════════════════════════════════════════════╣

  SUMMARY
  ───────
  Total checks: [X]
  Passed:       [X] ✅
  Failed:       [X] ❌
  Warnings:     [X] ⚠️

  GATE STATUS
  ───────────
  Build & Lint:    [✅/❌]
  AI Tools:        [✅/❌]
  Privacy:         [✅/❌]
  Demo Workflows:  [✅/❌]
  Security:        [✅/❌]
  Performance:     [✅/❌]

  ═══════════════════════════════════════════════════════════

  DECISION: [🟢 GO / 🔴 NO-GO]

  [If GO]
  ───────
  All critical gates passed. Release is approved.

  Next steps:
  1. Tag release: git tag v[X.X.X]
  2. Deploy to Vercel (or target environment)
  3. Verify deployment
  4. Update COMPLETED.md
  5. Notify stakeholders

  [If NO-GO]
  ──────────
  Release blocked due to:
  • [Failing gate 1]
  • [Failing gate 2]

  Required actions before re-attempting:
  1. [Action 1]
  2. [Action 2]

  Re-run /release-checklist after fixing issues.

╚══════════════════════════════════════════════════════════════╝
```

### Step 4: Document Release

If GO decision:

```
  RELEASE RECORD
  ──────────────
  Version: [X.X.X]
  Date: [Date]
  Type: [MVP/Patch/Minor/Major]

  Changes included:
  • [Change 1]
  • [Change 2]

  Known issues:
  • [If any, with documented acceptance]

  Deployed to: [Environment]
  Verified by: [Developer]
```

Update `.claude/COMPLETED.md` with release record.

## Quick Commands Reference

```bash
# Build check
npm run build

# Lint check
npm run lint

# Security check
npm audit

# Start dev server for manual testing
npm run dev
```

---

**Usage**: `/release-checklist`
**Related**: `/test-ai-tools`, `/privacy-check`, `/security-audit`
