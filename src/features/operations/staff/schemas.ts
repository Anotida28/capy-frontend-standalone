import type { Staff } from "@/features/operations/staff/types";

export function validateStaff(values: Staff) {
  const errors: Partial<Record<keyof Staff, string>> = {};
  if (!values.fullName) errors.fullName = "Full name is required";
  if (!values.nationalId) errors.nationalId = "National ID is required";
  if (!values.role) errors.role = "Role is required";
  return errors;
}
