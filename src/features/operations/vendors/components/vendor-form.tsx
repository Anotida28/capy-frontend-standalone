"use client";

import { useState } from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import type { Vendor } from "@/features/operations/vendors/types";
import { validateVendor } from "@/features/operations/vendors/schemas";

const vendorTypes = ["SUBCONTRACTOR", "SUPPLIER"] as const;

export function VendorForm({
  open,
  initialValues,
  onSubmit,
  onClose,
  isSubmitting
}: {
  open: boolean;
  initialValues?: Vendor;
  onSubmit: (values: Vendor) => void;
  onClose: () => void;
  isSubmitting?: boolean;
}) {
  const [values, setValues] = useState<Vendor>(
    initialValues ?? { companyName: "", type: "SUPPLIER", taxClearanceExpiry: "", performanceRating: 3 }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setValues((prev) => ({
      ...prev,
      [name]: name === "performanceRating" ? Number(value) : value
    }));
  };

  const handleSubmit = () => {
    const nextErrors = validateVendor(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(values);
  };

  return (
    <Modal open={open} title={initialValues ? "Edit Vendor" : "New Vendor"} onClose={onClose}>
      <ModalBody>
        <div className="form-grid">
          <label>
            <span>Company Name</span>
            <input name="companyName" value={values.companyName} onChange={handleChange} />
            {errors.companyName ? <small className="muted">{errors.companyName}</small> : null}
          </label>
          <label>
            <span>Vendor Type</span>
            <select name="type" value={values.type} onChange={handleChange}>
              {vendorTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {errors.type ? <small className="muted">{errors.type}</small> : null}
          </label>
          <label>
            <span>Tax Clearance Expiry</span>
            <input type="date" name="taxClearanceExpiry" value={values.taxClearanceExpiry ?? ""} onChange={handleChange} />
          </label>
          <label>
            <span>Performance Rating</span>
            <input type="number" name="performanceRating" value={values.performanceRating ?? 0} onChange={handleChange} />
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
