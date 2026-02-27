"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("page-shell", className)}>{children}</div>;
}
