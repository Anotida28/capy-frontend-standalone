import type { ScopeItem } from "@/features/operations/scope-items/types";

export function validateScopeItem(values: ScopeItem) {
  const errors: Partial<Record<keyof ScopeItem, string>> = {};
  if (!values.projectId) {
    errors.projectId = "Project is required";
  }
  return errors;
}
