"use client";

import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      {description ? <p className="muted">{description}</p> : null}
      {action ? <div className="empty-state-actions">{action}</div> : null}
    </div>
  );
}
