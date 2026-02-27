"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function SectionCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("section-card", className)}>{children}</div>;
}
