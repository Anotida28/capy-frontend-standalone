"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function InfoBanner({
  title,
  description,
  children,
  className
}: {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("info-banner", className)}>
      <div className="info-banner-icon" aria-hidden="true">i</div>
      <div className="info-banner-content">
        <p className="info-banner-title">{title}</p>
        {description ? <p className="muted">{description}</p> : null}
        {children ? <div className="info-banner-actions">{children}</div> : null}
      </div>
    </div>
  );
}
