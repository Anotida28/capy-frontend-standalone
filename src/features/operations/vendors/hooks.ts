"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/http/query-keys";
import { fetchVendors, fetchVendor, createVendor, updateVendor, deleteVendor } from "@/features/operations/vendors/api";
import type { Vendor } from "@/features/operations/vendors/types";

export function useVendors() {
  return useQuery({ queryKey: queryKeys.operations.vendors.list(), queryFn: fetchVendors });
}

export function useVendor(id: string) {
  return useQuery({
    queryKey: queryKeys.operations.vendors.detail(id),
    queryFn: () => fetchVendor(id),
    enabled: Boolean(id)
  });
}

export function useCreateVendor() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: Vendor) => createVendor(payload),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.operations.vendors.all })
  });
}

export function useUpdateVendor() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Vendor }) => updateVendor(id, payload),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.operations.vendors.all })
  });
}

export function useDeleteVendor() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteVendor(id),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.operations.vendors.all })
  });
}
