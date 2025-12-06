/**
 * SSO Page
 *
 * Single Sign-On configuration for Google, Microsoft, and Clever.
 */

export default function SSOPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">SSO</h1>
        <p className="text-muted-foreground">
          Configure Single Sign-On with your preferred identity provider.
        </p>
      </div>

      {/* Provider Options - Placeholder */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-medium">Google</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Google Workspace SSO via SAML or OAuth.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-medium">Microsoft</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Azure AD / Entra ID integration.
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-medium">Clever</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Clever Instant Login integration.
          </p>
        </div>
      </div>
    </div>
  );
}
