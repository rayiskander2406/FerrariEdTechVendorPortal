"use client";

import { useState, useCallback, type FormEvent } from "react";
import { z } from "zod";
import {
  Building2,
  User,
  Mail,
  Package,
  Database,
  Settings,
  Users,
  Shield,
  CheckCircle2,
  Loader2,
  AlertCircle,
  FileText,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type PodsLiteInput, DataElementEnum, IntegrationMethodEnum } from "@/lib/types";

// =============================================================================
// TYPES
// =============================================================================

interface PodsLiteFormProps {
  onSubmit: (data: PodsLiteInput) => Promise<void>;
  onCancel: () => void;
  prefill?: {
    vendorName?: string;
    contactEmail?: string;
  };
}

interface FormErrors {
  [key: string]: string | undefined;
}

// =============================================================================
// VALIDATION SCHEMA (Simplified for form)
// =============================================================================

const FormSchema = z.object({
  vendorName: z.string().min(2, "Company name must be at least 2 characters"),
  contactName: z.string().min(2, "Contact name is required"),
  contactEmail: z.string().email("Valid email is required"),
  contactPhone: z.string().optional(),
  applicationName: z.string().min(2, "Product name is required"),
  applicationDescription: z.string().min(10, "Please provide a brief description"),
  dataElementsRequested: z.array(z.string()).min(1, "Select at least one data element"),
  dataPurpose: z.string().min(10, "Please describe how data will be used"),
  dataRetentionDays: z.number().int().min(1).max(365),
  integrationMethod: z.enum(["ONEROSTER_API", "SFTP", "LTI_1_3", "MANUAL_UPLOAD"]),
  thirdPartySharing: z.boolean(),
  thirdPartyDetails: z.string().optional(),
  hasSOC2: z.boolean(),
  hasFERPACertification: z.boolean(),
  encryptsDataAtRest: z.boolean(),
  encryptsDataInTransit: z.boolean(),
  breachNotificationHours: z.number().int().min(1).max(72),
  coppaCompliant: z.boolean().refine((val) => val === true, "COPPA compliance is required"),
  acceptsTerms: z.boolean().refine((val) => val === true, "You must accept the terms"),
  acceptsDataDeletion: z.boolean().refine((val) => val === true, "You must agree to data deletion"),
  expectedStudentCount: z.number().int().min(1).optional(),
});

// =============================================================================
// DATA ELEMENT OPTIONS
// =============================================================================

const DATA_ELEMENTS = [
  { value: "STUDENT_ID", label: "Student ID (Tokenized)", description: "Unique identifier: TKN_STU_xxx" },
  { value: "FIRST_NAME", label: "First Name", description: "Actual first names preserved" },
  { value: "GRADE_LEVEL", label: "Grade Level", description: "K-12 grade designation" },
  { value: "SCHOOL_ID", label: "School", description: "School identifier: TKN_SCH_xxx" },
  { value: "CLASS_ROSTER", label: "Class Roster", description: "Class enrollments and sections" },
  { value: "TEACHER_ID", label: "Teacher ID (Tokenized)", description: "Teacher identifier: TKN_TCH_xxx" },
];

const INTEGRATION_METHODS = [
  { value: "ONEROSTER_API", label: "OneRoster API", description: "Standards-based rostering" },
  { value: "LTI_1_3", label: "LTI 1.3", description: "Schoology integration" },
  { value: "SFTP", label: "SFTP Transfer", description: "Batch file transfer" },
  { value: "MANUAL_UPLOAD", label: "Manual Upload", description: "CSV/Excel upload" },
];

const SECURITY_CERTIFICATIONS = [
  { value: "soc2", label: "SOC 2 Type II", key: "hasSOC2" as const },
  { value: "ferpa", label: "FERPA Certification", key: "hasFERPACertification" as const },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function PodsLiteForm({ onSubmit, onCancel, prefill }: PodsLiteFormProps) {
  // Form state
  const [formData, setFormData] = useState({
    vendorName: prefill?.vendorName ?? "",
    contactName: "",
    contactEmail: prefill?.contactEmail ?? "",
    contactPhone: "",
    applicationName: "",
    applicationDescription: "",
    dataElementsRequested: ["STUDENT_ID", "FIRST_NAME", "GRADE_LEVEL"] as string[],
    dataPurpose: "",
    dataRetentionDays: 365,
    integrationMethod: "ONEROSTER_API" as const,
    thirdPartySharing: false,
    thirdPartyDetails: "",
    hasSOC2: false,
    hasFERPACertification: false,
    encryptsDataAtRest: true,
    encryptsDataInTransit: true,
    breachNotificationHours: 24,
    coppaCompliant: false,
    acceptsTerms: false,
    acceptsDataDeletion: false,
    expectedStudentCount: undefined as number | undefined,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleInputChange = useCallback(
    (field: string, value: string | number | boolean | string[] | undefined) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      // Clear error when field is edited
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  const handleDataElementToggle = useCallback((element: string) => {
    setFormData((prev) => {
      const current = prev.dataElementsRequested;
      const updated = current.includes(element)
        ? current.filter((e) => e !== element)
        : [...current, element];
      return { ...prev, dataElementsRequested: updated };
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
        // Convert form data to PodsLiteInput
        const podsInput: PodsLiteInput = {
          vendorName: formData.vendorName,
          contactName: formData.contactName,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone || undefined,
          applicationName: formData.applicationName,
          applicationDescription: formData.applicationDescription,
          dataElementsRequested: formData.dataElementsRequested.map(
            (el) => DataElementEnum.parse(el)
          ),
          dataPurpose: formData.dataPurpose,
          dataRetentionDays: formData.dataRetentionDays,
          integrationMethod: IntegrationMethodEnum.parse(formData.integrationMethod),
          thirdPartySharing: formData.thirdPartySharing,
          thirdPartyDetails: formData.thirdPartyDetails || undefined,
          hasSOC2: formData.hasSOC2,
          hasFERPACertification: formData.hasFERPACertification,
          encryptsDataAtRest: formData.encryptsDataAtRest,
          encryptsDataInTransit: formData.encryptsDataInTransit,
          breachNotificationHours: formData.breachNotificationHours,
          coppaCompliant: formData.coppaCompliant,
          acceptsTerms: formData.acceptsTerms,
          acceptsDataDeletion: formData.acceptsDataDeletion,
        };

        await onSubmit(podsInput);
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : "Failed to submit application"
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, onSubmit]
  );

  // ==========================================================================
  // CHECK IF FORM IS VALID
  // ==========================================================================

  const isFormValid =
    formData.vendorName.length >= 2 &&
    formData.contactName.length >= 2 &&
    formData.contactEmail.includes("@") &&
    formData.applicationName.length >= 2 &&
    formData.applicationDescription.length >= 10 &&
    formData.dataElementsRequested.length >= 1 &&
    formData.dataPurpose.length >= 10 &&
    formData.coppaCompliant &&
    formData.acceptsTerms &&
    formData.acceptsDataDeletion;

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary to-secondary rounded-lg p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold">PoDS-Lite Application</h3>
            <p className="text-sm text-white/80">
              Streamlined 13-question privacy application for TOKEN_ONLY access
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            Instant approval
          </span>
          <span className="flex items-center gap-1">
            <Shield className="w-4 h-4" />
            Zero PII access
          </span>
        </div>
      </div>

      {/* Submit Error */}
      {submitError && (
        <div className="bg-error-50 border border-error-200 rounded-lg p-3 flex items-center gap-2 text-error-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{submitError}</span>
        </div>
      )}

      {/* Company Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex items-center gap-2 text-gray-700 font-medium">
          <Building2 className="w-5 h-5 text-primary" />
          <span>Company Information</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name *
            </label>
            <input
              type="text"
              value={formData.vendorName}
              onChange={(e) => handleInputChange("vendorName", e.target.value)}
              placeholder="Acme EdTech Inc."
              className={cn(
                "w-full px-3 py-2 border rounded-lg text-sm",
                "focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary",
                errors.vendorName ? "border-error-300 bg-error-50" : "border-gray-300"
              )}
            />
            {errors.vendorName && (
              <p className="text-xs text-error-600 mt-1">{errors.vendorName}</p>
            )}
          </div>

          {/* Contact Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Primary Contact *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) => handleInputChange("contactName", e.target.value)}
                placeholder="John Smith"
                className={cn(
                  "w-full pl-9 pr-3 py-2 border rounded-lg text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary",
                  errors.contactName ? "border-error-300 bg-error-50" : "border-gray-300"
                )}
              />
            </div>
            {errors.contactName && (
              <p className="text-xs text-error-600 mt-1">{errors.contactName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                placeholder="contact@company.com"
                className={cn(
                  "w-full pl-9 pr-3 py-2 border rounded-lg text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary",
                  errors.contactEmail ? "border-error-300 bg-error-50" : "border-gray-300"
                )}
              />
            </div>
            {errors.contactEmail && (
              <p className="text-xs text-error-600 mt-1">{errors.contactEmail}</p>
            )}
          </div>
        </div>

        {/* Product Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product/Application Name *
          </label>
          <div className="relative">
            <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={formData.applicationName}
              onChange={(e) => handleInputChange("applicationName", e.target.value)}
              placeholder="My Learning Platform"
              className={cn(
                "w-full pl-9 pr-3 py-2 border rounded-lg text-sm",
                "focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary",
                errors.applicationName ? "border-error-300 bg-error-50" : "border-gray-300"
              )}
            />
          </div>
          {errors.applicationName && (
            <p className="text-xs text-error-600 mt-1">{errors.applicationName}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Brief Description *
          </label>
          <textarea
            value={formData.applicationDescription}
            onChange={(e) => handleInputChange("applicationDescription", e.target.value)}
            placeholder="Describe what your application does and how it will be used by LAUSD students..."
            rows={2}
            className={cn(
              "w-full px-3 py-2 border rounded-lg text-sm resize-none",
              "focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary",
              errors.applicationDescription ? "border-error-300 bg-error-50" : "border-gray-300"
            )}
          />
          {errors.applicationDescription && (
            <p className="text-xs text-error-600 mt-1">{errors.applicationDescription}</p>
          )}
        </div>
      </div>

      {/* Data Elements */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex items-center gap-2 text-gray-700 font-medium">
          <Database className="w-5 h-5 text-primary" />
          <span>Data Elements Requested</span>
        </div>
        <p className="text-sm text-gray-500">
          Select the data elements your application needs. All identifiers are tokenized for privacy.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {DATA_ELEMENTS.map((element) => (
            <label
              key={element.value}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                formData.dataElementsRequested.includes(element.value)
                  ? "border-primary bg-primary-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <input
                type="checkbox"
                checked={formData.dataElementsRequested.includes(element.value)}
                onChange={() => handleDataElementToggle(element.value)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">{element.label}</span>
                <p className="text-xs text-gray-500">{element.description}</p>
              </div>
            </label>
          ))}
        </div>
        {errors.dataElementsRequested && (
          <p className="text-xs text-error-600">{errors.dataElementsRequested}</p>
        )}

        {/* Data Purpose */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            How will this data be used? *
          </label>
          <textarea
            value={formData.dataPurpose}
            onChange={(e) => handleInputChange("dataPurpose", e.target.value)}
            placeholder="Explain how your application will use the requested data..."
            rows={2}
            className={cn(
              "w-full px-3 py-2 border rounded-lg text-sm resize-none",
              "focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary",
              errors.dataPurpose ? "border-error-300 bg-error-50" : "border-gray-300"
            )}
          />
          {errors.dataPurpose && (
            <p className="text-xs text-error-600 mt-1">{errors.dataPurpose}</p>
          )}
        </div>
      </div>

      {/* Integration Methods */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex items-center gap-2 text-gray-700 font-medium">
          <Settings className="w-5 h-5 text-primary" />
          <span>Integration Method</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {INTEGRATION_METHODS.map((method) => (
            <label
              key={method.value}
              className={cn(
                "flex flex-col items-center p-3 rounded-lg border cursor-pointer transition-colors text-center",
                formData.integrationMethod === method.value
                  ? "border-primary bg-primary-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <input
                type="radio"
                name="integrationMethod"
                value={method.value}
                checked={formData.integrationMethod === method.value}
                onChange={(e) => handleInputChange("integrationMethod", e.target.value)}
                className="sr-only"
              />
              <span className="text-sm font-medium text-gray-700">{method.label}</span>
              <span className="text-xs text-gray-500">{method.description}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Security & Compliance */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex items-center gap-2 text-gray-700 font-medium">
          <Shield className="w-5 h-5 text-primary" />
          <span>Security & Compliance</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Expected Students */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expected Student Count
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={formData.expectedStudentCount ?? ""}
                onChange={(e) =>
                  handleInputChange(
                    "expectedStudentCount",
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                placeholder="e.g., 10000"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary"
              />
            </div>
          </div>

          {/* Data Retention */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Retention Period (days)
            </label>
            <input
              type="number"
              value={formData.dataRetentionDays}
              onChange={(e) =>
                handleInputChange("dataRetentionDays", parseInt(e.target.value) || 365)
              }
              min={1}
              max={365}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary"
            />
          </div>
        </div>

        {/* Certifications */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Security Certifications
          </label>
          <div className="flex flex-wrap gap-3">
            {SECURITY_CERTIFICATIONS.map((cert) => (
              <label
                key={cert.value}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors",
                  formData[cert.key]
                    ? "border-success bg-success-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <input
                  type="checkbox"
                  checked={formData[cert.key]}
                  onChange={(e) => handleInputChange(cert.key, e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-success focus:ring-success"
                />
                <span className="text-sm text-gray-700">{cert.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Encryption */}
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.encryptsDataAtRest}
              onChange={(e) => handleInputChange("encryptsDataAtRest", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-gray-700">Encrypts data at rest</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.encryptsDataInTransit}
              onChange={(e) => handleInputChange("encryptsDataInTransit", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-gray-700">Encrypts data in transit</span>
          </label>
        </div>
      </div>

      {/* Compliance Acknowledgments */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex items-center gap-2 text-gray-700 font-medium">
          <CheckCircle2 className="w-5 h-5 text-success" />
          <span>Compliance Acknowledgments</span>
        </div>

        <div className="space-y-3">
          {/* COPPA */}
          <label
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
              formData.coppaCompliant
                ? "border-success bg-white"
                : "border-gray-200 bg-white"
            )}
          >
            <input
              type="checkbox"
              checked={formData.coppaCompliant}
              onChange={(e) => handleInputChange("coppaCompliant", e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-success focus:ring-success"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">
                COPPA Compliance *
              </span>
              <p className="text-xs text-gray-500">
                I certify that our application complies with the Children&apos;s Online
                Privacy Protection Act (COPPA).
              </p>
            </div>
          </label>
          {errors.coppaCompliant && (
            <p className="text-xs text-error-600 ml-7">{errors.coppaCompliant}</p>
          )}

          {/* Data Deletion */}
          <label
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
              formData.acceptsDataDeletion
                ? "border-success bg-white"
                : "border-gray-200 bg-white"
            )}
          >
            <input
              type="checkbox"
              checked={formData.acceptsDataDeletion}
              onChange={(e) => handleInputChange("acceptsDataDeletion", e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-success focus:ring-success"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">
                Data Deletion Agreement *
              </span>
              <p className="text-xs text-gray-500">
                I agree to delete all LAUSD student data within 30 days of contract
                termination or upon request.
              </p>
            </div>
          </label>
          {errors.acceptsDataDeletion && (
            <p className="text-xs text-error-600 ml-7">{errors.acceptsDataDeletion}</p>
          )}

          {/* Terms */}
          <label
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
              formData.acceptsTerms
                ? "border-success bg-white"
                : "border-gray-200 bg-white"
            )}
          >
            <input
              type="checkbox"
              checked={formData.acceptsTerms}
              onChange={(e) => handleInputChange("acceptsTerms", e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-success focus:ring-success"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">
                Terms & Conditions *
              </span>
              <p className="text-xs text-gray-500">
                I have read and agree to the{" "}
                <a
                  href="https://achieve.lausd.net/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  LAUSD Student Data Privacy Policy
                  <ExternalLink className="w-3 h-3" />
                </a>{" "}
                and{" "}
                <a
                  href="https://achieve.lausd.net/vendor-terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  Vendor Terms of Service
                  <ExternalLink className="w-3 h-3" />
                </a>
                .
              </p>
            </div>
          </label>
          {errors.acceptsTerms && (
            <p className="text-xs text-error-600 ml-7">{errors.acceptsTerms}</p>
          )}
        </div>
      </div>

      {/* Token-Only Notice */}
      <div className="bg-success-50 border border-success-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-success-800">TOKEN_ONLY Access Tier</h4>
            <p className="text-sm text-success-700 mt-1">
              Based on your selections, your application qualifies for TOKEN_ONLY access,
              which means you&apos;ll receive tokenized identifiers with zero actual PII.
              This tier is eligible for <strong>instant approval</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Validation Summary - shown when form is incomplete */}
      {!isFormValid && (
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
          <p className="text-sm text-warning-700 font-medium mb-2">Please complete all required fields:</p>
          <ul className="text-xs text-warning-600 space-y-1 list-disc list-inside">
            {formData.vendorName.length < 2 && <li>Company name (min 2 characters)</li>}
            {formData.contactName.length < 2 && <li>Primary contact name (min 2 characters)</li>}
            {!formData.contactEmail.includes("@") && <li>Valid email address</li>}
            {formData.applicationName.length < 2 && <li>Product/application name (min 2 characters)</li>}
            {formData.applicationDescription.length < 10 && <li>Brief description (min 10 characters)</li>}
            {formData.dataElementsRequested.length < 1 && <li>At least one data element</li>}
            {formData.dataPurpose.length < 10 && <li>Data usage purpose (min 10 characters)</li>}
            {!formData.coppaCompliant && <li>COPPA compliance acknowledgment</li>}
            {!formData.acceptsTerms && <li>Terms & conditions acceptance</li>}
            {!formData.acceptsDataDeletion && <li>Data deletion agreement</li>}
          </ul>
        </div>
      )}

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
            "bg-primary text-white",
            "hover:bg-primary-700 active:scale-95",
            "disabled:bg-gray-300 disabled:cursor-not-allowed",
            "transition-all duration-200"
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Submit Application
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default PodsLiteForm;
