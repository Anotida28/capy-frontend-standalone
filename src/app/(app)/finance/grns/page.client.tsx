"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Toolbar } from "@/components/layout/toolbar";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { HighlightText } from "@/components/ui/highlight-text";
import { GRNForm } from "@/features/finance/grns/components/grn-form";
import { useGrns, useGrnByNumber, useGrnsByPurchaseOrder, useRecentGrns, useCreateGrn, useDeleteGrn } from "@/features/finance/grns/hooks";
import type { GRN } from "@/features/finance/grns/types";
import { useCanEdit } from "@/lib/auth/require-role";
import { useToast } from "@/components/ui/toast";
import { Table, TableRoot } from "@/components/ui/table";
import { formatDate } from "@/lib/utils/date";
import { useTableKeyboardNavigation } from "@/components/ui/table-navigation";

export default function GRNsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [grnNumber, setGrnNumber] = useState(searchParams.get("grnNumber") ?? "");
  const [purchaseOrderId, setPurchaseOrderId] = useState(searchParams.get("purchaseOrderId") ?? "");
  const [recentDays, setRecentDays] = useState(searchParams.get("recent") ?? "");
  const [quickFilter, setQuickFilter] = useState<"" | "active" | "pending" | "overdue">("");
  const [selected, setSelected] = useState<GRN | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const listQuery = useGrns(!grnNumber && !purchaseOrderId && !recentDays);
  const numberQuery = useGrnByNumber(grnNumber);
  const purchaseOrderQuery = useGrnsByPurchaseOrder(purchaseOrderId);
  const recentQuery = useRecentGrns(Number(recentDays || 0), Boolean(recentDays));
  const createMutation = useCreateGrn();
  const deleteMutation = useDeleteGrn();
  const canEdit = useCanEdit();
  const { notify } = useToast();

  useEffect(() => {
    setGrnNumber(searchParams.get("grnNumber") ?? "");
    setPurchaseOrderId(searchParams.get("purchaseOrderId") ?? "");
    const nextRecent = searchParams.get("recent") ?? "";
    setRecentDays(nextRecent);
    if (nextRecent === "7") {
      setQuickFilter("pending");
    } else if (nextRecent === "30") {
      setQuickFilter("active");
    } else {
      setQuickFilter("");
    }
  }, [searchParams]);

  const updateParams = (nextNumber: string, nextPurchaseOrder: string, nextRecent: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextNumber.trim()) {
      params.set("grnNumber", nextNumber.trim());
    } else {
      params.delete("grnNumber");
    }
    if (nextPurchaseOrder.trim()) {
      params.set("purchaseOrderId", nextPurchaseOrder.trim());
    } else {
      params.delete("purchaseOrderId");
    }
    if (nextRecent) {
      params.set("recent", nextRecent);
    } else {
      params.delete("recent");
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const items = useMemo(() => {
    if (grnNumber.trim()) {
      return numberQuery.data ? [numberQuery.data] : [];
    }
    if (purchaseOrderId.trim()) return purchaseOrderQuery.data ?? [];
    if (recentDays) return recentQuery.data ?? [];
    return listQuery.data ?? [];
  }, [grnNumber, numberQuery.data, purchaseOrderId, purchaseOrderQuery.data, recentDays, recentQuery.data, listQuery.data]);

  const displayItems = useMemo(() => {
    if (quickFilter !== "overdue") return items;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    cutoff.setHours(0, 0, 0, 0);
    return items.filter((grn) => {
      if (!grn.receivedDate) return false;
      const received = new Date(grn.receivedDate);
      if (Number.isNaN(received.getTime())) return false;
      return received < cutoff;
    });
  }, [items, quickFilter]);

  const { tableRef, getRowProps } = useTableKeyboardNavigation(displayItems.length);

  const isLoading = grnNumber.trim()
    ? numberQuery.isLoading
    : purchaseOrderId.trim()
    ? purchaseOrderQuery.isLoading
    : recentDays
    ? recentQuery.isLoading
    : listQuery.isLoading;
  const error = grnNumber.trim()
    ? numberQuery.error
    : purchaseOrderId.trim()
    ? purchaseOrderQuery.error
    : recentDays
    ? recentQuery.error
    : listQuery.error;
  const refetch = () => {
    listQuery.refetch();
    numberQuery.refetch();
    purchaseOrderQuery.refetch();
    recentQuery.refetch();
  };

  const handleSave = async (values: GRN) => {
    try {
      await createMutation.mutateAsync(values);
      notify({ message: "GRN created", tone: "success" });
      setShowForm(false);
    } catch {
      notify({ message: "Unable to create GRN", tone: "error" });
    }
  };

  const handleDelete = async () => {
    if (!selected?.id) return;
    try {
      await deleteMutation.mutateAsync(selected.id);
      notify({ message: "GRN deleted", tone: "success" });
    } catch {
      notify({ message: "Unable to delete GRN", tone: "error" });
    } finally {
      setShowConfirm(false);
      setSelected(null);
    }
  };

  const highlightQuery = [grnNumber.trim(), purchaseOrderId.trim()].filter(Boolean).join(" ");

  return (
    <div className="page">
      <PageHeader
        title="Goods Received Notes"
        subtitle="Track receipts against purchase orders."
        actions={
          <Toolbar>
            <Input
              placeholder="GRN Number"
              value={grnNumber}
              onChange={(event) => {
                const next = event.target.value;
                setGrnNumber(next);
                updateParams(next, purchaseOrderId, recentDays);
              }}
            />
            <Input
              placeholder="Purchase Order ID"
              value={purchaseOrderId}
              onChange={(event) => {
                const next = event.target.value;
                setPurchaseOrderId(next);
                updateParams(grnNumber, next, recentDays);
              }}
            />
            <Select
              value={recentDays}
              onChange={(event) => {
                const next = event.target.value;
                setRecentDays(next);
                if (next === "7") {
                  setQuickFilter("pending");
                } else if (next === "30") {
                  setQuickFilter("active");
                } else {
                  setQuickFilter("");
                }
                updateParams(grnNumber, purchaseOrderId, next);
              }}
            >
              <option value="">All Dates</option>
              <option value="7">Recent 7 days</option>
              <option value="14">Recent 14 days</option>
              <option value="30">Recent 30 days</option>
            </Select>
            <div className="toolbar-group">
              <button
                type="button"
                className={`filter-pill${!quickFilter && !recentDays ? " filter-pill--active" : ""}`}
                onClick={() => {
                  setQuickFilter("");
                  setRecentDays("");
                  updateParams(grnNumber, purchaseOrderId, "");
                }}
              >
                All
              </button>
              <button
                type="button"
                className={`filter-pill${quickFilter === "active" || recentDays === "30" ? " filter-pill--active" : ""}`}
                onClick={() => {
                  setQuickFilter("active");
                  setRecentDays("30");
                  updateParams(grnNumber, purchaseOrderId, "30");
                }}
              >
                Active
              </button>
              <button
                type="button"
                className={`filter-pill${quickFilter === "pending" || recentDays === "7" ? " filter-pill--active" : ""}`}
                onClick={() => {
                  setQuickFilter("pending");
                  setRecentDays("7");
                  updateParams(grnNumber, purchaseOrderId, "7");
                }}
              >
                Pending
              </button>
              <button
                type="button"
                className={`filter-pill${quickFilter === "overdue" ? " filter-pill--active" : ""}`}
                onClick={() => {
                  setQuickFilter("overdue");
                  setRecentDays("");
                  updateParams(grnNumber, purchaseOrderId, "");
                }}
              >
                Overdue
              </button>
            </div>
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setGrnNumber("");
                setPurchaseOrderId("");
                setRecentDays("");
                setQuickFilter("");
                updateParams("", "", "");
              }}
            >
              Clear Filters
            </Button>
            {canEdit ? <Button type="button" onClick={() => setShowForm(true)}>New GRN</Button> : null}
          </Toolbar>
        }
      />

      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : error ? (
        <ErrorState message="Unable to load GRNs." onRetry={() => refetch()} />
      ) : displayItems.length === 0 ? (
        <EmptyState title="No GRNs" description="Create a GRN to get started." />
      ) : (
        <Table>
          <TableRoot ref={tableRef}>
            <thead>
              <tr>
                <th>GRN Number</th>
                <th>Purchase Order</th>
                <th>Received Date</th>
                <th>Received By</th>
                <th className="actions-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayItems.map((grn, index) => (
                <tr
                  key={grn.id ?? grn.grnNumber}
                  {...getRowProps(index, {
                    onEnter: () => {
                      if (grn.id) router.push(`/finance/grns/${grn.id}`);
                    },
                    disabled: !grn.id
                  })}
                >
                  <td>
                    <HighlightText text={grn.grnNumber ?? "-"} query={highlightQuery} />
                  </td>
                  <td>
                    <HighlightText text={grn.purchaseOrderId ?? "-"} query={highlightQuery} />
                  </td>
                  <td>{formatDate(grn.receivedDate)}</td>
                  <td>
                    <HighlightText text={grn.receivedBy ?? "-"} query={highlightQuery} />
                  </td>
                  <td className="actions-cell">
                    <div className="row-actions">
                      <Button variant="ghost" onClick={() => grn.id && router.push(`/finance/grns/${grn.id}`)}>View →</Button>
                      {canEdit ? (
                        <Button variant="ghost" onClick={() => { setSelected(grn); setShowConfirm(true); }}>Delete</Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableRoot>
        </Table>
      )}

      <GRNForm
        open={showForm}
        onSubmit={handleSave}
        onClose={() => setShowForm(false)}
        isSubmitting={createMutation.isPending}
      />

      <ConfirmDialog
        open={showConfirm}
        title="Delete GRN?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        confirmTone="destructive"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
