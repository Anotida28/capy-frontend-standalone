"use client";

import { Table, TableRoot } from "@/components/ui/table";
import type { InvoiceLineItem } from "@/features/finance/invoices/types";
import { formatMoney } from "@/lib/utils/money";

export function InvoiceLineItems({ items }: { items: InvoiceLineItem[] }) {
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
