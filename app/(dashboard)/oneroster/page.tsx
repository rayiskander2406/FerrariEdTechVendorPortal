/**
 * OneRoster Page
 *
 * API credentials and endpoint testing for OneRoster integration.
 */

export default function OneRosterPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">OneRoster</h1>
        <p className="text-muted-foreground">
          Manage your OneRoster API credentials and test endpoints.
        </p>
      </div>

      {/* Credentials Section - Placeholder */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-medium">API Credentials</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Your OneRoster API credentials for rostering integration.
        </p>
        {/* Credential display will be added in Phase 2 */}
      </div>

      {/* API Tester Section - Placeholder */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-medium">API Tester</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Test OneRoster endpoints with your credentials.
        </p>
        {/* API tester form will be added in Phase 2 */}
      </div>
    </div>
  );
}
