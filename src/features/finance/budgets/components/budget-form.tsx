"use client";

import { useState } from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import type { ProjectBudgetCreate } from "@/features/finance/budgets/types";
import { validateBudget } from "@/features/finance/budgets/schemas";

export function BudgetForm({
  open,
  initialValues,
  onSubmit,
  onClose,
  isSubmitting
}: {
  open: boolean;
  initialValues?: ProjectBudgetCreate;
  onSubmit: (values: ProjectBudgetCreate) => void;
  onClose: () => void;
  isSubmitting?: boolean;
}) {
  const [values, setValues] = useState<ProjectBudgetCreate>(
    initialValues ?? { projectId: "", totalValue: 0, status: "DRAFT" }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setValues((prev) => ({
      ...prev,
      [name]: name === "totalValue" ? Number(value) : value
    }));
  };

  const handleSubmit = () => {
    const nextErrors = validateBudget(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(values);
  };

  return (
    <Modal open={open} title={initialValues ? "Edit Budget" : "New Budget"} onClose={onClose}>
      <ModalBody>
        <div className="form-grid">
          <label>
            <span>Project ID</span>
            <input name="projectId" value={values.projectId} onChange={handleChange} />
            {errors.projectId ? <small className="muted">{errors.projectId}</small> : null}
          </label>
          <label>
            <span>Total Value</span>
            <input type="number" name="totalValue" value={values.totalValue} onChange={handleChange} />
            {errors.totalValue ? <small className="muted">{errors.totalValue}</small> : null}
          </label>
          <label>
            <span>Status</span>
            <select name="status" value={values.status} onChange={handleChange}>
              <option value="DRAFT">DRAFT</option>
              <option value="APPROVED">APPROVED</option>
              <option value="LOCKED">LOCKED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </label>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button>
      </ModalFooter>
    </Modal>
  );
}
