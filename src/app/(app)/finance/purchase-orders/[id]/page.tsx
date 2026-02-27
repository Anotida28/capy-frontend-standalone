"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import PageHeader from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { SectionCard } from "@/components/layout/section-card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Table, TableRoot } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { usePurchaseOrder, usePurchaseOrderActions, useDeletePurchaseOrder } from "@/features/finance/purchase-orders/hooks";
import { formatMoney } from "@/lib/utils/money";
import { formatDateTime } from "@/lib/utils/date";
import { getStatusTone } from "@/lib/utils/status-tone";
import { useCanEdit } from "@/lib/auth/require-role";
import { useToast } from "@/components/ui/toast";

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const orderQuery = usePurchaseOrder(id);
  const actions = usePurchaseOrderActions();
  const deleteMutation = useDeletePurchaseOrder();
  const canEdit = useCanEdit();
  const { notify } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);

  if (orderQuery.isLoading) {
    return <Skeleton className="surface-card" />;
  }

  if (orderQuery.error || !orderQuery.data) {
    return <ErrorState message="Unable to load purchase order." />;
  }

  const po = orderQuery.data;
  const formatPercent = (value?: number | null) => (typeof value === "number" ? `${value.toFixed(2)}%` : "-");

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      notify({ message: "Purchase order deleted", tone: "success" });
      router.push("/finance/purchase-orders");
    } catch {
      notify({ message: "Unable to delete purchase order", tone: "error" });
    } finally {
      setShowConfirm(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await actions.submit.mutateAsync(id);
      notify({ message: "Purchase order submitted", tone: "success" });
    } catch {
      notify({ message: "Unable to submit purchase order", tone: "error" });
    }
  };

  const handleApprove = async () => {
    try {
      await actions.approve.mutateAsync({ id, approvedBy: po.createdBy });
      notify({ message: "Purchase order approved", tone: "success" });
    } catch {
      notify({ message: "Unable to approve purchase order", tone: "error" });
    }
  };

  const handleCancel = async () => {
    try {
      await actions.cancel.mutateAsync(id);
      notify({ message: "Purchase order cancelled", tone: "success" });
    } catch {
      notify({ message: "Unable to cancel purchase order", tone: "error" });
    }
  };

  const handleClose = async () => {
    try {
      await actions.close.mutateAsync(id);
      notify({ message: "Purchase order closed", tone: "success" });
    } catch {
      notify({ message: "Unable to close purchase order", tone: "error" });
    }
  };

  return (
    <PageShell>
      <PageHeader
        title={`PO ${po.poNumber ?? id}`}
        subtitle={`Project ${po.projectId} • ${po.status ?? "DRAFT"}`}
        actions={
          canEdit ? (
            <div className="toolbar">
              <Button variant="ghost" onClick={handleSubmit}>Submit</Button>
              <Button variant="ghost" onClick={handleApprove}>Approve</Button>
              <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
              <Button variant="ghost" onClick={handleClose}>Close</Button>
              <Button variant="ghost" onClick={() => setShowConfirm(true)}>Delete</Button>
            </div>
          ) : null
        }
      />

      <SectionCard>
        <div className="form-grid">
          <div>
            <p className="muted">Vendor</p>
            <p className="table-title">{po.vendorId}</p>
            <Button variant="ghost" onClick={() => router.push(`/operations/vendors/${po.vendorId}`)}>
              View Vendor
            </Button>
          </div>
          <div>
            <p className="muted">Order Date</p>
            <p className="table-title">{po.orderDate ?? "-"}</p>
          </div>
          <div>
            <p className="muted">Expected Delivery</p>
            <p className="table-title">{po.expectedDeliveryDate ?? "-"}</p>
          </div>
          <div>
            <p className="muted">Status</p>
            <Badge label={po.status ?? "DRAFT"} tone={getStatusTone(po.status ?? "DRAFT")} />
          </div>
          <div>
            <p className="muted">Total Value</p>
            <p className="table-title">{formatMoney(po.totalValue ?? 0)}</p>
          </div>
          <div>
            <p className="muted">Received Value</p>
            <p className="table-title">{po.receivedValue == null ? "-" : formatMoney(po.receivedValue)}</p>
          </div>
          <div>
            <p className="muted">Approved By</p>
            <p className="table-title">{po.approvedBy ?? "-"}</p>
          </div>
          <div>
            <p className="muted">Approved At</p>
            <p className="table-title">{formatDateTime(po.approvedAt)}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <div className="section-header">
          <h2>Line Items</h2>
          <p className="muted">Procurement items for this purchase order.</p>
        </div>
        {po.lineItems && po.lineItems.length > 0 ? (
          <Table>
            <TableRoot>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                  <th>Received</th>
                  <th>Remaining</th>
                  <th>Received Value</th>
                  <th>Received %</th>
                </tr>
              </thead>
              <tbody>
                {po.lineItems.map((item) => (
                  <tr key={item.id ?? item.description}>
                    <td>{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>{formatMoney(item.unitPrice)}</td>
                    <td>{formatMoney(item.unitPrice * item.quantity)}</td>
                    <td>{item.receivedQuantity ?? "-"}</td>
                    <td>{item.remainingQuantity ?? "-"}</td>
                    <td>{item.receivedValue == null ? "-" : formatMoney(item.receivedValue)}</td>
                    <td>{formatPercent(item.receivedPercentage)}</td>
                  </tr>
                ))}
              </tbody>
            </TableRoot>
          </Table>
        ) : (
          <p className="muted">No line items on this purchase order.</p>
        )}
      </SectionCard>

      <ConfirmDialog
        open={showConfirm}
        title="Delete purchase order?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        confirmTone="destructive"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </PageShell>
  );
}
