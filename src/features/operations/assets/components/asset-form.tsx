"use client";

import { useEffect, useState } from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import type {
  Asset,
  AssetAvailability,
  AssetCategory,
  AssetCondition,
  AssetOwnership
} from "@/features/operations/assets/types";
import { validateAsset } from "@/features/operations/assets/schemas";

const statusOptions = ["ACTIVE", "UNDER_REPAIR", "DECOMMISSIONED"] as const;
const categoryOptions: AssetCategory[] = ["HEAVY_EQUIPMENT", "SMALL_EQUIPMENT", "TOOLS", "VEHICLES"];
const ownershipOptions: AssetOwnership[] = ["OWNED", "LEASED", "RENTED"];
const conditionOptions: AssetCondition[] = ["GOOD", "FAIR", "POOR"];
const availabilityOptions: AssetAvailability[] = ["AVAILABLE", "IN_USE", "MAINTENANCE"];
const numericFields = new Set(["year", "purchaseCost", "engineHours", "serviceIntervalHours", "utilizationPercent"]);

const defaultValues: Asset = {
  assetCode: "",
  type: "",
  telematicsId: "",
  status: "ACTIVE",
  currentLocationWkt: ""
};

const normalizeCategory = (category?: Asset["category"] | null): AssetCategory | null => {
  if (!category) return null;
  if (category === "VEHICLE") return "VEHICLES";
  if (category === "TOOL") return "TOOLS";
  if (category === "PLANT" || category === "OTHER") return "SMALL_EQUIPMENT";
  return category;
};

const emptyToNull = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const normalizeForForm = (asset?: Asset): Asset => {
  const next = asset ? { ...asset } : { ...defaultValues };
  next.category = normalizeCategory(next.category);
  if (!next.personInChargeId && next.operatorId) {
    next.personInChargeId = next.operatorId;
  }
  return next;
};

const normalizeForSubmit = (values: Asset): Asset => {
  const personInChargeId = emptyToNull(values.personInChargeId ?? values.operatorId ?? null);
  return {
    ...values,
    category: normalizeCategory(values.category),
    assignedProjectId: emptyToNull(values.assignedProjectId),
    assignedProjectName: emptyToNull(values.assignedProjectName),
    allocationStartDate: values.allocationStartDate || null,
    allocationEndDate: values.allocationEndDate || null,
    personInChargeId,
    personInChargeName: emptyToNull(values.personInChargeName),
    operatorId: personInChargeId,
    rentalStartDate: values.rentalStartDate || null,
    rentalEndDate: values.rentalEndDate || null
  };
};

export function AssetForm({
  open,
  initialValues,
  onSubmit,
  onClose,
  isSubmitting
}: {
  open: boolean;
  initialValues?: Asset;
  onSubmit: (values: Asset) => void;
  onClose: () => void;
  isSubmitting?: boolean;
}) {
  const [values, setValues] = useState<Asset>(normalizeForForm(initialValues));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setValues((prev) => {
      if (!numericFields.has(name)) {
        return { ...prev, [name]: value };
      }
      if (value === "") {
        return { ...prev, [name]: undefined };
      }
      const parsed = Number(value);
      return { ...prev, [name]: Number.isNaN(parsed) ? undefined : parsed };
    });
  };

  const handleSubmit = () => {
    const normalizedValues = normalizeForSubmit(values);
    const nextErrors = validateAsset(normalizedValues);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(normalizedValues);
  };

  useEffect(() => {
    if (open) {
      setValues(normalizeForForm(initialValues));
      setErrors({});
    }
  }, [open, initialValues]);

  return (
    <Modal open={open} title={initialValues ? "Edit Asset" : "New Asset"} onClose={onClose}>
      <ModalBody>
        <div className="form-grid">
          <label>
            <span>Asset Code</span>
            <input name="assetCode" value={values.assetCode} onChange={handleChange} />
            {errors.assetCode ? <small className="muted">{errors.assetCode}</small> : null}
          </label>
          <label>
            <span>Type</span>
            <input name="type" value={values.type ?? ""} onChange={handleChange} />
          </label>
          <label>
            <span>Category</span>
            <select name="category" value={values.category ?? ""} onChange={handleChange}>
              <option value="">Not set</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Telematics ID</span>
            <input name="telematicsId" value={values.telematicsId ?? ""} onChange={handleChange} />
          </label>
          <label>
            <span>Status</span>
            <select name="status" value={values.status ?? "ACTIVE"} onChange={handleChange}>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Availability</span>
            <select name="availability" value={values.availability ?? ""} onChange={handleChange}>
              <option value="">Not set</option>
              {availabilityOptions.map((availability) => (
                <option key={availability} value={availability}>
                  {availability}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Assigned Project ID</span>
            <input name="assignedProjectId" value={values.assignedProjectId ?? ""} onChange={handleChange} />
          </label>
          <label>
            <span>Assigned Project Name</span>
            <input name="assignedProjectName" value={values.assignedProjectName ?? ""} onChange={handleChange} />
          </label>
          <label>
            <span>Person in Charge (Staff ID)</span>
            <input name="personInChargeId" value={values.personInChargeId ?? ""} onChange={handleChange} />
            {errors.personInChargeId ? <small className="muted">{errors.personInChargeId}</small> : null}
          </label>
          <label>
            <span>Person in Charge Name</span>
            <input name="personInChargeName" value={values.personInChargeName ?? ""} onChange={handleChange} />
          </label>
          <label>
            <span>Allocation Start</span>
            <input name="allocationStartDate" type="date" value={values.allocationStartDate ?? ""} onChange={handleChange} />
          </label>
          <label>
            <span>Allocation End</span>
            <input name="allocationEndDate" type="date" value={values.allocationEndDate ?? ""} onChange={handleChange} />
            {errors.allocationEndDate ? <small className="muted">{errors.allocationEndDate}</small> : null}
          </label>
          <label>
            <span>Make</span>
            <input name="make" value={values.make ?? ""} onChange={handleChange} />
          </label>
          <label>
            <span>Model</span>
            <input name="model" value={values.model ?? ""} onChange={handleChange} />
          </label>
          <label>
            <span>Year</span>
            <input name="year" type="number" value={values.year ?? ""} onChange={handleChange} />
          </label>
          <label>
            <span>Serial Number</span>
            <input name="serialNumber" value={values.serialNumber ?? ""} onChange={handleChange} />
          </label>
          <label>
            <span>VIN</span>
            <input name="vin" value={values.vin ?? ""} onChange={handleChange} />
          </label>
          <label>
            <span>Ownership</span>
            <select name="ownership" value={values.ownership ?? ""} onChange={handleChange}>
              <option value="">Not set</option>
              {ownershipOptions.map((ownership) => (
                <option key={ownership} value={ownership}>
                  {ownership}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Rental Start</span>
            <input name="rentalStartDate" type="date" value={values.rentalStartDate ?? ""} onChange={handleChange} />
            {errors.rentalStartDate ? <small className="muted">{errors.rentalStartDate}</small> : null}
          </label>
          <label>
            <span>Rental End</span>
            <input name="rentalEndDate" type="date" value={values.rentalEndDate ?? ""} onChange={handleChange} />
            {errors.rentalEndDate ? <small className="muted">{errors.rentalEndDate}</small> : null}
          </label>
          <label>
            <span>Purchase Date</span>
            <input name="purchaseDate" type="date" value={values.purchaseDate ?? ""} onChange={handleChange} />
          </label>
          <label>
            <span>Purchase Cost</span>
            <input name="purchaseCost" type="number" value={values.purchaseCost ?? ""} onChange={handleChange} />
          </label>
          <label>
            <span>Supplier ID</span>
            <input name="supplierId" value={values.supplierId ?? ""} onChange={handleChange} />
          </label>
          <label>
            <span>Engine Hours</span>
            <input name="engineHours" type="number" value={values.engineHours ?? ""} onChange={handleChange} />
          </label>
          <label>
            <span>Last Service</span>
            <input name="lastServiceDate" type="date" value={values.lastServiceDate ?? ""} onChange={handleChange} />
          </label>
          <label>
            <span>Next Service</span>
            <input name="nextServiceDate" type="date" value={values.nextServiceDate ?? ""} onChange={handleChange} />
          </label>
          <label>
            <span>Service Interval (hrs)</span>
            <input name="serviceIntervalHours" type="number" value={values.serviceIntervalHours ?? ""} onChange={handleChange} />
          </label>
          <label>
            <span>Condition</span>
            <select name="condition" value={values.condition ?? ""} onChange={handleChange}>
              <option value="">Not set</option>
              {conditionOptions.map((condition) => (
                <option key={condition} value={condition}>
                  {condition}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Utilization %</span>
            <input name="utilizationPercent" type="number" min={0} max={100} value={values.utilizationPercent ?? ""} onChange={handleChange} />
            {errors.utilizationPercent ? <small className="muted">{errors.utilizationPercent}</small> : null}
          </label>
          <label className="full-width">
            <span>Current Location (WKT)</span>
            <input name="currentLocationWkt" value={values.currentLocationWkt ?? ""} onChange={handleChange} />
          </label>
          <label className="full-width">
            <span>Notes</span>
            <textarea name="notes" value={values.notes ?? ""} onChange={handleChange} />
          </label>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
