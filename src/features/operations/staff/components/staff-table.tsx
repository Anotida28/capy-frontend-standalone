"use client";

import { Table, TableRoot } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useTableKeyboardNavigation } from "@/components/ui/table-navigation";
import type { Staff } from "@/features/operations/staff/types";
import { useCanEdit } from "@/lib/auth/require-role";

export function StaffTable({
  items,
  onView,
  onEdit,
  onDelete
}: {
  items: Staff[];
  onView: (item: Staff) => void;
  onEdit: (item: Staff) => void;
  onDelete: (item: Staff) => void;
}) {
  const canEdit = useCanEdit();
  const { tableRef, getRowProps } = useTableKeyboardNavigation(items.length);

  return (
    <Table>
      <TableRoot ref={tableRef}>
        <thead>
          <tr>
            <th>Name</th>
            <th>National ID</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id ?? item.nationalId} {...getRowProps(index, { onEnter: () => onView(item) })}>
              <td>{item.fullName}</td>
              <td>{item.nationalId}</td>
              <td>{item.role}</td>
              <td>
                <div className="row-actions">
                  <Button variant="ghost" onClick={() => onView(item)}>View →</Button>
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
