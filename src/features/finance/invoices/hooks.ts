"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/http/query-keys";
import {
  approveInvoice,
  createInvoice,
  deleteInvoice,
  fetchInvoice,
  fetchInvoiceByNumber,
  fetchInvoices,
  fetchInvoicesByStatus,
  fetchOverdueInvoices,
  recordInvoicePayment,
  rejectInvoice
} from "@/features/finance/invoices/api";
import type { SupplierInvoice } from "@/features/finance/invoices/types";

export function useInvoices(enabled = true) {
  return useQuery({ queryKey: queryKeys.finance.invoices.list(), queryFn: fetchInvoices, enabled });
}

export function useInvoicesByStatus(status: string) {
  return useQuery({
    queryKey: queryKeys.finance.invoices.byStatus(status),
    queryFn: () => fetchInvoicesByStatus(status),
    enabled: Boolean(status)
  });
}

export function useInvoiceByNumber(invoiceNumber: string) {
  return useQuery({
    queryKey: queryKeys.finance.invoices.byNumber(invoiceNumber),
    queryFn: () => fetchInvoiceByNumber(invoiceNumber),
    enabled: Boolean(invoiceNumber)
  });
}

export function useOverdueInvoices(enabled = false) {
  return useQuery({ queryKey: queryKeys.finance.invoices.overdue(), queryFn: fetchOverdueInvoices, enabled });
}

export function useInvoice(id: string) {
  return useQuery({ queryKey: queryKeys.finance.invoices.detail(id), queryFn: () => fetchInvoice(id) });
}

export function useCreateInvoice() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: SupplierInvoice) => createInvoice(payload),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.finance.invoices.all })
  });
}

export function useDeleteInvoice() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteInvoice(id),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.finance.invoices.all })
  });
}

export function useInvoiceActions() {
  const client = useQueryClient();
  const invalidate = (id: string) => {
    client.invalidateQueries({ queryKey: queryKeys.finance.invoices.all });
    client.invalidateQueries({ queryKey: queryKeys.finance.invoices.detail(id) });
  };

  return {
    approve: useMutation({
      mutationFn: ({ id, approvedBy }: { id: string; approvedBy: string }) => approveInvoice(id, approvedBy),
      onSuccess: (_, variables) => invalidate(variables.id)
    }),
    reject: useMutation({
      mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectInvoice(id, reason),
      onSuccess: (_, variables) => invalidate(variables.id)
    }),
    payment: useMutation({
      mutationFn: (payload: { id: string; amount: number; paidBy: string; paymentReference: string }) =>
        recordInvoicePayment(payload),
      onSuccess: (_, variables) => invalidate(variables.id)
    })
  };
}
