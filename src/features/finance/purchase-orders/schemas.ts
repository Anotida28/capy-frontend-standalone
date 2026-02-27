import type { PurchaseOrder } from "@/features/finance/purchase-orders/types";

export function validatePurchaseOrder(values: PurchaseOrder) {
  const errors: Partial<Record<keyof PurchaseOrder, string>> = {};
  if (!values.projectId) errors.projectId = "Project ID is required";
  if (!values.vendorId) errors.vendorId = "Vendor ID is required";
  if (!values.createdBy) errors.createdBy = "Created by is required";
  return errors;
}
