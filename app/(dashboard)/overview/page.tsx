/**
 * Overview Page
 *
 * Dashboard home with status overview of all integrations.
 */

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Overview</h1>
        <p className="text-muted-foreground">
          Welcome to your SchoolDay Vendor Portal dashboard.
        </p>
      </div>

      {/* Status Cards - Placeholder */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-sm font-medium text-muted-foreground">OneRoster</h3>
          <p className="text-2xl font-bold">Active</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-sm font-medium text-muted-foreground">SSO</h3>
          <p className="text-2xl font-bold">Configured</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-sm font-medium text-muted-foreground">LTI</h3>
          <p className="text-2xl font-bold">Pending</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Messages</h3>
          <p className="text-2xl font-bold">3 New</p>
        </div>
      </div>
    </div>
  );
}
