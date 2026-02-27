"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function ContentContainer({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("content-container", className)}>{children}</div>;
}
