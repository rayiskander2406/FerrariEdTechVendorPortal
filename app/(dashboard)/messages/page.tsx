/**
 * Messages Page
 *
 * Communication gateway for parent/guardian messaging.
 */

export default function MessagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Messages</h1>
        <p className="text-muted-foreground">
          Send communications through the SchoolDay relay gateway.
        </p>
      </div>

      {/* Communication Gateway - Placeholder */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-medium">Communication Gateway</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Send tokenized messages to parents/guardians without exposing contact information.
        </p>
        {/* Message composer will be added in Phase 2 */}
      </div>

      {/* Message History - Placeholder */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-medium">Message History</h2>
        <p className="text-sm text-muted-foreground mt-1">
          View sent messages and delivery status.
        </p>
      </div>
    </div>
  );
}
