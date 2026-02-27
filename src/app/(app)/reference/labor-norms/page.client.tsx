"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LookupBar } from "@/components/ui/lookup-bar";
import { LaborNormForm } from "@/features/operations/labor-norms/components/labor-norm-form";
import { LaborNormTable } from "@/features/operations/labor-norms/components/labor-norm-table";
import { useLaborNorms, useLaborNorm, useCreateLaborNorm, useUpdateLaborNorm, useDeleteLaborNorm } from "@/features/operations/labor-norms/hooks";
import type { LaborNorm } from "@/features/operations/labor-norms/types";
import { useCanEdit } from "@/lib/auth/require-role";
import { useToast } from "@/components/ui/toast";

export default function LaborNormsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [lookupCode, setLookupCode] = useState(searchParams.get("activityCode") ?? "");
  const [selected, setSelected] = useState<LaborNorm | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { data, isLoading, error, refetch } = useLaborNorms();
  const lookupQuery = useLaborNorm(lookupCode);
  const createMutation = useCreateLaborNorm();
  const updateMutation = useUpdateLaborNorm();
  const deleteMutation = useDeleteLaborNorm();
  const canEdit = useCanEdit();
  const { notify } = useToast();

  useEffect(() => {
    setLookupCode(searchParams.get("activityCode") ?? "");
  }, [searchParams]);

  const updateParams = (nextCode: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextCode.trim()) {
      params.set("activityCode", nextCode.trim());
    } else {
      params.delete("activityCode");
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const handleSave = async (values: LaborNorm) => {
    try {
      if (selected) {
        await updateMutation.mutateAsync({ activityCode: selected.activityCode, payload: values });
        notify({ message: "Labor norm updated", tone: "success" });
      } else {
        await createMutation.mutateAsync(values);
        notify({ message: "Labor norm created", tone: "success" });
      }
      setShowForm(false);
      setSelected(null);
    } catch {
      notify({ message: "Unable to save labor norm", tone: "error" });
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await deleteMutation.mutateAsync(selected.activityCode);
      notify({ message: "Labor norm deleted", tone: "success" });
    } catch {
      notify({ message: "Unable to delete labor norm", tone: "error" });
    } finally {
      setShowConfirm(false);
      setSelected(null);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Labor Norms"
        subtitle="Maintain standard hours per unit of work."
        actions={
          <LookupBar
            value={lookupCode}
            onChange={setLookupCode}
            onSubmit={() => updateParams(lookupCode)}
            onClear={() => {
              setLookupCode("");
              updateParams("");
            }}
            placeholder="Lookup by activity code..."
            actionLabel="Lookup"
            actions={
              canEdit ? <Button type="button" onClick={() => { setSelected(null); setShowForm(true); }}>Add Labor Norm</Button> : null
            }
          />
        }
      />

      {lookupCode && lookupQuery.isFetching ? (
        <Skeleton className="surface-card" />
      ) : lookupCode && lookupQuery.data ? (
        <div className="surface-card">
          <p className="table-title">{lookupQuery.data.activityCode}</p>
          <p className="muted">{lookupQuery.data.description}</p>
          <p className="muted">Unit: {lookupQuery.data.unit}</p>
          <p className="muted">Hours / Unit: {lookupQuery.data.standardHoursPerUnit}</p>
        </div>
      ) : lookupCode && lookupQuery.isError ? (
        <div className="error-card">Unable to find a labor norm for this activity code.</div>
      ) : null}

      {isLoading ? (
        <Skeleton className="surface-card" />
      ) : error ? (
        <ErrorState message="Unable to load labor norms." onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No labor norms" description="Create a labor norm to get started." />
      ) : (
        <LaborNormTable
          items={data}
          query={lookupCode}
          onEdit={(item) => { setSelected(item); setShowForm(true); }}
          onDelete={(item) => { setSelected(item); setShowConfirm(true); }}
        />
      )}

      <LaborNormForm
        open={showForm}
        initialValues={selected ?? undefined}
        onSubmit={handleSave}
        onClose={() => { setShowForm(false); setSelected(null); }}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        open={showConfirm}
        title="Delete labor norm?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
