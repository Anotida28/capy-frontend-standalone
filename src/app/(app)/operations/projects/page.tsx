"use client";

import { useMemo, useState } from "react";
import PageHeader from "@/components/layout/page-header";
import { Toolbar } from "@/components/layout/toolbar";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ProjectForm } from "@/features/operations/projects/components/project-form";
import { ProjectTable } from "@/features/operations/projects/components/project-table";
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from "@/features/operations/projects/hooks";
import type { Project } from "@/features/operations/projects/types";
import { useCanEdit } from "@/lib/auth/require-role";
import { useToast } from "@/components/ui/toast";
import { useDebouncedValue } from "@/lib/utils/debounce";

export default function ProjectsPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [budgetSort, setBudgetSort] = useState("none");
  const [selected, setSelected] = useState<Project | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { data, isLoading, error, refetch } = useProjects();
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();
  const canEdit = useCanEdit();
  const { notify } = useToast();

  const debouncedQuery = useDebouncedValue(query, 400);

  const items = useMemo(() => {
    if (!data) return [];
    const filtered = data.filter((project) => {
      const term = debouncedQuery.toLowerCase();
      const matchesQuery = [
        project.name,
        project.projectCode ?? "",
        project.clientName ?? "",
        project.locationName ?? "",
        project.siteManagerName ?? ""
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
      const matchesStatus = statusFilter === "ALL" ? true : project.status === statusFilter;
      return matchesQuery && matchesStatus;
    });

    if (budgetSort === "none") return filtered;

    const sortFactor = budgetSort === "desc" ? -1 : 1;
    return [...filtered].sort((a, b) => {
      const aValue = Number(a.budgetId);
      const bValue = Number(b.budgetId);
      const aNum = Number.isNaN(aValue) ? null : aValue;
      const bNum = Number.isNaN(bValue) ? null : bValue;

      if (aNum === null && bNum === null) return 0;
      if (aNum === null) return 1;
      if (bNum === null) return -1;
      return (aNum - bNum) * sortFactor;
    });
  }, [data, debouncedQuery, statusFilter, budgetSort]);

  const handleSave = async (values: Project) => {
    try {
      if (selected?.id) {
        await updateMutation.mutateAsync({ id: selected.id, payload: values });
        notify({ message: "Project updated", tone: "success" });
      } else {
        await createMutation.mutateAsync(values);
        notify({ message: "Project created", tone: "success" });
      }
      setShowForm(false);
      setSelected(null);
    } catch {
      notify({ message: "Unable to save project", tone: "error" });
    }
  };

  const handleDelete = async () => {
    if (!selected?.id) return;
    try {
      await deleteMutation.mutateAsync(selected.id);
      notify({ message: "Project deleted", tone: "success" });
    } catch {
      notify({ message: "Unable to delete project", tone: "error" });
    } finally {
      setShowConfirm(false);
      setSelected(null);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Projects"
        subtitle="Plan and track projects across sites."
        actions={
          <Toolbar className="toolbar--projects">
            <div className="search-field search-field--wide">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                className="search-input"
                placeholder="Search projects..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="toolbar-group">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
                <option value="ARCHIVED">Archived</option>
              </select>
              <select value={budgetSort} onChange={(event) => setBudgetSort(event.target.value)}>
                <option value="none">Budget (No sort)</option>
                <option value="desc">Budget (High → Low)</option>
                <option value="asc">Budget (Low → High)</option>
              </select>
            </div>
            {canEdit ? (
              <Button onClick={() => { setSelected(null); setShowForm(true); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                New Project
              </Button>
            ) : null}
          </Toolbar>
        }
      />

      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : error ? (
        <ErrorState message="Unable to load projects." onRetry={() => refetch()} />
      ) : items.length === 0 ? (
        <EmptyState title="No projects found" description="Create a project to get started." />
      ) : (
        <ProjectTable
          items={items}
          query={debouncedQuery}
          onEdit={(project) => {
            setSelected(project);
            setShowForm(true);
          }}
          onDelete={(project) => {
            setSelected(project);
            setShowConfirm(true);
          }}
        />
      )}

      <ProjectForm
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
        title="Delete project?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        confirmTone="destructive"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
