"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "secondary";
};

export function Button({ variant = "primary", className, ...props }: Props) {
  const baseClass =
    variant === "primary"
      ? "primary-button"
      : variant === "secondary"
      ? "secondary-button"
      : "ghost-button";
  return <button className={cn(baseClass, className)} {...props} />;
}
