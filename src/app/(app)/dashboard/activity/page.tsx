"use client";

import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { SectionCard } from "@/components/layout/section-card";

const activityItems = [
  {
    id: "po-001",
    type: "po",
    title: "PO PO-12345 approved - Office Renovation",
    meta: "Approved by Alice Manager",
    time: "Today"
  },
  {
    id: "inv-001",
    type: "invoice",
    title: "Invoice INV-2024-089 pending review",
    meta: "Vendor: Buildforce Supplies",
    time: "Today"
  },
  {
    id: "grn-001",
    type: "grn",
    title: "GRN GRN-001 received",
    meta: "PO PO-12345 • 120 m3 accepted",
    time: "Yesterday"
  },
  {
    id: "project-office",
    type: "project",
    title: 'Project "Office Renovation" updated',
    meta: "Progress 42% • Stage: Execution",
    time: "Yesterday"
  },
  {
    id: "asset-trk-220",
    type: "asset",
    title: "Asset TRK-220 moved to maintenance",
    meta: "Tipper Truck • Bridge Expansion",
    time: "2 days ago"
  },
  {
    id: "timesheet-01",
    type: "timesheet",
    title: "Timesheet submitted - Kuda Worker",
    meta: "Project: Office Renovation • 8 hours",
    time: "2 days ago"
  }
];

export default function ActivityPage() {
  return (
    <PageShell>
      <PageHeader
        title="Activity"
        subtitle="Latest updates across operations and finance."
        actions={
          <Link className="secondary-button" href="/dashboard">
            Back to Dashboard
          </Link>
        }
      />

      <SectionCard className="chart-card">
        <div className="section-header">
          <h2>All Activity</h2>
          <p className="muted">Consolidated events across modules.</p>
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
                    : item.type === "project"
                    ? "activity-icon--project"
                    : item.type === "asset"
                    ? "activity-icon--asset"
                    : "activity-icon--invoice"
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
                ) : item.type === "project" ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 7h5l2 2h11v8a2 2 0 0 1-2 2H3z" />
                    <path d="M3 7V5a2 2 0 0 1 2-2h4l2 2h8" />
                  </svg>
                ) : item.type === "asset" ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l8 4-8 4-8-4 8-4z" />
                    <path d="M4 6v8l8 4 8-4V6" />
                    <path d="M12 10v8" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                )}
              </span>
              <div>
                <p>{item.title}</p>
                <p className="activity-meta">{item.meta}</p>
                <p className="activity-meta">{item.time}</p>
              </div>
            </li>
          ))}
        </ul>
      </SectionCard>
    </PageShell>
  );
}
