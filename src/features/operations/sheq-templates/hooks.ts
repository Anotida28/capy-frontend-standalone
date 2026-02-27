"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/http/query-keys";
import {
  fetchSheqTemplates,
  fetchSheqTemplate,
  createSheqTemplate,
  updateSheqTemplate,
  deleteSheqTemplate
} from "@/features/operations/sheq-templates/api";
import type { SheqTemplate } from "@/features/operations/sheq-templates/types";

export function useSheqTemplates() {
  return useQuery({ queryKey: queryKeys.operations.sheqTemplates.list(), queryFn: fetchSheqTemplates });
}

export function useSheqTemplate(id: string) {
  return useQuery({
    queryKey: queryKeys.operations.sheqTemplates.detail(id),
    queryFn: () => fetchSheqTemplate(id),
    enabled: Boolean(id)
  });
}

export function useCreateSheqTemplate() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: SheqTemplate) => createSheqTemplate(payload),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.operations.sheqTemplates.all })
  });
}

export function useUpdateSheqTemplate() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SheqTemplate }) => updateSheqTemplate(id, payload),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.operations.sheqTemplates.all })
  });
}

export function useDeleteSheqTemplate() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSheqTemplate(id),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.operations.sheqTemplates.all })
  });
}
