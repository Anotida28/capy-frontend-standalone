"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/http/query-keys";
import {
  createAllocation,
  updateAllocation,
  deleteAllocation,
  fetchAssetAllocations
} from "@/features/operations/asset-allocations/api";
import type { AssetAllocation } from "@/features/operations/asset-allocations/types";

export function useAssetAllocations() {
  return useQuery({
    queryKey: queryKeys.operations.assetAllocations.list(),
    queryFn: fetchAssetAllocations
  });
}

export function useCreateAllocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssetAllocation) => createAllocation(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.operations.assetAllocations.all })
  });
}

export function useUpdateAllocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AssetAllocation }) => updateAllocation(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.operations.assetAllocations.all })
  });
}

export function useDeleteAllocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAllocation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.operations.assetAllocations.all })
  });
}
