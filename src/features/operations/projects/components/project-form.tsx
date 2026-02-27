"use client";

import { useEffect, useState } from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import type { Project, ProjectFormValues, ProjectHealth, ProjectStage } from "@/features/operations/projects/types";
import { validateProject } from "@/features/operations/projects/schemas";

const statusOptions = ["ACTIVE", "PENDING", "ARCHIVED"] as const;
const healthOptions: ProjectHealth[] = ["GREEN", "AMBER", "RED"];
const stageOptions: ProjectStage[] = ["PLANNING", "EXECUTION", "CLOSEOUT", "ON_HOLD"];
const numericFields = new Set(["percentComplete", "latitude", "longitude"]);

export function ProjectForm({
  open,
  initialValues,
  onSubmit,
  onClose,
  isSubmitting
}: {
  open: boolean;
  initialValues?: Project;
  onSubmit: (values: ProjectFormValues) => void;
  onClose: () => void;
  isSubmitting?: boolean;
}) {
  const [values, setValues] = useState<ProjectFormValues>(
    initialValues ?? { name: "", status: "ACTIVE", budgetId: "" }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
    const nextErrors = validateProject(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit({ ...values, budgetId: values.budgetId || undefined });
  };

  useEffect(() => {
    if (open) {
      setValues(initialValues ?? { name: "", status: "ACTIVE", budgetId: "" });
      setErrors({});
    }
  }, [open, initialValues]);

  return (
    <Modal open={open} title={initialValues ? "Edit Project" : "New Project"} onClose={onClose}>
      <ModalBody>
        <div className="form-grid">
          <label>
            <span>Project name</span>
            <input name="name" value={values.name} onChange={handleChange} />
            {errors.name ? <small className="muted">{errors.name}</small> : null}
          </label>
          <label>
            <span>Project Code</span>
            <input name="projectCode" value={values.projectCode ?? ""} onChange={handleChange} />
          </label>
          <label>
            <span>Client</span>
            <input name="clientName" value={values.clientName ?? ""} onChange={handleChange} />
          </label>
          <label>
            <span>Status</span>
            <select name="status" value={values.status} onChange={handleChange}>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            {errors.status ? <small className="muted">{errors.status}</small> : null}
          </label>
          <label>
            <span>Health</span>
            <select name="health" value={values.health ?? ""} onChange={handleChange}>
              <option value="">Not set</option>
              {healthOptions.map((health) => (
                <option key={health} value={health}>
                  {health}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Stage</span>
            <select name="stage" value={values.stage ?? ""} onChange={handleChange}>
              <option value="">Not set</option>
              {stageOptions.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Percent Complete</span>
            <input
              type="number"
              min={0}
              max={100}
              name="percentComplete"
              value={values.percentComplete ?? ""}
              onChange={handleChange}
            />
            {errors.percentComplete ? <small className="muted">{errors.percentComplete}</small> : null}
          </label>
          <label>
            <span>Budget ID</span>
            <input name="budgetId" value={values.budgetId ?? ""} onChange={handleChange} />
          </label>
          <label>
            <span>Site Manager ID</span>
            <input name="siteManagerId" value={values.siteManagerId ?? ""} onChange={handleChange} />
          </label>
          <label>
            <span>Location Name</span>
            <input name="locationName" value={values.locationName ?? ""} onChange={handleChange} />
          </label>
          <label>
            <span>Address</span>
            <input name="address" value={values.address ?? ""} onChange={handleChange} />
          </label>
          <label>
            <span>Latitude</span>
            <input name="latitude" type="number" value={values.latitude ?? ""} onChange={handleChange} />
          </label>
          <label>
            <span>Longitude</span>
            <input name="longitude" type="number" value={values.longitude ?? ""} onChange={handleChange} />
          </label>
          <label>
            <span>Geofence (WKT)</span>
            <input name="geofenceWkt" value={values.geofenceWkt ?? ""} onChange={handleChange} />
          </label>
          <label>
            <span>Start Date</span>
            <input name="startDate" type="date" value={values.startDate ?? ""} onChange={handleChange} />
          </label>
          <label>
            <span>End Date</span>
            <input name="endDate" type="date" value={values.endDate ?? ""} onChange={handleChange} />
          </label>
          <label>
            <span>Actual Start</span>
            <input name="actualStartDate" type="date" value={values.actualStartDate ?? ""} onChange={handleChange} />
          </label>
          <label>
            <span>Actual End</span>
            <input name="actualEndDate" type="date" value={values.actualEndDate ?? ""} onChange={handleChange} />
          </label>
          <label className="full-width">
            <span>Description</span>
            <textarea
              name="description"
              value={values.description ?? ""}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, description: event.target.value }))
              }
            />
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
