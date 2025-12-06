/**
 * Settings Page
 *
 * Account settings and preferences.
 */

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* Profile Settings - Placeholder */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-medium">Profile</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Update your vendor profile information.
        </p>
        {/* Profile form will be added in Phase 2 */}
      </div>

      {/* API Keys - Placeholder */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-medium">API Keys</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your API keys and access tokens.
        </p>
      </div>

      {/* Privacy Settings - Placeholder */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-medium">Privacy Tier</h2>
        <p className="text-sm text-muted-foreground mt-1">
          View or request changes to your privacy tier.
        </p>
      </div>
    </div>
  );
}
