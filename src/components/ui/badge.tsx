"use client";

import { cn } from "@/lib/utils/cn";

export function Badge({ label, tone }: { label: string; tone?: string }) {
  return <span className={cn("status-badge", tone ? `status-${tone}` : undefined)}>{label}</span>;
}
