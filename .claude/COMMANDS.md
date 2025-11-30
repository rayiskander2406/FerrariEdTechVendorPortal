# SchoolDay Vendor Portal - Slash Commands Reference

**Total: 18 commands** organized by workflow pillar

---

## Daily Workflow (Use These Every Day!)

| Command | What It Does | When to Use |
|---------|--------------|-------------|
| `/dashboard` | Shows project status, release progress, health indicators | Start of day, quick check-in |
| `/start` | Guides you through next task from TODO.md | When ready to code |
| `/finish` | Marks task complete, updates tracking files | When you finish something |
| `/help-me` | Structured troubleshooting for common problems | When confused or blocked |

**Tip**: These 4 commands cover 90% of your daily needs!

---

## Planning & Strategy

| Command | What It Does | When to Use |
|---------|--------------|-------------|
| `/plan-release` | Creates strategic release plan with GO/NO-GO gates | Starting new version/milestone |
| `/strategic-check` | Evaluates new ideas against roadmap | Before committing to new work |

---

## Quality Assurance

| Command | What It Does | When to Use |
|---------|--------------|-------------|
| `/qa` | Quick quality check on recent changes | After making changes |
| `/code-review` | Structured review following project standards | After significant code changes |
| `/security-audit` | Security and privacy analysis | Before releases, after security changes |
| `/release-checklist` | Pre-release verification gate | Final gate before release |

---

## Project-Specific (SchoolDay)

| Command | What It Does | When to Use |
|---------|--------------|-------------|
| `/test-ai-tools` | Verify all 12 AI tools work correctly | MVP validation, before demos |
| `/privacy-check` | Audit for PII leaks (FERPA/COPPA compliance) | Critical - run frequently |
| `/api-test` | Test API endpoints for correctness | After API changes |
| `/run-demo` | Launch and test all 4 demo workflows | Before stakeholder presentations |
| `/demo` | Demo mode controls (existing) | During demos |
| `/features` | Manage feature flags (existing) | Enable/disable moonshots |

---

## Continuity

| Command | What It Does | When to Use |
|---------|--------------|-------------|
| `/retrospective` | Sprint reflection and improvement capture | After milestones or releases |
| `/onboard` | Guide for new contributors | New team members |

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────┐
│              SCHOOLDAY COMMAND CHEAT SHEET                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  DAILY (use these!)           PROJECT-SPECIFIC                  │
│  ──────────────────           ────────────────                  │
│  /dashboard   - Where am I?   /test-ai-tools   - Test AI tools  │
│  /start       - Let's go!     /privacy-check   - PII audit      │
│  /finish      - Done!         /api-test        - API testing    │
│  /help-me     - Help!         /run-demo        - Demo testing   │
│                               /demo            - Demo controls  │
│                               /features        - Feature flags  │
│                                                                  │
│  QUALITY                      PLANNING                          │
│  ───────                      ────────                          │
│  /qa             - Quick check    /plan-release   - Plan release│
│  /code-review    - Full review    /strategic-check- New ideas   │
│  /security-audit - Security                                     │
│  /release-checklist - Final gate                                │
│                                                                  │
│  CONTINUITY                                                     │
│  ──────────                                                     │
│  /retrospective  - Sprint review                                │
│  /onboard        - New contributor                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## The 7 Pillars

These commands support 7 workflow pillars:

| Pillar | Commands |
|--------|----------|
| **Creativity** | `/help-me`, `/start` |
| **Moonshots** | `/strategic-check`, `/plan-release`, `/features` |
| **Prioritize** | `/dashboard`, `/strategic-check` |
| **Execute** | `/start`, `/finish`, `/run-demo` |
| **Quality** | `/qa`, `/code-review`, `/security-audit`, `/release-checklist`, `/test-ai-tools`, `/privacy-check`, `/api-test` |
| **Big Picture** | `/dashboard`, `/plan-release` |
| **Continuity** | `/dashboard`, `/retrospective`, `/onboard` |

---

## Command Structure

```
FerrariEdTechVendorPortal/
├── .claude/
│   ├── COMMANDS.md              ← This file
│   ├── WORKFLOW.md              ← Daily workflow guide
│   ├── TODO.md                  ← Task tracking
│   ├── PLANNING.md              ← Release planning
│   ├── COMPLETED.md             ← Completion tracking
│   │
│   └── commands/
│       ├── dashboard.md         # Daily
│       ├── start.md
│       ├── finish.md
│       ├── help-me.md
│       ├── plan-release.md      # Planning
│       ├── strategic-check.md
│       ├── qa.md                # Quality
│       ├── code-review.md
│       ├── security-audit.md
│       ├── release-checklist.md
│       ├── test-ai-tools.md     # Project-specific
│       ├── privacy-check.md
│       ├── api-test.md
│       ├── run-demo.md
│       ├── demo.md              # Existing
│       ├── features.md          # Existing
│       ├── retrospective.md     # Continuity
│       └── onboard.md
│
└── CLAUDE.md                    ← Project guidelines
```

---

## Typical Workflow

```
Morning:
  /dashboard          → See status
  /start              → Begin first task

During work:
  [code, test, commit]
  /help-me            → If stuck
  /qa                 → After changes
  /code-review        → After significant changes

End of task:
  /finish             → Update tracking

Before demo:
  /test-ai-tools      → Verify AI tools
  /privacy-check      → Audit for PII
  /run-demo           → Test workflows

Before release:
  /security-audit     → Security check
  /release-checklist  → Final verification

After milestone:
  /retrospective      → Capture learnings
```

---

## MVP Focus Commands

For the current MVP sprint, prioritize these:

| Priority | Command | MVP Task |
|----------|---------|----------|
| P1 | `/test-ai-tools` | MVP-01: Verify all 12 AI tools |
| P1 | `/privacy-check` | MVP-02: Privacy audit |
| P1 | `/run-demo` | MVP-03: Test demo workflows |
| P2 | `/qa` | Quick checks during development |

---

*Last Updated: November 28, 2025*
*Framework Version: 1.0*
