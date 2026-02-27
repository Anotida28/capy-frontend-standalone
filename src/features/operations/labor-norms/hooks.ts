"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/http/query-keys";
import {
  fetchLaborNorms,
  fetchLaborNorm,
  createLaborNorm,
  updateLaborNorm,
  deleteLaborNorm
} from "@/features/operations/labor-norms/api";
import type { LaborNorm } from "@/features/operations/labor-norms/types";

export function useLaborNorms() {
  return useQuery({ queryKey: queryKeys.operations.laborNorms.list(), queryFn: fetchLaborNorms });
}

export function useLaborNorm(activityCode: string) {
  return useQuery({
    queryKey: queryKeys.operations.laborNorms.detail(activityCode),
    queryFn: () => fetchLaborNorm(activityCode),
    enabled: Boolean(activityCode)
  });
}

export function useCreateLaborNorm() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: LaborNorm) => createLaborNorm(payload),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.operations.laborNorms.all })
  });
}

export function useUpdateLaborNorm() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ activityCode, payload }: { activityCode: string; payload: LaborNorm }) =>
      updateLaborNorm(activityCode, payload),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.operations.laborNorms.all })
  });
}

export function useDeleteLaborNorm() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (activityCode: string) => deleteLaborNorm(activityCode),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.operations.laborNorms.all })
  });
}
