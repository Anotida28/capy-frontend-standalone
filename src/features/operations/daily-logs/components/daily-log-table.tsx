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

const logTypeLabel = (log: DailyLog) => (log.logType ?? "PROJECT") === "EMPLOYEE" ? "Employee" : "Project";
const logTypeTone = (log: DailyLog) => (log.logType ?? "PROJECT") === "EMPLOYEE" ? "planning" : "approved";

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
                      View →
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
  );
}
