"use client";

import { useEffect, useState } from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import type { MaterialCatalogItem } from "@/features/operations/material-catalog/types";
import { validateMaterial } from "@/features/operations/material-catalog/schemas";

const blankValues: MaterialCatalogItem = { itemCode: "", name: "", standardUnit: "" };

export function MaterialForm({
  open,
  initialValues,
  onSubmit,
  onClose,
  isSubmitting
}: {
  open: boolean;
  initialValues?: MaterialCatalogItem;
  onSubmit: (values: MaterialCatalogItem) => void;
  onClose: () => void;
  isSubmitting?: boolean;
}) {
  const [values, setValues] = useState<MaterialCatalogItem>(initialValues ?? blankValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    if (initialValues) {
      setValues({ ...initialValues });
    } else {
      setValues(blankValues);
    }
    setErrors({});
  }, [open, initialValues]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    const nextErrors = validateMaterial(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(values);
  };

  return (
    <Modal open={open} title={initialValues ? "Edit Material" : "New Material"} onClose={onClose}>
      <ModalBody>
        <div className="form-grid">
          <FormField label="Item Code" htmlFor="material-item-code" error={errors.itemCode}>
            <Input id="material-item-code" name="itemCode" value={values.itemCode} onChange={handleChange} />
          </FormField>
          <FormField label="Name" htmlFor="material-name" error={errors.name}>
            <Input id="material-name" name="name" value={values.name} onChange={handleChange} />
          </FormField>
          <FormField label="Standard Unit" htmlFor="material-unit" error={errors.standardUnit}>
            <Input id="material-unit" name="standardUnit" value={values.standardUnit} onChange={handleChange} />
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
