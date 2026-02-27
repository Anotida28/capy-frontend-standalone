import { apiClient } from "@/lib/http/api-client";
import type { TimesheetEntry } from "@/features/operations/timesheets/types";

export function fetchTimesheets() {
  return apiClient.get<TimesheetEntry[]>("/timesheets");
}

export function fetchTimesheet(id: string) {
  return apiClient.get<TimesheetEntry>(`/timesheets/${id}`);
}

export function updateTimesheet(id: string, payload: Partial<TimesheetEntry>) {
  return apiClient.put<TimesheetEntry>(`/timesheets/${id}`, payload);
}
