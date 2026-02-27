"use client";

import { useState } from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import type { Staff } from "@/features/operations/staff/types";
import { validateStaff } from "@/features/operations/staff/schemas";

const roles = ["WORKER", "SUPERVISOR", "MANAGER"] as const;

export function StaffForm({
  open,
  initialValues,
  onSubmit,
  onClose,
  isSubmitting
}: {
  open: boolean;
  initialValues?: Staff;
  onSubmit: (values: Staff) => void;
  onClose: () => void;
  isSubmitting?: boolean;
}) {
  const [values, setValues] = useState<Staff>(
    initialValues ?? { fullName: "", nationalId: "", role: "WORKER" }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    const nextErrors = validateStaff(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(values);
  };

  return (
    <Modal open={open} title={initialValues ? "Edit Staff" : "New Staff"} onClose={onClose}>
      <ModalBody>
        <div className="form-grid">
          <label>
            <span>Full Name</span>
            <input name="fullName" value={values.fullName} onChange={handleChange} />
            {errors.fullName ? <small className="muted">{errors.fullName}</small> : null}
          </label>
          <label>
            <span>National ID</span>
            <input name="nationalId" value={values.nationalId} onChange={handleChange} />
            {errors.nationalId ? <small className="muted">{errors.nationalId}</small> : null}
          </label>
          <label>
            <span>Role</span>
            <select name="role" value={values.role} onChange={handleChange}>
              {roles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            {errors.role ? <small className="muted">{errors.role}</small> : null}
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
