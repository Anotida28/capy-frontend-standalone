import type { Asset } from "@/features/operations/assets/types";

export function validateAsset(values: Asset) {
  const errors: Partial<Record<keyof Asset, string>> = {};
  if (!values.assetCode?.trim()) {
    errors.assetCode = "Asset code is required";
  }
  const hasAllocation = Boolean(values.assignedProjectId?.trim() || values.assignedProjectName?.trim());
  const hasPersonInCharge = Boolean(
    values.personInChargeId?.trim() || values.personInChargeName?.trim() || values.operatorId?.trim()
  );
  if (hasAllocation && !hasPersonInCharge) {
    errors.personInChargeId = "Person in charge is required when an asset is allocated";
  }
  if (values.ownership === "RENTED" && !values.rentalStartDate) {
    errors.rentalStartDate = "Rental start date is required for rented assets";
  }
  if (values.allocationStartDate && values.allocationEndDate && values.allocationEndDate < values.allocationStartDate) {
    errors.allocationEndDate = "Allocation end date cannot be before allocation start date";
  }
  if (values.rentalStartDate && values.rentalEndDate && values.rentalEndDate < values.rentalStartDate) {
    errors.rentalEndDate = "Rental end date cannot be before rental start date";
  }
  if (values.utilizationPercent != null) {
    if (values.utilizationPercent < 0 || values.utilizationPercent > 100) {
      errors.utilizationPercent = "Utilization must be between 0 and 100";
    }
  }
  return errors;
}
