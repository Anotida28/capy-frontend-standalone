"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/http/query-keys";
import {
  approveBudget,
  closeBudget,
  createBudget,
  createBudgetLineItem,
  deleteBudget,
  deleteBudgetLineItem,
  fetchBudget,
  fetchBudgetLineItems,
  fetchBudgetLineItem,
  fetchBudgetLineItemByCostCode,
  fetchBudgets,
  fetchBudgetsByProject,
  fetchBudgetsByStatus,
  fetchBudgetSummary,
  lockBudget,
  unlockBudget,
  updateBudgetLineItem,
  updateBudgetTotalValue
} from "@/features/finance/budgets/api";
import type { ProjectBudgetCreate } from "@/features/finance/budgets/types";

export function useBudgets(enabled = true) {
  return useQuery({ queryKey: queryKeys.finance.budgets.list(), queryFn: fetchBudgets, enabled });
}

export function useBudgetsByStatus(status: string) {
  return useQuery({
    queryKey: queryKeys.finance.budgets.byStatus(status),
    queryFn: () => fetchBudgetsByStatus(status),
    enabled: Boolean(status)
  });
}

export function useBudgetsByProject(projectId: string) {
  return useQuery({
    queryKey: queryKeys.finance.budgets.byProject(projectId),
    queryFn: () => fetchBudgetsByProject(projectId),
    enabled: Boolean(projectId)
  });
}

export function useBudget(id: string) {
  return useQuery({ queryKey: queryKeys.finance.budgets.detail(id), queryFn: () => fetchBudget(id) });
}

export function useBudgetSummary(id: string) {
  return useQuery({ queryKey: queryKeys.finance.budgets.summary(id), queryFn: () => fetchBudgetSummary(id) });
}

export function useBudgetLineItems(budgetId: string) {
  return useQuery({
    queryKey: queryKeys.finance.budgetLineItems.byBudget(budgetId),
    queryFn: () => fetchBudgetLineItems(budgetId)
  });
}

export function useBudgetLineItem(id: string) {
  return useQuery({
    queryKey: queryKeys.finance.budgetLineItems.detail(id),
    queryFn: () => fetchBudgetLineItem(id),
    enabled: Boolean(id)
  });
}

export function useBudgetLineItemByCostCode(budgetId: string, costCodeId: string) {
  return useQuery({
    queryKey: queryKeys.finance.budgetLineItems.byBudgetAndCostCode(budgetId, costCodeId),
    queryFn: () => fetchBudgetLineItemByCostCode(budgetId, costCodeId),
    enabled: Boolean(budgetId) && Boolean(costCodeId)
  });
}

export function useCreateBudget() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProjectBudgetCreate) => createBudget(payload),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.finance.budgets.all })
  });
}

export function useDeleteBudget() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBudget(id),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.finance.budgets.all })
  });
}

export function useBudgetActions() {
  const client = useQueryClient();
  const invalidate = (id: string) => {
    client.invalidateQueries({ queryKey: queryKeys.finance.budgets.all });
    client.invalidateQueries({ queryKey: queryKeys.finance.budgets.detail(id) });
  };

  return {
    updateTotalValue: useMutation({
      mutationFn: ({ id, totalValue }: { id: string; totalValue: number }) => updateBudgetTotalValue(id, totalValue),
      onSuccess: (_, variables) => invalidate(variables.id)
    }),
    approve: useMutation({
      mutationFn: ({ id, approvedBy }: { id: string; approvedBy: string }) => approveBudget(id, approvedBy),
      onSuccess: (_, variables) => invalidate(variables.id)
    }),
    lock: useMutation({
      mutationFn: (id: string) => lockBudget(id),
      onSuccess: (_, id) => invalidate(id)
    }),
    unlock: useMutation({
      mutationFn: (id: string) => unlockBudget(id),
      onSuccess: (_, id) => invalidate(id)
    }),
    close: useMutation({
      mutationFn: (id: string) => closeBudget(id),
      onSuccess: (_, id) => invalidate(id)
    }),
    addLineItem: useMutation({
      mutationFn: createBudgetLineItem,
      onSuccess: (_, variables) => {
        client.invalidateQueries({ queryKey: queryKeys.finance.budgetLineItems.byBudget(variables.budgetId) });
        client.invalidateQueries({ queryKey: queryKeys.finance.budgets.detail(variables.budgetId) });
      }
    }),
    updateLineItem: useMutation({
      mutationFn: ({
        id,
        payload
      }: {
        id: string;
        payload: { allocatedAmount: number; notes?: string | null };
      }) => updateBudgetLineItem(id, payload),
      onSuccess: (_, variables) => {
        client.invalidateQueries({ queryKey: queryKeys.finance.budgetLineItems.detail(variables.id) });
        client.invalidateQueries({ queryKey: queryKeys.finance.budgetLineItems.all });
      }
    }),
    deleteLineItem: useMutation({
      mutationFn: (id: string) => deleteBudgetLineItem(id),
      onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.finance.budgetLineItems.all })
    })
  };
}
