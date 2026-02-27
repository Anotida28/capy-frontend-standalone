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
import { useGrn, useDeleteGrn } from "@/features/finance/grns/hooks";
import { formatDate } from "@/lib/utils/date";
import { useCanEdit } from "@/lib/auth/require-role";
import { useToast } from "@/components/ui/toast";

export default function GrnDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const grnQuery = useGrn(id);
  const deleteMutation = useDeleteGrn();
  const canEdit = useCanEdit();
  const { notify } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);

  if (grnQuery.isLoading) {
    return <Skeleton className="surface-card" />;
  }

  if (grnQuery.error || !grnQuery.data) {
    return <ErrorState message="Unable to load GRN." />;
  }

  const grn = grnQuery.data;
  const formatPercent = (value?: number | null) => (typeof value === "number" ? `${value.toFixed(2)}%` : "-");

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      notify({ message: "GRN deleted", tone: "success" });
      router.push("/finance/grns");
    } catch {
      notify({ message: "Unable to delete GRN", tone: "error" });
    } finally {
      setShowConfirm(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        title={`GRN ${grn.grnNumber ?? id}`}
        subtitle={`Purchase Order ${grn.purchaseOrderId}`}
        actions={
          canEdit ? (
            <div className="toolbar">
              <Button variant="ghost" onClick={() => setShowConfirm(true)}>Delete</Button>
            </div>
          ) : null
        }
      />

      <SectionCard>
        <div className="form-grid">
          <div>
            <p className="muted">Received Date</p>
            <p className="table-title">{formatDate(grn.receivedDate)}</p>
          </div>
          <div>
            <p className="muted">Received By</p>
            <p className="table-title">{grn.receivedBy}</p>
          </div>
          <div>
            <p className="muted">Delivery Note</p>
            <p className="table-title">{grn.deliveryNote ?? "-"}</p>
          </div>
          <div>
            <p className="muted">Condition Notes</p>
            <p className="table-title">{grn.conditionNotes ?? "-"}</p>
          </div>
          <div>
            <p className="muted">Total Rejected</p>
            <p className="table-title">{grn.totalRejectedQuantity ?? "-"}</p>
          </div>
          <div>
            <p className="muted">All Goods Acceptable</p>
            {grn.allGoodsAcceptable == null ? (
              <p className="table-title">-</p>
            ) : (
              <Badge label={grn.allGoodsAcceptable ? "Yes" : "No"} tone={grn.allGoodsAcceptable ? "approved" : "rejected"} />
            )}
          </div>
          <div className="full-width">
            <Button variant="ghost" onClick={() => router.push(`/finance/purchase-orders/${grn.purchaseOrderId}`)}>
              View Purchase Order
            </Button>
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <div className="section-header">
          <h2>Line Items</h2>
          <p className="muted">Received quantities and conditions.</p>
        </div>
        {grn.lineItems && grn.lineItems.length > 0 ? (
          <Table>
            <TableRoot>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Received</th>
                  <th>Accepted</th>
                  <th>Rejected</th>
                  <th>Acceptance %</th>
                  <th>Fully Accepted</th>
                </tr>
              </thead>
              <tbody>
                {grn.lineItems.map((item) => (
                  <tr key={item.id ?? item.description}>
                    <td>{item.description}</td>
                    <td>{item.receivedQuantity}</td>
                    <td>{item.acceptedQuantity}</td>
                    <td>{item.rejectedQuantity ?? 0}</td>
                    <td>{formatPercent(item.acceptanceRate)}</td>
                    <td>
                      {item.fullyAccepted == null ? "-" : (
                        <Badge label={item.fullyAccepted ? "Yes" : "No"} tone={item.fullyAccepted ? "approved" : "rejected"} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableRoot>
          </Table>
        ) : (
          <p className="muted">No line items on this GRN.</p>
        )}
      </SectionCard>

      <ConfirmDialog
        open={showConfirm}
        title="Delete GRN?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        confirmTone="destructive"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </PageShell>
  );
}
