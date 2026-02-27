import { apiClient } from "@/lib/http/api-client";
import type { CostCode } from "@/features/finance/cost-codes/types";

export function fetchCostCodes() {
  return apiClient.get<CostCode[]>("/finance/cost-codes");
}

export function fetchCostCodeById(id: string) {
  return apiClient.get<CostCode>(`/finance/cost-codes/${id}`);
}

export function fetchCostCodeByCode(code: string) {
  return apiClient.get<CostCode>(`/finance/cost-codes/code/${encodeURIComponent(code)}`);
}

export function fetchCostCodesByCategory(category: string) {
  return apiClient.get<CostCode[]>(`/finance/cost-codes/category/${encodeURIComponent(category)}`);
}

export function searchCostCodes(name: string) {
  return apiClient.get<CostCode[]>(`/finance/cost-codes/search?name=${encodeURIComponent(name)}`);
}

export function fetchActiveCostCodes() {
  return apiClient.get<CostCode[]>("/finance/cost-codes/active");
}

export function createCostCode(payload: CostCode) {
  return apiClient.post<CostCode>("/finance/cost-codes", payload);
}

export function updateCostCode(id: string, payload: CostCode) {
  return apiClient.put<CostCode>(`/finance/cost-codes/${id}`, payload);
}

export function deleteCostCode(id: string) {
  return apiClient.del<void>(`/finance/cost-codes/${id}`);
}

export function deactivateCostCode(id: string) {
  return apiClient.patch<CostCode>(`/finance/cost-codes/${id}/deactivate`);
}
