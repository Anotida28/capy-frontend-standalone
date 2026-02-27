import type { AssetAllocation } from "@/features/operations/asset-allocations/types";

export function validateAllocation(values: AssetAllocation) {
  const errors: Partial<Record<keyof AssetAllocation, string>> = {};
  if (!values.projectId) errors.projectId = "Project ID is required";
  if (!values.assetId) errors.assetId = "Asset ID is required";
  if (!values.allocationDate) errors.allocationDate = "Allocation date is required";
  return errors;
}
