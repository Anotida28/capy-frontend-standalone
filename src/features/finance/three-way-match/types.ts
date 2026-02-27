export type ThreeWayMatch = {
  id?: string;
  invoiceLineItemId: string;
  poLineItemId?: string | null;
  grnLineItemId?: string | null;
  matchResult: string;
  matchNotes?: string | null;
  requiresReview?: boolean;
  autoApproved?: boolean;
  manuallyReviewed?: boolean | null;
  quantityTolerancePercentage?: number | null;
  priceTolerancePercentage?: number | null;
  matchSuccessful?: boolean | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  matchedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};
