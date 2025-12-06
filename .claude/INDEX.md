# Strategic Documentation Index

Navigation guide for the SchoolDay Vendor Portal strategic documentation.

**Total Documents**: 18 files | **Last Updated**: December 6, 2025

---

## Quick Navigation

| I need to... | Read this |
|--------------|-----------|
| Understand the project | [STRATEGY.md](#strategy--vision) |
| Start my work session | [WORKFLOW.md](#daily-workflow) |
| Find available tasks | [TODO.md](#project-tracking) |
| Learn development patterns | [DEVELOPMENT_PATTERNS.md](#development-patterns) |
| Understand the architecture | [ARCHITECTURE_SPEC.md](#architecture--design) |
| Use slash commands | [COMMANDS.md](#commands-reference) |
| Run a demo | [DEMO_WORKFLOWS.md](#demo--workflows) |

---

## Strategy & Vision

High-level business strategy and future direction.

| Document | Description | Size |
|----------|-------------|------|
| [STRATEGY.md](./STRATEGY.md) | Business strategy, competitive analysis, go-to-market | 58KB |
| [MOONSHOTS.md](./MOONSHOTS.md) | Future features roadmap (10 moonshot ideas) | 8KB |
| [EDTECH_CREDIT_BUREAU.md](./EDTECH_CREDIT_BUREAU.md) | EdTech Credit Bureau concept - trust scoring for vendors | 129KB |

**Start here if**: You're new to the project or need business context.

---

## Project Tracking

Task management and release planning.

| Document | Description | Size |
|----------|-------------|------|
| [PLANNING.md](./PLANNING.md) | Release planning, decision log, milestones | 149KB |
| [TODO.md](./TODO.md) | Active tasks, backlog, sprint goals | 13KB |
| [COMPLETED.md](./COMPLETED.md) | Completed work history, statistics | 13KB |

**Start here if**: You need to find tasks or understand project status.

---

## Architecture & Design

Technical architecture and database design.

| Document | Description | Size |
|----------|-------------|------|
| [ARCHITECTURE_SPEC.md](./ARCHITECTURE_SPEC.md) | Detailed architecture specifications | 54KB |
| [DATA_SCHEMA_DESIGN.md](./DATA_SCHEMA_DESIGN.md) | Database schema decisions (28 models, 20 mitigations) | 50KB |
| [SCHEMA_MITIGATION_PLAN.md](./SCHEMA_MITIGATION_PLAN.md) | Schema mitigation strategies | 42KB |
| [SANDBOX_PLANNING.md](./SANDBOX_PLANNING.md) | Sandbox architecture planning | 12KB |

**Start here if**: You need to understand how the system is built.

---

## Development Patterns

Codified patterns and best practices.

| Document | Description | Size |
|----------|-------------|------|
| [DEVELOPMENT_PATTERNS.md](./DEVELOPMENT_PATTERNS.md) | 7 codified patterns with evidence | 15KB |
| [CPAAS_DEVSPIKE.md](./CPAAS_DEVSPIKE.md) | Communication platform development spike | 79KB |
| [HARDENING_PLAN.md](./HARDENING_PLAN.md) | Security hardening roadmap | 13KB |

**The 7 Development Patterns**:
1. Schema-First Architecture
2. Single Source of Truth (SSOT)
3. Test-Driven Development (TDD)
4. Configuration DRY
5. Spec-Driven Development
6. Static Analysis Testing
7. Database-First Hydration

**Start here if**: You're implementing new features.

---

## Demo & Workflows

Demo scenarios and daily workflows.

| Document | Description | Size |
|----------|-------------|------|
| [DEMO_WORKFLOWS.md](./DEMO_WORKFLOWS.md) | 5 demo scenarios with complete flows | 30KB |
| [WORKFLOW.md](./WORKFLOW.md) | Daily work session guide | 5KB |

**The 5 Demo Workflows**:
1. New Vendor Onboarding (PoDS-Lite)
2. CPaaS Communication Gateway
3. OneRoster API Integration
4. SSO Configuration
5. LTI 1.3 Integration

**Start here if**: You need to run demos or understand user journeys.

---

## Quality & Testing

Quality assurance and bug tracking.

| Document | Description | Size |
|----------|-------------|------|
| [QA_AUDIT_PLAN.md](./QA_AUDIT_PLAN.md) | Quality assurance procedures | 38KB |
| [BUGFIX_RELEASE_PLAN.md](./BUGFIX_RELEASE_PLAN.md) | BUG-002 resolution case study | 16KB |

**Start here if**: You need QA procedures or bug investigation templates.

---

## Commands Reference

Available slash commands for Claude Code.

| Document | Description | Size |
|----------|-------------|------|
| [COMMANDS.md](./COMMANDS.md) | Reference card for 18 slash commands | 3KB |

### Command Categories

| Category | Commands |
|----------|----------|
| **Daily** | `/start`, `/finish`, `/dashboard` |
| **Quality** | `/qa`, `/code-review`, `/privacy-check`, `/security-audit` |
| **Testing** | `/test-ai-tools`, `/api-test`, `/run-demo` |
| **Planning** | `/plan-release`, `/strategic-check`, `/retrospective` |
| **Help** | `/help-me`, `/onboard` |
| **Release** | `/release-checklist` |

---

## Document Relationships

```
STRATEGY.md
    ├── MOONSHOTS.md (future features)
    ├── EDTECH_CREDIT_BUREAU.md (long-term vision)
    └── PLANNING.md (execution)
            ├── TODO.md (current work)
            └── COMPLETED.md (history)

ARCHITECTURE_SPEC.md
    ├── DATA_SCHEMA_DESIGN.md (database)
    ├── SCHEMA_MITIGATION_PLAN.md (safety)
    └── SANDBOX_PLANNING.md (integration)

DEVELOPMENT_PATTERNS.md
    ├── CPAAS_DEVSPIKE.md (example)
    ├── HARDENING_PLAN.md (security)
    └── BUGFIX_RELEASE_PLAN.md (process)

DEMO_WORKFLOWS.md
    └── WORKFLOW.md (daily use)

QA_AUDIT_PLAN.md
    └── BUGFIX_RELEASE_PLAN.md (case study)
```

---

## Reading Order for New Contributors

1. **[STRATEGY.md](./STRATEGY.md)** - Understand the "why"
2. **[ARCHITECTURE_SPEC.md](./ARCHITECTURE_SPEC.md)** - Understand the "how"
3. **[DEVELOPMENT_PATTERNS.md](./DEVELOPMENT_PATTERNS.md)** - Learn the patterns
4. **[TODO.md](./TODO.md)** - Find your first task
5. **[WORKFLOW.md](./WORKFLOW.md)** - Start working

---

## External Documentation

Located outside `.claude/`:

| Location | Description |
|----------|-------------|
| [/CLAUDE.md](/CLAUDE.md) | Complete project context (start here) |
| [/README.md](/README.md) | Project overview and quick start |
| [/docs/API.md](/docs/API.md) | API endpoint reference |
| [/docs/SECURITY.md](/docs/SECURITY.md) | Security features and checklist |
| [/docs/DEPLOYMENT.md](/docs/DEPLOYMENT.md) | Deployment guide |
| [/spec/README.md](/spec/README.md) | Specification-driven development |

---

## Maintenance

This index should be updated when:
- New strategic documents are added
- Documents are renamed or moved
- Document purposes change significantly

**Last review**: December 6, 2025
