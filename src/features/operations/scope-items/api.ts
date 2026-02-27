import { apiClient } from "@/lib/http/api-client";
import type { ScopeItem } from "@/features/operations/scope-items/types";

function toPayload(values: ScopeItem) {
  return {
    project: { id: values.projectId },
    boqCode: values.boqCode ?? null,
    targetQuantity: values.targetQuantity ?? null,
    laborNormFactor: values.laborNormFactor ?? null,
    plannedHours: values.plannedHours ?? null,
    isOverridden: values.isOverridden ?? false,
    overrideReason: values.overrideReason ?? null
  };
}

export function createScopeItem(values: ScopeItem) {
  return apiClient.post<ScopeItemResponse>("/scope-items", toPayload(values)).then(normalizeScopeItem);
}

export function updateScopeItem(id: string, values: ScopeItem) {
  return apiClient.put<ScopeItemResponse>(`/scope-items/${id}`, toPayload(values)).then(normalizeScopeItem);
}

export function deleteScopeItem(id: string) {
  return apiClient.del<void>(`/scope-items/${id}`);
}

export function fetchScopeItems() {
  return apiClient.get<ScopeItemResponse[]>("/scope-items").then((list) => list.map(normalizeScopeItem));
}

export function fetchScopeItem(id: string) {
  return apiClient.get<ScopeItemResponse>(`/scope-items/${id}`).then(normalizeScopeItem);
}

type ScopeItemResponse = ScopeItem & {
  project?: { id?: string; name?: string };
};

function normalizeScopeItem(item: ScopeItemResponse): ScopeItem {
  return {
    id: item.id,
    projectId: item.projectId ?? item.project?.id ?? "",
    projectName: item.projectName ?? item.project?.name ?? null,
    boqCode: item.boqCode ?? null,
    targetQuantity: item.targetQuantity ?? null,
    laborNormFactor: item.laborNormFactor ?? null,
    plannedHours: item.plannedHours ?? null,
    isOverridden: item.isOverridden ?? false,
    overrideReason: item.overrideReason ?? null
  };
}
