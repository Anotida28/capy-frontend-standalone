import { apiClient } from "@/lib/http/api-client";
import type { DailyLog } from "@/features/operations/daily-logs/types";

export function fetchDailyLogs() {
  return apiClient.get<DailyLog[]>("/daily-logs");
}

export function fetchDailyLog(id: string) {
  return apiClient.get<DailyLog>(`/daily-logs/${id}`);
}

export function createDailyLog(payload: DailyLog) {
  return apiClient.post<DailyLog>("/daily-logs", payload);
}

export function updateDailyLog(id: string, payload: DailyLog) {
  return apiClient.put<DailyLog>(`/daily-logs/${id}`, payload);
}

export function deleteDailyLog(id: string) {
  return apiClient.del<void>(`/daily-logs/${id}`);
}
