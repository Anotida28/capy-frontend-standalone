"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/http/query-keys";
import {
  createScopeItem,
  updateScopeItem,
  deleteScopeItem,
  fetchScopeItems,
  fetchScopeItem
} from "@/features/operations/scope-items/api";
import type { ScopeItem } from "@/features/operations/scope-items/types";

export function useScopeItems() {
  return useQuery({
    queryKey: queryKeys.operations.scopeItems.list(),
    queryFn: fetchScopeItems
  });
}

export function useScopeItem(id: string) {
  return useQuery({
    queryKey: queryKeys.operations.scopeItems.detail(id),
    queryFn: () => fetchScopeItem(id),
    enabled: Boolean(id)
  });
}

export function useCreateScopeItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ScopeItem) => createScopeItem(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.operations.scopeItems.all })
  });
}

export function useUpdateScopeItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ScopeItem }) => updateScopeItem(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.operations.scopeItems.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.operations.scopeItems.detail(variables.id) });
    }
  });
}

export function useDeleteScopeItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteScopeItem(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.operations.scopeItems.all })
  });
}
