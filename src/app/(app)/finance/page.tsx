"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/layout/page-shell";
import { SectionCard } from "@/components/layout/section-card";
import { useBudgets } from "@/features/finance/budgets/hooks";
import { usePurchaseOrders } from "@/features/finance/purchase-orders/hooks";
import { useInvoices } from "@/features/finance/invoices/hooks";
import { useGrns } from "@/features/finance/grns/hooks";
import { useCostCodes } from "@/features/finance/cost-codes/hooks";
import { useThreeWayMatchReview } from "@/features/finance/three-way-match/hooks";
import { formatMoney } from "@/lib/utils/money";
import { formatDate } from "@/lib/utils/date";

type ActivityItem = {
  id: string;
  type: "po" | "invoice" | "grn";
  title: string;
  date: string | null;
};

export default function FinanceDashboardPage() {
  const budgetsQuery = useBudgets();
  const purchaseOrdersQuery = usePurchaseOrders();
  const invoicesQuery = useInvoices();
  const grnsQuery = useGrns();
  const costCodesQuery = useCostCodes();
  const reviewQuery = useThreeWayMatchReview();

  const budgets = useMemo(() => budgetsQuery.data ?? [], [budgetsQuery.data]);
  const purchaseOrders = useMemo(() => purchaseOrdersQuery.data ?? [], [purchaseOrdersQuery.data]);
  const invoices = useMemo(() => invoicesQuery.data ?? [], [invoicesQuery.data]);
  const grns = useMemo(() => grnsQuery.data ?? [], [grnsQuery.data]);
  const costCodes = useMemo(() => costCodesQuery.data ?? [], [costCodesQuery.data]);
  const reviewMatches = useMemo(() => reviewQuery.data ?? [], [reviewQuery.data]);

  const totalBudget = budgets.reduce((sum, item) => sum + (item.totalValue ?? 0), 0);
  const totalAllocated = budgets.reduce((sum, item) => sum + (item.totalAllocated ?? 0), 0);
  const totalCommitted = budgets.reduce((sum, item) => sum + (item.totalCommitted ?? 0), 0);
  const totalSpent = budgets.reduce((sum, item) => sum + (item.totalSpent ?? 0), 0);
  const unallocated = budgets.reduce((sum, item) => sum + (item.unallocatedAmount ?? 0), 0);

  const openPos = purchaseOrders.filter((po) => {
    const status = po.status ?? "DRAFT";
    return status !== "CANCELLED" && status !== "CLOSED";
  });

  const pendingInvoices = invoices.filter((inv) => {
    const status = inv.status ?? "PENDING";
    return ["PENDING", "DISPUTED", "PAYMENT_PROCESSING"].includes(status);
  });

  const overdueInvoices = invoices.filter((inv) => {
    if (!inv.dueDate) return false;
    const status = inv.status ?? "PENDING";
    if (["PAID", "CANCELLED"].includes(status)) return false;
    return new Date(inv.dueDate).getTime() < Date.now();
  });

  const totalRejectedItems = grns.reduce((sum, grn) => sum + (grn.totalRejectedQuantity ?? 0), 0);

  const activityItems = useMemo(() => {
    const items: ActivityItem[] = [];
    purchaseOrders.forEach((po, index) => {
      items.push({
        id: po.id ?? po.poNumber ?? `po-${po.orderDate ?? po.createdAt ?? index.toString()}`,
        type: "po",
        title: `${po.poNumber ?? "PO"} • ${po.status ?? "DRAFT"}`,
        date: po.orderDate ?? po.createdAt ?? null
      });
    });
    invoices.forEach((inv, index) => {
      items.push({
        id: inv.id ?? inv.invoiceNumber ?? `inv-${inv.invoiceDate ?? inv.createdAt ?? index.toString()}`,
        type: "invoice",
        title: `${inv.invoiceNumber} • ${inv.status ?? "PENDING"}`,
        date: inv.invoiceDate ?? inv.createdAt ?? null
      });
    });
    grns.forEach((grn, index) => {
      items.push({
        id: grn.id ?? grn.grnNumber ?? `grn-${grn.receivedDate ?? grn.createdAt ?? index.toString()}`,
        type: "grn",
        title: `${grn.grnNumber ?? "GRN"} received`,
        date: grn.receivedDate ?? grn.createdAt ?? null
      });
    });
    return items
      .sort((a, b) => {
        const left = a.date ? new Date(a.date).getTime() : 0;
        const right = b.date ? new Date(b.date).getTime() : 0;
        return right - left;
      })
      .slice(0, 3);
  }, [purchaseOrders, invoices, grns]);

  const utilizationPct = totalBudget > 0 ? Math.round(((totalCommitted + totalSpent) / totalBudget) * 100) : 0;

  return (
    <PageShell>
      <div className="card-grid">
        <Card className="metric-card metric-card--budget">
          <div className="metric-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1v22" />
              <path d="M17 5H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H7" />
            </svg>
          </div>
          <p className="card-title">Total Budgets</p>
          <p className="metric">{formatMoney(totalBudget)}</p>
          <p className="metric-caption">{budgets.length} active budgets</p>
          <Link className="primary-button" href="/finance/budgets">
            View Budgets →
          </Link>
        </Card>
        <Card className="metric-card metric-card--pos">
          <div className="metric-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="20" r="1" />
              <circle cx="17" cy="20" r="1" />
              <path d="M5 6h16l-2 7H7L5 6z" />
              <path d="M5 6L3 3H1" />
            </svg>
          </div>
          <p className="card-title">Open Purchase Orders</p>
          <p className="metric">{openPos.length}</p>
          <p className="metric-caption">{formatMoney(openPos.reduce((sum, po) => sum + (po.totalValue ?? 0), 0))}</p>
          <Link className="primary-button" href="/finance/purchase-orders">
            Review POs →
          </Link>
        </Card>
        <Card className="metric-card metric-card--invoices">
          <div className="metric-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h12l4 4v12a2 2 0 0 1-2 2H4z" />
              <path d="M14 4v4h4" />
              <path d="M8 14h8M8 10h4" />
            </svg>
          </div>
          <p className="card-title">Pending Invoices</p>
          <p className="metric">{pendingInvoices.length}</p>
          <p className="metric-caption">{overdueInvoices.length} overdue</p>
          <Link className="primary-button" href="/finance/invoices">
            Review Invoices →
          </Link>
        </Card>
        <Card className="metric-card metric-card--projects">
          <div className="metric-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="2" width="6" height="4" rx="1" />
              <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
              <path d="M9 14l2 2 4-4" />
            </svg>
          </div>
          <p className="card-title">GRNs Received</p>
          <p className="metric">{grns.length}</p>
          <p className="metric-caption">{totalRejectedItems} rejected items</p>
          <Link className="primary-button" href="/finance/grns">
            View GRNs →
          </Link>
        </Card>
      </div>

      <div className="grid-two">
        <SectionCard className="chart-card">
          <div className="section-header">
            <h2>Budget Utilization</h2>
            <p className="muted">Allocated vs committed and spent.</p>
          </div>
          <div className="chart-placeholder" aria-hidden="true">
            <svg viewBox="0 0 600 220" preserveAspectRatio="none">
              <defs>
                <linearGradient id="financeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16113f" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#16113f" stopOpacity="0.08" />
                </linearGradient>
              </defs>
              <rect x="0" y="0" width="600" height="220" fill="none" />
              <path
                d="M0 180 L100 150 L200 155 L300 130 L400 120 L500 95 L600 90 L600 220 L0 220 Z"
                fill="url(#financeFill)"
              />
              <path
                d="M0 180 L100 150 L200 155 L300 130 L400 120 L500 95 L600 90"
                fill="none"
                stroke="#16113f"
                strokeWidth="4"
              />
            </svg>
          </div>
          <div className="form-grid">
            <div>
              <p className="muted">Total Allocated</p>
              <p className="table-title">{formatMoney(totalAllocated)}</p>
            </div>
            <div>
              <p className="muted">Total Committed</p>
              <p className="table-title">{formatMoney(totalCommitted)}</p>
            </div>
            <div>
              <p className="muted">Total Spent</p>
              <p className="table-title">{formatMoney(totalSpent)}</p>
            </div>
            <div>
              <p className="muted">Unallocated</p>
              <p className="table-title">{formatMoney(unallocated)}</p>
            </div>
            <div>
              <p className="muted">Utilization</p>
              <p className="table-title">{utilizationPct}%</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard className="chart-card">
          <div className="section-header">
            <h2>Recent Finance Activity</h2>
            <p className="muted">Latest transactions across procurement.</p>
          </div>
          <ul className="activity-feed">
            {activityItems.map((item) => (
              <li key={item.id} className="activity-item">
                <span
                  className={`activity-icon ${
                    item.type === "po"
                      ? "activity-icon--po"
                      : item.type === "invoice"
                      ? "activity-icon--invoice"
                      : "activity-icon--asset"
                  }`}
                  aria-hidden="true"
                >
                  {item.type === "po" ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="9" cy="20" r="1" />
                      <circle cx="17" cy="20" r="1" />
                      <path d="M5 6h16l-2 7H7L5 6z" />
                      <path d="M5 6L3 3H1" />
                    </svg>
                  ) : item.type === "invoice" ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h12l4 4v12a2 2 0 0 1-2 2H4z" />
                      <path d="M14 4v4h4" />
                      <path d="M8 14h8M8 10h4" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="2" width="6" height="4" rx="1" />
                      <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
                      <path d="M9 14l2 2 4-4" />
                    </svg>
                  )}
                </span>
                <div>
                  <p>{item.title}</p>
                  <p className="activity-meta">{formatDate(item.date)}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link className="primary-button activity-cta" href="/finance/purchase-orders">
            View Finance Activity →
          </Link>
        </SectionCard>
      </div>

      <div className="grid-two">
        <SectionCard>
          <div className="section-header">
            <h2>Catalog & Controls</h2>
            <p className="muted">Reference data and compliance checks.</p>
          </div>
          <div className="form-grid">
            <div>
              <p className="muted">Cost Codes</p>
              <p className="table-title">{costCodes.length}</p>
            </div>
            <div>
              <p className="muted">3-Way Match Reviews</p>
              <p className="table-title">{reviewMatches.length}</p>
            </div>
            <div>
              <p className="muted">Budgets Pending Approval</p>
              <p className="table-title">{budgets.filter((item) => item.status === "DRAFT").length}</p>
            </div>
            <div>
              <p className="muted">POs Awaiting Approval</p>
              <p className="table-title">{purchaseOrders.filter((po) => po.status === "PENDING_APPROVAL").length}</p>
            </div>
          </div>
          <div className="toolbar">
            <Link className="secondary-button" href="/finance/cost-codes">
              Manage Cost Codes
            </Link>
            <Link className="secondary-button" href="/finance/three-way-match">
              Review Matches
            </Link>
          </div>
        </SectionCard>

        <SectionCard>
          <div className="section-header">
            <h2>Upcoming Payments</h2>
            <p className="muted">Invoices due soon or overdue.</p>
          </div>
          {overdueInvoices.length === 0 ? (
            <p className="muted">No overdue invoices at the moment.</p>
          ) : (
            <ul className="activity-feed">
              {overdueInvoices.slice(0, 3).map((inv) => (
                <li key={inv.id ?? inv.invoiceNumber} className="activity-item">
                  <span className="activity-icon activity-icon--invoice" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h12l4 4v12a2 2 0 0 1-2 2H4z" />
                      <path d="M14 4v4h4" />
                      <path d="M8 14h8M8 10h4" />
                    </svg>
                  </span>
                  <div>
                    <p>{inv.invoiceNumber}</p>
                    <p className="activity-meta">Due {formatDate(inv.dueDate)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link className="primary-button activity-cta" href="/finance/invoices">
            Manage Payments →
          </Link>
        </SectionCard>
      </div>
    </PageShell>
  );
}
