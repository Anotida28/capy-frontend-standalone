import type { MaterialCatalogItem } from "@/features/operations/material-catalog/types";

export function validateMaterial(values: MaterialCatalogItem) {
  const errors: Partial<Record<keyof MaterialCatalogItem, string>> = {};
  if (!values.itemCode) errors.itemCode = "Item code is required";
  if (!values.name) errors.name = "Name is required";
  if (!values.standardUnit) errors.standardUnit = "Unit is required";
  return errors;
}
