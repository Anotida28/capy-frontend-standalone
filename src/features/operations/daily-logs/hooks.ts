"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/http/query-keys";
import { createDailyLog, deleteDailyLog, fetchDailyLog, fetchDailyLogs, updateDailyLog } from "@/features/operations/daily-logs/api";
import type { DailyLog } from "@/features/operations/daily-logs/types";

export function useDailyLogs() {
  return useQuery({ queryKey: queryKeys.operations.dailyLogs.list(), queryFn: fetchDailyLogs });
}

export function useDailyLog(id: string) {
  return useQuery({ queryKey: queryKeys.operations.dailyLogs.detail(id), queryFn: () => fetchDailyLog(id) });
}

export function useCreateDailyLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DailyLog) => createDailyLog(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.operations.dailyLogs.all })
  });
}

export function useUpdateDailyLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: DailyLog }) => updateDailyLog(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.operations.dailyLogs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.operations.dailyLogs.detail(variables.id) });
    }
  });
}

export function useDeleteDailyLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDailyLog(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.operations.dailyLogs.all })
  });
}
