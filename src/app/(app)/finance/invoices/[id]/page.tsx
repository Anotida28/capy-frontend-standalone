"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import PageHeader from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { SectionCard } from "@/components/layout/section-card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Table, TableRoot } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useInvoice, useDeleteInvoice, useInvoiceActions } from "@/features/finance/invoices/hooks";
import { useThreeWayMatchActions, useThreeWayMatchByInvoiceLine } from "@/features/finance/three-way-match/hooks";
import type { ThreeWayMatch } from "@/features/finance/three-way-match/types";
import { formatMoney } from "@/lib/utils/money";
import { formatDateTime } from "@/lib/utils/date";
import { getStatusTone } from "@/lib/utils/status-tone";
import { useCanEdit } from "@/lib/auth/require-role";
import { useToast } from "@/components/ui/toast";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const invoiceQuery = useInvoice(id);
  const deleteMutation = useDeleteInvoice();
  const actions = useInvoiceActions();
  const threeWayActions = useThreeWayMatchActions();
  const canEdit = useCanEdit();
  const { notify } = useToast();
  const [showDelete, setShowDelete] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentBy, setPaymentBy] = useState("");
  const [showApprove, setShowApprove] = useState(false);
  const [approvedBy, setApprovedBy] = useState("");
  const [matchResults, setMatchResults] = useState<ThreeWayMatch[] | null>(null);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [manualApprove, setManualApprove] = useState<{ matchId: string } | null>(null);
  const [reviewerId, setReviewerId] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const formatPercent = (value?: number | null) => (typeof value === "number" ? `${value.toFixed(2)}%` : "-");

  const lineMatchQuery = useThreeWayMatchByInvoiceLine(selectedLineId ?? "");

  const invoice = invoiceQuery.data;

  const runMatch = async () => {
    if (!invoice?.id) return;
    try {
      const results = await threeWayActions.runForInvoice.mutateAsync(invoice.id);
      setMatchResults(results ?? []);
      notify({ message: "3-way match completed", tone: "success" });
    } catch {
      notify({ message: "Unable to run 3-way match", tone: "error" });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      notify({ message: "Invoice deleted", tone: "success" });
      router.push("/finance/invoices");
    } catch {
      notify({ message: "Unable to delete invoice", tone: "error" });
    } finally {
      setShowDelete(false);
    }
  };

  const handleApprove = async () => {
    if (!approvedBy) return;
    try {
      await actions.approve.mutateAsync({ id, approvedBy });
      notify({ message: "Invoice approved", tone: "success" });
      setShowApprove(false);
      setApprovedBy("");
    } catch {
      notify({ message: "Unable to approve invoice", tone: "error" });
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    try {
      await actions.reject.mutateAsync({ id, reason: rejectReason.trim() });
      notify({ message: "Invoice rejected", tone: "success" });
      setShowReject(false);
      setRejectReason("");
    } catch {
      notify({ message: "Unable to reject invoice", tone: "error" });
    }
  };

  const handlePayment = async () => {
    if (!paymentBy || !paymentReference) return;
    try {
      await actions.payment.mutateAsync({ id, amount: paymentAmount, paidBy: paymentBy, paymentReference });
      notify({ message: "Payment recorded", tone: "success" });
      setShowPayment(false);
    } catch {
      notify({ message: "Unable to record payment", tone: "error" });
    }
  };

  const handleManualApprove = async () => {
    if (!manualApprove || !reviewerId) return;
    try {
      await threeWayActions.manualApprove.mutateAsync({ matchId: manualApprove.matchId, reviewerId, notes: manualNotes || undefined });
      notify({ message: "Match approved", tone: "success" });
      setManualApprove(null);
      setReviewerId("");
      setManualNotes("");
    } catch {
      notify({ message: "Unable to approve match", tone: "error" });
    }
  };

  const matchSummary = useMemo(() => {
    if (!matchResults) return null;
    const requiresReview = matchResults.filter((m) => m.requiresReview).length;
    const autoApproved = matchResults.filter((m) => m.autoApproved).length;
    return { total: matchResults.length, requiresReview, autoApproved };
  }, [matchResults]);

  if (invoiceQuery.isLoading) {
    return <Skeleton className="surface-card" />;
  }

  if (invoiceQuery.error || !invoice) {
    return <ErrorState message="Unable to load invoice." />;
  }

  return (
    <PageShell>
      <PageHeader
        title={`Invoice ${invoice.invoiceNumber}`}
        subtitle={`Vendor ${invoice.vendorId} • ${invoice.status ?? "PENDING"}`}
        actions={
          canEdit ? (
            <div className="toolbar">
              <Button variant="ghost" onClick={() => { setApprovedBy(invoice.receivedBy); setShowApprove(true); }}>Approve</Button>
              <Button variant="ghost" onClick={() => setShowReject(true)}>Reject</Button>
              <Button variant="ghost" onClick={() => setShowPayment(true)}>Record Payment</Button>
              <Button variant="ghost" onClick={() => setShowDelete(true)}>Delete</Button>
            </div>
          ) : null
        }
      />

      <SectionCard>
        <div className="form-grid">
          <div>
            <p className="muted">Status</p>
            <Badge label={invoice.status ?? "PENDING"} tone={getStatusTone(invoice.status ?? "PENDING")} />
          </div>
          <div>
            <p className="muted">Vendor</p>
            <p className="table-title">{invoice.vendorId}</p>
            <Button variant="ghost" onClick={() => router.push(`/operations/vendors/${invoice.vendorId}`)}>
              View Vendor
            </Button>
          </div>
          <div>
            <p className="muted">Invoice Date</p>
            <p className="table-title">{invoice.invoiceDate ?? "-"}</p>
          </div>
          <div>
            <p className="muted">Due Date</p>
            <p className="table-title">{invoice.dueDate ?? "-"}</p>
          </div>
          <div>
            <p className="muted">Total Amount</p>
            <p className="table-title">{formatMoney(invoice.invoiceAmount)}</p>
          </div>
          <div>
            <p className="muted">Purchase Order</p>
            <p className="table-title">{invoice.purchaseOrderId ?? "-"}</p>
          </div>
          <div>
            <p className="muted">Approved By</p>
            <p className="table-title">{invoice.approvedBy ?? "-"}</p>
          </div>
          <div>
            <p className="muted">Approved At</p>
            <p className="table-title">{formatDateTime(invoice.approvedAt)}</p>
          </div>
          <div>
            <p className="muted">Paid By</p>
            <p className="table-title">{invoice.paidBy ?? "-"}</p>
          </div>
          <div>
            <p className="muted">Paid At</p>
            <p className="table-title">{formatDateTime(invoice.paidAt)}</p>
          </div>
          <div>
            <p className="muted">Payment Reference</p>
            <p className="table-title">{invoice.paymentReference ?? "-"}</p>
          </div>
          <div>
            <p className="muted">Paid Amount</p>
            <p className="table-title">{invoice.paidAmount == null ? "-" : formatMoney(invoice.paidAmount)}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <div className="section-header">
          <h2>Line Items</h2>
          <p className="muted">Invoice line details.</p>
        </div>
        {invoice.lineItems && invoice.lineItems.length > 0 ? (
          <Table>
            <TableRoot>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                  <th>Price Variance</th>
                  <th>Qty Variance</th>
                  <th>Matched</th>
                  <th>Match Notes</th>
                  <th className="actions-cell">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item) => (
                  <tr key={item.id ?? item.description}>
                    <td>{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>{formatMoney(item.unitPrice)}</td>
                    <td>{formatMoney(item.unitPrice * item.quantity)}</td>
                    <td>{item.priceVariance == null ? "-" : formatMoney(item.priceVariance)}</td>
                    <td>{item.quantityVariance ?? "-"}</td>
                    <td>
                      {item.matched == null ? "-" : (
                        <Badge
                          label={item.matched ? "Matched" : "Mismatch"}
                          tone={item.matched ? "approved" : "rejected"}
                        />
                      )}
                    </td>
                    <td><span className="muted">{item.matchNotes ?? "-"}</span></td>
                    <td className="actions-cell">
                      <div className="row-actions">
                        <Button
                          variant="ghost"
                          onClick={() => setSelectedLineId(item.id ?? null)}
                          disabled={!item.id}
                        >
                          Check Match
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableRoot>
          </Table>
        ) : (
          <p className="muted">No line items on this invoice.</p>
        )}
      </SectionCard>

      <SectionCard>
        <div className="section-header">
          <h2>3-Way Match</h2>
          <p className="muted">Compare PO, GRN, and invoice data.</p>
        </div>
        <Button onClick={runMatch} disabled={threeWayActions.runForInvoice.isPending}>
          {threeWayActions.runForInvoice.isPending ? "Running..." : "Run Match"}
        </Button>
        {matchSummary ? (
          <div className="surface-card" style={{ marginTop: "1rem" }}>
            <p className="table-title">Matches: {matchSummary.total}</p>
            <p className="muted">Requires Review: {matchSummary.requiresReview}</p>
            <p className="muted">Auto Approved: {matchSummary.autoApproved}</p>
            {matchResults && matchResults.length > 0 ? (
              <div style={{ marginTop: "0.75rem" }}>
                {matchResults.map((match) => {
                  const matchId = match.id;
                  return (
                    <div key={matchId ?? match.invoiceLineItemId} className="surface-card" style={{ marginBottom: "0.5rem" }}>
                      <p className="table-title">Match {match.matchResult}</p>
                      {match.matchNotes ? <p className="muted">{match.matchNotes}</p> : null}
                      <div className="form-grid" style={{ marginTop: "0.5rem" }}>
                        <div>
                          <p className="muted">Qty Tolerance</p>
                          <p className="table-title">{formatPercent(match.quantityTolerancePercentage)}</p>
                        </div>
                        <div>
                          <p className="muted">Price Tolerance</p>
                          <p className="table-title">{formatPercent(match.priceTolerancePercentage)}</p>
                        </div>
                        <div>
                          <p className="muted">Match Successful</p>
                          {match.matchSuccessful == null ? (
                            <p className="table-title">-</p>
                          ) : (
                            <Badge label={match.matchSuccessful ? "Yes" : "No"} tone={match.matchSuccessful ? "approved" : "rejected"} />
                          )}
                        </div>
                        <div>
                          <p className="muted">Reviewed By</p>
                          <p className="table-title">{match.reviewedBy ?? "-"}</p>
                        </div>
                        <div>
                          <p className="muted">Reviewed At</p>
                          <p className="table-title">{formatDateTime(match.reviewedAt)}</p>
                        </div>
                      </div>
                      {match.requiresReview && matchId ? (
                        <Button variant="ghost" onClick={() => setManualApprove({ matchId })}>
                          Manual Approve
                        </Button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}
      </SectionCard>

      <ConfirmDialog
        open={showDelete}
        title="Delete invoice?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        confirmTone="destructive"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />

      <Modal open={showReject} title="Reject Invoice" onClose={() => setShowReject(false)}>
        <ModalBody>
          <FormField label="Reason" htmlFor="reject-reason">
            <Input id="reject-reason" value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} />
          </FormField>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowReject(false)}>Cancel</Button>
          <Button onClick={handleReject} disabled={!rejectReason.trim()}>Reject</Button>
        </ModalFooter>
      </Modal>

      <Modal open={showPayment} title="Record Payment" onClose={() => setShowPayment(false)}>
        <ModalBody>
          <div className="form-grid">
            <FormField label="Amount" htmlFor="payment-amount">
              <Input
                id="payment-amount"
                type="number"
                value={paymentAmount}
                onChange={(event) => setPaymentAmount(Number(event.target.value))}
              />
            </FormField>
            <FormField label="Paid By (Staff ID)" htmlFor="payment-by">
              <Input id="payment-by" value={paymentBy} onChange={(event) => setPaymentBy(event.target.value)} />
            </FormField>
            <FormField label="Reference" htmlFor="payment-reference" className="full-width">
              <Input id="payment-reference" value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} />
            </FormField>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowPayment(false)}>Cancel</Button>
          <Button onClick={handlePayment} disabled={!paymentBy || !paymentReference}>Record</Button>
        </ModalFooter>
      </Modal>

      <Modal open={showApprove} title="Approve Invoice" onClose={() => setShowApprove(false)}>
        <ModalBody>
          <FormField label="Approved By (Staff ID)" htmlFor="approved-by">
            <Input id="approved-by" value={approvedBy} onChange={(event) => setApprovedBy(event.target.value)} />
          </FormField>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowApprove(false)}>Cancel</Button>
          <Button onClick={handleApprove} disabled={!approvedBy}>Approve</Button>
        </ModalFooter>
      </Modal>

      <Modal open={Boolean(selectedLineId)} title="Line Item Match" onClose={() => setSelectedLineId(null)}>
        <ModalBody>
          {lineMatchQuery.isLoading ? (
            <p className="muted">Loading match details...</p>
          ) : lineMatchQuery.error || !lineMatchQuery.data ? (
            <p className="muted">Match not found for this line item.</p>
          ) : (
            (() => {
              const matchId = lineMatchQuery.data.id;
              return (
                <div>
                  <p className="table-title">Result: {lineMatchQuery.data.matchResult}</p>
                  {lineMatchQuery.data.matchNotes ? <p className="muted">{lineMatchQuery.data.matchNotes}</p> : null}
                  {lineMatchQuery.data.requiresReview && matchId ? (
                    <Button variant="ghost" onClick={() => setManualApprove({ matchId })}>
                      Manual Approve
                    </Button>
                  ) : null}
                </div>
              );
            })()
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setSelectedLineId(null)}>Close</Button>
        </ModalFooter>
      </Modal>

      <Modal open={Boolean(manualApprove)} title="Manual Approve Match" onClose={() => setManualApprove(null)}>
        <ModalBody>
          <div className="form-grid">
            <FormField label="Reviewer ID" htmlFor="reviewer-id">
              <Input id="reviewer-id" value={reviewerId} onChange={(event) => setReviewerId(event.target.value)} />
            </FormField>
            <FormField label="Notes" htmlFor="reviewer-notes" className="full-width">
              <Input id="reviewer-notes" value={manualNotes} onChange={(event) => setManualNotes(event.target.value)} />
            </FormField>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setManualApprove(null)}>Cancel</Button>
          <Button onClick={handleManualApprove} disabled={!reviewerId}>Approve</Button>
        </ModalFooter>
      </Modal>
    </PageShell>
  );
}
