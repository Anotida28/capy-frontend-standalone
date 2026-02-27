"use client";

import { useState } from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import type { SupplierInvoice, InvoiceLineItem } from "@/features/finance/invoices/types";
import { validateInvoice } from "@/features/finance/invoices/schemas";

export function InvoiceForm({
  open,
  initialValues,
  onSubmit,
  onClose,
  isSubmitting
}: {
  open: boolean;
  initialValues?: SupplierInvoice;
  onSubmit: (values: SupplierInvoice) => void;
  onClose: () => void;
  isSubmitting?: boolean;
}) {
  const [values, setValues] = useState<SupplierInvoice>(
    initialValues ?? {
      invoiceNumber: "",
      vendorId: "",
      purchaseOrderId: "",
      invoiceAmount: 0,
      taxAmount: 0,
      retainagePercentage: 0,
      receivedBy: "",
      lineItems: []
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setValues((prev) => ({
      ...prev,
      [name]: ["invoiceAmount", "taxAmount", "retainagePercentage"].includes(name) ? Number(value) : value
    }));
  };

  const updateLineItem = (index: number, next: Partial<InvoiceLineItem>) => {
    setValues((prev) => {
      const list = [...(prev.lineItems ?? [])];
      list[index] = { ...list[index], ...next } as InvoiceLineItem;
      return { ...prev, lineItems: list };
    });
  };

  const handleSubmit = () => {
    const nextErrors = validateInvoice(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(values);
  };

  return (
    <Modal open={open} title={initialValues ? "Edit Invoice" : "New Invoice"} onClose={onClose}>
      <ModalBody>
        <div className="form-grid">
          <label>
            <span>Invoice Number</span>
            <input name="invoiceNumber" value={values.invoiceNumber} onChange={handleChange} />
            {errors.invoiceNumber ? <small className="muted">{errors.invoiceNumber}</small> : null}
          </label>
          <label>
            <span>Vendor ID</span>
            <input name="vendorId" value={values.vendorId} onChange={handleChange} />
            {errors.vendorId ? <small className="muted">{errors.vendorId}</small> : null}
          </label>
          <label>
            <span>Purchase Order ID</span>
            <input name="purchaseOrderId" value={values.purchaseOrderId ?? ""} onChange={handleChange} />
          </label>
          <label>
            <span>Invoice Amount</span>
            <input type="number" name="invoiceAmount" value={values.invoiceAmount} onChange={handleChange} />
            {errors.invoiceAmount ? <small className="muted">{errors.invoiceAmount}</small> : null}
          </label>
          <label>
            <span>Tax Amount</span>
            <input type="number" name="taxAmount" value={values.taxAmount ?? 0} onChange={handleChange} />
          </label>
          <label>
            <span>Retainage %</span>
            <input type="number" name="retainagePercentage" value={values.retainagePercentage ?? 0} onChange={handleChange} />
          </label>
          <label>
            <span>Received By (Staff ID)</span>
            <input name="receivedBy" value={values.receivedBy} onChange={handleChange} />
            {errors.receivedBy ? <small className="muted">{errors.receivedBy}</small> : null}
          </label>
        </div>

        <div className="surface-card" style={{ marginTop: "1rem" }}>
          <h4>Line Items</h4>
          {(values.lineItems ?? []).map((item, index) => (
            <div key={index} className="form-grid" style={{ marginBottom: "0.75rem" }}>
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
            lineItems: [...(prev.lineItems ?? []), { description: "", quantity: 1, unitPrice: 0 }]
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
