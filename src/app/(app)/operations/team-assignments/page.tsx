"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import PageHeader from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { SectionCard } from "@/components/layout/section-card";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { HighlightText } from "@/components/ui/highlight-text";
import { useTableKeyboardNavigation } from "@/components/ui/table-navigation";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableRoot } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useCanEdit } from "@/lib/auth/require-role";
import {
  useCreateTeamAssignment,
  useUpdateTeamAssignment,
  useDeleteTeamAssignment,
  useTeamAssignments
} from "@/features/operations/team-assignments/hooks";
import type { TeamAssignment, TeamAssignmentPayload } from "@/features/operations/team-assignments/types";
import { useProjects } from "@/features/operations/projects/hooks";
import { useStaff, useStaffMember } from "@/features/operations/staff/hooks";
import type { StaffRole } from "@/features/operations/staff/types";
import { formatDate } from "@/lib/utils/date";

const blankAssignment: TeamAssignmentPayload = {
  projectId: "",
  staffId: "",
  assignmentDate: "",
  startDate: "",
  endDate: "",
  deactivationDate: ""
};

const STAFF_ROLE_LABEL: Record<StaffRole, string> = {
  MANAGER: "Manager",
  SUPERVISOR: "Supervisor",
  WORKER: "Worker"
};

const SITE_TASK_BY_ROLE: Record<StaffRole, string> = {
  MANAGER: "Site coordination",
  SUPERVISOR: "Trade supervision",
  WORKER: "Field execution"
};

export default function TeamAssignmentsPage() {
  const [createValues, setCreateValues] = useState<TeamAssignmentPayload>(blankAssignment);
  const [updateValues, setUpdateValues] = useState<TeamAssignmentPayload>(blankAssignment);
  const [updateId, setUpdateId] = useState("");
  const [deleteId, setDeleteId] = useState("");
  const [query, setQuery] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState("ALL");
  const [showConfirm, setShowConfirm] = useState(false);
  const [extendingAssignment, setExtendingAssignment] = useState<TeamAssignment | null>(null);
  const [extendDays, setExtendDays] = useState("30");
  const [lookupId, setLookupId] = useState("");
  const createMutation = useCreateTeamAssignment();
  const updateMutation = useUpdateTeamAssignment();
  const deleteMutation = useDeleteTeamAssignment();
  const listQuery = useTeamAssignments();
  const projectsQuery = useProjects();
  const staffQuery = useStaff();
  const staffLookup = useStaffMember(lookupId);
  const canEdit = useCanEdit();
  const { notify } = useToast();

  const staffRoleById = useMemo(() => {
    const map = new Map<string, StaffRole>();
    (staffQuery.data ?? []).forEach((member) => {
      if (member.id) map.set(member.id, member.role);
    });
    return map;
  }, [staffQuery.data]);

  const handleCreate = async () => {
    const projectIds = Array.from(
      new Set(
        createValues.projectId
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      )
    );
    if (projectIds.length === 0) {
      notifyError("Provide at least one project ID");
      return;
    }

    try {
      for (const projectId of projectIds) {
        await createMutation.mutateAsync({
          ...normalizePayload(createValues),
          projectId,
          deactivationDate: createValues.deactivationDate || null
        });
      }
      notify({
        message:
          projectIds.length > 1
            ? `Created ${projectIds.length} assignments for ${createValues.staffId || "staff member"}`
            : "Team assignment created",
        tone: "success"
      });
      setCreateValues(blankAssignment);
    } catch {
      notify({ message: "Unable to create team assignment", tone: "error" });
    }
  };

  const handleUpdate = async () => {
    if (!updateId.trim()) return;
    try {
      await updateMutation.mutateAsync({
        id: updateId,
        payload: { ...normalizePayload(updateValues), deactivationDate: updateValues.deactivationDate || null }
      });
      notify({ message: "Team assignment updated", tone: "success" });
      setUpdateId("");
      setUpdateValues(blankAssignment);
    } catch {
      notify({ message: "Unable to update team assignment", tone: "error" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId.trim()) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      notify({ message: "Team assignment deleted", tone: "success" });
    } catch {
      notify({ message: "Unable to delete team assignment", tone: "error" });
    } finally {
      setShowConfirm(false);
      setDeleteId("");
    }
  };

  const handleExtendAssignment = async () => {
    if (!extendingAssignment?.id) return;
    const days = Number.parseInt(extendDays, 10);
    if (!Number.isFinite(days) || days <= 0) {
      notifyError("Provide a valid number of days");
      return;
    }
    const base = extendingAssignment.endDate ? new Date(extendingAssignment.endDate) : new Date();
    if (Number.isNaN(base.getTime())) {
      notifyError("Current end date is invalid");
      return;
    }
    const next = new Date(base);
    next.setDate(next.getDate() + days);
    try {
      await updateMutation.mutateAsync({
        id: extendingAssignment.id,
        payload: {
          ...toPayload(extendingAssignment),
          endDate: next.toISOString().slice(0, 10)
        }
      });
      notify({ message: `Assignment extended by ${days} day${days === 1 ? "" : "s"}`, tone: "success" });
      setExtendingAssignment(null);
      setExtendDays("30");
    } catch {
      notifyError("Unable to update assignment");
    }
  };

  const renderFields = (prefix: string, values: TeamAssignmentPayload, onChange: (next: TeamAssignmentPayload) => void) => (
    <div className="form-grid">
      <FormField label="Project ID" htmlFor={`${prefix}-project-id`}>
        <Input
          id={`${prefix}-project-id`}
          value={values.projectId}
          onChange={(event) => onChange({ ...values, projectId: event.target.value })}
        />
      </FormField>
      <FormField label="Staff ID" htmlFor={`${prefix}-staff-id`}>
        <Input
          id={`${prefix}-staff-id`}
          value={values.staffId}
          onChange={(event) => onChange({ ...values, staffId: event.target.value })}
        />
      </FormField>
      <FormField label="Start Date" htmlFor={`${prefix}-start-date`}>
        <Input
          id={`${prefix}-start-date`}
          type="date"
          value={values.startDate}
          onChange={(event) => onChange({ ...values, startDate: event.target.value })}
        />
      </FormField>
      <FormField label="End Date" htmlFor={`${prefix}-end-date`}>
        <Input
          id={`${prefix}-end-date`}
          type="date"
          value={values.endDate}
          onChange={(event) => onChange({ ...values, endDate: event.target.value })}
        />
      </FormField>
      <FormField label="Deactivation Date (optional)" htmlFor={`${prefix}-deactivation-date`}>
        <Input
          id={`${prefix}-deactivation-date`}
          type="date"
          value={values.deactivationDate ?? ""}
          onChange={(event) => onChange({ ...values, deactivationDate: event.target.value })}
        />
      </FormField>
    </div>
  );

  const getAssignmentId = (assignment: TeamAssignment) => assignment.id ?? "";
  const notifyError = (message: string) => notify({ message, tone: "error" });
  const todayIso = () => new Date().toISOString().slice(0, 10);
  const normalizePayload = (values: TeamAssignmentPayload): TeamAssignmentPayload => ({
    ...values,
    assignmentDate: values.assignmentDate || values.startDate
  });

  const toPayload = (assignment: TeamAssignment): TeamAssignmentPayload => ({
    projectId: assignment.project?.id ?? "",
    staffId: assignment.staff?.id ?? "",
    assignmentDate: assignment.assignmentDate || assignment.startDate,
    startDate: assignment.startDate,
    endDate: assignment.endDate,
    deactivationDate: assignment.deactivationDate ?? ""
  });

  const getRoleLabel = (assignment: TeamAssignment) => {
    const staffRole = assignment.staff?.id ? staffRoleById.get(assignment.staff.id) : undefined;
    return staffRole ? STAFF_ROLE_LABEL[staffRole] : "Role not set";
  };

  const getTaskAtSite = (assignment: TeamAssignment) => {
    const staffRole = assignment.staff?.id ? staffRoleById.get(assignment.staff.id) : undefined;
    return staffRole ? SITE_TASK_BY_ROLE[staffRole] : "General site support";
  };

  const getAssignmentStatus = (assignment: TeamAssignment) => {
    const today = new Date(todayIso());
    const end = assignment.endDate ? new Date(assignment.endDate) : null;
    const deactivated = assignment.deactivationDate ? new Date(assignment.deactivationDate) : null;
    if (deactivated && deactivated <= today) return "Ended";
    if (end && end < today) return "Ended";
    return "Active";
  };

  const getProjectStatus = (assignment: TeamAssignment) => {
    const projectId = assignment.project?.id;
    if (!projectId || !projectsQuery.data) return null;
    const project = projectsQuery.data.find((item) => item.id === projectId);
    return project?.status ?? null;
  };
  const matchesQuery = (assignment: TeamAssignment, term: string) => {
    const haystack = [
      assignment.projectName ?? "",
      assignment.project?.id ?? "",
      assignment.staffName ?? "",
      assignment.staff?.id ?? "",
      getRoleLabel(assignment),
      getTaskAtSite(assignment)
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(term.toLowerCase());
  };

  const filteredAssignments = (listQuery.data ?? []).filter((assignment) => {
    const queryMatch = query ? matchesQuery(assignment, query) : true;
    if (!queryMatch) return false;
    if (projectStatusFilter === "ALL") return true;
    const status = getProjectStatus(assignment);
    return status === projectStatusFilter;
  });

  const { tableRef, getRowProps } = useTableKeyboardNavigation(filteredAssignments.length);

  return (
    <PageShell>
      <PageHeader title="Team Assignments" subtitle="Assign staff to one or more projects with role-based site tasks." />

      <SectionCard>
        <div className="section-header">
          <h2>Assignments</h2>
          <p className="muted">Review and manage current assignments.</p>
        </div>
        <div className="toolbar" style={{ marginBottom: "1rem" }}>
          <Input
            placeholder="Search by project, staff, role, or task"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            value={projectStatusFilter}
            onChange={(event) => setProjectStatusFilter(event.target.value)}
          >
            <option value="ALL">All Project Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <Button variant="ghost" onClick={() => listQuery.refetch()}>
            Refresh
          </Button>
        </div>
        {listQuery.isLoading ? (
          <p className="muted">Loading assignments...</p>
        ) : listQuery.error ? (
          <ErrorState message="Unable to load assignments." onRetry={() => listQuery.refetch()} />
        ) : filteredAssignments.length === 0 ? (
          <EmptyState title="No assignments found" description="Create a new assignment to get started." />
        ) : (
          <Table>
            <TableRoot ref={tableRef}>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Staff</th>
                  <th>Task at Site</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Status</th>
                  <th className="actions-cell">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map((assignment, index) => (
                  <tr
                    key={assignment.id ?? assignment.staffName ?? assignment.projectName}
                    {...getRowProps(index, {
                      onEnter: () => {
                        setUpdateId(getAssignmentId(assignment));
                        setUpdateValues(toPayload(assignment));
                      }
                    })}
                  >
                    <td>
                      {assignment.project?.id ? (
                        <Link className="table-title" href={`/projects/${assignment.project.id}`}>
                          <HighlightText text={assignment.projectName ?? assignment.project.id ?? "-"} query={query} />
                        </Link>
                      ) : (
                        <div className="table-title">
                          <HighlightText text={assignment.projectName ?? assignment.project?.id ?? "-"} query={query} />
                        </div>
                      )}
                      <div className="muted">
                        <HighlightText text={assignment.project?.id ?? "-"} query={query} />
                      </div>
                    </td>
                    <td>
                      {assignment.staff?.id ? (
                        <Link className="table-title" href={`/operations/staff/${assignment.staff.id}`}>
                          <HighlightText text={assignment.staffName ?? assignment.staff.id ?? "-"} query={query} />
                        </Link>
                      ) : (
                        <div className="table-title">
                          <HighlightText text={assignment.staffName ?? assignment.staff?.id ?? "-"} query={query} />
                        </div>
                      )}
                      <div className="muted">{getRoleLabel(assignment)}</div>
                    </td>
                    <td>{getTaskAtSite(assignment)}</td>
                    <td>{formatDate(assignment.startDate)}</td>
                    <td>{formatDate(assignment.endDate)}</td>
                    <td>
                      <Badge
                        label={getAssignmentStatus(assignment)}
                        tone={getAssignmentStatus(assignment) === "Active" ? "approved" : "inactive"}
                      />
                    </td>
                    <td className="actions-cell">
                      <div className="row-actions">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setUpdateId(getAssignmentId(assignment));
                            setUpdateValues(toPayload(assignment));
                          }}
                        >
                          Edit
                        </Button>
                        {canEdit ? (
                          <>
                            <Button
                              variant="ghost"
                              onClick={async () => {
                                try {
                                  await updateMutation.mutateAsync({
                                    id: getAssignmentId(assignment),
                                    payload: {
                                      ...toPayload(assignment),
                                      deactivationDate: todayIso()
                                    }
                                  });
                                  notify({ message: "Assignment deactivated", tone: "success" });
                                } catch {
                                  notifyError("Unable to update assignment");
                                }
                              }}
                            >
                              Deactivate
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => {
                                setExtendingAssignment(assignment);
                                setExtendDays("30");
                              }}
                            >
                              Extend
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => {
                                setDeleteId(getAssignmentId(assignment));
                                setShowConfirm(true);
                              }}
                            >
                              Delete
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableRoot>
          </Table>
        )}
      </SectionCard>

      <SectionCard>
        <div className="section-header">
          <h2>Create Assignment</h2>
          <p className="muted">Add a staff member to one or more active projects.</p>
        </div>
        <p className="muted" style={{ marginBottom: "0.75rem" }}>
          Enter one project ID or multiple IDs separated by commas to assign the same person across projects.
        </p>
        <p className="muted" style={{ marginBottom: "0.75rem" }}>
          Task at site is derived from staff role. Assignment record date is set from start date.
        </p>
        {renderFields("create", createValues, setCreateValues)}
        {canEdit ? (
          <div style={{ marginTop: "1rem" }}>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Saving..." : "Create Assignment"}
            </Button>
          </div>
        ) : null}
      </SectionCard>

      <SectionCard>
        <div className="section-header">
          <h2>Update Assignment</h2>
          <p className="muted">Provide the assignment ID and updated schedule.</p>
        </div>
        <div className="form-grid form-grid--inline" style={{ marginBottom: "1rem" }}>
          <FormField label="Assignment ID" htmlFor="assignment-id">
            <Input
              id="assignment-id"
              value={updateId}
              onChange={(event) => setUpdateId(event.target.value)}
            />
          </FormField>
          {canEdit ? (
            <Button variant="ghost" onClick={handleUpdate} disabled={!updateId || updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Update"}
            </Button>
          ) : null}
        </div>
        {renderFields("update", updateValues, setUpdateValues)}
      </SectionCard>

      <SectionCard>
        <div className="section-header">
          <h2>Delete Assignment</h2>
          <p className="muted">Remove an assignment by ID.</p>
        </div>
        <div className="form-grid form-grid--inline">
          <FormField label="Assignment ID" htmlFor="assignment-delete-id">
            <Input
              id="assignment-delete-id"
              value={deleteId}
              onChange={(event) => setDeleteId(event.target.value)}
            />
          </FormField>
          {canEdit ? (
            <Button variant="ghost" onClick={() => setShowConfirm(true)} disabled={!deleteId}>
              Delete Assignment
            </Button>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard>
        <div className="section-header">
          <h2>Staff Lookup</h2>
          <p className="muted">Confirm staff details before assigning.</p>
        </div>
        <div className="form-grid form-grid--inline">
          <FormField label="Staff ID" htmlFor="staff-lookup-id">
            <Input
              id="staff-lookup-id"
              value={lookupId}
              onChange={(event) => setLookupId(event.target.value)}
            />
          </FormField>
          <Button variant="ghost" onClick={() => staffLookup.refetch()} disabled={!lookupId}>
            Lookup
          </Button>
        </div>
        {staffLookup.isFetching ? (
          <p className="muted" style={{ marginTop: "0.75rem" }}>Looking up staff...</p>
        ) : staffLookup.data ? (
          <div className="surface-card" style={{ marginTop: "0.75rem" }}>
            <p className="table-title">{staffLookup.data.fullName}</p>
            <p className="muted">Role: {staffLookup.data.role}</p>
            <p className="muted">National ID: {staffLookup.data.nationalId}</p>
          </div>
        ) : lookupId && staffLookup.isError ? (
          <p className="muted" style={{ marginTop: "0.75rem" }}>Staff member not found.</p>
        ) : null}
      </SectionCard>

      <ConfirmDialog
        open={showConfirm}
        title="Delete team assignment?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        confirmTone="destructive"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />

      <Modal
        open={Boolean(extendingAssignment)}
        title="Extend Assignment"
        onClose={() => setExtendingAssignment(null)}
      >
        <ModalBody>
          <FormField
            label="Extend By (Days)"
            htmlFor="assignment-extend-days"
            helper="Select how many days to add to the current end date."
          >
            <Input
              id="assignment-extend-days"
              type="number"
              min={1}
              step={1}
              value={extendDays}
              onChange={(event) => setExtendDays(event.target.value)}
            />
          </FormField>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="ghost"
            onClick={() => {
              setExtendingAssignment(null);
              setExtendDays("30");
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleExtendAssignment} disabled={!extendDays.trim() || updateMutation.isPending}>
            {updateMutation.isPending ? "Extending..." : "Apply Extension"}
          </Button>
        </ModalFooter>
      </Modal>
    </PageShell>
  );
}
