# LAUSD Vendor Portal - Formal Specification

> **Auto-generated documentation from `vendor-portal-rules.yaml`**
>
> Generated: 2025-12-02T09:13:03.236Z
> Specification Version: 1.0

Privacy-first EdTech vendor integration platform

---

## Table of Contents

1. [Formal Axioms](#formal-axioms)
2. [Privacy Tiers](#privacy-tiers)
3. [Token Types](#token-types)
4. [State Machines](#state-machines)
5. [Data Invariants](#data-invariants)
6. [Compliance](#compliance)

---

## Formal Axioms

These properties **MUST** hold for all operations. Violations are critical bugs.

| Axiom | Description | Formal Definition | Severity |
|-------|-------------|-------------------|----------|
| **injectivity** | Different users produce different tokens (no collisions) | `∀ u1, u2 ∈ Users: u1 ≠ u2 → token(u1) ≠ token(u2)` | critical |
| **roundtrip** | Tokenize then detokenize returns original value | `∀ u ∈ Users: detokenize(tokenize(u)) = u` | critical |
| **format_preservation** | Token maintains expected format for its type | `∀ u ∈ Users: format(token(u)) ∈ valid_formats(role(u))` | high |
| **access_tier_enforcement** | Vendor can only access data matching their approved tier | `∀ vendor, data: access(vendor, data) → tier(vendor) ≥ tier_required(data)` | critical |
| **state_machine_validity** | State transitions follow defined paths only | `∀ entity, s1, s2: transition(entity, s1, s2) → (s1, s2) ∈ valid_transitions` | high |

---

## Privacy Tiers

| Tier | Level | Description | Approval | Review Time |
|------|-------|-------------|----------|-------------|
| **PRIVACY_SAFE** | 1 | Zero PII - instant auto-approval | automatic | minutes |
| **SELECTIVE** | 2 | Limited PII - requires review | manual | 1-2 weeks |
| **FULL_ACCESS** | 3 | Full PII - extensive review required | manual | 4-6 weeks |

### Field Visibility by Tier

#### PRIVACY_SAFE

**Visible Fields:**
- user: id, token, role, gradeLevel, primarySchoolId
- demographics: (none)

**Tokenized Fields:** givenName, familyName, email, phone

#### SELECTIVE

**Visible Fields:**
- user: id, token, role, gradeLevel, primarySchoolId, givenName
- demographics: freeLunchStatus, englishLanguageLearner, specialEducation

**Tokenized Fields:** familyName, email, phone

#### FULL_ACCESS

**Visible Fields:**
- user: id, token, role, gradeLevel, primarySchoolId, givenName, familyName, email, phone
- demographics: *

**Tokenized Fields:** (none)

---

## Token Types

### Student

> Student user tokens

| Property | Value |
|----------|-------|
| **Format** | `TKN_STU_{hash:8}` |
| **Pattern** | `^TKN_STU_[A-Z0-9]{8}$` |
| **Example** | `TKN_STU_8X9Y2Z3A` |
| **Axioms** | injectivity, roundtrip, format_preservation |


### Teacher

> Teacher user tokens

| Property | Value |
|----------|-------|
| **Format** | `TKN_TCH_{hash:8}` |
| **Pattern** | `^TKN_TCH_[A-Z0-9]{8}$` |
| **Example** | `TKN_TCH_7B8C9D0E` |
| **Axioms** | injectivity, roundtrip, format_preservation |


### Parent

> Parent user tokens

| Property | Value |
|----------|-------|
| **Format** | `TKN_PAR_{hash:8}` |
| **Pattern** | `^TKN_PAR_[A-Z0-9]{8}$` |
| **Example** | `TKN_PAR_1F2G3H4I` |
| **Axioms** | injectivity, roundtrip, format_preservation |


### Email

> Tokenized email addresses

| Property | Value |
|----------|-------|
| **Format** | `TKN_STU_{hash:8}@relay.schoolday.lausd.net` |
| **Pattern** | `^TKN_STU_[A-Z0-9]{8}@relay\.schoolday\.lausd\.net$` |
| **Example** | `TKN_STU_8X9Y2Z3A@relay.schoolday.lausd.net` |
| **Axioms** | injectivity, format_preservation |
| **Preserves** | domain structure |

### Phone

> Tokenized phone numbers

| Property | Value |
|----------|-------|
| **Format** | `TKN_555_{hash:3}_{hash:4}` |
| **Pattern** | `^TKN_555_[0-9]{3}_[0-9]{4}$` |
| **Example** | `TKN_555_123_4567` |
| **Axioms** | format_preservation |
| **Preserves** | phone number structure |

---

## State Machines

### Sync Status

> Data synchronization lifecycle

**Applies to:** User, School, Class, Enrollment, Course, AcademicSession, Demographics

**States:** pending → syncing → synced → conflict → error

**Initial State:** `pending`

| From | To | Trigger |
|------|----|---------|
| pending | syncing | sync_started |
| syncing | synced | sync_completed |
| syncing | conflict | conflict_detected |
| syncing | error | sync_failed |
| conflict | pending | conflict_resolved |
| error | pending | retry_requested |

### Circuit Breaker

> External service resilience

**Applies to:** ExternalServiceHealth

**States:** closed → open → half_open

**Initial State:** `closed`

| From | To | Trigger |
|------|----|---------|
| closed | open | failure_threshold_exceeded |
| open | half_open | timeout_elapsed |
| half_open | closed | success_threshold_met |
| half_open | open | probe_failed |

### Vendor Grant Status

> Vendor data access grant lifecycle

**Applies to:** VendorDataGrant

**States:** pending_review → approved → rejected → expired → revoked

**Initial State:** `pending_review`

| From | To | Trigger |
|------|----|---------|
| pending_review | approved | review_approved |
| pending_review | rejected | review_rejected |
| approved | expired | expiry_date_reached |
| approved | revoked | manual_revocation |

### Enrollment Status

> Student enrollment lifecycle

**Applies to:** Enrollment

**States:** active → completed → withdrawn → transferred

**Initial State:** `active`

| From | To | Trigger |
|------|----|---------|
| active | completed | course_completed |
| active | withdrawn | student_withdrawn |
| active | transferred | student_transferred |

---

## Data Invariants

### Grade Bounds

> Score given cannot exceed score maximum

- **Formal:** `∀ grade: grade.scoreGiven ≤ grade.scoreMaximum`
- **Severity:** high
- **Entities:** LtiGrade
- **Test Strategy:** property

### Effective Dating

> End date must be after start date when present

- **Formal:** `∀ e: e.effectiveEnd != null → e.effectiveEnd > e.effectiveStart`
- **Severity:** medium
- **Entities:** Enrollment, AcademicSession
- **Test Strategy:** property

### Parent Child Roles

> Parent-child relationships have correct role assignments

- **Formal:** `∀ r: r.parent.role = 'parent' ∧ r.child.role = 'student'`
- **Severity:** critical
- **Entities:** UserRelationship
- **Test Strategy:** unit

### Unique Enrollment

> User cannot have duplicate active enrollments in same class

- **Formal:** `∀ u, c: |{e: e.user=u ∧ e.class=c ∧ e.status='active'}| ≤ 1`
- **Severity:** high
- **Entities:** Enrollment
- **Test Strategy:** property

### Vendor Grant Scope

> Vendor school grants must be subset of district grant

- **Formal:** `∀ sg: sg.school.district = sg.vendorGrant.district`
- **Severity:** critical
- **Entities:** VendorSchoolGrant, VendorDataGrant
- **Test Strategy:** unit

### Session Expiry

> SSO sessions must have future expiry at creation

- **Formal:** `∀ s: s.createdAt < s.expiresAt`
- **Severity:** high
- **Entities:** SsoSession
- **Test Strategy:** property

### Soft Delete Cascade

> Soft deleted parent implies soft deleted children

- **Formal:** `∀ parent, child: parent.deletedAt != null → child.deletedAt != null`
- **Severity:** medium
- **Entities:** District, School, User
- **Test Strategy:** integration

---

## Compliance

### FERPA

> Family Educational Rights and Privacy Act

| Requirement | Description | Implementation |
|-------------|-------------|----------------|
| ferpa_consent | Parental consent required for PII disclosure | VendorDataGrant.accessTier validation |
| ferpa_audit | Audit trail for all PII access | AuditLog entity |
| ferpa_minimum | Minimum necessary data principle | Privacy tier field restrictions |

### COPPA

> Children's Online Privacy Protection Act

| Requirement | Description | Implementation |
|-------------|-------------|----------------|
| coppa_consent | Verifiable parental consent for <13 | ContactPreference.consentGivenAt |
| coppa_data_minimization | Collect only necessary data | PRIVACY_SAFE tier default |

---

*This documentation is auto-generated. Do not edit manually.*
*To update, modify `spec/vendor-portal-rules.yaml` and run `npm run generate:spec`*
