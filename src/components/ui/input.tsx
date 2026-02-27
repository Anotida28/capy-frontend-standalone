"use client";

import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("input", className)} {...props} />;
}
