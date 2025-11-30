/**
 * SchemaFormSection - Renders form sections from schema-generated config
 *
 * STEP A of schema-first migration: Use generated config for form rendering.
 *
 * This component renders a form section based on FormSectionConfig,
 * replacing hardcoded section JSX with schema-driven rendering.
 */

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { FormSectionConfig, FormFieldConfig } from "@/lib/schemas";
import {
  Building2,
  User,
  ShieldCheck,
  MapPin,
  Plug,
  Database,
  Lock,
  CheckCircle,
} from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

export interface SchemaFormSectionProps {
  section: FormSectionConfig;
  formData: Record<string, unknown>;
  errors: Record<string, string | undefined>;
  onChange: (field: string, value: unknown) => void;
  disabled?: boolean;
}

// =============================================================================
// ICON MAPPING
// =============================================================================

const SECTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  company: Building2,
  contact: User,
  verification: ShieldCheck,
  address: MapPin,
  integration: Plug,
  data: Database,
  security: Lock,
  compliance: CheckCircle,
};

// =============================================================================
// FIELD RENDERERS
// =============================================================================

interface FieldRendererProps {
  field: FormFieldConfig;
  value: unknown;
  error?: string;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

function TextInput({ field, value, error, onChange, disabled }: FieldRendererProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label} {field.required && "*"}
      </label>
      <input
        type={field.type === "email" ? "email" : field.type === "url" ? "url" : "text"}
        value={(value as string) || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        disabled={disabled}
        className={cn(
          "w-full px-3 py-2 border rounded-lg text-sm",
          "focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary",
          "disabled:bg-gray-100 disabled:cursor-not-allowed",
          error ? "border-error-300 bg-error-50" : "border-gray-300"
        )}
      />
      {field.helpText && !error && (
        <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>
      )}
      {error && <p className="text-xs text-error-600 mt-1">{error}</p>}
    </div>
  );
}

function TextArea({ field, value, error, onChange, disabled }: FieldRendererProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label} {field.required && "*"}
      </label>
      <textarea
        value={(value as string) || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        disabled={disabled}
        rows={3}
        className={cn(
          "w-full px-3 py-2 border rounded-lg text-sm resize-none",
          "focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary",
          "disabled:bg-gray-100 disabled:cursor-not-allowed",
          error ? "border-error-300 bg-error-50" : "border-gray-300"
        )}
      />
      {field.helpText && !error && (
        <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>
      )}
      {error && <p className="text-xs text-error-600 mt-1">{error}</p>}
    </div>
  );
}

function NumberInput({ field, value, error, onChange, disabled }: FieldRendererProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label} {field.required && "*"}
      </label>
      <input
        type="number"
        value={value !== undefined ? String(value) : ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
        placeholder={field.placeholder}
        disabled={disabled}
        className={cn(
          "w-full px-3 py-2 border rounded-lg text-sm",
          "focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary",
          "disabled:bg-gray-100 disabled:cursor-not-allowed",
          error ? "border-error-300 bg-error-50" : "border-gray-300"
        )}
      />
      {field.helpText && !error && (
        <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>
      )}
      {error && <p className="text-xs text-error-600 mt-1">{error}</p>}
    </div>
  );
}

function Select({ field, value, error, onChange, disabled }: FieldRendererProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label} {field.required && "*"}
      </label>
      <select
        value={(value as string) || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          "w-full px-3 py-2 border rounded-lg text-sm",
          "focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary",
          "disabled:bg-gray-100 disabled:cursor-not-allowed",
          error ? "border-error-300 bg-error-50" : "border-gray-300"
        )}
      >
        <option value="">Select {field.label.toLowerCase()}...</option>
        {field.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {field.helpText && !error && (
        <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>
      )}
      {error && <p className="text-xs text-error-600 mt-1">{error}</p>}
    </div>
  );
}

function Checkbox({ field, value, error, onChange, disabled }: FieldRendererProps) {
  return (
    <div className="flex items-start gap-2">
      <input
        type="checkbox"
        id={field.name}
        checked={Boolean(value)}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="mt-1 h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary-200"
      />
      <div className="flex-1">
        <label htmlFor={field.name} className="text-sm font-medium text-gray-700">
          {field.label} {field.required && "*"}
        </label>
        {field.helpText && (
          <p className="text-xs text-gray-500 mt-0.5">{field.helpText}</p>
        )}
        {error && <p className="text-xs text-error-600 mt-0.5">{error}</p>}
      </div>
    </div>
  );
}

function MultiSelect({ field, value, error, onChange, disabled }: FieldRendererProps) {
  const selected = (value as string[]) || [];

  const toggleOption = (optValue: string) => {
    if (selected.includes(optValue)) {
      onChange(selected.filter((v) => v !== optValue));
    } else {
      onChange([...selected, optValue]);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label} {field.required && "*"}
      </label>
      <div className="border rounded-lg p-2 space-y-1 max-h-48 overflow-y-auto">
        {field.options?.map((opt) => (
          <label
            key={opt.value}
            className={cn(
              "flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-50",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <input
              type="checkbox"
              checked={selected.includes(opt.value)}
              onChange={() => toggleOption(opt.value)}
              disabled={disabled}
              className="h-4 w-4 text-primary border-gray-300 rounded"
            />
            <span className="text-sm">{opt.label}</span>
          </label>
        ))}
      </div>
      {field.helpText && !error && (
        <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>
      )}
      {error && <p className="text-xs text-error-600 mt-1">{error}</p>}
    </div>
  );
}

// =============================================================================
// FIELD RENDERER DISPATCHER
// =============================================================================

function renderField(props: FieldRendererProps) {
  const { field } = props;

  switch (field.type) {
    case "textarea":
      return <TextArea {...props} />;
    case "number":
      return <NumberInput {...props} />;
    case "select":
      return <Select {...props} />;
    case "checkbox":
      return <Checkbox {...props} />;
    case "multiselect":
      return <MultiSelect {...props} />;
    case "email":
    case "url":
    case "tel":
    case "text":
    default:
      return <TextInput {...props} />;
  }
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function SchemaFormSection({
  section,
  formData,
  errors,
  onChange,
  disabled,
}: SchemaFormSectionProps) {
  const Icon = SECTION_ICONS[section.id] || Building2;

  // Filter fields based on showWhen conditions
  const visibleFields = section.fields.filter((field) => {
    if (!field.showWhen) return true;
    const dependentValue = formData[field.showWhen.field];
    return dependentValue === field.showWhen.equals;
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-2 text-gray-700 font-medium border-b border-gray-100 pb-2">
        <Icon className="w-5 h-5 text-primary" />
        <span>{section.title}</span>
      </div>

      {section.description && (
        <p className="text-sm text-gray-500">{section.description}</p>
      )}

      {/* Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleFields.map((field) => (
          <div
            key={field.name}
            className={cn(
              // Full width for textareas and multiselects
              field.type === "textarea" || field.type === "multiselect"
                ? "md:col-span-2"
                : ""
            )}
          >
            {renderField({
              field,
              value: formData[field.name],
              error: errors[field.name],
              onChange: (value) => onChange(field.name, value),
              disabled,
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SchemaFormSection;
