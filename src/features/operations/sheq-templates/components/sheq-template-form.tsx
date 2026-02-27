"use client";

import { useEffect, useState } from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import type { SheqTemplate } from "@/features/operations/sheq-templates/types";
import { validateSheqTemplate } from "@/features/operations/sheq-templates/schemas";

function serializeItems(items: string[] | undefined) {
  return (items ?? []).join("\n");
}

function parseItems(text: string) {
  return text
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function SheqTemplateForm({
  open,
  initialValues,
  onSubmit,
  onClose,
  isSubmitting
}: {
  open: boolean;
  initialValues?: SheqTemplate;
  onSubmit: (values: SheqTemplate) => void;
  onClose: () => void;
  isSubmitting?: boolean;
}) {
  const [values, setValues] = useState<SheqTemplate>(initialValues ?? { templateName: "", items: [] });
  const [itemsText, setItemsText] = useState(serializeItems(initialValues?.items));
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setValues(initialValues ?? { templateName: "", items: [] });
    setItemsText(serializeItems(initialValues?.items));
    setErrors({});
  }, [initialValues, open]);

  const handleSubmit = () => {
    const payload: SheqTemplate = {
      ...values,
      items: parseItems(itemsText)
    };
    const nextErrors = validateSheqTemplate(payload);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(payload);
  };

  return (
    <Modal open={open} title={initialValues ? "Edit SHEQ Template" : "New SHEQ Template"} onClose={onClose}>
      <ModalBody>
        <div className="form-grid">
          <FormField label="Template Name" htmlFor="sheq-template-name" error={errors.templateName}>
            <Input
              id="sheq-template-name"
              value={values.templateName}
              onChange={(event) => setValues((prev) => ({ ...prev, templateName: event.target.value }))}
            />
          </FormField>
          <FormField
            label="Checklist Items"
            htmlFor="sheq-template-items"
            error={errors.items}
            helper="Enter one item per line."
            className="full-width"
          >
            <textarea
              id="sheq-template-items"
              rows={6}
              value={itemsText}
              onChange={(event) => setItemsText(event.target.value)}
            />
          </FormField>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button>
      </ModalFooter>
    </Modal>
  );
}
