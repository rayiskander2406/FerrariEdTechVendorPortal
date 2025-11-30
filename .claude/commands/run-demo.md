---
name: run-demo
description: Launch demo mode and test all demo workflows
---

# Run Demo - Demo Mode Testing

You are launching demo mode and testing all demo workflows for the SchoolDay Vendor Portal.

## Purpose

Ensure demo is ready for stakeholder presentations:
1. All 4 workflows work end-to-end
2. Demo mode toggles correctly
3. Keyboard shortcuts work
4. Professional presentation experience

## Instructions

### Step 1: Launch Demo

```
╔══════════════════════════════════════════════════════════════╗
║                    DEMO MODE                                 ║
╠══════════════════════════════════════════════════════════════╣

  LAUNCH OPTIONS
  ──────────────

  1. Start dev server: npm run dev
  2. Open: http://localhost:3000
  3. Toggle demo mode: Press 'D' key

  DEMO MODE INDICATOR
  ───────────────────
  When demo mode is active, you should see:
  • Visual indicator (banner/badge)
  • Demo-specific UI elements
  • Pre-configured scenarios available

  KEYBOARD SHORTCUTS
  ──────────────────
  D     - Toggle demo mode
  [others as documented]

  Is demo mode working? [✅/❌]

╚══════════════════════════════════════════════════════════════╝
```

### Step 2: Test Workflows

Test all 4 demo workflows:

```
╔══════════════════════════════════════════════════════════════╗
║                    WORKFLOW TESTING                          ║
╠══════════════════════════════════════════════════════════════╣

  WORKFLOW 1: NEW VENDOR EVALUATION
  ─────────────────────────────────
  Scenario: District wants to evaluate a new EdTech tool

  Steps:
  1. □ Initiate vendor evaluation query
  2. □ AI provides assessment criteria
  3. □ Tool suggestions appear
  4. □ Form trigger works ([FORM:VendorAssessment])
  5. □ Workflow completes smoothly

  Result: [✅ Pass / ❌ Fail]
  Issues: [Any issues observed]

  ═══════════════════════════════════════════════════════════

  WORKFLOW 2: COMPLIANCE REVIEW
  ─────────────────────────────
  Scenario: Review vendor for privacy/security compliance

  Steps:
  1. □ Ask about vendor compliance
  2. □ AI checks compliance requirements
  3. □ FERPA/COPPA considerations shown
  4. □ Compliance report generated
  5. □ Clear pass/fail indication

  Result: [✅ Pass / ❌ Fail]
  Issues: [Any issues observed]

  ═══════════════════════════════════════════════════════════

  WORKFLOW 3: INTEGRATION PLANNING
  ────────────────────────────────
  Scenario: Plan integration of approved vendor

  Steps:
  1. □ Request integration plan
  2. □ AI outlines integration steps
  3. □ Technical requirements shown
  4. □ Timeline considerations
  5. □ Action items generated

  Result: [✅ Pass / ❌ Fail]
  Issues: [Any issues observed]

  ═══════════════════════════════════════════════════════════

  WORKFLOW 4: RISK ASSESSMENT
  ───────────────────────────
  Scenario: Assess risks of vendor adoption

  Steps:
  1. □ Ask about vendor risks
  2. □ AI identifies risk categories
  3. □ Risk scores/ratings provided
  4. □ Mitigation suggestions
  5. □ Risk summary generated

  Result: [✅ Pass / ❌ Fail]
  Issues: [Any issues observed]

╚══════════════════════════════════════════════════════════════╝
```

### Step 3: Test Demo Features

```
╔══════════════════════════════════════════════════════════════╗
║                    DEMO FEATURE CHECKS                       ║
╠══════════════════════════════════════════════════════════════╣

  KEYBOARD SHORTCUTS
  ──────────────────
  □ 'D' toggles demo mode
  □ [Other shortcuts work]
  □ No conflicts with browser shortcuts
  □ Shortcuts work on different browsers

  FORM TRIGGERS
  ─────────────
  □ [FORM:VendorAssessment] triggers form
  □ [FORM:ComplianceCheck] triggers form
  □ [Other forms work]
  □ Forms submit correctly

  UI/UX
  ─────
  □ Demo indicator visible
  □ Loading states clear
  □ Error states graceful
  □ Responsive on different screens

  STREAMING
  ─────────
  □ Responses stream smoothly
  □ No flickering or jumping
  □ Typing indicator works
  □ Can interrupt if needed

  PERFORMANCE
  ───────────
  □ Initial load < 3s
  □ Response starts < 2s
  □ No lag during demo
  □ Memory stable over time

╚══════════════════════════════════════════════════════════════╝
```

### Step 4: Present Results

```
╔══════════════════════════════════════════════════════════════╗
║                    DEMO TEST RESULTS                         ║
╠══════════════════════════════════════════════════════════════╣

  OVERALL: [✅ DEMO READY / ⚠️ MINOR ISSUES / ❌ NOT READY]

  WORKFLOW RESULTS
  ────────────────
  1. Vendor Evaluation:    [✅/❌]
  2. Compliance Review:    [✅/❌]
  3. Integration Planning: [✅/❌]
  4. Risk Assessment:      [✅/❌]

  FEATURE RESULTS
  ───────────────
  Keyboard shortcuts: [✅/❌]
  Form triggers:      [✅/❌]
  Streaming:          [✅/❌]
  Performance:        [✅/❌]

  ═══════════════════════════════════════════════════════════

  [If DEMO READY]
  ───────────────
  All workflows tested successfully!

  Demo checklist:
  ✅ All 4 workflows complete
  ✅ Keyboard shortcuts work
  ✅ Forms trigger correctly
  ✅ Performance acceptable

  You're ready for stakeholder presentations.

  [If MINOR ISSUES]
  ─────────────────
  Demo works but has minor issues:

  • [Issue 1]
  • [Issue 2]

  These may not block the demo but should be noted.

  [If NOT READY]
  ──────────────
  Critical issues prevent demo:

  • [Critical issue 1]
  • [Critical issue 2]

  Fix these before presenting to stakeholders.

╚══════════════════════════════════════════════════════════════╝
```

### Step 5: Demo Preparation Tips

```
╔══════════════════════════════════════════════════════════════╗
║                    DEMO TIPS                                 ║
╠══════════════════════════════════════════════════════════════╣

  BEFORE THE DEMO
  ───────────────
  □ Clear browser cache/localStorage
  □ Close unnecessary tabs
  □ Disable notifications
  □ Test audio/screen share setup
  □ Have backup browser ready

  DURING THE DEMO
  ───────────────
  □ Use predefined scenarios
  □ Have fallback responses ready
  □ Know how to recover from errors
  □ Keep queries simple and clear

  TALKING POINTS
  ──────────────
  • "Notice how student names are never sent to the AI"
  • "The AI suggests relevant compliance checks"
  • "Form triggers make workflows seamless"
  • "All of this protects student privacy"

  IF SOMETHING BREAKS
  ───────────────────
  • Stay calm, acknowledge the issue
  • "Let me show you another feature..."
  • Refresh page if needed
  • Use /help-me afterward to debug

╚══════════════════════════════════════════════════════════════╝
```

## Quick Commands

```bash
# Start dev server
npm run dev

# Build for production-like testing
npm run build && npm start

# Check for runtime errors
npm run lint
```

---

**Usage**: `/run-demo`
**Related**: `/demo` for demo controls, `/test-ai-tools` for tool verification
