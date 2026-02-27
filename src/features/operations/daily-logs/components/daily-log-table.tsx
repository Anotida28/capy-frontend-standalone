"use client";

import { useRouter } from "next/navigation";
import { Table, TableRoot } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HighlightText } from "@/components/ui/highlight-text";
import { useTableKeyboardNavigation } from "@/components/ui/table-navigation";
import type { DailyLog } from "@/features/operations/daily-logs/types";
import { formatDate } from "@/lib/utils/date";
import { useCanEdit } from "@/lib/auth/require-role";

const logTypeLabel = (log: DailyLog) => ((log.logType ?? "PROJECT") === "EMPLOYEE" ? "Employee" : "Project");
const logTypeTone = (log: DailyLog) => ((log.logType ?? "PROJECT") === "EMPLOYEE" ? "planning" : "approved");

export function DailyLogTable({
  items,
  onEdit,
  onDelete,
  query
}: {
  items: DailyLog[];
  onEdit: (item: DailyLog) => void;
  onDelete: (item: DailyLog) => void;
  query?: string;
}) {
  const canEdit = useCanEdit();
  const router = useRouter();
  const { tableRef, getRowProps } = useTableKeyboardNavigation(items.length);

  return (
    <>
      <div className="desktop-table">
        <Table>
          <TableRoot ref={tableRef}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Project</th>
                <th>Employee</th>
                <th>Summary</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((log, index) => {
                const isEmployeeLog = (log.logType ?? "PROJECT") === "EMPLOYEE";
                const openDetails = () => {
                  if (log.id) {
                    router.push(`/daily-logs/${log.id}`);
                    return;
                  }
                  onEdit(log);
                };
                return (
                  <tr
                    key={log.id ?? `${log.logType}-${log.date}-${index}`}
                    {...getRowProps(index, { onEnter: openDetails })}
                  >
                    <td>{formatDate(log.date)}</td>
                    <td>
                      <Badge label={logTypeLabel(log)} tone={logTypeTone(log)} />
                    </td>
                    <td>
                      <div className="table-title">
                        <HighlightText text={log.projectName ?? log.projectId ?? "-"} query={query} />
                      </div>
                      <div className="muted">
                        <HighlightText text={log.projectId ?? "No project"} query={query} />
                      </div>
                    </td>
                    <td>
                      <div className="table-title">
                        <HighlightText text={log.employeeName ?? log.employeeId ?? "-"} query={query} />
                      </div>
                      <div className="muted">
                        <HighlightText text={log.employeeId ?? "No employee"} query={query} />
                      </div>
                    </td>
                    <td>
                      {isEmployeeLog ? (
                        <HighlightText text={log.delayNotes ?? "Employee general log"} query={query} />
                      ) : (
                        <span>{log.progressEntries?.length ?? 0} progress entries</span>
                      )}
                    </td>
                    <td>
                      <div className="row-actions">
                        <Button variant="ghost" onClick={openDetails}>
                          View -&gt;
                        </Button>
                        {canEdit ? (
                          <>
                            <Button variant="ghost" onClick={() => onEdit(log)}>
                              Edit
                            </Button>
                            <Button variant="ghost" onClick={() => onDelete(log)}>
                              Delete
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableRoot>
        </Table>
      </div>

      <div className="mobile-list">
        {items.map((log, index) => {
          const isEmployeeLog = (log.logType ?? "PROJECT") === "EMPLOYEE";
          const openDetails = () => {
            if (log.id) {
              router.push(`/daily-logs/${log.id}`);
              return;
            }
            onEdit(log);
          };

          return (
            <article key={`mobile-${log.id ?? `${log.logType}-${log.date}-${index}`}`} className="mobile-card">
              <div className="mobile-card-head">
                <div>
                  <p className="mobile-card-title">{formatDate(log.date)}</p>
                  <p className="mobile-card-subtitle">
                    <HighlightText text={log.projectName ?? log.projectId ?? "No project"} query={query} />
                  </p>
                </div>
                <Badge label={logTypeLabel(log)} tone={logTypeTone(log)} />
              </div>

              <div className="mobile-card-grid">
                <div className="mobile-field">
                  <span className="mobile-label">Employee</span>
                  <div className="mobile-value">
                    <HighlightText text={log.employeeName ?? log.employeeId ?? "No employee"} query={query} />
                  </div>
                </div>
                <div className="mobile-field">
                  <span className="mobile-label">Summary</span>
                  <div className="mobile-value">
                    {isEmployeeLog ? (
                      <HighlightText text={log.delayNotes ?? "Employee general log"} query={query} />
                    ) : (
                      <span>{log.progressEntries?.length ?? 0} progress entries</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mobile-card-actions">
                <Button variant="ghost" onClick={openDetails}>View -&gt;</Button>
                {canEdit ? (
                  <>
                    <Button variant="ghost" onClick={() => onEdit(log)}>Edit</Button>
                    <Button variant="ghost" onClick={() => onDelete(log)}>Delete</Button>
                  </>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}