/**
 * LTI Page
 *
 * LTI 1.3 integration settings and configuration.
 */

export default function LTIPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">LTI</h1>
        <p className="text-muted-foreground">
          Configure LTI 1.3 integration for learning tools interoperability.
        </p>
      </div>

      {/* LTI Configuration - Placeholder */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-medium">LTI 1.3 Configuration</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Set up your LTI 1.3 tool configuration for Schoology and other LMS platforms.
        </p>
        {/* LTI config form will be added in Phase 2 */}
      </div>

      {/* Deep Linking - Placeholder */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-medium">Deep Linking</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure deep linking for content selection.
        </p>
      </div>
    </div>
  );
}
