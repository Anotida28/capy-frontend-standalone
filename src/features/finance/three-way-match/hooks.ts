"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/http/query-keys";
import {
  fetchMatchesRequiringReview,
  performThreeWayMatchForInvoice,
  fetchMatchByInvoiceLine,
  manualApproveMatch
} from "@/features/finance/three-way-match/api";

export function useThreeWayMatchReview() {
  return useQuery({ queryKey: queryKeys.finance.threeWayMatch.requiringReview(), queryFn: fetchMatchesRequiringReview });
}

export function useThreeWayMatchForInvoice(invoiceId: string) {
  return useQuery({
    queryKey: queryKeys.finance.threeWayMatch.byInvoice(invoiceId),
    queryFn: () => performThreeWayMatchForInvoice(invoiceId),
    enabled: Boolean(invoiceId)
  });
}

export function useThreeWayMatchByInvoiceLine(invoiceLineItemId: string) {
  return useQuery({
    queryKey: queryKeys.finance.threeWayMatch.byInvoiceLine(invoiceLineItemId),
    queryFn: () => fetchMatchByInvoiceLine(invoiceLineItemId),
    enabled: Boolean(invoiceLineItemId)
  });
}

export function useThreeWayMatchActions() {
  const client = useQueryClient();
  return {
    runForInvoice: useMutation({
      mutationFn: (invoiceId: string) => performThreeWayMatchForInvoice(invoiceId),
      onSuccess: (_, invoiceId) => {
        client.invalidateQueries({ queryKey: queryKeys.finance.threeWayMatch.byInvoice(invoiceId) });
        client.invalidateQueries({ queryKey: queryKeys.finance.threeWayMatch.requiringReview() });
      }
    }),
    manualApprove: useMutation({
      mutationFn: ({ matchId, reviewerId, notes }: { matchId: string; reviewerId: string; notes?: string }) =>
        manualApproveMatch(matchId, reviewerId, notes),
      onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.finance.threeWayMatch.all })
    })
  };
}
