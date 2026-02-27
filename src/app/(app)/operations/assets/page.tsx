"use client";

import { useMemo, useState } from "react";
import PageHeader from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AssetForm } from "@/features/operations/assets/components/asset-form";
import { AssetTable } from "@/features/operations/assets/components/asset-table";
import { useAssets, useCreateAsset, useUpdateAsset, useDeleteAsset } from "@/features/operations/assets/hooks";
import type { Asset } from "@/features/operations/assets/types";
import { useCanEdit } from "@/lib/auth/require-role";
import { useToast } from "@/components/ui/toast";
import { useDebouncedValue } from "@/lib/utils/debounce";

export default function AssetsPage() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Asset | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { data, isLoading, error, refetch } = useAssets();
  const createMutation = useCreateAsset();
  const updateMutation = useUpdateAsset();
  const deleteMutation = useDeleteAsset();
  const canEdit = useCanEdit();
  const { notify } = useToast();

  const debouncedQuery = useDebouncedValue(query, 400);

  const items = useMemo(() => {
    if (!data) return [];
    const term = debouncedQuery.toLowerCase();
    return data.filter((asset) =>
      [
        asset.assetCode,
        asset.make ?? "",
        asset.model ?? "",
        asset.type ?? "",
        asset.category ?? "",
        asset.status ?? "",
        asset.assignedProjectName ?? "",
        asset.assignedProjectId ?? "",
        asset.personInChargeName ?? "",
        asset.personInChargeId ?? "",
        asset.operatorId ?? "",
        asset.rentalStartDate ?? "",
        asset.rentalEndDate ?? "",
        asset.ownership ?? ""
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [data, debouncedQuery]);

  const handleSave = async (values: Asset) => {
    try {
      if (selected?.id) {
        await updateMutation.mutateAsync({ id: selected.id, payload: values });
        notify({ message: "Asset updated", tone: "success" });
      } else {
        await createMutation.mutateAsync(values);
        notify({ message: "Asset created", tone: "success" });
      }
      setShowForm(false);
      setSelected(null);
    } catch {
      notify({ message: "Unable to save asset", tone: "error" });
    }
  };

  const handleDelete = async () => {
    if (!selected?.id) return;
    try {
      await deleteMutation.mutateAsync(selected.id);
      notify({ message: "Asset deleted", tone: "success" });
    } catch {
      notify({ message: "Unable to delete asset", tone: "error" });
    } finally {
      setShowConfirm(false);
      setSelected(null);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Asset Register"
        subtitle="Combined register for assets and allocation ownership."
        actions={
          <>
            <div className="search-field">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                className="search-input"
                placeholder="Search asset register"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            {canEdit ? (
              <Button onClick={() => { setSelected(null); setShowForm(true); }}>New Asset Entry</Button>
            ) : null}
          </>
        }
      />

      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : error ? (
        <ErrorState message="Unable to load assets." onRetry={() => refetch()} />
      ) : items.length === 0 ? (
        <EmptyState title="No assets found" description="Create an asset entry to start your register." />
      ) : (
        <AssetTable
          items={items}
          query={debouncedQuery}
          onEdit={(asset) => {
            setSelected(asset);
            setShowForm(true);
          }}
          onDelete={(asset) => {
            setSelected(asset);
            setShowConfirm(true);
          }}
        />
      )}

      <AssetForm
        open={showForm}
        initialValues={selected ?? undefined}
        onSubmit={handleSave}
        onClose={() => {
          setShowForm(false);
          setSelected(null);
        }}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        open={showConfirm}
        title="Delete asset?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        confirmTone="destructive"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
