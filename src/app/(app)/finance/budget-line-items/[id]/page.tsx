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
import { BudgetLineItemForm } from "@/features/finance/budgets/components/budget-line-item-form";
import { useBudgetLineItem, useBudgetActions } from "@/features/finance/budgets/hooks";
import { formatMoney } from "@/lib/utils/money";
import { formatDateTime } from "@/lib/utils/date";
import { useCanEdit } from "@/lib/auth/require-role";
import { useToast } from "@/components/ui/toast";

export default function BudgetLineItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const lineItemQuery = useBudgetLineItem(id);
  const actions = useBudgetActions();
  const canEdit = useCanEdit();
  const { notify } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (lineItemQuery.isLoading) {
    return <Skeleton className="surface-card" />;
  }

  if (lineItemQuery.error || !lineItemQuery.data) {
    return <ErrorState message="Unable to load line item." />;
  }

  const lineItem = lineItemQuery.data;
  const formatPercent = (value?: number | null) => (typeof value === "number" ? `${value.toFixed(2)}%` : "-");

  const handleUpdate = async (values: { allocatedAmount: number; notes?: string | null }) => {
    try {
      await actions.updateLineItem.mutateAsync({ id, payload: values });
      notify({ message: "Line item updated", tone: "success" });
      setShowForm(false);
    } catch {
      notify({ message: "Unable to update line item", tone: "error" });
    }
  };

  const handleDelete = async () => {
    try {
      await actions.deleteLineItem.mutateAsync(id);
      notify({ message: "Line item deleted", tone: "success" });
      if (lineItem.budgetId) {
        router.push(`/finance/budgets/${lineItem.budgetId}`);
      } else {
        router.push("/finance/budgets");
      }
    } catch {
      notify({ message: "Unable to delete line item", tone: "error" });
    } finally {
      setShowConfirm(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        title={lineItem.costCodeCode ?? "Budget Line Item"}
        subtitle={lineItem.costCodeName ?? "Line item detail"}
        actions={
          canEdit ? (
            <div className="toolbar">
              <Button variant="ghost" onClick={() => setShowForm(true)}>Edit</Button>
              <Button variant="ghost" onClick={() => setShowConfirm(true)}>Delete</Button>
            </div>
          ) : null
        }
      />

      <SectionCard>
        <div className="form-grid">
          <div>
            <p className="muted">Allocated</p>
            <p className="table-title">{formatMoney(lineItem.allocatedAmount ?? 0)}</p>
          </div>
          <div>
            <p className="muted">Committed</p>
            <p className="table-title">{formatMoney(lineItem.committedAmount ?? 0)}</p>
          </div>
          <div>
            <p className="muted">Spent</p>
            <p className="table-title">{formatMoney(lineItem.spentAmount ?? 0)}</p>
          </div>
          <div>
            <p className="muted">Available</p>
            <p className="table-title">{formatMoney(lineItem.availableAmount ?? 0)}</p>
          </div>
          <div>
            <p className="muted">Utilization</p>
            <p className="table-title">{formatPercent(lineItem.utilizationPercentage)}</p>
          </div>
          <div>
            <p className="muted">Created At</p>
            <p className="table-title">{formatDateTime(lineItem.createdAt)}</p>
          </div>
          <div>
            <p className="muted">Updated At</p>
            <p className="table-title">{formatDateTime(lineItem.updatedAt)}</p>
          </div>
          <div className="full-width">
            <p className="muted">Notes</p>
            <p className="table-title">{lineItem.notes ?? "No notes"}</p>
          </div>
        </div>
      </SectionCard>

      <BudgetLineItemForm
        open={showForm}
        initialValues={lineItem}
        onSubmit={handleUpdate}
        onClose={() => setShowForm(false)}
        isSubmitting={actions.updateLineItem.isPending}
      />

      <ConfirmDialog
        open={showConfirm}
        title="Delete line item?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        confirmTone="destructive"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </PageShell>
  );
}
