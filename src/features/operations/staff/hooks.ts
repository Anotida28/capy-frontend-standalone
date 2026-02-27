"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/http/query-keys";
import { fetchStaff, fetchStaffMember, createStaff, updateStaff, deleteStaff } from "@/features/operations/staff/api";
import type { Staff } from "@/features/operations/staff/types";

export function useStaff() {
  return useQuery({ queryKey: queryKeys.operations.staff.list(), queryFn: fetchStaff });
}

export function useStaffMember(id: string) {
  return useQuery({
    queryKey: queryKeys.operations.staff.detail(id),
    queryFn: () => fetchStaffMember(id),
    enabled: Boolean(id)
  });
}

export function useCreateStaff() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: Staff) => createStaff(payload),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.operations.staff.all })
  });
}

export function useUpdateStaff() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Staff }) => updateStaff(id, payload),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.operations.staff.all })
  });
}

export function useDeleteStaff() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteStaff(id),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.operations.staff.all })
  });
}
