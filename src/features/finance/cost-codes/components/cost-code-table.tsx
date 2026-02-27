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
    <>
      <div className="desktop-table">
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
                      <Button variant="ghost" onClick={() => onView(item)}>View -&gt;</Button>
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
      </div>

      <div className="mobile-list">
        {items.map((item) => (
          <article key={`mobile-${item.id ?? item.code}`} className="mobile-card">
            <div className="mobile-card-head">
              <div>
                <p className="mobile-card-title">
                  <HighlightText text={item.code} query={query} />
                </p>
                <p className="mobile-card-subtitle">
                  <HighlightText text={item.name} query={query} />
                </p>
              </div>
              <Badge label={item.active === false ? "INACTIVE" : "ACTIVE"} tone={item.active === false ? "inactive" : "active"} />
            </div>
            <div className="mobile-card-grid">
              <div className="mobile-field">
                <span className="mobile-label">Category</span>
                <div className="mobile-value">
                  <HighlightText text={item.category} query={query} />
                </div>
              </div>
            </div>
            <div className="mobile-card-actions">
              <Button variant="ghost" onClick={() => onView(item)}>View -&gt;</Button>
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
          </article>
        ))}
      </div>
    </>
  );
}