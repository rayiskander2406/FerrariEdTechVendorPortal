# Sandbox Planning - All Data Exchange Methods

**Created**: November 29, 2025
**Status**: Planning

This document outlines all sandbox environments needed to support the full spectrum of K-12 EdTech data exchange methods.

---

## Overview

| # | Sandbox Type | Protocol | Status | Priority | Effort |
|---|--------------|----------|--------|----------|--------|
| 1 | OneRoster REST API | HTTP/REST | ✅ Implemented | - | - |
| 2 | CSV over HTTP | HTTP GET/POST | 📋 Planned | P1 | S |
| 3 | CSV over SFTP | SFTP | 📋 Planned | P1 | M |
| 4 | Ed-Fi API | HTTP/REST | 📋 Planned | P2 | M |
| 5 | GraphQL API | HTTP/GraphQL | 📋 Planned | P2 | M |
| 6 | xAPI (Learning Analytics) | HTTP/REST | 📋 Planned | P3 | M |
| 7 | Caliper Analytics | HTTP/REST | 📋 Planned | P3 | S |
| 8 | SIF (Legacy) | XML/SOAP | 📋 Planned | P4 | L |
| 9 | QTI (Assessments) | XML | 📋 Planned | P4 | M |
| 10 | CASE (Standards) | HTTP/REST | 📋 Planned | P4 | S |

---

## 1. OneRoster REST API ✅

**Status**: Implemented

**Endpoints**: `/api/sandbox/oneroster/[...path]`

| Endpoint | Description |
|----------|-------------|
| `/users` | Students and teachers (tokenized) |
| `/orgs` | Schools and district |
| `/classes` | Class sections |
| `/enrollments` | Student-class relationships |
| `/courses` | Course catalog |
| `/academicSessions` | Terms, semesters, grading periods |
| `/demographics` | Student demographics (tokenized) |

**Data**: 5 schools, 6,600 synthetic students, fully tokenized PII.

---

## 2. CSV over HTTP 📋

**Priority**: P1 (High) - Many vendors prefer bulk CSV downloads

### Why It Matters
- Simpler than APIs for batch operations
- Legacy systems often only support CSV
- Useful for initial data loads and nightly syncs
- Excel-friendly for non-technical users

### Proposed Endpoints

```
GET /api/sandbox/csv/users.csv
GET /api/sandbox/csv/orgs.csv
GET /api/sandbox/csv/classes.csv
GET /api/sandbox/csv/enrollments.csv
GET /api/sandbox/csv/courses.csv
GET /api/sandbox/csv/demographics.csv

POST /api/sandbox/csv/upload  (for testing inbound CSV)
```

### Query Parameters

```
?format=oneroster|custom
?encoding=utf-8|windows-1252
?delimiter=comma|tab|pipe
?include_header=true|false
?date_format=iso|us|european
```

### Sample Output (users.csv)

```csv
sourcedId,status,dateLastModified,enabledUser,orgSourcedIds,role,username,givenName,familyName,email
TKN_STU_A1B2C3D4,active,2024-01-15T10:30:00Z,true,TKN_ORG_SCHOOL1,student,TKN_STU_A1B2C3D4,Maria,[TOKENIZED],TKN_STU_A1B2C3D4@relay.schoolday.lausd.net
```

### Implementation Notes
- Reuse existing synthetic data generator
- Stream large files (don't load all in memory)
- Support Content-Disposition for downloads
- Validate inbound CSV against OneRoster schema

### Effort: Small (1 day)
- Leverage existing `/api/sandbox/oneroster` data
- Add CSV serialization layer

---

## 3. CSV over SFTP 📋

**Priority**: P1 (High) - Required for SIS integrations

### Why It Matters
- Many SIS systems (PowerSchool, Infinite Campus) use SFTP
- Nightly batch syncs are industry standard
- Required for air-gapped or legacy systems
- Compliance teams prefer file-based for audit trails

### Architecture Options

**Option A: Mock SFTP Server (Recommended)**
```
Host: sftp-sandbox.schoolday.lausd.net
Port: 22
Protocol: SFTP (SSH File Transfer)
```

**Option B: SFTP-over-WebSocket Simulator**
```
Endpoint: wss://sandbox.schoolday.lausd.net/sftp-sim
Use case: Browser-based testing without real SFTP client
```

### Directory Structure

```
/outbound/
  └── daily/
      ├── users_20241129.csv
      ├── orgs_20241129.csv
      ├── classes_20241129.csv
      └── enrollments_20241129.csv
/inbound/
  └── uploads/
      └── (vendor uploads for validation)
/archive/
  └── 2024/
      └── 11/
          └── (historical files)
```

### Credentials

```
Username: vendor_{vendor_id}
Password: Auto-generated, rotated daily
SSH Key: Optional, vendor-provided public key
```

### Implementation Notes
- Use `ssh2` npm package for SFTP server
- Generate daily CSV files from synthetic data
- Timestamp files for delta sync testing
- Log all file access for audit

### Effort: Medium (2-3 days)
- SFTP server setup
- Credential management
- File generation scheduling

---

## 4. Ed-Fi API 📋

**Priority**: P2 (Medium) - Growing standard, Texas-required

### Why It Matters
- Texas mandates Ed-Fi for state reporting
- Growing adoption in other states (WI, NE, AZ)
- More comprehensive than OneRoster
- Handles assessments, attendance, discipline

### Ed-Fi vs OneRoster

| Aspect | OneRoster | Ed-Fi |
|--------|-----------|-------|
| Focus | Rostering | Full SIS data |
| Complexity | Simple | Complex |
| Adoption | Wide | Growing |
| Assessment data | No | Yes |
| Attendance | No | Yes |
| Discipline | No | Yes |

### Proposed Endpoints

```
# Descriptors (reference data)
GET /api/sandbox/edfi/ed-fi/descriptors

# Core Resources
GET /api/sandbox/edfi/ed-fi/students
GET /api/sandbox/edfi/ed-fi/staff
GET /api/sandbox/edfi/ed-fi/schools
GET /api/sandbox/edfi/ed-fi/sections
GET /api/sandbox/edfi/ed-fi/studentSectionAssociations

# Extended Resources
GET /api/sandbox/edfi/ed-fi/studentSchoolAttendanceEvents
GET /api/sandbox/edfi/ed-fi/grades
GET /api/sandbox/edfi/ed-fi/studentAssessments
```

### Ed-Fi Data Model Sample

```json
{
  "studentUniqueId": "TKN_STU_A1B2C3D4",
  "birthDate": "2010-05-15",
  "firstName": "Maria",
  "lastSurname": "[TOKENIZED]",
  "sexDescriptor": "uri://ed-fi.org/SexDescriptor#Female",
  "birthSexDescriptor": "uri://ed-fi.org/SexDescriptor#Female",
  "hispanicLatinoEthnicity": true,
  "races": [
    {
      "raceDescriptor": "uri://ed-fi.org/RaceDescriptor#White"
    }
  ]
}
```

### Implementation Notes
- Ed-Fi uses URIs for enumerations (descriptors)
- Composite resources require ODS/API patterns
- Support `$filter`, `$orderby` query parameters
- Need to map synthetic data to Ed-Fi schema

### Effort: Medium (3-4 days)
- Schema mapping from synthetic data
- Descriptor reference data
- Ed-Fi-specific query patterns

---

## 5. GraphQL API 📋

**Priority**: P2 (Medium) - Modern alternative, developer-friendly

### Why It Matters
- Single endpoint, flexible queries
- Reduces over-fetching (get only what you need)
- Strong typing with schema introspection
- Growing preference among modern EdTech vendors

### Proposed Schema

```graphql
type Query {
  # Users
  students(schoolId: ID, grade: Int, limit: Int): [Student!]!
  student(id: ID!): Student
  teachers(schoolId: ID, limit: Int): [Teacher!]!
  teacher(id: ID!): Teacher

  # Organizations
  schools(limit: Int): [School!]!
  school(id: ID!): School
  district: District!

  # Classes
  classes(schoolId: ID, teacherId: ID, limit: Int): [Class!]!
  class(id: ID!): Class

  # Enrollments
  enrollments(classId: ID, studentId: ID): [Enrollment!]!
}

type Student {
  id: ID!
  givenName: String!
  familyName: String!  # Always "[TOKENIZED]"
  email: String!       # Tokenized relay address
  grade: Int!
  school: School!
  classes: [Class!]!
  enrollments: [Enrollment!]!
}

type Class {
  id: ID!
  title: String!
  subject: String!
  school: School!
  teachers: [Teacher!]!
  students(limit: Int): [Student!]!
  enrollmentCount: Int!
}
```

### Example Queries

```graphql
# Get students with their classes
query {
  students(schoolId: "TKN_ORG_SCHOOL1", limit: 10) {
    id
    givenName
    grade
    classes {
      title
      subject
    }
  }
}

# Get class with enrollment count
query {
  class(id: "TKN_CLS_MATH101") {
    title
    enrollmentCount
    teachers {
      givenName
    }
  }
}
```

### Implementation Notes
- Use `graphql-yoga` or `apollo-server`
- Implement DataLoader for N+1 prevention
- Add query complexity limits
- Support subscriptions for real-time (future)

### Effort: Medium (2-3 days)
- Schema definition
- Resolver implementation
- Query complexity limiting

---

## 6. xAPI (Experience API) 📋

**Priority**: P3 (Lower) - Learning analytics standard

### Why It Matters
- Tracks learning experiences across platforms
- "Learner did X with Y" statements
- Enables learning analytics dashboards
- Required for some assessment vendors

### xAPI Statement Format

```json
{
  "actor": {
    "mbox": "mailto:TKN_STU_A1B2C3D4@relay.schoolday.lausd.net",
    "name": "Maria [TOKENIZED]"
  },
  "verb": {
    "id": "http://adlnet.gov/expapi/verbs/completed",
    "display": { "en-US": "completed" }
  },
  "object": {
    "id": "https://vendor.com/activities/math-lesson-1",
    "definition": {
      "name": { "en-US": "Math Lesson 1: Fractions" },
      "type": "http://adlnet.gov/expapi/activities/lesson"
    }
  },
  "result": {
    "score": { "scaled": 0.85 },
    "completion": true,
    "success": true
  },
  "timestamp": "2024-11-29T14:30:00Z"
}
```

### Proposed Endpoints

```
POST /api/sandbox/xapi/statements      # Store statements
GET  /api/sandbox/xapi/statements      # Query statements
GET  /api/sandbox/xapi/statements/{id} # Get specific statement
PUT  /api/sandbox/xapi/statements      # Store with specific ID
GET  /api/sandbox/xapi/activities      # Activity metadata
GET  /api/sandbox/xapi/agents          # Agent (learner) profiles
```

### Implementation Notes
- Follow ADL xAPI spec strictly
- Support statement batching
- Implement voiding statements
- Add LRS (Learning Record Store) basics

### Effort: Medium (2-3 days)

---

## 7. Caliper Analytics 📋

**Priority**: P3 (Lower) - IMS Global analytics standard

### Why It Matters
- IMS Global standard (same org as LTI)
- Integrates well with LTI tools
- Growing in higher ed, spreading to K-12
- Simpler than xAPI

### Caliper Event Format

```json
{
  "@context": "http://purl.imsglobal.org/ctx/caliper/v1p2",
  "type": "NavigationEvent",
  "actor": {
    "id": "urn:uuid:TKN_STU_A1B2C3D4",
    "type": "Person"
  },
  "action": "NavigatedTo",
  "object": {
    "id": "https://vendor.com/page/math-lesson-1",
    "type": "WebPage"
  },
  "eventTime": "2024-11-29T14:30:00Z"
}
```

### Proposed Endpoints

```
POST /api/sandbox/caliper/events  # Send events (envelope)
GET  /api/sandbox/caliper/events  # Query events (non-standard, for testing)
```

### Effort: Small (1 day)
- Simpler than xAPI
- Fewer endpoint variations

---

## 8. SIF (Schools Interoperability Framework) 📋

**Priority**: P4 (Low) - Legacy, declining usage

### Why It Matters
- Still used by some legacy SIS systems
- Required for certain state reporting
- Declining but not dead

### SIF Characteristics
- XML-based
- SOAP or REST variants
- Zone-based architecture
- Agent model (push/pull)

### Sample SIF Student

```xml
<sif:StudentPersonal RefId="TKN_STU_A1B2C3D4">
  <sif:LocalId>12345</sif:LocalId>
  <sif:Name Type="04">
    <sif:FirstName>Maria</sif:FirstName>
    <sif:LastName>[TOKENIZED]</sif:LastName>
  </sif:Name>
  <sif:Demographics>
    <sif:Gender>F</sif:Gender>
  </sif:Demographics>
</sif:StudentPersonal>
```

### Implementation Notes
- XML serialization from synthetic data
- Support SIF 3.x (REST) primarily
- Zone/agent concepts for advanced testing

### Effort: Large (4-5 days)
- Complex spec
- XML handling
- Limited modern tooling

---

## 9. QTI (Question and Test Interoperability) 📋

**Priority**: P4 (Low) - Assessment-specific

### Why It Matters
- Standard for assessment content exchange
- Required for assessment vendors (IXL, NWEA, etc.)
- Enables test item sharing

### QTI Item Sample

```xml
<assessmentItem identifier="item001" title="Math Question">
  <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="identifier">
    <correctResponse>
      <value>ChoiceA</value>
    </correctResponse>
  </responseDeclaration>
  <itemBody>
    <choiceInteraction responseIdentifier="RESPONSE" maxChoices="1">
      <prompt>What is 2 + 2?</prompt>
      <simpleChoice identifier="ChoiceA">4</simpleChoice>
      <simpleChoice identifier="ChoiceB">5</simpleChoice>
    </choiceInteraction>
  </itemBody>
</assessmentItem>
```

### Implementation Notes
- Focus on QTI 2.2 (most common)
- Provide sample item bank
- Support import/export validation

### Effort: Medium (2-3 days)

---

## 10. CASE (Competency and Academic Standards Exchange) 📋

**Priority**: P4 (Low) - Standards alignment

### Why It Matters
- Exchange academic standards (CCSS, NGSS, state standards)
- Enables curriculum alignment
- Growing requirement for curriculum vendors

### CASE Framework Sample

```json
{
  "CFDocument": {
    "identifier": "urn:case:lausd:math:k-5",
    "title": "LAUSD K-5 Mathematics Standards",
    "creator": "Los Angeles Unified School District"
  },
  "CFItems": [
    {
      "identifier": "urn:case:lausd:math:k:counting",
      "fullStatement": "Count to 100 by ones and by tens",
      "humanCodingScheme": "K.CC.A.1"
    }
  ]
}
```

### Implementation Notes
- Provide LAUSD-specific standards framework
- Support CCSS and CA state standards
- Read-only sandbox (standards don't change)

### Effort: Small (1 day)
- Mostly static data
- Simple REST endpoints

---

## Implementation Roadmap

### Phase 1: Bulk Data (P1) - Week 1
- [ ] CSV over HTTP
- [ ] CSV over SFTP

### Phase 2: Modern APIs (P2) - Week 2-3
- [ ] Ed-Fi API
- [ ] GraphQL API

### Phase 3: Learning Analytics (P3) - Week 4
- [ ] xAPI
- [ ] Caliper

### Phase 4: Legacy & Specialized (P4) - Future
- [ ] SIF
- [ ] QTI
- [ ] CASE

---

## Shared Infrastructure

All sandboxes will share:

1. **Synthetic Data Generator** - Already built, tokenized PII
2. **Authentication** - API keys from `provision_sandbox`
3. **Rate Limiting** - Consistent across all endpoints
4. **Audit Logging** - All access logged
5. **Credential Rotation** - 90-day expiration

---

## New AI Tools Required

| Tool | Sandbox | Purpose |
|------|---------|---------|
| `test_csv_download` | CSV/HTTP | Download sample CSV |
| `test_sftp_connection` | CSV/SFTP | Verify SFTP credentials |
| `test_edfi` | Ed-Fi | Test Ed-Fi API call |
| `test_graphql` | GraphQL | Execute GraphQL query |
| `test_xapi` | xAPI | Send xAPI statement |

---

## Questions for Planning

1. **SFTP hosting**: Self-hosted vs managed service (AWS Transfer Family)?
2. **Ed-Fi version**: 5.x (latest) or 3.x (most deployed)?
3. **GraphQL subscriptions**: Real-time updates needed?
4. **xAPI LRS**: Full LRS or statement endpoint only?
5. **SIF**: Worth the effort given declining usage?

---

*This document should be updated as requirements become clearer.*
