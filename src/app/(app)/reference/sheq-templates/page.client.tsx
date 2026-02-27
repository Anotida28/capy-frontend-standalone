"use client";

import { useMemo, useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LookupBar } from "@/components/ui/lookup-bar";
import { SheqTemplateForm } from "@/features/operations/sheq-templates/components/sheq-template-form";
import { SheqTemplateTable } from "@/features/operations/sheq-templates/components/sheq-template-table";
import {
  useSheqTemplates,
  useCreateSheqTemplate,
  useUpdateSheqTemplate,
  useDeleteSheqTemplate
} from "@/features/operations/sheq-templates/hooks";
import type { SheqTemplate } from "@/features/operations/sheq-templates/types";
import { useCanEdit } from "@/lib/auth/require-role";
import { useToast } from "@/components/ui/toast";

export default function SheqTemplatesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [selected, setSelected] = useState<SheqTemplate | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const listQuery = useSheqTemplates();
  const createMutation = useCreateSheqTemplate();
  const updateMutation = useUpdateSheqTemplate();
  const deleteMutation = useDeleteSheqTemplate();
  const canEdit = useCanEdit();
  const { notify } = useToast();

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  const updateParams = (nextQuery: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextQuery.trim()) {
      params.set("q", nextQuery.trim());
    } else {
      params.delete("q");
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const items = useMemo(() => {
    const data = listQuery.data ?? [];
    if (!query.trim()) return data;
    const lowered = query.toLowerCase();
    return data.filter((item) => item.templateName.toLowerCase().includes(lowered));
  }, [listQuery.data, query]);

  const handleSave = async (values: SheqTemplate) => {
    try {
      if (selected?.id) {
        await updateMutation.mutateAsync({ id: selected.id, payload: values });
        notify({ message: "Template updated", tone: "success" });
      } else {
        await createMutation.mutateAsync(values);
        notify({ message: "Template created", tone: "success" });
      }
      setShowForm(false);
      setSelected(null);
    } catch {
      notify({ message: "Unable to save template", tone: "error" });
    }
  };

  const handleDelete = async () => {
    if (!selected?.id) return;
    try {
      await deleteMutation.mutateAsync(selected.id);
      notify({ message: "Template deleted", tone: "success" });
    } catch {
      notify({ message: "Unable to delete template", tone: "error" });
    } finally {
      setShowConfirm(false);
      setSelected(null);
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="SHEQ Templates"
        subtitle="Maintain safety checklists for site inspections."
        actions={
          <LookupBar
            value={query}
            onChange={setQuery}
            onSubmit={() => updateParams(query)}
            onClear={() => {
              setQuery("");
              updateParams("");
            }}
            placeholder="Search templates..."
            actions={
              canEdit ? (
                <Button type="button" onClick={() => { setSelected(null); setShowForm(true); }}>
                  New Template
                </Button>
              ) : null
            }
          />
        }
      />

      {listQuery.isLoading ? (
        <TableSkeleton rows={6} />
      ) : listQuery.error ? (
        <ErrorState message="Unable to load templates." onRetry={() => listQuery.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No templates"
          description="Create a SHEQ template to get started."
          action={canEdit ? <Button onClick={() => setShowForm(true)}>New Template</Button> : null}
        />
      ) : (
        <SheqTemplateTable
          items={items}
          query={query}
          onView={(item) => router.push(`/reference/sheq-templates/${item.id}`)}
          onEdit={(item) => { setSelected(item); setShowForm(true); }}
          onDelete={(item) => { setSelected(item); setShowConfirm(true); }}
        />
      )}

      <SheqTemplateForm
        open={showForm}
        initialValues={selected ?? undefined}
        onSubmit={handleSave}
        onClose={() => { setShowForm(false); setSelected(null); }}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        open={showConfirm}
        title="Delete template?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        confirmTone="destructive"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </PageShell>
  );
}
