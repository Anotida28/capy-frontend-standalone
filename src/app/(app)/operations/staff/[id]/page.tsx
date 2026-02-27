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
import { StaffForm } from "@/features/operations/staff/components/staff-form";
import { useStaffMember, useUpdateStaff, useDeleteStaff } from "@/features/operations/staff/hooks";
import type { Staff } from "@/features/operations/staff/types";
import { useCanEdit } from "@/lib/auth/require-role";
import { useToast } from "@/components/ui/toast";

export default function StaffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const staffQuery = useStaffMember(id);
  const updateMutation = useUpdateStaff();
  const deleteMutation = useDeleteStaff();
  const canEdit = useCanEdit();
  const { notify } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (staffQuery.isLoading) {
    return <Skeleton className="surface-card" />;
  }

  if (staffQuery.error || !staffQuery.data) {
    return <ErrorState message="Unable to load staff member." />;
  }

  const staff = staffQuery.data;

  const handleSave = async (values: Staff) => {
    try {
      await updateMutation.mutateAsync({ id, payload: values });
      notify({ message: "Staff updated", tone: "success" });
      setShowForm(false);
    } catch {
      notify({ message: "Unable to update staff", tone: "error" });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      notify({ message: "Staff deleted", tone: "success" });
      router.push("/operations/staff");
    } catch {
      notify({ message: "Unable to delete staff", tone: "error" });
    } finally {
      setShowConfirm(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        title={staff.fullName}
        subtitle="Staff profile"
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
            <p className="muted">National ID</p>
            <p className="table-title">{staff.nationalId}</p>
          </div>
          <div>
            <p className="muted">Role</p>
            <p className="table-title">{staff.role}</p>
          </div>
        </div>
      </SectionCard>

      <StaffForm
        open={showForm}
        initialValues={staff}
        onSubmit={handleSave}
        onClose={() => setShowForm(false)}
        isSubmitting={updateMutation.isPending}
      />

      <ConfirmDialog
        open={showConfirm}
        title="Delete staff member?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        confirmTone="destructive"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </PageShell>
  );
}
