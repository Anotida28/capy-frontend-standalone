"use client";

import { Table, TableRoot } from "@/components/ui/table";
import type { ThreeWayMatch } from "@/features/finance/three-way-match/types";
import { Badge } from "@/components/ui/badge";

export function MatchTable({ items }: { items: ThreeWayMatch[] }) {
  return (
    <Table>
      <TableRoot>
        <thead>
          <tr>
            <th>Invoice Line</th>
            <th>PO Line</th>
            <th>GRN Line</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id ?? item.invoiceLineItemId}>
              <td>{item.invoiceLineItemId}</td>
              <td>{item.poLineItemId ?? "-"}</td>
              <td>{item.grnLineItemId ?? "-"}</td>
              <td><Badge label={item.matchResult} tone={item.matchResult?.toLowerCase?.() ?? "pending"} /></td>
            </tr>
          ))}
        </tbody>
      </TableRoot>
    </Table>
  );
}
