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
import { InvoiceForm } from "@/features/finance/invoices/components/invoice-form";
import { useInvoices, useInvoicesByStatus, useInvoiceByNumber, useOverdueInvoices, useCreateInvoice, useDeleteInvoice } from "@/features/finance/invoices/hooks";
import type { SupplierInvoice } from "@/features/finance/invoices/types";
import { useCanEdit } from "@/lib/auth/require-role";
import { useToast } from "@/components/ui/toast";
import { Table, TableRoot } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils/money";
import { getStatusTone } from "@/lib/utils/status-tone";
import { useTableKeyboardNavigation } from "@/components/ui/table-navigation";

export default function InvoicesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [invoiceNumber, setInvoiceNumber] = useState(searchParams.get("invoiceNumber") ?? "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "");
  const [overdueOnly, setOverdueOnly] = useState(searchParams.get("overdue") === "true");
  const [activeOnly, setActiveOnly] = useState(false);
  const [selected, setSelected] = useState<SupplierInvoice | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const listQuery = useInvoices(!invoiceNumber && !statusFilter && !overdueOnly);
  const numberQuery = useInvoiceByNumber(invoiceNumber);
  const statusQuery = useInvoicesByStatus(statusFilter);
  const overdueQuery = useOverdueInvoices(overdueOnly);
  const createMutation = useCreateInvoice();
  const deleteMutation = useDeleteInvoice();
  const canEdit = useCanEdit();
  const { notify } = useToast();

  useEffect(() => {
    setInvoiceNumber(searchParams.get("invoiceNumber") ?? "");
    setStatusFilter(searchParams.get("status") ?? "");
    setOverdueOnly(searchParams.get("overdue") === "true");
    setActiveOnly(false);
  }, [searchParams]);

  const updateParams = (nextNumber: string, nextStatus: string, nextOverdue: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextNumber.trim()) {
      params.set("invoiceNumber", nextNumber.trim());
    } else {
      params.delete("invoiceNumber");
    }
    if (nextStatus) {
      params.set("status", nextStatus);
    } else {
      params.delete("status");
    }
    if (nextOverdue) {
      params.set("overdue", "true");
    } else {
      params.delete("overdue");
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const items = useMemo(() => {
    if (invoiceNumber.trim()) {
      const base = numberQuery.data ? [numberQuery.data] : [];
      if (statusFilter) return base.filter((inv) => (inv.status ?? "PENDING") === statusFilter);
      return base;
    }
    if (overdueOnly) {
      const base = overdueQuery.data ?? [];
      if (statusFilter) return base.filter((inv) => (inv.status ?? "PENDING") === statusFilter);
      return base;
    }
    if (statusFilter) return statusQuery.data ?? [];
    return listQuery.data ?? [];
  }, [invoiceNumber, numberQuery.data, overdueOnly, overdueQuery.data, statusFilter, statusQuery.data, listQuery.data]);

  const displayItems = useMemo(() => {
    if (!activeOnly) return items;
    const activeStatuses = new Set(["PENDING", "MATCHED", "DISPUTED", "APPROVED", "PAYMENT_PROCESSING"]);
    return items.filter((inv) => activeStatuses.has((inv.status ?? "PENDING").toUpperCase()));
  }, [activeOnly, items]);

  const { tableRef, getRowProps } = useTableKeyboardNavigation(displayItems.length);

  const isLoading = invoiceNumber.trim()
    ? numberQuery.isLoading
    : overdueOnly
    ? overdueQuery.isLoading
    : statusFilter
    ? statusQuery.isLoading
    : listQuery.isLoading;
  const error = invoiceNumber.trim()
    ? numberQuery.error
    : overdueOnly
    ? overdueQuery.error
    : statusFilter
    ? statusQuery.error
    : listQuery.error;
  const refetch = () => {
    listQuery.refetch();
    numberQuery.refetch();
    statusQuery.refetch();
    overdueQuery.refetch();
  };

  const handleSave = async (values: SupplierInvoice) => {
    try {
      await createMutation.mutateAsync(values);
      notify({ message: "Invoice created", tone: "success" });
      setShowForm(false);
    } catch {
      notify({ message: "Unable to create invoice", tone: "error" });
    }
  };

  const handleDelete = async () => {
    if (!selected?.id) return;
    try {
      await deleteMutation.mutateAsync(selected.id);
      notify({ message: "Invoice deleted", tone: "success" });
    } catch {
      notify({ message: "Unable to delete invoice", tone: "error" });
    } finally {
      setShowConfirm(false);
      setSelected(null);
    }
  };

  const highlightQuery = invoiceNumber.trim();

  return (
    <div className="page">
      <PageHeader
        title="Invoices"
        subtitle="Review and manage supplier invoices."
        actions={
          <Toolbar>
            <Input
              placeholder="Invoice Number"
              value={invoiceNumber}
              onChange={(event) => {
                const next = event.target.value;
                setInvoiceNumber(next);
                setActiveOnly(false);
                updateParams(next, statusFilter, overdueOnly);
              }}
            />
            <Select
              value={statusFilter}
              onChange={(event) => {
                const next = event.target.value;
                setStatusFilter(next);
                setOverdueOnly(false);
                setActiveOnly(false);
                updateParams(invoiceNumber, next, false);
              }}
            >
              <option value="">All Statuses</option>
              {[
                "PENDING",
                "MATCHED",
                "DISPUTED",
                "APPROVED",
                "PAYMENT_PROCESSING",
                "PAID",
                "REJECTED",
                "CANCELLED"
              ].map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </Select>
            <div className="toolbar-group">
              <button
                type="button"
                className={`filter-pill${!activeOnly && !statusFilter && !overdueOnly ? " filter-pill--active" : ""}`}
                onClick={() => {
                  setActiveOnly(false);
                  setStatusFilter("");
                  setOverdueOnly(false);
                  updateParams(invoiceNumber, "", false);
                }}
              >
                All
              </button>
              <button
                type="button"
                className={`filter-pill${activeOnly ? " filter-pill--active" : ""}`}
                onClick={() => {
                  setActiveOnly(true);
                  setStatusFilter("");
                  setOverdueOnly(false);
                  updateParams(invoiceNumber, "", false);
                }}
              >
                Active
              </button>
              <button
                type="button"
                className={`filter-pill${statusFilter === "PENDING" && !overdueOnly ? " filter-pill--active" : ""}`}
                onClick={() => {
                  setActiveOnly(false);
                  setStatusFilter("PENDING");
                  setOverdueOnly(false);
                  updateParams(invoiceNumber, "PENDING", false);
                }}
              >
                Pending
              </button>
              <button
                type="button"
                className={`filter-pill${overdueOnly ? " filter-pill--active" : ""}`}
                onClick={() => {
                  setActiveOnly(false);
                  setStatusFilter("");
                  setOverdueOnly(true);
                  updateParams(invoiceNumber, "", true);
                }}
              >
                Overdue
              </button>
            </div>
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setInvoiceNumber("");
                setStatusFilter("");
                setOverdueOnly(false);
                setActiveOnly(false);
                updateParams("", "", false);
              }}
            >
              Clear Filters
            </Button>
            {canEdit ? <Button type="button" onClick={() => setShowForm(true)}>New Invoice</Button> : null}
          </Toolbar>
        }
      />

      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : error ? (
        <ErrorState message="Unable to load invoices." onRetry={() => refetch()} />
      ) : displayItems.length === 0 ? (
        <EmptyState
          title="No invoices yet"
          description="Create an invoice to get started."
          action={canEdit ? <Button onClick={() => setShowForm(true)}>Create Invoice</Button> : null}
        />
      ) : (
        <Table>
          <TableRoot ref={tableRef}>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Vendor</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayItems.map((inv, index) => (
                <tr
                  key={inv.id ?? inv.invoiceNumber}
                  {...getRowProps(index, {
                    onEnter: () => {
                      if (inv.id) router.push(`/finance/invoices/${inv.id}`);
                    },
                    disabled: !inv.id
                  })}
                >
                  <td>
                    <HighlightText text={inv.invoiceNumber ?? "-"} query={highlightQuery} />
                  </td>
                  <td>
                    <HighlightText text={inv.vendorId ?? "-"} query={highlightQuery} />
                  </td>
                  <td>
                    <Badge label={inv.status ?? "PENDING"} tone={getStatusTone(inv.status ?? "PENDING")} />
                  </td>
                  <td>{formatMoney(inv.invoiceAmount)}</td>
                  <td>
                    <div className="row-actions">
                      <Button variant="ghost" onClick={() => inv.id && router.push(`/finance/invoices/${inv.id}`)}>View →</Button>
                      {canEdit ? (
                        <Button variant="ghost" onClick={() => { setSelected(inv); setShowConfirm(true); }}>Delete</Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableRoot>
        </Table>
      )}

      <InvoiceForm
        open={showForm}
        onSubmit={handleSave}
        onClose={() => setShowForm(false)}
        isSubmitting={createMutation.isPending}
      />

      <ConfirmDialog
        open={showConfirm}
        title="Delete invoice?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
