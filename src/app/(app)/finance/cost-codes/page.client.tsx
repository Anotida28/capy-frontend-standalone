"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LookupBar } from "@/components/ui/lookup-bar";
import { CostCodeForm } from "@/features/finance/cost-codes/components/cost-code-form";
import { CostCodeTable } from "@/features/finance/cost-codes/components/cost-code-table";
import {
  useCostCodes,
  useCostCodeSearch,
  useCostCodeByCode,
  useCostCodesByCategory,
  useActiveCostCodes,
  useCreateCostCode,
  useUpdateCostCode,
  useDeleteCostCode,
  useDeactivateCostCode
} from "@/features/finance/cost-codes/hooks";
import type { CostCode } from "@/features/finance/cost-codes/types";
import { useCanEdit } from "@/lib/auth/require-role";
import { useToast } from "@/components/ui/toast";
import { useDebouncedValue } from "@/lib/utils/debounce";

export default function CostCodesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [mode, setMode] = useState(searchParams.get("mode") ?? "name");
  const [activeOnly, setActiveOnly] = useState(searchParams.get("active") === "true");
  const [selected, setSelected] = useState<CostCode | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmMode, setConfirmMode] = useState<"delete" | "deactivate" | "activate">("delete");
  const debouncedQuery = useDebouncedValue(query, 400);
  const costCodesQuery = useCostCodes();
  const activeCostCodesQuery = useActiveCostCodes(activeOnly);
  const searchQuery = useCostCodeSearch(mode === "name" ? debouncedQuery : "");
  const codeQuery = useCostCodeByCode(mode === "code" ? debouncedQuery : "");
  const categoryQuery = useCostCodesByCategory(mode === "category" ? debouncedQuery : "");
  const createMutation = useCreateCostCode();
  const updateMutation = useUpdateCostCode();
  const deleteMutation = useDeleteCostCode();
  const deactivateMutation = useDeactivateCostCode();
  const canEdit = useCanEdit();
  const { notify } = useToast();

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
    setMode(searchParams.get("mode") ?? "name");
    setActiveOnly(searchParams.get("active") === "true");
  }, [searchParams]);

  const updateParams = (nextQuery: string, nextMode: string, nextActive: boolean = activeOnly) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextQuery.trim()) {
      params.set("q", nextQuery.trim());
    } else {
      params.delete("q");
    }
    if (nextMode) {
      params.set("mode", nextMode);
    } else {
      params.delete("mode");
    }
    if (nextActive) {
      params.set("active", "true");
    } else {
      params.delete("active");
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const baseItems = useMemo(() => {
    if (!debouncedQuery) {
      return activeOnly ? activeCostCodesQuery.data ?? [] : costCodesQuery.data ?? [];
    }
    if (mode === "name") return searchQuery.data ?? [];
    if (mode === "code") return codeQuery.data ? [codeQuery.data] : [];
    if (mode === "category") return categoryQuery.data ?? [];
    return costCodesQuery.data ?? [];
  }, [activeOnly, debouncedQuery, mode, searchQuery.data, codeQuery.data, categoryQuery.data, costCodesQuery.data, activeCostCodesQuery.data]);

  const items = useMemo(() => {
    if (!activeOnly) return baseItems;
    return baseItems.filter((item) => item.active !== false);
  }, [activeOnly, baseItems]);

  const highlightQuery = debouncedQuery && (mode === "name" || mode === "code" || mode === "category") ? debouncedQuery : "";

  const isLoading = !debouncedQuery
    ? activeOnly
      ? activeCostCodesQuery.isLoading
      : costCodesQuery.isLoading
    : mode === "name"
    ? searchQuery.isLoading
    : mode === "code"
    ? codeQuery.isLoading
    : categoryQuery.isLoading;
  const error = !debouncedQuery
    ? activeOnly
      ? activeCostCodesQuery.error
      : costCodesQuery.error
    : mode === "name"
    ? searchQuery.error
    : mode === "code"
    ? codeQuery.error
    : categoryQuery.error;
  const refetch = () => {
    costCodesQuery.refetch();
    activeCostCodesQuery.refetch();
    searchQuery.refetch();
    codeQuery.refetch();
    categoryQuery.refetch();
  };

  const toggleActive = () => {
    const nextActive = !activeOnly;
    setActiveOnly(nextActive);
    updateParams(query, mode, nextActive);
  };

  const handleSave = async (values: CostCode) => {
    try {
      if (selected?.id) {
        await updateMutation.mutateAsync({ id: selected.id, payload: values });
        notify({ message: "Cost code updated", tone: "success" });
      } else {
        await createMutation.mutateAsync(values);
        notify({ message: "Cost code created", tone: "success" });
      }
      setShowForm(false);
      setSelected(null);
    } catch {
      notify({ message: "Unable to save cost code", tone: "error" });
    }
  };

  const handleDelete = async () => {
    if (!selected?.id) return;
    try {
      await deleteMutation.mutateAsync(selected.id);
      notify({ message: "Cost code deleted", tone: "success" });
    } catch {
      notify({ message: "Unable to delete cost code", tone: "error" });
    } finally {
      setShowConfirm(false);
      setSelected(null);
    }
  };

  const handleDeactivate = async () => {
    if (!selected?.id) return;
    try {
      await deactivateMutation.mutateAsync(selected.id);
      notify({ message: "Cost code deactivated", tone: "success" });
    } catch {
      notify({ message: "Unable to deactivate cost code", tone: "error" });
    } finally {
      setShowConfirm(false);
      setSelected(null);
    }
  };

  const handleActivate = async () => {
    if (!selected?.id) return;
    try {
      await updateMutation.mutateAsync({
        id: selected.id,
        payload: { ...selected, active: true }
      });
      notify({ message: "Cost code activated", tone: "success" });
    } catch {
      notify({ message: "Unable to activate cost code", tone: "error" });
    } finally {
      setShowConfirm(false);
      setSelected(null);
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="Cost Codes"
        subtitle="Define and manage cost code taxonomy."
        actions={
          <LookupBar
            value={query}
            onChange={setQuery}
            onSubmit={() => {
              if (mode === "id" && query.trim()) {
                router.push(`/finance/cost-codes/${query.trim()}`);
              } else {
                updateParams(query, mode);
              }
            }}
            onClear={() => {
              setQuery("");
              updateParams("", mode);
            }}
            placeholder="Search cost codes..."
            options={[
              { label: "Name", value: "name" },
              { label: "ID", value: "id" },
              { label: "Code", value: "code" },
              { label: "Category", value: "category" }
            ]}
            selectedOption={mode}
            onOptionChange={(next) => {
              setMode(next);
              updateParams(query, next);
            }}
            actionLabel={mode === "id" ? "View" : "Search"}
            actions={
              <>
                <button
                  type="button"
                  className={`filter-pill${activeOnly ? " filter-pill--active" : ""}`}
                  onClick={toggleActive}
                  aria-pressed={activeOnly}
                >
                  {activeOnly ? "Active only" : "All cost codes"}
                </button>
                {canEdit ? (
                  <Button type="button" onClick={() => { setSelected(null); setShowForm(true); }}>New Cost Code</Button>
                ) : null}
              </>
            }
          />
        }
      />

      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : error ? (
        <ErrorState message="Unable to load cost codes." onRetry={() => refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No cost codes"
          description="Create a cost code to get started."
          action={canEdit ? <Button onClick={() => setShowForm(true)}>New Cost Code</Button> : null}
        />
      ) : (
        <CostCodeTable
          items={items}
          query={highlightQuery}
          onView={(item) => { if (item.id) router.push(`/finance/cost-codes/${item.id}`); }}
          onEdit={(item) => { setSelected(item); setShowForm(true); }}
          onDelete={(item) => { setSelected(item); setConfirmMode("delete"); setShowConfirm(true); }}
          onDeactivate={(item) => { setSelected(item); setConfirmMode("deactivate"); setShowConfirm(true); }}
          onActivate={(item) => { setSelected(item); setConfirmMode("activate"); setShowConfirm(true); }}
        />
      )}

      <CostCodeForm
        open={showForm}
        initialValues={selected ?? undefined}
        onSubmit={handleSave}
        onClose={() => { setShowForm(false); setSelected(null); }}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
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
            : "This will prevent this cost code from being used in future budgets and purchase orders."
        }
        confirmLabel={confirmMode === "delete" ? "Delete" : confirmMode === "activate" ? "Activate" : "Deactivate"}
        confirmTone={confirmMode === "delete" ? "destructive" : confirmMode === "deactivate" ? "destructive" : "default"}
        onConfirm={
          confirmMode === "delete" ? handleDelete : confirmMode === "activate" ? handleActivate : handleDeactivate
        }
        onCancel={() => setShowConfirm(false)}
      />
    </PageShell>
  );
}
