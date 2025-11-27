# CLAUDE.md - Project Context for Claude Code

## Project Overview

This is the **LAUSD Vendor Self-Service Integration Portal** - an AI-powered platform enabling EdTech vendors to integrate with Los Angeles Unified School District using tokenized, privacy-protected data.

**Key Value Proposition**: Vendors get full integration functionality (SSO, rostering, communication) while student PII remains protected through tokenization. Token-only access is auto-approved in minutes versus weeks for traditional privacy reviews.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514)
- **Database**: PostgreSQL with Prisma ORM (mock mode available)
- **Runtime**: Node.js 18+

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Chat Interface (React)                    │
│  - Message thread with streaming AI responses               │
│  - Embedded forms triggered by AI                           │
│  - Suggestion chips for common actions                      │
├─────────────────────────────────────────────────────────────┤
│                    AI Layer (Claude API)                     │
│  - System prompt with LAUSD domain knowledge                │
│  - 12 tools for structured actions                          │
│  - Streaming responses with tool calls                      │
├─────────────────────────────────────────────────────────────┤
│                    API Routes (Next.js)                      │
│  - /api/chat - Claude streaming endpoint                    │
│  - /api/vendors - Vendor CRUD                               │
│  - /api/sandbox - Credential provisioning                   │
│  - /api/integration - SSO/OneRoster/LTI config             │
├─────────────────────────────────────────────────────────────┤
│                    Data Layer                                │
│  - Prisma ORM with PostgreSQL                               │
│  - Synthetic data generator (5 schools, 6600 students)      │
│  - In-memory mock mode for demo                             │
└─────────────────────────────────────────────────────────────┘
```

## Key Concepts

### Three-Tier Privacy Model
1. **TOKEN_ONLY (80%)**: Zero PII, instant approval, tokens like `TKN_STU_8X9Y2Z`
2. **SELECTIVE (15%)**: Limited PII (first name only), requires full review
3. **FULL_ACCESS (5%)**: Full PII with time windows, manual approval

### Tokenization
- Student IDs: `TKN_STU_[8-char-hash]`
- Teacher IDs: `TKN_TCH_[8-char-hash]`
- Emails: `TKN_STU_xxx@relay.schoolday.lausd.net`
- Phones: `TKN_555_XXX_[4-digits]`
- First names preserved, last names show `[TOKENIZED]`

### PoDS-Lite
Simplified 13-question privacy application (versus 71 for full PoDS) that auto-approves TOKEN_ONLY access.

## File Structure

```
/app
  /api
    /chat/route.ts         # Claude streaming endpoint
    /vendors/route.ts      # Vendor management
    /sandbox/route.ts      # Credential provisioning
    /integration/route.ts  # Integration configs
  /chat/page.tsx           # Main chat interface
  layout.tsx
  globals.css

/components
  /chat
    MessageBubble.tsx
    TypingIndicator.tsx
    SuggestionChips.tsx
  /forms
    PodsLiteForm.tsx       # 13-question onboarding
    SsoConfigForm.tsx      # SSO provider setup
    ApiTester.tsx          # OneRoster test console
    CommTestForm.tsx       # Email/SMS testing
    AppSubmitForm.tsx      # Freemium whitelist
  /dashboard
    CredentialsDisplay.tsx
    AuditLogViewer.tsx
    StatusDashboard.tsx

/lib
  /ai
    system-prompt.ts       # Comprehensive AI persona
    tools.ts               # 12 tool definitions
    handlers.ts            # Tool execution logic
  /db
    index.ts               # Prisma client & helpers
  /data
    synthetic.ts           # LAUSD demo data generator
  /types
    index.ts               # All TypeScript types
  /hooks
    useChat.ts             # Chat state management
  utils.ts

/prisma
  schema.prisma

/docs
  ARCHITECTURE.md
  DEMO_GUIDE.md
  EXTENSION_GUIDE.md
  API.md

/tests
  scenarios.ts             # Demo scenario validation
```

## AI Tools (12 total)

The AI assistant has these tools available:

| Tool | Purpose |
|------|---------|
| `lookup_pods` | Check existing PoDS application status |
| `submit_pods_lite` | Trigger PoDS-Lite form |
| `provision_sandbox` | Generate API credentials |
| `configure_sso` | Configure SSO provider |
| `test_oneroster` | Execute test API call |
| `configure_lti` | Configure LTI 1.3 |
| `send_test_message` | Test communication gateway |
| `submit_app` | Submit freemium app |
| `get_audit_logs` | Retrieve audit trail |
| `get_credentials` | Display sandbox credentials |
| `check_status` | Get integration statuses |
| `request_upgrade` | Initiate tier upgrade |

## Embedded Forms

Forms are triggered by AI responses containing markers like `[FORM:PODS_LITE]`:

- `[FORM:PODS_LITE]` - PoDS-Lite application
- `[FORM:SSO_CONFIG]` - SSO configuration
- `[FORM:API_TESTER]` - OneRoster API tester
- `[FORM:COMM_TEST]` - Communication gateway test
- `[FORM:APP_SUBMIT]` - Freemium app submission
- `[FORM:CREDENTIALS]` - Sandbox credentials display
- `[FORM:AUDIT_LOG]` - Audit log viewer

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Run tests
npm test

# Build for production
npm run build
```

## Environment Variables

```env
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Database (optional for mock mode)
DATABASE_URL=postgresql://...

# Feature flags
USE_MOCK_DB=true
NODE_ENV=development
```

## Coding Conventions

- Use TypeScript strict mode
- Prefer async/await over .then()
- Use Zod for runtime validation
- Components use PascalCase
- Utilities use camelCase
- Types go in /lib/types
- Keep components focused and small
- Add JSDoc comments for complex functions

## Testing Approach

- Unit tests for tool handlers and utilities
- Integration tests for API routes
- Scenario tests for demo flows
- Manual testing for chat UX

## Demo Requirements

The portal must handle improvised questions from LAUSD IT administrators covering:
- New vendor onboarding
- SSO configuration for all 3 providers
- OneRoster API testing
- Tokenization explanations
- FERPA/COPPA/SOPIPA compliance
- Communication gateway testing
- Freemium app workflows
- Audit trail access

## Important Notes

1. **Privacy First**: Never expose actual PII in responses or logs
2. **Auto-Approval Limits**: Only TOKEN_ONLY tier can be auto-approved
3. **Audit Everything**: All data access must be logged
4. **Graceful Errors**: AI should never crash, always recover gracefully
5. **LAUSD Context**: AI must know LAUSD-specific details (670K students, Schoology LMS, etc.)

## Related Documentation

- [Implementation Framework](./docs/IMPLEMENTATION_FRAMEWORK.md)
- [Demo Scenarios](./docs/DEMO_SCENARIOS.md)
- [System Prompt](./lib/ai/system-prompt.ts)
