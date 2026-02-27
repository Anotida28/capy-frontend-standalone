"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/http/query-keys";
import {
  approvePurchaseOrder,
  cancelPurchaseOrder,
  closePurchaseOrder,
  createPurchaseOrder,
  deletePurchaseOrder,
  fetchPurchaseOrder,
  fetchPurchaseOrderByNumber,
  fetchPurchaseOrdersByProject,
  fetchPurchaseOrdersByStatus,
  fetchPurchaseOrders,
  submitPurchaseOrder
} from "@/features/finance/purchase-orders/api";
import type { PurchaseOrder } from "@/features/finance/purchase-orders/types";

export function usePurchaseOrders(enabled = true) {
  return useQuery({ queryKey: queryKeys.finance.purchaseOrders.list(), queryFn: fetchPurchaseOrders, enabled });
}

export function usePurchaseOrdersByStatus(status: string) {
  return useQuery({
    queryKey: queryKeys.finance.purchaseOrders.byStatus(status),
    queryFn: () => fetchPurchaseOrdersByStatus(status),
    enabled: Boolean(status)
  });
}

export function usePurchaseOrdersByProject(projectId: string) {
  return useQuery({
    queryKey: queryKeys.finance.purchaseOrders.byProject(projectId),
    queryFn: () => fetchPurchaseOrdersByProject(projectId),
    enabled: Boolean(projectId)
  });
}

export function usePurchaseOrderByNumber(poNumber: string) {
  return useQuery({
    queryKey: queryKeys.finance.purchaseOrders.byNumber(poNumber),
    queryFn: () => fetchPurchaseOrderByNumber(poNumber),
    enabled: Boolean(poNumber)
  });
}

export function usePurchaseOrder(id: string) {
  return useQuery({ queryKey: queryKeys.finance.purchaseOrders.detail(id), queryFn: () => fetchPurchaseOrder(id) });
}

export function useCreatePurchaseOrder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: PurchaseOrder) => createPurchaseOrder(payload),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.finance.purchaseOrders.all })
  });
}

export function useDeletePurchaseOrder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePurchaseOrder(id),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.finance.purchaseOrders.all })
  });
}

export function usePurchaseOrderActions() {
  const client = useQueryClient();
  const invalidate = (id: string) => {
    client.invalidateQueries({ queryKey: queryKeys.finance.purchaseOrders.all });
    client.invalidateQueries({ queryKey: queryKeys.finance.purchaseOrders.detail(id) });
  };

  return {
    submit: useMutation({
      mutationFn: (id: string) => submitPurchaseOrder(id),
      onSuccess: (_, id) => invalidate(id)
    }),
    approve: useMutation({
      mutationFn: ({ id, approvedBy }: { id: string; approvedBy: string }) => approvePurchaseOrder(id, approvedBy),
      onSuccess: (_, variables) => invalidate(variables.id)
    }),
    cancel: useMutation({
      mutationFn: (id: string) => cancelPurchaseOrder(id),
      onSuccess: (_, id) => invalidate(id)
    }),
    close: useMutation({
      mutationFn: (id: string) => closePurchaseOrder(id),
      onSuccess: (_, id) => invalidate(id)
    })
  };
}
