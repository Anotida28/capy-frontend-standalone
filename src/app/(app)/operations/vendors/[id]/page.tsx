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
import { VendorForm } from "@/features/operations/vendors/components/vendor-form";
import { useVendor, useUpdateVendor, useDeleteVendor } from "@/features/operations/vendors/hooks";
import type { Vendor } from "@/features/operations/vendors/types";
import { useCanEdit } from "@/lib/auth/require-role";
import { useToast } from "@/components/ui/toast";

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const vendorQuery = useVendor(id);
  const updateMutation = useUpdateVendor();
  const deleteMutation = useDeleteVendor();
  const canEdit = useCanEdit();
  const { notify } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (vendorQuery.isLoading) {
    return <Skeleton className="surface-card" />;
  }

  if (vendorQuery.error || !vendorQuery.data) {
    return <ErrorState message="Unable to load vendor." />;
  }

  const vendor = vendorQuery.data;

  const handleSave = async (values: Vendor) => {
    try {
      await updateMutation.mutateAsync({ id, payload: values });
      notify({ message: "Vendor updated", tone: "success" });
      setShowForm(false);
    } catch {
      notify({ message: "Unable to update vendor", tone: "error" });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      notify({ message: "Vendor deleted", tone: "success" });
      router.push("/operations/vendors");
    } catch {
      notify({ message: "Unable to delete vendor", tone: "error" });
    } finally {
      setShowConfirm(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        title={vendor.companyName}
        subtitle="Vendor profile"
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
            <p className="muted">Type</p>
            <p className="table-title">{vendor.type}</p>
          </div>
          <div>
            <p className="muted">Tax Clearance Expiry</p>
            <p className="table-title">{vendor.taxClearanceExpiry ?? "-"}</p>
          </div>
          <div>
            <p className="muted">Performance Rating</p>
            <p className="table-title">{vendor.performanceRating ?? "-"}</p>
          </div>
        </div>
      </SectionCard>

      <VendorForm
        open={showForm}
        initialValues={vendor}
        onSubmit={handleSave}
        onClose={() => setShowForm(false)}
        isSubmitting={updateMutation.isPending}
      />

      <ConfirmDialog
        open={showConfirm}
        title="Delete vendor?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        confirmTone="destructive"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </PageShell>
  );
}
