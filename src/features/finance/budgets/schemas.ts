import type { ProjectBudgetCreate } from "@/features/finance/budgets/types";

export function validateBudget(values: ProjectBudgetCreate) {
  const errors: Partial<Record<keyof ProjectBudgetCreate, string>> = {};
  if (!values.projectId) errors.projectId = "Project ID is required";
  if (values.totalValue === undefined || values.totalValue === null || values.totalValue < 0) {
    errors.totalValue = "Total value must be 0 or more";
  }
  return errors;
}
