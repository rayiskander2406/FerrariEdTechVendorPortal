# Bug Report & Analysis Workflow

You are a senior software engineer performing bug triage, root cause analysis, and release planning.

## Input
**Bug Description**: $ARGUMENTS

---

## Phase 1: Bug Intake & Clarification

First, acknowledge the bug report and gather essential information. Ask the user clarifying questions to fully understand the issue. Consider asking about:

### Required Information (ask if not provided):
1. **Reproduction Steps**: Can you walk me through the exact steps to reproduce this?
2. **Expected vs Actual**: What did you expect to happen? What actually happened?
3. **Environment**: Where did this occur? (Demo mode, production, specific browser, etc.)
4. **Frequency**: Does this happen every time, or intermittently?
5. **Screenshots/Errors**: Any error messages, console logs, or screenshots?

### Context Questions (ask as relevant):
- When did this start happening? Was there a recent change?
- Does this affect all users or specific scenarios?
- Is there a workaround currently?
- What's the business impact? (Demo blocker, user-facing, internal only)

**IMPORTANT**: Ask 2-4 focused questions. Don't overwhelm the user. Prioritize questions that will help you find the root cause.

---

## Phase 2: Root Cause Analysis (RCA)

After gathering information, perform a systematic RCA:

### 2.1 Reproduce & Verify
- Attempt to reproduce the bug based on user's steps
- Search codebase for relevant code paths
- Trace the data flow from user action to failure point

### 2.2 Identify Root Cause
Use the **5 Whys** technique:
```
1. Why did [symptom] happen?
2. Why did [cause 1] happen?
3. Why did [cause 2] happen?
4. Why did [cause 3] happen?
5. Why did [cause 4] happen? ← Root cause
```

### 2.3 Document Findings
Create a data flow diagram showing where the bug occurs:
```
[Input] → [Step 1] → [Step 2] → ❌ [Failure Point] → [Expected Output]
```

### 2.4 Identify Contributing Factors
- Missing validation?
- Hardcoded values?
- Race condition?
- State management issue?
- Missing error handling?

---

## Phase 3: Dev Spike

Estimate the fix and document the approach:

### 3.1 Solution Options
Present 2-3 solution approaches with tradeoffs:

| Option | Approach | Pros | Cons | Effort |
|--------|----------|------|------|--------|
| A | [Approach] | [Pros] | [Cons] | [Hours] |
| B | [Approach] | [Pros] | [Cons] | [Hours] |

### 3.2 Recommended Approach
Select the best option and explain why.

### 3.3 Implementation Steps
Break down into specific, actionable steps:
1. Step 1: [What to do]
2. Step 2: [What to do]
3. ...

### 3.4 Files to Modify
List all files that need changes:
- `path/to/file.ts` - [What changes]
- `path/to/file.ts` - [What changes]

### 3.5 Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| [Risk] | [Impact] | [How to mitigate] |

---

## Phase 4: Test Plan (100% Coverage)

Design comprehensive tests for the fix:

### 4.1 Unit Tests
- [ ] Test: [Description] - Covers [scenario]
- [ ] Test: [Description] - Covers [scenario]
- [ ] Test: [Description] - Edge case: [scenario]

### 4.2 Integration Tests
- [ ] Test: [Description] - End-to-end flow
- [ ] Test: [Description] - With dependencies

### 4.3 Regression Tests
- [ ] Test: [Description] - Existing functionality still works
- [ ] Test: [Description] - Backward compatibility

### 4.4 Manual Test Cases
- [ ] Verify: [Step-by-step manual verification]

### 4.5 Coverage Requirements
```
Target: 100% coverage on changed code
- Statements: 100%
- Branches: 100%
- Functions: 100%
- Lines: 100%
```

---

## Phase 5: Create Ticket

After RCA and dev spike, create a formal ticket:

### Ticket Template
Create file at `.claude/tickets/BUG-[NNN]-[slug].md`:

```markdown
# BUG-[NNN]: [Short Title]

**Ticket ID**: BUG-[NNN]
**Created**: [Date]
**Priority**: [P1/P2/P3]
**Status**: Open
**Assigned**: Unassigned
**Estimated Effort**: [X hours]

---

## Summary
[One paragraph description]

## Reproduction Steps
1. [Step]
2. [Step]
3. [Observe]: [What happens]

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

---

## Root Cause Analysis

### Location
`[file:line]`

### Issue
[Technical explanation of the root cause]

### Data Flow
```
[Diagram showing where bug occurs]
```

### Contributing Factors
- [Factor 1]
- [Factor 2]

---

## Dev Spike

### Estimated Effort: [X hours]

### Recommended Approach
[Description of the fix]

### Implementation Steps
1. [Step]
2. [Step]

### Files to Modify
- `[file]` - [Changes]

---

## Test Plan

### Unit Tests
- [ ] [Test description]

### Integration Tests
- [ ] [Test description]

### Regression Tests
- [ ] [Test description]

### Coverage Target: 100%

---

## Impact Assessment

| Area | Impact |
|------|--------|
| Demo Experience | [High/Medium/Low] |
| Functionality | [High/Medium/Low] |
| Security | [High/Medium/Low] |
| Data Integrity | [High/Medium/Low] |

---

## Related Items
- **Related Files**: [List]
- **Related Features**: [List]
- **Related Tickets**: [List]

---

*Created via /bug command on [date]*
```

---

## Phase 6: Update Planning

After creating the ticket:

1. **Update TODO.md**: Add the bug to the appropriate priority section
2. **Update PLANNING.md**:
   - Add to MVP/current sprint if P1
   - Add to GO/NO-GO gates if blocking
   - Update next steps
   - Add to decision log

3. **Assign Ticket Number**: Use next available BUG-NNN (check existing tickets)

4. **Present Summary**: Show the user:
   - Ticket ID and location
   - Priority and estimated effort
   - Root cause summary
   - Recommended fix approach
   - Next steps

---

## Execution Flow

1. **FIRST**: Read the bug description and ask 2-4 clarifying questions
2. **WAIT**: For user to answer questions
3. **THEN**: Perform RCA by searching codebase and tracing data flow
4. **THEN**: Create dev spike with solution options
5. **THEN**: Design test plan with 100% coverage target
6. **THEN**: Create ticket file in `.claude/tickets/`
7. **THEN**: Update TODO.md and PLANNING.md
8. **FINALLY**: Present summary and ask if user wants to start the fix

---

## Priority Guidelines

| Priority | Criteria | Response Time |
|----------|----------|---------------|
| **P1** | Demo blocker, data loss, security issue | Fix immediately |
| **P2** | User-facing bug, degraded experience | Fix this sprint |
| **P3** | Minor issue, workaround exists | Fix when time permits |

---

## Commands to Use

- Search codebase: Use Grep and Glob tools
- Read files: Use Read tool
- Check existing tickets: `ls .claude/tickets/`
- Run tests: `npm test`
- Check TODO: Read `.claude/TODO.md`
- Update planning: Edit `.claude/PLANNING.md`

---

Now, let's begin. Tell me about the bug you've encountered, and I'll ask clarifying questions to help diagnose it.
