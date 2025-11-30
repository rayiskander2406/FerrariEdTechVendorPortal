"use client";

import React, { useState, useCallback, type FormEvent } from "react";
import { z } from "zod";
import {
  Package,
  FileText,
  Tag,
  GraduationCap,
  BookOpen,
  Globe,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

export interface AppSubmission {
  appName: string;
  description: string;
  category: AppCategory;
  targetGrades: string[];
  subjects: string[];
  appUrl: string;
}

export type AppCategory = "Learning" | "Assessment" | "Collaboration" | "Productivity";

interface AppSubmitFormProps {
  onSubmit: (submission: AppSubmission) => Promise<void>;
  onCancel: () => void;
}

interface FormErrors {
  [key: string]: string | undefined;
}

// =============================================================================
// VALIDATION SCHEMA
// =============================================================================

const FormSchema = z.object({
  appName: z.string().min(2, "App name must be at least 2 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  category: z.enum(["Learning", "Assessment", "Collaboration", "Productivity"]),
  targetGrades: z.array(z.string()).min(1, "Select at least one grade level"),
  subjects: z.array(z.string()).min(1, "Select at least one subject"),
  appUrl: z.string().url("Please enter a valid URL"),
});

// =============================================================================
// CONSTANTS
// =============================================================================

const CATEGORIES: { value: AppCategory; label: string; description: string }[] = [
  { value: "Learning", label: "Learning", description: "Educational content & instruction" },
  { value: "Assessment", label: "Assessment", description: "Testing & evaluation tools" },
  { value: "Collaboration", label: "Collaboration", description: "Group work & communication" },
  { value: "Productivity", label: "Productivity", description: "Organization & workflow" },
];

const GRADES = [
  { value: "K", label: "Kindergarten" },
  { value: "1", label: "1st Grade" },
  { value: "2", label: "2nd Grade" },
  { value: "3", label: "3rd Grade" },
  { value: "4", label: "4th Grade" },
  { value: "5", label: "5th Grade" },
  { value: "6", label: "6th Grade" },
  { value: "7", label: "7th Grade" },
  { value: "8", label: "8th Grade" },
  { value: "9", label: "9th Grade" },
  { value: "10", label: "10th Grade" },
  { value: "11", label: "11th Grade" },
  { value: "12", label: "12th Grade" },
];

const SUBJECTS = [
  "Mathematics",
  "English Language Arts",
  "Science",
  "Social Studies",
  "Physical Education",
  "Art",
  "Music",
  "World Languages",
  "Computer Science",
  "Health",
  "Career Technical Education",
  "Special Education",
];

// =============================================================================
// COMPONENT
// =============================================================================

export function AppSubmitForm({ onSubmit, onCancel }: AppSubmitFormProps) {
  // Form state
  const [formData, setFormData] = useState({
    appName: "",
    description: "",
    category: "Learning" as AppCategory,
    targetGrades: [] as string[],
    subjects: [] as string[],
    appUrl: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  const handleGradeToggle = useCallback((grade: string) => {
    setFormData((prev) => {
      const current = prev.targetGrades;
      const updated = current.includes(grade)
        ? current.filter((g) => g !== grade)
        : [...current, grade];
      return { ...prev, targetGrades: updated };
    });
    setErrors((prev) => ({ ...prev, targetGrades: undefined }));
  }, []);

  const handleSubjectToggle = useCallback((subject: string) => {
    setFormData((prev) => {
      const current = prev.subjects;
      const updated = current.includes(subject)
        ? current.filter((s) => s !== subject)
        : [...current, subject];
      return { ...prev, subjects: updated };
    });
    setErrors((prev) => ({ ...prev, subjects: undefined }));
  }, []);

  const handleSelectAllGrades = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      targetGrades: prev.targetGrades.length === GRADES.length ? [] : GRADES.map((g) => g.value),
    }));
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
        await onSubmit(formData);
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
  // VALIDATION CHECK
  // ==========================================================================

  const isFormValid =
    formData.appName.length >= 2 &&
    formData.description.length >= 20 &&
    formData.targetGrades.length > 0 &&
    formData.subjects.length > 0 &&
    formData.appUrl.length > 0;

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Banner - Teal/Cyan Gradient */}
      <div className="relative rounded-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500 via-cyan-500 to-primary p-[2px] rounded-lg">
          <div className="absolute inset-[2px] bg-white rounded-lg" />
        </div>
        <div className="relative bg-gradient-to-r from-teal-500 via-cyan-500 to-primary rounded-lg p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold">Freemium App Submission</h3>
              <p className="text-sm text-white/80">
                Submit your app for LAUSD&apos;s freemium catalog
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Free tier access
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              District-wide visibility
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

      {/* App Name */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          App Name *
        </label>
        <div className="relative">
          <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={formData.appName}
            onChange={(e) => handleInputChange("appName", e.target.value)}
            placeholder="My Education App"
            className={cn(
              "w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm",
              "focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500",
              errors.appName ? "border-error-300 bg-error-50" : "border-gray-300"
            )}
          />
        </div>
        {errors.appName && (
          <p className="text-xs text-error-600">{errors.appName}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Description *
        </label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            placeholder="Describe what your app does and how it helps students learn..."
            rows={4}
            className={cn(
              "w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm resize-none",
              "focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500",
              errors.description ? "border-error-300 bg-error-50" : "border-gray-300"
            )}
          />
        </div>
        <div className="flex justify-between">
          {errors.description ? (
            <p className="text-xs text-error-600">{errors.description}</p>
          ) : (
            <span />
          )}
          <span className="text-xs text-gray-400">
            {formData.description.length} / 20 min
          </span>
        </div>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Tag className="w-4 h-4" />
          Category *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {CATEGORIES.map((cat) => (
            <label
              key={cat.value}
              className={cn(
                "flex flex-col items-center p-3 rounded-lg border cursor-pointer transition-all text-center",
                formData.category === cat.value
                  ? "border-cyan-500 bg-cyan-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <input
                type="radio"
                name="category"
                value={cat.value}
                checked={formData.category === cat.value}
                onChange={(e) => handleInputChange("category", e.target.value)}
                className="sr-only"
              />
              <span
                className={cn(
                  "font-medium text-sm",
                  formData.category === cat.value ? "text-cyan-700" : "text-gray-700"
                )}
              >
                {cat.label}
              </span>
              <span className="text-xs text-gray-500 mt-0.5">{cat.description}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Target Grades (Multi-select) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <GraduationCap className="w-4 h-4" />
            Target Grades *
          </label>
          <button
            type="button"
            onClick={handleSelectAllGrades}
            className="text-xs text-cyan-600 hover:text-cyan-700"
          >
            {formData.targetGrades.length === GRADES.length ? "Clear all" : "Select all"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {GRADES.map((grade) => (
            <label
              key={grade.value}
              className={cn(
                "px-3 py-1.5 rounded-full border cursor-pointer transition-all text-sm",
                formData.targetGrades.includes(grade.value)
                  ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              )}
            >
              <input
                type="checkbox"
                checked={formData.targetGrades.includes(grade.value)}
                onChange={() => handleGradeToggle(grade.value)}
                className="sr-only"
              />
              {grade.value === "K" ? "K" : grade.value}
            </label>
          ))}
        </div>
        {errors.targetGrades && (
          <p className="text-xs text-error-600">{errors.targetGrades}</p>
        )}
      </div>

      {/* Subjects (Multi-select) */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <BookOpen className="w-4 h-4" />
          Subjects *
        </label>
        <div className="flex flex-wrap gap-2">
          {SUBJECTS.map((subject) => (
            <label
              key={subject}
              className={cn(
                "px-3 py-1.5 rounded-lg border cursor-pointer transition-all text-sm",
                formData.subjects.includes(subject)
                  ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              )}
            >
              <input
                type="checkbox"
                checked={formData.subjects.includes(subject)}
                onChange={() => handleSubjectToggle(subject)}
                className="sr-only"
              />
              {subject}
            </label>
          ))}
        </div>
        {errors.subjects && (
          <p className="text-xs text-error-600">{errors.subjects}</p>
        )}
      </div>

      {/* App URL */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          App URL *
        </label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="url"
            value={formData.appUrl}
            onChange={(e) => handleInputChange("appUrl", e.target.value)}
            placeholder="https://your-app.com"
            className={cn(
              "w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm",
              "focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500",
              errors.appUrl ? "border-error-300 bg-error-50" : "border-gray-300"
            )}
          />
        </div>
        {errors.appUrl && (
          <p className="text-xs text-error-600">{errors.appUrl}</p>
        )}
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
            "bg-gradient-to-r from-teal-500 to-cyan-500 text-white",
            "hover:from-teal-600 hover:to-cyan-600 active:scale-95",
            "disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed",
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

export default AppSubmitForm;
