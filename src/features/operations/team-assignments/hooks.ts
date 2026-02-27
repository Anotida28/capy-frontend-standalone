"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/http/query-keys";
import {
  createTeamAssignment,
  updateTeamAssignment,
  deleteTeamAssignment,
  fetchTeamAssignments
} from "@/features/operations/team-assignments/api";
import type { TeamAssignmentPayload } from "@/features/operations/team-assignments/types";

export function useTeamAssignments() {
  return useQuery({
    queryKey: queryKeys.operations.teamAssignments.list(),
    queryFn: fetchTeamAssignments
  });
}

export function useCreateTeamAssignment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: TeamAssignmentPayload) => createTeamAssignment(payload),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.operations.teamAssignments.all })
  });
}

export function useUpdateTeamAssignment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TeamAssignmentPayload }) => updateTeamAssignment(id, payload),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.operations.teamAssignments.all })
  });
}

export function useDeleteTeamAssignment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTeamAssignment(id),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.operations.teamAssignments.all })
  });
}
