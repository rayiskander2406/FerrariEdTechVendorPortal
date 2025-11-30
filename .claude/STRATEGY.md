# STRATEGY - SchoolDay Integration Platform

**Last Updated**: November 29, 2025
**Document Type**: Strategic Foundation ("True North")
**Status**: APPROVED

---

## Mission Statement

> **Disrupt Clever and become the dominant K-12 integration platform by delivering what vendors actually need—comprehensive data access with privacy-first design—while maintaining full backward compatibility.**

---

## Table of Contents

1. [The Problem We're Solving](#the-problem-were-solving)
2. [Market Analysis](#market-analysis)
3. [Data Model Strategy](#data-model-strategy)
4. [SSO Strategy](#sso-strategy)
5. [Competitive Positioning](#competitive-positioning)
6. [EdTech Credit Bureau: The Strategic Moat](#edtech-credit-bureau-the-strategic-moat)
7. [Technical Architecture](#technical-architecture)
8. [Decision Log](#decision-log)

---

## The Problem We're Solving

### The Vendor's Pain

EdTech vendors are frustrated. They need data that current standards don't provide:

| What Vendors Request | OneRoster Provides | Ed-Fi Provides |
|----------------------|-------------------|----------------|
| Attendance data | ❌ No | ✅ Yes |
| Discipline/Behavior | ❌ No | ✅ Yes |
| Special Education (IEPs) | ❌ No | ✅ Yes |
| Section 504 Plans | ❌ No | ✅ Yes |
| Detailed Assessments | ❌ Basic only | ✅ Comprehensive |
| Staff/Teacher data | ❌ No | ✅ Yes |
| Interventions | ❌ No | ✅ Yes |
| Bell Schedules | ❌ No | ✅ Yes |
| Transportation | ❌ No | ✅ Yes |

> "1EdTech designed OneRoster to share class rosters, course materials, and grades. Even though SIS providers store many other types of data... OneRoster isn't designed to work with these fields."
> — 1EdTech Documentation

### The District's Pain

Districts face a fragmented landscape:
- Multiple systems (SIS, LMS, HR, Assessment, SpEd)
- Each vendor wants different data in different formats
- Privacy compliance is manual and error-prone
- Onboarding vendors takes weeks, not minutes

### The Market's Pain

Clever dominates (65% of US K-12) not because of superior technology, but because:
- They got to schools first (free for districts)
- Network effects created vendor lock-in
- There's no viable alternative with comprehensive data

**The opportunity**: Build the platform vendors actually need, with the data model that addresses their real requirements, while maintaining Clever compatibility for seamless migration.

---

## Market Analysis

### Current Landscape

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    K-12 INTEGRATION MARKET MAP                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  DATA SCOPE           NARROW ◄──────────────────────────► COMPREHENSIVE    │
│                           │                                    │            │
│                           │                                    │            │
│                    ┌──────┴──────┐                      ┌──────┴──────┐    │
│                    │   Clever    │                      │   Ed-Fi     │    │
│                    │   OneRoster │                      │   Alliance  │    │
│                    │             │                      │             │    │
│                    │ • Rostering │                      │ • 16+ domains│   │
│                    │ • SSO       │                      │ • CEDS-aligned│  │
│                    │ • Basic     │                      │ • State      │   │
│                    │   grades    │                      │   mandated   │   │
│                    └─────────────┘                      └─────────────┘    │
│                           │                                    │            │
│                           │                                    │            │
│                    ┌──────┴──────┐                      ┌──────┴──────┐    │
│                    │  ClassLink  │                      │  SchoolDay  │    │
│                    │             │                      │  (Target)   │    │
│                    │ • SSO focus │                      │             │    │
│                    │ • Analytics │                      │ • Ed-Fi core│    │
│                    │ • Bridge to │                      │ • All proto-│    │
│                    │   Ed-Fi     │                      │   cols      │    │
│                    └─────────────┘                      │ • Privacy   │    │
│                                                         │   first     │    │
│                                                         └─────────────┘    │
│                                                                             │
│  ADOPTION        HIGH FRICTION ◄───────────────────────► LOW FRICTION      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Players

| Player | Districts | Students | Model | Data Scope |
|--------|-----------|----------|-------|------------|
| **Clever** | 13,000+ (65%) | 20M+ | Vendors pay | Narrow (roster + SSO) |
| **ClassLink** | 2,000+ | 17M | Districts pay | Medium (+ analytics) |
| **Edlink** | 2,200 inst. | 25M | Vendors pay/user | Medium (SIS + LMS) |
| **Ed-Fi** | Hundreds | Millions | Open source | Comprehensive |
| **SchoolDay** | Target: 1,000+ | Target: 15M+ | Free + premium | Comprehensive + privacy |

### Why Clever Dominates

1. **First Mover Advantage**: Free for schools since 2012
2. **Network Effects**: 800+ apps → schools need Clever → more apps integrate
3. **Vendor Lock-in**: $16-19/school/month creates switching costs
4. **Good Enough**: For basic rostering, it works

### Why Clever Is Vulnerable

1. **Limited Data**: Can't meet growing vendor demands
2. **PII Exposure**: No tokenization, privacy is afterthought
3. **Vendor Resentment**: High fees, limited value
4. **State Mandates**: Ed-Fi requirements bypass Clever
5. **No LMS Connection**: Misses half the data ecosystem

---

## Data Model Strategy

### The Core Decision

> **We adopt Ed-Fi Unifying Data Model as our internal canonical data model, while exposing multiple protocol layers (OneRoster, Clever-compatible, GraphQL) for external compatibility.**

### Why Ed-Fi?

#### Comprehensive Coverage

Ed-Fi's Unifying Data Model includes **16+ domains** and **59 entities**:

**Core Domains**:
- Student Identification and Demographics
- Enrollment
- Student Attendance (daily + section)
- Discipline (incidents, actions)
- Student Academic Record
- Assessment (comprehensive)
- Teaching and Learning
- Staff
- Education Organization

**Extended Domains**:
- Alternative/Supplemental Services (Special Ed, Title I, CTE, Migrant)
- Bell Schedule
- School Calendar
- Student Cohort
- Intervention
- Graduation
- Finance
- Survey
- Transportation (v5.1+)
- Immunizations (v5.1+)
- Crisis Events (v5.1+)
- Section 504 (v5.2+)

#### Federal Alignment

> "The Ed-Fi Unifying Data Model is the widely adopted, CEDS-aligned, open-source data standard."
> — Ed-Fi Alliance

- **CEDS**: 1,710 elements covering P-20W education
- **EDFacts**: State and federal reporting compatibility
- **State Mandates**: Texas, Wisconsin, Arizona, Michigan adopting

#### Active Development

- **v5.1** (Spring 2024): Crisis events, immunizations, transportation
- **v5.2** (Fall 2024): Assessment registration, Section 504, dual credit
- **Community-driven**: Open source, Dell Foundation supported

### Data Source Mapping

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    K-12 DATA ECOSYSTEM                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PRIMARY SOURCES                                                            │
│  ───────────────                                                            │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    STUDENT INFORMATION SYSTEM (SIS)                  │   │
│  │                                                                      │   │
│  │  PowerSchool │ Infinite Campus │ Skyward │ Tyler SIS │ Aeries       │   │
│  │                                                                      │   │
│  │  Data: Demographics, Enrollment, Attendance, Grades, Transcripts,   │   │
│  │        Discipline, Contacts, Immunizations, Transportation          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                 LEARNING MANAGEMENT SYSTEM (LMS)                     │   │
│  │                                                                      │   │
│  │  Canvas │ Schoology │ Google Classroom │ Blackboard │ Brightspace   │   │
│  │                                                                      │   │
│  │  Data: Courses, Assignments, Submissions, Grades, Learning          │   │
│  │        Activities, Discussion, Resources, Analytics                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  SECONDARY SOURCES                                                          │
│  ─────────────────                                                          │
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐  │
│  │    HR/Finance    │  │   Assessment     │  │    Special Programs      │  │
│  │                  │  │                  │  │                          │  │
│  │  Skyward HR      │  │  NWEA MAP        │  │  SpEd Systems            │  │
│  │  Frontline       │  │  i-Ready         │  │  504 Management          │  │
│  │  MUNIS           │  │  Renaissance     │  │  Title I Tracking        │  │
│  │  Workday         │  │  State Tests     │  │  ELL Programs            │  │
│  │                  │  │  ACT/SAT/AP      │  │  Gifted/Talented         │  │
│  │  Data:           │  │                  │  │                          │  │
│  │  • Staff records │  │  Data:           │  │  Data:                   │  │
│  │  • Credentials   │  │  • Test scores   │  │  • IEPs                  │  │
│  │  • Payroll       │  │  • Standards     │  │  • 504 Plans             │  │
│  │  • Performance   │  │  • Growth        │  │  • Services              │  │
│  │  • Certifications│  │  • Benchmarks    │  │  • Interventions         │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────────────┘  │
│                                                                             │
│  EMERGING SOURCES                                                           │
│  ────────────────                                                           │
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐  │
│  │   State Ed-Fi    │  │   SEL Platforms  │  │    Learning Analytics    │  │
│  │   ODS Systems    │  │                  │  │                          │  │
│  │                  │  │  Panorama        │  │  xAPI/Caliper LRS        │  │
│  │  TX, WI, AZ, MI  │  │  Aperture        │  │  Learning Record Stores  │  │
│  │  More coming...  │  │  CASEL tools     │  │  Activity streams        │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Protocol Translation Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SCHOOLDAY PROTOCOL ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  EXTERNAL APIs (What vendors consume)                                       │
│  ════════════════════════════════════                                       │
│                                                                             │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────┐ │
│  │ OneRoster │ │  Clever   │ │  GraphQL  │ │  Caliper  │ │    Ed-Fi      │ │
│  │ REST API  │ │  Compat   │ │    API    │ │  /xAPI    │ │   REST API    │ │
│  │           │ │           │ │           │ │           │ │               │ │
│  │ v1.1/1.2  │ │  v3.0     │ │  Schema   │ │  Events   │ │   For state   │ │
│  │           │ │           │ │  first    │ │           │ │   systems     │ │
│  └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └───────┬───────┘ │
│        │             │             │             │               │         │
│  ══════╪═════════════╪═════════════╪═════════════╪═══════════════╪════════ │
│        │             │             │             │               │         │
│        ▼             ▼             ▼             ▼               ▼         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     PROTOCOL TRANSLATION LAYER                       │   │
│  │                                                                      │   │
│  │  • OneRoster ↔ Ed-Fi mapper                                         │   │
│  │  • Clever ↔ Ed-Fi mapper (sections → classes, etc.)                 │   │
│  │  • GraphQL resolver → Ed-Fi entities                                 │   │
│  │  • Ed-Fi → Caliper/xAPI event transformer                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     UNIFIED DATA RESOLVER                            │   │
│  │                                                                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │   │
│  │  │   Entity    │  │   Access    │  │   Privacy   │  │    Audit    │ │   │
│  │  │ Resolution  │  │    Tier     │  │   (Token-   │  │   Logging   │ │   │
│  │  │             │  │ Enforcement │  │   ization)  │  │             │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │   │
│  │                                                                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │   │
│  │  │    Rate     │  │   Caching   │  │   Query     │                  │   │
│  │  │   Limiting  │  │   (Redis)   │  │Optimization │                  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    ED-FI UNIFYING DATA MODEL                         │   │
│  │                    (Internal Canonical Store)                        │   │
│  │                                                                      │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │   │
│  │  │Student │ │Attend- │ │Discip- │ │Assess- │ │Special │ │ Staff  │ │   │
│  │  │  Core  │ │ ance   │ │ line   │ │ ment   │ │  Ed    │ │        │ │   │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │   │
│  │  │Calendar│ │  Bell  │ │Interv- │ │Gradua- │ │ Cohort │ │ Survey │ │   │
│  │  │        │ │Schedule│ │ ention │ │ tion   │ │        │ │        │ │   │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     DATA SOURCE CONNECTORS                           │   │
│  │                                                                      │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │   │
│  │  │  SIS   │ │  LMS   │ │   HR   │ │ Assess │ │ SpEd   │ │ Ed-Fi  │ │   │
│  │  │Connect.│ │Connect.│ │Connect.│ │Connect.│ │Connect.│ │  ODS   │ │   │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### What This Enables

| Capability | OneRoster-Only | With Ed-Fi Core |
|------------|----------------|-----------------|
| Basic rostering | ✅ | ✅ |
| Simple grades | ✅ | ✅ |
| Attendance analytics | ❌ | ✅ |
| Behavior/SEL vendors | ❌ | ✅ |
| SpEd vendor integration | ❌ | ✅ |
| Assessment platforms | ❌ (basic) | ✅ (comprehensive) |
| Staff/HR integration | ❌ | ✅ |
| State Ed-Fi compliance | ❌ | ✅ |
| Learning analytics (xAPI) | ❌ | ✅ |
| Future-proofing | ❌ | ✅ |

---

## SSO Strategy

### The Problem with Current SSO

Clever dominates SSO not because of technology:

| Factor | Reality |
|--------|---------|
| **Technology** | SAML/OIDC are open standards anyone can implement |
| **Lock-in** | Clever's proprietary "Instant Login" creates dependency |
| **Bundling** | SSO + Rostering bundled creates switching friction |
| **Network** | 800+ apps means schools "need" Clever |

### Our SSO Approach

> **Use open standards (SAML/OIDC) for enterprise SSO. Build convenience layers (Instant Login alternative) on top. Never create proprietary lock-in.**

#### SSO Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                    SSO ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  USER-FACING (Convenience Layers)                               │
│  ─────────────────────────────────                              │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Instant   │  │  QR Code    │  │   Badge/Picture         │ │
│  │   Login     │  │   Login     │  │   Login (K-2)           │ │
│  │   Portal    │  │             │  │                         │ │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
│         │                │                     │               │
│         └────────────────┼─────────────────────┘               │
│                          │                                      │
│                          ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              SCHOOLDAY SSO GATEWAY                          ││
│  │                                                              ││
│  │  • Session management                                        ││
│  │  • Token generation                                          ││
│  │  • SLO (Single Logout)                                       ││
│  │  • Clever Instant Login migration                            ││
│  └─────────────────────────────────────────────────────────────┘│
│                          │                                      │
│                          ▼                                      │
│  PROTOCOL LAYER (Open Standards)                                │
│  ───────────────────────────────                                │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   SAML 2.0  │  │    OIDC     │  │   OAuth 2.0             │ │
│  │             │  │             │  │   (Clever compat)       │ │
│  │  Enterprise │  │   Modern    │  │                         │ │
│  │  standard   │  │   standard  │  │   Migration path        │ │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
│         │                │                     │               │
│         └────────────────┼─────────────────────┘               │
│                          │                                      │
│                          ▼                                      │
│  IDENTITY PROVIDERS                                             │
│  ──────────────────                                             │
│                                                                 │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────────────┐│
│  │ Azure  │ │ Google │ │  Okta  │ │ClassLnk│ │ District LDAP/ ││
│  │   AD   │ │Workspce│ │        │ │        │ │ Active Dir     ││
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### SSO Differentiators

| Clever | SchoolDay |
|--------|-----------|
| Proprietary Instant Login | Open standards + convenience layer |
| SSO bundled with rostering | SSO is modular |
| Single IdP support per school | Multi-IdP federation |
| Limited to Clever ecosystem | Works with any SAML/OIDC app |
| No privacy tokenization | Privacy-first |

---

## Competitive Positioning

### The SchoolDay Value Proposition

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   "SCHOOLDAY: The K-12 integration platform vendors actually need."        │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   FOR VENDORS                          FOR DISTRICTS                        │
│   ───────────                          ─────────────                        │
│                                                                             │
│   ✓ Comprehensive data                 ✓ Privacy-first (tokenization)      │
│     (not just rostering)                                                    │
│                                        ✓ Instant vendor approval            │
│   ✓ Free Privacy-Safe tier               (PoDS-Lite)                        │
│     (vs Clever's per-school fees)                                           │
│                                        ✓ AI-guided onboarding               │
│   ✓ One integration → all districts                                        │
│                                        ✓ Single dashboard for all           │
│   ✓ Modern APIs (GraphQL + REST)         vendor integrations                │
│                                                                             │
│   ✓ Clever migration with zero        ✓ Open standards (no lock-in)        │
│     code changes                                                            │
│                                        ✓ State Ed-Fi compliance             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Competitive Matrix

| Capability | Clever | ClassLink | Edlink | SchoolDay |
|------------|--------|-----------|--------|-----------|
| **Rostering** | ✅ | ✅ | ✅ | ✅ |
| **SSO** | ✅ | ✅ | ✅ | ✅ |
| **Grade Passback** | ✅ | ✅ | ✅ | ✅ |
| **Attendance Data** | ❌ | Partial | ❌ | ✅ |
| **Discipline Data** | ❌ | ❌ | ❌ | ✅ |
| **Special Ed Data** | ❌ | ❌ | ❌ | ✅ |
| **Assessment Data** | ❌ | ❌ | ❌ | ✅ |
| **Staff/HR Data** | ❌ | ❌ | ❌ | ✅ |
| **LMS Integration** | ✅ (via Edlink) | ✅ | ✅ | ✅ |
| **GraphQL API** | ❌ | ❌ | ❌ | ✅ |
| **Privacy Tokenization** | ❌ | ❌ | ❌ | ✅ |
| **Free Tier** | ❌ | ❌ | ❌ | ✅ |
| **Ed-Fi Alignment** | ❌ | ✅ (bridge) | ❌ | ✅ (native) |
| **State Compliance** | ❌ | Partial | ❌ | ✅ |

### Pricing Disruption

| Tier | Clever | SchoolDay |
|------|--------|-----------|
| **Basic/Free** | N/A | ✅ Privacy-Safe (tokenized data) |
| **Standard** | $16-19/school/month | $0.10/student/month |
| **Premium** | Custom | $0.25/student/month |
| **Enterprise** | Custom | Custom |

**The Wedge**: Vendors get free access to tokenized data. No per-school fees. Privacy compliance built-in.

---

## EdTech Credit Bureau: The Strategic Moat

> **Full Documentation**: See [EDTECH_CREDIT_BUREAU.md](./EDTECH_CREDIT_BUREAU.md) for comprehensive executive briefing

### The Vision

Just as FICO scores revolutionized consumer lending by providing standardized creditworthiness signals, the **SchoolDay Verification API** establishes the trust layer for K-12 education technology. We become the authoritative source for vendor legitimacy verification.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    EDTECH CREDIT BUREAU ANALOGY                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   FICO : Consumer Lending  ::  SchoolDay Verification : EdTech Access      │
│                                                                             │
│   ┌──────────────────────────┐    ┌──────────────────────────────────────┐ │
│   │     FICO ECOSYSTEM       │    │   SCHOOLDAY VERIFICATION ECOSYSTEM   │ │
│   ├──────────────────────────┤    ├──────────────────────────────────────┤ │
│   │                          │    │                                      │ │
│   │ Credit Score (300-850)   │    │ Credibility Score (0-100)            │ │
│   │          ↓               │    │          ↓                           │ │
│   │ Banks → Loan Decisions   │    │ Districts → Access Decisions         │ │
│   │          ↓               │    │          ↓                           │ │
│   │ Standardized Risk        │    │ Standardized Trust                   │ │
│   │                          │    │                                      │ │
│   └──────────────────────────┘    └──────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Strategic Value

| Dimension | Value Creation |
|-----------|---------------|
| **Network Effects** | Every verified vendor + every district contract strengthens the network |
| **Recurring Revenue** | SaaS model: Free tier → Pro ($500/mo) → Enterprise (custom) |
| **Competitive Moat** | Historical verification data + directory relationships are defensible |
| **Trust Authority** | SchoolDay becomes the "seal of approval" for EdTech vendors |
| **Data Asset** | Aggregated verification signals across thousands of vendors |

### Key Components

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    VERIFICATION ENGINE ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    SIGNAL AGGREGATION                                │   │
│  │                                                                      │   │
│  │  BASIC SIGNALS (5)           ENHANCED SIGNALS (2)   DIRECTORIES (8) │   │
│  │  ─────────────────           ────────────────────   ──────────────  │   │
│  │  • Email domain match        • Applicant LinkedIn   • 1EdTech       │   │
│  │  • Website SSL               • Corporate email      • Common Sense  │   │
│  │  • Domain age                                       • SDPC          │   │
│  │  • LinkedIn company                                 • iKeepSafe     │   │
│  │  • LinkedIn employees                               • Privacy Pledge│   │
│  │                                                     • Clever        │   │
│  │                                                     • ClassLink     │   │
│  │                                                     • State Lists   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    SCORING ENGINE                                    │   │
│  │                                                                      │   │
│  │  Raw Score (0-100) → Percentile → Tier Recommendation               │   │
│  │                                                                      │   │
│  │  Privacy-Safe: 60+    Selective: 75+    Full Access: 85+            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    CONTRACT EVALUATOR                                │   │
│  │                                                                      │   │
│  │  District-specific requirements + Score → Access Decision           │   │
│  │                                                                      │   │
│  │  AUTO_APPROVE │ MANUAL_REVIEW │ REJECT                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Revenue Model

| Tier | Price | Features | Target Market |
|------|-------|----------|---------------|
| **Free** | $0 | 100 verifications/mo, basic signals | Small districts, trials |
| **Pro** | $500/mo | Unlimited, all signals, webhooks | Mid-size districts |
| **Enterprise** | Custom | SLA, dedicated support, on-premise option | Large districts, states |

### 18-Month Targets

| Metric | Target | Strategic Impact |
|--------|--------|------------------|
| Districts using API | 1,000 | Critical mass for network effects |
| Vendors in database | 5,000 | Comprehensive coverage |
| ARR | $3.3M | Sustainable, defensible revenue |
| Directory partnerships | 8+ | Data moat |

### Why This Wins

1. **First Mover in Verification-as-a-Service**: No competitor offers standardized vendor verification
2. **Network Effects**: More districts → more vendors verified → more value for all
3. **Data Moat**: Historical verification data becomes irreplaceable
4. **Revenue Diversification**: SaaS revenue independent of per-student pricing
5. **Trust Authority**: SchoolDay becomes synonymous with "verified EdTech"

### Implementation Priority

| Phase | Timeline | Deliverable |
|-------|----------|-------------|
| Phase 1 | Weeks 1-4 | MVP API with basic verification |
| Phase 2 | Weeks 5-8 | Full signal coverage + directory integrations |
| Phase 3 | Weeks 9-12 | Production-ready with contracts + caching |
| Phase 4 | Weeks 13-16 | Commercialization (pricing, billing, docs) |

**Total Effort**: 280 hours over 16 weeks

---

## Technical Architecture

### Core Principles

1. **Ed-Fi Internal, Multi-Protocol External**
   - All data normalized to Ed-Fi UDM internally
   - Expose OneRoster, Clever, GraphQL, Ed-Fi externally
   - Translation happens at the protocol layer

2. **Privacy by Design**
   - Three-tier access model (Privacy-Safe, Selective, Full)
   - Tokenization at the resolver layer
   - All access audited

3. **District as Data Source**
   - Districts own their data
   - Platform is the broker, not the owner
   - Real-time sync from district systems

4. **Open Standards First**
   - SAML/OIDC for SSO
   - OneRoster for rostering (compatibility)
   - Ed-Fi for comprehensive data
   - xAPI/Caliper for analytics

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SCHOOLDAY INTEGRATION PLATFORM                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         VENDOR LAYER                                 │   │
│  │                                                                      │   │
│  │  EdTech Apps │ LMS Integrations │ Assessment Vendors │ SEL Tools    │   │
│  └───────────────────────────────────┬─────────────────────────────────┘   │
│                                      │                                      │
│  ┌───────────────────────────────────▼─────────────────────────────────┐   │
│  │                         API GATEWAY                                  │   │
│  │                                                                      │   │
│  │  Rate Limiting │ Auth │ Routing │ Caching │ Monitoring              │   │
│  └───────────────────────────────────┬─────────────────────────────────┘   │
│                                      │                                      │
│  ┌───────────────────────────────────▼─────────────────────────────────┐   │
│  │                     PROTOCOL ADAPTERS                                │   │
│  │                                                                      │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │   │
│  │  │ OneRoster│ │  Clever  │ │ GraphQL  │ │ Caliper/ │ │   Ed-Fi    │ │   │
│  │  │   REST   │ │  Compat  │ │          │ │   xAPI   │ │   REST     │ │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────────┘ │   │
│  └───────────────────────────────────┬─────────────────────────────────┘   │
│                                      │                                      │
│  ┌───────────────────────────────────▼─────────────────────────────────┐   │
│  │                    UNIFIED DATA RESOLVER                             │   │
│  │                                                                      │   │
│  │  Entity Resolution │ Access Control │ Tokenization │ Audit │ Cache  │   │
│  └───────────────────────────────────┬─────────────────────────────────┘   │
│                                      │                                      │
│  ┌───────────────────────────────────▼─────────────────────────────────┐   │
│  │                    ED-FI DATA STORE                                  │   │
│  │                                                                      │   │
│  │  PostgreSQL │ Redis Cache │ Audit Log │ Event Queue                 │   │
│  └───────────────────────────────────┬─────────────────────────────────┘   │
│                                      │                                      │
│  ┌───────────────────────────────────▼─────────────────────────────────┐   │
│  │                    SYNC ENGINE                                       │   │
│  │                                                                      │   │
│  │  Change Detection │ Conflict Resolution │ Webhook Delivery │ Queue  │   │
│  └───────────────────────────────────┬─────────────────────────────────┘   │
│                                      │                                      │
│  ┌───────────────────────────────────▼─────────────────────────────────┐   │
│  │                    SOURCE CONNECTORS                                 │   │
│  │                                                                      │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │   │
│  │  │   SIS    │ │   LMS    │ │    HR    │ │  Assess  │ │  State     │ │   │
│  │  │Connector │ │Connector │ │Connector │ │Connector │ │  Ed-Fi     │ │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│  ┌───────────────────────────────────▼─────────────────────────────────┐   │
│  │                    DISTRICT SYSTEMS                                  │   │
│  │                                                                      │   │
│  │  PowerSchool │ Canvas │ Skyward │ State ODS │ Local Databases       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Decision Log

These decisions form the strategic foundation. Changes require explicit review.

| Date | Decision | Rationale | Status |
|------|----------|-----------|--------|
| Nov 29, 2025 | **EdTech Credit Bureau as strategic moat** | Verification-as-a-Service creates network effects, recurring SaaS revenue ($3.3M ARR target), and defensible data moat; first mover in standardized vendor verification | APPROVED |
| Nov 28, 2025 | **Ed-Fi as internal canonical model** | Most comprehensive K-12 data standard; CEDS-aligned; state mandates growing | APPROVED |
| Nov 28, 2025 | **Multi-protocol external APIs** | Backward compatibility (OneRoster, Clever); modern DX (GraphQL); future-proof | APPROVED |
| Nov 28, 2025 | **Clever API compatibility layer** | Break chicken-and-egg; enable zero-friction migration | APPROVED |
| Nov 28, 2025 | **Open standards for SSO** | SAML/OIDC are industry standards; avoid proprietary lock-in | APPROVED |
| Nov 28, 2025 | **Free Privacy-Safe tier** | Disrupt Clever's vendor-pays model; create adoption wedge | APPROVED |
| Nov 28, 2025 | **Privacy-first tokenization** | Competitive differentiator; compliance enabler | APPROVED |
| Nov 28, 2025 | **18-month disruption timeline** | Aggressive but achievable; market window exists | APPROVED |
| Nov 28, 2025 | **Caliper/xAPI for analytics** | Complement Ed-Fi for learning analytics vendors | APPROVED |

---

## Key Metrics

### Market Share Targets

| Timeframe | Districts | Vendors | Students | Clever Migrations |
|-----------|-----------|---------|----------|-------------------|
| 6 months | 10 | 20 | 100K | 0 |
| 12 months | 500 | 100 | 5M | 50 |
| 18 months | 1,000+ | 300+ | 15M+ | 200+ |

### Technical Quality Targets

| Metric | Target |
|--------|--------|
| Unit test coverage | 90%+ |
| Integration test coverage | 80%+ |
| API response time (p95) | <100ms |
| Sync latency | <30 seconds |
| Uptime | 99.9% |

---

## References

### Standards Organizations
- [Ed-Fi Alliance](https://www.ed-fi.org/)
- [1EdTech (OneRoster)](https://www.1edtech.org/standards/oneroster)
- [CEDS](https://ceds.ed.gov/)

### Documentation
- [Ed-Fi Data Standard v5.x](https://docs.ed-fi.org/reference/data-exchange/data-standards/)
- [Ed-Fi Domains](https://techdocs.ed-fi.org/display/EFDS33/Ed-Fi+Domains)
- [OneRoster 1.2 Specification](https://www.imsglobal.org/oneroster-v11-final-specification)
- [CEDS Elements](https://ceds.ed.gov/)

### Market Research
- [Clever Pricing](https://www.clever.com/pricing)
- [ClassLink Overview](https://www.classlink.com/solutions/k-12-overview)
- [Edlink Documentation](https://ed.link/docs/start/what-edlink-is)
- [Ed-Fi and 1EdTech Collaboration](https://www.1edtech.org/blog/the-best-of-both-worlds-how-classlink-bridges-1edtechs-oneroster-and-the-ed-fi-data-standard)

---

*This document is the strategic foundation for SchoolDay. All technical decisions should align with these principles.*

*Last reviewed: November 28, 2025*
*Next review: Monthly or upon major strategic decision*
