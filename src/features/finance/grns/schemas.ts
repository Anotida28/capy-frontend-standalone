import type { GRN } from "@/features/finance/grns/types";

export function validateGrn(values: GRN) {
  const errors: Partial<Record<keyof GRN, string>> = {};
  if (!values.purchaseOrderId) errors.purchaseOrderId = "Purchase order is required";
  if (!values.receivedBy) errors.receivedBy = "Received by is required";
  return errors;
}
