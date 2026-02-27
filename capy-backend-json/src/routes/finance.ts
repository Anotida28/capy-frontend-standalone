import { Router, type Request } from "express";
import { create, findById, getCollection, mutateCollection, remove, update } from "../db/store.js";
import {
  asArray,
  asObject,
  badRequest,
  created,
  generateId,
  noContent,
  notFound,
  nowIso,
  ok,
  queryValue,
  respond,
  toNumber
} from "./response.js";

type Row = Record<string, unknown>;
type Body = Row | null;

function getBody(req: Request): Body {
  return asObject(req.body);
}

function asRecord(value: unknown): Row {
  return asObject(value) ?? {};
}

function decorateBudgetLineItem(item: Row) {
  const allocated = toNumber(item.allocatedAmount) ?? 0;
  const committed = toNumber(item.committedAmount) ?? 0;
  const spent = toNumber(item.spentAmount) ?? 0;
  const available = allocated - committed - spent;
  const utilization = allocated > 0 ? ((committed + spent) / allocated) * 100 : 0;
  return {
    ...item,
    availableAmount: item.availableAmount ?? available,
    utilizationPercentage: item.utilizationPercentage ?? Number(utilization.toFixed(2))
  };
}

async function decorateBudgetSummary(budgetId: string) {
  const budget = asRecord(await findById("budgets", budgetId));
  if (!budget.id) {
    return null;
  }

  const items = (await getCollection("budgetLineItems")).filter((item) => item.budgetId === budgetId);
  const totals = items.reduce<{ allocated: number; committed: number; spent: number }>(
    (acc, item) => {
      acc.allocated += toNumber(item.allocatedAmount) ?? 0;
      acc.committed += toNumber(item.committedAmount) ?? 0;
      acc.spent += toNumber(item.spentAmount) ?? 0;
      return acc;
    },
    { allocated: 0, committed: 0, spent: 0 }
  );

  const totalValue = toNumber(budget.totalValue) ?? 0;
  return {
    ...budget,
    totalAllocated: totals.allocated,
    totalCommitted: totals.committed,
    totalSpent: totals.spent,
    unallocatedAmount: totalValue - totals.allocated
  };
}

function computeOverdue(invoice: Row) {
  const dueDate = invoice.dueDate ? new Date(String(invoice.dueDate)) : null;
  if (!dueDate) return false;
  const status = String(invoice.status ?? "PENDING");
  if (status === "PAID" || status === "CANCELLED") return false;
  return dueDate.getTime() < Date.now();
}

export const financeRouter = Router();

financeRouter.all("*", async (req, res, next) => {
  try {
    const method = req.method.toUpperCase();
    const parts = req.path.split("/").filter(Boolean);
    const [resource, ...rest] = parts;
    const body = getBody(req);

    if (!resource) {
      return respond(res, notFound("Missing finance resource"));
    }

    switch (resource) {
      case "cost-codes": {
        const list = await getCollection("costCodes");

        if (method === "GET" && rest.length === 0) return respond(res, ok(list));
        if (method === "GET" && rest[0] === "active") return respond(res, ok(list.filter((item) => item.active !== false)));

        if (method === "GET" && rest[0] === "search") {
          const name = (queryValue(req.query.name) ?? "").toLowerCase();
          return respond(res, ok(list.filter((item) => String(item.name ?? "").toLowerCase().includes(name))));
        }

        if (method === "GET" && rest[0] === "code" && rest[1]) {
          const found = list.find((item) => item.code === rest[1]);
          return respond(res, found ? ok(found) : notFound("Cost code not found"));
        }

        if (method === "GET" && rest[0] === "category" && rest[1]) {
          return respond(res, ok(list.filter((item) => item.category === rest[1])));
        }

        if (method === "GET" && rest.length === 1) {
          const found = await findById("costCodes", rest[0]);
          return respond(res, found ? ok(found) : notFound("Cost code not found"));
        }

        if (method === "POST" && rest.length === 0) {
          const payload = body ?? {};
          const id = typeof payload.id === "string" && payload.id.trim() ? payload.id : generateId("cc");
          return respond(res, created(await create("costCodes", { ...payload, id })));
        }

        if (method === "PATCH" && rest.length === 2 && rest[1] === "deactivate") {
          const updated = await update("costCodes", rest[0], { active: false });
          return respond(res, updated ? ok(updated) : notFound("Cost code not found"));
        }

        if ((method === "PUT" || method === "PATCH") && rest.length === 1) {
          if (!body) return respond(res, badRequest("Missing payload"));
          const updated = await update("costCodes", rest[0], body);
          return respond(res, updated ? ok(updated) : notFound("Cost code not found"));
        }

        if (method === "DELETE" && rest.length === 1) {
          const removed = await remove("costCodes", rest[0]);
          return respond(res, removed ? noContent() : notFound("Cost code not found"));
        }

        return respond(res, notFound("Unsupported cost code operation"));
      }

      case "budgets": {
        const list = await getCollection("budgets");

        if (method === "GET" && rest.length === 0) return respond(res, ok(list));

        if (method === "GET" && rest[0] === "status" && rest[1]) {
          return respond(res, ok(list.filter((item) => String(item.status ?? "DRAFT") === rest[1])));
        }

        if (method === "GET" && rest[0] === "project" && rest[1]) {
          const found = list.find((item) => item.projectId === rest[1]);
          return respond(res, found ? ok(found) : notFound("Budget not found"));
        }

        if (method === "GET" && rest.length === 2 && rest[1] === "summary") {
          const summary = await decorateBudgetSummary(rest[0]);
          return respond(res, summary ? ok(summary) : notFound("Budget not found"));
        }

        if (method === "GET" && rest.length === 1) {
          const found = await findById("budgets", rest[0]);
          return respond(res, found ? ok(found) : notFound("Budget not found"));
        }

        if (method === "POST" && rest.length === 0) {
          const payload = body ?? {};
          const id = typeof payload.id === "string" && payload.id.trim() ? payload.id : generateId("budget");
          return respond(res, created(await create("budgets", { ...payload, id })));
        }

        if (method === "PATCH" && rest.length === 2 && rest[1] === "total-value") {
          const totalValue = toNumber(queryValue(req.query.totalValue));
          if (totalValue == null) return respond(res, badRequest("Missing totalValue"));
          const updated = await update("budgets", rest[0], { totalValue });
          return respond(res, updated ? ok(updated) : notFound("Budget not found"));
        }

        if (method === "POST" && rest.length === 2 && rest[1] === "approve") {
          const approvedBy = queryValue(req.query.approvedBy);
          const updated = await update("budgets", rest[0], {
            status: "APPROVED",
            approvedBy,
            approvedAt: nowIso()
          });
          return respond(res, updated ? ok(updated) : notFound("Budget not found"));
        }

        if (method === "POST" && rest.length === 2 && rest[1] === "lock") {
          const updated = await update("budgets", rest[0], { status: "LOCKED" });
          return respond(res, updated ? ok(updated) : notFound("Budget not found"));
        }

        if (method === "POST" && rest.length === 2 && rest[1] === "unlock") {
          const updated = await update("budgets", rest[0], { status: "APPROVED" });
          return respond(res, updated ? ok(updated) : notFound("Budget not found"));
        }

        if (method === "POST" && rest.length === 2 && rest[1] === "close") {
          const updated = await update("budgets", rest[0], { status: "CLOSED" });
          return respond(res, updated ? ok(updated) : notFound("Budget not found"));
        }

        if (method === "DELETE" && rest.length === 1) {
          const removed = await remove("budgets", rest[0]);
          return respond(res, removed ? noContent() : notFound("Budget not found"));
        }

        return respond(res, notFound("Unsupported budget operation"));
      }

      case "budget-line-items": {
        const list = await getCollection("budgetLineItems");

        if (method === "GET" && rest.length === 2 && rest[0] === "budget") {
          return respond(res, ok(list.filter((item) => item.budgetId === rest[1]).map(decorateBudgetLineItem)));
        }

        if (method === "GET" && rest.length === 4 && rest[0] === "budget" && rest[2] === "cost-code") {
          const found = list.find((item) => item.budgetId === rest[1] && item.costCodeId === rest[3]);
          return respond(res, found ? ok(decorateBudgetLineItem(found)) : notFound("Line item not found"));
        }

        if (method === "GET" && rest.length === 1) {
          const found = await findById("budgetLineItems", rest[0]);
          return respond(res, found ? ok(decorateBudgetLineItem(asRecord(found))) : notFound("Line item not found"));
        }

        if (method === "POST" && rest.length === 0) {
          const payload = body ?? {};
          const id = typeof payload.id === "string" && payload.id.trim() ? payload.id : generateId("bli");
          const createdItem = await create("budgetLineItems", { ...payload, id });
          return respond(res, created(decorateBudgetLineItem(createdItem)));
        }

        if (method === "PUT" && rest.length === 1) {
          if (!body) return respond(res, badRequest("Missing payload"));
          const updatedItem = await update("budgetLineItems", rest[0], body);
          return respond(
            res,
            updatedItem ? ok(decorateBudgetLineItem(asRecord(updatedItem))) : notFound("Line item not found")
          );
        }

        if (method === "DELETE" && rest.length === 1) {
          const removed = await remove("budgetLineItems", rest[0]);
          return respond(res, removed ? noContent() : notFound("Line item not found"));
        }

        return respond(res, notFound("Unsupported budget line item operation"));
      }

      case "purchase-orders": {
        const list = await getCollection("purchaseOrders");

        if (method === "GET" && rest.length === 0) return respond(res, ok(list));

        if (method === "GET" && rest[0] === "number" && rest[1]) {
          const found = list.find((item) => item.poNumber === rest[1]);
          return respond(res, found ? ok(found) : notFound("PO not found"));
        }

        if (method === "GET" && rest[0] === "project" && rest[1]) {
          return respond(res, ok(list.filter((item) => item.projectId === rest[1])));
        }

        if (method === "GET" && rest[0] === "status" && rest[1]) {
          return respond(res, ok(list.filter((item) => String(item.status ?? "DRAFT") === rest[1])));
        }

        if (method === "GET" && rest.length === 1) {
          const found = await findById("purchaseOrders", rest[0]);
          return respond(res, found ? ok(found) : notFound("PO not found"));
        }

        if (method === "POST" && rest.length === 0) {
          const payload = body ?? {};
          const id = typeof payload.id === "string" && payload.id.trim() ? payload.id : generateId("po");
          return respond(res, created(await create("purchaseOrders", { ...payload, id })));
        }

        if (method === "POST" && rest.length === 2 && rest[1] === "submit") {
          const updatedItem = await update("purchaseOrders", rest[0], { status: "PENDING_APPROVAL" });
          return respond(res, updatedItem ? ok(updatedItem) : notFound("PO not found"));
        }

        if (method === "POST" && rest.length === 2 && rest[1] === "approve") {
          const approvedBy = queryValue(req.query.approvedBy);
          const updatedItem = await update("purchaseOrders", rest[0], {
            status: "APPROVED",
            approvedBy,
            approvedAt: nowIso()
          });
          return respond(res, updatedItem ? ok(updatedItem) : notFound("PO not found"));
        }

        if (method === "POST" && rest.length === 2 && rest[1] === "cancel") {
          const updatedItem = await update("purchaseOrders", rest[0], { status: "CANCELLED" });
          return respond(res, updatedItem ? ok(updatedItem) : notFound("PO not found"));
        }

        if (method === "POST" && rest.length === 2 && rest[1] === "close") {
          const updatedItem = await update("purchaseOrders", rest[0], { status: "CLOSED" });
          return respond(res, updatedItem ? ok(updatedItem) : notFound("PO not found"));
        }

        if (method === "DELETE" && rest.length === 1) {
          const removed = await remove("purchaseOrders", rest[0]);
          return respond(res, removed ? noContent() : notFound("PO not found"));
        }

        return respond(res, notFound("Unsupported purchase order operation"));
      }

      case "invoices": {
        const list = await getCollection("invoices");

        if (method === "GET" && rest.length === 0) return respond(res, ok(list));

        if (method === "GET" && rest[0] === "number" && rest[1]) {
          const found = list.find((item) => item.invoiceNumber === rest[1]);
          return respond(res, found ? ok(found) : notFound("Invoice not found"));
        }

        if (method === "GET" && rest[0] === "status" && rest[1]) {
          return respond(res, ok(list.filter((item) => String(item.status ?? "PENDING") === rest[1])));
        }

        if (method === "GET" && rest[0] === "overdue") {
          return respond(res, ok(list.filter((item) => computeOverdue(item))));
        }

        if (method === "GET" && rest.length === 1) {
          const found = await findById("invoices", rest[0]);
          return respond(res, found ? ok(found) : notFound("Invoice not found"));
        }

        if (method === "POST" && rest.length === 0) {
          const payload = body ?? {};
          const id = typeof payload.id === "string" && payload.id.trim() ? payload.id : generateId("inv");
          return respond(res, created(await create("invoices", { ...payload, id })));
        }

        if (method === "POST" && rest.length === 2 && rest[1] === "approve") {
          const approvedBy = queryValue(req.query.approvedBy);
          const updatedItem = await update("invoices", rest[0], {
            status: "APPROVED",
            approvedBy,
            approvedAt: nowIso()
          });
          return respond(res, updatedItem ? ok(updatedItem) : notFound("Invoice not found"));
        }

        if (method === "POST" && rest.length === 2 && rest[1] === "reject") {
          const reason = queryValue(req.query.reason) ?? "";
          const updatedItem = await update("invoices", rest[0], {
            status: "REJECTED",
            notes: reason
          });
          return respond(res, updatedItem ? ok(updatedItem) : notFound("Invoice not found"));
        }

        if (method === "POST" && rest.length === 2 && rest[1] === "payment") {
          const amount = toNumber(queryValue(req.query.amount)) ?? 0;
          const paidBy = queryValue(req.query.paidBy);
          const paymentReference = queryValue(req.query.paymentReference);
          const updatedItem = await update("invoices", rest[0], {
            status: "PAID",
            paidAmount: amount,
            paidBy,
            paidAt: nowIso(),
            paymentReference
          });
          return respond(res, updatedItem ? ok(updatedItem) : notFound("Invoice not found"));
        }

        if (method === "DELETE" && rest.length === 1) {
          const removed = await remove("invoices", rest[0]);
          return respond(res, removed ? noContent() : notFound("Invoice not found"));
        }

        return respond(res, notFound("Unsupported invoice operation"));
      }

      case "grns": {
        const list = await getCollection("grns");

        if (method === "GET" && rest.length === 0) return respond(res, ok(list));

        if (method === "GET" && rest[0] === "number" && rest[1]) {
          const found = list.find((item) => item.grnNumber === rest[1]);
          return respond(res, found ? ok(found) : notFound("GRN not found"));
        }

        if (method === "GET" && rest[0] === "purchase-order" && rest[1]) {
          return respond(res, ok(list.filter((item) => item.purchaseOrderId === rest[1])));
        }

        if (method === "GET" && rest[0] === "recent" && rest[1]) {
          const days = toNumber(rest[1]) ?? 0;
          const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
          return respond(
            res,
            ok(
              list.filter((item) => {
                const date = item.receivedDate ? new Date(String(item.receivedDate)).getTime() : 0;
                return date >= cutoff;
              })
            )
          );
        }

        if (method === "GET" && rest.length === 1) {
          const found = await findById("grns", rest[0]);
          return respond(res, found ? ok(found) : notFound("GRN not found"));
        }

        if (method === "POST" && rest.length === 0) {
          const payload = body ?? {};
          const id = typeof payload.id === "string" && payload.id.trim() ? payload.id : generateId("grn");
          return respond(res, created(await create("grns", { ...payload, id })));
        }

        if (method === "DELETE" && rest.length === 1) {
          const removed = await remove("grns", rest[0]);
          return respond(res, removed ? noContent() : notFound("GRN not found"));
        }

        return respond(res, notFound("Unsupported GRN operation"));
      }

      case "3-way-match": {
        if (method === "GET" && rest[0] === "requiring-review") {
          const list = await getCollection("threeWayMatches");
          return respond(res, ok(list.filter((item) => item.requiresReview)));
        }

        if (method === "POST" && rest[0] === "invoice" && rest[1]) {
          const invoice = asRecord(await findById("invoices", rest[1]));
          if (!invoice.id) {
            return respond(res, notFound("Invoice not found"));
          }

          const invoiceLineItems = asArray(invoice.lineItems)
            .map((item) => asObject(item))
            .filter((item): item is Row => Boolean(item));

          const matches = await mutateCollection("threeWayMatches", (list) => {
            const result: Row[] = [];

            for (const lineItem of invoiceLineItems) {
              const lineItemId = lineItem.id;
              if (typeof lineItemId !== "string" || !lineItemId.trim()) {
                continue;
              }

              const existing = list.find((entry) => entry.invoiceLineItemId === lineItemId);
              if (existing) {
                result.push(existing);
                continue;
              }

              const next: Row = {
                id: generateId("match"),
                invoiceLineItemId: lineItemId,
                poLineItemId: lineItem.poLineItemId ?? null,
                grnLineItemId: null,
                matchResult: "MATCHED",
                matchNotes: "Auto matched",
                requiresReview: false,
                autoApproved: true,
                manuallyReviewed: false,
                quantityTolerancePercentage: 5,
                priceTolerancePercentage: 5,
                matchSuccessful: true,
                matchedAt: nowIso(),
                createdAt: nowIso(),
                updatedAt: nowIso()
              };

              list.push(next);
              result.push(next);
            }

            return result;
          });

          return respond(res, ok(matches));
        }

        if (method === "GET" && rest[0] === "invoice-line" && rest[1]) {
          const list = await getCollection("threeWayMatches");
          const found = list.find((item) => item.invoiceLineItemId === rest[1]);
          return respond(res, found ? ok(found) : notFound("Match not found"));
        }

        if (method === "POST" && rest.length === 2 && rest[1] === "manual-approve") {
          const reviewerId = queryValue(req.query.reviewerId);
          const notes = queryValue(req.query.notes);
          const updatedItem = await update("threeWayMatches", rest[0], {
            matchResult: "MANUALLY_APPROVED",
            manuallyReviewed: true,
            reviewedBy: reviewerId,
            reviewedAt: nowIso(),
            matchNotes: notes
          });
          return respond(res, updatedItem ? ok(updatedItem) : notFound("Match not found"));
        }

        return respond(res, notFound("Unsupported 3-way match operation"));
      }

      default:
        return respond(res, notFound(`Unknown finance resource ${resource}`));
    }
  } catch (error) {
    return next(error);
  }
});
