"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { SectionCard } from "@/components/layout/section-card";
import { Table, TableRoot } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  useProject,
  useProjectMilestones,
  useCreateProjectMilestone,
  useUpdateProjectMilestone,
  useDeleteProjectMilestone,
  useTeamAssignmentsByProject,
  useUpdateProject
} from "@/features/operations/projects/hooks";
import type { ProjectMilestone } from "@/features/operations/projects/types";
import { useBudgetsByProject } from "@/features/finance/budgets/hooks";
import { useStaff } from "@/features/operations/staff/hooks";
import type { StaffRole } from "@/features/operations/staff/types";
import { useAssets } from "@/features/operations/assets/hooks";
import { useAuth } from "@/providers/auth-provider";
import { resolveStaffIdForUser } from "@/lib/auth/user-profile";
import { formatDate } from "@/lib/utils/date";
import { formatMoney } from "@/lib/utils/money";
import { getStatusTone } from "@/lib/utils/status-tone";
import { useCanManageProject } from "@/lib/auth/require-role";
import { useToast } from "@/components/ui/toast";

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

const milestoneDefaults = (projectId: string): ProjectMilestone => ({
  projectId,
  name: "",
  targetDate: "",
  status: "PLANNED",
  progressPercent: 0
});

export default function SiteManagerProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) ?? "";
  const { username } = useAuth();
  const staffId = resolveStaffIdForUser(username);
  const canManage = useCanManageProject();
  const { notify } = useToast();

  const projectQuery = useProject(id);
  const milestonesQuery = useProjectMilestones(id);
  const createMilestone = useCreateProjectMilestone();
  const updateMilestone = useUpdateProjectMilestone();
  const deleteMilestone = useDeleteProjectMilestone();
  const teamQuery = useTeamAssignmentsByProject(id);
  const budgetQuery = useBudgetsByProject(id);
  const staffQuery = useStaff();
  const updateProject = useUpdateProject();
  const assetsQuery = useAssets();

  const project = projectQuery.data;
  const [showPolicy, setShowPolicy] = useState(false);
  const [showMilestoneEditor, setShowMilestoneEditor] = useState(false);
  const [milestoneEditingId, setMilestoneEditingId] = useState<string | null>(null);
  const [milestoneDeleteTarget, setMilestoneDeleteTarget] = useState<ProjectMilestone | null>(null);
  const [milestoneValues, setMilestoneValues] = useState<ProjectMilestone>(milestoneDefaults(id));
  const [policyValues, setPolicyValues] = useState({
    shiftStartTime: "",
    shiftEndTime: "",
    autoClockoutTime: "",
    gracePeriodMinutes: "",
    overtimeAllowed: false,
    overtimeMaxHours: ""
  });

  const assignedAssets = (assetsQuery.data ?? []).filter((asset) => asset.assignedProjectId === id);
  const staffRoleById = useMemo(() => {
    const map = new Map<string, StaffRole>();
    (staffQuery.data ?? []).forEach((member) => {
      if (member.id) map.set(member.id, member.role);
    });
    return map;
  }, [staffQuery.data]);

  useEffect(() => {
    setMilestoneValues(milestoneDefaults(id));
    setMilestoneEditingId(null);
    setShowMilestoneEditor(false);
  }, [id]);

  if (projectQuery.isLoading) return <Skeleton className="surface-card" />;
  if (projectQuery.error || !project) return <ErrorState message="Unable to load project." />;

  if (staffId && project.siteManagerId && project.siteManagerId !== staffId) {
    return <ErrorState message="This project is not assigned to your account." />;
  }

  const progress = project.percentComplete ?? 0;
  const parsedBudget = Number(project.budgetId ?? "");
  const budgetTotal = budgetQuery.data?.totalValue ?? (Number.isFinite(parsedBudget) ? parsedBudget : null);
  const spentToDate = budgetQuery.data?.totalSpent ?? null;
  const isEditingMilestone = Boolean(milestoneEditingId);
  const isSavingMilestone = createMilestone.isPending || updateMilestone.isPending;

  const milestoneTone = (status: string) => {
    if (status === "COMPLETE") return "completed";
    if (status === "IN_PROGRESS") return "active";
    if (status === "DELAYED") return "on_hold";
    if (status === "PLANNED") return "planning";
    return "pending";
  };

  const openAddMilestone = () => {
    setMilestoneEditingId(null);
    setMilestoneValues(milestoneDefaults(id));
    setShowMilestoneEditor(true);
  };

  const openEditMilestone = (milestone: ProjectMilestone) => {
    setMilestoneEditingId(milestone.id ?? null);
    setMilestoneValues({
      ...milestone,
      projectId: id,
      description: milestone.description ?? "",
      actualDate: milestone.actualDate ?? ""
    });
    setShowMilestoneEditor(true);
  };

  const closeMilestoneEditor = () => {
    setShowMilestoneEditor(false);
    setMilestoneEditingId(null);
    setMilestoneValues(milestoneDefaults(id));
  };

  const openPolicyEditor = () => {
    setPolicyValues({
      shiftStartTime: project.shiftStartTime ?? "",
      shiftEndTime: project.shiftEndTime ?? "",
      autoClockoutTime: project.autoClockoutTime ?? "",
      gracePeriodMinutes: project.gracePeriodMinutes != null ? String(project.gracePeriodMinutes) : "",
      overtimeAllowed: project.overtimeAllowed ?? false,
      overtimeMaxHours: project.overtimeMaxHours != null ? String(project.overtimeMaxHours) : ""
    });
    setShowPolicy(true);
  };

  const handlePolicySave = async () => {
    if (!project.id) return;
    try {
      await updateProject.mutateAsync({
        id: project.id,
        payload: {
          ...project,
          shiftStartTime: policyValues.shiftStartTime || null,
          shiftEndTime: policyValues.shiftEndTime || null,
          autoClockoutTime: policyValues.autoClockoutTime || null,
          gracePeriodMinutes: policyValues.gracePeriodMinutes ? Number(policyValues.gracePeriodMinutes) : null,
          overtimeAllowed: policyValues.overtimeAllowed,
          overtimeMaxHours: policyValues.overtimeMaxHours ? Number(policyValues.overtimeMaxHours) : null
        }
      });
      notify({ message: "Time policy updated", tone: "success" });
      setShowPolicy(false);
    } catch {
      notify({ message: "Unable to update time policy", tone: "error" });
    }
  };

  const handleMilestoneSave = async () => {
    if (!milestoneValues.name || !milestoneValues.targetDate) return;
    try {
      const payload: ProjectMilestone = {
        ...milestoneValues,
        projectId: id,
        actualDate: milestoneValues.actualDate || null,
        description: milestoneValues.description || null
      };
      if (milestoneEditingId) {
        await updateMilestone.mutateAsync({ id: milestoneEditingId, payload });
        notify({ message: "Milestone updated", tone: "success" });
      } else {
        await createMilestone.mutateAsync(payload);
        notify({ message: "Milestone added", tone: "success" });
      }
      closeMilestoneEditor();
    } catch {
      notify({ message: milestoneEditingId ? "Unable to update milestone" : "Unable to add milestone", tone: "error" });
    }
  };

  const handleMilestoneDelete = async () => {
    if (!milestoneDeleteTarget?.id) return;
    try {
      await deleteMilestone.mutateAsync({ id: milestoneDeleteTarget.id, projectId: id });
      notify({ message: "Milestone deleted", tone: "success" });
      if (milestoneEditingId === milestoneDeleteTarget.id) {
        closeMilestoneEditor();
      }
    } catch {
      notify({ message: "Unable to delete milestone", tone: "error" });
    } finally {
      setMilestoneDeleteTarget(null);
    }
  };

  return (
    <PageShell>
      <PageHeader
        title={project.name}
        subtitle={project.locationName ?? project.projectCode ?? ""}
        actions={
          <Button variant="ghost" onClick={() => router.push("/operations/site-manager/projects")}>
            Back to Projects
          </Button>
        }
      />

      <SectionCard>
        <div className="form-grid">
          <div>
            <p className="muted">Status</p>
            <Badge label={project.status} tone={getStatusTone(project.status)} />
          </div>
          <div>
            <p className="muted">Stage</p>
            <p className="table-title">{project.stage ?? "-"}</p>
          </div>
          <div>
            <p className="muted">Health</p>
            <p className="table-title">{project.health ?? "-"}</p>
          </div>
          <div>
            <p className="muted">Progress</p>
            <p className="table-title">{progress}% complete</p>
          </div>
          <div>
            <p className="muted">Budget</p>
            <p className="table-title">{budgetTotal != null ? formatMoney(budgetTotal) : "-"}</p>
          </div>
          <div>
            <p className="muted">Spent to Date</p>
            <p className="table-title">{spentToDate != null ? formatMoney(spentToDate) : "Not available"}</p>
          </div>
          <div>
            <p className="muted">Start Date</p>
            <p className="table-title">{formatDate(project.startDate)}</p>
          </div>
          <div>
            <p className="muted">End Date</p>
            <p className="table-title">{formatDate(project.endDate)}</p>
          </div>
          <div>
            <p className="muted">Auto Clockout</p>
            <p className="table-title">{project.autoClockoutTime ?? "17:00"}</p>
          </div>
          <div className="full-width">
            <p className="muted">Description</p>
            <p className="table-title">{project.description ?? "No description available."}</p>
          </div>
        </div>
      </SectionCard>

      <div className="grid-two">
        <SectionCard>
          <div className="section-header">
            <h2>Assigned Staff</h2>
            <p className="muted">Team members currently on this project.</p>
          </div>
          {teamQuery.isLoading ? (
            <p className="muted">Loading team...</p>
          ) : teamQuery.error ? (
            <ErrorState message="Unable to load team assignments." />
          ) : (teamQuery.data ?? []).length === 0 ? (
            <EmptyState title="No staff assigned" description="Assignments will appear here once added." />
          ) : (
            <>
              <div className="desktop-table">
                <Table>
                  <TableRoot>
                    <thead>
                      <tr>
                        <th>Staff</th>
                        <th>Task at Site</th>
                        <th>Start</th>
                        <th>End</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(teamQuery.data ?? []).map((assignment) => {
                        const staffRole = assignment.staff?.id ? staffRoleById.get(assignment.staff.id) : undefined;
                        const roleLabel = staffRole ? STAFF_ROLE_LABEL[staffRole] : "Role not set";
                        const taskAtSite = staffRole ? SITE_TASK_BY_ROLE[staffRole] : "General site support";
                        return (
                          <tr key={assignment.id}>
                            <td>
                              <div className="table-title">{assignment.staffName ?? assignment.staff?.id ?? "-"}</div>
                              <div className="muted">{roleLabel}</div>
                            </td>
                            <td>{taskAtSite}</td>
                            <td>{assignment.startDate}</td>
                            <td>{assignment.endDate}</td>
                            <td>
                              <Badge
                                label={assignment.deactivationDate ? "Ended" : "Active"}
                                tone={assignment.deactivationDate ? "inactive" : "approved"}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </TableRoot>
                </Table>
              </div>
              <div className="mobile-list">
                {(teamQuery.data ?? []).map((assignment) => {
                  const staffRole = assignment.staff?.id ? staffRoleById.get(assignment.staff.id) : undefined;
                  const roleLabel = staffRole ? STAFF_ROLE_LABEL[staffRole] : "Role not set";
                  const taskAtSite = staffRole ? SITE_TASK_BY_ROLE[staffRole] : "General site support";
                  const statusLabel = assignment.deactivationDate ? "Ended" : "Active";
                  const statusTone = assignment.deactivationDate ? "inactive" : "approved";
                  return (
                    <article key={`staff-mobile-${assignment.id}`} className="mobile-card">
                      <div className="mobile-card-head">
                        <div>
                          <p className="mobile-card-title">{assignment.staffName ?? assignment.staff?.id ?? "-"}</p>
                          <p className="mobile-card-subtitle">{roleLabel}</p>
                        </div>
                        <Badge label={statusLabel} tone={statusTone} />
                      </div>
                      <div className="mobile-card-grid">
                        <div className="mobile-field">
                          <span className="mobile-label">Task at Site</span>
                          <span className="mobile-value">{taskAtSite}</span>
                        </div>
                        <div className="mobile-field">
                          <span className="mobile-label">Start</span>
                          <span className="mobile-value">{assignment.startDate}</span>
                        </div>
                        <div className="mobile-field">
                          <span className="mobile-label">End</span>
                          <span className="mobile-value">{assignment.endDate}</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </SectionCard>

        <SectionCard>
          <div className="section-header">
            <h2>Assigned Equipment</h2>
            <p className="muted">Active equipment for this site.</p>
          </div>
          {assignedAssets.length === 0 ? (
            <EmptyState title="No equipment assigned" description="Assigned assets will appear here." />
          ) : (
            <>
              <div className="desktop-table">
                <Table>
                  <TableRoot>
                    <thead>
                      <tr>
                        <th>Asset</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Availability</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignedAssets.map((asset) => (
                        <tr key={asset.id}>
                          <td>
                            <div className="table-title">{asset.assetCode}</div>
                            <div className="muted">{asset.make ?? ""} {asset.model ?? ""}</div>
                          </td>
                          <td>{asset.type ?? asset.category ?? "-"}</td>
                          <td>{asset.status ?? "-"}</td>
                          <td>{asset.availability ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </TableRoot>
                </Table>
              </div>
              <div className="mobile-list">
                {assignedAssets.map((asset) => (
                  <article key={`asset-mobile-${asset.id}`} className="mobile-card">
                    <div className="mobile-card-head">
                      <div>
                        <p className="mobile-card-title">{asset.assetCode}</p>
                        <p className="mobile-card-subtitle">{asset.make ?? ""} {asset.model ?? ""}</p>
                      </div>
                    </div>
                    <div className="mobile-card-grid">
                      <div className="mobile-field">
                        <span className="mobile-label">Type</span>
                        <span className="mobile-value">{asset.type ?? asset.category ?? "-"}</span>
                      </div>
                      <div className="mobile-field">
                        <span className="mobile-label">Status</span>
                        <span className="mobile-value">{asset.status ?? "-"}</span>
                      </div>
                      <div className="mobile-field">
                        <span className="mobile-label">Availability</span>
                        <span className="mobile-value">{asset.availability ?? "-"}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </SectionCard>
      </div>

      <div className="grid-two">
        <SectionCard>
          <div className="section-header">
            <h2>Time Policy</h2>
            <p className="muted">Shift defaults and auto clockout rules.</p>
          </div>
          <div className="form-grid">
            <div>
              <p className="muted">Shift Start</p>
              <p className="table-title">{project.shiftStartTime ?? "07:00"}</p>
            </div>
            <div>
              <p className="muted">Shift End</p>
              <p className="table-title">{project.shiftEndTime ?? "17:00"}</p>
            </div>
            <div>
              <p className="muted">Auto Clockout</p>
              <p className="table-title">{project.autoClockoutTime ?? project.shiftEndTime ?? "17:00"}</p>
            </div>
            <div>
              <p className="muted">Grace Period</p>
              <p className="table-title">{project.gracePeriodMinutes ?? 0} mins</p>
            </div>
            <div>
              <p className="muted">Overtime Allowed</p>
              <p className="table-title">{project.overtimeAllowed ? "Yes" : "No"}</p>
            </div>
            <div>
              <p className="muted">Overtime Max</p>
              <p className="table-title">{project.overtimeMaxHours ?? 0} hrs</p>
            </div>
          </div>
          {canManage ? (
            <div style={{ marginTop: "1rem" }}>
              <Button variant="ghost" onClick={openPolicyEditor}>
                Edit Time Policy
              </Button>
            </div>
          ) : null}
        </SectionCard>

        <SectionCard>
          <div className="section-header">
            <h2>Milestones & Targets</h2>
            <p className="muted">Planned and completed targets.</p>
          </div>
          {canManage ? (
            <div style={{ marginBottom: "1rem" }}>
              <Button variant="ghost" onClick={openAddMilestone}>
                Add Milestone
              </Button>
            </div>
          ) : null}
          {milestonesQuery.isLoading ? (
            <p className="muted">Loading milestones...</p>
          ) : milestonesQuery.error ? (
            <ErrorState message="Unable to load milestones." />
          ) : (milestonesQuery.data ?? []).length === 0 ? (
            <EmptyState title="No milestones" description="Milestones will show once added." />
          ) : (
            <>
              <div className="desktop-table">
                <Table>
                  <TableRoot>
                    <thead>
                      <tr>
                        <th>Milestone</th>
                        <th>Target Date</th>
                        <th>Actual Date</th>
                        <th>Status</th>
                        <th>Progress</th>
                        {canManage ? <th className="actions-cell">Actions</th> : null}
                      </tr>
                    </thead>
                    <tbody>
                      {(milestonesQuery.data ?? []).map((milestone) => (
                        <tr key={milestone.id}>
                          <td>
                            <div className="table-title">{milestone.name}</div>
                            <div className="muted">{milestone.description ?? "-"}</div>
                          </td>
                          <td>{formatDate(milestone.targetDate)}</td>
                          <td>{formatDate(milestone.actualDate)}</td>
                          <td>
                            <Badge label={milestone.status} tone={milestoneTone(milestone.status)} />
                          </td>
                          <td>{milestone.progressPercent ?? 0}%</td>
                          {canManage ? (
                            <td className="actions-cell">
                              <div className="row-actions">
                                <Button variant="ghost" onClick={() => openEditMilestone(milestone)}>
                                  Edit
                                </Button>
                                <Button variant="ghost" onClick={() => setMilestoneDeleteTarget(milestone)}>
                                  Delete
                                </Button>
                              </div>
                            </td>
                          ) : null}
                        </tr>
                      ))}
                    </tbody>
                  </TableRoot>
                </Table>
              </div>
              <div className="mobile-list">
                {(milestonesQuery.data ?? []).map((milestone) => (
                  <article key={`milestone-mobile-${milestone.id}`} className="mobile-card">
                    <div className="mobile-card-head">
                      <div>
                        <p className="mobile-card-title">{milestone.name}</p>
                        <p className="mobile-card-subtitle">{milestone.description ?? "-"}</p>
                      </div>
                      <Badge label={milestone.status} tone={milestoneTone(milestone.status)} />
                    </div>
                    <div className="mobile-card-grid">
                      <div className="mobile-field">
                        <span className="mobile-label">Target Date</span>
                        <span className="mobile-value">{formatDate(milestone.targetDate)}</span>
                      </div>
                      <div className="mobile-field">
                        <span className="mobile-label">Actual Date</span>
                        <span className="mobile-value">{formatDate(milestone.actualDate)}</span>
                      </div>
                      <div className="mobile-field">
                        <span className="mobile-label">Progress</span>
                        <span className="mobile-value">{milestone.progressPercent ?? 0}%</span>
                      </div>
                    </div>
                    {canManage ? (
                      <div className="mobile-card-actions">
                        <div className="row-actions">
                          <Button variant="ghost" onClick={() => openEditMilestone(milestone)}>
                            Edit
                          </Button>
                          <Button variant="ghost" onClick={() => setMilestoneDeleteTarget(milestone)}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </>
          )}
        </SectionCard>

      </div>

      <Modal open={showPolicy} title="Edit time policy" onClose={() => setShowPolicy(false)}>
        <ModalBody>
          <div className="form-grid">
            <FormField label="Shift start" htmlFor="policy-shift-start">
              <Input
                id="policy-shift-start"
                type="time"
                value={policyValues.shiftStartTime}
                onChange={(event) => setPolicyValues((prev) => ({ ...prev, shiftStartTime: event.target.value }))}
              />
            </FormField>
            <FormField label="Shift end" htmlFor="policy-shift-end">
              <Input
                id="policy-shift-end"
                type="time"
                value={policyValues.shiftEndTime}
                onChange={(event) => setPolicyValues((prev) => ({ ...prev, shiftEndTime: event.target.value }))}
              />
            </FormField>
            <FormField label="Auto clockout" htmlFor="policy-auto-clockout">
              <Input
                id="policy-auto-clockout"
                type="time"
                value={policyValues.autoClockoutTime}
                onChange={(event) => setPolicyValues((prev) => ({ ...prev, autoClockoutTime: event.target.value }))}
              />
            </FormField>
            <FormField label="Grace period (mins)" htmlFor="policy-grace">
              <Input
                id="policy-grace"
                type="number"
                value={policyValues.gracePeriodMinutes}
                onChange={(event) => setPolicyValues((prev) => ({ ...prev, gracePeriodMinutes: event.target.value }))}
              />
            </FormField>
            <FormField label="Overtime max (hrs)" htmlFor="policy-overtime-max">
              <Input
                id="policy-overtime-max"
                type="number"
                value={policyValues.overtimeMaxHours}
                onChange={(event) => setPolicyValues((prev) => ({ ...prev, overtimeMaxHours: event.target.value }))}
              />
            </FormField>
            <FormField label="Overtime allowed" htmlFor="policy-overtime-allowed">
              <input
                id="policy-overtime-allowed"
                type="checkbox"
                checked={policyValues.overtimeAllowed}
                onChange={(event) => setPolicyValues((prev) => ({ ...prev, overtimeAllowed: event.target.checked }))}
              />
            </FormField>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowPolicy(false)}>
            Cancel
          </Button>
          <Button onClick={handlePolicySave} disabled={updateProject.isPending}>
            {updateProject.isPending ? "Saving..." : "Save Policy"}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal
        open={showMilestoneEditor}
        title={isEditingMilestone ? "Edit milestone" : "Add milestone"}
        onClose={closeMilestoneEditor}
      >
        <ModalBody>
          <div className="form-grid">
            <FormField label="Milestone name" htmlFor="site-milestone-name">
              <Input
                id="site-milestone-name"
                value={milestoneValues.name}
                onChange={(event) => setMilestoneValues((prev) => ({ ...prev, name: event.target.value }))}
              />
            </FormField>
            <FormField label="Target date" htmlFor="site-milestone-target">
              <Input
                id="site-milestone-target"
                type="date"
                value={milestoneValues.targetDate}
                onChange={(event) => setMilestoneValues((prev) => ({ ...prev, targetDate: event.target.value }))}
              />
            </FormField>
            <FormField label="Status" htmlFor="site-milestone-status">
              <select
                id="site-milestone-status"
                value={milestoneValues.status}
                onChange={(event) =>
                  setMilestoneValues((prev) => ({ ...prev, status: event.target.value as ProjectMilestone["status"] }))
                }
              >
                {["PLANNED", "IN_PROGRESS", "COMPLETE", "DELAYED"].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Progress %" htmlFor="site-milestone-progress">
              <Input
                id="site-milestone-progress"
                type="number"
                min={0}
                max={100}
                value={milestoneValues.progressPercent ?? 0}
                onChange={(event) =>
                  setMilestoneValues((prev) => ({ ...prev, progressPercent: Number(event.target.value) }))
                }
              />
            </FormField>
            <FormField label="Actual date" htmlFor="site-milestone-actual">
              <Input
                id="site-milestone-actual"
                type="date"
                value={milestoneValues.actualDate ?? ""}
                onChange={(event) =>
                  setMilestoneValues((prev) => ({ ...prev, actualDate: event.target.value || null }))
                }
              />
            </FormField>
            <FormField label="Description" htmlFor="site-milestone-description" className="full-width">
              <Input
                id="site-milestone-description"
                value={milestoneValues.description ?? ""}
                onChange={(event) => setMilestoneValues((prev) => ({ ...prev, description: event.target.value }))}
              />
            </FormField>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={closeMilestoneEditor}>
            Cancel
          </Button>
          <Button onClick={handleMilestoneSave} disabled={isSavingMilestone}>
            {isSavingMilestone ? "Saving..." : isEditingMilestone ? "Save Changes" : "Add Milestone"}
          </Button>
        </ModalFooter>
      </Modal>

      <ConfirmDialog
        open={Boolean(milestoneDeleteTarget)}
        title="Delete milestone?"
        description={`This will permanently remove "${milestoneDeleteTarget?.name ?? "this milestone"}".`}
        confirmLabel="Delete"
        confirmTone="destructive"
        onConfirm={handleMilestoneDelete}
        onCancel={() => setMilestoneDeleteTarget(null)}
      />
    </PageShell>
  );
}
