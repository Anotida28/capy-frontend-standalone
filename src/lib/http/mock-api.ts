import seedData from "@/mocks/data.json";
import { ApiError } from "@/lib/http/errors";

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

type Db = typeof seedData;
let db: Db = clone(seedData);

const nowIso = () => new Date().toISOString();

const generateId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const ok = (data: unknown) => ({ status: 200, data });
const created = (data: unknown) => ({ status: 201, data });
const noContent = () => ({ status: 204, data: undefined });
const notFound = (message: string) => ({ status: 404, message });
const badRequest = (message: string) => ({ status: 400, message });

const parseBody = (init?: RequestInit) => {
  if (!init?.body) return null;
  if (typeof init.body === "string") {
    try {
      return JSON.parse(init.body);
    } catch {
      return null;
    }
  }
  return init.body;
};

const toNumber = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const getCollection = (key: keyof Db) => db[key] as unknown[];

const findById = (list: unknown[], id: string, key: string = "id") =>
  list.find((item) => (item as Record<string, unknown>)[key] === id) as Record<string, unknown> | undefined;

const removeById = (list: unknown[], id: string, key: string = "id") => {
  const index = list.findIndex((item) => (item as Record<string, unknown>)[key] === id);
  if (index >= 0) list.splice(index, 1);
  return index >= 0;
};

const updateById = (list: unknown[], id: string, payload: Record<string, unknown>, key: string = "id") => {
  const index = list.findIndex((item) => (item as Record<string, unknown>)[key] === id);
  if (index === -1) return null;
  const existing = list[index] as Record<string, unknown>;
  const updated = { ...existing, ...payload, [key]: id };
  list[index] = updated;
  return updated;
};

const decorateBudgetLineItem = (item: Record<string, unknown>) => {
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
};

const decorateBudgetSummary = (budgetId: string) => {
  const items = (db.budgetLineItems as Record<string, unknown>[]).filter((item) => item.budgetId === budgetId);
  const totals = items.reduce<{ allocated: number; committed: number; spent: number }>(
    (acc, item) => {
      acc.allocated += toNumber(item.allocatedAmount) ?? 0;
      acc.committed += toNumber(item.committedAmount) ?? 0;
      acc.spent += toNumber(item.spentAmount) ?? 0;
      return acc;
    },
    { allocated: 0, committed: 0, spent: 0 }
  );
  const budget = findById(getCollection("budgets"), budgetId) as Record<string, unknown> | undefined;
  const totalValue = toNumber(budget?.totalValue) ?? 0;
  return {
    ...budget,
    totalAllocated: totals.allocated,
    totalCommitted: totals.committed,
    totalSpent: totals.spent,
    unallocatedAmount: totalValue - totals.allocated
  };
};

const findInvoice = (id: string) => findById(getCollection("invoices"), id) as Record<string, unknown> | undefined;

const computeOverdue = (invoice: Record<string, unknown>) => {
  const dueDate = invoice.dueDate ? new Date(String(invoice.dueDate)) : null;
  if (!dueDate) return false;
  const status = String(invoice.status ?? "PENDING");
  if (["PAID", "CANCELLED"].includes(status)) return false;
  return dueDate.getTime() < Date.now();
};

const handleOperations = (method: string, parts: string[], url: URL, init?: RequestInit) => {
  const [resource, ...rest] = parts;
  if (!resource) return notFound("Missing resource");

  const body = parseBody(init) as Record<string, unknown> | null;

  const simple = (key: keyof Db, idKey: string = "id") => {
    const list = getCollection(key);
    if (method === "GET" && rest.length === 0) return ok(list);
    if (method === "GET" && rest.length === 1) {
      const item = findById(list, rest[0], idKey);
      return item ? ok(item) : notFound(`${resource} not found`);
    }
    if (method === "POST") {
      const next = { ...(body ?? {}), [idKey]: (body as Record<string, unknown>)?.[idKey] ?? generateId(resource) };
      list.push(next as unknown);
      return created(next);
    }
    if (method === "PUT" && rest.length === 1) {
      if (!body) return badRequest("Missing payload");
      const updated = updateById(list, rest[0], body, idKey);
      return updated ? ok(updated) : notFound(`${resource} not found`);
    }
    if (method === "DELETE" && rest.length === 1) {
      return removeById(list, rest[0], idKey) ? noContent() : notFound(`${resource} not found`);
    }
    return notFound("Unsupported operation");
  };

  switch (resource) {
    case "projects":
      return simple("projects");
    case "assets":
      return simple("assets");
    case "staff":
      return simple("staff");
    case "vendors":
      return simple("vendors");
    case "daily-logs":
      return simple("dailyLogs");
    case "scope-items":
      return simple("scopeItems");
    case "material-catalog":
      return simple("materialCatalog", "itemCode");
    case "labor-norms":
      return simple("laborNorms", "activityCode");
    case "asset-allocations":
      return simple("assetAllocations");
    case "asset-media": {
      const list = getCollection("assetMedia") as Record<string, unknown>[];
      if (method === "GET" && rest[0] === "asset" && rest[1]) {
        return ok(list.filter((item) => item.assetId === rest[1]));
      }
      return simple("assetMedia");
    }
    case "team-assignments": {
      const list = getCollection("teamAssignments") as Record<string, unknown>[];
      if (method === "GET" && rest[0] === "project" && rest[1]) {
        return ok(
          list.filter((assignment) => {
            const projectId = assignment.projectId ?? (assignment.project as Record<string, unknown> | undefined)?.id;
            return projectId === rest[1];
          })
        );
      }
      return simple("teamAssignments");
    }
    case "sheq-templates":
      return simple("sheqTemplates");
    case "project-milestones": {
      const list = getCollection("projectMilestones") as Record<string, unknown>[];
      if (method === "GET" && rest[0] === "project" && rest[1]) {
        return ok(list.filter((item) => item.projectId === rest[1]));
      }
      return simple("projectMilestones");
    }
    case "project-media": {
      const list = getCollection("projectMedia") as Record<string, unknown>[];
      if (method === "GET" && rest[0] === "project" && rest[1]) {
        return ok(list.filter((item) => item.projectId === rest[1]));
      }
      return simple("projectMedia");
    }
    case "timesheets":
      return simple("timesheets");
    default:
      return notFound(`Unknown resource ${resource}`);
  }
};

const handleFinance = (method: string, parts: string[], url: URL, init?: RequestInit) => {
  const [, resource, ...rest] = parts;
  if (!resource) return notFound("Missing finance resource");
  const body = parseBody(init) as Record<string, unknown> | null;

  switch (resource) {
    case "cost-codes": {
      const list = getCollection("costCodes") as Record<string, unknown>[];
      if (method === "GET" && rest.length === 0) return ok(list);
      if (method === "GET" && rest[0] === "active") return ok(list.filter((c) => c.active !== false));
      if (method === "GET" && rest[0] === "search") {
        const name = url.searchParams.get("name")?.toLowerCase() ?? "";
        return ok(list.filter((c) => String(c.name).toLowerCase().includes(name)));
      }
      if (method === "GET" && rest[0] === "code" && rest[1]) {
        const found = list.find((c) => c.code === rest[1]);
        return found ? ok(found) : notFound("Cost code not found");
      }
      if (method === "GET" && rest[0] === "category" && rest[1]) {
        return ok(list.filter((c) => c.category === rest[1]));
      }
      if (method === "GET" && rest.length === 1) {
        const found = findById(list, rest[0]);
        return found ? ok(found) : notFound("Cost code not found");
      }
      if (method === "POST") {
        const next = { ...(body ?? {}), id: (body as Record<string, unknown>)?.id ?? generateId("cc") };
        list.push(next);
        return created(next);
      }
      if (method === "PATCH" && rest.length === 2 && rest[1] === "deactivate") {
        const updated = updateById(list, rest[0], { active: false });
        return updated ? ok(updated) : notFound("Cost code not found");
      }
      if ((method === "PUT" || method === "PATCH") && rest.length === 1) {
        if (!body) return badRequest("Missing payload");
        const updated = updateById(list, rest[0], body);
        return updated ? ok(updated) : notFound("Cost code not found");
      }
      if (method === "DELETE" && rest.length === 1) {
        return removeById(list, rest[0]) ? noContent() : notFound("Cost code not found");
      }
      return notFound("Unsupported cost code operation");
    }
    case "budgets": {
      const list = getCollection("budgets") as Record<string, unknown>[];
      if (method === "GET" && rest.length === 0) return ok(list);
      if (method === "GET" && rest[0] === "status" && rest[1]) {
        return ok(list.filter((b) => String(b.status ?? "DRAFT") === rest[1]));
      }
      if (method === "GET" && rest[0] === "project" && rest[1]) {
        const found = list.find((b) => b.projectId === rest[1]);
        return found ? ok(found) : notFound("Budget not found");
      }
      if (method === "GET" && rest.length === 2 && rest[1] === "summary") {
        return ok(decorateBudgetSummary(rest[0]));
      }
      if (method === "GET" && rest.length === 1) {
        const found = findById(list, rest[0]);
        return found ? ok(found) : notFound("Budget not found");
      }
      if (method === "POST" && rest.length === 0) {
        const next = { ...(body ?? {}), id: (body as Record<string, unknown>)?.id ?? generateId("budget") };
        list.push(next);
        return created(next);
      }
      if (method === "PATCH" && rest.length === 2 && rest[1] === "total-value") {
        const totalValue = toNumber(url.searchParams.get("totalValue"));
        if (totalValue == null) return badRequest("Missing totalValue");
        const updated = updateById(list, rest[0], { totalValue });
        return updated ? ok(updated) : notFound("Budget not found");
      }
      if (method === "POST" && rest.length === 2 && rest[1] === "approve") {
        const approvedBy = url.searchParams.get("approvedBy") ?? undefined;
        const updated = updateById(list, rest[0], { status: "APPROVED", approvedBy, approvedAt: nowIso() });
        return updated ? ok(updated) : notFound("Budget not found");
      }
      if (method === "POST" && rest.length === 2 && rest[1] === "lock") {
        const updated = updateById(list, rest[0], { status: "LOCKED" });
        return updated ? ok(updated) : notFound("Budget not found");
      }
      if (method === "POST" && rest.length === 2 && rest[1] === "unlock") {
        const updated = updateById(list, rest[0], { status: "APPROVED" });
        return updated ? ok(updated) : notFound("Budget not found");
      }
      if (method === "POST" && rest.length === 2 && rest[1] === "close") {
        const updated = updateById(list, rest[0], { status: "CLOSED" });
        return updated ? ok(updated) : notFound("Budget not found");
      }
      if (method === "DELETE" && rest.length === 1) {
        return removeById(list, rest[0]) ? noContent() : notFound("Budget not found");
      }
      return notFound("Unsupported budget operation");
    }
    case "budget-line-items": {
      const list = getCollection("budgetLineItems") as Record<string, unknown>[];
      if (method === "GET" && rest.length === 2 && rest[0] === "budget") {
        return ok(list.filter((item) => item.budgetId === rest[1]).map(decorateBudgetLineItem));
      }
      if (method === "GET" && rest.length === 4 && rest[0] === "budget" && rest[2] === "cost-code") {
        const found = list.find((item) => item.budgetId === rest[1] && item.costCodeId === rest[3]);
        return found ? ok(decorateBudgetLineItem(found)) : notFound("Line item not found");
      }
      if (method === "GET" && rest.length === 1) {
        const found = findById(list, rest[0]);
        return found ? ok(decorateBudgetLineItem(found)) : notFound("Line item not found");
      }
      if (method === "POST" && rest.length === 0) {
        const next = { ...(body ?? {}), id: (body as Record<string, unknown>)?.id ?? generateId("bli") };
        list.push(next);
        return created(decorateBudgetLineItem(next));
      }
      if (method === "PUT" && rest.length === 1) {
        if (!body) return badRequest("Missing payload");
        const updated = updateById(list, rest[0], body);
        return updated ? ok(decorateBudgetLineItem(updated)) : notFound("Line item not found");
      }
      if (method === "DELETE" && rest.length === 1) {
        return removeById(list, rest[0]) ? noContent() : notFound("Line item not found");
      }
      return notFound("Unsupported budget line item operation");
    }
    case "purchase-orders": {
      const list = getCollection("purchaseOrders") as Record<string, unknown>[];
      if (method === "GET" && rest.length === 0) return ok(list);
      if (method === "GET" && rest[0] === "number" && rest[1]) {
        const found = list.find((po) => po.poNumber === rest[1]);
        return found ? ok(found) : notFound("PO not found");
      }
      if (method === "GET" && rest[0] === "project" && rest[1]) {
        return ok(list.filter((po) => po.projectId === rest[1]));
      }
      if (method === "GET" && rest[0] === "status" && rest[1]) {
        return ok(list.filter((po) => String(po.status ?? "DRAFT") === rest[1]));
      }
      if (method === "GET" && rest.length === 1) {
        const found = findById(list, rest[0]);
        return found ? ok(found) : notFound("PO not found");
      }
      if (method === "POST" && rest.length === 0) {
        const next = { ...(body ?? {}), id: (body as Record<string, unknown>)?.id ?? generateId("po") };
        list.push(next);
        return created(next);
      }
      if (method === "POST" && rest.length === 2 && rest[1] === "submit") {
        const updated = updateById(list, rest[0], { status: "PENDING_APPROVAL" });
        return updated ? ok(updated) : notFound("PO not found");
      }
      if (method === "POST" && rest.length === 2 && rest[1] === "approve") {
        const approvedBy = url.searchParams.get("approvedBy") ?? undefined;
        const updated = updateById(list, rest[0], { status: "APPROVED", approvedBy, approvedAt: nowIso() });
        return updated ? ok(updated) : notFound("PO not found");
      }
      if (method === "POST" && rest.length === 2 && rest[1] === "cancel") {
        const updated = updateById(list, rest[0], { status: "CANCELLED" });
        return updated ? ok(updated) : notFound("PO not found");
      }
      if (method === "POST" && rest.length === 2 && rest[1] === "close") {
        const updated = updateById(list, rest[0], { status: "CLOSED" });
        return updated ? ok(updated) : notFound("PO not found");
      }
      if (method === "DELETE" && rest.length === 1) {
        return removeById(list, rest[0]) ? noContent() : notFound("PO not found");
      }
      return notFound("Unsupported purchase order operation");
    }
    case "invoices": {
      const list = getCollection("invoices") as Record<string, unknown>[];
      if (method === "GET" && rest.length === 0) return ok(list);
      if (method === "GET" && rest[0] === "number" && rest[1]) {
        const found = list.find((inv) => inv.invoiceNumber === rest[1]);
        return found ? ok(found) : notFound("Invoice not found");
      }
      if (method === "GET" && rest[0] === "status" && rest[1]) {
        return ok(list.filter((inv) => String(inv.status ?? "PENDING") === rest[1]));
      }
      if (method === "GET" && rest[0] === "overdue") {
        return ok(list.filter((inv) => computeOverdue(inv)));
      }
      if (method === "GET" && rest.length === 1) {
        const found = findById(list, rest[0]);
        return found ? ok(found) : notFound("Invoice not found");
      }
      if (method === "POST" && rest.length === 0) {
        const next = { ...(body ?? {}), id: (body as Record<string, unknown>)?.id ?? generateId("inv") };
        list.push(next);
        return created(next);
      }
      if (method === "POST" && rest.length === 2 && rest[1] === "approve") {
        const approvedBy = url.searchParams.get("approvedBy") ?? undefined;
        const updated = updateById(list, rest[0], { status: "APPROVED", approvedBy, approvedAt: nowIso() });
        return updated ? ok(updated) : notFound("Invoice not found");
      }
      if (method === "POST" && rest.length === 2 && rest[1] === "reject") {
        const reason = url.searchParams.get("reason") ?? "";
        const updated = updateById(list, rest[0], { status: "REJECTED", notes: reason });
        return updated ? ok(updated) : notFound("Invoice not found");
      }
      if (method === "POST" && rest.length === 2 && rest[1] === "payment") {
        const amount = toNumber(url.searchParams.get("amount")) ?? 0;
        const paidBy = url.searchParams.get("paidBy") ?? undefined;
        const paymentReference = url.searchParams.get("paymentReference") ?? undefined;
        const updated = updateById(list, rest[0], {
          status: "PAID",
          paidAmount: amount,
          paidBy,
          paidAt: nowIso(),
          paymentReference
        });
        return updated ? ok(updated) : notFound("Invoice not found");
      }
      if (method === "DELETE" && rest.length === 1) {
        return removeById(list, rest[0]) ? noContent() : notFound("Invoice not found");
      }
      return notFound("Unsupported invoice operation");
    }
    case "grns": {
      const list = getCollection("grns") as Record<string, unknown>[];
      if (method === "GET" && rest.length === 0) return ok(list);
      if (method === "GET" && rest[0] === "number" && rest[1]) {
        const found = list.find((g) => g.grnNumber === rest[1]);
        return found ? ok(found) : notFound("GRN not found");
      }
      if (method === "GET" && rest[0] === "purchase-order" && rest[1]) {
        return ok(list.filter((g) => g.purchaseOrderId === rest[1]));
      }
      if (method === "GET" && rest[0] === "recent" && rest[1]) {
        const days = toNumber(rest[1]) ?? 0;
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
        return ok(
          list.filter((g) => {
            const date = g.receivedDate ? new Date(String(g.receivedDate)).getTime() : 0;
            return date >= cutoff;
          })
        );
      }
      if (method === "GET" && rest.length === 1) {
        const found = findById(list, rest[0]);
        return found ? ok(found) : notFound("GRN not found");
      }
      if (method === "POST" && rest.length === 0) {
        const next = { ...(body ?? {}), id: (body as Record<string, unknown>)?.id ?? generateId("grn") };
        list.push(next);
        return created(next);
      }
      if (method === "DELETE" && rest.length === 1) {
        return removeById(list, rest[0]) ? noContent() : notFound("GRN not found");
      }
      return notFound("Unsupported GRN operation");
    }
    case "3-way-match": {
      const list = getCollection("threeWayMatches") as Record<string, unknown>[];
      if (method === "GET" && rest[0] === "requiring-review") {
        return ok(list.filter((m) => m.requiresReview));
      }
      if (method === "POST" && rest[0] === "invoice" && rest[1]) {
        const invoice = findInvoice(rest[1]);
        if (!invoice) return notFound("Invoice not found");
        const lineItems = (invoice.lineItems as Record<string, unknown>[] | undefined) ?? [];
        const matches = lineItems.map((item) => {
          const existing = list.find((m) => m.invoiceLineItemId === item.id);
          if (existing) return existing;
          const next = {
            id: generateId("match"),
            invoiceLineItemId: item.id,
            poLineItemId: item.poLineItemId ?? null,
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
          return next;
        });
        return ok(matches);
      }
      if (method === "GET" && rest[0] === "invoice-line" && rest[1]) {
        const found = list.find((m) => m.invoiceLineItemId === rest[1]);
        return found ? ok(found) : notFound("Match not found");
      }
      if (method === "POST" && rest.length === 2 && rest[1] === "manual-approve") {
        const reviewerId = url.searchParams.get("reviewerId") ?? undefined;
        const notes = url.searchParams.get("notes") ?? undefined;
        const updated = updateById(list, rest[0], {
          matchResult: "MANUALLY_APPROVED",
          manuallyReviewed: true,
          reviewedBy: reviewerId,
          reviewedAt: nowIso(),
          matchNotes: notes
        });
        return updated ? ok(updated) : notFound("Match not found");
      }
      return notFound("Unsupported 3-way match operation");
    }
    default:
      return notFound(`Unknown finance resource ${resource}`);
  }
};

export async function mockRequest<T>(input: string, init: RequestInit = {}) {
  const method = (init.method ?? "GET").toUpperCase();
  const url = input.startsWith("http") ? new URL(input) : new URL(input, "http://mock.local");
  const cleanedPath = url.pathname.replace(/^\/api\/v1/, "");
  const parts = cleanedPath.split("/").filter(Boolean);
  const response = parts[0] === "finance"
    ? handleFinance(method, parts, url, init)
    : handleOperations(method, parts, url, init);

  if (response.status >= 400) {
    const message = "message" in response ? response.message : "Mock API error";
    throw new ApiError(message, response.status, response);
  }

  if (!("data" in response)) {
    throw new ApiError("Mock API error", 500, response);
  }

  return response.data as T;
}

export function resetMockDb() {
  db = clone(seedData);
}
