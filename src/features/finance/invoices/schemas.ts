import type { SupplierInvoice } from "@/features/finance/invoices/types";

export function validateInvoice(values: SupplierInvoice) {
  const errors: Partial<Record<keyof SupplierInvoice, string>> = {};
  if (!values.invoiceNumber) errors.invoiceNumber = "Invoice number is required";
  if (!values.vendorId) errors.vendorId = "Vendor ID is required";
  if (!values.receivedBy) errors.receivedBy = "Received by is required";
  if (values.invoiceAmount <= 0) errors.invoiceAmount = "Invoice amount must be > 0";
  return errors;
}
