"use client";

import { useMemo, useState } from "react";
import PageHeader from "@/components/layout/page-header";
import { SectionCard } from "@/components/layout/section-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DailyLogForm } from "@/features/operations/daily-logs/components/daily-log-form";
import { DailyLogTable } from "@/features/operations/daily-logs/components/daily-log-table";
import { useDailyLogs, useCreateDailyLog, useUpdateDailyLog, useDeleteDailyLog } from "@/features/operations/daily-logs/hooks";
import type { DailyLog } from "@/features/operations/daily-logs/types";
import { useTeamAssignments } from "@/features/operations/team-assignments/hooks";
import { useCanEdit } from "@/lib/auth/require-role";
import { useToast } from "@/components/ui/toast";

type LogView = "ALL" | "PROJECT" | "EMPLOYEE";

const todayIso = () => new Date().toISOString().slice(0, 10);

const normalizeKey = (value?: string | null) => value?.trim().toLowerCase() ?? "";

const isAssignmentActiveOnDate = (
  assignment: { startDate: string; endDate: string; deactivationDate?: string | null },
  dateIso: string
) => {
  const current = new Date(dateIso);
  const start = assignment.startDate ? new Date(assignment.startDate) : null;
  const end = assignment.endDate ? new Date(assignment.endDate) : null;
  const deactivation = assignment.deactivationDate ? new Date(assignment.deactivationDate) : null;
  if (Number.isNaN(current.getTime())) return false;
  if (start && current < start) return false;
  if (end && current > end) return false;
  if (deactivation && current >= deactivation) return false;
  return true;
};

export default function DailyLogsPage() {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<LogView>("ALL");
  const [complianceDate, setComplianceDate] = useState(todayIso());
  const [selected, setSelected] = useState<DailyLog | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { data, isLoading, error, refetch } = useDailyLogs();
  const assignmentsQuery = useTeamAssignments();
  const createMutation = useCreateDailyLog();
  const updateMutation = useUpdateDailyLog();
  const deleteMutation = useDeleteDailyLog();
  const canEdit = useCanEdit();
  const { notify } = useToast();

  const filteredLogs = useMemo(() => {
    const logs = data ?? [];
    const loweredQuery = query.toLowerCase().trim();
    return logs.filter((log) => {
      const type = log.logType ?? "PROJECT";
      const matchesView = view === "ALL" ? true : type === view;
      if (!matchesView) return false;
      if (!loweredQuery) return true;
      const haystack = [
        log.projectName ?? "",
        log.projectId ?? "",
        log.employeeName ?? "",
        log.employeeId ?? "",
        log.weather ?? "",
        log.delayNotes ?? "",
        type
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(loweredQuery);
    });
  }, [data, query, view]);

  const logCompliance = useMemo(() => {
    const assignmentRows = (assignmentsQuery.data ?? []).filter((assignment) =>
      isAssignmentActiveOnDate(assignment, complianceDate)
    );

    const employeeLogKeys = new Set(
      (data ?? [])
        .filter((log) => (log.logType ?? "PROJECT") === "EMPLOYEE" && log.date === complianceDate)
        .flatMap((log) => [normalizeKey(log.employeeId), normalizeKey(log.employeeName)])
        .filter(Boolean)
    );

    const requiredByEmployee = new Map<
      string,
      { employeeId?: string | null; employeeName?: string | null; projects: string[] }
    >();

    assignmentRows.forEach((assignment) => {
      const employeeId = assignment.staff?.id ?? null;
      const employeeName = assignment.staffName ?? null;
      const uniqueKey = normalizeKey(employeeId) || normalizeKey(employeeName);
      if (!uniqueKey) return;
      if (!requiredByEmployee.has(uniqueKey)) {
        requiredByEmployee.set(uniqueKey, { employeeId, employeeName, projects: [] });
      }
      const entry = requiredByEmployee.get(uniqueKey);
      if (!entry) return;
      const projectLabel = assignment.projectName ?? assignment.project?.id ?? "Project";
      if (!entry.projects.includes(projectLabel)) entry.projects.push(projectLabel);
    });

    const requiredEmployees = Array.from(requiredByEmployee.entries()).map(([key, value]) => ({
      key,
      ...value
    }));

    const missing = requiredEmployees.filter((employee) => !employeeLogKeys.has(employee.key));

    return {
      requiredCount: requiredEmployees.length,
      submittedCount: requiredEmployees.length - missing.length,
      missing
    };
  }, [assignmentsQuery.data, data, complianceDate]);

  const handleSave = async (values: DailyLog) => {
    try {
      if (selected?.id) {
        await updateMutation.mutateAsync({ id: selected.id, payload: values });
        notify({ message: "Log updated", tone: "success" });
      } else {
        await createMutation.mutateAsync(values);
        notify({ message: "Log created", tone: "success" });
      }
      setShowForm(false);
      setSelected(null);
    } catch {
      notify({ message: "Unable to save log", tone: "error" });
    }
  };

  const handleDelete = async () => {
    if (!selected?.id) return;
    try {
      await deleteMutation.mutateAsync(selected.id);
      notify({ message: "Log deleted", tone: "success" });
    } catch {
      notify({ message: "Unable to delete log", tone: "error" });
    } finally {
      setShowConfirm(false);
      setSelected(null);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Logs"
        subtitle="Manage project logs and employee logs."
        actions={
          <>
            <div className="search-field">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                className="search-input"
                placeholder="Search logs"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <select value={view} onChange={(event) => setView(event.target.value as LogView)}>
              <option value="ALL">All Logs</option>
              <option value="PROJECT">Project Logs</option>
              <option value="EMPLOYEE">Employee Logs</option>
            </select>
            {canEdit ? (
              <Button
                onClick={() => {
                  setSelected(null);
                  setShowForm(true);
                }}
              >
                New Log
              </Button>
            ) : null}
          </>
        }
      />

      <SectionCard>
        <div className="section-header">
          <h2>Employee Log Compliance</h2>
          <p className="muted">Assigned employees must submit a daily employee log.</p>
        </div>
        <div className="toolbar" style={{ marginBottom: "1rem" }}>
          <label>
            <span className="muted">Date</span>
            <input type="date" value={complianceDate} onChange={(event) => setComplianceDate(event.target.value)} />
          </label>
          <Badge
            label={`${logCompliance.submittedCount}/${logCompliance.requiredCount} submitted`}
            tone={logCompliance.missing.length === 0 ? "approved" : "pending"}
          />
        </div>
        {logCompliance.requiredCount === 0 ? (
          <p className="muted">No active project assignments on this date.</p>
        ) : logCompliance.missing.length === 0 ? (
          <p className="muted">All assigned employees have submitted their employee log.</p>
        ) : (
          <ul className="activity-feed">
            {logCompliance.missing.map((item) => (
              <li key={item.key} className="activity-item">
                <div>
                  <p className="table-title">{item.employeeName ?? item.employeeId ?? "Unknown employee"}</p>
                  <p className="activity-meta">Assigned to: {item.projects.join(", ")}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {isLoading ? (
        <Skeleton className="surface-card" />
      ) : error ? (
        <ErrorState message="Unable to load logs." onRetry={() => refetch()} />
      ) : filteredLogs.length === 0 ? (
        <EmptyState title="No logs found" description="Create a project or employee log to get started." />
      ) : (
        <DailyLogTable
          items={filteredLogs}
          query={query}
          onEdit={(log) => {
            setSelected(log);
            setShowForm(true);
          }}
          onDelete={(log) => {
            setSelected(log);
            setShowConfirm(true);
          }}
        />
      )}

      <DailyLogForm
        open={showForm}
        initialValues={selected ?? undefined}
        onSubmit={handleSave}
        onClose={() => {
          setShowForm(false);
          setSelected(null);
        }}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        open={showConfirm}
        title="Delete log?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
