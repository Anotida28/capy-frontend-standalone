import { apiClient } from "@/lib/http/api-client";
import type { PurchaseOrder } from "@/features/finance/purchase-orders/types";

export function fetchPurchaseOrders() {
  return apiClient.get<PurchaseOrder[]>("/finance/purchase-orders");
}

export function fetchPurchaseOrderByNumber(poNumber: string) {
  return apiClient.get<PurchaseOrder>(`/finance/purchase-orders/number/${encodeURIComponent(poNumber)}`);
}

export function fetchPurchaseOrdersByProject(projectId: string) {
  return apiClient.get<PurchaseOrder[]>(`/finance/purchase-orders/project/${projectId}`);
}

export function fetchPurchaseOrdersByStatus(status: string) {
  return apiClient.get<PurchaseOrder[]>(`/finance/purchase-orders/status/${encodeURIComponent(status)}`);
}

export function fetchPurchaseOrder(id: string) {
  return apiClient.get<PurchaseOrder>(`/finance/purchase-orders/${id}`);
}

export function createPurchaseOrder(values: PurchaseOrder) {
  return apiClient.post<PurchaseOrder>("/finance/purchase-orders", values);
}

export function submitPurchaseOrder(id: string) {
  return apiClient.post<PurchaseOrder>(`/finance/purchase-orders/${id}/submit`);
}

export function approvePurchaseOrder(id: string, approvedBy: string) {
  return apiClient.post<PurchaseOrder>(`/finance/purchase-orders/${id}/approve?approvedBy=${approvedBy}`);
}

export function cancelPurchaseOrder(id: string) {
  return apiClient.post<PurchaseOrder>(`/finance/purchase-orders/${id}/cancel`);
}

export function closePurchaseOrder(id: string) {
  return apiClient.post<PurchaseOrder>(`/finance/purchase-orders/${id}/close`);
}

export function deletePurchaseOrder(id: string) {
  return apiClient.del<void>(`/finance/purchase-orders/${id}`);
}
