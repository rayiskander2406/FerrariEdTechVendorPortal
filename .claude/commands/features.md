# Feature Flags Management Command

Manage moonshot feature flags for the SchoolDay Vendor Portal. This command allows you to enable, disable, and list feature flags directly from Claude Code.

## Arguments

The user's request: $ARGUMENTS

## Feature Flag IDs

Available feature flags (ranked by priority):
1. `ai-health-monitor` - AI Integration Health Monitor
2. `compliance-pipeline` - Automated Compliance Certification
3. `synthetic-sandbox` - Synthetic Student Data Sandbox
4. `vendor-marketplace` - Vendor-to-Vendor Marketplace
5. `predictive-onboarding` - Predictive Onboarding Assistant
6. `teacher-feedback` - Teacher Feedback Loop
7. `multi-district` - Multi-District Federation
8. `zero-touch-deploy` - Zero-Touch Deployment Pipeline
9. `parent-transparency` - Parent Transparency Portal
10. `impact-analytics` - Impact Analytics Dashboard

## Instructions

Based on the user's request, perform ONE of these actions:

### If user wants to LIST features:
1. Read the file `lib/features/feature-flags.ts`
2. Display a formatted table showing:
   - Feature ID
   - Name
   - Status (enabled/disabled by default)
   - Category
   - Rank

### If user wants to ENABLE a feature:
1. Read `lib/features/feature-flags.ts`
2. Find the feature by ID in DEFAULT_FEATURES
3. Set `enabled: true` for that feature
4. If the feature has dependencies, inform the user those will also be enabled
5. Write the updated file

### If user wants to DISABLE a feature:
1. Read `lib/features/feature-flags.ts`
2. Find the feature by ID in DEFAULT_FEATURES
3. Set `enabled: false` for that feature
4. Check if other features depend on this one and warn the user
5. Write the updated file

### If user wants to ENABLE ALL features:
1. Read `lib/features/feature-flags.ts`
2. Set `enabled: true` for all features in DEFAULT_FEATURES
3. Write the updated file

### If user wants to DISABLE ALL features:
1. Read `lib/features/feature-flags.ts`
2. Set `enabled: false` for all features in DEFAULT_FEATURES
3. Write the updated file

### If user wants to RESET features:
1. Remind them that `synthetic-sandbox` is the only feature enabled by default
2. Set all features to their default state (only synthetic-sandbox enabled)

## Response Format

After making changes, confirm with:
- What action was taken
- Which features were affected
- Any dependencies that were automatically enabled/disabled
- Reminder that changes take effect on next app load (or refresh if already running)

## Example Commands

- `/features list` - Show all features
- `/features enable ai-health-monitor` - Enable AI Health Monitor
- `/features disable vendor-marketplace` - Disable Vendor Marketplace
- `/features enable-all` - Enable all features for full demo
- `/features disable-all` - Disable all features
- `/features reset` - Reset to default state
