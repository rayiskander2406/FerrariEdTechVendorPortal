/**
 * Audit Log Page
 *
 * Activity and access logs for compliance tracking.
 */

export default function AuditPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Audit Log</h1>
        <p className="text-muted-foreground">
          View all activity and data access logs for compliance.
        </p>
      </div>

      {/* Audit Filters - Placeholder */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-medium">Filters</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Filter audit logs by date, action type, or resource.
        </p>
        {/* Filter controls will be added in Phase 2 */}
      </div>

      {/* Audit Log Table - Placeholder */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-medium">Activity Log</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Recent activity on your vendor account.
        </p>
        {/* Audit log table will be added in Phase 2 */}
      </div>
    </div>
  );
}
