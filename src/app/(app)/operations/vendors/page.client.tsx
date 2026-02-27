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
import { VendorForm } from "@/features/operations/vendors/components/vendor-form";
import { VendorTable } from "@/features/operations/vendors/components/vendor-table";
import { useVendors, useCreateVendor, useUpdateVendor, useDeleteVendor } from "@/features/operations/vendors/hooks";
import type { Vendor } from "@/features/operations/vendors/types";
import { useCanEdit } from "@/lib/auth/require-role";
import { useToast } from "@/components/ui/toast";

export default function VendorsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [lookupId, setLookupId] = useState(searchParams.get("vendorId") ?? "");
  const [selected, setSelected] = useState<Vendor | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { data, isLoading, error, refetch } = useVendors();
  const createMutation = useCreateVendor();
  const updateMutation = useUpdateVendor();
  const deleteMutation = useDeleteVendor();
  const canEdit = useCanEdit();
  const { notify } = useToast();

  useEffect(() => {
    setLookupId(searchParams.get("vendorId") ?? "");
  }, [searchParams]);

  const updateLookupParam = (nextId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextId.trim()) {
      params.set("vendorId", nextId.trim());
    } else {
      params.delete("vendorId");
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const handleSave = async (values: Vendor) => {
    try {
      if (selected?.id) {
        await updateMutation.mutateAsync({ id: selected.id, payload: values });
        notify({ message: "Vendor updated", tone: "success" });
      } else {
        await createMutation.mutateAsync(values);
        notify({ message: "Vendor created", tone: "success" });
      }
      setShowForm(false);
      setSelected(null);
    } catch {
      notify({ message: "Unable to save vendor", tone: "error" });
    }
  };

  const handleDelete = async () => {
    if (!selected?.id) return;
    try {
      await deleteMutation.mutateAsync(selected.id);
      notify({ message: "Vendor deleted", tone: "success" });
    } catch {
      notify({ message: "Unable to delete vendor", tone: "error" });
    } finally {
      setShowConfirm(false);
      setSelected(null);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Vendors"
        subtitle="Manage vendors and suppliers."
        actions={
          <LookupBar
            value={lookupId}
            onChange={setLookupId}
            onSubmit={() => {
              updateLookupParam(lookupId);
              if (lookupId.trim()) {
                router.push(`/operations/vendors/${lookupId.trim()}`);
              }
            }}
            onClear={() => {
              setLookupId("");
              updateLookupParam("");
            }}
            placeholder="Lookup vendor by ID..."
            actionLabel="View"
            actions={
              canEdit ? (
                <Button type="button" onClick={() => { setSelected(null); setShowForm(true); }}>New Vendor</Button>
              ) : null
            }
          />
        }
      />

      {isLoading ? (
        <Skeleton className="surface-card" />
      ) : error ? (
        <ErrorState message="Unable to load vendors." onRetry={() => refetch()} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No vendors" description="Create a vendor to get started." />
      ) : (
        <VendorTable
          items={data}
          onView={(item) => { if (item.id) router.push(`/operations/vendors/${item.id}`); }}
          onEdit={(item) => { setSelected(item); setShowForm(true); }}
          onDelete={(item) => { setSelected(item); setShowConfirm(true); }}
        />
      )}

      <VendorForm
        open={showForm}
        initialValues={selected ?? undefined}
        onSubmit={handleSave}
        onClose={() => { setShowForm(false); setSelected(null); }}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        open={showConfirm}
        title="Delete vendor?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
