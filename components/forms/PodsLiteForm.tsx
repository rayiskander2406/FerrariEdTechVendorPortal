"use client";

import React, { useState, useCallback, useMemo, useId, useRef, useEffect, type FormEvent, type ChangeEvent, type KeyboardEvent, type ClipboardEvent } from "react";
import { z } from "zod";
import {
  Mail,
  MapPin,
  Database,
  Settings,
  Users,
  Shield,
  CheckCircle2,
  Loader2,
  AlertCircle,
  FileText,
  ExternalLink,
  Send,
  Key,
  Copy,
  Check,
  RefreshCw,
  FileCheck,
  Play,
  ArrowRight,
  Eye,
  EyeOff,
  Globe,
  Linkedin,
  Lock,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type PodsLiteInput,
  type VendorCredentialsSet,
  DataElementEnum,
  IntegrationMethodEnum
} from "@/lib/types";
import { quickVerificationCheck } from "@/lib/verification";
import { SchemaFormSection } from "./SchemaFormSection";
import { PodsLiteSchema, generateFormConfig } from "@/lib/schemas";
import { dataElementsToEndpoints, DEFAULT_ONEROSTER_ENDPOINTS } from "@/lib/config/oneroster";

// =============================================================================
// TYPES
// =============================================================================

type FormStep = "form" | "verification" | "submitted" | "credentials";

interface PodsLiteFormProps {
  onSubmit: (data: PodsLiteInput) => Promise<void>;
  onCancel: () => void;
  onTestApi?: () => void; // Optional callback to open API tester after credentials
  prefill?: {
    vendorName?: string;
    contactEmail?: string;
  };
}

interface FormErrors {
  [key: string]: string | undefined;
}

// Use VendorCredentialsSet from lib/types for the new multi-integration system

// =============================================================================
// DEMO DATA - Mutates each time for fresh demos
// =============================================================================

function generateDemoData() {
  const demoCompanies = [
    { name: "MathGenius Learning", product: "MathGenius Student Portal", contact: "Sarah Chen", domain: "mathgeniuslearning.com" },
    { name: "ReadWell Education", product: "ReadWell K-8 Platform", contact: "Michael Torres", domain: "readwelleducation.com" },
    { name: "ScienceQuest Labs", product: "Virtual Lab Explorer", contact: "Emily Rodriguez", domain: "sciencequestlabs.com" },
    { name: "CodeKids Academy", product: "Junior Developer Studio", contact: "David Kim", domain: "codekidsacademy.com" },
    { name: "ArtSpark Creative", product: "Digital Art Classroom", contact: "Jessica Williams", domain: "artsparkcreative.com" },
    { name: "MusicMaster EdTech", product: "Interactive Music Learning", contact: "Alex Johnson", domain: "musicmasteredtech.com" },
    { name: "LanguageBridge", product: "ESL Learning Platform", contact: "Maria Garcia", domain: "languagebridge.io" },
    { name: "HistoryVR Studios", product: "Immersive History Tours", contact: "James Brown", domain: "historyvrstudios.com" },
  ];

  const randomIndex = Math.floor(Math.random() * demoCompanies.length);
  const company = demoCompanies[randomIndex];
  const domain = company?.domain ?? "demo-edtech.com";
  const companySlug = domain.split(".")[0] ?? "demo";

  const streets = ["Innovation Dr", "Tech Park Blvd", "Education Way", "Learning Lane", "Academy Ave"];
  const cities = ["San Francisco", "Los Angeles", "San Diego", "Palo Alto", "Irvine"];
  const streetNum = 100 + Math.floor(Math.random() * 9900);
  const suite = 100 + Math.floor(Math.random() * 900);
  const zip = 90000 + Math.floor(Math.random() * 9999);

  return {
    vendorName: company?.name ?? "Demo EdTech Inc",
    contactName: company?.contact ?? "Demo Contact",
    contactEmail: `${(company?.contact ?? "demo").toLowerCase().replace(" ", ".")}@${domain}`,
    contactPhone: `(${310 + Math.floor(Math.random() * 90)}) ${100 + Math.floor(Math.random() * 899)}-${1000 + Math.floor(Math.random() * 8999)}`,
    // Verification fields
    websiteUrl: `https://www.${domain}`,
    linkedInUrl: `https://www.linkedin.com/company/${companySlug}`,
    // Product
    applicationName: company?.product ?? "Demo Learning Platform",
    applicationDescription: `${company?.product ?? "Our platform"} helps LAUSD students improve their learning outcomes through personalized instruction and real-time progress tracking.`,
    dataPurpose: "We use student data to personalize learning paths, track progress, and provide teachers with actionable insights to support student success.",
    street: `${streetNum} ${streets[Math.floor(Math.random() * streets.length)]}`,
    suite: `Suite ${suite}`,
    city: cities[Math.floor(Math.random() * cities.length)] ?? "Los Angeles",
    state: "CA",
    zipCode: zip.toString(),
  };
}

// =============================================================================
// VALIDATION SCHEMA (Extended with address)
// =============================================================================

const FormSchema = z.object({
  vendorName: z.string().min(2, "Company name must be at least 2 characters"),
  contactName: z.string().min(2, "Contact name is required"),
  contactEmail: z.string().email("Valid email is required"),
  contactPhone: z.string().min(10, "Valid phone number is required"),
  // Verification fields
  websiteUrl: z.string().url("Valid website URL is required"),
  linkedInUrl: z.string().url("Valid LinkedIn URL is required").optional().or(z.literal("")),
  // Address fields
  street: z.string().min(5, "Street address is required"),
  suite: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().length(2, "State must be 2 letters"),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Valid ZIP code required"),
  // Product fields
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
  { value: "USERS", label: "Users", description: "Students & Teachers (tokenized IDs)" },
  { value: "CLASSES", label: "Classes", description: "Course sections & schedules" },
  { value: "COURSES", label: "Courses", description: "Curriculum & subject definitions" },
  { value: "ENROLLMENTS", label: "Enrollments", description: "Student & Teacher class assignments" },
  { value: "ORGS", label: "Organizations", description: "Schools & district info" },
  { value: "ACADEMIC_SESSIONS", label: "Academic Sessions", description: "Terms, semesters & grading periods" },
  { value: "DEMOGRAPHICS", label: "Demographics", description: "Student demographic data (requires Selective tier)", restricted: true },
];

// =============================================================================
// SCHEMA-DRIVEN FORM CONFIG (Step A: schema-first migration)
// =============================================================================

const SCHEMA_FORM_CONFIG = generateFormConfig(PodsLiteSchema);
const COMPANY_SECTION = SCHEMA_FORM_CONFIG.sections.find(s => s.id === "company")!;
const CONTACT_SECTION = SCHEMA_FORM_CONFIG.sections.find(s => s.id === "contact")!;
// Compliance section available in SCHEMA_FORM_CONFIG.sections for future use

const INTEGRATION_METHODS = [
  {
    value: "ONEROSTER_API",
    label: "OneRoster API",
    description: "Real-time rostering via REST API",
    icon: "Database",
  },
  {
    value: "LTI_1_3",
    label: "LTI 1.3",
    description: "Tool launch with context",
    icon: "ExternalLink",
  },
  {
    value: "SSO_SAML",
    label: "SSO (SAML)",
    description: "Single sign-on via SAML 2.0",
    icon: "Key",
  },
  {
    value: "SSO_OIDC",
    label: "SSO (OIDC)",
    description: "Single sign-on via OpenID Connect",
    icon: "Key",
  },
  {
    value: "SFTP",
    label: "SFTP/CSV",
    description: "Batch file transfer",
    icon: "FileText",
  },
];

// LTI 1.3 context options
const LTI_CONTEXT_OPTIONS = [
  { value: "USER_IDENTITY", label: "User Identity", description: "Tokenized user ID & role" },
  { value: "COURSE_CONTEXT", label: "Course Context", description: "Class/course information" },
  { value: "MEMBERSHIP", label: "Membership", description: "Names & Roles Provisioning" },
  { value: "DEEP_LINKING", label: "Deep Linking", description: "Content item selection" },
  { value: "ASSIGNMENT_GRADES", label: "Assignment & Grades", description: "Grade passback service" },
];

// SSO attribute options
const SSO_ATTRIBUTES = [
  { value: "USER_ID", label: "User ID", description: "Tokenized unique identifier" },
  { value: "EMAIL", label: "Email", description: "User email address (if permitted)" },
  { value: "DISPLAY_NAME", label: "Display Name", description: "First name or display name" },
  { value: "ROLE", label: "Role", description: "Student, Teacher, Admin" },
  { value: "ORG", label: "Organization", description: "School or district" },
  { value: "GRADE_LEVEL", label: "Grade Level", description: "Student grade level" },
];

const SECURITY_CERTIFICATIONS = [
  { value: "soc2", label: "SOC 2 Type II", key: "hasSOC2" as const },
  { value: "ferpa", label: "FERPA Certification", key: "hasFERPACertification" as const },
];

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

// Generate demo verification code (for demo, the code is always shown)
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper to generate random hex strings
function randomHex(length: number): string {
  return Array.from({ length }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]).join("");
}

// Generate a mock SAML certificate (for demo purposes)
function generateMockSamlCertificate(): string {
  return `-----BEGIN CERTIFICATE-----
MIICpDCCAYwCCQDU+pQ4P2cJ7jANBgkqhkiG9w0BAQsFADAUMRIwEAYDVQQDDAls
b2NhbGhvc3QwHhcNMjQwMTAxMDAwMDAwWhcNMjUwMTAxMDAwMDAwWjAUMRIwEAYD
VQQDDAlsb2NhbGhvc3QwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC7
... (truncated for demo) ...
-----END CERTIFICATE-----`;
}

// Comprehensive credential generator for all integration types
function generateVendorCredentials(
  vendorName: string,
  selectedIntegrations: string[],
  formData: {
    dataElementsRequested: string[];
    ltiContextOptions: string[];
    ssoAttributes: string[];
  }
): VendorCredentialsSet {
  const vendorSlug = vendorName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 20);
  const vendorId = `VND_${randomHex(8).toUpperCase()}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days

  const credentials: VendorCredentialsSet = {
    vendorId,
    vendorName,
    accessTier: "PRIVACY_SAFE",
    environment: "sandbox",
    createdAt: now,
    expiresAt,
  };

  // OneRoster API credentials
  if (selectedIntegrations.includes("ONEROSTER_API")) {
    // Convert form data elements (USERS, CLASSES, etc.) to OneRoster endpoints (/users, /classes, etc.)
    const mappedEndpoints = dataElementsToEndpoints(formData.dataElementsRequested);
    const endpoints = mappedEndpoints ?? [...DEFAULT_ONEROSTER_ENDPOINTS];

    credentials.oneRoster = {
      apiKey: `sbox_test_${randomHex(24)}`,
      apiSecret: `sk_secret_${randomHex(32)}`,
      baseUrl: "https://sandbox.lausd-data.schoolday.com/ims/oneroster/v1p2",
      vendorId,
      accessTier: "PRIVACY_SAFE",
      rateLimitPerMinute: 60,
      allowedEndpoints: endpoints,
      selectedResources: formData.dataElementsRequested,
    };
  }

  // LTI 1.3 credentials
  if (selectedIntegrations.includes("LTI_1_3")) {
    credentials.lti13 = {
      clientId: `lti_${vendorSlug}_${randomHex(8)}`,
      deploymentId: `deploy_${randomHex(8)}`,
      platformId: "https://sandbox.lausd.com",
      authorizationUrl: "https://sandbox.lausd.com/lti/auth",
      tokenUrl: "https://sandbox.lausd.com/lti/token",
      jwksUrl: "https://sandbox.lausd.com/.well-known/jwks.json",
      toolLaunchUrl: `https://${vendorSlug}.example.com/lti/launch`,
      deepLinkingUrl: `https://${vendorSlug}.example.com/lti/deeplink`,
      selectedServices: formData.ltiContextOptions,
    };
  }

  // SSO SAML credentials
  if (selectedIntegrations.includes("SSO_SAML")) {
    const attributeMappings: Record<string, string> = {};
    formData.ssoAttributes.forEach(attr => {
      const samlAttr = attr.toLowerCase().replace("_", "");
      attributeMappings[attr] = `urn:oid:${samlAttr}`;
    });

    credentials.saml = {
      idpEntityId: "https://idp.sandbox.lausd.com",
      idpSsoUrl: "https://idp.sandbox.lausd.com/saml/sso",
      idpSloUrl: "https://idp.sandbox.lausd.com/saml/slo",
      idpCertificate: generateMockSamlCertificate(),
      idpMetadataUrl: "https://idp.sandbox.lausd.com/saml/metadata",
      spEntityId: `https://${vendorSlug}.example.com/saml/metadata`,
      spAcsUrl: `https://${vendorSlug}.example.com/saml/acs`,
      nameIdFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
      selectedAttributes: formData.ssoAttributes,
      attributeMappings,
    };
  }

  // SSO OIDC credentials
  if (selectedIntegrations.includes("SSO_OIDC")) {
    const claimMappings: Record<string, string> = {};
    formData.ssoAttributes.forEach(attr => {
      const oidcClaim = attr.toLowerCase().replace("_", "");
      claimMappings[attr] = oidcClaim === "userid" ? "sub" : oidcClaim;
    });

    credentials.oidc = {
      clientId: `oidc_${vendorSlug}_${randomHex(8)}`,
      clientSecret: `oidc_secret_${randomHex(32)}`,
      issuer: "https://idp.sandbox.lausd.com",
      authorizationEndpoint: "https://idp.sandbox.lausd.com/oauth/authorize",
      tokenEndpoint: "https://idp.sandbox.lausd.com/oauth/token",
      userinfoEndpoint: "https://idp.sandbox.lausd.com/oauth/userinfo",
      jwksUrl: "https://idp.sandbox.lausd.com/.well-known/jwks.json",
      redirectUri: `https://${vendorSlug}.example.com/oauth/callback`,
      scopes: ["openid", "profile", "email"],
      selectedClaims: formData.ssoAttributes,
      claimMappings,
    };
  }

  // SFTP credentials
  if (selectedIntegrations.includes("SFTP")) {
    credentials.sftp = {
      host: "sftp.sandbox.lausd.com",
      port: 22,
      username: `sftp_${vendorSlug}`,
      privateKey: "-----BEGIN OPENSSH PRIVATE KEY-----\n... (generated on approval) ...\n-----END OPENSSH PRIVATE KEY-----",
      remoteDirectory: `/incoming/${vendorSlug}`,
      fileNamePattern: "roster_{date}.csv",
      deliverySchedule: "DAILY",
      csvDelimiter: ",",
      csvEncoding: "UTF-8",
      includeHeader: true,
    };
  }

  return credentials;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function PodsLiteForm({ onSubmit, onCancel, onTestApi, prefill }: PodsLiteFormProps) {
  // Generate demo data once on mount using useMemo
  const demoData = useMemo(() => generateDemoData(), []);
  const formId = useId();

  // Multi-step form state
  const [step, setStep] = useState<FormStep>("form");
  const [verificationCode, setVerificationCode] = useState(() => generateVerificationCode());
  const [codeInputs, setCodeInputs] = useState<string[]>(["", "", "", "", "", ""]);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [credentials, setCredentials] = useState<VendorCredentialsSet | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [revealedFields, setRevealedFields] = useState<Set<string>>(new Set());
  const [applicationNumber] = useState(() => `PODS-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Form state - vendor name starts blank, other fields use demo data
  // NOTE: If prefill is provided (from AI tool), it will be applied via useEffect
  const [formData, setFormData] = useState({
    vendorName: prefill?.vendorName ?? "",  // Start blank, user types their company name
    contactName: demoData.contactName,
    contactEmail: prefill?.contactEmail ?? demoData.contactEmail,
    contactPhone: demoData.contactPhone,
    // Verification fields
    websiteUrl: demoData.websiteUrl,
    linkedInUrl: demoData.linkedInUrl,
    // Address
    street: demoData.street,
    suite: demoData.suite,
    city: demoData.city,
    state: demoData.state,
    zipCode: demoData.zipCode,
    // Product
    applicationName: demoData.applicationName,
    applicationDescription: demoData.applicationDescription,
    // Integration methods (multi-select)
    integrationMethods: ["ONEROSTER_API"] as string[],
    // OneRoster-specific
    dataElementsRequested: ["USERS", "CLASSES", "ENROLLMENTS"] as string[],
    // LTI-specific
    ltiContextOptions: ["USER_IDENTITY", "COURSE_CONTEXT"] as string[],
    // SSO-specific
    ssoAttributes: ["USER_ID", "ROLE"] as string[],
    // Common fields
    dataPurpose: demoData.dataPurpose,
    dataRetentionDays: 365,
    integrationMethod: "ONEROSTER_API" as const, // Keep for backwards compatibility
    thirdPartySharing: false,
    thirdPartyDetails: "",
    hasSOC2: true,
    hasFERPACertification: true,
    encryptsDataAtRest: true,
    encryptsDataInTransit: true,
    breachNotificationHours: 24,
    coppaCompliant: true,
    acceptsTerms: true,
    acceptsDataDeletion: true,
    expectedStudentCount: 5000 + Math.floor(Math.random() * 45000),
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ==========================================================================
  // FIX-003: Sync prefill prop changes after mount
  // useState only uses initial value on first render. If prefill arrives
  // asynchronously (from AI tool result), we need useEffect to update.
  // ==========================================================================
  useEffect(() => {
    if (prefill?.vendorName && prefill.vendorName !== formData.vendorName) {
      setFormData(prev => ({ ...prev, vendorName: prefill.vendorName! }));
    }
    if (prefill?.contactEmail && prefill.contactEmail !== formData.contactEmail) {
      setFormData(prev => ({ ...prev, contactEmail: prefill.contactEmail! }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill?.vendorName, prefill?.contactEmail]);

  // Track which integration tab is active in credentials view
  // Will be updated when credentials are generated to match first available tab
  const [activeCredentialTab, setActiveCredentialTab] = useState<string>("");

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleInputChange = useCallback(
    (field: string, value: unknown) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      // Clear error when field is edited
      setErrors((prev) => {
        if (prev[field]) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [field]: _removed, ...rest } = prev;
          return rest;
        }
        return prev;
      });
    },
    []
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

  const handleIntegrationMethodToggle = useCallback((method: string) => {
    setFormData((prev) => {
      const current = prev.integrationMethods;
      const updated = current.includes(method)
        ? current.filter((m) => m !== method)
        : [...current, method];
      return { ...prev, integrationMethods: updated };
    });
  }, []);

  const handleLtiContextToggle = useCallback((option: string) => {
    setFormData((prev) => {
      const current = prev.ltiContextOptions;
      const updated = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      return { ...prev, ltiContextOptions: updated };
    });
  }, []);

  const handleSsoAttributeToggle = useCallback((attr: string) => {
    setFormData((prev) => {
      const current = prev.ssoAttributes;
      const updated = current.includes(attr)
        ? current.filter((a) => a !== attr)
        : [...current, attr];
      return { ...prev, ssoAttributes: updated };
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

      // Simulate brief processing time
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setIsSubmitting(false);
      // Transition to verification step
      setStep("verification");
      // Focus first code input after render
      setTimeout(() => codeInputRefs.current[0]?.focus(), 100);
    },
    [formData]
  );

  // Handle verification code input
  const handleCodeChange = useCallback(
    (index: number, value: string) => {
      // Only allow digits
      const digit = value.replace(/\D/g, "").slice(-1);

      setCodeInputs((prev) => {
        const newInputs = [...prev];
        newInputs[index] = digit;
        return newInputs;
      });
      setCodeError(null);

      // Auto-advance to next input
      if (digit && index < 5) {
        codeInputRefs.current[index + 1]?.focus();
      }
    },
    []
  );

  // Handle backspace in code input
  const handleCodeKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !codeInputs[index] && index > 0) {
        codeInputRefs.current[index - 1]?.focus();
      }
    },
    [codeInputs]
  );

  // Handle paste in code input
  const handleCodePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
      if (pastedData.length > 0) {
        const newInputs = [...codeInputs];
        for (let i = 0; i < pastedData.length && i < 6; i++) {
          newInputs[i] = pastedData[i] ?? "";
        }
        setCodeInputs(newInputs);
        setCodeError(null);
        // Focus the input after the last filled digit
        const focusIndex = Math.min(pastedData.length, 5);
        codeInputRefs.current[focusIndex]?.focus();
      }
    },
    [codeInputs]
  );

  // Verify the code
  const handleVerifyCode = useCallback(async () => {
    const enteredCode = codeInputs.join("");
    if (enteredCode.length !== 6) {
      setCodeError("Please enter all 6 digits");
      return;
    }

    setIsVerifying(true);
    // Simulate verification delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (enteredCode === verificationCode) {
      // Go to submitted step (ask if they want sandbox)
      setStep("submitted");

      // Call the original onSubmit for any backend processing
      try {
        const podsInput: PodsLiteInput = {
          vendorName: formData.vendorName,
          contactName: formData.contactName,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone || undefined,
          // Verification fields
          websiteUrl: formData.websiteUrl || undefined,
          linkedInUrl: formData.linkedInUrl || undefined,
          // Product
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
      } catch (err) {
        // Log error for debugging but don't block user flow
        console.error("[PodsLiteForm] onSubmit failed:", err);
      }
    } else {
      setCodeError("Invalid verification code. Please try again.");
    }
    setIsVerifying(false);
  }, [codeInputs, verificationCode, formData, onSubmit]);

  // Handle "Yes, test sandbox" click
  const handleTestSandbox = useCallback(() => {
    const newCredentials = generateVendorCredentials(
      formData.vendorName,
      formData.integrationMethods,
      {
        dataElementsRequested: formData.dataElementsRequested,
        ltiContextOptions: formData.ltiContextOptions,
        ssoAttributes: formData.ssoAttributes,
      }
    );
    setCredentials(newCredentials);

    // Set initial tab to the first available integration type
    if (newCredentials.oneRoster) {
      setActiveCredentialTab("oneRoster");
    } else if (newCredentials.lti13) {
      setActiveCredentialTab("lti13");
    } else if (newCredentials.saml) {
      setActiveCredentialTab("saml");
    } else if (newCredentials.oidc) {
      setActiveCredentialTab("oidc");
    } else if (newCredentials.sftp) {
      setActiveCredentialTab("sftp");
    }

    setStep("credentials");
  }, [formData.vendorName, formData.integrationMethods, formData.dataElementsRequested, formData.ltiContextOptions, formData.ssoAttributes]);

  // Resend verification code
  const handleResendCode = useCallback(() => {
    setVerificationCode(generateVerificationCode());
    setCodeInputs(["", "", "", "", "", ""]);
    setCodeError(null);
    codeInputRefs.current[0]?.focus();
  }, []);

  // Copy credential to clipboard
  const handleCopyCredential = useCallback(async (field: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = value;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  }, []);

  // Toggle field visibility
  const toggleFieldReveal = useCallback((field: string) => {
    setRevealedFields((prev) => {
      const next = new Set(prev);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
      }
      return next;
    });
  }, []);

  // Mask a sensitive value
  const maskValue = useCallback(() => {
    return "••••••••••••••••••••••••";
  }, []);

  // ==========================================================================
  // CHECK IF FORM IS VALID
  // ==========================================================================

  // Check if at least one integration method is selected
  const hasOneRoster = formData.integrationMethods.includes("ONEROSTER_API");
  const hasLti = formData.integrationMethods.includes("LTI_1_3");
  const hasSso = formData.integrationMethods.includes("SSO_SAML") || formData.integrationMethods.includes("SSO_OIDC");
  const hasSftp = formData.integrationMethods.includes("SFTP");

  // Real-time verification status
  const verificationStatus = useMemo(() => {
    if (!formData.contactEmail.includes("@") || !formData.websiteUrl.startsWith("http")) {
      return null;
    }
    return quickVerificationCheck(formData.contactEmail, formData.websiteUrl);
  }, [formData.contactEmail, formData.websiteUrl]);

  // Check if website URL is valid
  const isValidWebsiteUrl = useMemo(() => {
    try {
      new URL(formData.websiteUrl);
      return formData.websiteUrl.startsWith("https://");
    } catch {
      return false;
    }
  }, [formData.websiteUrl]);

  // Check if LinkedIn URL is valid (optional)
  const isValidLinkedInUrl = useMemo(() => {
    if (!formData.linkedInUrl) return true; // Optional field
    try {
      const url = new URL(formData.linkedInUrl);
      return url.hostname.includes("linkedin.com");
    } catch {
      return false;
    }
  }, [formData.linkedInUrl]);

  const isFormValid =
    formData.vendorName.length >= 2 &&
    formData.contactName.length >= 2 &&
    formData.contactEmail.includes("@") &&
    formData.contactPhone.length >= 10 &&
    isValidWebsiteUrl &&
    isValidLinkedInUrl &&
    formData.street.length >= 5 &&
    formData.city.length >= 2 &&
    formData.state.length === 2 &&
    /^\d{5}(-\d{4})?$/.test(formData.zipCode) &&
    formData.applicationName.length >= 2 &&
    formData.applicationDescription.length >= 10 &&
    formData.integrationMethods.length >= 1 &&
    // Conditional validation based on selected integrations
    (!hasOneRoster || formData.dataElementsRequested.length >= 1) &&
    (!hasLti || formData.ltiContextOptions.length >= 1) &&
    (!hasSso || formData.ssoAttributes.length >= 1) &&
    formData.dataPurpose.length >= 10 &&
    formData.coppaCompliant &&
    formData.acceptsTerms &&
    formData.acceptsDataDeletion;

  // ==========================================================================
  // RENDER - Verification Step
  // ==========================================================================

  if (step === "verification") {
    return (
      <div className="space-y-6 opacity-100" style={{ contain: "layout" }}>
        {/* Email Sent Banner */}
        <div className="bg-gradient-to-r from-primary to-secondary rounded-lg p-6 text-white text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-white/20 rounded-full">
              <Send className="w-8 h-8" />
            </div>
          </div>
          <h3 className="text-xl font-semibold mb-2">Verification Email Sent!</h3>
          <p className="text-white/90">
            We&apos;ve sent a 6-digit verification code to
          </p>
          <p className="font-medium mt-1">{formData.contactEmail}</p>
        </div>

        {/* Demo Code Display (for demo purposes) */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Demo Mode</p>
              <p className="text-sm text-amber-700 mt-1">
                For demo purposes, your verification code is: <span className="font-mono font-bold text-lg">{verificationCode}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Code Entry */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-lg font-medium text-gray-800 text-center mb-4">
            Enter Verification Code
          </h4>

          {/* 6-Digit Input */}
          <div className="flex justify-center gap-3 mb-4">
            {codeInputs.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { codeInputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => handleCodeKeyDown(index, e)}
                onPaste={handleCodePaste}
                className={cn(
                  "w-12 h-14 text-center text-2xl font-semibold border-2 rounded-lg",
                  "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-200",
                  "transition-all duration-200",
                  digit ? "border-primary bg-primary-50" : "border-gray-300",
                  codeError ? "border-error-300 bg-error-50" : ""
                )}
              />
            ))}
          </div>

          {/* Error Message */}
          {codeError && (
            <p className="text-sm text-error-600 text-center mb-4">{codeError}</p>
          )}

          {/* Verify Button */}
          <button
            type="button"
            onClick={handleVerifyCode}
            disabled={isVerifying || codeInputs.some((d) => !d)}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium",
              "bg-primary text-white",
              "hover:bg-primary-700 active:scale-[0.98]",
              "disabled:bg-gray-300 disabled:cursor-not-allowed",
              "transition-all duration-200"
            )}
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Key className="w-4 h-4" />
                Verify Code
              </>
            )}
          </button>

          {/* Resend Link */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleResendCode}
              className="text-sm text-primary hover:underline flex items-center gap-1 mx-auto"
            >
              <RefreshCw className="w-3 h-3" />
              Resend verification code
            </button>
          </div>
        </div>

        {/* Cancel Link */}
        <div className="text-center">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel and return
          </button>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER - Submitted Step (Ask about sandbox testing)
  // ==========================================================================

  if (step === "submitted") {
    return (
      <div className="space-y-6 opacity-100" style={{ contain: "layout" }}>
        {/* Success Banner */}
        <div className="bg-gradient-to-r from-success to-emerald-500 rounded-lg p-6 text-white text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-white/20 rounded-full">
              <FileCheck className="w-8 h-8" />
            </div>
          </div>
          <h3 className="text-xl font-semibold mb-2">Application Submitted!</h3>
          <p className="text-white/90">
            Your PoDS-Lite application has been successfully verified
          </p>
        </div>

        {/* Application Details Card */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <h4 className="font-medium text-gray-800">Application Details</h4>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Application Number</span>
              <span className="font-mono font-medium text-gray-900">{applicationNumber}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Company</span>
              <span className="font-medium text-gray-900">{formData.vendorName}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Product</span>
              <span className="font-medium text-gray-900">{formData.applicationName}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-500">Access Tier</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                Privacy-Safe
              </span>
            </div>
          </div>
        </div>

        {/* Email Confirmation Notice */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-primary-800">Confirmation Email Sent</p>
              <p className="text-sm text-primary-700 mt-1">
                We&apos;ve sent your application number and documentation to <strong>{formData.contactEmail}</strong>.
                Please keep this for your records.
              </p>
            </div>
          </div>
        </div>

        {/* Sandbox Testing Question */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary-100 text-secondary-600 mb-3">
              <Play className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-medium text-gray-800 mb-2">
              Ready to Test Your Integration?
            </h4>
            <p className="text-sm text-gray-600 mb-5">
              Would you like to access the sandbox environment to test the OneRoster API
              with sample LAUSD data?
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={handleTestSandbox}
                className={cn(
                  "flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium",
                  "bg-primary text-white",
                  "hover:bg-primary-700 active:scale-[0.98]",
                  "transition-all duration-200"
                )}
              >
                <Play className="w-4 h-4" />
                Yes, Test the Sandbox
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onCancel}
                className={cn(
                  "flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium",
                  "bg-gray-100 text-gray-700",
                  "hover:bg-gray-200 active:scale-[0.98]",
                  "transition-all duration-200"
                )}
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <h5 className="font-medium text-gray-800 mb-2">What happens next?</h5>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-success-500 flex-shrink-0 mt-0.5" />
              <span>Your Privacy-Safe access is <strong>instantly approved</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-success-500 flex-shrink-0 mt-0.5" />
              <span>Use sandbox credentials to test your integration</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-success-500 flex-shrink-0 mt-0.5" />
              <span>When ready, contact LAUSD for production access</span>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER - Credentials Step
  // ==========================================================================

  if (step === "credentials" && credentials) {
    // Build available tabs based on what credentials were generated
    const availableTabs: { key: string; label: string; icon: typeof Database }[] = [];
    if (credentials.oneRoster) availableTabs.push({ key: "oneRoster", label: "OneRoster API", icon: Database });
    if (credentials.lti13) availableTabs.push({ key: "lti13", label: "LTI 1.3", icon: ExternalLink });
    if (credentials.saml) availableTabs.push({ key: "saml", label: "SSO (SAML)", icon: Key });
    if (credentials.oidc) availableTabs.push({ key: "oidc", label: "SSO (OIDC)", icon: Key });
    if (credentials.sftp) availableTabs.push({ key: "sftp", label: "SFTP/CSV", icon: FileText });

    // Helper function to render credential fields for current tab
    const renderCredentialFields = () => {
      const fields: { label: string; value: string; key: string; sensitive: boolean }[] = [];

      // Common fields
      fields.push({ label: "VENDOR_ID", value: credentials.vendorId, key: "vendorId", sensitive: false });
      fields.push({ label: "ACCESS_TIER", value: credentials.accessTier, key: "accessTier", sensitive: false });
      fields.push({ label: "ENVIRONMENT", value: credentials.environment, key: "environment", sensitive: false });

      // Integration-specific fields
      if (activeCredentialTab === "oneRoster" && credentials.oneRoster) {
        fields.push({ label: "API_KEY", value: credentials.oneRoster.apiKey, key: "or_apiKey", sensitive: true });
        fields.push({ label: "API_SECRET", value: credentials.oneRoster.apiSecret, key: "or_apiSecret", sensitive: true });
        fields.push({ label: "BASE_URL", value: credentials.oneRoster.baseUrl, key: "or_baseUrl", sensitive: false });
        fields.push({ label: "RATE_LIMIT", value: `${credentials.oneRoster.rateLimitPerMinute}/min`, key: "or_rateLimit", sensitive: false });
      }

      if (activeCredentialTab === "lti13" && credentials.lti13) {
        fields.push({ label: "CLIENT_ID", value: credentials.lti13.clientId, key: "lti_clientId", sensitive: false });
        fields.push({ label: "DEPLOYMENT_ID", value: credentials.lti13.deploymentId, key: "lti_deploymentId", sensitive: false });
        fields.push({ label: "PLATFORM_ID", value: credentials.lti13.platformId, key: "lti_platformId", sensitive: false });
        fields.push({ label: "AUTH_URL", value: credentials.lti13.authorizationUrl, key: "lti_authUrl", sensitive: false });
        fields.push({ label: "TOKEN_URL", value: credentials.lti13.tokenUrl, key: "lti_tokenUrl", sensitive: false });
        fields.push({ label: "JWKS_URL", value: credentials.lti13.jwksUrl, key: "lti_jwksUrl", sensitive: false });
      }

      if (activeCredentialTab === "saml" && credentials.saml) {
        fields.push({ label: "IDP_ENTITY_ID", value: credentials.saml.idpEntityId, key: "saml_idpEntityId", sensitive: false });
        fields.push({ label: "IDP_SSO_URL", value: credentials.saml.idpSsoUrl, key: "saml_idpSsoUrl", sensitive: false });
        fields.push({ label: "SP_ENTITY_ID", value: credentials.saml.spEntityId, key: "saml_spEntityId", sensitive: false });
        fields.push({ label: "SP_ACS_URL", value: credentials.saml.spAcsUrl, key: "saml_spAcsUrl", sensitive: false });
        if (credentials.saml.idpMetadataUrl) {
          fields.push({ label: "METADATA_URL", value: credentials.saml.idpMetadataUrl, key: "saml_metadataUrl", sensitive: false });
        }
      }

      if (activeCredentialTab === "oidc" && credentials.oidc) {
        fields.push({ label: "CLIENT_ID", value: credentials.oidc.clientId, key: "oidc_clientId", sensitive: false });
        fields.push({ label: "CLIENT_SECRET", value: credentials.oidc.clientSecret, key: "oidc_clientSecret", sensitive: true });
        fields.push({ label: "ISSUER", value: credentials.oidc.issuer, key: "oidc_issuer", sensitive: false });
        fields.push({ label: "AUTH_ENDPOINT", value: credentials.oidc.authorizationEndpoint, key: "oidc_authEndpoint", sensitive: false });
        fields.push({ label: "TOKEN_ENDPOINT", value: credentials.oidc.tokenEndpoint, key: "oidc_tokenEndpoint", sensitive: false });
        fields.push({ label: "USERINFO_ENDPOINT", value: credentials.oidc.userinfoEndpoint, key: "oidc_userinfoEndpoint", sensitive: false });
        fields.push({ label: "REDIRECT_URI", value: credentials.oidc.redirectUri, key: "oidc_redirectUri", sensitive: false });
      }

      if (activeCredentialTab === "sftp" && credentials.sftp) {
        fields.push({ label: "HOST", value: credentials.sftp.host, key: "sftp_host", sensitive: false });
        fields.push({ label: "PORT", value: String(credentials.sftp.port), key: "sftp_port", sensitive: false });
        fields.push({ label: "USERNAME", value: credentials.sftp.username, key: "sftp_username", sensitive: false });
        fields.push({ label: "REMOTE_DIR", value: credentials.sftp.remoteDirectory, key: "sftp_remoteDir", sensitive: false });
        fields.push({ label: "FILE_PATTERN", value: credentials.sftp.fileNamePattern, key: "sftp_filePattern", sensitive: false });
        fields.push({ label: "SCHEDULE", value: credentials.sftp.deliverySchedule, key: "sftp_schedule", sensitive: false });
      }

      return fields;
    };

    return (
      <div className="space-y-6 opacity-100" style={{ contain: "layout" }}>
        {/* Success Banner */}
        <div className="bg-gradient-to-r from-success to-emerald-500 rounded-lg p-6 text-white text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-white/20 rounded-full">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          </div>
          <h3 className="text-xl font-semibold mb-2">Application Approved!</h3>
          <p className="text-white/90">
            Your sandbox credentials have been generated for <strong>{formData.vendorName}</strong>
          </p>
          <p className="text-sm text-white/70 mt-2">
            {availableTabs.length} integration{availableTabs.length !== 1 ? "s" : ""} configured
          </p>
        </div>

        {/* Integration Tabs - only show if more than one integration */}
        {availableTabs.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {availableTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeCredentialTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveCredentialTab(tab.key)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-white"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Credentials Card - Dark Theme */}
        <div className="bg-gray-900 rounded-xl overflow-hidden shadow-xl">
          <div className="px-4 py-3 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-emerald-400" />
              <h4 className="font-medium text-white">
                {availableTabs.find(t => t.key === activeCredentialTab)?.label ?? "Sandbox"} Credentials
              </h4>
            </div>
          </div>

          <div className="divide-y divide-gray-800">
            {renderCredentialFields().map((field) => {
              const isRevealed = !field.sensitive || revealedFields.has(field.key);
              const displayValue = isRevealed ? field.value : maskValue();

              return (
                <div key={field.key} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                      {field.label}
                    </p>
                    <p className="font-mono text-sm text-emerald-400 break-all">
                      {displayValue}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Eye toggle for sensitive fields */}
                    {field.sensitive && (
                      <button
                        type="button"
                        onClick={() => toggleFieldReveal(field.key)}
                        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                        title={isRevealed ? "Hide value" : "Show value"}
                      >
                        {isRevealed ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    {/* Copy button */}
                    <button
                      type="button"
                      onClick={() => handleCopyCredential(field.key, field.value)}
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        copiedField === field.key
                          ? "bg-emerald-600 text-white"
                          : "text-gray-400 hover:text-white hover:bg-gray-700"
                      )}
                      title={copiedField === field.key ? "Copied!" : "Copy to clipboard"}
                    >
                      {copiedField === field.key ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SAML Certificate Notice */}
        {activeCredentialTab === "saml" && credentials.saml && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">SAML IdP Certificate</p>
                <p className="text-sm text-blue-700 mt-1">
                  The IdP certificate is available at the metadata URL above. Download and configure it in your SP.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SFTP Private Key Notice */}
        {activeCredentialTab === "sftp" && credentials.sftp && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Key className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">SSH Private Key</p>
                <p className="text-sm text-blue-700 mt-1">
                  Your SSH private key will be emailed to {formData.contactEmail}. Keep it secure and never share it.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Keep Your Credentials Secure</p>
              <p className="text-sm text-amber-700 mt-1">
                Store these credentials securely. Secrets will not be shown again.
                Never commit credentials to version control.
              </p>
            </div>
          </div>
        </div>

        {/* Next Steps - contextual based on integration type */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <h5 className="font-medium text-primary-800 mb-2">Next Steps</h5>
          <ul className="text-sm text-primary-700 space-y-1 list-disc list-inside">
            <li>Configure your application with these credentials</li>
            {activeCredentialTab === "oneRoster" && <li>Test the OneRoster API endpoints in the sandbox</li>}
            {activeCredentialTab === "lti13" && <li>Configure your LTI tool with the platform URLs</li>}
            {activeCredentialTab === "saml" && <li>Import the IdP metadata into your Service Provider</li>}
            {activeCredentialTab === "oidc" && <li>Configure your app with the OIDC endpoints</li>}
            {activeCredentialTab === "sftp" && <li>Configure your SFTP client with the server details</li>}
            <li>Review the API documentation for your integration type</li>
            <li>Contact support if you need assistance</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {onTestApi && activeCredentialTab === "oneRoster" && (
            <button
              type="button"
              onClick={onTestApi}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium",
                "bg-primary text-white",
                "hover:bg-primary-700 active:scale-[0.98]",
                "transition-all duration-200"
              )}
            >
              <Play className="w-4 h-4" />
              Test the OneRoster API
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium",
              onTestApi && activeCredentialTab === "oneRoster"
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                : "bg-primary text-white hover:bg-primary-700",
              "active:scale-[0.98]",
              "transition-all duration-200"
            )}
          >
            <CheckCircle2 className="w-4 h-4" />
            Done
          </button>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER - Main Form (step === "form")
  // ==========================================================================

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      className="space-y-5 opacity-100"
      style={{ contain: "layout" }}
    >
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary to-secondary rounded-lg p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold">PoDS-Lite Application</h3>
            <p className="text-sm text-white/80">
              Streamlined privacy application for Privacy-Safe access
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

      {/* Section 1: Company Information - SCHEMA-DRIVEN (Step A) */}
      <SchemaFormSection
        section={COMPANY_SECTION}
        formData={formData}
        errors={errors}
        onChange={handleInputChange}
        disabled={isSubmitting}
      />

      {/* Section 2: Contact Information - SCHEMA-DRIVEN (Step B) */}
      <SchemaFormSection
        section={CONTACT_SECTION}
        formData={formData}
        errors={errors}
        onChange={handleInputChange}
        disabled={isSubmitting}
      />

      {/* Section 2.5: Company Verification */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex items-center gap-2 text-gray-700 font-medium border-b border-gray-100 pb-2">
          <Shield className="w-5 h-5 text-primary" />
          <span>Company Verification</span>
        </div>
        <p className="text-sm text-gray-500">
          Help us verify your company with your website and LinkedIn presence.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Website URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Website *
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="url"
                value={formData.websiteUrl}
                onChange={(e) => handleInputChange("websiteUrl", e.target.value)}
                placeholder="https://www.yourcompany.com"
                className={cn(
                  "w-full pl-9 pr-10 py-2 border rounded-lg text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary",
                  errors.websiteUrl ? "border-error-300 bg-error-50" :
                  isValidWebsiteUrl ? "border-success-300 bg-success-50" : "border-gray-300"
                )}
              />
              {isValidWebsiteUrl && (
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-success-500" />
              )}
            </div>
            {errors.websiteUrl && (
              <p className="text-xs text-error-600 mt-1">{errors.websiteUrl}</p>
            )}
            {!errors.websiteUrl && formData.websiteUrl && !isValidWebsiteUrl && (
              <p className="text-xs text-warning-600 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                HTTPS is required for security
              </p>
            )}
          </div>

          {/* LinkedIn URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              LinkedIn Company Page
            </label>
            <div className="relative">
              <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="url"
                value={formData.linkedInUrl}
                onChange={(e) => handleInputChange("linkedInUrl", e.target.value)}
                placeholder="https://linkedin.com/company/yourcompany"
                className={cn(
                  "w-full pl-9 pr-10 py-2 border rounded-lg text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary",
                  errors.linkedInUrl ? "border-error-300 bg-error-50" :
                  formData.linkedInUrl && isValidLinkedInUrl ? "border-success-300 bg-success-50" : "border-gray-300"
                )}
              />
              {formData.linkedInUrl && isValidLinkedInUrl && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-success-500" />
              )}
            </div>
            {errors.linkedInUrl && (
              <p className="text-xs text-error-600 mt-1">{errors.linkedInUrl}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">Optional, but helps verify your company</p>
          </div>
        </div>

        {/* Verification Status Display */}
        {verificationStatus && (
          <div className={cn(
            "rounded-lg p-3 flex items-start gap-3",
            verificationStatus.emailDomainMatches && verificationStatus.isHttps
              ? "bg-success-50 border border-success-200"
              : verificationStatus.emailDomainMatches || verificationStatus.isHttps
                ? "bg-warning-50 border border-warning-200"
                : "bg-error-50 border border-error-200"
          )}>
            {verificationStatus.emailDomainMatches && verificationStatus.isHttps ? (
              <CheckCircle2 className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className={cn(
                "text-sm font-medium",
                verificationStatus.emailDomainMatches && verificationStatus.isHttps
                  ? "text-success-800"
                  : "text-warning-800"
              )}>
                Verification Status
              </p>
              <ul className="text-xs space-y-1">
                <li className={cn(
                  "flex items-center gap-1",
                  verificationStatus.emailDomainMatches ? "text-success-700" : "text-error-700"
                )}>
                  {verificationStatus.emailDomainMatches ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <AlertCircle className="w-3 h-3" />
                  )}
                  {verificationStatus.emailDomainMatches
                    ? "Email domain matches website"
                    : "Email domain does not match website domain"}
                </li>
                <li className={cn(
                  "flex items-center gap-1",
                  verificationStatus.isHttps ? "text-success-700" : "text-warning-700"
                )}>
                  {verificationStatus.isHttps ? (
                    <Lock className="w-3 h-3" />
                  ) : (
                    <AlertTriangle className="w-3 h-3" />
                  )}
                  {verificationStatus.isHttps
                    ? "Website uses secure HTTPS"
                    : "Website should use HTTPS"}
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Section 3: Business Address */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex items-center gap-2 text-gray-700 font-medium border-b border-gray-100 pb-2">
          <MapPin className="w-5 h-5 text-primary" />
          <span>Business Address</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Street Address */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Street Address *
            </label>
            <input
              type="text"
              value={formData.street}
              onChange={(e) => handleInputChange("street", e.target.value)}
              placeholder="123 Main Street"
              className={cn(
                "w-full px-3 py-2 border rounded-lg text-sm",
                "focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary",
                errors.street ? "border-error-300 bg-error-50" : "border-gray-300"
              )}
            />
            {errors.street && (
              <p className="text-xs text-error-600 mt-1">{errors.street}</p>
            )}
          </div>

          {/* Suite/Unit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Suite/Unit
            </label>
            <input
              type="text"
              value={formData.suite}
              onChange={(e) => handleInputChange("suite", e.target.value)}
              placeholder="Suite 100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City *
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => handleInputChange("city", e.target.value)}
              placeholder="Los Angeles"
              className={cn(
                "w-full px-3 py-2 border rounded-lg text-sm",
                "focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary",
                errors.city ? "border-error-300 bg-error-50" : "border-gray-300"
              )}
            />
            {errors.city && (
              <p className="text-xs text-error-600 mt-1">{errors.city}</p>
            )}
          </div>

          {/* State */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State *
            </label>
            <select
              value={formData.state}
              onChange={(e) => handleInputChange("state", e.target.value)}
              className={cn(
                "w-full px-3 py-2 border rounded-lg text-sm bg-white",
                "focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary",
                errors.state ? "border-error-300 bg-error-50" : "border-gray-300"
              )}
            >
              <option value="">Select state</option>
              {US_STATES.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            {errors.state && (
              <p className="text-xs text-error-600 mt-1">{errors.state}</p>
            )}
          </div>

          {/* ZIP Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ZIP Code *
            </label>
            <input
              type="text"
              value={formData.zipCode}
              onChange={(e) => handleInputChange("zipCode", e.target.value)}
              placeholder="90001"
              maxLength={10}
              className={cn(
                "w-full px-3 py-2 border rounded-lg text-sm",
                "focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary",
                errors.zipCode ? "border-error-300 bg-error-50" : "border-gray-300"
              )}
            />
            {errors.zipCode && (
              <p className="text-xs text-error-600 mt-1">{errors.zipCode}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 4: Integration Types (Multi-select) */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex items-center gap-2 text-gray-700 font-medium border-b border-gray-100 pb-2">
          <Settings className="w-5 h-5 text-primary" />
          <span>Integration Types</span>
        </div>
        <p className="text-sm text-gray-500">
          Select all integration methods your application needs. You can choose multiple options.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {INTEGRATION_METHODS.map((method) => {
            const isSelected = formData.integrationMethods.includes(method.value);
            return (
              <label
                key={method.value}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                  isSelected
                    ? "border-primary bg-primary-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleIntegrationMethodToggle(method.value)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">{method.label}</span>
                  <p className="text-xs text-gray-500">{method.description}</p>
                </div>
              </label>
            );
          })}
        </div>
        {formData.integrationMethods.length === 0 && (
          <p className="text-xs text-error-600">Please select at least one integration type</p>
        )}
      </div>

      {/* Conditional: OneRoster API Resources */}
      {hasOneRoster && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <div className="flex items-center gap-2 text-gray-700 font-medium border-b border-gray-100 pb-2">
            <Database className="w-5 h-5 text-primary" />
            <span>OneRoster API Resources</span>
          </div>
          <p className="text-sm text-gray-500">
            Select the OneRoster resources your application needs. All identifiers are tokenized.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {DATA_ELEMENTS.map((element) => {
              const isRestricted = "restricted" in element && element.restricted;
              const isSelected = formData.dataElementsRequested.includes(element.value);
              return (
                <label
                  key={element.value}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    isSelected
                      ? isRestricted
                        ? "border-warning bg-warning-50"
                        : "border-primary bg-primary-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleDataElementToggle(element.value)}
                    className={cn(
                      "mt-0.5 h-4 w-4 rounded border-gray-300 focus:ring-primary",
                      isRestricted ? "text-warning" : "text-primary"
                    )}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">{element.label}</span>
                      {isRestricted && (
                        <span className="text-xs px-1.5 py-0.5 bg-warning-100 text-warning-700 rounded">
                          Selective Tier
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{element.description}</p>
                  </div>
                </label>
              );
            })}
          </div>
          {errors.dataElementsRequested && (
            <p className="text-xs text-error-600">{errors.dataElementsRequested}</p>
          )}
        </div>
      )}

      {/* Conditional: LTI 1.3 Context Options */}
      {hasLti && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <div className="flex items-center gap-2 text-gray-700 font-medium border-b border-gray-100 pb-2">
            <ExternalLink className="w-5 h-5 text-primary" />
            <span>LTI 1.3 Services</span>
          </div>
          <p className="text-sm text-gray-500">
            Select the LTI services and context your application requires during tool launch.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {LTI_CONTEXT_OPTIONS.map((option) => {
              const isSelected = formData.ltiContextOptions.includes(option.value);
              return (
                <label
                  key={option.value}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    isSelected
                      ? "border-primary bg-primary-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleLtiContextToggle(option.value)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">{option.label}</span>
                    <p className="text-xs text-gray-500">{option.description}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Conditional: SSO Attributes */}
      {hasSso && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <div className="flex items-center gap-2 text-gray-700 font-medium border-b border-gray-100 pb-2">
            <Key className="w-5 h-5 text-primary" />
            <span>SSO User Attributes</span>
          </div>
          <p className="text-sm text-gray-500">
            Select the user attributes to include in {formData.integrationMethods.includes("SSO_SAML") ? "SAML assertions" : "OIDC claims"}.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SSO_ATTRIBUTES.map((attr) => {
              const isSelected = formData.ssoAttributes.includes(attr.value);
              return (
                <label
                  key={attr.value}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    isSelected
                      ? "border-primary bg-primary-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleSsoAttributeToggle(attr.value)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">{attr.label}</span>
                    <p className="text-xs text-gray-500">{attr.description}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Conditional: SFTP/CSV Info */}
      {hasSftp && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">SFTP/CSV Transfer</p>
              <p className="text-sm text-blue-700 mt-1">
                After approval, you&apos;ll receive SFTP credentials and documentation for the CSV file format.
                Files are delivered on a configurable schedule (daily, weekly, or on-demand).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Section 5: Data Purpose (always shown) */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex items-center gap-2 text-gray-700 font-medium border-b border-gray-100 pb-2">
          <FileText className="w-5 h-5 text-primary" />
          <span>Data Usage</span>
        </div>

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

      {/* Section 6: Security & Compliance */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex items-center gap-2 text-gray-700 font-medium border-b border-gray-100 pb-2">
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
              Data Retention (days)
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

      {/* Section 7: Compliance Acknowledgments */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-3">
        <div className="flex items-center gap-2 text-gray-700 font-medium border-b border-gray-100 pb-2">
          <CheckCircle2 className="w-5 h-5 text-success" />
          <span>Compliance Acknowledgments</span>
        </div>

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
            <span className="text-sm font-medium text-gray-700">COPPA Compliance *</span>
            <p className="text-xs text-gray-500">
              I certify that our application complies with COPPA.
            </p>
          </div>
        </label>

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
            <span className="text-sm font-medium text-gray-700">Data Deletion Agreement *</span>
            <p className="text-xs text-gray-500">
              I agree to delete all LAUSD data within 30 days of termination.
            </p>
          </div>
        </label>

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
            <span className="text-sm font-medium text-gray-700">Terms & Conditions *</span>
            <p className="text-xs text-gray-500">
              I have read and agree to the{" "}
              <a
                href="https://achieve.lausd.net/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                LAUSD Privacy Policy
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        </label>
      </div>

      {/* Token-Only Notice */}
      <div className="bg-success-50 border border-success-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-success-800">Privacy-Safe Access Tier</h4>
            <p className="text-sm text-success-700 mt-1">
              Your application qualifies for Privacy-Safe access with tokenized identifiers
              and <strong>instant approval</strong>.
            </p>
          </div>
        </div>
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
