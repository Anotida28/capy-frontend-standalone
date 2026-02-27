"use client";

import { useEffect, useState } from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import type { BudgetLineItem } from "@/features/finance/budgets/types";

export function BudgetLineItemForm({
  open,
  initialValues,
  onSubmit,
  onClose,
  isSubmitting
}: {
  open: boolean;
  initialValues?: BudgetLineItem;
  onSubmit: (values: { allocatedAmount: number; notes?: string | null }) => void;
  onClose: () => void;
  isSubmitting?: boolean;
}) {
  const [allocatedAmount, setAllocatedAmount] = useState(initialValues?.allocatedAmount ?? 0);
  const [notes, setNotes] = useState(initialValues?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAllocatedAmount(initialValues?.allocatedAmount ?? 0);
    setNotes(initialValues?.notes ?? "");
    setError(null);
  }, [initialValues, open]);

  const handleSubmit = () => {
    if (allocatedAmount < 0) {
      setError("Allocated amount must be non-negative.");
      return;
    }
    onSubmit({ allocatedAmount, notes: notes || null });
  };

  return (
    <Modal open={open} title="Edit Line Item" onClose={onClose}>
      <ModalBody>
        <div className="form-grid">
          <FormField label="Allocated Amount" htmlFor="line-item-allocated" error={error ?? undefined}>
            <Input
              id="line-item-allocated"
              type="number"
              value={allocatedAmount}
              onChange={(event) => setAllocatedAmount(Number(event.target.value))}
            />
          </FormField>
          <FormField label="Notes" htmlFor="line-item-notes" className="full-width">
            <Input
              id="line-item-notes"
              value={notes ?? ""}
              onChange={(event) => setNotes(event.target.value)}
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
