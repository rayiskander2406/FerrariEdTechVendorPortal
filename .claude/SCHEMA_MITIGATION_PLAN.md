# Schema Mitigation Plan

**Created**: December 1, 2024
**Purpose**: Address every concern raised in expert review
**Status**: Ready for audit

---

## Executive Summary

This document provides a mitigation plan for every concern raised during expert review of the DATA_SCHEMA_DESIGN.md. Each issue is addressed with:

1. **Acknowledgment** of the concern
2. **Justification** for why it matters at LAUSD scale
3. **Mitigation** with specific implementation
4. **Verification** criteria for audit

---

## Critical Issue #1: Over-Engineering (28 Models)

### Concern
> "28 models for a product that hasn't launched? You're designing for problems you don't have yet."

### Rebuttal: LAUSD Context
LAUSD is not a startup. It's the 2nd largest school district in the US:
- 670,000 students
- 26,000 teachers
- 1,000+ schools
- 500+ EdTech vendors
- Mandated compliance: FERPA, COPPA, SOPIPA, CIPA

Every "future problem" is a **current requirement**:

| Model | LAUSD Justification |
|-------|---------------------|
| LTI Grade Passback | Schoology (LAUSD's LMS) requires it for gradebook integration |
| Message Batching | 670K students = batch or nothing |
| Contact Preferences | LAUSD policy requires parent opt-out for communications |
| Demographics | Required for Title I, LCAP, and federal reporting |

### Mitigation
Maintain 28 models but implement in phases:

```
PHASE 1 (Week 1-2): Core Rostering
├── District, School, User, Class, Enrollment
├── VendorDataGrant, VendorSchoolGrant
└── 7 models - enables demo + pilot

PHASE 2 (Week 3-4): Privacy & Compliance
├── Demographics, TokenMapping
├── AcademicSession, Course
└── 4 models - enables privacy tiers

PHASE 3 (Week 5-6): Integrations
├── SSO models (3)
├── LTI models (6)
└── 9 models - enables production launch

PHASE 4 (Week 7-8): Communication
├── CPaaS models (4)
├── Parent relationship models (2)
└── 6 models - enables parent engagement
```

### Verification
- [ ] Each model has documented LAUSD use case
- [ ] Phase gates defined with acceptance criteria
- [ ] No model added without validated requirement

---

## Critical Issue #2: Dual Identity (User vs ParentGuardian)

### Concern
> "You have User for students/teachers AND ParentGuardian as a separate entity. Why aren't parents just Users with role='parent'?"

### Acknowledgment
This is a valid architectural concern. Two identity systems create:
- Duplicate tokenization logic
- Unclear ownership of contact info
- Complex queries across both tables

### Mitigation: Unify Into Single User Model

```prisma
// BEFORE (problematic):
model User {
  role: student | teacher | admin
}
model ParentGuardian {
  // Separate entity
}

// AFTER (unified):
model User {
  id              String   @id @default(uuid())
  sourcedId       String   @unique
  token           String   @unique  // TKN_STU_, TKN_TCH_, TKN_PAR_, TKN_ADM_

  // Identity
  givenName       String
  familyName      String

  // Role - NOW INCLUDES PARENTS
  role            String   // student | teacher | parent | administrator | aide

  // School association (null for parents who aren't staff)
  primarySchoolId String?

  // Contact
  email           String?
  phone           String?

  // Status
  status          String   @default("active")

  // Relations
  primarySchool       School? @relation("PrimarySchool", fields: [primarySchoolId], references: [id])
  enrollments         Enrollment[]           // For students/teachers
  demographics        Demographics?          // For students
  childRelationships  UserRelationship[] @relation("ParentRelation")   // For parents
  parentRelationships UserRelationship[] @relation("ChildRelation")    // For students
}

// Relationship between users (parent-child, guardian-ward, etc.)
model UserRelationship {
  id              String   @id @default(uuid())
  parentUserId    String   // User with role='parent'
  childUserId     String   // User with role='student'

  relationshipType String  // mother | father | guardian | grandparent | other
  isPrimary       Boolean  @default(false)

  // Permissions
  canViewGrades      Boolean @default(true)
  canViewAttendance  Boolean @default(true)
  canReceiveAlerts   Boolean @default(true)
  canPickup          Boolean @default(false)

  // Legal
  hasCustody         Boolean @default(true)
  legalRestrictions  String?

  // Verification
  verifiedAt      DateTime?
  verifiedBy      String?

  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  parent          User @relation("ParentRelation", fields: [parentUserId], references: [id])
  child           User @relation("ChildRelation", fields: [childUserId], references: [id])

  @@unique([parentUserId, childUserId])
  @@index([childUserId])
}
```

### Verification
- [ ] Single User model for all person types
- [ ] Role field includes: student, teacher, parent, administrator, aide
- [ ] UserRelationship handles parent-child links
- [ ] Token generation unified in one place

---

## Critical Issue #3: accessTier Duplication

### Concern
> "accessTier appears on both Vendor and VendorDataGrant. Which is the source of truth?"

### Mitigation: Single Source of Truth

```prisma
// BEFORE (ambiguous):
model Vendor {
  accessTier String  // PRIVACY_SAFE | SELECTIVE | FULL_ACCESS
}
model VendorDataGrant {
  accessTier String  // Same field - which wins?
}

// AFTER (clear hierarchy):
model Vendor {
  // REMOVED: accessTier - this is now grant-level only

  // Vendor-level is just the DEFAULT for new grants
  defaultAccessTier String @default("PRIVACY_SAFE")
}

model VendorDataGrant {
  // THIS IS THE SOURCE OF TRUTH for this vendor-district relationship
  accessTier String  // PRIVACY_SAFE | SELECTIVE | FULL_ACCESS

  // Audit: why this tier?
  accessTierApprovedBy  String?
  accessTierApprovedAt  DateTime?
  accessTierJustification String?  // Required for SELECTIVE or FULL_ACCESS
}
```

**Rule**: `VendorDataGrant.accessTier` is ALWAYS authoritative. `Vendor.defaultAccessTier` is only used when creating new grants.

### Verification
- [ ] Single authoritative field: VendorDataGrant.accessTier
- [ ] Vendor.defaultAccessTier clearly documented as "default only"
- [ ] All queries use grant-level accessTier

---

## Critical Issue #4: No Temporal Modeling

### Concern
> "When a student transfers schools mid-year, you lose history. Real school data is HIGHLY temporal."

### Mitigation: Add Effective Dating + History Tables

```prisma
// Option A: Effective Dating on Relationships
model Enrollment {
  id          String   @id @default(uuid())
  userId      String
  classId     String

  // ADDED: Effective dating
  effectiveStart  DateTime  // When this enrollment became active
  effectiveEnd    DateTime? // When it ended (null = current)

  // Status with history awareness
  status      String   // active | completed | withdrawn | transferred

  // Audit
  createdAt   DateTime @default(now())
  createdBy   String?  // Who created this record
  modifiedAt  DateTime @updatedAt
  modifiedBy  String?  // Who last modified

  @@index([userId, effectiveStart])
  @@index([classId, effectiveStart])
}

// Option B: History Table Pattern
model UserSchoolHistory {
  id          String   @id @default(uuid())
  userId      String
  schoolId    String

  // Period at this school
  startDate   DateTime
  endDate     DateTime?

  // Reason for change
  changeType  String   // enrolled | transferred_in | transferred_out | graduated | withdrawn
  changeReason String?

  // Audit
  recordedAt  DateTime @default(now())
  recordedBy  String?

  @@index([userId])
  @@index([schoolId])
  @@index([startDate])
}
```

**Query Example**: "Show me all schools this student attended"
```typescript
const schoolHistory = await prisma.userSchoolHistory.findMany({
  where: { userId: studentId },
  orderBy: { startDate: 'asc' }
});
```

### Verification
- [ ] All relationship tables have effectiveStart/effectiveEnd
- [ ] History tables exist for: UserSchool, Enrollment, UserRole
- [ ] Queries can retrieve point-in-time state

---

## Critical Issue #5: JSON Fields Are a Cop-Out

### Concern
> "allowedEntities String storing JSON? You lose all queryability."

### Mitigation: Proper Junction Tables

```prisma
// BEFORE (JSON string):
model VendorDataGrant {
  allowedEntities String  // '["users", "classes", "enrollments"]'
}

// AFTER (proper junction table):
model VendorDataGrant {
  id              String   @id @default(uuid())
  vendorId        String
  districtId      String
  accessTier      String
  // REMOVED: allowedEntities String

  // Relations
  allowedEntities VendorEntityPermission[]
}

model VendorEntityPermission {
  id              String   @id @default(uuid())
  vendorGrantId   String

  // Which entity type
  entityType      String   // users | classes | enrollments | orgs | academicSessions | courses | demographics

  // Granular permissions per entity
  canRead         Boolean  @default(true)
  canList         Boolean  @default(true)

  // Field-level restrictions (optional)
  excludedFields  String?  // JSON array of field names to exclude

  // Timestamps
  createdAt       DateTime @default(now())

  // Relations
  vendorGrant     VendorDataGrant @relation(fields: [vendorGrantId], references: [id], onDelete: Cascade)

  @@unique([vendorGrantId, entityType])
  @@index([entityType])
}
```

**Query Example**: "Which vendors can access the 'users' endpoint?"
```typescript
// NOW QUERYABLE:
const vendorsWithUserAccess = await prisma.vendorEntityPermission.findMany({
  where: { entityType: 'users' },
  include: { vendorGrant: { include: { vendor: true } } }
});
```

### Apply Same Pattern To:
- `targetCriteria` → `MessageBatchTarget` junction table
- `customParams` → `LtiCustomParam` table
- `categoriesEnabled` → `ContactPreferenceCategory` table

### Verification
- [ ] Zero JSON string fields for queryable data
- [ ] All many-to-many relationships use junction tables
- [ ] Indexes exist on junction table foreign keys

---

## Critical Issue #6: No Sync/ETL Strategy

### Concern
> "How does data get INTO this system? Where's the sync status?"

### Mitigation: Add Sync Metadata to All Entities

```prisma
// Add to EVERY entity that syncs from external source:
model User {
  // ... existing fields ...

  // SYNC METADATA
  externalId       String?   // ID from source system (SIS, Clever, etc.)
  externalSource   String?   // "lausd_sis" | "clever" | "classlink" | "oneroster"
  lastSyncedAt     DateTime? // When this record was last synced
  syncChecksum     String?   // Hash of source data for change detection
  syncStatus       String    @default("synced") // synced | pending | conflict | error
  syncError        String?   // Error message if sync failed
  syncVersion      Int       @default(1) // Optimistic locking for conflicts

  @@index([externalSource, externalId])
  @@index([syncStatus])
  @@index([lastSyncedAt])
}

// SYNC JOB TRACKING
model SyncJob {
  id              String   @id @default(uuid())
  districtId      String

  // Job details
  source          String   // "lausd_sis" | "clever_api" | "oneroster_csv"
  entityTypes     String   // JSON: ["users", "classes", "enrollments"]

  // Status
  status          String   @default("pending") // pending | running | completed | failed

  // Progress
  totalRecords    Int      @default(0)
  processedRecords Int     @default(0)
  createdRecords  Int      @default(0)
  updatedRecords  Int      @default(0)
  errorRecords    Int      @default(0)

  // Timing
  startedAt       DateTime?
  completedAt     DateTime?

  // Error tracking
  errors          SyncError[]

  // Timestamps
  createdAt       DateTime @default(now())

  @@index([districtId])
  @@index([status])
  @@index([createdAt])
}

model SyncError {
  id              String   @id @default(uuid())
  syncJobId       String

  // Error details
  entityType      String
  externalId      String
  errorType       String   // "validation" | "conflict" | "missing_ref" | "unknown"
  errorMessage    String
  rawData         String?  // JSON of the problematic record

  // Resolution
  resolved        Boolean  @default(false)
  resolvedAt      DateTime?
  resolvedBy      String?
  resolution      String?  // "skipped" | "manual_fix" | "auto_retry"

  // Timestamps
  createdAt       DateTime @default(now())

  // Relations
  syncJob         SyncJob @relation(fields: [syncJobId], references: [id], onDelete: Cascade)

  @@index([syncJobId])
  @@index([resolved])
}
```

### Verification
- [ ] All syncable entities have: externalId, externalSource, lastSyncedAt, syncStatus
- [ ] SyncJob table tracks all sync operations
- [ ] SyncError table captures and allows resolution of failures
- [ ] Checksums enable efficient change detection

---

## Critical Issue #7: No Soft Deletes

### Concern
> "Everything uses onDelete: Cascade. In K-12, you legally need to retain records."

### Mitigation: Add Soft Deletes + Retention Policies

```prisma
// Add to ALL entities:
model User {
  // ... existing fields ...

  // SOFT DELETE
  deletedAt       DateTime?
  deletedBy       String?
  deletionReason  String?   // "graduated" | "transferred" | "withdrawn" | "data_request"

  // Retention policy
  retainUntil     DateTime? // Legal retention requirement

  @@index([deletedAt])
}

// IMPORTANT: Update all queries to filter by deletedAt
// Example in application code:
const activeUsers = await prisma.user.findMany({
  where: {
    schoolId: schoolId,
    deletedAt: null  // ALWAYS filter soft deletes
  }
});
```

**Retention Policy by Entity Type:**

| Entity | Retention Period | Legal Basis |
|--------|-----------------|-------------|
| Student User | 7 years after graduation | FERPA |
| Enrollment | 7 years | FERPA |
| Grades (LtiGrade) | 7 years | State law |
| Audit logs | 3 years | SOPIPA |
| Messages | 1 year | District policy |

### Verification
- [ ] All entities have deletedAt field
- [ ] Application layer filters deletedAt: null by default
- [ ] Retention policies documented and enforced
- [ ] Hard delete only via scheduled retention job

---

## Critical Issue #8: Token Security

### Concern
> "Storing token and sisId in the SAME table. One breach = full de-anonymization."

### Mitigation: Separate Token Vault

```prisma
// USER TABLE (in main database):
model User {
  id              String   @id @default(uuid())
  token           String   @unique  // TKN_STU_XXXXX - THIS is the external ID

  // REMOVED: sisId, stateId - NEVER stored in main DB

  givenName       String
  familyName      String   // Stored as real value, tokenized on OUTPUT
  // ... rest of fields
}

// TOKEN MAPPING (in SEPARATE, hardened database/vault):
// This should be in a different database with:
// - Separate access credentials
// - Enhanced encryption (AES-256)
// - Limited network access (not accessible from app servers)
// - Audit logging on all access

model TokenMapping {
  token           String   @id       // TKN_STU_XXXXX
  realIdentifier  String   @unique   // The actual SIS ID, SSN fragment, etc.
  identifierType  String             // "sis_id" | "state_id" | "clever_id"

  // Audit
  createdAt       DateTime @default(now())
  lastAccessedAt  DateTime?
  accessCount     Int      @default(0)

  @@index([realIdentifier])
}

// DETOKENIZATION SERVICE (separate microservice):
// - Only this service can access TokenMapping
// - Requires elevated permissions
// - All access logged to immutable audit trail
// - Rate limited to prevent bulk extraction
```

**Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                     MAIN APPLICATION                         │
│                                                              │
│  User Table: { token: "TKN_STU_XXX", givenName: "John" }    │
│  (No real identifiers)                                       │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               │ HTTPS + mTLS
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   TOKEN VAULT SERVICE                        │
│                                                              │
│  • Separate database (encrypted at rest)                    │
│  • Separate credentials                                      │
│  • IP allowlist                                              │
│  • All access logged                                         │
│  • Rate limited (10 req/min per API key)                    │
│                                                              │
│  TokenMapping: { token: "TKN_STU_XXX", realId: "123456" }   │
└─────────────────────────────────────────────────────────────┘
```

### Verification
- [ ] Main database contains NO real identifiers
- [ ] TokenMapping in separate database/vault
- [ ] Detokenization requires explicit service call
- [ ] All detokenization access logged
- [ ] Rate limiting prevents bulk extraction

---

## Critical Issue #9: Status Field Chaos

### Concern
> "8 different status patterns. This should be well-defined enums."

### Mitigation: Standardized Status Enums

```typescript
// lib/types/status.ts - SINGLE SOURCE OF TRUTH

// ============================================
// ENTITY LIFECYCLE STATUS (most entities)
// ============================================
export const EntityStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DELETED: 'deleted',
} as const;

// ============================================
// SYNC STATUS (for synced entities)
// ============================================
export const SyncStatus = {
  PENDING: 'pending',
  SYNCING: 'syncing',
  SYNCED: 'synced',
  CONFLICT: 'conflict',
  ERROR: 'error',
} as const;

// ============================================
// GRANT/APPROVAL STATUS
// ============================================
export const ApprovalStatus = {
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  REVOKED: 'revoked',
} as const;

// ============================================
// INTEGRATION STATUS
// ============================================
export const IntegrationStatus = {
  NOT_CONFIGURED: 'not_configured',
  CONFIGURING: 'configuring',
  TESTING: 'testing',
  ACTIVE: 'active',
  ERROR: 'error',
  DISABLED: 'disabled',
} as const;

// ============================================
// MESSAGE/JOB STATUS
// ============================================
export const ProcessingStatus = {
  DRAFT: 'draft',
  QUEUED: 'queued',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

// ============================================
// LTI PROGRESS (per spec)
// ============================================
export const LtiActivityProgress = {
  INITIALIZED: 'Initialized',
  STARTED: 'Started',
  IN_PROGRESS: 'InProgress',
  SUBMITTED: 'Submitted',
  COMPLETED: 'Completed',
} as const;

export const LtiGradingProgress = {
  FULLY_GRADED: 'FullyGraded',
  PENDING: 'Pending',
  PENDING_MANUAL: 'PendingManual',
  FAILED: 'Failed',
  NOT_READY: 'NotReady',
} as const;
```

**Prisma Schema Comments:**
```prisma
model User {
  // Status: EntityStatus (active | inactive | deleted)
  status String @default("active")
}

model VendorDataGrant {
  // Status: ApprovalStatus (pending_review | approved | rejected | expired | revoked)
  status String @default("pending_review")
}

model SyncJob {
  // Status: ProcessingStatus (draft | queued | processing | completed | failed | cancelled)
  status String @default("queued")
}
```

### Verification
- [ ] All status values defined in lib/types/status.ts
- [ ] Each model documents which status enum it uses
- [ ] Validation enforces valid status values
- [ ] No "stringly typed" ad-hoc status values

---

## Critical Issue #10: Missing Indexes

### Concern
> "Common query patterns might not have indexes."

### Mitigation: Comprehensive Index Strategy

```prisma
model User {
  // ... fields ...

  // PRIMARY INDEXES (unique)
  @@id([id])
  @@unique([sourcedId])
  @@unique([token])

  // FOREIGN KEY INDEXES
  @@index([primarySchoolId])

  // QUERY PATTERN INDEXES
  @@index([role])                           // Filter by role
  @@index([status])                         // Filter active/inactive
  @@index([primarySchoolId, role])          // Students at school X
  @@index([primarySchoolId, role, status])  // Active students at school X
  @@index([gradeLevel])                     // Filter by grade

  // SYNC INDEXES
  @@index([externalSource, externalId])     // Lookup by external ID
  @@index([syncStatus])                     // Find records needing sync
  @@index([lastSyncedAt])                   // Stale record detection

  // SOFT DELETE INDEX
  @@index([deletedAt])                      // Filter deleted records

  // FULL TEXT (if supported)
  // @@fulltext([givenName, familyName])    // Name search
}

model Enrollment {
  // ... fields ...

  @@index([userId])
  @@index([classId])
  @@index([userId, status])                 // Active enrollments for user
  @@index([classId, status])                // Active enrollments for class
  @@index([classId, role])                  // Teachers vs students in class
  @@index([effectiveStart])                 // Point-in-time queries
  @@index([effectiveEnd])                   // Current enrollments (null)
}

model VendorSchoolGrant {
  // ... fields ...

  @@index([vendorGrantId])
  @@index([schoolId])
  @@index([schoolId, vendorGrantId])        // Schools for a grant
}
```

### Query Pattern Analysis

| Query | Frequency | Index |
|-------|-----------|-------|
| Get students by school | Very High | `[primarySchoolId, role, status]` |
| Get classes for student | High | `Enrollment[userId, status]` |
| Get students in class | High | `Enrollment[classId, role, status]` |
| Check vendor access to school | High | `VendorSchoolGrant[vendorGrantId, schoolId]` |
| Sync status check | Medium | `[syncStatus]`, `[lastSyncedAt]` |
| Deleted record filter | Every Query | `[deletedAt]` |

### Verification
- [ ] All foreign keys have indexes
- [ ] Common filter patterns have composite indexes
- [ ] EXPLAIN ANALYZE run on top 20 queries
- [ ] No full table scans on tables > 10K rows

---

## Critical Issue #11: Timestamp Inconsistency

### Concern
> "Some models have createdAt/updatedAt, some don't."

### Mitigation: Standardize All Models

**Every model gets:**
```prisma
model AnyModel {
  // ... fields ...

  // STANDARD TIMESTAMPS (required on ALL models)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // SOFT DELETE (required on ALL models)
  deletedAt       DateTime?
}
```

**Audit-sensitive models also get:**
```prisma
model SensitiveModel {
  // ... standard timestamps ...

  // AUDIT FIELDS
  createdBy       String?   // User/system that created
  updatedBy       String?   // User/system that last modified
  deletedBy       String?   // User/system that deleted
}
```

### Verification
- [ ] 100% of models have createdAt, updatedAt, deletedAt
- [ ] Audit-sensitive models have createdBy, updatedBy, deletedBy
- [ ] No redundant timestamp fields (e.g., submittedAt when createdAt exists)

---

## Critical Issue #12: SQLite/PostgreSQL Mismatch

### Concern
> "SQLite in dev, PostgreSQL in prod. 'Works on my machine' bugs."

### Mitigation: PostgreSQL Everywhere

```yaml
# docker-compose.yml for local development
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: schoolday
      POSTGRES_PASSWORD: localdev
      POSTGRES_DB: schoolday_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  postgres_test:
    image: postgres:15
    environment:
      POSTGRES_USER: schoolday
      POSTGRES_PASSWORD: test
      POSTGRES_DB: schoolday_test
    ports:
      - "5433:5432"

volumes:
  postgres_data:
```

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"  // ALWAYS PostgreSQL
  url      = env("DATABASE_URL")
}
```

```env
# .env.local
DATABASE_URL="postgresql://schoolday:localdev@localhost:5432/schoolday_dev"

# .env.test
DATABASE_URL="postgresql://schoolday:test@localhost:5433/schoolday_test"

# .env.production
DATABASE_URL="postgresql://..."  # Managed by Vercel/Railway
```

### Verification
- [ ] schema.prisma uses `provider = "postgresql"`
- [ ] docker-compose.yml provides local PostgreSQL
- [ ] CI/CD uses PostgreSQL for tests
- [ ] No SQLite-specific syntax in migrations

---

## Critical Issue #13: No Read Replica Consideration

### Concern
> "At scale, read patterns need optimization."

### Mitigation: Design for Read/Write Split

```typescript
// lib/db/client.ts
import { PrismaClient } from '@prisma/client';

// Primary (write) connection
export const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL }
  }
});

// Read replica connection (for heavy read operations)
export const prismaRead = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL_READ_REPLICA || process.env.DATABASE_URL }
  }
});

// Usage pattern:
// Writes: always use `prisma`
// Reads: use `prismaRead` for:
//   - Listing endpoints
//   - Reports
//   - Sync status checks
//   - Any read that can tolerate slight staleness
```

**API Route Example:**
```typescript
// Heavy read - use replica
export async function GET_listStudents(schoolId: string) {
  return prismaRead.user.findMany({
    where: { primarySchoolId: schoolId, role: 'student', deletedAt: null }
  });
}

// Write operation - use primary
export async function POST_createStudent(data: CreateStudentInput) {
  return prisma.user.create({ data });
}
```

### Verification
- [ ] prismaRead client exists for read-heavy operations
- [ ] All list/report endpoints use prismaRead
- [ ] All write operations use primary prisma
- [ ] Infrastructure supports read replica (document in runbook)

---

## Critical Issue #14: No Schema Versioning

### Concern
> "OneRoster 1.2 today, 1.3 tomorrow. No versioning strategy."

### Mitigation: API Versioning + Schema Version Tracking

```prisma
// Track schema version in database
model SchemaMetadata {
  id              String   @id @default("singleton")
  version         String   // "1.0.0"
  oneRosterVersion String  // "1.2"
  migratedAt      DateTime @default(now())

  // Feature flags for gradual rollout
  features        String   // JSON: {"lti_grades": true, "demographics": false}
}
```

**API Versioning:**
```
/api/v1/oneroster/users     ← Current (OneRoster 1.2)
/api/v2/oneroster/users     ← Future (OneRoster 1.3)
```

**Version Header Support:**
```typescript
// Support Accept header versioning
// Accept: application/vnd.oneroster.v1.2+json
const version = request.headers.get('Accept')?.match(/v(\d+\.\d+)/)?.[1] || '1.2';
```

### Verification
- [ ] SchemaMetadata table tracks current version
- [ ] API routes support versioned paths
- [ ] Breaking changes only in new versions
- [ ] Deprecation policy documented (6 months minimum)

---

## Expert Review: Additional Required Items

After presenting the mitigation plan to the expert panel, they approved with 6 additional requirements:

---

## Additional Item #15: UserHistory (SCD Type 2)

### Requirement
> "For truly critical data, add Slowly Changing Dimension Type 2 for point-in-time queries."

### Implementation

```prisma
// Slowly Changing Dimension Type 2 for critical entities
model UserHistory {
  id              String   @id @default(uuid())
  userId          String   // Original user ID (not FK - user might be deleted)

  // Snapshot of all fields at this point in time
  givenName       String
  familyName      String
  role            String
  primarySchoolId String?
  gradeLevel      String?
  status          String

  // SCD Type 2 fields
  validFrom       DateTime
  validTo         DateTime? // null = current record
  isCurrent       Boolean   @default(true)

  // Change tracking
  changeReason    String?   // "enrollment" | "transfer" | "grade_promotion" | "data_correction"
  changedBy       String?   // User or system that made the change

  // Timestamps
  createdAt       DateTime  @default(now())

  @@index([userId, isCurrent])
  @@index([userId, validFrom])
  @@index([validFrom, validTo])
}
```

**Use Case**: "Show me this student's record as it was on March 15, 2024"
```typescript
const historicalRecord = await prisma.userHistory.findFirst({
  where: {
    userId: studentId,
    validFrom: { lte: targetDate },
    OR: [
      { validTo: null },
      { validTo: { gt: targetDate } }
    ]
  }
});
```

### Verification
- [ ] UserHistory table exists
- [ ] Triggers/hooks create history on User update
- [ ] Point-in-time queries work correctly
- [ ] Audit reports use historical data

---

## Additional Item #16: Idempotency Keys for Sync

### Requirement
> "When syncing from SIS, operations need to be idempotent to prevent duplicate processing."

### Implementation

```prisma
model SyncJob {
  // ... existing fields ...

  // IDEMPOTENCY: Prevents duplicate processing
  idempotencyKey  String   @unique  // e.g., "sync_lausd_users_2024-12-01T08:00:00Z"

  @@index([idempotencyKey])
}
```

**Usage Pattern**:
```typescript
async function startSyncJob(districtId: string, entityTypes: string[]): Promise<SyncJob> {
  const idempotencyKey = `sync_${districtId}_${entityTypes.join('_')}_${new Date().toISOString().split('T')[0]}`;

  // Check for existing job with same key
  const existing = await prisma.syncJob.findUnique({
    where: { idempotencyKey }
  });

  if (existing) {
    if (existing.status === 'completed') {
      throw new Error('Sync already completed today');
    }
    if (existing.status === 'running') {
      return existing; // Return existing running job
    }
    // If failed, allow retry
  }

  return prisma.syncJob.upsert({
    where: { idempotencyKey },
    create: { districtId, entityTypes, idempotencyKey, status: 'pending' },
    update: { status: 'pending', errorRecords: 0 }  // Reset for retry
  });
}
```

### Verification
- [ ] idempotencyKey field exists on SyncJob
- [ ] Duplicate sync attempts are prevented
- [ ] Failed syncs can be retried
- [ ] Completed syncs cannot be re-run same day

---

## Additional Item #17: Circuit Breaker State

### Requirement
> "When Clever or ClassLink goes down, you need circuit breaker state to prevent cascading failures."

### Implementation

```prisma
model ExternalServiceHealth {
  id              String   @id  // "clever" | "classlink" | "lausd_sis" | "schoology"

  // Current status
  status          String   @default("healthy") // healthy | degraded | down

  // Health check tracking
  lastHealthCheck DateTime @default(now())
  consecutiveFailures Int  @default(0)
  consecutiveSuccesses Int @default(0)

  // Failure history
  lastFailure     DateTime?
  lastFailureReason String?
  lastSuccess     DateTime?

  // Circuit breaker state
  circuitState    String   @default("closed") // closed | open | half_open
  circuitOpenedAt DateTime?
  circuitHalfOpenAt DateTime?

  // Configuration (can override defaults)
  failureThreshold Int     @default(5)      // Failures before opening circuit
  successThreshold Int     @default(3)      // Successes before closing circuit
  openDurationMs   Int     @default(60000)  // How long circuit stays open

  // Timestamps
  updatedAt       DateTime @updatedAt
}
```

**Circuit Breaker Logic**:
```typescript
async function checkCircuit(serviceId: string): Promise<boolean> {
  const health = await prisma.externalServiceHealth.findUnique({
    where: { id: serviceId }
  });

  if (!health || health.circuitState === 'closed') {
    return true; // Allow request
  }

  if (health.circuitState === 'open') {
    const openDuration = Date.now() - health.circuitOpenedAt!.getTime();
    if (openDuration > health.openDurationMs) {
      // Transition to half-open
      await prisma.externalServiceHealth.update({
        where: { id: serviceId },
        data: { circuitState: 'half_open', circuitHalfOpenAt: new Date() }
      });
      return true; // Allow one test request
    }
    return false; // Circuit is open, reject request
  }

  // half_open - allow request to test
  return true;
}
```

### Verification
- [ ] ExternalServiceHealth table exists
- [ ] Circuit breaker prevents requests to failed services
- [ ] Half-open state allows recovery testing
- [ ] Dashboard shows service health status

---

## Additional Item #18: Token Access Logging (Vault)

### Requirement
> "All token vault access must be logged for security audit."

### Implementation (In Vault Database - Separate from Main)

```prisma
// THIS IS IN THE VAULT DATABASE (vault.prisma)

model TokenAccessLog {
  id              String   @id @default(uuid())

  // What token was accessed
  token           String

  // What operation
  accessType      String   // "tokenize" | "detokenize" | "lookup" | "bulk_tokenize"

  // Who accessed
  requestorId     String   // API key ID or service account
  requestorType   String   // "vendor" | "internal_service" | "admin"
  requestorIp     String

  // Why (REQUIRED for detokenize)
  reason          String?  // Required for detokenize operations

  // Context
  vendorId        String?  // If vendor-initiated
  resourceContext String?  // What resource this was for

  // Outcome
  success         Boolean
  errorCode       String?
  errorMessage    String?

  // Timing
  timestamp       DateTime @default(now())
  durationMs      Int?

  @@index([token])
  @@index([requestorId])
  @@index([timestamp])
  @@index([accessType])
  @@index([success])
}
```

### Verification
- [ ] TokenAccessLog exists in vault database
- [ ] Every vault operation creates a log entry
- [ ] Detokenization requires reason parameter
- [ ] Security team can query access patterns

---

## Additional Item #19: Detokenization Reason Requirement

### Requirement
> "You cannot detokenize without a documented reason. This is auditable."

### Implementation

```typescript
// lib/vault/types.ts
export const DetokenizeReason = {
  SIS_SYNC_RECONCILIATION: 'sis_sync_reconciliation',
  COMPLIANCE_AUDIT: 'compliance_audit',
  DATA_SUBJECT_REQUEST: 'data_subject_request',  // GDPR/CCPA
  EMERGENCY_CONTACT: 'emergency_contact',
  LEGAL_SUBPOENA: 'legal_subpoena',
  SECURITY_INVESTIGATION: 'security_investigation',
} as const;

export type DetokenizeReason = typeof DetokenizeReason[keyof typeof DetokenizeReason];

// lib/vault/client.ts
export async function detokenize(
  token: string,
  reason: DetokenizeReason,
  context?: { vendorId?: string; resourceId?: string }
): Promise<string> {
  // Validate reason is provided
  if (!reason) {
    throw new Error('Detokenization requires a reason');
  }

  // Log the access BEFORE performing operation
  const logEntry = await vaultPrisma.tokenAccessLog.create({
    data: {
      token,
      accessType: 'detokenize',
      requestorId: getCurrentRequestorId(),
      requestorType: getCurrentRequestorType(),
      requestorIp: getRequestIp(),
      reason,
      vendorId: context?.vendorId,
      resourceContext: context?.resourceId,
      success: false,  // Will update on success
      timestamp: new Date()
    }
  });

  try {
    const mapping = await vaultPrisma.tokenMapping.findUnique({
      where: { token }
    });

    if (!mapping) {
      throw new Error('Token not found');
    }

    // Update log entry on success
    await vaultPrisma.tokenAccessLog.update({
      where: { id: logEntry.id },
      data: { success: true, durationMs: Date.now() - logEntry.timestamp.getTime() }
    });

    return mapping.realIdentifier;
  } catch (error) {
    // Update log entry on failure
    await vaultPrisma.tokenAccessLog.update({
      where: { id: logEntry.id },
      data: {
        success: false,
        errorCode: error.code,
        errorMessage: error.message,
        durationMs: Date.now() - logEntry.timestamp.getTime()
      }
    });
    throw error;
  }
}
```

### Verification
- [ ] Detokenize function requires reason parameter
- [ ] All valid reasons are enumerated
- [ ] Attempts without reason are rejected
- [ ] Reason is logged in TokenAccessLog

---

## Additional Item #20: Vault Rate Limiting

### Requirement
> "Bulk detokenization attempts must trigger alerts. Rate limit vault access."

### Implementation

```prisma
// In vault database
model VaultRateLimit {
  id              String   @id  // Composite: "{requestorId}:{windowStart}"
  requestorId     String
  windowStart     DateTime
  windowEnd       DateTime

  // Counts
  tokenizeCount   Int      @default(0)
  detokenizeCount Int      @default(0)

  // Alerts
  alertTriggered  Boolean  @default(false)
  alertTriggeredAt DateTime?

  @@index([requestorId, windowStart])
}
```

**Rate Limit Configuration**:
```typescript
// lib/vault/rate-limits.ts
export const VAULT_RATE_LIMITS = {
  // Per-minute limits
  tokenize: {
    perMinute: 100,        // Normal tokenization is high-volume during sync
    alertThreshold: 500,   // Alert if exceeding this
  },
  detokenize: {
    perMinute: 10,         // Detokenization should be rare
    alertThreshold: 50,    // Alert security team
    perHour: 100,          // Hard limit per hour
  },
  bulk: {
    perDay: 1000,          // Bulk operations limited per day
    requiresApproval: true // Bulk detokenize needs pre-approval
  }
} as const;

async function checkRateLimit(
  requestorId: string,
  operation: 'tokenize' | 'detokenize'
): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date();
  windowStart.setSeconds(0, 0); // Start of current minute

  const windowId = `${requestorId}:${windowStart.toISOString()}`;

  const rateLimit = await vaultPrisma.vaultRateLimit.upsert({
    where: { id: windowId },
    create: {
      id: windowId,
      requestorId,
      windowStart,
      windowEnd: new Date(windowStart.getTime() + 60000),
      [operation === 'tokenize' ? 'tokenizeCount' : 'detokenizeCount']: 1
    },
    update: {
      [operation === 'tokenize' ? 'tokenizeCount' : 'detokenizeCount']: { increment: 1 }
    }
  });

  const count = operation === 'tokenize' ? rateLimit.tokenizeCount : rateLimit.detokenizeCount;
  const limit = VAULT_RATE_LIMITS[operation].perMinute;
  const alertThreshold = VAULT_RATE_LIMITS[operation].alertThreshold;

  // Trigger alert if threshold exceeded
  if (count >= alertThreshold && !rateLimit.alertTriggered) {
    await triggerSecurityAlert({
      type: 'vault_rate_limit_exceeded',
      requestorId,
      operation,
      count,
      threshold: alertThreshold
    });

    await vaultPrisma.vaultRateLimit.update({
      where: { id: windowId },
      data: { alertTriggered: true, alertTriggeredAt: new Date() }
    });
  }

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count)
  };
}
```

### Verification
- [ ] VaultRateLimit table tracks usage
- [ ] Requests exceeding limit are rejected with 429
- [ ] Alerts fire when threshold exceeded
- [ ] Security team receives alert notifications

---

## Summary: Complete Mitigation Checklist

| # | Issue | Mitigation | Status |
|---|-------|------------|--------|
| 1 | Over-engineering | Phased implementation plan | 📋 Planned |
| 2 | Dual identity | Unified User model | 📋 Planned |
| 3 | accessTier duplication | Single source of truth | 📋 Planned |
| 4 | No temporal modeling | Effective dating + history | 📋 Planned |
| 5 | JSON fields | Junction tables | 📋 Planned |
| 6 | No sync strategy | Sync metadata on all entities | 📋 Planned |
| 7 | No soft deletes | deletedAt + retention policy | 📋 Planned |
| 8 | Token security | Separate vault service | 📋 Planned |
| 9 | Status chaos | Standardized enums | 📋 Planned |
| 10 | Missing indexes | Comprehensive index strategy | 📋 Planned |
| 11 | Timestamp inconsistency | All models standardized | 📋 Planned |
| 12 | SQLite/PostgreSQL | PostgreSQL everywhere | 📋 Planned |
| 13 | No read replicas | prismaRead client | 📋 Planned |
| 14 | No versioning | API + schema versioning | 📋 Planned |
| **15** | **Point-in-time queries** | **UserHistory (SCD Type 2)** | 📋 Planned |
| **16** | **Duplicate sync prevention** | **Idempotency keys** | 📋 Planned |
| **17** | **External service failures** | **Circuit breaker state** | 📋 Planned |
| **18** | **Vault audit trail** | **TokenAccessLog** | 📋 Planned |
| **19** | **Detokenization control** | **Reason requirement** | 📋 Planned |
| **20** | **Bulk extraction prevention** | **Vault rate limiting** | 📋 Planned |

---

## Expert Approval Status

| Reviewer | Status | Notes |
|----------|--------|-------|
| Data Architect | ✅ APPROVED | All structural concerns addressed |
| Principal Engineer | ✅ APPROVED | Production-ready patterns |
| Security Team | ✅ APPROVED | With items 18-20 implemented |

---

## Next Steps

1. [x] Add 6 expert-required items to mitigation plan
2. [ ] Create final implementation-ready Prisma schema
3. [ ] Set up PostgreSQL dev environment
4. [ ] Implement Phase 1 models with all mitigations
5. [ ] Security review of vault implementation

---

*APPROVED FOR IMPLEMENTATION - December 1, 2024*
