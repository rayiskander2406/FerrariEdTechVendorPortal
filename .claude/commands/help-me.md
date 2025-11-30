---
name: help-me
description: Get help when you're confused or blocked on something
---

# Help Me - Structured Troubleshooting

You are helping a developer who is stuck or confused. Guide them through structured problem-solving.

## Instructions

### Step 1: Identify the Problem Type

```
╔══════════════════════════════════════════════════════════════╗
║                    WHAT'S BLOCKING YOU?                      ║
╠══════════════════════════════════════════════════════════════╣
║                                                               ║
║  1. CODE        - Something isn't working as expected        ║
║  2. AI TOOLS    - Claude integration issues                  ║
║  3. PRIVACY     - Tokenization or PII concerns               ║
║  4. DEMO        - Demo mode or workflow issues               ║
║  5. BUILD       - Compilation or deployment errors           ║
║  6. DESIGN      - Unsure how to approach something           ║
║  7. PROJECT     - Task prioritization or planning            ║
║  8. OTHER       - Something else                             ║
║                                                               ║
║  Choose category (1-8) or describe your issue:               ║
║                                                               ║
╚══════════════════════════════════════════════════════════════╝
```

### Step 2: Gather Context

Based on category, ask targeted questions:

#### For Code Issues (1)
```
  CODE TROUBLESHOOTING
  ────────────────────

  Questions:
  • What file/component is involved?
  • What did you expect to happen?
  • What actually happened?
  • Any error messages?

  Helpful commands:
  • npm run dev - Start development server
  • npm run lint - Check for code issues
  • npm run build - Check for build errors
```

#### For AI Tool Issues (2)
```
  AI TOOL TROUBLESHOOTING
  ───────────────────────

  Questions:
  • Which of the 12 tools is having issues?
  • Is it failing completely or giving wrong results?
  • Any error in the console or API response?

  Helpful commands:
  • /test-ai-tools - Run all tools
  • /api-test - Test API endpoint

  Common issues:
  • Tool not in tools array → Check /lib/ai-tools/
  • Invalid response format → Check tool definition
  • API timeout → Check streaming setup
```

#### For Privacy Issues (3)
```
  PRIVACY TROUBLESHOOTING
  ───────────────────────

  Questions:
  • Where is PII potentially leaking?
  • Is tokenization working correctly?
  • What data is being sent to Claude?

  Helpful commands:
  • /privacy-check - Audit for PII leaks

  Key files:
  • /lib/tokenizer/ - Tokenization logic
  • /lib/privacy/ - Privacy utilities

  Common issues:
  • PII in API payload → Check tokenization before API call
  • Token not replacing → Check regex patterns
  • Detokenization failing → Check token mapping
```

#### For Demo Issues (4)
```
  DEMO TROUBLESHOOTING
  ────────────────────

  Questions:
  • Which demo workflow is failing?
  • What step in the workflow?
  • Is it a UI or data issue?

  Helpful commands:
  • /run-demo - Launch demo mode
  • /demo - Access demo controls

  Common issues:
  • Keyboard shortcut not working → Check event listeners
  • Workflow incomplete → Check workflow definitions
  • Form not triggering → Check [FORM:*] patterns
```

#### For Build Issues (5)
```
  BUILD TROUBLESHOOTING
  ─────────────────────

  Questions:
  • What command are you running?
  • What's the error message?
  • Any recent changes?

  Common commands:
  • npm install - Install dependencies
  • npm run dev - Development server
  • npm run build - Production build
  • npm run lint - Lint check

  Common issues:
  • Module not found → npm install
  • Type errors → Check TypeScript types
  • Build fails → Check for import errors
```

#### For Design Questions (6)
```
  DESIGN GUIDANCE
  ───────────────

  Questions:
  • What are you trying to accomplish?
  • What approaches have you considered?
  • Any constraints to be aware of?

  Key resources:
  • CLAUDE.md - Project guidelines
  • .claude/PLANNING.md - Architecture decisions

  Principles:
  • Privacy-first: Always tokenize PII
  • Demo-ready: Support keyboard shortcuts
  • Type-safe: Use TypeScript properly
```

#### For Project Questions (7)
```
  PROJECT GUIDANCE
  ────────────────

  Questions:
  • What are you trying to decide?
  • What's the timeline pressure?
  • Any stakeholder constraints?

  Helpful commands:
  • /dashboard - Current status
  • /start - Find next task
  • /strategic-check - Evaluate new ideas

  Key files:
  • .claude/TODO.md - Task list
  • .claude/PLANNING.md - Roadmap
```

### Step 3: Provide Solution

Based on the problem, provide:
1. **Root cause** - What's actually wrong
2. **Solution** - Step-by-step fix
3. **Prevention** - How to avoid this in future
4. **Verification** - How to confirm it's fixed

```
╔══════════════════════════════════════════════════════════════╗
║                    SOLUTION                                  ║
╠══════════════════════════════════════════════════════════════╣

  ROOT CAUSE
  ──────────
  [Explanation of what's wrong]

  SOLUTION
  ────────
  1. [First step]
  2. [Second step]
  3. [Third step]

  PREVENTION
  ──────────
  [How to avoid this in future]

  VERIFY FIX
  ──────────
  [Command or check to confirm resolution]

╚══════════════════════════════════════════════════════════════╝
```

### Step 4: Follow Up

```
  Is this resolved? (yes/need more help/different issue)
```

If not resolved, dig deeper or escalate:
- Offer to examine specific files
- Suggest pairing on the problem
- Create a blocker in TODO.md if truly stuck

---

**Usage**: `/help-me`
**Related**: `/dashboard` for context, `/start` to resume work
