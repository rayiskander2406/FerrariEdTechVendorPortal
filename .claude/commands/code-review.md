---
name: code-review
description: Structured code review following project standards
---

# Code Review - Quality Check

You are performing a structured code review for the SchoolDay Vendor Portal.

## Instructions

### Step 1: Identify Scope

```
╔══════════════════════════════════════════════════════════════╗
║                    CODE REVIEW                               ║
╠══════════════════════════════════════════════════════════════╣
║                                                               ║
║  What would you like to review?                              ║
║  ─────────────────────────────────────────────────────────── ║
║                                                               ║
║  1. RECENT   - Changes since last commit                     ║
║  2. FILE     - Specific file or component                    ║
║  3. FEATURE  - All files related to a feature                ║
║  4. PR       - Prepare for pull request                      ║
║  5. AI TOOLS - Review AI tool implementations                ║
║                                                               ║
║  Choose option (1-5) or specify file path:                   ║
║                                                               ║
╚══════════════════════════════════════════════════════════════╝
```

### Step 2: Review Against Criteria

Review each area and provide findings:

```
╔══════════════════════════════════════════════════════════════╗
║                    REVIEW CHECKLIST                          ║
╠══════════════════════════════════════════════════════════════╣

  FILES REVIEWED
  ──────────────
  • [file1.ts]
  • [file2.tsx]

  ═══════════════════════════════════════════════════════════

  1. PRIVACY & SECURITY [Critical]
  ────────────────────────────────
  □ No PII sent directly to Claude API
  □ Tokenization applied before API calls
  □ No secrets or API keys in code
  □ Input validation present
  □ No XSS vulnerabilities
  □ Rate limiting considerations

  Findings:
  [✅ Pass / ⚠️ Warning / ❌ Issue]
  [Details of any issues found]

  ═══════════════════════════════════════════════════════════

  2. TYPE SAFETY [High]
  ─────────────────────
  □ TypeScript types properly defined
  □ No `any` types without justification
  □ Props interfaces defined for components
  □ API response types defined
  □ Null/undefined handled properly

  Findings:
  [✅ Pass / ⚠️ Warning / ❌ Issue]
  [Details of any issues found]

  ═══════════════════════════════════════════════════════════

  3. REACT PATTERNS [Medium]
  ──────────────────────────
  □ Hooks used correctly
  □ useEffect dependencies correct
  □ No unnecessary re-renders
  □ Keys provided for lists
  □ Error boundaries where needed

  Findings:
  [✅ Pass / ⚠️ Warning / ❌ Issue]
  [Details of any issues found]

  ═══════════════════════════════════════════════════════════

  4. API INTEGRATION [High]
  ─────────────────────────
  □ Error handling for API calls
  □ Loading states implemented
  □ Streaming responses handled
  □ Timeout handling
  □ Retry logic where appropriate

  Findings:
  [✅ Pass / ⚠️ Warning / ❌ Issue]
  [Details of any issues found]

  ═══════════════════════════════════════════════════════════

  5. CODE QUALITY [Medium]
  ────────────────────────
  □ Functions are focused and small
  □ Naming is clear and consistent
  □ No dead code
  □ No console.logs in production code
  □ Comments where logic is complex

  Findings:
  [✅ Pass / ⚠️ Warning / ❌ Issue]
  [Details of any issues found]

  ═══════════════════════════════════════════════════════════

  6. DEMO COMPATIBILITY [For MVP]
  ────────────────────────────────
  □ Demo mode supported
  □ Keyboard shortcuts work
  □ Form triggers ([FORM:*]) work
  □ Graceful degradation

  Findings:
  [✅ Pass / ⚠️ Warning / ❌ Issue]
  [Details of any issues found]

╚══════════════════════════════════════════════════════════════╝
```

### Step 3: Summarize Findings

```
╔══════════════════════════════════════════════════════════════╗
║                    REVIEW SUMMARY                            ║
╠══════════════════════════════════════════════════════════════╣

  OVERALL: [✅ Approved / ⚠️ Approved with Notes / ❌ Changes Needed]

  STATS
  ─────
  Files reviewed:  [X]
  Issues found:    [X] (Critical: [X], High: [X], Medium: [X])
  Suggestions:     [X]

  CRITICAL ISSUES (Must Fix)
  ──────────────────────────
  [List any critical issues that must be fixed]

  HIGH PRIORITY ISSUES
  ────────────────────
  [List high priority issues]

  SUGGESTIONS (Optional)
  ──────────────────────
  [List optional improvements]

  PRAISE (What's Good)
  ────────────────────
  [Highlight well-done aspects]

╚══════════════════════════════════════════════════════════════╝
```

### Step 4: Provide Fixes

For each issue found, provide:
1. Location (file:line)
2. Current code
3. Suggested fix
4. Explanation

```
  ISSUE #1: [Title]
  ─────────────────
  Location: [file:line]
  Severity: [Critical/High/Medium/Low]

  Current:
  ```typescript
  [current code]
  ```

  Suggested:
  ```typescript
  [fixed code]
  ```

  Explanation:
  [Why this change is needed]
```

## AI Tool-Specific Review

When reviewing AI tools (`/lib/ai-tools/`):

```
  AI TOOL REVIEW: [tool_name]
  ───────────────────────────

  STRUCTURE
  □ Tool definition follows schema
  □ Description is clear
  □ Input parameters defined
  □ Required fields specified

  IMPLEMENTATION
  □ Handler function exists
  □ Input validation present
  □ Error handling complete
  □ Response format correct

  PRIVACY
  □ No PII in prompts
  □ Tokenization where needed
  □ Output sanitization

  TESTING
  □ KAT vectors if applicable
  □ Edge cases covered
```

---

**Usage**: `/code-review` or `/code-review [file]`
**Related**: `/security-audit` for security focus, `/release-checklist` before release
