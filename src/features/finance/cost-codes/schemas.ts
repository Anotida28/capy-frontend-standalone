import type { CostCode } from "@/features/finance/cost-codes/types";

export function validateCostCode(values: CostCode) {
  const errors: Partial<Record<keyof CostCode, string>> = {};
  if (!values.code) errors.code = "Code is required";
  if (!values.name) errors.name = "Name is required";
  if (!values.category) errors.category = "Category is required";
  return errors;
}
