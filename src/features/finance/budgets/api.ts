import { apiClient } from "@/lib/http/api-client";
import type { ProjectBudget, ProjectBudgetCreate, BudgetLineItem } from "@/features/finance/budgets/types";

export function fetchBudgets() {
  return apiClient.get<ProjectBudget[]>("/finance/budgets");
}

export function fetchBudgetsByStatus(status: string) {
  return apiClient.get<ProjectBudget[]>(`/finance/budgets/status/${encodeURIComponent(status)}`);
}

export function fetchBudgetsByProject(projectId: string) {
  return apiClient.get<ProjectBudget>(`/finance/budgets/project/${projectId}`);
}

export function fetchBudget(id: string) {
  return apiClient.get<ProjectBudget>(`/finance/budgets/${id}`);
}

export function fetchBudgetSummary(id: string) {
  return apiClient.get<ProjectBudget>(`/finance/budgets/${id}/summary`);
}

export function createBudget(payload: ProjectBudgetCreate) {
  return apiClient.post<ProjectBudget>("/finance/budgets", payload);
}

export function updateBudgetTotalValue(id: string, totalValue: number) {
  return apiClient.patch<ProjectBudget>(`/finance/budgets/${id}/total-value?totalValue=${totalValue}`);
}

export function approveBudget(id: string, approvedBy: string) {
  return apiClient.post<ProjectBudget>(`/finance/budgets/${id}/approve?approvedBy=${approvedBy}`);
}

export function lockBudget(id: string) {
  return apiClient.post<ProjectBudget>(`/finance/budgets/${id}/lock`);
}

export function unlockBudget(id: string) {
  return apiClient.post<ProjectBudget>(`/finance/budgets/${id}/unlock`);
}

export function closeBudget(id: string) {
  return apiClient.post<ProjectBudget>(`/finance/budgets/${id}/close`);
}

export function deleteBudget(id: string) {
  return apiClient.del<void>(`/finance/budgets/${id}`);
}

export function fetchBudgetLineItems(budgetId: string) {
  return apiClient.get<BudgetLineItem[]>(`/finance/budget-line-items/budget/${budgetId}`);
}

export function fetchBudgetLineItem(id: string) {
  return apiClient.get<BudgetLineItem>(`/finance/budget-line-items/${id}`);
}

export function fetchBudgetLineItemByCostCode(budgetId: string, costCodeId: string) {
  return apiClient.get<BudgetLineItem>(`/finance/budget-line-items/budget/${budgetId}/cost-code/${costCodeId}`);
}

export function createBudgetLineItem(payload: { budgetId: string; costCodeId: string; allocatedAmount: number; notes?: string }) {
  return apiClient.post<BudgetLineItem>("/finance/budget-line-items", payload);
}

export function updateBudgetLineItem(id: string, payload: { allocatedAmount: number; notes?: string | null }) {
  return apiClient.put<BudgetLineItem>(`/finance/budget-line-items/${id}`, payload);
}

export function deleteBudgetLineItem(id: string) {
  return apiClient.del<void>(`/finance/budget-line-items/${id}`);
}
