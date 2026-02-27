"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { SectionCard } from "@/components/layout/section-card";
import { Table, TableRoot } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { HighlightText } from "@/components/ui/highlight-text";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { useTableKeyboardNavigation } from "@/components/ui/table-navigation";
import { useProjects } from "@/features/operations/projects/hooks";
import { useTeamAssignments } from "@/features/operations/team-assignments/hooks";
import { useAssets } from "@/features/operations/assets/hooks";
import { useAuth } from "@/providers/auth-provider";
import { resolveStaffIdForUser } from "@/lib/auth/user-profile";
import { formatDate } from "@/lib/utils/date";
import { getStatusTone } from "@/lib/utils/status-tone";

export default function SiteManagerProjectsPage() {
  const router = useRouter();
  const { username } = useAuth();
  const staffId = resolveStaffIdForUser(username);
  const [query, setQuery] = useState("");

  const projectsQuery = useProjects();
  const assignmentsQuery = useTeamAssignments();
  const assetsQuery = useAssets();

  const projects = (projectsQuery.data ?? []).filter((project) => project.siteManagerId === staffId);

  const staffCountByProject = useMemo(() => {
    const map = new Map<string, number>();
    (assignmentsQuery.data ?? []).forEach((assignment) => {
      const projectId = assignment.project?.id ?? null;
      if (!projectId) return;
      map.set(projectId, (map.get(projectId) ?? 0) + 1);
    });
    return map;
  }, [assignmentsQuery.data]);

  const assetCountByProject = useMemo(() => {
    const map = new Map<string, number>();
    (assetsQuery.data ?? []).forEach((asset) => {
      if (!asset.assignedProjectId) return;
      map.set(asset.assignedProjectId, (map.get(asset.assignedProjectId) ?? 0) + 1);
    });
    return map;
  }, [assetsQuery.data]);

  const filteredProjects = projects.filter((project) => {
    const haystack = [project.name, project.projectCode, project.locationName].join(" ").toLowerCase();
    return query ? haystack.includes(query.toLowerCase()) : true;
  });

  const { tableRef, getRowProps } = useTableKeyboardNavigation(filteredProjects.length);

  return (
    <PageShell>
      <PageHeader
        title="My Projects"
        subtitle="Projects assigned to you as site manager."
      />

      <SectionCard>
        <div className="section-header">
          <h2>Assigned Projects</h2>
          <p className="muted">Track progress, staff, and equipment per project.</p>
        </div>
        <div className="toolbar" style={{ marginBottom: "1rem" }}>
          <Input
            placeholder="Search by project, code, or location"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        {projectsQuery.isLoading ? (
          <p className="muted">Loading projects...</p>
        ) : projectsQuery.error ? (
          <ErrorState message="Unable to load projects." onRetry={() => projectsQuery.refetch()} />
        ) : filteredProjects.length === 0 ? (
          <EmptyState title="No assigned projects" description="Projects will appear here once assigned." />
        ) : (
          <Table>
            <TableRoot ref={tableRef}>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Timeline</th>
                  <th>Staff</th>
                  <th>Equipment</th>
                  <th className="actions-cell">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project, index) => (
                  <tr
                    key={project.id}
                    {...getRowProps(index, {
                      onEnter: () => {
                        if (project.id) router.push(`/operations/site-manager/projects/${project.id}`);
                      },
                      disabled: !project.id
                    })}
                  >
                    <td>
                      <div className="table-title">
                        <HighlightText text={project.name} query={query} />
                      </div>
                      <div className="muted">
                        <HighlightText text={project.locationName ?? project.projectCode ?? "-"} query={query} />
                      </div>
                    </td>
                    <td>
                      <Badge label={project.status} tone={getStatusTone(project.status)} />
                    </td>
                    <td>
                      <div className="table-title">{formatDate(project.startDate)}</div>
                      <div className="muted">End {formatDate(project.endDate)}</div>
                    </td>
                    <td>{staffCountByProject.get(project.id ?? "") ?? 0}</td>
                    <td>{assetCountByProject.get(project.id ?? "") ?? 0}</td>
                    <td className="actions-cell">
                      <div className="row-actions">
                        <Button
                          variant="ghost"
                          onClick={() => project.id && router.push(`/operations/site-manager/projects/${project.id}`)}
                        >
                          View →
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableRoot>
          </Table>
        )}
      </SectionCard>
    </PageShell>
  );
}
