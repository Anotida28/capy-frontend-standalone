"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function FormField({
  label,
  htmlFor,
  helper,
  error,
  className,
  children
}: {
  label?: string;
  htmlFor?: string;
  helper?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("form-field", className)}>
      {label ? (
        <label className="form-field-label" htmlFor={htmlFor}>
          {label}
        </label>
      ) : null}
      {children}
      {error ? <p className="form-field-error">{error}</p> : helper ? <p className="form-field-helper">{helper}</p> : null}
    </div>
  );
}
