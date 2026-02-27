"use client";

import { useEffect, useState } from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import type { ScopeItem } from "@/features/operations/scope-items/types";
import { validateScopeItem } from "@/features/operations/scope-items/schemas";

const blankValues: ScopeItem = {
  projectId: "",
  boqCode: "",
  targetQuantity: 0,
  laborNormFactor: 0,
  plannedHours: 0,
  isOverridden: false,
  overrideReason: ""
};

export function ScopeItemForm({
  open,
  initialValues,
  onSubmit,
  onClose,
  isSubmitting
}: {
  open: boolean;
  initialValues?: ScopeItem;
  onSubmit: (values: ScopeItem) => void;
  onClose: () => void;
  isSubmitting?: boolean;
}) {
  const [values, setValues] = useState<ScopeItem>(initialValues ?? blankValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    if (initialValues) {
      setValues({
        ...initialValues,
        boqCode: initialValues.boqCode ?? "",
        targetQuantity: initialValues.targetQuantity ?? 0,
        laborNormFactor: initialValues.laborNormFactor ?? 0,
        plannedHours: initialValues.plannedHours ?? 0,
        isOverridden: initialValues.isOverridden ?? false,
        overrideReason: initialValues.overrideReason ?? ""
      });
    } else {
      setValues(blankValues);
    }
    setErrors({});
  }, [open, initialValues]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;
    setValues((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name.includes("Quantity") || name.includes("Factor") || name.includes("Hours")
            ? Number(value)
            : value
    }));
  };

  const handleSubmit = () => {
    const nextErrors = validateScopeItem(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(values);
  };

  return (
    <Modal open={open} title={initialValues ? "Edit Scope Item" : "New Scope Item"} onClose={onClose}>
      <ModalBody>
        <div className="form-grid">
          <FormField label="Project ID" htmlFor="scope-project-id" error={errors.projectId}>
            <Input id="scope-project-id" name="projectId" value={values.projectId} onChange={handleChange} />
          </FormField>
          <FormField label="BOQ Code" htmlFor="scope-boq-code">
            <Input id="scope-boq-code" name="boqCode" value={values.boqCode ?? ""} onChange={handleChange} />
          </FormField>
          <FormField label="Target Quantity" htmlFor="scope-target-quantity">
            <Input
              id="scope-target-quantity"
              type="number"
              name="targetQuantity"
              value={values.targetQuantity ?? 0}
              onChange={handleChange}
            />
          </FormField>
          <FormField label="Labor Norm Factor" htmlFor="scope-labor-factor">
            <Input
              id="scope-labor-factor"
              type="number"
              name="laborNormFactor"
              value={values.laborNormFactor ?? 0}
              onChange={handleChange}
            />
          </FormField>
          <FormField label="Planned Hours" htmlFor="scope-planned-hours">
            <Input
              id="scope-planned-hours"
              type="number"
              name="plannedHours"
              value={values.plannedHours ?? 0}
              onChange={handleChange}
            />
          </FormField>
          <FormField label="Override" htmlFor="scope-override">
            <input
              id="scope-override"
              type="checkbox"
              name="isOverridden"
              checked={values.isOverridden ?? false}
              onChange={handleChange}
            />
          </FormField>
          <FormField label="Override Reason" htmlFor="scope-override-reason" className="full-width">
            <Input
              id="scope-override-reason"
              name="overrideReason"
              value={values.overrideReason ?? ""}
              onChange={handleChange}
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
