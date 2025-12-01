# District Data Schema Design

**Created**: December 1, 2024
**Status**: Draft - Awaiting Review
**Priority**: CRITICAL - Foundation for v1.0

---

## Executive Summary

This document defines the complete data schema for the SchoolDay Vendor Portal. The schema covers:

**District Data (Layers 1-5)**
1. District hierarchy (District → Schools → Classes → Students)
2. School-level access scoping (LAUSD feedback)
3. Entity-level access scoping (which data types vendor can access)
4. OneRoster 1.2 alignment for interoperability
5. Privacy tier tokenization rules

**Integration Layer (Layers 6-9)**
6. SSO integration (sessions, launch context, user mapping)
7. LTI 1.3 integration (platforms, deployments, resources, grades)
8. CPaaS integration (templates, preferences, batch messaging)
9. Parent/Guardian relationships

**Total Models: 28** (up from 6 in current schema)

---

## LAUSD Feedback Integration

> "Vendors not only choose entities, but also select which schools, so that they don't end up receiving too much data they don't need."

This translates to a **two-dimensional access model**:

```
                        ENTITY TYPES
                    ┌─────┬─────┬─────┬─────┐
                    │Users│Class│Enrol│Demog│
           ┌────────┼─────┼─────┼─────┼─────┤
           │Lincoln │  ✓  │  ✓  │  ✓  │     │
  SCHOOLS  │Roosevelt│  ✓  │  ✓  │  ✓  │     │
           │Kennedy │  ✓  │  ✓  │  ✓  │     │
           │Garfield│     │     │     │     │  ← No access
           └────────┴─────┴─────┴─────┴─────┘

           MathGenius Inc. can access Users, Classes, Enrollments
           from Lincoln, Roosevelt, and Kennedy schools only.
```

---

## Current State vs. Target State

### Current Prisma Schema (Vendor Portal)

| Model | Purpose | Status |
|-------|---------|--------|
| Vendor | EdTech company registration | ✅ Exists |
| PodsApplication | Privacy application record | ✅ Exists |
| SandboxCredentials | API keys for OneRoster | ✅ Exists |
| IntegrationConfig | SSO/LTI configuration | ✅ Exists |
| AuditLog | Activity tracking | ✅ Exists |
| CommunicationMessage | CPaaS messages | ✅ Exists |

### Missing: District Data Model

| Model | Purpose | Status |
|-------|---------|--------|
| District | LEA/School District | ❌ Missing |
| School | Individual school | ❌ Missing |
| AcademicSession | Terms, semesters, years | ❌ Missing |
| Course | Curriculum courses | ❌ Missing |
| Class | Scheduled class sections | ❌ Missing |
| User | Students and Teachers | ❌ Missing |
| Enrollment | User-Class relationship | ❌ Missing |
| Demographics | Protected student data | ❌ Missing |
| **VendorDataGrant** | Access scoping | ❌ Missing |
| **VendorSchoolGrant** | School-level permissions | ❌ Missing |

---

## OneRoster 1.2 Alignment

The schema follows [OneRoster 1.2 specification](https://www.imsglobal.org/oneroster-v12-final-specification) for interoperability:

### Core OneRoster Entities

| OneRoster Entity | Our Model | Notes |
|------------------|-----------|-------|
| `orgs` | District, School | Hierarchical organizations |
| `academicSessions` | AcademicSession | Terms, grading periods |
| `courses` | Course | Curriculum catalog |
| `classes` | Class | Scheduled sections |
| `users` | User | Students, teachers, parents |
| `enrollments` | Enrollment | User-to-class assignments |
| `demographics` | Demographics | Protected PII (separate endpoint) |

### OneRoster ID Convention

All entities use `sourcedId` as primary identifier:
- Format: UUID or district-specific ID
- Must be stable across syncs
- Referenced in all relationships

---

## Proposed Schema

### Layer 1: District Hierarchy

```prisma
// =============================================================================
// DISTRICT - Local Education Agency (LEA)
// =============================================================================

model District {
  id          String   @id @default(uuid())
  sourcedId   String   @unique  // OneRoster ID
  name        String             // "Los Angeles Unified School District"
  shortCode   String   @unique   // "LAUSD"
  type        String   @default("district")  // district | state | national

  // Identifiers
  ncesId      String?  @unique   // NCES District ID (e.g., "0622710")
  stateId     String?            // State-assigned ID

  // Metadata
  timezone    String   @default("America/Los_Angeles")
  locale      String   @default("en-US")

  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  schools           School[]
  academicSessions  AcademicSession[]
  courses           Course[]
  vendorGrants      VendorDataGrant[]

  @@index([shortCode])
  @@index([ncesId])
}

// =============================================================================
// SCHOOL - Individual school within a district
// =============================================================================

model School {
  id          String   @id @default(uuid())
  sourcedId   String   @unique  // OneRoster ID
  districtId  String

  // Basic info
  name        String             // "Abraham Lincoln High School"
  shortCode   String             // "ALHS"
  type        String             // elementary | middle | high | K-8 | K-12

  // Identifiers
  ncesId      String?  @unique   // NCES School ID
  stateId     String?            // State-assigned ID

  // Grade range
  gradeMin    Int                // 9 for high school
  gradeMax    Int                // 12 for high school

  // Location (not PII - public info)
  address     String?
  city        String?
  state       String?  @default("CA")
  zipCode     String?

  // Contact (public)
  phone       String?
  website     String?

  // Status
  status      String   @default("active")  // active | inactive | closed

  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  district    District @relation(fields: [districtId], references: [id], onDelete: Cascade)
  classes     Class[]
  users       User[]
  vendorSchoolGrants VendorSchoolGrant[]

  @@unique([districtId, shortCode])
  @@index([districtId])
  @@index([ncesId])
  @@index([type])
}
```

### Layer 2: Academic Structure

```prisma
// =============================================================================
// ACADEMIC SESSION - Terms, semesters, school years
// =============================================================================

model AcademicSession {
  id          String   @id @default(uuid())
  sourcedId   String   @unique  // OneRoster ID
  districtId  String

  // Basic info
  title       String             // "Fall 2024", "2024-2025 School Year"
  type        String             // schoolYear | semester | term | gradingPeriod

  // Dates
  startDate   DateTime
  endDate     DateTime

  // Hierarchy (terms belong to semesters, semesters belong to years)
  parentId    String?            // Parent session ID

  // Status
  status      String   @default("active")  // active | inactive

  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  district    District @relation(fields: [districtId], references: [id], onDelete: Cascade)
  parent      AcademicSession? @relation("SessionHierarchy", fields: [parentId], references: [id])
  children    AcademicSession[] @relation("SessionHierarchy")
  classes     Class[]

  @@index([districtId])
  @@index([type])
  @@index([parentId])
}

// =============================================================================
// COURSE - Curriculum course (template for classes)
// =============================================================================

model Course {
  id          String   @id @default(uuid())
  sourcedId   String   @unique  // OneRoster ID
  districtId  String

  // Basic info
  title       String             // "Algebra I"
  courseCode  String             // "MATH101"

  // Categorization
  subject     String?            // Math, Science, English, etc.
  gradeLevel  String?            // "9" or "9-12" or "K"

  // Status
  status      String   @default("active")

  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  district    District @relation(fields: [districtId], references: [id], onDelete: Cascade)
  classes     Class[]

  @@unique([districtId, courseCode])
  @@index([districtId])
  @@index([subject])
}
```

### Layer 3: Classes and Enrollments

```prisma
// =============================================================================
// CLASS - Scheduled class section
// =============================================================================

model Class {
  id               String   @id @default(uuid())
  sourcedId        String   @unique  // OneRoster ID
  schoolId         String
  courseId         String?
  academicSessionId String?

  // Basic info
  title            String             // "Algebra I - Period 3"
  classCode        String?            // "ALG1-P3"

  // Schedule
  period           String?            // "3" or "A"
  location         String?            // "Room 204"

  // Grade/Subject (may differ from course)
  gradeLevel       String?
  subject          String?

  // Status
  status           String   @default("active")

  // Timestamps
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  // Relations
  school           School @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  course           Course? @relation(fields: [courseId], references: [id])
  academicSession  AcademicSession? @relation(fields: [academicSessionId], references: [id])
  enrollments      Enrollment[]

  @@index([schoolId])
  @@index([courseId])
  @@index([academicSessionId])
  @@index([subject])
}

// =============================================================================
// ENROLLMENT - User to Class assignment
// =============================================================================

model Enrollment {
  id          String   @id @default(uuid())
  sourcedId   String   @unique  // OneRoster ID
  userId      String
  classId     String

  // Role in class
  role        String             // student | teacher | aide | administrator
  isPrimary   Boolean  @default(true)  // Primary teacher vs co-teacher

  // Dates
  startDate   DateTime?
  endDate     DateTime?

  // Status
  status      String   @default("active")  // active | inactive | completed

  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  user        User @relation(fields: [userId], references: [id], onDelete: Cascade)
  class       Class @relation(fields: [classId], references: [id], onDelete: Cascade)

  @@unique([userId, classId, role])
  @@index([userId])
  @@index([classId])
  @@index([role])
  @@index([status])
}
```

### Layer 4: Users and Demographics

```prisma
// =============================================================================
// USER - Students, Teachers, Parents, Administrators
// =============================================================================

model User {
  id              String   @id @default(uuid())
  sourcedId       String   @unique  // OneRoster ID
  schoolId        String            // Primary school

  // Identity
  givenName       String            // First name (visible in PRIVACY_SAFE)
  familyName      String            // Last name (tokenized in PRIVACY_SAFE)
  middleName      String?

  // Role
  role            String            // student | teacher | parent | administrator | aide

  // Tokenized identifiers (generated on sync)
  token           String   @unique  // TKN_STU_XXXXX or TKN_TCH_XXXXX

  // Contact (tokenized for students)
  email           String?           // Real email (tokenized on output)
  phone           String?           // Real phone (tokenized on output)

  // Status
  status          String   @default("active")

  // Grade (students only)
  gradeLevel      String?           // "9", "10", etc.

  // Identifiers (internal - never exposed to vendors)
  sisId           String?           // Student Information System ID
  stateId         String?           // State student/teacher ID

  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  school          School @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  enrollments     Enrollment[]
  demographics    Demographics?

  @@index([schoolId])
  @@index([token])
  @@index([role])
  @@index([status])
  @@index([gradeLevel])
}

// =============================================================================
// DEMOGRAPHICS - Protected student information (SELECTIVE/FULL_ACCESS only)
// =============================================================================

model Demographics {
  id              String   @id @default(uuid())
  sourcedId       String   @unique  // OneRoster ID
  userId          String   @unique

  // Protected fields (FULL_ACCESS only)
  birthDate       DateTime?
  sex             String?           // male | female | non-binary | other

  // Race/Ethnicity (FULL_ACCESS only)
  americanIndianOrAlaskaNative Boolean @default(false)
  asian                        Boolean @default(false)
  blackOrAfricanAmerican       Boolean @default(false)
  hispanicOrLatinoEthnicity    Boolean @default(false)
  nativeHawaiianOrOtherPacificIslander Boolean @default(false)
  white                        Boolean @default(false)
  demographicRaceTwoOrMoreRaces Boolean @default(false)

  // Program eligibility (SELECTIVE+ only)
  freelunchstatus String?          // free | reduced | paid | unknown
  englishLanguageLearner Boolean @default(false)
  specialEducation Boolean @default(false)

  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  user            User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

### Layer 5: Vendor Access Scoping (THE KEY ADDITION)

```prisma
// =============================================================================
// VENDOR DATA GRANT - District-level access grant
// =============================================================================

model VendorDataGrant {
  id              String   @id @default(uuid())
  vendorId        String
  districtId      String

  // What entity types can they access?
  // JSON array: ["users", "classes", "enrollments", "academicSessions", "courses", "orgs"]
  allowedEntities String

  // What fields can they see? (Affects tokenization)
  accessTier      String   @default("PRIVACY_SAFE")
  // PRIVACY_SAFE: firstName, tokens, grade, classes
  // SELECTIVE: + lastName (first initial), program eligibility
  // FULL_ACCESS: + full lastName, demographics, contact info

  // Grant lifecycle
  status          String   @default("active")  // pending | active | suspended | expired | revoked
  grantedAt       DateTime @default(now())
  expiresAt       DateTime

  // Audit
  grantedBy       String?  // Admin who approved
  revokedBy       String?
  revokedAt       DateTime?
  revokeReason    String?

  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  vendor          Vendor @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  district        District @relation(fields: [districtId], references: [id], onDelete: Cascade)
  schoolGrants    VendorSchoolGrant[]

  @@unique([vendorId, districtId])
  @@index([vendorId])
  @@index([districtId])
  @@index([status])
  @@index([expiresAt])
}

// =============================================================================
// VENDOR SCHOOL GRANT - School-level access (the LAUSD feedback!)
// =============================================================================

model VendorSchoolGrant {
  id              String   @id @default(uuid())
  vendorGrantId   String
  schoolId        String

  // Timestamps
  createdAt       DateTime @default(now())

  // Relations
  vendorGrant     VendorDataGrant @relation(fields: [vendorGrantId], references: [id], onDelete: Cascade)
  school          School @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  @@unique([vendorGrantId, schoolId])
  @@index([vendorGrantId])
  @@index([schoolId])
}
```

---

## Access Control Flow

### Query: Vendor requests `/oneroster/users`

```
┌─────────────────────────────────────────────────────────────┐
│ 1. AUTHENTICATE                                             │
│    API Key → Vendor ID                                      │
│                                                             │
│ 2. CHECK GRANT                                              │
│    VendorDataGrant WHERE vendorId = ? AND status = 'active' │
│    → Get allowedEntities, accessTier                        │
│    → Reject if "users" not in allowedEntities               │
│                                                             │
│ 3. GET SCHOOL SCOPE                                         │
│    VendorSchoolGrant WHERE vendorGrantId = ?                │
│    → Get list of allowed school IDs                         │
│                                                             │
│ 4. QUERY USERS                                              │
│    SELECT * FROM User WHERE schoolId IN (allowed_schools)   │
│                                                             │
│ 5. APPLY TOKENIZATION (based on accessTier)                 │
│    PRIVACY_SAFE:                                            │
│      - id → token (TKN_STU_XXXXX)                           │
│      - givenName → as-is                                    │
│      - familyName → "[TOKENIZED]"                           │
│      - email → "{token}@relay.schoolday.lausd.net"          │
│    SELECTIVE:                                               │
│      - familyName → first initial + "[...]"                 │
│    FULL_ACCESS:                                             │
│      - All fields as-is                                     │
│                                                             │
│ 6. RETURN FILTERED, TOKENIZED RESPONSE                      │
└─────────────────────────────────────────────────────────────┘
```

---

## UI Integration: School Selection

During PoDS-Lite onboarding, add step for school selection:

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Select Schools                                     │
│                                                             │
│  Which LAUSD schools will use your application?             │
│                                                             │
│  ☐ Select All (670 schools)                                 │
│                                                             │
│  High Schools (87)                                          │
│  ├─ ☑ Abraham Lincoln High School                           │
│  ├─ ☑ Franklin D. Roosevelt High School                     │
│  ├─ ☐ John F. Kennedy High School                           │
│  └─ [Show 84 more...]                                       │
│                                                             │
│  Middle Schools (123)                                       │
│  └─ [Expand...]                                             │
│                                                             │
│  Elementary Schools (450)                                   │
│  └─ [Expand...]                                             │
│                                                             │
│  Selected: 2 schools (~2,400 students)                      │
│                                                             │
│  [Previous]                              [Next: Data Types] │
└─────────────────────────────────────────────────────────────┘
```

---

## Tokenization Layer

### Token Generation

```typescript
// Token format by role
const TOKEN_PREFIX = {
  student: 'TKN_STU_',
  teacher: 'TKN_TCH_',
  parent:  'TKN_PAR_',
  administrator: 'TKN_ADM_',
} as const;

// Deterministic token from real ID (one-way hash)
function generateToken(realId: string, role: UserRole): string {
  const hash = crypto
    .createHash('sha256')
    .update(realId + process.env.TOKEN_SALT)
    .digest('hex')
    .substring(0, 8)
    .toUpperCase();

  return `${TOKEN_PREFIX[role]}${hash}`;
}

// Token → Real ID mapping stored securely (never exposed to vendors)
model TokenMapping {
  token     String @id
  realId    String @unique
  role      String
  createdAt DateTime @default(now())

  @@index([realId])
}
```

### Field Tokenization Rules

| Field | PRIVACY_SAFE | SELECTIVE | FULL_ACCESS |
|-------|--------------|-----------|-------------|
| `sourcedId` | Token | Token | Token |
| `givenName` | As-is | As-is | As-is |
| `familyName` | `[TOKENIZED]` | `J[...]` | As-is |
| `email` | `{token}@relay...` | `{token}@relay...` | As-is |
| `phone` | Hidden | `TKN_555_XXX_1234` | As-is |
| `birthDate` | Hidden | Hidden | As-is |
| `demographics.*` | Hidden | Partial | As-is |

---

## Layer 6: SSO Integration

```prisma
// =============================================================================
// SSO SESSION - Active user sessions via SSO
// =============================================================================

model SsoSession {
  id              String   @id @default(uuid())
  vendorId        String
  userId          String            // Reference to User (student/teacher)

  // Session details
  sessionToken    String   @unique  // Opaque token for the session
  accessToken     String?           // OAuth access token (encrypted)
  refreshToken    String?           // OAuth refresh token (encrypted)
  idToken         String?           // OIDC ID token

  // Provider info
  ssoProvider     String            // SCHOOLDAY | CLEVER | CLASSLINK | GOOGLE
  providerUserId  String?           // User ID from the provider

  // Context (where did user launch from?)
  launchContextId String?

  // Lifecycle
  status          String   @default("active")  // active | expired | revoked
  createdAt       DateTime @default(now())
  expiresAt       DateTime
  lastActivityAt  DateTime @default(now())

  // Relations
  launchContext   SsoLaunchContext? @relation(fields: [launchContextId], references: [id])

  @@index([vendorId])
  @@index([userId])
  @@index([sessionToken])
  @@index([status])
  @@index([expiresAt])
}

// =============================================================================
// SSO LAUNCH CONTEXT - Where the user launched from
// =============================================================================

model SsoLaunchContext {
  id              String   @id @default(uuid())
  vendorId        String

  // What context?
  contextType     String            // class | school | district | resource
  contextId       String?           // ID of the class/school/resource

  // Additional context data
  returnUrl       String?           // Where to return after session
  customParams    String?           // JSON: Additional params from launch

  // Timestamps
  createdAt       DateTime @default(now())

  // Relations
  sessions        SsoSession[]

  @@index([vendorId])
  @@index([contextType, contextId])
}

// =============================================================================
// SSO USER MAPPING - Maps provider user ID to our User
// =============================================================================

model SsoUserMapping {
  id              String   @id @default(uuid())
  userId          String            // Our User.id
  ssoProvider     String            // SCHOOLDAY | CLEVER | CLASSLINK | GOOGLE
  providerUserId  String            // User ID from provider

  // Profile data from provider (cached)
  providerEmail   String?
  providerName    String?

  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  lastLoginAt     DateTime?

  @@unique([ssoProvider, providerUserId])
  @@unique([userId, ssoProvider])
  @@index([userId])
}
```

---

## Layer 7: LTI 1.3 Integration

```prisma
// =============================================================================
// LTI PLATFORM - LAUSD as an LTI Platform (the LMS side)
// =============================================================================

model LtiPlatform {
  id                String   @id @default(uuid())
  districtId        String

  // Platform identity
  name              String            // "LAUSD Schoology"
  issuer            String   @unique  // Platform issuer URL
  platformId        String?           // Platform-assigned ID

  // OIDC/OAuth endpoints
  authorizationUrl  String            // OIDC auth endpoint
  tokenUrl          String            // Token endpoint
  jwksUrl           String            // Platform's JWKS URL

  // Our keys (for this platform)
  clientId          String            // Our client ID on this platform
  publicKey         String            // Our public key (PEM)
  privateKey        String            // Our private key (PEM, encrypted)

  // Status
  status            String   @default("active")

  // Timestamps
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Relations
  deployments       LtiDeployment[]

  @@index([districtId])
  @@index([issuer])
}

// =============================================================================
// LTI DEPLOYMENT - Tool deployment per vendor on a platform
// =============================================================================

model LtiDeployment {
  id                String   @id @default(uuid())
  platformId        String
  vendorId          String

  // Deployment identity
  deploymentId      String            // LTI deployment ID

  // Tool configuration
  toolName          String            // Display name
  toolDescription   String?
  launchUrl         String            // Default launch URL
  deepLinkUrl       String?           // Deep linking URL
  iconUrl           String?

  // Capabilities
  supportsDeepLinking Boolean @default(true)
  supportsGradeSync    Boolean @default(false)
  supportsNrps         Boolean @default(true)  // Names & Roles

  // Status
  status            String   @default("active")

  // Timestamps
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Relations
  platform          LtiPlatform @relation(fields: [platformId], references: [id], onDelete: Cascade)
  resourceLinks     LtiResourceLink[]
  lineItems         LtiLineItem[]

  @@unique([platformId, deploymentId])
  @@index([vendorId])
  @@index([status])
}

// =============================================================================
// LTI RESOURCE LINK - Deep-linked content in a class
// =============================================================================

model LtiResourceLink {
  id                String   @id @default(uuid())
  deploymentId      String
  classId           String            // Which class this is linked to

  // Resource identity
  resourceLinkId    String            // LTI resource_link_id
  title             String            // Display title
  description       String?

  // Custom parameters
  customParams      String?           // JSON: custom params for launch

  // Timestamps
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Relations
  deployment        LtiDeployment @relation(fields: [deploymentId], references: [id], onDelete: Cascade)

  @@unique([deploymentId, resourceLinkId])
  @@index([classId])
}

// =============================================================================
// LTI LINE ITEM - Grade passback container (Assignment Grades Services)
// =============================================================================

model LtiLineItem {
  id                String   @id @default(uuid())
  deploymentId      String
  classId           String            // Which class

  // Line item identity
  lineItemId        String?           // Platform-assigned ID (after creation)
  resourceLinkId    String?           // Associated resource link

  // Assignment details
  label             String            // "Chapter 1 Quiz"
  scoreMaximum      Float             // Max possible score
  tag               String?           // Optional tag for grouping

  // Timestamps
  startDateTime     DateTime?
  endDateTime       DateTime?

  // Sync status
  syncStatus        String   @default("pending")  // pending | synced | error
  lastSyncAt        DateTime?
  syncError         String?

  // Timestamps
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Relations
  deployment        LtiDeployment @relation(fields: [deploymentId], references: [id], onDelete: Cascade)
  grades            LtiGrade[]

  @@index([deploymentId])
  @@index([classId])
  @@index([syncStatus])
}

// =============================================================================
// LTI GRADE - Individual student grade for a line item
// =============================================================================

model LtiGrade {
  id                String   @id @default(uuid())
  lineItemId        String
  userId            String            // Student user ID

  // Score
  scoreGiven        Float?            // Actual score
  scoreMaximum      Float             // Max at time of grading
  activityProgress  String   @default("Completed")  // Initialized | Started | InProgress | Submitted | Completed
  gradingProgress   String   @default("FullyGraded") // FullyGraded | Pending | PendingManual | Failed | NotReady

  // Comment
  comment           String?

  // Sync status
  syncStatus        String   @default("pending")  // pending | synced | error
  lastSyncAt        DateTime?
  syncError         String?

  // Timestamps
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Relations
  lineItem          LtiLineItem @relation(fields: [lineItemId], references: [id], onDelete: Cascade)

  @@unique([lineItemId, userId])
  @@index([userId])
  @@index([syncStatus])
}

// =============================================================================
// LTI LAUNCH - Record of each LTI launch (for debugging/audit)
// =============================================================================

model LtiLaunch {
  id                String   @id @default(uuid())
  deploymentId      String
  userId            String?           // User who launched (if known)

  // Launch details
  messageType       String            // LtiResourceLinkRequest | LtiDeepLinkingRequest
  targetLinkUri     String
  resourceLinkId    String?
  contextId         String?           // Class/course context

  // Claims (key data from JWT)
  roles             String?           // JSON array of roles
  customClaims      String?           // JSON of custom claims

  // Result
  status            String   @default("success")  // success | error
  errorMessage      String?

  // Timestamps
  launchedAt        DateTime @default(now())

  @@index([deploymentId])
  @@index([userId])
  @@index([launchedAt])
}
```

---

## Layer 8: Communication (CPaaS) Integration

```prisma
// =============================================================================
// MESSAGE TEMPLATE - Reusable message templates
// =============================================================================

model MessageTemplate {
  id              String   @id @default(uuid())
  vendorId        String
  districtId      String?           // District-specific or null for vendor default

  // Template details
  name            String            // "Welcome Message", "Assignment Reminder"
  channel         String            // EMAIL | SMS | PUSH | IN_APP
  category        String            // welcome | reminder | alert | announcement

  // Content
  subject         String?           // For email
  bodyTemplate    String            // Template with {{placeholders}}

  // Placeholders available
  // {{student.firstName}}, {{teacher.firstName}}, {{class.title}}, {{school.name}}

  // Settings
  isActive        Boolean  @default(true)
  requiresApproval Boolean @default(false)  // Needs admin approval before send?

  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([vendorId, name])
  @@index([vendorId])
  @@index([districtId])
  @@index([channel])
  @@index([category])
}

// =============================================================================
// CONTACT PREFERENCE - Parent/Guardian communication preferences
// =============================================================================

model ContactPreference {
  id              String   @id @default(uuid())
  userId          String            // Parent/Guardian user ID
  studentId       String            // Which student this preference is for

  // Channel preferences
  emailEnabled    Boolean  @default(true)
  smsEnabled      Boolean  @default(false)
  pushEnabled     Boolean  @default(false)
  inAppEnabled    Boolean  @default(true)

  // Contact info (verified)
  emailAddress    String?
  emailVerified   Boolean  @default(false)
  phoneNumber     String?
  phoneVerified   Boolean  @default(false)

  // Category preferences (what types of messages?)
  categoriesEnabled String  @default("[]")  // JSON array: ["reminder", "alert", "announcement"]

  // Quiet hours
  quietHoursStart String?           // "22:00"
  quietHoursEnd   String?           // "07:00"
  timezone        String   @default("America/Los_Angeles")

  // Language
  preferredLanguage String @default("en")

  // Consent
  consentGivenAt  DateTime?
  consentMethod   String?           // online_form | paper | phone

  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([userId, studentId])
  @@index([userId])
  @@index([studentId])
}

// =============================================================================
// MESSAGE BATCH - Scheduled batch message sends
// =============================================================================

model MessageBatch {
  id              String   @id @default(uuid())
  vendorId        String
  templateId      String?           // Optional: from template

  // Target
  channel         String            // EMAIL | SMS | PUSH | IN_APP
  recipientType   String            // STUDENT | PARENT | TEACHER

  // Targeting criteria (JSON)
  targetCriteria  String            // {"schools": [...], "grades": [...], "classes": [...]}

  // Content
  subject         String?
  body            String

  // Schedule
  scheduledAt     DateTime?         // null = send immediately

  // Status
  status          String   @default("draft")  // draft | scheduled | sending | sent | cancelled | failed

  // Stats
  totalRecipients Int      @default(0)
  sentCount       Int      @default(0)
  deliveredCount  Int      @default(0)
  failedCount     Int      @default(0)

  // Processing
  startedAt       DateTime?
  completedAt     DateTime?
  errorMessage    String?

  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  messages        CommunicationMessage[]

  @@index([vendorId])
  @@index([status])
  @@index([scheduledAt])
}

// =============================================================================
// COMMUNICATION MESSAGE - Updated to link to batches
// =============================================================================

// Note: Extends existing CommunicationMessage model
// Add these fields:
//   batchId         String?           // If part of a batch
//   templateId      String?           // If from template
//   parentUserId    String?           // Parent who receives (for student messages)
//   metadata        String?           // JSON: additional tracking data
```

---

## Layer 9: Parent/Guardian Relationships

```prisma
// =============================================================================
// PARENT GUARDIAN - Parent/Guardian users and their relationships
// =============================================================================

model ParentGuardian {
  id              String   @id @default(uuid())
  sourcedId       String   @unique  // OneRoster ID

  // Identity
  givenName       String
  familyName      String
  token           String   @unique  // TKN_PAR_XXXXX

  // Contact (real, tokenized on output)
  email           String?
  phone           String?

  // Status
  status          String   @default("active")

  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  studentRelationships ParentStudentRelationship[]
  contactPreferences   ContactPreference[]

  @@index([token])
  @@index([status])
}

// =============================================================================
// PARENT STUDENT RELATIONSHIP - Links parents to students
// =============================================================================

model ParentStudentRelationship {
  id              String   @id @default(uuid())
  parentId        String
  studentId       String            // User.id where role = 'student'

  // Relationship type
  relationshipType String           // mother | father | guardian | grandparent | other
  isPrimary       Boolean  @default(false)  // Primary contact?

  // Permissions
  canViewGrades   Boolean  @default(true)
  canViewAttendance Boolean @default(true)
  canReceiveAlerts Boolean @default(true)
  canPickup       Boolean  @default(false)  // Emergency pickup authorized

  // Custody/Legal
  hasCustody      Boolean  @default(true)
  legalRestrictions String?          // Any legal notes

  // Verification
  verifiedAt      DateTime?
  verifiedBy      String?           // Admin who verified

  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  parent          ParentGuardian @relation(fields: [parentId], references: [id], onDelete: Cascade)

  @@unique([parentId, studentId])
  @@index([studentId])
  @@index([isPrimary])
}
```

---

## Complete Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           COMPLETE DATA MODEL                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  VENDOR PORTAL                    DISTRICT DATA                              │
│  ─────────────                    ─────────────                              │
│  ┌──────────┐                     ┌──────────┐                               │
│  │  Vendor  │────────────────────▶│ District │                               │
│  └────┬─────┘    VendorDataGrant  └────┬─────┘                               │
│       │                                │                                     │
│       │                                ▼                                     │
│       │                          ┌──────────┐                                │
│       │    VendorSchoolGrant     │  School  │◀─┐                             │
│       │         │                └────┬─────┘  │                             │
│       │         │                     │        │                             │
│       │         ▼                     ▼        │                             │
│       │    ┌─────────┐          ┌─────────┐   │                             │
│       │    │ Schools │          │  Users  │───┤ (multi-school)              │
│       │    │ Allowed │          └────┬────┘   │                             │
│       │    └─────────┘               │        │                             │
│       │                              ▼        │                             │
│       │                         ┌─────────┐   │                             │
│       │                         │  Class  │───┘                             │
│       │                         └────┬────┘                                  │
│       │                              │                                       │
│       │                              ▼                                       │
│       │                        ┌───────────┐                                │
│       │                        │Enrollment │                                │
│       │                        └───────────┘                                │
│       │                                                                      │
│  INTEGRATIONS                                                                │
│  ────────────                                                                │
│       │                                                                      │
│       ├──▶ SSO                                                               │
│       │    ├── SsoSession                                                    │
│       │    ├── SsoLaunchContext                                              │
│       │    └── SsoUserMapping                                                │
│       │                                                                      │
│       ├──▶ LTI 1.3                                                           │
│       │    ├── LtiPlatform (LAUSD Schoology)                                 │
│       │    ├── LtiDeployment                                                 │
│       │    ├── LtiResourceLink                                               │
│       │    ├── LtiLineItem                                                   │
│       │    ├── LtiGrade                                                      │
│       │    └── LtiLaunch                                                     │
│       │                                                                      │
│       ├──▶ OneRoster (via VendorDataGrant)                                   │
│       │    └── Scoped by schools + entity types                              │
│       │                                                                      │
│       └──▶ CPaaS                                                             │
│            ├── MessageTemplate                                               │
│            ├── ContactPreference                                             │
│            ├── MessageBatch                                                  │
│            └── CommunicationMessage                                          │
│                                                                              │
│  RELATIONSHIPS                                                               │
│  ─────────────                                                               │
│       ┌────────────────┐         ┌─────────┐                                │
│       │ ParentGuardian │────────▶│ Student │                                │
│       └────────────────┘         └─────────┘                                │
│              via ParentStudentRelationship                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Integration Flow Examples

### SSO Login Flow

```
1. User clicks "Login with Clever" in vendor app
2. Redirect to Clever OAuth
3. Clever redirects back with auth code
4. Exchange code for tokens
5. Look up SsoUserMapping by (provider, providerUserId)
6. Create SsoSession with context
7. Return session token to vendor
8. Vendor uses session for API calls
```

### LTI Launch Flow

```
1. Teacher clicks tool link in Schoology
2. Schoology POSTs LTI launch JWT
3. Validate JWT signature via LtiPlatform.jwksUrl
4. Look up LtiDeployment by (platform, deploymentId)
5. Create LtiLaunch record
6. Extract user from claims, map to our User
7. Extract class context from claims
8. Redirect to vendor's launch URL with session
```

### Grade Passback Flow

```
1. Student completes assignment in vendor app
2. Vendor calls POST /api/lti/grades
3. Look up LtiLineItem for this assignment
4. Create/update LtiGrade record
5. Background job syncs to platform:
   - POST to platform's lineitem endpoint
   - Update syncStatus and lastSyncAt
6. Return success to vendor
```

### Batch Message Flow

```
1. Vendor creates MessageBatch via API
2. Set targetCriteria: {"schools": ["ALHS"], "grades": ["9"]}
3. Schedule for 3pm
4. At 3pm, background job:
   - Query users matching criteria
   - Look up ContactPreference for each parent
   - Filter by channel preferences and quiet hours
   - Create CommunicationMessage for each
   - Send via provider (Twilio/SendGrid)
   - Update delivery status
```

---

## Migration Strategy

### Phase 1: Schema Addition (No Breaking Changes)
1. Add new models to Prisma schema
2. Run migration
3. Seed with LAUSD structure (5 demo schools)

### Phase 2: Synthetic Data Migration
1. Update synthetic.ts to use new models
2. Generate data into database instead of memory
3. OneRoster API reads from database

### Phase 3: Access Scoping Integration
1. Update PoDS-Lite form with school selection
2. Create VendorDataGrant on approval
3. Filter API responses by school grants

### Phase 4: Production Data Sync
1. Build SIS sync adapter (LAUSD uses ?)
2. Incremental sync with change detection
3. Token regeneration handling

---

## Extensibility Considerations

### Multi-District Support

```prisma
// Each district has its own:
// - Schools
// - Academic sessions
// - Courses
// - Users

// A vendor can have grants to multiple districts
Vendor
  └── VendorDataGrant (District A)
  │     └── VendorSchoolGrant (Schools 1, 2, 3)
  └── VendorDataGrant (District B)
        └── VendorSchoolGrant (Schools X, Y)
```

### Custom Fields (Future)

```prisma
// District-specific custom fields
model CustomField {
  id          String @id
  districtId  String
  entityType  String  // user | class | enrollment
  fieldName   String
  fieldType   String  // string | number | boolean | date
  isRequired  Boolean

  @@unique([districtId, entityType, fieldName])
}

model CustomFieldValue {
  id            String @id
  customFieldId String
  entityId      String
  value         String
}
```

---

## Open Questions

1. **Parent/Guardian Relationships**: How to model parent-student relationships? Separate `ParentGuardian` model or role in `User`?

2. **Multi-School Students**: Some students attend multiple schools (e.g., magnet programs). How to handle?

3. **Historical Data**: Do vendors need access to previous year data? How long to retain?

4. **Real-Time vs. Batch**: OneRoster supports delta sync. Do we need real-time updates?

5. **LAUSD-Specific Requirements**: What SIS does LAUSD use? Are there custom fields we need?

---

## Next Steps

1. [ ] Review this design with stakeholders
2. [ ] Answer open questions
3. [ ] Create Prisma migration
4. [ ] Update synthetic data generator
5. [ ] Implement school selection in PoDS-Lite form
6. [ ] Update OneRoster API to use database + scoping

---

*This document is a living design. Update as requirements evolve.*
