"use client";

import { Table, TableRoot } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { BudgetLineItem } from "@/features/finance/budgets/types";
import { formatMoney } from "@/lib/utils/money";

export function BudgetLineItems({
  items,
  onView
}: {
  items: BudgetLineItem[];
  onView?: (item: BudgetLineItem) => void;
}) {
  return (
    <Table>
      <TableRoot>
        <thead>
          <tr>
            <th>Cost Code</th>
            <th>Allocated</th>
            <th>Committed</th>
            <th>Spent</th>
            <th>Available</th>
            {onView ? <th className="actions-cell">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id ?? item.costCodeId ?? Math.random().toString()}>
              <td>{item.costCodeCode ?? item.costCodeName ?? "-"}</td>
              <td>{formatMoney(item.allocatedAmount ?? 0)}</td>
              <td>{formatMoney(item.committedAmount ?? 0)}</td>
              <td>{formatMoney(item.spentAmount ?? 0)}</td>
              <td>{formatMoney(item.availableAmount ?? 0)}</td>
              {onView ? (
                <td className="actions-cell">
                  <div className="row-actions">
                    <Button variant="ghost" onClick={() => onView(item)}>View →</Button>
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </TableRoot>
    </Table>
  );
}
