import type { LaborNorm } from "@/features/operations/labor-norms/types";

export function validateLaborNorm(values: LaborNorm) {
  const errors: Partial<Record<keyof LaborNorm, string>> = {};
  if (!values.activityCode) errors.activityCode = "Activity code is required";
  if (!values.description) errors.description = "Description is required";
  if (!values.unit) errors.unit = "Unit is required";
  if (values.standardHoursPerUnit <= 0) errors.standardHoursPerUnit = "Hours must be > 0";
  return errors;
}
