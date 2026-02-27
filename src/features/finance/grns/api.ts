import { apiClient } from "@/lib/http/api-client";
import type { GRN } from "@/features/finance/grns/types";

export function fetchGrns() {
  return apiClient.get<GRN[]>("/finance/grns");
}

export function fetchGrn(id: string) {
  return apiClient.get<GRN>(`/finance/grns/${id}`);
}

export function fetchGrnByNumber(grnNumber: string) {
  return apiClient.get<GRN>(`/finance/grns/number/${encodeURIComponent(grnNumber)}`);
}

export function fetchGrnsByPurchaseOrder(purchaseOrderId: string) {
  return apiClient.get<GRN[]>(`/finance/grns/purchase-order/${purchaseOrderId}`);
}

export function fetchRecentGrns(days: number) {
  return apiClient.get<GRN[]>(`/finance/grns/recent/${days}`);
}

export function createGrn(values: GRN) {
  return apiClient.post<GRN>("/finance/grns", values);
}

export function deleteGrn(id: string) {
  return apiClient.del<void>(`/finance/grns/${id}`);
}
