"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/http/query-keys";
import {
  createMaterial,
  updateMaterial,
  deleteMaterial,
  fetchMaterialCatalog
} from "@/features/operations/material-catalog/api";
import type { MaterialCatalogItem } from "@/features/operations/material-catalog/types";

export function useMaterialCatalog() {
  return useQuery({
    queryKey: queryKeys.operations.materialCatalog.list(),
    queryFn: fetchMaterialCatalog
  });
}

export function useCreateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MaterialCatalogItem) => createMaterial(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.operations.materialCatalog.all })
  });
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemCode, payload }: { itemCode: string; payload: MaterialCatalogItem }) =>
      updateMaterial(itemCode, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.operations.materialCatalog.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.operations.materialCatalog.detail(variables.itemCode) });
    }
  });
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemCode: string) => deleteMaterial(itemCode),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.operations.materialCatalog.all })
  });
}
