import type { Vendor } from "@/features/operations/vendors/types";

export function validateVendor(values: Vendor) {
  const errors: Partial<Record<keyof Vendor, string>> = {};
  if (!values.companyName) errors.companyName = "Company name is required";
  if (!values.type) errors.type = "Type is required";
  return errors;
}
