---
name: test-ai-tools
description: Verify all 12 AI tools work reliably
---

# Test AI Tools - Tool Verification

You are testing all 12 AI tools in the SchoolDay Vendor Portal to ensure they work correctly.

## Purpose

Before any demo or release, verify:
1. All tools respond correctly
2. Response format is valid
3. Streaming works properly
4. Error handling is graceful

## Instructions

### Step 1: Identify Tools

First, examine the AI tools in the codebase:

```bash
# Find tool definitions
ls lib/ai-tools/
```

The 12 AI tools should include tools for:
- Vendor assessment
- Compliance checking
- Integration planning
- Risk analysis
- And more...

### Step 2: Test Interface

```
╔══════════════════════════════════════════════════════════════╗
║                    AI TOOL TESTING                           ║
╠══════════════════════════════════════════════════════════════╣
║                                                               ║
║  TEST MODE                                                   ║
║  ─────────────────────────────────────────────────────────── ║
║                                                               ║
║  1. ALL      - Test all 12 tools automatically               ║
║  2. SINGLE   - Test one specific tool                        ║
║  3. CATEGORY - Test tools by category                        ║
║  4. FAILING  - Re-test previously failed tools               ║
║                                                               ║
║  Choose mode (1-4):                                          ║
║                                                               ║
╚══════════════════════════════════════════════════════════════╝
```

### Step 3: Execute Tests

For each tool, test:

```
╔══════════════════════════════════════════════════════════════╗
║                    TESTING IN PROGRESS                       ║
╠══════════════════════════════════════════════════════════════╣

  [████████████░░░░░░░░░░░░░░░░░░] 4/12

  CURRENT TOOL: [tool_name]
  ──────────────────────────

  Checks:
  [✅/🔄/❌] Tool definition valid
  [✅/🔄/❌] Can be invoked
  [✅/🔄/❌] Returns valid response
  [✅/🔄/❌] Response format correct
  [✅/🔄/❌] Handles edge cases

  RESPONSE PREVIEW
  ────────────────
  [First 200 chars of response...]

╚══════════════════════════════════════════════════════════════╝
```

### Step 4: Test Criteria

For each tool, verify:

```
╔══════════════════════════════════════════════════════════════╗
║                    TEST CRITERIA                             ║
╠══════════════════════════════════════════════════════════════╣

  DEFINITION CHECK
  ────────────────
  □ Name is defined
  □ Description is clear
  □ Input schema is valid
  □ Required fields specified
  □ Handler function exists

  INVOCATION CHECK
  ────────────────
  □ Tool can be called via API
  □ Parameters parsed correctly
  □ No runtime errors
  □ Response within timeout (10s)

  RESPONSE CHECK
  ──────────────
  □ Response is valid JSON
  □ Expected fields present
  □ No unexpected errors
  □ Formatting is correct

  EDGE CASES
  ──────────
  □ Empty input handled
  □ Invalid input handled
  □ Long input handled
  □ Special characters handled

╚══════════════════════════════════════════════════════════════╝
```

### Step 5: Present Results

```
╔══════════════════════════════════════════════════════════════╗
║                    AI TOOL TEST RESULTS                      ║
╠══════════════════════════════════════════════════════════════╣

  SUMMARY
  ───────
  Total tools:  12
  Passed:       [X] ✅
  Failed:       [X] ❌
  Warnings:     [X] ⚠️

  OVERALL: [✅ ALL PASSING / ⚠️ SOME ISSUES / ❌ CRITICAL FAILURES]

  ═══════════════════════════════════════════════════════════

  DETAILED RESULTS
  ────────────────

  VENDOR ASSESSMENT TOOLS
  • [tool_1]: ✅ Passed (avg response: Xms)
  • [tool_2]: ✅ Passed (avg response: Xms)
  • [tool_3]: ❌ Failed - [error message]

  COMPLIANCE TOOLS
  • [tool_4]: ✅ Passed
  • [tool_5]: ⚠️ Warning - slow response (Xms)

  INTEGRATION TOOLS
  • [tool_6]: ✅ Passed
  • [tool_7]: ✅ Passed

  RISK ANALYSIS TOOLS
  • [tool_8]: ✅ Passed
  • [tool_9]: ✅ Passed

  OTHER TOOLS
  • [tool_10]: ✅ Passed
  • [tool_11]: ✅ Passed
  • [tool_12]: ✅ Passed

  ═══════════════════════════════════════════════════════════

  PERFORMANCE METRICS
  ───────────────────
  Avg response time: [X]ms
  Slowest tool: [name] ([X]ms)
  Fastest tool: [name] ([X]ms)

╚══════════════════════════════════════════════════════════════╝
```

### Step 6: Handle Failures

If any tool fails:

```
╔══════════════════════════════════════════════════════════════╗
║                    FAILURE DETAILS                           ║
╠══════════════════════════════════════════════════════════════╣

  FAILED TOOL: [tool_name]
  ─────────────────────────

  ERROR TYPE: [Definition / Invocation / Response / Edge Case]

  ERROR MESSAGE:
  [Full error message]

  STACK TRACE:
  [Relevant stack trace]

  LIKELY CAUSE:
  [Analysis of what might be wrong]

  SUGGESTED FIX:
  [Step-by-step fix]

  FILES TO CHECK:
  • lib/ai-tools/[tool_name].ts
  • app/api/chat/route.ts

╚══════════════════════════════════════════════════════════════╝
```

## Manual Testing

If automated testing isn't available:

1. Start dev server: `npm run dev`
2. Open http://localhost:3000
3. For each tool:
   - Trigger the tool via chat
   - Verify response makes sense
   - Check browser console for errors
   - Note response time

## Quick Commands

```bash
# Start dev server for manual testing
npm run dev

# Check tool definitions exist
ls -la lib/ai-tools/

# Check for TypeScript errors in tools
npx tsc --noEmit lib/ai-tools/**/*.ts
```

---

**Usage**: `/test-ai-tools`
**Related**: `/api-test` for API testing, `/release-checklist` before release
