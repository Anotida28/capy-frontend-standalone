"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/layout/page-shell";
import { SectionCard } from "@/components/layout/section-card";
import { useProjects, useProjectMilestonesList } from "@/features/operations/projects/hooks";
import { useTeamAssignments } from "@/features/operations/team-assignments/hooks";
import { useAssets } from "@/features/operations/assets/hooks";
import { useTimesheets } from "@/features/operations/timesheets/hooks";
import { useAuth } from "@/providers/auth-provider";
import { resolveStaffIdForUser } from "@/lib/auth/user-profile";
import { formatDate } from "@/lib/utils/date";

export default function SiteManagerDashboardPage() {
  const { username } = useAuth();
  const staffId = resolveStaffIdForUser(username);
  const projectsQuery = useProjects();
  const milestonesQuery = useProjectMilestonesList();
  const assignmentsQuery = useTeamAssignments();
  const assetsQuery = useAssets();
  const timesheetsQuery = useTimesheets();

  const projects = (projectsQuery.data ?? []).filter((project) => project.siteManagerId === staffId);
  const projectIds = new Set(projects.map((project) => project.id));

  const assignedStaff = (assignmentsQuery.data ?? []).filter((assignment) => {
    const id = assignment.project?.id ?? null;
    return id ? projectIds.has(id) : false;
  });

  const uniqueStaff = new Set(
    assignedStaff
      .map((assignment) => assignment.staff?.id ?? assignment.staffName)
      .filter((value): value is string => Boolean(value))
  );

  const assignedAssets = (assetsQuery.data ?? []).filter(
    (asset) => asset.assignedProjectId && projectIds.has(asset.assignedProjectId)
  );

  const timesheets = (timesheetsQuery.data ?? []).filter((sheet) => projectIds.has(sheet.projectId));
  const pendingTimesheets = timesheets.filter((sheet) => sheet.status === "PENDING");

  const upcomingMilestones = useMemo(() => {
    const allowedIds = new Set(projects.map((project) => project.id));
    const all = (milestonesQuery.data ?? []).filter((milestone) =>
      allowedIds.has(milestone.projectId)
    );
    return all
      .filter((milestone) => milestone.targetDate)
      .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime())
      .slice(0, 3);
  }, [milestonesQuery.data, projects]);

  return (
    <PageShell>
      <div className="card-grid">
        <Card className="metric-card metric-card--projects">
          <div className="metric-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7h5l2 2h11v8a2 2 0 0 1-2 2H3z" />
              <path d="M3 7V5a2 2 0 0 1 2-2h4l2 2h8" />
            </svg>
          </div>
          <p className="card-title">Active Projects</p>
          <p className="metric">{projects.length}</p>
          <p className="metric-caption">Assigned to you</p>
          <Link className="primary-button" href="/operations/site-manager/projects">
            View Projects →
          </Link>
        </Card>
        <Card className="metric-card metric-card--budget">
          <div className="metric-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <p className="card-title">Assigned Staff</p>
          <p className="metric">{uniqueStaff.size}</p>
          <p className="metric-caption">Across your projects</p>
          <Link className="primary-button" href="/operations/site-manager/projects">
            Team Overview →
          </Link>
        </Card>
        <Card className="metric-card metric-card--pos">
          <div className="metric-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l8 4-8 4-8-4 8-4z" />
              <path d="M4 6v8l8 4 8-4V6" />
              <path d="M12 10v8" />
            </svg>
          </div>
          <p className="card-title">Equipment Assigned</p>
          <p className="metric">{assignedAssets.length}</p>
          <p className="metric-caption">Active on site</p>
          <Link className="primary-button" href="/operations/site-manager/projects">
            View Equipment →
          </Link>
        </Card>
        <Card className="metric-card metric-card--invoices">
          <div className="metric-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </div>
          <p className="card-title">Pending Timesheets</p>
          <p className="metric">{pendingTimesheets.length}</p>
          <p className="metric-caption">Awaiting approval</p>
          <Link className="primary-button" href="/operations/site-manager/timesheets">
            Review Timesheets →
          </Link>
        </Card>
      </div>

      <div className="grid-two">
        <SectionCard className="chart-card">
          <div className="section-header">
            <h2>Upcoming Targets</h2>
            <p className="muted">Key milestones on your sites.</p>
          </div>
          {upcomingMilestones.length === 0 ? (
            <p className="muted">No upcoming milestones yet.</p>
          ) : (
            <ul className="activity-feed">
              {upcomingMilestones.map((milestone) => (
                <li key={milestone.id} className="activity-item">
                  <span className="activity-icon activity-icon--project" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 7h5l2 2h11v8a2 2 0 0 1-2 2H3z" />
                      <path d="M3 7V5a2 2 0 0 1 2-2h4l2 2h8" />
                    </svg>
                  </span>
                  <div>
                    <p>{milestone.name}</p>
                    <p className="activity-meta">Target {formatDate(milestone.targetDate)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard className="chart-card">
          <div className="section-header">
            <h2>Auto Clockout Policy</h2>
            <p className="muted">Default end-of-shift times by project.</p>
          </div>
          {projects.length === 0 ? (
            <p className="muted">No assigned projects yet.</p>
          ) : (
            <div className="form-grid">
              {projects.map((project) => (
                <div key={project.id}>
                  <p className="muted">{project.name}</p>
                  <p className="table-title">
                    {project.shiftStartTime ?? "07:00"} – {project.autoClockoutTime ?? project.shiftEndTime ?? "17:00"}
                  </p>
                  <p className="muted">
                    Grace {project.gracePeriodMinutes ?? 0} mins · Overtime {project.overtimeAllowed ? "On" : "Off"}
                  </p>
                </div>
              ))}
            </div>
          )}
          <p className="muted" style={{ marginTop: "1rem" }}>
            Use the timesheet view to extend shifts when needed.
          </p>
        </SectionCard>
      </div>
    </PageShell>
  );
}
