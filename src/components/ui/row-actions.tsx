"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

export type RowAction = {
  label: string;
  onClick: () => void;
  tone?: "destructive";
  disabled?: boolean;
};

export function RowActions({ actions }: { actions: RowAction[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <div className="row-actions-menu" ref={ref}>
      <button type="button" className="row-actions-trigger" onClick={() => setOpen((prev) => !prev)}>
        ⋮
      </button>
      {open ? (
        <div className="row-actions-list">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              className={cn("row-actions-item", action.tone === "destructive" && "row-actions-destructive")}
              onClick={() => {
                setOpen(false);
                action.onClick();
              }}
              disabled={action.disabled}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
