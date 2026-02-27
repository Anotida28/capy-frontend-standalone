"use client";

import { Table, TableRoot } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useTableKeyboardNavigation } from "@/components/ui/table-navigation";
import type { Vendor } from "@/features/operations/vendors/types";
import { useCanEdit } from "@/lib/auth/require-role";

export function VendorTable({
  items,
  onView,
  onEdit,
  onDelete
}: {
  items: Vendor[];
  onView: (item: Vendor) => void;
  onEdit: (item: Vendor) => void;
  onDelete: (item: Vendor) => void;
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
                <th>Company</th>
                <th>Type</th>
                <th>Tax Clearance</th>
                <th>Rating</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id ?? item.companyName} {...getRowProps(index, { onEnter: () => onView(item) })}>
                  <td>{item.companyName}</td>
                  <td>{item.type}</td>
                  <td>{item.taxClearanceExpiry ?? "-"}</td>
                  <td>{item.performanceRating ?? "-"}</td>
                  <td>
                    <div className="row-actions">
                      <Button variant="ghost" onClick={() => onView(item)}>View -&gt;</Button>
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
      </div>

      <div className="mobile-list">
        {items.map((item) => (
          <article key={`mobile-${item.id ?? item.companyName}`} className="mobile-card">
            <div className="mobile-card-head">
              <div>
                <p className="mobile-card-title">{item.companyName}</p>
                <p className="mobile-card-subtitle">{item.type ?? "-"}</p>
              </div>
            </div>
            <div className="mobile-card-grid">
              <div className="mobile-field">
                <span className="mobile-label">Tax Clearance</span>
                <div className="mobile-value">{item.taxClearanceExpiry ?? "-"}</div>
              </div>
              <div className="mobile-field">
                <span className="mobile-label">Rating</span>
                <div className="mobile-value">{item.performanceRating ?? "-"}</div>
              </div>
            </div>
            <div className="mobile-card-actions">
              <Button variant="ghost" onClick={() => onView(item)}>View -&gt;</Button>
              {canEdit ? (
                <>
                  <Button variant="ghost" onClick={() => onEdit(item)}>Edit</Button>
                  <Button variant="ghost" onClick={() => onDelete(item)}>Delete</Button>
                </>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}