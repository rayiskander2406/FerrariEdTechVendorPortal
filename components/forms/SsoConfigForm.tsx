"use client";

import React, { useState, useCallback, type FormEvent } from "react";
import { z } from "zod";
import {
  Link2,
  Link,
  ExternalLink,
  Shield,
  CheckCircle2,
  Loader2,
  AlertCircle,
  GraduationCap,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SSO_PROVIDERS,
  SSO_SCOPES_BY_PROVIDER,
  SsoProviderEnumWithSchoolDay,
  type SsoProviderKey,
} from "@/lib/config/sso";

// =============================================================================
// TYPES
// =============================================================================

// Re-export SsoProviderKey as SsoProvider for backwards compatibility
export type SsoProvider = SsoProviderKey;

export interface SsoConfig {
  provider: SsoProvider;
  launchUrl: string;
  redirectUri: string;
  scopes: string[];
}

interface SsoConfigFormProps {
  provider?: SsoProvider;
  onSubmit: (config: SsoConfig) => Promise<void>;
  onCancel: () => void;
}

interface FormErrors {
  [key: string]: string | undefined;
}

// =============================================================================
// VALIDATION SCHEMA
// =============================================================================

const FormSchema = z.object({
  provider: SsoProviderEnumWithSchoolDay,
  launchUrl: z.string().url("Please enter a valid URL"),
  redirectUri: z.string().url("Please enter a valid redirect URI"),
  scopes: z.array(z.string()).min(1, "Select at least one scope"),
});

// =============================================================================
// PROVIDER CONFIGURATION (from centralized config)
// =============================================================================

// Icon mapping for Lucide React components
const ICON_MAP: Record<string, typeof GraduationCap> = {
  GraduationCap,
  Sparkles,
  Link,
  Users,
};

// Build PROVIDERS array from centralized config
const PROVIDERS = Object.entries(SSO_PROVIDERS).map(([key, provider]) => ({
  value: key as SsoProviderKey,
  label: provider.name,
  description: provider.description,
  icon: ICON_MAP[provider.icon] ?? Users,
}));

// Use centralized scopes config
const SCOPES_BY_PROVIDER = SSO_SCOPES_BY_PROVIDER;

// =============================================================================
// COMPONENT
// =============================================================================

export function SsoConfigForm({ provider: initialProvider, onSubmit, onCancel }: SsoConfigFormProps) {
  // Form state
  const [formData, setFormData] = useState({
    provider: initialProvider ?? ("SCHOOLDAY" as SsoProvider),
    launchUrl: "",
    redirectUri: "",
    scopes: ["openid", "profile"] as string[],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleProviderChange = useCallback((provider: SsoProvider) => {
    const providerScopes = SCOPES_BY_PROVIDER[provider];
    setFormData((prev) => ({
      ...prev,
      provider,
      // Reset scopes to first available scope for new provider
      scopes: providerScopes && providerScopes[0] ? [providerScopes[0].value] : [],
    }));
    setErrors((prev) => ({ ...prev, provider: undefined }));
  }, []);

  const handleInputChange = useCallback(
    (field: string, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  const handleScopeToggle = useCallback((scope: string) => {
    setFormData((prev) => {
      const current = prev.scopes;
      const updated = current.includes(scope)
        ? current.filter((s) => s !== scope)
        : [...current, scope];
      return { ...prev, scopes: updated };
    });
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setSubmitError(null);

      // Validate
      const result = FormSchema.safeParse(formData);
      if (!result.success) {
        const newErrors: FormErrors = {};
        for (const issue of result.error.issues) {
          const path = issue.path[0];
          if (typeof path === "string") {
            newErrors[path] = issue.message;
          }
        }
        setErrors(newErrors);
        return;
      }

      setIsSubmitting(true);

      try {
        await onSubmit({
          provider: formData.provider,
          launchUrl: formData.launchUrl,
          redirectUri: formData.redirectUri,
          scopes: formData.scopes,
        });
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : "Failed to save SSO configuration"
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, onSubmit]
  );

  // ==========================================================================
  // VALIDATION CHECK
  // ==========================================================================

  const isFormValid =
    formData.provider &&
    formData.launchUrl.length > 0 &&
    formData.redirectUri.length > 0 &&
    formData.scopes.length > 0;

  const availableScopes = SCOPES_BY_PROVIDER[formData.provider];

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Banner - Purple/Pink Gradient Border */}
      <div className="relative rounded-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-secondary via-purple-500 to-pink-500 p-[2px] rounded-lg">
          <div className="absolute inset-[2px] bg-white rounded-lg" />
        </div>
        <div className="relative bg-gradient-to-r from-secondary via-purple-500 to-pink-500 rounded-lg p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Link2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold">SSO Configuration</h3>
              <p className="text-sm text-white/80">
                Configure Single Sign-On for seamless authentication
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Shield className="w-4 h-4" />
              OAuth 2.0 / OIDC
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              LTI 1.3 Compatible
            </span>
          </div>
        </div>
      </div>

      {/* Submit Error */}
      {submitError && (
        <div className="bg-error-50 border border-error-200 rounded-lg p-3 flex items-center gap-2 text-error-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{submitError}</span>
        </div>
      )}

      {/* Provider Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Select SSO Provider *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PROVIDERS.map((p) => {
            const Icon = p.icon;
            const isSelected = formData.provider === p.value;
            return (
              <label
                key={p.value}
                className={cn(
                  "relative flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all",
                  isSelected
                    ? "border-secondary bg-secondary/5 shadow-md"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                )}
              >
                <input
                  type="radio"
                  name="provider"
                  value={p.value}
                  checked={isSelected}
                  onChange={() => handleProviderChange(p.value)}
                  className="sr-only"
                />
                <div
                  className={cn(
                    "p-3 rounded-full mb-2 transition-colors",
                    isSelected ? "bg-secondary/10" : "bg-gray-100"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-6 h-6",
                      isSelected ? "text-secondary" : "text-gray-500"
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "font-medium",
                    isSelected ? "text-secondary" : "text-gray-700"
                  )}
                >
                  {p.label}
                </span>
                <span className="text-xs text-gray-500 text-center mt-1">
                  {p.description}
                </span>
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 className="w-5 h-5 text-secondary" />
                  </div>
                )}
              </label>
            );
          })}
        </div>
      </div>

      {/* URL Configuration */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex items-center gap-2 text-gray-700 font-medium">
          <ExternalLink className="w-5 h-5 text-secondary" />
          <span>URL Configuration</span>
        </div>

        {/* Launch URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Launch URL *
          </label>
          <p className="text-xs text-gray-500 mb-2">
            The URL where users will be redirected to initiate SSO login
          </p>
          <input
            type="url"
            value={formData.launchUrl}
            onChange={(e) => handleInputChange("launchUrl", e.target.value)}
            placeholder="https://your-app.com/sso/launch"
            className={cn(
              "w-full px-3 py-2 border rounded-lg text-sm",
              "focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary",
              errors.launchUrl ? "border-error-300 bg-error-50" : "border-gray-300"
            )}
          />
          {errors.launchUrl && (
            <p className="text-xs text-error-600 mt-1">{errors.launchUrl}</p>
          )}
        </div>

        {/* Redirect URI */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Redirect URI *
          </label>
          <p className="text-xs text-gray-500 mb-2">
            The callback URL where users return after authentication
          </p>
          <input
            type="url"
            value={formData.redirectUri}
            onChange={(e) => handleInputChange("redirectUri", e.target.value)}
            placeholder="https://your-app.com/sso/callback"
            className={cn(
              "w-full px-3 py-2 border rounded-lg text-sm",
              "focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary",
              errors.redirectUri ? "border-error-300 bg-error-50" : "border-gray-300"
            )}
          />
          {errors.redirectUri && (
            <p className="text-xs text-error-600 mt-1">{errors.redirectUri}</p>
          )}
        </div>
      </div>

      {/* Scopes Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex items-center gap-2 text-gray-700 font-medium">
          <Shield className="w-5 h-5 text-secondary" />
          <span>Permission Scopes</span>
        </div>
        <p className="text-sm text-gray-500">
          Select the data access scopes required for your integration with{" "}
          <span className="font-medium text-secondary">
            {PROVIDERS.find((p) => p.value === formData.provider)?.label}
          </span>
        </p>

        <div className="space-y-2">
          {availableScopes.map((scope) => (
            <label
              key={scope.value}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                formData.scopes.includes(scope.value)
                  ? "border-secondary bg-secondary/5"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <input
                type="checkbox"
                checked={formData.scopes.includes(scope.value)}
                onChange={() => handleScopeToggle(scope.value)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-secondary focus:ring-secondary"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">
                  {scope.label}
                </span>
                <code className="ml-2 text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                  {scope.value}
                </code>
                <p className="text-xs text-gray-500 mt-0.5">{scope.description}</p>
              </div>
            </label>
          ))}
        </div>
        {errors.scopes && (
          <p className="text-xs text-error-600">{errors.scopes}</p>
        )}
      </div>

      {/* Configuration Preview */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Configuration Preview</h4>
        <pre className="text-xs bg-gray-800 text-gray-100 rounded-lg p-3 overflow-x-auto">
{`{
  "provider": "${formData.provider}",
  "launchUrl": "${formData.launchUrl || "<launch-url>"}",
  "redirectUri": "${formData.redirectUri || "<redirect-uri>"}",
  "scopes": [${formData.scopes.map((s) => `"${s}"`).join(", ")}]
}`}
        </pre>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium",
            "bg-gradient-to-r from-secondary to-purple-500 text-white",
            "hover:from-secondary-600 hover:to-purple-600 active:scale-95",
            "disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed",
            "transition-all duration-200"
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Save Configuration
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default SsoConfigForm;
