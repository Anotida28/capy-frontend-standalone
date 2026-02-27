"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/http/query-keys";
import {
  createCostCode,
  deleteCostCode,
  fetchCostCodes,
  fetchCostCodeById,
  fetchCostCodeByCode,
  fetchCostCodesByCategory,
  fetchActiveCostCodes,
  updateCostCode,
  deactivateCostCode,
  searchCostCodes
} from "@/features/finance/cost-codes/api";
import type { CostCode } from "@/features/finance/cost-codes/types";

export function useCostCodes() {
  return useQuery({ queryKey: queryKeys.finance.costCodes.list(), queryFn: fetchCostCodes });
}

export function useCostCode(id: string) {
  return useQuery({
    queryKey: queryKeys.finance.costCodes.detail(id),
    queryFn: () => fetchCostCodeById(id),
    enabled: Boolean(id)
  });
}

export function useCostCodeByCode(code: string) {
  return useQuery({
    queryKey: queryKeys.finance.costCodes.byCode(code),
    queryFn: () => fetchCostCodeByCode(code),
    enabled: Boolean(code)
  });
}

export function useCostCodesByCategory(category: string) {
  return useQuery({
    queryKey: queryKeys.finance.costCodes.byCategory(category),
    queryFn: () => fetchCostCodesByCategory(category),
    enabled: Boolean(category)
  });
}

export function useActiveCostCodes(enabled = true) {
  return useQuery({
    queryKey: queryKeys.finance.costCodes.active(),
    queryFn: fetchActiveCostCodes,
    enabled
  });
}

export function useCostCodeSearch(term: string) {
  return useQuery({
    queryKey: queryKeys.finance.costCodes.search(term),
    queryFn: () => searchCostCodes(term),
    enabled: Boolean(term)
  });
}

export function useCreateCostCode() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: CostCode) => createCostCode(payload),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.finance.costCodes.all })
  });
}

export function useUpdateCostCode() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CostCode }) => updateCostCode(id, payload),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.finance.costCodes.all })
  });
}

export function useDeleteCostCode() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCostCode(id),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.finance.costCodes.all })
  });
}

export function useDeactivateCostCode() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateCostCode(id),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.finance.costCodes.all })
  });
}
