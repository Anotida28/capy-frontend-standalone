"use client";

import { useState } from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import type { PurchaseOrder, POLineItem } from "@/features/finance/purchase-orders/types";
import { validatePurchaseOrder } from "@/features/finance/purchase-orders/schemas";

export function PurchaseOrderForm({
  open,
  initialValues,
  onSubmit,
  onClose,
  isSubmitting
}: {
  open: boolean;
  initialValues?: PurchaseOrder;
  onSubmit: (values: PurchaseOrder) => void;
  onClose: () => void;
  isSubmitting?: boolean;
}) {
  const [values, setValues] = useState<PurchaseOrder>(
    initialValues ?? {
      projectId: "",
      vendorId: "",
      createdBy: "",
      description: "",
      paymentTerms: "",
      deliveryAddress: "",
      lineItems: []
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const updateLineItem = (index: number, next: Partial<POLineItem>) => {
    setValues((prev) => {
      const list = [...(prev.lineItems ?? [])];
      list[index] = { ...list[index], ...next } as POLineItem;
      return { ...prev, lineItems: list };
    });
  };

  const handleSubmit = () => {
    const nextErrors = validatePurchaseOrder(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(values);
  };

  return (
    <Modal open={open} title={initialValues ? "Edit Purchase Order" : "New Purchase Order"} onClose={onClose}>
      <ModalBody>
        <div className="form-grid">
          <label>
            <span>Project ID</span>
            <input name="projectId" value={values.projectId} onChange={handleChange} />
            {errors.projectId ? <small className="muted">{errors.projectId}</small> : null}
          </label>
          <label>
            <span>Vendor ID</span>
            <input name="vendorId" value={values.vendorId} onChange={handleChange} />
            {errors.vendorId ? <small className="muted">{errors.vendorId}</small> : null}
          </label>
          <label>
            <span>Created By (Staff ID)</span>
            <input name="createdBy" value={values.createdBy} onChange={handleChange} />
            {errors.createdBy ? <small className="muted">{errors.createdBy}</small> : null}
          </label>
          <label className="full-width">
            <span>Description</span>
            <input name="description" value={values.description ?? ""} onChange={handleChange} />
          </label>
          <label>
            <span>Payment Terms</span>
            <input name="paymentTerms" value={values.paymentTerms ?? ""} onChange={handleChange} />
          </label>
          <label>
            <span>Delivery Address</span>
            <input name="deliveryAddress" value={values.deliveryAddress ?? ""} onChange={handleChange} />
          </label>
        </div>

        <div className="surface-card" style={{ marginTop: "1rem" }}>
          <h4>Line Items</h4>
          {(values.lineItems ?? []).map((item, index) => (
            <div key={index} className="form-grid" style={{ marginBottom: "0.75rem" }}>
              <label>
                <span>Budget Line Item ID</span>
                <input value={item.budgetLineItemId} onChange={(e) => updateLineItem(index, { budgetLineItemId: e.target.value })} />
              </label>
              <label>
                <span>Description</span>
                <input value={item.description} onChange={(e) => updateLineItem(index, { description: e.target.value })} />
              </label>
              <label>
                <span>Quantity</span>
                <input type="number" value={item.quantity} onChange={(e) => updateLineItem(index, { quantity: Number(e.target.value) })} />
              </label>
              <label>
                <span>Unit Price</span>
                <input type="number" value={item.unitPrice} onChange={(e) => updateLineItem(index, { unitPrice: Number(e.target.value) })} />
              </label>
            </div>
          ))}
          <Button variant="ghost" onClick={() => setValues((prev) => ({
            ...prev,
            lineItems: [...(prev.lineItems ?? []), { budgetLineItemId: "", description: "", quantity: 1, unitPrice: 0 }]
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
