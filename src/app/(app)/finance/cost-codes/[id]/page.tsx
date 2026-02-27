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
import { CostCodeForm } from "@/features/finance/cost-codes/components/cost-code-form";
import {
  useCostCode,
  useUpdateCostCode,
  useDeleteCostCode,
  useDeactivateCostCode
} from "@/features/finance/cost-codes/hooks";
import type { CostCode } from "@/features/finance/cost-codes/types";
import { formatDateTime } from "@/lib/utils/date";
import { useCanEdit } from "@/lib/auth/require-role";
import { useToast } from "@/components/ui/toast";

export default function CostCodeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const costCodeQuery = useCostCode(id);
  const updateMutation = useUpdateCostCode();
  const deleteMutation = useDeleteCostCode();
  const deactivateMutation = useDeactivateCostCode();
  const canEdit = useCanEdit();
  const { notify } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [confirmMode, setConfirmMode] = useState<"delete" | "deactivate" | "activate">("delete");
  const [showConfirm, setShowConfirm] = useState(false);

  if (costCodeQuery.isLoading) {
    return <Skeleton className="surface-card" />;
  }

  if (costCodeQuery.error || !costCodeQuery.data) {
    return <ErrorState message="Unable to load cost code." />;
  }

  const costCode = costCodeQuery.data;

  const handleSave = async (values: CostCode) => {
    try {
      await updateMutation.mutateAsync({ id, payload: values });
      notify({ message: "Cost code updated", tone: "success" });
      setShowForm(false);
    } catch {
      notify({ message: "Unable to update cost code", tone: "error" });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      notify({ message: "Cost code deleted", tone: "success" });
      router.push("/finance/cost-codes");
    } catch {
      notify({ message: "Unable to delete cost code", tone: "error" });
    } finally {
      setShowConfirm(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      await deactivateMutation.mutateAsync(id);
      notify({ message: "Cost code deactivated", tone: "success" });
    } catch {
      notify({ message: "Unable to deactivate cost code", tone: "error" });
    } finally {
      setShowConfirm(false);
    }
  };

  const handleActivate = async () => {
    try {
      await updateMutation.mutateAsync({ id, payload: { ...costCode, active: true } });
      notify({ message: "Cost code activated", tone: "success" });
    } catch {
      notify({ message: "Unable to activate cost code", tone: "error" });
    } finally {
      setShowConfirm(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        title={costCode.code}
        subtitle={costCode.name}
        actions={
          canEdit ? (
            <div className="toolbar">
              <Button variant="ghost" onClick={() => setShowForm(true)}>Edit</Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setConfirmMode(costCode.active === false ? "activate" : "deactivate");
                  setShowConfirm(true);
                }}
              >
                {costCode.active === false ? "Activate" : "Deactivate"}
              </Button>
              <Button variant="ghost" onClick={() => { setConfirmMode("delete"); setShowConfirm(true); }}>Delete</Button>
            </div>
          ) : null
        }
      />

      <SectionCard>
        <div className="form-grid">
          <div>
            <p className="muted">Category</p>
            <p className="table-title">{costCode.category}</p>
          </div>
          <div>
            <p className="muted">Status</p>
            <p className="table-title">{costCode.active === false ? "Inactive" : "Active"}</p>
          </div>
          <div>
            <p className="muted">Created At</p>
            <p className="table-title">{formatDateTime(costCode.createdAt)}</p>
          </div>
          <div>
            <p className="muted">Updated At</p>
            <p className="table-title">{formatDateTime(costCode.updatedAt)}</p>
          </div>
          <div className="full-width">
            <p className="muted">Description</p>
            <p className="table-title">{costCode.description || "No description"}</p>
          </div>
        </div>
      </SectionCard>

      <CostCodeForm
        open={showForm}
        initialValues={costCode}
        onSubmit={handleSave}
        onClose={() => setShowForm(false)}
        isSubmitting={updateMutation.isPending}
      />

      <ConfirmDialog
        open={showConfirm}
        title={
          confirmMode === "delete"
            ? "Delete cost code?"
            : confirmMode === "activate"
            ? "Activate cost code?"
            : "Deactivate cost code?"
        }
        description={
          confirmMode === "delete"
            ? "This action cannot be undone."
            : "This will change the availability of this cost code."
        }
        confirmLabel={confirmMode === "delete" ? "Delete" : confirmMode === "activate" ? "Activate" : "Deactivate"}
        confirmTone={confirmMode === "delete" || confirmMode === "deactivate" ? "destructive" : "default"}
        onConfirm={confirmMode === "delete" ? handleDelete : confirmMode === "activate" ? handleActivate : handleDeactivate}
        onCancel={() => setShowConfirm(false)}
      />
    </PageShell>
  );
}
