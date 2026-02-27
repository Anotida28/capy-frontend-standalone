"use client";

import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { SectionCard } from "@/components/layout/section-card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SheqTemplateForm } from "@/features/operations/sheq-templates/components/sheq-template-form";
import {
  useSheqTemplate,
  useUpdateSheqTemplate,
  useDeleteSheqTemplate
} from "@/features/operations/sheq-templates/hooks";
import type { SheqTemplate } from "@/features/operations/sheq-templates/types";
import { useCanEdit } from "@/lib/auth/require-role";
import { useToast } from "@/components/ui/toast";
import { useState } from "react";

export default function SheqTemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const templateQuery = useSheqTemplate(id);
  const updateMutation = useUpdateSheqTemplate();
  const deleteMutation = useDeleteSheqTemplate();
  const canEdit = useCanEdit();
  const { notify } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (templateQuery.isLoading) {
    return <Skeleton className="surface-card" />;
  }

  if (templateQuery.error || !templateQuery.data) {
    return <ErrorState message="Unable to load template." />;
  }

  const template = templateQuery.data;

  const handleSave = async (values: SheqTemplate) => {
    try {
      await updateMutation.mutateAsync({ id, payload: values });
      notify({ message: "Template updated", tone: "success" });
      setShowForm(false);
    } catch {
      notify({ message: "Unable to update template", tone: "error" });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      notify({ message: "Template deleted", tone: "success" });
      router.push("/reference/sheq-templates");
    } catch {
      notify({ message: "Unable to delete template", tone: "error" });
    } finally {
      setShowConfirm(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        title={template.templateName}
        subtitle="SHEQ checklist template"
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
        <div className="section-header">
          <h2>Checklist Items</h2>
          <p className="muted">{template.items?.length ?? 0} items</p>
        </div>
        {template.items && template.items.length > 0 ? (
          <ul className="activity-feed" style={{ marginTop: "1rem" }}>
            {template.items.map((item, index) => (
              <li key={`${item}-${index}`}>
                <p>{item}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted" style={{ marginTop: "1rem" }}>
            No items listed for this template.
          </p>
        )}
      </SectionCard>

      <SheqTemplateForm
        open={showForm}
        initialValues={template}
        onSubmit={handleSave}
        onClose={() => setShowForm(false)}
        isSubmitting={updateMutation.isPending}
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
