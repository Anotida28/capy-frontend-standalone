"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/http/query-keys";
import { fetchTimesheets, fetchTimesheet, updateTimesheet } from "@/features/operations/timesheets/api";
import type { TimesheetEntry } from "@/features/operations/timesheets/types";

export function useTimesheets() {
  return useQuery({
    queryKey: queryKeys.operations.timesheets.list(),
    queryFn: fetchTimesheets
  });
}

export function useTimesheet(id: string) {
  return useQuery({
    queryKey: queryKeys.operations.timesheets.detail(id),
    queryFn: () => fetchTimesheet(id),
    enabled: Boolean(id)
  });
}

export function useUpdateTimesheet() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<TimesheetEntry> }) =>
      updateTimesheet(id, payload),
    onSuccess: (_, variables) => {
      client.invalidateQueries({ queryKey: queryKeys.operations.timesheets.all });
      client.invalidateQueries({ queryKey: queryKeys.operations.timesheets.detail(variables.id) });
    }
  });
}
