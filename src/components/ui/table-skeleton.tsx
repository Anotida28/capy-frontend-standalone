"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="surface-card">
      <div style={{ display: "grid", gap: "0.75rem" }}>
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} style={{ height: "1.25rem" }} />
        ))}
      </div>
    </div>
  );
}
