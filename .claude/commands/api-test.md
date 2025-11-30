---
name: api-test
description: Test API endpoints for correctness and reliability
---

# API Test - Endpoint Verification

You are testing the API endpoints of the SchoolDay Vendor Portal.

## Purpose

Verify API endpoints work correctly:
1. Chat endpoint responds properly
2. Error handling is graceful
3. Response format is correct
4. Performance is acceptable

## Instructions

### Step 1: Identify Endpoints

```bash
# Find API routes
ls -la app/api/
```

Key endpoints:
- `/api/chat` - Main chat endpoint with Claude
- Other endpoints as discovered

### Step 2: Test Interface

```
╔══════════════════════════════════════════════════════════════╗
║                    API TESTING                               ║
╠══════════════════════════════════════════════════════════════╣
║                                                               ║
║  TEST MODE                                                   ║
║  ─────────────────────────────────────────────────────────── ║
║                                                               ║
║  1. ALL      - Test all API endpoints                        ║
║  2. CHAT     - Focus on /api/chat                            ║
║  3. HEALTH   - Basic health checks                           ║
║  4. STRESS   - Multiple concurrent requests                  ║
║                                                               ║
║  Choose mode (1-4):                                          ║
║                                                               ║
╚══════════════════════════════════════════════════════════════╝
```

### Step 3: Chat Endpoint Tests

```
╔══════════════════════════════════════════════════════════════╗
║                    /api/chat TESTS                           ║
╠══════════════════════════════════════════════════════════════╣

  BASIC FUNCTIONALITY
  ───────────────────
  □ POST /api/chat returns 200
  □ Response is valid JSON (or stream)
  □ Response contains expected fields
  □ Streaming works correctly

  INPUT HANDLING
  ──────────────
  □ Valid message accepted
  □ Empty message handled (400?)
  □ Very long message handled
  □ Special characters handled
  □ Unicode handled correctly

  TOOL INVOCATION
  ───────────────
  □ Tools can be triggered
  □ Tool responses formatted correctly
  □ Multiple tools in one request work
  □ Tool errors handled gracefully

  ERROR HANDLING
  ──────────────
  □ Invalid request returns 400
  □ Server error returns 500
  □ Errors don't leak sensitive info
  □ Error response format consistent

  PERFORMANCE
  ───────────
  □ Response starts within 2s
  □ Full response within 30s
  □ No memory leaks observed
  □ Concurrent requests handled

╚══════════════════════════════════════════════════════════════╝
```

### Step 4: Execute Tests

```
╔══════════════════════════════════════════════════════════════╗
║                    TEST EXECUTION                            ║
╠══════════════════════════════════════════════════════════════╣

  ENDPOINT: /api/chat

  TEST 1: Basic POST
  ──────────────────
  Request:
  ```json
  {
    "messages": [
      {"role": "user", "content": "Hello"}
    ]
  }
  ```

  Result: [✅ Pass / ❌ Fail]
  Status: [HTTP code]
  Response time: [X]ms
  Response preview: [First 100 chars...]

  ═══════════════════════════════════════════════════════════

  TEST 2: Tool Invocation
  ───────────────────────
  Request:
  ```json
  {
    "messages": [
      {"role": "user", "content": "Assess vendor XYZ for compliance"}
    ]
  }
  ```

  Result: [✅ Pass / ❌ Fail]
  Tool invoked: [tool_name]
  Response time: [X]ms

  ═══════════════════════════════════════════════════════════

  TEST 3: Empty Input
  ───────────────────
  Request:
  ```json
  {
    "messages": []
  }
  ```

  Expected: 400 Bad Request
  Actual: [HTTP code]
  Result: [✅ Pass / ❌ Fail]

  ═══════════════════════════════════════════════════════════

  TEST 4: Streaming
  ─────────────────
  Request with streaming enabled

  Result: [✅ Pass / ❌ Fail]
  Stream chunks received: [count]
  First chunk time: [X]ms
  Total time: [X]ms

╚══════════════════════════════════════════════════════════════╝
```

### Step 5: Present Results

```
╔══════════════════════════════════════════════════════════════╗
║                    API TEST RESULTS                          ║
╠══════════════════════════════════════════════════════════════╣

  SUMMARY
  ───────
  Endpoints tested: [X]
  Tests run: [X]
  Passed: [X] ✅
  Failed: [X] ❌

  OVERALL: [✅ ALL PASSING / ⚠️ SOME ISSUES / ❌ CRITICAL FAILURES]

  ═══════════════════════════════════════════════════════════

  ENDPOINT RESULTS
  ────────────────

  /api/chat
  • Basic POST:      [✅/❌]
  • Tool invocation: [✅/❌]
  • Error handling:  [✅/❌]
  • Streaming:       [✅/❌]
  • Performance:     [✅/❌]

  ═══════════════════════════════════════════════════════════

  PERFORMANCE METRICS
  ───────────────────
  Average response time: [X]ms
  P95 response time:     [X]ms
  Slowest request:       [X]ms

  ═══════════════════════════════════════════════════════════

  ISSUES FOUND
  ────────────
  [List any issues discovered]

╚══════════════════════════════════════════════════════════════╝
```

### Step 6: Handle Failures

```
╔══════════════════════════════════════════════════════════════╗
║                    FAILURE DETAILS                           ║
╠══════════════════════════════════════════════════════════════╣

  FAILED TEST: [Test name]
  ─────────────────────────

  Endpoint: [path]
  Method: [POST/GET/etc]

  REQUEST
  ───────
  ```json
  [Request body]
  ```

  EXPECTED
  ────────
  Status: [code]
  Body: [expected content]

  ACTUAL
  ──────
  Status: [code]
  Body: [actual content]

  ERROR
  ─────
  [Error message if any]

  SUGGESTED FIX
  ─────────────
  [Guidance on fixing the issue]

╚══════════════════════════════════════════════════════════════╝
```

## Manual Testing

Using curl:

```bash
# Basic test
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'

# Test with tool trigger
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Assess vendor compliance"}]}'

# Test streaming (if supported)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

## Automated Testing

If test files exist:

```bash
# Run API tests
npm test -- --grep "api"

# Run specific test file
npm test app/api/chat/route.test.ts
```

---

**Usage**: `/api-test`
**Related**: `/test-ai-tools` for tool testing, `/release-checklist` before release
