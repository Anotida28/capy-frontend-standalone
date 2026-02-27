"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/http/query-keys";
import {
  fetchGrns,
  fetchGrn,
  fetchGrnByNumber,
  fetchGrnsByPurchaseOrder,
  fetchRecentGrns,
  createGrn,
  deleteGrn
} from "@/features/finance/grns/api";
import type { GRN } from "@/features/finance/grns/types";

export function useGrns(enabled = true) {
  return useQuery({ queryKey: queryKeys.finance.grns.list(), queryFn: fetchGrns, enabled });
}

export function useGrn(id: string) {
  return useQuery({
    queryKey: queryKeys.finance.grns.detail(id),
    queryFn: () => fetchGrn(id),
    enabled: Boolean(id)
  });
}

export function useGrnByNumber(grnNumber: string) {
  return useQuery({
    queryKey: queryKeys.finance.grns.byNumber(grnNumber),
    queryFn: () => fetchGrnByNumber(grnNumber),
    enabled: Boolean(grnNumber)
  });
}

export function useGrnsByPurchaseOrder(purchaseOrderId: string) {
  return useQuery({
    queryKey: queryKeys.finance.grns.byPurchaseOrder(purchaseOrderId),
    queryFn: () => fetchGrnsByPurchaseOrder(purchaseOrderId),
    enabled: Boolean(purchaseOrderId)
  });
}

export function useRecentGrns(days: number, enabled = false) {
  return useQuery({
    queryKey: queryKeys.finance.grns.recent(days),
    queryFn: () => fetchRecentGrns(days),
    enabled
  });
}

export function useCreateGrn() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: GRN) => createGrn(payload),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.finance.grns.all })
  });
}

export function useDeleteGrn() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGrn(id),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.finance.grns.all })
  });
}
