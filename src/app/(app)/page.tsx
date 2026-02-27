"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/layout/page-shell";
import { SectionCard } from "@/components/layout/section-card";

const activityItems = [
  {
    id: "po-001",
    type: "po",
    title: "PO PO-12345 approved - Office Renovation",
    time: "Today",
  },
  {
    id: "inv-001",
    type: "invoice",
    title: "Invoice INV-2024-089 pending review",
    time: "Today",
  },
  {
    id: "project-office",
    type: "project",
    title: 'Project "Office Renovation" updated',
    time: "Yesterday",
  },
  {
    id: "asset-trk-220",
    type: "asset",
    title: "Asset TRK-220 moved to maintenance",
    time: "Yesterday",
  },
];

export default function DashboardPage() {
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
          <p className="card-title">Total Budget</p>
          <p className="metric">$4.15M</p>
          <p className="metric-caption">Seed portfolio allocation</p>
        </Card>
        <Card className="metric-card metric-card--projects">
          <div className="metric-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7h5l2 2h11v8a2 2 0 0 1-2 2H3z" />
              <path d="M3 7V5a2 2 0 0 1 2-2h4l2 2h8" />
            </svg>
          </div>
          <p className="card-title">Active Projects</p>
          <p className="metric">2</p>
          <p className="metric-caption">1 active • 1 pending</p>
          <p className="metric-caption">Based on seeded project data</p>
          <Link className="primary-button" href="/projects">
            View All Projects →
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
          <p className="card-title">Open POs</p>
          <p className="metric">1</p>
          <p className="metric-caption">PO-12345 • Approved</p>
          <p className="metric-caption">Sourced from seed finance data</p>
          <Link className="primary-button" href="/finance/purchase-orders">
            View Purchase Orders →
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
          <p className="metric">1</p>
          <p className="metric-caption">INV-2024-089 awaiting review</p>
          <p className="metric-caption">No paid invoices in current seed</p>
          <Link className="primary-button" href="/finance/invoices">
            Review Invoices →
          </Link>
        </Card>
      </div>

      <div className="grid-two">
        <SectionCard className="chart-card">
          <div className="section-header">
            <h2>Financial Trends</h2>
            <p className="muted">Monthly spend vs budget</p>
          </div>
          <div className="chart-placeholder" aria-hidden="true">
            <svg viewBox="0 0 600 220" preserveAspectRatio="none">
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6B46C1" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#6B46C1" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              <rect x="0" y="0" width="600" height="220" fill="none" />
              <path
                d="M0 170 L60 150 L120 160 L180 130 L240 140 L300 110 L360 120 L420 90 L480 105 L540 80 L600 95 L600 220 L0 220 Z"
                fill="url(#trendFill)"
              />
              <path
                d="M0 170 L60 150 L120 160 L180 130 L240 140 L300 110 L360 120 L420 90 L480 105 L540 80 L600 95"
                fill="none"
                stroke="#2D1B4E"
                strokeWidth="4"
              />
              {[
                [0, 170],
                [60, 150],
                [120, 160],
                [180, 130],
                [240, 140],
                [300, 110],
                [360, 120],
                [420, 90],
                [480, 105],
                [540, 80],
                [600, 95]
              ].map(([x, y]) => (
                <circle key={`${x}-${y}`} cx={x} cy={y} r="4" fill="#6B46C1" />
              ))}
              <path
                d="M0 190 L60 175 L120 180 L180 150 L240 160 L300 135 L360 145 L420 120 L480 130 L540 110 L600 120"
                fill="none"
                stroke="#6B46C1"
                strokeWidth="3"
                strokeDasharray="6 6"
              />
            </svg>
          </div>
          <div className="chart-legend">
            <span className="legend-item">
              <span className="legend-dot legend-dot--budget" />
              Budget
            </span>
            <span className="legend-item">
              <span className="legend-dot legend-dot--spend" />
              Spend
            </span>
          </div>
          <div className="chart-legend">
            <span className="chart-axis-label">$2.5M</span>
            <span className="chart-axis-label">$2.0M</span>
            <span className="chart-axis-label">$1.5M</span>
            <span className="chart-axis-label">$1.0M</span>
            <span className="chart-axis-label">$0.5M</span>
          </div>
          <div className="chart-legend">
            <span className="chart-axis-label">Jan</span>
            <span className="chart-axis-label">Feb</span>
            <span className="chart-axis-label">Mar</span>
            <span className="chart-axis-label">Apr</span>
            <span className="chart-axis-label">May</span>
            <span className="chart-axis-label">Jun</span>
            <span className="chart-axis-label">Jul</span>
            <span className="chart-axis-label">Aug</span>
            <span className="chart-axis-label">Sep</span>
            <span className="chart-axis-label">Oct</span>
            <span className="chart-axis-label">Nov</span>
            <span className="chart-axis-label">Dec</span>
          </div>
        </SectionCard>

        <SectionCard className="chart-card">
          <div className="section-header">
            <h2>Recent Activity</h2>
            <p className="muted">Latest updates across operations and finance</p>
          </div>
          <ul className="activity-feed">
            {activityItems.slice(0, 3).map((item) => (
              <li key={item.id} className="activity-item">
                <span
                  className={`activity-icon ${
                    item.type === "po"
                      ? "activity-icon--po"
                      : item.type === "invoice"
                      ? "activity-icon--invoice"
                      : item.type === "asset"
                      ? "activity-icon--asset"
                      : "activity-icon--project"
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
                  ) : item.type === "asset" ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2l8 4-8 4-8-4 8-4z" />
                      <path d="M4 6v8l8 4 8-4V6" />
                      <path d="M12 10v8" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 7h5l2 2h11v8a2 2 0 0 1-2 2H3z" />
                      <path d="M3 7V5a2 2 0 0 1 2-2h4l2 2h8" />
                    </svg>
                  )}
                </span>
                <div>
                  <p>{item.title}</p>
                  <p className="activity-meta">{item.time}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link className="primary-button activity-cta" href="/dashboard/activity">
            View All Activity →
          </Link>
        </SectionCard>
      </div>
    </PageShell>
  );
}
