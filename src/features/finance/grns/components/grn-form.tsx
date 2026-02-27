"use client";

import { useState } from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import type { GRN, GRNLineItem } from "@/features/finance/grns/types";
import { validateGrn } from "@/features/finance/grns/schemas";

export function GRNForm({
  open,
  initialValues,
  onSubmit,
  onClose,
  isSubmitting
}: {
  open: boolean;
  initialValues?: GRN;
  onSubmit: (values: GRN) => void;
  onClose: () => void;
  isSubmitting?: boolean;
}) {
  const [values, setValues] = useState<GRN>(
    initialValues ?? { purchaseOrderId: "", receivedBy: "", receivedDate: new Date().toISOString().slice(0, 10), lineItems: [] }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const updateLineItem = (index: number, next: Partial<GRNLineItem>) => {
    setValues((prev) => {
      const list = [...(prev.lineItems ?? [])];
      list[index] = { ...list[index], ...next } as GRNLineItem;
      return { ...prev, lineItems: list };
    });
  };

  const handleSubmit = () => {
    const nextErrors = validateGrn(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(values);
  };

  return (
    <Modal open={open} title={initialValues ? "Edit GRN" : "New GRN"} onClose={onClose}>
      <ModalBody>
        <div className="form-grid">
          <label>
            <span>Purchase Order ID</span>
            <input name="purchaseOrderId" value={values.purchaseOrderId} onChange={handleChange} />
            {errors.purchaseOrderId ? <small className="muted">{errors.purchaseOrderId}</small> : null}
          </label>
          <label>
            <span>Received By (Staff ID)</span>
            <input name="receivedBy" value={values.receivedBy} onChange={handleChange} />
            {errors.receivedBy ? <small className="muted">{errors.receivedBy}</small> : null}
          </label>
          <label>
            <span>Received Date</span>
            <input type="date" name="receivedDate" value={values.receivedDate ?? ""} onChange={handleChange} />
          </label>
          <label>
            <span>Delivery Note</span>
            <input name="deliveryNote" value={values.deliveryNote ?? ""} onChange={handleChange} />
          </label>
        </div>

        <div className="surface-card" style={{ marginTop: "1rem" }}>
          <h4>Line Items</h4>
          {(values.lineItems ?? []).map((item, index) => (
            <div key={index} className="form-grid" style={{ marginBottom: "0.75rem" }}>
              <label>
                <span>PO Line Item ID</span>
                <input value={item.poLineItemId} onChange={(e) => updateLineItem(index, { poLineItemId: e.target.value })} />
              </label>
              <label>
                <span>Description</span>
                <input value={item.description} onChange={(e) => updateLineItem(index, { description: e.target.value })} />
              </label>
              <label>
                <span>Received Qty</span>
                <input type="number" value={item.receivedQuantity} onChange={(e) => updateLineItem(index, { receivedQuantity: Number(e.target.value) })} />
              </label>
              <label>
                <span>Accepted Qty</span>
                <input type="number" value={item.acceptedQuantity} onChange={(e) => updateLineItem(index, { acceptedQuantity: Number(e.target.value) })} />
              </label>
            </div>
          ))}
          <Button variant="ghost" onClick={() => setValues((prev) => ({
            ...prev,
            lineItems: [...(prev.lineItems ?? []), { poLineItemId: "", description: "", receivedQuantity: 0, acceptedQuantity: 0 }]
          }))}
          >
            Add Line Item
          </Button>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button>
      </ModalFooter>
    </Modal>
  );
}
