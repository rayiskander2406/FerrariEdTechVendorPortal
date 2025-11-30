# SchoolDay Vendor Portal - Daily Workflow

Your guide to productive development sessions.

---

## The Core Loop

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│    /dashboard  →  /start  →  [work]  →  /finish             │
│         ↑                                    │               │
│         └────────────────────────────────────┘               │
│                                                              │
│              Use /help-me if stuck anywhere                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Starting Your Day

### 1. Get Oriented (30 seconds)

```
/dashboard
```

This shows you:
- Current release status (MVP / v1.0)
- GO/NO-GO gate status
- Tasks remaining
- Recent completions
- Any blockers

### 2. Begin Working

```
/start
```

This:
- Identifies the right next task
- Loads context you need
- Sets up for focused work
- Tracks your progress

---

## During Your Session

### If Everything Is Going Well

Just work! The framework stays out of your way.

Follow these patterns:
- Privacy-first: Always tokenize PII before Claude API
- Type-safe: Use TypeScript properly
- Demo-ready: Support keyboard shortcuts
- Small commits: Commit frequently

### If You Get Stuck

```
/help-me
```

This provides structured troubleshooting for:
- Code not working
- AI tools issues
- Privacy concerns
- Demo problems
- Build errors
- Design questions

### After Making Changes

```
/qa
```

Quick quality check to catch issues early:
- Build check
- Lint check
- Type check
- Smoke test

### After Significant Code Changes

```
/code-review
```

Self-review using project criteria:
- Privacy & security
- Type safety
- React patterns
- API integration
- Code quality

---

## Ending Work on a Task

```
/finish
```

This ensures:
- Acceptance criteria verified
- Changes tested
- COMPLETED.md updated
- TODO.md updated
- Context preserved for next session

---

## MVP Workflow

For the current MVP sprint targeting LAUSD demos:

### Daily MVP Checks

```
/test-ai-tools      # Verify AI tools work
/privacy-check      # No PII leaks (critical!)
/run-demo           # Test demo workflows
```

### Before Stakeholder Demo

```
1. /dashboard        → Check all gates
2. /test-ai-tools    → Verify tools
3. /privacy-check    → Audit PII (critical!)
4. /run-demo         → Test all 4 workflows
5. /release-checklist → Final verification
```

### MVP GO/NO-GO Gates

| Gate | Command to Verify |
|------|-------------------|
| Correctness | `/test-ai-tools` |
| Privacy | `/privacy-check` |
| Demo Ready | `/run-demo` |
| Performance | Manual observation |

---

## Weekly Rhythm

### Monday: Planning
- `/dashboard` - Where are we?
- Review TODO.md priorities
- Plan the week's tasks

### Tuesday-Thursday: Execution
- `/start` → work → `/finish` loop
- `/qa` after changes
- `/code-review` after major changes

### Friday: Quality & Reflection
- `/run-demo` - End of week demo test
- `/retrospective` (if milestone completed)

---

## Before Releases

### MVP Release Checklist

```
/test-ai-tools      # All 12 tools working
/privacy-check      # Zero PII leaks
/run-demo           # All 4 workflows smooth
/security-audit     # Security check
/release-checklist  # Final gate
```

### v1.0+ Release Checklist

All MVP checks plus:
- Database migrations tested
- CI/CD pipeline verified
- Performance benchmarks met

---

## Quick Reference

| Situation | Command |
|-----------|---------|
| Starting work | `/dashboard` then `/start` |
| Stuck on something | `/help-me` |
| Finished a task | `/finish` |
| Made some changes | `/qa` |
| Before committing | `/code-review` |
| Testing AI tools | `/test-ai-tools` |
| Checking for PII | `/privacy-check` |
| Before demo | `/run-demo` |
| Before release | `/release-checklist` |
| New idea to evaluate | `/strategic-check` |
| New team member | `/onboard` |
| After milestone | `/retrospective` |

---

## The Golden Rule

> **Privacy First. Always tokenize PII before sending to Claude.**

This is non-negotiable for K-12 compliance (FERPA, COPPA).

Run `/privacy-check` frequently!

---

## Files That Matter

| File | Purpose |
|------|---------|
| `.claude/TODO.md` | Current tasks |
| `.claude/COMPLETED.md` | Completion tracking |
| `.claude/PLANNING.md` | Release plan |
| `.claude/COMMANDS.md` | Full command reference |
| `CLAUDE.md` | Project guidelines |

---

## Demo Mode Quick Reference

| Action | How |
|--------|-----|
| Toggle demo mode | Press 'D' key |
| Access demo controls | `/demo` command |
| Test all workflows | `/run-demo` command |
| Manage features | `/features` command |

### Demo Workflows

1. **New Vendor Evaluation** - Assess new EdTech tool
2. **Compliance Review** - Check FERPA/COPPA compliance
3. **Integration Planning** - Plan vendor integration
4. **Risk Assessment** - Analyze adoption risks

---

*Use `/dashboard` right now to see your current status!*
