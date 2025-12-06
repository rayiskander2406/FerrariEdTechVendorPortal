# Portal 2.0 Release Plan: Dashboard-First with AI Augmentation

**Release Name**: Portal 2.0 (Codename: "Clarity")
**Version**: v2.0.0
**Status**: APPROVED FOR PLANNING
**Created**: December 6, 2025
**Target Completion**: Q1 2026

---

## Executive Summary

Portal 2.0 transforms the SchoolDay Vendor Portal from a chat-first interface to a dashboard-first experience augmented by contextual AI. This is not a feature addition—it's a fundamental reimagining of how EdTech vendors interact with school district integrations.

### The Core Insight

> **"Chat is the guide, not the destination."**

The current chat-first interface is excellent for demos and first-time users, but slows down experienced users who know what they want. Portal 2.0 inverts this: traditional UI for speed and discoverability, AI for complexity and guidance.

### Success Metrics

| Metric | Current (Chat-First) | Target (Portal 2.0) |
|--------|---------------------|---------------------|
| Time to view credentials | ~30 seconds (typing) | 2 clicks, <3 seconds |
| Task discoverability | Poor (must know to ask) | Excellent (visible navigation) |
| Error resolution time | Variable (AI quality dependent) | Immediate (AI diagnosis button) |
| Power user satisfaction | Low (repetitive typing) | High (one-click actions) |
| First-time user success | Good (guided by AI) | Excellent (guided + visible) |

---

## Part 1: Design Philosophy

### 1.1 The Three Laws of Portal 2.0

1. **Direct actions should be instant.** If a user knows what they want, they should reach it in ≤2 clicks. No typing required.

2. **AI assists, never blocks.** AI should appear when helpful (errors, complexity, first-time tasks) but never stand between the user and their goal.

3. **Progressive disclosure wins.** Show the 80% case by default; reveal complexity only when needed. A vendor checking credentials shouldn't see advanced SSO settings.

### 1.2 User Personas & Primary Tasks

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                          PRIMARY USER PERSONAS                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  PERSONA 1: FIRST-TIME VENDOR                                                ║
║  ────────────────────────────────                                            ║
║  Goals: Complete onboarding, get sandbox credentials, test integration       ║
║  Behavior: Needs guidance, doesn't know terminology                          ║
║  AI Value: HIGH - Onboarding guide, PoDS-Lite help, terminology explainers   ║
║  Key Flows:                                                                  ║
║    1. Complete PoDS-Lite application                                         ║
║    2. Get sandbox credentials                                                ║
║    3. Make first API call                                                    ║
║    4. Understand tokenization                                                ║
║                                                                              ║
║  PERSONA 2: INTEGRATION ENGINEER                                             ║
║  ───────────────────────────────                                             ║
║  Goals: Configure SSO, test APIs, debug issues, review audit logs            ║
║  Behavior: Knows what they want, impatient with friction                     ║
║  AI Value: MEDIUM - Error diagnosis, API response explanations               ║
║  Key Flows:                                                                  ║
║    1. View/rotate credentials                                                ║
║    2. Test OneRoster endpoints                                               ║
║    3. Configure SSO (SAML/OIDC/LTI)                                          ║
║    4. Debug failed sync                                                      ║
║                                                                              ║
║  PERSONA 3: VENDOR ADMIN                                                     ║
║  ─────────────────────────                                                   ║
║  Goals: Monitor status, manage access, request upgrades, review billing      ║
║  Behavior: Infrequent usage, needs quick status checks                       ║
║  AI Value: LOW - Mostly traditional dashboards                               ║
║  Key Flows:                                                                  ║
║    1. Check integration status                                               ║
║    2. View audit logs                                                        ║
║    3. Request tier upgrade                                                   ║
║    4. Download compliance reports                                            ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### 1.3 Information Architecture

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                        PORTAL 2.0 INFORMATION ARCHITECTURE                   ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │                          TOP NAVIGATION BAR                             │ ║
║  │  ┌──────┐  SchoolDay Vendor Portal    [Acme Math]  [Notifications] [?] │ ║
║  │  │ Logo │                                                               │ ║
║  │  └──────┘                                                               │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                              ║
║  ┌────────────────┬────────────────────────────────────────────────────────┐ ║
║  │   SIDEBAR      │                    MAIN CONTENT AREA                   │ ║
║  │                │                                                        │ ║
║  │  ┌──────────┐  │  ┌──────────────────────────────────────────────────┐ │ ║
║  │  │ Overview │  │  │                                                  │ │ ║
║  │  └──────────┘  │  │              [Current Page Content]              │ │ ║
║  │                │  │                                                  │ │ ║
║  │  INTEGRATIONS  │  │  • Status cards, credentials, API tester         │ │ ║
║  │  ┌──────────┐  │  │  • Forms for SSO, LTI configuration              │ │ ║
║  │  │ OneRoster│  │  │  • Tables for audit logs, messages               │ │ ║
║  │  │ SSO      │  │  │                                                  │ │ ║
║  │  │ LTI      │  │  │                                                  │ │ ║
║  │  │ Messages │  │  └──────────────────────────────────────────────────┘ │ ║
║  │  └──────────┘  │                                                        │ ║
║  │                │  ┌──────────────────────────────────────────────────┐ │ ║
║  │  ACCOUNT       │  │              [AI ASSISTANT PANEL]                │ │ ║
║  │  ┌──────────┐  │  │         (slides in from right when triggered)   │ │ ║
║  │  │ Settings │  │  │                                                  │ │ ║
║  │  │ Billing  │  │  │  • Contextual to current page/action             │ │ ║
║  │  │ Team     │  │  │  • Error diagnosis, explanations, drafts         │ │ ║
║  │  │ Audit Log│  │  │  • Collapsible, remembers state                  │ │ ║
║  │  └──────────┘  │  └──────────────────────────────────────────────────┘ │ ║
║  │                │                                                        │ ║
║  │  ┌──────────┐  │                                                        │ ║
║  │  │ 💬 Chat  │  │  ← Legacy chat mode (fallback)                        │ ║
║  │  │   Mode   │  │                                                        │ ║
║  │  └──────────┘  │                                                        │ ║
║  │                │                                                        │ ║
║  └────────────────┴────────────────────────────────────────────────────────┘ ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Part 2: UX Decisions (RESOLVED)

### Decision Summary

| ID | Decision | **SELECTED OPTION** | Rationale |
|----|----------|---------------------|-----------|
| UX-D1 | Chat UI fallback | **B) Keep as "Chat Mode" toggle** | Allows A/B testing; safety net for edge cases; can deprecate later |
| UX-D2 | AI panel behavior | **A) Slide-in from right** | Tested well in prototype; doesn't obscure main content; can resize |
| UX-D3 | Component library | **B) shadcn/ui** | Tailwind-native; copy-paste ownership; highly customizable; accessible |
| UX-D4 | Design system | **A) Internal + AI assistance** | Leverage Claude for design decisions; faster iteration; no external deps |
| UX-D5 | Mobile responsiveness | **A) Desktop-only MVP** | EdTech IT admins are 95% desktop; responsive adds 30% effort; defer to v2.1 |
| UX-D6 | Accessibility | **A) WCAG 2.1 AA** | K-12 contracts require it; shadcn/ui is accessible by default; achievable |
| UX-D7 | User testing | **B) Beta with 3-5 vendors** | Real feedback without scale risk; compensated testing sessions |

### Decision Details

#### UX-D1: Chat UI Fallback Strategy

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  DECISION: Keep Chat Mode as Toggle (Option B)                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  IMPLEMENTATION:                                                             ║
║  • "Chat Mode" button in sidebar (bottom)                                    ║
║  • Clicking opens full-screen chat interface (current UI)                    ║
║  • State persists: users who prefer chat can stay there                      ║
║  • Analytics track usage: if <5% use chat after 90 days, deprecate          ║
║                                                                              ║
║  MIGRATION PATH:                                                             ║
║  Week 1-4:  Both modes available, default = dashboard                        ║
║  Week 5-8:  Prompt chat users "Try new dashboard?"                          ║
║  Week 9-12: If analytics support, make chat opt-in only                      ║
║  Week 13+:  Consider full deprecation                                        ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

#### UX-D2: AI Panel Behavior

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  DECISION: Slide-in Panel from Right (Option A)                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  SPECIFICATIONS:                                                             ║
║  • Width: 384px (w-96) on desktop                                            ║
║  • Animation: slideIn 300ms ease-out                                         ║
║  • Trigger: Click "AI Help" button or keyboard shortcut (Cmd+K)              ║
║  • Context: Automatically receives current page + selection context          ║
║  • Memory: Remembers open/closed state per session                           ║
║  • Resize: Draggable edge to expand to 50% width if needed                   ║
║                                                                              ║
║  CONTEXTUAL TRIGGERS:                                                        ║
║  • Error state detected → "AI Diagnose" button appears                       ║
║  • API response displayed → "Explain" link appears                           ║
║  • Form validation fails → "Help me fix this" option                         ║
║  • First visit to page → Subtle "Need help?" prompt                          ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

#### UX-D3: Component Library (shadcn/ui)

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  DECISION: shadcn/ui Component Library                                       ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  WHY SHADCN/UI:                                                              ║
║  ✓ Copy-paste ownership (no npm dependency, full control)                    ║
║  ✓ Tailwind-native (matches our existing stack)                              ║
║  ✓ Accessible by default (Radix primitives)                                  ║
║  ✓ Highly customizable (CSS variables, not prop drilling)                    ║
║  ✓ TypeScript-first                                                          ║
║  ✓ Dark mode ready (for future)                                              ║
║                                                                              ║
║  COMPONENTS TO INSTALL (Phase 1):                                            ║
║  npx shadcn-ui@latest init                                                   ║
║  npx shadcn-ui@latest add button card input label select tabs                ║
║  npx shadcn-ui@latest add table dialog sheet toast badge                     ║
║  npx shadcn-ui@latest add dropdown-menu navigation-menu sidebar              ║
║  npx shadcn-ui@latest add form                                               ║
║                                                                              ║
║  CUSTOM COMPONENTS (Built on shadcn):                                        ║
║  • StatusCard - Integration status with AI help button                       ║
║  • CredentialsCard - Copy-to-clipboard credentials                           ║
║  • AIAssistantPanel - Contextual AI slide-in                                 ║
║  • APITestConsole - OneRoster endpoint tester                                ║
║  • AuditLogTable - Filterable audit log viewer                               ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Part 3: AI Augmentation Strategy

### 3.1 The AI Value Matrix

Not all tasks benefit equally from AI. Portal 2.0 applies AI surgically:

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                          AI VALUE MATRIX                                     ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║                    LOW FREQUENCY          │        HIGH FREQUENCY            ║
║  ─────────────────────────────────────────┼──────────────────────────────────║
║                                           │                                  ║
║  HIGH        [INVEST HEAVILY]             │    [OPTIMIZE FOR SPEED]          ║
║  COMPLEXITY  • Error diagnosis            │    • Quick status check          ║
║              • Upgrade justification      │    • Copy credentials            ║
║              • First-time onboarding      │    • View audit logs             ║
║              • SSO troubleshooting        │    • Check message status        ║
║              ──────────────────────────── │ ────────────────────────────── ║
║              AI: Full assistance          │    AI: Optional explain button   ║
║              UI: Wizard with AI guide     │    UI: Traditional dashboard     ║
║                                           │                                  ║
║  ─────────────────────────────────────────┼──────────────────────────────────║
║                                           │                                  ║
║  LOW         [AI OPTIONAL]                │    [NO AI NEEDED]                ║
║  COMPLEXITY  • Download compliance cert   │    • Rotate API key              ║
║              • Export audit logs          │    • Toggle notification prefs   ║
║              • Update contact info        │    • View pricing tier           ║
║              ──────────────────────────── │ ────────────────────────────── ║
║              AI: None                     │    AI: None                      ║
║              UI: Simple button/form       │    UI: Direct action             ║
║                                           │                                  ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### 3.2 AI Touchpoints Specification

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    AI TOUCHPOINT SPECIFICATIONS                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  TOUCHPOINT 1: ERROR DIAGNOSIS                                               ║
║  ─────────────────────────────                                               ║
║  Trigger: Any error state (red badge, failed validation, sync error)         ║
║  Button: "🔍 AI Diagnose" (appears next to error)                            ║
║  Context sent to AI:                                                         ║
║    • Error message and code                                                  ║
║    • Current configuration state                                             ║
║    • Recent audit log entries                                                ║
║    • Vendor's access tier                                                    ║
║  AI response:                                                                ║
║    • Root cause explanation                                                  ║
║    • Specific fix instructions                                               ║
║    • "Apply fix" button if automatable                                       ║
║  Example: SSO SAML error → AI detects ACS URL mismatch → shows exact fix     ║
║                                                                              ║
║  TOUCHPOINT 2: API RESPONSE EXPLAINER                                        ║
║  ───────────────────────────────────                                         ║
║  Trigger: After API test returns data                                        ║
║  Button: "✨ Explain this response" (in API tester)                          ║
║  Context sent to AI:                                                         ║
║    • The JSON response                                                       ║
║    • Endpoint that was called                                                ║
║    • Vendor's access tier (affects tokenization)                             ║
║  AI response:                                                                ║
║    • Field-by-field explanation                                              ║
║    • Why certain fields are tokenized                                        ║
║    • How to use the data in their app                                        ║
║  Example: "sourcedId is TKN_STU_xxx because you're Privacy-Safe tier..."     ║
║                                                                              ║
║  TOUCHPOINT 3: UPGRADE REQUEST DRAFTER                                       ║
║  ─────────────────────────────────────                                       ║
║  Trigger: Click "Request Upgrade" button                                     ║
║  Button: "📝 Draft with AI"                                                  ║
║  Context sent to AI:                                                         ║
║    • Current tier                                                            ║
║    • Target tier                                                             ║
║    • App category (from PoDS-Lite)                                           ║
║    • Typical justifications for this category                                ║
║  AI response:                                                                ║
║    • Pre-filled justification template                                       ║
║    • Editable by user before submission                                      ║
║    • Compliance-friendly language                                            ║
║                                                                              ║
║  TOUCHPOINT 4: ONBOARDING GUIDE                                              ║
║  ──────────────────────────────                                              ║
║  Trigger: First login OR click "Get Started"                                 ║
║  Behavior: Full-page guided flow with AI narration                           ║
║  Steps:                                                                      ║
║    1. Welcome + explain privacy tiers                                        ║
║    2. PoDS-Lite application (13 questions)                                   ║
║    3. Sandbox credential generation                                          ║
║    4. First API call (guided)                                                ║
║    5. Next steps based on their tier                                         ║
║  AI role: Explains each step, answers questions, adapts to vendor type       ║
║                                                                              ║
║  TOUCHPOINT 5: MESSAGE DRAFTER                                               ║
║  ─────────────────────────────                                               ║
║  Trigger: Click "Compose Message" in CPaaS section                           ║
║  Button: "✨ Draft with AI"                                                  ║
║  Context sent to AI:                                                         ║
║    • Message type (progress report, reminder, alert)                         ║
║    • Audience (parent, student, teacher)                                     ║
║    • Sample student data (tokenized)                                         ║
║  AI response:                                                                ║
║    • Professional template                                                   ║
║    • Personalization placeholders                                            ║
║    • Compliance-checked language                                             ║
║                                                                              ║
║  TOUCHPOINT 6: CONFIG VALIDATOR                                              ║
║  ───────────────────────────────                                             ║
║  Trigger: Before submitting any configuration form                           ║
║  Behavior: Inline validation with AI enhancement                             ║
║  Standard validation: Required fields, format checks                         ║
║  AI validation:                                                              ║
║    • Cross-field consistency (e.g., URL domains match)                       ║
║    • Common mistake detection                                                ║
║    • Security best practice warnings                                         ║
║  Display: Inline badges (green ✓, yellow ⚠️, red ✕)                          ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### 3.3 AI Technical Implementation

```typescript
// lib/ai/contextual-assistant.ts

interface AIContext {
  page: 'overview' | 'oneroster' | 'sso' | 'lti' | 'messages' | 'audit';
  trigger: 'error' | 'explain' | 'draft' | 'help' | 'validate';
  data: Record<string, unknown>;  // Page-specific context
  vendor: {
    id: string;
    tier: 'PRIVACY_SAFE' | 'SELECTIVE' | 'FULL_ACCESS';
    onboardingComplete: boolean;
  };
}

interface AIResponse {
  message: string;
  actions?: Array<{
    label: string;
    action: 'apply_fix' | 'navigate' | 'copy' | 'submit';
    payload: unknown;
  }>;
  followUp?: string;  // Suggested follow-up question
}

// System prompts are specialized per touchpoint
const TOUCHPOINT_PROMPTS = {
  error: `You are debugging an EdTech integration error. Be specific and actionable.`,
  explain: `You are explaining tokenized API responses to a developer. Be educational.`,
  draft: `You are drafting professional communications. Be concise and compliant.`,
  help: `You are guiding a vendor through onboarding. Be encouraging and clear.`,
  validate: `You are validating configuration. Return structured validation results.`,
};
```

---

## Part 4: Page-by-Page Specifications

### 4.1 Overview Page (Dashboard Home)

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  OVERVIEW PAGE - "At a glance" status dashboard                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  Welcome back, Acme Math!                 [Privacy-Safe Tier] [Active]  │ ║
║  │  Last sync: 2 minutes ago                                               │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                              ║
║  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐             ║
║  │  📊 API Status   │ │  🔐 SSO Status   │ │  📧 Messages     │             ║
║  │  ──────────────  │ │  ──────────────  │ │  ──────────────  │             ║
║  │  ● Healthy       │ │  ● Configured    │ │  147 sent today  │             ║
║  │  50 req/min      │ │  SAML 2.0        │ │  99.1% delivered │             ║
║  │                  │ │                  │ │                  │             ║
║  │  [Test API]      │ │  [Configure]     │ │  [Compose]       │             ║
║  └──────────────────┘ └──────────────────┘ └──────────────────┘             ║
║                                                                              ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  🔑 Quick Access: API Credentials                                       │ ║
║  │  ─────────────────────────────────                                      │ ║
║  │  Client ID:     sb_acme_math_29x8k4m2              [Copy]               │ ║
║  │  Client Secret: ••••••••••••••••••••               [Copy] [Rotate]      │ ║
║  │  Base URL:      https://sandbox.schoolday.com/oneroster/v1.2            │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                              ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  📋 Recent Activity                                            [View All]│ ║
║  │  ─────────────────                                                      │ ║
║  │  • API key rotated                              Today, 2:34 PM          │ ║
║  │  • SSO configuration updated                    Today, 11:15 AM         │ ║
║  │  • 523 students synced                          Yesterday, 6:00 AM      │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                              ║
║  [?] Need help? Click any status card for AI assistance                     ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### 4.2 OneRoster API Page

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  ONEROSTER API PAGE - Test and monitor API integration                       ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  TABS: [Credentials] [API Tester] [Sync Status] [Documentation]         │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                              ║
║  TAB: API TESTER                                                             ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  Endpoint:  [GET ▾] [/students              ▾]  [▶ Run]                  │ ║
║  │                                                                         │ ║
║  │  Parameters (optional):                                                 │ ║
║  │  ┌────────────────┐ ┌──────────────────────────────────────────────┐   │ ║
║  │  │ limit          │ │ 10                                           │   │ ║
║  │  │ filter         │ │ role='student'                               │   │ ║
║  │  └────────────────┘ └──────────────────────────────────────────────┘   │ ║
║  │                                                                         │ ║
║  │  Response:                                                    [Explain] │ ║
║  │  ┌───────────────────────────────────────────────────────────────────┐ │ ║
║  │  │  200 OK  •  145ms  •  10 records                                  │ │ ║
║  │  │  ─────────────────────────────────────────────────────────────── │ │ ║
║  │  │  {                                                                │ │ ║
║  │  │    "users": [                                                     │ │ ║
║  │  │      {                                                            │ │ ║
║  │  │        "sourcedId": "TKN_STU_8X9Y2Z3A",                          │ │ ║
║  │  │        "givenName": "Maria",                                      │ │ ║
║  │  │        "familyName": "[TOKENIZED]",                              │ │ ║
║  │  │        "email": "TKN_STU_8x9y2z3a@relay.schoolday.lausd.net"     │ │ ║
║  │  │      }                                                            │ │ ║
║  │  │    ]                                                              │ │ ║
║  │  │  }                                                                │ │ ║
║  │  └───────────────────────────────────────────────────────────────────┘ │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                              ║
║  [✨ AI Explain] - "What does this tokenized response mean?"                 ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### 4.3 SSO Configuration Page

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  SSO CONFIGURATION PAGE - Set up single sign-on                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  SSO Provider:  [● SAML 2.0]  [○ OIDC]  [○ LTI 1.3]                     │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                              ║
║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
║  │  SAML Configuration                                     Status: ⚠️ Error │ ║
║  │  ──────────────────                                                     │ ║
║  │                                                                         │ ║
║  │  Entity ID *                                                            │ ║
║  │  ┌─────────────────────────────────────────────────────────────────┐   │ ║
║  │  │ https://www.acme-math.com/saml                                  │   │ ║
║  │  └─────────────────────────────────────────────────────────────────┘   │ ║
║  │  ⚠️ Domain mismatch with ACS URL                      [🔍 AI Diagnose] │ ║
║  │                                                                         │ ║
║  │  ACS URL *                                                              │ ║
║  │  ┌─────────────────────────────────────────────────────────────────┐   │ ║
║  │  │ https://acme-math.com/sso/callback                              │   │ ║
║  │  └─────────────────────────────────────────────────────────────────┘   │ ║
║  │  ✓ Valid URL format                                                    │ ║
║  │                                                                         │ ║
║  │  Certificate *                                                          │ ║
║  │  ┌─────────────────────────────────────────────────────────────────┐   │ ║
║  │  │ [📄 saml-cert.pem]                                    [Upload]   │   │ ║
║  │  └─────────────────────────────────────────────────────────────────┘   │ ║
║  │  ✓ Valid X.509 certificate, expires 2026-03-15                        │ ║
║  │                                                                         │ ║
║  │  ┌─────────────────┐                                                   │ ║
║  │  │   Save Changes  │                                                   │ ║
║  │  └─────────────────┘                                                   │ ║
║  └─────────────────────────────────────────────────────────────────────────┘ ║
║                                                                              ║
║  AI ASSISTANT PANEL (triggered by "AI Diagnose"):                            ║
║  ┌──────────────────────────────────────────────────────────────────────┐   ║
║  │  🔍 I analyzed your SSO configuration and found the issue:           │   ║
║  │                                                                      │   ║
║  │  Your ACS URL `https://acme-math.com/...` doesn't match the domain   │   ║
║  │  in your Entity ID `https://www.acme-math.com/...`.                  │   ║
║  │                                                                      │   ║
║  │  **Fix:** Update your Entity ID to use `acme-math.com` (without www) │   ║
║  │  or update your ACS URL to include www.                              │   ║
║  │                                                                      │   ║
║  │  [Apply Fix: Remove www from Entity ID]                              │   ║
║  └──────────────────────────────────────────────────────────────────────┘   ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Part 5: Component Migration Plan

### 5.1 Current Components → Portal 2.0 Mapping

| Current Component | Portal 2.0 Destination | Migration Strategy |
|-------------------|----------------------|-------------------|
| `chat/page.tsx` | Chat Mode (toggle) | Keep as-is, add sidebar access |
| `MessageBubble.tsx` | AI Panel messages | Adapt styling to panel width |
| `TypingIndicator.tsx` | AI Panel loading | Reuse directly |
| `SuggestionChips.tsx` | AI Panel actions | Convert to action buttons |
| `CredentialsDisplay.tsx` | Overview + OneRoster | Rebuild with shadcn Card |
| `AuditLogViewer.tsx` | Audit page | Rebuild with shadcn Table |
| `SsoConfigForm.tsx` | SSO page | Rebuild with shadcn Form |
| `LtiConfigForm.tsx` | LTI page | Rebuild with shadcn Form |
| `ApiTester.tsx` | OneRoster page | Rebuild with shadcn + CodeMirror |
| `CommTestForm.tsx` | Messages page | Rebuild with shadcn Form |
| `PodsLiteForm.tsx` | Onboarding flow | Keep for onboarding wizard |
| `AppSubmitForm.tsx` | Settings page | Rebuild with shadcn Form |

### 5.2 New Components Required

| Component | Purpose | Complexity |
|-----------|---------|------------|
| `DashboardLayout.tsx` | Main layout with sidebar | Medium |
| `Sidebar.tsx` | Navigation sidebar | Low |
| `TopNav.tsx` | Header with user menu | Low |
| `StatusCard.tsx` | Integration status card | Low |
| `AIAssistantPanel.tsx` | Slide-in AI panel | High |
| `AIHelpButton.tsx` | Contextual AI trigger | Low |
| `QuickCredentials.tsx` | Credentials with copy | Low |
| `EndpointTester.tsx` | API test console | Medium |
| `SyncStatusTimeline.tsx` | Sync history view | Medium |
| `OnboardingWizard.tsx` | First-time flow | High |

---

## Part 6: Implementation Phases

### Phase 0: Foundation (Week 1)
**Goal**: Set up design system and project structure

```
DELIVERABLES:
□ Install and configure shadcn/ui
□ Define color palette (LAUSD blue #003DA5, gold #FDB813)
□ Create typography scale
□ Set up CSS variables for theming
□ Create components/ui/ directory structure
□ Add Tailwind config extensions

TESTS:
□ Component storybook (optional but recommended)
□ Visual regression tests setup

GO/NO-GO: Design tokens implemented and documented
```

### Phase 1: Layout Shell (Week 2)
**Goal**: Build the dashboard skeleton

```
DELIVERABLES:
□ DashboardLayout.tsx with sidebar + main content area
□ Sidebar.tsx with navigation items
□ TopNav.tsx with user menu
□ Routing structure for all pages
□ Mobile-aware (collapse sidebar on small screens)
□ Chat Mode toggle in sidebar

TESTS:
□ Layout renders correctly at all breakpoints
□ Navigation routing works
□ Sidebar collapse/expand works

GO/NO-GO: Can navigate between empty pages with consistent layout
```

### Phase 2: Overview Page (Week 3)
**Goal**: Build the dashboard home page

```
DELIVERABLES:
□ StatusCard component with AI help button
□ QuickCredentials component with copy/rotate
□ Recent activity feed
□ Integration status indicators
□ Welcome message with tier badge

TESTS:
□ All status states render correctly (healthy, warning, error)
□ Copy to clipboard works
□ AI help button opens panel (empty for now)

GO/NO-GO: Overview page is functional and matches design
```

### Phase 3: AI Assistant Panel (Week 4)
**Goal**: Build the contextual AI assistant

```
DELIVERABLES:
□ AIAssistantPanel.tsx (slide-in from right)
□ AIHelpButton.tsx (contextual trigger)
□ Context gathering for each page
□ Touchpoint-specific system prompts
□ Action buttons in AI responses
□ Keyboard shortcut (Cmd+K)

TESTS:
□ Panel opens/closes correctly
□ Context is passed correctly for each page
□ AI responses are relevant to context
□ Actions execute correctly

GO/NO-GO: AI panel provides useful, contextual assistance
```

### Phase 4: OneRoster Page (Week 5)
**Goal**: Build API credentials and tester

```
DELIVERABLES:
□ Credentials tab with full details
□ API Tester with endpoint selection
□ Response viewer with syntax highlighting
□ "Explain" button integration with AI panel
□ Sync status tab with timeline

TESTS:
□ API calls execute correctly
□ Responses display correctly
□ AI explain provides useful info

GO/NO-GO: Vendors can test all OneRoster endpoints
```

### Phase 5: SSO & LTI Pages (Week 6)
**Goal**: Build configuration pages

```
DELIVERABLES:
□ SSO page with provider tabs (SAML, OIDC, LTI)
□ Form validation with inline errors
□ AI diagnosis for configuration errors
□ LTI page with credential management
□ Test connection functionality

TESTS:
□ Forms validate correctly
□ AI diagnosis identifies common errors
□ Configurations save correctly

GO/NO-GO: Vendors can configure all SSO methods
```

### Phase 6: Messages & Audit Pages (Week 7)
**Goal**: Build communication and logging pages

```
DELIVERABLES:
□ Messages page with compose form
□ AI message drafter
□ Delivery status tracking
□ Audit log page with filters
□ Export functionality

TESTS:
□ Message composition works
□ AI drafts are appropriate
□ Audit log filters work correctly

GO/NO-GO: Vendors can send messages and review logs
```

### Phase 7: Onboarding Wizard (Week 8)
**Goal**: Build first-time user experience

```
DELIVERABLES:
□ OnboardingWizard.tsx with step-by-step flow
□ AI guide throughout onboarding
□ PoDS-Lite integration
□ First API call tutorial
□ Completion celebration

TESTS:
□ All onboarding steps complete correctly
□ AI guidance is helpful
□ New vendors reach sandbox successfully

GO/NO-GO: First-time vendors can complete onboarding independently
```

### Phase 8: Migration & Polish (Weeks 9-10)
**Goal**: Port remaining features and polish

```
DELIVERABLES:
□ Settings page (account, billing, team)
□ Notification preferences
□ Error boundaries
□ Loading states
□ Empty states
□ 404 and error pages
□ Accessibility audit
□ Performance optimization

TESTS:
□ All current functionality works
□ WCAG 2.1 AA compliance
□ Lighthouse score > 90
□ No console errors

GO/NO-GO: Feature parity achieved, all tests pass
```

---

## Part 7: GO/NO-GO Gates

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                       PORTAL 2.0 GO/NO-GO GATES                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  GATE 1: DESIGN FOUNDATION                                                   ║
║  ─────────────────────────                                                   ║
║  Criteria: shadcn/ui installed, design tokens defined                        ║
║  Test: Visual inspection, Tailwind config review                             ║
║  Status: 📋 Pending                                                          ║
║                                                                              ║
║  GATE 2: NAVIGATION COMPLETE                                                 ║
║  ──────────────────────────                                                  ║
║  Criteria: All pages accessible via sidebar, routing works                   ║
║  Test: Click through all nav items, verify URLs                              ║
║  Status: 📋 Pending                                                          ║
║                                                                              ║
║  GATE 3: AI PANEL FUNCTIONAL                                                 ║
║  ─────────────────────────                                                   ║
║  Criteria: Panel opens, receives context, provides relevant responses        ║
║  Test: Trigger AI from 3+ different pages, verify context                    ║
║  Status: 📋 Pending                                                          ║
║                                                                              ║
║  GATE 4: FEATURE PARITY                                                      ║
║  ────────────────────                                                        ║
║  Criteria: All current chat-first features work in dashboard                 ║
║  Test: Complete all 5 demo workflows in new UI                               ║
║  Status: 📋 Pending                                                          ║
║                                                                              ║
║  GATE 5: PERFORMANCE                                                         ║
║  ─────────────────                                                           ║
║  Criteria: Page load < 2s, interactions < 100ms                              ║
║  Test: Lighthouse audit, manual timing                                       ║
║  Status: 📋 Pending                                                          ║
║                                                                              ║
║  GATE 6: ACCESSIBILITY                                                       ║
║  ──────────────────                                                          ║
║  Criteria: WCAG 2.1 AA compliance                                            ║
║  Test: axe DevTools audit, keyboard navigation test                          ║
║  Status: 📋 Pending                                                          ║
║                                                                              ║
║  GATE 7: USER TESTING                                                        ║
║  ─────────────────                                                           ║
║  Criteria: 3-5 beta vendors complete tasks, >80% satisfaction               ║
║  Test: Moderated testing sessions, survey                                    ║
║  Status: 📋 Pending                                                          ║
║                                                                              ║
║  GATE 8: LAUNCH READY                                                        ║
║  ─────────────────                                                           ║
║  Criteria: All above gates pass, no P1 bugs                                 ║
║  Test: Full regression test, stakeholder sign-off                            ║
║  Status: 📋 Pending                                                          ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Part 8: Risk Assessment

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                          RISK ASSESSMENT                                     ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  HIGH RISK                                                                   ║
║  ─────────                                                                   ║
║                                                                              ║
║  Risk: Scope creep ("while we're at it...")                                  ║
║  Likelihood: High                                                            ║
║  Impact: Timeline slips 50%+                                                 ║
║  Mitigation:                                                                 ║
║    • Strict feature parity first rule                                        ║
║    • All enhancements go to v2.1 backlog                                     ║
║    • Weekly scope review meetings                                            ║
║    • "Out of Scope" list in this document                                    ║
║                                                                              ║
║  Risk: AI touchpoints feel gimmicky or slow                                  ║
║  Likelihood: Medium                                                          ║
║  Impact: User trust in AI features eroded                                   ║
║  Mitigation:                                                                 ║
║    • User test each touchpoint individually                                  ║
║    • Remove touchpoints that don't add value                                 ║
║    • Optimize AI response time (<2s target)                                  ║
║    • Make AI optional, never blocking                                        ║
║                                                                              ║
║  MEDIUM RISK                                                                 ║
║  ───────────                                                                 ║
║                                                                              ║
║  Risk: User resistance to new UI                                             ║
║  Likelihood: Medium                                                          ║
║  Impact: Adoption slower than expected                                       ║
║  Mitigation:                                                                 ║
║    • Keep Chat Mode as fallback                                              ║
║    • Gradual rollout with opt-in first                                       ║
║    • Clear communication about benefits                                      ║
║    • Video tutorials for transition                                          ║
║                                                                              ║
║  Risk: Performance regression from new components                            ║
║  Likelihood: Medium                                                          ║
║  Impact: User experience degrades                                            ║
║  Mitigation:                                                                 ║
║    • Set performance budget upfront                                          ║
║    • Lighthouse CI in pipeline                                               ║
║    • Code splitting for each page                                            ║
║    • Lazy load AI panel                                                      ║
║                                                                              ║
║  LOW RISK                                                                    ║
║  ────────                                                                    ║
║                                                                              ║
║  Risk: shadcn/ui breaking changes                                            ║
║  Likelihood: Low (copy-paste ownership)                                      ║
║  Impact: Minor refactoring needed                                            ║
║  Mitigation: We own the code, not an npm dependency                          ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Part 9: Out of Scope (v2.1+)

The following are explicitly **NOT** included in Portal 2.0:

| Feature | Reason | Target Version |
|---------|--------|----------------|
| Dark mode | Nice to have, not essential | v2.1 |
| Mobile app | Desktop-primary audience | v3.0 |
| Multi-language | English-first for US market | v2.2 |
| Custom themes | Low demand | v3.0 |
| Browser extensions | Niche use case | v3.0 |
| Real-time collaboration | Complex, low priority | v3.0 |
| Offline support | Not needed for admin portal | Never |

---

## Part 10: Success Metrics

### Quantitative Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Time to view credentials | ~30s | <5s | Session recording |
| Onboarding completion rate | 78% | 95% | Analytics |
| Support tickets per vendor | 2.3/month | <1/month | Zendesk |
| NPS score | 42 | 60+ | Quarterly survey |
| Task completion time | N/A | 50% faster | User testing |

### Qualitative Metrics

- Vendor feedback: "I can find everything I need"
- Support feedback: "Vendors ask better questions"
- Demo feedback: "The UI is professional and modern"

---

## Appendix A: File Structure

```
app/
├── (dashboard)/                    # Dashboard route group
│   ├── layout.tsx                  # DashboardLayout
│   ├── page.tsx                    # Overview (redirect from /)
│   ├── overview/
│   │   └── page.tsx
│   ├── oneroster/
│   │   └── page.tsx
│   ├── sso/
│   │   └── page.tsx
│   ├── lti/
│   │   └── page.tsx
│   ├── messages/
│   │   └── page.tsx
│   ├── audit/
│   │   └── page.tsx
│   └── settings/
│       └── page.tsx
├── (chat)/                         # Chat mode route group
│   └── chat/
│       └── page.tsx                # Current chat UI
├── onboarding/
│   └── page.tsx                    # Onboarding wizard
└── layout.tsx                      # Root layout

components/
├── ui/                             # shadcn/ui components
│   ├── button.tsx
│   ├── card.tsx
│   ├── ...
├── dashboard/                      # Dashboard-specific
│   ├── DashboardLayout.tsx
│   ├── Sidebar.tsx
│   ├── TopNav.tsx
│   ├── StatusCard.tsx
│   └── QuickCredentials.tsx
├── ai/                             # AI components
│   ├── AIAssistantPanel.tsx
│   ├── AIHelpButton.tsx
│   └── AISuggestion.tsx
├── pages/                          # Page-specific components
│   ├── overview/
│   ├── oneroster/
│   ├── sso/
│   └── ...
└── onboarding/
    └── OnboardingWizard.tsx

lib/
├── ai/
│   ├── contextual-assistant.ts     # AI context handling
│   └── touchpoint-prompts.ts       # Per-touchpoint prompts
└── ...
```

---

## Appendix B: Design Tokens

```css
/* globals.css additions */
:root {
  /* LAUSD Brand Colors */
  --lausd-blue: #003DA5;
  --lausd-blue-dark: #002266;
  --lausd-blue-light: #E8F0FE;
  --lausd-gold: #FDB813;

  /* Semantic Colors */
  --success: #10B981;
  --warning: #F59E0B;
  --error: #EF4444;
  --info: #3B82F6;

  /* Neutral Scale */
  --gray-50: #F9FAFB;
  --gray-100: #F3F4F6;
  --gray-200: #E5E7EB;
  --gray-300: #D1D5DB;
  --gray-400: #9CA3AF;
  --gray-500: #6B7280;
  --gray-600: #4B5563;
  --gray-700: #374151;
  --gray-800: #1F2937;
  --gray-900: #111827;

  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Spacing (matches Tailwind) */
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  --spacing-4: 1rem;
  --spacing-6: 1.5rem;
  --spacing-8: 2rem;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

  /* Animations */
  --transition-fast: 150ms ease;
  --transition-normal: 300ms ease;
  --transition-slow: 500ms ease;
}
```

---

**Document Status**: COMPLETE
**Next Action**: Begin Phase 0 (Foundation)
**Owner**: Engineering Team
**Approved By**: [Pending]
