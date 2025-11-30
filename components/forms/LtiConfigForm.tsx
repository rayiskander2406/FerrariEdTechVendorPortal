"use client";

import React, { useState, useCallback, type FormEvent } from "react";
import { z } from "zod";
import {
  Box,
  Shield,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  Key,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

export interface LtiConfig {
  clientId: string;
  deploymentId: string;
  launchUrl: string;
  jwksUrl: string;
}

export interface LtiPlatformInfo {
  issuer: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  jwksUri: string;
}

interface LtiConfigFormProps {
  platformInfo?: LtiPlatformInfo;
  onSubmit: (config: LtiConfig) => Promise<void>;
  onCancel: () => void;
}

interface FormErrors {
  [key: string]: string | undefined;
}

// =============================================================================
// VALIDATION SCHEMA
// =============================================================================

const FormSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  deploymentId: z.string().min(1, "Deployment ID is required"),
  launchUrl: z.string().url("Please enter a valid launch URL"),
  jwksUrl: z.string().url("Please enter a valid JWKS URL"),
});

// =============================================================================
// DEFAULT PLATFORM INFO (Schoology/LAUSD)
// =============================================================================

const DEFAULT_PLATFORM_INFO: LtiPlatformInfo = {
  issuer: "https://schoology.lausd.net",
  authorizationEndpoint: "https://schoology.lausd.net/lti/authorize",
  tokenEndpoint: "https://schoology.lausd.net/lti/token",
  jwksUri: "https://schoology.lausd.net/.well-known/jwks.json",
};

// =============================================================================
// COMPONENT
// =============================================================================

export function LtiConfigForm({ platformInfo, onSubmit, onCancel }: LtiConfigFormProps) {
  const platform = platformInfo ?? DEFAULT_PLATFORM_INFO;

  // Form state
  const [formData, setFormData] = useState({
    clientId: "",
    deploymentId: "",
    launchUrl: "",
    jwksUrl: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleInputChange = useCallback(
    (field: string, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  const handleCopy = useCallback(async (field: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Clipboard API not available
    }
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
          clientId: formData.clientId,
          deploymentId: formData.deploymentId,
          launchUrl: formData.launchUrl,
          jwksUrl: formData.jwksUrl,
        });
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : "Failed to save LTI configuration"
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
    formData.clientId.length > 0 &&
    formData.deploymentId.length > 0 &&
    formData.launchUrl.length > 0 &&
    formData.jwksUrl.length > 0;

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Banner - Orange/Red Gradient */}
      <div className="relative rounded-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 p-[2px] rounded-lg">
          <div className="absolute inset-[2px] bg-white rounded-lg" />
        </div>
        <div className="relative bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-lg p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Box className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold">LTI 1.3 Configuration</h3>
              <p className="text-sm text-white/80">
                Connect your tool to Schoology LMS via LTI 1.3
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <Shield className="w-4 h-4" />
              LTI 1.3 / LTI Advantage
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Deep Linking & Grade Passback
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

      {/* Platform Credentials (Read-only) */}
      <div className="bg-gray-900 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-700 flex items-center gap-2">
          <Key className="w-5 h-5 text-orange-400" />
          <span className="font-medium text-white">LAUSD Platform Credentials</span>
          <span className="text-xs text-gray-400">(Use these in your LTI tool)</span>
        </div>

        <div className="divide-y divide-gray-800">
          {[
            { key: "issuer", label: "ISSUER", value: platform.issuer },
            { key: "authEndpoint", label: "AUTHORIZATION_ENDPOINT", value: platform.authorizationEndpoint },
            { key: "tokenEndpoint", label: "TOKEN_ENDPOINT", value: platform.tokenEndpoint },
            { key: "jwksUri", label: "PLATFORM_JWKS_URI", value: platform.jwksUri },
          ].map((field) => (
            <div
              key={field.key}
              className="px-4 py-3 flex items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 font-medium mb-1">
                  {field.label}
                </div>
                <div className="font-mono text-sm text-gray-200 truncate">
                  {field.value}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(field.key, field.value)}
                className={cn(
                  "p-2 rounded transition-colors",
                  copiedField === field.key
                    ? "text-green-400 bg-green-500/20"
                    : "text-gray-400 hover:text-white hover:bg-gray-700"
                )}
                title={copiedField === field.key ? "Copied!" : "Copy"}
              >
                {copiedField === field.key ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Your Tool Configuration */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex items-center gap-2 text-gray-700 font-medium">
          <Link2 className="w-5 h-5 text-orange-500" />
          <span>Your Tool Configuration</span>
        </div>
        <p className="text-sm text-gray-500">
          Enter your LTI tool&apos;s configuration details below
        </p>

        {/* Client ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Client ID *
          </label>
          <p className="text-xs text-gray-500 mb-2">
            The client ID assigned to your tool by the LTI platform
          </p>
          <input
            type="text"
            value={formData.clientId}
            onChange={(e) => handleInputChange("clientId", e.target.value)}
            placeholder="e.g., 12345-abcde-67890"
            className={cn(
              "w-full px-3 py-2 border rounded-lg text-sm",
              "focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500",
              errors.clientId ? "border-error-300 bg-error-50" : "border-gray-300"
            )}
          />
          {errors.clientId && (
            <p className="text-xs text-error-600 mt-1">{errors.clientId}</p>
          )}
        </div>

        {/* Deployment ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deployment ID *
          </label>
          <p className="text-xs text-gray-500 mb-2">
            The deployment ID for this specific integration
          </p>
          <input
            type="text"
            value={formData.deploymentId}
            onChange={(e) => handleInputChange("deploymentId", e.target.value)}
            placeholder="e.g., deployment-001"
            className={cn(
              "w-full px-3 py-2 border rounded-lg text-sm",
              "focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500",
              errors.deploymentId ? "border-error-300 bg-error-50" : "border-gray-300"
            )}
          />
          {errors.deploymentId && (
            <p className="text-xs text-error-600 mt-1">{errors.deploymentId}</p>
          )}
        </div>

        {/* Launch URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tool Launch URL *
          </label>
          <p className="text-xs text-gray-500 mb-2">
            The URL where LTI launches will be sent to your tool
          </p>
          <input
            type="url"
            value={formData.launchUrl}
            onChange={(e) => handleInputChange("launchUrl", e.target.value)}
            placeholder="https://your-app.com/lti/launch"
            className={cn(
              "w-full px-3 py-2 border rounded-lg text-sm",
              "focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500",
              errors.launchUrl ? "border-error-300 bg-error-50" : "border-gray-300"
            )}
          />
          {errors.launchUrl && (
            <p className="text-xs text-error-600 mt-1">{errors.launchUrl}</p>
          )}
        </div>

        {/* JWKS URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tool JWKS URL *
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Your tool&apos;s JSON Web Key Set URL for signature verification
          </p>
          <input
            type="url"
            value={formData.jwksUrl}
            onChange={(e) => handleInputChange("jwksUrl", e.target.value)}
            placeholder="https://your-app.com/.well-known/jwks.json"
            className={cn(
              "w-full px-3 py-2 border rounded-lg text-sm",
              "focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500",
              errors.jwksUrl ? "border-error-300 bg-error-50" : "border-gray-300"
            )}
          />
          {errors.jwksUrl && (
            <p className="text-xs text-error-600 mt-1">{errors.jwksUrl}</p>
          )}
        </div>
      </div>

      {/* LTI Features */}
      <div className="bg-orange-50 rounded-lg border border-orange-200 p-4">
        <h4 className="text-sm font-medium text-orange-800 mb-3">Available LTI Features</h4>
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: "Deep Linking", description: "Content item selection" },
            { name: "Assignment & Grades", description: "Grade passback to LMS" },
            { name: "Names & Roles", description: "Roster provisioning" },
            { name: "NRPS", description: "Names & Role Provisioning Service" },
          ].map((feature) => (
            <div key={feature.name} className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-sm font-medium text-orange-800">{feature.name}</span>
                <p className="text-xs text-orange-600">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Configuration Preview */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Configuration Preview</h4>
        <pre className="text-xs bg-gray-800 text-gray-100 rounded-lg p-3 overflow-x-auto">
{`{
  "platform": {
    "issuer": "${platform.issuer}",
    "authorizationEndpoint": "${platform.authorizationEndpoint}",
    "tokenEndpoint": "${platform.tokenEndpoint}",
    "jwksUri": "${platform.jwksUri}"
  },
  "tool": {
    "clientId": "${formData.clientId || "<client-id>"}",
    "deploymentId": "${formData.deploymentId || "<deployment-id>"}",
    "launchUrl": "${formData.launchUrl || "<launch-url>"}",
    "jwksUrl": "${formData.jwksUrl || "<jwks-url>"}"
  }
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
            "bg-gradient-to-r from-orange-500 to-red-500 text-white",
            "hover:from-orange-600 hover:to-red-600 active:scale-95",
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
              Save LTI Configuration
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default LtiConfigForm;
