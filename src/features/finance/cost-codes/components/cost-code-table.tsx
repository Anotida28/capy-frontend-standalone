"use client";

import { Table, TableRoot } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RowActions } from "@/components/ui/row-actions";
import { Badge } from "@/components/ui/badge";
import { HighlightText } from "@/components/ui/highlight-text";
import { useTableKeyboardNavigation } from "@/components/ui/table-navigation";
import type { CostCode } from "@/features/finance/cost-codes/types";
import { useCanEdit } from "@/lib/auth/require-role";

export function CostCodeTable({
  items,
  onView,
  onEdit,
  onDelete,
  onDeactivate,
  onActivate,
  query
}: {
  items: CostCode[];
  onView: (item: CostCode) => void;
  onEdit: (item: CostCode) => void;
  onDelete: (item: CostCode) => void;
  onDeactivate: (item: CostCode) => void;
  onActivate: (item: CostCode) => void;
  query?: string;
}) {
  const canEdit = useCanEdit();
  const { tableRef, getRowProps } = useTableKeyboardNavigation(items.length);

  return (
    <Table>
      <TableRoot ref={tableRef}>
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Category</th>
            <th className="status-cell">Status</th>
            <th className="actions-cell">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id ?? item.code} {...getRowProps(index, { onEnter: () => onView(item) })}>
              <td>
                <div className="table-title">
                  <HighlightText text={item.code} query={query} />
                </div>
              </td>
              <td>
                <HighlightText text={item.name} query={query} />
              </td>
              <td>
                <HighlightText text={item.category} query={query} />
              </td>
              <td className="status-cell">
                <Badge label={item.active === false ? "INACTIVE" : "ACTIVE"} tone={item.active === false ? "inactive" : "active"} />
              </td>
              <td className="actions-cell">
                <div className="row-actions">
                  <Button variant="ghost" onClick={() => onView(item)}>View →</Button>
                  {canEdit ? (
                    <RowActions
                      actions={[
                        { label: "Edit", onClick: () => onEdit(item) },
                        item.active === false
                          ? { label: "Activate", onClick: () => onActivate(item) }
                          : { label: "Deactivate", onClick: () => onDeactivate(item), tone: "destructive" },
                        { label: "Delete", onClick: () => onDelete(item), tone: "destructive" }
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
