"use client";

import { useEffect, useState } from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import type { AssetAllocation } from "@/features/operations/asset-allocations/types";
import { validateAllocation } from "@/features/operations/asset-allocations/schemas";

const blankValues: AssetAllocation = {
  projectId: "",
  assetId: "",
  allocationDate: new Date().toISOString().slice(0, 10),
  deallocationDate: "",
  entryTime: "",
  engineHours: 0
};

export function AllocationForm({
  open,
  initialValues,
  onSubmit,
  onClose,
  isSubmitting
}: {
  open: boolean;
  initialValues?: AssetAllocation;
  onSubmit: (values: AssetAllocation) => void;
  onClose: () => void;
  isSubmitting?: boolean;
}) {
  const [values, setValues] = useState<AssetAllocation>(initialValues ?? blankValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    if (initialValues) {
      setValues({
        ...initialValues,
        deallocationDate: initialValues.deallocationDate ?? "",
        entryTime: initialValues.entryTime ?? "",
        engineHours: initialValues.engineHours ?? 0
      });
    } else {
      setValues(blankValues);
    }
    setErrors({});
  }, [open, initialValues]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setValues((prev) => ({
      ...prev,
      [name]: name === "engineHours" ? Number(value) : value
    }));
  };

  const handleSubmit = () => {
    const nextErrors = validateAllocation(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(values);
  };

  return (
    <Modal open={open} title={initialValues ? "Edit Allocation" : "New Allocation"} onClose={onClose}>
      <ModalBody>
        <div className="form-grid">
          <FormField label="Project ID" htmlFor="allocation-project-id" error={errors.projectId}>
            <Input id="allocation-project-id" name="projectId" value={values.projectId} onChange={handleChange} />
          </FormField>
          <FormField label="Asset ID" htmlFor="allocation-asset-id" error={errors.assetId}>
            <Input id="allocation-asset-id" name="assetId" value={values.assetId} onChange={handleChange} />
          </FormField>
          <FormField label="Allocation Date" htmlFor="allocation-date" error={errors.allocationDate}>
            <Input
              id="allocation-date"
              type="date"
              name="allocationDate"
              value={values.allocationDate}
              onChange={handleChange}
            />
          </FormField>
          <FormField label="Deallocation Date" htmlFor="deallocation-date">
            <Input
              id="deallocation-date"
              type="date"
              name="deallocationDate"
              value={values.deallocationDate ?? ""}
              onChange={handleChange}
            />
          </FormField>
          <FormField label="Entry Time" htmlFor="allocation-entry-time">
            <Input id="allocation-entry-time" name="entryTime" value={values.entryTime ?? ""} onChange={handleChange} />
          </FormField>
          <FormField label="Engine Hours" htmlFor="allocation-engine-hours">
            <Input
              id="allocation-engine-hours"
              type="number"
              name="engineHours"
              value={values.engineHours ?? 0}
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
