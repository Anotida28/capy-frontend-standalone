"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import PageHeader from "@/components/layout/page-header";
import { SectionCard } from "@/components/layout/section-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableRoot } from "@/components/ui/table";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/modal";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ProjectForm } from "@/features/operations/projects/components/project-form";
import {
  useProject,
  useUpdateProject,
  useDeleteProject,
  useProjectMilestones,
  useProjectMedia,
  useCreateProjectMilestone,
  useUpdateProjectMilestone,
  useDeleteProjectMilestone,
  useCreateProjectMedia,
  useTeamAssignmentsByProject
} from "@/features/operations/projects/hooks";
import { useBudgetsByProject } from "@/features/finance/budgets/hooks";
import { useStaff } from "@/features/operations/staff/hooks";
import type { StaffRole } from "@/features/operations/staff/types";
import type { Project, ProjectMilestone, ProjectMedia } from "@/features/operations/projects/types";
import { formatMoney } from "@/lib/utils/money";
import { formatDate } from "@/lib/utils/date";
import { getStatusTone } from "@/lib/utils/status-tone";
import { useCanEdit, useCanManageProject } from "@/lib/auth/require-role";
import { useToast } from "@/components/ui/toast";

const milestoneDefaults = (projectId: string): ProjectMilestone => ({
  projectId,
  name: "",
  targetDate: "",
  status: "PLANNED",
  progressPercent: 0
});

const mediaDefaults = (projectId: string): ProjectMedia => ({
  projectId,
  mediaUrl: "",
  mediaType: "PHOTO",
  description: ""
});

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

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) ?? "";
  const projectQuery = useProject(id);
  const milestonesQuery = useProjectMilestones(id);
  const mediaQuery = useProjectMedia(id);
  const teamQuery = useTeamAssignmentsByProject(id);
  const budgetQuery = useBudgetsByProject(id);
  const staffQuery = useStaff();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const createMilestone = useCreateProjectMilestone();
  const updateMilestone = useUpdateProjectMilestone();
  const deleteMilestone = useDeleteProjectMilestone();
  const createMedia = useCreateProjectMedia();
  const canEdit = useCanEdit();
  const canManageProject = useCanManageProject();
  const { notify } = useToast();

  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showMilestone, setShowMilestone] = useState(false);
  const [milestoneEditingId, setMilestoneEditingId] = useState<string | null>(null);
  const [milestoneDeleteTarget, setMilestoneDeleteTarget] = useState<ProjectMilestone | null>(null);
  const [showMedia, setShowMedia] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [milestoneValues, setMilestoneValues] = useState<ProjectMilestone>(milestoneDefaults(id));
  const [mediaValues, setMediaValues] = useState<ProjectMedia>(mediaDefaults(id));
  const [progressValues, setProgressValues] = useState({
    percentComplete: 0,
    health: "",
    stage: "",
    actualStartDate: "",
    actualEndDate: ""
  });
  const project = projectQuery.data;
  const budget = budgetQuery.data;

  useEffect(() => {
    setMilestoneValues(milestoneDefaults(id));
    setMediaValues(mediaDefaults(id));
  }, [id]);

  useEffect(() => {
    if (!project) return;
    setProgressValues({
      percentComplete: project.percentComplete ?? 0,
      health: project.health ?? "",
      stage: project.stage ?? "",
      actualStartDate: project.actualStartDate ?? "",
      actualEndDate: project.actualEndDate ?? ""
    });
  }, [project]);

  const healthTone = (value?: string | null) => {
    if (!value) return "pending";
    if (value === "GREEN") return "approved";
    if (value === "AMBER") return "pending";
    return "rejected";
  };

  const stageTone = (value?: string | null) => {
    if (!value) return "pending";
    if (value === "PLANNING") return "planning";
    if (value === "EXECUTION") return "active";
    if (value === "CLOSEOUT") return "completed";
    return "on_hold";
  };

  const milestoneTone = (status: string) => {
    switch (status) {
      case "PLANNED":
        return "planning";
      case "IN_PROGRESS":
        return "active";
      case "COMPLETE":
        return "completed";
      case "DELAYED":
        return "on_hold";
      default:
        return "pending";
    }
  };

  const progressLabel = project?.percentComplete != null ? `${project.percentComplete}%` : "-";
  const budgetTotal = useMemo(() => {
    if (budget?.totalValue != null) return budget.totalValue;
    const parsed = Number(project?.budgetId ?? "");
    return Number.isFinite(parsed) ? parsed : null;
  }, [budget?.totalValue, project?.budgetId]);
  const spentToDate = budget?.totalSpent ?? null;
  const spentToDateLabel = spentToDate != null ? formatMoney(spentToDate) : "Not available";
  const statusTone = getStatusTone(project?.status);
  const timelineItems = [
    {
      label: "Planned Start",
      value: formatDate(project?.startDate),
      status: "planned",
      meta: "Baseline schedule"
    },
    {
      label: "Actual Start",
      value: project?.actualStartDate ? formatDate(project.actualStartDate) : "Not started",
      status: project?.actualStartDate ? "complete" : "pending",
      meta: project?.actualStartDate ? "Mobilized" : "Awaiting kickoff"
    },
    {
      label: "Current Stage",
      value: project?.stage ?? "Not set",
      status: "active",
      meta: project?.health ? `Health: ${project.health}` : "Health pending"
    },
    {
      label: "Progress",
      value: progressLabel,
      status: "active",
      meta: project?.percentComplete != null ? "Overall completion" : "Progress not updated"
    },
    {
      label: "Target Finish",
      value: formatDate(project?.endDate),
      status: "planned",
      meta: "Planned completion"
    },
    {
      label: "Actual Finish",
      value: project?.actualEndDate ? formatDate(project.actualEndDate) : "In progress",
      status: project?.actualEndDate ? "complete" : "pending",
      meta: project?.actualEndDate ? "Completed" : "Ongoing"
    }
  ];

  const milestoneChart = (milestonesQuery.data ?? []).slice(0, 5);
  const isEditingMilestone = Boolean(milestoneEditingId);
  const isSavingMilestone = createMilestone.isPending || updateMilestone.isPending;

  const openAddMilestone = () => {
    setMilestoneEditingId(null);
    setMilestoneValues(milestoneDefaults(id));
    setShowMilestone(true);
  };

  const openEditMilestone = (milestone: ProjectMilestone) => {
    setMilestoneEditingId(milestone.id ?? null);
    setMilestoneValues({
      ...milestone,
      projectId: id,
      description: milestone.description ?? "",
      actualDate: milestone.actualDate ?? ""
    });
    setShowMilestone(true);
  };

  const closeMilestoneModal = () => {
    setShowMilestone(false);
    setMilestoneEditingId(null);
    setMilestoneValues(milestoneDefaults(id));
  };

  const handleEdit = async (values: Project) => {
    if (!project?.id) return;
    try {
      await updateProject.mutateAsync({ id: project.id, payload: values });
      notify({ message: "Project updated", tone: "success" });
      setShowEdit(false);
    } catch {
      notify({ message: "Unable to update project", tone: "error" });
    }
  };

  const handleDelete = async () => {
    if (!project?.id) return;
    try {
      await deleteProject.mutateAsync(project.id);
      notify({ message: "Project deleted", tone: "success" });
      router.push("/projects");
    } catch {
      notify({ message: "Unable to delete project", tone: "error" });
    } finally {
      setShowDelete(false);
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
      closeMilestoneModal();
    } catch {
      notify({ message: milestoneEditingId ? "Unable to update milestone" : "Unable to add milestone", tone: "error" });
    }
  };

  const handleMilestoneDelete = async () => {
    if (!milestoneDeleteTarget?.id) return;
    try {
      await deleteMilestone.mutateAsync({ id: milestoneDeleteTarget.id, projectId: id });
      notify({ message: "Milestone deleted", tone: "success" });
      if (milestoneEditingId && milestoneEditingId === milestoneDeleteTarget.id) {
        closeMilestoneModal();
      }
    } catch {
      notify({ message: "Unable to delete milestone", tone: "error" });
    } finally {
      setMilestoneDeleteTarget(null);
    }
  };

  const handleMediaSave = async () => {
    if (!mediaValues.mediaUrl) return;
    try {
      await createMedia.mutateAsync(mediaValues);
      notify({ message: "Media added", tone: "success" });
      setShowMedia(false);
      setMediaValues(mediaDefaults(id));
    } catch {
      notify({ message: "Unable to add media", tone: "error" });
    }
  };

  const handleProgressSave = async () => {
    if (!project?.id) return;
    try {
      await updateProject.mutateAsync({
        id: project.id,
        payload: {
          ...project,
          percentComplete: Number(progressValues.percentComplete),
          health: progressValues.health ? (progressValues.health as Project["health"]) : null,
          stage: progressValues.stage ? (progressValues.stage as Project["stage"]) : null,
          actualStartDate: progressValues.actualStartDate || null,
          actualEndDate: progressValues.actualEndDate || null
        }
      });
      notify({ message: "Progress updated", tone: "success" });
      setShowProgress(false);
    } catch {
      notify({ message: "Unable to update progress", tone: "error" });
    }
  };

  const teamMembers = useMemo(() => teamQuery.data ?? [], [teamQuery.data]);
  const staffRoleById = useMemo(() => {
    const map = new Map<string, StaffRole>();
    (staffQuery.data ?? []).forEach((member) => {
      if (member.id) map.set(member.id, member.role);
    });
    return map;
  }, [staffQuery.data]);

  if (projectQuery.isLoading) return <Skeleton className="surface-card" />;
  if (projectQuery.error || !project) return <ErrorState message="Unable to load project." />;

  return (
    <PageShell>
      <PageHeader
        title={project.name}
        subtitle={`${project.projectCode ?? project.id ?? ""} • ${project.status}`}
        actions={
          <div className="toolbar">
            {canManageProject ? (
              <Button variant="ghost" onClick={() => setShowProgress(true)}>
                Track Progress
              </Button>
            ) : null}
            {canEdit ? (
              <>
                <Button variant="ghost" onClick={() => setShowEdit(true)}>Edit</Button>
                <Button variant="ghost" onClick={() => setShowDelete(true)}>Delete</Button>
              </>
            ) : null}
          </div>
        }
      />

      <SectionCard>
        <div className="section-header">
          <h2>Overview</h2>
          <p className="muted">Key project identifiers and ownership.</p>
        </div>
        <div className="form-grid large">
          <div>
            <p className="muted">Project Code</p>
            <p className="table-title">{project.projectCode ?? "-"}</p>
          </div>
          <div>
            <p className="muted">Client</p>
            <p className="table-title">{project.clientName ?? "-"}</p>
          </div>
          <div>
            <p className="muted">Site Manager</p>
            <p className="table-title">{project.siteManagerName || project.siteManagerId || "-"}</p>
          </div>
          <div>
            <p className="muted">Status</p>
            <Badge label={project.status} tone={statusTone} />
          </div>
          <div>
            <p className="muted">Health</p>
            <Badge label={project.health ?? "Not set"} tone={healthTone(project.health)} />
          </div>
          <div>
            <p className="muted">Stage</p>
            <Badge label={project.stage ?? "Not set"} tone={stageTone(project.stage)} />
          </div>
          <div>
            <p className="muted">Location</p>
            <p className="table-title">{project.locationName ?? "-"}</p>
          </div>
          <div>
            <p className="muted">Address</p>
            <p className="table-title">{project.address ?? "-"}</p>
          </div>
          <div>
            <p className="muted">Latitude</p>
            <p className="table-title">{project.latitude ?? "-"}</p>
          </div>
          <div>
            <p className="muted">Longitude</p>
            <p className="table-title">{project.longitude ?? "-"}</p>
          </div>
          <div>
            <p className="muted">Budget</p>
            <p className="table-title">{budgetTotal != null ? formatMoney(budgetTotal) : "-"}</p>
          </div>
          <div>
            <p className="muted">Spent to Date</p>
            <p className="table-title">{spentToDateLabel}</p>
          </div>
          <div>
            <p className="muted">Progress</p>
            <p className="table-title">{progressLabel}</p>
          </div>
          <div className="full-width">
            <p className="muted">Description</p>
            <p className="table-title">{project.description ?? "-"}</p>
          </div>
        </div>
      </SectionCard>

      <div className="grid-two">
        <SectionCard>
          <div className="section-header">
            <h2>Progress Timeline</h2>
            <p className="muted">Key schedule markers and current progress.</p>
          </div>
          <div className="timeline">
            {timelineItems.map((item) => (
              <div key={item.label} className="timeline-item">
                <span className={`timeline-dot timeline-dot--${item.status}`} aria-hidden="true" />
                <div className="timeline-content">
                  <div className="timeline-title">{item.label}</div>
                  <div className="timeline-value">{item.value}</div>
                  <div className="timeline-meta">{item.meta}</div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard>
          <div className="section-header">
            <h2>Key Milestones</h2>
            <p className="muted">Progress snapshot for upcoming targets.</p>
          </div>
          {milestonesQuery.isLoading ? (
            <Skeleton className="surface-card" />
          ) : milestoneChart.length > 0 ? (
            <div className="milestone-chart">
              {milestoneChart.map((milestone) => {
                const progress = Math.min(100, Math.max(0, milestone.progressPercent ?? 0));
                return (
                  <div key={milestone.id ?? milestone.name} className="milestone-row">
                    <div className="milestone-label">
                      <div className="table-title">{milestone.name}</div>
                      <div className="muted">{formatDate(milestone.targetDate)}</div>
                    </div>
                    <div className="milestone-bar" role="presentation">
                      <div className="milestone-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="milestone-percent">{progress}%</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="No milestones yet" description="Add milestones to visualize progress." />
          )}
        </SectionCard>
      </div>

      <SectionCard>
        <div className="section-header">
          <h2>Timeline</h2>
          <p className="muted">Planned vs actual schedule.</p>
        </div>
        <div className="form-grid large">
          <div>
            <p className="muted">Start Date</p>
            <p className="table-title">{formatDate(project.startDate)}</p>
          </div>
          <div>
            <p className="muted">End Date</p>
            <p className="table-title">{formatDate(project.endDate)}</p>
          </div>
          <div>
            <p className="muted">Actual Start</p>
            <p className="table-title">{formatDate(project.actualStartDate)}</p>
          </div>
          <div>
            <p className="muted">Actual End</p>
            <p className="table-title">{formatDate(project.actualEndDate)}</p>
          </div>
          <div className="full-width">
            <p className="muted">Geofence (WKT)</p>
            <p className="table-title">{project.geofenceWkt ?? "-"}</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <div className="section-header">
          <h2>Milestones</h2>
          <p className="muted">Track critical project achievements.</p>
        </div>
        {canManageProject ? (
          <div style={{ marginBottom: "1rem" }}>
            <Button variant="ghost" onClick={openAddMilestone}>Add Milestone</Button>
          </div>
        ) : null}
        {milestonesQuery.isLoading ? (
          <Skeleton className="surface-card" />
        ) : milestonesQuery.error ? (
          <ErrorState message="Unable to load milestones." onRetry={() => milestonesQuery.refetch()} />
        ) : milestonesQuery.data && milestonesQuery.data.length > 0 ? (
          <Table>
            <TableRoot>
              <thead>
                <tr>
                  <th>Milestone</th>
                  <th>Target</th>
                  <th>Actual</th>
                  <th>Status</th>
                  <th>Progress</th>
                  {canManageProject ? <th className="actions-cell">Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {milestonesQuery.data.map((milestone) => (
                  <tr key={milestone.id ?? milestone.name}>
                    <td>
                      <div className="table-title">{milestone.name}</div>
                      <div className="muted">{milestone.description ?? "-"}</div>
                    </td>
                    <td>{formatDate(milestone.targetDate)}</td>
                    <td>{formatDate(milestone.actualDate)}</td>
                    <td>
                      <Badge label={milestone.status} tone={milestoneTone(milestone.status)} />
                    </td>
                    <td>{milestone.progressPercent != null ? `${milestone.progressPercent}%` : "-"}</td>
                    {canManageProject ? (
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
        ) : (
          <EmptyState title="No milestones yet" description="Add a milestone to begin tracking progress." />
        )}
      </SectionCard>

      <SectionCard>
        <div className="section-header">
          <h2>Project Media</h2>
          <p className="muted">Site photos, videos, and documents.</p>
        </div>
        {canManageProject ? (
          <div style={{ marginBottom: "1rem" }}>
            <Button variant="ghost" onClick={() => setShowMedia(true)}>Add Media</Button>
          </div>
        ) : null}
        {mediaQuery.isLoading ? (
          <Skeleton className="surface-card" />
        ) : mediaQuery.error ? (
          <ErrorState message="Unable to load media." onRetry={() => mediaQuery.refetch()} />
        ) : mediaQuery.data && mediaQuery.data.length > 0 ? (
          <Table>
            <TableRoot>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Captured</th>
                  <th>Link</th>
                </tr>
              </thead>
              <tbody>
                {mediaQuery.data.map((media) => (
                  <tr key={media.id ?? media.mediaUrl}>
                    <td><Badge label={media.mediaType} tone="planning" /></td>
                    <td>{media.description ?? "-"}</td>
                    <td>{formatDate(media.capturedAt)}</td>
                    <td>
                      <a href={media.mediaUrl} target="_blank" rel="noreferrer" className="table-title">
                        View media →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableRoot>
          </Table>
        ) : (
          <EmptyState title="No media uploaded" description="Attach project photos or documents." />
        )}
      </SectionCard>

      <SectionCard>
        <div className="section-header">
          <h2>Assigned Team</h2>
          <p className="muted">Active site team members and assignments.</p>
        </div>
        {teamQuery.isLoading ? (
          <Skeleton className="surface-card" />
        ) : teamQuery.error ? (
          <ErrorState message="Unable to load assignments." onRetry={() => teamQuery.refetch()} />
        ) : teamMembers.length > 0 ? (
          <Table>
            <TableRoot>
              <thead>
                <tr>
                  <th>Staff</th>
                  <th>Task at Site</th>
                  <th>Start</th>
                  <th>End</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((assignment) => {
                  const staffRole = assignment.staff?.id ? staffRoleById.get(assignment.staff.id) : undefined;
                  const roleLabel = staffRole ? STAFF_ROLE_LABEL[staffRole] : "Role not set";
                  const taskAtSite = staffRole ? SITE_TASK_BY_ROLE[staffRole] : "General site support";
                  return (
                    <tr key={assignment.id ?? assignment.staffName ?? assignment.staff?.id}>
                      <td>
                        <div className="table-title">{assignment.staffName ?? assignment.staff?.id ?? "-"}</div>
                        <div className="muted">{roleLabel}</div>
                      </td>
                      <td>{taskAtSite}</td>
                      <td>{formatDate(assignment.startDate)}</td>
                      <td>{formatDate(assignment.endDate)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </TableRoot>
          </Table>
        ) : (
          <EmptyState title="No assignments" description="Assign staff to this project." />
        )}
      </SectionCard>

      <ProjectForm
        open={showEdit}
        initialValues={project}
        onSubmit={handleEdit}
        onClose={() => setShowEdit(false)}
        isSubmitting={updateProject.isPending}
      />

      <ConfirmDialog
        open={showDelete}
        title="Delete project?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        confirmTone="destructive"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />

      <Modal open={showMilestone} title={isEditingMilestone ? "Edit Milestone" : "Add Milestone"} onClose={closeMilestoneModal}>
        <ModalBody>
          <div className="form-grid">
            <FormField label="Milestone name" htmlFor="milestone-name">
              <Input
                id="milestone-name"
                value={milestoneValues.name}
                onChange={(event) => setMilestoneValues((prev) => ({ ...prev, name: event.target.value }))}
              />
            </FormField>
            <FormField label="Target date" htmlFor="milestone-target">
              <Input
                id="milestone-target"
                type="date"
                value={milestoneValues.targetDate}
                onChange={(event) => setMilestoneValues((prev) => ({ ...prev, targetDate: event.target.value }))}
              />
            </FormField>
            <FormField label="Status" htmlFor="milestone-status">
              <select
                id="milestone-status"
                value={milestoneValues.status}
                onChange={(event) =>
                  setMilestoneValues((prev) => ({ ...prev, status: event.target.value as ProjectMilestone["status"] }))
                }
              >
                {["PLANNED", "IN_PROGRESS", "COMPLETE", "DELAYED"].map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Progress %" htmlFor="milestone-progress">
              <Input
                id="milestone-progress"
                type="number"
                min={0}
                max={100}
                value={milestoneValues.progressPercent ?? 0}
                onChange={(event) =>
                  setMilestoneValues((prev) => ({ ...prev, progressPercent: Number(event.target.value) }))
                }
              />
            </FormField>
            <FormField label="Actual date" htmlFor="milestone-actual">
              <Input
                id="milestone-actual"
                type="date"
                value={milestoneValues.actualDate ?? ""}
                onChange={(event) =>
                  setMilestoneValues((prev) => ({ ...prev, actualDate: event.target.value || null }))
                }
              />
            </FormField>
            <FormField label="Description" htmlFor="milestone-desc" className="full-width">
              <Input
                id="milestone-desc"
                value={milestoneValues.description ?? ""}
                onChange={(event) =>
                  setMilestoneValues((prev) => ({ ...prev, description: event.target.value }))
                }
              />
            </FormField>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={closeMilestoneModal}>Cancel</Button>
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

      <Modal open={showMedia} title="Add Media" onClose={() => setShowMedia(false)}>
        <ModalBody>
          <div className="form-grid">
            <FormField label="Media URL" htmlFor="media-url">
              <Input
                id="media-url"
                value={mediaValues.mediaUrl}
                onChange={(event) => setMediaValues((prev) => ({ ...prev, mediaUrl: event.target.value }))}
              />
            </FormField>
            <FormField label="Media type" htmlFor="media-type">
              <select
                id="media-type"
                value={mediaValues.mediaType}
                onChange={(event) =>
                  setMediaValues((prev) => ({ ...prev, mediaType: event.target.value as ProjectMedia["mediaType"] }))
                }
              >
                {["PHOTO", "VIDEO", "DOCUMENT", "OTHER"].map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Captured at" htmlFor="media-captured">
              <Input
                id="media-captured"
                type="date"
                value={mediaValues.capturedAt ?? ""}
                onChange={(event) =>
                  setMediaValues((prev) => ({ ...prev, capturedAt: event.target.value || null }))
                }
              />
            </FormField>
            <FormField label="Description" htmlFor="media-desc" className="full-width">
              <Input
                id="media-desc"
                value={mediaValues.description ?? ""}
                onChange={(event) =>
                  setMediaValues((prev) => ({ ...prev, description: event.target.value }))
                }
              />
            </FormField>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowMedia(false)}>Cancel</Button>
          <Button onClick={handleMediaSave} disabled={createMedia.isPending}>
            {createMedia.isPending ? "Saving..." : "Add Media"}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal open={showProgress} title="Track Progress" onClose={() => setShowProgress(false)}>
        <ModalBody>
          <div className="form-grid">
            <FormField label="Percent Complete" htmlFor="progress-percent">
              <Input
                id="progress-percent"
                type="number"
                min={0}
                max={100}
                value={progressValues.percentComplete}
                onChange={(event) =>
                  setProgressValues((prev) => ({ ...prev, percentComplete: Number(event.target.value) }))
                }
              />
            </FormField>
            <FormField label="Health" htmlFor="progress-health">
              <select
                id="progress-health"
                value={progressValues.health}
                onChange={(event) => setProgressValues((prev) => ({ ...prev, health: event.target.value }))}
              >
                <option value="">Not set</option>
                {["GREEN", "AMBER", "RED"].map((health) => (
                  <option key={health} value={health}>{health}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Stage" htmlFor="progress-stage">
              <select
                id="progress-stage"
                value={progressValues.stage}
                onChange={(event) => setProgressValues((prev) => ({ ...prev, stage: event.target.value }))}
              >
                <option value="">Not set</option>
                {["PLANNING", "EXECUTION", "CLOSEOUT", "ON_HOLD"].map((stage) => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Actual Start" htmlFor="progress-actual-start">
              <Input
                id="progress-actual-start"
                type="date"
                value={progressValues.actualStartDate}
                onChange={(event) =>
                  setProgressValues((prev) => ({ ...prev, actualStartDate: event.target.value }))
                }
              />
            </FormField>
            <FormField label="Actual End" htmlFor="progress-actual-end">
              <Input
                id="progress-actual-end"
                type="date"
                value={progressValues.actualEndDate}
                onChange={(event) =>
                  setProgressValues((prev) => ({ ...prev, actualEndDate: event.target.value }))
                }
              />
            </FormField>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowProgress(false)}>Cancel</Button>
          <Button onClick={handleProgressSave} disabled={updateProject.isPending}>
            {updateProject.isPending ? "Saving..." : "Save Progress"}
          </Button>
        </ModalFooter>
      </Modal>
    </PageShell>
  );
}
