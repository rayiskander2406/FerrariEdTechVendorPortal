# Demo Mode Commands

Manage the automated demo mode for the SchoolDay Vendor Portal.

## Available Commands

### Start Demo Mode
To start demo mode, open the app at `/chat` and click the **Demo** button in the header, OR add `?demo=true` to the URL:

```
http://localhost:3000/chat?demo=true
```

### Available Demo Workflows

1. **New Vendor Onboarding** (~3 min)
   - Complete end-to-end PoDS-Lite application
   - Auto-fills form with demo vendor data
   - Shows API credentials generation
   - Tests the OneRoster API

2. **API Integration Testing** (~2 min)
   - Quick vendor registration
   - Explores the OneRoster API tester
   - Demonstrates tokenized student data
   - Explains privacy-preserving tokenization

3. **SSO Configuration** (~2 min)
   - Vendor registration
   - SSO provider setup with SchoolDay
   - OAuth configuration demo

4. **Communication Gateway** (~2 min)
   - Tests the communication API
   - Shows privacy-preserving messaging
   - Demonstrates token-based routing

## Demo Controls

During an automated demo:
- **Space**: Pause/Resume demo
- **Right Arrow**: Skip to next step
- **Escape**: Stop demo and return to normal mode

## Demo Mode Features

- **Progress Bar**: Shows current progress through the workflow
- **Step Indicator**: Displays what's happening at each step
- **Natural Pacing**: Steps execute at realistic speeds for viewing
- **Pause/Resume**: Demo can be paused at any point
- **Skip Step**: Move to the next step if needed

## For Presenters

1. Open the portal in full-screen browser mode
2. Click the **Demo** button
3. Select a workflow based on your audience
4. The demo will run automatically - you can provide commentary
5. Use Space to pause if you want to explain something
6. At completion, choose to explore manually or run another demo

## URL Parameters

- `?demo=true` - Auto-start demo mode on page load (shows workflow selection)
- `?demo=vendor-onboarding` - Auto-start specific workflow
- `?demo=api-testing` - Auto-start API testing workflow
- `?demo=sso-config` - Auto-start SSO configuration workflow
- `?demo=comm-gateway` - Auto-start communication gateway workflow

## Example Usage

```bash
# Start the dev server
npm run dev

# Open in browser with demo mode
open "http://localhost:3000/chat?demo=true"
```

## Programmatic Control

The demo state is managed via React context. Access it with:

```tsx
import { useDemo } from "@/lib/demo";

const {
  startDemoMode,    // Start demo selection
  selectWorkflow,   // Select a specific workflow
  pauseDemo,        // Pause the demo
  resumeDemo,       // Resume the demo
  stopDemo,         // Stop and exit demo mode
  skipStep,         // Skip current step
  isDemoMode,       // Boolean: is demo active
  isAutoRunning,    // Boolean: is demo currently running (not paused)
  state             // Full demo state object
} = useDemo();
```
