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
import { BudgetForm } from "@/features/finance/budgets/components/budget-form";
import { useBudgets, useBudgetsByStatus, useBudgetsByProject, useCreateBudget, useDeleteBudget, useBudgetActions } from "@/features/finance/budgets/hooks";
import type { ProjectBudget, ProjectBudgetCreate } from "@/features/finance/budgets/types";
import { useCanEdit } from "@/lib/auth/require-role";
import { useToast } from "@/components/ui/toast";
import { Table, TableRoot } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils/money";
import { RowActions } from "@/components/ui/row-actions";
import { getStatusTone } from "@/lib/utils/status-tone";
import { useTableKeyboardNavigation } from "@/components/ui/table-navigation";

export default function BudgetsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "");
  const [projectFilter, setProjectFilter] = useState(searchParams.get("projectId") ?? "");
  const [selected, setSelected] = useState<ProjectBudget | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const listQuery = useBudgets(!statusFilter && !projectFilter);
  const statusQuery = useBudgetsByStatus(statusFilter);
  const projectQuery = useBudgetsByProject(projectFilter);
  const createMutation = useCreateBudget();
  const deleteMutation = useDeleteBudget();
  const actions = useBudgetActions();
  const canEdit = useCanEdit();
  const { notify } = useToast();

  useEffect(() => {
    setStatusFilter(searchParams.get("status") ?? "");
    setProjectFilter(searchParams.get("projectId") ?? "");
  }, [searchParams]);

  const updateParams = (nextStatus: string, nextProject: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextStatus) {
      params.set("status", nextStatus);
    } else {
      params.delete("status");
    }
    if (nextProject.trim()) {
      params.set("projectId", nextProject.trim());
    } else {
      params.delete("projectId");
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const items = useMemo(() => {
    if (projectFilter) {
      const base = projectQuery.data ? [projectQuery.data] : [];
      if (!statusFilter) return base;
      return base.filter((budget) => (budget.status ?? "DRAFT") === statusFilter);
    }
    if (statusFilter) return statusQuery.data ?? [];
    return listQuery.data ?? [];
  }, [projectFilter, projectQuery.data, statusFilter, statusQuery.data, listQuery.data]);

  const { tableRef, getRowProps } = useTableKeyboardNavigation(items.length);

  const isLoading = projectFilter
    ? projectQuery.isLoading
    : statusFilter
    ? statusQuery.isLoading
    : listQuery.isLoading;
  const error = projectFilter ? projectQuery.error : statusFilter ? statusQuery.error : listQuery.error;
  const refetch = () => {
    listQuery.refetch();
    statusQuery.refetch();
    projectQuery.refetch();
  };

  const handleSave = async (values: ProjectBudgetCreate) => {
    try {
      await createMutation.mutateAsync(values);
      notify({ message: "Budget created", tone: "success" });
      setShowForm(false);
    } catch {
      notify({ message: "Unable to create budget", tone: "error" });
    }
  };

  const handleDelete = async () => {
    if (!selected?.id) return;
    try {
      await deleteMutation.mutateAsync(selected.id);
      notify({ message: "Budget deleted", tone: "success" });
    } catch {
      notify({ message: "Unable to delete budget", tone: "error" });
    } finally {
      setShowConfirm(false);
      setSelected(null);
    }
  };

  const highlightQuery = projectFilter.trim();

  return (
    <div className="page">
      <PageHeader
        title="Budgets"
        subtitle="Plan, approve, and lock project budgets."
        actions={
          <Toolbar>
            <Select
              value={statusFilter}
              onChange={(event) => {
                const next = event.target.value;
                setStatusFilter(next);
                updateParams(next, projectFilter);
              }}
            >
              <option value="">All Statuses</option>
              {["DRAFT", "APPROVED", "LOCKED", "CLOSED"].map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </Select>
            <Input
              placeholder="Project ID"
              value={projectFilter}
              onChange={(event) => {
                const next = event.target.value;
                setProjectFilter(next);
                updateParams(statusFilter, next);
              }}
            />
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setStatusFilter("");
                setProjectFilter("");
                updateParams("", "");
              }}
            >
              Clear Filters
            </Button>
            {canEdit ? <Button type="button" onClick={() => setShowForm(true)}>New Budget</Button> : null}
          </Toolbar>
        }
      />

      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : error ? (
        <ErrorState message="Unable to load budgets." onRetry={() => refetch()} />
      ) : items.length === 0 ? (
        <EmptyState title="No budgets" description="Create a budget to get started." />
      ) : (
        <>
          <div className="desktop-table">
            <Table>
              <TableRoot ref={tableRef}>
            <thead>
              <tr>
                <th>Project</th>
                <th className="status-cell">Status</th>
                <th>Total Value</th>
                <th className="actions-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((budget, index) => (
                <tr
                  key={budget.id ?? budget.projectId}
                  {...getRowProps(index, {
                    onEnter: () => {
                      if (budget.id) router.push(`/finance/budgets/${budget.id}`);
                    },
                    disabled: !budget.id
                  })}
                >
                  <td>
                    <HighlightText text={budget.projectId ?? "-"} query={highlightQuery} />
                  </td>
                  <td className="status-cell">
                    <Badge label={budget.status ?? "DRAFT"} tone={getStatusTone(budget.status ?? "DRAFT")} />
                  </td>
                  <td>{formatMoney(budget.totalValue)}</td>
                  <td className="actions-cell">
                    <div className="row-actions">
                      <Button variant="ghost" onClick={() => router.push(`/finance/budgets/${budget.id}`)}>View →</Button>
                      {canEdit ? (
                        <RowActions
                          actions={[
                            { label: "Lock", onClick: () => actions.lock.mutate(budget.id!) },
                            { label: "Unlock", onClick: () => actions.unlock.mutate(budget.id!) },
                            { label: "Close", onClick: () => actions.close.mutate(budget.id!) },
                            { label: "Delete", onClick: () => { setSelected(budget); setShowConfirm(true); }, tone: "destructive" }
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
            {items.map((budget) => (
              <article key={`mobile-${budget.id ?? budget.projectId}`} className="mobile-card">
                <div className="mobile-card-head">
                  <div>
                    <p className="mobile-card-title">
                      <HighlightText text={budget.projectId ?? "-"} query={highlightQuery} />
                    </p>
                    <p className="mobile-card-subtitle">{formatMoney(budget.totalValue)}</p>
                  </div>
                  <Badge label={budget.status ?? "DRAFT"} tone={getStatusTone(budget.status ?? "DRAFT")} />
                </div>
                <div className="mobile-card-actions">
                  <Button variant="ghost" onClick={() => router.push(`/finance/budgets/${budget.id}`)}>View -&gt;</Button>
                  {canEdit ? (
                    <RowActions
                      actions={[
                        { label: "Lock", onClick: () => actions.lock.mutate(budget.id!) },
                        { label: "Unlock", onClick: () => actions.unlock.mutate(budget.id!) },
                        { label: "Close", onClick: () => actions.close.mutate(budget.id!) },
                        { label: "Delete", onClick: () => { setSelected(budget); setShowConfirm(true); }, tone: "destructive" }
                      ]}
                    />
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      <BudgetForm
        open={showForm}
        onSubmit={handleSave}
        onClose={() => setShowForm(false)}
        isSubmitting={createMutation.isPending}
      />

      <ConfirmDialog
        open={showConfirm}
        title="Delete budget?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        confirmTone="destructive"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
