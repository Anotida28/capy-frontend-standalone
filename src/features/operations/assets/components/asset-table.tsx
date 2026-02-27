"use client";

import { useRouter } from "next/navigation";
import { Table, TableRoot } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RowActions } from "@/components/ui/row-actions";
import { Badge } from "@/components/ui/badge";
import { HighlightText } from "@/components/ui/highlight-text";
import { useTableKeyboardNavigation } from "@/components/ui/table-navigation";
import type { Asset } from "@/features/operations/assets/types";
import { useCanEdit } from "@/lib/auth/require-role";
import { getStatusTone } from "@/lib/utils/status-tone";
import { formatDate } from "@/lib/utils/date";

const CATEGORY_LABELS: Record<string, string> = {
  HEAVY_EQUIPMENT: "Heavy Equipment",
  SMALL_EQUIPMENT: "Small Equipment",
  TOOLS: "Tools",
  VEHICLES: "Vehicles",
  VEHICLE: "Vehicles",
  TOOL: "Tools",
  PLANT: "Small Equipment",
  OTHER: "Small Equipment"
};

const formatCategory = (category?: Asset["category"] | null) => {
  if (!category) return "-";
  return CATEGORY_LABELS[category] ?? category;
};

const formatPeriod = (start?: string | null, end?: string | null) => {
  if (!start && !end) return "-";
  return `${start ? formatDate(start) : "Start not set"} → ${end ? formatDate(end) : "Open"}`;
};

export function AssetTable({
  items,
  onEdit,
  onDelete,
  query
}: {
  items: Asset[];
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
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
            <th>Asset</th>
            <th>Category</th>
            <th>Allocation</th>
            <th>Person in Charge</th>
            <th>Rental Period</th>
            <th className="status-cell">Status</th>
            <th className="actions-cell">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((asset, index) => (
            <tr
              key={asset.id ?? asset.assetCode}
              {...getRowProps(index, {
                onEnter: () => {
                  if (asset.id) router.push(`/assets/${asset.id}`);
                },
                disabled: !asset.id
              })}
            >
              <td>
                <div className="table-title">
                  <HighlightText text={asset.assetCode} query={query} />
                </div>
                <div className="muted">
                  <HighlightText
                    text={[asset.make, asset.model].filter(Boolean).join(" ") || asset.type || "-"}
                    query={query}
                  />
                </div>
              </td>
              <td>
                <HighlightText text={formatCategory(asset.category)} query={query} />
              </td>
              <td>
                <div className="table-title">
                  <HighlightText text={asset.assignedProjectName ?? asset.assignedProjectId ?? "-"} query={query} />
                </div>
                <div className="muted">
                  <HighlightText text={asset.availability ?? "Not set"} query={query} />
                </div>
              </td>
              <td>
                <div className="table-title">
                  <HighlightText
                    text={asset.personInChargeName ?? asset.personInChargeId ?? asset.operatorId ?? "-"}
                    query={query}
                  />
                </div>
                <div className="muted">
                  <HighlightText text={asset.personInChargeId ?? asset.operatorId ?? "Staff ID not set"} query={query} />
                </div>
              </td>
              <td>
                <div className="table-title">{formatPeriod(asset.rentalStartDate, asset.rentalEndDate)}</div>
                <div className="muted">{asset.ownership ?? "Ownership not set"}</div>
              </td>
              <td className="status-cell">
                {asset.status ? <Badge label={asset.status} tone={getStatusTone(asset.status)} /> : "-"}
              </td>
              <td className="actions-cell">
                <div className="row-actions">
                  <Button variant="ghost" onClick={() => asset.id && router.push(`/assets/${asset.id}`)}>
                    View →
                  </Button>
                  {canEdit ? (
                    <RowActions
                      actions={[
                        { label: "Edit", onClick: () => onEdit(asset) },
                        { label: "Delete", onClick: () => onDelete(asset), tone: "destructive" }
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
