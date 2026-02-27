export type StatusTone =
  | "active"
  | "inactive"
  | "planning"
  | "on_hold"
  | "completed"
  | "pending"
  | "approved"
  | "rejected";

const STATUS_TONE_MAP: Record<string, StatusTone> = {
  ACTIVE: "active",
  IN_PROGRESS: "active",
  APPROVED: "approved",
  MATCHED: "approved",
  LOCKED: "approved",
  PENDING: "pending",
  PENDING_APPROVAL: "pending",
  DRAFT: "pending",
  PLANNING: "planning",
  SCHEDULED: "planning",
  UPCOMING: "planning",
  ON_HOLD: "on_hold",
  PARTIALLY_RECEIVED: "on_hold",
  PAYMENT_PROCESSING: "on_hold",
  DISPUTED: "on_hold",
  UNDER_REPAIR: "on_hold",
  AUTO_CLOCKED_OUT: "on_hold",
  ESCALATED_TO_FINANCE: "on_hold",
  ORDERED_BY_FINANCE: "on_hold",
  CANCELLED: "inactive",
  ARCHIVED: "inactive",
  DECOMMISSIONED: "inactive",
  ENDED: "inactive",
  REJECTED: "rejected",
  CLOSED: "completed",
  COMPLETED: "completed",
  FULLY_RECEIVED: "completed",
  PAID: "completed",
  ALLOCATED_FROM_STORES: "approved",
  RECEIVED_IN_STORES: "approved",
  DISPATCHED_TO_PROJECT: "completed",
  RETURNED: "completed"
};

export function getStatusTone(status?: string | null): StatusTone {
  if (!status) return "pending";
  const normalized = status.trim().replace(/[\s-]+/g, "_").toUpperCase();
  return STATUS_TONE_MAP[normalized] ?? "pending";
}
