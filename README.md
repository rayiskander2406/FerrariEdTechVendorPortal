# SchoolDay Vendor Portal

**AI-powered EdTech integration platform for K-12 districts**

[![Tests](https://img.shields.io/badge/tests-3084%20passing-brightgreen)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)]()
[![Next.js](https://img.shields.io/badge/Next.js-14-black)]()

> **Mission**: Enable EdTech vendors to integrate with school districts in minutes, not months, while protecting student privacy through tokenization.

## What is SchoolDay?

SchoolDay is a vendor self-service integration portal that allows EdTech companies to:

- **Instant Integration**: Get API credentials and start building in minutes
- **Privacy-First**: Access tokenized student data without touching PII
- **AI-Powered Onboarding**: Chat-based assistant guides vendors through setup
- **Multi-Protocol Support**: OneRoster, LTI 1.3, SSO (Google, Clever, ClassLink)

### The Three-Tier Privacy Model

| Tier | Access Level | Approval Time | Use Case |
|------|-------------|---------------|----------|
| **Privacy-Safe** (80%) | Tokenized IDs only | Instant | Most integrations |
| **Selective** (15%) | First names + tokens | 1-2 days | Personalization |
| **Full Access** (5%) | Full PII with audit | Manual review | SIS sync |

## Quick Start

```bash
# Clone and install
git clone <repo-url>
cd FerrariEdTechVendorPortal
npm install

# Start PostgreSQL (optional - can use mock DB)
docker compose up -d

# Configure environment
cp .env.example .env
# Edit .env with your ANTHROPIC_API_KEY

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the chat interface.

### Demo Mode (No Database Required)

```bash
# Use in-memory mock database
echo "USE_MOCK_DB=true" >> .env
npm run dev
```

## Documentation

### For Developers

| Document | Description |
|----------|-------------|
| [CLAUDE.md](./CLAUDE.md) | **Start here** - Complete project context and coding conventions |
| [docs/API.md](./docs/API.md) | API endpoint reference with examples |
| [docs/SECURITY.md](./docs/SECURITY.md) | Security features and production checklist |
| [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Environment setup and deployment guide |

### For Contributors

| Document | Description |
|----------|-------------|
| [.claude/INDEX.md](./.claude/INDEX.md) | Navigation for all strategic documentation |
| [.claude/DEVELOPMENT_PATTERNS.md](./.claude/DEVELOPMENT_PATTERNS.md) | Codified development patterns |
| [.claude/TODO.md](./.claude/TODO.md) | Current tasks and backlog |

### For Product/Strategy

| Document | Description |
|----------|-------------|
| [.claude/STRATEGY.md](./.claude/STRATEGY.md) | Business strategy and competitive analysis |
| [.claude/PLANNING.md](./.claude/PLANNING.md) | Release planning and decision log |
| [.claude/DEMO_WORKFLOWS.md](./.claude/DEMO_WORKFLOWS.md) | 5 demo scenarios with complete flows |

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514)
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Testing**: Vitest (3084 tests)

## Key Features

### 12 AI Tools

The chat assistant has access to specialized tools:

| Tool | Purpose |
|------|---------|
| `lookup_pods` | Check PoDS application status |
| `submit_pods_lite` | 13-question privacy application |
| `provision_sandbox` | Generate API credentials |
| `configure_sso` | SSO provider setup |
| `test_oneroster` | Execute test API calls |
| `configure_lti` | LTI 1.3 configuration |
| `send_test_message` | Test communication gateway |
| `submit_app` | Freemium app submission |
| `get_audit_logs` | Retrieve audit trail |
| `get_credentials` | Display sandbox credentials |
| `check_status` | Get integration statuses |
| `request_upgrade` | Initiate tier upgrade |

### Tokenization

All student PII is tokenized before reaching vendor systems:

```
Student ID:  STU_12345        → TKN_STU_A1B2C3D4
Teacher ID:  TCH_67890        → TKN_TCH_X9Y8Z7W6
Email:       john@school.edu  → TKN_STU_a1b2c3d4@relay.schoolday.lausd.net
Phone:       (555) 123-4567   → TKN_555_123_4567
Last Name:   Smith            → [TOKENIZED]
```

## Development Commands

```bash
# Development
npm run dev              # Start dev server
npm test                 # Run all tests (3084)
npm run test:coverage    # Coverage report

# Database
docker compose up -d     # Start PostgreSQL
npm run db:seed          # Seed demo data
npx prisma studio        # Database GUI

# Quality
npm run lint             # ESLint
npm run typecheck        # TypeScript check
npm run verify:spec      # Verify spec sync
```

## Project Structure

```
/app
  /api                   # API routes (21 endpoints)
  /chat                  # Main chat interface
/lib
  /ai                    # Claude integration & tools
  /config                # Centralized configuration
  /db                    # Prisma client & operations
  /tokens                # Tokenization utilities
/spec
  vendor-portal-rules.yaml  # Single source of truth
/tests
  /generated             # Auto-generated from spec
/.claude
  /commands              # 18 slash commands
  *.md                   # Strategic documentation
```

## Environment Variables

See [.env.example](./.env.example) for all supported variables.

Required for production:
- `DATABASE_URL` - PostgreSQL connection string
- `ANTHROPIC_API_KEY` - Claude API key

## Contributing

1. Read [CLAUDE.md](./CLAUDE.md) for coding conventions
2. Check [.claude/TODO.md](./.claude/TODO.md) for available tasks
3. Use `/start` command to begin your session
4. Follow TDD approach (write tests first)
5. Use `/finish` command when done

## License

Proprietary - All rights reserved.

---

**Questions?** Use the `/help-me` command or check [.claude/COMMANDS.md](./.claude/COMMANDS.md) for available commands.
