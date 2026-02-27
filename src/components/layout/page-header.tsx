"use client";

import type { ReactNode } from "react";

export default function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="page-header">
      <div className="page-header-copy">
        <h1>{title}</h1>
        {subtitle ? <p className="muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="page-header-actions">{actions}</div> : null}
    </div>
  );
}
