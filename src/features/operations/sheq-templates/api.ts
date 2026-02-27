import { apiClient } from "@/lib/http/api-client";
import type { SheqTemplate } from "@/features/operations/sheq-templates/types";

export function fetchSheqTemplates() {
  return apiClient.get<SheqTemplate[]>("/sheq-templates");
}

export function fetchSheqTemplate(id: string) {
  return apiClient.get<SheqTemplate>(`/sheq-templates/${id}`);
}

export function createSheqTemplate(payload: SheqTemplate) {
  return apiClient.post<SheqTemplate>("/sheq-templates", payload);
}

export function updateSheqTemplate(id: string, payload: SheqTemplate) {
  return apiClient.put<SheqTemplate>(`/sheq-templates/${id}`, payload);
}

export function deleteSheqTemplate(id: string) {
  return apiClient.del<void>(`/sheq-templates/${id}`);
}
