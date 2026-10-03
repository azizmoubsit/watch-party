import { z } from "zod";

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, "Display name must be at least 2 characters long")
  .max(30, "Display name cannot exceed 30 characters")
  .regex(
    /^[a-zA-Z0-9_\-\s]+$/,
    "Display name can only contain letters, numbers, spaces, hyphens, and underscores"
  );

export function sanitizeDisplayName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function validateDisplayName(name: string): { success: boolean; error?: string; value?: string } {
  const sanitized = sanitizeDisplayName(name);
  const result = displayNameSchema.safeParse(sanitized);

  if (!result.success) {
    return {
      success: false,
      error: result.error.errors[0]?.message || "Invalid display name",
    };
  }

  return {
    success: true,
    value: result.data,
  };
}
