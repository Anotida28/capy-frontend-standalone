"use client";

import { Table, TableRoot } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { GRNLineItem } from "@/features/finance/grns/types";

export function GRNLineItems({ items }: { items: GRNLineItem[] }) {
  const formatPercent = (value?: number | null) => (typeof value === "number" ? `${value.toFixed(2)}%` : "-");
  return (
    <Table>
      <TableRoot>
        <thead>
          <tr>
            <th>Description</th>
            <th>Received</th>
            <th>Accepted</th>
            <th>Acceptance %</th>
            <th>Fully Accepted</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id ?? index}>
              <td>{item.description}</td>
              <td>{item.receivedQuantity}</td>
              <td>{item.acceptedQuantity}</td>
              <td>{formatPercent(item.acceptanceRate)}</td>
              <td>
                {item.fullyAccepted == null ? "-" : (
                  <Badge label={item.fullyAccepted ? "Yes" : "No"} tone={item.fullyAccepted ? "approved" : "rejected"} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </TableRoot>
    </Table>
  );
}
