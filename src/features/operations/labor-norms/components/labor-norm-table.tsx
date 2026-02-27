"use client";

import { Table, TableRoot } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { HighlightText } from "@/components/ui/highlight-text";
import { useTableKeyboardNavigation } from "@/components/ui/table-navigation";
import type { LaborNorm } from "@/features/operations/labor-norms/types";
import { useCanEdit } from "@/lib/auth/require-role";

export function LaborNormTable({
  items,
  onEdit,
  onDelete,
  query
}: {
  items: LaborNorm[];
  onEdit: (item: LaborNorm) => void;
  onDelete: (item: LaborNorm) => void;
  query?: string;
}) {
  const canEdit = useCanEdit();
  const { tableRef, getRowProps } = useTableKeyboardNavigation(items.length);

  return (
    <Table>
      <TableRoot ref={tableRef}>
        <thead>
          <tr>
            <th>Activity Code</th>
            <th>Description</th>
            <th>Unit</th>
            <th>Hours / Unit</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.activityCode} {...getRowProps(index, { onEnter: () => onEdit(item) })}>
              <td>
                <div className="table-title">
                  <HighlightText text={item.activityCode} query={query} />
                </div>
              </td>
              <td>
                <HighlightText text={item.description} query={query} />
              </td>
              <td>{item.unit}</td>
              <td>{item.standardHoursPerUnit}</td>
              <td>
                <div className="row-actions">
                  <Button variant="ghost" onClick={() => onEdit(item)}>View →</Button>
                  {canEdit ? (
                    <>
                      <Button variant="ghost" onClick={() => onEdit(item)}>Edit</Button>
                      <Button variant="ghost" onClick={() => onDelete(item)}>Delete</Button>
                    </>
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
