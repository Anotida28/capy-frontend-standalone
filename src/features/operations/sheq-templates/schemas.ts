import type { SheqTemplate } from "@/features/operations/sheq-templates/types";

export function validateSheqTemplate(values: SheqTemplate) {
  const errors: Record<string, string> = {};
  if (!values.templateName?.trim()) {
    errors.templateName = "Template name is required.";
  }
  if (!values.items || values.items.length === 0) {
    errors.items = "Add at least one checklist item.";
  }
  return errors;
}
