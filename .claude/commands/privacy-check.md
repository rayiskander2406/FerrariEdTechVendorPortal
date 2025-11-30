---
name: privacy-check
description: Audit codebase for PII leaks - critical for K-12 compliance
---

# Privacy Check - PII Audit

You are auditing the SchoolDay Vendor Portal for potential PII leaks.

## Why This Is Critical

This portal handles K-12 student data protected by:
- **FERPA** (Family Educational Rights and Privacy Act)
- **COPPA** (Children's Online Privacy Protection Act)
- **State laws** (e.g., California SOPIPA)

**ANY PII sent to Claude API is a compliance violation.**

## Instructions

### Step 1: Define PII Patterns

```
╔══════════════════════════════════════════════════════════════╗
║                    PRIVACY CHECK                             ║
╠══════════════════════════════════════════════════════════════╣

  PII PATTERNS TO DETECT
  ──────────────────────

  STUDENT DATA (Critical)
  • Student names
  • Student IDs
  • Grade levels with identifiers
  • Attendance records
  • Academic performance

  CONTACT INFO (High)
  • Email addresses
  • Phone numbers
  • Physical addresses
  • Parent/guardian names

  INSTITUTIONAL (Medium)
  • School names (if identifiable)
  • Teacher names
  • Class/section identifiers

  TECHNICAL (Medium)
  • IP addresses
  • Session tokens in logs
  • User IDs without tokenization

╚══════════════════════════════════════════════════════════════╝
```

### Step 2: Scan Codebase

```
╔══════════════════════════════════════════════════════════════╗
║                    SCANNING                                  ║
╠══════════════════════════════════════════════════════════════╣

  SCANNING AREAS
  ──────────────

  [🔄] API Routes - /app/api/**
  [🔄] Claude Integration - /lib/claude.ts
  [🔄] AI Tools - /lib/ai-tools/**
  [🔄] Components - /components/**
  [🔄] Utilities - /lib/**
  [🔄] Test files - /**/*.test.*

  SPECIFIC CHECKS
  ───────────────

  1. CLAUDE API CALLS
     □ All messages tokenized before sending
     □ System prompts don't contain PII
     □ Tool inputs sanitized

  2. LOGGING
     □ Console.log doesn't include PII
     □ Error messages sanitized
     □ Debug output clean

  3. STATE/STORAGE
     □ localStorage doesn't store PII
     □ React state doesn't persist PII
     □ Cookies are clean

  4. NETWORK REQUESTS
     □ No PII in URLs
     □ No PII in query params
     □ Request bodies tokenized

╚══════════════════════════════════════════════════════════════╝
```

### Step 3: Review Tokenization

```
╔══════════════════════════════════════════════════════════════╗
║                    TOKENIZATION REVIEW                       ║
╠══════════════════════════════════════════════════════════════╣

  TOKENIZER LOCATION: lib/tokenizer/

  TOKEN PATTERNS
  ──────────────
  Check that these are being replaced:

  Pattern          │ Token Format        │ Status
  ─────────────────┼────────────────────┼─────────
  john@email.com   │ [EMAIL_TOKEN_1]    │ [✅/❌]
  John Smith       │ [NAME_TOKEN_1]     │ [✅/❌]
  (555) 123-4567   │ [PHONE_TOKEN_1]    │ [✅/❌]
  123-45-6789      │ [SSN_TOKEN_1]      │ [✅/❌]
  Student ID: 1234 │ [STUDENT_ID_1]     │ [✅/❌]

  DATA FLOW CHECK
  ───────────────

  INPUT
    ↓
  User types: "Check if John Smith can use Kahoot"
    ↓
  TOKENIZE
    ↓
  To Claude: "Check if [NAME_TOKEN_1] can use Kahoot"
    ↓
  RESPONSE
    ↓
  From Claude: "[NAME_TOKEN_1] can use Kahoot because..."
    ↓
  DETOKENIZE
    ↓
  To User: "John Smith can use Kahoot because..."

  Is this flow working correctly? [✅/❌]

╚══════════════════════════════════════════════════════════════╝
```

### Step 4: Present Findings

```
╔══════════════════════════════════════════════════════════════╗
║                    PRIVACY AUDIT RESULTS                     ║
╠══════════════════════════════════════════════════════════════╣

  OVERALL STATUS: [🟢 CLEAN / 🟡 CONCERNS / 🔴 VIOLATIONS]

  ═══════════════════════════════════════════════════════════

  CRITICAL FINDINGS (Must Fix)
  ────────────────────────────
  [List any PII being sent to Claude or external services]

  File: [path]
  Line: [number]
  Issue: [description]
  PII Type: [type]

  ═══════════════════════════════════════════════════════════

  HIGH PRIORITY FINDINGS
  ──────────────────────
  [List any potential PII exposure risks]

  ═══════════════════════════════════════════════════════════

  TOKENIZATION STATUS
  ───────────────────
  Tokenizer present: [✅/❌]
  Tokenizer used before API: [✅/❌]
  Detokenizer working: [✅/❌]
  Token mapping secure: [✅/❌]

  ═══════════════════════════════════════════════════════════

  LOGGING SAFETY
  ──────────────
  Console.log clean: [✅/❌]
  Error messages safe: [✅/❌]
  Debug mode handled: [✅/❌]

  ═══════════════════════════════════════════════════════════

  COMPLIANCE ASSESSMENT
  ─────────────────────
  FERPA: [Compliant / At Risk / Non-Compliant]
  COPPA: [Compliant / At Risk / Non-Compliant]

╚══════════════════════════════════════════════════════════════╝
```

### Step 5: Remediation

For each finding:

```
╔══════════════════════════════════════════════════════════════╗
║                    REMEDIATION                               ║
╠══════════════════════════════════════════════════════════════╣

  FINDING #1: [Title]
  ───────────────────
  Severity: Critical
  Location: [file:line]

  Current Code:
  ```typescript
  // PII being sent directly
  const response = await claude.messages.create({
    messages: [{ role: 'user', content: userInput }]
  });
  ```

  Fixed Code:
  ```typescript
  // Tokenize before sending
  const tokenizedInput = tokenize(userInput);
  const response = await claude.messages.create({
    messages: [{ role: 'user', content: tokenizedInput }]
  });
  ```

  Verification:
  After fixing, run /privacy-check again to confirm.

╚══════════════════════════════════════════════════════════════╝
```

## Quick Checks

```bash
# Search for potential email patterns in code
grep -r "@.*\.com\|@.*\.edu\|@.*\.org" --include="*.ts" --include="*.tsx" app/ lib/

# Search for console.log that might leak data
grep -r "console.log.*user\|console.log.*name\|console.log.*email" --include="*.ts" --include="*.tsx" .

# Check what's sent to Claude
grep -r "messages.create\|claude\|anthropic" --include="*.ts" -A 5 lib/
```

## Test Scenarios

Test with these PII patterns to verify tokenization:
- "Check vendor for student John Smith"
- "Email the teacher at teacher@school.edu"
- "Student ID 12345 needs access"
- "Call parent at (555) 123-4567"

---

**Usage**: `/privacy-check`
**Related**: `/security-audit` for full security, `/release-checklist` before release
