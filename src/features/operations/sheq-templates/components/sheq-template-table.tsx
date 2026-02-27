"use client";

import { Table, TableRoot } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RowActions } from "@/components/ui/row-actions";
import { HighlightText } from "@/components/ui/highlight-text";
import { useTableKeyboardNavigation } from "@/components/ui/table-navigation";
import type { SheqTemplate } from "@/features/operations/sheq-templates/types";
import { useCanEdit } from "@/lib/auth/require-role";

export function SheqTemplateTable({
  items,
  onView,
  onEdit,
  onDelete,
  query
}: {
  items: SheqTemplate[];
  onView: (item: SheqTemplate) => void;
  onEdit: (item: SheqTemplate) => void;
  onDelete: (item: SheqTemplate) => void;
  query?: string;
}) {
  const canEdit = useCanEdit();
  const { tableRef, getRowProps } = useTableKeyboardNavigation(items.length);

  return (
    <Table>
      <TableRoot ref={tableRef}>
        <thead>
          <tr>
            <th>Template</th>
            <th>Items</th>
            <th className="actions-cell">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((template, index) => (
            <tr key={template.id ?? template.templateName} {...getRowProps(index, { onEnter: () => onView(template) })}>
              <td>
                <div className="table-title">
                  <HighlightText text={template.templateName} query={query} />
                </div>
              </td>
              <td>{template.items?.length ?? 0}</td>
              <td className="actions-cell">
                <div className="row-actions">
                  <Button variant="ghost" onClick={() => onView(template)}>View →</Button>
                  {canEdit ? (
                    <RowActions
                      actions={[
                        { label: "Edit", onClick: () => onEdit(template) },
                        { label: "Delete", onClick: () => onDelete(template), tone: "destructive" }
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
