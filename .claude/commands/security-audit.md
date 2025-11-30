---
name: security-audit
description: Security-focused audit for privacy and vulnerability detection
---

# Security Audit - Privacy & Vulnerability Check

You are performing a security audit for the SchoolDay Vendor Portal with special focus on privacy (given the K-12 context).

## Why This Matters

This portal handles:
- Student data (protected by FERPA, COPPA)
- Vendor information
- District configurations
- AI interactions that could leak PII

**ANY PII leak to Claude is a compliance violation.**

## Instructions

### Step 1: Audit Scope

```
╔══════════════════════════════════════════════════════════════╗
║                    SECURITY AUDIT                            ║
╠══════════════════════════════════════════════════════════════╣
║                                                               ║
║  AUDIT TYPE                                                  ║
║  ─────────────────────────────────────────────────────────── ║
║                                                               ║
║  1. FULL       - Complete security review                    ║
║  2. PRIVACY    - Focus on PII and data handling              ║
║  3. API        - API security and authentication             ║
║  4. CLAUDE     - AI integration security                     ║
║  5. DEPS       - Dependency vulnerabilities                  ║
║                                                               ║
║  Choose audit type (1-5):                                    ║
║                                                               ║
╚══════════════════════════════════════════════════════════════╝
```

### Step 2: Execute Audit

#### Privacy Audit (Critical for K-12)

```
╔══════════════════════════════════════════════════════════════╗
║                    PRIVACY AUDIT                             ║
╠══════════════════════════════════════════════════════════════╣

  PII HANDLING
  ────────────
  Scanning for PII patterns in code...

  □ Student names not hardcoded
  □ Email addresses tokenized
  □ School names anonymized
  □ District identifiers protected
  □ No PII in logs
  □ No PII in error messages

  TOKENIZATION CHECK
  ──────────────────
  Files with Claude API calls:
  • [file1] - Tokenization: [✅/❌]
  • [file2] - Tokenization: [✅/❌]

  DATA FLOW ANALYSIS
  ──────────────────
  User Input → [Check] → Processing → [Check] → Claude API

  Checkpoints:
  1. Input received: [Sanitized?]
  2. Before storage: [Encrypted?]
  3. Before API call: [Tokenized?]
  4. API response: [Detokenized safely?]
  5. Displayed to user: [XSS protected?]

  CLAUDE API PAYLOADS
  ───────────────────
  Sample request inspection:

  ⚠️ CHECK: Are there any PII patterns in these?
  • Names: [Pattern search results]
  • Emails: [Pattern search results]
  • Phone numbers: [Pattern search results]
  • Addresses: [Pattern search results]
  • Student IDs: [Pattern search results]

╚══════════════════════════════════════════════════════════════╝
```

#### API Security Audit

```
╔══════════════════════════════════════════════════════════════╗
║                    API SECURITY                              ║
╠══════════════════════════════════════════════════════════════╣

  AUTHENTICATION
  ──────────────
  □ API routes require authentication
  □ Session management secure
  □ Token expiration implemented
  □ CORS properly configured

  RATE LIMITING
  ─────────────
  □ /api/chat has rate limits
  □ Abuse prevention in place
  □ DDoS considerations

  INPUT VALIDATION
  ────────────────
  □ All inputs validated
  □ SQL injection prevented
  □ NoSQL injection prevented
  □ Command injection prevented

  ERROR HANDLING
  ──────────────
  □ Errors don't leak sensitive info
  □ Stack traces hidden in production
  □ Consistent error response format

╚══════════════════════════════════════════════════════════════╝
```

#### Dependency Audit

```bash
# Run dependency audit
npm audit

# Check for known vulnerabilities
npm audit --audit-level=high
```

```
╔══════════════════════════════════════════════════════════════╗
║                    DEPENDENCY AUDIT                          ║
╠══════════════════════════════════════════════════════════════╣

  NPM AUDIT RESULTS
  ─────────────────
  Critical: [X]
  High:     [X]
  Moderate: [X]
  Low:      [X]

  CRITICAL VULNERABILITIES
  ────────────────────────
  [List any critical vulnerabilities]

  OUTDATED PACKAGES
  ─────────────────
  [List significantly outdated packages]

  RECOMMENDATIONS
  ───────────────
  [Specific update recommendations]

╚══════════════════════════════════════════════════════════════╝
```

### Step 3: Present Findings

```
╔══════════════════════════════════════════════════════════════╗
║                    AUDIT RESULTS                             ║
╠══════════════════════════════════════════════════════════════╣

  OVERALL SECURITY POSTURE: [🟢 Strong / 🟡 Moderate / 🔴 Weak]

  ═══════════════════════════════════════════════════════════

  CRITICAL FINDINGS
  ─────────────────
  [Any critical issues that must be fixed immediately]

  HIGH PRIORITY
  ─────────────
  [Security issues that should be fixed soon]

  MEDIUM PRIORITY
  ───────────────
  [Security improvements to consider]

  LOW PRIORITY
  ────────────
  [Minor security enhancements]

  ═══════════════════════════════════════════════════════════

  PRIVACY SCORE: [X] / 10
  ─────────────────────────
  □ PII Tokenization: [Score]
  □ Data Minimization: [Score]
  □ Logging Safety: [Score]
  □ Error Handling: [Score]

  API SECURITY SCORE: [X] / 10
  ────────────────────────────
  □ Authentication: [Score]
  □ Rate Limiting: [Score]
  □ Input Validation: [Score]
  □ CORS Configuration: [Score]

  ═══════════════════════════════════════════════════════════

  COMPLIANCE NOTES
  ────────────────
  FERPA: [Compliant / At Risk / Non-Compliant]
  COPPA: [Compliant / At Risk / Non-Compliant]

╚══════════════════════════════════════════════════════════════╝
```

### Step 4: Remediation Plan

For each finding:

```
  FINDING #1: [Title]
  ───────────────────
  Severity: [Critical/High/Medium/Low]
  Category: [Privacy/API/Auth/Deps]

  Description:
  [What the issue is]

  Risk:
  [What could happen if not fixed]

  Remediation:
  [Specific steps to fix]

  Files to modify:
  • [file1]
  • [file2]

  Verification:
  [How to confirm it's fixed]
```

## Quick Security Checks

```bash
# Check for secrets in code
grep -r "ANTHROPIC_API_KEY\|api_key\|secret" --include="*.ts" --include="*.tsx" .

# Check for console.log with data
grep -r "console.log" --include="*.ts" --include="*.tsx" app/ lib/

# Check for eval usage
grep -r "eval(" --include="*.ts" --include="*.tsx" .

# Check package vulnerabilities
npm audit
```

---

**Usage**: `/security-audit`
**Related**: `/privacy-check` for quick PII scan, `/code-review` for general review
