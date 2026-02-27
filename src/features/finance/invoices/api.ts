import { apiClient } from "@/lib/http/api-client";
import type { SupplierInvoice } from "@/features/finance/invoices/types";

export function fetchInvoices() {
  return apiClient.get<SupplierInvoice[]>("/finance/invoices");
}

export function fetchInvoiceByNumber(invoiceNumber: string) {
  return apiClient.get<SupplierInvoice>(`/finance/invoices/number/${encodeURIComponent(invoiceNumber)}`);
}

export function fetchInvoicesByStatus(status: string) {
  return apiClient.get<SupplierInvoice[]>(`/finance/invoices/status/${encodeURIComponent(status)}`);
}

export function fetchOverdueInvoices() {
  return apiClient.get<SupplierInvoice[]>("/finance/invoices/overdue");
}

export function fetchInvoice(id: string) {
  return apiClient.get<SupplierInvoice>(`/finance/invoices/${id}`);
}

export function createInvoice(values: SupplierInvoice) {
  return apiClient.post<SupplierInvoice>("/finance/invoices", values);
}

export function deleteInvoice(id: string) {
  return apiClient.del<void>(`/finance/invoices/${id}`);
}

export function approveInvoice(id: string, approvedBy: string) {
  return apiClient.post<SupplierInvoice>(`/finance/invoices/${id}/approve?approvedBy=${approvedBy}`);
}

export function recordInvoicePayment({
  id,
  amount,
  paidBy,
  paymentReference
}: {
  id: string;
  amount: number;
  paidBy: string;
  paymentReference: string;
}) {
  const params = new URLSearchParams({
    amount: amount.toString(),
    paidBy,
    paymentReference
  });
  return apiClient.post<SupplierInvoice>(`/finance/invoices/${id}/payment?${params.toString()}`);
}

export function rejectInvoice(id: string, reason: string) {
  return apiClient.post<SupplierInvoice>(`/finance/invoices/${id}/reject?reason=${encodeURIComponent(reason)}`);
}
