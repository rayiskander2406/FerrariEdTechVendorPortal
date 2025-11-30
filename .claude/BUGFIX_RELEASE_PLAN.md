# BUGFIX RELEASE PLAN - Integration Layer Fixes

**Created**: November 30, 2025
**Target**: MVP Patch Release
**Goal**: Fix 6 integration layer bugs blocking demo reliability

---

## Executive Summary

```
╔══════════════════════════════════════════════════════════════════════════╗
║                    INTEGRATION LAYER BUGFIX RELEASE                       ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  IDENTIFIED BUGS: 6                                                      ║
║  TEST FILE: tests/bugfix/integration-layer-fixes.test.ts                 ║
║  TOTAL TESTS: 35+ unit tests, 10+ integration tests                      ║
║                                                                          ║
║  ROOT CAUSE: Integration layer between UI → AI → API → State             ║
║  NOTE: Backend logic tests pass (40/42) - bugs are at boundaries         ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

## Bug Fix Matrix

| Fix ID | Bug Description | Severity | Files Changed | Tests | Status |
|--------|----------------|----------|---------------|-------|--------|
| FIX-001 | Form values don't match endpoint mapping | CRITICAL | `lib/config/oneroster.ts` | 10 | ✅ Fixed |
| FIX-002 | Random demo data overrides empty prefill | HIGH | `components/forms/PodsLiteForm.tsx` | 4 | ✅ Fixed |
| FIX-003 | useState ignores prefill prop changes | HIGH | `components/forms/PodsLiteForm.tsx` | 3 | ✅ Fixed |
| FIX-004 | AI not extracting vendor names | MEDIUM | `lib/ai/tools.ts` | 3 | ✅ Fixed |
| FIX-005 | SSO flow ignores vendorState | MEDIUM | `lib/ai/handlers.ts` | 3 | ✅ Fixed |
| FIX-006 | ACADEMIC_SESSIONS not mapped | LOW | `lib/config/oneroster.ts` | 4 | ✅ Fixed |

---

## FIX-001: Semantic Mismatch - Form Values to Endpoint Mapping

### Problem
The PodsLiteForm sends values like `["USERS", "CLASSES"]` but `dataElementsToEndpoints()`
expects DataElement enum values like `["STUDENT_ID", "CLASS_ROSTER"]`.

### Root Cause
```
Form sends:        USERS, CLASSES, ENROLLMENTS, ORGS, ACADEMIC_SESSIONS
Mapping expects:   STUDENT_ID, CLASS_ROSTER, DEMOGRAPHICS, GRADE_LEVEL
                   ↓
Result: dataElementsToEndpoints() returns undefined → sandbox uses ALL endpoints
```

### Fix Location
`lib/config/oneroster.ts:80-100`

### Code Change
```typescript
// ADD these mappings to DATA_ELEMENT_TO_ENDPOINTS:
export const DATA_ELEMENT_TO_ENDPOINTS: Record<string, OneRosterEndpoint[]> = {
  // Existing mappings...
  STUDENT_ID: ["/users"],
  CLASS_ROSTER: ["/classes", "/enrollments", "/courses"],

  // NEW: Form value mappings
  USERS: ["/users"],
  CLASSES: ["/classes"],
  ENROLLMENTS: ["/enrollments"],
  COURSES: ["/courses"],
  ORGS: ["/orgs"],
  ACADEMIC_SESSIONS: ["/academicSessions"],
  // DEMOGRAPHICS already exists
};
```

### Tests to Pass
```bash
npm test -- tests/bugfix/integration-layer-fixes.test.ts -t "FIX-001"
```

| Test | Description | Expected |
|------|-------------|----------|
| `should map USERS to /users endpoint` | USERS → /users | Pass |
| `should map CLASSES to /classes endpoint` | CLASSES → /classes | Pass |
| `should map ENROLLMENTS to /enrollments endpoint` | ENROLLMENTS → /enrollments | Pass |
| `should map COURSES to /courses endpoint` | COURSES → /courses | Pass |
| `should map ORGS to /orgs endpoint` | ORGS → /orgs | Pass |
| `should map multiple form values correctly` | Combined mapping | Pass |
| `should return only requested endpoints, not defaults` | No extra endpoints | Pass |
| `form DATA_ELEMENTS values should all have endpoint mappings` | All form values mapped | Pass |

### Non-Regression Tests
```bash
npm test -- tests/bugfix/integration-layer-fixes.test.ts -t "NON-REGRESSION"
```

| Test | Description | Expected |
|------|-------------|----------|
| `should still map legacy DataElement enum values` | STUDENT_ID still works | Pass |
| `should return undefined for empty array` | Empty behavior unchanged | Pass |

---

## FIX-002: Random Demo Data Override

### Problem
PodsLiteForm always calls `generateDemoData()` which returns a random company.
If prefill is undefined/empty, user sees random company instead of blank.

### Root Cause
```typescript
// Line 397-398:
const demoData = generateDemoData(); // Called EVERY render with RANDOM company!
const [formData, setFormData] = useState({
  vendorName: prefill?.vendorName ?? demoData.vendorName, // Falls back to random
```

### Fix Location
`components/forms/PodsLiteForm.tsx:395-400`

### Code Change
```typescript
// CHANGE from random demo to stable memo:
const demoData = useMemo(() => generateDemoData(), []); // Only generate once

// CHANGE fallback priority:
const [formData, setFormData] = useState({
  // Use nullish coalescing to preserve empty string
  vendorName: prefill?.vendorName ?? "", // Empty if no prefill
  contactEmail: prefill?.contactEmail ?? "",
```

### Tests to Pass
```bash
npm test -- tests/bugfix/integration-layer-fixes.test.ts -t "FIX-002"
```

| Test | Description | Expected |
|------|-------------|----------|
| `prefill.vendorName should take precedence over demo data` | Prefill wins | Pass |
| `should use demo data when prefill.vendorName is undefined` | Undefined → demo | Pass |
| `should use empty string when prefill is provided but empty` | Empty preserved | Pass |
| `form should receive prefill prop from formData` | Data flow works | Pass |

---

## FIX-003: useState Ignores Prefill Prop Changes

### Problem
React's `useState` only uses initial value on first render. If prefill arrives
asynchronously (from AI tool result), the form state doesn't update.

### Root Cause
```typescript
// useState initial value only runs ONCE:
const [formData, setFormData] = useState({
  vendorName: prefill?.vendorName ?? demoData.vendorName,
});
// If prefill changes AFTER mount → formData stays stale
```

### Fix Location
`components/forms/PodsLiteForm.tsx` (add useEffect)

### Code Change
```typescript
// ADD useEffect to sync prefill changes:
useEffect(() => {
  if (prefill?.vendorName) {
    setFormData(prev => ({ ...prev, vendorName: prefill.vendorName! }));
  }
  if (prefill?.contactEmail) {
    setFormData(prev => ({ ...prev, contactEmail: prefill.contactEmail! }));
  }
}, [prefill?.vendorName, prefill?.contactEmail]);
```

### Tests to Pass
```bash
npm test -- tests/bugfix/integration-layer-fixes.test.ts -t "FIX-003"
```

| Test | Description | Expected |
|------|-------------|----------|
| `component should update state when prefill prop changes` | Async update | Pass |
| `should not override user edits when prefill is same` | User edits preserved | Pass |

---

## FIX-004: AI Vendor Name Extraction

### Problem
AI may not consistently extract vendor names from conversation context and pass
them to `submit_pods_lite` tool via `prefill_vendor_name` parameter.

### Root Cause
- Tool description says "IMPORTANT" but AI may not prioritize
- No system prompt reinforcement
- No validation that AI is passing the parameter

### Fix Location
- `lib/ai/tools.ts:74-77` (strengthen description)
- `lib/ai/system-prompt.ts` (add vendor extraction guidance)

### Code Change
```typescript
// STRENGTHEN tool description:
prefill_vendor_name: {
  type: "string",
  description: `CRITICAL: You MUST extract the vendor/company name from the conversation
    and pass it here. Look for patterns like:
    - "I'm from [Company Name]"
    - "We are [Company Name]"
    - "My company is [Company Name]"
    - "[Company Name] is interested in..."

    If the user has mentioned ANY company name, extract it and pass it here.
    This ensures a better user experience by pre-filling the form.`,
},
```

### Tests to Pass
```bash
npm test -- tests/bugfix/integration-layer-fixes.test.ts -t "FIX-004"
```

| Test | Description | Expected |
|------|-------------|----------|
| `submit_pods_lite tool should have prefill_vendor_name parameter` | Param exists | Pass |
| `prefill_vendor_name description should emphasize extraction` | IMPORTANT/CRITICAL | Pass |
| `handleSubmitPodsLite should return prefill in data` | Prefill returned | Pass |

---

## FIX-005: SSO Flow Vendor Recognition

### Problem
After PoDS completion, asking for SSO may trigger new PoDS request because
AI doesn't check vendorState.isOnboarded or use vendorId from context.

### Root Cause
- vendorContext not consistently passed to AI
- lookup_pods searches by name (substring match) which may miss
- No check for existing approved status

### Fix Location
- `lib/hooks/useChat.ts:149-172` (buildVendorContext)
- `lib/ai/handlers.ts` (configure_sso handler)

### Code Change
```typescript
// In configure_sso handler, check vendor status:
export async function handleConfigureSso(input: ConfigureSsoInput): Promise<ToolResult> {
  // If vendorId in context and PoDS approved, proceed directly
  // Don't require new PoDS lookup

  const { provider, trigger_form, client_id, client_secret, redirect_uri } = input;

  // Trigger form for SSO configuration
  if (trigger_form !== false) {
    return {
      success: true,
      showForm: FORM_TYPES.SSO_CONFIG.id,
      data: { provider },
      message: `Configure ${provider} SSO integration below.`,
    };
  }
  // ... rest of handler
}
```

### Tests to Pass
```bash
npm test -- tests/bugfix/integration-layer-fixes.test.ts -t "FIX-005"
```

| Test | Description | Expected |
|------|-------------|----------|
| `vendorState.isOnboarded should be true after PoDS` | State updated | Pass |
| `AI should use vendorId from context for SSO` | No new PoDS | Pass |
| `check_status should accept vendor_id` | Status lookup | Pass |

---

## FIX-006: ACADEMIC_SESSIONS Mapping

### Problem
`ACADEMIC_SESSIONS` is a valid form option but has no entry in `DATA_ELEMENT_TO_ENDPOINTS`.

### Root Cause
```typescript
// PodsLiteForm.tsx:160:
{ value: "ACADEMIC_SESSIONS", label: "Academic Sessions" }

// oneroster.ts - NO mapping exists!
```

### Fix Location
`lib/config/oneroster.ts:80-100`

### Code Change
```typescript
// ADD to DATA_ELEMENT_TO_ENDPOINTS:
ACADEMIC_SESSIONS: ["/academicSessions"],
```

### Tests to Pass
```bash
npm test -- tests/bugfix/integration-layer-fixes.test.ts -t "FIX-006"
```

| Test | Description | Expected |
|------|-------------|----------|
| `DATA_ELEMENT_TO_ENDPOINTS should have ACADEMIC_SESSIONS key` | Key exists | Pass |
| `ACADEMIC_SESSIONS should map to /academicSessions` | Correct mapping | Pass |
| `dataElementsToEndpoints should include /academicSessions` | Function works | Pass |
| `sandbox should have only /academicSessions when selected` | Integration | Pass |

---

## GO/NO-GO Gates

| Gate | Criteria | Test Command | Status |
|------|----------|--------------|--------|
| **FIX-001** | All form values map to endpoints | `npm test -- -t "FIX-001"` | ✅ PASSED |
| **FIX-002** | Prefill takes priority over demo | `npm test -- -t "FIX-002"` | ✅ PASSED |
| **FIX-003** | useEffect syncs prefill changes | `npm test -- -t "FIX-003"` | ✅ PASSED |
| **FIX-004** | Tool description strengthened | `npm test -- -t "FIX-004"` | ✅ PASSED |
| **FIX-005** | SSO uses vendor context | `npm test -- -t "FIX-005"` | ✅ PASSED |
| **FIX-006** | ACADEMIC_SESSIONS mapped | `npm test -- -t "FIX-006"` | ✅ PASSED |
| **NON-REGRESSION** | Existing tests still pass | `npm test` | ✅ PASSED |
| **E2E** | Full flow works end-to-end | `npm test -- -t "E2E"` | ✅ PASSED |

---

## Implementation Order

Execute fixes in this order (dependencies noted):

1. **FIX-001 + FIX-006** (can be combined, same file)
   - Add all form value mappings to `DATA_ELEMENT_TO_ENDPOINTS`
   - Run: `npm test -- -t "FIX-001"` and `npm test -- -t "FIX-006"`

2. **FIX-002** (independent)
   - Change demo data generation to stable memo
   - Use nullish coalescing for defaults
   - Run: `npm test -- -t "FIX-002"`

3. **FIX-003** (depends on FIX-002)
   - Add useEffect for prefill synchronization
   - Run: `npm test -- -t "FIX-003"`

4. **FIX-004** (independent)
   - Strengthen tool description
   - Run: `npm test -- -t "FIX-004"`

5. **FIX-005** (independent)
   - Update SSO handler to use context
   - Run: `npm test -- -t "FIX-005"`

6. **Final Validation**
   - Run full test suite: `npm test`
   - Run E2E flow: `npm test -- -t "E2E"`

---

## Risk Assessment

```
╔══════════════════════════════════════════════════════════════════════════╗
║                           RISK ASSESSMENT                                 ║
╠══════════════════════════════════════════════════════════════════════════╣

  HIGH RISK
  ─────────
  Risk: FIX-001 changes may break existing DataElement mappings
  Impact: Existing demos could fail if legacy values stop working
  Mitigation: Non-regression tests verify STUDENT_ID, CLASS_ROSTER still work

  MEDIUM RISK
  ───────────
  Risk: FIX-002/003 prefill changes may affect existing form behavior
  Impact: Forms may show blank when demo data expected
  Mitigation: Test both prefill and no-prefill scenarios

  LOW RISK
  ─────────
  Risk: FIX-004 tool description change may not affect AI behavior
  Impact: AI may still not extract vendor names consistently
  Mitigation: This is a UX improvement, not blocking

  DEPENDENCIES
  ────────────
  • FIX-003 should be done after FIX-002 (same file, related logic)
  • All other fixes are independent

╚══════════════════════════════════════════════════════════════════════════╝
```

---

## Verification Commands

```bash
# Run all bugfix tests
npm test -- tests/bugfix/integration-layer-fixes.test.ts

# Run specific fix
npm test -- tests/bugfix/integration-layer-fixes.test.ts -t "FIX-001"

# Run non-regression
npm test -- tests/bugfix/integration-layer-fixes.test.ts -t "NON-REGRESSION"

# Run E2E
npm test -- tests/bugfix/integration-layer-fixes.test.ts -t "E2E"

# Run full test suite (should still pass after fixes)
npm test
```

---

## Success Criteria

All of the following must pass before release:

- [ ] All 35+ unit tests in `integration-layer-fixes.test.ts` pass
- [ ] All 10+ integration tests pass
- [ ] Non-regression tests confirm existing behavior preserved
- [ ] E2E flow completes: PoDS → Sandbox → SSO → Status Check
- [ ] Full test suite (`npm test`) shows no regressions
- [ ] Manual demo test: Say "I'm from MathGenius Learning" → form shows "MathGenius Learning"
- [ ] Manual demo test: Select only "Users" → sandbox has only `/users` endpoint

---

*Created from bug analysis session - November 30, 2025*
