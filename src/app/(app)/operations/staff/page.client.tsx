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
import { StaffForm } from "@/features/operations/staff/components/staff-form";
import { StaffTable } from "@/features/operations/staff/components/staff-table";
import { useStaff, useCreateStaff, useUpdateStaff, useDeleteStaff } from "@/features/operations/staff/hooks";
import type { Staff } from "@/features/operations/staff/types";
import { useCanEdit } from "@/lib/auth/require-role";
import { useToast } from "@/components/ui/toast";

export default function StaffPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [lookupId, setLookupId] = useState(searchParams.get("staffId") ?? "");
  const [selected, setSelected] = useState<Staff | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { data, isLoading, error, refetch } = useStaff();
  const createMutation = useCreateStaff();
  const updateMutation = useUpdateStaff();
  const deleteMutation = useDeleteStaff();
  const canEdit = useCanEdit();
  const { notify } = useToast();

  useEffect(() => {
    setLookupId(searchParams.get("staffId") ?? "");
  }, [searchParams]);

  const updateLookupParam = (nextId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextId.trim()) {
      params.set("staffId", nextId.trim());
    } else {
      params.delete("staffId");
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const handleSave = async (values: Staff) => {
    try {
      if (selected?.id) {
        await updateMutation.mutateAsync({ id: selected.id, payload: values });
        notify({ message: "Staff updated", tone: "success" });
      } else {
        await createMutation.mutateAsync(values);
        notify({ message: "Staff created", tone: "success" });
      }
      setShowForm(false);
      setSelected(null);
    } catch {
      notify({ message: "Unable to save staff", tone: "error" });
    }
  };

  const handleDelete = async () => {
    if (!selected?.id) return;
    try {
      await deleteMutation.mutateAsync(selected.id);
      notify({ message: "Staff deleted", tone: "success" });
    } catch {
      notify({ message: "Unable to delete staff", tone: "error" });
    } finally {
      setShowConfirm(false);
      setSelected(null);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Staff"
        subtitle="Manage staff assignments and roles."
        actions={
          <LookupBar
            value={lookupId}
            onChange={setLookupId}
            onSubmit={() => {
              updateLookupParam(lookupId);
              if (lookupId.trim()) {
                router.push(`/operations/staff/${lookupId.trim()}`);
              }
            }}
            onClear={() => {
              setLookupId("");
              updateLookupParam("");
            }}
            placeholder="Lookup staff by ID..."
            actionLabel="View"
            actions={
              canEdit ? (
                <Button type="button" onClick={() => { setSelected(null); setShowForm(true); }}>New Staff</Button>
              ) : null
            }
          />
        }
      />

      {isLoading ? (
        <Skeleton className="surface-card" />
      ) : error ? (
        <ErrorState message="Unable to load staff." onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No staff" description="Create staff to get started." />
      ) : (
        <StaffTable
          items={data}
          onView={(item) => { if (item.id) router.push(`/operations/staff/${item.id}`); }}
          onEdit={(item) => { setSelected(item); setShowForm(true); }}
          onDelete={(item) => { setSelected(item); setShowConfirm(true); }}
        />
      )}

      <StaffForm
        open={showForm}
        initialValues={selected ?? undefined}
        onSubmit={handleSave}
        onClose={() => { setShowForm(false); setSelected(null); }}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        open={showConfirm}
        title="Delete staff?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
