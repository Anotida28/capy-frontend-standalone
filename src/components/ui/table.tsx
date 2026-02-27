"use client";

import { forwardRef } from "react";
import type { ReactNode, TableHTMLAttributes } from "react";

export function Table({ children }: { children: ReactNode }) {
  return <div className="table-wrapper">{children}</div>;
}

export const TableRoot = forwardRef<HTMLTableElement, TableHTMLAttributes<HTMLTableElement> & { children: ReactNode }>(
  function TableRoot({ children, ...props }, ref) {
    return (
      <table ref={ref} {...props}>
        {children}
      </table>
    );
  }
);
