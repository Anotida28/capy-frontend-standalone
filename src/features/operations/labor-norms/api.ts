import { apiClient } from "@/lib/http/api-client";
import type { LaborNorm } from "@/features/operations/labor-norms/types";

export function fetchLaborNorms() {
  return apiClient.get<LaborNorm[]>("/labor-norms");
}

export function fetchLaborNorm(activityCode: string) {
  return apiClient.get<LaborNorm>(`/labor-norms/${encodeURIComponent(activityCode)}`);
}

export function createLaborNorm(values: LaborNorm) {
  return apiClient.post<LaborNorm>("/labor-norms", values);
}

export function updateLaborNorm(activityCode: string, values: LaborNorm) {
  return apiClient.put<LaborNorm>(`/labor-norms/${activityCode}`, values);
}

export function deleteLaborNorm(activityCode: string) {
  return apiClient.del<void>(`/labor-norms/${activityCode}`);
}
