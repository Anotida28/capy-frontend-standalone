import type { ProjectFormValues } from "@/features/operations/projects/types";

export function validateProject(values: ProjectFormValues) {
  const errors: Partial<Record<keyof ProjectFormValues, string>> = {};
  if (!values.name?.trim()) {
    errors.name = "Project name is required";
  }
  if (!values.status) {
    errors.status = "Status is required";
  }
  if (values.percentComplete != null) {
    if (values.percentComplete < 0 || values.percentComplete > 100) {
      errors.percentComplete = "Percent complete must be between 0 and 100";
    }
  }
  return errors;
}
