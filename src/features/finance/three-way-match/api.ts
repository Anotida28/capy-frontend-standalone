import { apiClient } from "@/lib/http/api-client";
import type { ThreeWayMatch } from "@/features/finance/three-way-match/types";

export function fetchMatchesRequiringReview() {
  return apiClient.get<ThreeWayMatch[]>("/finance/3-way-match/requiring-review");
}

export function performThreeWayMatchForInvoice(invoiceId: string) {
  return apiClient.post<ThreeWayMatch[]>(`/finance/3-way-match/invoice/${invoiceId}`);
}

export function fetchMatchByInvoiceLine(invoiceLineItemId: string) {
  return apiClient.get<ThreeWayMatch>(`/finance/3-way-match/invoice-line/${invoiceLineItemId}`);
}

export function manualApproveMatch(matchId: string, reviewerId: string, notes?: string) {
  const params = new URLSearchParams({ reviewerId });
  if (notes) params.set("notes", notes);
  return apiClient.post<ThreeWayMatch>(`/finance/3-way-match/${matchId}/manual-approve?${params.toString()}`);
}
