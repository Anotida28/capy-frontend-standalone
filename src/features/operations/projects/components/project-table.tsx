"use client";

import { useRouter } from "next/navigation";
import { Table, TableRoot } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RowActions } from "@/components/ui/row-actions";
import { Badge } from "@/components/ui/badge";
import { HighlightText } from "@/components/ui/highlight-text";
import { useTableKeyboardNavigation } from "@/components/ui/table-navigation";
import type { Project } from "@/features/operations/projects/types";
import { useCanEdit } from "@/lib/auth/require-role";
import { formatMoney } from "@/lib/utils/money";
import { getStatusTone } from "@/lib/utils/status-tone";

export function ProjectTable({
  items,
  onEdit,
  onDelete,
  query
}: {
  items: Project[];
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  query?: string;
}) {
  const canEdit = useCanEdit();
  const router = useRouter();
  const { tableRef, getRowProps } = useTableKeyboardNavigation(items.length);

  return (
    <Table>
      <TableRoot ref={tableRef}>
        <thead>
          <tr>
            <th>Project</th>
            <th className="status-cell">Status</th>
            <th>Location</th>
            <th>Progress</th>
            <th className="actions-cell">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((project, index) => (
            <tr
              key={project.id}
              {...getRowProps(index, {
                onEnter: () => {
                  if (project.id) router.push(`/projects/${project.id}`);
                },
                disabled: !project.id
              })}
            >
              <td>
                <div className="table-title-row">
                  <span className="table-avatar">{project.name.slice(0, 2).toUpperCase()}</span>
                  <div>
                    <div className="table-title">
                      <HighlightText text={project.name} query={query} />
                    </div>
                    <div className="muted">
                      <HighlightText
                        text={
                          (project.projectCode || project.clientName)
                            ? `${project.projectCode ?? ""}${
                                project.projectCode && project.clientName ? " • " : ""
                              }${project.clientName ?? ""}`
                            : "No code assigned"
                        }
                        query={query}
                      />
                    </div>
                  </div>
                </div>
              </td>
              <td className="status-cell">
                <Badge label={project.status} tone={getStatusTone(project.status)} />
              </td>
              <td>
                <div className="table-title">
                  <HighlightText text={project.locationName ?? "-"} query={query} />
                </div>
                <div className="muted">
                  <HighlightText
                    text={project.siteManagerName || project.siteManagerId || "No site manager"}
                    query={query}
                  />
                </div>
              </td>
              <td>
                <div className="table-title">
                  {project.percentComplete != null ? `${project.percentComplete}%` : "-"}
                </div>
                <div className="muted">{formatMoney(project.budgetId)}</div>
              </td>
              <td className="actions-cell">
                <div className="row-actions">
                  <Button variant="ghost" onClick={() => project.id && router.push(`/projects/${project.id}`)}>
                    View →
                  </Button>
                  {canEdit ? (
                    <RowActions
                      actions={[
                        { label: "Edit", onClick: () => onEdit(project) },
                        { label: "Delete", onClick: () => onDelete(project), tone: "destructive" }
                      ]}
                    />
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </TableRoot>
    </Table>
  );
}
