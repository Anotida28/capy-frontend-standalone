# Implementation Log And Run Guide

## Overview

This project was updated for a presentation workflow with:

- Frontend switched to use backend mode (`NEXT_PUBLIC_USE_MOCK_API=false`).
- A new JSON-backed backend service on `http://localhost:8080`.
- Default backend basic-auth credentials aligned to frontend login credentials.
- Major frontend responsive overhaul for mobile usability.
- Table-heavy pages converted to mobile card/list layouts.

## Configuration Changes

- `.env.local`
  - `NEXT_PUBLIC_USE_MOCK_API=false`
  - `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080`

## Backend Added (JSON Mock API)

New folder:

- `capy-backend-json/`

Key files:

- `capy-backend-json/src/server.ts`
- `capy-backend-json/src/config.ts`
- `capy-backend-json/src/middleware/basic-auth.ts`
- `capy-backend-json/src/routes/operations.ts`
- `capy-backend-json/src/routes/finance.ts`
- `capy-backend-json/src/routes/health.ts`
- `capy-backend-json/src/db/data.json`
- `capy-backend-json/src/db/store.ts`
- `capy-backend-json/README.md`

Behavior:

- API base path: `/api/v1`
- Health endpoint: `/health`
- Basic auth required on `/api/v1/*`
- Default demo users:
  - `admin/admin`
  - `finance/finance`
  - `sitemanager/sitemanager`
  - `stores/stores`

## Frontend API/Integration Updates

- `src/lib/http/mock-api.ts`
  - Updated mock API routing behavior to keep frontend API shape consistent.
- Frontend auth-to-role mapping already matches:
  - `src/lib/auth/credential-role.ts`

## Responsive/Layout Overhaul

Core shell/navigation/mobile behavior:

- `src/components/layout/app-shell.tsx`
- `src/components/layout/sidebar.tsx`
- `src/components/layout/topbar.tsx`
- `src/globals.css`

Highlights:

- Mobile navigation drawer + backdrop behavior.
- Topbar and spacing adjusted for tablet/phone breakpoints.
- Shared mobile table replacement classes:
  - `.desktop-table`
  - `.mobile-list`
  - `.mobile-card*`
  - `.mobile-field*`

## Table-Heavy Screens Converted To Mobile Card/List Views

Operations and Finance (earlier conversion):

- `src/features/operations/assets/components/asset-table.tsx`
- `src/features/operations/projects/components/project-table.tsx`
- `src/features/operations/vendors/components/vendor-table.tsx`
- `src/features/operations/staff/components/staff-table.tsx`
- `src/features/operations/daily-logs/components/daily-log-table.tsx`
- `src/features/finance/cost-codes/components/cost-code-table.tsx`
- `src/app/(app)/finance/budgets/page.client.tsx`
- `src/app/(app)/finance/purchase-orders/page.client.tsx`
- `src/app/(app)/finance/invoices/page.client.tsx`
- `src/app/(app)/finance/grns/page.client.tsx`

Site Manager and Stores (remaining conversion completed):

- `src/app/(app)/operations/site-manager/projects/page.tsx`
- `src/app/(app)/operations/site-manager/projects/[id]/page.tsx`
- `src/app/(app)/operations/site-manager/timesheets/page.tsx`
- `src/app/(app)/stores/page.tsx`
- `src/app/(app)/stores/inventory/page.tsx`
- `src/app/(app)/stores/work-queue/page.tsx`
- `src/app/(app)/stores/reports/page.tsx`

## Validation Completed

Commands run successfully:

- `npx.cmd tsc --noEmit`
- `npm.cmd run lint`

## How To Run (Presentation Setup)

## Prerequisites

- Node.js 18+ (recommended)
- npm

## 1) Start backend (Terminal 1)

```powershell
cd capy-backend-json
npm install
npm run dev
```

If PowerShell script execution blocks `npm`, use:

```powershell
npm.cmd install
npm.cmd run dev
```

Backend should run on:

- `http://localhost:8080`
- Health check: `http://localhost:8080/health`

## 2) Start frontend (Terminal 2)

```powershell
npm install
npm run dev
```

If PowerShell script execution blocks `npm`, use:

```powershell
npm.cmd install
npm.cmd run dev
```

Frontend should run on:

- `http://localhost:3000`

## 3) Login credentials for demo

Use any of:

- `admin / admin`
- `finance / finance`
- `sitemanager / sitemanager`
- `stores / stores`

These credentials are used for:

- Frontend role resolution
- Backend basic-auth API access

## 4) Confirm backend mode is active

Ensure `.env.local` contains:

```env
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

If you need to temporarily fall back to frontend-only mock mode:

```env
NEXT_PUBLIC_USE_MOCK_API=true
```
