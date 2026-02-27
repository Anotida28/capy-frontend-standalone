# Backend Build Guide (JSON File DB)

This guide is for building the backend that this frontend expects.

## Target Contract

- Base URL: `http://localhost:8080/api/v1`
- Auth: HTTP Basic Auth (`Authorization: Basic ...`)
- Payloads: JSON (`Content-Type: application/json`)
- Frontend switch:
  - `NEXT_PUBLIC_USE_MOCK_API=false`
  - `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080`

## 1. Create Backend Project

1. Create a backend folder (same workspace or separate repo).
2. Initialize Node + TypeScript.
3. Install dependencies.

```bash
mkdir capy-backend-json
cd capy-backend-json
npm init -y
npm i express cors morgan
npm i -D typescript tsx @types/node @types/express
npx tsc --init
```

## 2. Add Scripts

Use these scripts in `package.json`:

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/server.js"
  }
}
```

## 3. Create Folder Structure

```text
src/
  server.ts
  config.ts
  middleware/
    basic-auth.ts
  db/
    data.json
    store.ts
  routes/
    operations.ts
    finance.ts
    health.ts
```

## 4. Seed the JSON Database

1. Copy this frontend seed file into backend `src/db/data.json`:
   - `capy-frontend-standalone/src/mocks/data.json`
2. Keep these top-level collections in the JSON file:
   - `projects`, `assets`, `staff`, `vendors`, `dailyLogs`, `scopeItems`
   - `materialCatalog`, `laborNorms`, `assetAllocations`, `assetMedia`
   - `teamAssignments`, `sheqTemplates`, `projectMilestones`, `projectMedia`, `timesheets`
   - `costCodes`, `budgets`, `budgetLineItems`, `purchaseOrders`, `invoices`, `grns`, `threeWayMatches`

## 5. Build the JSON DB Layer (`store.ts`)

Implement helpers:

1. `readDb()`
   - Read JSON file from disk.
   - Parse and return full object.
2. `writeDb(db)`
   - Write with atomic strategy (`data.tmp` then rename).
3. `getCollection(name)`
   - Return array by collection name.
4. Generic helpers:
   - `findById`, `create`, `update`, `remove`
5. Optional but recommended:
   - Simple write lock/queue to avoid concurrent write corruption.

## 6. Build the Server Core (`server.ts`)

1. Add middleware:
   - `cors` (allow frontend origin)
   - `express.json()`
   - request logging (`morgan`)
2. Mount routes:
   - `/health`
   - `/api/v1/*`
3. Add global error handler returning JSON:
   - `{ "message": "..." }`

## 7. Add Basic Auth Middleware

Frontend sends Basic Auth if user logs in. Backend should:

1. Parse `Authorization` header.
2. Validate username/password against env config.
3. Return `401` if invalid.
4. Attach authenticated user to request context.

Suggested env vars:

```env
PORT=8080
CORS_ORIGIN=http://localhost:3000
BASIC_AUTH_USERS=admin:admin,finance:finance,sitemanager:sitemanager,stores:stores
DB_FILE=src/db/data.json
```

## 8. Implement Operations Routes First

Build these endpoints under `/api/v1`:

1. Generic CRUD groups:
   - `/projects`
   - `/assets`
   - `/staff`
   - `/vendors`
   - `/daily-logs`
   - `/scope-items`
   - `/sheq-templates`
   - `/timesheets`
   - `/asset-allocations`
2. Keyed-by-code groups:
   - `/material-catalog/:itemCode`
   - `/labor-norms/:activityCode`
3. Related-resource queries:
   - `/asset-media/asset/:assetId`
   - `/team-assignments/project/:projectId`
   - `/project-milestones/project/:projectId`
   - `/project-media/project/:projectId`

## 9. Implement Finance Routes

Build under `/api/v1/finance`:

1. Cost codes
   - `/cost-codes`
   - `/cost-codes/active`
   - `/cost-codes/search?name=...`
   - `/cost-codes/code/:code`
   - `/cost-codes/category/:category`
   - `/cost-codes/:id/deactivate`
2. Budgets
   - `/budgets`
   - `/budgets/status/:status`
   - `/budgets/project/:projectId`
   - `/budgets/:id/summary`
   - `/budgets/:id/total-value?totalValue=...`
   - `/budgets/:id/approve?approvedBy=...`
   - `/budgets/:id/lock`
   - `/budgets/:id/unlock`
   - `/budgets/:id/close`
3. Budget line items
   - `/budget-line-items`
   - `/budget-line-items/budget/:budgetId`
   - `/budget-line-items/budget/:budgetId/cost-code/:costCodeId`
   - `/budget-line-items/:id`
4. Purchase orders
   - `/purchase-orders`
   - `/purchase-orders/number/:poNumber`
   - `/purchase-orders/project/:projectId`
   - `/purchase-orders/status/:status`
   - `/purchase-orders/:id/submit`
   - `/purchase-orders/:id/approve?approvedBy=...`
   - `/purchase-orders/:id/cancel`
   - `/purchase-orders/:id/close`
5. Invoices
   - `/invoices`
   - `/invoices/number/:invoiceNumber`
   - `/invoices/status/:status`
   - `/invoices/overdue`
   - `/invoices/:id/approve?approvedBy=...`
   - `/invoices/:id/reject?reason=...`
   - `/invoices/:id/payment?amount=...&paidBy=...&paymentReference=...`
6. GRNs
   - `/grns`
   - `/grns/number/:grnNumber`
   - `/grns/purchase-order/:purchaseOrderId`
   - `/grns/recent/:days`
7. 3-way match
   - `/3-way-match/requiring-review`
   - `/3-way-match/invoice/:invoiceId`
   - `/3-way-match/invoice-line/:invoiceLineItemId`
   - `/3-way-match/:matchId/manual-approve?reviewerId=...&notes=...`

## 10. Response Rules (Important)

1. Return HTTP status codes correctly:
   - `200` read/update success
   - `201` create success
   - `204` delete success
   - `400` invalid request
   - `401` auth required/invalid
   - `404` not found
2. Always return JSON for errors:

```json
{ "message": "Not found" }
```

## 11. Run and Connect

1. Start backend:

```bash
npm run dev
```

2. In frontend `.env.local`, set:

```env
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

3. Start frontend and test flows:
   - Login
   - Projects CRUD
   - Assets CRUD
   - Finance pages (cost codes, budgets, PO, invoices, GRNs)

## 12. Build Order (Fastest Path)

1. Server boot + health + CORS + auth middleware.
2. JSON DB read/write layer.
3. Operations generic CRUD resources.
4. Operations special filtered routes.
5. Finance routes in this order: cost codes, budgets, budget line items, POs, invoices, GRNs, 3-way match.
6. Final pass for status codes, error shape, and auth checks.

## 13. Optional Hardening

1. Add schema validation (Zod) before writes.
2. Add backup file rotation for `data.json`.
3. Add tests for top 20 critical endpoints.
4. Add Dockerfile for consistent local and CI runtime.
