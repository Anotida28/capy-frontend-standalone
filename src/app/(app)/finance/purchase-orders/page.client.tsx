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
import { PurchaseOrderForm } from "@/features/finance/purchase-orders/components/po-form";
import { usePurchaseOrders, usePurchaseOrdersByStatus, usePurchaseOrdersByProject, usePurchaseOrderByNumber, useCreatePurchaseOrder, useDeletePurchaseOrder, usePurchaseOrderActions } from "@/features/finance/purchase-orders/hooks";
import type { PurchaseOrder } from "@/features/finance/purchase-orders/types";
import { useCanEdit } from "@/lib/auth/require-role";
import { useToast } from "@/components/ui/toast";
import { Table, TableRoot } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RowActions } from "@/components/ui/row-actions";
import { useTableKeyboardNavigation } from "@/components/ui/table-navigation";
import { getStatusTone } from "@/lib/utils/status-tone";

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [poNumber, setPoNumber] = useState(searchParams.get("poNumber") ?? "");
  const [projectId, setProjectId] = useState(searchParams.get("projectId") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [activeOnly, setActiveOnly] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [selected, setSelected] = useState<PurchaseOrder | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const listQuery = usePurchaseOrders(!poNumber && !projectId && !status);
  const numberQuery = usePurchaseOrderByNumber(poNumber);
  const projectQuery = usePurchaseOrdersByProject(projectId);
  const statusQuery = usePurchaseOrdersByStatus(status);
  const createMutation = useCreatePurchaseOrder();
  const deleteMutation = useDeletePurchaseOrder();
  const actions = usePurchaseOrderActions();
  const canEdit = useCanEdit();
  const { notify } = useToast();

  useEffect(() => {
    setPoNumber(searchParams.get("poNumber") ?? "");
    setProjectId(searchParams.get("projectId") ?? "");
    setStatus(searchParams.get("status") ?? "");
    setActiveOnly(false);
    setOverdueOnly(false);
  }, [searchParams]);

  const updateParams = (nextPo: string, nextProject: string, nextStatus: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPo.trim()) {
      params.set("poNumber", nextPo.trim());
    } else {
      params.delete("poNumber");
    }
    if (nextProject.trim()) {
      params.set("projectId", nextProject.trim());
    } else {
      params.delete("projectId");
    }
    if (nextStatus) {
      params.set("status", nextStatus);
    } else {
      params.delete("status");
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const items = useMemo(() => {
    if (poNumber.trim()) {
      const base = numberQuery.data ? [numberQuery.data] : [];
      if (status) return base.filter((po) => (po.status ?? "DRAFT") === status);
      return base;
    }
    if (projectId.trim()) {
      const base = projectQuery.data ?? [];
      if (status) return base.filter((po) => (po.status ?? "DRAFT") === status);
      return base;
    }
    if (status) return statusQuery.data ?? [];
    return listQuery.data ?? [];
  }, [poNumber, numberQuery.data, projectId, projectQuery.data, status, statusQuery.data, listQuery.data]);

  const displayItems = useMemo(() => {
    let result = items;
    if (activeOnly) {
      const openStatuses = new Set(["DRAFT", "PENDING_APPROVAL", "APPROVED", "PARTIALLY_RECEIVED"]);
      result = result.filter((po) => openStatuses.has((po.status ?? "DRAFT").toUpperCase()));
    }
    if (overdueOnly) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      result = result.filter((po) => {
        if (!po.expectedDeliveryDate) return false;
        const expected = new Date(po.expectedDeliveryDate);
        if (Number.isNaN(expected.getTime())) return false;
        const statusValue = (po.status ?? "DRAFT").toUpperCase();
        if (["FULLY_RECEIVED", "CANCELLED", "CLOSED"].includes(statusValue)) return false;
        return expected < today;
      });
    }
    return result;
  }, [activeOnly, overdueOnly, items]);

  const { tableRef, getRowProps } = useTableKeyboardNavigation(displayItems.length);

  const isLoading = poNumber.trim()
    ? numberQuery.isLoading
    : projectId.trim()
    ? projectQuery.isLoading
    : status
    ? statusQuery.isLoading
    : listQuery.isLoading;
  const error = poNumber.trim()
    ? numberQuery.error
    : projectId.trim()
    ? projectQuery.error
    : status
    ? statusQuery.error
    : listQuery.error;
  const refetch = () => {
    listQuery.refetch();
    numberQuery.refetch();
    projectQuery.refetch();
    statusQuery.refetch();
  };

  const handleSave = async (values: PurchaseOrder) => {
    try {
      await createMutation.mutateAsync(values);
      notify({ message: "Purchase order created", tone: "success" });
      setShowForm(false);
    } catch {
      notify({ message: "Unable to create purchase order", tone: "error" });
    }
  };

  const handleDelete = async () => {
    if (!selected?.id) return;
    try {
      await deleteMutation.mutateAsync(selected.id);
      notify({ message: "Purchase order deleted", tone: "success" });
    } catch {
      notify({ message: "Unable to delete purchase order", tone: "error" });
    } finally {
      setShowConfirm(false);
      setSelected(null);
    }
  };

  const highlightQuery = [poNumber.trim(), projectId.trim()].filter(Boolean).join(" ");

  return (
    <div className="page">
      <PageHeader
        title="Purchase Orders"
        subtitle="Track procurement workflows."
        actions={
          <Toolbar>
            <Input
              placeholder="PO Number"
              value={poNumber}
              onChange={(event) => {
                const next = event.target.value;
                setPoNumber(next);
                updateParams(next, projectId, status);
              }}
            />
            <Input
              placeholder="Project ID"
              value={projectId}
              onChange={(event) => {
                const next = event.target.value;
                setProjectId(next);
                updateParams(poNumber, next, status);
              }}
            />
            <Select
              value={status}
              onChange={(event) => {
                const next = event.target.value;
                setStatus(next);
                setActiveOnly(false);
                setOverdueOnly(false);
                updateParams(poNumber, projectId, next);
              }}
            >
              <option value="">All Statuses</option>
              {[
                "DRAFT",
                "PENDING_APPROVAL",
                "APPROVED",
                "PARTIALLY_RECEIVED",
                "FULLY_RECEIVED",
                "CANCELLED",
                "CLOSED"
              ].map((statusOption) => (
                <option key={statusOption} value={statusOption}>{statusOption}</option>
              ))}
            </Select>
            <div className="toolbar-group">
              <button
                type="button"
                className={`filter-pill${!activeOnly && !overdueOnly && !status ? " filter-pill--active" : ""}`}
                onClick={() => {
                  setActiveOnly(false);
                  setOverdueOnly(false);
                  setStatus("");
                  updateParams(poNumber, projectId, "");
                }}
              >
                All
              </button>
              <button
                type="button"
                className={`filter-pill${activeOnly ? " filter-pill--active" : ""}`}
                onClick={() => {
                  setActiveOnly(true);
                  setOverdueOnly(false);
                  setStatus("");
                  updateParams(poNumber, projectId, "");
                }}
              >
                Active
              </button>
              <button
                type="button"
                className={`filter-pill${status === "PENDING_APPROVAL" ? " filter-pill--active" : ""}`}
                onClick={() => {
                  setActiveOnly(false);
                  setOverdueOnly(false);
                  setStatus("PENDING_APPROVAL");
                  updateParams(poNumber, projectId, "PENDING_APPROVAL");
                }}
              >
                Pending
              </button>
              <button
                type="button"
                className={`filter-pill${overdueOnly ? " filter-pill--active" : ""}`}
                onClick={() => {
                  setActiveOnly(false);
                  setOverdueOnly(true);
                  setStatus("");
                  updateParams(poNumber, projectId, "");
                }}
              >
                Overdue
              </button>
            </div>
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setPoNumber("");
                setProjectId("");
                setStatus("");
                setActiveOnly(false);
                setOverdueOnly(false);
                updateParams("", "", "");
              }}
            >
              Clear Filters
            </Button>
            {canEdit ? <Button type="button" onClick={() => setShowForm(true)}>New PO</Button> : null}
          </Toolbar>
        }
      />

      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : error ? (
        <ErrorState message="Unable to load purchase orders." onRetry={() => refetch()} />
      ) : displayItems.length === 0 ? (
        <EmptyState title="No purchase orders" description="Create a purchase order to get started." />
      ) : (
        <>
          <div className="desktop-table">
            <Table>
              <TableRoot ref={tableRef}>
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Project</th>
                <th className="status-cell">Status</th>
                <th>Vendor</th>
                <th className="actions-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayItems.map((po, index) => (
                <tr
                  key={po.id ?? po.poNumber}
                  {...getRowProps(index, {
                    onEnter: () => {
                      if (po.id) router.push(`/finance/purchase-orders/${po.id}`);
                    },
                    disabled: !po.id
                  })}
                >
                  <td>
                    <HighlightText text={po.poNumber ?? "-"} query={highlightQuery} />
                  </td>
                  <td>
                    <HighlightText text={po.projectId ?? "-"} query={highlightQuery} />
                  </td>
                  <td className="status-cell">
                    <Badge label={po.status ?? "DRAFT"} tone={getStatusTone(po.status ?? "DRAFT")} />
                  </td>
                  <td>
                    <HighlightText text={po.vendorId ?? "-"} query={highlightQuery} />
                  </td>
                  <td className="actions-cell">
                    <div className="row-actions">
                      <Button variant="ghost" onClick={() => po.id && router.push(`/finance/purchase-orders/${po.id}`)}>View →</Button>
                      {canEdit ? (
                        <RowActions
                          actions={[
                            { label: "Submit", onClick: () => actions.submit.mutate(po.id!) },
                            { label: "Approve", onClick: () => actions.approve.mutate({ id: po.id!, approvedBy: po.createdBy }) },
                            { label: "Cancel", onClick: () => actions.cancel.mutate(po.id!), tone: "destructive" },
                            { label: "Close", onClick: () => actions.close.mutate(po.id!) },
                            { label: "Delete", onClick: () => { setSelected(po); setShowConfirm(true); }, tone: "destructive" }
                          ]}
                        />
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
                </tbody>
              </TableRoot>
            </Table>
          </div>
          <div className="mobile-list">
            {displayItems.map((po) => (
              <article key={`mobile-${po.id ?? po.poNumber}`} className="mobile-card">
                <div className="mobile-card-head">
                  <div>
                    <p className="mobile-card-title">
                      <HighlightText text={po.poNumber ?? "-"} query={highlightQuery} />
                    </p>
                    <p className="mobile-card-subtitle">
                      <HighlightText text={po.projectId ?? "-"} query={highlightQuery} />
                    </p>
                  </div>
                  <Badge label={po.status ?? "DRAFT"} tone={getStatusTone(po.status ?? "DRAFT")} />
                </div>
                <div className="mobile-card-grid">
                  <div className="mobile-field">
                    <span className="mobile-label">Vendor</span>
                    <div className="mobile-value">
                      <HighlightText text={po.vendorId ?? "-"} query={highlightQuery} />
                    </div>
                  </div>
                </div>
                <div className="mobile-card-actions">
                  <Button variant="ghost" onClick={() => po.id && router.push(`/finance/purchase-orders/${po.id}`)}>View -&gt;</Button>
                  {canEdit ? (
                    <RowActions
                      actions={[
                        { label: "Submit", onClick: () => actions.submit.mutate(po.id!) },
                        { label: "Approve", onClick: () => actions.approve.mutate({ id: po.id!, approvedBy: po.createdBy }) },
                        { label: "Cancel", onClick: () => actions.cancel.mutate(po.id!), tone: "destructive" },
                        { label: "Close", onClick: () => actions.close.mutate(po.id!) },
                        { label: "Delete", onClick: () => { setSelected(po); setShowConfirm(true); }, tone: "destructive" }
                      ]}
                    />
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      <PurchaseOrderForm
        open={showForm}
        onSubmit={handleSave}
        onClose={() => setShowForm(false)}
        isSubmitting={createMutation.isPending}
      />

      <ConfirmDialog
        open={showConfirm}
        title="Delete purchase order?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        confirmTone="destructive"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
