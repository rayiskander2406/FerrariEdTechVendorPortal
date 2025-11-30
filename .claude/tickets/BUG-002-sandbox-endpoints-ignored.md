# BUG-002: Sandbox Ignores Vendor's Selected OneRoster Resources

**Ticket ID**: BUG-002
**Created**: November 29, 2025
**Priority**: P1 - High (Demo/User Experience Impact)
**Status**: RESOLVED
**Assigned**: Claude
**Resolved**: November 29, 2025

---

## Summary

When a vendor registers and selects specific OneRoster resources (Users, Classes, Courses, Enrollments, Organizations, Academic Sessions, Demographics), the sandbox provisioning ignores their selection and returns a hardcoded subset of endpoints.

## Reproduction Steps

1. Start new vendor registration via PoDS-Lite form
2. Select **all** OneRoster resources:
   - Users (Students & Teachers)
   - Classes (Course sections & schedules)
   - Courses (Curriculum & subject definitions)
   - Enrollments (Student & Teacher assignments)
   - Organizations (Schools & district info)
   - Academic Sessions (Terms, semesters & grading periods)
   - Demographics (Selective Tier - if applicable)
3. Submit application and get approved (Privacy-Safe tier)
4. Provision sandbox credentials
5. **Observe**: Sandbox only shows 5 endpoints instead of all 7+ requested

## Expected Behavior

Sandbox `allowedEndpoints` should include all resources the vendor selected:
- `/users`
- `/classes`
- `/courses`
- `/enrollments`
- `/orgs`
- `/academicSessions`
- `/demographics` (if Selective tier)

## Actual Behavior

Sandbox always returns hardcoded subset:
```javascript
allowedEndpoints: ["/users", "/orgs", "/classes", "/enrollments", "/courses"]
```

**Missing endpoints:**
- `/academicSessions` - Always missing
- `/demographics` - Always missing (even for Selective tier)

---

## Root Cause Analysis (RCA)

### Location
`lib/db/index.ts:252`

### Issue
The `createSandbox()` function **hardcodes** the `allowedEndpoints` array instead of accepting the vendor's selected resources as a parameter.

```typescript
// CURRENT (line 252) - HARDCODED
allowedEndpoints: ["/users", "/orgs", "/classes", "/enrollments", "/courses"],
```

### Data Flow Break
```
┌─────────────────────────────────────────────────────────────────┐
│ PodsLiteForm.tsx:284                                            │
│ selectedResources: [...all 7+ resources selected by vendor...]  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼ ❌ DATA LOST HERE
┌─────────────────────────────────────────────────────────────────┐
│ handlers.ts → handleProvisionSandbox()                          │
│ Calls createSandbox(vendorId) with NO resource parameter        │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│ lib/db/index.ts:222 - createSandbox(vendorId: string)           │
│ HARDCODES allowedEndpoints - ignores vendor selection           │
└─────────────────────────────────────────────────────────────────┘
```

### Contributing Factors
1. **No parameter passing**: `createSandbox()` signature only accepts `vendorId`
2. **No storage of selection**: Vendor's resource selection isn't stored with vendor record
3. **Missing link**: PoDS-Lite form's `selectedResources` never flows to sandbox creation

---

## Dev Spike

### Estimated Effort: 4-6 hours (Medium)

### Solution Approach

#### Option A: Pass Resources Through (Recommended)
1. Modify `createSandbox()` to accept optional `requestedEndpoints` parameter
2. Store vendor's OneRoster resource selection in vendor record
3. Update `handleProvisionSandbox()` to pass resources to `createSandbox()`
4. Map form selections to OneRoster endpoint paths

#### Option B: Store on Vendor Record
1. Add `oneRosterResources` field to Vendor schema
2. Populate during PoDS-Lite submission
3. Read from vendor record in `createSandbox()`

### Implementation Steps

```typescript
// Step 1: Update createSandbox signature
export async function createSandbox(
  vendorId: string,
  requestedEndpoints?: string[]
): Promise<SandboxCredentials> {
  // ...
  const sandbox: SandboxCredentials = {
    // ...
    allowedEndpoints: requestedEndpoints || DEFAULT_ENDPOINTS,
  };
}

// Step 2: Add OneRoster resource mapping
const ONEROSTER_ENDPOINT_MAP: Record<string, string> = {
  'users': '/users',
  'classes': '/classes',
  'courses': '/courses',
  'enrollments': '/enrollments',
  'orgs': '/orgs',
  'academicSessions': '/academicSessions',
  'demographics': '/demographics',
};

// Step 3: Update handler to pass resources
export async function handleProvisionSandbox(input: ProvisionSandboxInput) {
  const { vendor_id, requested_resources } = input;
  const endpoints = mapResourcesToEndpoints(requested_resources);
  const sandbox = await createSandbox(vendor_id, endpoints);
  // ...
}
```

### Files to Modify
- `lib/db/index.ts` - Update `createSandbox()` signature
- `lib/ai/handlers.ts` - Pass resources through handler
- `lib/ai/tools.ts` - Update tool schema for `provision_sandbox`
- `lib/types/index.ts` - Add types if needed
- `tests/lib/db.test.ts` - Update tests

### Testing Requirements
- [x] Unit test: `createSandbox()` with custom endpoints (7 tests)
- [x] Unit test: `createSandbox()` with default endpoints (3 tests - backward compat)
- [x] Unit test: `handleProvisionSandbox()` with resources (5 tests)
- [x] Integration test: Full flow from form → sandbox (3 tests)
- [x] Edge case tests: invalid/duplicate/case sensitivity (6 tests)
- [x] Regression tests: Existing functionality preserved (3 tests)

### Test File Location
`tests/bug-002/sandbox-endpoints.test.ts`

### Test Results (Pre-Fix)
```
32 tests total:
- 16 FAIL (new functionality - TDD red phase)
- 16 PASS (backward compatibility + defaults)
```

### Key Failing Tests
1. `should use the provided endpoints instead of defaults`
2. `should include /academicSessions when requested`
3. `should include /demographics when requested`
4. `should include all 7 endpoints when all resources requested`

### Run Tests
```bash
npm test -- tests/bug-002/sandbox-endpoints.test.ts
```

---

## Impact Assessment

| Area | Impact |
|------|--------|
| Demo Experience | **High** - Vendors see unexpected behavior |
| Functionality | **Medium** - Academic Sessions data unavailable |
| Privacy/Security | **Low** - Overly restrictive, not permissive |
| Data Integrity | **None** - No data loss |

---

## Related Items

- **Related Form**: `components/forms/PodsLiteForm.tsx`
- **Related Handler**: `lib/ai/handlers.ts:handleProvisionSandbox`
- **Related Tool**: `provision_sandbox`
- **Validation Script**: `scripts/validate-demo.ts` (may need update)

---

## Resolution Timeline

See `/plan-release` for integration into sprint planning.

---

*Created via bug report from user testing on Nov 29, 2025*
