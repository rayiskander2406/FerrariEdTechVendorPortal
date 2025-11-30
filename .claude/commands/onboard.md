---
name: onboard
description: Guide new contributors through the SchoolDay Vendor Portal codebase
---

# Onboard - New Contributor Guide

You are helping a new contributor get started with the SchoolDay Vendor Portal project.

## Purpose

Get new developers productive quickly by:
1. Understanding the project's purpose
2. Setting up the development environment
3. Learning key architectural patterns
4. Finding their first task

## Instructions

### Step 1: Welcome

```
╔══════════════════════════════════════════════════════════════╗
║                    WELCOME TO SCHOOLDAY                      ║
║                    VENDOR PORTAL                             ║
╠══════════════════════════════════════════════════════════════╣
║                                                               ║
║  Hello! Let's get you set up and productive.                 ║
║                                                               ║
║  This portal helps K-12 school districts evaluate, onboard,  ║
║  and monitor EdTech vendors with AI-powered assistance       ║
║  while protecting student privacy.                           ║
║                                                               ║
║  Key things to know:                                         ║
║  • Privacy-first: We NEVER send PII to external APIs         ║
║  • Demo-focused: MVP targets LAUSD stakeholder demos         ║
║  • AI-powered: 12 Claude tools for vendor assessment         ║
║                                                               ║
╚══════════════════════════════════════════════════════════════╝
```

### Step 2: Environment Setup

```
╔══════════════════════════════════════════════════════════════╗
║                    ENVIRONMENT SETUP                         ║
╠══════════════════════════════════════════════════════════════╣

  PREREQUISITES
  ─────────────
  □ Node.js 18+ installed
  □ npm or yarn
  □ Git
  □ Code editor (VS Code recommended)

  SETUP STEPS
  ───────────

  1. Clone repository:
     git clone [repo-url]
     cd FerrariEdTechVendorPortal

  2. Install dependencies:
     npm install

  3. Set up environment:
     cp .env.example .env.local
     # Add your ANTHROPIC_API_KEY

  4. Start development server:
     npm run dev

  5. Open http://localhost:3000

  VERIFICATION
  ────────────
  □ Homepage loads without errors
  □ Chat interface appears
  □ Demo mode toggle works (D key)

╚══════════════════════════════════════════════════════════════╝
```

### Step 3: Architecture Overview

```
╔══════════════════════════════════════════════════════════════╗
║                    ARCHITECTURE                              ║
╠══════════════════════════════════════════════════════════════╣

  TECHNOLOGY STACK
  ────────────────
  • Framework: Next.js 14 (App Router)
  • Language: TypeScript
  • Styling: Tailwind CSS
  • AI: Claude API (Anthropic)
  • State: React Context (demo mode)

  PROJECT STRUCTURE
  ─────────────────
  FerrariEdTechVendorPortal/
  ├── app/              # Next.js pages and routes
  │   ├── api/          # API routes (including /api/chat)
  │   └── demo/         # Demo mode pages
  ├── lib/              # Shared utilities
  │   ├── ai-tools/     # 12 AI tool definitions
  │   ├── tokenizer/    # PII tokenization
  │   ├── privacy/      # Privacy utilities
  │   └── claude.ts     # Claude API integration
  ├── components/       # React components
  ├── .claude/          # Workflow commands
  │   ├── commands/     # Slash commands
  │   ├── TODO.md       # Task tracking
  │   ├── PLANNING.md   # Release planning
  │   └── COMPLETED.md  # Completion log
  └── CLAUDE.md         # AI assistant guidelines

  KEY PATTERNS
  ────────────

  1. PRIVACY TOKENIZATION
     User input → Tokenize PII → Claude API → Detokenize → Display
     Never send real PII to Claude!

  2. AI TOOLS
     12 specialized tools for vendor assessment
     Located in /lib/ai-tools/

  3. DEMO MODE
     Keyboard shortcut "D" toggles demo mode
     Demo scenarios have pre-configured workflows

  4. FORM TRIGGERS
     [FORM:FormName] patterns trigger UI forms
     e.g., [FORM:VendorAssessment]

╚══════════════════════════════════════════════════════════════╝
```

### Step 4: Key Files to Read

```
╔══════════════════════════════════════════════════════════════╗
║                    ESSENTIAL READING                         ║
╠══════════════════════════════════════════════════════════════╣

  START HERE (Required)
  ─────────────────────
  □ CLAUDE.md - How AI assistants should work with this project
  □ README.md - Project overview and setup
  □ .claude/PLANNING.md - Current roadmap and goals

  ARCHITECTURE (Recommended)
  ──────────────────────────
  □ lib/claude.ts - Claude API integration
  □ lib/ai-tools/ - AI tool definitions
  □ lib/tokenizer/ - Privacy tokenization
  □ app/api/chat/ - Chat API endpoint

  UNDERSTAND THE DOMAIN
  ─────────────────────
  □ Demo workflows (4 scenarios)
  □ Feature flags system

╚══════════════════════════════════════════════════════════════╝
```

### Step 5: Find First Task

```
╔══════════════════════════════════════════════════════════════╗
║                    FINDING YOUR FIRST TASK                   ║
╠══════════════════════════════════════════════════════════════╣

  GOOD FIRST TASKS
  ────────────────
  Look for tasks labeled with lower effort in TODO.md:

  EASY (Good for learning):
  • Fix small bugs
  • Add documentation
  • Improve error messages
  • Add TypeScript types

  MEDIUM (After you're comfortable):
  • Add new AI tool
  • Improve existing workflow
  • Add UI enhancement

  COMMANDS TO USE
  ───────────────
  /dashboard  - See current project status
  /start      - Get recommended next task
  /help-me    - If you get stuck

  TIPS FOR SUCCESS
  ────────────────
  1. Always run /qa after making changes
  2. Never commit PII, even in tests
  3. Test in demo mode (press D)
  4. Ask questions early

╚══════════════════════════════════════════════════════════════╝
```

### Step 6: Workflow Commands

```
╔══════════════════════════════════════════════════════════════╗
║                    DAILY WORKFLOW                            ║
╠══════════════════════════════════════════════════════════════╣

  THE CORE LOOP
  ─────────────

  /dashboard  →  /start  →  [work]  →  /qa  →  /finish
       ↑                                           │
       └───────────────────────────────────────────┘

  COMMAND REFERENCE
  ─────────────────

  Daily:
  • /dashboard     - Quick status check
  • /start         - Begin next task
  • /finish        - Complete current task
  • /help-me       - Get unstuck

  Quality:
  • /qa            - Quick quality check
  • /code-review   - Thorough review
  • /test-ai-tools - Test AI tools
  • /privacy-check - Check for PII leaks

  Planning:
  • /strategic-check - Evaluate new ideas
  • /plan-release    - Release planning

╚══════════════════════════════════════════════════════════════╝
```

### Step 7: Welcome Complete

```
╔══════════════════════════════════════════════════════════════╗
║                    YOU'RE READY! 🎉                          ║
╠══════════════════════════════════════════════════════════════╣

  ONBOARDING COMPLETE
  ───────────────────

  You now know:
  ✅ Project purpose (K-12 EdTech vendor management)
  ✅ Key architecture (Next.js + Claude + tokenization)
  ✅ Privacy principles (never send PII)
  ✅ Development workflow (commands)

  NEXT STEPS
  ──────────
  1. Run /dashboard to see project status
  2. Run /start to find your first task
  3. Ask questions early - don't get stuck alone!

  KEY CONTACTS
  ────────────
  • Project questions: [Contact info]
  • Technical issues: Create GitHub issue

  RESOURCES
  ─────────
  • CLAUDE.md - AI guidelines
  • .claude/COMMANDS.md - Full command reference
  • .claude/WORKFLOW.md - Workflow guide

  Welcome to the team!

╚══════════════════════════════════════════════════════════════╝
```

---

**Usage**: `/onboard`
**Related**: `/dashboard` for status, `/start` for first task, `/help-me` if stuck
