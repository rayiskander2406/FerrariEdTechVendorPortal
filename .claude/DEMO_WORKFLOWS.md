# Demo Workflows - SchoolDay Vendor Portal

**Last Updated**: November 29, 2025
**Version**: 2.0 (CPaaS-Centric)

---

## Strategic Context

SchoolDay's business model is fundamentally different from Clever/ClassLink:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SCHOOLDAY REVENUE MODEL                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CLEVER / CLASSLINK              SCHOOLDAY                                  │
│  ─────────────────               ─────────                                  │
│                                                                             │
│  Revenue: Per-student fees       Revenue: CPaaS (per message)               │
│  Model:   Data pipeline          Model:   Secure relay network              │
│  Moat:    School relationships   Moat:    Privacy + Communication IP        │
│                                                                             │
│  One-time connection fee         RECURRING REVENUE on every                 │
│  No ongoing value capture        email / SMS / push notification            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key Insight**: Communication Gateway is not just a feature—it's the core business model.

---

## 5 Demo Workflows

### Workflow 1: Vendor Onboarding + Verification
**Purpose**: First impression, trust establishment, instant gratification
**Duration**: ~3 minutes
**Key Message**: "Get approved in minutes, not weeks"

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  WORKFLOW 1: VENDOR ONBOARDING + VERIFICATION                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STEP 1: Vendor Introduction                                                │
│  ─────────────────────────────                                              │
│  User: "I'm a new EdTech vendor, I want to integrate with LAUSD"            │
│  AI: Welcomes, asks about their app, suggests PoDS-Lite                     │
│                                                                             │
│  STEP 2: PoDS-Lite Form with Live Verification                              │
│  ─────────────────────────────────────────────────                          │
│  [FORM:PODS_LITE] displays with:                                            │
│  • Basic info fields                                                        │
│  • Website URL → LIVE VERIFICATION:                                         │
│    ├─ SSL Certificate: ✓ Valid                                              │
│    ├─ Domain Age: ✓ 3 years (meets 180-day minimum)                         │
│    ├─ Email Domain Match: ✓ vendor@company.com matches company.com          │
│    └─ LinkedIn Profile: ✓ Found (51-200 employees)                          │
│  • Credibility Score: 87/100 → "Auto-Approval Eligible"                     │
│                                                                             │
│  STEP 3: Instant Approval                                                   │
│  ───────────────────────                                                    │
│  "Congratulations! Your Privacy-Safe access has been approved."             │
│  • Show access tier badge                                                   │
│  • Explain what tokenized data they'll receive                              │
│                                                                             │
│  STEP 4: Credential Provisioning                                            │
│  ──────────────────────────────                                             │
│  [FORM:CREDENTIALS] displays:                                               │
│  • API Key: sbox_test_xxxxx                                                 │
│  • API Secret: (shown once)                                                 │
│  • Base URL: https://api.schoolday.com/oneroster/v1.2                       │
│  • Rate Limit: 60 requests/minute                                           │
│                                                                             │
│  KEY DIFFERENTIATOR SHOWN:                                                  │
│  "EdTech Credit Bureau" - automated trust scoring                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Forms Triggered**: `pods_lite`, `credentials`
**Tools Used**: `submit_pods_lite`, `provision_sandbox`, `get_credentials`

---

### Workflow 2: Communication Gateway (CPaaS) ⭐ REVENUE DRIVER
**Purpose**: Demonstrate core business model, show recurring revenue potential
**Duration**: ~4 minutes
**Key Message**: "Reach parents without knowing their identity—and we meter every message"

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  WORKFLOW 2: COMMUNICATION GATEWAY (CPaaS)                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STEP 1: The Problem                                                        │
│  ──────────────────                                                         │
│  User: "How do I send messages to parents and guardians?"                   │
│  AI: Explains the privacy challenge:                                        │
│  • Traditional: Vendor needs real parent email → privacy risk               │
│  • SchoolDay: Vendor sends to token → we route to parent securely           │
│                                                                             │
│  STEP 2: Token-Based Communication                                          │
│  ─────────────────────────────────                                          │
│  Show the token relay concept:                                              │
│                                                                             │
│  ┌──────────┐     ┌───────────────┐     ┌──────────────┐                   │
│  │  Vendor  │ ──► │   SchoolDay   │ ──► │   Parent/    │                   │
│  │          │     │   Relay       │     │   Guardian   │                   │
│  │ TKN_xxx@ │     │ Routes to     │     │ real@gmail   │                   │
│  │ relay... │     │ real address  │     │ 555-123-4567 │                   │
│  └──────────┘     └───────────────┘     └──────────────┘                   │
│                          │                                                  │
│                    Logs + Bills                                             │
│                                                                             │
│  STEP 3: Send Test Message                                                  │
│  ─────────────────────────                                                  │
│  [FORM:COMM_TEST] with:                                                     │
│  • Channel: Email / SMS toggle                                              │
│  • Recipient Token: TKN_PAR_8x9y2z3a@relay.schoolday.lausd.net              │
│  • Subject: "Sofia's math homework is due tomorrow"                         │
│  • Body: Message content                                                    │
│  • [Send Test Message]                                                      │
│                                                                             │
│  STEP 4: Delivery Confirmation + Billing                                    │
│  ────────────────────────────────────                                       │
│  Response shows:                                                            │
│  • Message ID: msg_abc123                                                   │
│  • Status: QUEUED → DELIVERED                                               │
│  • Routing: Vendor → LAUSD Relay → Parent Email/Phone                       │
│  • 💰 Cost: $0.002 (billed to vendor)                                       │
│                                                                             │
│  STEP 5: Scale Economics                                                    │
│  ───────────────────────                                                    │
│  "With 670K LAUSD families, if each receives 10 messages/month:"            │
│  • Email: 6.7M messages × $0.002 = $13,400/month                            │
│  • SMS:   1M messages × $0.01 = $10,000/month                               │
│  • Total potential: $20K+ MRR from LAUSD alone                              │
│                                                                             │
│  KEY VALUE PROPOSITIONS:                                                    │
│  ─────────────────────────                                                  │
│  FOR VENDORS:                                                               │
│  • Reach parents without PII liability                                      │
│  • No email bounce management                                               │
│  • Delivery confirmation                                                    │
│  • Compliance built-in                                                      │
│                                                                             │
│  FOR DISTRICTS:                                                             │
│  • Parent contact info never leaves the network                             │
│  • Audit trail of all vendor communications                                 │
│  • Block/allow controls per vendor                                          │
│  • FERPA/COPPA compliance guaranteed                                        │
│                                                                             │
│  FOR SCHOOLDAY:                                                             │
│  • Recurring revenue per message                                            │
│  • Network effects (more vendors = more value)                              │
│  • Insurance for the industry                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Forms Triggered**: `comm_test`
**Tools Used**: `send_test_message`

---

### Workflow 3: OneRoster API + Tokenized Data
**Purpose**: Prove data access works, show tokenization in action
**Duration**: ~3 minutes
**Key Message**: "Full functionality with zero PII exposure"

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  WORKFLOW 3: ONEROSTER API + TOKENIZED DATA                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STEP 1: API Overview                                                       │
│  ────────────────────                                                       │
│  User: "Show me student data from the API"                                  │
│  AI: Explains OneRoster endpoints:                                          │
│  • /users - Students and teachers                                           │
│  • /orgs - Schools and district                                             │
│  • /classes - Course sections                                               │
│  • /enrollments - Student-class relationships                               │
│                                                                             │
│  STEP 2: Live API Test                                                      │
│  ────────────────────                                                       │
│  [FORM:API_TESTER] with:                                                    │
│  • Endpoint selector: /users                                                │
│  • Filters: role=student, limit=5                                           │
│  • [Execute Request]                                                        │
│                                                                             │
│  STEP 3: Response Display                                                   │
│  ───────────────────────                                                    │
│  {                                                                          │
│    "users": [                                                               │
│      {                                                                      │
│        "sourcedId": "TKN_STU_8X9Y2Z3A",                                     │
│        "givenName": "Sofia",           ← First name preserved               │
│        "familyName": "[TOKENIZED]",    ← Last name protected                │
│        "email": "TKN_STU_8x9y2z3a@relay.schoolday.lausd.net",               │
│        "grades": ["7"],                                                     │
│        "orgs": [{ "sourcedId": "TKN_SCH_1A2B3C4D" }]                        │
│      }                                                                      │
│    ]                                                                        │
│  }                                                                          │
│                                                                             │
│  STEP 4: Tokenization Explanation                                           │
│  ────────────────────────────────                                           │
│  • Tokens are deterministic (same student = same token always)              │
│  • Cannot be reverse-engineered by vendors                                  │
│  • First names enable personalization ("Great job, Sofia!")                 │
│  • Email tokens route through Communication Gateway                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Forms Triggered**: `api_tester`
**Tools Used**: `test_oneroster`

---

### Workflow 4: SSO Configuration
**Purpose**: Standard enterprise integration, multiple providers
**Duration**: ~3 minutes
**Key Message**: "Seamless login, your choice of provider"

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  WORKFLOW 4: SSO CONFIGURATION                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STEP 1: Provider Selection                                                 │
│  ─────────────────────────                                                  │
│  User: "Set up SSO for our application"                                     │
│  AI: Presents options:                                                      │
│  • SchoolDay (unified K-12 identity)                                        │
│  • Clever (K-8 focus, instant login)                                        │
│  • ClassLink (6-12 focus, LaunchPad)                                        │
│  • Google Workspace (universal)                                             │
│                                                                             │
│  STEP 2: Configuration Form                                                 │
│  ─────────────────────────                                                  │
│  [FORM:SSO_CONFIG] with:                                                    │
│  • Provider: [Clever ▼]                                                     │
│  • Client ID: ____________________                                          │
│  • Client Secret: ____________________                                      │
│  • Redirect URI: https://yourapp.com/oauth/callback                         │
│                                                                             │
│  STEP 3: Configuration Confirmation                                         │
│  ─────────────────────────────────                                          │
│  "Clever SSO configured successfully!"                                      │
│  Next steps:                                                                │
│  • Add clever.com as authorized domain                                      │
│  • Test SSO flow with sample user                                           │
│  • Configure role mappings if needed                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Forms Triggered**: `sso_config`
**Tools Used**: `configure_sso`

---

### Workflow 5: LTI 1.3 Integration
**Purpose**: LMS embedding, Schoology integration
**Duration**: ~3 minutes
**Key Message**: "Deep integration with the learning platform"

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  WORKFLOW 5: LTI 1.3 INTEGRATION                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STEP 1: LTI Overview                                                       │
│  ────────────────────                                                       │
│  User: "I want to embed my app in Schoology"                                │
│  AI: Explains LTI 1.3:                                                      │
│  • Industry standard for LMS integration                                    │
│  • Enables deep linking, grade passback                                     │
│  • LAUSD uses Schoology as primary LMS                                      │
│                                                                             │
│  STEP 2: Platform Information                                               │
│  ────────────────────────────                                               │
│  LAUSD Schoology endpoints provided:                                        │
│  • Issuer: https://schoology.lausd.net                                      │
│  • Auth URL: https://schoology.lausd.net/lti/authorize                      │
│  • Token URL: https://schoology.lausd.net/lti/token                         │
│  • JWKS URL: https://schoology.lausd.net/.well-known/jwks.json              │
│                                                                             │
│  STEP 3: Tool Configuration                                                 │
│  ─────────────────────────                                                  │
│  [FORM:LTI_CONFIG] with:                                                    │
│  • Client ID: (from Schoology)                                              │
│  • Deployment ID: (from Schoology)                                          │
│  • Launch URL: https://yourapp.com/lti/launch                               │
│  • JWKS URL: https://yourapp.com/.well-known/jwks.json                      │
│                                                                             │
│  STEP 4: Integration Complete                                               │
│  ────────────────────────────                                               │
│  "LTI 1.3 integration configured!"                                          │
│  Your app can now:                                                          │
│  • Launch from Schoology course pages                                       │
│  • Receive student context securely                                         │
│  • Pass grades back to gradebook                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Forms Triggered**: `lti_config`
**Tools Used**: `configure_lti`

---

## Demo Flow Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE DEMO FLOW (~15 minutes)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. ONBOARDING + VERIFICATION (3 min)                                       │
│     └── "Get approved in minutes with our EdTech Credit Bureau"             │
│                            │                                                │
│                            ▼                                                │
│  2. COMMUNICATION GATEWAY (4 min) ⭐ REVENUE SHOWCASE                       │
│     └── "Reach students securely—we meter every message"                    │
│                            │                                                │
│                            ▼                                                │
│  3. ONEROSTER API (3 min)                                                   │
│     └── "Full data access with zero PII exposure"                           │
│                            │                                                │
│                            ▼                                                │
│  4. SSO CONFIGURATION (3 min)                                               │
│     └── "Seamless login with Clever, ClassLink, or Google"                  │
│                            │                                                │
│                            ▼                                                │
│  5. LTI INTEGRATION (3 min)                                                 │
│     └── "Deep integration with Schoology LMS"                               │
│                                                                             │
│  DIFFERENTIATORS DEMONSTRATED:                                              │
│  ─────────────────────────────                                              │
│  ✓ Instant approval (vs weeks with competitors)                             │
│  ✓ Vendor verification scoring (unique IP)                                  │
│  ✓ CPaaS revenue model (sustainable business)                               │
│  ✓ Privacy-by-design (tokenization throughout)                              │
│  ✓ Full functionality (SSO, API, LTI, Communication)                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Workflow Priorities for Different Audiences

| Audience | Priority Order | Focus |
|----------|---------------|-------|
| **District IT** | 1 → 3 → 2 → 4 → 5 | Security, compliance, tokenization |
| **District Procurement** | 1 → 2 → 3 | Verification, cost model, data access |
| **EdTech Vendor** | 1 → 3 → 4 → 2 → 5 | Getting started, API access, SSO |
| **Investor/Board** | 2 → 1 → 3 | Revenue model, verification IP |
| **Privacy Officer** | 3 → 2 → 1 | Tokenization, audit, verification |

---

## Success Metrics for Demo

| Workflow | Success Criteria |
|----------|-----------------|
| 1. Onboarding | Form submits, verification signals display, credentials shown |
| 2. Communication | Test message queues, routing path displayed, cost shown |
| 3. OneRoster | API returns data, tokens visible, response time < 2s |
| 4. SSO | Config saves, next steps displayed |
| 5. LTI | Platform info shown, config saves |

---

*Update this file as workflows evolve. Run `/run-demo` to test all workflows.*
