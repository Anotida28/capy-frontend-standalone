"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function Toolbar({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("toolbar", className)}>{children}</div>;
}
