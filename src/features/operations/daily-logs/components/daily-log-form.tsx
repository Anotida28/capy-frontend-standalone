"use client";

import { useEffect, useState } from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import type { DailyLog, ProgressEntry, SiteMedia } from "@/features/operations/daily-logs/types";
import { validateDailyLog } from "@/features/operations/daily-logs/schemas";

const blankLog = (): DailyLog => ({
  logType: "PROJECT",
  projectId: "",
  projectName: "",
  employeeId: "",
  employeeName: "",
  date: new Date().toISOString().slice(0, 10),
  weather: "",
  delayNotes: "",
  progressEntries: [],
  siteMedia: []
});

const normalizeForForm = (values?: DailyLog): DailyLog => ({
  ...blankLog(),
  ...values,
  logType: values?.logType ?? "PROJECT",
  projectId: values?.projectId ?? "",
  projectName: values?.projectName ?? "",
  employeeId: values?.employeeId ?? "",
  employeeName: values?.employeeName ?? "",
  progressEntries: values?.progressEntries ?? [],
  siteMedia: values?.siteMedia ?? []
});

const emptyToNull = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const normalizeForSubmit = (values: DailyLog): DailyLog => {
  const logType = values.logType ?? "PROJECT";
  return {
    ...values,
    logType,
    projectId: emptyToNull(values.projectId),
    projectName: emptyToNull(values.projectName),
    employeeId: emptyToNull(values.employeeId),
    employeeName: emptyToNull(values.employeeName),
    weather: emptyToNull(values.weather),
    delayNotes: emptyToNull(values.delayNotes),
    progressEntries: logType === "PROJECT" ? values.progressEntries ?? [] : [],
    siteMedia: values.siteMedia ?? []
  };
};

export function DailyLogForm({
  open,
  initialValues,
  onSubmit,
  onClose,
  isSubmitting
}: {
  open: boolean;
  initialValues?: DailyLog;
  onSubmit: (values: DailyLog) => void;
  onClose: () => void;
  isSubmitting?: boolean;
}) {
  const [values, setValues] = useState<DailyLog>(normalizeForForm(initialValues));
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setValues(normalizeForForm(initialValues));
    setErrors({});
  }, [open, initialValues]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const updateProgress = (index: number, next: Partial<ProgressEntry>) => {
    setValues((prev) => {
      const list = [...(prev.progressEntries ?? [])];
      list[index] = { ...list[index], ...next } as ProgressEntry;
      return { ...prev, progressEntries: list };
    });
  };

  const updateMedia = (index: number, next: Partial<SiteMedia>) => {
    setValues((prev) => {
      const list = [...(prev.siteMedia ?? [])];
      list[index] = { ...list[index], ...next } as SiteMedia;
      return { ...prev, siteMedia: list };
    });
  };

  const handleSubmit = () => {
    const payload = normalizeForSubmit(values);
    const nextErrors = validateDailyLog(payload);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(payload);
  };

  const isProjectLog = (values.logType ?? "PROJECT") === "PROJECT";

  return (
    <Modal open={open} title={initialValues ? "Edit Log" : "New Log"} onClose={onClose}>
      <ModalBody>
        <div className="form-grid">
          <label>
            <span>Log Type</span>
            <select name="logType" value={values.logType ?? "PROJECT"} onChange={handleChange}>
              <option value="PROJECT">Project Log</option>
              <option value="EMPLOYEE">Employee Log</option>
            </select>
          </label>
          <label>
            <span>Date</span>
            <input type="date" name="date" value={values.date} onChange={handleChange} />
            {errors.date ? <small className="muted">{errors.date}</small> : null}
          </label>

          {isProjectLog ? (
            <>
              <label>
                <span>Project ID</span>
                <input name="projectId" value={values.projectId ?? ""} onChange={handleChange} />
                {errors.projectId ? <small className="muted">{errors.projectId}</small> : null}
              </label>
              <label>
                <span>Project Name</span>
                <input name="projectName" value={values.projectName ?? ""} onChange={handleChange} />
              </label>
            </>
          ) : (
            <>
              <label>
                <span>Employee ID</span>
                <input name="employeeId" value={values.employeeId ?? ""} onChange={handleChange} />
                {errors.employeeId ? <small className="muted">{errors.employeeId}</small> : null}
              </label>
              <label>
                <span>Employee Name</span>
                <input name="employeeName" value={values.employeeName ?? ""} onChange={handleChange} />
              </label>
              <label>
                <span>Project ID (optional)</span>
                <input name="projectId" value={values.projectId ?? ""} onChange={handleChange} />
              </label>
              <label>
                <span>Project Name (optional)</span>
                <input name="projectName" value={values.projectName ?? ""} onChange={handleChange} />
              </label>
            </>
          )}

          <label className="full-width">
            <span>Weather</span>
            <input name="weather" value={values.weather ?? ""} onChange={handleChange} />
          </label>
          <label className="full-width">
            <span>{isProjectLog ? "Delay Notes" : "General Log Notes"}</span>
            <textarea name="delayNotes" value={values.delayNotes ?? ""} onChange={handleChange} rows={3} />
          </label>
        </div>

        {isProjectLog ? (
          <div className="surface-card" style={{ marginTop: "1rem" }}>
            <h4>Project Progress Entries</h4>
            {(values.progressEntries ?? []).map((entry, index) => (
              <div key={index} className="form-grid" style={{ marginBottom: "0.75rem" }}>
                <label>
                  <span>Scope Item ID</span>
                  <input
                    value={entry.scopeItemId ?? ""}
                    onChange={(event) => updateProgress(index, { scopeItemId: event.target.value })}
                  />
                </label>
                <label>
                  <span>BOQ Code</span>
                  <input
                    value={entry.scopeItemBoqCode ?? ""}
                    onChange={(event) => updateProgress(index, { scopeItemBoqCode: event.target.value })}
                  />
                </label>
                <label>
                  <span>Quantity Completed</span>
                  <input
                    type="number"
                    value={entry.quantityCompleted ?? 0}
                    onChange={(event) => updateProgress(index, { quantityCompleted: Number(event.target.value) })}
                  />
                </label>
              </div>
            ))}
            <Button
              variant="ghost"
              onClick={() =>
                setValues((prev) => ({
                  ...prev,
                  progressEntries: [...(prev.progressEntries ?? []), { scopeItemId: "", quantityCompleted: 0 }]
                }))
              }
            >
              Add Progress Entry
            </Button>
          </div>
        ) : null}

        <div className="surface-card" style={{ marginTop: "1rem" }}>
          <h4>Media</h4>
          {(values.siteMedia ?? []).map((media, index) => (
            <div key={index} className="form-grid" style={{ marginBottom: "0.75rem" }}>
              <label className="full-width">
                <span>Media URL</span>
                <input
                  value={media.mediaUrl ?? ""}
                  onChange={(event) => updateMedia(index, { mediaUrl: event.target.value })}
                />
              </label>
              <label className="full-width">
                <span>Description</span>
                <input
                  value={media.description ?? ""}
                  onChange={(event) => updateMedia(index, { description: event.target.value })}
                />
              </label>
            </div>
          ))}
          <Button
            variant="ghost"
            onClick={() =>
              setValues((prev) => ({
                ...prev,
                siteMedia: [...(prev.siteMedia ?? []), { mediaUrl: "" }]
              }))
            }
          >
            Add Media
          </Button>
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
