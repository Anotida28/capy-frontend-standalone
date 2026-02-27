"use client";

import { Table, TableRoot } from "@/components/ui/table";
import type { POLineItem } from "@/features/finance/purchase-orders/types";
import { formatMoney } from "@/lib/utils/money";

export function POLineItems({ items }: { items: POLineItem[] }) {
  return (
    <Table>
      <TableRoot>
        <thead>
          <tr>
            <th>Description</th>
            <th>Quantity</th>
            <th>Unit Price</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id ?? index}>
              <td>{item.description}</td>
              <td>{item.quantity}</td>
              <td>{formatMoney(item.unitPrice)}</td>
            </tr>
          ))}
        </tbody>
      </TableRoot>
    </Table>
  );
}
