"use client";

import { useState } from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import type { CostCode } from "@/features/finance/cost-codes/types";
import { validateCostCode } from "@/features/finance/cost-codes/schemas";

const categories = ["MATERIALS", "LABOR", "EQUIPMENT", "SUBCONTRACTOR", "OVERHEAD", "OTHER"] as const;

export function CostCodeForm({
  open,
  initialValues,
  onSubmit,
  onClose,
  isSubmitting
}: {
  open: boolean;
  initialValues?: CostCode;
  onSubmit: (values: CostCode) => void;
  onClose: () => void;
  isSubmitting?: boolean;
}) {
  const [values, setValues] = useState<CostCode>(
    initialValues ?? { code: "", name: "", category: "MATERIALS", description: "", active: true }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    const nextErrors = validateCostCode(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(values);
  };

  return (
    <Modal open={open} title={initialValues ? "Edit Cost Code" : "New Cost Code"} onClose={onClose}>
      <ModalBody>
        <div className="form-grid">
          <FormField label="Code" htmlFor="cost-code" error={errors.code}>
            <Input id="cost-code" name="code" value={values.code} onChange={handleChange} />
          </FormField>
          <FormField label="Name" htmlFor="cost-code-name" error={errors.name}>
            <Input id="cost-code-name" name="name" value={values.name} onChange={handleChange} />
          </FormField>
          <FormField label="Category" htmlFor="cost-code-category" error={errors.category}>
            <Select id="cost-code-category" name="category" value={values.category} onChange={handleChange}>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Description" htmlFor="cost-code-description" className="full-width">
            <Input
              id="cost-code-description"
              name="description"
              value={values.description ?? ""}
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
