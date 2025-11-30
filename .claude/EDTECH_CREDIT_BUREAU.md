# EdTech Credit Bureau as a Service

## SCHOOLDAY VERIFICATION API - "EdTech Credit Score"

**Document Version**: 1.0
**Created**: November 29, 2025
**Status**: Strategic Proposal
**Classification**: Executive Briefing

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Vision](#product-vision)
3. [Market Opportunity](#market-opportunity)
4. [Architecture Overview](#architecture-overview)
5. [VERIFICATION ENGINE](#verification-engine)
6. [SCHOOLDAY VERIFICATION API](#schoolday-verification-api)
7. [SCORING ENGINE](#scoring-engine)
8. [CONTRACT EVALUATOR](#contract-evaluator)
9. [VERIFICATION API TIERS](#verification-api-tiers)
10. [VERIFICATION API PRICING](#verification-api-pricing)
11. [Competitive Analysis](#competitive-analysis)
12. [Implementation Roadmap](#implementation-roadmap)
13. [Risk Assessment](#risk-assessment)
14. [Financial Projections](#financial-projections)
15. [Appendix: Technical Specifications](#appendix-technical-specifications)

---

# Executive Summary

## [TAG: EXECUTIVE-SUMMARY]

```
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║     SCHOOLDAY EDTECH CREDIT BUREAU                                       ║
║     "The Trust Layer for K-12 Education Technology"                      ║
║                                                                          ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  WHAT WE'RE BUILDING                                                     ║
║  ───────────────────                                                     ║
║  A verification-as-a-service platform that provides school districts     ║
║  with instant, trusted credibility scores for EdTech vendors seeking     ║
║  access to student data.                                                 ║
║                                                                          ║
║  THE PROBLEM                                                             ║
║  ───────────                                                             ║
║  • Districts receive 100+ vendor applications per year                   ║
║  • Each requires weeks of manual privacy review                          ║
║  • No standardized way to assess vendor legitimacy                       ║
║  • Privacy violations cost districts millions in liability               ║
║                                                                          ║
║  OUR SOLUTION                                                            ║
║  ────────────                                                            ║
║  • Instant credibility scoring (0-100) via API                           ║
║  • 13+ verification signals across 8 trusted directories                 ║
║  • Tiered access recommendations aligned to district contracts           ║
║  • Districts control UI; SchoolDay provides the intelligence             ║
║                                                                          ║
║  BUSINESS MODEL                                                          ║
║  ──────────────                                                          ║
║  • SaaS pricing: Free tier → $500/mo Pro → Custom Enterprise             ║
║  • Revenue per verification for high-volume users                        ║
║  • Network effects: More districts = more valuable vendor database       ║
║                                                                          ║
║  COMPETITIVE MOAT                                                        ║
║  ────────────────                                                        ║
║  • First-mover in EdTech verification-as-a-service                       ║
║  • Clever has no equivalent offering                                     ║
║  • Growing vendor trust network creates switching costs                  ║
║  • Regulatory tailwinds (FERPA, COPPA, state privacy laws)               ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

### Key Metrics (18-Month Targets)

| Metric | 6 Months | 12 Months | 18 Months |
|--------|----------|-----------|-----------|
| Districts Using API | 50 | 300 | 1,000 |
| Vendors in Database | 500 | 2,000 | 5,000 |
| Monthly Verifications | 5,000 | 50,000 | 200,000 |
| ARR | $150K | $900K | $3M |

---

# Product Vision

## [TAG: PRODUCT-VISION]

### The "Credit Score" Analogy

Just as FICO revolutionized lending by creating a standardized creditworthiness score, SchoolDay creates a standardized **EdTech Credibility Score** for vendor data access requests.

```
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║     FICO : Lending :: SchoolDay : EdTech Data Access                     ║
║                                                                          ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  FICO CREDIT SCORE                    SCHOOLDAY EDTECH SCORE             ║
║  ─────────────────                    ──────────────────────             ║
║                                                                          ║
║  • Score: 300-850                     • Score: 0-100                     ║
║  • Signals: Payment history,          • Signals: Domain match, SSL,      ║
║    credit utilization, length           website age, LinkedIn,           ║
║    of history, etc.                     directory listings, etc.         ║
║  • Used by: Banks, lenders            • Used by: School districts        ║
║  • Decision: Loan approval            • Decision: Data access tier       ║
║  • Trust: Standardized,               • Trust: Standardized,             ║
║    third-party verified                 third-party verified             ║
║                                                                          ║
║  WHY THIS MATTERS                                                        ║
║  ────────────────                                                        ║
║  • Districts get instant, defensible decisions                           ║
║  • Vendors know what's expected (transparency)                           ║
║  • Reduces liability for districts                                       ║
║  • Creates accountability for vendors                                    ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

### Vision Statement

> **SchoolDay becomes the trusted third party that school districts rely on to verify EdTech vendor credibility, enabling instant, defensible data access decisions while protecting student privacy.**

---

# Market Opportunity

## [TAG: MARKET-OPPORTUNITY]

### Total Addressable Market (TAM)

```
╔══════════════════════════════════════════════════════════════════════════╗
║                         MARKET SIZE ANALYSIS                             ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  US K-12 EDUCATION MARKET                                                ║
║  ────────────────────────                                                ║
║  • 13,000+ school districts                                              ║
║  • 130,000+ schools                                                      ║
║  • 50 million students                                                   ║
║  • $15B+ EdTech spending annually                                        ║
║                                                                          ║
║  EDTECH VENDOR LANDSCAPE                                                 ║
║  ───────────────────────                                                 ║
║  • 10,000+ EdTech vendors serving K-12                                   ║
║  • Average district uses 150+ different apps                             ║
║  • New vendor requests: 50-200 per district per year                     ║
║                                                                          ║
║  PRIVACY COMPLIANCE BURDEN                                               ║
║  ─────────────────────────                                               ║
║  • Average review time: 2-4 weeks per vendor                             ║
║  • FTE cost: $50K-100K per year for dedicated privacy staff              ║
║  • Legal exposure: $1M+ per FERPA/COPPA violation                        ║
║                                                                          ║
║  SERVICEABLE ADDRESSABLE MARKET (SAM)                                    ║
║  ─────────────────────────────────────                                   ║
║  • Target: Large districts (10,000+ students)                            ║
║  • Approximately 2,000 districts in US                                   ║
║  • Average potential contract value: $5,000/year                         ║
║  • SAM = $10M annually in US alone                                       ║
║                                                                          ║
║  INTERNATIONAL EXPANSION                                                 ║
║  ────────────────────────                                                ║
║  • UK: 25,000 schools                                                    ║
║  • Canada: 15,000 schools                                                ║
║  • Australia: 10,000 schools                                             ║
║  • Total international TAM: 3x US market                                 ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

### Regulatory Tailwinds

| Regulation | Impact | Status |
|------------|--------|--------|
| **FERPA** | Federal student privacy law | Enforced |
| **COPPA** | Children's online privacy | Enforced, expanding |
| **SOPIPA** | California student data law | Model for other states |
| **State Laws** | 50 states have privacy legislation | Growing annually |
| **GDPR** | European data protection | International expansion |

---

# Architecture Overview

## [TAG: ARCHITECTURE-OVERVIEW]

```
╔══════════════════════════════════════════════════════════════════════════╗
║           SCHOOLDAY VERIFICATION API - SYSTEM ARCHITECTURE               ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  ┌─────────────────────────────────────────────────────────────────────┐║
║  │                     DISTRICT LAYER (Customizable)                    │║
║  │                                                                      │║
║  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │║
║  │  │   LAUSD      │  │   NYCDOE     │  │   CPS        │  ...          │║
║  │  │   Portal     │  │   Portal     │  │   Portal     │               │║
║  │  │  (React)     │  │  (Angular)   │  │  (Custom)    │               │║
║  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘               │║
║  └─────────┼─────────────────┼─────────────────┼───────────────────────┘║
║            │                 │                 │                         ║
║            └─────────────────┼─────────────────┘                         ║
║                              │                                           ║
║                              ▼                                           ║
║  ┌─────────────────────────────────────────────────────────────────────┐║
║  │                                                                      │║
║  │              ███████╗ ██████╗██╗  ██╗ ██████╗  ██████╗ ██╗          │║
║  │              ██╔════╝██╔════╝██║  ██║██╔═══██╗██╔═══██╗██║          │║
║  │              ███████╗██║     ███████║██║   ██║██║   ██║██║          │║
║  │              ╚════██║██║     ██╔══██║██║   ██║██║   ██║██║          │║
║  │              ███████║╚██████╗██║  ██║╚██████╔╝╚██████╔╝███████╗     │║
║  │              ╚══════╝ ╚═════╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚══════╝     │║
║  │                                                                      │║
║  │              SCHOOLDAY VERIFICATION API                              │║
║  │                                                                      │║
║  │  ┌─────────────────────────────────────────────────────────────────┐│║
║  │  │                         API GATEWAY                              ││║
║  │  │  • Authentication (API Keys, OAuth)                              ││║
║  │  │  • Rate Limiting                                                 ││║
║  │  │  • Request Validation                                            ││║
║  │  │  • Usage Metering                                                ││║
║  │  └───────────────────────────┬─────────────────────────────────────┘│║
║  │                              │                                       │║
║  │  ┌───────────────────────────┼─────────────────────────────────────┐│║
║  │  │                           ▼                                      ││║
║  │  │  ┌─────────────────────────────────────────────────────────────┐││║
║  │  │  │                  VERIFICATION ENGINE                        │││║
║  │  │  │                                                             │││║
║  │  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │││║
║  │  │  │  │   BASIC     │  │  ENHANCED   │  │  DIRECTORY          │ │││║
║  │  │  │  │   SIGNALS   │  │  SIGNALS    │  │  INTEGRATIONS       │ │││║
║  │  │  │  │             │  │             │  │                     │ │││║
║  │  │  │  │ • Domain    │  │ • Applicant │  │ • 1EdTech (IMS)     │ │││║
║  │  │  │  │   Match     │  │   LinkedIn  │  │ • Common Sense      │ │││║
║  │  │  │  │ • SSL Cert  │  │ • Corporate │  │ • SDPC              │ │││║
║  │  │  │  │ • Domain    │  │   Email     │  │ • iKeepSafe         │ │││║
║  │  │  │  │   Age       │  │             │  │ • Privacy Pledge    │ │││║
║  │  │  │  │ • Company   │  │             │  │ • Clever Certified  │ │││║
║  │  │  │  │   LinkedIn  │  │             │  │ • ClassLink         │ │││║
║  │  │  │  │ • Employee  │  │             │  │ • State Approved    │ │││║
║  │  │  │  │   Count     │  │             │  │   Lists             │ │││║
║  │  │  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │││║
║  │  │  │                                                             │││║
║  │  │  └─────────────────────────────────────────────────────────────┘││║
║  │  │                              │                                   ││║
║  │  │                              ▼                                   ││║
║  │  │  ┌─────────────────────────────────────────────────────────────┐││║
║  │  │  │                    SCORING ENGINE                           │││║
║  │  │  │                                                             │││║
║  │  │  │  • Aggregate signal scores                                  │││║
║  │  │  │  • Apply configurable weights                               │││║
║  │  │  │  • Calculate confidence interval                            │││║
║  │  │  │  • Generate percentile ranking                              │││║
║  │  │  │                                                             │││║
║  │  │  └─────────────────────────────────────────────────────────────┘││║
║  │  │                              │                                   ││║
║  │  │                              ▼                                   ││║
║  │  │  ┌─────────────────────────────────────────────────────────────┐││║
║  │  │  │                  CONTRACT EVALUATOR                         │││║
║  │  │  │                                                             │││║
║  │  │  │  • Load district-specific contract                          │││║
║  │  │  │  • Apply tier thresholds                                    │││║
║  │  │  │  • Check required signals                                   │││║
║  │  │  │  • Check required directories                               │││║
║  │  │  │  • Generate recommendation                                  │││║
║  │  │  │                                                             │││║
║  │  │  └─────────────────────────────────────────────────────────────┘││║
║  │  │                                                                  ││║
║  │  └──────────────────────────────────────────────────────────────────┘│║
║  │                                                                      │║
║  └─────────────────────────────────────────────────────────────────────┘║
║                              │                                           ║
║                              ▼                                           ║
║  ┌─────────────────────────────────────────────────────────────────────┐║
║  │                         DATA LAYER                                   │║
║  │                                                                      │║
║  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │║
║  │  │   Vendor     │  │   District   │  │    Audit     │               │║
║  │  │   Database   │  │   Contracts  │  │    Logs      │               │║
║  │  │              │  │              │  │              │               │║
║  │  │ • Profiles   │  │ • Tiers      │  │ • All API    │               │║
║  │  │ • Scores     │  │ • Thresholds │  │   calls      │               │║
║  │  │ • History    │  │ • Weights    │  │ • Decisions  │               │║
║  │  │ • Caching    │  │ • SLAs       │  │ • Timestamps │               │║
║  │  └──────────────┘  └──────────────┘  └──────────────┘               │║
║  │                                                                      │║
║  └─────────────────────────────────────────────────────────────────────┘║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

# VERIFICATION ENGINE

## [TAG: VERIFICATION-ENGINE]

The Verification Engine is the core intelligence layer that gathers and validates signals about vendor legitimacy.

### Signal Categories

```
╔══════════════════════════════════════════════════════════════════════════╗
║                    VERIFICATION ENGINE - SIGNAL MATRIX                   ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  BASIC SIGNALS (Privacy-Safe Tier)                                       ║
║  ─────────────────────────────────                                       ║
║  These signals verify basic company legitimacy and are sufficient        ║
║  for tokenized (zero-PII) data access.                                   ║
║                                                                          ║
║  ┌────────────────────┬────────┬─────────────────────────────────────┐  ║
║  │ Signal             │ Weight │ Description                         │  ║
║  ├────────────────────┼────────┼─────────────────────────────────────┤  ║
║  │ EMAIL_DOMAIN_MATCH │ 30 pts │ Contact email matches website       │  ║
║  │ WEBSITE_SSL        │ 20 pts │ Website uses HTTPS with valid cert  │  ║
║  │ WEBSITE_AGE        │ 25 pts │ Domain registered 6+ months ago     │  ║
║  │ LINKEDIN_COMPANY   │ 15 pts │ LinkedIn company page exists        │  ║
║  │ EMPLOYEE_COUNT     │ 10 pts │ LinkedIn shows employee count       │  ║
║  └────────────────────┴────────┴─────────────────────────────────────┘  ║
║                                                                          ║
║  Max Basic Score: 100 points                                             ║
║  Pass Threshold: 60 points (configurable per district)                   ║
║                                                                          ║
║  ═══════════════════════════════════════════════════════════════════════ ║
║                                                                          ║
║  ENHANCED SIGNALS (Selective/Full Access Tiers)                          ║
║  ──────────────────────────────────────────────                          ║
║  These signals verify the person submitting the application and          ║
║  are required for any PII access.                                        ║
║                                                                          ║
║  ┌─────────────────────────┬────────┬────────────────────────────────┐  ║
║  │ Signal                  │ Weight │ Description                    │  ║
║  ├─────────────────────────┼────────┼────────────────────────────────┤  ║
║  │ APPLICANT_LINKEDIN      │ 25 pts │ Applicant profile shows        │  ║
║  │ _VERIFIED               │        │ employment at vendor company   │  ║
║  │ APPLICANT_EMAIL         │ 10 pts │ Uses corporate email (not      │  ║
║  │ _CORPORATE              │        │ gmail, yahoo, etc.)            │  ║
║  └─────────────────────────┴────────┴────────────────────────────────┘  ║
║                                                                          ║
║  Additional Enhanced Points: 35 points                                   ║
║                                                                          ║
║  ═══════════════════════════════════════════════════════════════════════ ║
║                                                                          ║
║  DIRECTORY SIGNALS (Trust Multipliers)                                   ║
║  ─────────────────────────────────────                                   ║
║  Presence in trusted EdTech directories provides additional              ║
║  credibility and may be required for higher access tiers.                ║
║                                                                          ║
║  ┌─────────────────────────┬────────┬────────────────────────────────┐  ║
║  │ Directory               │ Weight │ Description                    │  ║
║  ├─────────────────────────┼────────┼────────────────────────────────┤  ║
║  │ DIRECTORY_1EDTECH       │ 20 pts │ LTI/OneRoster certified        │  ║
║  │ DIRECTORY_COMMON_SENSE  │ 25 pts │ Privacy Program approved       │  ║
║  │ DIRECTORY_SDPC          │ 20 pts │ NDPA signatory                 │  ║
║  │ DIRECTORY_IKEEPSAFE     │ 20 pts │ COPPA/FERPA certified          │  ║
║  │ DIRECTORY_PRIVACY_PLEDGE│ 15 pts │ FPF signatory                  │  ║
║  │ DIRECTORY_CLEVER        │ 15 pts │ Clever Certified Partner       │  ║
║  │ DIRECTORY_CLASSLINK     │ 15 pts │ ClassLink Certified Partner    │  ║
║  │ DIRECTORY_STATE_APPROVED│ 20 pts │ State-specific approved list   │  ║
║  └─────────────────────────┴────────┴────────────────────────────────┘  ║
║                                                                          ║
║  Directory checks are additive to base score.                            ║
║  Some directories may be REQUIRED for specific tiers.                    ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

### Signal Verification Methods

| Signal | Verification Method | Data Source |
|--------|---------------------|-------------|
| EMAIL_DOMAIN_MATCH | Extract domain from email, compare to website domain | Input validation |
| WEBSITE_SSL | HTTPS request, certificate validation | Live check |
| WEBSITE_AGE | WHOIS lookup for domain registration date | WHOIS API |
| LINKEDIN_COMPANY | LinkedIn API or web verification | LinkedIn |
| EMPLOYEE_COUNT | LinkedIn company page scrape | LinkedIn |
| APPLICANT_LINKEDIN | LinkedIn profile verification | LinkedIn |
| DIRECTORY_* | API calls to each directory service | Directory APIs |

---

# SCHOOLDAY VERIFICATION API

## [TAG: SCHOOLDAY-VERIFICATION-API]

### API Overview

```
╔══════════════════════════════════════════════════════════════════════════╗
║                     SCHOOLDAY VERIFICATION API v1                        ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  BASE URL: https://api.schoolday.com/verification/v1                     ║
║                                                                          ║
║  AUTHENTICATION                                                          ║
║  ──────────────                                                          ║
║  All requests require an API key in the header:                          ║
║  Authorization: Bearer sk_live_xxxxxxxxxxxxxxxxxxxxx                     ║
║                                                                          ║
║  RATE LIMITS (by tier)                                                   ║
║  ─────────────────────                                                   ║
║  • Free:       100 requests/month                                        ║
║  • Pro:        Unlimited                                                 ║
║  • Enterprise: Unlimited + Priority                                      ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

### Core Endpoints

#### 1. Submit Verification Request

```
POST /verify
```

**Request Body:**
```json
{
  "vendor": {
    "name": "MathGenius Learning",
    "websiteUrl": "https://www.mathgeniuslearning.com",
    "contactEmail": "integration@mathgeniuslearning.com",
    "contactPhone": "+1-555-123-4567",
    "linkedInUrl": "https://linkedin.com/company/mathgeniuslearning"
  },
  "applicant": {
    "name": "Sarah Chen",
    "email": "sarah.chen@mathgeniuslearning.com",
    "linkedInUrl": "https://linkedin.com/in/sarahchen",
    "title": "Director of Integrations"
  },
  "application": {
    "name": "MathGenius Student Portal",
    "description": "Personalized math learning platform for K-8",
    "dataElementsRequested": ["USERS", "CLASSES", "ENROLLMENTS"],
    "requestedTier": "SELECTIVE"
  },
  "districtId": "lausd",
  "options": {
    "includeDirectoryChecks": true,
    "includeEnhancedSignals": true,
    "forceRefresh": false
  }
}
```

**Response:**
```json
{
  "verificationId": "ver_abc123xyz789",
  "status": "COMPLETED",

  "vendor": {
    "name": "MathGenius Learning",
    "websiteUrl": "https://www.mathgeniuslearning.com",
    "verifiedDomain": "mathgeniuslearning.com"
  },

  "score": {
    "total": 78,
    "maxPossible": 100,
    "percentile": 72,
    "breakdown": {
      "basicSignals": 65,
      "enhancedSignals": 13,
      "directoryBonus": 0
    }
  },

  "signals": [
    {
      "type": "EMAIL_DOMAIN_MATCH",
      "passed": true,
      "score": 30,
      "details": "Email domain matches website domain",
      "checkedAt": "2025-11-29T10:30:00Z"
    },
    {
      "type": "WEBSITE_SSL",
      "passed": true,
      "score": 20,
      "details": "Valid SSL certificate, expires 2026-03-15",
      "checkedAt": "2025-11-29T10:30:01Z"
    },
    {
      "type": "WEBSITE_AGE",
      "passed": true,
      "score": 25,
      "details": "Domain registered 847 days ago (2+ years)",
      "checkedAt": "2025-11-29T10:30:02Z"
    },
    {
      "type": "LINKEDIN_COMPANY_PROFILE",
      "passed": true,
      "score": 15,
      "details": "Company profile verified: 45 employees",
      "checkedAt": "2025-11-29T10:30:03Z"
    },
    {
      "type": "APPLICANT_LINKEDIN_VERIFIED",
      "passed": false,
      "score": 0,
      "details": "Could not verify applicant employment",
      "checkedAt": "2025-11-29T10:30:04Z"
    }
  ],

  "directoryResults": [
    {
      "directory": "common_sense",
      "found": false,
      "details": "Not found in Common Sense Privacy Program"
    },
    {
      "directory": "sdpc",
      "found": true,
      "certificationLevel": "NDPA Signatory",
      "details": "Active NDPA signatory since 2024",
      "listingUrl": "https://sdpc.a4l.org/vendors/mathgenius"
    }
  ],

  "recommendation": {
    "tier": "SELECTIVE",
    "confidence": 0.85,
    "approved": true,
    "requiresHumanReview": true,
    "requiresLegalReview": false,
    "reasoning": "Score of 78 meets SELECTIVE tier threshold (75). Human review required per district contract. SDPC membership is a positive indicator."
  },

  "contract": {
    "districtId": "lausd",
    "contractVersion": "2.1",
    "tierApplied": "selective",
    "thresholdMet": true
  },

  "validity": {
    "verifiedAt": "2025-11-29T10:30:05Z",
    "validUntil": "2026-02-27T10:30:05Z",
    "cacheDays": 90,
    "revalidationTriggers": [
      "DOMAIN_CHANGE",
      "SSL_EXPIRY",
      "DIRECTORY_STATUS_CHANGE"
    ]
  },

  "meta": {
    "apiVersion": "1.0",
    "processingTimeMs": 1247,
    "requestId": "req_xyz789abc123"
  }
}
```

#### 2. Get Cached Verification

```
GET /verify/{verificationId}
```

Returns cached verification result if still valid.

#### 3. Lookup Vendor Score

```
GET /vendors/{vendorDomain}/score
```

Returns current score for a vendor if previously verified.

#### 4. List Verified Vendors

```
GET /vendors?directory=common_sense&minScore=70&limit=50
```

Returns list of verified vendors matching criteria.

---

#### Contract Management Endpoints

#### 5. Get District Contract

```
GET /contracts/{districtId}
```

**Response:**
```json
{
  "districtId": "lausd",
  "districtName": "Los Angeles Unified School District",
  "contractVersion": "2.1",
  "effectiveDate": "2025-01-01",

  "tiers": {
    "privacySafe": {
      "name": "Privacy-Safe",
      "description": "Tokenized data only, no PII",
      "minScore": 60,
      "requiredSignals": ["EMAIL_DOMAIN_MATCH", "WEBSITE_SSL"],
      "requiredDirectories": [],
      "autoApprove": true,
      "humanReviewRequired": false,
      "legalReviewRequired": false
    },
    "selective": {
      "name": "Selective",
      "description": "Limited PII (first name, grade level)",
      "minScore": 75,
      "requiredSignals": [
        "EMAIL_DOMAIN_MATCH",
        "WEBSITE_SSL",
        "WEBSITE_AGE",
        "APPLICANT_LINKEDIN_VERIFIED"
      ],
      "requiredDirectories": [],
      "minDirectoryListings": 1,
      "autoApprove": false,
      "humanReviewRequired": true,
      "legalReviewRequired": false
    },
    "fullAccess": {
      "name": "Full Access",
      "description": "Full PII with time-limited windows",
      "minScore": 85,
      "requiredSignals": [
        "EMAIL_DOMAIN_MATCH",
        "WEBSITE_SSL",
        "WEBSITE_AGE",
        "APPLICANT_LINKEDIN_VERIFIED",
        "APPLICANT_EMAIL_CORPORATE"
      ],
      "requiredDirectories": ["common_sense"],
      "minDirectoryListings": 2,
      "autoApprove": false,
      "humanReviewRequired": true,
      "legalReviewRequired": true
    }
  },

  "customWeights": {
    "emailDomainMatch": 30,
    "websiteSSL": 20,
    "websiteAge": 25,
    "linkedInCompanyProfile": 15,
    "linkedInEmployeeCount": 10
  },

  "sla": {
    "maxResponseTimeMs": 5000,
    "cacheValidityDays": 90,
    "supportTier": "pro"
  },

  "updatedAt": "2025-11-15T00:00:00Z"
}
```

#### 6. Update District Contract

```
PUT /contracts/{districtId}
```

Allows districts to customize their tier requirements and thresholds.

---

# SCORING ENGINE

## [TAG: SCORING-ENGINE]

The Scoring Engine aggregates signals into a single credibility score.

```
╔══════════════════════════════════════════════════════════════════════════╗
║                         SCORING ENGINE                                   ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  SCORE CALCULATION FORMULA                                               ║
║  ─────────────────────────                                               ║
║                                                                          ║
║  Total Score = Basic Score + Enhanced Score + Directory Bonus            ║
║                                                                          ║
║  Where:                                                                  ║
║  • Basic Score = Σ (signal_passed ? weight : 0) for basic signals        ║
║  • Enhanced Score = Σ (signal_passed ? weight : 0) for enhanced signals  ║
║  • Directory Bonus = Σ (found ? directory_weight : 0) for directories    ║
║                                                                          ║
║  ═══════════════════════════════════════════════════════════════════════ ║
║                                                                          ║
║  EXAMPLE CALCULATION                                                     ║
║  ───────────────────                                                     ║
║                                                                          ║
║  Vendor: MathGenius Learning                                             ║
║                                                                          ║
║  Basic Signals:                                                          ║
║  ┌─────────────────────────┬────────┬────────┬────────┐                 ║
║  │ Signal                  │ Passed │ Weight │ Points │                 ║
║  ├─────────────────────────┼────────┼────────┼────────┤                 ║
║  │ EMAIL_DOMAIN_MATCH      │ ✓      │ 30     │ 30     │                 ║
║  │ WEBSITE_SSL             │ ✓      │ 20     │ 20     │                 ║
║  │ WEBSITE_AGE             │ ✓      │ 25     │ 25     │                 ║
║  │ LINKEDIN_COMPANY        │ ✓      │ 15     │ 15     │                 ║
║  │ EMPLOYEE_COUNT          │ ✓      │ 10     │ 10     │                 ║
║  ├─────────────────────────┼────────┼────────┼────────┤                 ║
║  │ Basic Total             │        │ 100    │ 100    │                 ║
║  └─────────────────────────┴────────┴────────┴────────┘                 ║
║                                                                          ║
║  Enhanced Signals:                                                       ║
║  ┌─────────────────────────┬────────┬────────┬────────┐                 ║
║  │ Signal                  │ Passed │ Weight │ Points │                 ║
║  ├─────────────────────────┼────────┼────────┼────────┤                 ║
║  │ APPLICANT_LINKEDIN      │ ✗      │ 25     │ 0      │                 ║
║  │ APPLICANT_EMAIL_CORP    │ ✓      │ 10     │ 10     │                 ║
║  ├─────────────────────────┼────────┼────────┼────────┤                 ║
║  │ Enhanced Total          │        │ 35     │ 10     │                 ║
║  └─────────────────────────┴────────┴────────┴────────┘                 ║
║                                                                          ║
║  Directory Bonus:                                                        ║
║  ┌─────────────────────────┬────────┬────────┬────────┐                 ║
║  │ Directory               │ Found  │ Weight │ Points │                 ║
║  ├─────────────────────────┼────────┼────────┼────────┤                 ║
║  │ Common Sense            │ ✗      │ 25     │ 0      │                 ║
║  │ SDPC                    │ ✓      │ 20     │ 20     │                 ║
║  │ Privacy Pledge          │ ✗      │ 15     │ 0      │                 ║
║  ├─────────────────────────┼────────┼────────┼────────┤                 ║
║  │ Directory Total         │        │        │ 20     │                 ║
║  └─────────────────────────┴────────┴────────┴────────┘                 ║
║                                                                          ║
║  ═══════════════════════════════════════════════════════════════════════ ║
║                                                                          ║
║  FINAL SCORE: 100 + 10 + 20 = 130 (capped at 100 for display)            ║
║  NORMALIZED: 100                                                         ║
║  PERCENTILE: 95th (better than 95% of verified vendors)                  ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

### Confidence Calculation

```
Confidence = (signals_verified / total_signals) × data_freshness_factor

Where:
• signals_verified = number of signals that returned definitive results
• total_signals = total signals attempted
• data_freshness_factor = 1.0 if <7 days, 0.9 if <30 days, 0.8 if <90 days
```

### Percentile Ranking

Vendors are ranked against all verified vendors in the database:

| Percentile | Interpretation |
|------------|----------------|
| 90-100 | Excellent - Top tier vendor |
| 70-89 | Good - Meets most requirements |
| 50-69 | Average - May need additional verification |
| 25-49 | Below Average - Enhanced scrutiny recommended |
| 0-24 | Poor - High risk, likely rejection |

---

# CONTRACT EVALUATOR

## [TAG: CONTRACT-EVALUATOR]

The Contract Evaluator applies district-specific rules to the score to generate recommendations.

```
╔══════════════════════════════════════════════════════════════════════════╗
║                       CONTRACT EVALUATOR                                 ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  EVALUATION FLOW                                                         ║
║  ───────────────                                                         ║
║                                                                          ║
║  ┌──────────────────────────────────────────────────────────────────┐   ║
║  │                                                                   │   ║
║  │  1. LOAD CONTRACT                                                 │   ║
║  │     Load district's verification contract from database           │   ║
║  │                                                                   │   ║
║  │                         ▼                                         │   ║
║  │                                                                   │   ║
║  │  2. DETERMINE REQUESTED TIER                                      │   ║
║  │     Based on data elements requested, determine applicable tier   │   ║
║  │                                                                   │   ║
║  │     Data Elements → Tier Mapping:                                 │   ║
║  │     • Tokenized only → PRIVACY_SAFE                               │   ║
║  │     • First name, grade → SELECTIVE                               │   ║
║  │     • Full PII → FULL_ACCESS                                      │   ║
║  │                                                                   │   ║
║  │                         ▼                                         │   ║
║  │                                                                   │   ║
║  │  3. CHECK REQUIRED SIGNALS                                        │   ║
║  │     Verify all required signals for the tier passed               │   ║
║  │                                                                   │   ║
║  │     IF any required signal failed:                                │   ║
║  │       → REJECT or MANUAL_REVIEW (per contract)                    │   ║
║  │                                                                   │   ║
║  │                         ▼                                         │   ║
║  │                                                                   │   ║
║  │  4. CHECK REQUIRED DIRECTORIES                                    │   ║
║  │     Verify vendor is listed in required directories               │   ║
║  │                                                                   │   ║
║  │     IF required directory missing:                                │   ║
║  │       → REJECT or MANUAL_REVIEW (per contract)                    │   ║
║  │                                                                   │   ║
║  │                         ▼                                         │   ║
║  │                                                                   │   ║
║  │  5. CHECK SCORE THRESHOLD                                         │   ║
║  │     Compare total score against tier's minScore                   │   ║
║  │                                                                   │   ║
║  │     IF score >= minScore:                                         │   ║
║  │       → APPROVED (subject to review requirements)                 │   ║
║  │     ELSE IF score >= reviewThreshold:                             │   ║
║  │       → MANUAL_REVIEW                                             │   ║
║  │     ELSE:                                                         │   ║
║  │       → REJECTED                                                  │   ║
║  │                                                                   │   ║
║  │                         ▼                                         │   ║
║  │                                                                   │   ║
║  │  6. APPLY REVIEW REQUIREMENTS                                     │   ║
║  │     Per contract, add review flags:                               │   ║
║  │     • humanReviewRequired                                         │   ║
║  │     • legalReviewRequired                                         │   ║
║  │                                                                   │   ║
║  │                         ▼                                         │   ║
║  │                                                                   │   ║
║  │  7. GENERATE RECOMMENDATION                                       │   ║
║  │     Output final recommendation with reasoning                    │   ║
║  │                                                                   │   ║
║  └──────────────────────────────────────────────────────────────────┘   ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

### Decision Matrix

```
╔════════════════════════════════════════════════════════════════════════════╗
║                    DECISION MATRIX BY TIER                                 ║
╠════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  PRIVACY-SAFE TIER                                                         ║
║  ─────────────────                                                         ║
║  ┌─────────────────────┬───────────┬─────────────────────────────────────┐║
║  │ Condition           │ Decision  │ Action                              │║
║  ├─────────────────────┼───────────┼─────────────────────────────────────┤║
║  │ Score ≥ 60          │ APPROVED  │ Auto-approve, no review             │║
║  │ Score 40-59         │ REVIEW    │ Human review recommended            │║
║  │ Score < 40          │ REJECTED  │ Does not meet minimum standards     │║
║  │ Required signal fail│ REVIEW    │ Cannot auto-approve                 │║
║  └─────────────────────┴───────────┴─────────────────────────────────────┘║
║                                                                            ║
║  SELECTIVE TIER                                                            ║
║  ──────────────                                                            ║
║  ┌─────────────────────┬───────────┬─────────────────────────────────────┐║
║  │ Condition           │ Decision  │ Action                              │║
║  ├─────────────────────┼───────────┼─────────────────────────────────────┤║
║  │ Score ≥ 75          │ APPROVED  │ Approved pending human review       │║
║  │ Score 50-74         │ REVIEW    │ Needs additional verification       │║
║  │ Score < 50          │ REJECTED  │ Does not meet requirements          │║
║  │ Required signal fail│ REJECTED  │ Missing critical verification       │║
║  │ No directory listing│ REVIEW    │ Needs at least one listing          │║
║  └─────────────────────┴───────────┴─────────────────────────────────────┘║
║                                                                            ║
║  FULL ACCESS TIER                                                          ║
║  ────────────────                                                          ║
║  ┌─────────────────────┬───────────┬─────────────────────────────────────┐║
║  │ Condition           │ Decision  │ Action                              │║
║  ├─────────────────────┼───────────┼─────────────────────────────────────┤║
║  │ Score ≥ 85          │ APPROVED  │ Approved pending human + legal      │║
║  │ Score 70-84         │ REVIEW    │ Close to threshold, needs review    │║
║  │ Score < 70          │ REJECTED  │ Does not meet requirements          │║
║  │ Required signal fail│ REJECTED  │ Missing critical verification       │║
║  │ Common Sense missing│ REJECTED  │ Required directory not found        │║
║  │ < 2 directory list. │ REVIEW    │ Needs additional credentials        │║
║  └─────────────────────┴───────────┴─────────────────────────────────────┘║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
```

---

# VERIFICATION API TIERS

## [TAG: VERIFICATION-API-TIERS]

```
╔══════════════════════════════════════════════════════════════════════════╗
║                    VERIFICATION API SERVICE TIERS                        ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  ┌────────────────────────────────────────────────────────────────────┐ ║
║  │                                                                     │ ║
║  │   ███████╗██████╗ ███████╗███████╗                                 │ ║
║  │   ██╔════╝██╔══██╗██╔════╝██╔════╝                                 │ ║
║  │   █████╗  ██████╔╝█████╗  █████╗                                   │ ║
║  │   ██╔══╝  ██╔══██╗██╔══╝  ██╔══╝                                   │ ║
║  │   ██║     ██║  ██║███████╗███████╗                                 │ ║
║  │   ╚═╝     ╚═╝  ╚═╝╚══════╝╚══════╝  TIER                           │ ║
║  │                                                                     │ ║
║  │   Price: $0/month                                                   │ ║
║  │                                                                     │ ║
║  │   ┌─────────────────────────────────────────────────────────────┐  │ ║
║  │   │ INCLUDED                                                     │  │ ║
║  │   │ ─────────                                                    │  │ ║
║  │   │ • 100 verifications per month                                │  │ ║
║  │   │ • Basic signals only (5 checks)                              │  │ ║
║  │   │ • 7-day cache validity                                       │  │ ║
║  │   │ • Standard contract templates                                │  │ ║
║  │   │ • Community support                                          │  │ ║
║  │   │ • API documentation access                                   │  │ ║
║  │   └─────────────────────────────────────────────────────────────┘  │ ║
║  │                                                                     │ ║
║  │   ┌─────────────────────────────────────────────────────────────┐  │ ║
║  │   │ NOT INCLUDED                                                 │  │ ║
║  │   │ ─────────────                                                │  │ ║
║  │   │ • Enhanced signals (applicant verification)                  │  │ ║
║  │   │ • Directory integrations                                     │  │ ║
║  │   │ • Custom contract configuration                              │  │ ║
║  │   │ • Webhooks                                                   │  │ ║
║  │   │ • Priority support                                           │  │ ║
║  │   └─────────────────────────────────────────────────────────────┘  │ ║
║  │                                                                     │ ║
║  │   BEST FOR: Small districts, evaluation, pilot programs            │ ║
║  │                                                                     │ ║
║  └────────────────────────────────────────────────────────────────────┘ ║
║                                                                          ║
║  ┌────────────────────────────────────────────────────────────────────┐ ║
║  │                                                                     │ ║
║  │   ██████╗ ██████╗  ██████╗                                         │ ║
║  │   ██╔══██╗██╔══██╗██╔═══██╗                                        │ ║
║  │   ██████╔╝██████╔╝██║   ██║                                        │ ║
║  │   ██╔═══╝ ██╔══██╗██║   ██║                                        │ ║
║  │   ██║     ██║  ██║╚██████╔╝                                        │ ║
║  │   ╚═╝     ╚═╝  ╚═╝ ╚═════╝   TIER                                  │ ║
║  │                                                                     │ ║
║  │   Price: $500/month                                                 │ ║
║  │                                                                     │ ║
║  │   ┌─────────────────────────────────────────────────────────────┐  │ ║
║  │   │ INCLUDED                                                     │  │ ║
║  │   │ ─────────                                                    │  │ ║
║  │   │ • Unlimited verifications                                    │  │ ║
║  │   │ • All basic signals (5 checks)                               │  │ ║
║  │   │ • All enhanced signals (2 checks)                            │  │ ║
║  │   │ • All directory integrations (8 directories)                 │  │ ║
║  │   │ • 90-day cache validity                                      │  │ ║
║  │   │ • Custom contract configuration                              │  │ ║
║  │   │ • Webhook notifications                                      │  │ ║
║  │   │ • Email support (24hr response)                              │  │ ║
║  │   │ • Quarterly usage reports                                    │  │ ║
║  │   │ • Vendor database search access                              │  │ ║
║  │   └─────────────────────────────────────────────────────────────┘  │ ║
║  │                                                                     │ ║
║  │   ┌─────────────────────────────────────────────────────────────┐  │ ║
║  │   │ NOT INCLUDED                                                 │  │ ║
║  │   │ ─────────────                                                │  │ ║
║  │   │ • SLA guarantees                                             │  │ ║
║  │   │ • Dedicated support                                          │  │ ║
║  │   │ • Custom directory integrations                              │  │ ║
║  │   │ • On-premise deployment                                      │  │ ║
║  │   │ • White-label option                                         │  │ ║
║  │   └─────────────────────────────────────────────────────────────┘  │ ║
║  │                                                                     │ ║
║  │   BEST FOR: Medium districts, active vendor management             │ ║
║  │                                                                     │ ║
║  └────────────────────────────────────────────────────────────────────┘ ║
║                                                                          ║
║  ┌────────────────────────────────────────────────────────────────────┐ ║
║  │                                                                     │ ║
║  │   ███████╗███╗   ██╗████████╗███████╗██████╗ ██████╗ ██████╗ ██╗   │ ║
║  │   ██╔════╝████╗  ██║╚══██╔══╝██╔════╝██╔══██╗██╔══██╗██╔══██╗██║   │ ║
║  │   █████╗  ██╔██╗ ██║   ██║   █████╗  ██████╔╝██████╔╝██████╔╝██║   │ ║
║  │   ██╔══╝  ██║╚██╗██║   ██║   ██╔══╝  ██╔══██╗██╔═══╝ ██╔══██╗██║   │ ║
║  │   ███████╗██║ ╚████║   ██║   ███████╗██║  ██║██║     ██║  ██║██║   │ ║
║  │   ╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝╚═╝   │ ║
║  │                                                TIER                 │ ║
║  │                                                                     │ ║
║  │   Price: Custom (starting at $2,000/month)                          │ ║
║  │                                                                     │ ║
║  │   ┌─────────────────────────────────────────────────────────────┐  │ ║
║  │   │ INCLUDED (Everything in Pro, plus:)                         │  │ ║
║  │   │ ───────────────────────────────────                         │  │ ║
║  │   │ • 99.9% uptime SLA                                          │  │ ║
║  │   │ • Dedicated success manager                                 │  │ ║
║  │   │ • Custom directory integrations                             │  │ ║
║  │   │ • Priority API endpoints                                    │  │ ║
║  │   │ • Real-time streaming webhooks                              │  │ ║
║  │   │ • On-premise deployment option                              │  │ ║
║  │   │ • White-label / co-branded option                           │  │ ║
║  │   │ • Custom signal development                                 │  │ ║
║  │   │ • SSO integration                                           │  │ ║
║  │   │ • Audit log exports                                         │  │ ║
║  │   │ • Training and onboarding                                   │  │ ║
║  │   │ • Quarterly business reviews                                │  │ ║
║  │   └─────────────────────────────────────────────────────────────┘  │ ║
║  │                                                                     │ ║
║  │   BEST FOR: Large districts (100K+ students), state agencies,      │ ║
║  │             district consortiums                                    │ ║
║  │                                                                     │ ║
║  └────────────────────────────────────────────────────────────────────┘ ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

### Tier Comparison Matrix

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| **Verifications/Month** | 100 | Unlimited | Unlimited |
| **Basic Signals** | ✓ | ✓ | ✓ |
| **Enhanced Signals** | - | ✓ | ✓ |
| **Directory Checks** | - | ✓ | ✓ |
| **Cache Validity** | 7 days | 90 days | Custom |
| **Custom Contracts** | - | ✓ | ✓ |
| **Webhooks** | - | ✓ | ✓ |
| **Vendor Search** | - | ✓ | ✓ |
| **SLA** | - | - | 99.9% |
| **Support** | Community | Email 24hr | Dedicated |
| **On-Premise** | - | - | ✓ |
| **White-Label** | - | - | ✓ |
| **Price** | $0 | $500/mo | Custom |

---

# VERIFICATION API PRICING

## [TAG: VERIFICATION-API-PRICING]

```
╔══════════════════════════════════════════════════════════════════════════╗
║                     PRICING STRATEGY                                     ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  PRICING PHILOSOPHY                                                      ║
║  ──────────────────                                                      ║
║                                                                          ║
║  1. FREE TIER IS STRATEGIC                                               ║
║     • Lowers barrier to adoption                                         ║
║     • Builds vendor database (network effects)                           ║
║     • Upsell path to Pro when limits hit                                 ║
║                                                                          ║
║  2. VALUE-BASED PRICING                                                  ║
║     • Districts save $50K-100K/year on privacy staff                     ║
║     • $500/month = 5-10% of cost savings                                 ║
║     • Clear ROI for budget justification                                 ║
║                                                                          ║
║  3. ENTERPRISE CAPTURES VALUE                                            ║
║     • Large districts have larger budgets                                ║
║     • Custom pricing based on student count                              ║
║     • Multi-year contracts reduce churn                                  ║
║                                                                          ║
║  ═══════════════════════════════════════════════════════════════════════ ║
║                                                                          ║
║  PRICING TABLE                                                           ║
║  ─────────────                                                           ║
║                                                                          ║
║  ┌──────────────┬────────────────┬─────────────────────────────────────┐║
║  │ Tier         │ Monthly Price  │ Annual Price (15% discount)         │║
║  ├──────────────┼────────────────┼─────────────────────────────────────┤║
║  │ Free         │ $0             │ $0                                  │║
║  │ Pro          │ $500           │ $5,100 ($425/mo)                    │║
║  │ Enterprise   │ From $2,000    │ From $20,400                        │║
║  └──────────────┴────────────────┴─────────────────────────────────────┘║
║                                                                          ║
║  ENTERPRISE PRICING TIERS                                                ║
║  ────────────────────────                                                ║
║                                                                          ║
║  ┌──────────────────────┬─────────────┬────────────────────────────────┐║
║  │ District Size        │ Monthly     │ Includes                       │║
║  ├──────────────────────┼─────────────┼────────────────────────────────┤║
║  │ 50K-100K students    │ $2,000      │ Standard Enterprise            │║
║  │ 100K-250K students   │ $3,500      │ + Dedicated support            │║
║  │ 250K-500K students   │ $5,000      │ + Custom integrations          │║
║  │ 500K+ students       │ $7,500+     │ + On-premise option            │║
║  │ State Agency         │ Custom      │ Full customization             │║
║  └──────────────────────┴─────────────┴────────────────────────────────┘║
║                                                                          ║
║  ═══════════════════════════════════════════════════════════════════════ ║
║                                                                          ║
║  ADDITIONAL REVENUE STREAMS                                              ║
║  ──────────────────────────                                              ║
║                                                                          ║
║  1. OVERAGE CHARGES (Free tier)                                          ║
║     • $5 per additional verification beyond 100                          ║
║     • Auto-upgrade prompt at 80% usage                                   ║
║                                                                          ║
║  2. VENDOR PREMIUM LISTINGS                                              ║
║     • Vendors pay for "verified" badge                                   ║
║     • $100/month for priority in search results                          ║
║     • $500/month for featured placement                                  ║
║                                                                          ║
║  3. PROFESSIONAL SERVICES                                                ║
║     • Custom signal development: $5,000-20,000                           ║
║     • Contract consulting: $200/hour                                     ║
║     • Training: $1,500/session                                           ║
║                                                                          ║
║  4. DATA INSIGHTS (Anonymized)                                           ║
║     • Industry reports on EdTech verification trends                     ║
║     • Benchmark data for compliance                                      ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

### Revenue Model Projections

```
╔══════════════════════════════════════════════════════════════════════════╗
║                     REVENUE PROJECTIONS (18 MONTHS)                      ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  ASSUMPTIONS                                                             ║
║  ───────────                                                             ║
║  • 10% of districts convert Free → Pro                                   ║
║  • 5% of Pro districts upgrade to Enterprise                             ║
║  • Average Enterprise contract: $3,000/month                             ║
║  • Vendor premium listings: 5% adoption at $200/month average            ║
║                                                                          ║
║  ═══════════════════════════════════════════════════════════════════════ ║
║                                                                          ║
║  MONTH 6                                                                 ║
║  ────────                                                                ║
║  Districts on Free:        45                                            ║
║  Districts on Pro:          5 × $500 = $2,500/month                      ║
║  Districts on Enterprise:   0                                            ║
║  Vendor Listings:          25 × $200 = $5,000/month                      ║
║                                                                          ║
║  Monthly Revenue: $7,500                                                 ║
║  ARR Run Rate: $90,000                                                   ║
║                                                                          ║
║  ═══════════════════════════════════════════════════════════════════════ ║
║                                                                          ║
║  MONTH 12                                                                ║
║  ─────────                                                               ║
║  Districts on Free:       240                                            ║
║  Districts on Pro:         50 × $500 = $25,000/month                     ║
║  Districts on Enterprise:  10 × $3,000 = $30,000/month                   ║
║  Vendor Listings:         100 × $200 = $20,000/month                     ║
║                                                                          ║
║  Monthly Revenue: $75,000                                                ║
║  ARR Run Rate: $900,000                                                  ║
║                                                                          ║
║  ═══════════════════════════════════════════════════════════════════════ ║
║                                                                          ║
║  MONTH 18                                                                ║
║  ─────────                                                               ║
║  Districts on Free:       800                                            ║
║  Districts on Pro:        150 × $500 = $75,000/month                     ║
║  Districts on Enterprise:  50 × $3,000 = $150,000/month                  ║
║  Vendor Listings:         250 × $200 = $50,000/month                     ║
║                                                                          ║
║  Monthly Revenue: $275,000                                               ║
║  ARR Run Rate: $3,300,000                                                ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

# Competitive Analysis

## [TAG: COMPETITIVE-ANALYSIS]

```
╔══════════════════════════════════════════════════════════════════════════╗
║                      COMPETITIVE LANDSCAPE                               ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  DIRECT COMPETITORS: None (First-mover advantage)                        ║
║  ────────────────────────────────────────────────                        ║
║                                                                          ║
║  There is no existing EdTech verification-as-a-service platform.         ║
║  SchoolDay has first-mover advantage in this category.                   ║
║                                                                          ║
║  ═══════════════════════════════════════════════════════════════════════ ║
║                                                                          ║
║  INDIRECT COMPETITORS                                                    ║
║  ────────────────────                                                    ║
║                                                                          ║
║  ┌─────────────────┬──────────────────────┬────────────────────────────┐║
║  │ Competitor      │ What They Do         │ Why We're Different        │║
║  ├─────────────────┼──────────────────────┼────────────────────────────┤║
║  │ Clever          │ SSO + rostering      │ No verification service    │║
║  │                 │                      │ Districts must do own      │║
║  │                 │                      │ privacy review             │║
║  ├─────────────────┼──────────────────────┼────────────────────────────┤║
║  │ Common Sense    │ Privacy ratings      │ Not API-accessible         │║
║  │ Privacy Program │                      │ We aggregate their data    │║
║  │                 │                      │ as one of our signals      │║
║  ├─────────────────┼──────────────────────┼────────────────────────────┤║
║  │ SDPC / A4L      │ NPDAs / contracts    │ Contract templates only    │║
║  │                 │                      │ No verification service    │║
║  │                 │                      │ We integrate their data    │║
║  ├─────────────────┼──────────────────────┼────────────────────────────┤║
║  │ State EdTech    │ Approved vendor      │ Static lists, no scoring   │║
║  │ Offices         │ lists                │ We aggregate as signals    │║
║  ├─────────────────┼──────────────────────┼────────────────────────────┤║
║  │ Manual Review   │ District staff       │ Slow, expensive, no        │║
║  │ (Status Quo)    │ review each vendor   │ standardization            │║
║  └─────────────────┴──────────────────────┴────────────────────────────┘║
║                                                                          ║
║  ═══════════════════════════════════════════════════════════════════════ ║
║                                                                          ║
║  COMPETITIVE MOAT                                                        ║
║  ────────────────                                                        ║
║                                                                          ║
║  1. NETWORK EFFECTS                                                      ║
║     • More districts → more vendor data → more valuable to districts     ║
║     • Self-reinforcing cycle                                             ║
║                                                                          ║
║  2. DATA ADVANTAGE                                                       ║
║     • Aggregated verification data from multiple sources                 ║
║     • Historical scoring trends                                          ║
║     • Predictive capabilities over time                                  ║
║                                                                          ║
║  3. SWITCHING COSTS                                                      ║
║     • Districts build workflows around our API                           ║
║     • Custom contracts tied to our scoring system                        ║
║     • Integration with district approval processes                       ║
║                                                                          ║
║  4. REGULATORY ALIGNMENT                                                 ║
║     • Positioned for compliance requirements                             ║
║     • As privacy laws tighten, our value increases                       ║
║                                                                          ║
║  5. DIRECTORY PARTNERSHIPS                                               ║
║     • Exclusive or preferred API access to directories                   ║
║     • Creates barrier to replication                                     ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

# Implementation Roadmap

## [TAG: IMPLEMENTATION-ROADMAP]

```
╔══════════════════════════════════════════════════════════════════════════╗
║              EDTECH CREDIT BUREAU - IMPLEMENTATION PHASES                ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  PHASE 1: FOUNDATION (Weeks 1-4)                                         ║
║  ════════════════════════════════                                        ║
║  Goal: Core API and basic verification working                           ║
║                                                                          ║
║  ┌────────────────────────────────────────────────────────────────────┐ ║
║  │                                                                     │ ║
║  │  Week 1-2: API Infrastructure                                       │ ║
║  │  ─────────────────────────────                                      │ ║
║  │  □ Design OpenAPI specification                                     │ ║
║  │  □ Implement API gateway (authentication, rate limiting)            │ ║
║  │  □ Create /verify endpoint                                          │ ║
║  │  □ Create /contracts endpoint                                       │ ║
║  │  □ Set up usage metering                                            │ ║
║  │  □ Implement API key management                                     │ ║
║  │                                                                     │ ║
║  │  Week 3-4: Verification Engine                                      │ ║
║  │  ─────────────────────────────                                      │ ║
║  │  □ Refactor existing verification code for API use                  │ ║
║  │  □ Implement all 5 basic signals                                    │ ║
║  │  □ Implement scoring engine                                         │ ║
║  │  □ Implement contract evaluator                                     │ ║
║  │  □ Create response formatter                                        │ ║
║  │  □ Add comprehensive logging                                        │ ║
║  │                                                                     │ ║
║  │  Deliverable: MVP API with basic verification                       │ ║
║  │  Effort: 60 hours                                                   │ ║
║  │                                                                     │ ║
║  └────────────────────────────────────────────────────────────────────┘ ║
║                                                                          ║
║  PHASE 2: ENHANCED SIGNALS (Weeks 5-8)                                   ║
║  ══════════════════════════════════════                                  ║
║  Goal: Full signal coverage including directories                        ║
║                                                                          ║
║  ┌────────────────────────────────────────────────────────────────────┐ ║
║  │                                                                     │ ║
║  │  Week 5-6: Enhanced Signals                                         │ ║
║  │  ──────────────────────────                                         │ ║
║  │  □ Implement applicant LinkedIn verification                        │ ║
║  │  □ Implement corporate email check                                  │ ║
║  │  □ Create WHOIS integration for domain age                          │ ║
║  │  □ Create LinkedIn API integration                                  │ ║
║  │                                                                     │ ║
║  │  Week 7-8: Directory Integrations                                   │ ║
║  │  ────────────────────────────                                       │ ║
║  │  □ Implement 1EdTech directory check                                │ ║
║  │  □ Implement Common Sense Privacy check                             │ ║
║  │  □ Implement SDPC check                                             │ ║
║  │  □ Implement iKeepSafe check                                        │ ║
║  │  □ Implement Privacy Pledge check                                   │ ║
║  │  □ Implement Clever/ClassLink checks                                │ ║
║  │  □ Implement state approved list checks                             │ ║
║  │  □ Create directory result aggregator                               │ ║
║  │                                                                     │ ║
║  │  Deliverable: Full verification with all signals                    │ ║
║  │  Effort: 80 hours                                                   │ ║
║  │                                                                     │ ║
║  └────────────────────────────────────────────────────────────────────┘ ║
║                                                                          ║
║  PHASE 3: CONTRACTS & CACHING (Weeks 9-12)                               ║
║  ══════════════════════════════════════════                              ║
║  Goal: Production-ready with contracts and caching                       ║
║                                                                          ║
║  ┌────────────────────────────────────────────────────────────────────┐ ║
║  │                                                                     │ ║
║  │  Week 9-10: Contract System                                         │ ║
║  │  ──────────────────────────                                         │ ║
║  │  □ Design contract schema                                           │ ║
║  │  □ Create contract management API                                   │ ║
║  │  □ Build contract templates (Privacy-Safe, Selective, Full Access)  │ ║
║  │  □ Implement contract versioning                                    │ ║
║  │  □ Create contract UI for district admins                           │ ║
║  │                                                                     │ ║
║  │  Week 11-12: Caching & Performance                                  │ ║
║  │  ─────────────────────────────                                      │ ║
║  │  □ Implement Redis caching layer                                    │ ║
║  │  □ Create cache invalidation rules                                  │ ║
║  │  □ Implement vendor database                                        │ ║
║  │  □ Create vendor search endpoint                                    │ ║
║  │  □ Performance optimization                                         │ ║
║  │  □ Load testing                                                     │ ║
║  │                                                                     │ ║
║  │  Deliverable: Production-ready API                                  │ ║
║  │  Effort: 80 hours                                                   │ ║
║  │                                                                     │ ║
║  └────────────────────────────────────────────────────────────────────┘ ║
║                                                                          ║
║  PHASE 4: COMMERCIALIZATION (Weeks 13-16)                                ║
║  ═════════════════════════════════════════                               ║
║  Goal: Launch with pricing and billing                                   ║
║                                                                          ║
║  ┌────────────────────────────────────────────────────────────────────┐ ║
║  │                                                                     │ ║
║  │  Week 13-14: Billing & Pricing                                      │ ║
║  │  ─────────────────────────────                                      │ ║
║  │  □ Integrate Stripe for billing                                     │ ║
║  │  □ Implement usage metering                                         │ ║
║  │  □ Create tier enforcement                                          │ ║
║  │  □ Build billing dashboard                                          │ ║
║  │  □ Implement overage handling                                       │ ║
║  │                                                                     │ ║
║  │  Week 15-16: Documentation & Launch                                 │ ║
║  │  ──────────────────────────────                                     │ ║
║  │  □ Create API documentation site                                    │ ║
║  │  □ Build developer quickstart                                       │ ║
║  │  □ Create SDK (JavaScript, Python)                                  │ ║
║  │  □ Write integration guides                                         │ ║
║  │  □ Launch marketing site                                            │ ║
║  │  □ Announce to pilot districts                                      │ ║
║  │                                                                     │ ║
║  │  Deliverable: Commercial launch                                     │ ║
║  │  Effort: 60 hours                                                   │ ║
║  │                                                                     │ ║
║  └────────────────────────────────────────────────────────────────────┘ ║
║                                                                          ║
║  ═══════════════════════════════════════════════════════════════════════ ║
║                                                                          ║
║  TOTAL EFFORT: 280 hours over 16 weeks                                   ║
║  AT 25 HRS/WEEK: 11 weeks dedicated development                          ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

### Implementation Timeline

```
WEEK:    1    2    3    4    5    6    7    8    9   10   11   12   13   14   15   16
         │    │    │    │    │    │    │    │    │    │    │    │    │    │    │    │
PHASE 1: ├─────────────────────┤
         │  API + Basic Verify │
         └─────────────────────┼─────────────────────┤
                               │  Enhanced + Dirs    │
                               └─────────────────────┼─────────────────────┤
                                                     │ Contracts + Cache   │
                                                     └─────────────────────┼─────────────────┤
                                                                           │ Commercialize   │
                                                                           └─────────────────┘
```

---

# Risk Assessment

## [TAG: RISK-ASSESSMENT]

```
╔══════════════════════════════════════════════════════════════════════════╗
║                         RISK ASSESSMENT                                  ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  HIGH RISK                                                               ║
║  ─────────                                                               ║
║                                                                          ║
║  Risk: Directory API access denied                                       ║
║  Impact: Cannot verify against key directories (Common Sense, etc.)      ║
║  Probability: Medium                                                     ║
║  Mitigation:                                                             ║
║    • Web scraping as fallback                                            ║
║    • Partner with directories for official access                        ║
║    • Manual verification queue for missing directories                   ║
║                                                                          ║
║  Risk: LinkedIn API restrictions                                         ║
║  Impact: Cannot verify company profiles or applicant employment          ║
║  Probability: Medium-High                                                ║
║  Mitigation:                                                             ║
║    • Use official LinkedIn Sales Navigator API                           ║
║    • Alternative: Request verification screenshot from applicant         ║
║    • Partner with LinkedIn for EdTech verification program               ║
║                                                                          ║
║  Risk: False positives/negatives damage trust                            ║
║  Impact: Districts lose confidence in scoring                            ║
║  Probability: Medium                                                     ║
║  Mitigation:                                                             ║
║    • Conservative scoring (better to flag for review than miss)          ║
║    • Human review path for borderline cases                              ║
║    • Continuous calibration based on feedback                            ║
║    • Transparency in scoring methodology                                 ║
║                                                                          ║
║  ═══════════════════════════════════════════════════════════════════════ ║
║                                                                          ║
║  MEDIUM RISK                                                             ║
║  ───────────                                                             ║
║                                                                          ║
║  Risk: Slow adoption by districts                                        ║
║  Impact: Network effects don't materialize                               ║
║  Probability: Medium                                                     ║
║  Mitigation:                                                             ║
║    • Free tier removes barrier                                           ║
║    • LAUSD as anchor customer / case study                               ║
║    • Partner with state agencies for mandated use                        ║
║                                                                          ║
║  Risk: Vendor gaming the system                                          ║
║  Impact: Fake signals, inflated scores                                   ║
║  Probability: Low-Medium                                                 ║
║  Mitigation:                                                             ║
║    • Cross-reference multiple signals                                    ║
║    • Periodic re-verification                                            ║
║    • Fraud detection algorithms                                          ║
║    • Vendor accountability (score reduction for issues)                  ║
║                                                                          ║
║  Risk: Competitors copy the model                                        ║
║  Impact: Lose first-mover advantage                                      ║
║  Probability: Medium (12-18 months out)                                  ║
║  Mitigation:                                                             ║
║    • Rapid execution to build network effects                            ║
║    • Exclusive directory partnerships                                    ║
║    • Continuous innovation                                               ║
║                                                                          ║
║  ═══════════════════════════════════════════════════════════════════════ ║
║                                                                          ║
║  LOW RISK                                                                ║
║  ────────                                                                ║
║                                                                          ║
║  Risk: Technical scalability                                             ║
║  Impact: API performance degrades with volume                            ║
║  Probability: Low                                                        ║
║  Mitigation:                                                             ║
║    • Aggressive caching (90-day validity)                                ║
║    • Background processing for directory checks                          ║
║    • Horizontal scaling architecture                                     ║
║                                                                          ║
║  Risk: Legal challenge from vendors                                      ║
║  Impact: Lawsuit over negative scores                                    ║
║  Probability: Low                                                        ║
║  Mitigation:                                                             ║
║    • Transparent methodology                                             ║
║    • Objective, factual signals only                                     ║
║    • Appeal process for vendors                                          ║
║    • Legal review of scoring language                                    ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

# Financial Projections

## [TAG: FINANCIAL-PROJECTIONS]

```
╔══════════════════════════════════════════════════════════════════════════╗
║                     18-MONTH FINANCIAL MODEL                             ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  REVENUE PROJECTIONS                                                     ║
║  ───────────────────                                                     ║
║                                                                          ║
║  ┌───────────┬──────────┬──────────┬──────────┬──────────┬─────────────┐║
║  │ Month     │ Free     │ Pro      │ Enterpr. │ Vendor   │ Total MRR   │║
║  │           │ Dist.    │ Dist.    │ Dist.    │ Listings │             │║
║  ├───────────┼──────────┼──────────┼──────────┼──────────┼─────────────┤║
║  │ Month 3   │ 20       │ 2        │ 0        │ 10       │ $3,000      │║
║  │ Month 6   │ 45       │ 5        │ 0        │ 25       │ $7,500      │║
║  │ Month 9   │ 120      │ 20       │ 5        │ 50       │ $35,000     │║
║  │ Month 12  │ 240      │ 50       │ 10       │ 100      │ $75,000     │║
║  │ Month 15  │ 500      │ 100      │ 25       │ 175      │ $160,000    │║
║  │ Month 18  │ 800      │ 150      │ 50       │ 250      │ $275,000    │║
║  └───────────┴──────────┴──────────┴──────────┴──────────┴─────────────┘║
║                                                                          ║
║  ARR PROGRESSION                                                         ║
║  ───────────────                                                         ║
║                                                                          ║
║  Month 6:   $90,000 ARR                                                  ║
║  Month 12:  $900,000 ARR                                                 ║
║  Month 18:  $3,300,000 ARR                                               ║
║                                                                          ║
║  ═══════════════════════════════════════════════════════════════════════ ║
║                                                                          ║
║  COST STRUCTURE                                                          ║
║  ──────────────                                                          ║
║                                                                          ║
║  ┌─────────────────────────────┬───────────┬────────────────────────────┐║
║  │ Cost Category               │ Monthly   │ Notes                      │║
║  ├─────────────────────────────┼───────────┼────────────────────────────┤║
║  │ Infrastructure (AWS/Vercel) │ $500-2K   │ Scales with usage          │║
║  │ Third-party APIs            │ $500-2K   │ LinkedIn, WHOIS, etc.      │║
║  │ Stripe fees (2.9% + $0.30)  │ ~3% rev   │ Variable                   │║
║  │ Support tools               │ $200      │ Intercom, etc.             │║
║  │ Monitoring                  │ $100      │ Datadog, Sentry            │║
║  └─────────────────────────────┴───────────┴────────────────────────────┘║
║                                                                          ║
║  GROSS MARGIN: ~85% (SaaS industry standard)                             ║
║                                                                          ║
║  ═══════════════════════════════════════════════════════════════════════ ║
║                                                                          ║
║  KEY METRICS                                                             ║
║  ───────────                                                             ║
║                                                                          ║
║  ┌─────────────────────────────┬──────────┬──────────┬──────────────────┐║
║  │ Metric                      │ Month 6  │ Month 12 │ Month 18         │║
║  ├─────────────────────────────┼──────────┼──────────┼──────────────────┤║
║  │ Total Districts             │ 50       │ 300      │ 1,000            │║
║  │ Paying Districts            │ 5        │ 60       │ 200              │║
║  │ Conversion Rate (Free→Paid) │ 10%      │ 20%      │ 20%              │║
║  │ Vendors in Database         │ 500      │ 2,000    │ 5,000            │║
║  │ Monthly Verifications       │ 5,000    │ 50,000   │ 200,000          │║
║  │ ARR                         │ $90K     │ $900K    │ $3.3M            │║
║  │ MRR Growth (MoM)            │ 40%      │ 25%      │ 15%              │║
║  └─────────────────────────────┴──────────┴──────────┴──────────────────┘║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

# Appendix: Technical Specifications

## [TAG: APPENDIX-TECHNICAL-SPECS]

### OpenAPI Specification Summary

```yaml
openapi: 3.0.0
info:
  title: SchoolDay Verification API
  version: 1.0.0
  description: EdTech Credit Bureau as a Service

servers:
  - url: https://api.schoolday.com/verification/v1

paths:
  /verify:
    post:
      summary: Submit verification request
      operationId: submitVerification

  /verify/{verificationId}:
    get:
      summary: Get verification result
      operationId: getVerification

  /vendors/{domain}/score:
    get:
      summary: Lookup vendor score
      operationId: getVendorScore

  /vendors:
    get:
      summary: Search verified vendors
      operationId: searchVendors

  /contracts/{districtId}:
    get:
      summary: Get district contract
      operationId: getContract
    put:
      summary: Update district contract
      operationId: updateContract

  /directories:
    get:
      summary: List available directories
      operationId: listDirectories
```

### Database Schema (Simplified)

```sql
-- Vendors table
CREATE TABLE vendors (
  id UUID PRIMARY KEY,
  domain VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  website_url VARCHAR(500),
  latest_score INT,
  latest_verification_id UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Verifications table
CREATE TABLE verifications (
  id UUID PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id),
  district_id VARCHAR(100),
  score INT,
  signals JSONB,
  directory_results JSONB,
  recommendation JSONB,
  valid_until TIMESTAMP,
  created_at TIMESTAMP
);

-- Contracts table
CREATE TABLE contracts (
  district_id VARCHAR(100) PRIMARY KEY,
  district_name VARCHAR(255),
  tiers JSONB,
  custom_weights JSONB,
  sla JSONB,
  version VARCHAR(20),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Audit log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY,
  event_type VARCHAR(50),
  district_id VARCHAR(100),
  vendor_id UUID,
  verification_id UUID,
  details JSONB,
  created_at TIMESTAMP
);
```

---

## Document Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Author | | | |
| Technical Review | | | |
| Product Review | | | |
| Executive Approval | | | |

---

*Document Version 1.0 - November 29, 2025*
*Classification: Executive Briefing*
*Distribution: Management Team*
