"use client";

import { useState } from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import type { LaborNorm } from "@/features/operations/labor-norms/types";
import { validateLaborNorm } from "@/features/operations/labor-norms/schemas";

export function LaborNormForm({
  open,
  initialValues,
  onSubmit,
  onClose,
  isSubmitting
}: {
  open: boolean;
  initialValues?: LaborNorm;
  onSubmit: (values: LaborNorm) => void;
  onClose: () => void;
  isSubmitting?: boolean;
}) {
  const [values, setValues] = useState<LaborNorm>(
    initialValues ?? { activityCode: "", description: "", unit: "", standardHoursPerUnit: 1 }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: name === "standardHoursPerUnit" ? Number(value) : value }));
  };

  const handleSubmit = () => {
    const nextErrors = validateLaborNorm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(values);
  };

  return (
    <Modal open={open} title={initialValues ? "Edit Labor Norm" : "New Labor Norm"} onClose={onClose}>
      <ModalBody>
        <div className="form-grid">
          <label>
            <span>Activity Code</span>
            <input name="activityCode" value={values.activityCode} onChange={handleChange} />
            {errors.activityCode ? <small className="muted">{errors.activityCode}</small> : null}
          </label>
          <label>
            <span>Description</span>
            <input name="description" value={values.description} onChange={handleChange} />
            {errors.description ? <small className="muted">{errors.description}</small> : null}
          </label>
          <label>
            <span>Unit</span>
            <input name="unit" value={values.unit} onChange={handleChange} />
            {errors.unit ? <small className="muted">{errors.unit}</small> : null}
          </label>
          <label>
            <span>Hours / Unit</span>
            <input type="number" name="standardHoursPerUnit" value={values.standardHoursPerUnit} onChange={handleChange} />
            {errors.standardHoursPerUnit ? <small className="muted">{errors.standardHoursPerUnit}</small> : null}
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
